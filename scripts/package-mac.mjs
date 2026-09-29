// Empaquette CariPrompt pour macOS (arm64 + x64), signe en ad hoc et produit des .zip.
// Fonctionne sur macOS (codesign/ditto) comme sur Linux (rcodesign/zip).
//
// Aucune suppression de fichier, et jamais de réemploi d'un build précédent :
// chaque exécution écrit dans un dossier horodaté qui lui est propre, et les
// archives sont fabriquées sous un nom temporaire puis renommées par-dessus la
// version précédente. C'est la leçon de la 2.2.3 : avec un dossier de sortie
// réutilisé, packager gardait l'ancienne application et les archives
// repartaient d'un code périmé, sans le moindre message d'erreur.
import { packager } from '@electron/packager';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, symlinkSync } from 'node:fs';
import path from 'node:path';

const hasTool = (name) => {
  try {
    execFileSync('which', [name], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const version = pkg.version;
const onMac = process.platform === 'darwin';
// Apple Silicon seulement depuis la 2.0.2 ; MAC_ARCHS=x64 pour un Mac Intel
const archs = (process.env.MAC_ARCHS ?? 'arm64').split(',');
// Horodatage du build : il isole cette exécution des précédentes
const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const outRoot = path.resolve('release', `mac-${version}`, stamp);

// Binaires natifs de la transcription (sherpa-onnx) pour les architectures visées
execFileSync('node', ['scripts/fetch-natives.mjs', archs.map((a) => `darwin-${a}`).join(',')], { stdio: 'inherit' });

// Un passage par architecture : chaque application n'embarque que ses propres binaires natifs
for (const arch of archs) await packager({
  dir: '.',
  out: outRoot,
  name: 'CariPrompt',
  executableName: 'CariPrompt',
  platform: 'darwin',
  arch,
  appVersion: version,
  buildVersion: version,
  appBundleId: 'com.cariboulabs.cariprompt',
  appCategoryType: 'public.app-category.video',
  appCopyright: '© Caribou Labs',
  darwinDarkModeSupport: true,
  icon: 'build/icon.icns',
  // Les modules natifs et le thread d'extraction doivent rester de vrais fichiers
  asar: { unpack: '{**/node_modules/sherpa-onnx-darwin-*/**,**/dist/main/sttExtract.js}' },
  prune: true,
  overwrite: false,
  ignore: [
    /^\/(src|build|scripts|release|vendor|\.test|\.git)(\/|$)/,
    new RegExp(`^/node_modules/sherpa-onnx-(linux|win|darwin-${arch === 'arm64' ? 'x64' : 'arm64'})`),
    /^\/(index\.html|vite\.config\.ts|tsconfig\.json|build\.command|build-all\.sh|README\.md)$/,
  ],
  extendInfo: {
    LSMinimumSystemVersion: '12.0',
    NSHighResolutionCapable: true,
    CFBundleDevelopmentRegion: 'en',
    CFBundleLocalizations: ['en', 'fr', 'es', 'de', 'it'],
    NSMicrophoneUsageDescription:
      'CariPrompt enregistre votre voix pour créer les prises et analyser votre rythme de lecture. Les fichiers restent sur votre ordinateur.',
    // Projets .cariprompt : double-clic dans le Finder
    CFBundleDocumentTypes: [{
      CFBundleTypeName: 'CariPrompt Project',
      CFBundleTypeRole: 'Editor',
      LSHandlerRank: 'Owner',
      LSItemContentTypes: ['com.cariboulabs.cariprompt.project'],
      CFBundleTypeIconFile: 'electron.icns',
    }],
    UTExportedTypeDeclarations: [{
      UTTypeIdentifier: 'com.cariboulabs.cariprompt.project',
      UTTypeDescription: 'CariPrompt Project',
      UTTypeConformsTo: ['public.json', 'public.data'],
      UTTypeIconFile: 'electron.icns',
      UTTypeTagSpecification: { 'public.filename-extension': ['cariprompt'] },
    }],
  },
});

// Dossiers produits par l'exécution en cours
const appPaths = archs
  .map((arch) => path.join(outRoot, `CariPrompt-darwin-${arch}`))
  .filter((dir) => existsSync(path.join(dir, 'CariPrompt.app')));

const entitlements = path.resolve('build', 'entitlements.mac.plist');

for (const dir of appPaths) {
  const arch = dir.endsWith('arm64') ? 'arm64' : 'x64';
  const app = path.join(dir, 'CariPrompt.app');
  const zipName = `CariPrompt-${version}-macOS-${arch === 'arm64' ? 'AppleSilicon' : 'Intel'}.zip`;
  const zipPath = path.resolve('release', zipName);

  console.log(`▸ Signature ad hoc (${arch})…`);
  if (onMac) {
    execFileSync('codesign', ['--force', '--deep', '--sign', '-', '--entitlements', entitlements, app], { stdio: 'inherit' });
  } else {
    execFileSync('rcodesign', [
      'sign',
      '--entitlements-xml-file', `main:${entitlements}`,
      app,
    ], { stdio: 'inherit' });
  }

  // Écriture sous un nom temporaire : zip ajoute ses entrées à une archive
  // existante au lieu de la remplacer, ce qui y laisserait des fichiers périmés.
  // Le renommage final met la nouvelle archive à la place de l'ancienne.
  const zipTmp = path.join(dir, zipName);
  console.log(`▸ Archive ${zipName}…`);
  if (onMac) {
    execFileSync('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', app, zipTmp], { stdio: 'inherit' });
  } else {
    // -y : conserve les liens symboliques des frameworks
    execFileSync('zip', ['-qry', zipTmp, 'CariPrompt.app'], { cwd: dir, stdio: 'inherit' });
  }
  renameSync(zipTmp, zipPath);
}
// Image disque : hdiutil sur macOS, genisoimage + dmg (libdmg-hfsplus) ailleurs.
// Le .app est accompagné d'un lien vers /Applications, pour l'installation par glisser-déposer.
for (const dir of appPaths) {
  const arch = dir.endsWith('arm64') ? 'arm64' : 'x64';
  const app = path.join(dir, 'CariPrompt.app');
  const dmgName = `CariPrompt-${version}-macOS-${arch === 'arm64' ? 'AppleSilicon' : 'Intel'}.dmg`;
  const dmgPath = path.resolve('release', dmgName);
  const dmgTmp = path.join(dir, dmgName);
  const stage = path.join(dir, 'dmg-root');
  mkdirSync(stage, { recursive: true });
  if (!existsSync(path.join(stage, 'CariPrompt.app'))) cpSync(app, path.join(stage, 'CariPrompt.app'), { recursive: true, verbatimSymlinks: true });
  // existsSync suit le lien : sur Linux, /Applications n'existe pas et le lien
  // déjà présent passerait pour absent. On tente, et on ignore un lien existant.
  try {
    symlinkSync('/Applications', path.join(stage, 'Applications'));
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }

  console.log(`▸ Image ${dmgName}…`);
  if (onMac) {
    execFileSync('hdiutil', [
      'create', '-volname', `CariPrompt ${version}`, '-srcfolder', stage,
      '-fs', 'HFS+', '-format', 'UDZO', '-imagekey', 'zlib-level=9', dmgTmp,
    ], { stdio: 'inherit' });
    renameSync(dmgTmp, dmgPath);
  } else if (hasTool('genisoimage') && hasTool('dmg')) {
    const raw = path.join(dir, 'uncompressed.dmg');
    execFileSync('genisoimage', [
      '-no-cache-inodes', '-D', '-l', '-probe', '-V', `CariPrompt ${version}`,
      '-no-pad', '-r', '-dir-mode', '0755', '-apple', '-o', raw, stage,
    ], { stdio: 'inherit' });
    execFileSync('dmg', [raw, dmgTmp], { stdio: 'inherit' });
    renameSync(dmgTmp, dmgPath);
  } else {
    console.log('• genisoimage ou dmg absent : image .dmg non produite (le .zip reste disponible).');
  }
}

console.log('✓ macOS terminé');
