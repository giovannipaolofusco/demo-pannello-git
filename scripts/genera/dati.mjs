import { readFileSync, existsSync } from 'node:fs';
import sharp from 'sharp';

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
export const EVENTI    = carica('eventi');

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

// Le dimensioni reali dell'immagine, lette dal file e mai dai dati: servono
// agli attributi width/height, che prevengono lo spostamento di layout, e
// chi carica una foto nuova non deve ricordarsi di riscriverle. sharp le
// legge con l'orientamento EXIF gia' applicato (autoOrient): una foto da
// telefono girata via EXIF ha larghezza e altezza scambiate rispetto ai
// pixel salvati, ed e' cosi' che il browser la mostra.
const MISURE = new Map();

export async function leggiMisure() {
  const slug = [...PIATTI.piatti.map((p) => nomeBase(p.immagine)), ...IMMAGINI_FISSE];
  const errori = [];
  for (const s of new Set(slug)) {
    try {
      const m = await sharp(`assets/img/${s}.jpg`).metadata();
      const { width, height } = m.autoOrient || m;
      if (!width || !height) throw new Error('misure assenti');
      MISURE.set(s, { larghezza: width, altezza: height });
    } catch (e) {
      errori.push(`assets/img/${s}.jpg: non leggibile come immagine (${e.message})`);
    }
  }
  if (errori.length) {
    console.error('\nImmagini illeggibili:\n' + errori.map((e) => '  - ' + e).join('\n') + '\n');
    process.exit(1);
  }
}

export function misure(slug) {
  const m = MISURE.get(slug);
  if (!m) throw new Error(`misure di ${slug} non lette: manca leggiMisure() prima di generare`);
  return m;
}
