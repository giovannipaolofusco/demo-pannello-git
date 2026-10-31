const contenitore = document.getElementById('mappa');

if (contenitore && typeof maplibregl !== 'undefined') {
  // Coordinate dal campo "Coordinate esatte della sede" di AGENTS.md.
  // MapLibre vuole [lon, lat]: invertirle manda la sede in mare.
  const LON = 13.43040;
  const LAT = 41.37995;

  const avvia = async () => {
    const stile = await (await fetch('/assets/map/stile.json')).json();
    // MapLibre rifiuta un percorso relativo per lo sprite e lo segnala solo
    // come warning per ogni icona mancante: la mappa si disegna senza POI.
    stile.sprite = new URL(stile.sprite, location.origin).href;
    // Stesso discorso per le tessere, che i worker di MapLibre scaricano da
    // un URL blob: senza origine. Niente new URL(): codificherebbe {z}/{x}/{y}.
    const sorgente = stile.sources.protomaps;
    sorgente.tiles = sorgente.tiles.map((t) => location.origin + t);

    const mappa = new maplibregl.Map({
      container: 'mappa',
      style: stile,
      center: [LON, LAT],
      zoom: 15,
      minZoom: 12,
      maxZoom: 15,
      // Il credito ODbL arriva dall'attribution della sorgente in stile.json.
      attributionControl: { compact: false }
    });

    // WCAG 2.5.7: la mappa si sposta col trascinamento, quindi servono
    // anche comandi a singolo puntatore.
    mappa.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    // Lo sprite di Protomaps non copre tutte le icone che lo stile richiede
    // (es. "townhall"): senza questo, ogni POI scoperto lascia un warning in
    // console e MapLibre lo ridomanda a ogni ridisegno.
    mappa.on('styleimagemissing', (e) => {
      if (!mappa.hasImage(e.id)) {
        mappa.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
      }
    });

    mappa.on('load', () => {
      new maplibregl.Marker({ color: '#9C4221' }).setLngLat([LON, LAT]).addTo(mappa);
      contenitore.dataset.stato = 'pronta';
    });

    mappa.on('error', () => { contenitore.dataset.stato = 'errore'; });
  };

  avvia().catch(() => { contenitore.dataset.stato = 'errore'; });
}
