/**
 * One-off: fetch a real product photo for each Garage variant and bundle it
 * into public/products/<component>__<variant>.jpg. Reads the catalog directly
 * (src/data/products.js) so it stays in sync, and derives the search query from
 * each variant's Summit Racing buy link. Uses a headless browser to read the top
 * search result's image off the CDN (the HTML is bot-protected; the image CDN
 * is not). Re-runnable: skips ids that already have a good file. Not shipped.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const OUT = path.join(__dirname, 'public', 'products');
fs.mkdirSync(OUT, { recursive: true });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const bigger = (u) => u.replace(/\._[A-Z0-9,_]+_\.jpg/i, '._AC_SL500_.jpg');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const queryFromBuyUrl = (url) => {
  try { return decodeURIComponent(new URL(url).searchParams.get('keyword') || ''); }
  catch { return ''; }
};

async function fetchOne(browser, key, query) {
  const file = path.join(OUT, `${key}.jpg`);
  if (fs.existsSync(file) && fs.statSync(file).size > 4000) return { key, status: 'skip' };
  const p = await browser.newPage();
  await p.setUserAgent(UA);
  await p.setViewport({ width: 1280, height: 1000 });
  try {
    await p.goto('https://www.amazon.com/s?k=' + encodeURIComponent(query), {
      waitUntil: 'domcontentloaded', timeout: 45000,
    });
    await sleep(2500);
    const src = await p.evaluate(() => {
      const im = [...document.querySelectorAll('img.s-image')]
        .map((i) => i.src).find((s) => /\/images\/I\//.test(s));
      return im || null;
    });
    if (!src) { await p.close(); return { key, status: 'no-image' }; }
    const resp = await p.goto(bigger(src), { timeout: 30000 });
    const buf = await resp.buffer();
    await p.close();
    if (!buf || buf.length < 4000) return { key, status: 'tiny' };
    fs.writeFileSync(file, buf);
    return { key, status: 'ok', bytes: buf.length };
  } catch (e) {
    try { await p.close(); } catch {}
    return { key, status: 'err', msg: e.message };
  }
}

// Per-key query overrides where the catalog query surfaces a wrong/duplicate
// top result. Finish-focused so sibling variants come back visually distinct.
const OVERRIDE = {
  'exhaust_manifold__hooker-ceramic': 'ceramic coated long tube headers small block chevy silver',
  'exhaust_manifold__patriot-chrome': 'chrome block hugger headers small block chevy',
  'exhaust_manifold__hedman-black': 'black coated shorty headers small block chevy',
};

(async () => {
  const { PRODUCTS } = await import('./src/data/products.js');
  const jobs = [];
  for (const [compId, entry] of Object.entries(PRODUCTS)) {
    for (const v of entry.variants) {
      const key = `${compId}__${v.id}`;
      jobs.push({ key, query: OVERRIDE[key] || queryFromBuyUrl(v.buyUrl) || `${v.brand} ${v.name}` });
    }
  }
  console.log(`fetching ${jobs.length} product images…\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 180000,
    args: ['--no-sandbox', '--window-size=1280,1000'],
  });
  const results = [];
  const POOL = 2;
  let idx = 0;
  async function worker() {
    while (idx < jobs.length) {
      const j = jobs[idx++];
      const r = await fetchOne(browser, j.key, j.query);
      results.push(r);
      console.log(`${r.status.padEnd(8)} ${r.key}${r.bytes ? ' ' + r.bytes + 'b' : ''}${r.msg ? ' ' + r.msg : ''}`);
    }
  }
  await Promise.all(Array.from({ length: POOL }, worker));
  await browser.close();
  const ok = results.filter((r) => r.status === 'ok' || r.status === 'skip').length;
  console.log(`\nDONE: ${ok}/${jobs.length} have images`);
  const fails = results.filter((r) => r.status !== 'ok' && r.status !== 'skip');
  if (fails.length) console.log('MISSING:', fails.map((f) => f.key).join(', '));
})();
