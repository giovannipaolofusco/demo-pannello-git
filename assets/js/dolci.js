// Pagina dolci, vetrina: un macaron per schermata nel colore del suo gusto,
// poi la scatola con tutti. Senza JS, o con "riduci movimento", resta la
// griglia con foto, nome e descrizione.
const sezione = document.querySelector('[data-dolci]');
const fermo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (sezione && !fermo) {
  const lista = sezione.querySelector('.dolci__lista');
  const voci = [...lista.querySelectorAll('.dolce')];
  const n = voci.length;
  const crea = (tag, classe, testo) => {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (testo) el.textContent = testo;
    return el;
  };
  const due = (v) => String(v).padStart(2, '0');

  const gusti = voci.map((li) => {
    // la classe .rivela di main.js qui non serve: il movimento lo guida lo scroll
    li.classList.remove('rivela');
    delete li.dataset.fuori;
    const img = li.querySelector('.dolce__foto');
    return {
      src: img.getAttribute('src'), w: img.getAttribute('width'), h: img.getAttribute('height'),
      l: Number(li.dataset.l), colore: li.dataset.colore,
      nome: li.querySelector('.dolce__nome').textContent, nota: li.querySelector('.dolce__nota').textContent,
    };
  });
  const foto = (g, classe) => {
    const img = crea('img', classe);
    img.src = g.src; img.alt = ''; img.width = g.w; img.height = g.h; img.decoding = 'async';
    return img;
  };

  // Palco: fermo a tutta larghezza dentro una scena alta da scorrere. Lo vedono
  // gli occhi; per gli screen reader resta la lista originale, nascosta a vista.
  const scena = crea('div', 'dolci__scena');
  const palco = crea('div', 'dolci__palco');
  palco.setAttribute('aria-hidden', 'true');
  const giganti = gusti.map((g) => {
    const p = crea('p', 'dolci__gigante', g.nome);
    p.style.setProperty('--gusto', g.colore);
    return p;
  });
  // il contenitore porta posizione, scala e ombra; ruota solo l'immagine, così l'ombra resta in basso
  const pezzi = gusti.map((g) => {
    const pezzo = crea('div', 'dolci__pezzo');
    pezzo.style.maxWidth = `${g.l}px`;
    pezzo.style.setProperty('--gusto', g.colore);
    pezzo.append(foto(g));
    return pezzo;
  });
  const didascalia = crea('div', 'dolci__didascalia');
  const contatore = crea('p', 'dolci__contatore'), nome = crea('p', 'dolci__nome'), nota = crea('p', 'dolci__nota');
  didascalia.append(contatore, nome, nota);
  const scatola = crea('div', 'dolci__scatola');
  const cassa = crea('div', 'dolci__cassa'), griglia = crea('ul', 'dolci__griglia');
  const celle = gusti.map((g) => {
    const li = crea('li');
    li.append(foto(g), crea('span', '', g.nome));
    griglia.append(li);
    return li;
  });
  cassa.append(griglia);
  scatola.append(crea('p', 'occhiello', 'La scatola'), cassa);
  palco.append(...giganti, ...pezzi, didascalia, scatola);
  scena.append(palco);
  lista.after(scena);
  sezione.classList.add('dolci--scena');

  // scroll: 100vh per gusto, poi una schermata e mezza per la scatola
  const GUSTO = 100, SCATOLA = 150;
  const quotaGusti = (n * GUSTO) / (n * GUSTO + SCATOLA);
  const testata = document.querySelector('.testata');
  const misura = () => {
    const h = testata ? testata.offsetHeight : 0;
    palco.style.top = `${h}px`;
    palco.style.height = `calc(100dvh - ${h}px)`;
    scena.style.height = `calc(100dvh - ${h}px + ${n * GUSTO + SCATOLA}vh)`;
  };
  misura();

  const clamp = (v) => Math.min(1, Math.max(0, v));
  const curva = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const frena = (t) => 1 - Math.pow(1 - t, 3);

  let ultimo = -1, attesa = 0, attuale = -1;
  function disegna() {
    attesa = 0;
    // letture del layout prima di ogni scrittura di stile
    const r = scena.getBoundingClientRect(), pr = palco.getBoundingClientRect();
    const corsa = r.height - pr.height;
    const p = corsa > 0 ? clamp((pr.top - r.top) / corsa) : 1;
    if (Math.abs(p - ultimo) < 0.0005) return;
    ultimo = p;

    // s: posizione in gusti. Ogni gusto entra rotolando in [-0.25, 0.1], resta fermo
    // fino a 0.5 (40vh), esce verso l'alto in [0.5, 1]: il successivo parte quando l'uscita è a metà.
    // L'ultimo esce all'inizio della scatola.
    const b = clamp((p - quotaGusti) / (1 - quotaGusti));
    const s = p < quotaGusti ? (p / quotaGusti) * n - 0.5 : n - 0.5 + clamp(b / 0.4) * 0.5;
    pezzi.forEach((pezzo, i) => {
      const k = s - i;
      // dispari (01, 03…) da sinistra, pari da destra; il verso della rotazione segue la marcia
      const lato = i % 2 === 0 ? -1 : 1;
      const entra = frena(clamp((k + 0.25) / 0.35)), esce = curva(clamp((k - 0.5) / 0.5));
      const x = lato * 70 * (1 - entra), y = -70 * esce;
      const giro = lato * 360 * (1 - entra) + 10 * esce, scala = 0.9 + 0.1 * entra - 0.1 * esce;
      pezzo.style.opacity = String(k < -0.25 ? 0 : 1 - esce);
      pezzo.style.transform = `translate(-50%, -50%) translate(${x.toFixed(2)}vw, ${y.toFixed(2)}vh) scale(${scala.toFixed(3)})`;
      pezzo.firstChild.style.transform = `rotate(${giro.toFixed(1)}deg)`;
      // il nome uscente sparisce entro k=0.75, l'entrante compare da k=-0.25: mai due nomi insieme
      const nomeVisibile = curva(clamp((k + 0.25) / 0.25)) * (1 - curva(clamp((k - 0.5) / 0.25)));
      giganti[i].style.opacity = String((0.22 * nomeVisibile).toFixed(3));
      giganti[i].style.transform = `translate(calc(-50% + ${(9 - 18 * clamp((k + 0.5) / 1.5)).toFixed(2)}vw), -50%)`;
    });

    const nellaScatola = b > 0.15;
    const i = Math.min(n - 1, Math.max(0, Math.floor(s + 0.25)));
    palco.style.setProperty('--gusto', nellaScatola ? 'var(--crema)' : gusti[i].colore);
    if (i !== attuale) {
      attuale = i;
      contatore.textContent = `${due(i + 1)} / ${due(n)}`;
      nome.textContent = gusti[i].nome;
      nota.textContent = gusti[i].nota;
      if (didascalia.animate) {
        didascalia.animate([{ opacity: 0, transform: 'translateY(.8rem)' }, { opacity: 1, transform: 'none' }], { duration: 350, easing: 'ease-out' });
      }
    }
    didascalia.classList.toggle('dolci__didascalia--via', nellaScatola);

    const vede = curva(clamp((b - 0.25) / 0.35));
    scatola.style.opacity = String(vede);
    scatola.style.transform = `translate(-50%, calc(-50% + ${((1 - vede) * 4).toFixed(2)}rem)) scale(${(0.94 + 0.06 * vede).toFixed(3)})`;
    celle.forEach((c, j) => {
      const t = clamp((b - 0.35 - j * 0.03) / 0.15);
      c.style.opacity = String(t);
      c.style.transform = `translateY(${((1 - t) * 0.8).toFixed(2)}rem)`;
    });
  }
  const pianifica = () => { if (!attesa) attesa = requestAnimationFrame(disegna); };
  window.addEventListener('scroll', pianifica, { passive: true });
  window.addEventListener('resize', () => { misura(); ultimo = -1; pianifica(); });
  disegna();
}
