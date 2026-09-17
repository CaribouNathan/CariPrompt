// Compile le processus principal et le preload (CommonJS), copie l'icône.
import { build } from 'esbuild';
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

const common = {
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  external: ['electron', 'mammoth', 'word-extractor', 'unpdf', 'jszip'],
  sourcemap: false,
  minify: false,
  logLevel: 'info',
  define: { __APP_VERSION__: JSON.stringify(version) },
};

await build({ ...common, entryPoints: ['src/main/main.ts'], outfile: 'dist/main/main.js' });
await build({ ...common, entryPoints: ['src/main/preload.ts'], outfile: 'dist/main/preload.js' });

mkdirSync('dist', { recursive: true });
copyFileSync('build/icon.png', 'dist/icon.png');
