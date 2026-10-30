// Scompone l'estratto .pmtiles in tessere statiche z/x/y.pbf dentro dist/.
//
// Perche': Cloudflare Pages ignora le richieste Range (risponde 200 con il
// file intero), e il protocollo pmtiles senza 206 non disegna niente. Le
// tessere statiche funzionano su qualunque hosting, Netlify compreso.
// Il .pmtiles resta pubblicato: e' la fonte, e il controllo 42 lo cerca.
//
// Nessuna dipendenza: lettore minimo del formato PMTiles v3
// (https://github.com/protomaps/PMTiles/blob/main/spec/v3/spec.md).
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';

const SORGENTE = 'assets/map/fondi.pmtiles';
const DEST = 'dist/assets/map/tiles';

const buf = await readFile(SORGENTE);
if (buf.toString('latin1', 0, 7) !== 'PMTiles' || buf[7] !== 3) {
  throw new Error(`${SORGENTE}: non e' un PMTiles v3`);
}
const u64 = (o) => Number(buf.readBigUInt64LE(o));
const h = {
  rootOff: u64(8), rootLen: u64(16),
  leafOff: u64(40), dataOff: u64(56),
  internal: buf[97], tile: buf[98], tipo: buf[99],
};
// 1 = nessuna compressione, 2 = gzip. Altro (brotli, zstd) non serve qui.
const apri = (b, c) => {
  if (c === 2) return gunzipSync(b);
  if (c === 1) return b;
  throw new Error(`compressione ${c} non gestita`);
};
if (h.tipo !== 1) throw new Error(`tipo di tessera ${h.tipo}: atteso 1 (MVT)`);

function directory(b) {
  let p = 0;
  const varint = () => {
    let v = 0, m = 1, x;
    do { x = b[p++]; v += (x & 0x7f) * m; m *= 128; } while (x & 0x80);
    return v;
  };
  const n = varint();
  const e = Array.from({ length: n }, () => ({}));
  let id = 0;
  for (const x of e) { id += varint(); x.id = id; }
  for (const x of e) x.run = varint();
  for (const x of e) x.len = varint();
  e.forEach((x, i) => {
    const o = varint();
    x.off = o === 0 && i > 0 ? e[i - 1].off + e[i - 1].len : o - 1;
  });
  return e;
}

// tile id -> z/x/y lungo la curva di Hilbert, come da specifica.
function zxy(id) {
  let acc = 0, z = 0;
  for (;;) {
    const n = 4 ** z;
    if (id < acc + n) break;
    acc += n; z++;
  }
  let t = id - acc, x = 0, y = 0;
  for (let s = 1; s < 2 ** z; s *= 2) {
    const rx = 1 & (t / 2), ry = 1 & (t ^ rx);
    if (ry === 0) {
      if (rx === 1) { x = s - 1 - x; y = s - 1 - y; }
      [x, y] = [y, x];
    }
    x += s * rx; y += s * ry; t = Math.floor(t / 4);
  }
  return [z, x, y];
}

await rm(DEST, { recursive: true, force: true });
let scritte = 0;
async function visita(off, len) {
  for (const e of directory(apri(buf.subarray(off, off + len), h.internal))) {
    if (e.run === 0) { await visita(h.leafOff + e.off, e.len); continue; }
    const dati = apri(buf.subarray(h.dataOff + e.off, h.dataOff + e.off + e.len), h.tile);
    for (let i = 0; i < e.run; i++) {
      const [z, x, y] = zxy(e.id + i);
      await mkdir(`${DEST}/${z}/${x}`, { recursive: true });
      await writeFile(`${DEST}/${z}/${x}/${y}.pbf`, dati);
      scritte++;
    }
  }
}
await visita(h.rootOff, h.rootLen);
console.log(`tessere: ${scritte} file in ${DEST}`);
