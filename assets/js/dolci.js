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
    return { li, lato, didascalia: d, segno: lato === 'sx' ? -1 : 1 };
  });

  const clamp = (v) => Math.min(1, Math.max(0, v));
  const esci = (t) => 1 - Math.pow(1 - t, 3);
  // fasi: 0-.04 tavola vuota, poi un arrivo per pezzo, ultimo 10% fermo sulla composizione
  const INIZIO = 0.04, FINE = 0.9;
  const passo = (FINE - INIZIO) / (pezzi.length + 0.6), durata = passo * 1.6;

  let ultimo = -1, attesa = 0;
  function disegna() {
    attesa = 0;
    const r = scena.getBoundingClientRect(), corsa = r.height - window.innerHeight;
    const p = corsa > 0 ? clamp(-r.top / corsa) : 1;
    if (Math.abs(p - ultimo) < 0.0005) return;
    ultimo = p;
    const accesi = { sx: null, dx: null };
    pezzi.forEach((q, i) => {
      const t = clamp((p - INIZIO - i * passo) / durata), e = esci(t), resto = 1 - e;
      q.li.style.opacity = String(clamp(t * 4));
      q.li.style.transform = `translate(${q.segno * resto * 70}vw, ${-Math.sin(t * Math.PI) * 4}%) rotate(${q.segno * resto * 20}deg)`;
      q.li.style.setProperty('--posato', e.toFixed(3));
      if (t > 0.15) accesi[q.lato] = q.didascalia;
    });
    pezzi.forEach((q) => q.didascalia.classList.toggle('dolci__didascalia--on', accesi[q.lato] === q.didascalia && p < FINE));
  }
  const pianifica = () => { if (!attesa) attesa = requestAnimationFrame(disegna); };
  window.addEventListener('scroll', pianifica, { passive: true });
  window.addEventListener('resize', () => { misura(); ultimo = -1; pianifica(); });
  disegna();
}
