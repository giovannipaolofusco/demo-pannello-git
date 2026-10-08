import { TESTI, MENU, PIATTI, PRIVACY, prezzo, allergeniTesto, nomeBase, misureJpeg, listaAllergeni } from './dati.mjs';
import { tabella, notaStagionale } from './orari.mjs';
import { VCARD } from './guscio.mjs';

const S = TESTI.sito;
const sepTurni = (lang) => (lang === 'it' ? ' e ' : ' and ');
const tel = (lang) => `<a href="tel:${S.telefono}">${S.telefono_leggibile[lang]}</a>`;
const indirizzo2 = (lang) => (lang === 'it' ? S.indirizzo_riga2 : S.indirizzo_en_riga2);

function figura(slug, alt, w, h, cls, priorita = false) {
  // Le misure vengono dal file, non da chi compila: sono gli attributi che
  // riservano lo spazio prima che l'immagine arrivi, e un valore stantio
  // rimette in pagina lo spostamento di layout.
  const reali = misureJpeg(`assets/img/${slug}.jpg`);
  if (reali) { w = reali.larghezza; h = reali.altezza; }
  const attr = priorita ? ' fetchpriority="high"' : ' loading="lazy"';
  return `<picture><source srcset="/assets/img/${slug}.webp" type="image/webp"><img class="${cls}" src="/assets/img/${slug}.jpg" alt="${alt}" width="${w}" height="${h}"${attr}></picture>`;
}

function schedePiatti(lang) {
  return PIATTI.piatti.map((p) => `      <li class="piatto rivela">
        ${figura(nomeBase(p.immagine), p.alt[lang], p.larghezza, p.altezza, 'piatto__figura')}
        <h3 class="piatto__nome">${p.nome[lang]}</h3>
        <p class="piatto__note">${p.note[lang]}</p>
        <p class="piatto__allergeni">${allergeniTesto(listaAllergeni(p.allergeni), lang)}</p>
        <p class="piatto__prezzo">${prezzo(p.prezzo)}</p>
      </li>`).join('\n');
}

// Recensioni di esempio: testi statici, dichiarati come tali sotto il titolo.
// Nessun JSON-LD Review/AggregateRating: le stelle restano testo in pagina.
function recensioniEsempio(lang) {
  const r = TESTI.recensioni_esempio;
  const voci = r.voci.map((v) => `      <li class="recensione rivela">
        <p class="recensione__stelle" role="img" aria-label="${r.stelle_etichetta[lang].replace('{n}', v.stelle)}">${'★'.repeat(v.stelle)}${'☆'.repeat(5 - v.stelle)}</p>
        <blockquote class="recensione__testo"><p>${v.testo[lang]}</p></blockquote>
        <p class="recensione__firma">${r.firma[lang]}</p>
      </li>`).join('\n');
  return `<section class="recensioni" aria-labelledby="recensioni-titolo">
    <h2 class="sezione__titolo rivela" id="recensioni-titolo">${r.titolo[lang]}</h2>
    <p class="recensioni__fonte rivela">${r.fonte[lang]}</p>
    <ul class="recensioni__lista gruppo">
${voci}
    </ul>
  </section>`;
}

export function home(lang) {
  const t = TESTI.home, h = lang === 'it' ? '' : '/en';
  return `<section class="apertura">
    <div class="apertura__onda" aria-hidden="true"></div>
    <div class="apertura__testo">
      <p class="occhiello">${t.occhiello[lang]}</p>
      <h1 class="apertura__titolo">${t.titolo[lang]}</h1>
      <p class="apertura__sommario">${t.sommario[lang]}</p>
      <p class="apertura__azioni">
        <a class="pulsante pulsante--pieno" href="tel:${S.telefono}">${t.cta_chiama[lang]}</a>
        <a class="pulsante pulsante--vuoto" href="${h}/menu.html">${t.cta_menu[lang]}</a>
      </p>
    </div>
    ${figura('trattoria-del-molo-apertura', t.apertura_alt[lang], 900, 1600, 'apertura__figura', true)}
  </section>

  <section class="piatti" aria-labelledby="piatti-titolo">
    <h2 class="sezione__titolo rivela" id="piatti-titolo">${t.titolo_piatti[lang]}</h2>
    <ul class="piatti__lista gruppo">
${schedePiatti(lang)}
    </ul>
    <p class="piatti__coda rivela"><a class="collegamento-testo" href="${h}/menu.html">${t.link_menu_completo[lang]}</a></p>
  </section>

  ${recensioniEsempio(lang)}

  <section class="racconto" aria-labelledby="racconto-titolo">
    <div class="racconto__testo gruppo">
      <h2 class="sezione__titolo rivela" id="racconto-titolo">${t.titolo_racconto[lang]}</h2>
      <p class="rivela">${t.racconto_p1[lang]}</p>
      <p class="rivela">${t.racconto_p2[lang]}</p>
      <p class="rivela"><a class="collegamento-testo" href="${h}/${lang === 'it' ? 'chi-siamo' : 'about-us'}.html">${t.racconto_link[lang]}</a></p>
    </div>
    <img class="racconto__figura rivela" src="/assets/img/segnaposto-sala.svg" alt="${t.sala_alt[lang]}" width="1200" height="800" loading="lazy">
  </section>

  <section class="pratico" aria-labelledby="pratico-titolo">
    <h2 class="sezione__titolo rivela" id="pratico-titolo">${t.titolo_pratico[lang]}</h2>
    <div class="pratico__griglia gruppo">
      <div class="rivela">
        <h3 class="pratico__voce">${t.voce_orari[lang]}</h3>
        <p class="stato-apertura" data-stato-apertura hidden></p>
        <div class="tabella-scorrevole"><table class="orari">
          <tbody>
${tabella(lang, sepTurni(lang), 12)}
          </tbody>
        </table></div>
        <p class="orari__nota">${notaStagionale(lang)}</p>
      </div>
      <div class="rivela">
        <h3 class="pratico__voce">${t.voce_dove[lang]}</h3>
        <p class="pratico__indirizzo">${S.indirizzo_riga1}<br>${indirizzo2(lang)}</p>
        <p class="pratico__azioni">
          <a class="pulsante pulsante--vuoto" href="${h}/${lang === 'it' ? 'contatti' : 'contacts'}.html">${t.cta_arrivare[lang]}</a>
          <a class="pulsante pulsante--vuoto" href="tel:${S.telefono}">${S.telefono_leggibile.it}</a>
          <a class="pulsante pulsante--vuoto" href="/${VCARD}" download>${TESTI.servizio.salva_contatto[lang]}</a>
        </p>
      </div>
    </div>
    <img class="pratico__mappa rivela" src="/assets/img/segnaposto-mappa-segnaposto.svg" alt="${t.mappa_alt[lang]}" width="1200" height="700" loading="lazy">
  </section>`;
}

export function menu(lang) {
  const m = TESTI.menu_pagina;
  const sezioni = MENU.sezioni.map((sez) => {
    const voci = sez.voci.map((v) => {
      const soloIt = !v.nome.en;
      const nome = soloIt ? v.nome.it : v.nome[lang];
      const attrLang = (lang === 'en' && soloIt) ? ' lang="it"' : '';
      const nota = (lang === 'en' && soloIt)
        ? `<span class="menu__nota" lang="it">${m.nota_solo_it.en}</span>` : '';
      return `      <li class="menu__voce rivela">
        <p class="menu__nome"${attrLang}>${nome}</p>
        <p class="menu__allergeni">${allergeniTesto(listaAllergeni(v.allergeni), lang)}</p>${nota}
        <p class="menu__prezzo">${prezzo(v.prezzo)}</p>
      </li>`;
    }).join('\n');
    return `    <h2 class="menu__sezione rivela">${sez.nome[lang]}</h2>\n    <ul class="menu__lista gruppo">\n${voci}\n    </ul>`;
  }).join('\n');
  return `<section class="menu" aria-labelledby="menu-titolo">
    <h1 class="sezione__titolo" id="menu-titolo">${m.titolo[lang]}</h1>
    <p class="menu__intro">${m.intro[lang]}</p>
    <p class="menu__condizioni">${m.condizioni[lang]}</p>
${sezioni}
  </section>`;
}

export function chiSiamo(lang) {
  const c = TESTI.chi_siamo;
  const p = c.paragrafi.map((x) => `      <p class="rivela">${x[lang]}</p>`).join('\n');
  return `<section class="testo" aria-labelledby="t">
    <h1 class="sezione__titolo" id="t">${c.titolo[lang]}</h1>
    <div class="testo__corpo gruppo">
${p}
    </div>
  </section>`;
}

export function contatti(lang) {
  const c = TESTI.contatti, lat = S.coordinate.lat, lon = S.coordinate.lon;
  const mappeNome = lang === 'it' ? 'Apple Mappe' : 'Apple Maps';
  return `<section class="contatti" aria-labelledby="t">
    <h1 class="sezione__titolo" id="t">${c.titolo[lang]}</h1>
    <div class="contatti__griglia gruppo">
      <div class="rivela">
        <h2 class="contatti__voce">${c.voce_prenotare[lang]}</h2>
        <p class="contatti__grande">${tel(lang)}</p>
        <p>${c.nota_orario[lang]}</p>
        <p><a href="mailto:${S.email}">${S.email}</a></p>
        <p><a class="pulsante pulsante--vuoto" href="/${VCARD}" download>${TESTI.servizio.salva_contatto[lang]}</a></p>
      </div>
      <div class="rivela">
        <h2 class="contatti__voce">${c.voce_dove[lang]}</h2>
        <p class="contatti__grande">${S.indirizzo_riga1}<br>${indirizzo2(lang)}</p>
        <div class="indicazioni">
          <p class="indicazioni__titolo">${c.indicazioni_titolo[lang]}</p>
          <ul class="indicazioni__lista">
            <li><a href="https://www.google.com/maps/dir/?api=1&amp;destination=${lat},${lon}" rel="noopener noreferrer" target="_blank">Google Maps</a></li>
            <li><a href="https://maps.apple.com/?daddr=${lat},${lon}" rel="noopener noreferrer" target="_blank">${mappeNome}</a></li>
            <li><a href="https://waze.com/ul?ll=${lat},${lon}&amp;navigate=yes" rel="noopener noreferrer" target="_blank">Waze</a></li>
            <li><button type="button" class="copia-indirizzo" data-indirizzo="${c.copia_dato[lang]}">${c.copia[lang]}</button></li>
          </ul>
        </div>
      </div>
    </div>
    <h2 class="contatti__voce">${c.voce_orari[lang]}</h2>
    <p class="stato-apertura" data-stato-apertura hidden></p>
    <div class="tabella-scorrevole"><table class="orari">
      <tbody>
${tabella(lang, sepTurni(lang))}
      </tbody>
    </table></div>
    <p class="orari__nota">${notaStagionale(lang)}</p>
        <div class="mappa" id="mappa" role="img"
         aria-label="${c.mappa_label[lang]}"></div>
    <p class="mappa__ripiego">${c.mappa_ripiego[lang]}</p>
  </section>`;
}

export const privacy = (lang) => PRIVACY.corpo[lang];

export function quattrocentoquattro() {
  const q = TESTI.quattrocentoquattro;
  return `  <section class="quattrocentoquattro" aria-labelledby="t">
    <h1 class="sezione__titolo" id="t">${q.titolo}</h1>
    <p class="q404__testo">${q.testo}</p>
    <p class="q404__azioni">
      <a class="pulsante pulsante--pieno" href="/">${q.cta_home}</a>
      <a class="pulsante pulsante--vuoto" href="/menu.html">${q.cta_menu}</a>
    </p>
    <div class="q404__recapiti">
      <p>${q.recapiti_intro}</p>
      <p class="contatti__grande">${tel('it')}</p>
      <p>${S.indirizzo_riga1} — ${S.indirizzo_riga2}<br><a href="mailto:${S.email}">${S.email}</a></p>
    </div>
    <p class="q404__en" lang="en">${q.riga_en}</p>
  </section>`;
}
