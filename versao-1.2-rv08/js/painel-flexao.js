/* Componentes vetoriais comuns, com composicoes distintas para tela e documento.
   O documento agrupa dados, modelo e uma faixa final de resultados.
   Sem valores fixos de exemplo, sem servicos externos e sem alterar o motor. */
(function (root) {
  'use strict';
  var FS = root.FS = root.FS || {};
  var W = 1100, VERSAO = '1.2.0', ultimo = null, ultimosErros = [];
  var COR = {texto:'#20252A',discreto:'#515A63',borda:'#AEB5BC',fundo:'#FFFFFF',cab:'#E9ECEF',azul:'#245E91',verde:'#1F6F46',vermelho:'#B42318',concreto:'#E9ECEF',traco:'#4E5964',aviso:'#855A00',graficoFundo:'#FFFFFF',graficoMalha:'#C4CBD1',graficoAtivo:'#245E91',graficoEixo:'#242424'};
  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c];
  }); }
  // Subscritos reais, tanto no painel quanto na exportacao vetorial.
  var SIMBOLOS = {'fctk,sup':['f','ctk,sup'], 'fck':['f','ck'], 'fyk':['f','yk'],
    'As′':['A′','s'], 'Rs′':['R′','s'], 'Md,mín':['M','d,mín'], 'fcd':['f','cd'], 'fyd':['f','yd'], 'εyd':['ε','yd'], 'εcu':['ε','cu'], 'εc2':['ε','c2'], 'As,adotada':['A','s,adotada'], 'As,considerada':['A','s,considerada'],
    'As,informada':['A','s,informada'], 'As,calc':['A','s,calc'], 'As,mín':['A','s,mín'],
    'As,máx':['A','s,máx'], 'As':['A','s'], 'Ac':['A','c'], 'bw':['b','w'], 'bf':['b','f'], 'hf':['h','f'],
    'MRd':['M','Rd'], 'MSd':['M','Sd'], 'Msk':['M','sk'], 'γf':['γ','f'], 'γc':['γ','c'], 'γs':['γ','s'], 'αc':['α','c'],
    'βx,lim':['β','x,lim'], 'βx':['β','x'], 'ρmín':['ρ','mín'], 'εs':['ε','s'], 'εc':['ε','c'],
    'Rt,eq':['R','t,eq'], 'Rc':['R','c'], 'Rs':['R','s']};
  var RX_SIMBOLOS = new RegExp('(^|[^A-Za-zÀ-ÿ])(' + Object.keys(SIMBOLOS).join('|') + ')(?=$|[^A-Za-zÀ-ÿ])', 'g');
  function matematico(t, tam) {
    var str=String(t), out='', last=0, m;
    RX_SIMBOLOS.lastIndex=0;
    while((m=RX_SIMBOLOS.exec(str))) {
      out+=esc(str.slice(last,m.index))+esc(m[1]);
      var p=SIMBOLOS[m[2]];
      out+=esc(p[0])+'<tspan baseline-shift="'+n(-tam*.18)+'" font-size="'+n(tam*.74)+'">'+esc(p[1])+'</tspan>';
      last=m.index+m[0].length;
    }
    return out+esc(str.slice(last));
  }
  function n(v) { return Math.round(v * 1000) / 1000; }
  function fmt(v, casas) {
    if (!Number.isFinite(v)) return '—';
    casas = casas === undefined ? 2 : Math.min(casas,2);
    if (v === 0) v = 0;
    if (v !== 0 && Math.abs(v) < Math.pow(10,-casas)/2) return v.toExponential(2).replace('.',',');
    return Math.abs(v)>=1e7 ? v.toExponential(2).replace('.',',') : v.toLocaleString('pt-BR',{minimumFractionDigits:casas,maximumFractionDigits:casas});
  }
  function texto(x, y, t, tam, cor, atr) {
    return '<text x="' + n(x) + '" y="' + n(y) + '" font-size="' + (tam || 19) +
      '" fill="' + (cor || COR.texto) + '"' + (atr || '') + '>' + matematico(t, tam || 19) + '</text>';
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
    var ctx=null;
    if(typeof document!=='undefined') {
      if(!largura.ctx)largura.ctx=document.createElement('canvas').getContext('2d');
      ctx=largura.ctx;
    }
    function measure(str,size){if(ctx){ctx.font='600 '+size+'px Segoe UI,Arial,sans-serif';return ctx.measureText(str).width;}return String(str).length*size*.62;}
    var str=String(t),sum=0,last=0,m;RX_SIMBOLOS.lastIndex=0;
    while((m=RX_SIMBOLOS.exec(str))){var p=SIMBOLOS[m[2]];sum+=measure(str.slice(last,m.index)+m[1]+p[0],tam)+measure(p[1],tam*.74);last=m.index+m[0].length;}
    return sum+measure(str.slice(last),tam);
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
  // Each component returns its actual height. Screen and document compose the
  // same analysis and vectors independently, without feeding formatting to the engine.
  function block(svg,h) {return {svg:svg,h:h};}
  function note(t,w,f,color) {var p=paragrafo(12,f+4,t,w-24,f,color||COR.discreto,f*1.45);return block(p.svg,p.altura+8);}
  function stack(parts,gap) {var y=0,s='';parts.forEach(function(p){s+='<g transform="translate(0 '+n(y)+')">'+p.svg+'</g>';y+=p.h+(gap||0);});return block(s,y);}
  function table(rows,w,f) {
    var y=5,s='',labelWidth=0,valueWidth=0;
    rows.forEach(function(row){labelWidth=Math.max(labelWidth,largura(row[0],f));valueWidth=Math.max(valueWidth,largura(row[1],f));});
    var right=Math.min(w-12,24+labelWidth+20+valueWidth);
    rows.forEach(function(row){
      var value=String(row[1]),label=String(row[0]);
      var separate=largura(label,f)+largura(value,f)+36>w;
      y+=f+3;s+=texto(12,y,label,f,COR.discreto);
      if(separate)y+=f+7;
      s+=texto(right,y,value,f,COR.texto,' text-anchor="end"'+(row[2]?' font-weight="600"':''));y+=5;
    });return block(s,y+f*.40);
  }
  function grid(rows,w,f,cols,passo) {
    cols=cols||2;var cw=(w-24)/cols;
    if(rows.some(function(row){return largura(row[0]+' = '+row[1],f)>cw-8;})){cols=1;cw=w-24;}
    var step=passo||f*1.6,s='',y=5;
    rows.forEach(function(row,i){var x=12+(i%cols)*cw,yy=y+f+Math.floor(i/cols)*step;
      var label=row[0]+' = ', value=String(row[1]);
      s+=texto(x,yy,label+value,f,row[2]?COR.azul:COR.texto,row[2]?' font-weight="600"':'');
    });return block(s,y+Math.ceil(rows.length/cols)*step+6);
  }
  function iconStroke(){return ' stroke="'+COR.traco+'" stroke-width="1.06" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.72" vector-effect="non-scaling-stroke"';}
  function iconAccent(){return ' stroke="'+COR.azul+'" stroke-width="1.14" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.78" vector-effect="non-scaling-stroke"';}
  function iconFill(col,op){return ' fill="'+(col||COR.azul)+'"'+(op?' fill-opacity="'+op+'"':' fill-opacity="0.14"');}
  function tituloIcone(id,x,y,size){
    var s=size||17, cx=x+s/2, cy=y+s/2, g='<g class="icone-titulo" aria-hidden="true">';
    g+='<rect x="'+n(x-.8)+'" y="'+n(y-.6)+'" width="'+n(s+1.6)+'" height="'+n(s+1.2)+'" rx="3" ry="3" fill="#F7F8F9" fill-opacity="0.52" stroke="#D8DDE3" stroke-opacity="0.55"/>';
    function L(x1,y1,x2,y2,a){return '<line x1="'+n(x+x1*s)+'" y1="'+n(y+y1*s)+'" x2="'+n(x+x2*s)+'" y2="'+n(y+y2*s)+'"'+(a||iconStroke())+'/>';}
    function R(rx,ry,rw,rh,a){return '<rect x="'+n(x+rx*s)+'" y="'+n(y+ry*s)+'" width="'+n(rw*s)+'" height="'+n(rh*s)+'"'+(a||iconStroke())+'/>';}
    function C(px,py,r,a){return '<circle cx="'+n(x+px*s)+'" cy="'+n(y+py*s)+'" r="'+n(r*s)+'"'+(a||iconStroke())+'/>';}
    function T(tx,ty,text,fs,a){return '<text x="'+n(x+tx*s)+'" y="'+n(y+ty*s)+'" font-size="'+n((fs||0.34)*s)+'" fill="'+COR.traco+'" opacity="0.72"'+(a||'')+'>'+esc(text)+'</text>';}
    function P(d,a){return '<path d="'+d+'"'+(a||iconStroke())+'/>';}
    if(id==='geometria'){
      g+=R(.20,.14,.42,.70)+L(.12,.16,.20,.16)+L(.12,.84,.20,.84)+L(.14,.18,.14,.82)+L(.10,.22,.18,.14)+L(.10,.86,.18,.78)+T(.03,.55,'h',.26);
      g+=L(.62,.16,.70,.16)+L(.62,.70,.70,.70)+L(.68,.18,.68,.68)+L(.64,.22,.72,.14)+L(.64,.72,.72,.64)+T(.76,.55,'d',.26);
      g+=L(.20,.90,.20,1.00)+L(.62,.90,.62,1.00)+L(.20,.98,.62,.98)+L(.17,1.00,.23,.94)+L(.59,1.00,.65,.94)+T(.34,1.20,'b',.26)+T(.45,1.09,'w',.18);
      g+=L(.28,.72,.56,.72,iconAccent());
    } else if(id==='materiais'){
      g+=R(.14,.12,.48,.72)+P('M '+n(x+.22*s)+' '+n(y+.12*s)+' L '+n(x+.62*s)+' '+n(y+.12*s)+' L '+n(x+.62*s)+' '+n(y+.24*s)+'',iconStroke());
      g+=L(.22,.64,.54,.64)+L(.22,.72,.54,.72)+L(.22,.80,.54,.80);
      g+=R(.52,.26,.28,.48)+L(.58,.40,.63,.45,iconAccent())+L(.63,.45,.73,.33,iconAccent())+L(.58,.56,.63,.61,iconAccent())+L(.63,.61,.73,.49,iconAccent())+L(.58,.72,.63,.77,iconAccent())+L(.63,.77,.73,.65,iconAccent());
    } else if(id==='esforco'){
      g+=L(.16,.82,.84,.82)+L(.18,.82,.18,.20)+L(.14,.86,.22,.78)+L(.78,.78,.86,.86);
      g+=P('M '+n(x+.22*s)+' '+n(y+.58*s)+' Q '+n(x+.50*s)+' '+n(y+.18*s)+' '+n(x+.78*s)+' '+n(y+.58*s),iconAccent());
      g+=L(.78,.58,.72,.52,iconAccent())+L(.78,.58,.70,.60,iconAccent());
      g+=L(.50,.06,.50,.32,iconAccent())+L(.46,.26,.50,.32,iconAccent())+L(.54,.26,.50,.32,iconAccent());
      g+=T(.78,.72,'M',.26)+T(.93,.80,'d',.18);
    } else if(id==='armaduras'||id==='verificacoes'){
      g+=R(.14,.12,.58,.70)+L(.24,.28,.58,.28,iconAccent())+L(.24,.46,.58,.46,iconAccent())+L(.24,.64,.58,.64,iconAccent());
      g+=L(.68,.30,.82,.30)+L(.82,.30,.82,.66)+L(.76,.42,.82,.30)+L(.76,.54,.82,.66);
    } else if(id==='dominios'){
      g+=R(.14,.12,.68,.70)+L(.14,.82,.82,.82)+L(.14,.82,.72,.24,iconStroke())+L(.14,.82,.82,.24,iconAccent())+L(.62,.12,.62,.82)+L(.58,.16,.66,.08)+L(.58,.86,.66,.78);
      g+=T(.68,.74,'0',.24);
    } else if(id==='equilibrio'){
      g+=R(.14,.12,.68,.70)+L(.14,.82,.82,.82)+L(.14,.82,.42,.24,iconStroke())+L(.42,.24,.42,.82,iconStroke())+L(.52,.20,.74,.20,iconAccent())+L(.74,.20,.68,.16,iconAccent())+L(.74,.20,.68,.24,iconAccent())+L(.52,.58,.82,.58,iconAccent())+L(.82,.58,.76,.54,iconAccent())+L(.82,.58,.76,.62,iconAccent());
    } else if(id==='resultados'){
      g+=R(.12,.14,.72,.66)+L(.12,.34,.84,.34)+L(.38,.14,.38,.80)+L(.60,.14,.60,.80);
      g+=L(.18,.54,.32,.44,iconAccent())+L(.32,.44,.46,.50,iconAccent())+L(.46,.50,.54,.28,iconAccent());
    }
    return g+'</g>';
  }
  function panel(id,title,part,x,y,w,f) {
    var head=f*1.55+5,h=head+part.h;
    var pad=f>=18?10.5:10, iconSize=f>=18?15:12.5, gap=f>=18?6.5:5.5, textX=x+pad+iconSize+gap;
    var iconY=y+Math.max(1,(head-iconSize)/2-0.45);
    return block('<g id="quadro-'+id+'">'+rect(x,y,w,h,'#fff',COR.borda)+rect(x+.5,y+.5,w-1,head,COR.cab)+tituloIcone(id,x+pad,iconY,iconSize)+texto(textX,y+f+8,title,f*1.12,COR.texto,' font-weight="600"')+'<g transform="translate('+x+' '+n(y+head)+')">'+part.svg+'</g></g>',h);
  }
  function dim(x1,y1,x2,y2,label,tx,ty,f) {
    return linha(x1,y1,x2,y2,COR.traco)+linha(x1-3,y1+3,x1+3,y1-3,COR.traco)+linha(x2-3,y2+3,x2+3,y2-3,COR.traco)+texto(tx,ty,label,f,COR.traco,' text-anchor="middle"');
  }
  function section(r,op,w,f) {
    var b=r.secaoT?r.bf:r.bw,scale=Math.min((w-110)/b,(op.compacto?100:150)/r.h),bw=r.bw*scale,bf=b*scale,h=r.h*scale;
    var cx=w/2-6,xl=cx-bf/2,xr=cx+bf/2,yt=r.secaoT?f+30:28,yb=yt+h,yd=yt+r.d*scale,ys=yt+r.dl*scale,s='';
    if(r.secaoT){var yf=yt+r.hf*scale;s+='<path d="M'+xl+' '+yt+' H'+xr+' V'+yf+' H'+(cx+bw/2)+' V'+yb+' H'+(cx-bw/2)+' V'+yf+' H'+xl+' Z" fill="'+COR.concreto+'" stroke="'+COR.traco+'" stroke-width="1.5"/>';}
    else s+=rect(xl,yt,bf,h,COR.concreto,COR.traco);
    var a=cx-bw*.38,z=cx+bw*.38;
    if(r.As>0){
      if(r.modo!=='MSD_AS'&&op.modoAs==='barras'&&Number.isInteger(op.nBarras)&&op.nBarras>0&&op.nBarras<=100){
        for(var i=0;i<op.nBarras;i++)s+='<circle class="barra-longitudinal" cx="'+n(op.nBarras===1?cx:a+(z-a)*i/(op.nBarras-1))+'" cy="'+n(yd)+'" r="'+n(Math.max(2,Math.min(4,op.diamBarras/20*scale)))+'" fill="'+COR.azul+'"/>';
      }else s+=linha(a,yd,z,yd,COR.azul,' style="stroke-width:3"');
    }
    if(r.Asl>0)s+=linha(a,ys,z,ys,COR.azul,' style="stroke-width:3" stroke-dasharray="5 2"');
    s+=linha(xl-20,yt,xl,yt)+linha(xl-20,yb,cx-bw/2,yb)+dim(xl-17,yt,xl-17,yb,'h',xl-30,(yt+yb)/2+f/3,f);
    s+=linha(xr,yt,xr+19,yt)+linha(cx+bw/2,yd,xr+19,yd)+dim(xr+15,yt,xr+15,yd,'d',xr+27,(yt+yd)/2,f);
    s+=linha(cx+bw/2,yd,xr+40,yd)+linha(cx+bw/2,yb,xr+40,yb)+dim(xr+36,yd,xr+36,yb,'',0,0,f);
    s+=linha(xr+36,(yd+yb)/2,xr+44,yb+14,COR.traco)+texto(xr+42,yb+f+15,'d′',f,COR.traco,' text-anchor="middle"');
    var q=yb+24;
    s+=linha(cx-bw/2,yb,cx-bw/2,q+3)+linha(cx+bw/2,yb,cx+bw/2,q+3)+dim(cx-bw/2,q,cx+bw/2,q,'bw',cx,q+f+4,f);
    if(r.secaoT)s+=linha(xl,yt,xl,f+5)+linha(xr,yt,xr,f+5)+dim(xl,f+7,xr,f+7,'bf',cx,f+3,f);
    var rows=[['bw',fmt(r.bw,1)+' cm'],['h',fmt(r.h,1)+' cm'],['d',fmt(r.d,1)+' cm'],['d′',fmt(r.dl,1)+' cm']];
    if(r.secaoT)rows.push(['bf',fmt(r.bf,1)+' cm'],['hf',fmt(r.hf,1)+' cm']);
    var desc='h = d + d′; afastamento efetivo simétrico. ';
    desc+='Distribuição ilustrativa — não constitui detalhamento.';
    if(op.soDesenho)return block(s,q+f+8);
    return stack(op.compacto?[block(s,q+f+8),grid(rows,w,f,2,f*1.35)]:[block(s,q+f+8),grid(rows,w,f),note(desc,w,f*.92)]);
  }
  function compactSection(r,op,w,f){
    if((r.secaoT?r.bf:r.bw)/r.h>1.6)return section(r,op,w,f);
    var drawWidth=w*.49,draw=section(r,Object.assign({},op,{soDesenho:true}),drawWidth,f);
    var rows=[['bw',fmt(r.bw,1)+' cm'],['h',fmt(r.h,1)+' cm'],['d',fmt(r.d,1)+' cm'],['d′',fmt(r.dl,1)+' cm']];
    if(r.secaoT)rows.push(['bf',fmt(r.bf,1)+' cm'],['hf',fmt(r.hf,1)+' cm']);
    var data=grid(rows,w-drawWidth-4,f,1,f*1.6),dy=Math.max(0,(draw.h-data.h)/2);
    return block(draw.svg+'<g transform="translate('+drawWidth+' '+dy+')">'+data.svg+'</g>',Math.max(draw.h,data.h+dy)+6);
  }
  function materials(r,op,w,f){return grid([['fck',fmt(r.fck,0)+' MPa'],['fyk',fmt(r.fyk,0)+' MPa'],['Tipo',r.tipoAco],['fctk,sup',fmt(r.fctkSup)+' MPa'],['γc',fmt(r.gammaC)],['γs',fmt(r.gammaS)],['λ',fmt(r.lambda,3)],['αc',fmt(r.alphaC,3)]],w,f,2,op.compacto?f*1.35:undefined);}
  function moment(v,op){return fmt(FS.EntradaFlexao.doMotor(v,op.unidade))+' '+FS.EntradaFlexao.rotulo(op.unidade);}
  function force(v,op){return fmt(v*(op.unidade==='kgfm'?100:1))+(op.unidade==='kgfm'?' kgf':' kN');}
  function loads(r,op,w,f){
    if(r.modo==='AS_MRD')return op.compacto?note('Sem demanda independente — avaliação de capacidade. γf = '+fmt(r.gammaF)+' (não aplicado).',w,f):stack([note('Sem demanda independente — avaliação de capacidade.',w,f),table([['γf (não aplicado)',fmt(r.gammaF)]],w,f)]);
    var rows=[['Msk',moment(r.MskTfm,op)],['γf',fmt(r.gammaF)],['MSd',moment(r.MsdTfm,op)]];
    return op.compacto?grid(rows,w,f,3,f*1.35):table(rows,w,f);
  }

  function quaseIgual(a,b){return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(a),Math.abs(b));}
  function minimaAlterouEstado(r){return r.modo==='MSD_AS'&&r.As>r.asCalc&&!quaseIgual(r.As,r.asCalc);}
  function avisoEstado(r){return !r?'':r.modo!=='MSD_AS'?'Diagramas: estado resistente MRd da armadura informada; não representam deformações de serviço.':r.Msd===0?'Momento nulo: domínio e deformações são convenções do motor, não resposta em serviço.':'';}
  function nomeModo(r){return !r?'Análise indisponível':r.modo==='AS_MRD'?'Armadura → capacidade':r.modo==='AS_MSD'?'Armadura adotada × momento solicitante':'Momento → armadura';}
  function ordenarAreas(r){
    var rows=r.modo==='MSD_AS'?[{id:'adotada',rotulo:'As,adotada',valor:r.As,prioridade:0},{id:'calc',rotulo:'As,calc',valor:r.asCalc,prioridade:1},{id:'min',rotulo:'As,mín',valor:r.asMin,prioridade:2}]:[{id:'adotada',rotulo:r.modo==='AS_MRD'?'As,considerada':'As,adotada',valor:r.As,prioridade:0},{id:'min',rotulo:'As,mín',valor:r.asMin,prioridade:2}];
    if(rows.some(function(a){return !Number.isFinite(a.valor);}))return {itens:rows,operadores:[],texto:'Comparação indisponível',casas:2};
    rows.sort(function(a,b){return b.valor-a.valor||a.prioridade-b.prioridade;});
    // Group numerical ties against a fixed representative; no non-transitive sort comparator.
    var grouped=[],i=0;
    while(i<rows.length){var group=[rows[i]],anchor=rows[i].valor;i++;while(i<rows.length&&quaseIgual(anchor,rows[i].valor)){group.push(rows[i++]);}group.sort(function(a,b){return a.prioridade-b.prioridade;});grouped=grouped.concat(group);}
    rows=grouped;var ops=rows.slice(1).map(function(a,j){return quaseIgual(rows[j].valor,a.valor)?'=':'>';});
    var casas=2;
    var text=rows.map(function(a,j){return (j?' '+ops[j-1]+' ':'')+a.rotulo;}).join('');
    return {itens:rows,operadores:ops,texto:text,casas:casas};
  }
  function compareAreas(r){return ordenarAreas(r).texto;}
  function regraArmadura(r,op){
    if(r.modo!=='MSD_AS')return op.modoAs==='barras'?op.nBarras+' barras Ø '+fmt(op.diamBarras,1)+' mm':op.modoAs==='esp'?'Ø '+fmt(op.diamEsp,1)+' c/ '+fmt(op.espacamento,1)+' cm — faixa de 1 m':'Área informada; sem adoção automática.';
    if(!op.usarMin)return 'Mínima não adotada automaticamente.';
    if(!(r.Msd>0))return 'Momento nulo; mínima não adotada pelo motor.';
    return minimaAlterouEstado(r)?'Governa: armadura mínima.':quaseIgual(r.asCalc,r.asMin)?'Cálculo e mínimo coincidem.':'Governa: cálculo.';
  }
  // No Cartesian mesh: only physical/domain reference lines have meaning here.

  function plotGrid(x,y,w,h){
    var s='<g class="malha-grafico" fill="none" stroke="'+COR.graficoMalha+'" stroke-width="0.8" stroke-dasharray="1 4">';
    for(var i=1;i<12;i++)s+='<path d="M'+n(x+w*i/12)+' '+n(y)+' V'+n(y+h)+'"/>';
    for(var j=1;j<8;j++)s+='<path d="M'+n(x)+' '+n(y+h*j/8)+' H'+n(x+w)+'"/>';
    return s+'</g>';
  }
  function reinforcement(r,op,w,f){
    var inv=r.modo!=='MSD_AS',decimals=ordenarAreas(r).casas;
    var rows=[];
    if(!inv)rows.push(['As,calc',fmt(r.asCalc,decimals)+' cm²']);
    else rows.push(['As,informada',fmt(r.As,decimals)+' cm²']);
    rows.push(['As,mín',fmt(r.asMin,decimals)+' cm²'],[r.modo==='AS_MRD'?'As,considerada':'As,adotada',fmt(r.As,decimals)+' cm²',true],['As′',fmt(r.Asl)+' cm²'],['ρmín',fmt(r.rhoMin*100,3)+' %'],['Ac',fmt(r.Ac,1)+' cm²'],['As,máx',fmt(r.asMax)+' cm²'],['Md,mín',moment(r.MdMinTfm,op)]);
    if(op.compacto)return stack([grid(rows,w,f,4,f*1.35),note(compareAreas(r)+' · '+regraArmadura(r,op),w,f)]);
    var parts=[table(rows,w,f),note(regraArmadura(r,op),w,f*.92)];
    if(!op.compacto)parts.push(note(compareAreas(r),w,f));
    return stack(parts);
  }
  function avisoFormatado(t){return String(t).replace(/(-?\d+)\.(\d{3,})/g,function(_,a,b){return fmt(Number(a+'.'+b));});}
  function checks(r,op,w,f){
    if(r.modo!=='AS_MSD')return block('',0);
    var parts=(r.verificacoes||[]).map(function(v){
      var color=v.situacao==='NÃO ATENDE'?COR.vermelho:v.situacao==='ATENDE'?COR.verde:COR.aviso;
      function value(x){return v.unidade==='momento'?moment(x,op):fmt(x)+(v.unidade?' '+v.unidade:'');}
      var ratio=v.razao===null?'—':v.razao===Infinity?'∞':fmt(v.razao);
      var head=note(v.titulo+' · '+v.situacao,w,f,color);
      var detail=note('Demanda: '+value(v.demanda)+' → Capacidade: '+value(v.capacidade)+' · D/C = '+ratio+' · '+v.criterio+(v.id==='flexao'?' · FS = '+(v.situacao==='INCONCLUSIVO'||!(v.demanda>0)?'—':fmt(v.capacidade/v.demanda)):''),w,f*.92);
      return stack([head,detail]);
    });
    parts.push(note('Critério governante: '+r.criterioGovernante+'. Situações calculadas com precisão integral; D/C ≤ 1 atende.',w,f*.90));
    return stack(parts);
  }

  function response(r,op,w,f){
    var data=op.documento?grid([['βx = x/d',fmt(r.betaX,3)],['βx,lim',fmt(r.betaXLim,3)]],w,f,2,op.compacto?f*1.35:undefined):table([['Linha neutra x',fmt(r.x)+' cm'],['βx = x/d',fmt(r.betaX,3)],['βx,lim',fmt(r.betaXLim,3)]],w,f);
    var parts=op.compacto?[summary(r,op,w,f)]:op.documento?[summary(r,op,w,f),data]:[data];
    

    if(minimaAlterouEstado(r)&&!op.compacto)parts.push(note('Estado antes da mínima: diagramas do dimensionamento. D/C e FS do resumo reverificam a armadura adotada.',w,f*.92,COR.aviso));
    return stack(parts);
  }

  function domains(r,op,w,f){
    var left=28,right=w-32,top=op.compacto?56:70,bottom=top+(op.compacto?108:op.documento?190:170),yd=top+r.d/r.h*(bottom-top);
    var emin=Math.min(-10,-r.epsS,r.epsC),emax=Math.max(r.epsCu,r.epsC,-r.epsS),k=(right-left)/(emax-emin),X=function(e){return left+(e-emin)*k;};
    var A=[X(-10),yd],B=[X(r.epsCu),top],O=[X(0),top],Y=[X(-r.epsYd),yd],D=[X(0),yd],H=[X(0),bottom],C=[X(r.epsC2),top+(1-r.epsC2/r.epsCu)*(bottom-top)];
    function line(a,b,c,extra){return linha(a[0],a[1],b[0],b[1],c,extra);}
    function at(a,b,y){return a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]);}
    function poly(points){return '<polygon points="'+points.map(function(p){return p.join(',');}).join(' ')+'" fill="#245E91" fill-opacity="0.06"/>';}
    var s=texto(12,20,'Alongamento (−)',f*.9,COR.discreto)+texto(w-12,20,'Encurtamento (+)',f*.9,COR.discreto,' text-anchor="end"');
    s+=rect(left,top,right-left,bottom-top,COR.graficoFundo,COR.traco);
    var regions={'1':[[left,top],O,A], '2':[O,B,A],'3':[A,B,Y],'4':[B,Y,D],'4a':[B,D,H],'5':[B,H,[X(r.epsCu),bottom]]};
    if(regions[String(r.dominio)])s+=poly(regions[String(r.dominio)]);
    // Domain boundaries, not a decorative Cartesian grid.
    s+=linha(left,yd,right,yd,COR.borda,' stroke-dasharray="3 4"');
    [[A,O],[A,B],[B,Y],[B,D],[B,H],[[C[0],top],[C[0],bottom]]].forEach(function(p){s+=line(p[0],p[1],COR.traco);});
    s+=linha(X(0),top-5,X(0),bottom+8,COR.graficoEixo);
    var yy=top+.46*(yd-top),yyy=top+.89*(yd-top);
    [['1',(left+at(A,O,yy))/2,yy],['2',(at(A,O,yy)+at(A,B,yy))/2,yy],['3',(at(A,B,yyy)+at(B,Y,yyy))/2,yyy],['4',(at(B,Y,yyy)+at(B,D,yyy))/2,yyy],['5',(at(B,H,yyy)+X(r.epsCu))/2,yyy]].forEach(function(p){if(p[0]==='2'){
      var best=[p[1],p[2],-1],activeTop=[X(r.epsC),top],activeBottom=[X(-r.epsS),yd];
      function dist(q,a,b){return Math.abs((b[0]-a[0])*(a[1]-q[1])-(a[0]-q[0])*(b[1]-a[1]))/Math.hypot(b[0]-a[0],b[1]-a[1]);}
      for(var iy=1;iy<20;iy++)for(var ix=1;ix<20;ix++){var yq=top+(yd-top)*iy/20,lq=at(A,O,yq),rq=at(A,B,yq),q=[lq+(rq-lq)*ix/20,yq],score=Math.min(dist(q,A,O),dist(q,A,B),yq-top,dist(q,activeTop,activeBottom));if(score>best[2])best=[q[0],q[1],score];}
      p[1]=best[0];p[2]=best[1]+f*.3;
    }s+=texto(p[1],p[2],p[0],f*.9,COR.discreto,' text-anchor="middle"');});
    // 4a is a narrow wedge; a leader labels its actual interior without hiding it.
    var ya=yd+(bottom-yd)*.45,xa=(X(0)+at(B,H,ya))/2;
    s+=linha(xa,ya,xa+26,bottom+23,COR.traco)+texto(xa+28,bottom+f+25,'4a',f*.88,COR.discreto);
    s+=line([X(r.epsC),top],[X(-r.epsS),yd],COR.graficoAtivo,' class="estado-atual" style="stroke-width:2.3"');
    var poles=[[A,'A',-10,18]];
    if(Math.hypot(B[0]-C[0],B[1]-C[1])<f*1.4)poles.push([B,'B/C',4,f*.9,'start']);
    else poles.push([B,'B',9,-5],[C,'C',8,-8]);
    poles.forEach(function(p){s+='<circle cx="'+p[0][0]+'" cy="'+p[0][1]+'" r="2.5" fill="'+COR.traco+'"/>'+texto(p[0][0]+p[2],p[0][1]+p[3],p[1],f*.88,COR.traco,p[4]?' text-anchor="'+p[4]+'"':'');});
    s+=texto(left,top-10,'−10‰',f*.88,COR.discreto)+texto(X(0)-6,top-10,'0',f*.88,COR.discreto,' text-anchor="end"')+texto(right,top-10,fmt(r.epsCu)+'‰',f*.88,COR.discreto,' text-anchor="end"');
    // Endpoint labels live outside the plot and have explicit leader lines.
    s+=linha(X(r.epsC),top,w*.58,top-26,COR.graficoAtivo)+texto(w*.58-5,top-28,'εc',f*.88,COR.graficoAtivo,' text-anchor="end"');
    s+=linha(X(-r.epsS),yd,left+24,bottom+24,COR.graficoAtivo)+texto(left+24,bottom+f+25,'εs',f*.88,COR.graficoAtivo);
    var parts=[block(s,bottom+f+38),grid([['εs',fmt(r.epsS)+' ‰'],['εc',fmt(r.epsC)+' ‰'],['εyd',fmt(r.epsYd)+' ‰'],['εc2',fmt(r.epsC2)+' ‰']],w,f,2,op.compacto?f*1.35:undefined)];
    if(!op.compacto)parts.push(note('Polos A: aço; B: concreto na face; C: compressão. Eixo vertical: deformação nula.',w,f*.92));
    return stack(parts);
  }
  function equilibrium(r,op,w,f){
    var top=op.compacto?56:50,bottom=top+(op.compacto?108:op.documento?190:150),sy=(bottom-top)/r.h,yd=top+r.d*sy,ys=top+r.dl*sy,yn=top+r.x*sy,yb=top+r.y*sy,xe=w*.22,xs=w*.61;
    var ke=(w*.17)/Math.max(Math.abs(r.epsS),Math.abs(r.epsC),1),s=texto(w*.22,24,'Deformações',f*.92,COR.discreto,' text-anchor="middle"')+texto(w*.73,24,'Tensões e resultantes',f*.92,COR.discreto,' text-anchor="middle"');
    s+=rect(16,top,w-32,bottom-top,COR.graficoFundo,COR.traco);
    s+=linha(16,top,w-16,top,COR.graficoEixo)+linha(16,yd,w-16,yd,COR.borda,' stroke-dasharray="2 4"');
    s+=linha(xe,top-4,xe,bottom+5,COR.traco)+linha(xe+r.epsC*ke,top,xe-r.epsS*ke,yd,COR.graficoAtivo,' style="stroke-width:2.3"');
    if(yn>=top&&yn<=bottom){s+=linha(16,yn,w-16,yn,COR.traco,' stroke-dasharray="6 4"');s+=texto(18,Math.max(top+f+7,yn-5),'LN',f*.88,COR.traco);}
    s+=linha(xs,top,xs,bottom,COR.traco)+rect(xs,top,w*.13,Math.max(0,Math.min(bottom,yb)-top),COR.concreto,COR.traco);
    var forceLen=w*.14,forceX=w*.82;
    function arrow(value,y,color,label){if(Math.abs(value)<1e-10)return '';var end=forceX+(value>0?-forceLen:forceLen);return '<g class="resultante" data-forca="'+value+'" data-nivel="'+n(y)+'">'+linha(forceX,y,end,y,color,' style="stroke-width:2"')+'<path d="M'+end+' '+y+' l'+(end>forceX?-6:6)+' -3 v6 Z" fill="'+color+'"/>'+texto(label==='Rs′'?(forceX+end)/2:forceX,y+(label==='Rs′'?-7:16),label,f*.88,color,' text-anchor="middle"')+'</g>';}
    var special=r.secaoT&&r.y>r.hf;
    if(!special)s+=arrow(r.Rcc,(top+yb)/2,COR.traco,'Rc');
    s+=arrow(-(r.Rcc+r.Rsc),yd,COR.graficoAtivo,'Rt,eq');
    // Positive upper steel stress means compression; its sign comes from the engine.
    s+=arrow(r.Rsc,ys,COR.traco,'Rs′');
    var notes='Rt,eq = Rc + Rs′ = '+force(r.Rcc+r.Rsc,op)+'.'+(op.compacto?'':' Setas esquemáticas; soma por identidade.');
    if(special)notes+=' Seção T: bloco equivalente na alma; posição de Rc não fornecida pelo estado do motor, seta omitida.';
    if(r.x>r.h)notes+=' LN fora da seção (x > h).';
    var data=grid([['x',fmt(r.x)+' cm'],['y = λx',fmt(r.y)+' cm'],['Rc',force(r.Rcc,op)],['Rs′',force(r.Rsc,op)]],w,f,2,op.compacto?f*1.35:undefined);
    if(op.compacto){
      var eq=texto(12,bottom+f+8,'Rt,eq = Rc + Rs′ = '+force(r.Rcc+r.Rsc,op),f*.92,COR.discreto);
      var parts=[block(s+eq,bottom+f+24),data];
      if(special||r.x>r.h)parts.push(note(notes,w,f*.92));
      return stack(parts);
    }
    return stack([block(s,bottom+30),data,note(notes,w,f*.92)]);
  }
  function summary(r,op,w,f){
    if(!r)return note('Resultados indisponíveis — corrija as entradas.',w,f,COR.vermelho);
    var inv=r.modo==='AS_MRD',check=r.modo==='AS_MSD',s='',val=inv?moment(r.MRdTfm,op):fmt(r.As,ordenarAreas(r).casas)+' cm²',label=inv?'MRd · capacidade resistente':'As,adotada · armadura';
    if(check&&!op.compacto){
      var v=r.verificacoes[0],ratio=v.razao===Infinity?'∞':fmt(v.razao),color=v.situacao==='ATENDE'?COR.verde:v.situacao==='NÃO ATENDE'?COR.vermelho:COR.aviso;
      if(w<900)return stack([grid([['As,adotada',fmt(r.As)+' cm²'],['MSd',moment(r.MsdTfm,op)],['MRd',moment(r.MRdTfm,op)],['D/C',ratio]],w,f),note('Resistência à flexão: '+v.situacao,w,f,color)]);
      [[0,'As,adotada',fmt(r.As)+' cm²'],[.23,'MSd · aplicado',moment(r.MsdTfm,op)],[.47,'MRd · capacidade',moment(r.MRdTfm,op)],[.74,'Resistência à flexão',v.situacao+' · D/C '+ratio]].forEach(function(a,i){s+=texto(12+w*a[0],f+5,a[1],f*.92,COR.discreto)+texto(12+w*a[0],f*3+7,a[2],f*1.08,i===3?color:COR.texto,' font-weight="600"');});
      return block(s,f*3.6+12);
    }
    if(op.compacto){
      var fields=(inv||check)?[[.00,check?'MRd · capacidade':label,moment(r.MRdTfm,op)],[.32,check?'As,adotada':'As,considerada',fmt(r.As,ordenarAreas(r).casas)+' cm²'],[.54,'Domínio',String(r.dominio)],[.67,'βx = x/d',fmt(r.betaX,3)],[.84,'βx,lim',fmt(r.betaXLim,3)]]:[[.00,label,val],[.43,'Domínio',String(r.dominio)],[.59,'βx = x/d',fmt(r.betaX,3)],[.82,'βx,lim',fmt(r.betaXLim,3)]];
      fields.forEach(function(a,i){s+=texto(12+w*a[0],f+5,a[1],f*.92,COR.discreto)+texto(12+w*a[0],f*2.7+7,a[2],i===0?f*1.3:f*1.08,i===0?COR.azul:COR.texto,' font-weight="600"');});
      return block(s,f*3+12);
    }
    var sections=[[12,w*.46,label,val],[w*.49,w*.31,inv?'As,considerada':check?'MRd · capacidade':'MSd',inv?fmt(r.As)+' cm²':moment(check?r.MRdTfm:r.MsdTfm,op)],[w*.82,w*.16,'Domínio',String(r.dominio)]];
    sections.forEach(function(a,i){s+=texto(a[0],f+5,a[2],f*.92,COR.discreto)+texto(a[0],f*(op.compacto?2.7:3)+7,a[3],i===0?f*(op.compacto?1.3:1.5):f*1.08,i===0?COR.azul:COR.texto,' font-weight="600"');});
    return block(s,f*(op.compacto?3.0:3.6)+12);
  }

  function montar(r,op,erros){
    op=Object.assign({elemento:'',norma:'2023',unidade:'tfm',usarMin:true,modoAs:'area',documento:false},op||{});
    op.compacto=!!op.documento&&op.composicao!=='ampliada';
    var doc=op.documento,w=doc?1000:1100,f=doc?18.5:13,gap=op.compacto?12:doc?16:12,m=14,inner=w-2*m,s='',y=0;
    var title=paragrafo(m,f+10,'ELEMENTO — '+(op.elemento.trim()||'não informado'),inner,f*1.15,COR.texto,f*1.6);s+=title.svg;y=title.altura+(op.compacto?2:10);
    var mode=nomeModo(r);
    s+=texto(m,y+f,mode+' · NBR 6118:'+op.norma+' · Flexão simples',f*.94,COR.discreto);y+=f*(op.compacto?1.5:2)+(op.compacto?4:8);
    if(!doc){var syn=summary(r,op,inner,f);s+=rect(m,y,inner,syn.h,'#F3F4F5',COR.borda)+'<g transform="translate('+m+' '+y+')">'+syn.svg+'</g>';y+=syn.h+gap;}
    if(!op.compacto&&avisoEstado(r)){var st=note(avisoEstado(r),inner,f*.92);s+='<g transform="translate('+m+' '+y+')">'+st.svg+'</g>';y+=st.h+4;}
    var draw=function(id,title,fn,x,yy,ww){var body=r?fn(r,op,ww,f):note('Aguardando dados válidos.',ww,f);var p=panel(id,title,body,x,yy,ww,f);s+=p.svg;return yy+p.h+gap;};
    if(doc&&op.compacto){
      var a=inner*.37,b=inner-a-gap,x2=m+a+gap;
      var ya=draw('geometria','Seção transversal',compactSection,m,y,a);
      var yb=draw('materiais','Materiais / critérios',materials,x2,y,b);
      yb=draw('esforco',r&&r.modo==='AS_MRD'?'Modo de cálculo':'Carregamento',loads,x2,yb,b);
      y=Math.max(ya,yb);
      y=draw('armaduras','Armaduras / limites',reinforcement,m,y,inner);
      if(r&&minimaAlterouEstado(r)){
        var state=note('Estado antes da mínima: diagramas para As,calc = '+fmt(r.asCalc)+' cm²; As,adotada = '+fmt(r.As)+' cm². D/C e FS do resumo reverificam a área adotada.',inner,f*.92,COR.aviso);
        s+='<g transform="translate('+m+' '+y+')">'+state.svg+'</g>';y+=state.h+4;
      }
      if(avisoEstado(r)){var st=note(avisoEstado(r),inner,f*.92);s+='<g transform="translate('+m+' '+y+')">'+st.svg+'</g>';y+=st.h+4;}
      var cw=(inner-gap)/2,right=m+cw+gap;
      var yd=draw('dominios','Domínios de deformação',domains,m,y,cw);
      var ye=draw('equilibrio','Equilíbrio da seção',equilibrium,right,y,cw);y=Math.max(yd,ye);
      y=draw('resultados',r&&r.modo==='AS_MSD'?'Resultados da seção':'Resultados da seção',response,m,y,inner);
    }else if(doc){
      var cw=(inner-gap)/2,right=m+cw+gap,leftY=y,rightY=y;
      leftY=draw('geometria','Seção transversal',section,m,leftY,cw);
      rightY=draw('armaduras','Armaduras / limites',reinforcement,right,rightY,cw);
      var secondRow=Math.max(leftY,rightY);
      leftY=draw('materiais','Materiais / critérios',materials,m,secondRow,cw);
      rightY=draw('esforco','Carregamento / modo de cálculo',loads,right,secondRow,cw);
      y=Math.max(leftY,rightY);leftY=draw('dominios','Modelo · domínios de deformação',domains,m,y,cw);rightY=draw('equilibrio','Modelo · equilíbrio da seção',equilibrium,right,y,cw);y=Math.max(leftY,rightY);
      y=draw('resultados','Resultados da seção',response,m,y,inner);

    }else{
      var available=inner-2*gap,a=available*.30,b=available*.28,c=available*.42,x2=m+a+gap,x3=x2+b+gap;
      var y1=draw('geometria','Seção transversal',section,m,y,a);y1=draw('materiais','Materiais / critérios',materials,m,y1,a);y1=draw('esforco','Carregamento / modo',loads,m,y1,a);
      var y2=draw('armaduras','Armaduras',reinforcement,x2,y,b);y2=draw('resultados','Resposta da seção',response,x2,y2,b);
      var y3=draw('dominios','Domínios de deformação',domains,x3,y,c);y3=draw('equilibrio','Equilíbrio da seção',equilibrium,x3,y3,c);y=Math.max(y1,y2,y3);
    }
    if(r&&r.modo==='AS_MSD')y=draw('verificacoes','Verificação da armadura adotada × esforço aplicado',checks,m,y,inner);
    var warnings=(r?r.avisos||[]:erros||[]).slice();
    warnings.forEach(function(a){var p=note((r?'Advertência: ':'Entrada inválida: ')+avisoFormatado(a).replace(/<[^>]*>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>'),inner,f*.9,r?COR.aviso:COR.vermelho);s+='<g transform="translate('+m+' '+y+')">'+p.svg+'</g>';y+=p.h;});
    var conclusion=!r?'Conclusão: análise inválida; resultados e desenhos anteriores removidos.':r.modo==='AS_MRD'?'Conclusão: capacidade da armadura informada; sem demanda independente para aprovação global.':r.modo==='AS_MSD'?'Verificações disponíveis: '+r.atendimentoSecao+'. Resultado restrito aos quatro critérios exibidos; conferir detalhamento.':(r.avisos.length?'Conclusão: conferir as advertências e a armadura adotada.':'Dimensionamento por momento. Conferir detalhamento.');
    var end=note(conclusion,inner,f*.9);s+='<g transform="translate('+m+' '+y+')">'+end.svg+'</g>';y+=end.h+6;
    s+=linha(m,y,w-m,y);y+=4;
    if(op.compacto){var legend=note('h = d + d′; d′ efetivo simétrico. Distribuição ilustrativa, sem detalhamento. A: aço; B: concreto na face; C: compressão. Eixo vertical: ε = 0. Setas esquemáticas; Rt,eq por identidade.',inner,f*.92);s+='<g transform="translate('+m+' '+y+')">'+legend.svg+'</g>';y+=legend.h;}
    var foot=note('Flexão Simples '+VERSAO+' · RV08 · Face comprimida no topo. Convenção legada: 10 N = 1 kgf; 1 tf·m = 10 kN·m.',inner,f*.88);s+='<g transform="translate('+m+' '+y+')">'+foot.svg+'</g>';y+=foot.h+5;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+Math.ceil(y)+'" viewBox="0 0 '+w+' '+Math.ceil(y)+'" role="img" aria-label="'+(doc?'Memorial: dados, modelo e resultados':'Painel técnico de flexão simples')+'" data-versao="'+VERSAO+'" data-revisao="RV08"><style>text{font-family:Segoe UI,Arial,sans-serif;font-variant-numeric:tabular-nums}</style>'+rect(0,0,w,y,'#fff')+s+'</svg>';
  }
  function opcoes(){function v(id){var e=document.getElementById(id);return e?e.value:'';}var radio=document.querySelector('input[name="modoAs"]:checked');return {elemento:v('idElemento'),norma:v('norma'),unidade:v('unidadeMomento')||'tfm',usarMin:document.getElementById('usarMin').checked,composicao:v('composicaoDocumento')||'compacta',modoAs:radio?radio.value:'area',nBarras:Number(v('nBarras')),diamBarras:Number(v('diamBarras')),diamEsp:Number(v('diamEsp')),espacamento:Number(v('espacamento'))};}
  function metricas(svg){var match=/viewBox="0 0 ([0-9.]+) ([0-9.]+)"/.exec(svg);if(!match)return '';var w=+match[1],h=+match[2];return '16,5 × '+fmt(16.5*h/w,1)+' cm · 2.000 × '+Math.round(2000*h/w).toLocaleString('pt-BR')+' px';}
  function atualizarMetricas(){
    if(typeof document==='undefined')return;
    var label=document.getElementById('dimensoesDocumento'),button=document.getElementById('btPreviaDocumento');
    if(button)button.disabled=!ultimo;
    if(label)label.textContent=ultimo?metricas(exportar()):'Prévia indisponível: corrija as entradas.';
    var dialog=document.getElementById('previaDocumento');
    if(dialog&&dialog.open){if(ultimo)abrirPrevia();else dialog.close();}
  }
  function abrirPrevia(){
    if(!ultimo)return;
    var svg=exportar(),dialog=document.getElementById('previaDocumento'),body=document.getElementById('folhaPrevia'),info=document.getElementById('metricasPrevia');
    if(!dialog||!body||!info)return;
    body.innerHTML=svg;info.textContent=metricas(svg)+'. Resumo da seção com seção transversal, diagrama MRd × As e tabela de esforços; D/C e FS da armadura adotada. A altura aumenta apenas quando o conteúdo exigir.';
    if(!dialog.open)dialog.showModal();
  }
  function atualizar(r,erros){ultimo=r;ultimosErros=erros||[];var el=document.getElementById('painelResumo');if(el)el.innerHTML=r?resumoTela(r):montar(r,opcoes(),ultimosErros);atualizarMetricas();}
  function resumoTela(r){try{return FS.ResumoHorizontal.flexao(r,opcoes());}catch(e){return montar(r,opcoes(),ultimosErros);}}
  function exportar(){if(!ultimo)throw new Error('Corrija as entradas antes de exportar.');return FS.ResumoHorizontal.flexao(ultimo,opcoes());}
  function graphic(fn,r){var part=fn(r,{},720,18);return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 '+part.h+'" style="font-family:Segoe UI,Arial,sans-serif">'+part.svg+'</svg>';}

  function indicesAdotada(r,op,w,f){
    var a=FS.ResumoHorizontal.avaliarFlexao(r,op),q=a.resultado;
    return table([['As,adotada',fmt(q.As)+' cm²'],['MRd da armadura adotada',moment(q.MRdTfm,op)],['D/C = MSd/MRd',a.dc===Infinity?'∞':fmt(a.dc===null?NaN:a.dc)],['FS = MRd/MSd',fmt(a.fs===null?NaN:a.fs)],['Critérios avaliados',a.situacao]],w,f);
  }
  function conferirAdotada(r,op,w,f){return checks(FS.ResumoHorizontal.avaliarFlexao(r,op).resultado,op,w,f);}
  function relatorioCompleto(){
    if(!ultimo)throw new Error('Corrija as entradas antes de exportar.');
    var r=ultimo,op=opcoes();
    var rows=[['fcd',fmt(r.fcd*10)+' MPa'],['fyd',fmt(r.fyd*10)+' MPa'],['fctm',fmt(r.fctm)+' MPa'],['fctk,inf',fmt(r.fctkInf)+' MPa'],['fctk,sup',fmt(r.fctkSup)+' MPa'],['εyd',fmt(r.epsYd)+' ‰'],['εc2',fmt(r.epsC2)+' ‰'],['εcu',fmt(r.epsCu)+' ‰'],['εs′',fmt(r.epsSl)+' ‰'],['σs′',fmt(r.sigmaSl*10)+' MPa'],['λ',fmt(r.lambda,3)],['αc',fmt(r.alphaC,3)],['W0',fmt(r.W0)+' cm³']];
    var extra=rows.map(function(a){return '<tr><th>'+esc(a[0])+'</th><td>'+esc(a[1])+'</td></tr>';}).join('');
    function component(title,fn){var part=fn(r,op,700,18.5);return '<section><h2>'+esc(title)+'</h2><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 '+part.h+'" style="font-family:Segoe UI,Arial,sans-serif">'+part.svg+'</svg></section>';}
    var warning=(r.avisos||[]).map(function(a){return '<p>'+esc(avisoFormatado(a))+'</p>';}).join('');
    return '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Memória de cálculo — '+esc(op.elemento||'não informado')+'</title><style>body{font:10pt Segoe UI,Arial,sans-serif;color:#20252A;max-width:165mm;margin:12mm auto}svg{width:100%;height:auto}h1{font-size:14pt}h2{font-size:11pt;border-bottom:1px solid #AEB5BC;padding:5px 0}table{width:100%;border-collapse:collapse}th,td{padding:4px 8px;border-bottom:1px solid #aeb5bc;text-align:left}td{text-align:right}section{break-inside:avoid}p{line-height:1.4}@page{size:A4;margin:18mm 22.5mm}@media print{body{margin:0}button{display:none}}</style><button onclick="window.print()">Imprimir / salvar PDF</button><h1>Flexão simples · memória de cálculo</h1><p>ELEMENTO — '+esc(op.elemento||'não informado')+'</p><p>Modo: '+nomeModo(r)+' · Versão '+VERSAO+'</p><h2>Critérios / norma</h2><p>ABNT NBR 6118:'+esc(op.norma)+'. Conversão adotada: 10 N = 1 kgf; 1 tf·m = 10 kN·m. Face comprimida no topo; h = d + d′, afastamento efetivo simétrico. Limites e hipóteses do motor existente, sem atualização normativa nesta revisão.</p>'+component('Materiais e coeficientes',materials)+component('Geometria e armaduras informadas',section)+component('Carregamento / modo de cálculo',loads)+(avisoEstado(r)?'<p>'+esc(avisoEstado(r))+'</p>':'')+component('Modelo · domínios de deformação',domains)+component('Modelo · equilíbrio da seção',equilibrium)+'<h2>Parâmetros intermediários</h2><table>'+extra+'</table>'+component('Resultados da seção',response)+component('Síntese dos resultados',summary)+component('Armadura adotada · D/C e FS',indicesAdotada)+'<h2>Verificações e alcance</h2>'+(r.modo!=='AS_MRD'?component('Critérios avaliados',conferirAdotada):'')+warning+'<p>'+(r.modo==='AS_MSD'?'Verificações disponíveis: '+r.atendimentoSecao+'. MSd = '+moment(r.MsdTfm,op)+'; MRd = '+moment(r.MRdTfm,op)+'. Alcance restrito aos critérios listados; sem aprovação global.':r.modo==='AS_MRD'?'Sem demanda independente: relação demanda/capacidade e aprovação global não aplicáveis.':'Dimensionamento por momento solicitante. Os diagramas mostram o estado do dimensionamento; os quadros de D/C, FS e verificações usam a armadura efetivamente adotada.')+' Rt,eq = Rc + Rs′ é uma identidade, não verificação independente.</p>'+component('Solução adotada e limites de armadura',reinforcement)+'<h2>Conclusão</h2><p>'+(r.modo==='AS_MRD'?'Capacidade resistente MRd = '+moment(r.MRdTfm,op)+' para a armadura considerada As = '+fmt(r.As)+' cm². Não representa aprovação global da seção.':'Armadura adotada As = '+fmt(r.As)+' cm² e As′ = '+fmt(r.Asl)+' cm². Conferir limites, advertências e detalhamento.')+'</p><footer>NBR 6118:'+esc(op.norma)+' · Flexão Simples '+VERSAO+' · Elemento: '+esc(op.elemento||'não informado')+'</footer></html>';

  }
  FS.PainelFlexao={montar:montar,ordenarAreas:ordenarAreas,compareAreas:compareAreas,nomeModo:nomeModo,relatorioCompleto:relatorioCompleto,geometria:function(r,o){return section(r,o||{},320,13).svg;},dominios:function(r){return graphic(domains,r);},equilibrio:function(r){return graphic(equilibrium,r);},atualizar:atualizar,exportar:exportar,quebrar:quebrar,LARGURA:1000};
  if(typeof document!=='undefined'){var id=document.getElementById('idElemento');if(id)id.addEventListener('input',function(){atualizar(ultimo,ultimosErros);});}
  if(typeof document!=='undefined'){
    function conectarPrevia(){
      var select=document.getElementById('composicaoDocumento'),open=document.getElementById('btPreviaDocumento'),close=document.getElementById('fecharPrevia');
      if(select)select.addEventListener('change',atualizarMetricas);
      if(open)open.addEventListener('click',abrirPrevia);
      if(close)close.addEventListener('click',function(){document.getElementById('previaDocumento').close();});
      atualizarMetricas();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',conectarPrevia);else conectarPrevia();
  }
})(typeof window !== 'undefined' ? window : globalThis);
