import type { Lang, ThemeMode } from './i18n';

export type Mirror = 'none' | 'horizontal' | 'vertical' | 'both';
export type TextAlign = 'left' | 'center';

export type TimecodeMode = 'off' | 'elapsed' | 'remaining' | 'both';
export type WheelMode = 'navigate' | 'speed';

// MARK: - Prises

export interface TakeMarker {
  id: string;
  /** Secondes depuis le début de la prise */
  time: number;
  label: string;
}

/** Analyse du signal, sans reconnaissance vocale */
export interface TakeAnalysis {
  /** Débit estimé en mots/min, déduit des attaques syllabiques */
  speechRate: number;
  /** Nombre de pauses de plus de 0,4 s */
  pauses: number;
  /** Durée cumulée des silences, en secondes */
  silence: number;
  /** Part de la prise passée à parler, 0–1 */
  speaking: number;
  /** Écart moyen entre le débit parlé et la vitesse du prompteur, en % */
  drift: number;
  /** Irrégularité du débit : écart-type relatif, en % */
  irregularity: number;
}

export interface Take {
  id: string;
  name: string;
  /** Nom automatique « PRISE 01 » tant qu'il n'a pas été renommé */
  autoName: boolean;
  createdAt: string;
  duration: number;
  /** Nom du fichier audio dans le dossier takes/ */
  file: string;
  scriptId: string | null;
  scriptTitle: string;
  /** Position dans le script au début et à la fin de la prise, 0–1 */
  startProgress: number;
  endProgress: number;
  speed: number;
  note: string;
  markers: TakeMarker[];
  locked: boolean;
  analysis: TakeAnalysis | null;
  /** Transcription locale, absente tant que la prise n'a pas été transcrite */
  transcript?: Transcript | null;
  /** Sous-titres, éditables ; recalculés depuis la transcription à la demande */
  subtitles?: SubtitleCue[] | null;
  /** Analyse du discours : transcription comparée au texte */
  speech?: SpeechAnalysis | null;
}

export interface AudioDeviceInfo {
  id: string;
  label: string;
}

/** Indication discrète affichée au présentateur */
export type CoachHintKind = 'good' | 'slowDown' | 'speedUp' | 'paused' | 'silent' | 'skipped';

export interface CoachHint {
  kind: CoachHintKind;
  /** Horodatage d'apparition, pour la disparition automatique */
  at: number;
}

export const PAUSE_THRESHOLD = 0.4;
export const TAKE_EXT = 'wav';

/** Blocs du panneau de réglages */
export type InspectorBlockId =
  | 'speed' | 'target' | 'typography' | 'colors'
  | 'layout' | 'timecode' | 'output' | 'takes' | 'transcription' | 'ai' | 'clicker' | 'controls';

/** Onglets du panneau de réglages ; « custom » est libre, les autres ont des blocs attitrés */
export type InspectorTabId = 'essentials' | 'layout' | 'transcript' | 'aitools' | 'custom';
export const INSPECTOR_TABS: InspectorTabId[] = ['essentials', 'layout', 'transcript', 'aitools', 'custom'];

/** Répartition par défaut ; l'onglet personnalisé démarre vide */
export const DEFAULT_LAYOUT: Record<InspectorTabId, InspectorBlockId[]> = {
  essentials: ['output', 'speed', 'target', 'controls', 'clicker'],
  layout: ['typography', 'colors', 'layout', 'timecode'],
  transcript: ['takes', 'transcription'],
  aitools: ['ai'],
  custom: [],
};

export const INSPECTOR_BLOCKS: InspectorBlockId[] = INSPECTOR_TABS.flatMap((tab) => DEFAULT_LAYOUT[tab]);

/** Onglet d'origine d'un bloc */
export function homeTab(id: InspectorBlockId): InspectorTabId {
  return INSPECTOR_TABS.find((tab) => DEFAULT_LAYOUT[tab].includes(id)) ?? 'custom';
}

export type InspectorLayout = Record<InspectorTabId, InspectorBlockId[]>;

/** Disposition valide : blocs connus, sans doublon, chaque onglet fixe complété par les siens */
export function sanitizeLayout(value: unknown): InspectorLayout {
  const src = (value ?? {}) as Record<string, unknown>;
  const read = (tab: InspectorTabId, allowed: (id: InspectorBlockId) => boolean): InspectorBlockId[] => {
    const seen = new Set<InspectorBlockId>();
    const list = Array.isArray(src[tab]) ? (src[tab] as unknown[]) : [];
    for (const v of list) {
      const id = v as InspectorBlockId;
      if (typeof v === 'string' && INSPECTOR_BLOCKS.includes(id) && allowed(id)) seen.add(id);
    }
    return [...seen];
  };
  const out = {} as InspectorLayout;
  for (const tab of INSPECTOR_TABS) {
    if (tab === 'custom') { out.custom = read('custom', () => true); continue; }
    const kept = read(tab, (id) => homeTab(id) === tab);
    for (const id of DEFAULT_LAYOUT[tab]) if (!kept.includes(id)) kept.push(id);
    out[tab] = kept;
  }
  return out;
}

export function isInspectorTab(v: unknown): v is InspectorTabId {
  return typeof v === 'string' && (INSPECTOR_TABS as string[]).includes(v);
}

/** Blocs repliés, repérés par « onglet:bloc » */
export function sanitizeCollapsed(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const keys = new Set<string>();
  for (const v of value) {
    if (typeof v !== 'string') continue;
    const [tab, block] = v.split(':');
    if (isInspectorTab(tab) && INSPECTOR_BLOCKS.includes(block as InspectorBlockId)) keys.add(v);
  }
  return [...keys];
}
export type ClickerAction =
  | 'playPause' | 'faster' | 'slower' | 'forward10' | 'back10'
  | 'nextParagraph' | 'prevParagraph' | 'rewind' | 'none';

/** Style appliqué à une partie du texte (couleur par intervenant, mise en avant…) */
export interface StyleMark {
  start: number;
  end: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  fontFamily?: string;
}

export interface Script {
  id: string;
  title: string;
  /** Titre déduit de la première ligne tant que le texte n'a pas été renommé */
  autoTitle: boolean;
  text: string;
  marks: StyleMark[];
  wordCount: number;
  /** Vitesse 0–100 (1 point = 4 mots/min) */
  speed: number;
  /** Ancien débit en mots/min (≤ 1.3.1), converti au chargement */
  wpm?: number;
  targetEnabled: boolean;
  targetDuration: number; // secondes
  createdAt: string;
  updatedAt: string;
  /** Langue du texte quand elle est connue (scripts de test fournis) : drapeau dans la liste */
  lang?: Lang;
}

/** Réglages d'affichage et de pilotage : ceux enregistrés dans un projet .cariprompt */
export interface ProjectSettings {
  fontSize: number;
  fontFamily: string; // '' = police système
  fontWeight: number;
  italic: boolean;
  uppercase: boolean;
  textColor: string;
  backgroundColor: string;
  markerColor: string;
  lineHeight: number;
  margin: number; // fraction de la largeur, par côté
  alignment: TextAlign;
  readingLine: number; // fraction de la hauteur
  showReadingLine: boolean;
  mirror: Mirror;
  mirrorPreview: boolean;
  mirrorFullscreen: boolean;
  countdownEnabled: boolean;
  timecode: TimecodeMode;
  invertScroll: boolean;
  /** Molette au-dessus de l'aperçu : navigation dans le texte ou réglage de la vitesse */
  wheelPreview: WheelMode;
  clickerNext: ClickerAction;
  clickerPrev: ClickerAction;
  /** Répartition et ordre des blocs dans les onglets du panneau de réglages */
  inspectorLayout: InspectorLayout;
  /** Blocs repliés, repérés par « onglet:bloc » */
  collapsedBlocks: string[];
  /** Indications de rythme pendant la prise */
  coachEnabled: boolean;
}

export const PROJECT_SETTING_KEYS: Array<keyof ProjectSettings> = [
  'fontSize', 'fontFamily', 'fontWeight', 'italic', 'uppercase', 'textColor', 'backgroundColor',
  'markerColor', 'lineHeight', 'margin', 'alignment', 'readingLine', 'showReadingLine', 'mirror',
  'mirrorPreview', 'mirrorFullscreen', 'countdownEnabled', 'timecode', 'invertScroll', 'wheelPreview',
  'clickerNext', 'clickerPrev', 'inspectorLayout', 'collapsedBlocks', 'coachEnabled',
];

/** Jeu de réglages enregistré sous un nom (« iPad CACE »…) */
export interface Template {
  id: string;
  name: string;
  settings: ProjectSettings;
  createdAt: string;
}

export interface Settings extends ProjectSettings {
  templates: Template[];
  /** Micro choisi ; propre à la machine, donc hors préréglages */
  micDeviceId: string;
  /** Fournisseur d'IA et modèle retenu pour chacun ; hors préréglages */
  aiProvider: AiProvider;
  aiModels: Record<AiProvider, string>;
  /** Dernière langue cible choisie pour la traduction */
  aiTarget: string;
  /** Modèle Whisper choisi et transcription automatique après chaque prise */
  sttModel: SttModelId;
  sttAuto: boolean;
  outputDisplayId: number | null;
  selectedScriptId: string | null;
  showInspector: boolean;
  editorWidth: number;
  language: Lang;
  theme: ThemeMode;
  /** Textes de bienvenue anglais + français déjà ajoutés à la bibliothèque */
  welcomeSeeded: boolean;
  /** Version des textes fournis déjà ajoutés (2 = Welcome + scripts de test) */
  seedVersion: number;
  /** Onglet ouvert dans le panneau de réglages */
  inspectorTab: InspectorTabId;
  /** Vérifier au lancement si une version plus récente est publiée */
  updateCheck: boolean;
  /** Dernière version publiée déjà signalée, pour ne pas répéter l'annonce */
  updateSeen: string;
}

/** Réponse de la vérification de mise à jour */
export interface UpdateInfo {
  version: string;
  url: string;
  newer: boolean;
}

/** Contenu d'un fichier .cariprompt */
export interface ProjectFile {
  format: 'cariprompt';
  formatVersion: 1;
  appVersion: string;
  savedAt: string;
  script: {
    title: string;
    text: string;
    marks?: StyleMark[];
    speed: number;
    targetEnabled: boolean;
    targetDuration: number;
  };
  settings: Partial<ProjectSettings>;
}

/** Préférences pilotées par les menus de l'application */
export interface Prefs {
  language: Lang;
  theme: ThemeMode;
}

export interface Playback {
  anchorProgress: number;
  anchorTime: number; // Date.now() au moment de l'ancrage
  isPlaying: boolean;
  countdown: number | null;
  totalDuration: number; // secondes (Infinity à vitesse 0)
  /** Durée affichée par les chronomètres, quand le débit réel est piloté (suivi vocal) */
  displayDuration?: number;
  /** Chronomètre réel de la prise, pauses exclues */
  chronoMs: number;
  chronoStartedAt: number | null;
}

/** Style du texte du prompteur */
export type TextStyle = Pick<ProjectSettings,
  'fontSize' | 'fontFamily' | 'fontWeight' | 'italic' | 'uppercase' | 'textColor' |
  'backgroundColor' | 'markerColor' | 'lineHeight' | 'margin' | 'alignment' |
  'readingLine' | 'showReadingLine' | 'timecode'>;

/** État envoyé à la fenêtre de sortie */
export interface OutputState {
  text: string;
  marks: StyleMark[];
  /** Indication de rythme, ou null */
  hint: CoachHint | null;
  recording: boolean;
  style: TextStyle;
  mirror: Mirror;
  blackout: boolean;
  playback: Playback;
}

export interface DisplayInfo {
  id: number;
  label: string;
  width: number;
  height: number;
  primary: boolean;
}

export interface AppInfo {
  version: string;
  platform: string;
  naturalScroll: boolean;
}

export interface ImportResult {
  title: string;
  text?: string;
  error?: string;
}

export type MenuCommand =
  | 'new' | 'import' | 'export' | 'duplicate' | 'rewind' | 'toggleOutput' | 'togglePlay'
  | 'saveProject' | 'openProject' | 'toggleFullscreen' | 'toggleTracking' | 'toggleRecording';

export interface ProjectReadResult {
  name: string;
  path: string;
  data?: ProjectFile;
  error?: string;
}

export interface ChoiceItem {
  id: string;
  label: string;
  checked?: boolean;
}

export interface ForwardedInput {
  kind: 'key' | 'wheel';
  key?: string;
  code?: string;
  alt?: boolean;
  deltaY?: number;
  deltaMode?: number;
}

export const SPEED_MIN = 0;
export const SPEED_MAX = 100;
export const SPEED_STEP = 1;
/** Mots par minute pour 1 point de vitesse */
export const WPM_PER_SPEED = 4;
export const DEFAULT_SPEED = 35;
export const LINE_HEIGHT_MIN = 1;
export const LINE_HEIGHT_MAX = 2.5;
export const FONT_MIN = 24;
export const FONT_MAX = 500;
export const FONT_STEP = 4;
export const SEEK_STEP = 10;
export const DEFAULT_LINE_HEIGHT = 1.45;

export const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

export function countWords(text: string): number {
  let n = 0;
  for (const tok of text.split(/\s+/)) if (/[\p{L}\p{N}]/u.test(tok)) n++;
  return n;
}

export function progressAt(pb: Playback, now: number): number {
  if (!pb.isPlaying || !(pb.totalDuration > 0) || !Number.isFinite(pb.totalDuration)) return pb.anchorProgress;
  return clamp(pb.anchorProgress + (now - pb.anchorTime) / 1000 / pb.totalDuration, 0, 1);
}

export function chronoAt(pb: Playback, now: number): number {
  return (pb.chronoMs + (pb.chronoStartedAt !== null ? now - pb.chronoStartedAt : 0)) / 1000;
}

export function formatDuration(t: number): string {
  if (!Number.isFinite(t)) return '–:––';
  const s = Math.max(0, Math.round(t));
  const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = s % 60;
  const pad = (x: number) => String(x).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${Math.floor(s / 60)}:${pad(sec)}`;
}

export function autoTitle(text: string, untitled = 'Untitled'): string {
  const first = text.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length > 0);
  if (!first) return untitled;
  return first.length > 60 ? first.slice(0, 60) + '…' : first;
}

// MARK: - IA texte

export type AiProvider = 'anthropic' | 'openai';
export const AI_PROVIDERS: AiProvider[] = ['anthropic', 'openai'];

/** Modèle proposé tant que la liste du fournisseur n'a pas été lue */
export const AI_DEFAULT_MODELS: Record<AiProvider, string> = {
  anthropic: 'claude-sonnet-5',
  openai: 'gpt-5.6-terra',
};

/** Langues cibles proposées pour la traduction */
/** Pages de facturation, ouvertes depuis l'app quand le compte n'a plus de crédit */
export const AI_BILLING_URLS: Record<AiProvider, string> = {
  anthropic: 'https://platform.claude.com/settings/billing',
  openai: 'https://platform.openai.com/settings/organization/billing/overview',
};

export const AI_TARGETS = ['en', 'fr', 'es', 'de', 'it', 'pt', 'nl'] as const;

export type AiTask =
  | { kind: 'translate'; target: string }
  | { kind: 'oral' };

export interface AiModel { id: string; label: string }

export interface AiKeyStatus {
  anthropic: boolean;
  openai: boolean;
  /** Faux quand le trousseau du système n'est pas disponible (clé stockée en clair) */
  encrypted: boolean;
}

export interface AiProgress { jobId: string; done: number; total: number }

export type AiErrorCode =
  | 'noKey' | 'badKey' | 'noCredit' | 'rateLimit' | 'overloaded' | 'network'
  | 'refused' | 'badOutput' | 'tooLong' | 'cancelled' | 'unknown';

export interface AiRunResult {
  ok: boolean;
  /** Une entrée par paragraphe envoyé, chacune avec un ou plusieurs paragraphes produits */
  paragraphs?: string[][];
  /** Paragraphes d'entrée dont un chiffre ou un élément protégé n'a pas été retrouvé */
  warnings?: number[];
  error?: AiErrorCode;
  detail?: string;
}

// MARK: - Transcription locale

export type SttModelId = 'base' | 'small' | 'turbo';
export const STT_MODEL_IDS: SttModelId[] = ['turbo', 'small', 'base'];

export interface SttModelInfo {
  id: SttModelId;
  downloadMB: number;
  diskMB: number;
  installed: boolean;
}

export interface SttSegment { start: number; end: number; text: string }

export interface Transcript {
  model: SttModelId;
  /** Langue imposée à Whisper, ou chaîne vide pour la détection automatique */
  language: string;
  duration: number;
  /** Plages de parole détectées, en secondes */
  speech: Array<[number, number]>;
  segments: SttSegment[];
  createdAt: string;
}

export interface SubtitleCue { id: string; start: number; end: number; text: string }

/** Passage du texte non prononcé pendant la prise */
export interface SkippedPassage {
  text: string;
  /** Position du passage dans le texte (caractères), pour y sauter */
  offset: number;
  words: number;
}

export interface SpeechAnalysis {
  /** Mots par minute, sur le temps de parole réel */
  wordsPerMinute: number;
  words: number;
  /** Part des mots du passage lu retrouvés dans la transcription, 0–1 */
  fidelity: number;
  skipped: SkippedPassage[];
  /** Mots prononcés absents du texte */
  added: number;
  fillers: Array<{ word: string; count: number }>;
  repetitions: Array<{ text: string; time: number }>;
  /** Pauses de plus de 0,8 s au milieu d'une phrase */
  hesitations: Array<{ time: number; length: number }>;
}

export type SttErrorCode =
  | 'engineUnavailable' | 'noModel' | 'network' | 'extract' | 'cancelled' | 'badAudio' | 'unknown';

export interface SttProgress {
  kind: 'download' | 'extract' | 'transcribe';
  /** Modèle en téléchargement, ou prise en cours de transcription */
  id: string;
  done: number;
  total: number;
}
