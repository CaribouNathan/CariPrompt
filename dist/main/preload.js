"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main/preload.ts
var preload_exports = {};
module.exports = __toCommonJS(preload_exports);
var import_electron = require("electron");
var on = (channel, cb) => {
  const listener = (_e, v) => cb(v);
  import_electron.ipcRenderer.on(channel, listener);
  return () => {
    import_electron.ipcRenderer.removeListener(channel, listener);
  };
};
var api = {
  appInfo: () => import_electron.ipcRenderer.invoke("app:info"),
  loadStorage: () => import_electron.ipcRenderer.invoke("storage:load"),
  saveScripts: (data) => import_electron.ipcRenderer.invoke("storage:saveScripts", data),
  saveSettings: (data) => import_electron.ipcRenderer.invoke("storage:saveSettings", data),
  pathForFile: (file) => import_electron.webUtils.getPathForFile(file),
  importFiles: (paths) => import_electron.ipcRenderer.invoke("import:files", paths),
  importDialog: () => import_electron.ipcRenderer.invoke("import:dialog"),
  exportTxt: (title, text) => import_electron.ipcRenderer.invoke("export:txt", title, text),
  scriptMenu: (canDelete) => import_electron.ipcRenderer.invoke("menu:script", canDelete),
  getDisplays: () => import_electron.ipcRenderer.invoke("displays:get"),
  onDisplaysChanged: (cb) => on("displays:changed", cb),
  showOutput: (displayId) => import_electron.ipcRenderer.send("output:show", displayId),
  hideOutput: () => import_electron.ipcRenderer.send("output:hide"),
  onOutputActive: (cb) => on("output:active", cb),
  sendOutputState: (state) => import_electron.ipcRenderer.send("output:state", state),
  onOutputState: (cb) => on("output:state", cb),
  forwardInput: (input) => import_electron.ipcRenderer.send("output:input", input),
  onOutputInput: (cb) => on("output:input", cb),
  getPrefs: () => import_electron.ipcRenderer.invoke("prefs:get"),
  onPrefsChanged: (cb) => on("prefs:changed", cb),
  choiceMenu: (items, x, y) => import_electron.ipcRenderer.invoke("menu:choice", items, x, y),
  openAppMenu: (x, y) => import_electron.ipcRenderer.send("menu:app", x, y),
  onFlushRequest: (cb) => on("app:flush", cb),
  flushDone: () => import_electron.ipcRenderer.send("app:flushDone"),
  onMenu: (cb) => on("menu", cb)
};
import_electron.contextBridge.exposeInMainWorld("cari", api);
