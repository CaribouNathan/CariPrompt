import { create } from 'zustand';
import { tr, type StringKey } from '../shared/i18n';
import { normalizeMarks, remapMarks } from '../shared/marks';
import {
  autoTitle, clamp, countWords, DEFAULT_LINE_HEIGHT, DEFAULT_SPEED, FONT_MAX, FONT_MIN, FONT_STEP,
  INSPECTOR_BLOCKS, sanitizeInspectorOrder,
  LINE_HEIGHT_MAX, LINE_HEIGHT_MIN, PROJECT_SETTING_KEYS, progressAt, SPEED_MAX, SPEED_MIN, SPEED_STEP,
  WPM_PER_SPEED,
  type AppInfo, type ClickerAction, type DisplayInfo, type InspectorBlockId, type OutputState,
  type Playback, type Prefs,
  type ProjectFile, type ProjectReadResult, type ProjectSettings, type Script, type Settings,
  type StyleMark, type Template, type TextStyle,
} from '../shared/types';

export const api = window.cari;

export const DEFAULT_COLORS = {
  textColor: '#ffffff',
  backgroundColor: '#000000',
  markerColor: '#0a84ff',
};

export const DEFAULT_SETTINGS: Settings = {
  fontSize: 72,
  fontFamily: '',
  fontWeight: 600,
  italic: false,
  uppercase: false,
  ...DEFAULT_COLORS,
  lineHeight: DEFAULT_LINE_HEIGHT,
  margin: 0.08,
  alignment: 'left',
  readingLine: 0.33,
  showReadingLine: true,
  mirror: 'horizontal',
  mirrorPreview: false,
  mirrorFullscreen: false,
  countdownEnabled: true,
  timecode: 'off',
  invertScroll: false,
  wheelPreview: 'navigate',
  clickerNext: 'playPause',
  clickerPrev: 'back10',
  inspectorOrder: [...INSPECTOR_BLOCKS],
  templates: [],
  outputDisplayId: null,
  selectedScriptId: null,
  showInspector: true,
  editorWidth: 380,
  language: 'en',
  theme: 'system',
  welcomeSeeded: false,
};

export interface Banner {
  id: number;
  message: string;
  canUndo: boolean;
  isError: boolean;
}

/** Traduction dans la langue courante (hors composants React) */
export function t(key: StringKey, vars?: Record<string, string | number>): string {
  return tr(useStore.getState().settings.language, key, vars);
}

/** Titre affiché : le titre automatique suit la langue courante */
export function displayTitle(s: Script): string {
  return s.autoTitle ? autoTitle(s.text, t('untitled')) : s.title;
}

function newScript(text = '', speed = DEFAULT_SPEED, title?: string): Script {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: title ?? autoTitle(text, t('untitled')),
    autoTitle: title === undefined,
    text,
    marks: [],
    wordCount: countWords(text),
    speed,
    targetEnabled: false,
    targetDuration: 60,
    createdAt: now,
    updatedAt: now,
  };
}

/** Vitesse demandée par la durée cible (non bornée) */
export function targetSpeed(s: Script | undefined): number | null {
  if (!s || s.wordCount === 0 || s.targetDuration <= 0) return null;
  return s.wordCount / (s.targetDuration / 60) / WPM_PER_SPEED;
}

/** Vitesse effective 0–100 (la durée cible prime si elle est active) */
export function effectiveSpeed(s: Script | undefined): number {
  if (!s) return DEFAULT_SPEED;
  if (s.targetEnabled) {
    const ts = targetSpeed(s);
    if (ts !== null) return clamp(ts, SPEED_MIN, SPEED_MAX);
  }
  return s.speed;
}

/** Durée totale en secondes (Infinity à vitesse 0) */
export function totalDuration(s: Script | undefined): number {
  if (!s || s.wordCount === 0) return 0;
  const wpm = effectiveSpeed(s) * WPM_PER_SPEED;
  return wpm > 0 ? (s.wordCount / wpm) * 60 : Infinity;
}

export function textStyle(st: Settings): TextStyle {
  return {
    fontSize: st.fontSize,
    fontFamily: st.fontFamily,
    fontWeight: st.fontWeight,
    italic: st.italic,
    uppercase: st.uppercase,
    textColor: st.textColor,
    backgroundColor: st.backgroundColor,
    markerColor: st.markerColor,
    lineHeight: st.lineHeight,
    margin: st.margin,
    alignment: st.alignment,
    readingLine: st.readingLine,
    showReadingLine: st.showReadingLine,
    timecode: st.timecode,
  };
}

/** Mesures fournies par l'aperçu : débuts de paragraphes et position d'un caractère */
export interface PreviewMetrics {
  stops: () => number[];
  progressForOffset: (offset: number) => number | null;
}
let previewMetrics: PreviewMetrics | null = null;
export function registerPreviewMetrics(m: PreviewMetrics | null) {
  previewMetrics = m;
}

interface State {
  ready: boolean;
  info: AppInfo;
  scripts: Script[];
  settings: Settings;
  playback: Playback;
  displays: DisplayInfo[];
  outputActive: boolean;
  banner: Banner | null;
  editing: boolean;
  dropActive: boolean;
  /** Textes sélectionnés dans la colonne de gauche (le dernier est celui chargé) */
  selectedIds: string[];
  blackout: boolean;
  fullscreen: boolean;
  fonts: string[] | null;
}

interface Actions {
  init(): Promise<void>;
  current(): Script | undefined;
  progressNow(): number;

  select(id: string): void;
  selectRange(id: string): void;
  toggleSelect(id: string): void;
  createScript(): void;
  duplicate(id: string): void;
  rename(id: string, title: string): void;
  remove(id: string): void;
  removeMany(ids: string[]): void;
  duplicateMany(ids: string[]): void;
  undoRemove(): void;
  _undoSingle(): void;
  updateText(text: string): void;
  updateRich(text: string, marks: StyleMark[]): void;
  setMarks(marks: StyleMark[]): void;

  setSpeed(v: number): void;
  adjustSpeed(steps: number): void;
  setTargetEnabled(v: boolean): void;
  setTargetDuration(sec: number): void;
  setFont(v: number): void;
  adjustFont(steps: number): void;
  setLineHeight(v: number): void;
  setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void;
  resetColors(): void;
  moveInspectorBlock(from: InspectorBlockId, to: InspectorBlockId): void;
  resetInspectorOrder(): void;
  loadFonts(): Promise<string[]>;
  saveTemplate(name: string): void;
  applyTemplate(id: string): void;
  deleteTemplate(id: string): void;

  togglePlay(): void;
  play(): void;
  pause(): void;
  stop(): void;
  seek(seconds: number): void;
  jump(p: number): void;
  paragraph(direction: 1 | -1): void;
  jumpToOffset(offset: number): void;
  runClicker(action: ClickerAction): void;
  toggleBlackout(): void;

  importPaths(paths: string[]): Promise<void>;
  importDialog(): Promise<void>;
  exportScript(id: string): Promise<void>;
  saveProject(): Promise<void>;
  openProjectDialog(): Promise<void>;
  loadProject(r: ProjectReadResult): void;

  setDisplays(d: DisplayInfo[]): void;
  toggleOutput(): void;
  setOutputActive(v: boolean): void;
  setFullscreen(on: boolean): void;
  fullscreenChanged(on: boolean): void;

  showBanner(message: string, opts?: { canUndo?: boolean; isError?: boolean }): void;
  dismissBanner(): void;
  setEditing(v: boolean): void;
  setDropActive(v: boolean): void;
  applyPrefs(p: Prefs): void;
  flush(): Promise<void>;
}

let countdownTimer: number | null = null;
let endTimer: number | null = null;
let bannerTimer: number | null = null;
let wakeLock: WakeLockSentinel | null = null;
let lastDeleted: { script: Script; index: number } | null = null;
let lastDeletedMany: Array<{ script: Script; index: number }> | null = null;
let bannerSeq = 0;

const freshPlayback = (totalDuration: number): Playback => ({
  anchorProgress: 0,
  anchorTime: Date.now(),
  isPlaying: false,
  countdown: null,
  totalDuration,
  chronoMs: 0,
  chronoStartedAt: null,
});

/** Conversion d'un texte enregistré par une version antérieure */
function migrateScript(raw: Script): Script {
  const speed = typeof raw.speed === 'number'
    ? raw.speed
    : Math.round((raw.wpm ?? DEFAULT_SPEED * WPM_PER_SPEED) / WPM_PER_SPEED);
  const { wpm: _legacy, ...rest } = raw;
  const text = raw.text ?? '';
  return {
    ...rest,
    text,
    marks: normalizeMarks(text, Array.isArray(raw.marks) ? raw.marks : []),
    speed: clamp(speed, SPEED_MIN, SPEED_MAX),
    wordCount: countWords(text),
  };
}

export const useStore = create<State & Actions>()((set, get) => {
  /** Fige la position avant toute modification qui change la durée totale. */
  const freeze = (): Playback => {
    const pb = get().playback;
    const now = Date.now();
    return { ...pb, anchorProgress: progressAt(pb, now), anchorTime: now };
  };

  /** Applique une modification au texte courant en conservant la position de lecture. */
  const mutateCurrent = (fn: (s: Script) => Script) => {
    const { scripts, settings } = get();
    const idx = scripts.findIndex((s) => s.id === settings.selectedScriptId);
    if (idx < 0) return;
    const pb = freeze();
    const updated = { ...fn(scripts[idx]), updatedAt: new Date().toISOString() };
    const next = scripts.slice();
    next[idx] = updated;
    set({ scripts: next, playback: { ...pb, totalDuration: totalDuration(updated) } });
  };

  const stopTimers = () => {
    if (endTimer !== null) { clearInterval(endTimer); endTimer = null; }
    wakeLock?.release().catch(() => undefined);
    wakeLock = null;
  };

  const cancelCountdown = () => {
    if (countdownTimer !== null) { clearTimeout(countdownTimer); countdownTimer = null; }
    set((st) => ({ playback: { ...st.playback, countdown: null } }));
  };

  const startPlayback = () => {
    const now = Date.now();
    set((st) => ({
      playback: { ...st.playback, isPlaying: true, countdown: null, anchorTime: now, chronoStartedAt: now },
    }));
    navigator.wakeLock?.request('screen').then((l) => { wakeLock = l; }).catch(() => undefined);
    endTimer = window.setInterval(() => {
      const { playback } = get();
      if (playback.isPlaying && progressAt(playback, Date.now()) >= 1) get().pause();
    }, 100);
  };

  return {
    ready: false,
    info: { version: '', platform: 'darwin', naturalScroll: true },
    scripts: [],
    settings: DEFAULT_SETTINGS,
    playback: freshPlayback(0),
    displays: [],
    outputActive: false,
    banner: null,
    editing: false,
    dropActive: false,
    selectedIds: [],
    blackout: false,
    fullscreen: false,
    fonts: null,

    async init() {
      const [info, stored, displays, prefs, fullscreen] = await Promise.all([
        api.appInfo(), api.loadStorage(), api.getDisplays(), api.getPrefs(), api.isFullscreen(),
      ]);
      const settings: Settings = { ...DEFAULT_SETTINGS, ...((stored.settings as Partial<Settings>) ?? {}), ...prefs };
      // L'ordre des blocs repart de la disposition par défaut à chaque lancement ;
      // seuls les préréglages et les projets le restituent.
      settings.inspectorOrder = [...INSPECTOR_BLOCKS];
      set({ settings });
      let scripts = Array.isArray(stored.scripts) ? (stored.scripts as Script[]).map(migrateScript) : [];

      // Textes de bienvenue : anglais (chargé) puis français, ajoutés une seule fois
      if (!settings.welcomeSeeded || scripts.length === 0) {
        const enText = tr('en', 'sampleText');
        const frText = tr('fr', 'sampleText');
        const added: Script[] = [];
        if (!scripts.some((s) => s.text === enText)) added.push(newScript(enText));
        if (scripts.length === 0) added.push(newScript(frText));
        scripts = [...added, ...scripts];
        if (added.length) settings.selectedScriptId = added[0].id;
        settings.welcomeSeeded = true;
      }

      if (!scripts.some((s) => s.id === settings.selectedScriptId)) settings.selectedScriptId = scripts[0].id;
      if (!displays.some((d) => d.id === settings.outputDisplayId)) {
        settings.outputDisplayId = displays.find((d) => !d.primary)?.id ?? null;
      }
      const cur = scripts.find((s) => s.id === settings.selectedScriptId);
      set({ ready: true, info, scripts, settings, displays, fullscreen, playback: freshPlayback(totalDuration(cur)) });
    },

    current() {
      const { scripts, settings } = get();
      return scripts.find((s) => s.id === settings.selectedScriptId);
    },

    progressNow() {
      return progressAt(get().playback, Date.now());
    },

    // MARK: Bibliothèque

    select(id) {
      set({ selectedIds: [id] });
      if (id === get().settings.selectedScriptId) return;
      get().stop();
      const s = get().scripts.find((x) => x.id === id);
      set((st) => ({
        settings: { ...st.settings, selectedScriptId: id },
        playback: freshPlayback(totalDuration(s)),
      }));
    },

    /** Maj + clic : étend la sélection depuis le texte chargé */
    selectRange(id) {
      const { scripts, settings, selectedIds } = get();
      const anchorId = settings.selectedScriptId ?? selectedIds[0] ?? id;
      const a = scripts.findIndex((s) => s.id === anchorId);
      const b = scripts.findIndex((s) => s.id === id);
      if (a < 0 || b < 0) return;
      const [from, to] = a <= b ? [a, b] : [b, a];
      set({ selectedIds: scripts.slice(from, to + 1).map((s) => s.id) });
    },

    /** ⌘ ou Ctrl + clic : ajoute ou retire un texte de la sélection */
    toggleSelect(id) {
      const { selectedIds, settings } = get();
      const base = selectedIds.length ? selectedIds : (settings.selectedScriptId ? [settings.selectedScriptId] : []);
      const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
      if (next.length === 0) return;
      set({ selectedIds: next });
      if (!next.includes(settings.selectedScriptId ?? '')) {
        const target = next[next.length - 1];
        set((st) => ({ settings: { ...st.settings, selectedScriptId: null } }));
        get().select(target);
        set({ selectedIds: next });
      }
    },

    createScript() {
      const s = newScript('', effectiveSpeed(get().current()));
      set((st) => ({ scripts: [s, ...st.scripts] }));
      get().select(s.id);
    },

    duplicate(id) {
      const { scripts } = get();
      const i = scripts.findIndex((s) => s.id === id);
      if (i < 0) return;
      const now = new Date().toISOString();
      const copy: Script = {
        ...scripts[i], id: crypto.randomUUID(), title: `${displayTitle(scripts[i])}${t('copySuffix')}`,
        autoTitle: false, createdAt: now, updatedAt: now,
      };
      const next = scripts.slice();
      next.splice(i + 1, 0, copy);
      set({ scripts: next });
      get().select(copy.id);
    },

    rename(id, title) {
      set((st) => ({
        scripts: st.scripts.map((s) => {
          if (s.id !== id) return s;
          const empty = title.trim().length === 0;
          return { ...s, autoTitle: empty, title: empty ? autoTitle(s.text, t('untitled')) : title, updatedAt: new Date().toISOString() };
        }),
      }));
    },

    remove(id) {
      const { scripts, settings } = get();
      const i = scripts.findIndex((s) => s.id === id);
      if (i < 0) return;
      const removed = scripts[i];
      lastDeleted = { script: removed, index: i };
      lastDeletedMany = null;
      let next = scripts.filter((s) => s.id !== id);
      if (next.length === 0) next = [newScript('', removed.speed)];
      set({ scripts: next });
      if (settings.selectedScriptId === id) {
        const target = next[Math.min(i, next.length - 1)].id;
        set((st) => ({ settings: { ...st.settings, selectedScriptId: null } }));
        get().select(target);
      }
      get().showBanner(t('deleted', { title: displayTitle(removed) }), { canUndo: true });
    },

    removeMany(ids) {
      if (ids.length <= 1) { get().remove(ids[0]); return; }
      const { scripts } = get();
      const removed = scripts
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => ids.includes(s.id));
      lastDeletedMany = removed.map(({ s, i }) => ({ script: s, index: i }));
      lastDeleted = null;
      let next = scripts.filter((s) => !ids.includes(s.id));
      if (next.length === 0) next = [newScript('', DEFAULT_SPEED)];
      const keep = next[Math.min(removed[0].i, next.length - 1)].id;
      set({ scripts: next, selectedIds: [keep] });
      set((st) => ({ settings: { ...st.settings, selectedScriptId: null } }));
      get().select(keep);
      get().showBanner(t('deletedMany', { n: ids.length }), { canUndo: true });
    },

    duplicateMany(ids) {
      for (const id of ids) get().duplicate(id);
    },

    undoRemove() {
      if (lastDeletedMany) {
        const batch = lastDeletedMany;
        lastDeletedMany = null;
        let scripts = get().scripts;
        if (scripts.length === 1 && scripts[0].wordCount === 0) scripts = [];
        const next = scripts.slice();
        for (const { script, index } of batch) next.splice(Math.min(index, next.length), 0, script);
        set({ scripts: next, selectedIds: batch.map((b) => b.script.id) });
        get().select(batch[0].script.id);
        set({ selectedIds: batch.map((b) => b.script.id) });
        get().dismissBanner();
        return;
      }
      return get()._undoSingle();
    },

    _undoSingle() {
      if (!lastDeleted) return;
      const { script, index } = lastDeleted;
      lastDeleted = null;
      let scripts = get().scripts;
      if (scripts.length === 1 && scripts[0].wordCount === 0) scripts = [];
      const next = scripts.slice();
      next.splice(Math.min(index, next.length), 0, script);
      set({ scripts: next });
      get().select(script.id);
      get().dismissBanner();
    },

    updateText(text) {
      const cur = get().current();
      get().updateRich(text, cur ? remapMarks(cur.marks, cur.text, text) : []);
    },

    updateRich(text, marks) {
      mutateCurrent((s) => ({
        ...s,
        text,
        marks: normalizeMarks(text, marks),
        wordCount: countWords(text),
        title: s.autoTitle ? autoTitle(text, t('untitled')) : s.title,
      }));
    },

    setMarks(marks) {
      mutateCurrent((s) => ({ ...s, marks: normalizeMarks(s.text, marks) }));
    },

    // MARK: Vitesse / texte

    setSpeed(v) {
      const stepped = clamp(Math.round(v / SPEED_STEP) * SPEED_STEP, SPEED_MIN, SPEED_MAX);
      mutateCurrent((s) => ({ ...s, speed: stepped, targetEnabled: false }));
    },

    adjustSpeed(steps) {
      get().setSpeed(Math.round(effectiveSpeed(get().current())) + steps * SPEED_STEP);
    },

    setTargetEnabled(v) {
      mutateCurrent((s) => ({ ...s, targetEnabled: v, speed: v ? s.speed : Math.round(effectiveSpeed(s)) }));
    },

    setTargetDuration(sec) {
      mutateCurrent((s) => ({ ...s, targetDuration: Math.max(0, Math.round(sec)) }));
    },

    setFont(v) {
      get().setSetting('fontSize', clamp(Math.round(v), FONT_MIN, FONT_MAX));
    },

    adjustFont(steps) {
      get().setFont(get().settings.fontSize + steps * FONT_STEP);
    },

    setLineHeight(v) {
      get().setSetting('lineHeight', clamp(Math.round(v * 20) / 20, LINE_HEIGHT_MIN, LINE_HEIGHT_MAX));
    },

    setSetting(key, value) {
      set((st) => ({ settings: { ...st.settings, [key]: value } }));
      if (key === 'outputDisplayId' && get().outputActive) {
        if (value === null) api.hideOutput();
        else api.showOutput(value as number);
      }
    },

    resetColors() {
      set((st) => ({ settings: { ...st.settings, ...DEFAULT_COLORS } }));
    },

    moveInspectorBlock(from, to) {
      if (from === to) return;
      const order = get().settings.inspectorOrder;
      const movingDown = order.indexOf(from) < order.indexOf(to);
      const next = order.filter((id) => id !== from);
      next.splice(next.indexOf(to) + (movingDown ? 1 : 0), 0, from);
      set((st) => ({ settings: { ...st.settings, inspectorOrder: next } }));
    },

    resetInspectorOrder() {
      set((st) => ({ settings: { ...st.settings, inspectorOrder: [...INSPECTOR_BLOCKS] } }));
    },

    async loadFonts() {
      const cached = get().fonts;
      if (cached) return cached;
      const fonts = await api.listFonts();
      set({ fonts });
      return fonts;
    },

    saveTemplate(name) {
      const clean = name.trim();
      if (!clean) return;
      const { settings } = get();
      const preset = {} as ProjectSettings;
      for (const k of PROJECT_SETTING_KEYS) (preset as unknown as Record<string, unknown>)[k] = settings[k];
      const existing = settings.templates.find((tpl) => tpl.name.toLowerCase() === clean.toLowerCase());
      const tplList = existing
        ? settings.templates.map((tpl) => (tpl.id === existing.id ? { ...tpl, settings: preset } : tpl))
        : [...settings.templates, { id: crypto.randomUUID(), name: clean, settings: preset, createdAt: new Date().toISOString() }];
      set((st) => ({ settings: { ...st.settings, templates: tplList } }));
      get().showBanner(t('templateSaved', { name: clean }));
    },

    applyTemplate(id) {
      const tpl = get().settings.templates.find((x) => x.id === id);
      if (!tpl) return;
      const applied: Partial<Settings> = {};
      for (const k of PROJECT_SETTING_KEYS) {
        const v = (tpl.settings as unknown as Record<string, unknown>)[k];
        if (v === undefined) continue;
        if (k === 'inspectorOrder') applied.inspectorOrder = sanitizeInspectorOrder(v);
        else if (typeof v === typeof DEFAULT_SETTINGS[k]) (applied as Record<string, unknown>)[k] = v;
      }
      set((st) => ({ settings: { ...st.settings, ...applied } }));
      get().showBanner(t('templateApplied', { name: tpl.name }));
    },

    deleteTemplate(id) {
      set((st) => ({ settings: { ...st.settings, templates: st.settings.templates.filter((x) => x.id !== id) } }));
    },

    // MARK: Lecture

    togglePlay() {
      const { playback } = get();
      if (playback.countdown !== null) { cancelCountdown(); return; }
      if (playback.isPlaying) get().pause(); else get().play();
    },

    play() {
      const { playback, settings } = get();
      const cur = get().current();
      if (!cur || cur.wordCount === 0 || playback.isPlaying || playback.countdown !== null) return;
      if (playback.anchorProgress >= 1) get().jump(0);
      if (!settings.countdownEnabled) { startPlayback(); return; }

      const tick = (n: number) => {
        if (n === 0) { countdownTimer = null; startPlayback(); return; }
        set((st) => ({ playback: { ...st.playback, countdown: n } }));
        countdownTimer = window.setTimeout(() => tick(n - 1), 1000);
      };
      tick(3);
    },

    pause() {
      if (!get().playback.isPlaying) return;
      const pb = freeze();
      const now = Date.now();
      set({
        playback: {
          ...pb,
          isPlaying: false,
          chronoMs: pb.chronoMs + (pb.chronoStartedAt !== null ? now - pb.chronoStartedAt : 0),
          chronoStartedAt: null,
        },
      });
      stopTimers();
    },

    stop() {
      cancelCountdown();
      get().pause();
    },

    seek(seconds) {
      const { playback } = get();
      let total = playback.totalDuration;
      // À vitesse 0, le pas de 10 s est calculé sur la vitesse par défaut
      if (!Number.isFinite(total)) {
        const cur = get().current();
        total = cur && cur.wordCount > 0 ? (cur.wordCount / (DEFAULT_SPEED * WPM_PER_SPEED)) * 60 : 0;
      }
      if (total <= 0) return;
      get().jump(get().progressNow() + seconds / total);
    },

    jump(p) {
      const target = clamp(p, 0, 1);
      set((st) => {
        const now = Date.now();
        const pb = { ...st.playback, anchorProgress: target, anchorTime: now };
        // Retour au début : le chrono de la prise repart de zéro
        if (target === 0) {
          pb.chronoMs = 0;
          pb.chronoStartedAt = pb.isPlaying ? now : null;
        }
        return { playback: pb };
      });
    },

    paragraph(direction) {
      const stops = previewMetrics?.stops() ?? [0];
      const p = get().progressNow();
      if (direction > 0) {
        const next = stops.find((s) => s > p + 0.002);
        if (next !== undefined) get().jump(next);
      } else {
        const prev = [...stops].reverse().find((s) => s < p - 0.01);
        get().jump(prev ?? 0);
      }
    },

    jumpToOffset(offset) {
      const p = previewMetrics?.progressForOffset(offset);
      if (p !== null && p !== undefined) get().jump(p);
    },

    runClicker(action) {
      const s = get();
      switch (action) {
        case 'playPause': s.togglePlay(); break;
        case 'faster': s.adjustSpeed(+1); break;
        case 'slower': s.adjustSpeed(-1); break;
        case 'forward10': s.seek(10); break;
        case 'back10': s.seek(-10); break;
        case 'nextParagraph': s.paragraph(1); break;
        case 'prevParagraph': s.paragraph(-1); break;
        case 'rewind': s.jump(0); break;
        default: break;
      }
    },

    toggleBlackout() {
      set((st) => ({ blackout: !st.blackout }));
    },

    // MARK: Import / export / projets

    async importPaths(paths) {
      if (paths.length === 0) return;
      const projects = paths.filter((p) => p.toLowerCase().endsWith('.cariprompt'));
      const docs = paths.filter((p) => !p.toLowerCase().endsWith('.cariprompt'));
      for (const p of projects) get().loadProject(await api.readProject(p));
      if (docs.length === 0) return;

      const results = await api.importFiles(docs);
      const ok = results.filter((r) => r.text !== undefined);
      const errors = results.filter((r) => r.error).map((r) => r.error!);
      if (docs.length > results.length) errors.push(t('someUnsupported'));

      if (ok.length) {
        const speed = Math.round(effectiveSpeed(get().current()));
        const created = ok.map((r) => newScript(r.text!, speed, r.title));
        set((st) => ({ scripts: [...created.reverse(), ...st.scripts] }));
        get().select(created[0].id);
      }
      if (errors.length) get().showBanner(errors.join('\n'), { isError: true });
      else if (ok.length > 1) get().showBanner(t('imported', { n: ok.length }));
    },

    async importDialog() {
      await get().importPaths(await api.importDialog());
    },

    async exportScript(id) {
      const s = get().scripts.find((x) => x.id === id);
      if (!s) return;
      try {
        await api.exportTxt(displayTitle(s), s.text);
      } catch (e) {
        get().showBanner(t('exportFailed', { msg: (e as Error).message }), { isError: true });
      }
    },

    async saveProject() {
      const { settings, info } = get();
      const cur = get().current();
      if (!cur) return;
      const projectSettings: Partial<ProjectSettings> = {};
      for (const k of PROJECT_SETTING_KEYS) (projectSettings as Record<string, unknown>)[k] = settings[k];
      const data: ProjectFile = {
        format: 'cariprompt',
        formatVersion: 1,
        appVersion: info.version,
        savedAt: new Date().toISOString(),
        script: {
          title: displayTitle(cur),
          text: cur.text,
          marks: cur.marks,
          speed: cur.speed,
          targetEnabled: cur.targetEnabled,
          targetDuration: cur.targetDuration,
        },
        settings: projectSettings,
      };
      try {
        const name = await api.saveProject(data, displayTitle(cur));
        if (name) get().showBanner(t('projectSaved', { name }));
      } catch (e) {
        get().showBanner(t('exportFailed', { msg: (e as Error).message }), { isError: true });
      }
    },

    async openProjectDialog() {
      const r = await api.openProjectDialog();
      if (r) get().loadProject(r);
    },

    loadProject(r) {
      if (!r.data) {
        get().showBanner(r.error ?? t('projectInvalid', { name: r.name }), { isError: true });
        return;
      }
      const { script, settings: ps } = r.data;
      // Réglages : seules les clés connues et du bon type sont reprises
      const applied: Partial<Settings> = {};
      for (const k of PROJECT_SETTING_KEYS) {
        const v = (ps as Record<string, unknown>)[k];
        if (v === undefined) continue;
        if (k === 'inspectorOrder') applied.inspectorOrder = sanitizeInspectorOrder(v);
        else if (typeof v === typeof DEFAULT_SETTINGS[k]) (applied as Record<string, unknown>)[k] = v;
      }
      set((st) => ({ settings: { ...st.settings, ...applied } }));

      const s = newScript(
        script.text,
        clamp(Number(script.speed) || DEFAULT_SPEED, SPEED_MIN, SPEED_MAX),
        script.title || r.name,
      );
      s.marks = normalizeMarks(s.text, Array.isArray(script.marks) ? script.marks : []);
      s.targetEnabled = !!script.targetEnabled;
      s.targetDuration = Number(script.targetDuration) || 60;
      set((st) => ({ scripts: [s, ...st.scripts] }));
      get().select(s.id);
      get().showBanner(t('projectOpened', { name: r.name }));
    },

    // MARK: Sortie / plein écran

    setDisplays(displays) {
      const { settings } = get();
      set({ displays });
      if (!displays.some((d) => d.id === settings.outputDisplayId)) {
        set({ outputActive: false });
        get().setSetting('outputDisplayId', displays.find((d) => !d.primary)?.id ?? null);
      }
    },

    toggleOutput() {
      const { outputActive, settings } = get();
      if (outputActive) api.hideOutput();
      else if (settings.outputDisplayId !== null) api.showOutput(settings.outputDisplayId);
    },

    setOutputActive(v) {
      set({ outputActive: v });
    },

    setFullscreen(on) {
      if (on) (document.activeElement as HTMLElement | null)?.blur();
      set({ fullscreen: on }); // affichage immédiat, confirmé par l'événement de la fenêtre
      api.setFullscreen(on);
    },

    fullscreenChanged(on) {
      set({ fullscreen: on });
    },

    // MARK: Interface

    showBanner(message, opts = {}) {
      if (bannerTimer !== null) clearTimeout(bannerTimer);
      const canUndo = !!opts.canUndo;
      set({ banner: { id: ++bannerSeq, message, canUndo, isError: !!opts.isError } });
      bannerTimer = window.setTimeout(() => {
        set({ banner: null });
        if (canUndo) lastDeleted = null;
      }, opts.isError ? 8000 : 6000);
    },

    dismissBanner() {
      if (bannerTimer !== null) clearTimeout(bannerTimer);
      set({ banner: null });
    },

    setEditing(v) { set({ editing: v }); },
    setDropActive(v) { set({ dropActive: v }); },

    applyPrefs(p) {
      set((st) => ({ settings: { ...st.settings, language: p.language, theme: p.theme } }));
      document.documentElement.lang = p.language;
    },

    async flush() {
      const st = get();
      await Promise.all([api.saveScripts(st.scripts), api.saveSettings(st.settings)]);
    },
  };
});

// MARK: - Persistance et synchronisation de la sortie

export function startSync() {
  let saveScriptsTimer: number | null = null;
  let saveSettingsTimer: number | null = null;
  let lastKey = '';

  const pushOutput = (st: State & Actions) => {
    const cur = st.current();
    const out: OutputState = {
      text: cur?.text ?? '',
      marks: cur?.marks ?? [],
      style: textStyle(st.settings),
      mirror: st.settings.mirror,
      blackout: st.blackout,
      playback: st.playback,
    };
    // Infinity n'existe pas en JSON : clé de comparaison uniquement
    const key = JSON.stringify(out, (_k, v) => (v === Infinity ? 'inf' : v));
    if (key !== lastKey) {
      lastKey = key;
      api.sendOutputState(out);
    }
  };

  useStore.subscribe((st, prev) => {
    if (!st.ready) return;
    if (st.scripts !== prev.scripts) {
      if (saveScriptsTimer !== null) clearTimeout(saveScriptsTimer);
      saveScriptsTimer = window.setTimeout(() => api.saveScripts(useStore.getState().scripts), 500);
    }
    if (st.settings !== prev.settings) {
      if (saveSettingsTimer !== null) clearTimeout(saveSettingsTimer);
      saveSettingsTimer = window.setTimeout(() => api.saveSettings(useStore.getState().settings), 500);
    }
    if (st.scripts !== prev.scripts || st.settings !== prev.settings
      || st.playback !== prev.playback || st.blackout !== prev.blackout) {
      pushOutput(st);
    }
  });

  pushOutput(useStore.getState());
  api.onDisplaysChanged((d) => useStore.getState().setDisplays(d));
  api.onOutputActive((v) => useStore.getState().setOutputActive(v));
  api.onPrefsChanged((p) => useStore.getState().applyPrefs(p));
  api.onFullscreenChanged((on) => useStore.getState().fullscreenChanged(on));
  api.onProjectLoaded((r) => useStore.getState().loadProject(r));
  api.rendererReady();
}
