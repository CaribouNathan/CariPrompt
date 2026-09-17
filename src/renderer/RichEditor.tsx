import { useCallback, useEffect, useRef } from 'react';
import { toSegments, type MarkStyle } from '../shared/marks';
import type { StyleMark } from '../shared/types';

export interface Selection {
  start: number;
  end: number;
}

/** Position d'un nœud/offset du DOM dans le texte brut */
function offsetOf(root: HTMLElement, node: Node, offset: number): number {
  let total = 0;
  let found = -1;
  const walk = (n: Node) => {
    if (found >= 0) return;
    if (n === node && n.nodeType !== Node.TEXT_NODE) {
      // Position exprimée en nombre d'enfants
      for (let i = 0; i < offset && i < n.childNodes.length; i++) walk(n.childNodes[i]);
      found = total;
      return;
    }
    if (n.nodeType === Node.TEXT_NODE) {
      if (n === node) { found = total + Math.min(offset, n.nodeValue?.length ?? 0); return; }
      total += n.nodeValue?.length ?? 0;
      return;
    }
    if (n.nodeName === 'BR') { total += 1; return; }
    for (const child of Array.from(n.childNodes)) {
      walk(child);
      if (found >= 0) return;
    }
  };
  walk(root);
  return found >= 0 ? found : total;
}

/** Nœud/offset correspondant à une position du texte brut */
function nodeAt(root: HTMLElement, target: number): { node: Node; offset: number } {
  let total = 0;
  let result: { node: Node; offset: number } | null = null;
  const walk = (n: Node) => {
    if (result) return;
    if (n.nodeType === Node.TEXT_NODE) {
      const len = n.nodeValue?.length ?? 0;
      if (target <= total + len) { result = { node: n, offset: target - total }; return; }
      total += len;
      return;
    }
    if (n.nodeName === 'BR') {
      if (target <= total) { result = { node: n.parentNode!, offset: 0 }; return; }
      total += 1;
      return;
    }
    for (const child of Array.from(n.childNodes)) {
      walk(child);
      if (result) return;
    }
  };
  walk(root);
  return result ?? { node: root, offset: root.childNodes.length };
}

/** Lecture du contenu : texte brut + marques de style */
export function parseEditor(root: HTMLElement): { text: string; marks: StyleMark[] } {
  let text = '';
  const marks: StyleMark[] = [];
  const walk = (n: Node, style: MarkStyle | null) => {
    if (n.nodeType === Node.TEXT_NODE) {
      const value = n.nodeValue ?? '';
      if (!value) return;
      if (style) marks.push({ start: text.length, end: text.length + value.length, ...style });
      text += value;
      return;
    }
    if (n.nodeName === 'BR') { text += '\n'; return; }
    const el = n as HTMLElement;
    let next = style;
    const raw = el.dataset?.m;
    if (raw) {
      try {
        next = { ...(style ?? {}), ...(JSON.parse(raw) as MarkStyle) };
      } catch { /* marque illisible : ignorée */ }
    }
    for (const child of Array.from(n.childNodes)) walk(child, next);
  };
  for (const child of Array.from(root.childNodes)) walk(child, null);
  return { text, marks };
}

function styleCss(style: MarkStyle): string {
  const parts: string[] = [];
  if (style.color) parts.push(`color:${style.color}`);
  if (style.bold) parts.push('font-weight:700');
  if (style.italic) parts.push('font-style:italic');
  if (style.fontFamily) parts.push(`font-family:"${style.fontFamily.replace(/"/g, '')}"`);
  return parts.join(';');
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Contenu HTML de l'éditeur à partir du texte et de ses marques */
export function buildHtml(text: string, marks: StyleMark[]): string {
  return toSegments(text, marks)
    .map((seg) => (seg.style
      ? `<span data-m='${escapeHtml(JSON.stringify(seg.style))}' style="${styleCss(seg.style)}">${escapeHtml(seg.text)}</span>`
      : escapeHtml(seg.text)))
    .join('') || '';
}

interface Props {
  scriptId: string;
  text: string;
  marks: StyleMark[];
  placeholder: string;
  onChange: (text: string, marks: StyleMark[]) => void;
  onSelectionChange: (sel: Selection | null) => void;
  onFocusChange: (focused: boolean) => void;
}

/**
 * Zone d'édition en texte brut avec styles partiels.
 * Le DOM n'est réécrit que si le contenu vient de l'extérieur (changement de texte,
 * ouverture de projet, style appliqué), pour ne jamais déplacer le curseur pendant la frappe.
 */
export function RichEditor({
  scriptId, text, marks, placeholder, onChange, onSelectionChange, onFocusChange,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const lastParsed = useRef('');

  const readSelection = useCallback((): Selection | null => {
    const root = ref.current;
    const sel = window.getSelection();
    if (!root || !sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    if (!root.contains(range.commonAncestorContainer)) return null;
    const start = offsetOf(root, range.startContainer, range.startOffset);
    const end = offsetOf(root, range.endContainer, range.endOffset);
    return { start: Math.min(start, end), end: Math.max(start, end) };
  }, []);

  // Écriture du DOM quand le contenu change hors frappe
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const signature = JSON.stringify([text, marks]);
    if (signature === lastParsed.current) return;
    const sel = readSelection();
    root.innerHTML = buildHtml(text, marks);
    lastParsed.current = signature;
    if (sel && document.activeElement === root) {
      const range = document.createRange();
      const a = nodeAt(root, Math.min(sel.start, text.length));
      const b = nodeAt(root, Math.min(sel.end, text.length));
      range.setStart(a.node, a.offset);
      range.setEnd(b.node, b.offset);
      const s = window.getSelection();
      s?.removeAllRanges();
      s?.addRange(range);
    }
  }, [text, marks, scriptId, readSelection]);

  useEffect(() => {
    const onSelChange = () => {
      if (document.activeElement !== ref.current) return;
      onSelectionChange(readSelection());
    };
    document.addEventListener('selectionchange', onSelChange);
    return () => document.removeEventListener('selectionchange', onSelChange);
  }, [onSelectionChange, readSelection]);

  const handleInput = () => {
    const root = ref.current;
    if (!root) return;
    const parsed = parseEditor(root);
    lastParsed.current = JSON.stringify([parsed.text, parsed.marks]);
    onChange(parsed.text, parsed.marks);
  };

  return (
    <div
      ref={ref}
      className="editor-text"
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck
      data-placeholder={placeholder}
      data-empty={text.length === 0 ? 'true' : undefined}
      onInput={handleInput}
      onFocus={() => onFocusChange(true)}
      onBlur={() => { onFocusChange(false); onSelectionChange(null); }}
      onPaste={(e) => {
        e.preventDefault();
        const plain = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, plain);
      }}
    />
  );
}
