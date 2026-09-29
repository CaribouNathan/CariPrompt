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
/** Fenêtre de recherche autour de la position courante, en mots.
 *  Large en arrière : enregistrer une voix off, c'est reprendre des phrases. */
const BACK = 48;
const AHEAD = 90;
const GAP = -0.5;
const MISMATCH = -0.6;
/** Un mot d'avance : Whisper ne rend jamais le mot en cours de prononciation */
const LEAD = 1;
/** Avance maximale tolérée devant le dernier mot confirmé */
const MAX_LEAD = 8;
/** Recul minimal, en mots, pour voir une reprise plutôt qu'une hésitation de la reconnaissance */
const REPEAT = 6;

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
          // Reculer coûte, mais une reprise franche — plusieurs mots justes
          // d'affilée — ne doit pas être écrasée par la pénalité de distance.
          if (ahead < -2) {
            const proof = hits[i][k] >= 5 ? 0.3 : hits[i][k] >= 4 ? 0.6 : 1;
            score -= 0.08 * proof * (-2 - ahead);
          }
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
    if (this.pos >= 0 && jump > 30 && (bestScore < 3.5 || bestHits < 4)) return null;
    // Reprise d'une phrase : on accepte de reculer loin si la preuve est nette
    if (this.pos >= 0 && jump < -6 && (bestScore < 2.8 || bestHits < 4)) return null;

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

  /** Position dans le texte (caractères) d'une position fractionnaire en mots */
  charAt(word: number): number {
    if (!this.tokens.length) return 0;
    const w = Math.max(0, Math.min(this.tokens.length - 1, word));
    const a = this.tokens[Math.floor(w)];
    const b = this.tokens[Math.min(this.tokens.length - 1, Math.floor(w) + 1)];
    return a.start + (b.start - a.start) * (w - Math.floor(w));
  }
}

/**
 * Position de lecture estimée, en mots.
 *
 * Whisper ne rend ses hypothèses que par à-coups, environ une par seconde.
 * Prolonger la dernière position confirmée au débit du lecteur faisait avancer
 * la cible entre deux hypothèses, puis retomber d'autant à l'arrivée de la
 * suivante : une dent de scie de plusieurs mots, à chaque hypothèse, que le
 * texte suivait en allant et venant. C'était la cause des aller-retours.
 *
 * L'estimation avance donc en continu, se laisse tirer en avant par chaque mot
 * reconnu, et ne redescend que sur une reprise avérée — un recul franc, que
 * l'alignement ne concède lui-même que sur preuve nette.
 */
export class ReadingEstimate {
  private word = -1;
  private at = 0;

  reset(): void {
    this.word = -1;
    this.at = 0;
  }

  update(al: LiveAligner, now: number, speaking: boolean): number {
    if (al.pos < 0) {
      this.reset();
      this.at = now;
      return -1;
    }
    const confirmed = al.pos + LEAD;
    if (this.word < 0 || confirmed < this.word - REPEAT) {
      this.word = confirmed;
    } else {
      const dt = this.at ? Math.min(1, (now - this.at) / 1000) : 0;
      const drift = speaking ? al.rate * dt : 0;
      this.word = Math.min(Math.max(this.word + drift, confirmed), confirmed + MAX_LEAD);
    }
    this.at = now;
    return Math.min(this.word, al.tokens.length - 1);
  }
}

/** Constante de temps du rattrapage, en secondes : le texte rejoint sa ligne en douceur */
const GLIDE = 0.3;
/** Rattrapage arrière, plus lent : une reprise n'a pas à être expédiée */
const GLIDE_BACK = 0.5;
/** Vitesse maximale du rattrapage, en lignes par seconde */
const MAX_LINES_PER_S = 7;
/** Vitesse maximale en arrière, plus basse : le retour reste lisible */
const MAX_BACK_LINES_PER_S = 4;
/** Au-delà, le lecteur a changé de passage : on rejoint directement */
const JUMP_LINES = 12;
/** Zone morte : sous cette fraction de ligne, le texte ne bouge pas */
const DEAD_LINES = 0.4;
/** En arrière, il faut cet écart pour bouger : le texte ne recule que sur une reprise */
const BACK_LINES = 1.2;


/**
 * Loi de régulation : de l'écart entre la ligne visée et la ligne affichée,
 * en tire la vitesse de rattrapage, en progression par seconde.
 *
 * Zone morte devant, seuil plus large derrière : le texte avance dès qu'il
 * prend du retard, mais ne recule que sur une vraie reprise de phrase — sans
 * cette asymétrie, la moindre hésitation de la reconnaissance le faisait
 * osciller. Au-delà de `JUMP_LINES`, le lecteur a changé de passage : rejoindre
 * en glissant prendrait trop longtemps, on saute.
 */
export function trackingRate(err: number, line: number): { jump: boolean; rate: number } {
  if (Math.abs(err) > line * JUMP_LINES) return { jump: true, rate: 0 };
  // Le seuil est retranché de l'écart au lieu de le commander : à la sortie de
  // la zone morte la vitesse part de zéro et croît, au lieu de s'établir d'un
  // coup à sa valeur pleine. C'est ce saut qui se voyait au démarrage.
  if (err > line * DEAD_LINES) {
    return { jump: false, rate: Math.min(line * MAX_LINES_PER_S, (err - line * DEAD_LINES) / GLIDE) };
  }
  if (err < -line * BACK_LINES) {
    return { jump: false, rate: Math.max(-line * MAX_BACK_LINES_PER_S, (err + line * BACK_LINES) / GLIDE_BACK) };
  }
  return { jump: false, rate: 0 };
}

/** Constante de temps du lissage de la vitesse, en secondes */
const SMOOTH = 0.22;

/**
 * Vitesse réellement appliquée : celle de la loi, rejointe progressivement.
 *
 * La régulation recalcule une consigne dix fois par seconde et chaque
 * hypothèse de la reconnaissance en décale la cible d'un coup. Appliquée
 * telle quelle, la consigne changeait la vitesse du texte par paliers — le
 * défilement partait, s'arrêtait, repartait. Le premier ordre ci-dessous
 * borne l'accélération : la vitesse ne peut plus sauter, seulement enfler et
 * retomber. Un saut de passage court-circuite le lissage, sans quoi le texte
 * dériverait après avoir été reposé.
 */
export function smoothRate(previous: number, target: number, dt: number): number {
  if (!Number.isFinite(previous)) return target;
  const k = Math.min(1, Math.max(0, dt / SMOOTH));
  const next = previous + (target - previous) * k;
  // En deçà, le texte est à l'arrêt : inutile de traîner une vitesse résiduelle
  return Math.abs(next) < 1e-7 ? 0 : next;
}
