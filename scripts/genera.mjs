import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { TESTI, verificaAllergeni } from './genera/dati.mjs';
import { pagina, url, DOM } from './genera/guscio.mjs';
import { jsonLd } from './genera/orari.mjs';
import * as corpi from './genera/corpi.mjs';

const DEST = process.argv[2] || '.';
verificaAllergeni();

const OG = `${DOM}/assets/img/og-trattoria-del-molo.jpg`;
const S = TESTI.sito;

const ristorante = () => {
  const j = (v) => JSON.stringify(v);
  const orari = jsonLd().map((o) => j(o)).join(',\n');
  return `<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Restaurant",
"name":${j(S.nome)},
"description":"Cucina di mare della costa fondana.",
"url":"${DOM}/",
"telephone":${j(S.telefono)},
"email":${j(S.email)},
"servesCuisine":"Cucina di mare",
"priceRange":"\u20ac\u20ac",
"image":"${OG}",
"address":{"@type":"PostalAddress","streetAddress":${j(S.indirizzo_riga1)},"postalCode":"04022","addressLocality":"Fondi","addressRegion":"LT","addressCountry":"IT"},
"geo":{"@type":"GeoCoordinates","latitude":${S.coordinate.lat},"longitude":${S.coordinate.lon}},
"openingHoursSpecification":[
${orari}]}
</script>`;
};

const briciole = (lang, nome, slugIt) => '<script type="application/ld+json">' + JSON.stringify({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: url(lang, 'index.html') },
    { '@type': 'ListItem', position: 2, name: nome, item: url(lang, slugIt) },
  ],
}) + '</script>';

const H = TESTI.head;
const PAGINE = [
  { lang: 'it', slug: 'index.html',     file: 'index.html',        meta: H.index,     corpo: corpi.home,      ld: 'ristorante' },
  { lang: 'en', slug: 'index.html',     file: 'en/index.html',     meta: H.index,     corpo: corpi.home,      ld: 'ristorante' },
  { lang: 'it', slug: 'menu.html',      file: 'menu.html',         meta: H.menu,      corpo: corpi.menu,      ld: 'ristorante', bc: 'Il menù' },
  { lang: 'en', slug: 'menu.html',      file: 'en/menu.html',      meta: H.menu,      corpo: corpi.menu,      ld: 'ristorante', bc: 'Menu' },
  { lang: 'it', slug: 'chi-siamo.html', file: 'chi-siamo.html',    meta: H.chi_siamo, corpo: corpi.chiSiamo,  bc: 'Chi siamo' },
  { lang: 'en', slug: 'chi-siamo.html', file: 'en/about-us.html',  meta: H.chi_siamo, corpo: corpi.chiSiamo,  bc: 'About us' },
  { lang: 'it', slug: 'contatti.html',  file: 'contatti.html',     meta: H.contatti,  corpo: corpi.contatti,  ld: 'ristorante', bc: 'Contatti', mappa: true },
  { lang: 'en', slug: 'contatti.html',  file: 'en/contacts.html',  meta: H.contatti,  corpo: corpi.contatti,  ld: 'ristorante', bc: 'Contact', mappa: true },
  { lang: 'it', slug: 'privacy.html',   file: 'privacy.html',      meta: H.privacy,   corpo: corpi.privacy,   bc: 'Privacy' },
  { lang: 'en', slug: 'privacy.html',   file: 'en/privacy.html',   meta: H.privacy,   corpo: corpi.privacy,   bc: 'Privacy' },
];

let n = 0;
for (const p of PAGINE) {
  let ld = p.ld === 'ristorante' ? ristorante() : '';
  if (p.bc) ld += briciole(p.lang, p.bc, p.slug);
  const html = pagina(p.lang, p.slug, p.meta.title[p.lang], p.meta.description[p.lang], p.corpo(p.lang), ld, p.mappa === true);
  const dest = join(DEST, p.file);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, html);
  n++;
}

// La 404 non è indicizzabile: niente canonical, niente hreflang, niente
// JSON-LD. È un'eccezione del sito attuale che il generatore replica.
const q = pagina('it', 'index.html', TESTI.head.quattrocentoquattro.title.it,
                 TESTI.head.quattrocentoquattro.description.it, corpi.quattrocentoquattro());
writeFileSync(join(DEST, '404.html'),
  q.replace(/<link rel="canonical"[^>]*>\n/, '').replace(/<link rel="alternate"[^>]*>\n/g, ''));
n++;

console.log(`genera: ${n} pagine scritte in ${DEST}/`);
