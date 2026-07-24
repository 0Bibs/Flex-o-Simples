/* ---------------------------------------------------------------------------
   Flexo Simples - nucleo de calculo de flexao simples
   Secao retangular ou T, armadura simples ou dupla, ABNT NBR 6118.

   Unidades internas: cm (comprimento), kN (forca), kN/cm2 (tensao),
   por mil (deformacao), kN.cm (momento).
   --------------------------------------------------------------------------- */
(function (root) {
  'use strict';

  var FS = (root.FS = root.FS || {});
  var Norma = FS.Norma;

  /* ---------------------------------------------------------------------
     Diagrama tensao-deformacao do aco (NBR 6118 item 8.3.6)
     eps em por mil, retorna tensao em kN/cm2 (com sinal).
     Tipo A: elasto-plastico perfeito (barras laminadas a quente, CA-50).
     Tipo B: encruado a frio, patamar convencional a 0,2% (CA-60).
     --------------------------------------------------------------------- */
  function criarAco(tipo, fyd) {
    var Es = Norma.Es;
    var epsYdA = (fyd / Es) * 1000;

    if (tipo !== 'B') {
      return {
        tipo: 'A',
        fyd: fyd,
        epsYd: epsYdA,
        sigma: function (eps) {
          var s = eps < 0 ? -1 : 1;
          var a = Math.abs(eps);
          return s * Math.min((a / 1000) * Es, fyd);
        }
      };
    }

    /* Tipo B: reta ate 0,7.fyd, transicao ate fyd com 0,2% de deformacao residual */
    var eps1 = ((0.7 * fyd) / Es) * 1000;
    var epsYdB = eps1 + 2.0;
    return {
      tipo: 'B',
      fyd: fyd,
      epsYd: epsYdB,
      sigma: function (eps) {
        var s = eps < 0 ? -1 : 1;
        var a = Math.abs(eps);
        if (a <= eps1) return s * (a / 1000) * Es;
        if (a >= epsYdB) return s * fyd;
        var t = (epsYdB - a) / (epsYdB - eps1);
        return s * fyd * (1 - 0.3 * t * t);
      }
    };
  }

  /* ---------------------------------------------------------------------
     Dominios de deformacao (NBR 6118 item 17.2.2) e deformacoes para um
     dado x (profundidade da linha neutra, em cm).
     --------------------------------------------------------------------- */
  function deformacoes(x, g, p) {
    var d = g.d, h = g.h, dl = g.dl;
    var epsCu = p.epsCu, epsC2 = p.epsC2;
    var x23 = (epsCu / (epsCu + 10)) * d;
    var epsC, epsS, dominio;

    if (x <= 0) {
      epsC = 0; epsS = 10; dominio = '1';
    } else if (x <= x23) {
      /* pivo A: alongamento do aco em 10 por mil */
      epsS = 10;
      epsC = (10 * x) / (d - x);
      dominio = '2';
    } else if (x <= h) {
      /* pivo B: encurtamento do concreto em eps_cu */
      epsC = epsCu;
      epsS = (epsCu * (d - x)) / x;
      dominio = null; /* definido abaixo, depende de eps_yd */
    } else {
      /* pivo C: eps_c2 na fibra a (1 - eps_c2/eps_cu).h do topo */
      var yc = h * (1 - epsC2 / epsCu);
      epsC = (epsC2 * x) / (x - yc);
      epsS = (epsC * (d - x)) / x; /* negativo = secao toda comprimida */
      dominio = '5';
    }

    /* deformacao na armadura comprimida (positiva = encurtamento) */
    var epsSl = x > 0 ? (epsC * (x - dl)) / x : 0;

    return { epsC: epsC, epsS: epsS, epsSl: epsSl, dominio: dominio, x23: x23 };
  }

  function nomeDominio(x, g, p, epsYd) {
    var d = g.d, h = g.h, epsCu = p.epsCu;
    var x23 = (epsCu / (epsCu + 10)) * d;
    var x34 = (epsCu / (epsCu + epsYd)) * d;
    if (x <= 0) return '1';
    if (x <= x23) return '2';
    if (x <= x34) return '3';
    if (x <= d) return '4';
    if (x <= h) return '4a';
    return '5';
  }

  /* ---------------------------------------------------------------------
     Bloco retangular de compressao: para uma altura y = lambda.x, devolve
     a resultante Rcc e o momento em relacao ao centro de gravidade da
     armadura tracionada (nivel d). Trata secao retangular e T.
     --------------------------------------------------------------------- */
  function bloco(y, g, fcd, p) {
    var sigma = p.alphaC * fcd;
    y = Math.max(0, Math.min(y, g.h));
    var bw = g.bw, bf = g.secaoT ? g.bf : g.bw, hf = g.secaoT ? g.hf : 0;
    var Rcc, M;
    if (!g.secaoT || y <= hf) {
      Rcc = sigma * bf * y;
      M = Rcc * (g.d - y / 2);
    } else {
      var Rmesa = sigma * (bf - bw) * hf;
      var Ralma = sigma * bw * y;
      Rcc = Rmesa + Ralma;
      M = Rmesa * (g.d - hf / 2) + Ralma * (g.d - y / 2);
    }
    return { Rcc: Rcc, M: M, y: y };
  }

  /* Inverso: altura y do bloco que produz o momento M (em relacao a As).
     Retorna null se a secao nao comporta o momento. */
  function alturaBloco(M, g, fcd, p) {
    var sigma = p.alphaC * fcd;
    var d = g.d, bw = g.bw;
    var bf = g.secaoT ? g.bf : g.bw, hf = g.secaoT ? g.hf : 0;

    function resolver(b, Mr, dRef) {
      var disc = dRef * dRef - (2 * Mr) / (sigma * b);
      if (disc < 0) return null;
      return dRef - Math.sqrt(disc);
    }

    var y = resolver(bf, M, d);
    if (y === null) {
      if (!g.secaoT) return null;
    } else if (!g.secaoT || y <= hf) {
      return y;
    }

    /* Secao T com linha neutra abaixo da mesa: decomposicao mesa + alma */
    var Mmesa = sigma * (bf - bw) * hf * (d - hf / 2);
    var Malma = M - Mmesa;
    if (Malma < 0) return hf;
    var y2 = resolver(bw, Malma, d);
    return y2;
  }

  /* ---------------------------------------------------------------------
     Area de aco a partir do modo de entrada
     --------------------------------------------------------------------- */
  function areaBarras(n, diamMm) {
    return (n * Math.PI * Math.pow(diamMm / 10, 2)) / 4;
  }
  function areaEspacamento(diamMm, sCm) {
    if (!sCm || sCm <= 0) return 0;
    return ((Math.PI * Math.pow(diamMm / 10, 2)) / 4) * (100 / sCm);
  }

  /* ---------------------------------------------------------------------
     Armadura minima e maxima (NBR 6118 item 17.3.5)
     --------------------------------------------------------------------- */
  function armaduraLimite(g, e, p, fyd) {
    var Ac = g.secaoT ? g.bw * (g.h - g.hf) + g.bf * g.hf : g.bw * g.h;
    var rho = Norma.rhoMin(e.fck, fyd * 10 /* kN/cm2 -> MPa */);
    var W0 = (g.bw * g.h * g.h) / 6; /* modulo resistente da borda tracionada */
    var MdMin = 0.8 * W0 * (p.fctkSup / 10);
    return {
      Ac: Ac,
      rhoMin: rho,
      asMin: rho * Ac,
      asMax: 0.04 * Ac,
      MdMin: MdMin,
      W0: W0
    };
  }

  /* ---------------------------------------------------------------------
     Normalizacao da entrada
     --------------------------------------------------------------------- */
  function preparar(e) {
    var p = Norma.parametros(e.fck);
    var fcd = Norma.MPaParaKNcm2(e.fck) / e.gammaC;
    var fyd = Norma.MPaParaKNcm2(e.fyk) / e.gammaS;
    var aco = criarAco(e.tipoAco, fyd);
    var dl = e.dl > 0 ? e.dl : 0;
    var g = {
      secaoT: e.secao === 'T',
      bw: e.bw,
      bf: e.secao === 'T' ? e.bf : e.bw,
      hf: e.secao === 'T' ? e.hf : 0,
      d: e.d,
      dl: dl,
      h: e.d + dl
    };
    return { p: p, fcd: fcd, fyd: fyd, aco: aco, g: g };
  }

  /* ---------------------------------------------------------------------
     DIMENSIONAMENTO: Msd -> As
     --------------------------------------------------------------------- */
  function dimensionar(e) {
    var c = preparar(e);
    var p = c.p, g = c.g, fcd = c.fcd, fyd = c.fyd, aco = c.aco;
    var Msd = Norma.tfmParaKNcm(e.Msd);
    var avisos = [];
    var lim = armaduraLimite(g, e, p, fyd);

    var betaXLim = e.betaXLim > 0 ? e.betaXLim : p.betaXLim;
    var xLim = betaXLim * g.d;
    var blocoLim = bloco(p.lambda * xLim, g, fcd, p);
    var MLim = blocoLim.M;

    var As, Asl = 0, x, y, Rcc, Rsc = 0, sigmaSl = 0;

    if (Msd <= 0) {
      As = 0; x = 0; y = 0; Rcc = 0;
    } else if (Msd <= MLim + 1e-9 || !e.armaduraDupla) {
      /* Armadura simples. Acima do limite de ductilidade so se chega aqui
         quando a armadura dupla esta desativada: resolve mesmo assim e avisa. */
      y = alturaBloco(Msd, g, fcd, p);
      if (y === null) {
        avisos.push('Secao insuficiente para o momento solicitante, mesmo com ' +
          'armadura dupla: aumente a secao ou o f_ck.');
        y = p.lambda * xLim;
      }
      x = y / p.lambda;
      Rcc = bloco(y, g, fcd, p).Rcc;
      var sigS = aco.sigma(deformacoes(x, g, p).epsS);
      if (sigS > 0.01) {
        As = Rcc / sigS;
      } else {
        As = Rcc / fyd;
        avisos.push('A armadura nao esta tracionada: secao inadequada para flexao simples.');
      }
      if (x > xLim + 1e-9) {
        avisos.push('x/d = ' + (x / g.d).toFixed(3) + ' > ' + betaXLim.toFixed(2) +
          ': necessaria armadura dupla ou aumento da secao ' +
          '(NBR 6118 item 14.6.4.3).');
      }
    } else {
      /* Armadura dupla */
      x = xLim;
      y = p.lambda * xLim;
      Rcc = blocoLim.Rcc;
      var dM = Msd - MLim;

      if (g.dl <= 0) {
        avisos.push("Informe d' > 0 para calcular a armadura dupla.");
      }

      var def = deformacoes(x, g, p);
      sigmaSl = aco.sigma(def.epsSl);
      var braco = g.d - g.dl;
      if (braco > 0 && sigmaSl > 0) {
        Asl = dM / (sigmaSl * braco);
        Rsc = Asl * sigmaSl;
        As = (Rcc + Rsc) / fyd;
      } else {
        Asl = 0;
        As = Rcc / fyd;
        avisos.push('Nao foi possivel equilibrar a secao com armadura dupla.');
      }
    }

    /* Armadura minima */
    var asCalc = As;
    if (e.usarArmaduraMinima !== false && As < lim.asMin && Msd > 0) {
      As = lim.asMin;
      avisos.push('Armadura minima governa: As,min = ' + lim.asMin.toFixed(2) + ' cm2.');
    }
    if (As + Asl > lim.asMax) {
      avisos.push('As + As′ excede a armadura maxima de 4% da secao (' +
        lim.asMax.toFixed(2) + ' cm2).');
    }

    var def2 = deformacoes(x, g, p);
    return montar({
      c: c, e: e, x: x, y: y, As: As, asCalc: asCalc, Asl: Asl,
      Rcc: Rcc, Rsc: Rsc, sigmaSl: sigmaSl, Msd: Msd, MRd: Msd,
      def: def2, lim: lim, avisos: avisos, betaXLim: betaXLim, modo: 'MSD_AS'
    });
  }

  /* ---------------------------------------------------------------------
     VERIFICACAO: As -> MRd (compatibilidade de deformacoes, bissecao em x)
     --------------------------------------------------------------------- */
  function verificar(e) {
    var c = preparar(e);
    var p = c.p, g = c.g, fcd = c.fcd, fyd = c.fyd, aco = c.aco;
    var As = e.As, Asl = e.Asl || 0;
    var avisos = [];
    var lim = armaduraLimite(g, e, p, fyd);
    var betaXLim = e.betaXLim > 0 ? e.betaXLim : p.betaXLim;

    if (!(As > 0)) {
      return montar({
        c: c, e: e, x: 0, y: 0, As: 0, asCalc: 0, Asl: Asl, Rcc: 0, Rsc: 0,
        sigmaSl: 0, Msd: Norma.tfmParaKNcm(e.Msd), MRd: 0,
        def: deformacoes(0, g, p), lim: lim, avisos: avisos,
        betaXLim: betaXLim, modo: 'AS_MRD'
      });
    }

    /* f(x) = Rcc + Rsc - Rst, crescente com x */
    function f(x) {
      var def = deformacoes(x, g, p);
      var b = bloco(p.lambda * x, g, fcd, p);
      var Rsc = Asl * aco.sigma(def.epsSl);
      var Rst = As * aco.sigma(def.epsS);
      return b.Rcc + Rsc - Rst;
    }

    var a = 1e-6, bnd = 2 * g.h, x = a;
    if (f(bnd) < 0) {
      x = bnd;
      avisos.push('Nao foi possivel equilibrar a secao com a armadura informada.');
    } else {
      for (var i = 0; i < 200; i++) {
        x = (a + bnd) / 2;
        if (f(x) > 0) bnd = x; else a = x;
      }
    }

    var def = deformacoes(x, g, p);
    var b = bloco(p.lambda * x, g, fcd, p);
    var sigmaSl = aco.sigma(def.epsSl);
    var Rsc = Asl * sigmaSl;
    var MRd = b.M + Rsc * (g.d - g.dl);

    if (x / g.d > betaXLim + 1e-6) {
      avisos.push('x/d = ' + (x / g.d).toFixed(3) + ' > ' + betaXLim.toFixed(2) +
        ': ductilidade insuficiente (NBR 6118 item 14.6.4.3).');
    }
    if (e.usarArmaduraMinima !== false && As < lim.asMin) {
      avisos.push('As menor que a armadura minima (' + lim.asMin.toFixed(2) + ' cm2).');
    }
    if (As + Asl > lim.asMax) {
      avisos.push('As + As′ excede a armadura maxima de 4% da secao (' +
        lim.asMax.toFixed(2) + ' cm2).');
    }

    return montar({
      c: c, e: e, x: x, y: b.y, As: As, asCalc: As, Asl: Asl,
      Rcc: b.Rcc, Rsc: Rsc, sigmaSl: sigmaSl,
      Msd: MRd, MRd: MRd, def: def, lim: lim, avisos: avisos,
      betaXLim: betaXLim, modo: 'AS_MRD'
    });
  }

  /* Monta o objeto de resultado comum aos dois modos */
  function montar(o) {
    var c = o.c, g = c.g, p = c.p;
    var Rst = o.As * c.fyd;
    var dom = nomeDominio(o.x, g, p, c.aco.epsYd);
    return {
      /* geometria e materiais */
      bw: g.bw, bf: g.bf, hf: g.hf, d: g.d, dl: g.dl, h: g.h, secaoT: g.secaoT,
      fck: o.e.fck, fyk: o.e.fyk, gammaC: o.e.gammaC, gammaS: o.e.gammaS,
      gammaF: o.e.gammaF, tipoAco: c.aco.tipo,
      fcd: c.fcd, fyd: c.fyd, epsYd: c.aco.epsYd,
      lambda: p.lambda, alphaC: p.alphaC, epsCu: p.epsCu, epsC2: p.epsC2,
      fctm: p.fctm, fctkSup: p.fctkSup, fctkInf: p.fctkInf,
      /* esforcos */
      Msd: o.Msd, MRd: o.MRd,
      MsdTfm: Norma.kNcmParaTfm(o.Msd), MRdTfm: Norma.kNcmParaTfm(o.MRd),
      MskTfm: Norma.kNcmParaTfm(o.Msd) / (o.e.gammaF || 1),
      /* resultados */
      As: o.As, asCalc: o.asCalc, Asl: o.Asl,
      x: o.x, y: o.y, betaX: g.d > 0 ? o.x / g.d : 0, betaXLim: o.betaXLim,
      z: g.d - o.y / 2,
      Rcc: o.Rcc, Rsc: o.Rsc, Rst: Rst,
      RccTf: Norma.kNParaTf(o.Rcc), RstTf: Norma.kNParaTf(Rst),
      RscTf: Norma.kNParaTf(o.Rsc),
      sigmaSl: o.sigmaSl,
      epsC: o.def.epsC, epsS: o.def.epsS, epsSl: o.def.epsSl,
      dominio: dom,
      /* limites */
      Ac: o.lim.Ac, rhoMin: o.lim.rhoMin, asMin: o.lim.asMin, asMax: o.lim.asMax,
      MdMin: o.lim.MdMin, MdMinTfm: Norma.kNcmParaTfm(o.lim.MdMin), W0: o.lim.W0,
      avisos: o.avisos,
      modo: o.modo
    };
  }

  FS.Flexao = {
    criarAco: criarAco,
    deformacoes: deformacoes,
    nomeDominio: nomeDominio,
    bloco: bloco,
    alturaBloco: alturaBloco,
    areaBarras: areaBarras,
    areaEspacamento: areaEspacamento,
    armaduraLimite: armaduraLimite,
    dimensionar: dimensionar,
    verificar: verificar
  };
})(typeof window !== 'undefined' ? window : globalThis);
