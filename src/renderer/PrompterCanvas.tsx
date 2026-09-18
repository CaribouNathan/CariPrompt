import { useEffect, useMemo, useRef } from 'react';
import { toSegments } from '../shared/marks';
import type { PreviewMetrics } from './store';
import { chronoAt, formatDuration, progressAt, type Mirror, type OutputState } from '../shared/types';

const MIRROR_TRANSFORM: Record<Mirror, string> = {
  none: 'none',
  horizontal: 'scaleX(-1)',
  vertical: 'scaleY(-1)',
  both: 'scale(-1, -1)',
};

export const SYSTEM_FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI Variable', 'Segoe UI', system-ui, Ubuntu, Cantarell, sans-serif";

export function fontStack(family: string): string {
  return family ? `"${family.replace(/"/g, '')}", ${SYSTEM_FONT_STACK}` : SYSTEM_FONT_STACK;
}

interface Props {
  state: OutputState;
  width: number;
  height: number;
  mirror: Mirror;
  /** Fournit les mesures de mise en page (aperçu opérateur uniquement) */
  onMetrics?: (m: PreviewMetrics | null) => void;
}

/**
 * Rendu identique pour l'aperçu, la sortie et le plein écran.
 * Défilement et timecode sont appliqués directement au DOM à chaque image
 * (requestAnimationFrame), sans passer par React.
 */
export function PrompterCanvas({ state, width, height, mirror, onMetrics }: Props) {
  const textRef = useRef<HTMLDivElement>(null);
  const elapsedRef = useRef<HTMLSpanElement>(null);
  const remainingRef = useRef<HTMLSpanElement>(null);
  const stateRef = useRef(state);
  const sizeRef = useRef({ width, height });
  const mirrorRef = useRef(mirror);
  const textHeightRef = useRef(0);

  stateRef.current = state;
  sizeRef.current = { width, height };
  mirrorRef.current = mirror;

  const { style } = state;
  const lineH = style.fontSize * style.lineHeight;
  const segments = useMemo(() => toSegments(state.text, state.marks), [state.text, state.marks]);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => { textHeightRef.current = el.offsetHeight; });
    ro.observe(el);
    textHeightRef.current = el.offsetHeight;
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0;
    let lastY = NaN;
    const frame = () => {
      const st = stateRef.current;
      const now = Date.now();
      const { height: h } = sizeRef.current;
      const lh = st.style.fontSize * st.style.lineHeight;
      const travel = Math.max(textHeightRef.current - lh, 0);
      const p = progressAt(st.playback, now);
      const y = h * st.style.readingLine - lh / 2 - p * travel;
      if (y !== lastY && textRef.current) {
        textRef.current.style.transform = `translate3d(0, ${y}px, 0)`;
        lastY = y;
      }
      if (st.style.timecode !== 'off') {
        const e = formatDuration(chronoAt(st.playback, now));
        const r = `−${formatDuration((1 - p) * st.playback.totalDuration)}`;
        if (elapsedRef.current && elapsedRef.current.textContent !== e) elapsedRef.current.textContent = e;
        if (remainingRef.current && remainingRef.current.textContent !== r) remainingRef.current.textContent = r;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Mesures de la mise en page réelle : paragraphes et position d'un caractère
  useEffect(() => {
    if (!onMetrics) return;
    const measure = () => {
      const el = textRef.current;
      const text = stateRef.current.text;
      if (!el) return null;
      const box = el.getBoundingClientRect();
      const scale = el.offsetHeight > 0 ? box.height / el.offsetHeight : 1;
      const flipped = mirrorRef.current === 'vertical' || mirrorRef.current === 'both';
      const st = stateRef.current.style;
      const travel = Math.max(el.offsetHeight - st.fontSize * st.lineHeight, 1);
      const nodes: Text[] = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n as Text);
      const locate = (offset: number): { node: Text; offset: number } | null => {
        let total = 0;
        for (const n of nodes) {
          const len = n.nodeValue?.length ?? 0;
          if (offset < total + len) return { node: n, offset: offset - total };
          total += len;
        }
        const last = nodes[nodes.length - 1];
        return last ? { node: last, offset: Math.max((last.nodeValue?.length ?? 1) - 1, 0) } : null;
      };
      const progressAtOffset = (offset: number): number | null => {
        const pos = locate(Math.max(0, Math.min(offset, text.length - 1)));
        if (!pos) return null;
        const range = document.createRange();
        range.setStart(pos.node, pos.offset);
        range.setEnd(pos.node, Math.min(pos.offset + 1, pos.node.nodeValue?.length ?? 0));
        const r = range.getClientRects()[0];
        if (!r) return null;
        const top = (flipped ? box.bottom - r.bottom : r.top - box.top) / scale;
        return Math.min(Math.max(top / travel, 0), 1);
      };
      return { text, progressAtOffset };
    };

    onMetrics({
      progressForOffset: (offset) => measure()?.progressAtOffset(offset) ?? null,
      stops: () => {
        const m = measure();
        if (!m) return [0];
        const stops = [0];
        const re = /\n\s*\n+/g;
        let match: RegExpExecArray | null;
        while ((match = re.exec(m.text))) {
          const idx = match.index + match[0].length;
          if (idx >= m.text.length) break;
          const p = m.progressAtOffset(idx);
          if (p !== null) stops.push(p);
        }
        return stops;
      },
    });
    return () => onMetrics(null);
  }, [onMetrics]);

  const lineY = height * style.readingLine;
  const marginPx = width * style.margin;
  const tri = Math.min(lineH * 0.4, 44);
  const cd = state.playback.countdown;
  const cdSize = Math.min(width, height) * 0.45;
  const tcSize = Math.max(16, Math.round(Math.min(width, height) * 0.045));

  return (
    <div
      className="canvas"
      style={{ width, height, transform: MIRROR_TRANSFORM[mirror], background: style.backgroundColor }}
    >
      <div className="canvas-fade">
        {style.showReadingLine && (
          <>
            <div
              className="canvas-band"
              style={{ top: lineY - lineH / 2, height: lineH }}
            />
            <svg className="canvas-marker" style={{ left: 8, top: lineY - tri / 2, fill: style.markerColor }} width={tri * 0.8} height={tri} viewBox="0 0 8 10">
              <path d="M0 0 L8 5 L0 10 Z" />
            </svg>
            <svg className="canvas-marker" style={{ right: 8, top: lineY - tri / 2, fill: style.markerColor }} width={tri * 0.8} height={tri} viewBox="0 0 8 10">
              <path d="M8 0 L0 5 L8 10 Z" />
            </svg>
          </>
        )}
        <div
          ref={textRef}
          className="canvas-text"
          style={{
            left: marginPx,
            width: Math.max(width - marginPx * 2, 1),
            fontSize: style.fontSize,
            lineHeight: style.lineHeight,
            textAlign: style.alignment,
            fontFamily: fontStack(style.fontFamily),
            fontWeight: style.fontWeight,
            fontStyle: style.italic ? 'italic' : 'normal',
            textTransform: style.uppercase ? 'uppercase' : 'none',
            color: style.textColor,
          }}
        >
          {segments.length === 0 ? ' ' : segments.map((seg, i) => (
            seg.style
              ? (
                <span
                  key={i}
                  style={{
                    color: seg.style.color,
                    fontWeight: seg.style.bold ? 800 : undefined,
                    fontStyle: seg.style.italic ? 'italic' : undefined,
                    fontFamily: seg.style.fontFamily ? fontStack(seg.style.fontFamily) : undefined,
                  }}
                >
                  {seg.text}
                </span>
              )
              : seg.text
          ))}
        </div>
      </div>

      {style.timecode !== 'off' && (
        <div className="canvas-timecode" style={{ fontSize: tcSize, color: style.textColor }}>
          {(style.timecode === 'elapsed' || style.timecode === 'both') && (
            <span ref={elapsedRef} className={state.playback.isPlaying ? 'tc-live' : ''} />
          )}
          {(style.timecode === 'remaining' || style.timecode === 'both') && (
            <span ref={remainingRef} className="tc-remaining" />
          )}
        </div>
      )}

      {cd !== null && (
        <div className="canvas-countdown">
          <div
            className="canvas-countdown-ring"
            style={{ width: cdSize, height: cdSize, borderWidth: Math.max(cdSize * 0.03, 2) }}
          >
            <span key={cd} style={{ fontSize: cdSize * 0.6 }}>{cd}</span>
          </div>
        </div>
      )}

      {state.blackout && <div className="canvas-blackout" />}
    </div>
  );
}
