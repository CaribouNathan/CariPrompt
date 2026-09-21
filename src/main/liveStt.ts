import { cleanText, type RecognizerLike, type SherpaLike } from './sttEngine';

/**
 * Reconnaissance en continu pour le suivi vocal.
 *
 * Whisper ne transcrit pas en flux : on le relance, dès qu'il est libre et
 * qu'au moins 250 ms de parole nouvelle sont arrivées, sur les dernières
 * secondes de l'énoncé en cours. La détection d'activité vocale décide quand
 * décoder — jamais sur du silence, où Whisper invente volontiers du texte.
 *
 * Indépendant d'Electron : les horloges et le moteur sont injectés, ce qui
 * permet de le faire tourner en accéléré sous Node pour les tests.
 */

const SR = 16000;
const RING_SECONDS = 10;
/** Fenêtre de décodage : assez pour que Whisper ait du contexte, assez courte pour rester rapide */
const WINDOW_SECONDS = 6;
const MIN_NEW_AUDIO = 0.25 * SR;
const MIN_WINDOW = 0.8 * SR;
/** Au-delà de ce silence, l'énoncé suivant repart d'une fenêtre neuve */
const UTTERANCE_GAP = 0.6 * SR;

export interface Hypothesis {
  text: string;
  /** Heure murale (ms) de la fin de l'audio décodé */
  audioEnd: number;
  decodeMs: number;
}

export interface LiveOptions {
  sherpa: SherpaLike;
  recognizer: RecognizerLike;
  vadModel: string;
  onHypothesis(h: Hypothesis): void;
  onSpeech(speaking: boolean, at: number): void;
  now?: () => number;
}

export class LiveRecognizer {
  private ring = new Float32Array(RING_SECONDS * SR);
  /** Nombre total d'échantillons reçus depuis le début */
  private total = 0;
  private endWall = 0;
  private vad: ReturnType<typeof createVad>;
  private vadBuf = new Float32Array(512);
  private vadFill = 0;
  private speaking = false;
  private lastSpeech = -Infinity;
  private utteranceStart = 0;
  private lastDecodedEnd = 0;
  private busy = false;
  private stopped = false;

  constructor(private o: LiveOptions) {
    this.vad = createVad(o.sherpa, o.vadModel);
  }

  /** Ajoute un bloc à 16 kHz ; `capturedAt` est l'heure murale de sa fin */
  push(samples: Float32Array, capturedAt: number): void {
    if (this.stopped) return;
    for (let i = 0; i < samples.length; i++) {
      this.ring[(this.total + i) % this.ring.length] = samples[i];
    }
    this.total += samples.length;
    this.endWall = capturedAt;

    // Détection d'activité vocale, par trames de 512 échantillons (32 ms)
    let off = 0;
    while (off < samples.length) {
      const n = Math.min(512 - this.vadFill, samples.length - off);
      this.vadBuf.set(samples.subarray(off, off + n), this.vadFill);
      this.vadFill += n;
      off += n;
      if (this.vadFill === 512) {
        this.vad.acceptWaveform(this.vadBuf);
        this.vadFill = 0;
        const frameEnd = this.total - (samples.length - off);
        const detected = this.vad.isDetected();
        if (detected) {
          if (frameEnd - this.lastSpeech > UTTERANCE_GAP) this.utteranceStart = Math.max(0, frameEnd - 0.5 * SR);
          this.lastSpeech = frameEnd;
        }
        if (detected !== this.speaking) {
          this.speaking = detected;
          this.o.onSpeech(detected, this.wallAt(frameEnd));
        }
        // Les segments complets ne servent pas ici : on vide la file du VAD
        while (!this.vad.isEmpty()) this.vad.pop();
      }
    }
    this.maybeDecode();
  }

  stop(): void {
    this.stopped = true;
  }

  private wallAt(sample: number): number {
    return this.endWall - ((this.total - sample) / SR) * 1000;
  }

  private maybeDecode(): void {
    if (this.busy || this.stopped) return;
    // On décode tant que la parole est récente : la fin de phrase a besoin d'un dernier passage
    if (this.total - this.lastSpeech > 0.4 * SR) return;
    if (this.total - this.lastDecodedEnd < MIN_NEW_AUDIO) return;
    const end = this.total;
    const start = Math.max(end - WINDOW_SECONDS * SR, this.utteranceStart, end - this.ring.length + SR);
    if (end - start < MIN_WINDOW) return;

    const win = new Float32Array(end - start);
    for (let i = 0; i < win.length; i++) win[i] = this.ring[(start + i) % this.ring.length];
    const audioEnd = this.wallAt(end);
    this.lastDecodedEnd = end;
    this.busy = true;
    const t0 = (this.o.now ?? Date.now)();

    const stream = this.o.recognizer.createStream();
    stream.acceptWaveform({ samples: win, sampleRate: SR });
    this.o.recognizer.decodeAsync(stream).then(() => {
      if (this.stopped) return;
      const text = cleanText(this.o.recognizer.getResult(stream).text);
      if (text) this.o.onHypothesis({ text, audioEnd, decodeMs: (this.o.now ?? Date.now)() - t0 });
    }).catch(() => undefined).finally(() => {
      this.busy = false;
      // L'audio arrivé pendant le décodage est peut-être déjà suffisant
      this.maybeDecode();
    });
  }
}

function createVad(sherpa: SherpaLike, model: string) {
  const Vad = sherpa.Vad as unknown as new (c: unknown, b: number) => {
    acceptWaveform(s: Float32Array): void;
    isDetected(): boolean;
    isEmpty(): boolean;
    pop(): void;
  };
  return new Vad({
    sileroVad: { model, threshold: 0.45, minSilenceDuration: 0.25, minSpeechDuration: 0.1, windowSize: 512, maxSpeechDuration: 30 },
    sampleRate: SR,
    numThreads: 1,
    debug: 0,
  }, 30);
}
