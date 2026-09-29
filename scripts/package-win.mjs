// Empaquette CariPrompt pour Windows, en x64 ou en arm64.
// Comme pour Linux, la configuration est recopiée ici afin de n'embarquer que
// les binaires natifs de l'architecture visée. Aucune suppression de fichier.
//
// sherpa-onnx ne publie pas de binaire Windows ARM64 : la version arm64 part
// donc sans moteur de transcription. Le chargement est paresseux dans
// src/main/stt.ts, l'application démarre normalement et seules la transcription
// et le suivi vocal signalent un moteur indisponible.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const arch = process.argv[2] ?? 'x64';
if (!['x64', 'arm64'].includes(arch)) {
  console.error(`Architecture inconnue : ${arch} (attendu x64 ou arm64)`);
  process.exit(1);
}

if (arch === 'x64') execFileSync('node', ['scripts/fetch-natives.mjs', 'win-x64'], { stdio: 'inherit' });

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const config = structuredClone(pkg.build);
const files = arch === 'x64'
  ? [
    'dist/**/*',
    'package.json',
    '!node_modules/sherpa-onnx-linux-*/**',
    '!node_modules/sherpa-onnx-darwin-*/**',
    '!node_modules/sherpa-onnx-win-ia32/**',
  ]
  : [
    'dist/**/*',
    'package.json',
    '!node_modules/sherpa-onnx-linux-*/**',
    '!node_modules/sherpa-onnx-darwin-*/**',
    '!node_modules/sherpa-onnx-win-*/**',
  ];
config.files = files;
config.win = { ...config.win, files };
// Le nom du paquet porte l'architecture dès qu'on sort du x64 habituel
if (arch === 'arm64') {
  config.nsis = { ...config.nsis, artifactName: '${productName}-${version}-Windows-ARM64-Setup.${ext}' };
  config.portable = { ...config.portable, artifactName: '${productName}-${version}-Windows-ARM64-Portable.${ext}' };
}

const dir = mkdtempSync(path.join(tmpdir(), 'cariprompt-win-'));
const file = path.join(dir, 'electron-builder.json');
writeFileSync(file, JSON.stringify(config, null, 2));

console.log(`▸ Paquets Windows ${arch}…`);
execFileSync('npx', ['electron-builder', '--win', `--${arch}`, '--config', file], { stdio: 'inherit' });
console.log(`✓ Windows ${arch} terminé`);
