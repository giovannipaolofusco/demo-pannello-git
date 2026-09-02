import { cp, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const DIST = 'dist';
await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

// pagine HTML (minificate dopo, dentro dist/)
const pagine = ['index.html', 'menu.html', 'chi-siamo.html', 'contatti.html', 'privacy.html', '404.html'];
const paginePagineEn = ['en/index.html', 'en/menu.html', 'en/about-us.html', 'en/contacts.html', 'en/privacy.html'];

// tutto ciò che NON si minifica ma va pubblicato
const servizio = ['_headers', '_redirects', 'robots.txt', 'sitemap.xml',
                  'site.webmanifest', 'llms.txt', 'favicon.ico'];

const cartelle = ['assets', '.well-known'];

for (const f of [...pagine, ...paginePagineEn, ...servizio]) {
  if (!existsSync(f)) { console.warn(`  manca, salto: ${f}`); continue; }
  await cp(f, `${DIST}/${f}`, { recursive: true });
}
for (const d of cartelle) {
  if (!existsSync(d)) { console.warn(`  manca, salto: ${d}`); continue; }
  await cp(d, `${DIST}/${d}`, { recursive: true });
}
console.log('copia: fatto');
