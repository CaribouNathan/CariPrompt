import type { SkippedPassage, SpeechAnalysis, Transcript } from '../shared/types';

/**
 * Analyse d'une prise transcrite, comparée au texte du prompteur : passages
 * sautés, mots ajoutés, mots parasites, répétitions, hésitations, débit.
 *
 * La comparaison se fait mot à mot, après normalisation (casse, accents,
 * ponctuation). Les nombres sont ramenés à un même jeton, car Whisper écrit
 * « 120 » là où le texte dit « cent vingt », et inversement.
 */

// MARK: - Langue

const STOPWORDS: Record<string, string[]> = {
  fr: ['le', 'la', 'les', 'des', 'est', 'et', 'une', 'pour', 'dans', 'que', 'qui', 'nous', 'vous', 'pas', 'sur', 'avec', 'du', 'au'],
  en: ['the', 'and', 'is', 'are', 'you', 'that', 'for', 'with', 'this', 'our', 'we', 'to', 'of', 'in', 'it', 'on', 'be'],
  es: ['el', 'los', 'las', 'que', 'es', 'y', 'una', 'para', 'con', 'por', 'del', 'nuestro', 'en', 'se', 'su', 'lo'],
  de: ['der', 'die', 'das', 'und', 'ist', 'sie', 'wir', 'mit', 'für', 'nicht', 'ein', 'eine', 'auf', 'zu', 'den', 'dem'],
  it: ['il', 'lo', 'gli', 'che', 'è', 'e', 'una', 'per', 'con', 'non', 'del', 'della', 'sono', 'nel', 'di', 'da'],
  pt: ['o', 'os', 'as', 'que', 'é', 'e', 'uma', 'para', 'com', 'não', 'do', 'da', 'em', 'no', 'na', 'você'],
  nl: ['de', 'het', 'een', 'en', 'is', 'van', 'dat', 'wij', 'met', 'voor', 'niet', 'op', 'zijn', 'u', 'ons', 'te'],
};

/** Langue probable d'un texte, ou chaîne vide si le signal est trop faible */
export function guessLanguage(text: string): string {
  const words = text.toLowerCase().match(/[\p{L}']+/gu) ?? [];
  if (words.length < 8) return '';
  const counts = Object.entries(STOPWORDS).map(([lang, list]) => {
    const set = new Set(list);
    return [lang, words.filter((w) => set.has(w)).length] as const;
  }).sort((a, b) => b[1] - a[1]);
  const [first, second] = counts;
  // Il faut une avance nette : « de », « e » ou « que » existent dans plusieurs langues
  return first[1] >= 3 && first[1] >= second[1] * 1.5 ? first[0] : '';
}

// MARK: - Normalisation

const NUMBER_WORDS = new Set([
  // fr
  'zero', 'un', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize',
  'quatorze', 'quinze', 'seize', 'vingt', 'vingts', 'trente', 'quarante', 'cinquante', 'soixante', 'cent', 'cents', 'mille',
  'million', 'millions', 'milliard', 'milliards', 'virgule',
  // en
  'one', 'two', 'three', 'four', 'five', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen',
  'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy',
  'eighty', 'ninety', 'hundred', 'thousand', 'billion', 'point',
  // es / it / pt
  'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'veinte', 'treinta', 'cuarenta',
  'cincuenta', 'cien', 'ciento', 'mil', 'millon', 'due', 'tre', 'quattro', 'sei', 'sette', 'otto', 'nove', 'dieci', 'venti',
  'trenta', 'cento', 'mila', 'dois', 'quatro', 'sete', 'oito', 'nove', 'dez', 'vinte', 'trinta',
  // de / nl
  'eins', 'zwei', 'drei', 'vier', 'funf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'zwanzig', 'dreissig', 'hundert',
  'tausend', 'twee', 'drie', 'vijf', 'zes', 'zeven', 'negen', 'tien', 'twintig', 'honderd', 'duizend',
]);

/** Mots liés aux nombres, absorbés dans le jeton numérique quand ils l'entourent */
const NUMBER_GLUE = new Set(['et', 'and', 'y', 'e', 'und', 'en', 'pour', 'cent', 'percent', 'por', 'ciento', 'per', 'prozent']);

export interface Token {
  /** Forme normalisée utilisée pour la comparaison */
  norm: string;
  /** Position dans le texte d'origine */
  start: number;
  end: number;
}

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');

export function tokenize(text: string, skipDirections = false): Token[] {
  // Les indications de tournage entre crochets ne se disent pas
  const source = skipDirections ? text.replace(/\[[^\]\n]*\]/g, (m) => ' '.repeat(m.length)) : text;
  const raw: Token[] = [];
  for (const m of source.matchAll(/[\p{L}\p{N}]+/gu)) {
    raw.push({ norm: fold(m[0]), start: m.index ?? 0, end: (m.index ?? 0) + m[0].length });
  }
  // Suites de chiffres ou de mots de nombre → un seul jeton
  const out: Token[] = [];
  for (let i = 0; i < raw.length; i++) {
    const t = raw[i];
    const isNum = (x: Token) => /^\d+$/.test(x.norm) || NUMBER_WORDS.has(x.norm);
    if (!isNum(t)) { out.push(t); continue; }
    let j = i;
    while (j + 1 < raw.length && (isNum(raw[j + 1]) || (NUMBER_GLUE.has(raw[j + 1].norm) && j + 2 < raw.length && isNum(raw[j + 2])))) j++;
    out.push({ norm: '#', start: t.start, end: raw[j].end });
    i = j;
  }
  return out;
}

// MARK: - Alignement

/**
 * Plus longue sous-suite commune, mot à mot. Au-delà de 16 millions de
 * cellules, on se limite à une bande autour de la diagonale.
 * Renvoie, pour chaque mot du texte, l'indice du mot transcrit apparié (ou -1).
 */
export function align(a: string[], b: string[]): Int32Array {
  const n = a.length;
  const m = b.length;
  const match = new Int32Array(n).fill(-1);
  if (!n || !m) return match;
  const band = n * m > 16_000_000 ? Math.max(400, Math.abs(n - m) + 200) : Infinity;
  const dir = new Uint8Array((n + 1) * (m + 1));
  let prev = new Uint32Array(m + 1);
  let cur = new Uint32Array(m + 1);
  for (let i = 1; i <= n; i++) {
    const center = Math.round((i * m) / n);
    const lo = band === Infinity ? 1 : Math.max(1, center - band);
    const hi = band === Infinity ? m : Math.min(m, center + band);
    cur.fill(0);
    for (let j = lo; j <= hi; j++) {
      const k = i * (m + 1) + j;
      if (a[i - 1] === b[j - 1]) { cur[j] = prev[j - 1] + 1; dir[k] = 1; }
      else if (prev[j] >= cur[j - 1]) { cur[j] = prev[j]; dir[k] = 2; }
      else { cur[j] = cur[j - 1]; dir[k] = 3; }
    }
    [prev, cur] = [cur, prev];
  }
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    const d = dir[i * (m + 1) + j];
    if (d === 1) { match[i - 1] = j - 1; i--; j--; }
    else if (d === 2) i--;
    else if (d === 3) j--;
    else break;
  }
  return match;
}

// MARK: - Mots parasites

const FILLERS: Record<string, string[]> = {
  fr: ['euh', 'heu', 'hum', 'hmm', 'bah', 'ben', 'hein', 'genre', 'du coup', 'en fait', 'voila', 'bon', 'quoi', 'enfin'],
  en: ['uh', 'um', 'er', 'erm', 'hmm', 'ah', 'like', 'you know', 'i mean', 'sort of', 'kind of', 'basically', 'actually', 'so'],
  es: ['eh', 'em', 'este', 'pues', 'o sea', 'bueno', 'vale', 'digamos'],
  de: ['ah', 'ahm', 'hm', 'also', 'halt', 'quasi', 'sozusagen', 'eben', 'naja'],
  it: ['ehm', 'eh', 'cioe', 'allora', 'tipo', 'praticamente', 'insomma', 'diciamo'],
  pt: ['eh', 'hum', 'tipo', 'entao', 'ne', 'pronto'],
  nl: ['eh', 'uh', 'ehm', 'nou', 'dus', 'zeg maar', 'eigenlijk'],
};

// MARK: - Analyse

/** Pause au milieu d'une phrase à partir de laquelle on parle d'hésitation */
const HESITATION = 0.8;

export function analyzeSpeech(
  transcript: Transcript,
  script: string | null,
  progress: { start: number; end: number },
  language: string,
): SpeechAnalysis {
  // Transcription : jetons et instant approximatif de chacun (au prorata dans son segment)
  const spoken: Array<Token & { time: number }> = [];
  for (const seg of transcript.segments) {
    const toks = tokenize(seg.text);
    const len = seg.text.length || 1;
    for (const tk of toks) spoken.push({ ...tk, time: seg.start + ((seg.end - seg.start) * tk.start) / len });
  }
  const spokenWords = spoken.map((t) => t.norm);

  // Débit, entre la première et la dernière parole
  const first = transcript.speech[0]?.[0] ?? 0;
  const last = transcript.speech[transcript.speech.length - 1]?.[1] ?? transcript.duration;
  const span = Math.max(1, last - first);
  const wordsPerMinute = Math.round((spoken.length / span) * 60);

  // Comparaison au texte
  let fidelity = 1;
  let added = 0;
  const skipped: SkippedPassage[] = [];
  const unmatchedSpoken = new Set<number>();

  if (script && script.trim()) {
    const all = tokenize(script, true);
    // Zone lue : de la position de départ du prompteur à sa position d'arrivée,
    // élargie à tout mot effectivement reconnu en dehors
    const fromChar = Math.floor(progress.start * script.length);
    const toChar = Math.ceil(progress.end * script.length);
    const matchAll = align(all.map((t) => t.norm), spokenWords);
    let lo = all.findIndex((t) => t.end > fromChar);
    let hi = all.length - 1;
    while (hi > 0 && all[hi].start > toChar) hi--;
    const matchedIdx = [...matchAll].map((v, i) => (v >= 0 ? i : -1)).filter((i) => i >= 0);
    if (lo < 0) lo = 0;
    if (matchedIdx.length) {
      lo = Math.min(lo, matchedIdx[0]);
      hi = Math.max(hi, matchedIdx[matchedIdx.length - 1]);
      // Un démarrage au début du texte ne doit pas compter ce qui précède le premier mot lu
      if (progress.start < 0.01) lo = Math.min(lo, matchedIdx[0]);
    }

    const region = all.slice(lo, hi + 1);
    const matched = matchAll.slice(lo, hi + 1);
    const hits = matched.filter((v) => v >= 0).length;
    fidelity = region.length ? hits / region.length : 1;

    // Passages sautés : au moins trois mots consécutifs non prononcés
    for (let i = 0; i < region.length;) {
      if (matched[i] >= 0) { i++; continue; }
      let j = i;
      while (j < region.length && matched[j] < 0) j++;
      if (j - i >= 3) {
        const start = region[i].start;
        const end = region[j - 1].end;
        const text = script.slice(start, end).replace(/\s+/g, ' ');
        skipped.push({ text: text.length > 140 ? `${text.slice(0, 137)}…` : text, offset: start, words: j - i });
      }
      i = j;
    }

    const used = new Set<number>();
    for (const v of matchAll) if (v >= 0) used.add(v);
    spoken.forEach((_, k) => { if (!used.has(k)) unmatchedSpoken.add(k); });
    added = unmatchedSpoken.size;
  }

  // Mots parasites : seulement s'ils ne figurent pas dans le texte à cet endroit
  const lexicon = FILLERS[language] ?? Object.values(FILLERS).flat();
  const fillerCounts = new Map<string, number>();
  for (const f of lexicon) {
    const parts = f.split(' ');
    for (let k = 0; k + parts.length <= spoken.length; k++) {
      if (!parts.every((p, x) => spoken[k + x].norm === p)) continue;
      if (script && !parts.every((_, x) => unmatchedSpoken.has(k + x))) continue;
      fillerCounts.set(f, (fillerCounts.get(f) ?? 0) + 1);
    }
  }
  const fillers = [...fillerCounts].map(([word, count]) => ({ word, count })).sort((a, b) => b.count - a.count);

  // Répétitions : une suite de 1 à 3 mots répétée aussitôt, dont une occurrence au moins n'est pas dans le texte
  const repetitions: SpeechAnalysis['repetitions'] = [];
  for (let k = 0; k < spoken.length; k++) {
    for (let n = 3; n >= 1; n--) {
      if (k + 2 * n > spoken.length) continue;
      let same = true;
      for (let x = 0; x < n && same; x++) same = spoken[k + x].norm === spoken[k + n + x].norm;
      if (!same || spoken[k].norm === '#') continue;
      const extra = !script || [...Array(2 * n).keys()].some((x) => unmatchedSpoken.has(k + x));
      if (!extra) continue;
      const words = spoken.slice(k, k + n).map((t) => t.norm).join(' ');
      if (n === 1 && words.length < 2) continue;
      repetitions.push({ text: words, time: spoken[k].time });
      k += 2 * n - 1;
      break;
    }
  }

  // Hésitations : pause longue entre deux plages de parole, sans fin de phrase à cet endroit
  const hesitations: SpeechAnalysis['hesitations'] = [];
  for (let i = 1; i < transcript.speech.length; i++) {
    const gapStart = transcript.speech[i - 1][1];
    const gapEnd = transcript.speech[i][0];
    const length = gapEnd - gapStart;
    if (length < HESITATION) continue;
    const seg = transcript.segments.find((s) => s.start < gapStart && s.end > gapEnd);
    if (!seg) continue; // pause entre deux segments : Whisper l'a traitée comme une fin de phrase
    const at = Math.round(((gapStart - seg.start) / (seg.end - seg.start)) * seg.text.length);
    const around = seg.text.slice(Math.max(0, at - 12), at + 12);
    if (/[.!?…:;]/.test(around)) continue;
    hesitations.push({ time: gapStart, length: Math.round(length * 10) / 10 });
  }

  return {
    wordsPerMinute,
    words: spoken.length,
    fidelity: Math.round(fidelity * 1000) / 1000,
    skipped,
    added,
    fillers,
    repetitions,
    hesitations,
  };
}
