/**
 * Transcription locale : lecture du WAV, rééchantillonnage à 16 kHz,
 * découpe par détection d'activité vocale (Silero), puis Whisper fenêtre par
 * fenêtre. Whisper ne traite que 30 s à la fois ; le VAD fournit des fenêtres
 * plus courtes et, au passage, les pauses réelles dont le coach a besoin.
 *
 * Ce module ne dépend pas d'Electron : il reçoit le module sherpa-onnx en
 * paramètre, ce qui permet de l'éprouver sous Node seul.
 */

export interface SttSegment { start: number; end: number; text: string }

export interface EngineResult {
  duration: number;
  /** Plages de parole détectées par le VAD, en secondes */
  speech: Array<[number, number]>;
  segments: SttSegment[];
}

export interface Pcm { samples: Float32Array; sampleRate: number }

// MARK: - WAV

/** Lit un WAV PCM 16/24/32 bits ou flottant 32 bits, mixé en mono */
export function readWav(buf: Uint8Array): Pcm {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const tag = (o: number) => String.fromCharCode(buf[o], buf[o + 1], buf[o + 2], buf[o + 3]);
  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new Error('not a WAV file');

  let fmt = { format: 1, channels: 1, rate: 16000, bits: 16 };
  let dataOff = -1;
  let dataLen = 0;
  for (let off = 12; off + 8 <= buf.length;) {
    const id = tag(off);
    const len = view.getUint32(off + 4, true);
    if (id === 'fmt ') {
      fmt = {
        format: view.getUint16(off + 8, true),
        channels: view.getUint16(off + 10, true),
        rate: view.getUint32(off + 12, true),
        bits: view.getUint16(off + 22, true),
      };
      // WAVE_FORMAT_EXTENSIBLE : le vrai format est dans le sous-type
      if (fmt.format === 0xfffe && len >= 26) fmt.format = view.getUint16(off + 32, true);
    } else if (id === 'data') {
      dataOff = off + 8;
      dataLen = Math.min(len, buf.length - dataOff);
      break;
    }
    off += 8 + len + (len & 1);
  }
  if (dataOff < 0) throw new Error('WAV without data chunk');

  const bytes = fmt.bits / 8;
  const frames = Math.floor(dataLen / (bytes * fmt.channels));
  const out = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let sum = 0;
    for (let c = 0; c < fmt.channels; c++) {
      const p = dataOff + (i * fmt.channels + c) * bytes;
      let v: number;
      if (fmt.format === 3 && fmt.bits === 32) v = view.getFloat32(p, true);
      else if (fmt.bits === 16) v = view.getInt16(p, true) / 32768;
      else if (fmt.bits === 24) v = ((buf[p] | (buf[p + 1] << 8) | (buf[p + 2] << 16)) << 8 >> 8) / 8388608;
      else if (fmt.bits === 32) v = view.getInt32(p, true) / 2147483648;
      else v = (buf[p] - 128) / 128;
      sum += v;
    }
    out[i] = sum / fmt.channels;
  }
  return { samples: out, sampleRate: fmt.rate };
}

// MARK: - Rééchantillonnage

/**
 * Passage à 16 kHz : filtre passe-bas en sinus cardinal fenêtré (coupure à
 * 7,2 kHz, sous la fréquence de Nyquist), puis interpolation. Suffisant pour la
 * parole, et sans repliement audible pour Whisper.
 */
export function resampleTo16k(pcm: Pcm): Float32Array {
  const target = 16000;
  if (pcm.sampleRate === target) return pcm.samples;
  const ratio = pcm.sampleRate / target;
  const n = Math.floor(pcm.samples.length / ratio);
  const out = new Float32Array(n);
  const half = 16;
  const cutoff = Math.min(1, 1 / ratio) * 0.9;
  const src = pcm.samples;
  for (let i = 0; i < n; i++) {
    const center = i * ratio;
    const base = Math.floor(center);
    let acc = 0;
    let norm = 0;
    for (let k = -half * Math.ceil(ratio); k <= half * Math.ceil(ratio); k++) {
      const j = base + k;
      if (j < 0 || j >= src.length) continue;
      const x = (j - center) * cutoff;
      const sinc = x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);
      const w = 0.5 + 0.5 * Math.cos((Math.PI * (j - center)) / (half * Math.ceil(ratio) + 1));
      const h = sinc * w;
      acc += src[j] * h;
      norm += h;
    }
    out[i] = norm ? acc / norm : 0;
  }
  return out;
}

// MARK: - Fenêtres

const SR = 16000;
/** Une fenêtre Whisper ne dépasse pas cette durée (limite dure du modèle : 30 s) */
const WINDOW_MAX = 24;

export interface SherpaLike {
  Vad: new (config: unknown, bufferSeconds: number) => {
    acceptWaveform(s: Float32Array): void;
    isEmpty(): boolean;
    front(external?: boolean): { samples: Float32Array; start: number };
    pop(): void;
    flush(): void;
  };
}

export function detectSpeech(sherpa: SherpaLike, vadModel: string, samples: Float32Array): Array<[number, number]> {
  const vad = new sherpa.Vad({
    sileroVad: {
      model: vadModel,
      threshold: 0.45,
      minSilenceDuration: 0.3,
      minSpeechDuration: 0.2,
      maxSpeechDuration: 20,
      windowSize: 512,
    },
    sampleRate: SR,
    numThreads: 1,
    debug: 0,
  }, 30);

  const spans: Array<[number, number]> = [];
  const drain = () => {
    while (!vad.isEmpty()) {
      const seg = vad.front(false);
      spans.push([seg.start / SR, (seg.start + seg.samples.length) / SR]);
      vad.pop();
    }
  };
  for (let i = 0; i + 512 <= samples.length; i += 512) {
    vad.acceptWaveform(samples.subarray(i, i + 512));
    drain();
  }
  vad.flush();
  drain();
  return spans;
}

/** Regroupe les plages de parole en fenêtres de 24 s au plus, avec un peu de marge */
export function windowsFrom(speech: Array<[number, number]>, duration: number): Array<[number, number]> {
  const pad = 0.25;
  const out: Array<[number, number]> = [];
  for (const [s, e] of speech) {
    const start = Math.max(0, s - pad);
    const end = Math.min(duration, e + pad);
    const last = out[out.length - 1];
    if (last && end - last[0] <= WINDOW_MAX && start - last[1] < 2) last[1] = end;
    else out.push([start, end]);
  }
  return out;
}

// MARK: - Nettoyage

/**
 * Phrases que Whisper produit sur du silence ou du bruit, héritées des
 * sous-titres de son corpus d'apprentissage.
 */
const HALLUCINATIONS = [
  /sous-titr(es|age) (réalisés?|par)/i,
  /amara\.org/i,
  /merci d'avoir regardé/i,
  /thanks? for watching/i,
  /subtitles? by/i,
  /untertitel (im auftrag|der amara)/i,
  /sottotitoli (creati|a cura)/i,
  /subtítulos (realizados|por)/i,
];

export function cleanText(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t || HALLUCINATIONS.some((r) => r.test(t))) return '';
  // Répétition en boucle d'une même courte séquence : signe d'hallucination
  if (/(\b.{2,30}?\b)(?:\s*\1){4,}/i.test(t)) return '';
  return t;
}

// MARK: - Transcription

export interface RecognizerLike {
  createStream(): { acceptWaveform(o: { samples: Float32Array; sampleRate: number }): void };
  decodeAsync(stream: unknown): Promise<unknown>;
  getResult(stream: unknown): {
    text: string;
    segment_timestamps?: number[];
    segment_durations?: number[];
    segment_texts?: string[];
  };
}

export async function transcribe(
  sherpa: SherpaLike,
  recognizer: RecognizerLike,
  vadModel: string,
  wav: Uint8Array,
  onProgress: (done: number, total: number) => void,
  isCancelled: () => boolean,
): Promise<EngineResult> {
  const samples = resampleTo16k(readWav(wav));
  const duration = samples.length / SR;
  const speech = detectSpeech(sherpa, vadModel, samples);
  const windows = windowsFrom(speech, duration);
  const segments: SttSegment[] = [];
  onProgress(0, windows.length);

  for (let w = 0; w < windows.length; w++) {
    if (isCancelled()) throw new Error('cancelled');
    const [ws, we] = windows[w];
    const stream = recognizer.createStream();
    stream.acceptWaveform({ samples: samples.slice(Math.floor(ws * SR), Math.ceil(we * SR)), sampleRate: SR });
    await recognizer.decodeAsync(stream);
    const r = recognizer.getResult(stream);

    const texts = r.segment_texts ?? [];
    if (texts.length && r.segment_timestamps?.length === texts.length) {
      texts.forEach((txt, k) => {
        const text = cleanText(txt);
        if (!text) return;
        const start = ws + (r.segment_timestamps?.[k] ?? 0);
        const len = r.segment_durations?.[k] ?? 0;
        segments.push({ start, end: Math.min(we, start + len), text });
      });
    } else {
      const text = cleanText(r.text);
      if (text) segments.push({ start: ws, end: we, text });
    }
    onProgress(w + 1, windows.length);
  }

  return { duration, speech, segments: snapToSpeech(segments, speech) };
}

/**
 * Les bornes de Whisper sont approximatives (pas de 20 ms, souvent décalées
 * vers le silence) : on les recale sur la parole détectée par le VAD.
 */
function snapToSpeech(segments: SttSegment[], speech: Array<[number, number]>): SttSegment[] {
  if (!speech.length) return segments;
  return segments.map((seg) => {
    const inside = speech.filter(([s, e]) => e > seg.start && s < seg.end);
    if (!inside.length) return seg;
    const start = Math.max(seg.start, inside[0][0]);
    const end = Math.min(seg.end, inside[inside.length - 1][1]);
    return end - start >= 0.3 ? { ...seg, start, end } : seg;
  });
}
