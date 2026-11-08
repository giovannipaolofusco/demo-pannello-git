# Demo: sito per ristorante con pannello di modifica

**Italiano** · [English](#english)

Sito dimostrativo di una trattoria inventata, la *Trattoria del Molo*. Mostra come lavoro sui siti delle attività locali: sito statico veloce, in italiano e inglese, che il titolare aggiorna da solo da un pannello, senza database e senza canone mensile.

- **Sito:** https://demo-pannello-git.pages.dev
- **Dati:** tutti inventati (indirizzo, telefono, email `example.invalid`).

## Cosa mostra

| Funzione | Come è fatta |
|---|---|
| Menu, piatti, allergeni, orari, eventi | File JSON in `contenuti/`, modificabili dal pannello |
| Pannello di modifica | [Decap CMS](https://decapcms.org) in `admin/`, accesso con GitHub tramite un Worker OAuth su Cloudflare |
| Generazione delle pagine | Script Node in `scripts/` che costruiscono l'HTML dai JSON |
| Eventi nel calendario | File `.ics` generati per ogni evento |
| Biglietto da visita | File `.vcf` scaricabile |
| Ottimizzazione | HTML, CSS e JS minificati, immagini convertite con `sharp` |
| Hosting | Cloudflare Pages, deploy automatico a ogni salvataggio |
| Backup | GitHub Actions copia contenuti e storia su Backblaze B2 ogni lunedì. Un secondo workflow, lanciato a mano, scarica l'archivio e prova il ripristino |
| Controlli | Una Action verifica che il pannello punti a questo repository |

## Come funziona per il titolare

1. Entra nel pannello `/admin/` con il suo account.
2. Cambia un piatto, un orario o un evento.
3. Salva: la modifica diventa un commit, Cloudflare Pages ricostruisce il sito da solo.

Ogni modifica resta nella storia di git, quindi si può sempre tornare indietro.

## Avvio in locale

```bash
npm install
npm run build
npx serve dist
```

Serve Node 22.

## Autore

Giovanni Paolo Fusco, sviluppatore web a Fondi (LT). Sito: https://giovannipaolofusco.it

---

## English

Demo website for a fictional restaurant, *Trattoria del Molo*. It shows how I build sites for local businesses: a fast static site in Italian and English that the owner updates from an editing panel, with no database and no monthly fee.

- **Live site:** https://demo-pannello-git.pages.dev
- **Data:** all fictional.

**What it shows**

- Menu, dishes, allergens, opening hours and events stored as JSON in `contenuti/`, edited through [Decap CMS](https://decapcms.org) in `admin/` with GitHub login via a Cloudflare OAuth Worker.
- Node scripts in `scripts/` generate the HTML and `.ics` calendar files, a `.vcf` contact card is downloadable; HTML, CSS and JS are minified and images optimized with `sharp`.
- Hosted on Cloudflare Pages with automatic deploys on every save.
- Weekly GitHub Actions backup of content and git history to Backblaze B2, plus a manual workflow that downloads the archive and tests the restore.

**Run locally:** `npm install && npm run build && npx serve dist` (Node 22).

**Author:** Giovanni Paolo Fusco, web developer in Fondi, Italy. https://giovannipaolofusco.it
