const attiva = document.querySelector('.testata__attiva-menu');
const menu = document.querySelector('.navigazione');
if (attiva && menu) {
  attiva.addEventListener('click', () => {
    const aperto = menu.dataset.aperto === 'si';
    menu.dataset.aperto = aperto ? 'no' : 'si';
    attiva.setAttribute('aria-expanded', String(!aperto));
  });
}

const preferisceFermo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const daRivelare = document.querySelectorAll('.rivela');

if (!preferisceFermo && 'IntersectionObserver' in window && daRivelare.length) {
  daRivelare.forEach((el) => { el.dataset.fuori = 'si'; });

  const entrata = new IntersectionObserver((voci) => {
    voci.forEach((voce) => { if (voce.isIntersecting) voce.target.dataset.fuori = 'no'; });
  }, { threshold: 0.12 });

  const uscita = new IntersectionObserver((voci) => {
    voci.forEach((voce) => { if (!voce.isIntersecting) voce.target.dataset.fuori = 'si'; });
  }, { threshold: 0 });

  daRivelare.forEach((el) => { entrata.observe(el); uscita.observe(el); });
}

if (sessionStorage.getItem('apertura')) document.body.classList.remove('apre');
else sessionStorage.setItem('apertura', '1');

const bottoniCopia = document.querySelectorAll('.copia-indirizzo');
bottoniCopia.forEach((b) => {
  b.addEventListener('click', async () => {
    const testo = b.dataset.indirizzo || '';
    const originale = b.textContent;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(testo);
      else throw new Error('senza clipboard');
      b.dataset.esito = 'fatto';
      b.textContent = document.documentElement.lang === 'en' ? 'Copied' : 'Copiato';
    } catch {
      b.textContent = testo;
      b.dataset.esito = 'manuale';
    }
    setTimeout(() => { b.textContent = originale; delete b.dataset.esito; }, 2500);
  });
});

// Condividi (CLAUDE.md §13bis.6): nessun widget di terzi. Il pulsante nasce
// nascosto e compare solo con JavaScript. Catena: condivisione nativa del
// sistema -> copia del link -> indirizzo mostrato in chiaro da copiare a mano.
const condividi = document.querySelector('[data-condividi]');
if (condividi) {
  const ripiego = document.querySelector('.condividi__ripiego');
  const mostraIndirizzo = () => {
    if (!ripiego) return;
    ripiego.querySelector('.condividi__indirizzo').textContent = location.href;
    ripiego.hidden = false;
  };
  condividi.hidden = false;
  condividi.addEventListener('click', async () => {
    const dati = { title: document.title, url: location.href };
    if (typeof navigator.share === 'function') {
      try { await navigator.share(dati); return; }
      catch (e) { if (e && e.name === 'AbortError') return; }
    }
    try {
      if (!navigator.clipboard?.writeText) throw new Error('senza clipboard');
      await navigator.clipboard.writeText(location.href);
      const originale = condividi.textContent;
      condividi.textContent = condividi.dataset.copiato || originale;
      setTimeout(() => { condividi.textContent = originale; }, 2500);
    } catch {
      mostraIndirizzo();
    }
  });
}
