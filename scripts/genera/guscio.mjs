import { TESTI } from './dati.mjs';
import { footer as orariFooter } from './orari.mjs';

export const DOM = 'https://demo-pannello-git.netlify.app';
export const VCARD = 'trattoria-del-molo.vcf';

// Pulsante WhatsApp (CLAUDE.md §13bis.9): wa.me col messaggio precompilato.
// La nota piccola accanto dichiara a chi scrive: nella demo e' il numero del
// titolare, non quello finto della trattoria.
export function whatsapp(lang, cls = 'pulsante pulsante--vuoto') {
  const w = TESTI.whatsapp;
  const href = `https://wa.me/${w.numero}?text=${encodeURIComponent(w.messaggio)}`;
  return `<a class="${cls}" href="${href}">${w.etichetta[lang]}</a>
      <small class="whatsapp__nota">${w.nota[lang]}</small>`;
}
const OG = `${DOM}/assets/img/og-trattoria-del-molo.jpg`;

// slug IT -> slug EN. Le pagine legali tengono il nome fisso in ogni lingua
// (MOD_multilingua.md): lo slug tradotto non porta traffico e il nome fisso
// serve a trovare il documento senza sapere la lingua.
export const COPPIE = {
  'index.html': 'index.html', 'menu.html': 'menu.html',
  'chi-siamo.html': 'about-us.html', 'contatti.html': 'contacts.html',
  'privacy.html': 'privacy.html',
};

const NAV = {
  it: [['/', 'Home', 'index.html'], ['/menu.html', 'Il menù', 'menu.html'],
       ['/chi-siamo.html', 'Chi siamo', 'chi-siamo.html'], ['/contatti.html', 'Contatti', 'contatti.html']],
  en: [['/en/', 'Home', 'index.html'], ['/en/menu.html', 'Menu', 'menu.html'],
       ['/en/about-us.html', 'About us', 'about-us.html'], ['/en/contacts.html', 'Contact', 'contacts.html']],
};

export function url(lang, slugIt) {
  const s = lang === 'it' ? slugIt : COPPIE[slugIt];
  const base = lang === 'it' ? DOM : `${DOM}/en`;
  return s === 'index.html' ? `${base}/` : `${base}/${s}`;
}

export function head(lang, slugIt, title, desc, ld = '', mappa = false) {
  const can = url(lang, slugIt), altIt = url('it', slugIt), altEn = url('en', slugIt);
  const loc = lang === 'it' ? 'it_IT' : 'en_GB';
  return `<meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#4A5A4A">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${can}">
<link rel="alternate" hreflang="it" href="${altIt}">
<link rel="alternate" hreflang="en" href="${altEn}">
<link rel="alternate" hreflang="x-default" href="${altIt}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Trattoria del Molo">
<meta property="og:locale" content="${loc}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${can}">
<meta property="og:image" content="${OG}">
<meta property="og:image:secure_url" content="${OG}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Trattoria del Molo — cucina di mare a Fondi">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${OG}">
<meta name="twitter:image:alt" content="Trattoria del Molo — cucina di mare a Fondi">
<link rel="icon" type="image/svg+xml" href="/assets/favicon/icon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon/favicon-16x16.png">
<link rel="apple-touch-icon" href="/assets/favicon/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="stylesheet" href="/assets/css/style.css">
<link rel="stylesheet" href="/assets/libs/cookieconsent/cookieconsent.css">
${mappa ? '<link rel="stylesheet" href="/assets/libs/maplibre/maplibre-gl.css">\n' : ''}<link rel="preload" href="/assets/fonts/lora-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/source-sans-3-latin.woff2" as="font" type="font/woff2" crossorigin>
${ld}`;
}

export function testata(lang, attiva) {
  const n = TESTI.navigazione;
  const voci = NAV[lang]
    .map(([href, testo, slug]) => `        <li><a href="${href}"${slug === attiva ? ' aria-current="page"' : ''}>${testo}</a></li>`)
    .join('\n');
  const altra = lang === 'it' ? ['English', '/en/', 'en'] : ['Italiano', '/', 'it'];
  return `<a class="salta-contenuto" href="#contenuto">${n.salta[lang]}</a>

<header class="testata">
  <p class="avviso-demo">${TESTI.demo.avviso[lang]} <span class="avviso-demo__pannello">${TESTI.demo.pannello[lang]}</span></p>
  <div class="testata__interno">
    <a class="testata__marchio" href="${lang === 'it' ? '/' : '/en/'}">Trattoria <em>del Molo</em></a>
    <button class="testata__attiva-menu" type="button" aria-expanded="false" aria-controls="menu-principale">Menu</button>
    <nav class="navigazione" id="menu-principale" aria-label="${n.etichetta[lang]}">
      <ul class="navigazione__lista">
${voci}
        <li><a class="navigazione__lingua" href="${altra[1]}" lang="${altra[2]}">${altra[0]}</a></li>
      </ul>
    </nav>
  </div>
</header>`;
}

export function piede(lang) {
  const f = TESTI.footer, s = TESTI.sito;
  const ph = lang === 'it' ? '/privacy.html' : '/en/privacy.html';
  const via = lang === 'it' ? `${s.indirizzo_riga1} — ${s.indirizzo_riga2}` : `${s.indirizzo_riga1} — ${s.indirizzo_riga2}`;
  return `<footer class="piede">
  <div class="piede__interno">
    <div class="piede__blocco">
      <p class="piede__marchio">${s.nome}</p>
      <p>${via}<br>
      <a href="tel:${s.telefono}">${s.telefono_leggibile.it}</a><br>
      <a href="mailto:${s.email}">${s.email}</a></p>
      <p class="piede__whatsapp">${whatsapp(lang, 'piede__whatsapp-link')}</p>
      <p><button type="button" class="condividi" data-condividi data-copiato="${TESTI.servizio.condividi_copiato[lang]}" hidden>${TESTI.servizio.condividi[lang]}</button></p>
      <p class="condividi__ripiego" hidden>${TESTI.servizio.condividi_ripiego[lang]} <span class="condividi__indirizzo"></span></p>
    </div>
    <div class="piede__blocco">
      <p class="piede__etichetta">${f.etichetta_orari[lang]}</p>
      <p>${orariFooter(lang)}</p>
    </div>
    <div class="piede__blocco piede__blocco--legale">
      <p>${f.legale.join('<br>\n      ')}</p>
      <p><a href="${ph}">${f.privacy[lang]}</a></p>
      <p><button type="button" class="footer__preferenze" data-cc="show-preferencesModal">${f.preferenze[lang]}</button></p>
      <p class="credito">${f.credito_verbo[lang]} <a href="${f.credito_url}" rel="noopener">${f.credito_firma}</a></p>
    </div>
  </div>
</footer>`;
}

export function pagina(lang, slugIt, title, desc, main, ld = '', mappa = false) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
${head(lang, slugIt, title, desc, ld, mappa)}
</head>
<body class="apre">
${testata(lang, lang === 'en' ? COPPIE[slugIt] : slugIt)}

<main id="contenuto">
${main}
</main>

${piede(lang)}

<script src="/assets/js/main.js" defer></script>
<script src="/assets/libs/cookieconsent/cookieconsent.umd.js" defer></script>
<script src="/assets/js/consenso.js" defer></script>
${main.includes('data-stato-apertura') ? '<script type="module" src="/assets/js/avvio-stato-apertura.js"></script>\n' : ''}${mappa ? '<script src="/assets/libs/maplibre/maplibre-gl.js" defer></script>\n<script src="/assets/libs/pmtiles/pmtiles.js" defer></script>\n<script src="/assets/js/mappa.js" defer></script>\n' : ''}</body>
</html>
`;
}

// Pagina Link-in-Bio (MOD_pagina_link_bio.md): nessuna navigazione, nessuno
// script, canonical su se stessa e nessun hreflang (esiste solo in italiano).
export const LINK_BIO = 'link.html';
export function paginaLink(main) {
  const l = TESTI.link_bio, f = TESTI.footer;
  const self = `${DOM}/${LINK_BIO}`;
  const testa = head('it', 'index.html', l.title, l.description)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${self}">`)
    .replace(/<link rel="alternate"[^>]*>\n/g, '')
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${self}">`)
    .replace(/<link rel="stylesheet" href="\/assets\/libs\/cookieconsent[^>]*>\n/, '');
  return `<!DOCTYPE html>
<html lang="it">
<head>
${testa}
</head>
<body class="link-bio">
<a class="salta-contenuto" href="#contenuto">${TESTI.navigazione.salta.it}</a>
<p class="avviso-demo">${TESTI.demo.avviso.it} <span class="avviso-demo__pannello">${TESTI.demo.pannello.it}</span></p>

<main id="contenuto">
${main}
</main>

<footer class="link-bio__piede">
  <p><a href="/privacy.html">${l.privacy}</a></p>
  <p class="credito">${f.credito_verbo.it} <a href="${f.credito_url}" rel="noopener">${f.credito_firma}</a></p>
</footer>
</body>
</html>
`;
}
