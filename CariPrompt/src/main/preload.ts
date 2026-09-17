import { contextBridge, ipcRenderer, webUtils } from 'electron';
import type {
  AppInfo, ChoiceItem, DisplayInfo, ForwardedInput, ImportResult, MenuCommand, OutputState, Prefs,
} from '../shared/types';

const on = <T>(channel: string, cb: (v: T) => void) => {
  const listener = (_e: unknown, v: T) => cb(v);
  ipcRenderer.on(channel, listener);
  return () => { ipcRenderer.removeListener(channel, listener); };
};

const api = {
  appInfo: (): Promise<AppInfo> => ipcRenderer.invoke('app:info'),
  loadStorage: (): Promise<{ scripts: unknown; settings: unknown }> => ipcRenderer.invoke('storage:load'),
  saveScripts: (data: unknown): Promise<void> => ipcRenderer.invoke('storage:saveScripts', data),
  saveSettings: (data: unknown): Promise<void> => ipcRenderer.invoke('storage:saveSettings', data),

  pathForFile: (file: File): string => webUtils.getPathForFile(file),
  importFiles: (paths: string[]): Promise<ImportResult[]> => ipcRenderer.invoke('import:files', paths),
  importDialog: (): Promise<string[]> => ipcRenderer.invoke('import:dialog'),
  exportTxt: (title: string, text: string): Promise<boolean> => ipcRenderer.invoke('export:txt', title, text),
  scriptMenu: (canDelete: boolean): Promise<string | null> => ipcRenderer.invoke('menu:script', canDelete),

  getDisplays: (): Promise<DisplayInfo[]> => ipcRenderer.invoke('displays:get'),
  onDisplaysChanged: (cb: (d: DisplayInfo[]) => void) => on('displays:changed', cb),

  showOutput: (displayId: number) => ipcRenderer.send('output:show', displayId),
  hideOutput: () => ipcRenderer.send('output:hide'),
  onOutputActive: (cb: (active: boolean) => void) => on('output:active', cb),
  sendOutputState: (state: OutputState) => ipcRenderer.send('output:state', state),
  onOutputState: (cb: (state: OutputState) => void) => on('output:state', cb),
  forwardInput: (input: ForwardedInput) => ipcRenderer.send('output:input', input),
  onOutputInput: (cb: (input: ForwardedInput) => void) => on('output:input', cb),

  getPrefs: (): Promise<Prefs> => ipcRenderer.invoke('prefs:get'),
  onPrefsChanged: (cb: (p: Prefs) => void) => on('prefs:changed', cb),
  choiceMenu: (items: ChoiceItem[], x: number, y: number): Promise<string | null> =>
    ipcRenderer.invoke('menu:choice', items, x, y),
  openAppMenu: (x: number, y: number) => ipcRenderer.send('menu:app', x, y),

  onFlushRequest: (cb: () => void) => on('app:flush', cb),
  flushDone: () => ipcRenderer.send('app:flushDone'),

  onMenu: (cb: (cmd: MenuCommand) => void) => on('menu', cb),
};

export type CariAPI = typeof api;
contextBridge.exposeInMainWorld('cari', api);
