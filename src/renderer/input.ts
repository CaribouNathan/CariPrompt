import { SEEK_STEP, type ForwardedInput } from '../shared/types';
import { api, useStore } from './store';

const isTextField = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable || el.tagName === 'TEXTAREA') return true;
  if (el.tagName !== 'INPUT') return false;
  const type = (el as HTMLInputElement).type;
  return ['text', 'number', 'search', 'email', 'url'].includes(type);
};

/** Commande prompteur à partir d'une touche. Retourne true si la touche a été traitée. */
function handlePrompterKey(key: string, code: string): boolean {
  const s = useStore.getState();
  switch (code) {
    case 'Space': s.togglePlay(); return true;
    case 'ArrowDown': s.adjustSpeed(+1); return true;   // bas → plus vite
    case 'ArrowUp': s.adjustSpeed(-1); return true;     // haut → moins vite
    case 'ArrowLeft': s.seek(-SEEK_STEP); return true;
    case 'ArrowRight': s.seek(+SEEK_STEP); return true;
    case 'Home': s.jump(0); return true;
    case 'NumpadAdd': s.adjustFont(+1); return true;
    case 'NumpadSubtract': s.adjustFont(-1); return true;
    default: break;
  }
  if (key === '+' || key === '=') { s.adjustFont(+1); return true; }
  if (key === '-' || key === '_') { s.adjustFont(-1); return true; }
  return false;
}

// MARK: - Molette

let accumulator = 0;
let lastStepAt = 0;

function handleWheel(deltaY: number, deltaMode: number) {
  const s = useStore.getState();
  // Valeur positive = geste physique vers le bas.
  // macOS avec défilement naturel inverse le signe de deltaY.
  let dy = s.info.platform === 'darwin' && s.info.naturalScroll ? -deltaY : deltaY;
  if (s.settings.invertScroll) dy = -dy;

  const now = performance.now();
  let steps = 0;
  if (deltaMode !== 0 || Math.abs(dy) >= 50) {
    // Cran de molette : un palier par cran
    steps = Math.sign(dy);
    accumulator = 0;
  } else {
    // Trackpad : accumulation, cadence limitée pour absorber l'inertie
    if (now - lastStepAt > 400) accumulator = 0;
    accumulator += dy;
    if (Math.abs(accumulator) >= 30 && now - lastStepAt > 60) {
      steps = Math.sign(accumulator);
      accumulator = 0;
    }
  }
  if (steps !== 0) {
    lastStepAt = now;
    s.adjustSpeed(steps);
  }
}

// MARK: - Opérateur

export function installOperatorInput() {
  const isMac = useStore.getState().info.platform === 'darwin';

  window.addEventListener('keydown', (e) => {
    const s = useStore.getState();
    const editing = isTextField(e.target);
    const mod = isMac ? e.metaKey : e.ctrlKey;

    if (mod && !e.altKey) {
      const k = e.key.toLowerCase();
      let handled = true;
      if (k === 'n' && !e.shiftKey) s.createScript();
      else if (k === 'o' && !e.shiftKey) s.importDialog();
      else if (k === 'e' && e.shiftKey) { const c = s.current(); if (c) s.exportScript(c.id); }
      else if (k === 'd' && e.shiftKey) s.toggleOutput();
      else if (k === 'd' && !e.shiftKey && !editing) { const c = s.current(); if (c) s.duplicate(c.id); }
      else if (k === 'r' && !e.shiftKey) s.jump(0);
      else if (k === 'q' && !isMac) window.close();
      else handled = false;
      if (handled) { e.preventDefault(); return; }
      if (editing) return;                       // ⌘C, ⌘V, ⌘Z… dans les champs
      if (['c', 'v', 'x', 'a', 'z', 'w', 'm', 'h', 'q'].includes(k)) return; // rôles natifs
      e.preventDefault();
      return;
    }

    if (e.key === 'Escape') {
      if (editing) (e.target as HTMLElement).blur();
      e.preventDefault();
      return;
    }
    if (editing) return;

    if (handlePrompterKey(e.key, e.code)) e.preventDefault();
    else if (e.key === 'Tab' || e.key === 'Enter') e.preventDefault();
  });

  window.addEventListener(
    'wheel',
    (e) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-scroll], textarea, select')) return;
      e.preventDefault();
      handleWheel(e.deltaY, e.deltaMode);
    },
    { passive: false },
  );

  // Évite qu'un clic laisse le focus sur un bouton ou un curseur (Espace le réactiverait)
  window.addEventListener('pointerup', () => {
    const a = document.activeElement as HTMLElement | null;
    if (a && !isTextField(a) && a !== document.body) a.blur();
  });

  // Entrées reçues de la fenêtre de sortie
  api.onOutputInput((input: ForwardedInput) => {
    if (input.kind === 'key') handlePrompterKey(input.key ?? '', input.code ?? '');
    else handleWheel(input.deltaY ?? 0, input.deltaMode ?? 0);
  });

  api.onMenu((cmd) => {
    const s = useStore.getState();
    const c = s.current();
    switch (cmd) {
      case 'new': s.createScript(); break;
      case 'import': s.importDialog(); break;
      case 'export': if (c) s.exportScript(c.id); break;
      case 'duplicate': if (c) s.duplicate(c.id); break;
      case 'rewind': s.jump(0); break;
      case 'toggleOutput': s.toggleOutput(); break;
      case 'togglePlay': s.togglePlay(); break;
    }
  });
}

// MARK: - Sortie

export function installOutputInput() {
  window.addEventListener('keydown', (e) => {
    e.preventDefault();
    api.forwardInput({ kind: 'key', key: e.key, code: e.code });
  });
  window.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      api.forwardInput({ kind: 'wheel', deltaY: e.deltaY, deltaMode: e.deltaMode });
    },
    { passive: false },
  );
}
