import type { SubtitleCue, Transcript } from '../shared/types';

/**
 * Découpage d'une transcription en sous-titres, selon les usages courants de
 * la diffusion : deux lignes au plus, 42 caractères par ligne, 1 à 7 secondes
 * à l'écran, 17 caractères par seconde au plus, 80 ms entre deux sous-titres.
 */

export const LINE_MAX = 42;
export const CUE_MAX = LINE_MAX * 2;
export const MIN_DURATION = 1;
export const MAX_DURATION = 7;
export const CPS_MAX = 17;
const GAP = 0.08;

/** Mots avant lesquels on coupe volontiers une phrase trop longue */
const CONJUNCTIONS = new Set([
  'et', 'mais', 'ou', 'donc', 'car', 'or', 'ni', 'que', 'qui', 'dont', 'où', 'lorsque', 'quand', 'puis', 'pour', 'avec', 'sans',
  'and', 'but', 'or', 'so', 'because', 'that', 'which', 'who', 'when', 'while', 'with', 'for',
  'y', 'pero', 'o', 'porque', 'que', 'cuando', 'con', 'para',
  'und', 'aber', 'oder', 'weil', 'dass', 'wenn', 'mit', 'für',
  'e', 'ma', 'o', 'perché', 'che', 'quando', 'con', 'per',
]);

/** Mots qu'on ne laisse pas en fin de ligne : ils appellent le mot suivant */
const CLINGY = new Set([
  'le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de', 'd', 'au', 'aux', 'a', 'à', 'en', 'ce', 'cet', 'cette', 'ces',
  'dans', 'pour', 'avec', 'sans', 'sous', 'chez', 'vers', 'entre', 'depuis', 'pendant',
  'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs', 'par', 'sur',
  'the', 'an', 'of', 'to', 'in', 'on', 'at', 'by', 'my', 'your', 'our', 'their', 'his', 'her', 'its',
  'el', 'los', 'las', 'del', 'al', 'der', 'die', 'das', 'den', 'dem', 'ein', 'eine', 'il', 'lo', 'gli', 'di', 'da',
]);
/** Dernier mot, élision comprise : « d'une » compte comme « une » */
const lastWord = (s: string) =>
  s.trim().split(' ').pop()?.toLowerCase().split(/['’]/).pop()?.replace(/[^\p{L}]/gu, '') ?? '';

let seq = 0;
const cueId = () => `c${Date.now().toString(36)}${(seq++).toString(36)}`;

/** Découpe un texte en morceaux d'au plus `max` caractères, aux meilleurs endroits */
export function chunkText(text: string, max = CUE_MAX): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean ? [clean] : [];
  // D'abord par phrases
  // Une fin de phrase est suivie d'une espace : « 3.2 » et « www.site.fr » ne coupent pas
  const sentences = clean.match(/.+?(?:[.!?…]+["»”)]?(?=\s|$)|$)/g)?.map((x) => x.trim()).filter(Boolean) ?? [clean];
  if (sentences.length > 1) {
    const out: string[] = [];
    let cur = '';
    for (const s of sentences) {
      if (!cur) cur = s;
      else if (cur.length + 1 + s.length <= max && cur.length < max * 0.45) cur += ` ${s}`;
      else { out.push(...chunkText(cur, max)); cur = s; }
    }
    if (cur) out.push(...chunkText(cur, max));
    return out;
  }
  // Puis au meilleur point de coupure, le plus près du milieu
  const target = Math.min(max, Math.ceil(clean.length / Math.ceil(clean.length / max)));
  let best = -1;
  let bestScore = Infinity;
  for (let i = 1; i < clean.length - 1; i++) {
    if (clean[i] !== ' ' || i > max) continue;
    const before = clean[i - 1];
    const next = clean.slice(i + 1).split(' ')[0].toLowerCase().replace(/[^\p{L}]/gu, '');
    let score = Math.abs(i - target);
    if (/[,;:]/.test(before)) score -= 24;
    else if (CONJUNCTIONS.has(next)) score -= 12;
    if (CLINGY.has(lastWord(clean.slice(0, i)))) score += 20;
    if (score < bestScore) { bestScore = score; best = i; }
  }
  if (best < 0) best = clean.lastIndexOf(' ', max) > 0 ? clean.lastIndexOf(' ', max) : max;
  return [clean.slice(0, best).trim(), ...chunkText(clean.slice(best).trim(), max)];
}

/** Répartit un sous-titre sur deux lignes équilibrées, la seconde un peu plus longue */
export function breakLines(text: string): string {
  const t = text.replace(/\s*\n\s*/g, ' ').trim();
  if (t.length <= LINE_MAX) return t;
  let best = -1;
  let bestScore = Infinity;
  for (let i = 1; i < t.length - 1; i++) {
    if (t[i] !== ' ') continue;
    const a = i;
    const b = t.length - i - 1;
    if (a > LINE_MAX + 4 || b > LINE_MAX + 4) continue;
    // Pyramide : on préfère une première ligne légèrement plus courte
    let score = Math.abs(a - b) + (a > b ? 3 : 0);
    if (/[,;:.]/.test(t[i - 1])) score -= 8;
    const next = t.slice(i + 1).split(' ')[0].toLowerCase();
    if (CONJUNCTIONS.has(next)) score -= 4;
    if (CLINGY.has(lastWord(t.slice(0, i)))) score += 12;
    if (score < bestScore) { bestScore = score; best = i; }
  }
  return best < 0 ? t : `${t.slice(0, best)}\n${t.slice(best + 1)}`;
}

/** Repère la pause la plus proche d'un instant, pour y caler une coupure */
function snapToPause(time: number, speech: Array<[number, number]>, within = 0.6): number {
  let best = time;
  let dist = within;
  for (let i = 1; i < speech.length; i++) {
    const gapStart = speech[i - 1][1];
    const gapEnd = speech[i][0];
    if (gapEnd <= gapStart) continue;
    const mid = (gapStart + gapEnd) / 2;
    const d = Math.abs(mid - time);
    if (d < dist) { dist = d; best = mid; }
  }
  return best;
}

export function buildCues(transcript: Transcript): SubtitleCue[] {
  const raw: SubtitleCue[] = [];
  for (const seg of transcript.segments) {
    const chunks = chunkText(seg.text);
    const totalChars = chunks.reduce((n, c) => n + c.length, 0) || 1;
    let t = seg.start;
    let acc = 0;
    chunks.forEach((c, k) => {
      acc += c.length;
      const proportional = seg.start + (seg.end - seg.start) * (acc / totalChars);
      const end = k === chunks.length - 1 ? seg.end : snapToPause(proportional, transcript.speech);
      raw.push({ id: cueId(), start: t, end: Math.max(end, t + 0.2), text: breakLines(c) });
      t = end;
    });
  }
  return fitTimings(raw, transcript.duration);
}

/** Durées minimale et maximale, écart entre sous-titres, sans chevauchement */
export function fitTimings(cues: SubtitleCue[], duration: number): SubtitleCue[] {
  const out = cues.map((c) => ({ ...c }));
  for (let i = 0; i < out.length; i++) {
    const c = out[i];
    const next = out[i + 1];
    const limit = next ? next.start - GAP : duration;
    const chars = c.text.replace(/\n/g, ' ').length;
    // Temps de lecture nécessaire au rythme maximal, sans dépasser le suivant
    const needed = Math.max(MIN_DURATION, chars / CPS_MAX);
    if (c.end - c.start < needed) c.end = Math.min(limit, c.start + needed);
    if (c.end - c.start > MAX_DURATION) c.end = c.start + MAX_DURATION;
    if (c.end > limit) c.end = Math.max(c.start + 0.2, limit);
  }
  return out;
}

export const cps = (c: SubtitleCue) =>
  c.text.replace(/\n/g, ' ').length / Math.max(0.01, c.end - c.start);

export function srtTime(sec: number): string {
  const ms = Math.max(0, Math.round(sec * 1000));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(h)}:${p(m)}:${p(s)},${p(r, 3)}`;
}

export function parseTime(text: string): number | null {
  const m = /^\s*(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:[,.](\d{1,3}))?\s*$/.exec(text);
  if (!m) return null;
  const [, h, mi, s, ms] = m;
  return Number(h ?? 0) * 3600 + Number(mi) * 60 + Number(s) + Number((ms ?? '0').padEnd(3, '0')) / 1000;
}

export function toSrt(cues: SubtitleCue[]): string {
  return cues
    .filter((c) => c.text.trim())
    .map((c, i) => `${i + 1}\r\n${srtTime(c.start)} --> ${srtTime(c.end)}\r\n${c.text.trim().replace(/\n/g, '\r\n')}\r\n`)
    .join('\r\n');
}

/** Coupe un sous-titre à une position du texte, le temps étant réparti au prorata */
export function splitCue(c: SubtitleCue, at: number): [SubtitleCue, SubtitleCue] | null {
  const flat = c.text.replace(/\n/g, ' ');
  const a = flat.slice(0, at).trim();
  const b = flat.slice(at).trim();
  if (!a || !b) return null;
  const mid = c.start + (c.end - c.start) * (a.length / (a.length + b.length));
  return [
    { id: cueId(), start: c.start, end: mid - GAP / 2, text: breakLines(a) },
    { id: cueId(), start: mid + GAP / 2, end: c.end, text: breakLines(b) },
  ];
}

export function mergeCues(a: SubtitleCue, b: SubtitleCue): SubtitleCue {
  return {
    id: cueId(),
    start: Math.min(a.start, b.start),
    end: Math.max(a.end, b.end),
    text: breakLines(`${a.text.replace(/\n/g, ' ')} ${b.text.replace(/\n/g, ' ')}`),
  };
}
