import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { tr, type Lang } from '../shared/i18n';
import { countWords } from '../shared/types';

export const SUPPORTED_EXTENSIONS = [
  'txt', 'text', 'md', 'markdown', 'rtf', 'doc', 'docx', 'odt', 'html', 'htm', 'pdf',
];

export function canImport(p: string): boolean {
  return SUPPORTED_EXTENSIONS.includes(path.extname(p).slice(1).toLowerCase());
}

export async function importFile(filePath: string, lang: Lang = 'en'): Promise<{ title: string; text: string }> {
  const name = path.basename(filePath);
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const title = path.basename(filePath, path.extname(filePath));
  if (!SUPPORTED_EXTENSIONS.includes(ext)) throw new Error(tr(lang, 'errUnsupported', { name }));

  let raw: string;
  try {
    switch (ext) {
      case 'txt': case 'text': case 'md': case 'markdown':
        raw = decodeText(await readFile(filePath));
        break;
      case 'rtf':
        raw = rtfToText((await readFile(filePath)).toString('latin1'));
        break;
      case 'docx': {
        const mammoth = await import('mammoth');
        raw = (await mammoth.extractRawText({ path: filePath })).value;
        break;
      }
      case 'doc': {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const WordExtractor = require('word-extractor');
        const doc = await new WordExtractor().extract(filePath);
        raw = doc.getBody();
        break;
      }
      case 'odt':
        raw = await odtToText(await readFile(filePath));
        break;
      case 'html': case 'htm':
        raw = htmlToText(decodeText(await readFile(filePath)));
        break;
      case 'pdf':
        raw = await pdfToText(await readFile(filePath));
        break;
      default:
        throw new Error('unsupported');
    }
  } catch (err) {
    if (process.env.CARI_DEBUG) console.error(name, err);
    throw new Error(tr(lang, 'errUnreadable', { name }));
  }

  const text = normalize(raw);
  if (countWords(text) === 0) throw new Error(tr(lang, 'errEmpty', { name }));
  return { title, text };
}

// MARK: - Texte brut

function decodeText(buf: Buffer): string {
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) return buf.subarray(3).toString('utf8');
  if (buf[0] === 0xff && buf[1] === 0xfe) return new TextDecoder('utf-16le').decode(buf.subarray(2));
  if (buf[0] === 0xfe && buf[1] === 0xff) return new TextDecoder('utf-16be').decode(buf.subarray(2));
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder('windows-1252').decode(buf); // fichiers Word / Bloc-notes Windows
  }
}

// MARK: - RTF

const RTF_SKIP = new Set([
  'fonttbl', 'colortbl', 'stylesheet', 'info', 'pict', 'object', 'header', 'footer', 'headerl',
  'headerr', 'headerf', 'footerl', 'footerr', 'footerf', 'xmlnstbl', 'listtable', 'listoverridetable',
  'rsidtbl', 'generator', 'themedata', 'colorschememapping', 'latentstyles', 'datastore', 'fldinst',
  'filetbl', 'revtbl', 'pgdsctbl', 'expandedcolortbl', 'mmathPr', 'wgrffmtfilter', 'listtext',
  'pntext', 'pntxta', 'pntxtb', 'bkmkstart', 'bkmkend', 'field-inst', 'nonshppict', 'shp',
]);

export function rtfToText(rtf: string): string {
  const cp1252 = new TextDecoder('windows-1252');
  let out = '';
  let skip = false;
  let uc = 1;
  let pendingSkip = 0;
  const stack: Array<{ skip: boolean; uc: number }> = [];
  let i = 0;
  const n = rtf.length;
  const emit = (s: string) => {
    if (!skip) out += s;
  };

  while (i < n) {
    const c = rtf[i];
    if (c === '{') { stack.push({ skip, uc }); i++; continue; }
    if (c === '}') { const s = stack.pop(); if (s) { skip = s.skip; uc = s.uc; } i++; continue; }
    if (c === '\r' || c === '\n') { i++; continue; }
    if (c !== '\\') {
      if (pendingSkip > 0) pendingSkip--; else emit(c);
      i++;
      continue;
    }
    const d = rtf[i + 1];
    if (d === undefined) break;
    if (d === '\\' || d === '{' || d === '}') {
      if (pendingSkip > 0) pendingSkip--; else emit(d);
      i += 2; continue;
    }
    if (d === "'") {
      const byte = parseInt(rtf.substr(i + 2, 2), 16);
      if (pendingSkip > 0) pendingSkip--;
      else if (!Number.isNaN(byte)) emit(cp1252.decode(Uint8Array.of(byte)));
      i += 4; continue;
    }
    if (d === '*') { skip = true; i += 2; continue; }
    if (d === '~') { emit(' '); i += 2; continue; }
    if (d === '_') { emit('-'); i += 2; continue; }
    if (d === '-') { i += 2; continue; }
    if (d === '\r' || d === '\n') { emit('\n'); i += 2; continue; }

    const m = /^([a-zA-Z]+)(-?\d+)? ?/.exec(rtf.slice(i + 1, i + 40));
    if (!m) { i += 2; continue; }
    i += 1 + m[0].length;
    const word = m[1];
    const param = m[2] !== undefined ? parseInt(m[2], 10) : undefined;

    if (RTF_SKIP.has(word)) { skip = true; continue; }
    switch (word) {
      case 'par': case 'line': case 'sect': case 'page': emit('\n'); break;
      case 'tab': case 'cell': emit(' '); break;
      case 'row': emit('\n'); break;
      case 'emdash': emit('—'); break;
      case 'endash': emit('–'); break;
      case 'lquote': emit('‘'); break;
      case 'rquote': emit('’'); break;
      case 'ldblquote': emit('“'); break;
      case 'rdblquote': emit('”'); break;
      case 'bullet': emit('•'); break;
      case 'uc': uc = param ?? 1; break;
      case 'u':
        if (param !== undefined) {
          emit(String.fromCharCode(param < 0 ? param + 65536 : param));
          pendingSkip = uc;
        }
        break;
      default: break;
    }
  }
  return out;
}

// MARK: - ODT

async function odtToText(buf: Buffer): Promise<string> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('content.xml')?.async('string');
  if (!xml) throw new Error('no content');
  const body = xml.replace(/^[\s\S]*?<office:text[^>]*>/, '').replace(/<\/office:text>[\s\S]*$/, '');
  return decodeEntities(
    body
      .replace(/<text:tab\s*\/>/g, ' ')
      .replace(/<text:line-break\s*\/>/g, '\n')
      .replace(/<text:s(?:\s+text:c="(\d+)")?\s*\/>/g, (_, c) => ' '.repeat(c ? parseInt(c, 10) : 1))
      .replace(/<\/text:(p|h)>/g, '\n\n')
      .replace(/<[^>]+>/g, ''),
  );
}

// MARK: - HTML

function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style|head|noscript)[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|section|article)>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/[ \t]*\n[ \t]*/g, '\n'),
  );
}

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', eacute: 'é', egrave: 'è',
  ecirc: 'ê', agrave: 'à', acirc: 'â', ccedil: 'ç', ocirc: 'ô', ucirc: 'û', ugrave: 'ù',
  icirc: 'î', iuml: 'ï', euml: 'ë', laquo: '«', raquo: '»', rsquo: '’', lsquo: '‘',
  rdquo: '”', ldquo: '“', hellip: '…', mdash: '—', ndash: '–', oelig: 'œ', Eacute: 'É',
  Egrave: 'È', Agrave: 'À', Ccedil: 'Ç', euro: '€',
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e] ?? m;
  });
}

// MARK: - PDF

async function pdfToText(buf: Buffer): Promise<string> {
  const { getDocumentProxy } = await import('unpdf');
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const pages: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    let s = '';
    for (const item of content.items as Array<{ str?: string; hasEOL?: boolean }>) {
      if (typeof item.str !== 'string') continue;
      s += item.str;
      if (item.hasEOL) s += '\n';
    }
    pages.push(s);
  }
  return unwrapHardLineBreaks(pages.join('\n'));
}

/** Un PDF contient un retour par ligne de mise en page : on ne garde que les fins de phrase. */
function unwrapHardLineBreaks(s: string): string {
  const lines = s.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim());
  let out = '';
  for (const line of lines) {
    if (!line) {
      if (!out.endsWith('\n\n')) out += out.endsWith('\n') ? '\n' : '\n\n';
      continue;
    }
    if (!out || out.endsWith('\n') || out.endsWith('-')) out += line;
    else out += ' ' + line;
    if ('.!?:…»"'.includes(line[line.length - 1])) out += '\n';
  }
  return out;
}

// MARK: - Nettoyage

function normalize(s: string): string {
  return s
    .replace(/\r\n?/g, '\n')
    .replace(/\u2028/g, '\n')
    .replace(/\u2029/g, '\n\n')
    .replace(/[\f\v]/g, '\n')
    .replace(/[\uFFFC\u0000-\u0008\u000E-\u001F]/g, '')
    .replace(/[\u00A0\t]/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
