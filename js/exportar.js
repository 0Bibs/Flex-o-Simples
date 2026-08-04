/* ---------------------------------------------------------------------------
   Flexo Simples - exportacao do resultado como imagem

   Monta uma folha de resultados em SVG a partir do que ja esta no relatorio
   (titulos, linhas de texto e os desenhos) e rasteriza para PNG no proprio
   navegador, via canvas. Sem biblioteca externa e sem rede: funciona offline
   e com a pagina aberta por duplo clique.

   A folha nao e um print da tela: deixa de fora o painel de entrada e a
   moldura da janela, e acrescenta um cabecalho de identificacao, que e o que
   um memorial de calculo precisa.
   --------------------------------------------------------------------------- */
(function (root) {
  'use strict';

  var FS = (root.FS = root.FS || {});

  /* A folha e estreita de proposito. Colada no Word, a imagem e reduzida
     ate a largura util da pagina (~16 cm), e o que decide se o texto fica
     legivel nao e o tamanho da fonte em si, mas a razao entre ela e a
     largura da folha. Com 760 unidades e corpo em 16, o texto sai por volta
     de 9,5 pt no documento. Alargar a folha encolhe tudo de novo. */
  var LARG = 760;               /* largura da folha, em unidades do SVG */
  var MARG = 30;
  var CORPO = 16;               /* tamanho das linhas do relatorio */
  var INSET_FIG = 10;           /* respiro lateral das figuras */
  var FONTE_DESENHO = 12;       /* '.dg text' — a legenda dentro dos desenhos */
  var ALVO_LEGENDA = 15;        /* como ela deve sair, em unidades da folha */
  var ESCALA = 2;               /* rasteriza em 2x: fica nitido impresso */
  var CHAVE_ID = 'flexo-simples-identificacao';

  /* barra: fundo do cabecalho · marca: a palavra SIMPLES · filete: a linha
     sob o cabecalho · acento: o filete antes de cada titulo de secao */
  var TEMAS = {
    classico: { barra: '#1f6fc4', barraTxt: '#ffffff', marca: '#ffffff',
      filete: '#17558f', titulo: '#2e75b6', acento: '#1f6fc4' },
    corporativo: { barra: '#2b2b2b', barraTxt: '#f1f1f1', marca: '#ffc20e',
      filete: '#ffc20e', titulo: '#2b2b2b', acento: '#ffc20e' }
  };

  /* As classes dos desenhos vivem na folha de estilo da pagina. Na folha
     exportada elas precisam viajar junto, entao sao repetidas aqui.
     O teste test/exportar.test.js confere que nenhuma classe usada pelos
     desenhos ficou de fora desta lista. */
  var ESTILO_DESENHOS =
    '.dg text{font-size:12px;fill:#3c3c3c}' +
    '.dg .sub{font-size:9px}' +
    '.dg-secao{fill:#f2f2f2;stroke:#8c8c8c;stroke-width:1.2}' +
    '.dg-quebra{fill:none;stroke:#8c8c8c;stroke-width:1.2}' +
    '.dg-as{fill:#c00000}' +
    '.dg-ln{stroke:#3aa84f;stroke-width:1.2;stroke-dasharray:16 4 2 4}' +
    '.dg-eps-area{fill:#bcd9ef;fill-opacity:.8}' +
    '.dg-eps-lin{fill:none;stroke:#2e75b6;stroke-width:1.7}' +
    '.dg-eixo{stroke:#4d4d4d;stroke-width:1.2}' +
    '.dg-bloco{fill:#dedede;stroke:#8c8c8c;stroke-width:1}' +
    '.dg-quadro{fill:none;stroke:#c8c8c8;stroke-width:1}' +
    '.dg-aux{stroke:#e0e0e0;stroke-width:1}' +
    '.dg-lim{stroke:#9e9e9e;stroke-width:1}' +
    '.dg-arco{fill:none;stroke:#bdbdbd;stroke-width:1}' +
    '.dg-pivo{fill:#3c3c3c}' +
    '.dg-cota{stroke:#3aa84f;stroke-width:1.1}' +
    '.dg-cota-pt{fill:#3aa84f}' +
    '.dg-cota-txt{fill:#3aa84f;font-size:12px;text-anchor:middle}' +
    '.dg-cota-txt-h{fill:#3aa84f;font-size:12px}' +
    '.dg-verde-f{fill:#3aa84f}' +
    '.dg-cinza-f{fill:#8f8f8f}' +
    '.dg-verm-f{fill:#c00000}' +
    '.dg-forca-c{stroke:#8f8f8f;stroke-width:1.4}' +
    '.dg-forca-t{stroke:#c00000;stroke-width:1.4}' +
    '.dg-txt-forca-c{fill:#a6a6a6;font-size:15px}' +
    '.dg-txt-forca-t{fill:#c00000;font-size:15px}' +
    '.dg-txt-azul{fill:#2e75b6}' +
    '.dg-txt-cinza{fill:#7f7f7f}' +
    '.dg-txt-verm{fill:#c00000}' +
    '.dg-titulo{fill:#a6a6a6;font-size:16px}' +
    '.dg-num{fill:#b4b4b4;font-size:19px}' +
    '.dg-num-p{fill:#b4b4b4;font-size:11px}' +
    '.dg-estribo{fill:none;stroke:#c00000;stroke-width:2}' +
    '.dg-estribo-ramo{stroke:#c00000;stroke-width:2}' +
    '.dg-barra{fill:#7a2020}' +
    '.dg-parede{fill:#cfe0f1;stroke:none}' +
    '.dg-secao-vazio{fill:none;stroke:#6f6f6f;stroke-width:1.2}' +
    '.dg-linha-media{fill:none;stroke:#2e75b6;stroke-width:1;stroke-dasharray:5 3}' +
    '.dg-txt-destaque{fill:#1a1a1a;font-size:15px;font-weight:600}' +
    '.dg-trilho{fill:#eeeeee;stroke:#dcdcdc;stroke-width:1}' +
    '.dg-barra-boa{fill:#4a9d5f}' +
    '.dg-barra-ruim{fill:#c0392b}' +
    '.dg-limite{stroke:#9a9a9a;stroke-width:1;stroke-dasharray:4 3}';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function n(v) { return Math.round(v * 100) / 100; }
  /* Largura de um texto, para decidir a divisao em colunas. O canvas mede
     com a mesma fonte da folha, entao o resultado e exato; a estimativa por
     caractere so entra quando nao ha canvas (nos testes, fora do navegador). */
  var FONTE = '"Segoe UI",Tahoma,Geneva,Verdana,sans-serif';
  function medir(texto, tam) {
    if (medir.ctx === undefined) {
      try { medir.ctx = document.createElement('canvas').getContext('2d'); }
      catch (e) { medir.ctx = null; }
    }
    if (!medir.ctx) return texto.length * tam * 0.52;
    medir.ctx.font = tam + 'px ' + FONTE;
    return medir.ctx.measureText(texto).width;
  }
  function maiorLargura(linhas, tam) {
    return linhas.reduce(function (m, t) { return Math.max(m, medir(t, tam)); }, 0);
  }
  function txt(x, y, tam, cor, conteudo, extra) {
    return '<text x="' + n(x) + '" y="' + n(y) + '" font-size="' + tam + '" fill="' + cor +
      '"' + (extra || '') + '>' + esc(conteudo) + '</text>';
  }

  /* ------------------------------------------------ identificacao */
  var CAMPOS = ['projeto', 'elemento', 'responsavel', 'revisao'];

  function campoId(c) {
    return document.getElementById('id' + c.charAt(0).toUpperCase() + c.slice(1));
  }

  function lerIdentificacao() {
    var id = {};
    CAMPOS.forEach(function (c) {
      var el = campoId(c);
      id[c] = el ? el.value.trim() : '';
    });
    return id;
  }

  function guardarIdentificacao() {
    try { localStorage.setItem(CHAVE_ID, JSON.stringify(lerIdentificacao())); } catch (e) { /**/ }
  }

  function restaurarIdentificacao() {
    var dados;
    try { dados = JSON.parse(localStorage.getItem(CHAVE_ID) || '{}'); } catch (e) { return; }
    CAMPOS.forEach(function (c) {
      var el = campoId(c);
      if (el && dados[c]) el.value = dados[c];
    });
  }

  function dataDeHoje() {
    var d = new Date();
    var p = function (v) { return (v < 10 ? '0' : '') + v; };
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  /* ------------------------------------------------ leitura do relatorio
     Percorre o relatorio ja renderizado: o que sai na folha e exatamente o
     que esta na tela, sem repetir a logica de formatacao em outro lugar.
     Blocos escondidos pelo modo atual (display:none) ficam de fora. */
  function coletar() {
    var saida = { titulo: '', blocos: [] };
    var rel = document.getElementById('relatorio');
    if (rel) percorrer(rel, saida);
    return saida;
  }

  function percorrer(pai, saida) {
    Array.prototype.forEach.call(pai.children, function (el) {
      var cl = el.classList;
      if (el.tagName === 'HR' || cl.contains('faixa') || cl.contains('rodape')) return;
      if (el.offsetParent === null) return;              /* escondido pelo modo */

      if (el.tagName === 'H1') { saida.titulo = el.textContent.trim(); return; }

      if (el.tagName === 'H2' || el.tagName === 'H3') {
        saida.blocos.push({ tipo: 'titulo', nivel: el.tagName === 'H2' ? 2 : 3,
          texto: el.textContent.trim() });
        return;
      }
      if (cl.contains('aviso')) {
        saida.blocos.push({ tipo: 'aviso', texto: el.textContent.trim() });
        return;
      }
      if (cl.contains('figura')) {
        var svg = el.querySelector('svg');
        if (svg) saida.blocos.push({ tipo: 'figura', svg: svg });
        return;
      }
      if (cl.contains('bloco')) {
        var linhas = [];
        Array.prototype.forEach.call(el.querySelectorAll('p'), function (p) {
          var t = p.textContent.trim();
          if (t) linhas.push(t);
        });
        if (linhas.length) saida.blocos.push({ tipo: 'texto', linhas: linhas });
        return;
      }
      /* qualquer outro contêiner (os agrupamentos por modo do cisalhamento,
         a caixa de avisos): desce um nível */
      percorrer(el, saida);
    });
  }

  /* Recorta o desenho no que ele realmente ocupa. Na tela a folga em volta
     nao incomoda; na folha exportada ela e o que empurra as legendas para
     um tamanho ilegivel depois que o Word reduz a imagem. getBBox devolve
     a caixa do conteudo em unidades do proprio viewBox. */
  function enquadrar(svg) {
    var vb = (svg.getAttribute('viewBox') || '0 0 720 300').split(/\s+/).map(Number);
    if (typeof svg.getBBox !== 'function') return vb;
    var cx;
    try { cx = svg.getBBox(); } catch (e) { return vb; }
    if (!cx || !(cx.width > 1) || !(cx.height > 1)) return vb;
    var folga = 10;
    /* nunca alem do viewBox declarado: e ele que define o que e "dentro" */
    var x0 = Math.max(vb[0], cx.x - folga);
    var y0 = Math.max(vb[1], cx.y - folga);
    return [x0, y0,
      Math.min(vb[0] + vb[2], cx.x + cx.width + folga) - x0,
      Math.min(vb[1] + vb[3], cx.y + cx.height + folga) - y0];
  }

  /* ------------------------------------------------ montagem da folha */
  function montarSvg() {
    var dados = coletar();
    var id = lerIdentificacao();
    var tema = document.documentElement.getAttribute('data-tema') === 'corporativo'
      ? 'corporativo' : 'classico';
    var c = TEMAS[tema];
    var selNorma = document.getElementById('norma');
    var norma = selNorma ? selNorma.value : '';

    var corpo = '';
    var y = 0;

    /* --- barra da marca --- */
    corpo += '<rect x="0" y="0" width="' + LARG + '" height="54" fill="' + c.barra + '"/>';
    corpo += '<rect x="0" y="54" width="' + LARG + '" height="4" fill="' + c.filete + '"/>';
    corpo += '<text x="' + MARG + '" y="36" font-size="24" font-weight="700" ' +
      'letter-spacing="1" fill="none" stroke="' + c.barraTxt + '" stroke-width="1.1">FLEXO</text>';
    corpo += '<text x="' + (MARG + 90) + '" y="36" font-size="24" font-weight="700" ' +
      'letter-spacing="1" fill="' + c.marca + '">SIMPLES</text>';
    corpo += txt(LARG - MARG, 36, 16.5, c.barraTxt, dados.titulo, ' text-anchor="end"');
    y = 58;

    /* --- identificacao --- */
    var linhasId = [
      ['Projeto', id.projeto || '—'],
      ['Elemento', id.elemento || '—'],
      ['Responsável', id.responsavel || '—'],
      ['Revisão', id.revisao || '—'],
      ['Data', dataDeHoje()],
      ['Norma', norma ? 'ABNT NBR 6118:' + norma : '—']
    ];
    var altId = 46 + Math.ceil(linhasId.length / 2) * 27;
    corpo += '<rect x="' + MARG + '" y="' + (y + 20) + '" width="' + (LARG - 2 * MARG) +
      '" height="' + altId + '" fill="#fafafa" stroke="#dcdcdc"/>';
    corpo += '<text x="' + (MARG + 16) + '" y="' + (y + 44) + '" font-size="12.5" ' +
      'letter-spacing="1.6" fill="#8a8a8a">IDENTIFICAÇÃO</text>';
    linhasId.forEach(function (par, i) {
      var col = i % 2, lin = Math.floor(i / 2);
      var xi = MARG + 16 + col * ((LARG - 2 * MARG - 32) / 2);
      var yi = y + 74 + lin * 27;
      corpo += txt(xi, yi, 14.5, '#7a7a7a', par[0]);
      corpo += txt(xi + 96, yi, 15, '#1a1a1a', par[1], ' font-weight="600"');
    });
    y += 20 + altId + 22;

    /* --- corpo do relatorio --- */
    dados.blocos.forEach(function (b) {
      if (b.tipo === 'titulo') {
        y += b.nivel === 2 ? 32 : 24;
        var tam = b.nivel === 2 ? 21 : 17;
        corpo += '<rect x="' + MARG + '" y="' + n(y - tam + 2) + '" width="4.5" height="' +
          n(tam + 5) + '" fill="' + (b.nivel === 2 ? c.acento : '#d0d0d0') + '"/>';
        corpo += txt(MARG + 15, y, tam, c.titulo, b.texto, ' font-weight="600"');
        y += 7;
      } else if (b.tipo === 'texto') {
        /* Blocos longos saem em duas colunas: a folha fica menos comprida e
           cabe melhor no documento. As colunas nao sao metades iguais — a
           segunda comeca onde a primeira realmente termina —, senao uma
           unica linha comprida jogaria o bloco inteiro para uma coluna so. */
        var esq = MARG + 15;
        var util = LARG - MARG - esq;
        var porCol = Math.ceil(b.linhas.length / 2);
        var x2 = 0;
        if (b.linhas.length >= 4) {
          var l1 = maiorLargura(b.linhas.slice(0, porCol), CORPO);
          var l2 = maiorLargura(b.linhas.slice(porCol), CORPO);
          if (l1 + 30 + l2 <= util) {
            x2 = Math.min(Math.max(l1 + 30, util * 0.48), util - l2);
          }
        }
        if (!x2) porCol = b.linhas.length;
        y += 12;
        b.linhas.forEach(function (t, i) {
          var col = Math.floor(i / porCol);
          corpo += txt(esq + col * x2, y + (i % porCol) * 25 + 16, CORPO, '#1a1a1a', t);
        });
        y += porCol * 25 + 8;
      } else if (b.tipo === 'aviso') {
        y += 14;
        corpo += '<rect x="' + MARG + '" y="' + y + '" width="' + (LARG - 2 * MARG) +
          '" height="33" fill="#fdf3f3"/>';
        corpo += '<rect x="' + MARG + '" y="' + y + '" width="3.5" height="33" fill="#c00000"/>';
        corpo += txt(MARG + 15, y + 22, 15, '#8b0000', b.texto);
        y += 39;
      } else if (b.tipo === 'figura') {
        var vb = enquadrar(b.svg);
        /* Depois do recorte cada desenho tem uma largura util diferente. Se
           todos fossem esticados ate a margem, o mais compacto sairia com a
           legenda maior que o texto do relatorio e o mais largo, menor: o
           limite abaixo mira um tamanho unico de legenda para todos. */
        var lf = Math.min(LARG - 2 * INSET_FIG, vb[2] * (ALVO_LEGENDA / FONTE_DESENHO));
        var af = (vb[3] / vb[2]) * lf;
        y += 10;
        /* a classe do desenho precisa vir junto: e ela que casa com o CSS */
        corpo += '<svg x="' + n((LARG - lf) / 2) + '" y="' + n(y) + '" width="' + n(lf) +
          '" height="' + n(af) + '" viewBox="' + vb.map(n).join(' ') + '" class="' +
          (b.svg.getAttribute('class') || 'dg') + '">' + b.svg.innerHTML + '</svg>';
        y += af + 10;
      }
    });

    /* --- rodape --- */
    y += 26;
    corpo += '<line x1="' + MARG + '" y1="' + n(y) + '" x2="' + (LARG - MARG) + '" y2="' +
      n(y) + '" stroke="#dcdcdc"/>';
    y += 22;
    corpo += txt(MARG, y, 12.5, '#9a9a9a',
      'Gerado por Flexo Simples em ' + dataDeHoje() +
      ' · ABNT NBR 6118 · conferir por profissional habilitado.');
    y += 24;

    var altura = Math.ceil(y);
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + LARG + '" height="' + altura +
      '" viewBox="0 0 ' + LARG + ' ' + altura + '">' +
      '<style>text{font-family:"Segoe UI",Tahoma,Geneva,Verdana,sans-serif}' +
      ESTILO_DESENHOS + '</style>' +
      '<rect width="' + LARG + '" height="' + altura + '" fill="#ffffff"/>' +
      corpo + '</svg>';
  }

  /* ------------------------------------------------ rasterizacao
     data: URL em vez de blob: URL — assim o canvas nao fica "contaminado"
     e o toBlob continua permitido, inclusive com a pagina aberta por
     duplo clique (file://). */
  function paraBlob(svg, escala) {
    return new Promise(function (ok, falha) {
      var m = /^<svg[^>]*\swidth="(\d+)"\sheight="(\d+)"/.exec(svg);
      if (!m) { falha(new Error('folha sem dimensões')); return; }
      var w = Number(m[1]), h = Number(m[2]);
      var img = new Image();
      img.onload = function () {
        var cv = document.createElement('canvas');
        cv.width = Math.round(w * escala);
        cv.height = Math.round(h * escala);
        var ctx = cv.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.drawImage(img, 0, 0, cv.width, cv.height);
        cv.toBlob(function (b) {
          if (b) ok(b); else falha(new Error('não consegui gerar o PNG'));
        }, 'image/png');
      };
      img.onerror = function () { falha(new Error('não consegui desenhar a folha')); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }

  function nomeArquivo() {
    var id = lerIdentificacao();
    var partes = ['flexo-simples'];
    if (id.elemento) partes.push(id.elemento);
    if (id.revisao) partes.push('r' + id.revisao);
    var nome = partes.join('-').normalize('NFD').replace(/[̀-ͯ]/g, '');
    return nome.replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-').toLowerCase() + '.png';
  }

  function aviso(msg, erro) {
    var el = document.getElementById('exportAviso');
    if (!el) return;
    el.textContent = msg;
    el.className = 'export-aviso' + (erro ? ' erro' : '');
    clearTimeout(aviso.t);
    aviso.t = setTimeout(function () { el.textContent = ''; el.className = 'export-aviso'; }, 5000);
  }

  function baixar() {
    guardarIdentificacao();
    return paraBlob(montarSvg(), ESCALA).then(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = nomeArquivo();
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      aviso('Imagem salva.');
    }).catch(function (e) { aviso('Não deu certo: ' + e.message, true); });
  }

  function copiar() {
    guardarIdentificacao();
    if (!navigator.clipboard || !navigator.clipboard.write || !root.ClipboardItem) {
      aviso('Este navegador não copia imagem — use "Baixar imagem".', true);
      return Promise.resolve();
    }
    return paraBlob(montarSvg(), ESCALA).then(function (blob) {
      return navigator.clipboard.write([new root.ClipboardItem({ 'image/png': blob })]);
    }).then(function () {
      aviso('Copiada. Cole no Word com Ctrl+V.');
    }).catch(function (e) {
      aviso('Não consegui copiar (' + e.message + '). Use "Baixar imagem".', true);
    });
  }

  function ligar() {
    var bBaixar = document.getElementById('btBaixarImagem');
    var bCopiar = document.getElementById('btCopiarImagem');
    if (bBaixar) bBaixar.addEventListener('click', baixar);
    if (bCopiar) bCopiar.addEventListener('click', copiar);
    CAMPOS.forEach(function (c) {
      var el = campoId(c);
      if (el) el.addEventListener('change', guardarIdentificacao);
    });
    restaurarIdentificacao();
  }

  FS.Exportar = {
    montarSvg: montarSvg,
    paraBlob: paraBlob,
    baixar: baixar,
    copiar: copiar,
    coletar: coletar,
    nomeArquivo: nomeArquivo,
    ESTILO_DESENHOS: ESTILO_DESENHOS
  };

  /* fora do navegador (nos testes) o modulo so expoe as funcoes */
  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ligar);
  } else {
    ligar();
  }
})(typeof window !== 'undefined' ? window : globalThis);
