/**
 * Badge «aperto adesso» — logica unica del template (UTIL_stato_apertura.md).
 * I dati stanno in orari.js del progetto; qui non si cambia niente da progetto a progetto.
 */
export const FUSO = 'Europe/Rome';
export const ORA_CAMBIO_GIORNATA = 5 * 60; // prima delle 05:00 il visitatore vive ancora il giorno prima

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const MMGG = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// «aggiunge» garantisce una fascia: se una fascia del giorno la contiene gia',
// non la raddoppia. Una sovrapposizione parziale e' un dato incoerente, e la
// rifiuta controllaDati.
const intervallo = ([da, a]) => { const x = inMinuti(da), y = inMinuti(a); return [x, y > x ? y : y + 1440]; };
const unisci = (base, extra) => base.concat(extra.filter((e) => {
  const [x, y] = intervallo(e);
  return !base.some((b) => { const [p, q] = intervallo(b); return p <= x && y <= q; });
}));

const inMinuti = (hhmm) => { const m = HHMM.exec(hhmm); if (!m) throw new Error(`ora non valida: ${hhmm}`); return +m[1] * 60 + +m[2]; };

/** Pasqua (Meeus/Jones/Butcher), gregoriano. */
export function pasquaDi(anno) {
  const a = anno % 19, b = Math.floor(anno / 100), c = anno % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  return { mese: Math.floor((h + l - 7 * m + 114) / 31), giorno: ((h + l - 7 * m + 114) % 31) + 1 };
}

/** Giorno di calendario come numero di giorni dal 1970-01-01 (aritmetica senza fusi). */
const giornoDa = (a, m, g) => Math.round(Date.UTC(a, m - 1, g) / 86400000);
const daGiorno = (n) => { const d = new Date(n * 86400000); return { anno: d.getUTCFullYear(), mese: d.getUTCMonth() + 1, giorno: d.getUTCDate(), settimana: d.getUTCDay() }; };
const isoDi = (n) => { const x = daGiorno(n); return `${x.anno}-${String(x.mese).padStart(2, '0')}-${String(x.giorno).padStart(2, '0')}`; };

/** Data e minuti a Roma, qualunque sia il fuso del dispositivo. */
export function adessoARoma(quando) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(quando).map((x) => [x.type, x.value]));
  return { giorno: giornoDa(+p.year, +p.month, +p.day), minuti: +p.hour * 60 + +p.minute };
}

/** Controlla i dati una volta: un dato che non torna spegne il badge, non si indovina. */
export function controllaDati(d) {
  const fasce = (elenco, dove) => {
    if (!Array.isArray(elenco)) throw new Error(`${dove}: non e' un elenco`);
    const intervalli = elenco.map(([da, a]) => {
      const x = inMinuti(da), y = inMinuti(a);
      if (x === y) throw new Error(`${dove}: fascia vuota ${da}-${a}`);
      return [x, y > x ? y : y + 1440];
    }).sort((p, q) => p[0] - q[0]);
    for (let i = 1; i < intervalli.length; i++) if (intervalli[i][0] < intervalli[i - 1][1]) throw new Error(`${dove}: fasce sovrapposte`);
    if (intervalli.length && intervalli[intervalli.length - 1][1] > intervalli[0][0] + 1440) throw new Error(`${dove}: fasce oltre le 24 ore`);
  };
  // Sovrapposizioni sulla settimana intera: una fascia del sabato oltre la
  // mezzanotte puo' coprire una della domenica, e una festivita' puo' cadere
  // in qualunque giorno.
  const settimana = (perGiorno, dove) => {
    const tutte = [];
    for (const [g, el] of Object.entries(perGiorno)) for (const [da, a] of el) {
      const x = inMinuti(da) + +g * 1440, y = inMinuti(a) > inMinuti(da) ? inMinuti(a) + +g * 1440 : inMinuti(a) + (+g + 1) * 1440;
      tutte.push([x, y], [x + 10080, y + 10080]);
    }
    tutte.sort((p, q) => p[0] - q[0]);
    for (let i = 1; i < tutte.length; i++) if (tutte[i][0] < tutte[i - 1][1]) throw new Error(`${dove}: fasce sovrapposte fra giorni`);
  };
  const stagioni = Object.keys(d.ORARI || {});
  if (!stagioni.length) throw new Error('ORARI vuoto');
  const mesi = new Set();
  for (const s of stagioni) {
    for (const m of d.STAGIONI?.[s]?.mesi || []) { if (mesi.has(m)) throw new Error(`mese ${m} in due stagioni`); mesi.add(m); }
    for (const [g, el] of Object.entries(d.ORARI[s])) { if (!/^[0-6]$/.test(g)) throw new Error(`giorno ${g}`); fasce(el, `ORARI.${s}.${g}`); }
    for (const [g, el] of Object.entries(d.SOLO_SU_PRENOTAZIONE?.[s] || {})) fasce(el, `SOLO_SU_PRENOTAZIONE.${s}.${g}`);
  }
  if (stagioni.length > 1 || d.STAGIONI) for (let m = 1; m <= 12; m++) if (!mesi.has(m)) throw new Error(`mese ${m} senza stagione`);
  for (const c of d.CHIUSURE || []) {
    if (!DATA.test(c.dal) || !DATA.test(c.al) || c.al < c.dal || !String(c.motivo || '').trim()) throw new Error(`chiusura non valida: ${JSON.stringify(c)}`);
  }
  for (const s of stagioni) settimana(d.ORARI[s], `ORARI.${s}`);
  for (const [chiave, f] of Object.entries(d.FESTIVITA || {})) {
    if (!MMGG.test(chiave) && chiave !== 'pasqua' && chiave !== 'pasquetta') throw new Error(`festivita' ${chiave}`);
    if (!!f.sostituisce === !!f.aggiunge) throw new Error(`festivita' ${chiave}: o sostituisce o aggiunge`);
    fasce(f.sostituisce || f.aggiunge, `FESTIVITA.${chiave}`);
    // La festivita' si prova solo dove puo' cadere: pasqua di domenica,
    // pasquetta di lunedi', una data MM-GG su ogni giorno ma nella sola
    // stagione che contiene quel mese. Provarla altrove rifiutava dati validi
    // e spegneva il badge tutto l'anno (revisione del 03/10/2026).
    const giorni = chiave === 'pasqua' ? [0] : chiave === 'pasquetta' ? [1] : [0, 1, 2, 3, 4, 5, 6];
    const doveCade = MMGG.test(chiave) && d.STAGIONI
      ? stagioni.filter((s) => d.STAGIONI[s].mesi.includes(+chiave.slice(0, 2))) : stagioni;
    for (const s of doveCade) for (const g of giorni) {
      const prova = { ...d.ORARI[s], [g]: f.sostituisce || unisci(d.ORARI[s][g] || [], f.aggiunge) };
      settimana(prova, `FESTIVITA.${chiave} di ${['dom','lun','mar','mer','gio','ven','sab'][g]} (${s})`);
    }
  }
}

function stagioneDi(d, mese) {
  const stagioni = Object.keys(d.ORARI);
  if (stagioni.length === 1 && !d.STAGIONI) return stagioni[0];
  return stagioni.find((s) => d.STAGIONI[s].mesi.includes(mese));
}

function festivitaDi(d, n) {
  const x = daGiorno(n), mmgg = `${String(x.mese).padStart(2, '0')}-${String(x.giorno).padStart(2, '0')}`;
  const p = pasquaDi(x.anno), pasqua = giornoDa(x.anno, p.mese, p.giorno);
  return d.FESTIVITA?.[mmgg] || (n === pasqua && d.FESTIVITA?.pasqua) || (n === pasqua + 1 && d.FESTIVITA?.pasquetta) || null;
}

/** Le fasce che INIZIANO nel giorno di calendario n, in minuti dall'inizio di quel giorno. */
function fasceDel(d, n) {
  const chiuso = (d.CHIUSURE || []).find((c) => c.dal <= isoDi(n) && isoDi(n) <= c.al);
  if (chiuso) return { aperte: [], prenotazione: [], chiusura: chiuso };
  const x = daGiorno(n), s = stagioneDi(d, x.mese), f = festivitaDi(d, n);
  let aperte = f?.sostituisce ? f.sostituisce.slice() : (d.ORARI[s][x.settimana] || []).slice();
  if (f?.aggiunge) aperte = unisci(aperte, f.aggiunge);
  const prenotazione = f?.sostituisce ? [] : (d.SOLO_SU_PRENOTAZIONE?.[s]?.[x.settimana] || []);
  const minuti = (el) => el.map(([da, a]) => ({ da: inMinuti(da), a: inMinuti(a) > inMinuti(da) ? inMinuti(a) : inMinuti(a) + 1440, chiude: a, apre: da }));
  return { aperte: minuti(aperte).sort((p, q) => p.da - q.da), prenotazione: minuti(prenotazione), chiusura: null };
}

/** Stato al momento `quando`. Non indovina: se un dato non torna, solleva. */
export function statoApertura(d, quando = new Date()) {
  const { giorno, minuti } = adessoARoma(quando);
  // Una fascia appartiene al giorno in cui inizia: alle 00:30 di domenica vale anche quella di sabato.
  for (const [n, scarto] of [[giorno - 1, 1440], [giorno, 0]]) {
    const t = minuti + scarto, f = fasceDel(d, n);
    const aperta = f.aperte.find((x) => t >= x.da && t < x.a);
    if (aperta) return { aperto: true, chiudeAlle: aperta.chiude };
  }
  for (const [n, scarto] of [[giorno - 1, 1440], [giorno, 0]]) {
    const t = minuti + scarto;
    if (fasceDel(d, n).prenotazione.some((x) => t >= x.da && t < x.a)) return { aperto: false, motivo: 'solo_su_prenotazione', prossima: prossimaApertura(d, giorno, minuti) };
  }
  const corrente = fasceDel(d, giorno);
  return { aperto: false, motivo: corrente.chiusura ? 'chiusura' : 'chiuso', chiusura: corrente.chiusura?.motivo || null, prossima: prossimaApertura(d, giorno, minuti) };
}

/** Prima fascia che inizia dopo adesso, entro un anno. */
function prossimaApertura(d, giorno, minuti) {
  for (let n = giorno; n <= giorno + 366; n++) {
    const f = fasceDel(d, n).aperte.find((x) => n > giorno || x.da > minuti);
    if (f) return { giorno: n, ora: f.apre };
  }
  return null;
}

const TESTI = {
  it: { aperto: 'Aperto', chiuso: 'Chiuso', chiude: (o) => `chiude alle ${o}`, apre: (g, o) => g ? `apre ${g} alle ${o}` : `apre alle ${o}`, prenotazione: 'Solo su prenotazione', per: (m) => m },
  en: { aperto: 'Open', chiuso: 'Closed', chiude: (o) => `closes at ${o}`, apre: (g, o) => g ? `opens ${g} at ${o}` : `opens at ${o}`, prenotazione: 'By reservation only', per: (m) => m },
  de: { aperto: 'Geöffnet', chiuso: 'Geschlossen', chiude: (o) => `schließt um ${o}`, apre: (g, o) => g ? `öffnet ${g} um ${o}` : `öffnet um ${o}`, prenotazione: 'Nur mit Reservierung', per: (m) => m },
  fr: { aperto: 'Ouvert', chiuso: 'Fermé', chiude: (o) => `ferme à ${o}`, apre: (g, o) => g ? `ouvre ${g} à ${o}` : `ouvre à ${o}`, prenotazione: 'Uniquement sur réservation', per: (m) => m }
};

/** Il nome del giorno viene da Intl; oltre sei giorni si aggiunge la data. Mai «oggi» o «domani». */
function nomeGiorno(lingua, n, giornoVissuto) {
  const x = daGiorno(n), d = new Date(Date.UTC(x.anno, x.mese - 1, x.giorno, 12));
  // Si conta dal giorno che il visitatore sta vivendo: alle 00:30 di domenica e'
  // sabato, e «apre sabato» senza data si leggerebbe «stasera».
  const opz = n - giornoVissuto > 6 ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'long' };
  return new Intl.DateTimeFormat(lingua, { timeZone: 'UTC', ...opz }).format(d);
}

/** Una lingua sola per testi e nomi dei giorni: una lingua non prevista vale «it». */
export const linguaDel = (lang) => { const l = String(lang || 'it').slice(0, 2).toLowerCase(); return TESTI[l] ? l : 'it'; };

export function frase(stato, lingua, quando) {
  const l = linguaDel(lingua), t = TESTI[l];
  if (stato.aperto) return `${t.aperto} · ${t.chiude(stato.chiudeAlle)}`;
  const testa = stato.motivo === 'solo_su_prenotazione' ? t.prenotazione
    : stato.chiusura ? `${t.chiuso} · ${t.per(stato.chiusura)}` : t.chiuso;
  if (!stato.prossima) return testa;
  const { giorno, minuti } = adessoARoma(quando);
  // Il giorno si omette solo se la riapertura e' nello stesso giorno di calendario e sono passate le 05:00.
  const senzaGiorno = stato.prossima.giorno === giorno && minuti >= ORA_CAMBIO_GIORNATA;
  const giornoVissuto = minuti < ORA_CAMBIO_GIORNATA ? giorno - 1 : giorno;
  return `${testa} · ${t.apre(senzaGiorno ? '' : nomeGiorno(l, stato.prossima.giorno, giornoVissuto), stato.prossima.ora)}`;
}

/** Monta il badge e lo ricalcola ogni minuto. Se qualcosa non torna, il badge resta nascosto. */
export function mostraStatoApertura(dati, { documento = document, adesso = () => new Date() } = {}) {
  const badge = documento.querySelectorAll('[data-stato-apertura]');
  if (!badge.length) return null;
  const lingua = linguaDel(documento.documentElement.lang);
  try { controllaDati(dati); } catch (e) { return null; }
  const aggiorna = () => {
    let testo, aperto;
    try { const quando = adesso(); const s = statoApertura(dati, quando); testo = frase(s, lingua, quando); aperto = s.aperto; }
    catch (e) { badge.forEach((el) => { el.hidden = true; }); return; }
    badge.forEach((el) => {
      el.textContent = testo;
      el.classList.toggle('stato-apertura--aperto', aperto);
      el.classList.toggle('stato-apertura--chiuso', !aperto);
      el.hidden = false;
    });
  };
  aggiorna();
  // Allineato al minuto: il badge cambia quando cambia l'orologio, non 59 secondi dopo.
  const primo = setTimeout(() => { aggiorna(); ripetizione = setInterval(aggiorna, 60000); }, 60000 - (adesso().getTime() % 60000) + 50);
  let ripetizione = null;
  return () => { clearTimeout(primo); if (ripetizione) clearInterval(ripetizione); };
}
