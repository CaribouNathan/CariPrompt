import { PAUSE_THRESHOLD, type TakeAnalysis } from '../shared/types';
import { createTap } from './pcmTap';
import { encodeWav } from './wav';

/**
 * Enregistrement du micro et analyse du signal, sans reconnaissance vocale.
 *
 * Le débit est estimé à partir des attaques syllabiques : on suit l'énergie
 * du signal sur une fenêtre courte et on compte les montées franches au-dessus
 * d'un seuil adaptatif. En français comme en anglais, une syllabe correspond
 * en moyenne à ~1,5 syllabe par mot ; le rapport sert à convertir en mots/min.
 * C'est une approximation, pas une mesure : elle suffit à dire « trop vite »
 * ou « trop lent », pas à compter les mots réellement prononcés.
 */

const SYLLABLES_PER_WORD = 1.55;
/** Deux attaques ne peuvent pas être plus proches que cela */
const MIN_ONSET_GAP = 0.11;
/** Constante de montée / descente du plancher de bruit */
const FLOOR_RISE = 0.0006;
const FLOOR_FALL = 0.02;

export interface LiveStats {
  /** Niveau instantané 0–1, pour le vu-mètre */
  level: number;
  /** true tant que la voix est détectée */
  speaking: boolean;
  /** Débit estimé sur les 8 dernières secondes, en mots/min */
  speechRate: number;
  /** Durée du silence en cours, en secondes */
  silenceFor: number;
  /** Durée totale écoulée, en secondes */
  elapsed: number;
}

export interface RecorderHandle {
  stop(): Promise<{ blob: Blob; analysis: TakeAnalysis; duration: number }>;
  cancel(): void;
  /** Vrai tant que la capture tourne */
  readonly active: boolean;
}

export interface RecorderOptions {
  deviceId?: string;
  /** Appelé à chaque analyse, environ 30 fois par seconde */
  onStats(stats: LiveStats): void;
  /** Débit visé, en mots/min, pour calculer l'écart */
  targetRate(): number;
}

export async function listMicrophones(): Promise<Array<{ id: string; label: string }>> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter((d) => d.kind === 'audioinput')
    .map((d, i) => ({ id: d.deviceId, label: d.label || `Micro ${i + 1}` }));
}

export async function startRecording(opts: RecorderOptions): Promise<RecorderHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: opts.deviceId ? { exact: opts.deviceId } : undefined,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });

  const ctx = new AudioContext();
  if (ctx.state === 'suspended') await ctx.resume();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.1;
  source.connect(analyser);
  const buf = new Float32Array(analyser.fftSize);

  // Capture PCM brute : le WAV est écrit à l'arrêt, à partir de ces blocs
  const tap = await createTap(ctx, source);
  const sampleRate = ctx.sampleRate;

  const t0 = performance.now();
  let floor = 0.01;
  let speaking = false;
  let lastOnset = -1;
  let prevEnergy = 0;
  let silenceStart = 0;
  let totalSilence = 0;
  let speakingTime = 0;
  let lastFrame = t0;
  /** Fenêtre glissante, pour le débit instantané */
  const onsets: number[] = [];
  /** Toutes les attaques de la prise, pour l'analyse finale */
  const allOnsets: number[] = [];
  /** Débit relevé seconde par seconde, pour l'irrégularité */
  const rateSamples: number[] = [];
  const driftSamples: number[] = [];
  let lastSampleAt = t0;
  let raf = 0;
  let stopped = false;

  const frame = () => {
    if (stopped) return;
    raf = requestAnimationFrame(frame);
    const now = performance.now();
    const elapsed = (now - t0) / 1000;
    const dt = (now - lastFrame) / 1000;
    lastFrame = now;

    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const energy = Math.sqrt(sum / buf.length);

    // Plancher de bruit : monte lentement, redescend vite
    floor = energy < floor
      ? floor + (energy - floor) * FLOOR_FALL
      : floor + (energy - floor) * FLOOR_RISE;

    const gate = Math.max(floor * 2.2, 0.008);
    const nowSpeaking = energy > gate;

    if (nowSpeaking) {
      speakingTime += dt;
      if (!speaking) silenceStart = 0;
      // Attaque syllabique : franchissement montant du seuil, espacé dans le temps
      if (prevEnergy <= gate && (lastOnset < 0 || elapsed - lastOnset >= MIN_ONSET_GAP)) {
        onsets.push(elapsed);
        allOnsets.push(elapsed);
        lastOnset = elapsed;
      }
    } else {
      if (speaking) silenceStart = elapsed;
      if (silenceStart > 0) totalSilence += dt;
    }
    speaking = nowSpeaking;
    prevEnergy = energy;

    // Débit sur une fenêtre glissante de 8 s
    const windowStart = Math.max(0, elapsed - 8);
    while (onsets.length && onsets[0] < windowStart) onsets.shift();
    const windowLen = Math.max(elapsed - windowStart, 0.5);
    const speechRate = (onsets.length / SYLLABLES_PER_WORD) / windowLen * 60;

    if (now - lastSampleAt >= 1000) {
      lastSampleAt = now;
      if (speakingTime > 1) {
        rateSamples.push(speechRate);
        const target = opts.targetRate();
        if (target > 0) driftSamples.push((speechRate - target) / target * 100);
      }
    }

    opts.onStats({
      level: Math.min(energy * 6, 1),
      speaking: nowSpeaking,
      speechRate,
      silenceFor: nowSpeaking || silenceStart === 0 ? 0 : elapsed - silenceStart,
      elapsed,
    });
  };

  raf = requestAnimationFrame(frame);
  let running = true;

  const teardown = () => {
    stopped = true;
    running = false;
    cancelAnimationFrame(raf);
    stream.getTracks().forEach((t) => t.stop());
    ctx.close().catch(() => undefined);
  };

  return {
    get active() { return running; },

    cancel() {
      tap.flush().catch(() => undefined).finally(teardown);
    },

    async stop() {
      const wall = (performance.now() - t0) / 1000;
      await tap.flush().catch(() => undefined);
      const chunks = tap.chunks;
      teardown();

      // La durée réelle est celle du signal capté, pas celle de l'horloge
      let frames = 0;
      for (const c of chunks) frames += c.length;
      const duration = frames > 0 ? frames / sampleRate : wall;

      const mean = rateSamples.length
        ? rateSamples.reduce((a, b) => a + b, 0) / rateSamples.length
        : 0;
      const variance = rateSamples.length > 1
        ? rateSamples.reduce((a, r) => a + (r - mean) ** 2, 0) / (rateSamples.length - 1)
        : 0;
      const drift = driftSamples.length
        ? driftSamples.reduce((a, b) => a + b, 0) / driftSamples.length
        : 0;
      const analysis: TakeAnalysis = {
        speechRate: Math.round(mean),
        pauses: countPauses(onsetGaps(allOnsets)),
        silence: Math.round(totalSilence * 10) / 10,
        speaking: duration > 0 ? Math.min(speakingTime / duration, 1) : 0,
        drift: Math.round(drift),
        irregularity: mean > 0 ? Math.round(Math.sqrt(variance) / mean * 100) : 0,
      };
      return { blob: encodeWav(chunks, sampleRate), analysis, duration };
    },
  };
}

function onsetGaps(onsets: number[]): number[] {
  const gaps: number[] = [];
  for (let i = 1; i < onsets.length; i++) gaps.push(onsets[i] - onsets[i - 1]);
  return gaps;
}

const countPauses = (gaps: number[]) => gaps.filter((g) => g > PAUSE_THRESHOLD).length;
