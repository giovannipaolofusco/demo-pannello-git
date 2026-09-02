import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { minify } from 'terser';

// Solo il JS scritto per il progetto: le librerie in /assets/libs/ arrivano
// già minificate e i loro banner di licenza non vanno toccati (§11).
const DIR = 'dist/assets/js';
const file = (await readdir(DIR)).filter((f) => f.endsWith('.js'));

for (const f of file) {
  const p = join(DIR, f);
  const res = await minify(await readFile(p, 'utf8'), { compress: true, mangle: true });
  await writeFile(p, res.code);
}
console.log(`js: ${file.length} file minificati (${file.join(', ')})`);
