// La bulle de style n'apparaît que sur une sélection, et au-dessus d'elle.
import { _electron as electron } from 'playwright';
const app = await electron.launch({ args: ['.', '--no-sandbox', '--disable-gpu'], cwd: process.cwd() });
const win = await app.firstWindow();
await win.waitForSelector('.editor-text');
await win.waitForTimeout(800);
const before = await win.locator('.selection-popover').count();
// Sélection de quelques mots dans le texte
await win.evaluate(() => {
  const el = document.querySelector('.editor-text');
  el.focus();
  const node = el.querySelector('*')?.firstChild ?? el.firstChild;
  const r = document.createRange();
  r.setStart(node, 0); r.setEnd(node, Math.min(12, node.length ?? 12));
  const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  document.dispatchEvent(new Event('selectionchange'));
});
await win.waitForTimeout(500);
const pop = win.locator('.selection-popover');
const after = await pop.count();
let place = '';
if (after) {
  const box = await pop.boundingBox();
  const sel = await win.evaluate(() => {
    const r = getSelection().getRangeAt(0).getBoundingClientRect();
    return { top: r.top, left: r.left + r.width / 2 };
  });
  place = `bulle ${Math.round(box.x)}..${Math.round(box.x + box.width)} y=${Math.round(box.y + box.height)}`
    + ` / sélection centre ${Math.round(sel.left)} haut ${Math.round(sel.top)}`;
  const centred = Math.abs(box.x + box.width / 2 - sel.left) < 40;
  const above = box.y + box.height <= sel.top + 2;
  console.log(`sans sélection : ${before} bulle(s)\navec sélection : ${after} bulle(s)\n${place}`);
  console.log(centred && above ? '✓ bulle centrée au-dessus de la sélection' : '✗ bulle mal placée');
  process.exit(before === 0 && after === 1 && centred && above ? 0 : 1);
}
console.log(`sans sélection : ${before}, avec sélection : ${after} — ✗ bulle absente`);
process.exit(1);
