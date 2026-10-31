window.addEventListener('load', () => {
  if (typeof CookieConsent?.run !== 'function') return;

  const inglese = document.documentElement.lang === 'en';

  CookieConsent.run({
    cookie: { name: 'cc_trattoria', expiresAfterDays: 186 },
    guiOptions: {
      consentModal: { layout: 'box', position: 'bottom left', equalWeightButtons: true },
      preferencesModal: { layout: 'box', equalWeightButtons: true }
    },
    categories: {
      necessario: { enabled: true, readOnly: true },
      misurazione: { enabled: false }
    },
    language: {
      default: inglese ? 'en' : 'it',
      translations: {
        it: {
          consentModal: {
            title: 'Cookie',
            description: 'Usiamo solo cookie tecnici, necessari a far funzionare il sito. Non profiliamo nessuno e non usiamo servizi di terze parti. Se un giorno aggiungeremo strumenti di misurazione, li troverai qui e decidi tu.',
            acceptAllBtn: 'Accetta',
            acceptNecessaryBtn: 'Rifiuta',
            showPreferencesBtn: 'Scegli tu'
          },
          preferencesModal: {
            title: 'Preferenze',
            acceptAllBtn: 'Accetta tutto',
            acceptNecessaryBtn: 'Rifiuta tutto',
            savePreferencesBtn: 'Salva le scelte',
            closeIconLabel: 'Chiudi',
            sections: [
              { title: 'Cookie tecnici', description: 'Servono a far funzionare il sito: la lingua scelta e il fatto che l’animazione di apertura sia già stata vista. Non si possono disattivare.', linkedCategory: 'necessario' },
              { title: 'Misurazione', description: 'Al momento non attiva: il sito non raccoglie alcuna statistica di visita.', linkedCategory: 'misurazione' },
              { title: 'Vuoi saperne di più?', description: 'Trovi tutto nell’<a href="/privacy/">informativa</a>.' }
            ]
          }
        },
        en: {
          consentModal: {
            title: 'Cookies',
            description: 'We only use technical cookies, needed to make the site work. We do not profile anyone and we use no third-party services. If we ever add measurement tools, you will find them here and the choice will be yours.',
            acceptAllBtn: 'Accept',
            acceptNecessaryBtn: 'Reject',
            showPreferencesBtn: 'Choose'
          },
          preferencesModal: {
            title: 'Preferences',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject all',
            savePreferencesBtn: 'Save choices',
            closeIconLabel: 'Close',
            sections: [
              { title: 'Technical cookies', description: 'They make the site work: the language you picked, and whether you have already seen the opening animation. They cannot be turned off.', linkedCategory: 'necessario' },
              { title: 'Measurement', description: 'Currently inactive: the site collects no visit statistics.', linkedCategory: 'misurazione' },
              { title: 'Want to know more?', description: 'It is all in the <a href="/en/privacy/">privacy notice</a>.' }
            ]
          }
        }
      }
    }
  });
});

const preferenze = document.querySelector('.footer__preferenze');
if (preferenze) {
  preferenze.addEventListener('click', () => {
    if (typeof CookieConsent?.showPreferences === 'function') {
      CookieConsent.showPreferences();
    }
  });
}
