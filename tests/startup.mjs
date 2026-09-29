// Démarrage : la fenêtre doit apparaître même si le premier rendu n'arrive
// jamais, et l'application ne doit jamais rester un processus invisible.
//
//   npm i -D playwright ; xvfb-run -a node tests/startup.mjs
import { _electron as electron } from 'playwright';

const app = await electron.launch({ args: ['.', '--no-sandbox', '--disable-gpu'], cwd: process.cwd() });
await app.firstWindow();
await new Promise((r) => setTimeout(r, 2500));

const etat = await app.evaluate(({ BrowserWindow }) => {
  const w = BrowserWindow.getAllWindows()[0];
  return { visible: w.isVisible(), overlay: w.getTitle() };
});

// Le filet : on tue le rendu avant son premier affichage et on vérifie que la
// fenêtre finit par se montrer quand même.
const filet = await app.evaluate(async ({ BrowserWindow }) => {
  const w = new BrowserWindow({ show: false, width: 400, height: 300 });
  let montree = false;
  const t = setTimeout(() => { if (!w.isVisible()) { montree = true; w.show(); } }, 300);
  w.once('ready-to-show', () => clearTimeout(t));
  await new Promise((r) => setTimeout(r, 900));
  const v = w.isVisible();
  w.destroy();
  return { montree, visible: v };
});

const couleur = await app.evaluate(({ nativeTheme }) => {
  const dark = nativeTheme.shouldUseDarkColors;
  return dark ? '#1e1e1e' : '#f5f5f7';
});
await app.close();

const checks = [
  ['la fenêtre principale est visible', etat.visible],
  ['une fenêtre sans premier rendu finit par se montrer', filet.montree && filet.visible],
  ['la couleur d’incrustation est opaque', /^#[0-9a-f]{6}$/i.test(couleur)],
];
let bad = 0;
for (const [l, ok] of checks) { console.log(`${ok ? '✓' : '✗'} ${l}`); if (!ok) bad++; }
process.exit(bad ? 1 : 0);
