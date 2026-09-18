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
  var VERSAO = '1.2.0';
  var LARGURA_MM = 165;
  var LARGURA_PNG = 2000;
  var ESCALA = LARGURA_PNG / LARG;
  FS.VERSAO = VERSAO;
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
  /* Uma linha do relatorio vira uma lista de pedacos, para o SVG poder
     repetir os subscritos e os destaques que a pagina mostra — 'As,ado'
     escrito com o 's,ado' rebaixado le muito melhor num memorial do que o
     texto achatado. */
  function segmentos(p) {
    if (!p.childNodes) {
      var plano = (p.textContent || '').trim();
      return plano ? [{ t: plano }] : [];
    }
    var out = [];
    (function anda(no, sub, forte, marca) {
      Array.prototype.forEach.call(no.childNodes, function (f) {
        if (f.nodeType === 3) {
          if (f.nodeValue) out.push({ t: f.nodeValue, sub: sub, forte: forte, marca: marca });
          return;
        }
        if (f.nodeType !== 1) return;
        var cl = f.classList;
        anda(f, sub || f.tagName === 'SUB', forte || f.tagName === 'B' ||
          f.tagName === 'STRONG',
          marca || (cl && (cl.contains('marca-min') || cl.contains('marca-ok') || cl.contains('marca-ruim'))
            ? (cl.contains('marca-min') ? 'min' : (cl.contains('marca-ruim') ? 'ruim' : 'ok')) : marca));
      });
    })(p, false, false, null);
    /* junta os espacos das bordas, que vem da indentacao do HTML */
    while (out.length && !out[0].t.trim()) out.shift();
    while (out.length && !out[out.length - 1].t.trim()) out.pop();
    if (out.length) {
      out[0] = Object.assign({}, out[0], { t: out[0].t.replace(/^\s+/, '') });
      var u = out.length - 1;
      out[u] = Object.assign({}, out[u], { t: out[u].t.replace(/\s+$/, '') });
    }
    return out;
  }

  function planoDe(segs) {
    return segs.map(function (g) { return g.t; }).join('');
  }

  var CORES_MARCA = { min: '#8a6300', ok: '#1a7f37', ruim: '#b00020' };

  /* Monta o <text> com os pedacos. O dy de um tspan desloca a posicao
     corrente e nao volta sozinho, entao cada troca de nivel emite o
     deslocamento relativo ao pedaco anterior. */
  function textoRico(x, y, tam, cor, segs, extra) {
    var s = '<text x="' + n(x) + '" y="' + n(y) + '" font-size="' + tam + '" fill="' + cor +
      '"' + (extra || '') + '>';
    var nivel = 0;
    segs.forEach(function (g) {
      var alvo = g.sub ? 1 : 0;
      var atr = '';
      if (alvo !== nivel) { atr += ' dy="' + n((alvo - nivel) * tam * 0.24) + '"'; nivel = alvo; }
      if (g.sub) atr += ' font-size="' + n(tam * 0.74) + '"';
      if (g.forte) atr += ' font-weight="600"';
      /* na tela a marca de quem governa e uma pastilha; aqui, texto colorido
         depois de um separador, que e o que a folha tem de equivalente */
      if (g.marca) atr += ' fill="' + CORES_MARCA[g.marca] + '"';
      s += '<tspan' + atr + ' xml:space="preserve">' +
        esc(g.marca && !g.decorada ? ' · ' + g.t.trim() : g.t) + '</tspan>';
    });
    return s + '</text>';
  }

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

  /* Quebra texto sem reduzir a fonte. Mantem subscritos e destaques e
     tambem divide identificadores extensos sem espacos. */
  function quebrarSegmentos(segs, tam, largura) {
    if (!(largura > 0)) throw new Error('Largura de texto inválida.');
    var linhas = [], linha = [], usada = 0;
    function fechar() {
      while (linha.length && !linha[linha.length - 1].t.trim()) linha.pop();
      if (linha.length) linhas.push(linha);
      linha = []; usada = 0;
    }
    function colocar(t, g) {
      if (!linha.length && !t.trim()) return;
      var w = medir(t, g.sub ? tam * 0.74 : tam) * (g.forte ? 1.08 : 1);
      if (usada + w > largura && linha.length) fechar();
      if (!linha.length && !t.trim()) return;
      if (w > largura && Array.from(t).length > 1) {
        Array.from(t).forEach(function (letra) { colocar(letra, g); });
        return;
      }
      var novo = Object.assign({}, g, { t: t, decorada: true });
      var anterior = linha[linha.length - 1];
      if (anterior && anterior.sub === novo.sub && anterior.forte === novo.forte &&
          anterior.marca === novo.marca) anterior.t += t;
      else linha.push(novo);
      usada += w;
    }
    segs.forEach(function (g) {
      var texto = g.marca && !g.decorada ? ' · ' + g.t.trim() : g.t;
      (texto.match(/\s+|\S+/g) || []).forEach(function (t) { colocar(t, g); });
    });
    fechar();
    return linhas.length ? linhas : [[]];
  }

  function quebrarTexto(texto, tam, largura) {
    return quebrarSegmentos([{ t: String(texto) }], tam, largura).map(planoDe);
  }

  /* Reordena apenas o documento de exportacao, nunca o DOM da tela.
     Grupos novos/desconhecidos continuam presentes e em ordem estavel. */
  function ordenarBlocos(blocos, ordem) {
    if (ordem === 'tela') return blocos.slice();
    function grupos(lista, nivel) {
      var out = [], atual;
      lista.forEach(function (b) {
        if (!atual || (b.tipo === 'titulo' && b.nivel === nivel)) {
          atual = { nome: b.tipo === 'titulo' && b.nivel === nivel ? b.texto : '', itens: [] };
          out.push(atual);
        }
        atual.itens.push(b);
      });
      return out;
    }
    function ordenar(lista, nomes) {
      return lista.map(function (g, i) {
        var p = nomes.indexOf(g.nome);
        return { g: g, i: i, p: p < 0 ? nomes.length : p };
      }).sort(function (a, b) { return a.p - b.p || a.i - b.i; })
        .map(function (x) { return x.g; });
    }
    var secoes = grupos(blocos, 2);
    secoes.forEach(function (g) {
      if (g.nome !== 'Dados') return;
      var titulo = g.itens[0];
      var partes = ordenar(grupos(g.itens.slice(1), 3),
        ['Informações gerais', 'Materiais', 'Geometria', 'Esforços']);
      g.itens = [titulo].concat.apply([titulo], partes.map(function (x) { return x.itens; }));
    });
    var ordenados = ordenar(secoes, ['Dados', 'Equilíbrio', 'Deformação/Domínios',
      'Seção', 'Seção vazada equivalente', 'Bielas comprimidas', 'Resultados', 'Armadura']);
    return [].concat.apply([], ordenados.map(function (g) { return g.itens; }));
  }

  function ordemAtual() {
    var el = document.getElementById('exportOrdem');
    return el && el.value === 'tela' ? 'tela' : 'memorial';
  }

  function conferirRelatorio() {
    var rel = document.getElementById('relatorio');
    if (!rel || (rel.getAttribute && rel.getAttribute('data-calculo-valido') === 'false')) {
      throw new Error('Corrija as entradas antes de exportar. Não há cálculo válido.');
    }
  }

  /* ------------------------------------------------ identificacao */
  var CAMPOS = ['elemento'];

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
          var segs = segmentos(p);
          if (segs.length) linhas.push(segs);
        });
        if (linhas.length) {
          saida.blocos.push({ tipo: cl.contains('destaque') ? 'destaque' : 'texto',
            linhas: linhas });
        }
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
  function montarSvg(opcoes) {
    conferirRelatorio();
    var main = document.getElementById('relatorio');
    if (main && main.getAttribute && main.getAttribute('data-layout') === 'painel') {
      if (!FS.PainelFlexao) throw new Error('Painel de flexão indisponível. Recarregue a página.');
      return FS.PainelFlexao.exportar();
    }
    conferirRelatorio();
    var dados = coletar();
    dados.blocos = ordenarBlocos(dados.blocos, (opcoes && opcoes.ordem) || ordemAtual());
    var id = lerIdentificacao();
    var tema = document.documentElement.getAttribute('data-tema') === 'corporativo'
      ? 'corporativo' : 'classico';
    var c = TEMAS[tema];
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

    /* Identificacao resumida: nenhum projeto nem subcapitulo IDENTIFICACAO. */
    y += 34;
    var idLinhas = quebrarTexto('ELEMENTO — ' + (id.elemento || 'não informado'), CORPO, LARG - 2 * MARG);
    idLinhas.forEach(function (t) { corpo += txt(MARG, y, CORPO, '#1a1a1a', t, ' font-weight="600"'); y += 25; });

    /* --- o que a folha dimensiona: cada pagina declara a sua frase --- */
    var rel = document.getElementById('relatorio');
    var descricao = rel && rel.getAttribute ? rel.getAttribute('data-descricao') : '';
    if (descricao) {
      y += 8;
      quebrarTexto(descricao, 15, LARG - 2 * MARG).forEach(function (linha) {
        y += 22;
        corpo += txt(MARG, y, 15, '#5a5a5a', linha);
      });
      y += 4;
    }
    y += 18;

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
        var planas = b.linhas.map(planoDe);
        var porCol = Math.ceil(b.linhas.length / 2);
        var x2 = 0;
        if (b.linhas.length >= 4) {
          var l1 = maiorLargura(planas.slice(0, porCol), CORPO) * 1.08 + 20;
          var l2 = maiorLargura(planas.slice(porCol), CORPO) * 1.08 + 20;
          if (l1 + 30 + l2 <= util) {
            x2 = Math.min(Math.max(l1 + 30, util * 0.48), util - l2);
          }
        }
        if (!x2) porCol = b.linhas.length;
        y += 12;
        if (x2) {
          b.linhas.forEach(function (segs, i) {
            var col = Math.floor(i / porCol);
            corpo += textoRico(esq + col * x2, y + (i % porCol) * 25 + 16, CORPO, '#1a1a1a', segs);
          });
          y += porCol * 25 + 8;
        } else {
          b.linhas.forEach(function (segs) {
            quebrarSegmentos(segs, CORPO, util - 12).forEach(function (linha) {
              corpo += textoRico(esq, y + 16, CORPO, '#1a1a1a', linha);
              y += 25;
            });
          });
          y += 8;
        }
      } else if (b.tipo === 'destaque') {
        var linhasDestaque = [].concat.apply([], b.linhas.map(function (segs) {
          return quebrarSegmentos(segs, CORPO, LARG - 2 * MARG - 35);
        }));
        var alt = linhasDestaque.length * 25 + 14;
        y += 14;
        corpo += '<rect x="' + MARG + '" y="' + n(y) + '" width="' + (LARG - 2 * MARG) +
          '" height="' + alt + '" fill="' + (tema === 'corporativo' ? '#faf6ea' : '#f2f7fc') + '"/>';
        corpo += '<rect x="' + MARG + '" y="' + n(y) + '" width="3.5" height="' + alt +
          '" fill="' + c.acento + '"/>';
        linhasDestaque.forEach(function (segs, i) {
          corpo += textoRico(MARG + 15, y + 25 + i * 25, CORPO, '#1a1a1a', segs);
        });
        y += alt + 8;
      } else if (b.tipo === 'aviso') {
        var linhasAviso = quebrarTexto(b.texto, 15, LARG - 2 * MARG - 35);
        var altAviso = linhasAviso.length * 23 + 12;
        y += 14;
        corpo += '<rect x="' + MARG + '" y="' + y + '" width="' + (LARG - 2 * MARG) +
          '" height="' + altAviso + '" fill="#fdf3f3"/>';
        corpo += '<rect x="' + MARG + '" y="' + y + '" width="3.5" height="' + altAviso + '" fill="#c00000"/>';
        linhasAviso.forEach(function (linha, i) {
          corpo += txt(MARG + 15, y + 22 + i * 23, 15, '#8b0000', linha);
        });
        y += altAviso + 6;
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
      'Flexo Simples v' + VERSAO + ' · ' + dataDeHoje() +
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
  function crc32(bytes) {
    var crc = 0xffffffff;
    for (var i = 0; i < bytes.length; i++) {
      crc ^= bytes[i];
      for (var bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  /* PNG pHYs: pixels/metro, unidade 1. Preserva o conteudo rasterizado;
     remove pHYs anteriores e insere um unico chunk antes de IDAT. */
  function definirDensidade(bytes, larguraPx, larguraMm) {
    if (!(bytes instanceof Uint8Array) || bytes.length < 33 ||
        ![137, 80, 78, 71, 13, 10, 26, 10].every(function (v, i) { return bytes[i] === v; })) {
      throw new Error('PNG inválido.');
    }
    if (!Number.isFinite(larguraPx) || !Number.isFinite(larguraMm) ||
        larguraPx <= 0 || larguraMm <= 0) throw new Error('Dimensões físicas inválidas.');
    var densidade = Math.round(larguraPx * 1000 / larguraMm);
    if (densidade < 1 || densidade > 0xffffffff) throw new Error('Densidade fora do intervalo PNG.');
    var pedacos = [bytes.slice(0, 8)], pos = 8, fim = false, inserido = false;
    var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    while (pos + 12 <= bytes.length) {
      var len = view.getUint32(pos), prox = pos + 12 + len;
      if (prox > bytes.length) throw new Error('PNG truncado.');
      var tipo = String.fromCharCode.apply(null, bytes.slice(pos + 4, pos + 8));
      if (pos === 8 && (tipo !== 'IHDR' || len !== 13 || view.getUint32(pos + 8) !== larguraPx)) {
        throw new Error('Dimensões divergentes do IHDR.');
      }
      if (tipo === 'IDAT' && !inserido) {
        var chunk = new Uint8Array(21), d = new DataView(chunk.buffer);
        d.setUint32(0, 9); chunk.set([112, 72, 89, 115], 4);
        d.setUint32(8, densidade); d.setUint32(12, densidade); chunk[16] = 1;
        d.setUint32(17, crc32(chunk.slice(4, 17)));
        pedacos.push(chunk); inserido = true;
      }
      if (tipo !== 'pHYs') pedacos.push(bytes.slice(pos, prox));
      pos = prox;
      if (tipo === 'IEND') { fim = len === 0 && pos === bytes.length; break; }
    }
    if (!fim || !inserido) throw new Error('PNG incompleto.');
    var out = new Uint8Array(pedacos.reduce(function (s, p) { return s + p.length; }, 0));
    var offset = 0;
    pedacos.forEach(function (p) { out.set(p, offset); offset += p.length; });
    return out;
  }

  function paraBlob(svg, escala) {
    return new Promise(function (ok, falha) {
      var m = /^<svg[^>]*\swidth="(\d+)"\sheight="(\d+)"/.exec(svg);
      if (!m) { falha(new Error('Folha sem dimensões.')); return; }
      var fator = escala === undefined ? LARGURA_PNG / Number(m[1]) : escala;
      var w = Math.round(Number(m[1]) * fator), h = Math.round(Number(m[2]) * fator);
      if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1 ||
          w > 16384 || h > 16384 || w * h > 40000000) {
        falha(new Error('Folha excede o limite de rasterização; use o SVG.')); return;
      }
      var img = new Image();
      img.onload = function () {
        try {
          var cv = document.createElement('canvas');
          cv.width = w; cv.height = h;
          var ctx = cv.getContext('2d');
          if (!ctx) throw new Error('Canvas indisponível.');
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          cv.toBlob(function (b) {
            if (!b) { falha(new Error('Não foi possível gerar o PNG.')); return; }
            b.arrayBuffer().then(function (buffer) {
              ok(new Blob([definirDensidade(new Uint8Array(buffer), w, LARGURA_MM)], { type: 'image/png' }));
            }).catch(falha);
          }, 'image/png');
        } catch (e) { falha(e); }
      };
      img.onerror = function () { falha(new Error('Não foi possível desenhar a folha.')); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }

  function svgFisico(svg) {
    var m = /^<svg[^>]*\swidth="(\d+)"\sheight="(\d+)"/.exec(svg);
    if (!m) throw new Error('Folha sem dimensões.');
    return svg.replace('width="' + m[1] + '" height="' + m[2] + '"',
      'width="' + LARGURA_MM + 'mm" height="' + n(Number(m[2]) / Number(m[1]) * LARGURA_MM) + 'mm"');
  }

  function nomeArquivo() {
    var id = lerIdentificacao();
    var partes = ['flexo-simples'];
    if (id.elemento) partes.push(id.elemento);
    else if (id.projeto) partes.push(id.projeto);
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

  var ocupado = false;
  function definirOcupado(valor) {
    ocupado = valor;
    var rel = document.getElementById('relatorio');
    var invalido = rel && rel.getAttribute('data-calculo-valido') === 'false';
    ['btBaixarImagem', 'btCopiarImagem', 'btBaixarSvg', 'btExportarPainel'].forEach(function (id) {
      var b = document.getElementById(id);
      if (b) { b.disabled = valor || invalido; b.setAttribute('aria-busy', String(valor)); }
    });
  }

  function salvarBlob(blob, nome) {
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    try {
      a.href = url; a.download = nome;
      document.body.appendChild(a); a.click();
    } finally {
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }
  }

  function baixar() {
    if (ocupado) return Promise.resolve();
    definirOcupado(true); guardarIdentificacao();
    var nome = nomeArquivo();
    return Promise.resolve().then(function () { return paraBlob(montarSvg()); })
      .then(function (blob) {
        salvarBlob(blob, nome);
        aviso('PNG gerado: 2000 px, largura nominal de 16,5 cm.');
      }).catch(function (e) { aviso('Não foi possível exportar: ' + e.message, true); })
      .finally(function () { definirOcupado(false); });
  }

  function baixarSvg() {
    if (ocupado) return;
    try {
      guardarIdentificacao();
      salvarBlob(new Blob([svgFisico(montarSvg())], { type: 'image/svg+xml;charset=utf-8' }),
        nomeArquivo().replace(/\.png$/, '.svg'));
      aviso('SVG vetorial gerado com largura nominal de 16,5 cm.');
    } catch (e) { aviso('Não foi possível exportar: ' + e.message, true); }
  }

  function copiar() {
    if (ocupado) return Promise.resolve();
    guardarIdentificacao();
    if (!navigator.clipboard || !navigator.clipboard.write || !root.ClipboardItem) {
      aviso('Este navegador não copia imagem — use "Baixar imagem".', true);
      return Promise.resolve();
    }
    definirOcupado(true);
    var imagem;
    try {
      conferirRelatorio();
      imagem = paraBlob(montarSvg());
      /* A chamada de write acontece dentro do clique, nao depois do canvas.
         A Promise do ClipboardItem preserva a ativacao do usuario. */
      imagem.catch(function () { /* tratado pela cadeia abaixo */ });
      return navigator.clipboard.write([new root.ClipboardItem({ 'image/png': imagem })])
        .then(function () {
          aviso('Copiada. No Word, confira a largura de 16,5 cm após colar.');
        }).catch(function (e) {
          aviso('Não foi possível copiar (' + e.message + '). Use "Baixar imagem".', true);
        }).finally(function () { definirOcupado(false); });
    } catch (e) {
      definirOcupado(false);
      aviso('Não foi possível copiar: ' + e.message, true);
      return Promise.resolve();
    }
  }

  function ligar() {
    var bBaixar = document.getElementById('btBaixarImagem');
    var bCopiar = document.getElementById('btCopiarImagem');
    if (bBaixar) {
      bBaixar.addEventListener('click', baixar);
      var painel = bBaixar.parentNode.parentNode;
      var campo = document.createElement('div');
      campo.className = 'campo campo-larga';
      campo.style.display = 'block';
      var rotulo = document.createElement('label');
      rotulo.htmlFor = 'exportOrdem'; rotulo.textContent = 'Ordem da folha';
      rotulo.style.display = 'block'; rotulo.style.width = '100%';
      var selecao = document.createElement('select');
      selecao.id = 'exportOrdem';
      selecao.style.width = '100%'; selecao.style.marginTop = '4px';
      [['memorial', 'Memorial: dados primeiro'], ['tela', 'Mesma ordem da tela']].forEach(function (par) {
        var opt = document.createElement('option'); opt.value = par[0]; opt.textContent = par[1]; selecao.appendChild(opt);
      });
      campo.appendChild(rotulo); campo.appendChild(selecao);
      var principal = document.getElementById('relatorio');
      if (!principal || principal.getAttribute('data-layout') !== 'painel') painel.insertBefore(campo, bBaixar.parentNode);
      var bSvg = document.createElement('button');
      bSvg.type = 'button'; bSvg.id = 'btBaixarSvg';
      bSvg.className = 'botao botao-mini'; bSvg.textContent = 'Baixar SVG';
      bSvg.addEventListener('click', baixarSvg); bBaixar.parentNode.appendChild(bSvg);
      var nota = document.createElement('p'); nota.className = 'nota';
      nota.textContent = 'Versão ' + VERSAO + ' · PNG 2000 px · largura nominal 165 mm. ' +
        'Confira o tamanho após colar no Word.';
      painel.appendChild(nota);
    }
    if (bCopiar) bCopiar.addEventListener('click', copiar);
    CAMPOS.forEach(function (c) {
      var el = campoId(c);
      if (el) el.addEventListener('change', guardarIdentificacao);
    });
    restaurarIdentificacao();
    var campoElemento = document.getElementById('idElemento');
    if (FS.PainelFlexao && campoElemento) campoElemento.dispatchEvent(new Event('input'));
    definirOcupado(false);
    document.title += ' · v' + VERSAO;
  }

  FS.Exportar = {
    VERSAO: VERSAO,
    LARGURA_MM: LARGURA_MM,
    LARGURA_PNG: LARGURA_PNG,
    ordenarBlocos: ordenarBlocos,
    quebrarSegmentos: quebrarSegmentos,
    quebrarTexto: quebrarTexto,
    definirDensidade: definirDensidade,
    crc32: crc32,
    svgFisico: svgFisico,
    baixarSvg: baixarSvg,
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
