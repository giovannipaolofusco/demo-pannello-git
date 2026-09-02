/* Preprocessa le immagini caricate dal pannello, PRIMA che Decap le committi.
 *
 * Tre cose, in quest'ordine — e l'ordine è il punto:
 *   1. legge l'orientamento dall'EXIF
 *   2. ridisegna su canvas applicando la rotazione
 *   3. esporta in JPEG, senza alcun metadato
 *
 * Il canvas ricrea l'immagine da zero: i metadati non sopravvivono.
 * Ma la rotazione va LETTA PRIMA, altrimenti una foto verticale esce
 * girata di 90 gradi — è il difetto classico di questa operazione.
 *
 * Esporta JPEG e non WebP perché il generatore si aspetta il .jpg come
 * sorgente e produce il .webp durante il build.
 */
(function () {
  'use strict';

  var LATO_MAX = 2000;   // px
  var QUALITA  = 0.82;

  // Legge il tag Orientation (0x0112) dall'header EXIF di un JPEG.
  function leggiOrientamento(buffer) {
    var v = new DataView(buffer);
    if (v.getUint16(0, false) !== 0xFFD8) return 1;      // non è un JPEG
    var off = 2, len = v.byteLength;
    while (off < len) {
      if (v.getUint16(off, false) !== 0xFFE1) {
        if ((v.getUint16(off, false) & 0xFF00) !== 0xFF00) return 1;
        off += 2 + v.getUint16(off + 2, false);
        continue;
      }
      if (v.getUint32(off + 4, false) !== 0x45786966) return 1;  // "Exif"
      var tiff = off + 10;
      var little = v.getUint16(tiff, false) === 0x4949;
      var ifd = tiff + v.getUint32(tiff + 4, little);
      var n = v.getUint16(ifd, little);
      for (var i = 0; i < n; i++) {
        var tag = ifd + 2 + i * 12;
        if (v.getUint16(tag, little) === 0x0112) return v.getUint16(tag + 8, little);
      }
      return 1;
    }
    return 1;
  }

  function trasforma(ctx, o, w, h) {
    switch (o) {
      case 2: ctx.transform(-1, 0, 0, 1, w, 0); break;
      case 3: ctx.transform(-1, 0, 0, -1, w, h); break;
      case 4: ctx.transform(1, 0, 0, -1, 0, h); break;
      case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
      case 6: ctx.transform(0, 1, -1, 0, h, 0); break;
      case 7: ctx.transform(0, -1, -1, 0, h, w); break;
      case 8: ctx.transform(0, -1, 1, 0, 0, w); break;
    }
  }

  function elabora(file) {
    return new Promise(function (risolvi, rifiuta) {
      var fr = new FileReader();
      fr.onload = function () {
        var orient = 1;
        try { orient = leggiOrientamento(fr.result); } catch (e) { orient = 1; }

        var blob = new Blob([fr.result], { type: file.type });
        var url  = URL.createObjectURL(blob);
        var img  = new Image();

        img.onload = function () {
          var ruotata = orient >= 5 && orient <= 8;
          var w = ruotata ? img.height : img.width;
          var h = ruotata ? img.width  : img.height;

          var k = Math.min(1, LATO_MAX / Math.max(w, h));
          var W = Math.round(w * k), H = Math.round(h * k);

          var c = document.createElement('canvas');
          c.width = W; c.height = H;
          var ctx = c.getContext('2d');
          trasforma(ctx, orient, W, H);
          ctx.drawImage(img, 0, 0, ruotata ? H : W, ruotata ? W : H);
          URL.revokeObjectURL(url);

          c.toBlob(function (out) {
            if (!out) { rifiuta(new Error('conversione fallita')); return; }
            var nome = file.name.replace(/\.[^.]+$/, '') + '.jpg';
            var f = new File([out], nome, { type: 'image/jpeg' });
            console.info('[immagini] ' + file.name +
              ' — orientamento ' + orient +
              ' — ' + Math.round(file.size / 1024) + ' KB → ' + Math.round(out.size / 1024) + ' KB' +
              ' — ' + W + '×' + H);
            risolvi(f);
          }, 'image/jpeg', QUALITA);
        };

        img.onerror = function () { URL.revokeObjectURL(url); rifiuta(new Error('immagine illeggibile')); };
        img.src = url;
      };
      fr.onerror = function () { rifiuta(new Error('lettura fallita')); };
      fr.readAsArrayBuffer(file);
    });
  }

  window.CMS.registerEventListener({
    name: 'preSave',
    handler: function () { /* nulla: l'elaborazione è sull'upload */ }
  });

  // Intercetta la selezione del file nel media library di Decap.
  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (!t || t.type !== 'file' || !t.files || !t.files.length) return;

    var originali = Array.prototype.slice.call(t.files);
    if (!originali.some(function (f) { return /^image\//.test(f.type); })) return;
    if (t.dataset.giaElaborato === '1') { t.dataset.giaElaborato = ''; return; }

    ev.stopImmediatePropagation();
    ev.preventDefault();

    Promise.all(originali.map(function (f) {
      return /^image\//.test(f.type) ? elabora(f) : Promise.resolve(f);
    })).then(function (nuovi) {
      var dt = new DataTransfer();
      nuovi.forEach(function (f) { dt.items.add(f); });
      t.files = dt.files;
      t.dataset.giaElaborato = '1';
      t.dispatchEvent(new Event('change', { bubbles: true }));
    }).catch(function (e) {
      console.error('[immagini] elaborazione fallita, carico gli originali:', e);
      t.dataset.giaElaborato = '1';
      t.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }, true);
})();
