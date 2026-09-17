import { useEffect, useRef } from 'react';
import { LINE_HEIGHT, progressAt, type Mirror, type OutputState } from '../shared/types';

const MIRROR_TRANSFORM: Record<Mirror, string> = {
  none: 'none',
  horizontal: 'scaleX(-1)',
  vertical: 'scaleY(-1)',
  both: 'scale(-1, -1)',
};

interface Props {
  state: OutputState;
  width: number;
  height: number;
  mirror: Mirror;
}

/**
 * Rendu identique pour l'aperçu et l'écran de sortie.
 * Le défilement est appliqué directement au DOM à chaque image (requestAnimationFrame),
 * sans passer par React : aucune saccade liée au rendu de l'interface.
 */
export function PrompterCanvas({ state, width, height, mirror }: Props) {
  const textRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  const sizeRef = useRef({ width, height });
  const textHeightRef = useRef(0);

  stateRef.current = state;
  sizeRef.current = { width, height };

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
      const { height: h } = sizeRef.current;
      const lineH = st.fontSize * LINE_HEIGHT;
      const travel = Math.max(textHeightRef.current - lineH, 0);
      const p = progressAt(st.playback, Date.now());
      const y = h * st.readingLine - lineH / 2 - p * travel;
      if (y !== lastY && textRef.current) {
        textRef.current.style.transform = `translate3d(0, ${y}px, 0)`;
        lastY = y;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const lineH = state.fontSize * LINE_HEIGHT;
  const lineY = height * state.readingLine;
  const marginPx = width * state.margin;
  const tri = Math.min(lineH * 0.4, 44);
  const cd = state.playback.countdown;
  const cdSize = Math.min(width, height) * 0.45;

  return (
    <div
      className="canvas"
      style={{ width, height, transform: MIRROR_TRANSFORM[mirror] }}
    >
      <div className="canvas-fade">
        {state.showReadingLine && (
          <>
            <div
              className="canvas-band"
              style={{ top: lineY - lineH / 2, height: lineH }}
            />
            <svg className="canvas-marker" style={{ left: 8, top: lineY - tri / 2 }} width={tri * 0.8} height={tri} viewBox="0 0 8 10">
              <path d="M0 0 L8 5 L0 10 Z" />
            </svg>
            <svg className="canvas-marker" style={{ right: 8, top: lineY - tri / 2 }} width={tri * 0.8} height={tri} viewBox="0 0 8 10">
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
            fontSize: state.fontSize,
            lineHeight: LINE_HEIGHT,
            textAlign: state.alignment,
          }}
        >
          {state.text || ' '}
        </div>
      </div>

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
    </div>
  );
}
