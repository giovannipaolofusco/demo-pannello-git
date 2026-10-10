import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';

// Tutte le immagini pubblicate, non solo /assets/img/: gli sprite della mappa
// stanno in /assets/map/ e §9.2 non fa eccezioni.
const CARTELLE = ['dist/assets/img', 'dist/assets/map/sprites'];

let totale = 0;
for (const dir of CARTELLE) {
  let file;
  try { file = await readdir(dir); } catch { continue; }
  for (const f of file.filter((x) => /\.(jpe?g|png)$/i.test(x))) {
    const src = join(dir, f);
    const out = join(dir, basename(f, extname(f)) + '.webp');
    // rotate() senza argomenti applica l'orientamento EXIF: il .webp esce
    // senza metadati, e senza rotazione sarebbe di lato rispetto al .jpg.
    await sharp(src).rotate().webp({ quality: 72 }).toFile(out);
    totale++;
  }
}
console.log(`immagini: ${totale} varianti webp generate`);
