import type { StyleMark } from './types';

export const MARK_KEYS: Array<keyof StyleMark> = ['color', 'bold', 'italic', 'fontFamily'];

export type MarkStyle = Omit<StyleMark, 'start' | 'end'>;

export interface Segment {
  text: string;
  style: MarkStyle | null;
}

const styleKey = (s: MarkStyle | null) =>
  s ? `${s.color ?? ''}|${s.bold ? 1 : 0}|${s.italic ? 1 : 0}|${s.fontFamily ?? ''}` : '';

export const isEmptyStyle = (s: MarkStyle | null | undefined): boolean =>
  !s || (!s.color && !s.bold && !s.italic && !s.fontFamily);

/** Style effectif de chaque caractère : les marques les plus récentes l'emportent */
function styleArray(text: string, marks: StyleMark[]): Array<MarkStyle | null> {
  const arr: Array<MarkStyle | null> = new Array(text.length).fill(null);
  for (const m of marks) {
    const start = Math.max(0, Math.min(m.start, text.length));
    const end = Math.max(start, Math.min(m.end, text.length));
    for (let i = start; i < end; i++) {
      const base = arr[i] ?? {};
      const next: MarkStyle = { ...base };
      if (m.color) next.color = m.color;
      if (m.fontFamily) next.fontFamily = m.fontFamily;
      if (m.bold !== undefined) next.bold = m.bold;
      if (m.italic !== undefined) next.italic = m.italic;
      arr[i] = isEmptyStyle(next) ? null : next;
    }
  }
  return arr;
}

/** Découpe le texte en segments homogènes, prêts à être rendus */
export function toSegments(text: string, marks: StyleMark[]): Segment[] {
  if (marks.length === 0) return text ? [{ text, style: null }] : [];
  const arr = styleArray(text, marks);
  const out: Segment[] = [];
  let startIdx = 0;
  for (let i = 1; i <= text.length; i++) {
    if (i === text.length || styleKey(arr[i]) !== styleKey(arr[startIdx])) {
      out.push({ text: text.slice(startIdx, i), style: arr[startIdx] });
      startIdx = i;
    }
  }
  return out;
}

/** Marques normalisées : bornées, triées, fusionnées, sans doublon */
export function normalizeMarks(text: string, marks: StyleMark[]): StyleMark[] {
  const arr = styleArray(text, marks);
  const out: StyleMark[] = [];
  let i = 0;
  while (i < text.length) {
    const style = arr[i];
    let j = i + 1;
    while (j < text.length && styleKey(arr[j]) === styleKey(style)) j++;
    if (!isEmptyStyle(style)) out.push({ start: i, end: j, ...(style as MarkStyle) });
    i = j;
  }
  return out;
}

/** Applique un style à un intervalle : une valeur nulle efface l'attribut */
export function applyStyle(
  text: string,
  marks: StyleMark[],
  start: number,
  end: number,
  patch: Partial<MarkStyle> | null,
): StyleMark[] {
  if (end <= start) return marks;
  const arr = styleArray(text, marks);
  for (let i = start; i < Math.min(end, text.length); i++) {
    if (patch === null) {
      arr[i] = null;
      continue;
    }
    const next: MarkStyle = { ...(arr[i] ?? {}) };
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === '' || v === false) delete (next as Record<string, unknown>)[k];
      else (next as Record<string, unknown>)[k] = v;
    }
    arr[i] = isEmptyStyle(next) ? null : next;
  }
  const rebuilt: StyleMark[] = [];
  let i = 0;
  while (i < text.length) {
    const style = arr[i];
    let j = i + 1;
    while (j < text.length && styleKey(arr[j]) === styleKey(style)) j++;
    if (!isEmptyStyle(style)) rebuilt.push({ start: i, end: j, ...(style as MarkStyle) });
    i = j;
  }
  return rebuilt;
}

/** Style commun à un intervalle (pour l'état actif de la barre d'outils) */
export function styleAt(text: string, marks: StyleMark[], start: number, end: number): MarkStyle | null {
  const arr = styleArray(text, marks);
  const from = Math.max(0, Math.min(start, text.length - 1));
  const to = Math.max(from + 1, Math.min(end, text.length));
  const first = arr[from];
  for (let i = from + 1; i < to; i++) if (styleKey(arr[i]) !== styleKey(first)) return null;
  return first;
}

/**
 * Report des marques après une modification du texte :
 * les positions avant la zone changée sont conservées, celles d'après sont décalées.
 */
export function remapMarks(marks: StyleMark[], oldText: string, newText: string): StyleMark[] {
  if (oldText === newText) return marks;
  let prefix = 0;
  const maxPrefix = Math.min(oldText.length, newText.length);
  while (prefix < maxPrefix && oldText[prefix] === newText[prefix]) prefix++;
  let suffix = 0;
  while (
    suffix < maxPrefix - prefix
    && oldText[oldText.length - 1 - suffix] === newText[newText.length - 1 - suffix]
  ) suffix++;
  const delta = newText.length - oldText.length;
  const oldEnd = oldText.length - suffix;

  const map = (pos: number) => (pos <= prefix ? pos : pos >= oldEnd ? pos + delta : prefix);
  return normalizeMarks(
    newText,
    marks
      .map((m) => ({ ...m, start: map(m.start), end: map(m.end) }))
      .filter((m) => m.end > m.start),
  );
}
