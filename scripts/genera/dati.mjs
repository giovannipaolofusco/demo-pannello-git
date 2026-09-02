import { readFileSync, existsSync } from 'node:fs';

const carica = (n) => JSON.parse(readFileSync(new URL(`../../contenuti/${n}.json`, import.meta.url), 'utf8'));

// Le immagini referenziate dai template invece che dai dati: il controllo
// deve coprirle comunque, altrimenti resta scoperta proprio quella che decide
// l'LCP della home.
export const IMMAGINI_FISSE = ['trattoria-del-molo-apertura'];

export const ALLERGENI = carica('allergeni');
export const MENU      = carica('menu');
export const ORARI     = carica('orari');
export const PIATTI    = carica('piatti');
export const TESTI     = carica('testi');
export const PRIVACY   = carica('privacy');

// La lista degli allergeni è chiusa: un valore fuori elenco è un refuso che
// finirebbe in pagina come categoria inventata, e in un menù gli allergeni
// sono l'informazione con le conseguenze più serie. Il build si ferma.
const AMMESSI = new Set(Object.keys(ALLERGENI).filter((k) => k !== '_nota'));

export function verificaAllergeni() {
  const errori = [];
  const controlla = (codici, dove) => {
    for (const c of codici) {
      if (!AMMESSI.has(c)) errori.push(`${dove}: allergene "${c}" non è fra le 14 categorie del Reg. UE 1169/2011`);
    }
  };
  for (const sez of MENU.sezioni)
    for (const v of sez.voci) controlla(v.allergeni, `menu → ${v.nome.it}`);
  for (const p of PIATTI.piatti) controlla(p.allergeni, `piatti → ${p.nome.it}`);
  if (errori.length) {
    console.error('\nAllergeni non validi:\n' + errori.map((e) => '  - ' + e).join('\n') + '\n');
    process.exit(1);
  }
}

export const prezzo = (n) => `€ ${n.toFixed(2).replace('.', ',')}`;
// Solo il primo elemento resta capitalizzato: e' la forma usata su tutte e
// venti le voci del menu, e il CSS la rende comunque in maiuscoletto.
export const allergeniTesto = (codici, lang) =>
  codici
    .map((c, i) => (i === 0 ? ALLERGENI[c][lang] : ALLERGENI[c][lang].toLowerCase()))
    .join(', ');

// Un nome base di immagine sbagliato produce HTML valido e un'immagine rotta:
// nessun errore di build, nessun rilievo negli audit, e il difetto si vede
// solo aprendo la pagina. Col pannello quel nome lo scrive il cliente, quindi
// il caso passa da raro a probabile.
export function verificaImmagini() {
  const errori = [];
  const attesa = (slug, dove) => {
    const jpg = `assets/img/${slug}.jpg`;
    if (!existsSync(jpg)) errori.push(`${dove}: manca ${jpg} (il campo "immagine" vale "${slug}")`);
  };
  for (const p of PIATTI.piatti) attesa(p.immagine, `piatti → ${p.nome.it}`);
  for (const s of IMMAGINI_FISSE) attesa(s, 'template');
  if (errori.length) {
    console.error('\nImmagini mancanti:\n' + errori.map((e) => '  - ' + e).join('\n')
      + '\n\nIl nome va scritto senza percorso e senza estensione, e il file .jpg\n'
      + 'deve esistere in assets/img/. La variante .webp la genera il build.\n');
    process.exit(1);
  }
}
