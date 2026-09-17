import { create } from 'zustand';
import { tr, type StringKey } from '../shared/i18n';
import {
  autoTitle, clamp, countWords, FONT_MAX, FONT_MIN, FONT_STEP, progressAt,
  WPM_MAX, WPM_MIN, WPM_STEP,
  type AppInfo, type DisplayInfo, type OutputState, type Playback, type Prefs, type Script, type Settings,
} from '../shared/types';

export const api = window.cari;

export const DEFAULT_SETTINGS: Settings = {
  fontSize: 72,
  mirror: 'horizontal',
  mirrorPreview: false,
  alignment: 'left',
  readingLine: 0.33,
  margin: 0.08,
  countdownEnabled: true,
  invertScroll: false,
  outputDisplayId: null,
  selectedScriptId: null,
  showInspector: true,
  editorWidth: 380,
  language: 'en',
  theme: 'system',
  showReadingLine: true,
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

function newScript(text = '', wpm = 140, title?: string): Script {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: title ?? autoTitle(text, t('untitled')),
    autoTitle: title === undefined,
    text,
    wordCount: countWords(text),
    wpm,
    targetEnabled: false,
    targetDuration: 60,
    createdAt: now,
    updatedAt: now,
  };
}

export function effectiveWpm(s: Script | undefined): number {
  if (!s) return 140;
  if (s.targetEnabled && s.wordCount > 0 && s.targetDuration > 0) {
    return clamp(s.wordCount / (s.targetDuration / 60), WPM_MIN, WPM_MAX);
  }
  return s.wpm;
}

export function targetWpm(s: Script | undefined): number | null {
  if (!s || s.wordCount === 0 || s.targetDuration <= 0) return null;
  return s.wordCount / (s.targetDuration / 60);
}

export function totalDuration(s: Script | undefined): number {
  if (!s || s.wordCount === 0) return 0;
  return (s.wordCount / effectiveWpm(s)) * 60;
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
}

interface Actions {
  init(): Promise<void>;
  current(): Script | undefined;
  progressNow(): number;

  select(id: string): void;
  createScript(): void;
  duplicate(id: string): void;
  rename(id: string, title: string): void;
  remove(id: string): void;
  undoRemove(): void;
  updateText(text: string): void;

  setWpm(v: number): void;
  adjustSpeed(steps: number): void;
  setTargetEnabled(v: boolean): void;
  setTargetDuration(sec: number): void;
  setFont(v: number): void;
  adjustFont(steps: number): void;
  setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void;

  togglePlay(): void;
  play(): void;
  pause(): void;
  stop(): void;
  seek(seconds: number): void;
  jump(p: number): void;

  importPaths(paths: string[]): Promise<void>;
  importDialog(): Promise<void>;
  exportScript(id: string): Promise<void>;

  setDisplays(d: DisplayInfo[]): void;
  toggleOutput(): void;
  setOutputActive(v: boolean): void;

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
let bannerSeq = 0;

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
    set((st) => ({ playback: { ...st.playback, isPlaying: true, countdown: null, anchorTime: Date.now() } }));
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
    playback: { anchorProgress: 0, anchorTime: Date.now(), isPlaying: false, countdown: null, totalDuration: 0 },
    displays: [],
    outputActive: false,
    banner: null,
    editing: false,
    dropActive: false,

    async init() {
      const [info, stored, displays, prefs] = await Promise.all([
        api.appInfo(), api.loadStorage(), api.getDisplays(), api.getPrefs(),
      ]);
      const settings: Settings = { ...DEFAULT_SETTINGS, ...((stored.settings as Partial<Settings>) ?? {}), ...prefs };
      set({ settings });
      let scripts = Array.isArray(stored.scripts) ? (stored.scripts as Script[]) : [];
      scripts = scripts.map((s) => ({ ...s, wordCount: countWords(s.text ?? '') }));

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
      set({
        ready: true, info, scripts, settings, displays,
        playback: { anchorProgress: 0, anchorTime: Date.now(), isPlaying: false, countdown: null, totalDuration: totalDuration(cur) },
      });
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
      if (id === get().settings.selectedScriptId) return;
      get().stop();
      const s = get().scripts.find((x) => x.id === id);
      set((st) => ({
        settings: { ...st.settings, selectedScriptId: id },
        playback: { ...st.playback, anchorProgress: 0, anchorTime: Date.now(), totalDuration: totalDuration(s) },
      }));
    },

    createScript() {
      const s = newScript('', effectiveWpm(get().current()));
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
      let next = scripts.filter((s) => s.id !== id);
      if (next.length === 0) next = [newScript('', removed.wpm)];
      set({ scripts: next });
      if (settings.selectedScriptId === id) {
        const target = next[Math.min(i, next.length - 1)].id;
        set((st) => ({ settings: { ...st.settings, selectedScriptId: null } }));
        get().select(target);
      }
      get().showBanner(t('deleted', { title: displayTitle(removed) }), { canUndo: true });
    },

    undoRemove() {
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
      mutateCurrent((s) => ({
        ...s,
        text,
        wordCount: countWords(text),
        title: s.autoTitle ? autoTitle(text, t('untitled')) : s.title,
      }));
    },

    // MARK: Vitesse / taille

    setWpm(v) {
      const stepped = clamp(Math.round(v / WPM_STEP) * WPM_STEP, WPM_MIN, WPM_MAX);
      mutateCurrent((s) => ({ ...s, wpm: stepped, targetEnabled: false }));
    },

    adjustSpeed(steps) {
      get().setWpm(effectiveWpm(get().current()) + steps * WPM_STEP);
    },

    setTargetEnabled(v) {
      mutateCurrent((s) => ({ ...s, targetEnabled: v, wpm: v ? s.wpm : Math.round(effectiveWpm(s)) }));
    },

    setTargetDuration(sec) {
      mutateCurrent((s) => ({ ...s, targetDuration: Math.max(0, Math.round(sec)) }));
    },

    setFont(v) {
      get().setSetting('fontSize', clamp(v, FONT_MIN, FONT_MAX));
    },

    adjustFont(steps) {
      get().setFont(get().settings.fontSize + steps * FONT_STEP);
    },

    setSetting(key, value) {
      set((st) => ({ settings: { ...st.settings, [key]: value } }));
      if (key === 'outputDisplayId' && get().outputActive) {
        if (value === null) api.hideOutput();
        else api.showOutput(value as number);
      }
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
      set({ playback: { ...pb, isPlaying: false } });
      stopTimers();
    },

    stop() {
      cancelCountdown();
      get().pause();
    },

    seek(seconds) {
      const { playback } = get();
      if (playback.totalDuration <= 0) return;
      get().jump(get().progressNow() + seconds / playback.totalDuration);
    },

    jump(p) {
      set((st) => ({ playback: { ...st.playback, anchorProgress: clamp(p, 0, 1), anchorTime: Date.now() } }));
    },

    // MARK: Import / export

    async importPaths(paths) {
      if (paths.length === 0) return;
      const results = await api.importFiles(paths);
      const ok = results.filter((r) => r.text !== undefined);
      const errors = results.filter((r) => r.error).map((r) => r.error!);
      if (paths.length > results.length) errors.push(t('someUnsupported'));

      if (ok.length) {
        const wpm = effectiveWpm(get().current());
        const created = ok.map((r) => newScript(r.text!, wpm, r.title));
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

    // MARK: Sortie

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
  let lastOutputJSON = '';

  const pushOutput = (st: State & Actions) => {
    const cur = st.current();
    const out: OutputState = {
      text: cur?.text ?? '',
      fontSize: st.settings.fontSize,
      alignment: st.settings.alignment,
      margin: st.settings.margin,
      readingLine: st.settings.readingLine,
      mirror: st.settings.mirror,
      showReadingLine: st.settings.showReadingLine,
      playback: st.playback,
    };
    const json = JSON.stringify(out);
    if (json !== lastOutputJSON) {
      lastOutputJSON = json;
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
    if (st.scripts !== prev.scripts || st.settings !== prev.settings || st.playback !== prev.playback) {
      pushOutput(st);
    }
  });

  pushOutput(useStore.getState());
  api.onDisplaysChanged((d) => useStore.getState().setDisplays(d));
  api.onOutputActive((v) => useStore.getState().setOutputActive(v));
  api.onPrefsChanged((p) => useStore.getState().applyPrefs(p));
}
