import { EVENTI, TESTI } from './dati.mjs';
import { DOM } from './guscio.mjs';

// Aggiungi al calendario (CLAUDE.md §13bis.5): un .ics statico per evento e
// per lingua, in /calendario/. Gli orari si scrivono in UTC con la «Z»: un
// DTSTART senza fuso viene importato nell'ora locale di chi importa, ed e'
// cosi' che un file valido finisce nel giorno sbagliato.
export const CARTELLA = 'calendario';
const FUSO = 'Europe/Rome';

// Minuti di scarto di Roma rispetto a UTC in un dato istante («GMT+1» -> 60).
function scarto(ms) {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: FUSO, timeZoneName: 'shortOffset' })
    .formatToParts(new Date(ms)).find((x) => x.type === 'timeZoneName').value;
  const m = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(p);
  return m ? (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +(m[3] || 0)) : 0;
}

// Ora locale di Roma -> istante UTC. Il secondo giro corregge i casi vicini al
// cambio dell'ora legale.
export function istante(data, ora) {
  const [a, me, g] = data.split('-').map(Number), [h, mi] = ora.split(':').map(Number);
  const ingenuo = Date.UTC(a, me - 1, g, h, mi);
  let ms = ingenuo - scarto(ingenuo) * 60000;
  ms = ingenuo - scarto(ms) * 60000;
  return ms;
}

const utc = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const testo = (v) => String(v).replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');

// Righe oltre 75 ottetti vanno ripiegate (RFC 5545 §3.1), senza spezzare un
// carattere UTF-8 a meta'.
function ripiega(riga) {
  const out = [];
  let corrente = '', ottetti = 0, limite = 75;
  for (const c of riga) {
    const n = Buffer.byteLength(c);
    if (ottetti + n > limite) { out.push(corrente); corrente = ' '; ottetti = 1; limite = 75; }
    corrente += c; ottetti += n;
  }
  out.push(corrente);
  return out.join('\r\n');
}

export const nomeFile = (e, lang) => `${e.file}${lang === 'it' ? '' : '-' + lang}.ics`;

// Solo gli eventi non ancora finiti alla data del build.
export const eventiAttivi = (adesso = Date.now()) =>
  EVENTI.eventi.filter((e) => istante(e.data, e.fine) > adesso);

export function ics(e, lang) {
  const S = TESTI.sito;
  const righe = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${S.nome}//Eventi//${lang.toUpperCase()}`,
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.uid}@${new URL(DOM).host}`,
    `DTSTAMP:${utc(istante(e.pubblicato, '00:00'))}`,
    `DTSTART:${utc(istante(e.data, e.inizio))}`,
    `DTEND:${utc(istante(e.data, e.fine))}`,
    `SUMMARY:${testo(e.titolo[lang])}`,
    `DESCRIPTION:${testo(`${e.descrizione[lang]} ${TESTI.servizio.nota_evento_ics[lang]}`)}`,
    `LOCATION:${testo(`${S.nome}, ${S.indirizzo_riga1}, ${lang === 'it' ? S.indirizzo_riga2 : S.indirizzo_en_riga2}`)}`,
    `GEO:${S.coordinate.lat};${S.coordinate.lon}`,
    `URL:${DOM}${lang === 'it' ? '/' : '/en/'}`,
    'END:VEVENT', 'END:VCALENDAR', '',
  ];
  return righe.map(ripiega).join('\r\n');
}

// «venerdì 20 novembre 2026» / «Friday 20 November 2026», con l'ora di Roma.
export function quando(e, lang) {
  const giorno = new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-GB', {
    timeZone: FUSO, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(istante(e.data, e.inizio)));
  return `${giorno.charAt(0).toUpperCase()}${giorno.slice(1)}, ${e.inizio}–${e.fine}`;
}
