import {
  app, BrowserWindow, dialog, ipcMain, Menu, nativeTheme, net, screen, shell,
  type MenuItemConstructorOptions,
} from 'electron';
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync } from 'node:fs';
import { listFonts } from './fonts';
import {
  cancelDownload, cancelTranscription, deleteModel, downloadModel, listModels as listSttModels,
  sttErrorCode, sttErrorDetail, transcribeFile, startLive, pushLive, stopLive, trackingModel,
} from './stt';
import { aiErrorCode, aiErrorDetail, cancelJob, keyStatus, listModels, runJob, setKey } from './ai';
import {
  deleteAudio, exportTake, listTakes, readAudio, revealTake, saveIndex, takeFilePath, writeAudio,
} from './takes';
import { readFile, rename, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  isLang, isTheme, LANGUAGES, SPELLCHECK_LANGS, tr,
  type Lang, type StringKey, type ThemeMode,
} from '../shared/i18n';
import type {
  AppInfo, ChoiceItem, DisplayInfo, ForwardedInput, ImportResult, MenuCommand, OutputState, Prefs,
  ProjectFile, ProjectReadResult, Take, AiProvider, AiTask, SttModelId, UpdateInfo,
} from '../shared/types';
import { AI_BILLING_URLS } from '../shared/types';
import { canImport, importFile, SUPPORTED_EXTENSIONS } from './importer';

declare const __APP_VERSION__: string;
const APP_VERSION = __APP_VERSION__;
const isMac = process.platform === 'darwin';
const RENDERER_DIR = path.join(__dirname, '..', 'renderer');
const ICON_PNG = path.join(__dirname, '..', 'icon.png');

let mainWindow: BrowserWindow | null = null;
let outputWindow: BrowserWindow | null = null;
let outputDisplayId: number | null = null;
let lastOutputState: OutputState | null = null;

/** Langue et thème : pilotés par les menus, enregistrés par l'interface dans settings.json */
const prefs: Prefs = { language: 'en', theme: 'system' };
const t = (key: StringKey, vars?: Record<string, string | number>) => tr(prefs.language, key, vars);

nativeTheme.themeSource = 'system';
app.setName('CariPrompt');

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_e, argv) => {
    for (const arg of argv.slice(1)) if (isProjectPath(arg)) openProjectPath(arg);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// MARK: - Mise à jour

const RELEASES_URL = 'https://github.com/CaribouNathan/CariPrompt/releases/latest';
const LATEST_API = 'https://api.github.com/repos/CaribouNathan/CariPrompt/releases/latest';

/** Compare deux versions « x.y.z » ; renvoie true si `a` est postérieure à `b` */
function isNewer(a: string, b: string): boolean {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) > (pb[i] ?? 0);
  }
  return false;
}

/** Dernière version publiée sur GitHub. Aucune donnée n'est envoyée, seule l'URL est lue. */
async function checkUpdate(): Promise<UpdateInfo> {
  const res = await net.fetch(LATEST_API, {
    headers: { accept: 'application/vnd.github+json', 'user-agent': `CariPrompt/${app.getVersion()}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { tag_name?: string; html_url?: string };
  const version = String(data.tag_name ?? '').replace(/^v/, '');
  if (!/^\d+\.\d+\.\d+/.test(version)) throw new Error('version illisible');
  return { version, url: data.html_url || RELEASES_URL, newer: isNewer(version, app.getVersion()) };
}

// MARK: - Stockage (userData/scripts.json, settings.json)

const dataFile = (name: string) => path.join(app.getPath('userData'), name);

async function readJSON<T>(name: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(dataFile(name), 'utf8')) as T;
  } catch {
    return null;
  }
}

async function writeJSONAtomic(name: string, data: unknown) {
  const file = dataFile(name);
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await rename(tmp, file); // remplace atomiquement
}

/** Journal d'erreurs : userData/cariprompt.log */
function logError(context: string, err: unknown) {
  const line = `[${new Date().toISOString()}] ${context}: ${(err as Error)?.stack ?? String(err)}\n`;
  try {
    appendFileSync(dataFile('cariprompt.log'), line);
  } catch {
    /* journal indisponible */
  }
  console.error(line);
}

// MARK: - Projets .cariprompt

const PROJECT_EXT = 'cariprompt';
const pendingProjects: string[] = [];

const isProjectPath = (p: string) => path.extname(p).toLowerCase() === `.${PROJECT_EXT}`;

async function readProject(filePath: string): Promise<ProjectReadResult> {
  const name = path.basename(filePath, path.extname(filePath));
  try {
    const data = JSON.parse(await readFile(filePath, 'utf8')) as ProjectFile;
    if (data?.format !== 'cariprompt' || typeof data.script?.text !== 'string') throw new Error('format');
    return { name, path: filePath, data };
  } catch {
    return { name, path: filePath, error: t('projectInvalid', { name: path.basename(filePath) }) };
  }
}

/** Ouverture par double-clic / glisser sur l'icône : transmise à l'interface dès qu'elle est prête */
function openProjectPath(filePath: string) {
  if (!isProjectPath(filePath)) return;
  if (mainWindow && rendererReady) {
    readProject(filePath).then((r) => mainWindow?.webContents.send('project:loaded', r));
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  } else {
    pendingProjects.push(filePath);
  }
}

let rendererReady = false;

app.on('open-file', (e, filePath) => {
  e.preventDefault();
  openProjectPath(filePath);
});

for (const arg of process.argv.slice(1)) if (isProjectPath(arg)) pendingProjects.push(arg);

// MARK: - Préférences système

function naturalScroll(): boolean {
  if (!isMac) return false;
  try {
    return execFileSync('defaults', ['read', '-g', 'com.apple.swipescrolldirection'], { encoding: 'utf8' }).trim() !== '0';
  } catch {
    return true; // valeur par défaut de macOS
  }
}

function applyTheme(theme: ThemeMode) {
  prefs.theme = theme;
  nativeTheme.themeSource = theme;
}

async function loadPrefs() {
  const stored = await readJSON<Partial<Prefs>>('settings.json');
  if (isLang(stored?.language)) prefs.language = stored.language;
  applyTheme(isTheme(stored?.theme) ? stored.theme : 'system');
}

/** Changement depuis un menu : appliqué ici puis transmis à l'interface qui l'enregistre */
function setPrefs(update: Partial<Prefs>) {
  if (update.language) prefs.language = update.language;
  if (update.theme) applyTheme(update.theme);
  if (update.language) applySpellchecker();
  buildMenu();
  if (outputWindow && !outputWindow.isDestroyed()) outputWindow.setTitle(t('outputWindowTitle'));
  mainWindow?.webContents.send('prefs:changed', { ...prefs });
}

/** Le correcteur orthographique suit la langue de l'interface. */
function applySpellchecker() {
  if (!mainWindow) return;
  try {
    mainWindow.webContents.session.setSpellCheckerLanguages(SPELLCHECK_LANGS[prefs.language] ?? ['en-US']);
  } catch (err) {
    logError('Correcteur orthographique', err);
  }
}

function overlayColors() {
  const dark = nativeTheme.shouldUseDarkColors;
  return { color: '#00000000', symbolColor: dark ? '#ffffff' : '#1d1d1f', height: 44 };
}

// MARK: - Écrans

function listDisplays(): DisplayInfo[] {
  const primary = screen.getPrimaryDisplay().id;
  return screen.getAllDisplays().map((d, i) => ({
    id: d.id,
    label: d.label || t('displayN', { n: i + 1 }),
    width: d.bounds.width,
    height: d.bounds.height,
    primary: d.id === primary,
  }));
}

function broadcastDisplays() {
  mainWindow?.webContents.send('displays:changed', listDisplays());
  if (outputWindow && outputDisplayId !== null) {
    const exists = screen.getAllDisplays().some((d) => d.id === outputDisplayId);
    if (exists) placeOutput(outputDisplayId);
    else hideOutput();
  }
}

// MARK: - Fenêtre opérateur

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 820,
    minWidth: 1140,
    minHeight: 600,
    show: false,
    title: 'CariPrompt',
    icon: isMac ? undefined : ICON_PNG,
    // macOS : la fenêtre laisse voir la matière du système sous les colonnes
    // latérales (vibrance). Le fond doit rester transparent, sinon il la masque.
    backgroundColor: isMac ? '#00000000' : (nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#f5f5f7'),
    vibrancy: isMac ? 'sidebar' : undefined,
    visualEffectState: isMac ? 'active' : undefined,
    titleBarStyle: 'hidden',
    trafficLightPosition: isMac ? { x: 16, y: 15 } : undefined,
    titleBarOverlay: isMac ? undefined : overlayColors(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: false,
      spellcheck: true,
    },
  });

  applySpellchecker();
  mainWindow.loadFile(path.join(RENDERER_DIR, 'index.html'));
  mainWindow.once('ready-to-show', () => {
    buildMenu(); // réinstalle la barre de menus macOS une fois la fenêtre prête
    mainWindow?.show();
  });
  mainWindow.on('focus', () => {
    if (isMac && !Menu.getApplicationMenu()?.items.some((i) => i.label === t('prompter'))) buildMenu();
  });

  // Aucun lien ni fichier déposé ne doit faire naviguer la fenêtre
  mainWindow.webContents.on('will-navigate', (e) => e.preventDefault());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('context-menu', (_e, params) => {
    if (!params.isEditable) return;
    const items: MenuItemConstructorOptions[] = [];
    for (const s of params.dictionarySuggestions.slice(0, 5)) {
      items.push({ label: s, click: () => mainWindow?.webContents.replaceMisspelling(s) });
    }
    if (items.length) items.push({ type: 'separator' });
    items.push(
      { role: 'cut', label: t('cut') },
      { role: 'copy', label: t('copy') },
      { role: 'paste', label: t('paste') },
      { role: 'selectAll', label: t('selectAll') },
    );
    Menu.buildFromTemplate(items).popup({ window: mainWindow! });
  });

  mainWindow.on('enter-full-screen', () => mainWindow?.webContents.send('window:fullscreen', true));
  mainWindow.on('leave-full-screen', () => mainWindow?.webContents.send('window:fullscreen', false));

  // Fermeture : le renderer enregistre d'abord la bibliothèque (1,5 s maximum)
  let flushed = false;
  mainWindow.on('close', (e) => {
    if (flushed || !mainWindow) return;
    e.preventDefault();
    const finish = () => {
      if (flushed) return;
      flushed = true;
      mainWindow?.close();
    };
    ipcMain.once('app:flushDone', finish);
    setTimeout(finish, 1500);
    mainWindow.webContents.send('app:flush');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    outputWindow?.destroy();
    outputWindow = null;
    app.quit();
  });
}

// MARK: - Fenêtre de sortie

function ensureOutputWindow(): BrowserWindow {
  if (outputWindow && !outputWindow.isDestroyed()) return outputWindow;
  outputWindow = new BrowserWindow({
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: !isMac,
    skipTaskbar: true,
    hasShadow: false,
    // Sur macOS, une fenêtre non focusable devient un panneau non activant :
    // l'application disparaîtrait de Cmd+Tab et de la barre de menus.
    focusable: isMac ? true : false,
    backgroundColor: '#000000',
    enableLargerThanScreen: true,
    title: t('outputWindowTitle'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: false,
      backgroundThrottling: false,
    },
  });
  outputWindow.loadFile(path.join(RENDERER_DIR, 'index.html'), { query: { view: 'output' } });
  outputWindow.webContents.on('will-navigate', (e) => e.preventDefault());
  outputWindow.webContents.on('did-finish-load', () => {
    if (lastOutputState) outputWindow?.webContents.send('output:state', lastOutputState);
  });
  outputWindow.on('closed', () => {
    outputWindow = null;
    mainWindow?.webContents.send('output:active', false);
  });
  return outputWindow;
}

function placeOutput(displayId: number) {
  const display = screen.getAllDisplays().find((d) => d.id === displayId);
  if (!display || !outputWindow) return;
  const operatorDisplay = mainWindow ? screen.getDisplayMatching(mainWindow.getBounds()).id : null;
  const shared = operatorDisplay === display.id;

  if (!isMac && outputWindow.isFullScreen()) outputWindow.setFullScreen(false);
  outputWindow.setBounds(display.bounds);
  if (isMac) {
    // skipTransformProcessType : sans cette option, l'app quitte le Dock,
    // Cmd+Tab et la barre de menus dès l'affichage de la sortie.
    outputWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
      skipTransformProcessType: true,
    });
    // Au-dessus de la barre des menus sur un écran dédié ; niveau normal sur l'écran opérateur
    outputWindow.setAlwaysOnTop(!shared, 'screen-saver');
  } else {
    outputWindow.setAlwaysOnTop(!shared);
    outputWindow.setFullScreen(true);
  }
}

function showOutput(displayId: number) {
  const win = ensureOutputWindow();
  outputDisplayId = displayId;
  placeOutput(displayId);
  win.showInactive();
  win.setFocusable(false);
  // La fenêtre opérateur reste au premier plan et l'app garde sa barre de menus
  if (isMac) app.focus({ steal: true });
  mainWindow?.focus();
  mainWindow?.webContents.send('output:active', true);
}

function hideOutput() {
  if (outputWindow && !outputWindow.isDestroyed()) {
    if (!isMac && outputWindow.isFullScreen()) outputWindow.setFullScreen(false);
    outputWindow.hide();
  }
  mainWindow?.webContents.send('output:active', false);
}

// MARK: - Menus
// macOS : barre de menus système. Windows / Linux : même contenu dans le menu du bouton ☰.
// Les raccourcis sont gérés par l'interface (registerAccelerator: false) pour éviter les doublons.

function sendMenu(cmd: MenuCommand) {
  mainWindow?.webContents.send('menu', cmd);
}

const cmdItem = (key: StringKey, accelerator: string | undefined, cmd: MenuCommand): MenuItemConstructorOptions => ({
  label: t(key), accelerator, registerAccelerator: false, click: () => sendMenu(cmd),
});

function languageMenu(): MenuItemConstructorOptions {
  return {
    label: t('language'),
    submenu: LANGUAGES.map((l) => ({
      label: l.name,
      type: 'radio' as const,
      checked: prefs.language === l.id,
      click: () => setPrefs({ language: l.id as Lang }),
    })),
  };
}

function appearanceMenu(): MenuItemConstructorOptions {
  const item = (key: StringKey, theme: ThemeMode): MenuItemConstructorOptions => ({
    label: t(key), type: 'radio', checked: prefs.theme === theme, click: () => setPrefs({ theme }),
  });
  return {
    label: t('appearance'),
    submenu: [
      item('themeSystem', 'system'),
      { type: 'separator' },
      item('themeLight', 'light'),
      item('themeDark', 'dark'),
    ],
  };
}

function fileItems(): MenuItemConstructorOptions[] {
  return [
    cmdItem('newScript', 'CmdOrCtrl+N', 'new'),
    cmdItem('importDots', 'CmdOrCtrl+O', 'import'),
    { type: 'separator' },
    cmdItem('openProject', 'CmdOrCtrl+Shift+O', 'openProject'),
    cmdItem('saveProject', 'CmdOrCtrl+S', 'saveProject'),
    { type: 'separator' },
    cmdItem('exportDots', 'CmdOrCtrl+Shift+E', 'export'),
    cmdItem('duplicate', 'CmdOrCtrl+D', 'duplicate'),
  ];
}

function prompterItems(): MenuItemConstructorOptions[] {
  return [
    cmdItem('playPause', 'Alt+Space', 'togglePlay'),
    cmdItem('rewind', 'CmdOrCtrl+R', 'rewind'),
    { type: 'separator' },
    cmdItem('toggleOutput', 'CmdOrCtrl+Shift+D', 'toggleOutput'),
    cmdItem('fullscreen', 'CmdOrCtrl+Shift+F', 'toggleFullscreen'),
    { type: 'separator' },
    cmdItem('btnVoiceTracking', 'CmdOrCtrl+Shift+T', 'toggleTracking'),
    cmdItem('btnAudioRec', 'CmdOrCtrl+Shift+R', 'toggleRecording'),
  ];
}

function buildMenu() {
  if (!isMac) {
    Menu.setApplicationMenu(null);
    return;
  }
  try {
    Menu.setApplicationMenu(Menu.buildFromTemplate(macTemplate()));
  } catch (err) {
    logError('Menu macOS complet', err);
    // Menu de secours : rôles standard uniquement
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      { role: 'appMenu' },
      { role: 'fileMenu' },
      { role: 'editMenu' },
      { label: t('view'), submenu: [appearanceMenu(), languageMenu()] },
      { role: 'windowMenu' },
    ]));
  }
}

function macTemplate(): MenuItemConstructorOptions[] {
  return [
    {
      label: 'CariPrompt',
      submenu: [
        { role: 'about', label: t('aboutApp') },
        { type: 'separator' },
        { role: 'hide', label: t('hideApp') },
        { role: 'hideOthers', label: t('hideOthers') },
        { role: 'unhide', label: t('showAll') },
        { type: 'separator' },
        { role: 'quit', label: t('quitApp') },
      ],
    },
    {
      label: t('file'),
      submenu: [...fileItems(), { type: 'separator' }, { role: 'close', label: t('closeWindow') }],
    },
    {
      label: t('edit'),
      submenu: [
        { role: 'undo', label: t('undo') },
        { role: 'redo', label: t('redo') },
        { type: 'separator' },
        { role: 'cut', label: t('cut') },
        { role: 'copy', label: t('copy') },
        { role: 'paste', label: t('paste') },
        { role: 'pasteAndMatchStyle', label: t('pasteMatchStyle') },
        { role: 'selectAll', label: t('selectAll') },
      ],
    },
    { label: t('view'), submenu: [appearanceMenu(), languageMenu()] },
    { label: t('prompter'), submenu: prompterItems() },
    { role: 'windowMenu', label: t('windowMenu') },
  ];
}

/** Menu du bouton ☰ (Windows / Linux) */
function popupAppMenu(x: number, y: number) {
  if (!mainWindow) return;
  const menu = Menu.buildFromTemplate([
    { label: t('file'), submenu: fileItems() },
    { label: t('prompter'), submenu: prompterItems() },
    { type: 'separator' },
    appearanceMenu(),
    languageMenu(),
    { type: 'separator' },
    { label: t('aboutApp'), click: () => app.showAboutPanel() },
    { type: 'separator' },
    { label: t('quitApp'), accelerator: 'CmdOrCtrl+Q', registerAccelerator: false, click: () => mainWindow?.close() },
  ]);
  menu.popup({ window: mainWindow, x: Math.round(x), y: Math.round(y) });
}

// MARK: - IPC

function registerIpc() {
  ipcMain.handle('app:info', (): AppInfo => ({
    version: APP_VERSION,
    platform: process.platform,
    naturalScroll: naturalScroll(),
  }));

  ipcMain.handle('prefs:get', (): Prefs => ({ ...prefs }));
  ipcMain.on('menu:app', (_e, x: number, y: number) => popupAppMenu(x, y));
  ipcMain.handle('menu:choice', (_e, items: ChoiceItem[], x: number, y: number) => {
    if (!mainWindow) return null;
    return new Promise<string | null>((resolve) => {
      let chosen: string | null = null;
      const menu = Menu.buildFromTemplate(items.map((it) => ({
        label: it.label,
        type: 'checkbox' as const,
        checked: !!it.checked,
        click: () => { chosen = it.id; },
      })));
      menu.popup({
        window: mainWindow!,
        x: Math.round(x),
        y: Math.round(y),
        callback: () => setTimeout(() => resolve(chosen), 0),
      });
    });
  });

  ipcMain.handle('storage:load', async () => ({
    scripts: await readJSON('scripts.json'),
    settings: await readJSON('settings.json'),
  }));
  ipcMain.handle('storage:saveScripts', (_e, data) => writeJSONAtomic('scripts.json', data));
  ipcMain.handle('storage:saveSettings', (_e, data) => writeJSONAtomic('settings.json', data));

  ipcMain.handle('import:files', async (_e, paths: string[]): Promise<ImportResult[]> => {
    const results: ImportResult[] = [];
    for (const p of paths.filter(canImport)) {
      try {
        results.push(await importFile(p, prefs.language));
      } catch (err) {
        results.push({ title: path.basename(p), error: (err as Error).message });
      }
    }
    return results;
  });

  ipcMain.handle('import:dialog', async (): Promise<string[]> => {
    if (!mainWindow) return [];
    const r = await dialog.showOpenDialog(mainWindow, {
      title: t('importTitle'),
      buttonLabel: t('importButton'),
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: t('textDocuments'), extensions: SUPPORTED_EXTENSIONS }],
    });
    return r.canceled ? [] : r.filePaths;
  });

  ipcMain.handle('export:txt', async (_e, title: string, text: string) => {
    if (!mainWindow) return false;
    const safe = title.replace(/[/\\?%*:|"<>]/g, '-').trim() || t('defaultFileName');
    const r = await dialog.showSaveDialog(mainWindow, {
      title: t('exportTitle'),
      defaultPath: `${safe}.txt`,
      filters: [{ name: t('textFilter'), extensions: ['txt'] }],
    });
    if (r.canceled || !r.filePath) return false;
    await writeFile(r.filePath, text, 'utf8');
    return true;
  });

  ipcMain.handle('displays:get', () => listDisplays());

  ipcMain.handle('fonts:list', () => listFonts());

  // MARK: Prises
  ipcMain.handle('stt:models', () => listSttModels());
  ipcMain.handle('stt:download', async (e, id: SttModelId) => {
    try {
      await downloadModel(id, (phase, done, total) => {
        if (!e.sender.isDestroyed()) e.sender.send('stt:progress', { kind: phase, id, done, total });
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: sttErrorCode(err), detail: sttErrorDetail(err) };
    }
  });
  ipcMain.on('stt:cancelDownload', () => cancelDownload());
  ipcMain.handle('stt:deleteModel', (_e, id: SttModelId) => deleteModel(id));
  ipcMain.handle('stt:transcribe', async (e, jobId: string, file: string, model: SttModelId, language: string) => {
    try {
      const transcript = await transcribeFile(jobId, takeFilePath(file), model, language, (done, total) => {
        if (!e.sender.isDestroyed()) e.sender.send('stt:progress', { kind: 'transcribe', id: jobId, done, total });
      });
      return { ok: true, transcript };
    } catch (err) {
      if (sttErrorCode(err) !== 'cancelled') logError('Transcription', err);
      return { ok: false, error: sttErrorCode(err), detail: sttErrorDetail(err) };
    }
  });
  ipcMain.on('stt:cancel', (_e, jobId: string) => cancelTranscription(jobId));

  // Suivi vocal : l'audio arrive de l'interface par blocs de 64 ms à 16 kHz
  ipcMain.handle('track:start', async (e, language: string) => {
    try {
      const model = await startLive(
        language,
        (h) => { if (!e.sender.isDestroyed()) e.sender.send('track:hyp', h); },
        (speaking, at) => { if (!e.sender.isDestroyed()) e.sender.send('track:speech', { speaking, at }); },
      );
      return { ok: true, model };
    } catch (err) {
      return { ok: false, error: sttErrorCode(err), detail: sttErrorDetail(err) };
    }
  });
  ipcMain.on('track:audio', (_e, samples: Float32Array, at: number) => pushLive(samples, at));
  ipcMain.on('track:stop', () => stopLive());
  ipcMain.handle('track:model', () => trackingModel());
  ipcMain.handle('stt:exportSrt', async (_e, content: string, suggested: string): Promise<boolean> => {
    if (!mainWindow) return false;
    const safe = suggested.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'subtitles';
    const r = await dialog.showSaveDialog(mainWindow, {
      title: t('exportSrtTitle'),
      defaultPath: `${safe}.srt`,
      filters: [{ name: t('srtFilter'), extensions: ['srt'] }],
    });
    if (r.canceled || !r.filePath) return false;
    // BOM UTF-8 : certains logiciels de montage lisent sinon les accents de travers
    await writeFile(r.filePath, '\uFEFF' + content, 'utf8');
    return true;
  });

  ipcMain.handle('ai:keyStatus', () => keyStatus());
  // Liens de l'interface : seulement ceux, connus, que l'application affiche
  const LINKS = new Set(['https://fr.wikipedia.org/wiki/Haute-Savoie', RELEASES_URL]);
  ipcMain.on('app:openLink', (_e, url: string) => {
    if (LINKS.has(url)) shell.openExternal(url).catch(() => undefined);
  });
  ipcMain.handle('app:checkUpdate', checkUpdate);
  // Seules les pages de facturation connues peuvent être ouvertes d'ici
  ipcMain.on('ai:openBilling', (_e, provider: AiProvider) => {
    const url = AI_BILLING_URLS[provider];
    if (url) shell.openExternal(url).catch(() => undefined);
  });
  ipcMain.handle('ai:setKey', (_e, provider: AiProvider, key: string) => setKey(provider, key));
  ipcMain.handle('ai:models', async (_e, provider: AiProvider) => {
    try {
      return { ok: true, models: await listModels(provider) };
    } catch (e) {
      return { ok: false, error: aiErrorCode(e), detail: aiErrorDetail(e) };
    }
  });
  ipcMain.handle('ai:run', (e, jobId: string, provider: AiProvider, model: string, task: AiTask, paragraphs: string[]) =>
    runJob(jobId, provider, model, task, paragraphs, (done, total) => {
      if (!e.sender.isDestroyed()) e.sender.send('ai:progress', { jobId, done, total });
    }));
  ipcMain.on('ai:cancel', (_e, jobId: string) => cancelJob(jobId));

  ipcMain.handle('takes:list', () => listTakes());
  ipcMain.handle('takes:saveIndex', (_e, takes: Take[]) => saveIndex(takes));
  ipcMain.handle('takes:writeAudio', (_e, id: string, data: ArrayBuffer, ext: string) => writeAudio(id, data, ext));
  ipcMain.handle('takes:deleteAudio', (_e, file: string) => deleteAudio(file));
  ipcMain.handle('takes:readAudio', (_e, file: string) => readAudio(file));
  ipcMain.on('takes:reveal', (_e, file: string) => revealTake(file));
  ipcMain.handle('takes:export', async (_e, file: string, suggested: string): Promise<boolean> => {
    if (!mainWindow) return false;
    const safe = suggested.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'take';
    const ext = path.extname(file).slice(1) || 'wav';
    const r = await dialog.showSaveDialog(mainWindow, {
      title: t('exportTakeTitle'),
      defaultPath: `${safe}.${ext}`,
      filters: [{ name: t('audioFilter'), extensions: [ext] }],
    });
    if (r.canceled || !r.filePath) return false;
    await exportTake(file, r.filePath);
    return true;
  });

  ipcMain.handle('project:save', async (_e, data: ProjectFile, suggested: string): Promise<string | null> => {
    if (!mainWindow) return null;
    const safe = suggested.replace(/[/\\?%*:|"<>]/g, '-').trim() || t('defaultFileName');
    const r = await dialog.showSaveDialog(mainWindow, {
      title: t('saveProjectTitle'),
      defaultPath: `${safe}.${PROJECT_EXT}`,
      filters: [{ name: t('projectFilter'), extensions: [PROJECT_EXT] }],
    });
    if (r.canceled || !r.filePath) return null;
    await writeFile(r.filePath, JSON.stringify(data, null, 2), 'utf8');
    app.addRecentDocument(r.filePath);
    return path.basename(r.filePath);
  });

  ipcMain.handle('project:openDialog', async (): Promise<ProjectReadResult | null> => {
    if (!mainWindow) return null;
    const r = await dialog.showOpenDialog(mainWindow, {
      title: t('openProjectTitle'),
      properties: ['openFile'],
      filters: [{ name: t('projectFilter'), extensions: [PROJECT_EXT] }],
    });
    if (r.canceled || !r.filePaths[0]) return null;
    app.addRecentDocument(r.filePaths[0]);
    return readProject(r.filePaths[0]);
  });

  ipcMain.handle('project:read', (_e, filePath: string) => readProject(filePath));

  /** L'interface est prête : on lui transmet les projets ouverts avant son chargement */
  ipcMain.on('renderer:ready', () => {
    rendererReady = true;
    for (const p of pendingProjects.splice(0)) openProjectPath(p);
  });

  ipcMain.on('window:setFullscreen', (_e, on: boolean) => mainWindow?.setFullScreen(on));
  ipcMain.handle('window:isFullscreen', () => mainWindow?.isFullScreen() ?? false);

  ipcMain.on('output:show', (_e, displayId: number) => showOutput(displayId));
  ipcMain.on('output:hide', () => hideOutput());
  ipcMain.on('output:state', (_e, state: OutputState) => {
    lastOutputState = state;
    if (outputWindow && !outputWindow.isDestroyed()) outputWindow.webContents.send('output:state', state);
  });
  ipcMain.on('output:input', (_e, input: ForwardedInput) => {
    mainWindow?.webContents.send('output:input', input);
  });

  ipcMain.handle('menu:script', async (_e, count: number) => {
    if (!mainWindow) return null;
    const suffix = count > 1 ? ` (${count})` : '';
    return new Promise<string | null>((resolve) => {
      let chosen: string | null = null;
      const menu = Menu.buildFromTemplate([
        { label: t('duplicate') + suffix, click: () => { chosen = 'duplicate'; } },
        { label: t('exportDots'), enabled: count === 1, click: () => { chosen = 'export'; } },
        { type: 'separator' },
        { label: t('delete') + suffix, click: () => { chosen = 'delete'; } },
      ]);
      menu.popup({ window: mainWindow!, callback: () => setTimeout(() => resolve(chosen), 0) });
    });
  });
}

// MARK: - Cycle de vie

app.whenReady().then(async () => {
  await loadPrefs();
  if (isMac && !app.isPackaged && existsSync(ICON_PNG)) app.dock?.setIcon(ICON_PNG);
  app.setAboutPanelOptions({
    applicationName: 'CariPrompt',
    applicationVersion: APP_VERSION,
    copyright: 'Caribou Labs',
  });
  registerIpc();
  try {
    buildMenu();
  } catch (err) {
    logError('buildMenu', err);
  }
  createMainWindow();

  screen.on('display-added', broadcastDisplays);
  screen.on('display-removed', broadcastDisplays);
  screen.on('display-metrics-changed', broadcastDisplays);

  nativeTheme.on('updated', () => {
    if (!isMac && mainWindow) mainWindow.setTitleBarOverlay(overlayColors());
    mainWindow?.setBackgroundColor(nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#f5f5f7');
  });
});

app.on('window-all-closed', () => app.quit());
