// Avvio del badge: un file servito dal sito, mai uno script in linea.
// Unica differenza dall'avvio del template: il motivo della chiusura
// stagionale arriva nella lingua della pagina.
import * as dati from './orari.js';
import { mostraStatoApertura, linguaDel } from './stato-apertura.js';

const lingua = linguaDel(document.documentElement.lang);
mostraStatoApertura({ ...dati, CHIUSURE: dati.CHIUSURE_PER_LINGUA[lingua] || dati.CHIUSURE });
