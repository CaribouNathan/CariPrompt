import { tr, type StringKey } from '../shared/i18n';
import { useStore } from './store';

/** Traduction dans la langue courante, réévaluée quand elle change */
export function useT() {
  const lang = useStore((s) => s.settings.language);
  return (key: StringKey, vars?: Record<string, string | number>) => tr(lang, key, vars);
}
