// Generates the static site (one real HTML file per URL). Run: node build.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const SITE = 'https://www.example.com'; // <-- CHANGE to your real domain (used in canonical tags + sitemap)
const TODAY = new Date().toISOString().slice(0, 10);

const ctx = { document: { getElementById: () => null }, LOGO: '/assets/logo.png' };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'src/data.js'), 'utf8'), ctx);
const { pages, SV, FX, AR, PH, TEL, BN } = ctx;

const slug = a => a.toLowerCase().replace(/ /g, '-');
const areaPath = a => `/service-areas/${slug(a)}/`;
const out = (p, html) => {
  const f = path.join(__dirname, p === '/' ? 'index.html' : p.replace(/^\//, '') + 'index.html');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
};
const a = (p, l, cur) => `<a href="${p}"${cur === p ? ' class="on" aria-current="page"' : ''}>${l}</a>`;

function nav(cur) {
  return `<ul class="wrap"><li>${a('/', 'Home', cur)}</li><li>${a('/about/', 'About', cur)}</li><li>${a('/reviews/', 'Reviews', cur)}</li><li>${a('/contact/', 'Contact', cur)}</li>` +
    `<li><button aria-haspopup="true">Services ▾</button><div class="dd">${a('/services/', 'All services', cur)}${SV.map(s => a(s[0], s[1], cur)).join('')}` +
    `${FX.map(f => `<a class="sub" href="/services/fixture-replacement/${f[0]}/">${f[1]}</a>`).join('')}</div></li>` +
    `<li><button aria-haspopup="true">Service Areas ▾</button><div class="dd">${a('/service-areas/', 'All areas', cur)}${AR.map(x => a(areaPath(x), x, cur)).join('')}</div></li></ul>`;
}

const header = cur => `<header><div class="wrap top"><a class="brand" href="/"><img src="/assets/logo.png" alt="${BN} logo" width="48" height="56"><span>${BN}<small>Expert Service for Your Home &amp; Pool</small></span></a>
<a class="call" href="${TEL}"><span>24/7 Emergency Plumber: </span>${PH}</a></div><nav aria-label="Main">${nav(cur)}</nav></header>`;

const footer = `<footer><div class="wrap"><div><h3>${BN}, LLC</h3>Navarre, FL<br><a href="${TEL}">${PH}</a>Licensed &amp; insured</div>
<div><h3>Quick links</h3><a href="/">Home</a><a href="/about/">About</a><a href="/reviews/">Reviews</a><a href="/contact/">Contact</a><a href="/services/">Services</a><a href="/service-areas/">Service areas</a></div>
<div><h3>Service areas</h3>${AR.map(x => `<a href="${areaPath(x)}">${x}</a>`).join('')}</div></div></footer>`;

function fixLinks(html) {
  return html.replace(/href="#([a-z0-9-]+)"/g, (m, s) => (s === 'home' ? 'href="/"' : pages[s] ? `href="${pages[s].p}"` : m));
}

function ld(pg) {
  const url = SITE + pg.p;
  return JSON.stringify([
    { '@context': 'https://schema.org', '@type': 'Plumber', name: BN, url: SITE + '/', telephone: '+1-850-362-9295', image: SITE + '/assets/logo.png',
      address: { '@type': 'PostalAddress', addressLocality: 'Navarre', addressRegion: 'FL', addressCountry: 'US' },
      areaServed: AR.map(n => ({ '@type': 'City', name: n })), openingHours: 'Mo-Su 00:00-23:59' },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement:
      [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }].concat(pg.c.map((c, i) => ({ '@type': 'ListItem', position: i + 2, name: c[1], item: SITE + c[0] }))) }
  ]);
}

function render(pg) {
  let body = fixLinks(pg.b());
  const crumbs = '<a href="/">Home</a>' + pg.c.map(c => ` / <a href="${c[0]}">${c[1]}</a>`).join('');
  body = body.replace('<div class="crumbs" id="bc"></div>', `<div class="crumbs" aria-label="Breadcrumb">${crumbs}</div>`)
    .replace('<form id="f">', '<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">') // <-- CHANGE (see README)
    .replace('Name<input required', 'Name<input name="name" required').replace('Phone<input type="tel" required', 'Phone<input name="phone" type="tel" required')
    .replace('Service needed<select>', 'Service needed<select name="service">').replace('City<select>', 'City<select name="city">')
    .replace('<textarea rows="4">', '<textarea name="message" rows="4">')
    .replace(/<p class="note">Demo form[^<]*<\/p>/, '').replace('<p id="ok" role="status"></p>', '');
  const url = SITE + pg.p, t = pg.t.replace(/&amp;/g, '&');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${t}</title>
<meta name="description" content="${pg.d}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:title" content="${t}"><meta property="og:description" content="${pg.d}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/assets/logo.png"><meta property="og:site_name" content="${BN}">
<link rel="icon" href="/assets/favicon.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css">
<script type="application/ld+json">${ld(pg)}</script>
</head><body>
${header(pg.p)}
<main>${body}</main>
${footer}
</body></html>
`;
}

const list = Object.values(pages);
list.forEach(pg => out(pg.p, render(pg)));

// 404 page
const nf = { p: '/404.html', t: `Page not found | ${BN}`, d: 'Page not found.', c: [], b: () => `<section><div class="wrap"><h1>Page not found</h1><p class="lede">That page doesn’t exist. Try the <a href="/">home page</a> or call <a href="${TEL}">${PH}</a>.</p></div></section>` };
fs.writeFileSync(path.join(__dirname, '404.html'), render(nf).replace('<meta name="description"', '<meta name="robots" content="noindex"><meta name="description"'));

// sitemap + robots
const pri = p => (p === '/' ? '1.0' : p.split('/').length <= 3 ? '0.8' : '0.6');
fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  list.map(pg => `  <url><loc>${SITE}${pg.p}</loc><lastmod>${TODAY}</lastmod><priority>${pri(pg.p)}</priority></url>`).join('\n') + `\n</urlset>\n`);
fs.writeFileSync(path.join(__dirname, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`Built ${list.length} pages + 404, sitemap.xml, robots.txt`);
