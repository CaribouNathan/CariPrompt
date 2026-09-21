import { de } from './locales/de';
import { en } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { it } from './locales/it';

import type { StringKey } from './locales/en';

export type { StringKey };

export type Lang = 'en' | 'fr' | 'es' | 'de' | 'it';
export type ThemeMode = 'system' | 'light' | 'dark';

/** Langues de l'interface. Le nom est écrit dans la langue elle-même. */
export const LANGUAGES: Array<{ id: Lang; name: string }> = [
  { id: 'en', name: 'English' },
  { id: 'fr', name: 'Français' },
  { id: 'es', name: 'Español' },
  { id: 'de', name: 'Deutsch' },
  { id: 'it', name: 'Italiano' },
];

/** Code de langue à passer aux moteurs de transcription et de correction orthographique */
export const SPELLCHECK_LANGS: Record<Lang, string[]> = {
  en: ['en-US'],
  fr: ['fr'],
  es: ['es'],
  de: ['de'],
  it: ['it'],
};

const TABLES: Record<Lang, Record<StringKey, string>> = { en, fr, es, de, it };

export function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(TABLES, v);
}

export function isTheme(v: unknown): v is ThemeMode {
  return v === 'system' || v === 'light' || v === 'dark';
}

export function tr(lang: Lang, key: StringKey, vars?: Record<string, string | number>): string {
  let s = (TABLES[lang] ?? en)[key] ?? en[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}
