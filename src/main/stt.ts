import { app, net } from 'electron';
import { spawn } from 'node:child_process';
import { createReadStream, createWriteStream, existsSync, statSync } from 'node:fs';
import { mkdir, open, readFile, rename, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import type { SttErrorCode, SttModelId, SttModelInfo, Transcript } from '../shared/types';
import { transcribe as runEngine, type RecognizerLike, type SherpaLike } from './sttEngine';
import { LiveRecognizer, type Hypothesis } from './liveStt';

/**
 * Transcription locale avec Whisper (sherpa-onnx, modèles int8).
 *
 * Les modèles sont téléchargés une fois depuis les publications GitHub de
 * sherpa-onnx, puis tout se fait hors ligne. Seuls les trois fichiers utiles
 * de l'archive sont conservés.
 */

const RELEASES = 'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models';

export const STT_CATALOG: Record<SttModelId, { downloadMB: number; diskMB: number; featureDim: number }> = {
  turbo: { downloadMB: 538, diskMB: 1036, featureDim: 128 },
  small: { downloadMB: 610, diskMB: 375, featureDim: 80 },
  base: { downloadMB: 198, diskMB: 160, featureDim: 80 },
};

const root = () => path.join(app.getPath('userData'), 'stt');
const modelDir = (id: SttModelId) => path.join(root(), id);
const modelFiles = (id: SttModelId) => [`${id}-encoder.int8.onnx`, `${id}-decoder.int8.onnx`, `${id}-tokens.txt`];
const archiveMember = (id: SttModelId, f: string) => `sherpa-onnx-whisper-${id}/${f}`;

export class SttError extends Error {
  constructor(public code: SttErrorCode, detail = '') {
    super(detail || code);
  }
}

export function sttErrorCode(e: unknown): SttErrorCode {
  return e instanceof SttError ? e.code : 'unknown';
}
export function sttErrorDetail(e: unknown): string {
  return e instanceof SttError ? (e.message === e.code ? '' : e.message) : (e as Error)?.message ?? '';
}

export function listModels(): SttModelInfo[] {
  return (Object.keys(STT_CATALOG) as SttModelId[]).map((id) => ({
    id,
    ...STT_CATALOG[id],
    installed: modelFiles(id).every((f) => existsSync(path.join(modelDir(id), f))),
  }));
}

// MARK: - Moteur

type Sherpa = SherpaLike & {
  OfflineRecognizer: { createAsync(config: unknown): Promise<RecognizerLike & { setConfig(c: unknown): void }> };
};

let sherpa: Sherpa | null = null;

/** Chargé à la première utilisation : le démarrage de l'application n'en dépend pas */
function engine(): Sherpa {
  if (sherpa) return sherpa;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    sherpa = require('sherpa-onnx-node') as Sherpa;
    return sherpa;
  } catch (e) {
    throw new SttError('engineUnavailable', (e as Error).message);
  }
}

/** Le VAD Silero est livré avec l'application ; la bibliothèque native veut un vrai fichier */
async function vadModel(): Promise<string> {
  const target = path.join(root(), 'silero_vad.onnx');
  if (!existsSync(target)) {
    await mkdir(root(), { recursive: true });
    await writeFile(target, await readFile(path.join(__dirname, 'silero_vad.onnx')));
  }
  return target;
}

let loaded: { id: SttModelId; language: string; rec: RecognizerLike & { setConfig(c: unknown): void } } | null = null;

function recognizerConfig(id: SttModelId, language: string) {
  const dir = modelDir(id);
  const [encoder, decoder, tokens] = modelFiles(id).map((f) => path.join(dir, f));
  return {
    featConfig: { sampleRate: 16000, featureDim: STT_CATALOG[id].featureDim },
    modelConfig: {
      whisper: { encoder, decoder, language, task: 'transcribe', enableSegmentTimestamps: 1 },
      tokens,
      // On laisse deux cœurs à l'interface
      numThreads: Math.max(1, Math.min(8, os.cpus().length - 2)),
      provider: 'cpu',
      debug: 0,
    },
  };
}

async function recognizer(id: SttModelId, language: string) {
  if (!listModels().find((m) => m.id === id)?.installed) throw new SttError('noModel');
  if (loaded?.id === id) {
    if (loaded.language !== language) {
      loaded.rec.setConfig(recognizerConfig(id, language));
      loaded.language = language;
    }
    return loaded.rec;
  }
  loaded = null;
  const rec = await engine().OfflineRecognizer.createAsync(recognizerConfig(id, language));
  loaded = { id, language, rec };
  return rec;
}

// MARK: - Transcription

let queue: Promise<unknown> = Promise.resolve();
const cancelled = new Set<string>();

export function cancelTranscription(jobId: string): void {
  cancelled.add(jobId);
}

/** Une seule transcription à la fois : Whisper occupe déjà tous les cœurs utiles */
export function transcribeFile(
  jobId: string,
  file: string,
  model: SttModelId,
  language: string,
  onProgress: (done: number, total: number) => void,
): Promise<Transcript> {
  const job = queue.then(async () => {
    if (cancelled.has(jobId)) throw new SttError('cancelled');
    let wav: Buffer;
    try {
      wav = await readFile(file);
    } catch (e) {
      throw new SttError('badAudio', (e as Error).message);
    }
    const rec = await recognizer(model, language);
    const vad = await vadModel();
    try {
      const r = await runEngine(engine(), rec, vad, wav, onProgress, () => cancelled.has(jobId));
      return { model, language, ...r, createdAt: new Date().toISOString() } satisfies Transcript;
    } catch (e) {
      if (cancelled.has(jobId)) throw new SttError('cancelled');
      if (/WAV/.test((e as Error).message)) throw new SttError('badAudio', (e as Error).message);
      throw e;
    }
  });
  const settle = job.finally(() => cancelled.delete(jobId));
  queue = settle.catch(() => undefined);
  return settle;
}

// MARK: - Téléchargement

let download: { id: SttModelId; ctrl: AbortController } | null = null;

export function cancelDownload(): void {
  download?.ctrl.abort();
}

export async function downloadModel(
  id: SttModelId,
  onProgress: (phase: 'download' | 'extract', done: number, total: number) => void,
): Promise<void> {
  if (download) throw new SttError('unknown', 'download already running');
  const ctrl = new AbortController();
  download = { id, ctrl };
  await mkdir(root(), { recursive: true });
  const archive = path.join(root(), `${id}.tar.bz2.part`);
  const staging = path.join(root(), `${id}.extract`);

  try {
    // 1. Téléchargement, par la pile réseau de Chromium (proxy système compris)
    let res: Response;
    try {
      res = await net.fetch(`${RELEASES}/sherpa-onnx-whisper-${id}.tar.bz2`, { signal: ctrl.signal });
    } catch (e) {
      throw new SttError(ctrl.signal.aborted ? 'cancelled' : 'network', (e as Error).message);
    }
    if (!res.ok || !res.body) throw new SttError('network', `HTTP ${res.status}`);
    const total = Number(res.headers.get('content-length')) || STT_CATALOG[id].downloadMB * 1048576;
    const out = createWriteStream(archive);
    let done = 0;
    let lastReport = 0;
    const reader = res.body.getReader();
    try {
      for (;;) {
        const { done: end, value } = await reader.read();
        if (end) break;
        done += value.length;
        if (!out.write(value)) await new Promise((r) => out.once('drain', r));
        if (done - lastReport > 2 * 1048576) {
          lastReport = done;
          onProgress('download', done, total);
        }
      }
    } catch (e) {
      out.destroy();
      throw new SttError(ctrl.signal.aborted ? 'cancelled' : 'network', (e as Error).message);
    }
    await new Promise<void>((resolve, reject) => out.end((err?: Error | null) => (err ? reject(err) : resolve())));
    onProgress('download', total, total);

    // Une page d'erreur de proxy ou un transfert tronqué ne doit pas partir en décompression
    if (res.headers.get('content-length') && done < total) throw new SttError('network', `incomplete (${done}/${total})`);
    const head = Buffer.alloc(3);
    const fh = await open(archive, 'r');
    await fh.read(head, 0, 3, 0);
    await fh.close();
    if (head.toString('latin1') !== 'BZh') throw new SttError('network', 'unexpected response (not a model archive)');

    // 2. Extraction des seuls fichiers int8 et du vocabulaire
    onProgress('extract', 0, 1);
    await rm(staging, { recursive: true, force: true });
    await mkdir(staging, { recursive: true });
    const members = modelFiles(id).map((f) => archiveMember(id, f));
    try {
      await extractWithTar(archive, staging, members, ctrl.signal, (d, t) => onProgress('extract', d, t));
    } catch (e) {
      if (ctrl.signal.aborted) throw new SttError('cancelled');
      // Pas de tar utilisable (certains Windows) : extraction en JavaScript, dans un thread à part
      await extractInWorker(archive, staging, members, ctrl.signal, (d, t) => onProgress('extract', d, t));
    }
    for (const f of modelFiles(id)) {
      if (!existsSync(path.join(staging, archiveMember(id, f)))) throw new SttError('extract', `missing ${f}`);
    }
    await rm(modelDir(id), { recursive: true, force: true });
    await mkdir(modelDir(id), { recursive: true });
    for (const f of modelFiles(id)) await rename(path.join(staging, archiveMember(id, f)), path.join(modelDir(id), f));
    onProgress('extract', 1, 1);
  } catch (e) {
    if (e instanceof SttError) throw e;
    throw new SttError(ctrl.signal.aborted ? 'cancelled' : 'extract', (e as Error).message);
  } finally {
    download = null;
    await rm(archive, { force: true }).catch(() => undefined);
    await rm(staging, { recursive: true, force: true }).catch(() => undefined);
  }
}

/**
 * Extraction par le tar du système (bsdtar sur macOS et Windows, GNU tar sur
 * Linux). L'archive lui est passée par l'entrée standard : compter les octets
 * envoyés donne une vraie progression de la décompression.
 */
function extractWithTar(
  archive: string, dest: string, members: string[], signal: AbortSignal,
  onProgress: (done: number, total: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('tar', ['-xjf', '-', '-C', dest, ...members], { stdio: ['pipe', 'ignore', 'pipe'] });
    const total = statSync(archive).size;
    let sent = 0;
    let last = 0;
    let err = '';
    const input = createReadStream(archive);
    input.on('data', (c) => {
      sent += c.length;
      if (sent - last > 4 * 1048576) {
        last = sent;
        onProgress(sent, total);
      }
    });
    input.on('error', (e) => child.kill() && reject(e));
    // tar peut se fermer avant la fin du flux : ce n'est pas une erreur en soi
    child.stdin.on('error', () => undefined);
    input.pipe(child.stdin);
    child.stderr.on('data', (c) => { err += String(c); });
    const abort = () => { input.destroy(); child.kill(); };
    signal.addEventListener('abort', abort, { once: true });
    child.on('error', (e) => { input.destroy(); reject(e); });
    child.on('close', (code) => {
      signal.removeEventListener('abort', abort);
      if (code === 0) resolve();
      else reject(new Error(err.trim() || `tar exited with ${code}`));
    });
  });
}

function extractInWorker(
  archive: string, dest: string, members: string[], signal: AbortSignal,
  onProgress: (done: number, total: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Dans l'application empaquetée, le script du thread est hors de l'archive asar
    const unpacked = path.join(__dirname.replace(/app\.asar(?=[\\/]|$)/, 'app.asar.unpacked'), 'sttExtract.js');
    const script = existsSync(unpacked) ? unpacked : path.join(__dirname, 'sttExtract.js');
    const worker = new Worker(script, { workerData: { archive, dest, members } });
    const abort = () => { worker.terminate().catch(() => undefined); reject(new SttError('cancelled')); };
    signal.addEventListener('abort', abort, { once: true });
    worker.on('message', (m: { done: number; total: number } | { ok: true } | { error: string }) => {
      if ('done' in m) onProgress(m.done, m.total);
      else if ('ok' in m) resolve();
      else reject(new SttError('extract', m.error));
    });
    worker.on('error', (e: Error) => reject(new SttError('extract', e.message)));
    worker.on('exit', () => signal.removeEventListener('abort', abort));
  });
}

export async function deleteModel(id: SttModelId): Promise<void> {
  if (loaded?.id === id) loaded = null;
  await rm(modelDir(id), { recursive: true, force: true });
}

// MARK: - Suivi vocal

let live: { rec: LiveRecognizer; model: SttModelId; language: string } | null = null;

/** Modèle du suivi vocal : le plus léger installé, pour la latence la plus faible */
export function trackingModel(): SttModelId | null {
  const installed = listModels().filter((m) => m.installed).map((m) => m.id);
  return (['base', 'small', 'turbo'] as SttModelId[]).find((id) => installed.includes(id)) ?? null;
}

export async function startLive(
  language: string,
  onHypothesis: (h: Hypothesis) => void,
  onSpeech: (speaking: boolean, at: number) => void,
): Promise<SttModelId> {
  stopLive();
  const model = trackingModel();
  if (!model) throw new SttError('noModel');
  // Un moteur à part : une transcription de prise peut tourner en même temps
  const recognizer = await engine().OfflineRecognizer.createAsync(recognizerConfig(model, language));
  const vad = await vadModel();
  live = {
    model,
    language,
    rec: new LiveRecognizer({ sherpa: engine(), recognizer, vadModel: vad, onHypothesis, onSpeech }),
  };
  return model;
}

export function pushLive(samples: Float32Array, capturedAt: number): void {
  live?.rec.push(samples, capturedAt);
}

export function stopLive(): void {
  live?.rec.stop();
  live = null;
}
