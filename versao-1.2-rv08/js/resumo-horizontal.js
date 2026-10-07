/* Resumos documentais: Flexao em tres paineis (secao, resultados, diagrama MRd x As) e tabela de esforcos.
   O desenho usa os valores integrais; formatacao nao alimenta o motor. */
(function(root){
  'use strict';var FS=root.FS=root.FS||{};
  var C={text:'#222A31',muted:'#56616B',line:'#BAC2C9',head:'#E9EDF0',blue:'#245E91',ok:'#1F6F46',bad:'#B42318',wait:'#855A00'};
  function esc(t){return String(t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c];});}
  var symbols={'As,adotada':['A','s,adotada'],'As,calc':['A','s,calc'],'As,mín':['A','s,mín'],'As,máx':['A','s,máx'],'As′':['A′','s'],'Asl':['A','sl'],'Asw':['A','sw'],'ρmín':['ρ','mín'],'βx,lim':['β','x,lim'],'βx':['β','x'],'γc':['γ','c'],'γs':['γ','s'],'γf':['γ','f'],'αc':['α','c'],'MSd':['M','Sd'],'MRd':['M','Rd'],'Msk':['M','sk'],'Md,mín':['M','d,mín'],'VSd':['V','Sd'],'VRd2':['V','Rd2'],'TSd':['T','Sd'],'TRd2':['T','Rd2'],'fck':['f','ck'],'fyk':['f','yk'],'fywd':['f','ywd'],'bw':['b','w'],'bf':['b','f'],'hf':['h','f'],'Ac':['A','c'],'VSk':['V','Sk'],'TSk':['T','Sk'],'VRd3':['V','Rd3'],'TRd3':['T','Rd3'],'TRd4':['T','Rd4'],'Vc':['V','c'],'Asw,calc':['A','sw,calc'],'Asw,mín':['A','sw,mín'],'A90,calc':['A','90,calc'],'A90,mín':['A','90,mín'],'Asl,nec':['A','sl,nec'],'Asl,mín':['A','sl,mín'],'bw,mín':['b','w,mín'],'s,adotado':['s','adotado'],'s,máx':['s','máx'],'s,exato':['s','exato'],'he':['h','e'],'Ae':['A','e'],'ue':['u','e']};
  var rx=new RegExp('(^|[^A-Za-zÀ-ÿ])('+Object.keys(symbols).sort(function(a,b){return b.length-a.length;}).join('|')+')(?=$|[^A-Za-zÀ-ÿ])','g');
  function math(t,f){var raw=String(t),out='',last=0,m;rx.lastIndex=0;while((m=rx.exec(raw))){var pair=symbols[m[2]];out+=esc(raw.slice(last,m.index))+esc(m[1])+esc(pair[0])+'<tspan font-size="'+f*.74+'" baseline-shift="'+(-f*.18)+'">'+esc(pair[1])+'</tspan>';last=m.index+m[0].length;}return out+esc(raw.slice(last));}
  function fmt(v,n){if(v===null||v===undefined||Number.isNaN(v))return '—';if(v===Infinity)return '∞';if(!Number.isFinite(v))return '—';n=n===undefined?2:Math.min(n,2);if(v!==0&&Math.abs(v)<.005)return v.toExponential(2).replace('.',',');return v.toLocaleString('pt-BR',{minimumFractionDigits:n,maximumFractionDigits:n});}
  function indices(d,c,situacao){if(!Number.isFinite(d)||!Number.isFinite(c)||d<0||c<0||situacao==='INCONCLUSIVO'||situacao==='PENDENTE')return {dc:null,fs:null};return {dc:c>0?d/c:d>0?Infinity:null,fs:d>0?c/d:null};}
  function avaliarFlexao(r,op){
    if(r.modo==='AS_MRD')return {resultado:r,dc:null,fs:null,verificacoes:[],situacao:'CAPACIDADE',governante:'Sem demanda independente'};
    var q=r;
    if(r.modo==='MSD_AS')q=FS.VerificacaoFlexao.verificar({norma:op&&op.norma,fck:r.fck,fyk:r.fyk,tipoAco:r.tipoAco,gammaC:r.gammaC,gammaS:r.gammaS,gammaF:r.gammaF,secao:r.secaoT?'T':'RET',bw:r.bw,bf:r.bf,hf:r.hf,h:r.h,d:r.d,dl:r.dl,Msd:r.MsdTfm,As:r.As,Asl:r.Asl,betaXLim:r.betaXLim,usarArmaduraMinima:true});
    var a=indices(q.MsdTfm,q.MRdTfm,q.atendimentoFlexao);
    return {resultado:q,dc:a.dc,fs:a.fs,verificacoes:q.verificacoes||[],situacao:q.atendimentoSecao||'INCONCLUSIVO',governante:q.criterioGovernante||'Indisponível'};
  }
  function statusColor(s){return s==='ATENDE'?C.ok:s==='NÃO ATENDE'?C.bad:s==='CAPACIDADE'?C.muted:C.wait;}
  function largura(t,f){if(typeof document!=='undefined'){if(!largura.ctx)largura.ctx=document.createElement('canvas').getContext('2d');if(largura.ctx){largura.ctx.font='600 '+f+'px Segoe UI,Arial,sans-serif';return largura.ctx.measureText(t).width;}}return String(t).length*f*.54;}
  /* reduz o corpo da fonte quando o texto não cabe na largura w (valores grandes em kgf) */
  function ajuste(t,f,w){var l=largura(String(t),f);return l>w?Math.max(10,Math.floor(f*w/l*10)/10):f;}
  function wrap(t,w,f){var out=[],s='';String(t).split(/\s+/).forEach(function(token){if(largura(s+(s?' ':'')+token,f)>w&&s){out.push(s);s='';}if(largura(token,f)>w){Array.from(token).forEach(function(c){if(largura(s+c,f)>w){out.push(s);s='';}s+=c;});}else s+=(s?' ':'')+token;});if(s)out.push(s);return out;}
  function canvas(){var parts=[];return {
    text:function(x,y,t,f,color,bold,anchor,halo){f=f||18.5;parts.push('<text x="'+x+'" y="'+y+'" font-size="'+f+'" fill="'+(color||C.text)+'"'+(bold?' font-weight="600"':'')+(anchor?' text-anchor="'+anchor+'"':'')+(halo?' stroke="'+halo+'" stroke-width="3.4" stroke-linejoin="round" paint-order="stroke"':'')+'>'+math(t,f)+'</text>');},
    box:function(x,y,w,h,fill){parts.push('<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+(fill||'#FFFFFF')+'" stroke="'+C.line+'"/>');},
    rule:function(x,y,w){parts.push('<path d="M'+x+' '+y+' h'+w+'" fill="none" stroke="'+C.line+'"/>');},
    para:function(x,y,t,w,f,color,bold){var lines=wrap(t,w,f);for(var i=0;i<lines.length;i++)this.text(x,y+i*(f+5),lines[i],f,color,bold);return y+lines.length*(f+5);},
    raw:function(s){parts.push(s);},
    rot:function(x,y,t,f,color,bold,anchor){parts.push('<text transform="rotate(-90 '+x+' '+y+')" x="'+x+'" y="'+y+'" font-size="'+f+'" fill="'+(color||C.text)+'"'+(bold?' font-weight="600"':'')+' text-anchor="'+(anchor||'middle')+'">'+math(t,f)+'</text>');},
    panel:function(x,y,w,h,title){var r=5;parts.push('<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="#FFFFFF" stroke="'+C.line+'"/>');parts.push('<path d="M'+x+' '+(y+27)+' v'+(r-27)+' a'+r+' '+r+' 0 0 1 '+r+' '+(-r)+' h'+(w-2*r)+' a'+r+' '+r+' 0 0 1 '+r+' '+r+' v'+(27-r)+' z" fill="'+C.head+'" stroke="'+C.line+'"/>');this.text(x+10,y+20,title,18,C.text,true);},
    fields:function(x,y,w,values,cols){var cw=w/cols;for(var i=0;i<values.length;i++)this.text(x+(i%cols)*cw,y+Math.floor(i/cols)*25,values[i],18.5);return Math.ceil(values.length/cols)*25;},
    finish:function(h,kind){return '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="'+Math.ceil(h)+'" viewBox="0 0 1000 '+Math.ceil(h)+'" role="img" aria-label="Resumo horizontal de '+kind+'" data-revisao="RV08" data-resumo="horizontal"><style>text{font-family:Segoe UI,Arial,sans-serif;font-variant-numeric:tabular-nums}</style><rect width="1000" height="'+Math.ceil(h)+'" fill="white"/>'+parts.join('')+'</svg>';}
  };}
  function cab(a,op,mode){var y=a.para(14,24,'ELEMENTO — '+(String(op.elemento||'').trim()||'não informado'),972,22,C.text,true);a.text(14,y,mode+' · NBR 6118:'+(op.norma||'2023')+' · Flexão Simples 1.2.0 / RV08',16.5,C.muted);return y+13;}
  function moment(v,op){return fmt(FS.EntradaFlexao.doMotor(v,op.unidade||'kgfm'))+' '+FS.EntradaFlexao.rotulo(op.unidade||'kgfm');}
  /* ------------------------------------------------------------------------
     RV08 · resumo da seção em três painéis
       seção transversal | resultados | diagrama MRd × As
       tabela de esforços com D/C e FS | verificações | conclusão
     Só apresentação: usa os valores integrais do motor e não alimenta o
     cálculo. O diagrama reavalia o motor para várias áreas de armadura, sem
     alterar o resultado exibido. */
  var K={plot:'#FFFBEC',grade:'#E9E2CC',conc:'#DCE1E6',concL:'#34414C',bloco:'#9DBBDB',cota:'#56616B',suave:'#E3E8ED',sel:'#E8F1FB',selL:'#A9C2DC',neutro:'#ECEFF2',laranja:'#B86E00'};
  function R2(v){return Math.round(v*100)/100;}
  function cota(v){return fin(v)?v.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:2}):'—';}
  function fin(v){return typeof v==='number'&&isFinite(v);}
  function tinta(cor){return cor===C.ok?'#E2F3E9':cor===C.bad?'#FBE3E0':cor===C.wait?'#FFF0CF':K.neutro;}
  function casas(v,c){return v.toLocaleString('pt-BR',{minimumFractionDigits:c,maximumFractionDigits:c});}
  function passoBom(max,alvo){var b=max/alvo,p=Math.pow(10,Math.floor(Math.log10(b))),m=b/p,f=m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10;return Math.max(f*p,.05);}
  function nCasas(p){var c=0;while(c<2&&Math.abs(p*Math.pow(10,c)-Math.round(p*Math.pow(10,c)))>1e-9)c++;return c;}
  /* margem esquerda do gráfico: acompanha o maior número do eixo vertical (título do eixo fica à esquerda) */
  function margemY(ymax,sy,min){var cy=nCasas(sy),t,mw=0;for(t=0;t<=ymax+1e-9;t+=sy)mw=Math.max(mw,largura(casas(t,cy),14));return Math.max(min,Math.ceil(mw)+34);}
  /* eixo horizontal: pula rótulos quando a largura do gráfico não comporta todos */
  function passoRotulos(xmax,sx,cx,larg){var n=Math.max(1,Math.round(xmax/sx)),t,w=0;for(t=0;t<=xmax+1e-9;t+=sx)w=Math.max(w,largura(casas(t,cx),14));return Math.max(1,Math.ceil((w+8)/(larg/n)));}
  function seta(x,y,dir){var L=7,W=2.6,p=dir==='r'?[[x,y],[x-L,y-W],[x-L,y+W]]:dir==='l'?[[x,y],[x+L,y-W],[x+L,y+W]]:dir==='d'?[[x,y],[x-W,y-L],[x+W,y-L]]:[[x,y],[x-W,y+L],[x+W,y+L]];
    return '<polygon points="'+p.map(function(t){return R2(t[0])+','+R2(t[1]);}).join(' ')+'" fill="'+K.cota+'"/>';}
  /* círculo com símbolo: a situação nunca depende só da cor */
  function icone(a,cx,cy,r,sit){var cor=statusColor(sit),k=r*.45,st=' stroke="#FFFFFF" stroke-width="'+R2(r*.22)+'" stroke-linecap="round" stroke-linejoin="round" fill="none"';
    a.raw('<circle cx="'+R2(cx)+'" cy="'+R2(cy)+'" r="'+r+'" fill="'+cor+'"/>');
    if(sit==='ATENDE')a.raw('<path d="M'+R2(cx-k)+' '+R2(cy+k*.05)+' l'+R2(k*.8)+' '+R2(k*.85)+' l'+R2(k*1.25)+' '+R2(-k*1.6)+'"'+st+'/>');
    else if(sit==='NÃO ATENDE')a.raw('<path d="M'+R2(cx-k*.85)+' '+R2(cy-k*.85)+' l'+R2(k*1.7)+' '+R2(k*1.7)+' M'+R2(cx+k*.85)+' '+R2(cy-k*.85)+' l'+R2(-k*1.7)+' '+R2(k*1.7)+'"'+st+'/>');
    else a.raw('<path d="M'+R2(cx)+' '+R2(cy-k*1.15)+' v'+R2(k*1.25)+' M'+R2(cx)+' '+R2(cy+k*.9)+' v.01"'+st+'/>');}
  function pilula(a,xr,y,sit,txt){var h=34,f=18,w=h+largura(txt,f)+8,x=xr-w,cor=statusColor(sit);
    a.raw('<rect x="'+R2(x)+'" y="'+y+'" width="'+R2(w)+'" height="'+h+'" rx="'+h/2+'" fill="'+tinta(cor)+'" stroke="'+cor+'" stroke-width="1.5"/>');
    icone(a,x+h/2,y+h/2,10,sit);a.text(x+h+1,y+h/2+6.5,txt,f,cor,true);}

  /* ---- painel 1: seção transversal com cotas, armadura, LN e bloco comprimido */
  function secaoSvg(a,q,op,r,bx,by,bw_,bh_){
    var T=!!q.secaoT,W=T?q.bf:q.bw,H=q.h;
    if(!(fin(W)&&fin(H)&&W>0&&H>0&&fin(q.d)&&fin(q.bw)&&q.bw>0)){a.text(bx+12,by+58,'Seção indisponível',17,C.muted);return;}
    var aL=bx+(T?72:46),aR=bx+bw_-104,aT=by+28+(T?42:26),aB=by+bh_-98;
    var s=Math.min((aR-aL)/W,(aB-aT)/H),sw=W*s,sh=H*s,ox=aL+((aR-aL)-sw)/2,oy=aT+((aB-aT)-sh)/2;
    var wsw=q.bw*s,off=T?(q.bf-q.bw)/2*s:0,hf=T?Math.min(q.hf,H)*s:0,wr=ox+off+wsw;
    var ln=' stroke="'+K.cota+'" stroke-width="1.2"',lf=' stroke="'+K.cota+'" stroke-width=".8" opacity=".75"';
    function L(x1,y1,x2,y2,att){a.raw('<line x1="'+R2(x1)+'" y1="'+R2(y1)+'" x2="'+R2(x2)+'" y2="'+R2(y2)+'"'+(att||ln)+'/>');}
    /* concreto */
    var d0=T?'M'+R2(ox)+' '+R2(oy)+' h'+R2(sw)+' v'+R2(hf)+' h'+R2(-off)+' v'+R2(sh-hf)+' h'+R2(-wsw)+' v'+R2(-(sh-hf))+' h'+R2(-off)+' z':'M'+R2(ox)+' '+R2(oy)+' h'+R2(sw)+' v'+R2(sh)+' h'+R2(-sw)+' z';
    a.raw('<path d="'+d0+'" fill="'+K.conc+'" stroke="'+K.concL+'" stroke-width="2" stroke-linejoin="round"/>');
    /* bloco comprimido λx (face comprimida no topo) e linha neutra */
    var ac=fin(q.x)&&fin(q.lambda)&&q.x>0?Math.min(q.lambda*q.x,H)*s:0;
    if(ac>0){var bl=T&&ac>hf?'M'+R2(ox)+' '+R2(oy)+' h'+R2(sw)+' v'+R2(hf)+' h'+R2(-off)+' v'+R2(ac-hf)+' h'+R2(-wsw)+' v'+R2(-(ac-hf))+' h'+R2(-off)+' z':'M'+R2(ox)+' '+R2(oy)+' h'+R2(sw)+' v'+R2(ac)+' h'+R2(-sw)+' z';
      a.raw('<path d="'+bl+'" fill="'+K.bloco+'" fill-opacity=".85"/>');}
    if(fin(q.x)&&q.x>0&&q.x<H){var yl=oy+q.x*s;L(ox-8,yl,ox+sw+8,yl,' stroke="'+C.blue+'" stroke-width="1.4" stroke-dasharray="6 3"');
      var lx0=ox+5,okL=sw>=70,disp=sh-(yl-oy);
      if(T&&yl-oy<hf){disp=hf-(yl-oy);}else if(T){lx0=ox+off+5;okL=wsw>=70;}
      if(okL&&disp>=20&&!(yl+18>oy+q.d*s-4&&yl<oy+q.d*s+8))a.text(lx0,yl+16,'LN · x = '+cota(q.x),14,C.blue,true);}
    /* armadura: barras reais só quando informadas; senão, área equivalente */
    var xa=ox+off+q.dl*s,xb=ox+off+wsw-q.dl*s,ya=oy+q.d*s,rb=C.blue;
    if(fin(q.Asl)&&q.Asl>0)L(xa,oy+q.dl*s,xb,oy+q.dl*s,' stroke="'+rb+'" stroke-width="3.5" stroke-linecap="round"');
    var n=op.modoAs==='barras'&&r.modo!=='MSD_AS'?Math.min(Math.round(op.nBarras)||0,14):0;
    if(n>0){var rr=Math.max(3.2,Math.min(8,(op.diamBarras||10)/20*s));for(var i=0;i<n;i++){var cx=n===1?(xa+xb)/2:xa+i*(xb-xa)/(n-1);a.raw('<circle cx="'+R2(cx)+'" cy="'+R2(ya)+'" r="'+R2(rr)+'" fill="'+rb+'" stroke="#FFFFFF" stroke-width="1"/>');}}
    else L(xa,ya,xb,ya,' stroke="'+rb+'" stroke-width="5.5" stroke-linecap="round"');
    /* cotas: bw (baixo), h (esquerda), d e d′ (direita); bf e hf na seção T */
    var yb=oy+sh+16;L(ox+off,oy+sh,ox+off,yb+5,lf);L(wr,oy+sh,wr,yb+5,lf);L(ox+off,yb,wr,yb);a.raw(seta(ox+off,yb,'l')+seta(wr,yb,'r'));
    a.text((ox+off+wr)/2,yb+18,'bw = '+cota(q.bw),15.5,C.muted,false,'middle');
    var xh=ox-(T?44:18);L(ox,oy,xh-5,oy,lf);L(ox,oy+sh,xh-5,oy+sh,lf);L(xh,oy,xh,oy+sh);a.raw(seta(xh,oy,'u')+seta(xh,oy+sh,'d'));a.rot(xh-6,oy+sh/2,'h = '+cota(q.h),15.5,C.muted);
    if(T){var yt=oy-14;L(ox,oy,ox,yt-5,lf);L(ox+sw,oy,ox+sw,yt-5,lf);L(ox,yt,ox+sw,yt);a.raw(seta(ox,yt,'l')+seta(ox+sw,yt,'r'));a.text(ox+sw/2,yt-7,'bf = '+cota(q.bf),15.5,C.muted,false,'middle');
      var xf=ox-14;L(ox,oy+hf,xf-5,oy+hf,lf);L(xf,oy,xf,oy+hf);a.raw(seta(xf,oy,'u')+seta(xf,oy+hf,'d'));a.rot(xf-8,oy+hf/2,'hf',15.5,C.muted);}
    var xr=Math.max(wr,ox+sw)+26;L(ox+sw,oy,xr+5,oy,lf);L(wr,ya,xr+5,ya,lf);L(wr,oy+sh,xr+5,oy+sh,lf);
    L(xr,oy,xr,oy+sh);a.raw(seta(xr,oy,'u')+seta(xr,ya,'d')+seta(xr,ya,'u')+seta(xr,oy+sh,'d'));
    a.rot(xr-6,(oy+ya)/2,'d = '+cota(q.d),15.5,C.muted);
    a.text(xr+9,(ya+oy+sh)/2+5,'d′ = '+cota(q.dl),15.5,C.muted);
    a.text(bx+12,by+bh_-46,(T?'Seção T · hf = '+cota(q.hf)+' cm':'Seção retangular')+' · cotas em cm',13.5,C.muted);
    a.text(bx+12,by+bh_-30,'Bloco comprimido (λx) em azul; LN tracejada.',13.5,C.muted);
    a.text(bx+12,by+bh_-14,'Barras ilustrativas; não é detalhamento.',13.5,C.muted);
  }

  /* ---- painel 3: diagrama MRd × As, com a demanda MSd e a armadura adotada */
  function diagramaSvg(a,q,op,bx,by,bw_,bh_,cap){
    var u=op.unidade||'kgfm',rot=FS.EntradaFlexao.rotulo(u);
    function conv(v){return FS.EntradaFlexao.doMotor(v,u);}
    var As=q.As,aMin=q.asMin,aMax=q.asMax,Msd=!cap&&fin(q.MsdTfm)&&q.MsdTfm>0?q.MsdTfm:0,lim=q.betaXLim,ref=Math.max(fin(As)?As:0,fin(aMin)?aMin:0,fin(q.asCalc)?q.asCalc:0);
    if(!(ref>0)||!FS.VerificacaoFlexao){a.text(bx+12,by+58,'Diagrama indisponível',17,C.muted);return;}
    var xmax=ref*2.4;if(fin(aMax)&&aMax>ref)xmax=Math.min(xmax,aMax*1.02);var sx=passoBom(xmax,5);xmax=Math.ceil(xmax/sx-1e-9)*sx;
    var base={norma:op.norma,fck:q.fck,fyk:q.fyk,tipoAco:q.tipoAco,gammaC:q.gammaC,gammaS:q.gammaS,gammaF:q.gammaF,secao:q.secaoT?'T':'RET',bw:q.bw,bf:q.bf,hf:q.hf,h:q.h,d:q.d,dl:q.dl,Msd:q.MsdTfm,Asl:q.Asl,betaXLim:q.betaXLim,usarArmaduraMinima:true},pts=[{x:0,y:0,b:0}],N=36;
    try{for(var i=1;i<=N;i++){var ai=xmax*i/N,p={};for(var k in base)p[k]=base[k];p.As=ai;var v=FS.VerificacaoFlexao.verificar(p);if(!fin(v.MRdTfm))throw new Error('MRd');pts.push({x:ai,y:conv(v.MRdTfm),b:v.betaX});}}
    catch(e){a.text(bx+12,by+58,'Diagrama indisponível',17,C.muted);return;}
    var mrd=fin(q.MRdTfm)?conv(q.MRdTfm):0,dem=conv(Msd),ymaxRaw=Math.max(pts[N].y,dem,mrd)*1.06,sy=passoBom(ymaxRaw,5),ymax=Math.ceil(ymaxRaw/sy-1e-9)*sy;
    var L0=bx+margemY(ymax,sy,72),R0=bx+bw_-16,T0=by+28+14,B0=by+bh_-48;
    function X(v){return L0+(R0-L0)*v/xmax;}function Y(v){return B0-(B0-T0)*v/ymax;}
    a.raw('<rect x="'+R2(L0)+'" y="'+R2(T0)+'" width="'+R2(R0-L0)+'" height="'+R2(B0-T0)+'" fill="'+K.plot+'" stroke="'+C.line+'"/>');
    var cx=nCasas(sx),cy=nCasas(sy),t;
    var kx=passoRotulos(xmax,sx,cx,R0-L0),ix=0;
    for(t=0;t<=xmax+1e-9;t+=sx,ix++){a.raw('<path d="M'+R2(X(t))+' '+R2(T0)+' V'+R2(B0)+'" stroke="'+K.grade+'" stroke-width="1" fill="none"/>');if(ix%kx===0)a.text(X(t),B0+17,casas(t,cx),14,C.muted,false,'middle');}
    for(t=0;t<=ymax+1e-9;t+=sy){a.raw('<path d="M'+R2(L0)+' '+R2(Y(t))+' H'+R2(R0)+'" stroke="'+K.grade+'" stroke-width="1" fill="none"/>');a.text(L0-6,Y(t)+5,casas(t,cy),14,C.muted,false,'end');}
    a.text((L0+R0)/2,B0+37,'As (cm²)',15,C.muted,false,'middle');a.rot(bx+16,(T0+B0)/2,'M ('+rot+')',15,C.muted);
    /* área sob a curva e a curva (tracejada onde βx > βx,lim) */
    a.raw('<path d="M'+pts.map(function(p){return R2(X(p.x))+' '+R2(Y(p.y));}).join(' L')+' L'+R2(X(xmax))+' '+R2(B0)+' L'+R2(X(0))+' '+R2(B0)+' z" fill="'+C.blue+'" fill-opacity=".07"/>');
    var segs=[],cur=null,duc,anyNd=false;
    for(i=1;i<pts.length;i++){duc=!(fin(lim)&&pts[i].b>lim+1e-9);if(!duc)anyNd=true;if(!cur||cur.duc!==duc){cur={duc:duc,p:[pts[i-1]]};segs.push(cur);}cur.p.push(pts[i]);}
    segs.forEach(function(s){a.raw('<path d="M'+s.p.map(function(p){return R2(X(p.x))+' '+R2(Y(p.y));}).join(' L')+'" fill="none" stroke="'+(s.duc?C.blue:K.laranja)+'" stroke-width="2.6" stroke-linejoin="round"'+(s.duc?'':' stroke-dasharray="7 4"')+'/>');});
    /* limites de As */
    [[aMin,'As,mín'],[aMax,'As,máx']].forEach(function(l){if(fin(l[0])&&l[0]>0&&l[0]<xmax){a.raw('<path d="M'+R2(X(l[0]))+' '+R2(T0)+' V'+R2(B0)+'" stroke="#7B8691" stroke-width="1.2" stroke-dasharray="4 3" fill="none"/>');a.rot(X(l[0])-L0<24?X(l[0])+16:X(l[0])-5,B0-6,l[1],13.5,'#56616B',false,'start');}});
    /* demanda × capacidade da armadura adotada */
    if(dem>0){var yd=Y(dem);a.raw('<path d="M'+R2(L0)+' '+R2(yd)+' H'+R2(R0)+'" stroke="'+C.bad+'" stroke-width="1.3" stroke-dasharray="5 3" fill="none"/>');a.text(R0-5,yd-6,'MSd',15,C.bad,true,'end');
      if(fin(As)&&As<=xmax){a.raw('<path d="M'+R2(X(As))+' '+R2(yd)+' V'+R2(Y(mrd))+'" stroke="#56616B" stroke-width="1.4" fill="none"/>');a.raw('<path d="M'+R2(X(As))+' '+R2(yd-7.5)+' l7.5 7.5 l-7.5 7.5 l-7.5 -7.5 z" fill="'+C.bad+'" stroke="#FFFFFF" stroke-width="1.2"/>');}}
    if(fin(As)&&As<=xmax)a.raw('<circle cx="'+R2(X(As))+'" cy="'+R2(Y(mrd))+'" r="6" fill="'+C.blue+'" stroke="#FFFFFF" stroke-width="1.8"/>');
    /* legenda */
    var nl=2+(dem>0?1:0)+(anyNd?1:0);a.raw('<rect x="'+R2(L0+4)+'" y="'+R2(T0+4)+'" width="124" height="'+(nl*19+6)+'" rx="4" fill="'+K.plot+'" fill-opacity=".92"/>');
    var ly=T0+22,lx=L0+10;a.raw('<path d="M'+R2(lx)+' '+R2(ly-5)+' h22" stroke="'+C.blue+'" stroke-width="2.6" fill="none"/>');a.text(lx+30,ly,'MRd (As)',14.5,C.text);
    if(dem>0){ly+=19;a.raw('<path d="M'+R2(lx+11)+' '+R2(ly-12)+' l6 6 l-6 6 l-6 -6 z" fill="'+C.bad+'"/>');a.text(lx+30,ly,'MSd',14.5,C.text);}
    ly+=19;a.raw('<circle cx="'+R2(lx+11)+'" cy="'+R2(ly-5)+'" r="5" fill="'+C.blue+'"/>');a.text(lx+30,ly,fin(As)?'As adotada':'As',14.5,C.text);
    if(anyNd){ly+=19;a.raw('<path d="M'+R2(lx)+' '+R2(ly-5)+' h22" stroke="'+K.laranja+'" stroke-width="2.6" stroke-dasharray="6 3" fill="none"/>');a.text(lx+30,ly,'βx > βx,lim',14.5,C.text);}
  }

  function flexao(r,op){
    if(!r)throw new Error('Corrija as entradas antes de exportar.');op=op||{};var a=canvas(),ev=avaliarFlexao(r,op),q=ev.resultado,cap=r.modo==='AS_MRD',un=FS.EntradaFlexao.rotulo(op.unidade||'kgfm');
    var sit=cap?'CAPACIDADE':ev.situacao,corS=statusColor(sit);
    /* cabeçalho: identificação à esquerda, situação em destaque à direita */
    var mode=cap?'Flexão · capacidade':r.modo==='MSD_AS'?'Flexão · dimensionamento':'Flexão · verificação';
    var y=a.para(14,24,'ELEMENTO — '+(String(op.elemento||'').trim()||'não informado'),760,22,C.text,true);
    a.text(14,y,mode+' · NBR 6118:'+(op.norma||'2023')+' · Flexão Simples 1.2.0 / RV08',16.5,C.muted);pilula(a,986,8,sit,sit);y+=14;
    /* três painéis: seção | resultados | diagrama */
    var hM=368,xA=14,wA=350,xB=375,wB=294,xC=680,wC=306;
    a.panel(xA,y,wA,hM,'Seção transversal');a.panel(xB,y,wB,hM,'Resultados');a.panel(xC,y,wC,hM,'Diagrama MRd × As');
    secaoSvg(a,q,op,r,xA,y,wA,hM);
    var xi=xB+12,xv=xB+wB-12,yy=y+46,half=(wB-24)/2;
    a.text(xi,yy,'MATERIAIS',13.5,C.muted,true);yy+=22;
    [['fck = '+fmt(r.fck,0)+' MPa','fyk = '+fmt(r.fyk,0)+' MPa'],['γc = '+fmt(r.gammaC),'γs = '+fmt(r.gammaS)],['λ = '+fmt(r.lambda),'αc = '+fmt(r.alphaC)],['Aço tipo '+r.tipoAco,r.secaoT?'':'Ac = '+fmt(r.Ac,0)+' cm²']].forEach(function(p){a.text(xi,yy,p[0],17);if(p[1])a.text(xi+half,yy,p[1],17);yy+=22;});
    yy+=12;a.text(xi,yy,'ARMADURAS E LIMITES',13.5,C.muted,true);yy+=22;
    [[r.modo==='MSD_AS'?'As,calc':'As,adotada',(r.modo==='MSD_AS'?fmt(r.asCalc):fmt(q.As))+' cm²'],['As,mín',fmt(q.asMin)+' cm²'],['As,máx',fmt(q.asMax)+' cm²'],['As′',fmt(q.Asl)+' cm²'],['ρmín',fmt(q.rhoMin*100)+' %'],['Md,mín',moment(q.MdMinTfm,op)],['βx / βx,lim',fmt(q.betaX)+' / '+fmt(q.betaXLim)],['x',fmt(q.x)+' cm · Dom. '+q.dominio]].forEach(function(p,i){
      a.text(xi,yy,p[0],17,C.muted);a.text(xv,yy,p[1],17,C.text,false,'end');if(i<7)a.rule(xi,yy+6,wB-24);yy+=22;});
    diagramaSvg(a,q,op,xC,y,wC,hM,cap);
    y+=hM+10;
    /* tabela de esforços, no molde da janela de resumo de pilares */
    var hE=170,xT=24,cw=[120,120,120,90,90],cols=[['Msk',un],['MSd',un],['MRd',un],['D/C',''],['FS','']],ind=cap?{dc:null,fs:null}:ev;
    a.panel(14,y,560,hE,'Esforços (γf = '+fmt(q.gammaF)+')');if(!cap&&fin(ind.dc))a.text(564,y+20,'D/C = MSd/MRd · FS = MRd/MSd',14.5,C.muted,false,'end');
    var yh=y+36,xx=xT;
    cols.forEach(function(c,i){a.raw('<rect x="'+xx+'" y="'+yh+'" width="'+cw[i]+'" height="38" fill="'+C.head+'" stroke="'+C.line+'"/>');a.text(xx+cw[i]/2,yh+17,c[0],17,C.text,true,'middle');if(c[1])a.text(xx+cw[i]/2,yh+33,c[1],13.5,C.muted,false,'middle');xx+=cw[i];});
    var vals=cap?['—','—',fmt(conv(q.MRdTfm,op)),'—','—']:[fmt(conv(q.MskTfm,op)),fmt(conv(q.MsdTfm,op)),fmt(conv(q.MRdTfm,op)),fmt(ev.dc),fmt(ev.fs)];
    var yr=yh+38,vf=ev.verificacoes.filter(function(v){return v.id==='flexao';})[0],tc=cap||!vf||ev.dc===null?C.muted:statusColor(vf.situacao);xx=xT;
    vals.forEach(function(v,i){var dest=i>=3,fill=dest?tinta(tc):K.sel;a.raw('<rect x="'+xx+'" y="'+yr+'" width="'+cw[i]+'" height="38" fill="'+fill+'" stroke="'+(dest?C.line:K.selL)+'"/>');a.text(xx+cw[i]/2,yr+27,v,ajuste(v,dest?22:19,cw[i]-10),dest?tc:C.text,dest,'middle');xx+=cw[i];});
    var yb=yr+38+24;
    if(!cap&&fin(ev.dc)){var bw0=330,xb0=xT+84,fr=Math.min(ev.dc/1.2,1),cb=tc===C.muted?C.blue:tc;
      a.text(xT,yb+5,'Utilização',15.5,C.muted);a.raw('<rect x="'+xb0+'" y="'+(yb-7)+'" width="'+bw0+'" height="12" rx="6" fill="'+K.suave+'"/><rect x="'+xb0+'" y="'+(yb-7)+'" width="'+R2(Math.max(8,bw0*fr))+'" height="12" rx="6" fill="'+cb+'"/>');
      a.raw('<path d="M'+R2(xb0+bw0/1.2)+' '+(yb-13)+' v24" stroke="'+C.text+'" stroke-width="1.6" fill="none"/>');a.text(xb0+bw0/1.2,yb+25,'100 %',13,C.muted,false,'middle');
      a.text(xb0+bw0+14,yb+6,Math.round(ev.dc*100)+' %',19,cb,true);
}
    else if(cap){a.text(xT,yb+4,'Carregamento não informado · avaliação exclusiva de capacidade',15.5,C.muted);a.text(xT,yb+26,'Sem demanda: D/C e FS não aplicáveis.',15.5,C.muted);}
    else a.text(xT,yb+6,q.MsdTfm===0?'MSd = 0: FS não aplicável.':'Índices indisponíveis.',15.5,C.muted);
    /* verificações da seção */
    var xV=586,wV=400,names={flexao:'Flexão',minima:'Armadura mínima',maxima:'Armadura máxima',ductilidade:'Ductilidade'};
    a.panel(xV,y,wV,hE,'Verificações da seção');a.text(xV+12,y+49,'Critério',14.5,C.muted);a.text(xV+222,y+49,'D/C',14.5,C.muted,false,'end');a.text(xV+wV-12,y+49,'Situação',14.5,C.muted,false,'end');a.rule(xV+12,y+56,wV-24);
    if(cap)a.para(xV+12,y+80,'A capacidade não é comparada com um esforço independente.',wV-24,17.5,C.muted);
    ev.verificacoes.forEach(function(v,i){var yv=y+78+i*25,cv=statusColor(v.situacao),wt=largura(v.situacao,17.5);if(i>0)a.rule(xV+12,yv-18,wV-24);
      a.text(xV+12,yv,names[v.id]||v.titulo,17.5);a.text(xV+222,yv,fmt(v.razao),17.5,C.text,false,'end');a.text(xV+wV-12,yv,v.situacao,17.5,cv,true,'end');icone(a,xV+wV-12-wt-15,yv-6,8,v.situacao);});
    y+=hE+10;
    var detail=op.modoAs==='barras'&&r.modo!=='MSD_AS'?op.nBarras+' barras Ø '+fmt(op.diamBarras)+' mm':op.modoAs==='esp'&&r.modo!=='MSD_AS'?'Ø '+fmt(op.diamEsp)+' mm c/ '+fmt(op.espacamento)+' cm (faixa 1 m)':'Área equivalente';
    y=a.para(14,y+12,'Adotada: '+detail+' · As = '+fmt(q.As)+' cm² · Governa: '+ev.governante+'.',972,16.5,C.text);
    var warnings=(r.avisos||[]).concat(q===r?[]:q.avisos||[]).filter(function(t,i,arr){return arr.indexOf(t)===i&&!/Armadura minima governa/.test(t);});
    warnings.forEach(function(t){y=a.para(14,y+2,String(t).replace(/<[^>]*>/g,'').replace(/(-?\d+)\.(\d+)/g,function(_,n,d){return d.length>=3?fmt(Number(n+'.'+d)):n+','+d;}).replace(/cm2/g,'cm²'),972,16,C.wait);});
    /* barra de estado, como na janela de referência */
    y+=2;a.raw('<rect x="14" y="'+R2(y)+'" width="972" height="32" fill="'+C.head+'" stroke="'+C.line+'"/>');
    a.text(24,y+22,cap?'Conclusão: sem demanda independente.':'Conclusão: '+ev.situacao+' aos critérios indicados.',16.5,corS,true);a.text(976,y+22,'10 N = 1 kgf · h = d + d′ · face comprimida no topo',15.5,C.muted,false,'end');
    return a.finish(y+32+8,'flexão');
  }
  function conv(v,op){return FS.EntradaFlexao.doMotor(v,op.unidade||'kgfm');}
  function cisValue(v,u,op){if(v===null||!Number.isFinite(v))return fmt(v);var k=op.unidade==='kgf'?1000:op.unidade==='kn'?10:1;return ['forca','momentoV','momento'].indexOf(u)>=0?fmt(v*k)+(u==='momento'?(op.unidade==='kgf'?' kgf·m':op.unidade==='kn'?' kN·m':' tf·m'):(op.unidade==='kgf'?' kgf':op.unidade==='kn'?' kN':' tf')):fmt(v)+(u?' '+u:'');}
  /* ------------------------------------------------------------------------
     RV08 · resumo de cortante e torção, no mesmo molde do resumo da flexão
       seção transversal | dados e resultados | diagrama estribos × espaçamento
       esforços (Sk, Sd, Rd, D/C, FS) | solução adotada | verificações com barras
     Só apresentação: usa o resultado do motor sem alterá-lo. */
  function kCis(op){return op.unidade==='kgf'?1000:op.unidade==='kn'?10:1;}
  function uForca(op){return op.unidade==='kgf'?'kgf':op.unidade==='kn'?'kN':'tf';}
  function uMom(op){return op.unidade==='kgf'?'kgf·m':op.unidade==='kn'?'kN·m':'tf·m';}
  /* valor e unidade separados, para a unidade sair menor e alinhada à direita */
  function vu(v,u,op){var k=kCis(op);if(u==='forca'||u==='momentoV')return {n:fmt(fin(v)?v*k:v),u:uForca(op)};if(u==='momento')return {n:fmt(fin(v)?v*k:v),u:uMom(op)};return {n:fmt(v),u:u||''};}
  function celulaVU(a,xr,y,p,wm){var fn=17,fu=13,l;
    if(wm){l=largura(p.n,fn)+(p.u?largura(p.u,fu)+4:0);if(l>wm){fn=Math.max(10,fn*wm/l);fu=Math.max(8,fu*wm/l);}}
    if(p.u){a.text(xr,y,p.u,fu,C.muted,false,'end');a.text(xr-largura(p.u,fu)-4,y,p.n,fn,C.text,false,'end');}else a.text(xr,y,p.n,fn,C.text,false,'end');}
  function checks(r,ids){return r.verificacoes.filter(function(v){return ids.indexOf(v.id)>=0;});}
  function sitGrupo(r,ids){var vs=checks(r,ids);return vs.some(function(v){return v.situacao==='NÃO ATENDE';})?'NÃO ATENDE':vs.some(function(v){return v.situacao==='PENDENTE';})||!vs.length?'PENDENTE':'ATENDE';}
  function capMin(r,ids){var c=checks(r,ids).map(function(v){return v.capacidade;}).filter(fin);return c.length?Math.min.apply(null,c):null;}

  /* ---- painel 1: seção com estribo, barras, V, T e seção vazada equivalente */
  function secaoCis(a,r,op,bx,by,bw_,bh_){
    var tor=!!r.torcao,cor=!!r.cortante,W=r.bw,H=r.h;
    if(!(fin(W)&&fin(H)&&W>0&&H>0)){a.text(bx+12,by+58,'Seção indisponível',17,C.muted);return;}
    var aL=bx+46,aR=bx+bw_-92,aT=by+28+(cor?40:26),aB=by+bh_-(tor?112:96);
    var s=Math.min((aR-aL)/W,(aB-aT)/H),sw=W*s,sh=H*s,ox=aL+((aR-aL)-sw)/2,oy=aT+((aB-aT)-sh)/2;
    var ln=' stroke="'+K.cota+'" stroke-width="1.2"',lf=' stroke="'+K.cota+'" stroke-width=".8" opacity=".75"';
    function L(x1,y1,x2,y2,att){a.raw('<line x1="'+R2(x1)+'" y1="'+R2(y1)+'" x2="'+R2(x2)+'" y2="'+R2(y2)+'"'+(att||ln)+'/>');}
    a.raw('<rect x="'+R2(ox)+'" y="'+R2(oy)+'" width="'+R2(sw)+'" height="'+R2(sh)+'" fill="'+K.conc+'" stroke="'+K.concL+'" stroke-width="2"/>');
    /* seção vazada equivalente: linha de centro da parede (torção) */
    var he=tor&&fin(r.torcao.he)?Math.min(r.torcao.he*s,Math.min(sw,sh)/2.2):0;
    if(he>0)a.raw('<rect x="'+R2(ox+he/2)+'" y="'+R2(oy+he/2)+'" width="'+R2(sw-he)+'" height="'+R2(sh-he)+'" fill="'+K.bloco+'" fill-opacity=".3" stroke="'+C.blue+'" stroke-width="1.4" stroke-dasharray="6 3"/>');
    /* estribo (posição ilustrativa) e barras longitudinais */
    var nR=r.nRamos||2,dt=(r.diamEstribo||6.3)/10,ins=Math.max(1,Math.min((fin(r.c1)?r.c1:3)-dt,Math.min(W,H)/4)),ie=ins*s,x0=ox+ie,y0=oy+ie,ww=sw-2*ie,hh=sh-2*ie;
    if(ww>6&&hh>6){var tw=Math.max(2,Math.min(4.5,dt*s)),st=' stroke="'+C.blue+'" stroke-width="'+R2(tw)+'"';
      a.raw('<rect x="'+R2(x0)+'" y="'+R2(y0)+'" width="'+R2(ww)+'" height="'+R2(hh)+'" rx="3" fill="none"'+st+'/>');
      for(var i=1;i<nR-1;i++){var xi=x0+ww*i/(nR-1);L(xi,y0,xi,y0+hh,st);}
      var rb=Math.max(3.2,Math.min(5.5,tw*1.4)),o=tw/2+rb,pts=[[x0+o,y0+o],[x0+ww-o,y0+o],[x0+o,y0+hh-o],[x0+ww-o,y0+hh-o]];
      if(tor)pts.push([x0+o,y0+hh/2],[x0+ww-o,y0+hh/2]);
      pts.forEach(function(p){a.raw('<circle cx="'+R2(p[0])+'" cy="'+R2(p[1])+'" r="'+R2(rb)+'" fill="'+K.concL+'" stroke="#FFFFFF" stroke-width="1"/>');});}
    var fundoT=he>0?'#C9D6E3':K.conc; /* concreto sob a faixa da seção vazada: contorno do rótulo */
    if(he>0&&sw>=70)a.text(ox+he/2+6,oy+he/2+16,'Ae',14,C.blue,true,undefined,fundoT);
    /* torção: seta circular com T no centro */
    if(tor){var cx=ox+sw/2,cy=oy+sh/2,rr=Math.max(9,Math.min(20,Math.min(sw,sh)*.16));
      a.raw('<path d="M'+R2(cx+rr)+' '+R2(cy)+' A'+R2(rr)+' '+R2(rr)+' 0 1 0 '+R2(cx)+' '+R2(cy+rr)+'" fill="none" stroke="'+C.blue+'" stroke-width="1.8"/><polygon points="'+R2(cx+6)+','+R2(cy+rr)+' '+R2(cx-1)+','+R2(cy+rr-4)+' '+R2(cx-1)+','+R2(cy+rr+4)+'" fill="'+C.blue+'"/>');
      a.text(cx,cy+5,'T',15,C.blue,true,'middle',fundoT);}
    /* cortante: seta V sobre a face superior */
    if(cor){var vx=ox+sw/2;L(vx,oy-30,vx,oy-6,' stroke="'+C.blue+'" stroke-width="2"');a.raw('<polygon points="'+R2(vx)+','+R2(oy-3)+' '+R2(vx-4.5)+','+R2(oy-12)+' '+R2(vx+4.5)+','+R2(oy-12)+'" fill="'+C.blue+'"/>');a.text(vx+9,oy-14,'V',15,C.blue,true);}
    /* cotas: bw (baixo), h (esquerda), d (direita) */
    var yb=oy+sh+16;L(ox,oy+sh,ox,yb+5,lf);L(ox+sw,oy+sh,ox+sw,yb+5,lf);L(ox,yb,ox+sw,yb);a.raw(seta(ox,yb,'l')+seta(ox+sw,yb,'r'));a.text(ox+sw/2,yb+18,'bw = '+cota(W),15.5,C.muted,false,'middle');
    var xh=ox-18;L(ox,oy,xh-5,oy,lf);L(ox,oy+sh,xh-5,oy+sh,lf);L(xh,oy,xh,oy+sh);a.raw(seta(xh,oy,'u')+seta(xh,oy+sh,'d'));a.rot(xh-6,oy+sh/2,'h = '+cota(H),15.5,C.muted);
    if(fin(r.d)&&r.d>0&&r.d<H){var xr=ox+sw+22,yd=oy+r.d*s;L(ox+sw,oy,xr+5,oy,lf);L(ox+sw,yd,xr+5,yd,lf);L(xr,oy,xr,yd);a.raw(seta(xr,oy,'u')+seta(xr,yd,'d'));a.rot(xr-6,(oy+yd)/2,'d = '+cota(r.d),15.5,C.muted);}
    var cap=tor?['Seção vazada (tracejada): he = '+cota(r.torcao.he)+' cm,','Ae = '+fmt(r.torcao.Ae)+' cm², ue = '+cota(r.torcao.ue)+' cm.','Cotas em cm; V e T esquemáticos.','Estribo ilustrativo; não é detalhamento.']:['Cotas em cm; V esquemático.','Estribo ilustrativo; cobrimento e barras','longitudinais não são detalhamento.'];
    cap.forEach(function(t,i){a.text(bx+12,by+bh_-14-(cap.length-1-i)*16,t,13.5,C.muted);});
  }

  /* ---- painel 3: armadura transversal por ramo × espaçamento */
  function diagramaCis(a,r,bx,by,bw_,bh_){
    var A1=r.areaPorRamo,dem=r.demandaPorRamoM,s0=r.sAdotado,sm=r.sMax,se=r.sExato;
    if(!(fin(A1)&&A1>0&&fin(s0)&&s0>0)){a.text(bx+12,by+58,'Diagrama indisponível',17,C.muted);return;}
    var temD=fin(dem)&&dem>0;function disp(s){return A1*100/s;}
    var xr=Math.max(fin(sm)&&sm>0?sm*1.05:0,s0*1.25,fin(se)&&se>0&&se<1e4?se*1.3:0),sx=passoBom(xr,5),xmax=Math.ceil(xr/sx-1e-9)*sx;
    var yr=Math.max(temD?dem*2.4:0,disp(s0)*1.18,temD?0:disp(xmax)*2),sy=passoBom(yr,5),ymax=Math.ceil(yr/sy-1e-9)*sy;
    var L0=bx+margemY(ymax,sy,64),R0=bx+bw_-14,T0=by+28+14,B0=by+bh_-48;
    function X(v){return L0+(R0-L0)*v/xmax;}function Y(v){return B0-(B0-T0)*v/ymax;}
    a.raw('<rect x="'+R2(L0)+'" y="'+R2(T0)+'" width="'+R2(R0-L0)+'" height="'+R2(B0-T0)+'" fill="'+K.plot+'" stroke="'+C.line+'"/>');
    var okB=fin(se)&&se>0&&se<xmax;
    if(okB)a.raw('<rect x="'+R2(L0)+'" y="'+R2(T0)+'" width="'+R2(X(se)-L0)+'" height="'+R2(B0-T0)+'" fill="#CFE9D8" fill-opacity=".55"/>');
    var cx=nCasas(sx),cy=nCasas(sy),t;
    var kx=passoRotulos(xmax,sx,cx,R0-L0),ix=0;
    for(t=0;t<=xmax+1e-9;t+=sx,ix++){a.raw('<path d="M'+R2(X(t))+' '+R2(T0)+' V'+R2(B0)+'" stroke="'+K.grade+'" stroke-width="1" fill="none"/>');if(ix%kx===0)a.text(X(t),B0+17,casas(t,cx),14,C.muted,false,'middle');}
    for(t=0;t<=ymax+1e-9;t+=sy){a.raw('<path d="M'+R2(L0)+' '+R2(Y(t))+' H'+R2(R0)+'" stroke="'+K.grade+'" stroke-width="1" fill="none"/>');a.text(L0-6,Y(t)+5,casas(t,cy),14,C.muted,false,'end');}
    a.text((L0+R0)/2,B0+37,'s (cm)',15,C.muted,false,'middle');a.rot(bx+16,(T0+B0)/2,'cm²/m por ramo',15,C.muted);
    /* curva da armadura disponível por ramo: A_ramo / s */
    var s1=Math.max(xmax/80,A1*100/ymax),n=48,p=[];for(var i=0;i<=n;i++){var si=s1*Math.pow(xmax/s1,i/n);p.push(R2(X(si))+' '+R2(Y(Math.min(disp(si),ymax))));}
    a.raw('<path d="M'+p.join(' L')+'" fill="none" stroke="'+C.blue+'" stroke-width="2.6" stroke-linejoin="round"/>');
    if(fin(sm)&&sm>0&&sm<xmax){a.raw('<path d="M'+R2(X(sm))+' '+R2(T0)+' V'+R2(B0)+'" stroke="#7B8691" stroke-width="1.2" stroke-dasharray="4 3" fill="none"/>');a.rot(X(sm)-8,B0-6,'s,máx',13.5,'#56616B',false,'start');}
    if(temD){var yd=Y(dem);a.raw('<path d="M'+R2(L0)+' '+R2(yd)+' H'+R2(R0)+'" stroke="'+C.bad+'" stroke-width="1.3" stroke-dasharray="5 3" fill="none"/>');
      a.raw('<path d="M'+R2(X(s0))+' '+R2(yd)+' V'+R2(Y(Math.min(disp(s0),ymax)))+'" stroke="#56616B" stroke-width="1.4" fill="none"/><path d="M'+R2(X(s0))+' '+R2(yd-7.5)+' l7.5 7.5 l-7.5 7.5 l-7.5 -7.5 z" fill="'+C.bad+'" stroke="#FFFFFF" stroke-width="1.2"/>');}
    a.raw('<circle cx="'+R2(X(s0))+'" cy="'+R2(Y(Math.min(disp(s0),ymax)))+'" r="6" fill="'+C.blue+'" stroke="#FFFFFF" stroke-width="1.8"/>');
    /* legenda, à direita, com fundo para não brigar com as linhas */
    var nl=2+(temD?1:0)+(okB?1:0),lx=R0-128,ly=T0+22;a.raw('<rect x="'+R2(lx-6)+'" y="'+R2(T0+4)+'" width="128" height="'+(nl*19+6)+'" rx="4" fill="'+K.plot+'" fill-opacity=".92"/>');
    a.raw('<path d="M'+R2(lx)+' '+R2(ly-5)+' h22" stroke="'+C.blue+'" stroke-width="2.6" fill="none"/>');a.text(lx+30,ly,'Disponível',14.5,C.text);
    if(temD){ly+=19;a.raw('<path d="M'+R2(lx+11)+' '+R2(ly-12)+' l6 6 l-6 6 l-6 -6 z" fill="'+C.bad+'"/>');a.text(lx+30,ly,'Demanda',14.5,C.text);}
    ly+=19;a.raw('<circle cx="'+R2(lx+11)+'" cy="'+R2(ly-5)+'" r="5" fill="'+C.blue+'"/>');a.text(lx+30,ly,'s adotado',14.5,C.text);
    if(okB){ly+=19;a.raw('<rect x="'+R2(lx+3)+'" y="'+R2(ly-11)+'" width="16" height="10" fill="#CFE9D8"/>');a.text(lx+30,ly,'s ≤ s,exato',14.5,C.text);}
  }

  function cisalhamento(r,op){
    if(!r)throw new Error('Corrija as entradas antes de exportar.');op=op||{};var a=canvas(),tor=!!r.torcao,cor=!!r.cortante,k=kCis(op),sit=r.atendimento;
    var mode=r.modo==='AMBOS'?'Cortante + torção':r.modo==='TORCAO'?'Torção':'Cortante';
    var y=a.para(14,24,'ELEMENTO — '+(String(op.elemento||'').trim()||'não informado'),760,22,C.text,true);
    a.text(14,y,mode+' · NBR 6118:'+(op.norma||'2023')+' · Flexão Simples 1.2.0 / RV08',16.5,C.muted);pilula(a,986,8,sit,sit);y+=14;
    /* três painéis: seção | dados e resultados | diagrama */
    var hM=tor?330:312,xA=14,wA=300,xB=325,wB=360,xC=696,wC=290;
    a.panel(xA,y,wA,hM,'Seção transversal');a.panel(xB,y,wB,hM,'Dados e resultados');a.panel(xC,y,wC,hM,'Estribos × espaçamento');
    secaoCis(a,r,op,xA,y,wA,hM);
    var xi=xB+12,half=(wB-24)/2,yy=y+46;
    function par(p,q2){a.text(xi,yy,p,16.5);if(q2)a.text(xi+half,yy,q2,16.5);yy+=22;}
    a.text(xi,yy,'MATERIAIS E MODELO',13.5,C.muted,true);yy+=22;
    par('fck = '+fmt(r.fck,0)+' MPa','fyk = '+fmt(r.fyk,0)+' MPa');par('γc = '+fmt(r.gammaC),'γs = '+fmt(r.gammaS));par('γf = '+fmt(r.gammaF),'α = '+cota(r.alpha)+'°');
    par('bw,mín = '+cota(r.bwMin)+' cm','c₁ = '+cota(r.c1)+' cm');par('Modelo '+r.modelo+' · θ = '+cota(r.theta)+'°','fywd = '+fmt(r.fywdMPa)+' MPa');
    yy+=8;a.text(xi,yy,'ARMADURA POR RAMO (cm²/m)',13.5,C.muted,true);yy+=22;
    par('Demanda = '+fmt(r.demandaPorRamoM),'Disponível = '+fmt(r.disponivelPorRamoM));
    if(cor)par('Asw,calc = '+fmt(r.cortante.aswCalcM),'Asw,mín = '+fmt(r.cortante.aswMinM));
    if(tor){par('A90,calc = '+fmt(r.torcao.a90M),'A90,mín = '+fmt(r.torcao.a90MinM));
      yy+=8;a.text(xi,yy,'ARMADURA LONGITUDINAL (cm²)',13.5,C.muted,true);yy+=22;par('Asl,nec = '+fmt(r.torcao.aslTotal),'Asl,mín = '+fmt(r.torcao.aslMin*r.torcao.ue));}
    diagramaCis(a,r,xC,y,wC,hM);
    y+=hM+10;
    /* esforços: Sk, Sd, menor capacidade, D/C e FS — mesma leitura da tabela da flexão */
    var rows=[];
    if(cor)rows.push({nome:'Cortante',u:uForca(op),sk:r.cortante.VskTf,sd:r.cortante.VsdTf,ids:['v2','v3']});
    if(tor)rows.push({nome:'Torção',u:uMom(op),sk:r.torcao.TskTfm,sd:r.torcao.TsdTfm,ids:['t2','t3','t4']});
    var cw=[88,106,106,112,64,64],hT=84+rows.length*38,hS=tor?178:150,hE=Math.max(hT,hS),xT=24;
    a.panel(14,y,560,hE,'Esforços (γf = '+fmt(r.gammaF)+')');a.text(564,y+20,'Sd = γf·Sk · Rd = menor capacidade',14.5,C.muted,false,'end');
    var yh=y+36,xx=xT,hd=[['Esforço',''],['Sk',''],['Sd',''],['Rd',''],['D/C',''],['FS','']];
    hd.forEach(function(c,i){a.raw('<rect x="'+xx+'" y="'+yh+'" width="'+cw[i]+'" height="34" fill="'+C.head+'" stroke="'+C.line+'"/>');a.text(xx+cw[i]/2,yh+22,c[0],17,C.text,true,'middle');xx+=cw[i];});
    rows.forEach(function(rw,j){var yr=yh+34+j*38,sg=sitGrupo(r,rw.ids),rd=sg==='PENDENTE'?null:capMin(r,rw.ids),ind=indices(rw.sd,rd,sg),tc=statusColor(sg);xx=xT;
      var cel=[rw.nome,fmt(rw.sk*k),fmt(rw.sd*k),rd===null?'—':fmt(rd*k),fmt(ind.dc),fmt(ind.fs)];
      cel.forEach(function(v,i){var dest=i>=4,fill=dest?tinta(tc):i===0?C.head:K.sel;a.raw('<rect x="'+xx+'" y="'+yr+'" width="'+cw[i]+'" height="38" fill="'+fill+'" stroke="'+(dest||i===0?C.line:K.selL)+'"/>');
        if(i===0){a.text(xx+cw[i]/2,yr+17,v,16,C.text,true,'middle');a.text(xx+cw[i]/2,yr+32,rw.u,13,C.muted,false,'middle');}else a.text(xx+cw[i]/2,yr+26,v,ajuste(v,dest?20:18,cw[i]-8),dest?tc:C.text,dest,'middle');xx+=cw[i];});});
    /* solução adotada */
    var xS=586,wS=400;a.panel(xS,y,wS,hE,'Solução adotada');var ys=y+54;
    a.text(xS+12,ys,'Estribo Ø '+fmt(r.diamEstribo)+' mm · '+r.nRamos+' ramos',18.5,C.blue,true);ys+=26;
    a.text(xS+12,ys,'s,adotado = '+fmt(r.sAdotado)+' cm · s,máx = '+fmt(r.sMax)+' cm',17);ys+=24;
    a.text(xS+12,ys,'s,exato (pelo aço) = '+fmt(r.sExato)+' cm',16,C.muted);ys+=24;
    if(tor){a.text(xS+12,ys,'Asl adotada = '+(r.aslAdotada===null?'não informada':fmt(r.aslAdotada)+' cm²'),17,r.aslAdotada===null?C.wait:C.text,r.aslAdotada===null);ys+=24;}
    a.para(xS+12,ys-2,r.operacao==='dimensionar'?'Espaçamento sugerido automaticamente para a bitola escolhida.':'Espaçamento e armadura longitudinal mantidos conforme informados.',wS-24,13.5,C.muted);
    y+=hE+10;
    /* verificações por critério, com barra de utilização */
    var vs=r.verificacoes,hV=62+vs.length*26+8;a.panel(14,y,972,hV,'Verificações · armadura e esforços informados');a.text(976,y+20,'D/C = demanda/capacidade · FS = capacidade/demanda',14.5,C.muted,false,'end');
    var cx2={nome:26,dem:392,cap:542,dc:612,fs:680,bar:700,sit:962};[['Critério',cx2.nome,'start'],['Demanda',cx2.dem,'end'],['Capacidade',cx2.cap,'end'],['D/C',cx2.dc,'end'],['FS',cx2.fs,'end'],['Utilização',cx2.bar,'start'],['Situação',cx2.sit,'end']].forEach(function(c){a.text(c[1],y+49,c[0],14.5,C.muted,false,c[2]);});a.rule(26,y+56,946);
    vs.forEach(function(v,i){var yv=y+78+i*26,ind=indices(v.demanda,v.capacidade,v.situacao),cs=statusColor(v.situacao),wt=largura(v.situacao,16.5);if(i>0)a.rule(26,yv-19,946);
      icone(a,cx2.nome+8,yv-6,8,v.situacao);a.text(cx2.nome+24,yv,v.nome,17);celulaVU(a,cx2.dem,yv,vu(v.demanda,v.unidade,op),128);celulaVU(a,cx2.cap,yv,vu(v.capacidade,v.unidade,op),142);
      a.text(cx2.dc,yv,fmt(ind.dc),17,C.text,false,'end');a.text(cx2.fs,yv,fmt(ind.fs),17,C.text,false,'end');
      a.raw('<rect x="'+cx2.bar+'" y="'+(yv-12)+'" width="130" height="9" rx="4.5" fill="'+K.suave+'"/>');
      if(fin(ind.dc)){a.raw('<rect x="'+cx2.bar+'" y="'+(yv-12)+'" width="'+R2(Math.max(5,130*Math.min(ind.dc/1.2,1)))+'" height="9" rx="4.5" fill="'+cs+'"/><path d="M'+R2(cx2.bar+130/1.2)+' '+(yv-16)+' v17" stroke="'+C.text+'" stroke-width="1.4" fill="none"/>');}
      a.text(cx2.sit,yv,v.situacao,16.5,cs,true,'end');});
    y+=hV+8;
    y=a.para(14,y+8,'Capacidades para a combinação indicada'+(r.modelo==='II'||r.modo==='AMBOS'?': reserva-se a parcela exigida pelo outro esforço; no modelo II, Vc varia com VSd.':'.'),972,15,C.muted);
    if(r.avisos&&r.avisos.length)y=a.para(14,y,r.avisos.map(function(t){return String(t).replace(/<[^>]*>/g,'').replace(/(-?\d+)\.(\d+)/g,function(_,n,d){return d.length>=3?fmt(Number(n+'.'+d)):n+','+d;}).replace(/cm2/g,'cm²');}).join(' '),972,15.5,C.wait);
    y=a.para(14,y,'Critérios e detalhamento complementar no relatório completo.',972,15,C.muted);
    /* barra de estado */
    y+=2;a.raw('<rect x="14" y="'+R2(y)+'" width="972" height="32" fill="'+C.head+'" stroke="'+C.line+'"/>');
    a.text(24,y+22,'Conclusão: '+sit+' aos critérios apresentados · Governa: '+(r.governante?r.governante.nome:'pendente')+'.',16.5,statusColor(sit),true);
    a.text(976,y+22,'10 N = 1 kgf · 1 kN = 100 kgf',15.5,C.muted,false,'end');
    return a.finish(y+32+8,'cortante e torção');
  }
  FS.ResumoHorizontal={flexao:flexao,cisalhamento:cisalhamento,avaliarFlexao:avaliarFlexao,indices:indices};
})(typeof window!=='undefined'?window:globalThis);
