// Place dans node_modules les binaires sherpa-onnx des plateformes cibles.
// npm n'installe que ceux de la machine qui compile ; pour empaqueter macOS ou
// Windows depuis une autre plateforme, il faut les récupérer à part.
// Aucune suppression : un paquet déjà présent est laissé tel quel.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const { version } = JSON.parse(readFileSync('node_modules/sherpa-onnx-node/package.json', 'utf8'));
const targets = (process.argv[2] ?? 'darwin-arm64,darwin-x64').split(',');
const cache = path.resolve('release', 'natives-cache');
mkdirSync(cache, { recursive: true });

for (const target of targets) {
  const name = `sherpa-onnx-${target}`;
  const dest = path.resolve('node_modules', name);
  if (existsSync(path.join(dest, 'sherpa-onnx.node'))) {
    console.log(`✓ ${name} déjà présent`);
    continue;
  }
  console.log(`▸ ${name}@${version}…`);
  const tgz = execFileSync('npm', ['pack', `${name}@${version}`, '--silent', '--pack-destination', cache], { encoding: 'utf8' })
    .trim().split('\n').pop();
  mkdirSync(dest, { recursive: true });
  // L'archive npm contient un dossier « package » : on l'ôte en extrayant
  execFileSync('tar', ['-xzf', path.join(cache, tgz), '-C', dest, '--strip-components=1']);
  console.log(`✓ ${name}`);
}
