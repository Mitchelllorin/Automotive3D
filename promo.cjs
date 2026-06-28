/**
 * promo.cjs — cinematic "director" that drives Automotive3D like a user and
 * captures a frame sequence, then encodes a sped-up timelapse MP4.
 *
 * Scenes: hero orbit (blown 383) → start + dyno → throttle pull → Build tab →
 * Engine Designer → teardown (explode) → Arena duel → winner pullback.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const puppeteer = require('puppeteer');
// Encoder: prefer ffmpeg-static (devDependency), fall back to FFMPEG_PATH or PATH.
let ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
try { ffmpeg = require('ffmpeg-static') || ffmpeg; } catch { /* use PATH ffmpeg */ }

const SP = path.join(__dirname, 'promo');       // output dir (gitignored)
const FRAMES = path.join(SP, 'frames');
fs.mkdirSync(SP, { recursive: true });
const URL = 'http://localhost:5173/';
const VW = 1280, VH = 720, DSF = 1.25; // 16:9, captured at 1600x900

// Hero motor: a blown small-block stroker so the new supercharger geometry is the star.
const HERO = {
  id: 'custom:promo-blown', name: 'Blown 383', baseEngineId: 'sbc383',
  compression: 8.8, induction: 'super', boostPsi: 14,
};

(async () => {
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.mkdirSync(FRAMES, { recursive: true });
  let frame = 0;

  // Real-GPU headless (Intel D3D11) — ~30x faster than swiftshader, affords the AO.
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--use-angle=d3d11', '--enable-gpu', '--enable-webgl',
      '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${VW},${VH}`],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF });

  // Bug sweep: driving the app like a user is also QA. Collect every console
  // error/warning, uncaught exception, and failed request during the run, tagged
  // with the scene that was on screen, then print a report at the end.
  const bugs = { console: [], exceptions: [], requests: [] };
  let scene = 'load';
  page.on('console', (m) => { const t = m.type(); if (t === 'error' || t === 'warning') bugs.console.push(`[${scene}] (${t}) ${m.text()}`); });
  page.on('pageerror', (e) => bugs.exceptions.push(`[${scene}] ${e.message}`));
  page.on('requestfailed', (r) => { const u = r.url(); if (!u.startsWith('data:')) bugs.requests.push(`[${scene}] ${r.failure()?.errorText || 'failed'} ${u}`); });
  await page.evaluateOnNewDocument((h) => {
    localStorage.setItem('a3d:customEngines', JSON.stringify([h]));
    localStorage.setItem('a3d:engineId', h.id);           // store reads this RAW
    localStorage.setItem('a3d:sidebarCollapsed', 'true');
    localStorage.setItem('a3d:tutorialSeen', '1');
  }, HERO);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await wait(7500);
  // Dismiss the tour if it opened anyway.
  await clickText('Skip');
  await wait(600);

  // ── primitives ───────────────────────────────────────────────────────────
  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  async function shot() {
    await page.screenshot({ path: path.join(FRAMES, `f_${String(++frame).padStart(4, '0')}.png`) });
  }
  function clickText(t) {
    return page.evaluate((t) => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().includes(t));
      if (b) { b.click(); return true; } return false;
    }, t);
  }
  function clickSel(s) {
    return page.evaluate((s) => { const e = document.querySelector(s); if (e) { e.click(); return true; } return false; }, s);
  }
  function setRange(s, v) {
    return page.evaluate(([s, v]) => {
      const el = document.querySelector(s); if (!el) return false;
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      set.call(el, String(v)); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }, [s, v]);
  }
  function setSelect(s, v) {
    return page.evaluate(([s, v]) => {
      const el = document.querySelector(s); if (!el) return false;
      const set = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      set.call(el, v); el.dispatchEvent(new Event('change', { bubbles: true })); return true;
    }, [s, v]);
  }

  // Continuous damped orbit: hold a drag and ping-pong, screenshotting each step.
  // The anchor sits in the empty lower-LEFT of the canvas (the engine sits centre-
  // right), so a stray click hits background, never a part — which avoids selecting
  // a component and triggering the X-ray focus-fade that washes the engine out.
  // ax/ay = drag anchor. Default = empty lower-left (so a stray click selects
  // nothing → solid engine). Pass an on-engine anchor for the X-RAY scene, where
  // a part is deliberately selected and dragging on it preserves that selection
  // (a drag never fires onPointerMissed, which would clear it back to solid).
  async function orbitCapture(n, dx = 7, dy = 0, wheel = 0, ax = 230, ay = 600) {
    await page.mouse.move(ax, ay); await page.mouse.down();
    let x = ax, y = ay, vx = dx;
    for (let i = 0; i < n; i++) {
      x += vx; y += dy;
      if (x > Math.min(ax + 240, 1160) || x < Math.max(ax - 240, 110)) { vx = -vx; x += vx * 2; }
      if (y > 650 || y < 320) { dy = -dy; y += dy * 2; }
      await page.mouse.move(x, y, { steps: 2 });
      if (wheel) await page.mouse.wheel({ deltaY: wheel });
      await shot();
    }
    await page.mouse.up();
  }
  // Hold on a still-ish camera while the scene animates.
  async function holdCapture(n) { for (let i = 0; i < n; i++) { await wait(120); await shot(); } }

  const log = (m) => { scene = m; console.log(`[promo] frame ${frame} — ${m}`); };

  try {
    // 1 — HERO: establish the blown motor with a slow orbit.
    log('hero orbit'); await orbitCapture(26, 8, 0);
    await orbitCapture(10, 4, 0, -90); // ease in

    // 2 — START + DYNO: open the dyno panel, fire it up.
    log('start + dyno'); await clickSel('.engine-expand-chip'); await wait(500);
    await clickSel('.engine-power'); await wait(600); // START
    await holdCapture(8);
    await orbitCapture(18, -6, 0);

    // 3 — THROTTLE pull: rev it; combustion flashes fire in order.
    log('throttle'); await setRange('.engine-slider-row input[type=range]', 5200); await wait(400);
    await orbitCapture(14, 6, 0, -70); // orbit + zoom in (solid, running)
    await holdCapture(5);

    // 4 — X-RAY: select a part so the engine turns translucent, orbit to reveal the
    // internals running inside, then a cutaway slice — the see-through showpiece.
    log('x-ray'); await setRange('.engine-slider-row input[type=range]', 1300); await wait(300); // calm idle
    await page.mouse.click(900, 415); await wait(500);   // select a part → focus x-ray fade
    await orbitCapture(16, 6, 0, 0, 900, 415);           // translucent orbit (anchored ON the engine)
    await clickText('Cutaway'); await wait(700);         // cross-section slice
    await orbitCapture(12, -6, 0, 0, 900, 415);          // internals running in the cut
    await clickText('Cutaway'); await wait(400);         // restore
    await page.mouse.click(170, 600); await wait(300);   // empty click → onPointerMissed → solid again
    await clickSel('.engine-power'); await wait(400);    // STOP — clean for build/teardown

    // 5 — BUILD tab: reveal the roster + custom tiles + live dyno.
    log('build tab'); await clickSel('.engine-collapse-btn'); await wait(300); // hide dyno panel
    await clickSel('.sidebar-expand-btn'); await wait(700);
    await holdCapture(10);

    // 5 — DESIGNER: open "Design your own", show sliders + induction.
    log('designer'); await clickSel('.design-add'); await wait(800);
    await holdCapture(6);
    await clickSel('.design-ind'); await wait(300); // touch an induction chip
    await holdCapture(6);
    await clickSel('.design-close'); await wait(400);
    await clickSel('[aria-label="Collapse panel"]'); await wait(500); // close sidebar

    // 6 — TEARDOWN: the showpiece exploded view, driven open while orbiting.
    log('teardown');
    for (let i = 0; i <= 14; i++) { await setRange('.explode-slider', (i / 14).toFixed(2)); await page.mouse.move(720 + i * 12, 470); await wait(60); await shot(); }
    await orbitCapture(20, 9, 0); // orbit the exploded engine
    for (let i = 14; i >= 0; i--) { await setRange('.explode-slider', (i / 14).toFixed(2)); await wait(50); await shot(); } // reassemble

    // 7 — ARENA: stage a duel vs a stock motor, launch the battle.
    log('arena'); await clickSel('[data-tour="arena-enter"]'); await wait(1200);
    await holdCapture(6);
    await setSelect('.arena3d-vs select', 'sbc350'); await wait(400);
    await clickSel('.arena3d-go'); await wait(600); // BATTLE
    await orbitCapture(26, 5, 0); // capture the duel + heat ring
    await holdCapture(10); // winner resolves

    // 8 — OUTRO: pull back off the winner.
    log('outro'); await orbitCapture(18, -7, 0, 70);
  } catch (e) {
    console.error('[promo] scene error:', e.message);
  }

  console.log(`[promo] captured ${frame} frames`);
  await browser.close();

  // ── bug report (the QA half of the workflow) ──────────────────────────────
  const uniq = (a) => [...new Set(a)];
  const ce = uniq(bugs.console), pe = uniq(bugs.exceptions), rf = uniq(bugs.requests);
  console.log('\n===== BUG SWEEP =====');
  console.log(`exceptions: ${pe.length} | console errors/warnings: ${ce.length} | failed requests: ${rf.length}`);
  if (pe.length) { console.log('-- UNCAUGHT EXCEPTIONS --'); pe.forEach((x) => console.log('  ' + x)); }
  if (ce.length) { console.log('-- CONSOLE --'); ce.slice(0, 40).forEach((x) => console.log('  ' + x)); }
  if (rf.length) { console.log('-- FAILED REQUESTS --'); rf.slice(0, 20).forEach((x) => console.log('  ' + x)); }
  if (!pe.length && !ce.length && !rf.length) console.log('clean — no errors observed.');
  console.log('=====================\n');

  // ── encode ───────────────────────────────────────────────────────────────
  const out = path.join(SP, 'automotive3d_promo.mp4');
  const args = ['-y', '-framerate', '20', '-i', path.join(FRAMES, 'f_%04d.png'),
    '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-pix_fmt', 'yuv420p',
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', out];
  const r = spawnSync(ffmpeg, args, { encoding: 'utf8' });
  if (r.status !== 0) { console.error('FFMPEG FAILED:', (r.stderr || '').slice(-800)); process.exit(1); }
  console.log('WROTE', out);
})().catch((e) => { console.error('PROMO ERROR', e.stack || e.message); process.exit(1); });
