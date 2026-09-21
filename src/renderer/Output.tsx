import { useEffect, useState } from 'react';
import type { Lang } from '../shared/i18n';
import type { OutputState } from '../shared/types';
import { PrompterCanvas } from './PrompterCanvas';
import { DEFAULT_SETTINGS, textStyle } from './store';

const EMPTY: OutputState = {
  text: '',
  marks: [],
  hint: null,
  recording: false,
  style: textStyle(DEFAULT_SETTINGS),
  mirror: 'none',
  blackout: false,
  playback: {
    anchorProgress: 0, anchorTime: 0, isPlaying: false, countdown: null,
    totalDuration: 0, chronoMs: 0, chronoStartedAt: null,
  },
};

/** Fenêtre plein écran de l'écran de sortie. */
export function Output() {
  const [state, setState] = useState<OutputState>(EMPTY);
  const [lang, setLang] = useState<Lang>('en');
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => window.cari.onOutputState(setState), []);
  useEffect(() => window.cari.onPrefsChanged((p) => setLang(p.language)), []);
  useEffect(() => { window.cari.getPrefs().then((p) => setLang(p.language)).catch(() => undefined); }, []);
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="output-root">
      <PrompterCanvas state={state} lang={lang} width={size.w} height={size.h} mirror={state.mirror} />
    </div>
  );
}
