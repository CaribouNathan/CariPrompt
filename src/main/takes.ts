import { app, shell } from 'electron';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Take } from '../shared/types';

/**
 * Les prises vivent dans userData/takes : un fichier audio par prise,
 * plus un index JSON. L'audio n'est jamais réécrit après l'enregistrement.
 */
const takesDir = () => path.join(app.getPath('userData'), 'takes');
const indexFile = () => path.join(takesDir(), 'index.json');

export function takeFilePath(file: string): string {
  // Le nom vient de l'index : on le réduit à son nom de base par sécurité
  return path.join(takesDir(), path.basename(file));
}

export async function listTakes(): Promise<Take[]> {
  try {
    const raw = JSON.parse(await readFile(indexFile(), 'utf8')) as Take[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export async function saveIndex(takes: Take[]): Promise<void> {
  await mkdir(takesDir(), { recursive: true });
  const tmp = `${indexFile()}.tmp`;
  await writeFile(tmp, JSON.stringify(takes, null, 2), 'utf8');
  await rename(tmp, indexFile());
}

/** Écrit l'audio d'une nouvelle prise et renvoie son nom de fichier. */
export async function writeAudio(id: string, data: ArrayBuffer, ext: string): Promise<string> {
  await mkdir(takesDir(), { recursive: true });
  const file = `${id}.${ext}`;
  await writeFile(path.join(takesDir(), file), Buffer.from(data));
  return file;
}

export async function deleteAudio(file: string): Promise<void> {
  await rm(takeFilePath(file), { force: true });
}

export function revealTake(file: string): void {
  shell.showItemInFolder(takeFilePath(file));
}

/** Copie l'audio d'une prise vers une destination choisie par l'utilisateur. */
export async function exportTake(file: string, destination: string): Promise<void> {
  await writeFile(destination, await readFile(takeFilePath(file)));
}

/** Données audio d'une prise, pour la lecture dans l'interface. */
export async function readAudio(file: string): Promise<ArrayBuffer> {
  const buf = await readFile(takeFilePath(file));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}
