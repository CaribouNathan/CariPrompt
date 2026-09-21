import { contextBridge, ipcRenderer, webUtils } from 'electron';
import type {
  SttErrorCode, SttModelId, SttModelInfo, SttProgress, Transcript,
  AiKeyStatus, AiModel, AiProgress, AiProvider, AiRunResult, AiTask, AiErrorCode,
  AppInfo, ChoiceItem, DisplayInfo, ProjectFile, ProjectReadResult, Take, ForwardedInput, ImportResult, MenuCommand, OutputState, Prefs, UpdateInfo,
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
  scriptMenu: (count: number): Promise<string | null> => ipcRenderer.invoke('menu:script', count),

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

  listFonts: (): Promise<string[]> => ipcRenderer.invoke('fonts:list'),

  listTakes: (): Promise<Take[]> => ipcRenderer.invoke('takes:list'),
  saveTakes: (takes: Take[]): Promise<void> => ipcRenderer.invoke('takes:saveIndex', takes),
  writeTakeAudio: (id: string, data: ArrayBuffer, ext: string): Promise<string> =>
    ipcRenderer.invoke('takes:writeAudio', id, data, ext),
  deleteTakeAudio: (file: string): Promise<void> => ipcRenderer.invoke('takes:deleteAudio', file),
  readTakeAudio: (file: string): Promise<ArrayBuffer> => ipcRenderer.invoke('takes:readAudio', file),
  revealTake: (file: string) => ipcRenderer.send('takes:reveal', file),
  exportTake: (file: string, suggested: string): Promise<boolean> =>
    ipcRenderer.invoke('takes:export', file, suggested),

  sttModels: (): Promise<SttModelInfo[]> => ipcRenderer.invoke('stt:models'),
  sttDownload: (id: SttModelId): Promise<{ ok: boolean; error?: SttErrorCode; detail?: string }> =>
    ipcRenderer.invoke('stt:download', id),
  sttCancelDownload: () => ipcRenderer.send('stt:cancelDownload'),
  sttDeleteModel: (id: SttModelId): Promise<void> => ipcRenderer.invoke('stt:deleteModel', id),
  sttTranscribe: (jobId: string, file: string, model: SttModelId, language: string):
    Promise<{ ok: boolean; transcript?: Transcript; error?: SttErrorCode; detail?: string }> =>
    ipcRenderer.invoke('stt:transcribe', jobId, file, model, language),
  sttCancel: (jobId: string) => ipcRenderer.send('stt:cancel', jobId),
  exportSrt: (content: string, suggested: string): Promise<boolean> => ipcRenderer.invoke('stt:exportSrt', content, suggested),
  onSttProgress: (cb: (p: SttProgress) => void) => on('stt:progress', cb),
  trackStart: (language: string): Promise<{ ok: boolean; model?: SttModelId; error?: SttErrorCode; detail?: string }> =>
    ipcRenderer.invoke('track:start', language),
  trackAudio: (samples: Float32Array, at: number) => ipcRenderer.send('track:audio', samples, at),
  trackStop: () => ipcRenderer.send('track:stop'),
  trackModel: (): Promise<SttModelId | null> => ipcRenderer.invoke('track:model'),
  onTrackHypothesis: (cb: (h: { text: string; audioEnd: number; decodeMs: number }) => void) => on('track:hyp', cb),
  onTrackSpeech: (cb: (s: { speaking: boolean; at: number }) => void) => on('track:speech', cb),

  aiKeyStatus: (): Promise<AiKeyStatus> => ipcRenderer.invoke('ai:keyStatus'),
  aiSetKey: (provider: AiProvider, key: string): Promise<void> => ipcRenderer.invoke('ai:setKey', provider, key),
  aiModels: (provider: AiProvider): Promise<{ ok: boolean; models?: AiModel[]; error?: AiErrorCode; detail?: string }> =>
    ipcRenderer.invoke('ai:models', provider),
  aiRun: (jobId: string, provider: AiProvider, model: string, task: AiTask, paragraphs: string[]): Promise<AiRunResult> =>
    ipcRenderer.invoke('ai:run', jobId, provider, model, task, paragraphs),
  aiCancel: (jobId: string) => ipcRenderer.send('ai:cancel', jobId),
  aiOpenBilling: (provider: AiProvider) => ipcRenderer.send('ai:openBilling', provider),
  openLink: (url: string) => ipcRenderer.send('app:openLink', url),
  checkUpdate: (): Promise<UpdateInfo> => ipcRenderer.invoke('app:checkUpdate'),
  onAiProgress: (cb: (p: AiProgress) => void) => on('ai:progress', cb),

  saveProject: (data: ProjectFile, suggested: string): Promise<string | null> =>
    ipcRenderer.invoke('project:save', data, suggested),
  openProjectDialog: (): Promise<ProjectReadResult | null> => ipcRenderer.invoke('project:openDialog'),
  readProject: (filePath: string): Promise<ProjectReadResult> => ipcRenderer.invoke('project:read', filePath),
  onProjectLoaded: (cb: (r: ProjectReadResult) => void) => on('project:loaded', cb),
  rendererReady: () => ipcRenderer.send('renderer:ready'),

  setFullscreen: (on: boolean) => ipcRenderer.send('window:setFullscreen', on),
  isFullscreen: (): Promise<boolean> => ipcRenderer.invoke('window:isFullscreen'),
  onFullscreenChanged: (cb: (on: boolean) => void) => on('window:fullscreen', cb),

  onMenu: (cb: (cmd: MenuCommand) => void) => on('menu', cb),
};

export type CariAPI = typeof api;
contextBridge.exposeInMainWorld('cari', api);

// La plateforme est marquée avant le premier affichage : sur macOS, la fenêtre
// est transparente sous les colonnes (vibrance) et le style doit être en place
// dès la première image, sans attendre le montage de l'interface.
document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add(`platform-${process.platform}`);
});
