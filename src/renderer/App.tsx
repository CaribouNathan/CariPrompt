import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent as RMouseEvent, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { tr, type StringKey } from '../shared/i18n';
import { applyStyle, styleAt, type MarkStyle } from '../shared/marks';
import {
  formatDuration, FONT_MAX, FONT_MIN, FONT_STEP, LINE_HEIGHT_MAX, LINE_HEIGHT_MIN, progressAt,
  SPEED_MAX, SPEED_MIN, SPEED_STEP, AI_DEFAULT_MODELS, AI_PROVIDERS, AI_TARGETS, STT_MODEL_IDS,
  type SttModelId, type Take,
  INSPECTOR_BLOCKS, INSPECTOR_TABS, type AiProvider, type AiTask, type ClickerAction, type InspectorBlockId,
  type InspectorTabId, type Mirror, type OutputState, type StyleMark,
  type TimecodeMode, type WheelMode,
} from '../shared/types';
import iconUrl from '../../build/icons/64x64.png';
import {
  IconBack10, IconCheck, IconClock, IconClose, IconCompose, IconDoc, IconFast, IconFwd10,
  IconGauge, IconHauteSavoie, IconImport, IconKeyboard, IconMenu, IconPause, IconPencil, IconPlay, IconScreen,
  IconBold, IconClear, IconExitFullscreen, IconFullscreen, IconItalic, IconMic, IconRedo, IconScreenOff,
  IconDownload, IconWave, IconMerge, IconScissors, IconSearch, IconSpeak, IconStop, IconTranslate, IconUndo,
  IconSidebarRight, IconSlow, IconTextSize, IconWarning, IconInfo, IconCountdown, IconFlag,
} from './icons';
import { PrompterCanvas } from './PrompterCanvas';
import { CPS_MAX, cps, LINE_MAX, parseTime, srtTime } from './subtitles';
import { audioMime } from './wav';
import { RichEditor, type Selection } from './RichEditor';
import {
  AI_PROVIDER_NAMES, api, displayTitle, effectiveSpeed, normalizeForSearch, registerPreviewMetrics, targetSpeed, textStyle,
  totalDuration, useStore,
} from './store';

function useT() {
  const lang = useStore((s) => s.settings.language);
  return useCallback((key: StringKey, vars?: Record<string, string | number>) => tr(lang, key, vars), [lang]);
}

export function App() {
  const showInspector = useStore((s) => s.settings.showInspector);
  const dropActive = useStore((s) => s.dropActive);
  const fullscreen = useStore((s) => s.fullscreen);
  useFileDrop();

  return (
    <div className="app">
      {fullscreen && <FullscreenView />}
      <TitleBar />
      <div className="workspace">
        <Sidebar />
        <Editor />
        <Stage />
        {showInspector && <Inspector />}
      </div>
      <BannerView />
      <AlertDialog />
      <SubtitleEditor />
      {dropActive && <DropOverlay />}
    </div>
  );
}

// MARK: - Glisser-déposer

function useFileDrop() {
  const setDropActive = useStore((s) => s.setDropActive);
  const importPaths = useStore((s) => s.importPaths);

  useEffect(() => {
    let depth = 0;
    const hasFiles = (e: DragEvent) => !!e.dataTransfer?.types.includes('Files');

    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth++;
      setDropActive(true);
    };
    const over = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDropActive(false);
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
      depth = 0;
      setDropActive(false);
      const paths = Array.from(e.dataTransfer?.files ?? [])
        .map((f) => api.pathForFile(f))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      importPaths(paths);
    };

    // Phase de capture : le dépôt dans la zone de texte est intercepté avant le navigateur
    window.addEventListener('dragenter', enter, true);
    window.addEventListener('dragover', over, true);
    window.addEventListener('dragleave', leave, true);
    window.addEventListener('drop', drop, true);
    return () => {
      window.removeEventListener('dragenter', enter, true);
      window.removeEventListener('dragover', over, true);
      window.removeEventListener('dragleave', leave, true);
      window.removeEventListener('drop', drop, true);
    };
  }, [setDropActive, importPaths]);
}

// MARK: - Barre de titre

function TitleBar() {
  const info = useStore((s) => s.info);
  const outputActive = useStore((s) => s.outputActive);
  const hasOutput = useStore((s) => s.settings.outputDisplayId !== null);
  const toggleOutput = useStore((s) => s.toggleOutput);
  const setSetting = useStore((s) => s.setSetting);
  const showInspector = useStore((s) => s.settings.showInspector);
  const setFullscreen = useStore((s) => s.setFullscreen);
  const countdown = useStore((s) => s.settings.countdownEnabled);
  const update = useStore((s) => s.update);
  const isMac = info.platform === 'darwin';
  const t = useT();

  return (
    <header className={`titlebar ${isMac ? 'mac' : 'overlay'}`}>
      <div className="titlebar-brand">
        <ToolButton
          label={t('menu')}
          onClick={(e) => {
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
            api.openAppMenu(r.left, r.bottom + 4);
          }}
        >
          <IconMenu size={18} />
        </ToolButton>
        <img src={iconUrl} alt="" width={22} height={22} draggable={false} />
        <span className="brand-name">CariPrompt</span>
        <span className="brand-version">{info.version}</span>
        {update?.newer && (
          <button
            type="button" className="update-dot" tabIndex={-1}
            title={`${t('updateAvailable', { version: update.version })} — ${t('updatePage')}`}
            onMouseDown={(e) => e.preventDefault()} onClick={() => api.openLink(update.url)}
          >
            {update.version}
          </button>
        )}
      </div>
      <div className="titlebar-center">
        <StatusPill />
      </div>
      <div className="titlebar-actions">
        <ToolButton
          label={countdown ? t('countdownOn') : t('countdownOff')}
          active={countdown}
          onClick={() => setSetting('countdownEnabled', !countdown)}
        >
          <IconCountdown size={17} />
          <span>{t('countdown')}</span>
        </ToolButton>
        <ToolButton
          label={outputActive ? t('hideOutput') : t('showOutput')}
          shortcut={isMac ? '⌘⇧D' : `Ctrl+${t('keyShift')}D`}
          disabled={!hasOutput}
          danger={outputActive}
          onClick={toggleOutput}
        >
          {outputActive ? <IconScreenOff size={17} /> : <IconScreen size={17} />}
          <span>{outputActive ? t('hideOutput') : t('showOutput')}</span>
        </ToolButton>
        <ToolButton
          label={t('fullscreen')}
          shortcut={isMac ? '⌘⇧F' : `Ctrl+${t('keyShift')}F`}
          onClick={() => setFullscreen(true)}
        >
          <IconFullscreen size={17} />
          <span>{t('fullscreen')}</span>
        </ToolButton>
        <ToolButton
          label={t('settings')}
          active={showInspector}
          onClick={() => setSetting('showInspector', !showInspector)}
        >
          <IconSidebarRight size={17} />
        </ToolButton>
      </div>
    </header>
  );
}

function ToolButton(props: {
  label: string; shortcut?: string; disabled?: boolean; active?: boolean; danger?: boolean;
  onClick: (e: RMouseEvent<HTMLButtonElement>) => void; children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`tool-btn${props.active ? ' active' : ''}${props.danger ? ' danger' : ''}`}
      title={props.shortcut ? `${props.label} (${props.shortcut})` : props.label}
      aria-label={props.label}
      disabled={props.disabled}
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

function StatusPill() {
  const cur = useStore((s) => s.current());
  const fontSize = useStore((s) => s.settings.fontSize);
  const outputActive = useStore((s) => s.outputActive);
  const t = useT();
  return (
    <div className="status-pill">
      <span><IconGauge size={14} />{t('speed')} {Math.round(effectiveSpeed(cur))}</span>
      <span><IconClock size={14} />{formatDuration(totalDuration(cur))}</span>
      <span><IconTextSize size={14} />{fontSize} pt</span>
      <span className={`dot${outputActive ? ' on' : ''}`} title={outputActive ? t('outputActive') : t('outputInactive')} />
    </div>
  );
}

// MARK: - Bibliothèque

function Sidebar() {
  const scripts = useStore((s) => s.scripts);
  const selectedId = useStore((s) => s.settings.selectedScriptId);
  const selectedIds = useStore((s) => s.selectedIds);
  const query = useStore((s) => s.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const {
    select, selectRange, toggleSelect, createScript, importDialog,
    duplicate, duplicateMany, exportScript, remove, removeMany,
  } = useStore.getState();
  const isMac = useStore((s) => s.info.platform === 'darwin');
  const mod = isMac ? '⌘' : 'Ctrl+';
  const t = useT();

  const marked = (id: string) => (selectedIds.length > 1 ? selectedIds.includes(id) : id === selectedId);

  const needle = normalizeForSearch(query.trim());
  const shown = needle ? scripts.filter((x) => normalizeForSearch(displayTitle(x)).includes(needle)) : scripts;

  const click = (e: RMouseEvent, id: string) => {
    if (e.button !== 0) return;
    if (e.shiftKey) selectRange(id);
    else if (e.metaKey || e.ctrlKey) toggleSelect(id);
    else select(id);
  };

  const openMenu = async (id: string) => {
    const ids = selectedIds.length > 1 && selectedIds.includes(id) ? selectedIds : [id];
    if (ids.length === 1) select(id);
    const choice = await api.scriptMenu(ids.length);
    if (choice === 'duplicate') duplicateMany(ids);
    else if (choice === 'export') exportScript(ids[0]);
    else if (choice === 'delete') removeMany(ids);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-title">{t('scripts')}</div>

      <div className="search-field">
        <IconSearch size={13} />
        <input
          type="search"
          value={query}
          placeholder={t('searchScripts')}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => useStore.getState().setEditing(true)}
          onBlur={() => useStore.getState().setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setSearchQuery(''); (e.target as HTMLInputElement).blur(); }
          }}
        />
        {query && (
          <button type="button" className="search-clear" title={t('clearSearch')} tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()} onClick={() => setSearchQuery('')}>
            <IconClose size={11} />
          </button>
        )}
      </div>

      <div className="sidebar-list" data-scroll>
        {shown.length === 0 && (
          <p className="search-empty">{t('searchNoResult', { q: query.trim() })}</p>
        )}
        {shown.map((s) => (
          <div
            key={s.id}
            className={`script-row${marked(s.id) ? ' selected' : ''}${s.id === selectedId ? ' current' : ''}`}
            onMouseDown={(e) => click(e, s.id)}
            onContextMenu={(e) => { e.preventDefault(); openMenu(s.id); }}
          >
            <IconDoc size={16} className="script-icon" />
            <div className="script-meta">
              <div className="script-title">
                {s.lang && <IconFlag lang={s.lang} size={11} />}
                {displayTitle(s)}
              </div>
              <div className="script-sub">
                {t('words', { n: s.wordCount })} · {formatDuration(totalDuration(s))}
                {s.targetEnabled && <span className="script-target"> · {t('target')}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <DropZone />
      <ShortcutsPanel />

      <div className="sidebar-footer">
        <ToolButton label={t('newScript')} shortcut={`${mod}N`} onClick={() => createScript()}>
          <IconCompose size={17} />
        </ToolButton>
        <ToolButton label={t('import')} shortcut={`${mod}O`} onClick={() => importDialog()}>
          <IconImport size={17} />
        </ToolButton>
      </div>
    </aside>
  );
}

/** Cible de dépôt visible en permanence */
function DropZone() {
  const dropActive = useStore((s) => s.dropActive);
  const importDialog = useStore((s) => s.importDialog);
  const t = useT();
  return (
    <button
      type="button"
      className={`drop-zone${dropActive ? ' active' : ''}`}
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => importDialog()}
    >
      <IconImport size={18} />
      <span className="drop-zone-title">{t('dropZone')}</span>
      <span className="drop-zone-sub">{t('dropZoneSub')}</span>
    </button>
  );
}

/** Rappel des raccourcis, en bas de la colonne de gauche */
function ShortcutsPanel() {
  const isMac = useStore((s) => s.info.platform === 'darwin');
  const [open, setOpen] = useState(true);
  const t = useT();
  const mod = isMac ? '⌘' : 'Ctrl+';
  const shift = isMac ? '⇧' : t('keyShift');

  return (
    <section className={`shortcuts-panel${open ? ' open' : ''}`}>
      <button
        type="button"
        className="shortcuts-head"
        tabIndex={-1}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        title={open ? t('hideShortcuts') : t('showShortcuts')}
      >
        <IconKeyboard size={14} />
        <span>{t('shortcutsTitle')}</span>
        <span className="chevron">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <dl className="shortcuts" data-scroll>
          <dt>{isMac ? '⌥' : 'Alt'} + {t('keySpace')}</dt><dd>{t('scPlayPause')}</dd>
          <dt>↓ / ↑</dt><dd>{t('scFasterSlower')}</dd>
          <dt>← / →</dt><dd>{t('scSeek')}</dd>
          <dt>+ / −</dt><dd>{t('scTextSize')}</dd>
          <dt>{t('keyWheel')}</dt><dd>{t('scFasterSlower')}</dd>
          <dt>B / .</dt><dd>{t('scBlackout')}</dd>
          <dt>{t('keyEsc')}</dt><dd>{t('scLeaveEditing')}</dd>
          <dt>{mod}{shift}F</dt><dd>{t('scFullscreen')}</dd>
          <dt>{mod}R</dt><dd>{t('scRewind')}</dd>
          <dt>{mod}{shift}D</dt><dd>{t('scOutput')}</dd>
          <dt>{mod}{shift}T</dt><dd>{t('btnVoiceTracking')}</dd>
          <dt>{mod}{shift}R</dt><dd>{t('btnAudioRec')}</dd>
          <dt>{mod}S / {mod}{shift}O</dt><dd>{t('scSaveOpen')}</dd>
          <dt>{mod}N / {mod}O</dt><dd>{t('scNewImport')}</dd>
          <dt>{mod}D / {mod}{shift}E</dt><dd>{t('scDuplicate')} · {t('scExport')}</dd>
        </dl>
      )}
    </section>
  );
}

// MARK: - Éditeur

const SPEAKER_COLORS = ['#ffffff', '#ffd60a', '#30d158', '#64d2ff', '#ff9f0a', '#ff453a', '#bf5af2', '#8e8e93'];

function Editor() {
  const cur = useStore((s) => s.current());
  const editing = useStore((s) => s.editing);
  const width = useStore((s) => s.settings.editorWidth);
  const { updateRich, rename, setEditing, setSetting, setMarks } = useStore.getState();
  const isMac = useStore((s) => s.info.platform === 'darwin');
  const [selection, setSelection] = useState<Selection | null>(null);
  const caretHint = useStore((s) => s.pendingCaret);
  const depth = useStore((s) => s.historyDepth);
  const t = useT();

  useEffect(() => setSelection(null), [cur?.id]);

  const startResize = (e: RPointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = width;
    const move = (ev: PointerEvent) => setSetting('editorWidth', Math.min(Math.max(startW + ev.clientX - startX, 280), 680));
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  if (!cur) return <section className="editor" style={{ width }} />;

  const hasSelection = !!selection && selection.end > selection.start;
  const current = hasSelection ? styleAt(cur.text, cur.marks, selection!.start, selection!.end) : null;

  const apply = (patch: Partial<MarkStyle> | null) => {
    if (!hasSelection) return;
    setMarks(applyStyle(cur.text, cur.marks, selection!.start, selection!.end, patch));
  };

  return (
    <section className="editor" style={{ width }}>
      <input
        className="editor-title"
        type="text"
        value={cur.autoTitle ? '' : cur.title}
        placeholder={displayTitle(cur)}
        onChange={(e) => rename(cur.id, e.target.value)}
        onFocus={() => setEditing(true)}
        onBlur={() => setEditing(false)}
        spellCheck={false}
      />

      <div className={`selection-bar${hasSelection ? '' : ' disabled'}`} title={hasSelection ? '' : t('selectionHint')}>
        <span className="selection-label">{t('selectionStyle')}</span>
        <div className="swatches">
          {SPEAKER_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`swatch${current?.color === c ? ' on' : ''}`}
              style={{ background: c }}
              title={c}
              tabIndex={-1}
              disabled={!hasSelection}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => apply({ color: c })}
            />
          ))}
        </div>
        <button type="button" className={`mark-btn${current?.bold ? ' on' : ''}`} title={t('markBold')}
          tabIndex={-1} disabled={!hasSelection} onMouseDown={(e) => e.preventDefault()}
          onClick={() => apply({ bold: !current?.bold })}>
          <IconBold size={15} />
        </button>
        <button type="button" className={`mark-btn${current?.italic ? ' on' : ''}`} title={t('markItalic')}
          tabIndex={-1} disabled={!hasSelection} onMouseDown={(e) => e.preventDefault()}
          onClick={() => apply({ italic: !current?.italic })}>
          <IconItalic size={15} />
        </button>
        <button type="button" className="mark-btn" title={t('clearFormat')}
          tabIndex={-1} disabled={!hasSelection} onMouseDown={(e) => e.preventDefault()}
          onClick={() => apply(null)}>
          <IconClear size={15} />
        </button>

        <span className="selection-sep" />

        <button type="button" className="mark-btn" title={`${t('undo')} (${isMac ? '⌘' : 'Ctrl+'}Z)`}
          tabIndex={-1} disabled={depth.past === 0} onMouseDown={(e) => e.preventDefault()}
          onClick={() => useStore.getState().undo()}>
          <IconUndo size={15} />
        </button>
        <button type="button" className="mark-btn" title={`${t('redo')} (${isMac ? '⌘⇧' : 'Ctrl+'}${isMac ? 'Z' : 'Y'})`}
          tabIndex={-1} disabled={depth.future === 0} onMouseDown={(e) => e.preventDefault()}
          onClick={() => useStore.getState().redo()}>
          <IconRedo size={15} />
        </button>
      </div>

      <RichEditor
        scriptId={cur.id}
        text={cur.text}
        marks={cur.marks}
        placeholder={t('textPlaceholder')}
        onChange={updateRich}
        onSelectionChange={setSelection}
        onCaretClick={(offset) => useStore.getState().jumpToOffset(offset)}
        onFocusChange={setEditing}
        caretHint={caretHint}
        onCaretConsumed={() => useStore.getState().consumeCaret()}
      />

      <footer className="editor-footer">
        <span>{t('words', { n: cur.wordCount })}</span>
        <span className="editor-hint">
          {editing
            ? (<><IconKeyboard size={14} />{t('hintEditing')}</>)
            : (<><IconPencil size={13} />{t('hintIdle')}</>)}
        </span>
      </footer>
      <div className="resizer" onPointerDown={startResize} />
    </section>
  );
}

// MARK: - Scène (aperçu + transport)

const EMPTY_MARKS: StyleMark[] = [];

function useOutputState(): OutputState {
  const text = useStore((s) => s.current()?.text ?? '');
  const marks = useStore((s) => s.current()?.marks);
  const settings = useStore((s) => s.settings);
  const playback = useStore((s) => s.playback);
  const blackout = useStore((s) => s.blackout);
  const hint = useStore((s) => s.hint);
  const recording = useStore((s) => s.recording);
  return {
    text, marks: marks ?? EMPTY_MARKS, hint, recording,
    style: textStyle(settings), mirror: settings.mirror, blackout, playback,
  };
}

/** Plein écran : utilisation solo, le texte occupe toute la fenêtre */
function FullscreenView() {
  const state = useOutputState();
  const mirrorFullscreen = useStore((s) => s.settings.mirrorFullscreen);
  const lang = useStore((s) => s.settings.language);
  const setFullscreen = useStore((s) => s.setFullscreen);
  const t = useT();
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    let timer = window.setTimeout(() => setIdle(true), 2500);
    const onMove = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), 2500);
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <div className={`fullscreen${idle ? ' idle' : ''}`}>
      <PrompterCanvas
        state={state}
        lang={lang}
        width={size.w}
        height={size.h}
        mirror={mirrorFullscreen ? state.mirror : 'none'}
      />
      <button
        type="button"
        className="fullscreen-exit"
        tabIndex={-1}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setFullscreen(false)}
      >
        <IconExitFullscreen size={16} />
        <span>{t('exitFullscreen')}</span>
        <kbd>{t('keyEsc')}</kbd>
      </button>
    </div>
  );
}

function Stage() {
  const state = useOutputState();
  const mirrorPreview = useStore((s) => s.settings.mirrorPreview);
  const display = useStore((s) => s.displays.find((d) => d.id === s.settings.outputDisplayId));
  const lang = useStore((s) => s.settings.language);
  const canvasW = display?.width ?? 1920;
  const canvasH = display?.height ?? 1080;

  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setBox({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = box.w > 0 ? Math.min(box.w / canvasW, box.h / canvasH) : 0;
  const mirror: Mirror = mirrorPreview ? state.mirror : 'none';

  return (
    <main className="stage">
      <div
        className="preview-box"
        ref={boxRef}
        data-prompter-wheel
        onMouseDown={() => (document.activeElement as HTMLElement)?.blur()}
      >
        {scale > 0 && (
          <div className="preview-frame" style={{ width: canvasW * scale, height: canvasH * scale }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: canvasW, height: canvasH }}>
              <PrompterCanvas
                state={state}
                lang={lang}
                width={canvasW}
                height={canvasH}
                mirror={mirror}
                onMetrics={registerPreviewMetrics}
              />
            </div>
          </div>
        )}
      </div>
      <Transport />
    </main>
  );
}

function Transport() {
  const playback = useStore((s) => s.playback);
  const { togglePlay, seek, jump } = useStore.getState();
  const [, force] = useState(0);
  const t = useT();
  const recording = useStore((s) => s.recording);
  const recStats = useStore((s) => s.recStats);
  const isMac = useStore((s) => s.info.platform === 'darwin');
  const playHint = `${t('playPauseHint')} (${isMac ? '⌥' : 'Alt'} + ${t('keySpace')})`;

  useEffect(() => {
    if (!playback.isPlaying) return;
    const t = window.setInterval(() => force((x) => x + 1), 200);
    return () => clearInterval(t);
  }, [playback.isPlaying]);

  const p = progressAt(playback, Date.now());
  const total = playback.displayDuration ?? playback.totalDuration;
  const tracking = useStore((s) => s.tracking);
  const trackStatus = useStore((s) => s.trackStatus);
  const isMacT = useStore((s) => s.info.platform === 'darwin');
  const keyHint = (k: string) => (isMacT ? `⌘⇧${k}` : `Ctrl+Shift+${k}`);
  const icon = playback.countdown !== null
    ? <IconClose size={20} />
    : playback.isPlaying ? <IconPause size={22} /> : <IconPlay size={22} />;

  return (
    <div className="transport">
      <input
        className="scrubber"
        type="range"
        min={0}
        max={1000}
        value={Math.round(p * 1000)}
        onChange={(e) => jump(Number(e.target.value) / 1000)}
        style={{ ['--fill' as string]: `${p * 100}%` }}
        tabIndex={-1}
      />
      <div className="transport-row">
        <span className="time">{formatDuration(p * total)}</span>
        <div className="transport-buttons">
          <button type="button" className="round-btn" title={t('back10')} tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()} onClick={() => seek(-10)}>
            <IconBack10 size={24} />
          </button>
          <button type="button" className="play-btn" title={playHint} tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()} onClick={togglePlay}>
            {icon}
          </button>
          <button type="button" className="round-btn" title={t('forward10')} tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()} onClick={() => seek(10)}>
            <IconFwd10 size={24} />
          </button>
        </div>
        <span className="time right">−{formatDuration((1 - p) * total)}</span>
      </div>
      <div className="transport-modes">
        <button
          type="button"
          className={`mode-btn track ${trackStatus}`}
          title={`${t(TRACK_TITLE[trackStatus])} (${keyHint('T')})`}
          aria-pressed={tracking}
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => useStore.getState().toggleTracking()}
        >
          <IconWave size={16} />
          <span>{t('btnVoiceTracking')}</span>
          {tracking
            ? <span className="mode-state">{t(TRACK_SHORT[trackStatus])}</span>
            : <kbd className="mode-key">{keyHint('T')}</kbd>}
        </button>
        <button
          type="button"
          className={`mode-btn rec${recording ? ' on' : ''}`}
          title={`${recording ? t('stopRecording') : t('record')} (${keyHint('R')})`}
          aria-pressed={recording}
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => (recording ? useStore.getState().endRecording() : useStore.getState().beginRecording())}
        >
          {recording ? <span className="rec-dot" /> : <IconMic size={16} />}
          <span>{recording ? t('btnStopRec') : t('btnAudioRec')}</span>
          {recording && recStats
            ? <span className="mode-state num">{formatDuration(recStats.elapsed)}</span>
            : !recording && <kbd className="mode-key">{keyHint('R')}</kbd>}
          {recording && recStats && (
            <span className="rec-meter"><span style={{ transform: `scaleX(${0.08 + recStats.level * 0.92})` }} /></span>
          )}
        </button>
      </div>
    </div>
  );
}

// MARK: - Réglages

function Inspector() {
  const cur = useStore((s) => s.current());
  const settings = useStore((s) => s.settings);
  const displays = useStore((s) => s.displays);
  const outputActive = useStore((s) => s.outputActive);
  const fonts = useStore((s) => s.fonts);
  const mics = useStore((s) => s.mics);
  const isMac = useStore((s) => s.info.platform === 'darwin');
  const st = useStore.getState();
  const t = useT();
  const [presetPrompt, setPresetPrompt] = useState(false);
  const [dragId, setDragId] = useState<InspectorBlockId | null>(null);
  const [overId, setOverId] = useState<InspectorBlockId | null>(null);

  // La source est gardée dans une référence : les événements dragover et drop
  // peuvent survenir avant que React n'ait réaffiché après dragstart.
  const dragRef = useRef<InspectorBlockId | null>(null);
  const tab = settings.inspectorTab;
  const order = settings.inspectorLayout[tab] ?? [];
  const dnd: BlockDnd = {
    tab,
    order,
    dragId,
    overId,
    isDragging: () => dragRef.current !== null,
    onStart: (id) => { dragRef.current = id; setDragId(id); },
    onOver: (id) => { if (dragRef.current && dragRef.current !== id) setOverId(id); },
    onEnd: () => { dragRef.current = null; setDragId(null); setOverId(null); },
    onDrop: (to) => {
      const from = dragRef.current;
      dragRef.current = null;
      setDragId(null);
      setOverId(null);
      if (from) useStore.getState().moveInspectorBlock(tab, from, to);
    },
  };

  useEffect(() => {
    useStore.getState().loadFonts().catch(() => undefined);
    useStore.getState().loadMics().catch(() => undefined);
  }, []);

  const speed = effectiveSpeed(cur);
  const tSpeed = targetSpeed(cur);
  const unreachable = !!cur?.targetEnabled && tSpeed !== null && (tSpeed < SPEED_MIN || tSpeed > SPEED_MAX);
  const td = cur?.targetDuration ?? 0;

  const weights = [300, 400, 500, 600, 700, 800, 900] as const;
  const clickerActions: ClickerAction[] = [
    'playPause', 'nextParagraph', 'prevParagraph', 'forward10', 'back10', 'faster', 'slower', 'rewind', 'none',
  ];
  const clickerLabel = (a: ClickerAction) => t((`ac${a[0].toUpperCase()}${a.slice(1)}`) as StringKey);
  const fontOptions = [
    { id: '', label: t('systemFont') },
    ...(fonts ?? []).map((f) => ({ id: f, label: f })),
  ];
  if (settings.fontFamily && !(fonts ?? []).includes(settings.fontFamily)) {
    fontOptions.push({ id: settings.fontFamily, label: settings.fontFamily });
  }

  const blocks: Record<InspectorBlockId, ReactNode> = {
    speed: (
      <Group id="speed" dnd={dnd} title={t('speed')}>
        <Row label={t('speed')}>
          <span className="speed-value">
            {Math.round(speed) === 74 && (
              <a className="dept-74" href={HAUTE_SAVOIE_URL} title={`${t('hauteSavoie')} — Wikipédia`}
                onClick={(e) => { e.preventDefault(); api.openLink(HAUTE_SAVOIE_URL); }}>
                <IconHauteSavoie size={13} />
              </a>
            )}
            <strong className="num">{speed === 0 ? t('speedStopped') : Math.round(speed)}</strong>
          </span>
        </Row>
        <Slider min={SPEED_MIN} max={SPEED_MAX} step={SPEED_STEP} value={speed} onChange={st.setSpeed}
          left={<IconSlow size={14} />} right={<IconFast size={14} />}
          onLeft={() => st.adjustSpeed(-1)} onRight={() => st.adjustSpeed(+1)}
          leftLabel={t('acSlower')} rightLabel={t('acFaster')} />
        <Row label={t('estimatedDuration')}><span className="num">{formatDuration(totalDuration(cur))}</span></Row>
        <Row label={t('script')}><span className="num">{t('words', { n: cur?.wordCount ?? 0 })}</span></Row>
      </Group>
    ),
    target: (
      <Group id="target" dnd={dnd} title={t('targetDuration')} info={t('manualDisablesTarget')}>
        <Row label={t('fitToDuration')}>
          <Toggle checked={!!cur?.targetEnabled} onChange={st.setTargetEnabled} />
        </Row>
        <Row label={t('duration')} disabled={!cur?.targetEnabled}>
          <span className="duration-fields">
            <NumberField value={Math.floor(td / 60)} min={0} max={599} disabled={!cur?.targetEnabled}
              onChange={(m) => st.setTargetDuration(m * 60 + (td % 60))} />
            <span>{t('minutesUnit')}</span>
            <NumberField value={td % 60} min={0} max={59} disabled={!cur?.targetEnabled}
              onChange={(sec) => st.setTargetDuration(Math.floor(td / 60) * 60 + sec)} />
            <span>{t('secondsUnit')}</span>
          </span>
        </Row>
        {unreachable && tSpeed !== null && (
          <p className="note warn"><IconWarning size={14} />
            {t('unreachableSpeed', { n: Math.round(tSpeed) })}
          </p>
        )}
      </Group>
    ),
    typography: (
      <Group id="typography" dnd={dnd} title={t('typography')}>
        <Row label={t('font')}>
          <ChoiceButton
            value={settings.fontFamily}
            options={fonts === null ? [{ id: settings.fontFamily, label: settings.fontFamily || t('loadingFonts') }] : fontOptions}
            onChange={(v) => st.setSetting('fontFamily', v)}
          />
        </Row>
        <Row label={t('size')}><strong className="num">{settings.fontSize} pt</strong></Row>
        <Slider min={FONT_MIN} max={FONT_MAX} step={FONT_STEP} value={settings.fontSize} onChange={st.setFont}
          left={<span className="glyph small">A</span>} right={<span className="glyph">A</span>} />
        <Row label={t('weight')}>
          <ChoiceButton
            value={String(settings.fontWeight)}
            options={weights.map((w) => ({ id: String(w), label: t(`w${w}` as StringKey) }))}
            onChange={(v) => st.setSetting('fontWeight', Number(v))}
          />
        </Row>
        <Row label={t('italic')}>
          <Toggle checked={settings.italic} onChange={(v) => st.setSetting('italic', v)} />
        </Row>
        <Row label={t('uppercase')}>
          <Toggle checked={settings.uppercase} onChange={(v) => st.setSetting('uppercase', v)} />
        </Row>
      </Group>
    ),
    colors: (
      <Group id="colors" dnd={dnd} title={t('colors')}>
        <Row label={t('textColor')}>
          <ColorField value={settings.textColor} onChange={(v) => st.setSetting('textColor', v)} />
        </Row>
        <Row label={t('backgroundColor')}>
          <ColorField value={settings.backgroundColor} onChange={(v) => st.setSetting('backgroundColor', v)} />
        </Row>
        <Row label={t('markerColor')}>
          <ColorField value={settings.markerColor} onChange={(v) => st.setSetting('markerColor', v)} />
        </Row>
        <button type="button" className="push-btn" tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()} onClick={st.resetColors}>
          {t('resetColors')}
        </button>
      </Group>
    ),
    layout: (
      <Group id="layout" dnd={dnd} title={t('layout')}>
        <Row label={t('alignment')}>
          <Segmented
            value={settings.alignment}
            options={[{ value: 'left', label: t('alignLeft') }, { value: 'center', label: t('alignCenter') }]}
            onChange={(v) => st.setSetting('alignment', v)}
          />
        </Row>
        <Row label={t('lineHeight')}><strong className="num">{settings.lineHeight.toFixed(2)}</strong></Row>
        <Slider min={LINE_HEIGHT_MIN} max={LINE_HEIGHT_MAX} step={0.05} value={settings.lineHeight}
          onChange={st.setLineHeight}
          left={<span className="glyph small">≡</span>} right={<span className="glyph">≡</span>} />
        <Row label={t('margins')} stacked>
          <Slider min={0} max={0.3} step={0.01} value={settings.margin}
            onChange={(v) => st.setSetting('margin', v)} />
        </Row>
        <Row label={t('showReadingLine')}>
          <Toggle checked={settings.showReadingLine} onChange={(v) => st.setSetting('showReadingLine', v)} />
        </Row>
        <Row label={t('readingLine')} stacked disabled={!settings.showReadingLine}>
          <Slider min={0.15} max={0.6} step={0.01} value={settings.readingLine}
            onChange={(v) => st.setSetting('readingLine', v)} />
        </Row>
      </Group>
    ),
    timecode: (
      <Group id="timecode" dnd={dnd} title={t('timecodeGroup')}>
        <Row label={t('timecode')}>
          <ChoiceButton
            value={settings.timecode}
            options={[
              { id: 'off', label: t('tcOff') },
              { id: 'elapsed', label: t('tcElapsed') },
              { id: 'remaining', label: t('tcRemaining') },
              { id: 'both', label: t('tcBoth') },
            ]}
            onChange={(v) => st.setSetting('timecode', v as TimecodeMode)}
          />
        </Row>
      </Group>
    ),
    takes: (
      <Group id="takes" dnd={dnd} title={t('takes')} info={t('coachNote')}>
        <Row label={t('microphone')}>
          <ChoiceButton
            value={settings.micDeviceId}
            options={[
              { id: '', label: t('defaultMic') },
              ...mics.map((m) => ({ id: m.id, label: m.label })),
            ]}
            onChange={(v) => st.setSetting('micDeviceId', v)}
          />
        </Row>
        <Row label={t('coachEnabled')}>
          <Toggle checked={settings.coachEnabled} onChange={(v) => st.setSetting('coachEnabled', v)} />
        </Row>
        <TakeList />
      </Group>
    ),

    transcription: (
      <Group id="transcription" dnd={dnd} title={t('sttBlock')}>
        <TranscriptionPanel />
      </Group>
    ),

    ai: (
      <Group id="ai" dnd={dnd} title={t('aiBlock')}>
        <AiPanel />
      </Group>
    ),

    output: (
      <Group id="output" dnd={dnd} title={t('output')}>
        <Row label={t('display')}>
          <ChoiceButton
            value={settings.outputDisplayId === null ? '' : String(settings.outputDisplayId)}
            options={[
              { id: '', label: t('none') },
              ...displays.map((d) => ({
                id: String(d.id),
                label: `${d.label} — ${d.width}×${d.height}${d.primary ? ` ${t('primaryDisplay')}` : ''}`,
              })),
            ]}
            onChange={(v) => st.setSetting('outputDisplayId', v === '' ? null : Number(v))}
          />
        </Row>
        <Row label={t('mirror')}>
          <ChoiceButton
            value={settings.mirror}
            options={[
              { id: 'none', label: t('mirrorNone') },
              { id: 'horizontal', label: t('mirrorHorizontal') },
              { id: 'vertical', label: t('mirrorVertical') },
              { id: 'both', label: t('mirrorBoth') },
            ]}
            onChange={(v) => st.setSetting('mirror', v as Mirror)}
          />
        </Row>
        <Row label={t('mirrorPreview')}>
          <Toggle checked={settings.mirrorPreview} onChange={(v) => st.setSetting('mirrorPreview', v)} />
        </Row>
        <Row label={t('mirrorFullscreen')}>
          <Toggle checked={settings.mirrorFullscreen} onChange={(v) => st.setSetting('mirrorFullscreen', v)} />
        </Row>
        <div className="button-pair">
          <button
            type="button"
            className={`push-btn${outputActive ? ' danger' : ' primary'}`}
            disabled={settings.outputDisplayId === null}
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={st.toggleOutput}
          >
            {outputActive ? t('hideOutput') : t('showOutput')}
          </button>
          <button
            type="button"
            className="push-btn"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => st.setFullscreen(true)}
          >
            {t('fullscreen')}
          </button>
        </div>
      </Group>
    ),
    clicker: (
      <Group id="clicker" dnd={dnd} title={t('clicker')} info={t('clickerNote')}>
        <Row label={t('clickerNext')}>
          <ChoiceButton
            value={settings.clickerNext}
            options={clickerActions.map((a) => ({ id: a, label: clickerLabel(a) }))}
            onChange={(v) => st.setSetting('clickerNext', v as ClickerAction)}
          />
        </Row>
        <Row label={t('clickerPrev')}>
          <ChoiceButton
            value={settings.clickerPrev}
            options={clickerActions.map((a) => ({ id: a, label: clickerLabel(a) }))}
            onChange={(v) => st.setSetting('clickerPrev', v as ClickerAction)}
          />
        </Row>
      </Group>
    ),
    controls: (
      <Group id="controls" dnd={dnd} title={t('controls')} info={t('wheelNote')}>
        <Row label={t('invertScroll')}>
          <Toggle checked={settings.invertScroll} onChange={(v) => st.setSetting('invertScroll', v)} />
        </Row>
        <Row label={t('wheelPreview')}>
          <ChoiceButton
            value={settings.wheelPreview}
            options={[
              { id: 'navigate', label: t('wheelNavigate') },
              { id: 'speed', label: t('wheelSpeed') },
            ]}
            onChange={(v) => st.setSetting('wheelPreview', v as WheelMode)}
          />
        </Row>
      </Group>
    ),
  };

  const tabLabel = (id: InspectorTabId) => t(`tab${id[0].toUpperCase()}${id.slice(1)}` as StringKey);
  const addable = INSPECTOR_BLOCKS.filter((id) => !order.includes(id));

  return (
    <aside className="inspector">
      <nav className="tab-bar" role="tablist">
        {INSPECTOR_TABS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            className={`tab-btn${id === tab ? ' on' : ''}`}
            aria-selected={id === tab}
            title={tabLabel(id)}
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => st.setSetting('inspectorTab', id)}
          >
            {tabLabel(id)}
          </button>
        ))}
      </nav>

      <div className="tab-body" data-scroll>
        {tab === 'custom' && (
          <div className="custom-head">
            <ChoiceButton
              value=""
              options={[
                { id: '', label: addable.length ? t('addBlock') : t('addBlockTitle') },
                ...addable.map((id) => ({ id, label: blockTitle(id, t) })),
              ]}
              onChange={(id) => id && st.addCustomBlock(id as InspectorBlockId)}
            />
            <div className="preset-bar">
              <ChoiceButton
                value=""
                options={[
                  { id: '', label: settings.templates.length ? t('choosePreset') : t('noPreset') },
                  ...settings.templates.map((tpl) => ({ id: tpl.id, label: tpl.name })),
                ]}
                onChange={(id) => id && st.applyTemplate(id)}
              />
              <button type="button" className="push-btn" tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()} onClick={() => setPresetPrompt(true)}>
                {t('savePreset')}
              </button>
            </div>
            {settings.templates.length > 0 && (
              <div className="preset-list">
                {settings.templates.map((tpl) => (
                  <span key={tpl.id} className="preset-chip">
                    <button type="button" className="preset-name" tabIndex={-1}
                      onMouseDown={(e) => e.preventDefault()} onClick={() => st.applyTemplate(tpl.id)}>
                      {tpl.name}
                    </button>
                    <button type="button" className="preset-del" title={t('deletePreset')} tabIndex={-1}
                      onMouseDown={(e) => e.preventDefault()} onClick={() => st.deleteTemplate(tpl.id)}>
                      <IconClose size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {order.length === 0 && <p className="note">{t('customEmpty')}</p>}
          </div>
        )}

        {order.map((id) => (
          <Fragment key={id}>{blocks[id]}</Fragment>
        ))}

        {order.length > 1 && (
          <p className="note order-note">
            {t('orderNote')}{' '}
            {tab !== 'custom' && (
              <button
                type="button"
                className="link-btn"
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => st.resetInspectorOrder(tab)}
              >
                {t('resetOrder')}
              </button>
            )}
          </p>
        )}
      </div>

      <UpdateFooter />

      {presetPrompt && (
        <PromptDialog
          title={t('savePreset')}
          label={t('presetName')}
          placeholder={t('presetExample')}
          onCancel={() => setPresetPrompt(false)}
          onSubmit={(name) => { setPresetPrompt(false); st.saveTemplate(name); }}
        />
      )}
    </aside>
  );
}

/** Titre traduit d'un bloc, pour le menu d'ajout de l'onglet personnalisé */
const BLOCK_TITLE_KEYS: Record<InspectorBlockId, StringKey> = {
  speed: 'speed', target: 'targetDuration', typography: 'typography', colors: 'colors',
  layout: 'layout', timecode: 'timecodeGroup', output: 'output', takes: 'takes',
  transcription: 'sttBlock', ai: 'aiBlock', clicker: 'clicker', controls: 'controls',
};
function blockTitle(id: InspectorBlockId, t: (k: StringKey) => string) {
  return t(BLOCK_TITLE_KEYS[id]);
}

/** Pied du panneau : version et vérification de mise à jour */
function UpdateFooter() {
  const version = useStore((s) => s.info.version);
  const update = useStore((s) => s.update);
  const auto = useStore((s) => s.settings.updateCheck);
  const [busy, setBusy] = useState(false);
  const t = useT();
  const check = async () => {
    setBusy(true);
    await useStore.getState().checkUpdate();
    setBusy(false);
  };
  return (
    <footer className="inspector-foot">
      <div className="foot-line">
        <span className="foot-version">CariPrompt {version}</span>
        <button type="button" className="link-btn" disabled={busy} tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()} onClick={check}>
          {busy ? t('updateChecking') : t('checkUpdates')}
        </button>
      </div>
      <div className="foot-line">
        <span className="foot-label">{t('updateAtLaunch')}</span>
        <Toggle checked={auto} onChange={(v) => useStore.getState().setSetting('updateCheck', v)} />
      </div>
      {update?.newer && (
        <button type="button" className="push-btn primary" tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()} onClick={() => api.openLink(update.url)}>
          {t('updateAvailable', { version: update.version })} — {t('updatePage')}
        </button>
      )}
    </footer>
  );
}

/** Liste des prises : lecture, renommage, note, marqueurs, verrou, export */
function TakeList() {
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

/** Petite boîte de saisie modale (nom de préréglage) */
// MARK: - Transcription

const HAUTE_SAVOIE_URL = 'https://fr.wikipedia.org/wiki/Haute-Savoie';

const TRACK_TITLE: Record<'off' | 'loading' | 'listening' | 'following' | 'lost', StringKey> = {
  off: 'trackOff', loading: 'trackLoading', listening: 'trackListening', following: 'trackFollowing', lost: 'trackLost',
};

const TRACK_SHORT: Record<'off' | 'loading' | 'listening' | 'following' | 'lost', StringKey> = {
  off: 'trackOff', loading: 'stLoading', listening: 'stListening', following: 'stFollowing', lost: 'stLost',
};

const STT_LABEL: Record<SttModelId, StringKey> = { turbo: 'sttModelTurbo', small: 'sttModelSmall', base: 'sttModelBase' };

function TranscriptionPanel() {
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

// MARK: - Éditeur de sous-titres

function SubtitleEditor() {
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

// MARK: - Rédaction IA

function AiPanel() {
  const settings = useStore((s) => s.settings);
  const keys = useStore((s) => s.aiKeys);
  const modelList = useStore((s) => s.aiModelList);
  const modelError = useStore((s) => s.aiModelError);
  const job = useStore((s) => s.aiJob);
  const noCredit = useStore((s) => s.aiNoCredit);
  const cur = useStore((s) => s.current());
  const st = useStore.getState();
  const t = useT();
  const [keyPrompt, setKeyPrompt] = useState(false);

  const provider = settings.aiProvider;
  const providerName = AI_PROVIDER_NAMES[provider];
  const hasKey = !!keys?.[provider];
  const list = modelList[provider];
  const listError = modelError[provider];

  useEffect(() => {
    useStore.getState().loadAiKeys().catch(() => undefined);
  }, []);
  useEffect(() => {
    if (hasKey && !list && !listError) useStore.getState().loadAiModels(provider).catch(() => undefined);
  }, [hasKey, provider, list, listError]);

  const chosen = settings.aiModels[provider] || AI_DEFAULT_MODELS[provider];
  const modelOptions = list?.length
    ? list.map((m) => ({ id: m.id, label: m.label }))
    : [{ id: chosen, label: hasKey && !listError ? t('aiLoading') : chosen }];
  if (list?.length && !list.some((m) => m.id === chosen)) modelOptions.unshift({ id: chosen, label: chosen });

  const lang = settings.language;
  let names: Intl.DisplayNames | null = null;
  try { names = new Intl.DisplayNames([lang], { type: 'language' }); } catch { names = null; }
  const targetOptions = AI_TARGETS.map((code) => {
    const n = names?.of(code) ?? code;
    return { id: code, label: n.charAt(0).toLocaleUpperCase(lang) + n.slice(1) };
  });

  const busy = !!job;
  const disabled = !hasKey || busy || !cur;
  const run = (task: AiTask) => { st.runAi(task).catch(() => undefined); };

  return (
    <>
      <Row label={t('aiProvider')}>
        <ChoiceButton
          value={provider}
          options={AI_PROVIDERS.map((p) => ({ id: p, label: AI_PROVIDER_NAMES[p] }))}
          onChange={(v) => !busy && st.setSetting('aiProvider', v as AiProvider)}
        />
      </Row>
      <Row label={t('aiKey')}>
        <span className="ai-key">
          <span className={hasKey ? 'ai-key-ok' : 'ai-key-missing'}>
            {hasKey ? t('aiKeySet') : t('aiKeyMissing')}
          </span>
          <button type="button" className="link-btn" tabIndex={-1} disabled={busy}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => (hasKey ? st.setAiKey(provider, '') : setKeyPrompt(true))}>
            {hasKey ? t('aiRemoveKey') : t('aiEnterKey')}
          </button>
        </span>
      </Row>
      {hasKey && (
        <Row label={t('aiModel')}>
          <ChoiceButton
            value={chosen}
            options={modelOptions}
            onChange={(v) => st.setSetting('aiModels', { ...settings.aiModels, [provider]: v })}
          />
        </Row>
      )}
      {listError && <p className="note warn"><IconWarning size={13} />{listError}</p>}
      {noCredit === provider && (
        <div className="note warn ai-credit">
          <IconWarning size={13} />
          <span>
            {t('aiErrNoCredit', { provider: providerName })}{' '}
            <button type="button" className="link-btn" tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()} onClick={() => api.aiOpenBilling(provider)}>
              {t('aiOpenBilling')}
            </button>
          </span>
        </div>
      )}

      <Row label={t('aiTranslateTo')}>
        <ChoiceButton
          value={settings.aiTarget}
          options={targetOptions}
          onChange={(v) => st.setSetting('aiTarget', v)}
        />
      </Row>
      <div className="ai-actions">
        <button type="button" className="push-btn" tabIndex={-1} disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run({ kind: 'translate', target: settings.aiTarget })}>
          <IconTranslate size={14} />{t('aiTranslate')}
        </button>
        <button type="button" className="push-btn" tabIndex={-1} disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run({ kind: 'oral' })}>
          <IconSpeak size={14} />{t('aiOral')}
        </button>
      </div>

      {job && (
        <div className="ai-progress">
          <div className="ai-progress-row">
            <span>{t(job.kind === 'translate' ? 'aiTranslating' : 'aiAdapting', { done: job.done, total: job.total })}</span>
            <button type="button" className="link-btn" tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()} onClick={() => st.cancelAi()}>
              {t('cancel')}
            </button>
          </div>
          <div className="ai-bar">
            <div className={`ai-bar-fill${job.done === 0 ? ' indeterminate' : ''}`}
              style={{ width: job.done === 0 ? undefined : `${(job.done / Math.max(job.total, 1)) * 100}%` }} />
          </div>
        </div>
      )}

      <p className="note">{t('aiNote')}</p>
      {keys && !keys.encrypted && <p className="note warn"><IconWarning size={13} />{t('aiKeyPlain')}</p>}

      {keyPrompt && (
        <PromptDialog
          title={t('aiKeyTitle', { provider: providerName })}
          label={t('aiKeyLabel', { provider: providerName })}
          placeholder={provider === 'anthropic' ? 'sk-ant-…' : 'sk-…'}
          secret
          onCancel={() => setKeyPrompt(false)}
          onSubmit={(v) => {
            setKeyPrompt(false);
            st.setAiKey(provider, v).catch(() => undefined);
          }}
        />
      )}
    </>
  );
}

/**
 * Message bloquant à un seul bouton. La saisie est gelée pendant l'affichage
 * pour que les raccourcis du prompteur ne passent pas au travers.
 */
function AlertDialog() {
  const alert = useStore((s) => s.alert);
  const dismiss = useStore((s) => s.dismissAlert);
  const setEditing = useStore((s) => s.setEditing);
  const t = useT();

  useEffect(() => {
    if (!alert) return undefined;
    setEditing(true);
    const key = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') dismiss();
    };
    window.addEventListener('keydown', key, true);
    return () => {
      window.removeEventListener('keydown', key, true);
      setEditing(false);
    };
  }, [alert, dismiss, setEditing]);

  if (!alert) return null;

  return (
    <div className="modal-backdrop" onMouseDown={dismiss}>
      <div className="modal alert" onMouseDown={(e) => e.stopPropagation()} role="alertdialog">
        <p className="alert-text">{t(alert)}</p>
        <div className="modal-actions">
          <button type="button" className="push-btn primary" autoFocus
            onMouseDown={(e) => e.preventDefault()} onClick={dismiss}>
            {t('ok')}
          </button>
        </div>
      </div>
    </div>
  );
}

function PromptDialog({ title, label, placeholder, secret = false, onCancel, onSubmit }: {
  title: string; label: string; placeholder: string; secret?: boolean;
  onCancel: () => void; onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState('');
  const t = useT();
  const setEditing = useStore((s) => s.setEditing);
  useEffect(() => {
    setEditing(true);
    return () => setEditing(false);
  }, [setEditing]);

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <h4>{title}</h4>
        <label className="modal-label">{label}</label>
        <input
          className="modal-input"
          type={secret ? 'password' : 'text'}
          autoComplete="off"
          spellCheck={false}
          autoFocus
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) onSubmit(value);
            if (e.key === 'Escape') onCancel();
          }}
        />
        <div className="modal-actions">
          <button type="button" className="push-btn" onMouseDown={(e) => e.preventDefault()} onClick={onCancel}>
            {t('cancel')}
          </button>
          <button type="button" className="push-btn primary" disabled={!value.trim()}
            onMouseDown={(e) => e.preventDefault()} onClick={() => onSubmit(value)}>
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="color-field">
      <span className="color-hex">{value.toUpperCase()}</span>
      <span className="color-swatch" style={{ background: value }} />
      <input type="color" value={value} tabIndex={-1} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

interface BlockDnd {
  tab: InspectorTabId;
  order: InspectorBlockId[];
  dragId: InspectorBlockId | null;
  overId: InspectorBlockId | null;
  isDragging: () => boolean;
  onStart: (id: InspectorBlockId) => void;
  onOver: (id: InspectorBlockId) => void;
  onEnd: () => void;
  onDrop: (id: InspectorBlockId) => void;
}

/** Bloc de réglages : repliable, déplaçable par sa poignée (l'en-tête seul est
 *  draggable, pour ne pas gêner les curseurs et les champs qu'il contient). */
function Group({ id, title, children, dnd, info }: {
  id: InspectorBlockId; title: string; children: ReactNode; dnd: BlockDnd; info?: string;
}) {
  const t = useT();
  const key = `${dnd.tab}:${id}`;
  const collapsed = useStore((s) => s.settings.collapsedBlocks.includes(key));
  const [showInfo, setShowInfo] = useState(false);
  const dragging = dnd.dragId === id;
  const over = dnd.overId === id && dnd.dragId !== null && dnd.dragId !== id;
  const below = over && dnd.dragId !== null && dnd.order.indexOf(dnd.dragId) < dnd.order.indexOf(id);
  return (
    <section
      className={`group${collapsed ? ' collapsed' : ''}${dragging ? ' dragging' : ''}${over ? (below ? ' drag-below' : ' drag-above') : ''}`}
      onDragOver={(e) => {
        if (!dnd.isDragging()) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        dnd.onOver(id);
      }}
      onDrop={(e) => {
        if (!dnd.isDragging()) return;
        e.preventDefault();
        e.stopPropagation();
        dnd.onDrop(id);
      }}
    >
      <h3
        draggable
        title={t('dragToReorder')}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', id);
          dnd.onStart(id);
        }}
        onDragEnd={dnd.onEnd}
      >
        <span className="drag-handle" aria-hidden>
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
            <circle cx="2.5" cy="3" r="1.15" /><circle cx="7.5" cy="3" r="1.15" />
            <circle cx="2.5" cy="7" r="1.15" /><circle cx="7.5" cy="7" r="1.15" />
            <circle cx="2.5" cy="11" r="1.15" /><circle cx="7.5" cy="11" r="1.15" />
          </svg>
        </span>
        <span className="group-title">{title}</span>
        {info && (
          <button
            type="button" className={`icon-btn info-btn${showInfo ? ' on' : ''}`} title={t('blockInfo')}
            aria-label={t('blockInfo')} aria-pressed={showInfo} tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => { e.stopPropagation(); setShowInfo((v) => !v); }}
          >
            <IconInfo size={13} />
          </button>
        )}
        {dnd.tab === 'custom' && (
          <button
            type="button" className="icon-btn" title={t('removeBlock')} aria-label={t('removeBlock')} tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => { e.stopPropagation(); useStore.getState().removeCustomBlock(id); }}
          >
            <IconClose size={11} />
          </button>
        )}
        <button
          type="button" className="icon-btn block-chevron"
          title={collapsed ? t('expandBlock') : t('collapseBlock')}
          aria-label={collapsed ? t('expandBlock') : t('collapseBlock')}
          aria-expanded={!collapsed} tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => { e.stopPropagation(); useStore.getState().toggleBlockCollapsed(key); }}
        >
          {collapsed ? '▸' : '▾'}
        </button>
      </h3>
      {info && showInfo && <p className="note block-info">{info}</p>}
      {!collapsed && <div className="group-card">{children}</div>}
    </section>
  );
}

function Row({ label, children, disabled, stacked }: {
  label: string; children: ReactNode; disabled?: boolean; stacked?: boolean;
}) {
  return (
    <div className={`row${disabled ? ' disabled' : ''}${stacked ? ' stacked' : ''}`}>
      <span className="row-label">{label}</span>
      <span className="row-value">{children}</span>
    </div>
  );
}

function Slider({ min, max, step, value, onChange, left, right, onLeft, onRight, leftLabel, rightLabel }: {
  min: number; max: number; step: number; value: number;
  onChange: (v: number) => void; left?: ReactNode; right?: ReactNode;
  onLeft?: () => void; onRight?: () => void; leftLabel?: string; rightLabel?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const end = (side: ReactNode, action?: () => void, label?: string) => (action
    ? (
      <button type="button" className="slider-end step" title={label} aria-label={label} tabIndex={-1}
        onMouseDown={(e) => e.preventDefault()} onClick={action}>
        {side}
      </button>
    )
    : <span className="slider-end">{side}</span>);
  return (
    <div className="slider">
      {left && end(left, onLeft, leftLabel)}
      <input
        type="range" min={min} max={max} step={step} value={value} tabIndex={-1}
        style={{ ['--fill' as string]: `${pct}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {right && end(right, onRight, rightLabel)}
    </div>
  );
}

/** Bouton de type « menu local » : ouvre un menu natif du système */
function ChoiceButton({ value, options, onChange }: {
  value: string;
  options: Array<{ id: string; label: string }>;
  onChange: (id: string) => void;
}) {
  const current = options.find((o) => o.id === value) ?? options[0];
  return (
    <button
      type="button"
      className="choice-btn"
      title={current?.label}
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      onClick={async (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const id = await api.choiceMenu(
          options.map((o) => ({ ...o, checked: o.id === value })),
          r.left,
          r.bottom + 2,
        );
        if (id !== null && id !== value) onChange(id);
      }}
    >
      <span className="choice-label">{current?.label}</span>
      <svg className="choice-chevron" width="9" height="12" viewBox="0 0 9 12" aria-hidden>
        <path d="M1.5 4.5 4.5 1.5 7.5 4.5M1.5 7.5 4.5 10.5 7.5 7.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`toggle${checked ? ' on' : ''}`}
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-knob" />
    </button>
  );
}

function Segmented<T extends string>({ value, options, onChange }: {
  value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void;
}) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={o.value === value ? 'on' : ''}
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function NumberField({ value, min, max, disabled, onChange }: {
  value: number; min: number; max: number; disabled?: boolean; onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const setEditing = useStore((s) => s.setEditing);
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = parseInt(draft, 10);
    if (Number.isFinite(n)) onChange(Math.min(Math.max(n, min), max));
    else setDraft(String(value));
  };
  return (
    <input
      className="number-field"
      type="text"
      inputMode="numeric"
      value={draft}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ''))}
      onFocus={(e) => { setEditing(true); e.target.select(); }}
      onBlur={() => { setEditing(false); commit(); }}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
    />
  );
}

// MARK: - Bandeau et dépôt

function BannerView() {
  const banner = useStore((s) => s.banner);
  const { undoRemove, dismissBanner } = useStore.getState();
  const t = useT();
  if (!banner) return null;
  return (
    <div className="banner" key={banner.id}>
      <span className={banner.isError ? 'banner-icon warn' : 'banner-icon'}>
        {banner.isError ? <IconWarning size={16} /> : <IconCheck size={16} />}
      </span>
      <span className="banner-text">{banner.message}</span>
      {banner.canUndo && (
        <button type="button" className="link-btn" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={undoRemove}>
          {t('undo')}
        </button>
      )}
      <button type="button" className="banner-close" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={dismissBanner}>
        <IconClose size={12} />
      </button>
    </div>
  );
}

function DropOverlay() {
  const t = useT();
  return (
    <div className="drop-overlay">
      <div className="drop-card">
        <IconDoc size={40} />
        <strong>{t('dropToImport')}</strong>
        <span>txt · md · rtf · doc · docx · odt · html · pdf</span>
      </div>
    </div>
  );
}
