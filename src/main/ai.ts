import { app, net, safeStorage } from 'electron';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  AiErrorCode, AiKeyStatus, AiModel, AiProvider, AiRunResult, AiTask,
} from '../shared/types';

/**
 * Fonctions de texte par IA : traduction et adaptation à l'oral.
 *
 * Tout se passe ici, dans le processus principal : la clé API n'est jamais
 * transmise à l'interface, et les requêtes partent par `net.fetch`, qui suit
 * le proxy du système. Rien n'est envoyé sans une action explicite.
 */

// MARK: - Clés

type StoredKey = { enc?: string; plain?: string };
type KeyStore = Partial<Record<AiProvider, StoredKey>>;

const keysFile = () => path.join(app.getPath('userData'), 'ai-keys.json');

async function readStore(): Promise<KeyStore> {
  try {
    const raw = JSON.parse(await readFile(keysFile(), 'utf8')) as KeyStore;
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

async function writeStore(store: KeyStore): Promise<void> {
  await mkdir(path.dirname(keysFile()), { recursive: true });
  const tmp = `${keysFile()}.tmp`;
  await writeFile(tmp, JSON.stringify(store), { encoding: 'utf8', mode: 0o600 });
  await rename(tmp, keysFile());
}

const canEncrypt = () => {
  try {
    return safeStorage.isEncryptionAvailable();
  } catch {
    return false;
  }
};

export async function setKey(provider: AiProvider, key: string): Promise<void> {
  const store = await readStore();
  const clean = key.trim();
  if (!clean) delete store[provider];
  else if (canEncrypt()) store[provider] = { enc: safeStorage.encryptString(clean).toString('base64') };
  else store[provider] = { plain: clean };
  await writeStore(store);
}

async function getKey(provider: AiProvider): Promise<string | null> {
  const entry = (await readStore())[provider];
  if (!entry) return null;
  if (entry.enc) {
    // Échoue si le trousseau refuse l'accès : la clé est alors considérée absente
    try {
      return safeStorage.decryptString(Buffer.from(entry.enc, 'base64'));
    } catch {
      return null;
    }
  }
  return entry.plain ?? null;
}

export async function keyStatus(): Promise<AiKeyStatus> {
  const store = await readStore();
  return { anthropic: !!store.anthropic, openai: !!store.openai, encrypted: canEncrypt() };
}

// MARK: - HTTP

class AiError extends Error {
  constructor(public code: AiErrorCode, detail = '') {
    super(detail || code);
  }
}

const RETRYABLE: AiErrorCode[] = ['rateLimit', 'overloaded', 'network'];

async function request(
  url: string,
  init: { method: 'GET' | 'POST'; headers: Record<string, string>; body?: unknown },
  signal: AbortSignal,
): Promise<{ json: any; retryAfter: number }> {
  let res: Response;
  try {
    res = await net.fetch(url, {
      method: init.method,
      headers: { 'content-type': 'application/json', ...init.headers },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal,
    });
  } catch (e) {
    if (signal.aborted) throw new AiError('cancelled');
    throw new AiError('network', (e as Error).message);
  }
  const text = await res.text().catch(() => '');
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* corps non JSON : on garde le texte pour le message */
  }
  const retryAfter = Number(res.headers.get('retry-after')) || 0;
  if (!res.ok) {
    const msg = String(json?.error?.message ?? text).slice(0, 300);
    if (isNoCredit(res.status, json, msg)) throw new AiError('noCredit', msg);
    if (res.status === 401 || res.status === 403) throw new AiError('badKey', msg);
    if (res.status === 429) throw Object.assign(new AiError('rateLimit', msg), { retryAfter });
    if (res.status === 529 || res.status >= 500) throw Object.assign(new AiError('overloaded', msg), { retryAfter });
    throw new AiError('unknown', `${res.status} — ${msg}`);
  }
  return { json, retryAfter };
}

/**
 * Compte sans crédit. Anthropic répond 400 (« credit balance is too low ») ou
 * 402 / billing_error ; OpenAI répond 429 avec le code insufficient_quota —
 * à distinguer d'une vraie limite de débit, qu'on relance.
 */
function isNoCredit(status: number, json: any, msg: string): boolean {
  const code = String(json?.error?.code ?? '');
  const type = String(json?.error?.type ?? '');
  return status === 402
    || type === 'billing_error'
    || code === 'insufficient_quota'
    || type === 'insufficient_quota'
    || /credit balance is too low|exceeded your current quota|billing details/i.test(msg);
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new AiError('cancelled'));
    }, { once: true });
  });

/** Relance les erreurs passagères : 2 s, 5 s, 12 s, ou le délai demandé par le serveur */
async function withRetry<T>(fn: () => Promise<T>, signal: AbortSignal): Promise<T> {
  const delays = [2000, 5000, 12000];
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      const err = e as AiError & { retryAfter?: number };
      if (!(err instanceof AiError) || !RETRYABLE.includes(err.code) || attempt >= delays.length) throw e;
      await sleep(Math.max(delays[attempt], (err.retryAfter ?? 0) * 1000), signal);
    }
  }
}

// MARK: - Modèles

const OPENAI_EXCLUDE = /(audio|realtime|tts|transcribe|image|search|embedding|instruct|moderation|dall|whisper|codex|computer)/;

export async function listModels(provider: AiProvider): Promise<AiModel[]> {
  const key = await getKey(provider);
  if (!key) throw new AiError('noKey');
  const signal = new AbortController().signal;
  if (provider === 'anthropic') {
    const { json } = await request('https://api.anthropic.com/v1/models?limit=100', {
      method: 'GET',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    }, signal);
    return (json?.data ?? []).map((m: { id: string; display_name?: string }) => ({
      id: m.id,
      label: m.display_name ?? m.id,
    }));
  }
  const { json } = await request('https://api.openai.com/v1/models', {
    method: 'GET',
    headers: { authorization: `Bearer ${key}` },
  }, signal);
  return (json?.data ?? [])
    .map((m: { id: string }) => m.id)
    .filter((id: string) => /^(gpt|o\d|chatgpt)/.test(id) && !OPENAI_EXCLUDE.test(id))
    .sort((a: string, b: string) => b.localeCompare(a, 'en', { numeric: true }))
    .map((id: string) => ({ id, label: id }));
}

// MARK: - Éléments protégés

/**
 * URL, e-mails, variables et indications entre crochets sont remplacés par
 * des jetons ⟦n⟧ avant l'envoi, puis restaurés : leur conservation ne dépend
 * pas de la bonne volonté du modèle.
 */
const PROTECTED = new RegExp([
  String.raw`https?:\/\/[^\s<>"'«»]+`,
  String.raw`www\.[^\s<>"'«»]+`,
  String.raw`[\w.+-]+@[\w-]+(?:\.[\w-]+)+`,
  String.raw`\{\{[^{}\n]*\}\}`,
  String.raw`\{[^{}\s][^{}\n]*\}`,
  String.raw`\[\[[^\]\n]*\]\]`,
  String.raw`\[[^\]\n]*\]`,
  String.raw`<[^<>\n]+>`,
  String.raw`%[sd@]`,
  String.raw`\$[A-Z_][A-Z0-9_]*`,
].join('|'), 'g');

const TOKEN = /⟦(\d+)⟧/g;

function mask(text: string, table: string[]): string {
  return text.replace(PROTECTED, (m) => {
    // La ponctuation finale appartient à la phrase, pas à l'URL
    const trail = /[.,;:!?)]+$/.exec(m)?.[0] ?? '';
    const core = trail ? m.slice(0, -trail.length) : m;
    table.push(core);
    return `⟦${table.length}⟧${trail}`;
  });
}

const unmask = (text: string, table: string[]) =>
  text.replace(TOKEN, (_m, n: string) => table[Number(n) - 1] ?? '');

const tokensOf = (text: string) => [...text.matchAll(TOKEN)].map((m) => m[1]);
const digitsOf = (text: string) => (text.match(/\d+/g) ?? []).sort();

/** Vrai si chaque élément de `need` figure dans `have` (multiensemble) */
function contains(have: string[], need: string[]): boolean {
  const pool = new Map<string, number>();
  for (const x of have) pool.set(x, (pool.get(x) ?? 0) + 1);
  for (const x of need) {
    const n = pool.get(x) ?? 0;
    if (n === 0) return false;
    pool.set(x, n - 1);
  }
  return true;
}

// MARK: - Consignes

const languageName = (code: string) => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
};

const FORMAT = `The input is a JSON object {"paragraphs": [...]}. Return a JSON object {"paragraphs": [...]} with exactly one entry per input paragraph, in the same order.`;

function systemPrompt(task: AiTask): string {
  if (task.kind === 'translate') {
    const lang = languageName(task.target);
    return [
      `You translate scripts that a presenter will read aloud on camera from a teleprompter. Translate each paragraph into ${lang}.`,
      `- Write natural spoken ${lang}, the way a native presenter would say it on camera. Adapt idioms and sentence structure for the ear rather than translating word for word. Keep the meaning, the tone, the register and roughly the same length.`,
      `- Never translate or alter names of people and places, brand, company and product names, or numbers and figures. Keep figures as digits; only their decimal and thousands separators may follow ${lang} conventions.`,
      `- Tokens written like ⟦12⟧ stand for URLs, variables or shooting directions. Keep each one exactly once, unchanged, in the translation of its paragraph.`,
      `- Keep words wrapped in **double asterisks** wrapped the same way, and keep " / " breathing marks where they still fall naturally.`,
      `- Output only the translation: no notes, comments or alternatives.`,
      `${FORMAT} Each entry is an array holding the translated paragraph as a single string.`,
    ].join('\n');
  }
  return [
    `You turn written text into a script that a presenter will read aloud on camera from a teleprompter. Write each paragraph in the same language as its input.`,
    `- Keep every piece of information: every fact, every number and figure (as digits, unchanged), every name, brand and product, and every call to action. Add nothing and drop nothing.`,
    `- Make it easy to say: short sentences that fit in one breath, one idea per sentence, active voice, concrete words. Remove what only works in writing — parentheses, abbreviations nobody says aloud, "i.e.", "cf.", bullet-style fragments — and turn lists into spoken sentences.`,
    `- Mark a short breathing pause inside a sentence with " / ". Start a new paragraph for a longer pause or a new idea, and keep paragraphs to two or three sentences.`,
    `- Wrap the one or two words the presenter should stress in each paragraph in **double asterisks**, and keep existing **…** markers.`,
    `- Tokens written like ⟦12⟧ stand for URLs, variables or shooting directions. Keep each one exactly once, unchanged, in the output for its paragraph.`,
    `- Output only the script: no notes, comments or stage directions of your own.`,
    `${FORMAT} Each entry is an array of one or more short paragraphs.`,
  ].join('\n');
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['paragraphs'],
  properties: {
    paragraphs: { type: 'array', items: { type: 'array', items: { type: 'string' } } },
  },
};

// MARK: - Appel d'un lot

const MAX_OUTPUT = 32000;

async function callAnthropic(
  key: string, model: string, system: string, input: string[], signal: AbortSignal, structured: boolean,
): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    max_tokens: MAX_OUTPUT,
    system,
    messages: [{ role: 'user', content: JSON.stringify({ paragraphs: input }) }],
  };
  if (structured) body.output_config = { format: { type: 'json_schema', schema: SCHEMA } };
  const { json } = await request('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body,
  }, signal);
  if (json?.stop_reason === 'max_tokens') throw new AiError('tooLong');
  if (json?.stop_reason === 'refusal') throw new AiError('refused');
  return (json?.content ?? [])
    .filter((b: { type: string }) => b.type === 'text')
    .map((b: { text: string }) => b.text)
    .join('');
}

async function callOpenAI(
  key: string, model: string, system: string, input: string[], signal: AbortSignal, structured: boolean,
): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    instructions: system,
    input: JSON.stringify({ paragraphs: input }),
    max_output_tokens: MAX_OUTPUT,
  };
  if (structured) body.text = { format: { type: 'json_schema', name: 'script', schema: SCHEMA, strict: true } };
  const { json } = await request('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}` },
    body,
  }, signal);
  if (json?.status === 'incomplete' && json?.incomplete_details?.reason === 'max_output_tokens') {
    throw new AiError('tooLong');
  }
  let out = '';
  for (const item of json?.output ?? []) {
    if (item.type !== 'message') continue;
    for (const c of item.content ?? []) {
      if (c.type === 'refusal') throw new AiError('refused');
      if (c.type === 'output_text') out += c.text;
    }
  }
  return out || String(json?.output_text ?? '');
}

/** Lit la réponse, y compris entourée de ```json … ``` si le format imposé n'a pas pris */
function parseOutput(raw: string, expected: number): string[][] | null {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let obj: unknown;
  try {
    obj = JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      obj = JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
  const list = (obj as { paragraphs?: unknown })?.paragraphs;
  if (!Array.isArray(list) || list.length !== expected) return null;
  const out: string[][] = [];
  for (const entry of list) {
    const items = (Array.isArray(entry) ? entry : [entry])
      .filter((x): x is string => typeof x === 'string')
      .map((x) => x.trim())
      .filter(Boolean);
    if (items.length === 0) return null;
    out.push(items);
  }
  return out;
}

// MARK: - Tâches

const jobs = new Map<string, AbortController>();

export function cancelJob(jobId: string): void {
  jobs.get(jobId)?.abort();
}

/** Lots d'au plus ~1 200 mots et 40 paragraphes : réponses courtes, relances bon marché */
function batches(paragraphs: string[]): number[][] {
  const out: number[][] = [];
  let cur: number[] = [];
  let words = 0;
  paragraphs.forEach((p, i) => {
    const w = p.split(/\s+/).filter(Boolean).length;
    if (cur.length && (words + w > 1200 || cur.length >= 40)) {
      out.push(cur);
      cur = [];
      words = 0;
    }
    cur.push(i);
    words += w;
  });
  if (cur.length) out.push(cur);
  return out;
}

export async function runJob(
  jobId: string,
  provider: AiProvider,
  model: string,
  task: AiTask,
  paragraphs: string[],
  onProgress: (done: number, total: number) => void,
): Promise<AiRunResult> {
  const key = await getKey(provider);
  if (!key) return { ok: false, error: 'noKey' };

  const ctrl = new AbortController();
  jobs.set(jobId, ctrl);
  const signal = ctrl.signal;
  const system = systemPrompt(task);
  const table: string[] = [];
  const masked = paragraphs.map((p) => mask(p, table));
  const result: string[][] = new Array(paragraphs.length);
  let structured = true;
  let done = 0;
  onProgress(0, paragraphs.length);

  const call = (input: string[]) => {
    const fn = provider === 'anthropic' ? callAnthropic : callOpenAI;
    return withRetry(async () => {
      try {
        return await fn(key, model, system, input, signal, structured);
      } catch (e) {
        // Un modèle qui refuse le format imposé : on repasse en texte libre
        const err = e as AiError;
        if (structured && err.code === 'unknown' && /output_config|json_schema|text\.format|format/i.test(err.message)) {
          structured = false;
          return fn(key, model, system, input, signal, false);
        }
        throw e;
      }
    }, signal);
  };

  /** Traite un lot ; en cas de réponse inutilisable, le coupe en deux et recommence */
  const processBatch = async (indices: number[], retried = false): Promise<void> => {
    const input = indices.map((i) => masked[i]);
    const parsed = parseOutput(await call(input), input.length);
    if (parsed) {
      parsed.forEach((items, k) => { result[indices[k]] = items; });
      done += indices.length;
      onProgress(done, paragraphs.length);
      return;
    }
    if (!retried) return processBatch(indices, true);
    if (indices.length === 1) throw new AiError('badOutput');
    const mid = Math.ceil(indices.length / 2);
    await processBatch(indices.slice(0, mid));
    await processBatch(indices.slice(mid));
  };

  try {
    const queue = batches(masked);
    // Trois lots en parallèle : assez pour un long script, sans provoquer de limite de débit.
    // La première erreur arrête les autres lots ; chaque lot absorbe la sienne pour
    // qu'aucune promesse ne soit rejetée sans être attendue.
    let failure: unknown = null;
    const workers = Array.from({ length: Math.min(3, queue.length) }, async () => {
      try {
        for (let b = queue.shift(); b && !signal.aborted; b = queue.shift()) await processBatch(b);
      } catch (e) {
        if (!failure) failure = e;
        ctrl.abort();
      }
    });
    await Promise.all(workers);
    if (failure) throw failure;
    if (signal.aborted) throw new AiError('cancelled');

    // Contrôle : jetons et chiffres de chaque paragraphe doivent se retrouver dans sa sortie
    const warnings: number[] = [];
    result.forEach((items, i) => {
      const joined = items.join(' ');
      const tokensOk = contains(tokensOf(joined), tokensOf(masked[i]));
      const digitsOk = contains(digitsOf(unmask(joined, table)), digitsOf(unmask(masked[i], table)));
      if (!tokensOk || !digitsOk) warnings.push(i);
    });
    return {
      ok: true,
      paragraphs: result.map((items) => items.map((x) => unmask(x, table))),
      warnings,
    };
  } catch (e) {
    ctrl.abort();
    const err = e instanceof AiError ? e : new AiError(signal.aborted ? 'cancelled' : 'unknown', (e as Error).message);
    return { ok: false, error: err.code, detail: err.message === err.code ? '' : err.message };
  } finally {
    jobs.delete(jobId);
  }
}

export function aiErrorCode(e: unknown): AiErrorCode {
  return e instanceof AiError ? e.code : 'unknown';
}
export function aiErrorDetail(e: unknown): string {
  return e instanceof AiError && e.message !== e.code ? e.message : '';
}
