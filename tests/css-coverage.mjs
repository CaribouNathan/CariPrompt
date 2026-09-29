// Règles CSS jamais atteintes : on parcourt l'interface et on interroge le DOM.
// Une règle peut servir dans un état non visité — la liste est un point de départ,
// pas une condamnation. npm i -D playwright ; xvfb-run -a node tests/css-coverage.mjs
import { _electron as electron } from 'playwright';

const app = await electron.launch({ args: ['.', '--no-sandbox', '--disable-gpu'], cwd: process.cwd() });
const win = await app.firstWindow();
await win.waitForSelector('.workspace');
await win.waitForTimeout(1200);

// On promène l'application dans ses états : onglets, dispositions, feuilles, sélection
const visit = async (fn) => { try { await fn(); } catch { /* état absent */ } await win.waitForTimeout(250); };
for (const n of [1, 2, 3]) await visit(() => win.click(`.tab-bar button:nth-child(${n})`));
await visit(() => win.click('.split-switch button:nth-child(2)'));
await visit(() => win.click('.split-switch button:nth-child(1)'));
await visit(() => win.click('.sidebar-footer button:last-child'));   // feuille des raccourcis
await visit(() => win.keyboard.press('Escape'));
await visit(() => win.click('.sidebar-head button'));                // colonne masquée
await visit(() => win.click('.sidebar-reveal'));
await visit(async () => {
  await win.evaluate(() => {
    const el = document.querySelector('.editor-text');
    el.focus();
    const node = el.querySelector('*')?.firstChild ?? el.firstChild;
    const r = document.createRange();
    r.setStart(node, 0); r.setEnd(node, 10);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    document.dispatchEvent(new Event('selectionchange'));
  });
});
for (const s of ['.mode-btn.track', '.round-btn', '.play-btn']) await visit(() => win.hover(s));

const report = await win.evaluate(() => {
  const out = [];
  let total = 0, sheets = 0, skipped = 0;
  for (const sheet of document.styleSheets) {
    try { void sheet.cssRules; sheets++; } catch { skipped++; continue; }
    const walk = (list, prefix = '') => {
      for (const rule of list) {
        // Le sélecteur d'abord : depuis le CSS imbriqué, une règle de style
        // porte elle aussi un cssRules (vide), qui ferait tout descendre ici.
        if (!rule.selectorText) {
          if (rule.cssRules) walk(rule.cssRules, prefix + (rule.conditionText ? `@${rule.conditionText} ` : ''));
          continue;
        }
        total++;
        // On teste chaque sélecteur débarrassé de ses états et pseudo-éléments
        const parts = rule.selectorText.split(',').map((s) => s.trim());
        const hit = parts.some((sel) => {
          const probe = sel.replace(/::?(hover|active|focus|focus-within|focus-visible|before|after|placeholder|disabled|checked|selection|first-child|last-child|nth-child\([^)]*\)|not\([^)]*\))/g, '');
          if (!probe.trim() || probe.includes('@')) return true;
          try { return !!document.querySelector(probe); } catch { return true; }
        });
        if (!hit) out.push(prefix + rule.selectorText);
      }
    };
    walk(sheet.cssRules);
  }
  return { out, total, sheets, skipped, platform: document.documentElement.className + ' ' + document.body.className };
});
console.log(`${report.sheets} feuilles lues, ${report.skipped} inaccessibles, ${report.total} règles`);
console.log(`classe de plateforme : ${report.platform.trim() || '(aucune)'}`);
console.log(`${report.out.length} sélecteurs jamais rencontrés :`);
for (const u of report.out) console.log('  ' + u);
await app.close();
