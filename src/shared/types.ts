import type { Lang, ThemeMode } from './i18n';

export type Mirror = 'none' | 'horizontal' | 'vertical' | 'both';
export type TextAlign = 'left' | 'center';

export type TimecodeMode = 'off' | 'elapsed' | 'remaining' | 'both';
export type WheelMode = 'navigate' | 'speed';

/** Blocs du panneau de réglages, dans leur ordre par défaut */
export type InspectorBlockId =
  | 'templates' | 'speed' | 'target' | 'typography' | 'colors'
  | 'layout' | 'timecode' | 'output' | 'clicker' | 'controls';

export const INSPECTOR_BLOCKS: InspectorBlockId[] = [
  'templates', 'speed', 'target', 'typography', 'colors',
  'layout', 'timecode', 'output', 'clicker', 'controls',
];

/** Ordre valide : identifiants connus, sans doublon, complété par les blocs manquants */
export function sanitizeInspectorOrder(value: unknown): InspectorBlockId[] {
  const seen = new Set<string>();
  const out: InspectorBlockId[] = [];
  if (Array.isArray(value)) {
    for (const v of value) {
      if (typeof v === 'string' && (INSPECTOR_BLOCKS as string[]).includes(v) && !seen.has(v)) {
        seen.add(v);
        out.push(v as InspectorBlockId);
      }
    }
  }
  for (const id of INSPECTOR_BLOCKS) if (!seen.has(id)) out.push(id);
  return out;
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
  /** Ordre des blocs du panneau de réglages */
  inspectorOrder: InspectorBlockId[];
}

export const PROJECT_SETTING_KEYS: Array<keyof ProjectSettings> = [
  'fontSize', 'fontFamily', 'fontWeight', 'italic', 'uppercase', 'textColor', 'backgroundColor',
  'markerColor', 'lineHeight', 'margin', 'alignment', 'readingLine', 'showReadingLine', 'mirror',
  'mirrorPreview', 'mirrorFullscreen', 'countdownEnabled', 'timecode', 'invertScroll', 'wheelPreview',
  'clickerNext', 'clickerPrev', 'inspectorOrder',
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
  outputDisplayId: number | null;
  selectedScriptId: string | null;
  showInspector: boolean;
  editorWidth: number;
  language: Lang;
  theme: ThemeMode;
  /** Textes de bienvenue anglais + français déjà ajoutés à la bibliothèque */
  welcomeSeeded: boolean;
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
  | 'saveProject' | 'openProject' | 'toggleFullscreen';

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
export const FONT_MAX = 400;
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
