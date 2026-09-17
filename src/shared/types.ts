import type { Lang, ThemeMode } from './i18n';

export type Mirror = 'none' | 'horizontal' | 'vertical' | 'both';
export type TextAlign = 'left' | 'center';

export interface Script {
  id: string;
  title: string;
  /** Titre déduit de la première ligne tant que le texte n'a pas été renommé */
  autoTitle: boolean;
  text: string;
  wordCount: number;
  wpm: number;
  targetEnabled: boolean;
  targetDuration: number; // secondes
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  fontSize: number;
  mirror: Mirror;
  mirrorPreview: boolean;
  alignment: TextAlign;
  readingLine: number; // fraction de la hauteur
  margin: number; // fraction de la largeur, par côté
  countdownEnabled: boolean;
  invertScroll: boolean;
  outputDisplayId: number | null;
  selectedScriptId: string | null;
  showInspector: boolean;
  editorWidth: number;
  language: Lang;
  theme: ThemeMode;
  showReadingLine: boolean;
  /** Textes de bienvenue anglais + français déjà ajoutés à la bibliothèque */
  welcomeSeeded: boolean;
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
  totalDuration: number; // secondes
}

/** État envoyé à la fenêtre de sortie */
export interface OutputState {
  text: string;
  fontSize: number;
  alignment: TextAlign;
  margin: number;
  readingLine: number;
  mirror: Mirror;
  showReadingLine: boolean;
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
  | 'new' | 'import' | 'export' | 'duplicate' | 'rewind' | 'toggleOutput' | 'togglePlay';

export interface ChoiceItem {
  id: string;
  label: string;
  checked?: boolean;
}

export interface ForwardedInput {
  kind: 'key' | 'wheel';
  key?: string;
  code?: string;
  deltaY?: number;
  deltaMode?: number;
}

export const WPM_MIN = 40;
export const WPM_MAX = 400;
export const WPM_STEP = 5;
export const FONT_MIN = 24;
export const FONT_MAX = 220;
export const FONT_STEP = 4;
export const SEEK_STEP = 10;
export const LINE_HEIGHT = 1.45;

export const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

export function countWords(text: string): number {
  let n = 0;
  for (const tok of text.split(/\s+/)) if (/[\p{L}\p{N}]/u.test(tok)) n++;
  return n;
}

export function progressAt(pb: Playback, now: number): number {
  if (!pb.isPlaying || pb.totalDuration <= 0) return pb.anchorProgress;
  return clamp(pb.anchorProgress + (now - pb.anchorTime) / 1000 / pb.totalDuration, 0, 1);
}

export function formatDuration(t: number): string {
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
