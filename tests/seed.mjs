// Textes fournis à la migration.
//
// Depuis la 2.2.7, « Welcome » est le seul texte semé. On vérifie sur un profil
// préparé que les scripts de test d'une version antérieure disparaissent s'ils
// sont intacts, restent s'ils ont été retouchés, et qu'aucun texte de bienvenue
// n'est ajouté par-dessus celui qui est déjà là.
//
//   npm i -D playwright ; xvfb-run -a node tests/seed.mjs
import { _electron as electron } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const DIR = path.join(homedir(), '.config', 'CariPrompt');
const SCRIPTS = path.join(DIR, 'scripts.json');
const SETTINGS = path.join(DIR, 'settings.json');
mkdirSync(DIR, { recursive: true });

// Sauvegarde du profil courant, restauré à la fin
const backup = {};
for (const f of [SCRIPTS, SETTINGS]) if (existsSync(f)) backup[f] = readFileSync(f);


function script(title, text, edited) {
  const at = '2026-01-01T10:00:00.000Z';
  return {
    id: 'x-' + title.replace(/\W+/g, '-').toLowerCase(),
    title, text, speed: 35, targetDuration: 0, targetEnabled: false,
    marks: [], wordCount: text.split(/\s+/).length,
    createdAt: at, updatedAt: edited ? '2026-02-02T10:00:00.000Z' : at,
  };
}

// Le texte exact des scripts de test, lu dans les traductions
const fr = readFileSync('src/shared/locales/fr.ts', 'utf8');
const grab = (key) => {
  const m = fr.match(new RegExp(key + ": ?[`']([\\s\\S]*?)[`'],\\n"));
  if (!m) throw new Error('clé introuvable : ' + key);
  return m[1];
};
const testText = grab('testScriptText');
const testTitle = grab('testScriptTitle');

writeFileSync(SCRIPTS, JSON.stringify([
  script('Welcome', 'Mon propre texte de bienvenue, retouché.', true),
  script(testTitle, testText, false),                       // intact → doit partir
  script(testTitle, testText + '\n\nMa réplique ajoutée.', true), // retouché → doit rester
  script('Tournage CA', 'Un texte à moi.', true),            // le mien → doit rester
], null, 2));
writeFileSync(SETTINGS, JSON.stringify({ seedVersion: 3, language: 'fr' }, null, 2));

const app = await electron.launch({ args: ['.', '--no-sandbox', '--disable-gpu'], cwd: process.cwd() });
const win = await app.firstWindow();
await win.waitForSelector('.sidebar-list');
await win.waitForTimeout(1500);
const titles = await win.evaluate(() =>
  [...document.querySelectorAll('.sidebar-list .script-title')].map((e) => e.textContent.trim()));
await app.close();

for (const [f, buf] of Object.entries(backup)) writeFileSync(f, buf);

console.log('textes après migration :', titles.join(' | '));
const checks = [
  ['le texte de bienvenue retouché est conservé', titles.filter((t) => t.startsWith('Welcome')).length === 1],
  ['aucun texte de bienvenue ajouté par-dessus', titles.filter((t) => t.startsWith('Welcome')).length === 1],
  ['le script de test intact a disparu', titles.filter((t) => t.startsWith(testTitle)).length === 1],
  ['le script de test retouché est conservé', titles.some((t) => t.startsWith(testTitle))],
  ['les textes de l’utilisateur sont intacts', titles.some((t) => t.startsWith('Tournage CA'))],
];
let bad = 0;
for (const [label, ok] of checks) { console.log(`${ok ? '✓' : '✗'} ${label}`); if (!ok) bad++; }
process.exit(bad ? 1 : 0);
