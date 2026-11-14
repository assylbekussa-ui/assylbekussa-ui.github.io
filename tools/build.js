/* Пререндер сайта: каждая страница сохраняется готовым HTML со своим title, description, canonical и og.
   Запуск: node tools/build.js (нужен playwright). Исходник: src/app.html. */
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), SRC = path.join(ROOT, 'src/app.html'), SITE = 'https://assylbekussa-ui.github.io';
const app = fs.readFileSync(SRC, 'utf8');
const TYPES = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u.startsWith('/images/')) { const f = path.join(ROOT, u); if (fs.existsSync(f)) { res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); return fs.createReadStream(f).pipe(res); } res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(app);
});
function out(route) { return route === '/' ? 'index.html' : route === '/__404' ? '404.html' : route.slice(1) + '/index.html'; }
(async () => {
  await new Promise(r => srv.listen(4310, r));
  const base = 'http://localhost:4310';
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const routes = ['/', '/work', '/writing', '/about', '/contact', '/resume'];
  for (const sec of ['/work', '/writing']) {
    await p.goto(base + sec + '/', { waitUntil: 'load' }); await p.waitForTimeout(300);
    const links = await p.$$eval('#view a[href^="' + sec + '/"]', a => a.map(x => x.getAttribute('href').replace(/\/$/, '')));
    links.forEach(l => { if (!routes.includes(l)) routes.push(l); });
  }
  routes.push('/__404');
  const today = new Date().toISOString().slice(0, 10), urls = [];
  for (const r of routes) {
    await p.goto(base + (r === '/' ? '/' : r + '/'), { waitUntil: 'load' }); await p.waitForTimeout(400);
    let html = await p.content();
    html = html.replace(/<html([^>]*?)class="js"/, '<html$1class="no-js"');
    html = html.replace(/<!--[\s\S]*?-->/g, m => m.length > 400 ? '' : m);
    const f = path.join(ROOT, out(r)); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, '<!doctype html>\n' + html.replace(/^<!DOCTYPE html>\s*/i, ''));
    const title = await p.title(); console.log(out(r).padEnd(40), title);
    if (r !== '/__404') urls.push(SITE + (r === '/' ? '/' : r + '/'));
  }
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map(u => '  <url><loc>' + u + '</loc><lastmod>' + today + '</lastmod></url>').join('\n') + '\n</urlset>\n');
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), 'User-agent: *\nAllow: /\n\nSitemap: ' + SITE + '/sitemap.xml\n');
  fs.writeFileSync(path.join(ROOT, '.nojekyll'), '');
  console.log(urls.length + ' страниц в sitemap.xml'); if (errs.length) { console.log('ОШИБКИ JS:\n' + errs.join('\n')); process.exitCode = 1; }
  await b.close(); srv.close();
})();
