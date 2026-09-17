import {
  app, BrowserWindow, dialog, ipcMain, Menu, nativeTheme, screen, shell,
  type MenuItemConstructorOptions,
} from 'electron';
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync } from 'node:fs';
import { readFile, rename, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { isLang, isTheme, LANGUAGES, tr, type Lang, type StringKey, type ThemeMode } from '../shared/i18n';
import type {
  AppInfo, ChoiceItem, DisplayInfo, ForwardedInput, ImportResult, MenuCommand, OutputState, Prefs,
} from '../shared/types';
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
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
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
  buildMenu();
  if (outputWindow && !outputWindow.isDestroyed()) outputWindow.setTitle(t('outputWindowTitle'));
  mainWindow?.webContents.send('prefs:changed', { ...prefs });
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
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#f5f5f7',
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

  mainWindow.webContents.session.setSpellCheckerLanguages(['fr', 'en-US']);
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
    focusable: false,
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
    outputWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
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
    cmdItem('exportDots', 'CmdOrCtrl+Shift+E', 'export'),
    cmdItem('duplicate', 'CmdOrCtrl+D', 'duplicate'),
  ];
}

function prompterItems(): MenuItemConstructorOptions[] {
  return [
    cmdItem('playPause', 'Space', 'togglePlay'),
    cmdItem('rewind', 'CmdOrCtrl+R', 'rewind'),
    { type: 'separator' },
    cmdItem('toggleOutput', 'CmdOrCtrl+Shift+D', 'toggleOutput'),
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

  ipcMain.on('output:show', (_e, displayId: number) => showOutput(displayId));
  ipcMain.on('output:hide', () => hideOutput());
  ipcMain.on('output:state', (_e, state: OutputState) => {
    lastOutputState = state;
    if (outputWindow && !outputWindow.isDestroyed()) outputWindow.webContents.send('output:state', state);
  });
  ipcMain.on('output:input', (_e, input: ForwardedInput) => {
    mainWindow?.webContents.send('output:input', input);
  });

  ipcMain.handle('menu:script', async (_e, canDelete: boolean) => {
    if (!mainWindow) return null;
    return new Promise<string | null>((resolve) => {
      let chosen: string | null = null;
      const menu = Menu.buildFromTemplate([
        { label: t('duplicate'), click: () => { chosen = 'duplicate'; } },
        { label: t('exportDots'), click: () => { chosen = 'export'; } },
        { type: 'separator' },
        { label: t('delete'), enabled: canDelete, click: () => { chosen = 'delete'; } },
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
