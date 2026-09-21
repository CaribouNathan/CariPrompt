/**
 * Extraction de secours d'une archive .tar.bz2, en JavaScript pur, dans un
 * thread à part : utilisée seulement quand la commande tar du système manque.
 */
import { createReadStream, createWriteStream, statSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { parentPort, workerData } from 'node:worker_threads';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bz2 = require('unbzip2-stream') as () => NodeJS.ReadWriteStream;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tar = require('tar-stream') as {
  extract(): NodeJS.WritableStream & {
    on(ev: 'entry', cb: (h: { name: string }, s: NodeJS.ReadableStream, next: () => void) => void): unknown;
    on(ev: 'finish' | 'error', cb: (e?: Error) => void): unknown;
  };
};

const { archive, dest, members } = workerData as { archive: string; dest: string; members: string[] };
const wanted = new Set(members);
const total = statSync(archive).size;
let read = 0;
let last = 0;

const input = createReadStream(archive);
input.on('data', (c) => {
  read += c.length;
  if (read - last > 4 * 1048576) {
    last = read;
    parentPort?.postMessage({ done: read, total });
  }
});

const extract = tar.extract();
extract.on('entry', (header, stream, next) => {
  if (!wanted.has(header.name)) {
    stream.on('end', next);
    stream.resume();
    return;
  }
  const target = path.join(dest, header.name);
  mkdirSync(path.dirname(target), { recursive: true });
  const out = createWriteStream(target);
  stream.pipe(out);
  out.on('finish', next);
});
extract.on('finish', () => parentPort?.postMessage({ ok: true }));
extract.on('error', (e) => parentPort?.postMessage({ error: e?.message ?? 'extract error' }));
input.on('error', (e) => parentPort?.postMessage({ error: e.message }));

const decompress = bz2();
// Une archive corrompue lève l'erreur ici, pas sur le flux tar
decompress.on('error', (e: Error) => parentPort?.postMessage({ error: e?.message ?? 'bzip2 error' }));
input.pipe(decompress).pipe(extract);
