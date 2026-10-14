// Pagina dolci: i macaron (ritagli della foto originale) arrivano uno alla
// volta con lo scroll e si posano dove stanno nella foto. Senza JS, o con
// "riduci movimento", resta la lista con foto, nome e descrizione.
const sezione = document.querySelector('[data-dolci]');
const fermo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (sezione && !fermo) {
  const lista = sezione.querySelector('.dolci__lista');
  const voci = [...lista.querySelectorAll('.dolce')];
  const L = Number(sezione.dataset.fotoL), A = Number(sezione.dataset.fotoA);

  // Palco: la scena alta da scorrere, il palco fermo, la tavola con le proporzioni della foto
  const scena = document.createElement('div');
  scena.className = 'dolci__scena';
  const palco = document.createElement('div');
  palco.className = 'dolci__palco';
  const didascalie = document.createElement('div');
  didascalie.className = 'dolci__didascalie';
  didascalie.setAttribute('aria-hidden', 'true');
  const lati = { sx: document.createElement('div'), dx: document.createElement('div') };
  lati.sx.className = 'dolci__lato dolci__lato--sx';
  lati.dx.className = 'dolci__lato dolci__lato--dx';
  didascalie.append(lati.sx, lati.dx);
  lista.before(scena);
  scena.append(palco);
  palco.append(lista, didascalie);
  sezione.classList.add('dolci--scena');
  lista.style.aspectRatio = `${L} / ${A}`;
  // il palco resta sotto la testata appiccicata, non dietro
  const testata = document.querySelector('.testata');
  const misura = () => {
    const h = testata ? testata.offsetHeight : 0;
    palco.style.top = `${h}px`;
    palco.style.height = `calc(100dvh - ${h}px)`;
  };
  misura();
  scena.style.height = `${100 + voci.length * 45}vh`;

  const pezzi = voci.map((li) => {
    // la classe .rivela di main.js qui non serve: il movimento lo guida lo scroll
    li.classList.remove('rivela');
    delete li.dataset.fuori;
    const x = Number(li.dataset.x), y = Number(li.dataset.y), l = Number(li.dataset.l), a = Number(li.dataset.a);
    li.style.left = `${(x / L) * 100}%`;
    li.style.top = `${(y / A) * 100}%`;
    li.style.width = `${(l / L) * 100}%`;
    const lato = x + l / 2 < L / 2 ? 'sx' : 'dx';
    const d = document.createElement('p');
    d.className = 'dolci__didascalia';
    const nome = document.createElement('strong'), nota = document.createElement('span');
    nome.textContent = li.querySelector('.dolce__nome').textContent;
    nota.textContent = li.querySelector('.dolce__nota').textContent;
    d.append(nome, nota);
    lati[lato].append(d);
    return { li, lato, didascalia: d, segno: lato === 'sx' ? -1 : 1, colore: li.dataset.colore };
  });

  const clamp = (v) => Math.min(1, Math.max(0, v));
  const esci = (t) => 1 - Math.pow(1 - t, 3);
  // fasi: 0-.04 tavola vuota, poi un arrivo per pezzo, ultimo 10% fermo sulla composizione
  const INIZIO = 0.04, FINE = 0.9;
  const passo = (FINE - INIZIO) / (pezzi.length + 0.6), durata = passo * 1.6;
  // ogni arrivo: volo ad arco (75%) e atterraggio con rimbalzo (25%)
  const VOLO = 0.75;

  let ultimo = -1, attesa = 0;
  function disegna() {
    attesa = 0;
    const r = scena.getBoundingClientRect(), corsa = r.height - window.innerHeight;
    const p = corsa > 0 ? clamp(-r.top / corsa) : 1;
    if (Math.abs(p - ultimo) < 0.0005) return;
    ultimo = p;
    // letture del layout prima di ogni scrittura di stile, per non forzare un ricalcolo a metà fotogramma
    const pr = palco.getBoundingClientRect(), lr = lista.getBoundingClientRect();
    const accesi = { sx: null, dx: null };
    let colore = '', centro = null;
    // l'ondeggio si spegne prima della fine, così l'ultimo fotogramma è la composizione della foto
    const ondeggio = 1 - clamp((p - FINE + 0.06) / 0.06);
    pezzi.forEach((q, i) => {
      const t = clamp((p - INIZIO - i * passo) / durata);
      const f = clamp(t / VOLO), b = clamp((t - VOLO) / (1 - VOLO));
      const e = esci(f), resto = 1 - e;
      // volo: entra dal lato, cade dall'alto lungo una parabola, ruota fino a posarsi
      let x = q.segno * resto * 70, y = -Math.pow(1 - f, 2) * 140, giro = q.segno * resto * 25;
      // atterraggio: piccolo salto che si smorza, schiacciato al contatto
      const salto = Math.abs(Math.sin(b * Math.PI * 2)) * (1 - b) * 9 * (b > 0 ? 1 : 0);
      const schiaccia = b > 0 && b < 1 ? 0.08 * (1 - b) * Math.cos(b * Math.PI * 2.5) : 0;
      y -= salto;
      // posato: ondeggia piano seguendo lo scroll
      const posato = clamp((p - INIZIO - i * passo - durata) / passo) * ondeggio;
      giro += Math.sin(p * 46 + i * 1.9) * 2.2 * posato;
      y += Math.sin(p * 34 + i * 2.7) * 1.6 * posato;
      q.li.style.opacity = String(clamp(t * 5));
      q.li.style.transform = `translate(${x}vw, ${y}%) rotate(${giro}deg) scale(${1 + schiaccia * 0.6}, ${1 - schiaccia})`;
      // ombra: cresce mentre cade, si stringe durante il salto
      q.li.style.setProperty('--posato', (f * f * (1 - salto / 18)).toFixed(3));
      if (t > 0.15) { accesi[q.lato] = q.didascalia; colore = q.colore; centro = q.li; }
    });
    pezzi.forEach((q) => q.didascalia.classList.toggle('dolci__didascalia--on', accesi[q.lato] === q.didascalia && p < FINE));
    // alone dietro i macaron nel colore dell'ultimo arrivato; a fine corsa l'alone si spegne (resta l'ultimo colore, a intensità zero)
    palco.style.setProperty('--alone-forza', colore && p < FINE ? '1' : '0');
    if (colore) palco.style.setProperty('--alone', colore);
    // l'alone segue il punto in cui si posa l'ultimo arrivato (posizione nella foto, non quella in volo)
    if (centro) {
      const cx = lr.left - pr.left + lr.width * (Number(centro.dataset.x) + Number(centro.dataset.l) / 2) / L;
      const cy = lr.top - pr.top + lr.height * (Number(centro.dataset.y) + Number(centro.dataset.a) / 2) / A;
      palco.style.setProperty('--alone-x', `${(cx / pr.width * 100).toFixed(1)}%`);
      palco.style.setProperty('--alone-y', `${(cy / pr.height * 100).toFixed(1)}%`);
    }
  }
  const pianifica = () => { if (!attesa) attesa = requestAnimationFrame(disegna); };
  window.addEventListener('scroll', pianifica, { passive: true });
  window.addEventListener('resize', () => { misura(); ultimo = -1; pianifica(); });
  disegna();
}
