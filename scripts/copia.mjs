import { cp, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const DIST = 'dist';
await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

// pagine HTML (minificate dopo, dentro dist/)
// Una cartella per pagina (§6.8bis). 404.html e link.html restano file: la
// prima e' il nome che l'hosting cerca, la seconda non e' indicizzabile.
const pagine = ['index.html', 'menu/index.html', 'chi-siamo/index.html', 'contatti/index.html', 'privacy/index.html', '404.html', 'link.html', 'dolci/index.html', 'note-legali/index.html'];
const paginePagineEn = ['en/index.html', 'en/menu/index.html', 'en/about-us/index.html', 'en/contacts/index.html', 'en/privacy/index.html'];

// tutto ciò che NON si minifica ma va pubblicato
const servizio = ['_headers', '_redirects', 'robots.txt',
                  'site.webmanifest', 'favicon.ico',
                  'trattoria-del-molo.vcf'];

// admin/ e' il pannello: senza questa riga non esiste online.
// Non e' fra le `pagine`, quindi il minificatore HTML non lo tocca.
const cartelle = ['assets', '.well-known', 'admin', 'calendario'];

for (const f of [...pagine, ...paginePagineEn, ...servizio]) {
  if (!existsSync(f)) { console.warn(`  manca, salto: ${f}`); continue; }
  await cp(f, `${DIST}/${f}`, { recursive: true });
}
for (const d of cartelle) {
  if (!existsSync(d)) { console.warn(`  manca, salto: ${d}`); continue; }
  await cp(d, `${DIST}/${d}`, { recursive: true });
}
console.log('copia: fatto');
