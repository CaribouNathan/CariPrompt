// Compile le processus principal et le preload (CommonJS), copie l'icône.
import { build } from 'esbuild';
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

const common = {
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  // Tout est empaqueté sauf Electron et le binaire natif de transcription :
  // l'application n'embarque plus node_modules pour l'import de documents.
  external: ['electron', 'sherpa-onnx-node'],
  sourcemap: false,
  minify: true,
  keepNames: true,
  logLevel: 'info',
  define: { __APP_VERSION__: JSON.stringify(version) },
};

await build({ ...common, entryPoints: ['src/main/main.ts'], outfile: 'dist/main/main.js' });
await build({ ...common, entryPoints: ['src/main/preload.ts'], outfile: 'dist/main/preload.js' });
// Extraction de secours des modèles, exécutée dans un thread à part
await build({ ...common, entryPoints: ['src/main/sttExtract.ts'], outfile: 'dist/main/sttExtract.js' });

mkdirSync('dist', { recursive: true });
copyFileSync('build/icon.png', 'dist/icon.png');
// Détection d'activité vocale Silero (MIT), utilisée par la transcription
copyFileSync('vendor/silero_vad.onnx', 'dist/main/silero_vad.onnx');
