/**
 * Éditeur de sous-titres : découpe, minutage et export SRT d'une prise transcrite.
 */
import { useEffect, useRef, useState } from 'react';
import { formatDuration } from '../shared/types';
import { IconCheck, IconClose, IconDownload, IconMerge, IconPause, IconPlay, IconScissors, IconStop } from './icons';
import { api, useStore } from './store';
import { CPS_MAX, cps, LINE_MAX, parseTime, srtTime } from './subtitles';
import { audioMime } from './wav';
import { useT } from './useT';

// MARK: - Éditeur de sous-titres

export function SubtitleEditor() {
  const takeId = useStore((s) => s.subtitleTakeId);
  const take = useStore((s) => s.takes.find((x) => x.id === s.subtitleTakeId) ?? null);
  const setEditing = useStore((s) => s.setEditing);
  const st = useStore.getState();
  const t = useT();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [confirmRebuild, setConfirmRebuild] = useState(false);
  const caret = useRef<{ id: string; pos: number } | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Lecture de l'audio de la prise, avec son propre lecteur
  useEffect(() => {
    if (!take) return undefined;
    let url = '';
    let cancelled = false;
    setEditing(true);
    api.readTakeAudio(take.file).then((data) => {
      if (cancelled) return;
      url = URL.createObjectURL(new Blob([data], { type: audioMime(take.file) }));
      const a = new Audio(url);
      a.ontimeupdate = () => setTime(a.currentTime);
      a.onplay = () => setPlaying(true);
      a.onpause = () => setPlaying(false);
      audioRef.current = a;
    }).catch(() => undefined);
    return () => {
      cancelled = true;
      audioRef.current?.pause();
      audioRef.current = null;
      if (url) URL.revokeObjectURL(url);
      setEditing(false);
      setPlaying(false);
      setTime(0);
    };
    // Recharger seulement quand on change de prise
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [takeId]);

  // Espace : lecture / pause, Échap : fermer — sauf pendant la saisie d'un texte
  useEffect(() => {
    if (!takeId) return undefined;
    const key = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.tagName === 'TEXTAREA' || (e.target as HTMLElement)?.tagName === 'INPUT';
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); st.openSubtitles(null); return; }
      if (typing) { e.stopPropagation(); return; }
      if (e.key === ' ') {
        e.preventDefault(); e.stopPropagation();
        const a = audioRef.current;
        if (a) { if (a.paused) a.play().catch(() => undefined); else a.pause(); }
        return;
      }
      e.stopPropagation();
    };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [takeId, st]);

  const cues = take?.subtitles ?? [];
  const activeId = cues.find((c) => time >= c.start && time < c.end)?.id ?? null;

  // Le sous-titre en cours reste visible pendant la lecture
  useEffect(() => {
    if (!playing || !activeId) return;
    listRef.current?.querySelector(`[data-cue="${activeId}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeId, playing]);

  if (!take) return null;

  const seek = (sec: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, sec);
    setTime(a.currentTime);
  };
  const toggle = () => {
    const a = audioRef.current;
    if (a) { if (a.paused) a.play().catch(() => undefined); else a.pause(); }
  };
  const over = cues.filter((c) => cps(c) > CPS_MAX + 0.5).length;

  return (
    <div className="modal-backdrop">
      <div className="modal subs" role="dialog" aria-label={t('subTitle', { name: take.name })}>
        <div className="subs-head">
          <h4>{t('subTitle', { name: take.name })}</h4>
          <span className="subs-count">{t('subCount', { n: cues.length })}{over ? ` · ${t('subOver', { n: over })}` : ''}</span>
        </div>

        <div className="subs-player">
          <button type="button" className="play-btn small" onMouseDown={(e) => e.preventDefault()} onClick={toggle}>
            {playing ? <IconPause size={14} /> : <IconPlay size={14} />}
          </button>
          <input type="range" min={0} max={take.duration} step={0.01} value={time}
            onChange={(e) => seek(Number(e.target.value))} />
          <span className="num subs-time">{srtTime(time).slice(3, 10)} / {srtTime(take.duration).slice(3, 8)}</span>
        </div>

        <div className="subs-list" ref={listRef}>
          {cues.map((c, i) => {
            const rate = cps(c);
            const lines = c.text.split('\n');
            const long = lines.some((l) => l.length > LINE_MAX) || lines.length > 2;
            return (
              <div key={c.id} data-cue={c.id} className={`cue${c.id === activeId ? ' active' : ''}`}>
                <button type="button" className="cue-index" title={t('subPlayFrom')}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { seek(c.start); audioRef.current?.play().catch(() => undefined); }}>
                  {i + 1}
                </button>
                <div className="cue-times">
                  <TimeField value={c.start} onChange={(v) => st.updateCue(take.id, c.id, { start: v })} />
                  <TimeField value={c.end} onChange={(v) => st.updateCue(take.id, c.id, { end: v })} />
                </div>
                <textarea
                  className={`cue-text${long ? ' warn' : ''}`}
                  value={c.text}
                  rows={2}
                  spellCheck
                  onChange={(e) => st.updateCue(take.id, c.id, { text: e.target.value })}
                  onSelect={(e) => { caret.current = { id: c.id, pos: (e.target as HTMLTextAreaElement).selectionStart }; }}
                  onFocus={() => seek(c.start)}
                />
                <div className="cue-side">
                  <span className={`cue-cps${rate > CPS_MAX + 0.5 ? ' warn' : ''}`} title={t('subCpsHelp')}>
                    {rate.toFixed(0)} {t('subCps')}
                  </span>
                  <div className="cue-tools">
                    <button type="button" title={t('subSplit')} onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        const pos = caret.current?.id === c.id ? caret.current.pos : Math.floor(c.text.length / 2);
                        st.splitCueAt(take.id, c.id, pos);
                      }}><IconScissors size={12} /></button>
                    <button type="button" title={t('subMerge')} disabled={i === cues.length - 1}
                      onMouseDown={(e) => e.preventDefault()} onClick={() => st.mergeCueWithNext(take.id, c.id)}>
                      <IconMerge size={12} /></button>
                    <button type="button" title={t('delete')} onMouseDown={(e) => e.preventDefault()}
                      onClick={() => st.deleteCue(take.id, c.id)}><IconClose size={11} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="note">{t('subNorms')}</p>
        <div className="modal-actions subs-actions">
          <button type="button" className={`push-btn${confirmRebuild ? ' danger' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onBlur={() => setConfirmRebuild(false)}
            onClick={() => {
              if (!confirmRebuild) { setConfirmRebuild(true); return; }
              setConfirmRebuild(false);
              st.rebuildSubtitles(take.id);
            }}>
            {confirmRebuild ? t('subConfirm') : t('subRebuild')}
          </button>
          <span className="spacer" />
          <button type="button" className="push-btn" onMouseDown={(e) => e.preventDefault()}
            onClick={() => st.exportSrt(take.id)}>{t('subExport')}</button>
          <button type="button" className="push-btn primary" onMouseDown={(e) => e.preventDefault()}
            onClick={() => st.openSubtitles(null)}>{t('subClose')}</button>
        </div>
      </div>
    </div>
  );
}

/** Champ de temps hh:mm:ss,mmm, validé à la sortie ; flèches ↑/↓ pour ±0,1 s */
function TimeField({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? srtTime(value).slice(3);
  const commit = () => {
    if (draft === null) return;
    const v = parseTime(draft);
    if (v !== null) onChange(v);
    setDraft(null);
  };
  return (
    <input
      className="time-field num"
      value={shown}
      spellCheck={false}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { commit(); (e.target as HTMLInputElement).blur(); }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          setDraft(null);
          onChange(Math.max(0, value + (e.key === 'ArrowUp' ? 0.1 : -0.1)));
        }
      }}
    />
  );
}
