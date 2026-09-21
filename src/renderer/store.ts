import { create } from 'zustand';
import { LANGUAGES, tr, type Lang, type StringKey } from '../shared/i18n';
import { normalizeMarks, remapMarks } from '../shared/marks';
import { listMicrophones, startRecording, type LiveStats, type RecorderHandle } from './recorder';
import { audioMime } from './wav';
import { assemble, prepare } from './aiText';
import { analyzeSpeech, guessLanguage } from './speechAnalysis';
import { buildCues, mergeCues, splitCue, toSrt } from './subtitles';
import { LiveAligner } from './liveAlign';
import { createTap, type PcmTap } from './pcmTap';
import {
  autoTitle, clamp, countWords, DEFAULT_LINE_HEIGHT, DEFAULT_SPEED, FONT_MAX, FONT_MIN, FONT_STEP,
  DEFAULT_LAYOUT, INSPECTOR_BLOCKS, INSPECTOR_TABS, homeTab, sanitizeLayout, sanitizeCollapsed, TAKE_EXT,
  LINE_HEIGHT_MAX, LINE_HEIGHT_MIN, PROJECT_SETTING_KEYS, progressAt, SPEED_MAX, SPEED_MIN, SPEED_STEP,
  WPM_PER_SPEED, AI_DEFAULT_MODELS,
  type AppInfo, type ClickerAction, type DisplayInfo, type InspectorBlockId, type InspectorTabId, type OutputState,
  type Playback, type Prefs,
  type ProjectFile, type ProjectReadResult, type ProjectSettings, type Script, type Settings,
  type AudioDeviceInfo, type CoachHint, type CoachHintKind, type StyleMark, type Take,
  type TakeMarker, type Template, type TextStyle, type UpdateInfo,
  type AiErrorCode, type AiKeyStatus, type AiModel, type AiProvider, type AiTask,
  type SttErrorCode, type SttModelId, type SttModelInfo, type SubtitleCue,
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
  inspectorLayout: freshLayout(),
  collapsedBlocks: [],
  coachEnabled: true,
  micDeviceId: '',
  aiProvider: 'anthropic',
  aiModels: { ...AI_DEFAULT_MODELS },
  aiTarget: 'en',
  sttModel: 'turbo',
  sttAuto: true,
  templates: [],
  outputDisplayId: null,
  selectedScriptId: null,
  showInspector: true,
  editorWidth: 380,
  language: 'en',
  theme: 'system',
  welcomeSeeded: false,
  seedVersion: 0,
  inspectorTab: 'essentials',
  updateCheck: true,
  updateSeen: '',
};

/** Écrit la liste d'un onglet dans la disposition */
function setLayout(
  set: (fn: (st: { settings: Settings }) => { settings: Settings }) => void,
  tab: InspectorTabId,
  list: InspectorBlockId[],
) {
  set((st) => ({ settings: { ...st.settings, inspectorLayout: { ...st.settings.inspectorLayout, [tab]: list } } }));
}

/** Copie neuve de la répartition par défaut (les tableaux ne sont jamais partagés) */
export function freshLayout() {
  return Object.fromEntries(INSPECTOR_TABS.map((tab) => [tab, [...DEFAULT_LAYOUT[tab]]])) as Settings['inspectorLayout'];
}

export interface Banner {
  id: number;
  message: string;
  canUndo: boolean;
  isError: boolean;
}

export const AI_PROVIDER_NAMES: Record<AiProvider, string> = {
  anthropic: 'Claude (Anthropic)',
  openai: 'OpenAI',
};

function aiErrorMessage(code: AiErrorCode, provider: AiProvider, detail = ''): string {
  const name = AI_PROVIDER_NAMES[provider];
  const key: Record<AiErrorCode, StringKey> = {
    noKey: 'aiErrNoKey', badKey: 'aiErrBadKey', noCredit: 'aiErrNoCredit', rateLimit: 'aiErrRateLimit', overloaded: 'aiErrOverloaded',
    network: 'aiErrNetwork', refused: 'aiErrRefused', badOutput: 'aiErrBadOutput', tooLong: 'aiErrTooLong',
    cancelled: 'aiCancelled', unknown: 'aiErrUnknown',
  };
  return t(key[code], { provider: name, detail: detail || code });
}

function sttErrorMessage(code: SttErrorCode, detail = ''): string {
  const key: Record<SttErrorCode, StringKey> = {
    engineUnavailable: 'sttErrEngine', noModel: 'sttErrNoModel', network: 'sttErrNetwork', extract: 'sttErrExtract',
    cancelled: 'aiCancelled', badAudio: 'sttErrBadAudio', unknown: 'sttErrUnknown',
  };
  return t(key[code], { detail: detail || code });
}

/** Traduction dans la langue courante (hors composants React) */
export function t(key: StringKey, vars?: Record<string, string | number>): string {
  return tr(useStore.getState().settings.language, key, vars);
}

/** Comparaison insensible à la casse et aux accents */
export function normalizeForSearch(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Titre affiché : le titre automatique suit la langue courante */
export function displayTitle(s: Script): string {
  return s.autoTitle ? autoTitle(s.text, t('untitled')) : s.title;
}

function newScript(text = '', speed = DEFAULT_SPEED, title?: string, lang?: Lang): Script {
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
    ...(lang ? { lang } : {}),
  };
}

const SEED_VERSION = 2;
const WELCOME_TITLE = 'Welcome';

/** Script « Welcome » puis un script de test par langue */
function seedScripts(): Script[] {
  const welcome = LANGUAGES.map((l) => tr(l.id, 'welcomeText')).join('\n\n');
  return [
    newScript(welcome, DEFAULT_SPEED, WELCOME_TITLE),
    ...LANGUAGES.map((l) => newScript(tr(l.id, 'testScriptText'), DEFAULT_SPEED, tr(l.id, 'testScriptTitle'), l.id)),
  ];
}

/** Ancien texte de bienvenue (≤ 2.0) jamais modifié par l'utilisateur */
function isPristineOldWelcome(s: Script): boolean {
  if (s.text === tr('en', 'sampleText') || s.text === tr('fr', 'sampleText')) return true;
  const head = s.text.trimStart();
  return (head.startsWith('Hello and welcome.') || head.startsWith('Bonjour et bienvenue.'))
    && s.updatedAt === s.createdAt && (s.marks?.length ?? 0) === 0;
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
  /** Filtre de la liste des textes, par mot-clé dans le titre (non enregistré) */
  searchQuery: string;
  takes: Take[];
  recording: boolean;
  recStats: LiveStats | null;
  hint: CoachHint | null;
  /** Message modal bloquant, affiché tant qu'il n'est pas acquitté */
  alert: StringKey | null;
  playingTakeId: string | null;
  compareIds: string[];
  /** État des clés API (null tant qu'il n'a pas été lu) */
  aiKeys: AiKeyStatus | null;
  aiModelList: Partial<Record<AiProvider, AiModel[]>>;
  aiModelError: Partial<Record<AiProvider, string>>;
  /** Fournisseur dont le compte a répondu « plus de crédit » ; effacé au prochain succès */
  aiNoCredit: AiProvider | null;
  /** Traduction ou adaptation en cours */
  aiJob: { id: string; kind: AiTask['kind']; done: number; total: number } | null;
  /** Modèles Whisper et leur présence sur le disque (null tant que non lus) */
  sttModels: SttModelInfo[] | null;
  sttDownload: { id: SttModelId; phase: 'download' | 'extract'; done: number; total: number } | null;
  /** Transcriptions en attente ou en cours, par prise */
  sttJobs: Record<string, { done: number; total: number }>;
  /** Prise ouverte dans l'éditeur de sous-titres */
  subtitleTakeId: string | null;
  /** Suivi vocal : le prompteur suit la voix au lieu d'une vitesse fixe */
  tracking: boolean;
  trackStatus: 'off' | 'loading' | 'listening' | 'following' | 'lost';
  mics: AudioDeviceInfo[];
  /** Position du curseur à restaurer après une annulation */
  pendingCaret: number | null;
  /** Profondeur d'historique du texte courant, pour activer les boutons */
  historyDepth: { past: number; future: number };
  fonts: string[] | null;
  /** Dernière vérification de mise à jour, null tant qu'aucune n'a abouti */
  update: UpdateInfo | null;
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
  moveInspectorBlock(tab: InspectorTabId, from: InspectorBlockId, to: InspectorBlockId): void;
  resetInspectorOrder(tab: InspectorTabId): void;
  addCustomBlock(id: InspectorBlockId): void;
  removeCustomBlock(id: InspectorBlockId): void;
  toggleBlockCollapsed(key: string): void;
  checkUpdate(silent?: boolean): Promise<void>;
  loadFonts(): Promise<string[]>;
  saveTemplate(name: string): void;
  applyTemplate(id: string): void;
  deleteTemplate(id: string): void;

  togglePlay(): void;
  /** `silent` évite le message d'alerte quand l'appel vient d'une prise */
  play(silent?: boolean): void;
  dismissAlert(): void;
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

  showBanner(message: string, opts?: { canUndo?: boolean; isError?: boolean; duration?: number }): void;
  dismissBanner(): void;
  setEditing(v: boolean): void;
  setSearchQuery(q: string): void;
  undo(): void;
  redo(): void;
  consumeCaret(): number | null;

  loadTakes(): Promise<void>;
  beginRecording(): Promise<void>;
  endRecording(): Promise<void>;
  renameTake(id: string, name: string): void;
  deleteTake(id: string): Promise<void>;
  toggleTakeLock(id: string): void;
  setTakeNote(id: string, note: string): void;
  addTakeMarker(id: string, time: number): void;
  removeTakeMarker(id: string, markerId: string): void;
  playTake(id: string): Promise<void>;
  stopTakePlayback(): void;
  revealTake(id: string): void;
  exportTake(id: string): Promise<void>;
  toggleCompare(id: string): void;
  loadMics(): Promise<void>;
  toggleTracking(): Promise<void>;
  toggleRecording(): void;
  loadSttModels(): Promise<void>;
  downloadSttModel(id: SttModelId): Promise<void>;
  cancelSttDownload(): void;
  deleteSttModel(id: SttModelId): Promise<void>;
  transcribeTake(takeId: string): Promise<void>;
  cancelTranscription(takeId: string): void;
  /** Recalcule l'analyse du discours d'une prise avec le texte actuel */
  analyzeTake(takeId: string): void;
  openSubtitles(takeId: string | null): void;
  rebuildSubtitles(takeId: string): void;
  updateCue(takeId: string, cueId: string, patch: Partial<SubtitleCue>): void;
  splitCueAt(takeId: string, cueId: string, at: number): void;
  mergeCueWithNext(takeId: string, cueId: string): void;
  deleteCue(takeId: string, cueId: string): void;
  exportSrt(takeId: string): Promise<void>;
  loadAiKeys(): Promise<void>;
  setAiKey(provider: AiProvider, key: string): Promise<void>;
  loadAiModels(provider: AiProvider): Promise<void>;
  runAi(task: AiTask): Promise<void>;
  cancelAi(): void;
  /** Usage interne : applique une modification à une prise et l'enregistre */
  _mutateTake(id: string, fn: (t: Take) => Take): void;
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

// MARK: - Historique d'édition (mémoire vive, par texte)

interface Snapshot { text: string; marks: StyleMark[] }
const history = new Map<string, { past: Snapshot[]; future: Snapshot[] }>();
const HISTORY_MAX = 200;
/** Deux frappes séparées de moins de cela comptent pour une seule annulation */
const COALESCE_MS = 600;
let lastPushAt = 0;
let lastPushId = '';

/** Position du premier caractère qui diffère, pour y replacer le curseur */
function diffCaret(oldText: string, newText: string): number {
  let i = 0;
  const max = Math.min(oldText.length, newText.length);
  while (i < max && oldText[i] === newText[i]) i++;
  return i;
}

let recorder: RecorderHandle | null = null;
let takePlayer: HTMLAudioElement | null = null;
/** Hystérésis du coach : une indication ne s'affiche qu'une fois stabilisée */
let hintCandidate: CoachHintKind | null = null;
let hintSince = 0;
let recordStart = { progress: 0, at: 0 };

/** Remplace le contenu d'un texte sans toucher à l'historique */
function applySnapshot(scriptId: string, snap: Snapshot, caret: number) {
  const st = useStore.getState();
  const scripts = st.scripts.map((x) => (
    x.id === scriptId
      ? {
        ...x,
        text: snap.text,
        marks: snap.marks,
        wordCount: countWords(snap.text),
        title: x.autoTitle ? autoTitle(snap.text, t('untitled')) : x.title,
        updatedAt: new Date().toISOString(),
      }
      : x
  ));
  const updated = scripts.find((x) => x.id === scriptId);
  useStore.setState({
    scripts,
    pendingCaret: caret,
    playback: { ...st.playback, totalDuration: totalDuration(updated) },
  });
  refreshHistoryDepth(scriptId);
}

function refreshHistoryDepth(scriptId: string) {
  const h = history.get(scriptId);
  useStore.setState({ historyDepth: { past: h?.past.length ?? 0, future: h?.future.length ?? 0 } });
}

/** Empile l'état précédent du texte, en regroupant les frappes rapprochées */
function pushHistory(scriptId: string, snap: Snapshot, coalesce: boolean) {
  const now = Date.now();
  let h = history.get(scriptId);
  if (!h) { h = { past: [], future: [] }; history.set(scriptId, h); }
  const merge = coalesce && scriptId === lastPushId && now - lastPushAt < COALESCE_MS && h.past.length > 0;
  lastPushAt = now;
  lastPushId = scriptId;
  if (merge) { h.future.length = 0; refreshHistoryDepth(scriptId); return; }
  h.past.push(snap);
  if (h.past.length > HISTORY_MAX) h.past.shift();
  h.future.length = 0;
  refreshHistoryDepth(scriptId);
}

/**
 * Traduit les mesures audio en indication de rythme.
 * Une indication ne s'affiche qu'après s'être stabilisée, pour ne pas clignoter.
 */
function updateHint(stats: LiveStats) {
  const st = useStore.getState();
  if (!st.settings.coachEnabled || !st.playback.isPlaying) {
    if (st.hint) useStore.setState({ hint: null });
    return;
  }
  const target = effectiveSpeed(st.current()) * WPM_PER_SPEED;
  let kind: CoachHintKind;
  if (stats.silenceFor > 2.5) kind = 'silent';
  else if (target <= 0 || stats.speechRate < 30) kind = 'good';
  else if (stats.speechRate > target * 1.18) kind = 'slowDown';
  else if (stats.speechRate < target * 0.82) kind = 'speedUp';
  else kind = 'good';

  const now = Date.now();
  if (kind !== hintCandidate) { hintCandidate = kind; hintSince = now; return; }
  if (now - hintSince < HINT_STABLE_MS) return;
  if (st.hint?.kind === kind) return;
  useStore.setState({ hint: { kind, at: now } });
}
const HINT_STABLE_MS = 2500;

// MARK: - Suivi vocal

let aligner: LiveAligner | null = null;
let alignerScriptId: string | null = null;
let alignerText = '';
let capture: { stream: MediaStream; ctx: AudioContext; tap: PcmTap } | null = null;
let trackSpeaking = false;
let lastSpeechAt = 0;
let lastMatchAt = 0;
let lastApplied = 0;
const TICK_MS = 100;
/** Délai de rattrapage de l'écart, en secondes : plus court, le texte sautille ; plus long, il traîne */
const TAU = 0.7;

async function startTrackingCapture(deviceId: string): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      echoCancellation: false,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
  // Contexte à 16 kHz : Chromium rééchantillonne le micro, Whisper reçoit directement son format
  const ctx = new AudioContext({ sampleRate: 16000 });
  if (ctx.state === 'suspended') await ctx.resume();
  const source = ctx.createMediaStreamSource(stream);
  const tap = await createTap(ctx, source, (block) => api.trackAudio(block, Date.now()), 1024);
  capture = { stream, ctx, tap };
}

function stopTracking(): void {
  api.trackStop();
  if (capture) {
    capture.tap.flush().catch(() => undefined);
    capture.stream.getTracks().forEach((tr) => tr.stop());
    capture.ctx.close().catch(() => undefined);
    capture = null;
  }
  aligner = null;
  alignerScriptId = null;
  trackSpeaking = false;
}

/** Progression (0–1) qui amène une position du texte, en caractères, sur la ligne de lecture */
function progressOfChar(offset: number, textLength: number): number {
  return previewMetrics?.progressForOffset(offset) ?? (textLength ? offset / textLength : 0);
}

/** Mot au niveau de la ligne de lecture : recherche dichotomique, la progression croît avec le texte */
function resetAlignerToReadingLine(): void {
  const st = useStore.getState();
  const cur = st.current();
  if (!aligner || !cur) return;
  if (alignerScriptId !== cur.id || alignerText !== cur.text) {
    aligner = new LiveAligner(cur.text);
    alignerScriptId = cur.id;
    alignerText = cur.text;
  }
  const p = st.progressNow();
  let lo = 0;
  let hi = aligner.tokens.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (progressOfChar(aligner.tokens[mid].start, cur.text.length) <= p + 1e-4) lo = mid;
    else hi = mid - 1;
  }
  aligner.reset(p <= 0.0005 ? -1 : lo - 1);
  // Avant la première mesure, le meilleur indice du débit est la vitesse réglée du texte
  const wps = (effectiveSpeed(cur) * WPM_PER_SPEED) / 60;
  if (wps > 0.5) aligner.rate = Math.min(5, wps);
  lastMatchAt = 0;
}

function onHypothesis(text: string, audioEnd: number): void {
  const st = useStore.getState();
  if (!aligner || !st.tracking || !st.playback.isPlaying) return;
  const r = aligner.update(text, audioEnd);
  if (!r) return;
  lastMatchAt = Date.now();
  if (st.trackStatus !== 'following') useStore.setState({ trackStatus: 'following' });
  if (r.skipped >= 6 && st.settings.coachEnabled) {
    useStore.setState({ hint: { kind: 'skipped', at: Date.now() } });
    window.setTimeout(() => {
      if (useStore.getState().hint?.kind === 'skipped') useStore.setState({ hint: null });
    }, 3000);
  }
}

/**
 * Régulation : toutes les 100 ms, le débit de défilement devient le rythme
 * du lecteur plus une correction de l'écart entre la ligne de lecture et le
 * mot prononcé (estimé, latence de Whisper comprise). En silence, le texte
 * finit le mot en cours puis s'arrête.
 */
function trackingTick(): void {
  const st = useStore.getState();
  const cur = st.current();
  if (!st.tracking || !aligner || !cur || !st.playback.isPlaying) return;
  // Texte modifié ou autre texte chargé en cours de lecture : on repart de la ligne de lecture
  if (alignerScriptId !== cur.id || alignerText !== cur.text) resetAlignerToReadingLine();
  const now = Date.now();
  const speaking = trackSpeaking || now - lastSpeechAt < 400;

  if (st.trackStatus === 'following' && speaking && now - lastMatchAt > 4000) useStore.setState({ trackStatus: 'lost' });
  else if (st.trackStatus === 'lost' && now - lastMatchAt < 4000) useStore.setState({ trackStatus: 'following' });

  const word = aligner.predict(now, speaking);
  const pb = st.playback;
  const progress = progressAt(pb, now);
  let rate = 0;
  if (word >= 0) {
    const len = cur.text.length;
    const target = progressOfChar(aligner.charAt(word), len);
    const perWord = Math.max(1e-6, (progressOfChar(aligner.charAt(word + 10), len) - target) / 10);
    const err = target - progress;
    // Le lecteur est revenu en arrière de plus d'une ligne environ : on y saute directement
    if (err < -perWord * 12) {
      useStore.setState({ playback: { ...pb, anchorProgress: target, anchorTime: now, totalDuration: Infinity, displayDuration: totalDuration(cur) } });
      lastApplied = now;
      return;
    }
    const base = speaking ? aligner.rate * perWord : 0;
    rate = Math.max(0, base + err / TAU);
    // Plafond : un saut de passage se rattrape vite, sans téléporter le texte
    rate = Math.min(rate, perWord * 25);
  }

  const duration = rate > 1e-7 ? 1 / rate : Infinity;
  const old = pb.totalDuration;
  const changed = !Number.isFinite(old) || !Number.isFinite(duration)
    ? Number.isFinite(old) !== Number.isFinite(duration)
    : Math.abs(duration - old) / old > 0.03;
  if (!changed && now - lastApplied < 1000) return;
  lastApplied = now;
  useStore.setState({
    playback: { ...pb, anchorProgress: progress, anchorTime: now, totalDuration: duration, displayDuration: totalDuration(cur) },
  });
}

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
    if (get().tracking) resetAlignerToReadingLine();
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
    searchQuery: '',
    takes: [],
    recording: false,
    recStats: null,
    hint: null,
    alert: null,
    playingTakeId: null,
    compareIds: [],
    aiKeys: null,
    aiModelList: {},
    aiModelError: {},
    aiNoCredit: null,
    aiJob: null,
    sttModels: null,
    sttDownload: null,
    sttJobs: {},
    subtitleTakeId: null,
    tracking: false,
    trackStatus: 'off',
    mics: [],
    pendingCaret: null,
    historyDepth: { past: 0, future: 0 },
    fonts: null,
    update: null,

    async init() {
      const [info, stored, displays, prefs, fullscreen] = await Promise.all([
        api.appInfo(), api.loadStorage(), api.getDisplays(), api.getPrefs(), api.isFullscreen(),
      ]);
      const settings: Settings = { ...DEFAULT_SETTINGS, ...((stored.settings as Partial<Settings>) ?? {}), ...prefs };
      // La disposition des onglets est conservée d'un lancement à l'autre
      settings.inspectorLayout = sanitizeLayout(settings.inspectorLayout);
      settings.collapsedBlocks = sanitizeCollapsed(settings.collapsedBlocks);
      set({ settings });
      let scripts = Array.isArray(stored.scripts) ? (stored.scripts as Script[]).map(migrateScript) : [];

      // Scripts de test de la 2.1.0 : on leur attache leur langue pour afficher le drapeau
      scripts = scripts.map((x) => (x.lang ? x : { ...x, lang: LANGUAGES.find((l) => tr(l.id, 'testScriptText') === x.text)?.id }));

      // Textes fournis : « Welcome » (toutes les langues) et un script de test par langue.
      // Ajoutés une seule fois ; les anciens textes de bienvenue ne sont retirés que s'ils sont intacts.
      if ((settings.seedVersion ?? 0) < SEED_VERSION || scripts.length === 0) {
        const fresh = scripts.length === 0;
        const before = scripts.length;
        const selectedGone = () => !scripts.some((x) => x.id === settings.selectedScriptId);
        scripts = scripts.filter((x) => !isPristineOldWelcome(x));
        const removed = scripts.length < before;
        const added = seedScripts().filter((n) => !scripts.some((x) => x.text === n.text));
        scripts = [...added, ...scripts];
        const welcome = added.find((x) => x.title === WELCOME_TITLE);
        if (welcome && (fresh || (removed && selectedGone()))) settings.selectedScriptId = welcome.id;
        settings.seedVersion = SEED_VERSION;
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
      refreshHistoryDepth(id);
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
      const before = get().current();
      if (before && (before.text !== text)) {
        pushHistory(before.id, { text: before.text, marks: before.marks }, true);
      }
      mutateCurrent((s) => ({
        ...s,
        text,
        marks: normalizeMarks(text, marks),
        wordCount: countWords(text),
        title: s.autoTitle ? autoTitle(text, t('untitled')) : s.title,
      }));
    },

    setMarks(marks) {
      const before = get().current();
      // Un changement de style est une étape d'annulation à part entière
      if (before) pushHistory(before.id, { text: before.text, marks: before.marks }, false);
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

    moveInspectorBlock(tab, from, to) {
      if (from === to) return;
      const order = get().settings.inspectorLayout[tab] ?? [];
      if (!order.includes(from) || !order.includes(to)) return;
      const movingDown = order.indexOf(from) < order.indexOf(to);
      const next = order.filter((id) => id !== from);
      next.splice(next.indexOf(to) + (movingDown ? 1 : 0), 0, from);
      setLayout(set, tab, next);
    },

    resetInspectorOrder(tab) {
      setLayout(set, tab, [...DEFAULT_LAYOUT[tab]]);
    },

    addCustomBlock(id) {
      const custom = get().settings.inspectorLayout.custom ?? [];
      if (custom.includes(id)) return;
      setLayout(set, 'custom', [...custom, id]);
    },

    removeCustomBlock(id) {
      setLayout(set, 'custom', (get().settings.inspectorLayout.custom ?? []).filter((x) => x !== id));
    },

    toggleBlockCollapsed(key) {
      set((st) => {
        const open = st.settings.collapsedBlocks.includes(key);
        return {
          settings: {
            ...st.settings,
            collapsedBlocks: open
              ? st.settings.collapsedBlocks.filter((k) => k !== key)
              : [...st.settings.collapsedBlocks, key],
          },
        };
      });
    },

    async checkUpdate(silent = false) {
      const info = await api.checkUpdate().catch(() => null);
      if (!info) {
        if (!silent) get().showBanner(t('updateFailed'), { isError: true });
        return;
      }
      if (info.newer) {
        if (silent && get().settings.updateSeen === info.version) return;
        set((st) => ({ settings: { ...st.settings, updateSeen: info.version }, update: info }));
      } else if (!silent) {
        set({ update: info });
        get().showBanner(t('updateNone', { version: get().info.version }));
      }
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
        if (k === 'inspectorLayout') applied.inspectorLayout = sanitizeLayout(v);
        else if (k === 'collapsedBlocks') applied.collapsedBlocks = sanitizeCollapsed(v);
        else if (typeof v === typeof DEFAULT_SETTINGS[k]) (applied as Record<string, unknown>)[k] = v;
      }
      set((st) => ({ settings: { ...st.settings, ...applied } }));
      get().showBanner(t('templateApplied', { name: tpl.name }));
    },

    deleteTemplate(id) {
      set((st) => ({ settings: { ...st.settings, templates: st.settings.templates.filter((x) => x.id !== id) } }));
    },

    // MARK: Lecture

    dismissAlert() { set({ alert: null }); },

    togglePlay() {
      const { playback } = get();
      if (playback.countdown !== null) { cancelCountdown(); return; }
      if (playback.isPlaying) get().pause(); else get().play();
    },

    play(silent) {
      const { playback, settings } = get();
      const cur = get().current();
      if (playback.isPlaying || playback.countdown !== null) return;
      if (!cur || cur.wordCount === 0) {
        if (!silent) set({ alert: 'emptyScriptMessage' });
        return;
      }
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
        if (k === 'inspectorLayout') applied.inspectorLayout = sanitizeLayout(v);
        else if (k === 'collapsedBlocks') applied.collapsedBlocks = sanitizeCollapsed(v);
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
      }, opts.duration ?? (opts.isError ? 8000 : 6000));
    },

    dismissBanner() {
      if (bannerTimer !== null) clearTimeout(bannerTimer);
      set({ banner: null });
    },

    setEditing(v) { set({ editing: v }); },
    setSearchQuery(q) { set({ searchQuery: q }); },

    // MARK: Annulation

    undo() {
      const cur = get().current();
      if (!cur) return;
      const h = history.get(cur.id);
      if (!h?.past.length) return;
      const snap = h.past.pop()!;
      h.future.push({ text: cur.text, marks: cur.marks });
      applySnapshot(cur.id, snap, diffCaret(cur.text, snap.text));
    },

    redo() {
      const cur = get().current();
      if (!cur) return;
      const h = history.get(cur.id);
      if (!h?.future.length) return;
      const snap = h.future.pop()!;
      h.past.push({ text: cur.text, marks: cur.marks });
      applySnapshot(cur.id, snap, diffCaret(cur.text, snap.text));
    },

    consumeCaret() {
      const c = get().pendingCaret;
      if (c !== null) set({ pendingCaret: null });
      return c;
    },

    // MARK: Prises

    async loadTakes() {
      set({ takes: await api.listTakes() });
    },

    async beginRecording() {
      if (get().recording) return;
      const st = get();
      try {
        recorder = await startRecording({
          deviceId: st.settings.micDeviceId || undefined,
          targetRate: () => effectiveSpeed(useStore.getState().current()) * WPM_PER_SPEED,
          onStats: (stats) => {
            set({ recStats: stats });
            updateHint(stats);
          },
        });
      } catch (e) {
        const err = e as Error;
        const key = err.name === 'NotAllowedError' || err.name === 'SecurityError'
          ? 'micDenied'
          : err.name === 'NotFoundError' || err.name === 'OverconstrainedError'
            ? 'micNotFound'
            : null;
        get().showBanner(key ? t(key) : t('micError', { msg: err.message }), { isError: true });
        return;
      }
      recordStart = { progress: get().progressNow(), at: Date.now() };
      set({ recording: true, hint: null });
      // La prise entraîne le prompteur : décompte compris, puis défilement
      if (!get().playback.isPlaying) get().play(true);
    },

    async endRecording() {
      const handle = recorder;
      if (!handle) return;
      recorder = null;
      get().pause();
      set({ recording: false, recStats: null, hint: null });
      hintCandidate = null;

      const { blob, analysis, duration } = await handle.stop();
      if (duration < 0.7) return; // prise trop courte : on n'enregistre rien

      const cur = get().current();
      const id = crypto.randomUUID();
      const ext = TAKE_EXT;
      let file: string;
      try {
        file = await api.writeTakeAudio(id, await blob.arrayBuffer(), ext);
      } catch (e) {
        get().showBanner(t('micError', { msg: (e as Error).message }), { isError: true });
        return;
      }

      // La numérotation repart à 01 pour chaque texte, puisque les prises y sont rattachées
      const n = get().takes.filter((x) => x.autoName && x.scriptId === (cur?.id ?? null)).length + 1;
      const take: Take = {
        id,
        name: t('takeName', { n: String(n).padStart(2, '0') }),
        autoName: true,
        createdAt: new Date().toISOString(),
        duration,
        file,
        scriptId: cur?.id ?? null,
        scriptTitle: cur ? displayTitle(cur) : '',
        startProgress: recordStart.progress,
        endProgress: get().progressNow(),
        speed: Math.round(effectiveSpeed(cur)),
        note: '',
        markers: [],
        locked: false,
        analysis,
      };
      const takes = [take, ...get().takes];
      set({ takes });
      api.saveTakes(takes).catch(() => undefined);
      get().showBanner(t('takeSaved', { name: take.name }));
      // Transcription automatique, seulement si le modèle choisi est déjà là
      const st2 = get();
      if (st2.settings.sttAuto && st2.sttModels?.find((m) => m.id === st2.settings.sttModel)?.installed) {
        st2.transcribeTake(take.id).catch(() => undefined);
      }
    },

    renameTake(id, name) {
      const clean = name.trim();
      get()._mutateTake(id, (tk) => ({ ...tk, name: clean || tk.name, autoName: clean.length === 0 }));
    },

    async deleteTake(id) {
      const take = get().takes.find((x) => x.id === id);
      if (!take || take.locked) return;
      if (get().playingTakeId === id) get().stopTakePlayback();
      const takes = get().takes.filter((x) => x.id !== id);
      set({ takes, compareIds: get().compareIds.filter((x) => x !== id) });
      await api.deleteTakeAudio(take.file).catch(() => undefined);
      api.saveTakes(takes).catch(() => undefined);
      get().showBanner(t('takeDeleted', { name: take.name }));
    },

    toggleTakeLock(id) {
      get()._mutateTake(id, (tk) => ({ ...tk, locked: !tk.locked }));
    },

    setTakeNote(id, note) {
      get()._mutateTake(id, (tk) => ({ ...tk, note }));
    },

    addTakeMarker(id, time) {
      const marker: TakeMarker = { id: crypto.randomUUID(), time, label: '' };
      get()._mutateTake(id, (tk) => ({ ...tk, markers: [...tk.markers, marker].sort((a, b) => a.time - b.time) }));
    },

    removeTakeMarker(id, markerId) {
      get()._mutateTake(id, (tk) => ({ ...tk, markers: tk.markers.filter((m) => m.id !== markerId) }));
    },

    async playTake(id) {
      const take = get().takes.find((x) => x.id === id);
      if (!take) return;
      get().stopTakePlayback();
      try {
        const data = await api.readTakeAudio(take.file);
        const bytes: BlobPart = data instanceof ArrayBuffer
          ? data
          : new Uint8Array(data as ArrayLike<number>);
        // Le type MIME vient de l'extension : sans lui, l'élément <audio>
        // n'a aucune indication de format et refuse de lire le fichier.
        const url = URL.createObjectURL(new Blob([bytes], { type: audioMime(take.file) }));
        const audio = new Audio();
        audio.onended = () => get().stopTakePlayback();
        audio.onerror = () => {
          const code = audio.error?.code ?? 0;
          get().showBanner(t('takePlaybackFailed', { code: String(code) }), { isError: true });
          get().stopTakePlayback();
        };
        audio.src = url;
        takePlayer = audio;
        set({ playingTakeId: id });
        await audio.play();
      } catch (e) {
        get().showBanner(t('micError', { msg: (e as Error).message }), { isError: true });
        get().stopTakePlayback();
      }
    },

    stopTakePlayback() {
      if (takePlayer) {
        takePlayer.onended = null;
        takePlayer.onerror = null;
        takePlayer.pause();
        URL.revokeObjectURL(takePlayer.src);
        takePlayer = null;
      }
      set({ playingTakeId: null });
    },

    revealTake(id) {
      const take = get().takes.find((x) => x.id === id);
      if (take) api.revealTake(take.file);
    },

    async exportTake(id) {
      const take = get().takes.find((x) => x.id === id);
      if (take) await api.exportTake(take.file, take.name).catch(() => undefined);
    },

    toggleCompare(id) {
      const sel = get().compareIds;
      set({ compareIds: sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id].slice(-2) });
    },

    // MARK: Suivi vocal

    toggleRecording() {
      if (get().recording) get().endRecording().catch(() => undefined);
      else get().beginRecording().catch(() => undefined);
    },

    async toggleTracking() {
      if (get().tracking) {
        stopTracking();
        const pb = freeze();
        set({
          tracking: false,
          trackStatus: 'off',
          playback: { ...pb, totalDuration: totalDuration(get().current()), displayDuration: undefined },
        });
        return;
      }
      const cur = get().current();
      if (!cur || cur.wordCount === 0) {
        set({ alert: 'emptyScriptMessage' });
        return;
      }
      set({ tracking: true, trackStatus: 'loading' });
      const r = await api.trackStart(guessLanguage(cur.text));
      if (!r.ok) {
        set({ tracking: false, trackStatus: 'off' });
        get().showBanner(r.error === 'noModel' ? t('trackNeedsModel') : sttErrorMessage(r.error ?? 'unknown', r.detail), { isError: true });
        return;
      }
      try {
        await startTrackingCapture(get().settings.micDeviceId);
      } catch (e) {
        api.trackStop();
        set({ tracking: false, trackStatus: 'off' });
        const err = e as Error;
        get().showBanner(err.name === 'NotAllowedError' ? t('micDenied') : t('micError', { msg: err.message }), { isError: true });
        return;
      }
      aligner = new LiveAligner(cur.text);
      alignerScriptId = cur.id;
      alignerText = cur.text;
      set({ trackStatus: 'listening' });
      if (get().playback.isPlaying) resetAlignerToReadingLine();
    },

    // MARK: Transcription

    async loadSttModels() {
      set({ sttModels: await api.sttModels() });
    },

    async downloadSttModel(id) {
      if (get().sttDownload) return;
      set({ sttDownload: { id, phase: 'download', done: 0, total: 1 } });
      const r = await api.sttDownload(id);
      set({ sttDownload: null });
      await get().loadSttModels();
      if (r.ok) get().showBanner(t('sttModelReady'));
      else if (r.error === 'cancelled') get().showBanner(t('aiCancelled'));
      else get().showBanner(sttErrorMessage(r.error ?? 'unknown', r.detail), { isError: true });
    },

    cancelSttDownload() {
      api.sttCancelDownload();
    },

    async deleteSttModel(id) {
      await api.sttDeleteModel(id);
      await get().loadSttModels();
    },

    async transcribeTake(takeId) {
      const take = get().takes.find((x) => x.id === takeId);
      if (!take || get().sttJobs[takeId]) return;
      const model = get().settings.sttModel;
      if (!get().sttModels) await get().loadSttModels();
      if (!get().sttModels?.find((m) => m.id === model)?.installed) {
        get().showBanner(t('sttErrNoModel'), { isError: true });
        return;
      }
      const script = get().scripts.find((x) => x.id === take.scriptId);
      const language = script ? guessLanguage(script.text) : '';
      set((st) => ({ sttJobs: { ...st.sttJobs, [takeId]: { done: 0, total: 1 } } }));
      const r = await api.sttTranscribe(takeId, take.file, model, language);
      set((st) => {
        const jobs = { ...st.sttJobs };
        delete jobs[takeId];
        return { sttJobs: jobs };
      });
      if (!r.ok || !r.transcript) {
        if (r.error !== 'cancelled') get().showBanner(sttErrorMessage(r.error ?? 'unknown', r.detail), { isError: true });
        return;
      }
      const transcript = r.transcript;
      get()._mutateTake(takeId, (tk) => ({ ...tk, transcript, subtitles: buildCues(transcript) }));
      get().analyzeTake(takeId);
    },

    cancelTranscription(takeId) {
      api.sttCancel(takeId);
    },

    analyzeTake(takeId) {
      const take = get().takes.find((x) => x.id === takeId);
      if (!take?.transcript) return;
      const script = get().scripts.find((x) => x.id === take.scriptId);
      const language = take.transcript.language || (script ? guessLanguage(script.text) : '');
      const speech = analyzeSpeech(
        take.transcript,
        script?.text ?? null,
        { start: take.startProgress, end: take.endProgress },
        language,
      );
      get()._mutateTake(takeId, (tk) => ({ ...tk, speech }));
    },

    openSubtitles(takeId) {
      get().stopTakePlayback();
      set({ subtitleTakeId: takeId });
    },

    rebuildSubtitles(takeId) {
      get()._mutateTake(takeId, (tk) => (tk.transcript ? { ...tk, subtitles: buildCues(tk.transcript) } : tk));
    },

    updateCue(takeId, cueId, patch) {
      get()._mutateTake(takeId, (tk) => ({
        ...tk,
        subtitles: (tk.subtitles ?? []).map((c) => (c.id === cueId ? { ...c, ...patch } : c)),
      }));
    },

    splitCueAt(takeId, cueId, at) {
      get()._mutateTake(takeId, (tk) => {
        const list = tk.subtitles ?? [];
        const i = list.findIndex((c) => c.id === cueId);
        const parts = i >= 0 ? splitCue(list[i], at) : null;
        if (!parts) return tk;
        return { ...tk, subtitles: [...list.slice(0, i), ...parts, ...list.slice(i + 1)] };
      });
    },

    mergeCueWithNext(takeId, cueId) {
      get()._mutateTake(takeId, (tk) => {
        const list = tk.subtitles ?? [];
        const i = list.findIndex((c) => c.id === cueId);
        if (i < 0 || i + 1 >= list.length) return tk;
        return { ...tk, subtitles: [...list.slice(0, i), mergeCues(list[i], list[i + 1]), ...list.slice(i + 2)] };
      });
    },

    deleteCue(takeId, cueId) {
      get()._mutateTake(takeId, (tk) => ({ ...tk, subtitles: (tk.subtitles ?? []).filter((c) => c.id !== cueId) }));
    },

    async exportSrt(takeId) {
      const take = get().takes.find((x) => x.id === takeId);
      if (!take?.subtitles?.length) return;
      const saved = await api.exportSrt(toSrt(take.subtitles), take.name).catch(() => false);
      if (saved) get().showBanner(t('srtExported'));
    },

    // MARK: IA texte

    async loadAiKeys() {
      set({ aiKeys: await api.aiKeyStatus() });
    },

    async setAiKey(provider, key) {
      await api.aiSetKey(provider, key);
      set((st) => ({
        aiModelList: { ...st.aiModelList, [provider]: undefined },
        aiModelError: { ...st.aiModelError, [provider]: undefined },
      }));
      await get().loadAiKeys();
      // Lire la liste des modèles sert aussi de test de la clé
      if (key.trim()) await get().loadAiModels(provider);
    },

    async loadAiModels(provider) {
      const r = await api.aiModels(provider);
      if (r.ok && r.models) {
        set((st) => ({
          aiModelList: { ...st.aiModelList, [provider]: r.models },
          aiModelError: { ...st.aiModelError, [provider]: undefined },
        }));
        // Modèle retenu absent de la liste (retiré par le fournisseur) : on prend le défaut s'il existe
        const chosen = get().settings.aiModels[provider];
        const ids = r.models.map((m) => m.id);
        if (ids.length && !ids.includes(chosen)) {
          const fallback = ids.includes(AI_DEFAULT_MODELS[provider]) ? AI_DEFAULT_MODELS[provider] : ids[0];
          get().setSetting('aiModels', { ...get().settings.aiModels, [provider]: fallback });
        }
      } else {
        set((st) => ({
          aiModelError: { ...st.aiModelError, [provider]: aiErrorMessage(r.error ?? 'unknown', provider, r.detail) },
        }));
      }
    },

    async runAi(task) {
      const st = get();
      const cur = st.current();
      if (!cur || st.aiJob) return;
      if (cur.wordCount === 0) {
        set({ alert: 'emptyScriptMessage' });
        return;
      }
      const provider = st.settings.aiProvider;
      const model = st.settings.aiModels[provider] || AI_DEFAULT_MODELS[provider];
      const { inputs, whole } = prepare(cur.text, cur.marks);
      const id = crypto.randomUUID();
      set({ aiJob: { id, kind: task.kind, done: 0, total: inputs.length } });

      const res = await api.aiRun(id, provider, model, task, inputs);
      set({ aiJob: null });
      set({ aiNoCredit: res.error === 'noCredit' ? provider : null });
      if (!res.ok || !res.paragraphs) {
        if (res.error === 'cancelled') get().showBanner(t('aiCancelled'));
        else get().showBanner(aiErrorMessage(res.error ?? 'unknown', provider, res.detail), { isError: true });
        return;
      }

      const { text, marks } = assemble(res.paragraphs, whole);
      const suffix = task.kind === 'translate' ? task.target.toUpperCase() : t('aiOralSuffix');
      const script = newScript(text, cur.speed, `${displayTitle(cur)} — ${suffix}`);
      script.marks = marks;
      const scripts = get().scripts.slice();
      const at = scripts.findIndex((x) => x.id === cur.id);
      scripts.splice(at < 0 ? scripts.length : at + 1, 0, script);
      set({ scripts });
      get().select(script.id);

      const warnings = res.warnings ?? [];
      if (warnings.length) {
        get().showBanner(
          `${t('aiDone', { title: script.title })} ${t('aiChecks', { list: warnings.map((i) => i + 1).join(', ') })}`,
          { isError: true, duration: 20000 },
        );
      } else {
        get().showBanner(t('aiDone', { title: script.title }));
      }
    },

    cancelAi() {
      const job = get().aiJob;
      if (job) api.aiCancel(job.id);
    },

    async loadMics() {
      try {
        set({ mics: await listMicrophones() });
      } catch {
        set({ mics: [] });
      }
    },

    _mutateTake(id, fn) {
      const takes = get().takes.map((tk) => (tk.id === id ? fn(tk) : tk));
      set({ takes });
      api.saveTakes(takes).catch(() => undefined);
    },
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
      hint: st.hint,
      recording: st.recording,
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
      || st.playback !== prev.playback || st.blackout !== prev.blackout
      || st.hint !== prev.hint || st.recording !== prev.recording) {
      pushOutput(st);
    }
  });

  pushOutput(useStore.getState());
  api.onDisplaysChanged((d) => useStore.getState().setDisplays(d));
  api.onOutputActive((v) => useStore.getState().setOutputActive(v));
  api.onPrefsChanged((p) => useStore.getState().applyPrefs(p));
  api.onFullscreenChanged((on) => useStore.getState().fullscreenChanged(on));
  api.onProjectLoaded((r) => useStore.getState().loadProject(r));
  api.onSttProgress((p) => {
    const st = useStore.getState();
    if (p.kind === 'transcribe') {
      if (st.sttJobs[p.id]) useStore.setState({ sttJobs: { ...st.sttJobs, [p.id]: { done: p.done, total: p.total } } });
    } else if (st.sttDownload) {
      useStore.setState({ sttDownload: { ...st.sttDownload, phase: p.kind, done: p.done, total: p.total } });
    }
  });
  useStore.getState().loadSttModels().catch(() => undefined);
  api.onTrackHypothesis((h) => onHypothesis(h.text, h.audioEnd));
  api.onTrackSpeech((sp) => {
    trackSpeaking = sp.speaking;
    if (sp.speaking) lastSpeechAt = sp.at;
  });
  window.setInterval(trackingTick, TICK_MS);
  api.onAiProgress((p) => {
    const job = useStore.getState().aiJob;
    if (job && job.id === p.jobId) useStore.setState({ aiJob: { ...job, done: p.done, total: p.total } });
  });
  api.rendererReady();
}
