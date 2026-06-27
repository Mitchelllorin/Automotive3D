// Headless screenshot of the running dev app, so the engine render can be
// self-reviewed. Usage: node shot.cjs [url] [outfile] [explode] [cutaway]
const puppeteer = require('puppeteer');

(async () => {
  const url = process.argv[2] || 'http://localhost:5173/';
  const out = process.argv[3] || 'shot.png';
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--no-sandbox',
      '--window-size=1400,900',
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  // Let the scene, environment, and a few animation frames settle.
  await new Promise((r) => setTimeout(r, 6000));
  // Optionally start the engine and/or enable cutaway by clicking the buttons.
  if (process.env.RUN || process.env.CUT) {
    await page.evaluate((opts) => {
      const byText = (t) => [...document.querySelectorAll('button')].find((b) => b.textContent.includes(t));
      if (opts.run) byText('START')?.click();
      if (opts.cut) byText('Cutaway')?.click();
    }, { run: !!process.env.RUN, cut: !!process.env.CUT });
    await new Promise((r) => setTimeout(r, 2500));
  }
  // Optional explode (0..1) — drive the range slider the React way.
  if (process.env.EXPLODE) {
    await page.evaluate((v) => {
      const el = document.querySelector('.explode-slider');
      if (!el) return;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, String(v));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, Number(process.env.EXPLODE));
    await new Promise((r) => setTimeout(r, 1500));
  }
  // Extra settle, so successive shots catch the engine at different crank angles.
  if (process.env.WAIT) await new Promise((r) => setTimeout(r, Number(process.env.WAIT)));
  // Clip to a zoomed region around the engine for detail.
  const clip = process.env.CLIP ? JSON.parse(process.env.CLIP) : { x: 120, y: 150, width: 740, height: 560 };
  await page.screenshot({ path: out, clip });
  await browser.close();
  console.log('wrote', out);
})().catch((e) => {
  console.error('SHOT ERROR', e.message);
  process.exit(1);
});
