/* Anteprima del pannello con la grafica del sito.
 *
 * La colonna di destra mostra menu, orari e piatti in evidenza con lo stesso
 * markup e lo stesso style.css delle pagine pubblicate. Il markup ricalca
 * scripts/genera/corpi.mjs e scripts/genera/orari.mjs: se cambia lì, va
 * cambiato anche qui, altrimenti l'anteprima mente al cliente.
 *
 * Solo italiano: la pagina inglese esce dagli stessi dati.
 * File separato e non inline: la CSP di /admin/ ammette solo script-src 'self'.
 */
(function () {
  'use strict';

  var CMS = window.CMS, h = window.h, createClass = window.createClass;
  if (!CMS || !h || !createClass) return;

  CMS.registerPreviewStyle('/assets/css/style.css');

  // Copia di contenuti/allergeni.json (solo italiano). Il pannello non legge
  // altri file del repo: la lista è chiusa per legge, non cambia.
  var ALLERGENI = {
    glutine: 'Glutine', crostacei: 'Crostacei', uova: 'Uova', pesce: 'Pesce',
    arachidi: 'Arachidi', soia: 'Soia', latte: 'Latte', 'frutta-a-guscio': 'Frutta a guscio',
    sedano: 'Sedano', senape: 'Senape', sesamo: 'Sesamo', solfiti: 'Solfiti',
    lupini: 'Lupini', molluschi: 'Molluschi'
  };

  // Le immutabili di Decap: da List/Map a array/oggetti semplici.
  function js(v) { return v && v.toJS ? v.toJS() : v; }

  function prezzo(n) {
    var x = Number(n);
    return isNaN(x) || n === '' || n == null ? '€ —' : '€ ' + x.toFixed(2).replace('.', ',');
  }

  // Come allergeniTesto + listaAllergeni in dati.mjs. In più segnala a
  // video il campo vuoto, che il build rifiuterebbe.
  function allergeni(codici) {
    var l = codici || [];
    if (!l.length) return 'Allergeni da compilare';
    if (l.indexOf('nessuno') !== -1) return '';
    return l.map(function (c, i) {
      var t = ALLERGENI[c] || c;
      return i === 0 ? t : t.toLowerCase();
    }).join(', ');
  }

  function testo(o) { return (o && o.it) || ''; }

  function pagina(figli) {
    return h('main', { id: 'contenuto' }, figli);
  }

  // ── MENU ── come corpi.menu('it')
  var Menu = createClass({
    render: function () {
      var d = js(this.props.entry.getIn(['data'])) || {};
      var sezioni = (d.sezioni || []).map(function (sez, i) {
        var voci = (sez.voci || []).map(function (v, j) {
          return h('li', { className: 'menu__voce', key: j },
            h('p', { className: 'menu__nome' }, testo(v.nome)),
            h('p', { className: 'menu__allergeni' }, allergeni(v.allergeni)),
            h('p', { className: 'menu__prezzo' }, prezzo(v.prezzo)));
        });
        return h('div', { key: i },
          h('h2', { className: 'menu__sezione' }, testo(sez.nome)),
          h('ul', { className: 'menu__lista gruppo' }, voci));
      });
      return pagina(h('section', { className: 'menu' },
        h('h1', { className: 'sezione__titolo' }, 'Il menù'), sezioni));
    }
  });

  // ── ORARI ── come la tabella di corpi.contatti('it')
  var Orari = createClass({
    render: function () {
      var d = js(this.props.entry.getIn(['data'])) || {};
      var cs = d.chiusura_stagionale || {};
      var chiuso = testo(cs.chiuso_etichetta) || 'Chiuso';
      var righe = (d.settimana || []).map(function (f, i) {
        var valore = f.chiuso ? chiuso : (f.turni || []).map(function (t) {
          return (t.apre || '') + '–' + (t.chiude || '');
        }).join(' e ');
        return h('tr', { key: i },
          h('th', { scope: 'row' }, testo(f.etichetta)),
          h('td', null, valore));
      });
      return pagina(h('section', { className: 'contatti' },
        h('h2', { className: 'contatti__voce' }, 'Orari'),
        h('div', { className: 'tabella-scorrevole' },
          h('table', { className: 'orari' }, h('tbody', null, righe))),
        h('p', { className: 'orari__nota' }, testo(cs.nota))));
    }
  });

  // ── PIATTI IN HOME ── come schedePiatti('it')
  var Piatti = createClass({
    render: function () {
      var getAsset = this.props.getAsset;
      var d = js(this.props.entry.getIn(['data'])) || {};
      var schede = (d.piatti || []).map(function (p, i) {
        var src = p.immagine ? String(getAsset(p.immagine)) : '';
        return h('li', { className: 'piatto', key: i },
          src ? h('img', { className: 'piatto__figura', src: src, alt: testo(p.alt) }) : null,
          h('h3', { className: 'piatto__nome' }, testo(p.nome)),
          h('p', { className: 'piatto__note' }, testo(p.note)),
          h('p', { className: 'piatto__allergeni' }, allergeni(p.allergeni)),
          h('p', { className: 'piatto__prezzo' }, prezzo(p.prezzo)));
      });
      return pagina(h('section', { className: 'piatti' },
        h('ul', { className: 'piatti__lista gruppo' }, schede)));
    }
  });

  CMS.registerPreviewTemplate('menu', Menu);
  CMS.registerPreviewTemplate('orari', Orari);
  CMS.registerPreviewTemplate('piatti', Piatti);
})();
