// Empaquette CariPrompt pour Linux, en x86_64 ou en arm64.
// electron-builder ne sait pas exclure des fichiers par architecture : la
// configuration est donc recopiée ici, avec les seuls binaires natifs de
// l'architecture visée, puis passée au builder. Aucune suppression de fichier.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const arch = process.argv[2] ?? 'x64';
if (!['x64', 'arm64'].includes(arch)) {
  console.error(`Architecture inconnue : ${arch} (attendu x64 ou arm64)`);
  process.exit(1);
}
const other = arch === 'x64' ? 'arm64' : 'x64';

// Binaire natif de la transcription pour l'architecture visée
execFileSync('node', ['scripts/fetch-natives.mjs', `linux-${arch}`], { stdio: 'inherit' });

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const config = structuredClone(pkg.build);
// Les exclusions communes et celles de la plateforme s'additionnent : les deux
// listes doivent donc laisser passer le binaire natif de l'architecture visée.
const files = [
  'dist/**/*',
  'package.json',
  '!node_modules/sherpa-onnx-win-*/**',
  '!node_modules/sherpa-onnx-darwin-*/**',
  `!node_modules/sherpa-onnx-linux-${other}/**`,
];
config.files = files;
config.linux = { ...config.linux, files };

const dir = mkdtempSync(path.join(tmpdir(), 'cariprompt-linux-'));
const file = path.join(dir, 'electron-builder.json');
writeFileSync(file, JSON.stringify(config, null, 2));

console.log(`▸ Paquets Linux ${arch}…`);
execFileSync('npx', ['electron-builder', '--linux', `--${arch}`, '--config', file], { stdio: 'inherit' });
console.log(`✓ Linux ${arch} terminé`);
