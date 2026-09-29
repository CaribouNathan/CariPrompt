// Le numéro de version porte la mise à jour depuis la 2.2.8 : il mène aux
// versions publiées, et passe au bleu quand il en existe une plus récente.
//
//   npm i -D playwright ; xvfb-run -a node tests/version-button.mjs
import { _electron as electron } from 'playwright';
import { readFileSync } from 'node:fs';

// Le libellé de la case du menu ☰ doit dire à quoi elle sert
const libelles = Object.fromEntries(['fr', 'en', 'es', 'de', 'it'].map((l) => [
  l, (readFileSync(`src/shared/locales/${l}.ts`, 'utf8').match(/updateAtLaunch: ['"](.*)['"],/) ?? [])[1] ?? '',
]));

const app = await electron.launch({ args: ['.', '--no-sandbox', '--disable-gpu'], cwd: process.cwd() });
const win = await app.firstWindow();
await win.waitForSelector('.brand-version');
await win.waitForTimeout(1200);

const btn = win.locator('.brand-version');
const before = {
  balise: await btn.evaluate((e) => e.tagName),
  classe: await btn.getAttribute('class'),
  texte: (await btn.textContent()).trim(),
  couleur: await btn.evaluate((e) => getComputedStyle(e).backgroundColor),
};

// Le lien ouvert est intercepté dans le processus principal, sans rien lancer.
// La réponse rend l'adresse d'une release précise, comme le fait GitHub : le
// bouton ne doit pas la suivre, elle n'est pas dans la liste blanche.
await app.evaluate(({ ipcMain, shell }) => {
  globalThis.__ouvert = [];
  shell.openExternal = async (url) => { globalThis.__ouvert.push(url); };
  ipcMain.removeHandler('app:checkUpdate');
  ipcMain.handle('app:checkUpdate', () => ({
    version: '9.9.9', url: 'https://github.com/CaribouNathan/CariPrompt/releases/tag/v9.9.9', newer: true,
  }));
});

await btn.click();
await win.waitForTimeout(400);
const ouvertSansMaj = await app.evaluate(() => globalThis.__ouvert.slice());

// Relance : la vérification au lancement trouve alors une version plus récente
await win.reload();
await win.waitForSelector('.brand-version');
await win.waitForTimeout(6000);
const after = {
  classe: await btn.getAttribute('class'),
  texte: (await btn.textContent()).trim(),
  couleur: await btn.evaluate((e) => getComputedStyle(e).backgroundColor),
  infobulle: await btn.getAttribute('title'),
};
await btn.click();
await win.waitForTimeout(400);
const ouvert = await app.evaluate(() => globalThis.__ouvert.slice());

// Deuxième lancement, même version plus récente : le bleu doit tenir
await win.reload();
await win.waitForSelector('.brand-version');
await win.waitForTimeout(6000);
const encore = await btn.getAttribute('class');

// Le pied du panneau de réglages ne doit plus exister
const restes = await win.evaluate(() => ({
  pied: document.querySelectorAll('.inspector-foot').length,
  pastille: document.querySelectorAll('.update-dot').length,
}));
await app.close();

const accent = after.couleur !== before.couleur;
const checks = [
  ['le numéro de version est un bouton', before.balise === 'BUTTON'],
  ['il affiche la version de l’application, pas celle d’en face', after.texte === before.texte],
  ['au repos il n’est pas bleu', !before.classe.includes('newer')],
  ['il mène à la liste des versions', ouvertSansMaj.length === 1 && ouvertSansMaj[0].endsWith('/CariPrompt/releases')],
  ['une version plus récente le marque', after.classe.includes('newer') && accent],
  ['son infobulle annonce la version trouvée', (after.infobulle ?? '').includes('9.9.9')],
  ['il mène toujours à la même page, pas à la release trouvée',
    ouvert.length === 2 && ouvert.every((u) => u.endsWith('/CariPrompt/releases'))],
  ['le bleu tient au lancement suivant', (encore ?? '').includes('newer')],
  ['le pied du panneau a disparu', restes.pied === 0 && restes.pastille === 0],
  ['le libellé du menu dit de quoi il s’agit',
    Object.values(libelles).every((v) => /jour|update|actualiza|Updates|aggiorna/i.test(v))],
];
console.log(`repos : ${before.texte} (${before.couleur})\naprès : ${after.texte} (${after.couleur})\nliens ouverts : ${ouvert.join(', ')}`);
let bad = 0;
for (const [label, ok] of checks) { console.log(`${ok ? '✓' : '✗'} ${label}`); if (!ok) bad++; }
process.exit(bad ? 1 : 0);
