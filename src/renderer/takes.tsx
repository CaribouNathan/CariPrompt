/**
 * Prises audio : la liste, la transcription et la comparaison au texte lu.
 */
import { Fragment, useEffect, useRef, useState } from 'react';
import type { StringKey } from '../shared/i18n';
import { formatDuration, STT_MODEL_IDS, type SttModelId, type Take } from '../shared/types';
import {
  IconCheck, IconClose, IconDownload, IconMic, IconPlay, IconSpeak, IconStop, IconWarning,
} from './icons';
import { api, useStore } from './store';
import { audioMime } from './wav';
import { useT } from './useT';
import { ChoiceButton, Row, Toggle } from './widgets';

export function TakeList() {
  const allTakes = useStore((s) => s.takes);
  const currentId = useStore((s) => s.current()?.id ?? null);
  const playingId = useStore((s) => s.playingTakeId);
  const compareIds = useStore((s) => s.compareIds);
  const recording = useStore((s) => s.recording);
  const recStats = useStore((s) => s.recStats);
  const st = useStore.getState();
  const t = useT();
  const [openId, setOpenId] = useState<string | null>(null);
  // Les prises appartiennent au texte pour lequel elles ont été enregistrées ;
  // l'interrupteur reste le seul moyen d'atteindre celles d'un texte supprimé.
  const [showAll, setShowAll] = useState(false);

  const takes = showAll ? allTakes : allTakes.filter((tk) => tk.scriptId === currentId);
  const others = allTakes.length - takes.length;

  const scopeToggle = (allTakes.length > 0 || showAll) && (
    <label className="take-scope">
      <input type="checkbox" checked={showAll} tabIndex={-1}
        onChange={(e) => setShowAll(e.target.checked)} />
      <span>{t('allTakes')}{others > 0 && !showAll ? ` (${others})` : ''}</span>
    </label>
  );

  if (takes.length === 0 && !recording) {
    return (
      <>
        <p className="note">{allTakes.length === 0 ? t('noTakes') : t('noTakesForScript')}</p>
        {scopeToggle}
      </>
    );
  }

  const compared = takes.filter((tk) => compareIds.includes(tk.id));

  return (
    <div className="take-list">
      {scopeToggle}
      {takes.map((tk) => {
        const open = openId === tk.id;
        return (
          <div key={tk.id} className={`take${open ? ' open' : ''}`}>
            <div className="take-head">
              <button
                type="button"
                className="take-play"
                title={playingId === tk.id ? t('stopPlayback') : t('playTake')}
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => (playingId === tk.id ? st.stopTakePlayback() : st.playTake(tk.id))}
              >
                {playingId === tk.id ? <IconStop size={11} /> : <IconPlay size={11} />}
              </button>
              <input
                className="take-name"
                type="text"
                value={tk.name}
                disabled={tk.locked}
                title={tk.locked ? t('lockedTake') : t('renameTake')}
                onChange={(e) => st.renameTake(tk.id, e.target.value)}
                onFocus={() => st.setEditing(true)}
                onBlur={() => st.setEditing(false)}
              />
              <span className="take-dur">{formatDuration(tk.duration)}</span>
              <button type="button" className="take-btn" title={tk.locked ? t('unlockTake') : t('lockTake')}
                tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => st.toggleTakeLock(tk.id)}>
                {tk.locked ? '🔒' : '🔓'}
              </button>
              <button type="button" className="take-btn" title={t('analysis')}
                tabIndex={-1} onMouseDown={(e) => e.preventDefault()}
                onClick={() => setOpenId(open ? null : tk.id)}>
                {open ? '▾' : '▸'}
              </button>
            </div>

            {open && (
              <div className="take-body">
                <div className="take-meta">
                  {new Date(tk.createdAt).toLocaleString()} · {tk.scriptTitle && t('takeOf', { title: tk.scriptTitle })}
                </div>
                {tk.analysis && (
                  <dl className="take-stats">
                    <dt>{t('anSpeechRate')}</dt><dd>{tk.analysis.speechRate} {t('wpm')}</dd>
                    <dt>{t('anDrift')}</dt><dd>{tk.analysis.drift > 0 ? '+' : ''}{tk.analysis.drift} %</dd>
                    <dt>{t('anPauses')}</dt><dd>{tk.analysis.pauses}</dd>
                    <dt>{t('anSilence')}</dt><dd>{tk.analysis.silence} s</dd>
                    <dt>{t('anSpeaking')}</dt><dd>{Math.round(tk.analysis.speaking * 100)} %</dd>
                    <dt>{t('anIrregularity')}</dt><dd>{tk.analysis.irregularity} %</dd>
                  </dl>
                )}
                <TakeSpeech take={tk} />
                <textarea
                  className="take-note"
                  value={tk.note}
                  placeholder={t('takeNote')}
                  onChange={(e) => st.setTakeNote(tk.id, e.target.value)}
                  onFocus={() => st.setEditing(true)}
                  onBlur={() => st.setEditing(false)}
                />
                {tk.markers.length > 0 && (
                  <div className="take-markers">
                    {tk.markers.map((m) => (
                      <button key={m.id} type="button" className="take-marker" tabIndex={-1}
                        onMouseDown={(e) => e.preventDefault()} onClick={() => st.removeTakeMarker(tk.id, m.id)}>
                        {formatDuration(m.time)} <IconClose size={9} />
                      </button>
                    ))}
                  </div>
                )}
                <div className="take-actions">
                  <button type="button" tabIndex={-1} onMouseDown={(e) => e.preventDefault()}
                    onClick={() => st.toggleCompare(tk.id)}>
                    {compareIds.includes(tk.id) ? '✓ ' : ''}{t('compareTakes')}
                  </button>
                  <button type="button" tabIndex={-1} onMouseDown={(e) => e.preventDefault()}
                    onClick={() => st.revealTake(tk.id)}>{t('revealTake')}</button>
                  <button type="button" tabIndex={-1} onMouseDown={(e) => e.preventDefault()}
                    onClick={() => st.exportTake(tk.id)}>{t('exportTake')}</button>
                  <button type="button" className="danger" tabIndex={-1} disabled={tk.locked}
                    onMouseDown={(e) => e.preventDefault()} onClick={() => st.deleteTake(tk.id)}>
                    {t('deleteTake')}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {recording && recStats && (
        <p className="note">{t('recording')} · {formatDuration(recStats.elapsed)} · {Math.round(recStats.speechRate)} {t('wpm')}</p>
      )}

      {compared.length === 2 && (
        <table className="compare">
          <thead>
            <tr><th /><th>{compared[0].name}</th><th>{compared[1].name}</th></tr>
          </thead>
          <tbody>
            <tr><td>{t('duration')}</td>{compared.map((c) => <td key={c.id}>{formatDuration(c.duration)}</td>)}</tr>
            <tr><td>{t('anSpeechRate')}</td>{compared.map((c) => <td key={c.id}>{c.analysis?.speechRate ?? '—'}</td>)}</tr>
            <tr><td>{t('anDrift')}</td>{compared.map((c) => <td key={c.id}>{c.analysis ? `${c.analysis.drift} %` : '—'}</td>)}</tr>
            <tr><td>{t('anPauses')}</td>{compared.map((c) => <td key={c.id}>{c.analysis?.pauses ?? '—'}</td>)}</tr>
            <tr><td>{t('anIrregularity')}</td>{compared.map((c) => <td key={c.id}>{c.analysis ? `${c.analysis.irregularity} %` : '—'}</td>)}</tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

// MARK: - Transcription

const STT_LABEL: Record<SttModelId, StringKey> = { turbo: 'sttModelTurbo', small: 'sttModelSmall', base: 'sttModelBase' };

export function TranscriptionPanel() {
  const settings = useStore((s) => s.settings);
  const models = useStore((s) => s.sttModels);
  const dl = useStore((s) => s.sttDownload);
  const st = useStore.getState();
  const t = useT();

  useEffect(() => {
    useStore.getState().loadSttModels().catch(() => undefined);
  }, []);

  const chosen = settings.sttModel;
  const info = models?.find((m) => m.id === chosen);
  // Même règle que le processus principal : le plus léger des modèles installés
  const trackModel = (['base', 'small', 'turbo'] as SttModelId[]).find((id) => models?.find((m) => m.id === id)?.installed) ?? null;
  const busy = !!dl;
  const pct = dl ? Math.round((dl.done / Math.max(dl.total, 1)) * 100) : 0;

  return (
    <>
      <Row label={t('sttModel')}>
        <ChoiceButton
          value={chosen}
          options={STT_MODEL_IDS.map((id) => {
            const m = models?.find((x) => x.id === id);
            return { id, label: `${t(STT_LABEL[id])}${m?.installed ? ' ✓' : ''}` };
          })}
          onChange={(v) => !busy && st.setSetting('sttModel', v as SttModelId)}
        />
      </Row>

      {dl ? (
        <div className="ai-progress">
          <div className="ai-progress-row">
            <span>{dl.phase === 'download' ? t('sttDownloading', { pct }) : t('sttExtracting', { pct })}</span>
            <button type="button" className="link-btn" tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()} onClick={() => st.cancelSttDownload()}>
              {t('cancel')}
            </button>
          </div>
          <div className="ai-bar">
            <div className={`ai-bar-fill${dl.phase === 'extract' && dl.done === 0 ? ' indeterminate' : ''}`}
              style={{ width: dl.phase === 'extract' && dl.done === 0 ? undefined : `${pct}%` }} />
          </div>
        </div>
      ) : info?.installed ? (
        <Row label={t('sttInstalled')}>
          <button type="button" className="link-btn danger-link" tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()} onClick={() => st.deleteSttModel(chosen)}>
            {t('sttDeleteModel', { size: info.diskMB })}
          </button>
        </Row>
      ) : (
        <div className="ai-actions">
          <button type="button" className="push-btn" tabIndex={-1} disabled={!models}
            onMouseDown={(e) => e.preventDefault()} onClick={() => st.downloadSttModel(chosen)}>
            <IconDownload size={14} />{t('sttDownloadModel', { size: info?.downloadMB ?? '…' })}
          </button>
        </div>
      )}

      <Row label={t('sttAuto')}>
        <Toggle checked={settings.sttAuto} onChange={(v) => st.setSetting('sttAuto', v)} />
      </Row>
      <Row label={t('trackModelRow')}>
        <span className="num">{trackModel ? t(STT_LABEL[trackModel]).split(' — ')[0] : t('spNone')}</span>
      </Row>
      <p className="note">{t('trackNote')}</p>
      <p className="note">{t('sttNote', { disk: info?.diskMB ?? '…' })}</p>
    </>
  );
}

function TakeSpeech({ take }: { take: Take }) {
  const job = useStore((s) => s.sttJobs[take.id]);
  const models = useStore((s) => s.sttModels);
  const model = useStore((s) => s.settings.sttModel);
  const scriptExists = useStore((s) => s.scripts.some((x) => x.id === take.scriptId));
  const st = useStore.getState();
  const t = useT();
  const installed = !!models?.find((m) => m.id === model)?.installed;
  const sp = take.speech;

  if (job) {
    const pct = Math.round((job.done / Math.max(job.total, 1)) * 100);
    return (
      <div className="ai-progress take-stt">
        <div className="ai-progress-row">
          <span>{t('transcribing', { pct })}</span>
          <button type="button" className="link-btn" tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()} onClick={() => st.cancelTranscription(take.id)}>
            {t('cancel')}
          </button>
        </div>
        <div className="ai-bar"><div className={`ai-bar-fill${job.done === 0 ? ' indeterminate' : ''}`}
          style={{ width: job.done === 0 ? undefined : `${pct}%` }} /></div>
      </div>
    );
  }

  const goTo = (offset: number) => {
    if (!take.scriptId) return;
    st.select(take.scriptId);
    // L'aperçu doit avoir mis le texte en page avant qu'on y cherche la position
    requestAnimationFrame(() => requestAnimationFrame(() => st.jumpToOffset(offset)));
  };

  return (
    <div className="take-speech">
      {sp && take.transcript && (
        <>
          <div className="take-speech-title">{t('speechTitle')}</div>
          <dl className="take-stats">
            {scriptExists && <><dt>{t('spFidelity')}</dt><dd>{Math.round(sp.fidelity * 100)} %</dd></>}
            <dt>{t('spRate')}</dt><dd>{sp.wordsPerMinute} {t('wpm')}</dd>
            {scriptExists && <><dt>{t('spAdded')}</dt><dd>{sp.added}</dd></>}
            <dt>{t('spFillers')}</dt>
            <dd>{sp.fillers.length ? sp.fillers.map((f) => `${f.word} ×${f.count}`).join(', ') : t('spNone')}</dd>
            <dt>{t('spRepetitions')}</dt>
            <dd>{sp.repetitions.length ? sp.repetitions.map((r) => `« ${r.text} »`).join(', ') : t('spNone')}</dd>
            <dt>{t('spHesitations')}</dt>
            <dd>{sp.hesitations.length ? sp.hesitations.map((h) => `${formatDuration(h.time)} (${h.length} s)`).join(', ') : t('spNone')}</dd>
          </dl>
          {scriptExists && (
            <div className="take-skipped">
              <div className="take-skipped-title">{t('spSkipped')} · {sp.skipped.length || t('spNone')}</div>
              {sp.skipped.map((p) => (
                <button key={p.offset} type="button" className="take-skip" tabIndex={-1} title={t('spGoTo')}
                  onMouseDown={(e) => e.preventDefault()} onClick={() => goTo(p.offset)}>
                  « {p.text} »
                </button>
              ))}
            </div>
          )}
          {!scriptExists && <p className="note">{t('spNoScript')}</p>}
        </>
      )}
      <div className="take-actions">
        {take.transcript && (
          <button type="button" tabIndex={-1} onMouseDown={(e) => e.preventDefault()}
            onClick={() => st.openSubtitles(take.id)}>{t('subtitles')}</button>
        )}
        <button type="button" tabIndex={-1} disabled={!installed}
          title={installed ? undefined : t('sttErrNoModel')}
          onMouseDown={(e) => e.preventDefault()} onClick={() => st.transcribeTake(take.id)}>
          {take.transcript ? t('retranscribe') : t('transcribe')}
        </button>
      </div>
    </div>
  );
}
