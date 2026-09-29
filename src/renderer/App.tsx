import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent as RMouseEvent, type PointerEvent as RPointerEvent, type ReactNode, type RefObject } from 'react';
import { tr, type StringKey } from '../shared/i18n';
import { applyStyle, styleAt, type MarkStyle } from '../shared/marks';
import {
  formatDuration, FONT_MAX, FONT_MIN, FONT_STEP, LINE_HEIGHT_MAX, LINE_HEIGHT_MIN, progressAt,
  SPEED_MAX, SPEED_MIN, SPEED_STEP, AI_DEFAULT_MODELS, AI_PROVIDERS, AI_TARGETS, STT_MODEL_IDS,
  type SttModelId, type Take,
  INSPECTOR_BLOCKS, INSPECTOR_TABS, homeTab, type AiProvider, type AiTask, type ClickerAction, type InspectorBlockId,
  type InspectorTabId, type Mirror, type OutputState, type PreviewSource, type StyleMark,
  type TimecodeMode, type WheelMode,
} from '../shared/types';
import iconUrl from '../../build/icons/64x64.png';
import {
  IconBack10, IconCheck, IconClock, IconClose, IconCompose, IconDoc, IconFast, IconFwd10,
  IconGauge, IconHauteSavoie, IconImport, IconKeyboard, IconMenu, IconPause, IconPencil, IconPlay, IconScreen,
  IconBold, IconClear, IconExitFullscreen, IconFullscreen, IconItalic, IconMic, IconRedo, IconScreenOff,
  IconDownload, IconWave, IconMerge, IconScissors, IconSearch, IconSpeak, IconStop, IconTranslate, IconUndo,
  IconSidebarRight, IconRows, IconColumns, IconChevronLeft, IconChevronRight, IconSlow, IconTextSize, IconWarning, IconInfo, IconCountdown, IconFlag,
} from './icons';
import { PrompterCanvas } from './PrompterCanvas';
import { CPS_MAX, cps, LINE_MAX, parseTime, srtTime } from './subtitles';
import { audioMime } from './wav';
import { RichEditor, type Selection } from './RichEditor';
import { useT } from './useT';
import {
  AlertDialog, ChoiceButton, ColorField, Group, NumberField, PromptDialog, Row, Segmented, Slider, Toggle,
} from './widgets';
import { TakeList, TranscriptionPanel } from './takes';
import { SubtitleEditor } from './SubtitleEditor';
import { AiPanel } from './aiPanel';
import type { BlockDnd } from './widgets';
import {
  AI_PROVIDER_NAMES, api, displayTitle, effectiveSpeed, normalizeForSearch, registerPreviewMetrics, targetSpeed, textStyle,
  totalDuration, useStore,
} from './store';

export function App() {
  const showInspector = useStore((s) => s.settings.showInspector);
  const showSidebar = useStore((s) => s.settings.showSidebar);
  const dropActive = useStore((s) => s.dropActive);
  const shortcutsOpen = useStore((s) => s.shortcutsOpen);
  const fullscreen = useStore((s) => s.fullscreen);
  useFileDrop();

  return (
    <div className="app">
      {fullscreen && <FullscreenView />}
      <TitleBar />
      <div className="workspace">
        {showSidebar ? <Sidebar /> : <SidebarReveal />}
        <Center />
        {showInspector && <Inspector />}
      </div>
      {shortcutsOpen && <ShortcutsSheet />}
      <BannerView />
      <AlertDialog />
      <SubtitleEditor />
      {dropActive && <DropOverlay />}
    </div>
  );
}

// MARK: - Éditeur et aperçu

/** Places minimales, en points, en deçà desquelles un panneau n'est plus lisible */
const MIN_EDITOR_W = 260;
const MIN_STAGE_W = 320;
const MIN_EDITOR_H = 150;
const MIN_STAGE_H = 240;

/** Taille d'un élément, suivie au fil des redimensionnements de la fenêtre */
function useBoxSize<T extends HTMLElement>(): [RefObject<T | null>, { w: number; h: number }] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}

/**
 * Éditeur et aperçu, côte à côte ou l'un au-dessus de l'autre.
 *
 * La taille de l'éditeur est une consigne en points, pas une fatalité : elle est
 * ramenée à ce que la fenêtre peut offrir à chaque rendu, faute de quoi un
 * éditeur large débordait sur l'aperçu et sur le panneau de réglages dès qu'on
 * rétrécissait la fenêtre. La consigne est conservée telle quelle, l'éditeur
 * retrouve sa taille quand la fenêtre s'élargit à nouveau.
 *
 * Côte à côte demande une largeur que la fenêtre n'a pas toujours : sous le
 * minimum vital des deux panneaux, l'affichage repasse de lui-même en haut/bas.
 */
function Center() {
  const split = useStore((s) => s.settings.splitDirection);
  const [ref, box] = useBoxSize<HTMLDivElement>();
  const columns = split === 'columns' && (box.w === 0 || box.w >= MIN_EDITOR_W + MIN_STAGE_W);
  return (
    <div className={`center ${columns ? 'columns' : 'rows'}`} ref={ref}>
      <Editor columns={columns} avail={columns ? box.w : box.h} />
      <Stage />
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
  const timecode = useStore((s) => s.settings.timecode);
  const split = useStore((s) => s.settings.splitDirection);
  const isMac = info.platform === 'darwin';
  const t = useT();

  return (
    <header className={`titlebar ${isMac ? 'mac' : 'overlay'}`}>
      <div className="titlebar-brand">
        <ToolButton
          label={t('menu')}
          onClick={(e) => {
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
            api.openAppMenu(r.left, r.bottom + 4, { updateCheck: useStore.getState().settings.updateCheck });
          }}
        >
          <IconMenu size={18} />
        </ToolButton>
        <img src={iconUrl} alt="" width={22} height={22} draggable={false} />
        <span className="brand-name">CariPrompt</span>
        {/* Le numéro de version mène aux versions publiées, et passe au bleu
            quand il en existe une plus récente : c'est tout ce que la
            vérification de mise à jour a besoin de montrer. */}
        <button
          type="button"
          className={`brand-version${update?.newer ? ' newer' : ''}`}
          title={update?.newer
            ? `${t('updateAvailable', { version: update.version })} — ${t('updatePage')}`
            : `CariPrompt ${info.version} — ${t('updatePage')}`}
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => api.openLink(RELEASES_URL)}
        >
          {info.version}
        </button>
      </div>
      <div className="titlebar-actions">
        <button
          type="button"
          className={`bar-btn${countdown ? ' on' : ''}`}
          title={countdown ? t('countdownOn') : t('countdownOff')}
          aria-pressed={countdown}
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setSetting('countdownEnabled', !countdown)}
        >
          <IconCountdown size={15} />
          <span>{t('countdownShort')}</span>
        </button>
        <button
          type="button"
          className={`bar-btn${timecode !== 'off' ? ' on' : ''}`}
          title={`${t('timecode')} — ${t(TIMECODE_LABELS[timecode])}`}
          aria-pressed={timecode !== 'off'}
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={async (e) => {
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const id = await api.choiceMenu(
              (['off', 'elapsed', 'remaining', 'both'] as TimecodeMode[])
                .map((v) => ({ id: v, label: t(TIMECODE_LABELS[v]), checked: v === timecode })),
              r.left, r.bottom + 4,
            );
            if (id) setSetting('timecode', id as TimecodeMode);
          }}
        >
          <IconClock size={15} />
          <span>{t('timecode')}</span>
        </button>
        <span className="split-switch">
          <button
            type="button"
            className={`bar-btn icon${split === 'rows' ? ' on' : ''}`}
            title={t('splitRows')}
            aria-pressed={split === 'rows'}
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setSetting('splitDirection', 'rows')}
          >
            <IconRows size={15} />
          </button>
          <button
            type="button"
            className={`bar-btn icon${split === 'columns' ? ' on' : ''}`}
            title={t('splitColumns')}
            aria-pressed={split === 'columns'}
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setSetting('splitDirection', 'columns')}
          >
            <IconColumns size={15} />
          </button>
        </span>
        <ToolButton
          label={outputActive ? t('hideOutput') : t('showOutput')}
          shortcut={isMac ? '⌘⇧D' : `Ctrl+${t('keyShift')}D`}
          disabled={!hasOutput}
          danger={outputActive}
          onClick={toggleOutput}
        >
          {outputActive ? <IconScreenOff size={17} /> : <IconScreen size={17} />}
          <span>{outputActive ? t('hideOutput') : t('showOutput')}</span>
          <span className={`out-dot${outputActive ? ' on' : ''}`} />
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

const TIMECODE_LABELS: Record<TimecodeMode, StringKey> = {
  off: 'tcOff', elapsed: 'tcElapsed', remaining: 'tcRemaining', both: 'tcBoth',
};

/** Languette de retour quand la colonne des textes est masquée */
function SidebarReveal() {
  const t = useT();
  return (
    <button
      type="button"
      className="sidebar-reveal"
      title={t('showScripts')}
      aria-label={t('showScripts')}
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => useStore.getState().setSetting('showSidebar', true)}
    >
      <IconChevronRight size={15} />
    </button>
  );
}

// MARK: - Bibliothèque

function Sidebar() {
  const width = useStore((s) => s.settings.sidebarWidth);
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
    <aside className="sidebar" style={{ width, flexBasis: width }}>
      <div className="sidebar-head">
        <span className="sidebar-title">{t('scripts')}</span>
        <button
          type="button"
          className="icon-btn"
          title={t('hideScripts')}
          aria-label={t('hideScripts')}
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => useStore.getState().setSetting('showSidebar', false)}
        >
          <IconChevronLeft size={15} />
        </button>
      </div>

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

      <div className="sidebar-footer">
        <ToolButton label={t('newScript')} shortcut={`${mod}N`} onClick={() => createScript()}>
          <IconCompose size={17} />
        </ToolButton>
        <ToolButton label={t('import')} shortcut={`${mod}O`} onClick={() => importDialog()}>
          <IconImport size={17} />
        </ToolButton>
        <ToolButton label={t('shortcutsTitle')} shortcut={`${mod}/`}
          onClick={() => useStore.getState().setShortcutsOpen(true)}>
          <IconKeyboard size={17} />
        </ToolButton>
      </div>
      <div
        className="resizer vertical"
        onPointerDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startW = width;
          const move = (ev: PointerEvent) =>
            useStore.getState().setSetting('sidebarWidth', Math.min(Math.max(startW + ev.clientX - startX, 180), 420));
          const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
          window.addEventListener('pointermove', move);
          window.addEventListener('pointerup', up);
        }}
      />
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
/**
 * Raccourcis clavier, en surimpression sur ⌘/ — la convention du système.
 *
 * Jusqu'à la 2.2.6 cette liste occupait en permanence la moitié basse de la
 * colonne des textes, ouverte à chaque lancement, pour quinze lignes qu'on lit
 * deux fois. La colonne est rendue à son sujet.
 */
function ShortcutsSheet() {
  const isMac = useStore((s) => s.info.platform === 'darwin');
  const close = () => useStore.getState().setShortcutsOpen(false);
  const t = useT();
  const mod = isMac ? '⌘' : 'Ctrl+';
  const shift = isMac ? '⇧' : t('keyShift');

  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <div className="modal shortcuts-sheet" onMouseDown={(e) => e.stopPropagation()}>
        <h4><IconKeyboard size={15} />{t('shortcutsTitle')}</h4>
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
          <dt>{mod}/</dt><dd>{t('shortcutsTitle')}</dd>
        </dl>
        <div className="modal-actions">
          <button type="button" className="push-btn" onMouseDown={(e) => e.preventDefault()} onClick={close}>
            {t('closeSheet')}
          </button>
        </div>
      </div>
    </div>
  );
}

// MARK: - Éditeur

const SPEAKER_COLORS = ['#ffffff', '#ffd60a', '#30d158', '#64d2ff', '#ff9f0a', '#ff453a', '#bf5af2', '#8e8e93'];

function Editor({ columns, avail }: { columns: boolean; avail: number }) {
  const cur = useStore((s) => s.current());
  const editing = useStore((s) => s.editing);
  const rows = !columns;
  const height = useStore((s) => s.settings.editorHeight);
  const width = useStore((s) => s.settings.editorWidth);
  // Consigne de l'utilisateur, ramenée à la place disponible
  const fit = (want: number, min: number, other: number) =>
    avail > 0 ? Math.min(Math.max(want, min), Math.max(min, avail - other)) : want;
  const size = rows
    ? { height: fit(height, MIN_EDITOR_H, MIN_STAGE_H) }
    : { width: fit(width, MIN_EDITOR_W, MIN_STAGE_W) };
  const fonts = useStore((s) => s.fonts);
  const fontFamily = useStore((s) => s.settings.fontFamily);
  const fontSize = useStore((s) => s.settings.fontSize);
  const { updateRich, rename, setEditing, setSetting, setMarks } = useStore.getState();
  const isMac = useStore((s) => s.info.platform === 'darwin');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [selRect, setSelRect] = useState<{ top: number; left: number } | null>(null);
  const caretHint = useStore((s) => s.pendingCaret);
  const depth = useStore((s) => s.historyDepth);
  const t = useT();

  useEffect(() => { setSelection(null); setSelRect(null); }, [cur?.id]);

  // L'éditeur garde sa taille, l'aperçu prend le reste — en hauteur ou en largeur
  const startResize = (e: RPointerEvent) => {
    e.preventDefault();
    const start = rows ? e.clientY : e.clientX;
    const startSize = rows ? size.height! : size.width!;
    const move = (ev: PointerEvent) => {
      const delta = (rows ? ev.clientY : ev.clientX) - start;
      if (rows) setSetting('editorHeight', fit(startSize + delta, MIN_EDITOR_H, MIN_STAGE_H));
      else setSetting('editorWidth', fit(startSize + delta, MIN_EDITOR_W, MIN_STAGE_W));
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  useEffect(() => { useStore.getState().loadFonts().catch(() => undefined); }, []);

  if (!cur) return <section className="editor" style={size} />;

  const hasSelection = !!selection && selection.end > selection.start;
  const current = hasSelection ? styleAt(cur.text, cur.marks, selection!.start, selection!.end) : null;

  const apply = (patch: Partial<MarkStyle> | null) => {
    if (!hasSelection) return;
    setMarks(applyStyle(cur.text, cur.marks, selection!.start, selection!.end, patch));
  };

  return (
    <section className="editor" style={size}>
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

      <div className="editor-typo">
        <span className="typo-label">{t('font')}</span>
        <ChoiceButton
          value={fontFamily}
          options={fonts === null
            ? [{ id: fontFamily, label: fontFamily || t('loadingFonts') }]
            : [{ id: '', label: t('systemFont') }, ...fonts.map((f) => ({ id: f, label: f }))]}
          onChange={(v) => setSetting('fontFamily', v)}
        />
        <span className="typo-label">{t('size')}</span>
        <strong className="num">{fontSize} pt</strong>
        <Slider
          min={FONT_MIN} max={FONT_MAX} step={FONT_STEP} value={fontSize}
          onChange={useStore.getState().setFont}
          left={<span className="glyph small">A</span>} right={<span className="glyph">A</span>}
          onLeft={() => useStore.getState().adjustFont(-1)} onRight={() => useStore.getState().adjustFont(+1)}
          leftLabel={t('smaller')} rightLabel={t('bigger')}
        />
        <span className="selection-sep" />
        <span className="undo-pair">
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
        </span>
      </div>

      {hasSelection && selRect && (
        <SelectionPopover rect={selRect} style={current} onApply={apply} />
      )}

      <RichEditor
        scriptId={cur.id}
        text={cur.text}
        marks={cur.marks}
        placeholder={t('textPlaceholder')}
        onChange={updateRich}
        onSelectionChange={(sel) => {
          setSelection(sel);
          const live = window.getSelection();
          if (sel && sel.end > sel.start && live && live.rangeCount > 0) {
            const r = live.getRangeAt(0).getBoundingClientRect();
            setSelRect(r.width || r.height ? { top: r.top, left: r.left + r.width / 2 } : null);
          } else setSelRect(null);
        }}
        onCaretClick={(offset) => useStore.getState().jumpToOffset(offset)}
        onFocusChange={setEditing}
        caretHint={caretHint}
        onCaretConsumed={() => useStore.getState().consumeCaret()}
      />

      <footer className="editor-footer">
        <span>{t('words', { n: cur.wordCount })} · {formatDuration(totalDuration(cur))}</span>
        <span className="editor-hint">
          {editing
            ? (<><IconKeyboard size={14} />{t('hintEditing')}</>)
            : (<><IconPencil size={13} />{t('hintIdle')}</>)}
        </span>
      </footer>
      <div className={`resizer ${rows ? 'horizontal' : 'vertical'}`} onPointerDown={startResize} />
    </section>
  );
}

/**
 * Styles de locuteur, en bulle au-dessus de la sélection.
 *
 * Cette barre occupait une ligne entière au-dessus du texte, désactivée tant
 * qu'il n'y avait rien de sélectionné — c'est-à-dire la plupart du temps. Elle
 * ne paraît plus que lorsqu'elle sert, à l'endroit où elle sert.
 */
function SelectionPopover({ rect, style, onApply }: {
  rect: { top: number; left: number };
  style: MarkStyle | null;
  onApply: (patch: Partial<MarkStyle> | null) => void;
}) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(rect.left);

  // Ramenée dans la fenêtre : une sélection en bord d'écran sortirait sinon
  useLayoutEffect(() => {
    const w = ref.current?.offsetWidth ?? 0;
    const margin = 12;
    const half = w / 2;
    setLeft(Math.min(Math.max(rect.left, half + margin), window.innerWidth - half - margin));
  }, [rect.left]);

  return (
    <div
      ref={ref}
      className="selection-popover"
      style={{ top: Math.max(8, rect.top - 10), left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="swatches">
        {SPEAKER_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`swatch${style?.color === c ? ' on' : ''}`}
            style={{ background: c }}
            title={c}
            tabIndex={-1}
            onClick={() => onApply({ color: c })}
          />
        ))}
      </div>
      <span className="selection-sep" />
      <button type="button" className={`mark-btn${style?.bold ? ' on' : ''}`} title={t('markBold')}
        tabIndex={-1} onClick={() => onApply({ bold: !style?.bold })}>
        <IconBold size={15} />
      </button>
      <button type="button" className={`mark-btn${style?.italic ? ' on' : ''}`} title={t('markItalic')}
        tabIndex={-1} onClick={() => onApply({ italic: !style?.italic })}>
        <IconItalic size={15} />
      </button>
      <button type="button" className="mark-btn" title={t('clearFormat')}
        tabIndex={-1} onClick={() => onApply(null)}>
        <IconClear size={15} />
      </button>
    </div>
  );
}

// MARK: - Scène (aperçu + transport)

const TRACK_TITLE: Record<'off' | 'loading' | 'listening' | 'following' | 'lost', StringKey> = {
  off: 'trackOff', loading: 'trackLoading', listening: 'trackListening', following: 'trackFollowing', lost: 'trackLost',
};

const TRACK_SHORT: Record<'off' | 'loading' | 'listening' | 'following' | 'lost', StringKey> = {
  off: 'trackOff', loading: 'stLoading', listening: 'stListening', following: 'stFollowing', lost: 'stLost',
};

const HAUTE_SAVOIE_URL = 'https://fr.wikipedia.org/wiki/Haute-Savoie';
/**
 * Page des versions publiées.
 *
 * Le bouton menait auparavant à l'adresse renvoyée par GitHub pour la dernière
 * version — une page de release précise, que la liste blanche du processus
 * principal n'autorise pas : le clic n'aurait rien ouvert. Une adresse fixe,
 * autorisée, et la liste complète des versions plutôt que la seule dernière.
 */
const RELEASES_URL = 'https://github.com/CaribouNathan/CariPrompt/releases';


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
  const source = useStore((s) => s.settings.previewSource);
  const t = useT();

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

  // « Écran de sortie » : rendu à la définition de l'écran, réduit pour tenir dans
  // le panneau — ce qu'on voit est exactement ce qui part. « Cette fenêtre » :
  // rendu à la taille du panneau, plus lisible mais non représentatif.
  const outW = display?.width ?? 1920;
  const outH = display?.height ?? 1080;
  const toOutput = source === 'output';
  const canvasW = toOutput ? outW : Math.max(320, Math.round(box.w));
  const canvasH = toOutput ? outH : Math.max(180, Math.round(box.h));
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
        <div className="preview-source">
          <Segmented
            value={source}
            options={[
              { value: 'output' as PreviewSource, label: t('previewOutput') },
              { value: 'window' as PreviewSource, label: t('previewWindow') },
            ]}
            onChange={(v) => useStore.getState().setSetting('previewSource', v)}
          />
          <span className="preview-dims num">
            {toOutput ? `${outW} × ${outH}` : `${canvasW} × ${canvasH}`}
          </span>
        </div>
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
          <IconWave size={15} />
          <span className="mode-label">{t('btnVoiceTracking')}</span>
          {tracking && <span className="mode-state">{t(TRACK_SHORT[trackStatus])}</span>}
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
          {recording ? <span className="rec-dot" /> : <IconMic size={15} />}
          <span className="mode-label">{recording ? t('btnStopRec') : t('btnAudioRec')}</span>
          {recording && recStats && <span className="mode-state num">{formatDuration(recStats.elapsed)}</span>}
          {recording && recStats && (
            <span className="rec-meter"><span style={{ transform: `scaleX(${0.08 + recStats.level * 0.92})` }} /></span>
          )}
        </button>
        </div>
        <TransportSpeed />
        <span className="time right">−{formatDuration((1 - p) * total)}</span>
      </div>
    </div>
  );
}

/**
 * Vitesse de défilement, sur la même ligne que les commandes de lecture : elle
 * reste sous la main quand la colonne des textes et le panneau de réglages sont
 * masqués, ce qui est la position de travail d'un enregistrement.
 */
function TransportSpeed() {
  const cur = useStore((s) => s.current());
  const speed = cur ? effectiveSpeed(cur) : 0;
  const t = useT();
  const st = useStore.getState();
  if (!cur) return null;
  return (
    <div className="transport-speed">
      <span className="speed-tag"><IconGauge size={14} /><span className="speed-word">{t('speed')}</span></span>
      <Slider min={SPEED_MIN} max={SPEED_MAX} step={SPEED_STEP} value={speed} onChange={st.setSpeed}
        left={<IconSlow size={14} />} right={<IconFast size={14} />}
        onLeft={() => st.adjustSpeed(-1)} onRight={() => st.adjustSpeed(+1)}
        leftLabel={t('acSlower')} rightLabel={t('acFaster')} />
      <span className="speed-value">
        {Math.round(speed) === 74 && (
          <a className="dept-74" href={HAUTE_SAVOIE_URL} title={`${t('hauteSavoie')} — Wikipédia`}
            onClick={(e) => { e.preventDefault(); api.openLink(HAUTE_SAVOIE_URL); }}>
            <IconHauteSavoie size={13} />
          </a>
        )}
        <strong className="num">{speed === 0 ? t('speedStopped') : Math.round(speed)}</strong>
      </span>
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
        {/* Ces deux réglages n'ont de sens qu'une fois le miroir actif : ils se
            montrent alors, en retrait, sous le mode qui les commande. */}
        {settings.mirror !== 'none' && (
          <>
            <Row label={t('mirrorPreview')} indent>
              <Toggle checked={settings.mirrorPreview} onChange={(v) => st.setSetting('mirrorPreview', v)} />
            </Row>
            <Row label={t('mirrorFullscreen')} indent>
              <Toggle checked={settings.mirrorFullscreen} onChange={(v) => st.setSetting('mirrorFullscreen', v)} />
            </Row>
          </>
        )}
      </Group>
    ),

    presets: (
      <Group id="presets" dnd={dnd} title={t('presetsBlock')} info={t('presetsNote')}>
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
        {order.map((id) => (
          <Fragment key={id}>{blocks[id]}</Fragment>
        ))}

        {order.length > 1 && (
          <p className="note order-note">
            {t('orderNote')}{' '}
            <button
              type="button"
              className="link-btn"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => st.resetInspectorOrder(tab)}
            >
              {t('resetOrder')}
            </button>
          </p>
        )}

        {/* Le menu d'ajout servait l'onglet personnalisé ; il sert maintenant les
            trois : un bloc y va, et son bouton « retirer » le renvoie chez lui. */}
        {addable.length > 0 && (
          <div className="add-block">
            <ChoiceButton
              value=""
              options={[
                { id: '', label: t('addBlock') },
                ...addable.map((id) => ({ id, label: blockTitle(id, t) })),
              ]}
              onChange={(id) => id && st.moveBlockToTab(id as InspectorBlockId, tab)}
            />
          </div>
        )}
      </div>


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
  target: 'targetDuration', layout: 'layout', output: 'output', takes: 'takes', presets: 'presetsBlock',
  transcription: 'sttBlock', ai: 'aiBlock', clicker: 'clicker', controls: 'controls',
};
function blockTitle(id: InspectorBlockId, t: (k: StringKey) => string) {
  return t(BLOCK_TITLE_KEYS[id]);
}

/** Pied du panneau : version et vérification de mise à jour */
/** Liste des prises : lecture, renommage, note, marqueurs, verrou, export */
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
