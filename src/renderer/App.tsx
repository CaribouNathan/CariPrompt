import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent as RMouseEvent, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { tr, type StringKey } from '../shared/i18n';
import { applyStyle, styleAt, type MarkStyle } from '../shared/marks';
import {
  formatDuration, FONT_MAX, FONT_MIN, FONT_STEP, LINE_HEIGHT_MAX, LINE_HEIGHT_MIN, progressAt,
  SPEED_MAX, SPEED_MIN, SPEED_STEP,
  type ClickerAction, type Mirror, type OutputState, type StyleMark, type TimecodeMode,
} from '../shared/types';
import iconUrl from '../../build/icons/64x64.png';
import {
  IconBack10, IconCheck, IconClock, IconClose, IconCompose, IconDoc, IconFast, IconFwd10,
  IconGauge, IconImport, IconKeyboard, IconMenu, IconPause, IconPencil, IconPlay, IconScreen,
  IconBold, IconClear, IconExitFullscreen, IconFullscreen, IconItalic, IconScreenOff, IconSidebarRight, IconSlow, IconTextSize, IconWarning,
} from './icons';
import { PrompterCanvas } from './PrompterCanvas';
import { RichEditor, type Selection } from './RichEditor';
import {
  api, displayTitle, effectiveSpeed, registerParagraphStops, targetSpeed, textStyle, totalDuration, useStore,
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
      </div>
      <div className="titlebar-center">
        <StatusPill />
      </div>
      <div className="titlebar-actions">
        <ToolButton
          label={outputActive ? t('hideOutput') : t('showOutput')}
          shortcut={isMac ? '⌘⇧D' : `Ctrl+${t('keyShift')}D`}
          disabled={!hasOutput}
          active={outputActive}
          onClick={toggleOutput}
        >
          {outputActive ? <IconScreenOff size={17} /> : <IconScreen size={17} />}
          <span>{outputActive ? t('outputOn') : t('output')}</span>
        </ToolButton>
        <ToolButton
          label={t('fullscreen')}
          shortcut={isMac ? '⌘⇧F' : `Ctrl+${t('keyShift')}F`}
          onClick={() => setFullscreen(true)}
        >
          <IconFullscreen size={17} />
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
  label: string; shortcut?: string; disabled?: boolean; active?: boolean;
  onClick: (e: RMouseEvent<HTMLButtonElement>) => void; children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`tool-btn${props.active ? ' active' : ''}`}
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
  const { select, createScript, importDialog, duplicate, exportScript, remove } = useStore.getState();
  const isMac = useStore((s) => s.info.platform === 'darwin');
  const mod = isMac ? '⌘' : 'Ctrl+';
  const t = useT();

  const openMenu = async (id: string) => {
    select(id);
    const choice = await api.scriptMenu(true);
    if (choice === 'duplicate') duplicate(id);
    else if (choice === 'export') exportScript(id);
    else if (choice === 'delete') remove(id);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-title">{t('scripts')}</div>
      <div className="sidebar-list" data-scroll>
        {scripts.map((s) => (
          <div
            key={s.id}
            className={`script-row${s.id === selectedId ? ' selected' : ''}`}
            onMouseDown={(e) => { if (e.button === 0) select(s.id); }}
            onContextMenu={(e) => { e.preventDefault(); openMenu(s.id); }}
          >
            <IconDoc size={16} className="script-icon" />
            <div className="script-meta">
              <div className="script-title">{displayTitle(s)}</div>
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
          <dt>{t('keySpace')}</dt><dd>{t('scPlayPause')}</dd>
          <dt>↓ / ↑</dt><dd>{t('scFasterSlower')}</dd>
          <dt>← / →</dt><dd>{t('scSeek')}</dd>
          <dt>+ / −</dt><dd>{t('scTextSize')}</dd>
          <dt>{t('keyWheel')}</dt><dd>{t('scFasterSlower')}</dd>
          <dt>B / .</dt><dd>{t('scBlackout')}</dd>
          <dt>{t('keyEsc')}</dt><dd>{t('scLeaveEditing')}</dd>
          <dt>{mod}{shift}F</dt><dd>{t('scFullscreen')}</dd>
          <dt>{mod}R</dt><dd>{t('scRewind')}</dd>
          <dt>{mod}{shift}D</dt><dd>{t('scOutput')}</dd>
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
  const [selection, setSelection] = useState<Selection | null>(null);
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
      </div>

      <RichEditor
        scriptId={cur.id}
        text={cur.text}
        marks={cur.marks}
        placeholder={t('textPlaceholder')}
        onChange={updateRich}
        onSelectionChange={setSelection}
        onFocusChange={setEditing}
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
  return { text, marks: marks ?? EMPTY_MARKS, style: textStyle(settings), mirror: settings.mirror, blackout, playback };
}

/** Plein écran : utilisation solo, le texte occupe toute la fenêtre */
function FullscreenView() {
  const state = useOutputState();
  const mirrorFullscreen = useStore((s) => s.settings.mirrorFullscreen);
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
      <div className="preview-box" ref={boxRef} onMouseDown={() => (document.activeElement as HTMLElement)?.blur()}>
        {scale > 0 && (
          <div className="preview-frame" style={{ width: canvasW * scale, height: canvasH * scale }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: canvasW, height: canvasH }}>
              <PrompterCanvas
                state={state}
                width={canvasW}
                height={canvasH}
                mirror={mirror}
                onStopsProvider={registerParagraphStops}
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

  useEffect(() => {
    if (!playback.isPlaying) return;
    const t = window.setInterval(() => force((x) => x + 1), 200);
    return () => clearInterval(t);
  }, [playback.isPlaying]);

  const p = progressAt(playback, Date.now());
  const total = playback.totalDuration;
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
          <button type="button" className="play-btn" title={t('playPauseHint')} tabIndex={-1}
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
  const isMac = useStore((s) => s.info.platform === 'darwin');
  const st = useStore.getState();
  const t = useT();
  const [presetPrompt, setPresetPrompt] = useState(false);

  useEffect(() => {
    useStore.getState().loadFonts().catch(() => undefined);
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

  return (
    <aside className="inspector" data-scroll>
      <Group title={t('templates')}>
        <Row label={t('choosePreset')}>
          <ChoiceButton
            value=""
            options={[
              { id: '', label: settings.templates.length ? t('choosePreset') : t('noPreset') },
              ...settings.templates.map((tpl) => ({ id: tpl.id, label: tpl.name })),
            ]}
            onChange={(id) => id && st.applyTemplate(id)}
          />
        </Row>
        <button type="button" className="push-btn" tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()} onClick={() => setPresetPrompt(true)}>
          {t('savePreset')}
        </button>
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
      </Group>

      {presetPrompt && (
        <PromptDialog
          title={t('savePreset')}
          label={t('presetName')}
          placeholder={t('presetExample')}
          onCancel={() => setPresetPrompt(false)}
          onSubmit={(name) => { setPresetPrompt(false); st.saveTemplate(name); }}
        />
      )}

      <Group title={t('speed')}>
        <Row label={t('speed')}>
          <strong className="num">{speed === 0 ? t('speedStopped') : Math.round(speed)}</strong>
        </Row>
        <Slider min={SPEED_MIN} max={SPEED_MAX} step={SPEED_STEP} value={speed} onChange={st.setSpeed}
          left={<IconSlow size={14} />} right={<IconFast size={14} />} />
        <Row label={t('estimatedDuration')}><span className="num">{formatDuration(totalDuration(cur))}</span></Row>
        <Row label={t('script')}><span className="num">{t('words', { n: cur?.wordCount ?? 0 })}</span></Row>
      </Group>

      <Group title={t('targetDuration')}>
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
        {cur?.targetEnabled && !unreachable && (
          <p className="note">{t('manualDisablesTarget')}</p>
        )}
      </Group>

      <Group title={t('typography')}>
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

      <Group title={t('colors')}>
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

      <Group title={t('layout')}>
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

      <Group title={t('output')}>
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
            className={`push-btn${outputActive ? '' : ' primary'}`}
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

      <Group title={t('clicker')}>
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
        <p className="note">{t('clickerNote')}</p>
      </Group>

      <Group title={t('controls')}>
        <Row label={t('countdown')}>
          <Toggle checked={settings.countdownEnabled} onChange={(v) => st.setSetting('countdownEnabled', v)} />
        </Row>
        <Row label={t('invertScroll')}>
          <Toggle checked={settings.invertScroll} onChange={(v) => st.setSetting('invertScroll', v)} />
        </Row>
      </Group>
    </aside>
  );
}

/** Petite boîte de saisie modale (nom de préréglage) */
function PromptDialog({ title, label, placeholder, onCancel, onSubmit }: {
  title: string; label: string; placeholder: string;
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
          type="text"
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

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="group">
      <h3>{title}</h3>
      <div className="group-card">{children}</div>
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

function Slider({ min, max, step, value, onChange, left, right }: {
  min: number; max: number; step: number; value: number;
  onChange: (v: number) => void; left?: ReactNode; right?: ReactNode;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="slider">
      {left && <span className="slider-end">{left}</span>}
      <input
        type="range" min={min} max={max} step={step} value={value} tabIndex={-1}
        style={{ ['--fill' as string]: `${pct}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {right && <span className="slider-end">{right}</span>}
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
