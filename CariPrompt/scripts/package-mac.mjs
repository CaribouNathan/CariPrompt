// Empaquette CariPrompt pour macOS (arm64 + x64), signe en ad hoc et produit des .zip.
// Fonctionne sur macOS (codesign/ditto) comme sur Linux (rcodesign/zip).
// Aucune suppression de fichier : un dossier de sortie déjà présent n'est pas écrasé.
import { packager } from '@electron/packager';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const version = pkg.version;
const onMac = process.platform === 'darwin';
const archs = (process.env.MAC_ARCHS ?? 'arm64,x64').split(',');
const outRoot = path.resolve('release', `mac-${version}`);

await packager({
  dir: '.',
  out: outRoot,
  name: 'CariPrompt',
  executableName: 'CariPrompt',
  platform: 'darwin',
  arch: archs,
  appVersion: version,
  buildVersion: version,
  appBundleId: 'com.cariboulabs.cariprompt',
  appCategoryType: 'public.app-category.video',
  appCopyright: '© Caribou Labs',
  darwinDarkModeSupport: true,
  icon: 'build/icon.icns',
  asar: true,
  prune: true,
  overwrite: false,
  ignore: [
    /^\/(src|build|scripts|release|\.test|\.git)(\/|$)/,
    /^\/(index\.html|vite\.config\.ts|tsconfig\.json|build\.command|build-all\.sh|README\.md)$/,
  ],
  extendInfo: {
    LSMinimumSystemVersion: '12.0',
    NSHighResolutionCapable: true,
    CFBundleDevelopmentRegion: 'fr',
  },
});

// Dossiers attendus, y compris ceux déjà générés lors d'un passage précédent
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

  if (existsSync(zipPath)) {
    console.log(`• ${zipName} existe déjà, archive non régénérée.`);
    continue;
  }
  console.log(`▸ Archive ${zipName}…`);
  if (onMac) {
    execFileSync('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', app, zipPath], { stdio: 'inherit' });
  } else {
    // -y : conserve les liens symboliques des frameworks
    execFileSync('zip', ['-qry', zipPath, 'CariPrompt.app'], { cwd: dir, stdio: 'inherit' });
  }
}
console.log('✓ macOS terminé');
