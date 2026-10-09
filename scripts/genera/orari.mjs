import { ORARI } from './dati.mjs';

const turni = (f, sep) => f.turni.map((t) => `${t.apre}–${t.chiude}`).join(sep);

// Uscita 1 — la tabella di contatti.html e index.html
export function tabella(lang, sep, rientro = 8) {
  const sp = ' '.repeat(rientro);
  const chiuso = ORARI.chiusura_stagionale.chiuso_etichetta[lang];
  const righe = ORARI.settimana.map((f) => {
    const valore = f.chiuso ? chiuso : turni(f, sep);
    return `${sp}<tr><th scope="row">${f.etichetta[lang]}</th><td>${valore}</td></tr>`;
  });
  return righe.join('\n');
}

// Uscita 2 — la riga compatta del footer, su ogni pagina
export function footer(lang) {
  const sep = lang === 'it' ? ' e ' : ' and ';
  return ORARI.settimana
    .map((f) => (f.chiuso
      ? (lang === 'it' ? 'Domenica chiuso' : 'Closed on Sunday')
      : `${f.breve[lang]} ${turni(f, sep)}`))
    .join('<br>');
}

// Uscita 3 — openingHoursSpecification del JSON-LD.
// Un turno per fascia oraria, come vuole schema.org: una fascia con pranzo e
// cena produce due voci con gli stessi giorni.
export function jsonLd() {
  const voci = [];
  for (const f of ORARI.settimana) {
    for (const t of f.turni) {
      voci.push({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: f.giorni.length === 1 ? f.giorni[0] : f.giorni,
        opens: t.apre,
        closes: t.chiude,
      });
    }
  }
  // La chiusura stagionale: oggi manca nel JSON-LD del sito, ed e' la sola
  // differenza voluta rispetto alle pagine attuali. schema.org la esprime
  // come specifica con validFrom/validThrough e nessun orario di apertura.
  const cs = ORARI.chiusura_stagionale;
  voci.push({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    validFrom: cs.dal,
    validThrough: cs.al,
    opens: '00:00',
    closes: '00:00',
  });
  return voci;
}

export const notaStagionale = (lang) => ORARI.chiusura_stagionale.nota[lang];

// Uscita 4 — assets/js/orari.js, i dati del badge «aperto adesso»
// (UTIL_stato_apertura.md). Stessa sorgente delle altre tre: il badge non
// puo' dire un orario che tabella e JSON-LD non dicono. La chiusura
// stagionale diventa una CHIUSURA con motivo, uno per lingua perche' il
// motivo compare nel badge.
const NUMERO_GIORNO = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

export function moduloJs(motivo) {
  const orari = {};
  for (const f of ORARI.settimana) {
    if (f.chiuso) continue;
    for (const g of f.giorni) orari[NUMERO_GIORNO[g]] = f.turni.map((t) => [t.apre, t.chiude]);
  }
  const cs = ORARI.chiusura_stagionale;
  const chiusure = (lang) => [{ dal: cs.dal, al: cs.al, motivo: motivo[lang] }];
  const j = (v) => JSON.stringify(v);
  return `// Generato da scripts/genera.mjs a partire da contenuti/orari.json: non modificare a mano.
export const ORARI = { tutto: ${j(orari)} };
export const CHIUSURE = ${j(chiusure('it'))};
export const CHIUSURE_PER_LINGUA = { it: ${j(chiusure('it'))}, en: ${j(chiusure('en'))} };
`;
}
