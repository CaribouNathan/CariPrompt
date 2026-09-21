import { tokenize, type Token } from './speechAnalysis';

/**
 * Alignement en direct de la parole sur le texte, pour le suivi vocal.
 *
 * À chaque hypothèse de Whisper (les dernières secondes transcrites), on
 * cherche dans le texte, autour de la position courante, l'endroit où la fin
 * de l'hypothèse s'aligne le mieux : alignement local de Smith-Waterman, mot
 * à mot, avec une ressemblance approchée pour les mots mal reconnus. Revenir
 * en arrière coûte plus cher qu'avancer, et un grand saut exige une
 * correspondance forte : c'est ce qui rend le suivi stable.
 */

/** Nombre de mots de l'hypothèse pris en compte, en partant de la fin */
const HYP_WORDS = 12;
/** Fenêtre de recherche autour de la position courante, en mots */
const BACK = 20;
const AHEAD = 90;
const GAP = -0.5;
const MISMATCH = -0.6;
const LEAD = 1;

export interface AlignResult {
  /** Indice du dernier mot prononcé */
  word: number;
  score: number;
  /** Mots sautés d'un coup (0 si progression normale) */
  skipped: number;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/** Ressemblance de deux mots normalisés : 1 identiques, 0,7 proches, négatif sinon */
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const len = Math.max(a.length, b.length);
  if (len >= 4 && 1 - levenshtein(a, b) / len >= 0.7) return 0.7;
  // « l », « d », « j »… élisions que Whisper colle ou décolle
  if ((a.length <= 2 || b.length <= 2) && (a.startsWith(b) || b.startsWith(a))) return 0.3;
  return MISMATCH;
}

export class LiveAligner {
  readonly tokens: Token[];
  /** Dernier mot confirmé ; -1 avant le premier */
  pos = -1;
  /** Débit du lecteur, en mots par seconde, lissé */
  rate = 2.3;
  private lastAt = 0;
  private lastWord = -1;

  constructor(script: string) {
    this.tokens = tokenize(script, true);
  }

  /** Repositionne le suivi, par exemple sur le mot au niveau de la ligne de lecture */
  reset(word: number): void {
    this.pos = Math.max(-1, Math.min(this.tokens.length - 1, word));
    this.lastWord = -1;
    this.lastAt = 0;
  }

  update(text: string, audioEnd: number): AlignResult | null {
    const hyp = tokenize(text).map((t) => t.norm).slice(-HYP_WORDS);
    if (hyp.length < 2 || !this.tokens.length) return null;

    const lo = Math.max(0, this.pos - BACK);
    const hi = Math.min(this.tokens.length, this.pos + 1 + AHEAD);
    const win = this.tokens.slice(lo, hi).map((t) => t.norm);
    const H = hyp.length;
    const W = win.length;

    // Smith-Waterman : M[i][k] = meilleur alignement finissant sur hyp[i-1] et win[k-1]
    const M: Float32Array[] = Array.from({ length: H + 1 }, () => new Float32Array(W + 1));
    const hits: Uint8Array[] = Array.from({ length: H + 1 }, () => new Uint8Array(W + 1));
    for (let i = 1; i <= H; i++) {
      for (let k = 1; k <= W; k++) {
        const s = similarity(hyp[i - 1], win[k - 1]);
        const diag = M[i - 1][k - 1] + s;
        const up = M[i - 1][k] + GAP;
        const left = M[i][k - 1] + GAP;
        let best = 0;
        let h = 0;
        if (diag > best) { best = diag; h = hits[i - 1][k - 1] + (s > 0 ? 1 : 0); }
        if (up > best) { best = up; h = hits[i - 1][k]; }
        if (left > best) { best = left; h = hits[i][k - 1]; }
        M[i][k] = best;
        hits[i][k] = h;
      }
    }

    // La fin de l'hypothèse doit participer : les 2 derniers mots peuvent être du bruit
    let bestScore = -Infinity;
    let bestWord = -1;
    let bestHits = 0;
    for (let i = H; i >= Math.max(1, H - 2); i--) {
      const trailing = H - i;
      for (let k = 1; k <= W; k++) {
        const raw = M[i][k];
        if (raw <= 0) continue;
        const word = lo + k - 1 + trailing;
        // Pénalités de distance : avancer loin, et surtout reculer
        const expected = this.pos + 1;
        const ahead = word - expected;
        let score = raw - 0.35 * trailing;
        if (this.pos >= 0) {
          if (ahead > 12) score -= 0.02 * (ahead - 12);
          if (ahead < -2) score -= 0.08 * (-2 - ahead);
        }
        if (score > bestScore) {
          bestScore = score;
          bestWord = Math.min(word, this.tokens.length - 1);
          bestHits = hits[i][k];
        }
      }
    }

    // Seuils : au moins deux mots justes, et une preuve forte pour un grand saut
    if (bestWord < 0 || bestHits < 2 || bestScore < 1.6) return null;
    const jump = bestWord - this.pos;
    if (this.pos >= 0 && (jump > 30 || jump < -6) && (bestScore < 3.5 || bestHits < 4)) return null;

    const skipped = this.pos >= 0 && jump > 10 ? jump - Math.round(this.rate * 1.5) : 0;
    // On ne recule que sur preuve nette : le lecteur reprend une phrase
    if (jump < 0 && jump > -3) return { word: this.pos, score: bestScore, skipped: 0 };

    // Débit : mots confirmés rapportés au temps de parole écoulé entre deux hypothèses
    if (this.lastAt && audioEnd > this.lastAt && bestWord > this.lastWord && jump <= 15) {
      const dt = (audioEnd - this.lastAt) / 1000;
      if (dt > 0.2 && dt < 4) {
        const inst = Math.min(6, Math.max(0.5, (bestWord - this.lastWord) / dt));
        this.rate += (inst - this.rate) * 0.3;
      }
    }
    this.lastAt = audioEnd;
    this.lastWord = bestWord;
    this.pos = bestWord;
    return { word: bestWord, score: bestScore, skipped: Math.max(0, skipped) };
  }

  /**
   * Position estimée maintenant, en mots (fractionnaire) : la dernière position
   * confirmée, prolongée au rythme du lecteur pendant la latence de Whisper.
   */
  predict(now: number, speaking: boolean): number {
    if (this.pos < 0) return -1;
    if (!speaking || !this.lastAt) return this.pos;
    // Whisper ne rend jamais le mot en cours de prononciation : un mot d'avance le compense
    const lag = Math.min(2.5, Math.max(0, (now - this.lastAt) / 1000));
    return Math.min(this.tokens.length - 1, this.pos + LEAD + this.rate * lag);
  }

  /** Position dans le texte (caractères) d'une position fractionnaire en mots */
  charAt(word: number): number {
    if (!this.tokens.length) return 0;
    const w = Math.max(0, Math.min(this.tokens.length - 1, word));
    const a = this.tokens[Math.floor(w)];
    const b = this.tokens[Math.min(this.tokens.length - 1, Math.floor(w) + 1)];
    return a.start + (b.start - a.start) * (w - Math.floor(w));
  }
}
