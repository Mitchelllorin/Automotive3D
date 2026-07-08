/**
 * promo.cjs — cinematic "director" that drives Automotive3D like a user and
 * captures a frame sequence, then encodes editor-ready deliverables.
 *
 * Outputs (all in promo/):
 *   frames/            — raw PNG sequence (lossless source)
 *   clips/             — per-scene ProRes 4444 clips (Premiere / DaVinci / FCP)
 *   automotive3d_master.mov  — full ProRes 4444 master (drag into any NLE)
 *   automotive3d_preview.mp4 — H.264 web preview (quick review / YouTube)
 *   manifest.json      — scene names, frame ranges, clip file paths
 *
 * Scenes: hero orbit (blown 383) → start + dyno → throttle pull → X-ray →
 *         Build tab → Engine Designer → teardown (explode) → Arena duel → outro.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const puppeteer = require('puppeteer');

let ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
try { ffmpeg = require('ffmpeg-static') || ffmpeg; } catch { /* use PATH ffmpeg */ }

const SP     = path.join(__dirname, 'promo');
const FRAMES = path.join(SP, 'frames');
const CLIPS  = path.join(SP, 'clips');
fs.mkdirSync(SP,     { recursive: true });
fs.mkdirSync(CLIPS,  { recursive: true });

const URL = 'http://localhost:5173/';
const VW = 1280, VH = 720, DSF = 1.25; // captured at 1600×900
const FPS = 24; // target playback fps for all outputs

const HERO = {
  id: 'custom:promo-blown', name: 'Blown 383', baseEngineId: 'sbc383',
  compression: 8.8, induction: 'super', boostPsi: 14,
};

(async () => {
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.mkdirSync(FRAMES, { recursive: true });
  let frame = 0;

  // Scene boundary tracking — each log() call closes the previous scene and opens a new one.
  const scenes = [];
  let currentScene = null;
  function beginScene(name) {
    if (currentScene) currentScene.end = frame;
    currentScene = { name, start: frame + 1, end: null };
    scenes.push(currentScene);
    console.log(`[promo] frame ${frame} — ${name}`);
  }
  function closeScenes() { if (currentScene) currentScene.end = frame; }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--use-angle=d3d11', '--enable-gpu', '--enable-webgl',
           '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${VW},${VH}`],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF });

  const bugs = { console: [], exceptions: [], requests: [] };
  page.on('console',      (m) => { const t = m.type(); if (t === 'error' || t === 'warning') bugs.console.push(`[${currentScene?.name}] (${t}) ${m.text()}`); });
  page.on('pageerror',    (e) => bugs.exceptions.push(`[${currentScene?.name}] ${e.message}`));
  page.on('requestfailed',(r) => { const u = r.url(); if (!u.startsWith('data:')) bugs.requests.push(`[${currentScene?.name}] ${r.failure()?.errorText || 'failed'} ${u}`); });

  await page.evaluateOnNewDocument((h) => {
    localStorage.setItem('a3d:customEngines',    JSON.stringify([h]));
    localStorage.setItem('a3d:engineId',          h.id);
    localStorage.setItem('a3d:sidebarCollapsed', 'true');
    localStorage.setItem('a3d:tutorialSeen',     '1');
  }, HERO);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await wait(7500);
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
  async function holdCapture(n) { for (let i = 0; i < n; i++) { await wait(120); await shot(); } }

  // ── scenes ───────────────────────────────────────────────────────────────
  try {
    beginScene('01_hero_orbit');
    await orbitCapture(26, 8, 0);
    await orbitCapture(10, 4, 0, -90);

    beginScene('02_start_dyno');
    await clickSel('.engine-expand-chip'); await wait(500);
    await clickSel('.engine-power'); await wait(600);
    await holdCapture(8);
    await orbitCapture(18, -6, 0);

    beginScene('03_throttle');
    await setRange('.engine-slider-row input[type=range]', 5200); await wait(400);
    await orbitCapture(14, 6, 0, -70);
    await holdCapture(5);

    beginScene('04_xray');
    await setRange('.engine-slider-row input[type=range]', 1300); await wait(300);
    await page.mouse.click(900, 415); await wait(500);
    await orbitCapture(16, 6, 0, 0, 900, 415);
    await clickText('Cutaway'); await wait(700);
    await orbitCapture(12, -6, 0, 0, 900, 415);
    await clickText('Cutaway'); await wait(400);
    await page.mouse.click(170, 600); await wait(300);
    await clickSel('.engine-power'); await wait(400);

    beginScene('05_build_tab');
    await clickSel('.engine-collapse-btn'); await wait(300);
    await clickSel('.sidebar-expand-btn'); await wait(700);
    await holdCapture(10);

    beginScene('06_designer');
    await clickSel('.design-add'); await wait(800);
    await holdCapture(6);
    await clickSel('.design-ind'); await wait(300);
    await holdCapture(6);
    await clickSel('.design-close'); await wait(400);
    await clickSel('[aria-label="Collapse panel"]'); await wait(500);

    beginScene('07_teardown');
    for (let i = 0; i <= 14; i++) { await setRange('.explode-slider', (i / 14).toFixed(2)); await page.mouse.move(720 + i * 12, 470); await wait(60); await shot(); }
    await orbitCapture(20, 9, 0);
    for (let i = 14; i >= 0; i--) { await setRange('.explode-slider', (i / 14).toFixed(2)); await wait(50); await shot(); }

    beginScene('08_arena');
    await clickSel('[data-tour="arena-enter"]'); await wait(1200);
    await holdCapture(6);
    await setSelect('.arena3d-vs select', 'sbc350'); await wait(400);
    await clickSel('.arena3d-go'); await wait(600);
    await orbitCapture(26, 5, 0);
    await holdCapture(10);

    beginScene('09_outro');
    await orbitCapture(18, -7, 0, 70);

  } catch (e) {
    console.error('[promo] scene error:', e.message);
  }

  closeScenes();
  console.log(`[promo] captured ${frame} frames across ${scenes.length} scenes`);
  await browser.close();

  // ── bug report ────────────────────────────────────────────────────────────
  const uniq = (a) => [...new Set(a)];
  const ce = uniq(bugs.console), pe = uniq(bugs.exceptions), rf = uniq(bugs.requests);
  console.log('\n===== BUG SWEEP =====');
  console.log(`exceptions: ${pe.length} | console errors/warnings: ${ce.length} | failed requests: ${rf.length}`);
  if (pe.length) { console.log('-- UNCAUGHT EXCEPTIONS --'); pe.forEach((x) => console.log('  ' + x)); }
  if (ce.length) { console.log('-- CONSOLE --'); ce.slice(0, 40).forEach((x) => console.log('  ' + x)); }
  if (rf.length) { console.log('-- FAILED REQUESTS --'); rf.slice(0, 20).forEach((x) => console.log('  ' + x)); }
  if (!pe.length && !ce.length && !rf.length) console.log('clean — no errors observed.');
  console.log('=====================\n');

  // ── encode helpers ────────────────────────────────────────────────────────
  function enc(args, label) {
    console.log(`[encode] ${label}`);
    const r = spawnSync(ffmpeg, args, { encoding: 'utf8' });
    if (r.status !== 0) { console.error(`FFMPEG FAILED (${label}):`, (r.stderr || '').slice(-600)); }
    else { console.log(`[encode] done → ${args[args.length - 1]}`); }
    return r.status === 0;
  }

  // Slice a range of frames from the FRAMES dir into a temp dir, encode, clean up.
  function encScene(scene) {
    const { name, start, end } = scene;
    const count = end - start + 1;
    if (count < 2) return null;

    // Build a concat list so we don't need to rename frames.
    const concatFile = path.join(SP, `_concat_${name}.txt`);
    const lines = [];
    for (let f = start; f <= end; f++) {
      lines.push(`file '${path.join(FRAMES, `f_${String(f).padStart(4, '0')}.png`).replace(/\\/g, '/')}'`);
      lines.push(`duration ${(1 / FPS).toFixed(6)}`);
    }
    fs.writeFileSync(concatFile, lines.join('\n'));

    const out = path.join(CLIPS, `${name}.mov`);
    const ok = enc([
      '-y', '-f', 'concat', '-safe', '0', '-i', concatFile,
      '-c:v', 'prores_ks', '-profile:v', '4444', '-qscale:v', '1',
      '-pix_fmt', 'yuva444p10le',
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
      out,
    ], `${name} ProRes`);
    fs.rmSync(concatFile);
    return ok ? out : null;
  }

  // ── per-scene ProRes clips ────────────────────────────────────────────────
  console.log('\n[encode] cutting per-scene ProRes clips...');
  const clipPaths = {};
  for (const s of scenes) {
    const p = encScene(s);
    if (p) clipPaths[s.name] = p;
  }

  // ── full ProRes master ────────────────────────────────────────────────────
  const master = path.join(SP, 'automotive3d_master.mov');
  enc([
    '-y', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f_%04d.png'),
    '-c:v', 'prores_ks', '-profile:v', '4444', '-qscale:v', '1',
    '-pix_fmt', 'yuva444p10le',
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    master,
  ], 'full ProRes master');

  // ── H.264 web preview ─────────────────────────────────────────────────────
  const preview = path.join(SP, 'automotive3d_preview.mp4');
  enc([
    '-y', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f_%04d.png'),
    '-c:v', 'libx264', '-crf', '16', '-preset', 'slow',
    '-pix_fmt', 'yuv420p',
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    preview,
  ], 'H.264 preview');

  // ── manifest ──────────────────────────────────────────────────────────────
  const manifest = {
    fps: FPS,
    totalFrames: frame,
    captureResolution: `${VW * DSF}x${VH * DSF}`,
    files: {
      master: path.relative(__dirname, master),
      preview: path.relative(__dirname, preview),
    },
    scenes: scenes.map((s) => ({
      name: s.name,
      startFrame: s.start,
      endFrame: s.end,
      frameCount: s.end - s.start + 1,
      durationSec: +((s.end - s.start + 1) / FPS).toFixed(2),
      clip: clipPaths[s.name] ? path.relative(__dirname, clipPaths[s.name]) : null,
    })),
  };
  const manifestPath = path.join(SP, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('\n[promo] manifest →', manifestPath);

  // ── summary ───────────────────────────────────────────────────────────────
  console.log('\n===== DELIVERABLES =====');
  console.log(`  Master (ProRes 4444) : ${master}`);
  console.log(`  Preview (H.264)      : ${preview}`);
  console.log(`  Scene clips          : ${CLIPS}`);
  console.log(`  Raw frames           : ${FRAMES}`);
  console.log(`  Manifest             : ${manifestPath}`);
  console.log('========================\n');

})().catch((e) => { console.error('PROMO ERROR', e.stack || e.message); process.exit(1); });
