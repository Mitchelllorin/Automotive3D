/**
 * screenshots.cjs — captures clean Play-Store-ready store shots (1920×1080, 16:9)
 * of the key features, on the real GPU. Output: promo/store/NN_name.png.
 * Needs the dev server on :5173. Run: node screenshots.cjs
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const OUT = path.join(__dirname, 'promo', 'store');
fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://localhost:5173/';
const VW = 1920, VH = 1080;
const HERO = { id: 'custom:promo-blown', name: 'Blown 383', baseEngineId: 'sbc383', compression: 8.8, induction: 'super', boostPsi: 14 };

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--use-angle=d3d11', '--enable-gpu', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${VW},${VH}`],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument((h) => {
    localStorage.setItem('a3d:customEngines', JSON.stringify([h]));
    localStorage.setItem('a3d:engineId', h.id);
    localStorage.setItem('a3d:sidebarCollapsed', 'true');
    localStorage.setItem('a3d:tutorialSeen', '1');
  }, HERO);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await wait(7500);
  await clickText('Skip'); await wait(600);

  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  const shot = (name) => page.screenshot({ path: path.join(OUT, name) });
  function clickText(t) { return page.evaluate((t) => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().includes(t)); if (b) { b.click(); return true; } return false; }, t); }
  function clickSel(s) { return page.evaluate((s) => { const e = document.querySelector(s); if (e) { e.click(); return true; } return false; }, s); }
  function setRange(s, v) { return page.evaluate(([s, v]) => { const el = document.querySelector(s); if (!el) return false; const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(el, String(v)); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true; }, [s, v]); }
  function setSelect(s, v) { return page.evaluate(([s, v]) => { const el = document.querySelector(s); if (!el) return false; const set = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set; set.call(el, v); el.dispatchEvent(new Event('change', { bubbles: true })); return true; }, [s, v]); }

  // 1 — hero: the blown motor, centered + unobstructed (collapse the control panel
  // so the viewport re-centers the engine instead of shoving it right).
  await clickSel('.engine-collapse-btn'); await wait(700);
  await shot('01_hero.png');

  // 2 — start + dyno: engine running, dyno + tach panel showing (panel open = engine
  // shifts right, which is fine here — the dyno is the subject).
  await clickSel('.engine-expand-chip'); await wait(400);
  await clickSel('.engine-power'); await wait(700);
  await setRange('.engine-slider-row input[type=range]', 3200); await wait(900);
  await shot('02_dyno.png');

  // 3 — x-ray see-through: calm idle, collapse panel so the engine centers, select a
  // part → translucent focus fade.
  await setRange('.engine-slider-row input[type=range]', 1300); await wait(400);
  await clickSel('.engine-collapse-btn'); await wait(700); // centered
  await page.mouse.click(960, 540); await wait(700);        // select a part (engine now centered)
  await shot('03_xray.png');
  await page.mouse.click(240, 860); await wait(300);        // deselect (empty canvas)
  await clickSel('.engine-expand-chip'); await wait(300);   // reopen to stop the engine
  await clickSel('.engine-power'); await wait(300);
  await clickSel('.engine-collapse-btn'); await wait(500);

  // 4 — teardown: fully exploded, engine off, no selection, centered.
  await setRange('.explode-slider', '1'); await wait(900);
  await shot('04_teardown.png');
  await setRange('.explode-slider', '0'); await wait(500);

  // 5 — Build tab: roster + custom + live dyno.
  await clickSel('.sidebar-expand-btn'); await wait(800);
  await shot('05_build.png');
  await clickSel('[aria-label="Collapse panel"]'); await wait(400);

  // 6 — Arena duel: two engines, heat ring.
  await clickSel('[data-tour="arena-enter"]'); await wait(1200);
  await setSelect('.arena3d-vs select', 'sbc350'); await wait(300);
  await clickSel('.arena3d-go'); await wait(2600);
  await shot('06_arena.png');
  await clickText('Exit Arena'); await wait(800);

  console.log('store screenshots written to', OUT);
  fs.readdirSync(OUT).forEach((f) => console.log('  ' + f));
  await browser.close();
})().catch((e) => { console.error('SHOT ERROR', e.stack || e.message); process.exit(1); });
