"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/main/main.ts
var import_electron = require("electron");
var import_node_child_process = require("node:child_process");
var import_node_fs = require("node:fs");
var import_promises2 = require("node:fs/promises");
var import_node_path2 = __toESM(require("node:path"));

// src/shared/i18n.ts
var LANGUAGES = [
  { id: "en", name: "English" },
  { id: "fr", name: "Fran\xE7ais" }
];
var en = {
  // Barre de titre
  menu: "Menu",
  output: "Output",
  outputOn: "Output on",
  showOutput: "Show output",
  hideOutput: "Hide output",
  outputActive: "Output active",
  outputInactive: "Output inactive",
  settings: "Settings",
  wpm: "wpm",
  // Bibliothèque
  scripts: "Scripts",
  words: "{n} words",
  target: "target",
  newScript: "New script",
  import: "Import",
  untitled: "Untitled",
  copySuffix: " (copy)",
  // Éditeur
  textPlaceholder: "Type, paste or drop a file\u2026",
  hintEditing: "Esc to control the prompter",
  hintIdle: "Click in the text to edit",
  // Transport
  back10: "Back 10 s (\u2190)",
  forward10: "Forward 10 s (\u2192)",
  playPauseHint: "Play / pause (Space)",
  // Réglages
  speed: "Speed",
  rate: "Rate",
  estimatedDuration: "Estimated duration",
  script: "Script",
  targetDuration: "Target duration",
  fitToDuration: "Fit speed to a duration",
  duration: "Duration",
  minutesUnit: "min",
  secondsUnit: "s",
  unreachable: "Would require {n} wpm, out of range ({min}\u2013{max}).",
  manualDisablesTarget: "Any manual speed change turns off the target duration.",
  text: "Text",
  size: "Size",
  alignment: "Alignment",
  alignLeft: "Left",
  alignCenter: "Center",
  readingLine: "Reading line",
  showReadingLine: "Show reading line",
  margins: "Margins",
  display: "Display",
  none: "None",
  primaryDisplay: "(main)",
  mirror: "Mirror",
  mirrorNone: "None",
  mirrorHorizontal: "Horizontal (glass)",
  mirrorVertical: "Vertical",
  mirrorBoth: "Both (180\xB0)",
  mirrorPreview: "Mirror the preview too",
  controls: "Controls",
  countdown: "3 s countdown",
  invertScroll: "Invert scroll direction",
  keySpace: "Space",
  keyEsc: "Esc",
  keyShift: "Shift+",
  keyWheel: "Scroll \u2193 / \u2191",
  scPlayPause: "Play / pause",
  scFasterSlower: "Faster / slower",
  scSeek: "\u221210 s / +10 s",
  scTextSize: "Text size",
  scLeaveEditing: "Leave editing",
  scRewind: "Back to start",
  scOutput: "Output on / off",
  scNewImport: "New / import",
  scDuplicate: "Duplicate",
  scExport: "Export as .txt",
  // Bandeau, dépôt
  undo: "Undo",
  dropToImport: "Drop to import",
  deleted: "\u201C{title}\u201D deleted",
  imported: "{n} scripts imported",
  someUnsupported: "Some files are not in a supported format.",
  exportFailed: "Export failed: {msg}",
  // Menus
  aboutApp: "About CariPrompt",
  hideApp: "Hide CariPrompt",
  hideOthers: "Hide Others",
  showAll: "Show All",
  quitApp: "Quit CariPrompt",
  file: "File",
  importDots: "Import\u2026",
  exportDots: "Export as .txt\u2026",
  duplicate: "Duplicate",
  delete: "Delete",
  closeWindow: "Close Window",
  edit: "Edit",
  redo: "Redo",
  cut: "Cut",
  copy: "Copy",
  paste: "Paste",
  pasteMatchStyle: "Paste and Match Style",
  selectAll: "Select All",
  view: "View",
  appearance: "Appearance",
  themeSystem: "System",
  themeLight: "Light",
  themeDark: "Dark",
  language: "Language",
  prompter: "Prompter",
  playPause: "Play / Pause",
  rewind: "Back to Start",
  toggleOutput: "Show / Hide Output",
  windowMenu: "Window",
  // Boîtes de dialogue
  importTitle: "Import scripts",
  importButton: "Import",
  textDocuments: "Text documents",
  exportTitle: "Export as text",
  textFilter: "Text",
  defaultFileName: "Script",
  outputWindowTitle: "CariPrompt \u2014 Output",
  displayN: "Display {n}",
  // Import
  errUnsupported: "\u201C{name}\u201D: unsupported format.",
  errUnreadable: "\u201C{name}\u201D: could not be read.",
  errEmpty: "\u201C{name}\u201D contains no text (scanned PDF?).",
  sampleText: `Hello and welcome.

Type, paste or drop your script here (txt, docx, doc, rtf, odt, pdf). Set the speed in words per minute, or choose a target duration: scrolling adapts automatically.

Space starts or pauses. Down arrow speeds up, up arrow slows down. Left and right jump back or forward ten seconds. Plus and minus change the text size.`
};
var fr = {
  menu: "Menu",
  output: "Sortie",
  outputOn: "Sortie active",
  showOutput: "Afficher la sortie",
  hideOutput: "Masquer la sortie",
  outputActive: "Sortie active",
  outputInactive: "Sortie inactive",
  settings: "R\xE9glages",
  wpm: "mots/min",
  scripts: "Textes",
  words: "{n} mots",
  target: "cible",
  newScript: "Nouveau texte",
  import: "Importer",
  untitled: "Sans titre",
  copySuffix: " (copie)",
  textPlaceholder: "Tapez, collez ou d\xE9posez un fichier\u2026",
  hintEditing: "\xC9chap pour piloter le prompteur",
  hintIdle: "Cliquez dans le texte pour l'\xE9diter",
  back10: "Reculer de 10 s (\u2190)",
  forward10: "Avancer de 10 s (\u2192)",
  playPauseHint: "Lecture / pause (Espace)",
  speed: "Vitesse",
  rate: "D\xE9bit",
  estimatedDuration: "Dur\xE9e estim\xE9e",
  script: "Texte",
  targetDuration: "Dur\xE9e cible",
  fitToDuration: "Caler la vitesse sur une dur\xE9e",
  duration: "Dur\xE9e",
  minutesUnit: "min",
  secondsUnit: "s",
  unreachable: "N\xE9cessiterait {n} mots/min, hors plage ({min}\u2013{max}).",
  manualDisablesTarget: "Toute modification manuelle de la vitesse d\xE9sactive la dur\xE9e cible.",
  text: "Texte",
  size: "Taille",
  alignment: "Alignement",
  alignLeft: "Gauche",
  alignCenter: "Centr\xE9",
  readingLine: "Ligne de lecture",
  showReadingLine: "Afficher la ligne de lecture",
  margins: "Marges",
  display: "\xC9cran",
  none: "Aucun",
  primaryDisplay: "(principal)",
  mirror: "Miroir",
  mirrorNone: "Aucun",
  mirrorHorizontal: "Horizontal (glace)",
  mirrorVertical: "Vertical",
  mirrorBoth: "Les deux (180\xB0)",
  mirrorPreview: "Miroir aussi dans l'aper\xE7u",
  controls: "Commandes",
  countdown: "D\xE9compte de 3 s",
  invertScroll: "Inverser le sens de la molette",
  keySpace: "Espace",
  keyEsc: "\xC9chap",
  keyShift: "Maj+",
  keyWheel: "Molette \u2193 / \u2191",
  scPlayPause: "Lecture / pause",
  scFasterSlower: "Plus vite / moins vite",
  scSeek: "\u221210 s / +10 s",
  scTextSize: "Taille du texte",
  scLeaveEditing: "Quitter l'\xE9dition",
  scRewind: "Retour au d\xE9but",
  scOutput: "Sortie on / off",
  scNewImport: "Nouveau / importer",
  scDuplicate: "Dupliquer",
  scExport: "Exporter en .txt",
  undo: "Annuler",
  dropToImport: "D\xE9poser pour importer",
  deleted: "\xAB {title} \xBB supprim\xE9",
  imported: "{n} textes import\xE9s",
  someUnsupported: "Certains fichiers ne sont pas dans un format pris en charge.",
  exportFailed: "Export impossible : {msg}",
  aboutApp: "\xC0 propos de CariPrompt",
  hideApp: "Masquer CariPrompt",
  hideOthers: "Masquer les autres",
  showAll: "Tout afficher",
  quitApp: "Quitter CariPrompt",
  file: "Fichier",
  importDots: "Importer\u2026",
  exportDots: "Exporter en .txt\u2026",
  duplicate: "Dupliquer",
  delete: "Supprimer",
  closeWindow: "Fermer la fen\xEAtre",
  edit: "\xC9dition",
  redo: "R\xE9tablir",
  cut: "Couper",
  copy: "Copier",
  paste: "Coller",
  pasteMatchStyle: "Coller et adapter le style",
  selectAll: "Tout s\xE9lectionner",
  view: "Pr\xE9sentation",
  appearance: "Apparence",
  themeSystem: "Syst\xE8me",
  themeLight: "Clair",
  themeDark: "Sombre",
  language: "Langue",
  prompter: "Prompteur",
  playPause: "Lecture / Pause",
  rewind: "Retour au d\xE9but",
  toggleOutput: "Afficher / masquer la sortie",
  windowMenu: "Fen\xEAtre",
  importTitle: "Importer des textes",
  importButton: "Importer",
  textDocuments: "Documents texte",
  exportTitle: "Exporter en texte",
  textFilter: "Texte",
  defaultFileName: "Texte",
  outputWindowTitle: "CariPrompt \u2014 Sortie",
  displayN: "\xC9cran {n}",
  errUnsupported: "\xAB {name} \xBB : format non pris en charge.",
  errUnreadable: "\xAB {name} \xBB : lecture impossible.",
  errEmpty: "\xAB {name} \xBB ne contient pas de texte (PDF scann\xE9 ?).",
  sampleText: `Bonjour et bienvenue.

Collez, tapez ou d\xE9posez ici votre texte (txt, docx, doc, rtf, odt, pdf). R\xE9glez la vitesse en mots par minute, ou fixez une dur\xE9e cible : le d\xE9filement s'adapte automatiquement.

Espace pour lancer ou mettre en pause. Fl\xE8che bas pour acc\xE9l\xE9rer, fl\xE8che haut pour ralentir. Gauche et droite pour reculer ou avancer de dix secondes. Plus et moins pour la taille du texte.`
};
var TABLES = { en, fr };
function isLang(v) {
  return v === "en" || v === "fr";
}
function isTheme(v) {
  return v === "system" || v === "light" || v === "dark";
}
function tr(lang, key, vars) {
  let s = (TABLES[lang] ?? en)[key] ?? en[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

// src/main/importer.ts
var import_promises = require("node:fs/promises");
var import_node_path = __toESM(require("node:path"));

// src/shared/types.ts
function countWords(text) {
  let n = 0;
  for (const tok of text.split(/\s+/)) if (/[\p{L}\p{N}]/u.test(tok)) n++;
  return n;
}

// src/main/importer.ts
var SUPPORTED_EXTENSIONS = [
  "txt",
  "text",
  "md",
  "markdown",
  "rtf",
  "doc",
  "docx",
  "odt",
  "html",
  "htm",
  "pdf"
];
function canImport(p) {
  return SUPPORTED_EXTENSIONS.includes(import_node_path.default.extname(p).slice(1).toLowerCase());
}
async function importFile(filePath, lang = "en") {
  const name = import_node_path.default.basename(filePath);
  const ext = import_node_path.default.extname(filePath).slice(1).toLowerCase();
  const title = import_node_path.default.basename(filePath, import_node_path.default.extname(filePath));
  if (!SUPPORTED_EXTENSIONS.includes(ext)) throw new Error(tr(lang, "errUnsupported", { name }));
  let raw;
  try {
    switch (ext) {
      case "txt":
      case "text":
      case "md":
      case "markdown":
        raw = decodeText(await (0, import_promises.readFile)(filePath));
        break;
      case "rtf":
        raw = rtfToText((await (0, import_promises.readFile)(filePath)).toString("latin1"));
        break;
      case "docx": {
        const mammoth = await import("mammoth");
        raw = (await mammoth.extractRawText({ path: filePath })).value;
        break;
      }
      case "doc": {
        const WordExtractor = require("word-extractor");
        const doc = await new WordExtractor().extract(filePath);
        raw = doc.getBody();
        break;
      }
      case "odt":
        raw = await odtToText(await (0, import_promises.readFile)(filePath));
        break;
      case "html":
      case "htm":
        raw = htmlToText(decodeText(await (0, import_promises.readFile)(filePath)));
        break;
      case "pdf":
        raw = await pdfToText(await (0, import_promises.readFile)(filePath));
        break;
      default:
        throw new Error("unsupported");
    }
  } catch (err) {
    if (process.env.CARI_DEBUG) console.error(name, err);
    throw new Error(tr(lang, "errUnreadable", { name }));
  }
  const text = normalize(raw);
  if (countWords(text) === 0) throw new Error(tr(lang, "errEmpty", { name }));
  return { title, text };
}
function decodeText(buf) {
  if (buf[0] === 239 && buf[1] === 187 && buf[2] === 191) return buf.subarray(3).toString("utf8");
  if (buf[0] === 255 && buf[1] === 254) return new TextDecoder("utf-16le").decode(buf.subarray(2));
  if (buf[0] === 254 && buf[1] === 255) return new TextDecoder("utf-16be").decode(buf.subarray(2));
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder("windows-1252").decode(buf);
  }
}
var RTF_SKIP = /* @__PURE__ */ new Set([
  "fonttbl",
  "colortbl",
  "stylesheet",
  "info",
  "pict",
  "object",
  "header",
  "footer",
  "headerl",
  "headerr",
  "headerf",
  "footerl",
  "footerr",
  "footerf",
  "xmlnstbl",
  "listtable",
  "listoverridetable",
  "rsidtbl",
  "generator",
  "themedata",
  "colorschememapping",
  "latentstyles",
  "datastore",
  "fldinst",
  "filetbl",
  "revtbl",
  "pgdsctbl",
  "expandedcolortbl",
  "mmathPr",
  "wgrffmtfilter",
  "listtext",
  "pntext",
  "pntxta",
  "pntxtb",
  "bkmkstart",
  "bkmkend",
  "field-inst",
  "nonshppict",
  "shp"
]);
function rtfToText(rtf) {
  const cp1252 = new TextDecoder("windows-1252");
  let out = "";
  let skip = false;
  let uc = 1;
  let pendingSkip = 0;
  const stack = [];
  let i = 0;
  const n = rtf.length;
  const emit = (s) => {
    if (!skip) out += s;
  };
  while (i < n) {
    const c = rtf[i];
    if (c === "{") {
      stack.push({ skip, uc });
      i++;
      continue;
    }
    if (c === "}") {
      const s = stack.pop();
      if (s) {
        skip = s.skip;
        uc = s.uc;
      }
      i++;
      continue;
    }
    if (c === "\r" || c === "\n") {
      i++;
      continue;
    }
    if (c !== "\\") {
      if (pendingSkip > 0) pendingSkip--;
      else emit(c);
      i++;
      continue;
    }
    const d = rtf[i + 1];
    if (d === void 0) break;
    if (d === "\\" || d === "{" || d === "}") {
      if (pendingSkip > 0) pendingSkip--;
      else emit(d);
      i += 2;
      continue;
    }
    if (d === "'") {
      const byte = parseInt(rtf.substr(i + 2, 2), 16);
      if (pendingSkip > 0) pendingSkip--;
      else if (!Number.isNaN(byte)) emit(cp1252.decode(Uint8Array.of(byte)));
      i += 4;
      continue;
    }
    if (d === "*") {
      skip = true;
      i += 2;
      continue;
    }
    if (d === "~") {
      emit(" ");
      i += 2;
      continue;
    }
    if (d === "_") {
      emit("-");
      i += 2;
      continue;
    }
    if (d === "-") {
      i += 2;
      continue;
    }
    if (d === "\r" || d === "\n") {
      emit("\n");
      i += 2;
      continue;
    }
    const m = /^([a-zA-Z]+)(-?\d+)? ?/.exec(rtf.slice(i + 1, i + 40));
    if (!m) {
      i += 2;
      continue;
    }
    i += 1 + m[0].length;
    const word = m[1];
    const param = m[2] !== void 0 ? parseInt(m[2], 10) : void 0;
    if (RTF_SKIP.has(word)) {
      skip = true;
      continue;
    }
    switch (word) {
      case "par":
      case "line":
      case "sect":
      case "page":
        emit("\n");
        break;
      case "tab":
      case "cell":
        emit(" ");
        break;
      case "row":
        emit("\n");
        break;
      case "emdash":
        emit("\u2014");
        break;
      case "endash":
        emit("\u2013");
        break;
      case "lquote":
        emit("\u2018");
        break;
      case "rquote":
        emit("\u2019");
        break;
      case "ldblquote":
        emit("\u201C");
        break;
      case "rdblquote":
        emit("\u201D");
        break;
      case "bullet":
        emit("\u2022");
        break;
      case "uc":
        uc = param ?? 1;
        break;
      case "u":
        if (param !== void 0) {
          emit(String.fromCharCode(param < 0 ? param + 65536 : param));
          pendingSkip = uc;
        }
        break;
      default:
        break;
    }
  }
  return out;
}
async function odtToText(buf) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file("content.xml")?.async("string");
  if (!xml) throw new Error("no content");
  const body = xml.replace(/^[\s\S]*?<office:text[^>]*>/, "").replace(/<\/office:text>[\s\S]*$/, "");
  return decodeEntities(
    body.replace(/<text:tab\s*\/>/g, " ").replace(/<text:line-break\s*\/>/g, "\n").replace(/<text:s(?:\s+text:c="(\d+)")?\s*\/>/g, (_, c) => " ".repeat(c ? parseInt(c, 10) : 1)).replace(/<\/text:(p|h)>/g, "\n\n").replace(/<[^>]+>/g, "")
  );
}
function htmlToText(html) {
  return decodeEntities(
    html.replace(/<(script|style|head|noscript)[\s\S]*?<\/\1>/gi, "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|h[1-6]|li|tr|blockquote|section|article)>/gi, "\n\n").replace(/<[^>]+>/g, "").replace(/[ \t]*\n[ \t]*/g, "\n")
  );
}
var ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  eacute: "\xE9",
  egrave: "\xE8",
  ecirc: "\xEA",
  agrave: "\xE0",
  acirc: "\xE2",
  ccedil: "\xE7",
  ocirc: "\xF4",
  ucirc: "\xFB",
  ugrave: "\xF9",
  icirc: "\xEE",
  iuml: "\xEF",
  euml: "\xEB",
  laquo: "\xAB",
  raquo: "\xBB",
  rsquo: "\u2019",
  lsquo: "\u2018",
  rdquo: "\u201D",
  ldquo: "\u201C",
  hellip: "\u2026",
  mdash: "\u2014",
  ndash: "\u2013",
  oelig: "\u0153",
  Eacute: "\xC9",
  Egrave: "\xC8",
  Agrave: "\xC0",
  Ccedil: "\xC7",
  euro: "\u20AC"
};
function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e] ?? m;
  });
}
async function pdfToText(buf) {
  const { getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const pages = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    let s = "";
    for (const item of content.items) {
      if (typeof item.str !== "string") continue;
      s += item.str;
      if (item.hasEOL) s += "\n";
    }
    pages.push(s);
  }
  return unwrapHardLineBreaks(pages.join("\n"));
}
function unwrapHardLineBreaks(s) {
  const lines = s.replace(/\r\n/g, "\n").split("\n").map((l) => l.trim());
  let out = "";
  for (const line of lines) {
    if (!line) {
      if (!out.endsWith("\n\n")) out += out.endsWith("\n") ? "\n" : "\n\n";
      continue;
    }
    if (!out || out.endsWith("\n") || out.endsWith("-")) out += line;
    else out += " " + line;
    if ('.!?:\u2026\xBB"'.includes(line[line.length - 1])) out += "\n";
  }
  return out;
}
function normalize(s) {
  return s.replace(/\r\n?/g, "\n").replace(/\u2028/g, "\n").replace(/\u2029/g, "\n\n").replace(/[\f\v]/g, "\n").replace(/[\uFFFC\u0000-\u0008\u000E-\u001F]/g, "").replace(/[\u00A0\t]/g, " ").replace(/ {2,}/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

// src/main/main.ts
var APP_VERSION = "1.3.1";
var isMac = process.platform === "darwin";
var RENDERER_DIR = import_node_path2.default.join(__dirname, "..", "renderer");
var ICON_PNG = import_node_path2.default.join(__dirname, "..", "icon.png");
var mainWindow = null;
var outputWindow = null;
var outputDisplayId = null;
var lastOutputState = null;
var prefs = { language: "en", theme: "system" };
var t = (key, vars) => tr(prefs.language, key, vars);
import_electron.nativeTheme.themeSource = "system";
import_electron.app.setName("CariPrompt");
if (!import_electron.app.requestSingleInstanceLock()) {
  import_electron.app.quit();
} else {
  import_electron.app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
var dataFile = (name) => import_node_path2.default.join(import_electron.app.getPath("userData"), name);
async function readJSON(name) {
  try {
    return JSON.parse(await (0, import_promises2.readFile)(dataFile(name), "utf8"));
  } catch {
    return null;
  }
}
async function writeJSONAtomic(name, data) {
  const file = dataFile(name);
  await (0, import_promises2.mkdir)(import_node_path2.default.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await (0, import_promises2.writeFile)(tmp, JSON.stringify(data, null, 2), "utf8");
  await (0, import_promises2.rename)(tmp, file);
}
function logError(context, err) {
  const line = `[${(/* @__PURE__ */ new Date()).toISOString()}] ${context}: ${err?.stack ?? String(err)}
`;
  try {
    (0, import_node_fs.appendFileSync)(dataFile("cariprompt.log"), line);
  } catch {
  }
  console.error(line);
}
function naturalScroll() {
  if (!isMac) return false;
  try {
    return (0, import_node_child_process.execFileSync)("defaults", ["read", "-g", "com.apple.swipescrolldirection"], { encoding: "utf8" }).trim() !== "0";
  } catch {
    return true;
  }
}
function applyTheme(theme) {
  prefs.theme = theme;
  import_electron.nativeTheme.themeSource = theme;
}
async function loadPrefs() {
  const stored = await readJSON("settings.json");
  if (isLang(stored?.language)) prefs.language = stored.language;
  applyTheme(isTheme(stored?.theme) ? stored.theme : "system");
}
function setPrefs(update) {
  if (update.language) prefs.language = update.language;
  if (update.theme) applyTheme(update.theme);
  buildMenu();
  if (outputWindow && !outputWindow.isDestroyed()) outputWindow.setTitle(t("outputWindowTitle"));
  mainWindow?.webContents.send("prefs:changed", { ...prefs });
}
function overlayColors() {
  const dark = import_electron.nativeTheme.shouldUseDarkColors;
  return { color: "#00000000", symbolColor: dark ? "#ffffff" : "#1d1d1f", height: 44 };
}
function listDisplays() {
  const primary = import_electron.screen.getPrimaryDisplay().id;
  return import_electron.screen.getAllDisplays().map((d, i) => ({
    id: d.id,
    label: d.label || t("displayN", { n: i + 1 }),
    width: d.bounds.width,
    height: d.bounds.height,
    primary: d.id === primary
  }));
}
function broadcastDisplays() {
  mainWindow?.webContents.send("displays:changed", listDisplays());
  if (outputWindow && outputDisplayId !== null) {
    const exists = import_electron.screen.getAllDisplays().some((d) => d.id === outputDisplayId);
    if (exists) placeOutput(outputDisplayId);
    else hideOutput();
  }
}
function createMainWindow() {
  mainWindow = new import_electron.BrowserWindow({
    width: 1360,
    height: 820,
    minWidth: 1140,
    minHeight: 600,
    show: false,
    title: "CariPrompt",
    icon: isMac ? void 0 : ICON_PNG,
    backgroundColor: import_electron.nativeTheme.shouldUseDarkColors ? "#1e1e1e" : "#f5f5f7",
    titleBarStyle: "hidden",
    trafficLightPosition: isMac ? { x: 16, y: 15 } : void 0,
    titleBarOverlay: isMac ? void 0 : overlayColors(),
    webPreferences: {
      preload: import_node_path2.default.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: false,
      spellcheck: true
    }
  });
  mainWindow.webContents.session.setSpellCheckerLanguages(["fr", "en-US"]);
  mainWindow.loadFile(import_node_path2.default.join(RENDERER_DIR, "index.html"));
  mainWindow.once("ready-to-show", () => {
    buildMenu();
    mainWindow?.show();
  });
  mainWindow.on("focus", () => {
    if (isMac && !import_electron.Menu.getApplicationMenu()?.items.some((i) => i.label === t("prompter"))) buildMenu();
  });
  mainWindow.webContents.on("will-navigate", (e) => e.preventDefault());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) import_electron.shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("context-menu", (_e, params) => {
    if (!params.isEditable) return;
    const items = [];
    for (const s of params.dictionarySuggestions.slice(0, 5)) {
      items.push({ label: s, click: () => mainWindow?.webContents.replaceMisspelling(s) });
    }
    if (items.length) items.push({ type: "separator" });
    items.push(
      { role: "cut", label: t("cut") },
      { role: "copy", label: t("copy") },
      { role: "paste", label: t("paste") },
      { role: "selectAll", label: t("selectAll") }
    );
    import_electron.Menu.buildFromTemplate(items).popup({ window: mainWindow });
  });
  let flushed = false;
  mainWindow.on("close", (e) => {
    if (flushed || !mainWindow) return;
    e.preventDefault();
    const finish = () => {
      if (flushed) return;
      flushed = true;
      mainWindow?.close();
    };
    import_electron.ipcMain.once("app:flushDone", finish);
    setTimeout(finish, 1500);
    mainWindow.webContents.send("app:flush");
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
    outputWindow?.destroy();
    outputWindow = null;
    import_electron.app.quit();
  });
}
function ensureOutputWindow() {
  if (outputWindow && !outputWindow.isDestroyed()) return outputWindow;
  outputWindow = new import_electron.BrowserWindow({
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
    backgroundColor: "#000000",
    enableLargerThanScreen: true,
    title: t("outputWindowTitle"),
    webPreferences: {
      preload: import_node_path2.default.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: false,
      backgroundThrottling: false
    }
  });
  outputWindow.loadFile(import_node_path2.default.join(RENDERER_DIR, "index.html"), { query: { view: "output" } });
  outputWindow.webContents.on("will-navigate", (e) => e.preventDefault());
  outputWindow.webContents.on("did-finish-load", () => {
    if (lastOutputState) outputWindow?.webContents.send("output:state", lastOutputState);
  });
  outputWindow.on("closed", () => {
    outputWindow = null;
    mainWindow?.webContents.send("output:active", false);
  });
  return outputWindow;
}
function placeOutput(displayId) {
  const display = import_electron.screen.getAllDisplays().find((d) => d.id === displayId);
  if (!display || !outputWindow) return;
  const operatorDisplay = mainWindow ? import_electron.screen.getDisplayMatching(mainWindow.getBounds()).id : null;
  const shared = operatorDisplay === display.id;
  if (!isMac && outputWindow.isFullScreen()) outputWindow.setFullScreen(false);
  outputWindow.setBounds(display.bounds);
  if (isMac) {
    outputWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    outputWindow.setAlwaysOnTop(!shared, "screen-saver");
  } else {
    outputWindow.setAlwaysOnTop(!shared);
    outputWindow.setFullScreen(true);
  }
}
function showOutput(displayId) {
  const win = ensureOutputWindow();
  outputDisplayId = displayId;
  placeOutput(displayId);
  win.showInactive();
  mainWindow?.webContents.send("output:active", true);
}
function hideOutput() {
  if (outputWindow && !outputWindow.isDestroyed()) {
    if (!isMac && outputWindow.isFullScreen()) outputWindow.setFullScreen(false);
    outputWindow.hide();
  }
  mainWindow?.webContents.send("output:active", false);
}
function sendMenu(cmd) {
  mainWindow?.webContents.send("menu", cmd);
}
var cmdItem = (key, accelerator, cmd) => ({
  label: t(key),
  accelerator,
  registerAccelerator: false,
  click: () => sendMenu(cmd)
});
function languageMenu() {
  return {
    label: t("language"),
    submenu: LANGUAGES.map((l) => ({
      label: l.name,
      type: "radio",
      checked: prefs.language === l.id,
      click: () => setPrefs({ language: l.id })
    }))
  };
}
function appearanceMenu() {
  const item = (key, theme) => ({
    label: t(key),
    type: "radio",
    checked: prefs.theme === theme,
    click: () => setPrefs({ theme })
  });
  return {
    label: t("appearance"),
    submenu: [
      item("themeSystem", "system"),
      { type: "separator" },
      item("themeLight", "light"),
      item("themeDark", "dark")
    ]
  };
}
function fileItems() {
  return [
    cmdItem("newScript", "CmdOrCtrl+N", "new"),
    cmdItem("importDots", "CmdOrCtrl+O", "import"),
    { type: "separator" },
    cmdItem("exportDots", "CmdOrCtrl+Shift+E", "export"),
    cmdItem("duplicate", "CmdOrCtrl+D", "duplicate")
  ];
}
function prompterItems() {
  return [
    cmdItem("playPause", "Space", "togglePlay"),
    cmdItem("rewind", "CmdOrCtrl+R", "rewind"),
    { type: "separator" },
    cmdItem("toggleOutput", "CmdOrCtrl+Shift+D", "toggleOutput")
  ];
}
function buildMenu() {
  if (!isMac) {
    import_electron.Menu.setApplicationMenu(null);
    return;
  }
  try {
    import_electron.Menu.setApplicationMenu(import_electron.Menu.buildFromTemplate(macTemplate()));
  } catch (err) {
    logError("Menu macOS complet", err);
    import_electron.Menu.setApplicationMenu(import_electron.Menu.buildFromTemplate([
      { role: "appMenu" },
      { role: "fileMenu" },
      { role: "editMenu" },
      { label: t("view"), submenu: [appearanceMenu(), languageMenu()] },
      { role: "windowMenu" }
    ]));
  }
}
function macTemplate() {
  return [
    {
      label: "CariPrompt",
      submenu: [
        { role: "about", label: t("aboutApp") },
        { type: "separator" },
        { role: "hide", label: t("hideApp") },
        { role: "hideOthers", label: t("hideOthers") },
        { role: "unhide", label: t("showAll") },
        { type: "separator" },
        { role: "quit", label: t("quitApp") }
      ]
    },
    {
      label: t("file"),
      submenu: [...fileItems(), { type: "separator" }, { role: "close", label: t("closeWindow") }]
    },
    {
      label: t("edit"),
      submenu: [
        { role: "undo", label: t("undo") },
        { role: "redo", label: t("redo") },
        { type: "separator" },
        { role: "cut", label: t("cut") },
        { role: "copy", label: t("copy") },
        { role: "paste", label: t("paste") },
        { role: "pasteAndMatchStyle", label: t("pasteMatchStyle") },
        { role: "selectAll", label: t("selectAll") }
      ]
    },
    { label: t("view"), submenu: [appearanceMenu(), languageMenu()] },
    { label: t("prompter"), submenu: prompterItems() },
    { role: "windowMenu", label: t("windowMenu") }
  ];
}
function popupAppMenu(x, y) {
  if (!mainWindow) return;
  const menu = import_electron.Menu.buildFromTemplate([
    { label: t("file"), submenu: fileItems() },
    { label: t("prompter"), submenu: prompterItems() },
    { type: "separator" },
    appearanceMenu(),
    languageMenu(),
    { type: "separator" },
    { label: t("aboutApp"), click: () => import_electron.app.showAboutPanel() },
    { type: "separator" },
    { label: t("quitApp"), accelerator: "CmdOrCtrl+Q", registerAccelerator: false, click: () => mainWindow?.close() }
  ]);
  menu.popup({ window: mainWindow, x: Math.round(x), y: Math.round(y) });
}
function registerIpc() {
  import_electron.ipcMain.handle("app:info", () => ({
    version: APP_VERSION,
    platform: process.platform,
    naturalScroll: naturalScroll()
  }));
  import_electron.ipcMain.handle("prefs:get", () => ({ ...prefs }));
  import_electron.ipcMain.on("menu:app", (_e, x, y) => popupAppMenu(x, y));
  import_electron.ipcMain.handle("menu:choice", (_e, items, x, y) => {
    if (!mainWindow) return null;
    return new Promise((resolve) => {
      let chosen = null;
      const menu = import_electron.Menu.buildFromTemplate(items.map((it) => ({
        label: it.label,
        type: "checkbox",
        checked: !!it.checked,
        click: () => {
          chosen = it.id;
        }
      })));
      menu.popup({
        window: mainWindow,
        x: Math.round(x),
        y: Math.round(y),
        callback: () => setTimeout(() => resolve(chosen), 0)
      });
    });
  });
  import_electron.ipcMain.handle("storage:load", async () => ({
    scripts: await readJSON("scripts.json"),
    settings: await readJSON("settings.json")
  }));
  import_electron.ipcMain.handle("storage:saveScripts", (_e, data) => writeJSONAtomic("scripts.json", data));
  import_electron.ipcMain.handle("storage:saveSettings", (_e, data) => writeJSONAtomic("settings.json", data));
  import_electron.ipcMain.handle("import:files", async (_e, paths) => {
    const results = [];
    for (const p of paths.filter(canImport)) {
      try {
        results.push(await importFile(p, prefs.language));
      } catch (err) {
        results.push({ title: import_node_path2.default.basename(p), error: err.message });
      }
    }
    return results;
  });
  import_electron.ipcMain.handle("import:dialog", async () => {
    if (!mainWindow) return [];
    const r = await import_electron.dialog.showOpenDialog(mainWindow, {
      title: t("importTitle"),
      buttonLabel: t("importButton"),
      properties: ["openFile", "multiSelections"],
      filters: [{ name: t("textDocuments"), extensions: SUPPORTED_EXTENSIONS }]
    });
    return r.canceled ? [] : r.filePaths;
  });
  import_electron.ipcMain.handle("export:txt", async (_e, title, text) => {
    if (!mainWindow) return false;
    const safe = title.replace(/[/\\?%*:|"<>]/g, "-").trim() || t("defaultFileName");
    const r = await import_electron.dialog.showSaveDialog(mainWindow, {
      title: t("exportTitle"),
      defaultPath: `${safe}.txt`,
      filters: [{ name: t("textFilter"), extensions: ["txt"] }]
    });
    if (r.canceled || !r.filePath) return false;
    await (0, import_promises2.writeFile)(r.filePath, text, "utf8");
    return true;
  });
  import_electron.ipcMain.handle("displays:get", () => listDisplays());
  import_electron.ipcMain.on("output:show", (_e, displayId) => showOutput(displayId));
  import_electron.ipcMain.on("output:hide", () => hideOutput());
  import_electron.ipcMain.on("output:state", (_e, state) => {
    lastOutputState = state;
    if (outputWindow && !outputWindow.isDestroyed()) outputWindow.webContents.send("output:state", state);
  });
  import_electron.ipcMain.on("output:input", (_e, input) => {
    mainWindow?.webContents.send("output:input", input);
  });
  import_electron.ipcMain.handle("menu:script", async (_e, canDelete) => {
    if (!mainWindow) return null;
    return new Promise((resolve) => {
      let chosen = null;
      const menu = import_electron.Menu.buildFromTemplate([
        { label: t("duplicate"), click: () => {
          chosen = "duplicate";
        } },
        { label: t("exportDots"), click: () => {
          chosen = "export";
        } },
        { type: "separator" },
        { label: t("delete"), enabled: canDelete, click: () => {
          chosen = "delete";
        } }
      ]);
      menu.popup({ window: mainWindow, callback: () => setTimeout(() => resolve(chosen), 0) });
    });
  });
}
import_electron.app.whenReady().then(async () => {
  await loadPrefs();
  if (isMac && !import_electron.app.isPackaged && (0, import_node_fs.existsSync)(ICON_PNG)) import_electron.app.dock?.setIcon(ICON_PNG);
  import_electron.app.setAboutPanelOptions({
    applicationName: "CariPrompt",
    applicationVersion: APP_VERSION,
    copyright: "Caribou Labs"
  });
  registerIpc();
  try {
    buildMenu();
  } catch (err) {
    logError("buildMenu", err);
  }
  createMainWindow();
  import_electron.screen.on("display-added", broadcastDisplays);
  import_electron.screen.on("display-removed", broadcastDisplays);
  import_electron.screen.on("display-metrics-changed", broadcastDisplays);
  import_electron.nativeTheme.on("updated", () => {
    if (!isMac && mainWindow) mainWindow.setTitleBarOverlay(overlayColors());
    mainWindow?.setBackgroundColor(import_electron.nativeTheme.shouldUseDarkColors ? "#1e1e1e" : "#f5f5f7");
  });
});
import_electron.app.on("window-all-closed", () => import_electron.app.quit());
