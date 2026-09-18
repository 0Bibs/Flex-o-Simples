/* Painel vetorial de flexao: a mesma composicao alimenta tela, PNG e SVG.
   Geometria / Materiais / Esforco | Resultados / Armaduras | Dominios / Equilibrio.
   Sem valores fixos de exemplo, sem servicos externos e sem alterar o motor. */
(function (root) {
  'use strict';
  var FS = root.FS = root.FS || {};
  var W = 1000, VERSAO = '1.2.0', ultimo = null, ultimosErros = [];
  var COR = { texto: '#20252a', discreto: '#596269', borda: '#aeb5b9',
    fundo: '#fafafa', cab: '#eeeeee', azul: '#276dad', verde: '#3b8655',
    vermelho: '#b52f34', concreto: '#e6e7e8', traco: '#77838b' };
  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c];
  }); }
  // Subscritos reais, tanto no painel quanto na exportacao vetorial.
  var SIMBOLOS = {'fctk,sup':['f','ctk,sup'], 'fck':['f','ck'], 'fyk':['f','yk'],
    'As,adotada':['A','s,adotada'], 'As,considerada':['A','s,considerada'],
    'As,informada':['A','s,informada'], 'As,calc':['A','s,calc'], 'As,mín':['A','s,mín'],
    'As,máx':['A','s,máx'], 'As':['A','s'], 'Ac':['A','c'], 'bw':['b','w'], 'bf':['b','f'], 'hf':['h','f'],
    'MRd':['M','Rd'], 'MSd':['M','Sd'], 'Msk':['M','sk'], 'γf':['γ','f'], 'γc':['γ','c'], 'γs':['γ','s'],
    'βx,lim':['β','x,lim'], 'βx':['β','x'], 'ρmín':['ρ','mín'], 'εs':['ε','s'], 'εc':['ε','c'],
    'Rt,eq':['R','t,eq'], 'Rc':['R','c'], 'Rs':['R','s']};
  var RX_SIMBOLOS = new RegExp('(^|[^A-Za-zÀ-ÿ])(' + Object.keys(SIMBOLOS).join('|') + ')(?=$|[^A-Za-zÀ-ÿ])', 'g');
  function matematico(t) {
    var str=String(t), out='', last=0, m;
    RX_SIMBOLOS.lastIndex=0;
    while((m=RX_SIMBOLOS.exec(str))) {
      out+=esc(str.slice(last,m.index))+esc(m[1]);
      var p=SIMBOLOS[m[2]];
      out+=esc(p[0])+'<tspan baseline-shift="sub" font-size="72%">'+esc(p[1])+'</tspan>';
      last=m.index+m[0].length;
    }
    return out+esc(str.slice(last));
  }
  function n(v) { return Math.round(v * 1000) / 1000; }
  function fmt(v, casas) {
    return Number.isFinite(v) ? (Math.abs(v) >= 1e6 ? v.toExponential(2) : v.toFixed(casas === undefined ? 2 : casas)).replace('.', ',') : '—';
  }
  function texto(x, y, t, tam, cor, atr) {
    return '<text x="' + n(x) + '" y="' + n(y) + '" font-size="' + (tam || 19) +
      '" fill="' + (cor || COR.texto) + '"' + (atr || '') + '>' + matematico(t) + '</text>';
  }
  function linha(x, y, xx, yy, cor, atr) {
    return '<line x1="' + n(x) + '" y1="' + n(y) + '" x2="' + n(xx) + '" y2="' + n(yy) +
      '" stroke="' + (cor || COR.borda) + '" stroke-width="1.3"' + (atr || '') + '/>';
  }
  function rect(x, y, w, h, fill, stroke) {
    return '<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) +
      '" fill="' + (fill || 'none') + '"' + (stroke ? ' stroke="' + stroke + '"' : '') + '/>';
  }
  function largura(t, tam) {
    if (typeof document !== 'undefined') {
      if (!largura.ctx) largura.ctx = document.createElement('canvas').getContext('2d');
      if (largura.ctx) {
        largura.ctx.font = '600 ' + tam + 'px Tahoma,Arial,sans-serif';
        return largura.ctx.measureText(t).width;
      }
    }
    return String(t).length * tam * 0.62;
  }
  function quebrar(t, tam, max) {
    var tokens = String(t).split(/(\s+)/), out = [], atual = '';
    tokens.forEach(function (token) {
      if (largura(atual + token, tam) <= max) { atual += token; return; }
      if (atual.trim()) { out.push(atual.trimEnd()); atual = ''; }
      token = token.trimStart();
      Array.from(token).forEach(function (c) {
        if (largura(atual + c, tam) > max && atual) { out.push(atual); atual = ''; }
        atual += c;
      });
    });
    if (atual.trim()) out.push(atual.trimEnd());
    return out.length ? out : [''];
  }
  function paragrafo(x, y, t, w, tam, cor, passo) {
    var lines = quebrar(t, tam || 17, w), dy = passo || (tam || 17) * 1.34;
    return { svg: lines.map(function (s, i) { return texto(x, y + i * dy, s, tam, cor); }).join(''),
      altura: lines.length * dy };
  }
  function quadro(id, x, y, w, h, titulo, conteudo) {
    return '<g id="' + id + '">' + rect(x, y, w, h, '#ffffff', COR.borda) +
      rect(x + 0.7, y + 0.7, w - 1.4, 27, COR.cab) +
      linha(x, y + 28, x + w, y + 28) +
      texto(x + 12, y + 20, titulo, 18, COR.texto, ' font-weight="700"') +
      '<g transform="translate(' + x + ' ' + (y + 28) + ')">' + conteudo + '</g></g>';
  }
  function dado(y, a, b, w, forte) {
    return texto(13, y, a, 19, COR.discreto) + texto(w - 13, y, b, 20, COR.texto,
      ' text-anchor="end"' + (forte ? ' font-weight="700"' : ''));
  }
  function cotaV(x, y1, y2, rotulo, lado) {
    var s = linha(x, y1, x, y2, COR.traco);
    [y1, y2].forEach(function (y) { s += linha(x - 4, y + 4, x + 4, y - 4, COR.traco); });
    var tx = x + (lado === 'dir' ? 17 : -10), ty = (y1 + y2) / 2;
    s += texto(tx, ty, rotulo, 18, COR.discreto,
      ' text-anchor="middle" transform="rotate(-90 ' + n(tx) + ' ' + n(ty) + ')"');
    return s;
  }
  function cotaH(x1, x2, y, rotulo, acima) {
    return linha(x1, y, x2, y, COR.traco) +
      linha(x1 - 4, y + 4, x1 + 4, y - 4, COR.traco) +
      linha(x2 - 4, y + 4, x2 + 4, y - 4, COR.traco) +
      texto((x1 + x2) / 2, acima ? y - 7 : y + 23, rotulo, 18, COR.discreto, ' text-anchor="middle"');
  }
  function geometria(r, op) {
    var b = r.secaoT ? r.bf : r.bw, escala = Math.min(166 / b, 155 / r.h);
    var bw = r.bw * escala, bt = b * escala, h = r.h * escala;
    var cx = 140, y0 = 39 + (155 - h) / 2, xl = cx - bt / 2, xr = cx + bt / 2;
    var yw = y0 + r.hf * escala, yd = y0 + r.d * escala, base = y0 + h;
    var s = '';
    if (r.secaoT) {
      s += '<path d="M' + n(xl) + ' ' + n(y0) + ' H' + n(xr) + ' V' + n(yw) +
        ' H' + n(cx + bw / 2) + ' V' + n(base) + ' H' + n(cx - bw / 2) +
        ' V' + n(yw) + ' H' + n(xl) + ' Z" fill="' + COR.concreto + '" stroke="#303b43" stroke-width="2"/>';
      s += cotaH(xl, xr, y0 - 22, 'bf = ' + fmt(r.bf, 0), true);
    } else s += rect(xl, y0, bt, h, COR.concreto, '#303b43');
    // Localizacao horizontal das barras e apenas ilustrativa; nao ha verificacao de alojamento.
    var a0 = cx - bw * 0.38, a1 = cx + bw * 0.38;
    if (r.As > 0) {
      if (op.modoAs === 'barras' && Number.isInteger(op.nBarras) && op.nBarras > 0 && op.nBarras <= 100) {
        for (var i = 0; i < op.nBarras; i++) {
          var xb = op.nBarras === 1 ? cx : a0 + (a1 - a0) * i / (op.nBarras - 1);
          s += '<circle class="barra-longitudinal" cx="' + n(xb) + '" cy="' + n(yd) + '" r="' +
            n(Math.max(2.4, Math.min(op.diamBarras / 20 * escala, 5))) + '" fill="' + COR.vermelho + '"/>';
        }
      } else s += linha(a0, yd, a1, yd, COR.vermelho, ' style="stroke-width:4"');
    }
    if (r.Asl > 0) s += linha(a0, y0 + r.dl * escala, a1, y0 + r.dl * escala,
      COR.vermelho, ' style="stroke-width:4"');
    s += linha(37, y0, xl - 3, y0) + linha(37, base, cx - bw / 2 - 3, base);
    s += cotaV(43, y0, base, 'h = ' + fmt(r.h, 1));
    s += linha(xr + 3, y0, 237, y0) + linha(cx + bw / 2 + 3, yd, 237, yd);
    s += cotaV(230, y0, yd, 'd = ' + fmt(r.d, 1), 'dir');
    s += linha(256, yd, 256, base, COR.traco) + linha(252, yd, 260, yd, COR.traco) + linha(252, base, 260, base, COR.traco);
    s += texto(265, base + 12, 'd′', 18, COR.discreto);
    s += cotaH(cx - bw / 2, cx + bw / 2, 208, 'bw = ' + fmt(r.bw, 1) + ' cm');
    s += texto(16, 255, 'd′ = ' + fmt(r.dl, 1) + ' cm', 19);
    s += texto(277, 255, r.secaoT ? 'hf = ' + fmt(r.hf, 1) + ' cm' : 'h = d + d′', 18,
      COR.discreto, ' text-anchor="end"');
    s += texto(16, 278, op.modoAs === 'barras' ? 'Barras: distribuição ilustrativa.' :
      'Traço vermelho: área equivalente.', 16, COR.discreto);
    return s;
  }
  function materiais(r) {
    return dado(24, 'fck', fmt(r.fck, 0) + ' MPa', 293) +
      dado(49, 'fyk / tipo', fmt(r.fyk, 0) + ' MPa / ' + r.tipoAco, 293) +
      texto(13, 69, 'γc = ' + fmt(r.gammaC, 2), 19) +
      texto(280, 69, 'γs = ' + fmt(r.gammaS, 2), 19, COR.texto, ' text-anchor="end"');
  }
  function esforco(r, op) {
    var conv = function (v) { return fmt(FS.EntradaFlexao.doMotor(v, op.unidade)) + ' ' + FS.EntradaFlexao.rotulo(op.unidade); };
    if (r.modo === 'AS_MRD') {
      return dado(25, 'MRd', conv(r.MRdTfm), 293, true) +
        texto(13, 49, 'Capacidade da armadura.', 17, COR.discreto) + texto(13, 72, 'Sem demanda independente.', 17, COR.discreto);
    }
    return dado(23, 'Msk', conv(r.MskTfm), 293) + dado(48, 'γf', fmt(r.gammaF), 293) +
      dado(68, 'MSd', conv(r.MsdTfm), 293, true);
  }
  function resultados(r, op) {
    var s = texto(13, 26, r.modo === 'AS_MRD' ? 'Armadura → capacidade' :
      (r.As > r.asCalc + 5e-3 ? 'Estado antes da mínima' : 'Momento → armadura'), 18, COR.discreto);
    s += dado(59, 'As', fmt(r.As) + ' cm²', 293, true) + dado(89, 'As′', fmt(r.Asl) + ' cm²', 293);
    s += linha(13, 102, 280, 102);
    s += dado(131, 'Linha neutra x', fmt(r.x, 2) + ' cm', 293) +
      dado(161, 'βx = x / d', fmt(r.betaX, 3), 293) + dado(191, 'βx,lim', fmt(r.betaXLim, 2), 293);
    s += dado(225, 'Domínio', String(r.dominio), 293, true);
    return s;
  }
  function armaduras(r, op) {
    var inverse = r.modo === 'AS_MRD', s = '';
    s += dado(26, inverse ? 'As,informada' : 'As,calc', fmt(inverse ? r.As : r.asCalc) + ' cm²', 293);
    s += dado(51, 'As,mín', fmt(r.asMin) + ' cm²', 293);
    s += dado(76, inverse ? 'As,considerada' : 'As,adotada', fmt(r.As) + ' cm²', 293, true);
    s += dado(101, 'As′', fmt(r.Asl) + ' cm²', 293);
    s += linha(13, 114, 280, 114);
    s += dado(140, 'ρmín', fmt(r.rhoMin * 100, 3) + ' %', 293) + dado(165, 'Ac', fmt(r.Ac, 1) + ' cm²', 293);
    s += dado(190, 'As,máx', fmt(r.asMax, 2) + ' cm²', 293);
    var regra = inverse ? (op.modoAs === 'barras' ? op.nBarras + ' barras Ø ' + fmt(op.diamBarras, 1) + ' mm' :
      (op.modoAs === 'esp' ? 'Ø ' + fmt(op.diamEsp, 1) + ' c/' + fmt(op.espacamento, 1) + ' cm — faixa de 1 m' : 'Área de aço informada pelo usuário.')) :
      (op.usarMin ? (r.As > r.asCalc + 5e-3 ? 'Governa: armadura mínima.' : 'Governa: cálculo.') : 'Armadura mínima não adotada.');
    s += paragrafo(13, 218, regra, 266, 17, COR.discreto).svg;
    return s;
  }
  /* Dominio compacto: construcao A/B/C com uma unica escala horizontal
     para alongamento e encurtamento. Valores provem do motor original. */
  function dominios(r) {
    var xA = 37, xB = 321, y0 = 46, base = 177, yd = y0 + r.d / r.h * (base-y0);
    var kt = (xB-xA)/(10+r.epsCu), kc=kt, x0=xA+10*kt;
    var A = [xA, yd], B = [xB, y0], P0 = [x0,y0], Pyd = [x0-r.epsYd*kt,yd], Pd=[x0,yd], Ph=[x0,base];
    var cy=y0+(1-r.epsC2/r.epsCu)*(base-y0), cx=x0+r.epsC2*kc;
    function reta(a,b,c,at) { return linha(a[0],a[1],b[0],b[1],c,at); }
    var top=x0+r.epsC*kc, bottom=x0-r.epsS*kt;
    // O painel nao corta estados extremos: preserva a informacao por texto e avisa.
    var topVis=Math.max(xA,Math.min(xB,top)), botVis=Math.max(xA,Math.min(xB,bottom));
    var s=texto(30,26,'Alongamento',17,COR.discreto)+texto(333,26,'Encurtamento',17,COR.discreto,' text-anchor="end"');
    s+=rect(xA,y0,xB-xA,base-y0,'#fcfcf5',COR.borda);
    [0.25,0.5,0.75].forEach(function(t){s+=linha(xA,y0+t*(base-y0),xB,y0+t*(base-y0),'#dedfd8',' stroke-dasharray="3 4"');});
    [[A,P0],[A,B],[B,Pyd],[B,Pd],[B,Ph],[[cx,y0],[cx,base]]].forEach(function(v){s+=reta(v[0],v[1],COR.traco);});
    s+=linha(x0,y0-8,x0,base+7,'#535c62');
    s+=texto(x0,39,'0',16,COR.discreto,' text-anchor="middle"')+texto(xB,39,fmt(r.epsCu,2)+'‰',16,COR.discreto,' text-anchor="end"');
    s+=texto(xA,203,'10‰',16,COR.discreto,' text-anchor="middle"')+texto(x0,203,'0',16,COR.discreto,' text-anchor="middle"');
    function xEm(a,b,y){return a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]);}
    var yy=y0+0.72*(base-y0);
    s+=texto(xA+23,y0+55,'1',18,COR.traco)+texto((x0+xB)/2-15,y0+35,'2',18,COR.traco)+
      texto((xEm(A,B,yy)+xEm(B,Pyd,yy))/2,yy,'3',18,COR.traco,' text-anchor="middle"')+
      texto((xEm(B,Pyd,yy)+xEm(B,Pd,yy))/2,yy,'4',15,COR.traco,' text-anchor="middle"')+
      texto(x0+3,base-3,'4a',12,COR.traco)+texto((xEm(B,Ph,yy)+cx)/2,yy,'5',17,COR.traco,' text-anchor="middle"');
    s+=reta([topVis,y0],[botVis,yd],COR.azul,' style="stroke-width:3"');
    [[A,'A',-15,-10],[B,'B',10,20],[[cx,cy],'C',8,20]].forEach(function(v){
      s+='<circle cx="'+n(v[0][0])+'" cy="'+n(v[0][1])+'" r="3" fill="#303a42"/>'+
        texto(v[0][0]+v[2],v[0][1]+v[3],v[1],16,COR.texto);
    });
    s+=texto(16,232,'εs = '+fmt(r.epsS,2)+'‰',18,COR.azul)+texto(340,232,'εc = '+fmt(r.epsC,2)+'‰',18,COR.azul,' text-anchor="end"');

    return s;
  }
  function equilibrio(r) {
    var top=39,bottom=145,xeps=91,xsig=221,sy=(bottom-top)/r.h, yd=top+r.d*sy;
    var maxE=Math.max(Math.abs(r.epsS),Math.abs(r.epsC),1), ke=57/maxE;
    var ye=top+Math.max(0,Math.min(r.x,r.h))*sy, yb=top+Math.max(0,Math.min(r.y,r.h))*sy;
    var s=texto(87,26,'Deformação',17,COR.discreto,' text-anchor="middle"')+
      texto(245,26,'Compressão',17,COR.discreto,' text-anchor="middle"');
    s+=linha(xeps,top-5,xeps,bottom+8,'#596269');
    s+='<polygon points="'+n(xeps)+','+n(top)+' '+n(xeps+r.epsC*ke)+','+n(top)+' '+
      n(xeps-r.epsS*ke)+','+n(yd)+' '+n(xeps)+','+n(yd)+'" fill="#dbeaf6"/>';
    s+=linha(xeps+r.epsC*ke,top,xeps-r.epsS*ke,yd,COR.azul,' style="stroke-width:2.5"');
    s+=linha(24,ye,318,ye,COR.verde,' stroke-dasharray="7 5"');
    s+=rect(xsig,top,66,Math.max(0,yb-top),COR.concreto,COR.traco);
    s+=linha(xsig,top,xsig,bottom,COR.traco);
    function seta(x1,x2,y,cor){return linha(x1,y,x2,y,cor,' style="stroke-width:2"')+
      '<path d="M'+x2+' '+n(y)+' l'+(x2>x1?-7:7)+' -4 v8 Z" fill="'+cor+'"/>';}
    if(r.Rcc>0)s+=seta(333,289,(top+yb)/2,COR.traco);
    if(r.Rcc+r.Rsc>0)s+=seta(221,320,yd,COR.vermelho);
    s+=texto(19,168,'x = '+fmt(r.x,2)+' cm',18,COR.verde)+
      texto(340,168,'y = λx = '+fmt(r.y,2)+' cm',18,COR.discreto,' text-anchor="end"');
    // R_t,eq e a resultante em equilibrio com o concreto e o aco superior.
    // Nao se utiliza r.Rst=As*fyd: ele pode incorporar a armadura minima e
    // nao respeitar o estado de deformacao do dimensionamento original.
    s+=texto(16,197,'Rc = '+fmt(r.Rcc,2)+' kN',18)+
      texto(340,197,'Rs′ = '+fmt(r.Rsc,2)+' kN',18,COR.texto,' text-anchor="end"');
    s+=texto(16,226,'Rt,eq = Rc + Rs′ = '+fmt(r.Rcc+r.Rsc,2)+' kN',18,COR.vermelho);

    return s;
  }
  function montar(r, op, erros) {
    op=Object.assign({ elemento:'', norma:'2023', unidade:'tfm', usarMin:true, modoAs:'area' },op||{});
    erros=erros||[];
    var ident=paragrafo(14,30,'ELEMENTO — '+(op.elemento.trim()||'não informado'),972,21,COR.texto,28);
    var topo=Math.max(56,ident.altura+30), s=ident.svg;
    var hTotal=564;
    var content=function(fn) { return r?fn(r,op):texto(16,42,'Aguardando dados válidos.',18,COR.discreto); };
    s+=quadro('quadro-geometria',14,topo,293,320,'Geometria (cm)',content(geometria));
    s+=quadro('quadro-materiais',14,topo+332,293,111,'Materiais',content(materiais));
    s+=quadro('quadro-esforco',14,topo+455,293,109,'Esforço',content(esforco));
    s+=quadro('quadro-resultados',319,topo,293,276,'Resultados',content(resultados));
    s+=quadro('quadro-armaduras',319,topo+288,293,276,'Armaduras',content(armaduras));
    s+=quadro('quadro-dominios',624,topo,362,276,'Deformação / Domínios',content(dominios));
    s+=quadro('quadro-equilibrio',624,topo+288,362,276,'Equilíbrio',content(equilibrio));
    var y=topo+hTotal+18;
    var avisos=(r?(r.avisos||[]):erros).slice();
    if(r && (r.epsC<0 || r.epsC>r.epsCu+1e-4 || r.epsS>10.001 || r.epsS<0))
      avisos.push('Estado de deformação fora da janela gráfica compacta; consulte os valores numéricos e o gráfico ampliado.');
    avisos.forEach(function (a) {
      var p=paragrafo(26,y+4,String(a).replace(/<[^>]*>/g,''),946,17,COR.vermelho,23);
      s+=rect(14,y-17,972,p.altura+12,'#fff6f4', '#dcbbb6')+p.svg;y+=p.altura+22;
    });
    s+=linha(14,y-3,986,y-3);
    s+=texto(14,y+20,'NBR 6118:'+op.norma+' · Flexo Simples '+VERSAO+' · Conferência por profissional habilitado.',16,COR.discreto);
    s+=texto(14,y+42,'d′: afastamento efetivo simétrico. Conversão legada: 1 tf·m = 10 kN·m. Forças internas em kN.',16,COR.discreto);
    var height=Math.ceil(y+55);
    return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+height+'" viewBox="0 0 '+W+' '+height+
      '" role="img" aria-label="Painel de flexão simples em três colunas" data-versao="'+VERSAO+'">'+
      '<style>text{font-family:Tahoma,Arial,sans-serif}text{font-variant-numeric:tabular-nums}</style>'+rect(0,0,W,height,'#ffffff')+s+'</svg>';
  }
  function opcoes() {
    function v(id) { var e=document.getElementById(id);return e?e.value:''; }
    var radio=document.querySelector('input[name="modoAs"]:checked');
    return { elemento:v('idElemento'), norma:v('norma'), unidade:v('unidadeMomento')||'tfm',
      usarMin:document.getElementById('usarMin').checked, modoAs:radio?radio.value:'area',
      nBarras:Number(v('nBarras')), diamBarras:Number(v('diamBarras')), diamEsp:Number(v('diamEsp')), espacamento:Number(v('espacamento')) };
  }
  function atualizar(r, erros) {
    ultimo=r;ultimosErros=erros||[];
    var el=document.getElementById('painelResumo');
    if(el)el.innerHTML=montar(r,opcoes(),ultimosErros);
  }
  function exportar() {
    if(!ultimo)throw new Error('Corrija as entradas antes de exportar.');
    return montar(ultimo,opcoes());
  }
  FS.PainelFlexao={montar:montar,geometria:geometria,dominios:dominios,equilibrio:equilibrio,
    atualizar:atualizar,exportar:exportar,quebrar:quebrar,LARGURA:W};
  if(typeof document!=='undefined') {
    var id=document.getElementById('idElemento');
    if(id)id.addEventListener('input',function(){atualizar(ultimo,ultimosErros);});
  }
})(typeof window !== 'undefined' ? window : globalThis);
