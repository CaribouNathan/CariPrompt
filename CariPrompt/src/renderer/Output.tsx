import { useEffect, useState } from 'react';
import type { OutputState } from '../shared/types';
import { PrompterCanvas } from './PrompterCanvas';

const EMPTY: OutputState = {
  text: '',
  fontSize: 72,
  alignment: 'left',
  margin: 0.08,
  readingLine: 0.33,
  mirror: 'none',
  showReadingLine: true,
  playback: { anchorProgress: 0, anchorTime: 0, isPlaying: false, countdown: null, totalDuration: 0 },
};

/** Fenêtre plein écran de l'écran de sortie. */
export function Output() {
  const [state, setState] = useState<OutputState>(EMPTY);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => window.cari.onOutputState(setState), []);
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="output-root">
      <PrompterCanvas state={state} width={size.w} height={size.h} mirror={state.mirror} />
    </div>
  );
}
