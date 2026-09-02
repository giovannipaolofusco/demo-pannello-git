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

// "nessuno" e' la scelta esplicita del pannello: dice che il piatto non
// contiene alcuno dei 14, ed esiste perche' un campo vuoto non si distingue
// da un campo non compilato. Insieme ad altri valori e' una contraddizione:
// o non ce n'e' nessuno, o ce ne sono. Il build si ferma invece di decidere
// al posto di chi ha compilato.
export const NESSUNO = 'nessuno';
export const listaAllergeni = (codici) =>
  (codici || []).includes(NESSUNO) ? [] : (codici || []);

export function verificaAllergeni() {
  const errori = [];
  const controlla = (codici, dove) => {
    const l = codici || [];
    if (l.length === 0) {
      errori.push(`${dove}: allergeni non compilati. Se il piatto non ne contiene, scegli "nessuno"`);
      return;
    }
    if (l.includes(NESSUNO) && l.length > 1) {
      errori.push(`${dove}: "nessuno" insieme a ${l.filter((c) => c !== NESSUNO).map((c) => `"${c}"`).join(', ')} — o non ce n'è nessuno, o ce ne sono`);
      return;
    }
    for (const c of l) {
      if (c !== NESSUNO && !AMMESSI.has(c)) errori.push(`${dove}: allergene "${c}" non è fra le 14 categorie del Reg. UE 1169/2011`);
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

// Decap scrive nel campo immagine il percorso pubblico completo
// ("/assets/img/foto.jpg"), perche' `public_folder` gli serve per l'anteprima.
// I dati vogliono il nome base. Normalizziamo in ingresso invece di
// pretendere che chi compila sappia la differenza: si accettano entrambe le
// forme e si tiene il nome del file senza cartella e senza estensione.
export const nomeBase = (v) =>
  String(v || '').split('/').pop().replace(/\.[^.]+$/, '');

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
  for (const p of PIATTI.piatti) attesa(nomeBase(p.immagine), `piatti → ${p.nome.it}`);
  for (const s of IMMAGINI_FISSE) attesa(s, 'template');
  if (errori.length) {
    console.error('\nImmagini mancanti:\n' + errori.map((e) => '  - ' + e).join('\n')
      + '\n\nIl nome va scritto senza percorso e senza estensione, e il file .jpg\n'
      + 'deve esistere in assets/img/. La variante .webp la genera il build.\n');
    process.exit(1);
  }
}

// Le dimensioni reali dell'immagine, lette dal file invece che dai dati.
// Servono agli attributi width/height, che prevengono lo spostamento di
// layout: se vengono dai dati, chi carica una foto di proporzioni diverse
// e non aggiorna i due numeri reintroduce il difetto senza accorgersene.
// Il file e' la sola fonte che non puo' mentire.
export function misureJpeg(percorso) {
  const b = readFileSync(percorso);
  if (b.readUInt16BE(0) !== 0xffd8) return null; // non e' un JPEG
  let o = 2;
  while (o < b.length) {
    if (b[o] !== 0xff) { o++; continue; }
    const marker = b[o + 1];
    // SOF0..SOF15, esclusi DHT (c4), JPGA (c8) e DAC (cc): sono i soli
    // segmenti che portano le dimensioni del fotogramma.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { altezza: b.readUInt16BE(o + 5), larghezza: b.readUInt16BE(o + 7) };
    }
    o += 2 + b.readUInt16BE(o + 2);
  }
  return null;
}
