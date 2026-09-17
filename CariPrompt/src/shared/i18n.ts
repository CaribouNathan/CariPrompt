export type Lang = 'en' | 'fr';
export type ThemeMode = 'system' | 'light' | 'dark';

export const LANGUAGES: Array<{ id: Lang; name: string }> = [
  { id: 'en', name: 'English' },
  { id: 'fr', name: 'Français' },
];

const en = {
  // Barre de titre
  menu: 'Menu',
  output: 'Output',
  outputOn: 'Output on',
  showOutput: 'Show output',
  hideOutput: 'Hide output',
  outputActive: 'Output active',
  outputInactive: 'Output inactive',
  settings: 'Settings',
  wpm: 'wpm',

  // Bibliothèque
  scripts: 'Scripts',
  words: '{n} words',
  target: 'target',
  newScript: 'New script',
  import: 'Import',
  untitled: 'Untitled',
  copySuffix: ' (copy)',

  // Éditeur
  textPlaceholder: 'Type, paste or drop a file…',
  hintEditing: 'Esc to control the prompter',
  hintIdle: 'Click in the text to edit',

  // Transport
  back10: 'Back 10 s (←)',
  forward10: 'Forward 10 s (→)',
  playPauseHint: 'Play / pause (Space)',

  // Réglages
  speed: 'Speed',
  rate: 'Rate',
  estimatedDuration: 'Estimated duration',
  script: 'Script',
  targetDuration: 'Target duration',
  fitToDuration: 'Fit speed to a duration',
  duration: 'Duration',
  minutesUnit: 'min',
  secondsUnit: 's',
  unreachable: 'Would require {n} wpm, out of range ({min}–{max}).',
  manualDisablesTarget: 'Any manual speed change turns off the target duration.',
  text: 'Text',
  size: 'Size',
  alignment: 'Alignment',
  alignLeft: 'Left',
  alignCenter: 'Center',
  readingLine: 'Reading line',
  showReadingLine: 'Show reading line',
  margins: 'Margins',
  display: 'Display',
  none: 'None',
  primaryDisplay: '(main)',
  mirror: 'Mirror',
  mirrorNone: 'None',
  mirrorHorizontal: 'Horizontal (glass)',
  mirrorVertical: 'Vertical',
  mirrorBoth: 'Both (180°)',
  mirrorPreview: 'Mirror the preview too',
  controls: 'Controls',
  countdown: '3 s countdown',
  invertScroll: 'Invert scroll direction',
  keySpace: 'Space',
  keyEsc: 'Esc',
  keyShift: 'Shift+',
  keyWheel: 'Scroll ↓ / ↑',
  scPlayPause: 'Play / pause',
  scFasterSlower: 'Faster / slower',
  scSeek: '−10 s / +10 s',
  scTextSize: 'Text size',
  scLeaveEditing: 'Leave editing',
  scRewind: 'Back to start',
  scOutput: 'Output on / off',
  scNewImport: 'New / import',
  scDuplicate: 'Duplicate',
  scExport: 'Export as .txt',

  // Bandeau, dépôt
  undo: 'Undo',
  dropToImport: 'Drop to import',
  deleted: '“{title}” deleted',
  imported: '{n} scripts imported',
  someUnsupported: 'Some files are not in a supported format.',
  exportFailed: 'Export failed: {msg}',

  // Menus
  aboutApp: 'About CariPrompt',
  hideApp: 'Hide CariPrompt',
  hideOthers: 'Hide Others',
  showAll: 'Show All',
  quitApp: 'Quit CariPrompt',
  file: 'File',
  importDots: 'Import…',
  exportDots: 'Export as .txt…',
  duplicate: 'Duplicate',
  delete: 'Delete',
  closeWindow: 'Close Window',
  edit: 'Edit',
  redo: 'Redo',
  cut: 'Cut',
  copy: 'Copy',
  paste: 'Paste',
  pasteMatchStyle: 'Paste and Match Style',
  selectAll: 'Select All',
  view: 'View',
  appearance: 'Appearance',
  themeSystem: 'System',
  themeLight: 'Light',
  themeDark: 'Dark',
  language: 'Language',
  prompter: 'Prompter',
  playPause: 'Play / Pause',
  rewind: 'Back to Start',
  toggleOutput: 'Show / Hide Output',
  windowMenu: 'Window',

  // Boîtes de dialogue
  importTitle: 'Import scripts',
  importButton: 'Import',
  textDocuments: 'Text documents',
  exportTitle: 'Export as text',
  textFilter: 'Text',
  defaultFileName: 'Script',
  outputWindowTitle: 'CariPrompt — Output',
  displayN: 'Display {n}',

  // Import
  errUnsupported: '“{name}”: unsupported format.',
  errUnreadable: '“{name}”: could not be read.',
  errEmpty: '“{name}” contains no text (scanned PDF?).',

  sampleText: `Hello and welcome.

Type, paste or drop your script here (txt, docx, doc, rtf, odt, pdf). Set the speed in words per minute, or choose a target duration: scrolling adapts automatically.

Space starts or pauses. Down arrow speeds up, up arrow slows down. Left and right jump back or forward ten seconds. Plus and minus change the text size.`,
};

export type StringKey = keyof typeof en;

const fr: Record<StringKey, string> = {
  menu: 'Menu',
  output: 'Sortie',
  outputOn: 'Sortie active',
  showOutput: 'Afficher la sortie',
  hideOutput: 'Masquer la sortie',
  outputActive: 'Sortie active',
  outputInactive: 'Sortie inactive',
  settings: 'Réglages',
  wpm: 'mots/min',

  scripts: 'Textes',
  words: '{n} mots',
  target: 'cible',
  newScript: 'Nouveau texte',
  import: 'Importer',
  untitled: 'Sans titre',
  copySuffix: ' (copie)',

  textPlaceholder: 'Tapez, collez ou déposez un fichier…',
  hintEditing: 'Échap pour piloter le prompteur',
  hintIdle: 'Cliquez dans le texte pour l\'éditer',

  back10: 'Reculer de 10 s (←)',
  forward10: 'Avancer de 10 s (→)',
  playPauseHint: 'Lecture / pause (Espace)',

  speed: 'Vitesse',
  rate: 'Débit',
  estimatedDuration: 'Durée estimée',
  script: 'Texte',
  targetDuration: 'Durée cible',
  fitToDuration: 'Caler la vitesse sur une durée',
  duration: 'Durée',
  minutesUnit: 'min',
  secondsUnit: 's',
  unreachable: 'Nécessiterait {n} mots/min, hors plage ({min}–{max}).',
  manualDisablesTarget: 'Toute modification manuelle de la vitesse désactive la durée cible.',
  text: 'Texte',
  size: 'Taille',
  alignment: 'Alignement',
  alignLeft: 'Gauche',
  alignCenter: 'Centré',
  readingLine: 'Ligne de lecture',
  showReadingLine: 'Afficher la ligne de lecture',
  margins: 'Marges',
  display: 'Écran',
  none: 'Aucun',
  primaryDisplay: '(principal)',
  mirror: 'Miroir',
  mirrorNone: 'Aucun',
  mirrorHorizontal: 'Horizontal (glace)',
  mirrorVertical: 'Vertical',
  mirrorBoth: 'Les deux (180°)',
  mirrorPreview: 'Miroir aussi dans l\'aperçu',
  controls: 'Commandes',
  countdown: 'Décompte de 3 s',
  invertScroll: 'Inverser le sens de la molette',
  keySpace: 'Espace',
  keyEsc: 'Échap',
  keyShift: 'Maj+',
  keyWheel: 'Molette ↓ / ↑',
  scPlayPause: 'Lecture / pause',
  scFasterSlower: 'Plus vite / moins vite',
  scSeek: '−10 s / +10 s',
  scTextSize: 'Taille du texte',
  scLeaveEditing: 'Quitter l\'édition',
  scRewind: 'Retour au début',
  scOutput: 'Sortie on / off',
  scNewImport: 'Nouveau / importer',
  scDuplicate: 'Dupliquer',
  scExport: 'Exporter en .txt',

  undo: 'Annuler',
  dropToImport: 'Déposer pour importer',
  deleted: '« {title} » supprimé',
  imported: '{n} textes importés',
  someUnsupported: 'Certains fichiers ne sont pas dans un format pris en charge.',
  exportFailed: 'Export impossible : {msg}',

  aboutApp: 'À propos de CariPrompt',
  hideApp: 'Masquer CariPrompt',
  hideOthers: 'Masquer les autres',
  showAll: 'Tout afficher',
  quitApp: 'Quitter CariPrompt',
  file: 'Fichier',
  importDots: 'Importer…',
  exportDots: 'Exporter en .txt…',
  duplicate: 'Dupliquer',
  delete: 'Supprimer',
  closeWindow: 'Fermer la fenêtre',
  edit: 'Édition',
  redo: 'Rétablir',
  cut: 'Couper',
  copy: 'Copier',
  paste: 'Coller',
  pasteMatchStyle: 'Coller et adapter le style',
  selectAll: 'Tout sélectionner',
  view: 'Présentation',
  appearance: 'Apparence',
  themeSystem: 'Système',
  themeLight: 'Clair',
  themeDark: 'Sombre',
  language: 'Langue',
  prompter: 'Prompteur',
  playPause: 'Lecture / Pause',
  rewind: 'Retour au début',
  toggleOutput: 'Afficher / masquer la sortie',
  windowMenu: 'Fenêtre',

  importTitle: 'Importer des textes',
  importButton: 'Importer',
  textDocuments: 'Documents texte',
  exportTitle: 'Exporter en texte',
  textFilter: 'Texte',
  defaultFileName: 'Texte',
  outputWindowTitle: 'CariPrompt — Sortie',
  displayN: 'Écran {n}',

  errUnsupported: '« {name} » : format non pris en charge.',
  errUnreadable: '« {name} » : lecture impossible.',
  errEmpty: '« {name} » ne contient pas de texte (PDF scanné ?).',

  sampleText: `Bonjour et bienvenue.

Collez, tapez ou déposez ici votre texte (txt, docx, doc, rtf, odt, pdf). Réglez la vitesse en mots par minute, ou fixez une durée cible : le défilement s'adapte automatiquement.

Espace pour lancer ou mettre en pause. Flèche bas pour accélérer, flèche haut pour ralentir. Gauche et droite pour reculer ou avancer de dix secondes. Plus et moins pour la taille du texte.`,
};

const TABLES: Record<Lang, Record<StringKey, string>> = { en, fr };

export function isLang(v: unknown): v is Lang {
  return v === 'en' || v === 'fr';
}

export function isTheme(v: unknown): v is ThemeMode {
  return v === 'system' || v === 'light' || v === 'dark';
}

export function tr(lang: Lang, key: StringKey, vars?: Record<string, string | number>): string {
  let s = (TABLES[lang] ?? en)[key] ?? en[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}
