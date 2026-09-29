// Capture l'interface à plusieurs tailles de fenêtre et signale tout débordement.
// Demande playwright : npm i -D playwright, puis  COLUMNS_MODE=1 xvfb-run -a node tests/layout-shots.mjs /tmp/shots
import { _electron as electron } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = process.argv[2] ?? '/tmp/claude-0/shots';
const SIZES = [[1600, 1000], [1200, 800], [1000, 700], [980, 640]];
mkdirSync(OUT, { recursive: true });

const app = await electron.launch({
  args: ['.', '--no-sandbox', '--disable-gpu'],
  cwd: process.cwd(),
  env: { ...process.env, CARIPROMPT_TEST: '1' },
});
const win = await app.firstWindow();
await win.waitForSelector('.workspace', { timeout: 30000 });
await win.waitForTimeout(1500);

// COLUMNS_MODE=1 : disposition côte à côte, celle qui met la largeur à l'épreuve
if (process.env.COLUMNS_MODE === '1') {
  const cols = win.locator('.split-switch button').nth(1);
  if ((await cols.getAttribute('aria-pressed')) !== 'true') await cols.click();
  await win.waitForTimeout(500);
}

for (const [w, h] of SIZES) {
  await app.evaluate(({ BrowserWindow }, [w, h]) => {
    const win = BrowserWindow.getAllWindows()[0];
    win.setMinimumSize(200, 200);
    win.setSize(w, h);
  }, [w, h]);
  await win.waitForTimeout(700);

  // Débordements : un élément qui sort de la fenêtre, ou qui chevauche le panneau
  const report = await win.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out = [];
    const insp = document.querySelector('.inspector');
    const ir = insp ? insp.getBoundingClientRect() : null;
    for (const el of document.querySelectorAll('.workspace *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const sel = el.className && typeof el.className === 'string'
        ? '.' + el.className.trim().split(/\s+/).join('.') : el.tagName;
      if (r.right > vw + 1 || r.left < -1) out.push(`hors fenêtre : ${sel} [${Math.round(r.left)}..${Math.round(r.right)}]`);
      else if (ir && !insp.contains(el) && r.left < ir.right - 1 && r.right > ir.left + 1)
        out.push(`chevauche le panneau : ${sel} [${Math.round(r.left)}..${Math.round(r.right)}]`);
    }
    return {
      scrollW: document.documentElement.scrollWidth, vw,
      split: document.querySelector('.center')?.className,
      issues: [...new Set(out)].slice(0, 8),
    };
  });
  console.log(`\n=== ${w}×${h} ===`);
  console.log(`  scrollWidth ${report.scrollW} / ${report.vw} — ${report.split}`);
  for (const i of report.issues) console.log('  ' + i);
  if (!report.issues.length && report.scrollW <= report.vw) console.log('  rien à signaler');
  await win.screenshot({ path: `${OUT}/${w}x${h}.png` });
}

await app.close();
