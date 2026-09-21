import { normalizeMarks, toSegments, type MarkStyle } from '../shared/marks';
import type { StyleMark } from '../shared/types';

/**
 * Préparation d'un texte pour la traduction ou l'adaptation à l'oral, et
 * reconstruction du résultat avec ses styles.
 *
 * Le texte part en paragraphes (séparés par une ligne vide). Le style commun
 * à tout un paragraphe — typiquement la couleur d'un interlocuteur — est mis
 * de côté puis réappliqué à tout ce que ce paragraphe devient. Le gras partiel
 * voyage sous la forme **mot**, que le modèle sait conserver et déplacer.
 */

export interface PreparedText {
  inputs: string[];
  /** Style commun à chaque paragraphe, ou null */
  whole: Array<MarkStyle | null>;
}

const PARAGRAPH_BREAK = /\n[ \t]*\n+/g;

function paragraphRanges(text: string): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let start = 0;
  const push = (end: number) => {
    let s = start;
    let e = end;
    while (s < e && /\s/.test(text[s])) s++;
    while (e > s && /\s/.test(text[e - 1])) e--;
    if (e > s) out.push([s, e]);
  };
  for (const m of text.matchAll(PARAGRAPH_BREAK)) {
    push(m.index ?? 0);
    start = (m.index ?? 0) + m[0].length;
  }
  push(text.length);
  return out;
}

/** Style par caractère, à partir des segments déjà calculés pour le rendu */
function charStyles(text: string, marks: StyleMark[]): Array<MarkStyle | null> {
  const arr: Array<MarkStyle | null> = new Array(text.length).fill(null);
  let pos = 0;
  for (const seg of toSegments(text, marks)) {
    for (let i = 0; i < seg.text.length; i++) arr[pos + i] = seg.style;
    pos += seg.text.length;
  }
  return arr;
}

/** Propriétés partagées par tous les caractères visibles du paragraphe */
function commonStyle(styles: Array<MarkStyle | null>): MarkStyle | null {
  if (styles.length === 0) return null;
  const first = styles[0];
  const same = <K extends keyof MarkStyle>(k: K) => styles.every((s) => (s?.[k] ?? undefined) === (first?.[k] ?? undefined));
  const out: MarkStyle = {};
  if (first?.color && same('color')) out.color = first.color;
  if (first?.fontFamily && same('fontFamily')) out.fontFamily = first.fontFamily;
  if (first?.italic && same('italic')) out.italic = true;
  if (first?.bold && same('bold')) out.bold = true;
  return Object.keys(out).length ? out : null;
}

export function prepare(text: string, marks: StyleMark[]): PreparedText {
  const styles = charStyles(text, marks);
  const inputs: string[] = [];
  const whole: Array<MarkStyle | null> = [];

  for (const [s, e] of paragraphRanges(text)) {
    const visible: Array<MarkStyle | null> = [];
    for (let i = s; i < e; i++) if (!/\s/.test(text[i])) visible.push(styles[i]);
    const common = commonStyle(visible);
    whole.push(common);

    // Gras partiel : il n'est pas déjà porté par le style commun
    let out = '';
    let inBold = false;
    for (let i = s; i < e; i++) {
      const bold = !common?.bold && !!styles[i]?.bold && !/\s/.test(text[i]);
      if (bold !== inBold) {
        // Les ** se referment avant l'espace, jamais après
        out += '**';
        inBold = bold;
      }
      out += text[i];
    }
    if (inBold) out += '**';
    inputs.push(out.replace(/\*\*(\s+)\*\*/g, '$1'));
  }
  return { inputs, whole };
}

/** Texte et marques d'un nouveau script, à partir de la sortie du modèle */
export function assemble(
  outputs: string[][],
  whole: Array<MarkStyle | null>,
): { text: string; marks: StyleMark[] } {
  let text = '';
  const marks: StyleMark[] = [];

  outputs.forEach((items, i) => {
    for (const item of items) {
      if (text) text += '\n\n';
      const start = text.length;
      let plain = '';
      const bold: Array<[number, number]> = [];
      let last = 0;
      for (const m of item.matchAll(/\*\*(.+?)\*\*/gs)) {
        plain += item.slice(last, m.index);
        const a = plain.length;
        plain += m[1];
        bold.push([a, plain.length]);
        last = (m.index ?? 0) + m[0].length;
      }
      plain += item.slice(last);
      // Astérisques orphelins laissés par le modèle
      plain = plain.replace(/\*\*/g, '');
      text += plain;

      const style = whole[i];
      if (style) marks.push({ start, end: start + plain.length, ...style });
      for (const [a, b] of bold) {
        if (b > a) marks.push({ start: start + a, end: start + b, bold: true });
      }
    }
  });

  return { text, marks: normalizeMarks(text, marks) };
}
