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
