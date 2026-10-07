(function(root){
  'use strict';var FS=root.FS=root.FS||{},ultimo=null,opAtual={},errosAtuais=[];
  var C={text:'#20252A',muted:'#515A63',line:'#AEB5BC',head:'#E9ECEF',blue:'#245E91',ok:'#1F6F46',bad:'#B42318',wait:'#855A00'};
  function esc(x){return String(x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c];});}
  function fmt(v){if(v===null||!Number.isFinite(v))return v===Infinity?'∞':'—';if(v!==0&&Math.abs(v)<.005)return v.toExponential(2).replace('.',',');return v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});}
  function sym(t,f){return esc(t).replace(/\b(VSd|VSk|VRd2|VRd3|TSd|TSk|TRd2|TRd3|TRd4|Asw|Asl|A90|fck|fyk|fywd|bw|he|Ae|ue)\b/g,function(k){var z=/^(VRd|TRd)/.test(k)?1:k==='A90'?1:/^[VT]/.test(k)?1:1;return k.slice(0,z)+'<tspan font-size="'+(f*.74)+'" baseline-shift="'+(-f*.18)+'">'+k.slice(z)+'</tspan>';});}
  function txt(x,y,t,f,color,attr){f=f||18.5;return '<text x="'+x+'" y="'+y+'" font-size="'+f+'" fill="'+(color||C.text)+'" '+(attr||'')+'>'+sym(t,f)+'</text>';}
  function line(x,y,xx,yy,color){return '<line x1="'+x+'" y1="'+y+'" x2="'+xx+'" y2="'+yy+'" stroke="'+(color||C.line)+'" stroke-width="1.3"/>';}
  function rect(x,y,w,h,fill){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+(fill||'white')+'" stroke="'+C.line+'"/>';}
  function wrap(t,w,f){var words=String(t).split(/\s+/),lines=[],s='';words.forEach(function(word){if((s+' '+word).length*f*.52>w&&s){lines.push(s);s=word;}else s+=(s?' ':'')+word;});if(s)lines.push(s);return lines;}
  function note(t,w,f,color){f=f||18.5;var a=wrap(t,w-24,f);return {svg:a.map(function(z,i){return txt(12,f+6+i*f*1.42,z,f,color);}).join(''),h:a.length*f*1.42+10};}
  function stack(parts){var y=0,s='';parts.forEach(function(p){s+='<g transform="translate(0 '+y+')">'+p.svg+'</g>';y+=p.h;});return {svg:s,h:y};}
  function fields(rows,w,cols){var f=18.5,cw=(w-24)/(cols||2),s='',y=8;cols=cols||2;for(var i=0;i<rows.length;i+=cols){var lines=rows.slice(i,i+cols).map(function(a){return wrap(a[0]+' = '+a[1],cw-12,f);}),height=0;lines.forEach(function(parts,j){parts.forEach(function(t,k){s+=txt(12+j*cw,y+f+k*24,t,f);});height=Math.max(height,parts.length*24);});y+=height+9;}return {svg:s,h:y};}
  function val(v,type,op){if(v===null||!Number.isFinite(v))return fmt(v);var factor=op.unidade==='kgf'?1000:op.unidade==='kn'?10:1;return fmt(v*factor)+(type==='forca'||type==='momentoV'?(op.unidade==='kgf'?' kgf':op.unidade==='kn'?' kN':' tf'):(op.unidade==='kgf'?' kgf·m':op.unidade==='kn'?' kN·m':' tf·m'));}
  function modelo(r,w){
    var x=66,y=28,k=Math.min(200/r.bw,200/r.h),bw=r.bw*k,h=r.h*k,c=12,s='';
    s+=rect(x,y,bw,h,'#F3F4F5')+'<rect x="'+(x+c)+'" y="'+(y+c)+'" width="'+Math.max(1,bw-2*c)+'" height="'+Math.max(1,h-2*c)+'" fill="none" stroke="'+C.blue+'" stroke-width="2"/>';
    for(var i=1;i<r.nRamos-1;i++)s+=line(x+c+(bw-2*c)*i/(r.nRamos-1),y+c,x+c+(bw-2*c)*i/(r.nRamos-1),y+h-c,C.blue);
    s+=line(x,y+h+19,x+bw,y+h+19)+txt(x+bw/2,y+h+41,'bw = '+fmt(r.bw)+' cm',16,C.muted,'text-anchor="middle"');
    s+=txt(x+bw+10,y+h/2,'h = '+fmt(r.h)+' cm',16,C.muted);
    s+=txt(450,40,'Modelo '+r.modelo+' · θ = '+fmt(r.theta)+'° · α = '+fmt(r.alpha)+'°',18.5);
    var notes=r.torcao?'Estribo fechado a 90°; Asl distribuída no perímetro.':'Projeção do estribo na seção transversal.';
    var body=note(notes,w-430,17);s+='<g transform="translate(438 54)">'+body.svg+'</g>';
    if(r.torcao){var t=r.torcao;var data=fields([['he',fmt(t.he)+' cm'],['Ae',fmt(t.Ae)+' cm²'],['ue',fmt(t.ue)+' cm'],['c₁',fmt(r.c1)+' cm']],w-440,2);s+='<g transform="translate(438 '+(60+body.h)+')">'+data.svg+'</g>';}
    if(r.cortante){s+=line(26,y,26,y+55,C.blue)+'<path d="M20 '+(y+48)+' L26 '+(y+58)+' L32 '+(y+48)+'" fill="none" stroke="'+C.blue+'"/>'+txt(15,y+84,'V',16,C.blue);}
    if(r.torcao)s+='<path d="M'+(x+bw/2-25)+' '+(y+h/2)+' a25 25 0 1 1 25 25 l7 -6 m-7 6 l8 3" fill="none" stroke="'+C.blue+'" stroke-width="1.8"/>'+txt(x+bw/2+4,y+h/2,'T',16,C.blue);
    return stack([{svg:s,h:Math.max(y+h+58,250)},note('V e T: magnitudes na orientação esquemática. Posição do estribo ilustrativa; cobrimento e distribuição longitudinal não constituem detalhamento.',w,16.5,C.muted)]);
  }
  function checks(r,op,w){var parts=[];r.verificacoes.forEach(function(v){function value(x){return ['forca','momentoV','momento'].indexOf(v.unidade)>=0?val(x,v.unidade,op):fmt(x)+(v.unidade?' '+v.unidade:'');}var color=v.situacao==='ATENDE'?C.ok:v.situacao==='NÃO ATENDE'?C.bad:C.wait;
    parts.push(stack([note(v.nome+' · '+v.situacao,w,18.5,color),note('Demanda: '+value(v.demanda)+' → Capacidade: '+value(v.capacidade)+' · D/C = '+fmt(v.razao)+' · FS = '+fmt(Number.isFinite(v.demanda)&&v.demanda>0&&Number.isFinite(v.capacidade)?v.capacidade/v.demanda:NaN)+' · '+v.criterio,w,16.5,C.muted)]));
  });parts.push(note('Governante entre os critérios calculados: '+(r.governante?r.governante.nome:'—')+'. Situações com precisão integral; D/C ≤ 1 atende.',w,16.5));return stack(parts);}
  function montar(r,op,erros){op=op||{};var w=1000,inner=972,x=14,y=15,s='',cw=480,gap=12;
    function put(title,body,px,py,width){var h=36+body.h;s+= '<g class="quadro-cis">'+rect(px,py,width,h)+rect(px,py,width,36,C.head)+txt(px+12,py+25,title,20,C.text,'font-weight="600"')+'<g transform="translate('+px+' '+(py+36)+')">'+body.svg+'</g></g>';return py+h+gap;}
    var id=note('ELEMENTO — '+(op.elemento||'não informado'),inner,21);s+='<g transform="translate('+x+' '+y+')">'+id.svg+'</g>';y+=id.h;
    s+=txt(26,y+18,(r?r.modo==='AMBOS'?'Cortante + torção':r.modo==='TORCAO'?'Torção':'Cortante':'Análise indisponível')+' · NBR 6118:'+(op.norma||'2023')+' · RV08',18.5);y+=40;
    if(!r){var bad=note((erros||[]).join(' '),inner,18.5,C.bad);s+='<g transform="translate(14 '+y+')">'+bad.svg+'</g>';y+=bad.h;}
    else{
      var yy=put('Materiais / critérios',fields([['fck',fmt(r.fck)+' MPa'],['fyk',fmt(r.fyk)+' MPa'],['γc / γs',fmt(r.gammaC)+' / '+fmt(r.gammaS)],['fywd',fmt(r.fywdMPa)+' MPa']],cw,2),x,y,cw);
      var yz=put('Geometria',fields([['bw',fmt(r.bw)+' cm'],['bw,mín',fmt(r.bwMin)+' cm'],['h',fmt(r.h)+' cm'],['d',fmt(r.d)+' cm']],cw,2),x+cw+gap,y,cw);y=Math.max(yy,yz);
      var loads=[['γf',fmt(r.gammaF)]];if(r.cortante)loads.push(['VSd',val(r.cortante.VsdTf,'forca',op)],['VSk',val(r.cortante.VskTf,'forca',op)]);if(r.torcao)loads.push(['TSd',val(r.torcao.TsdTfm,'momento',op)],['TSk',val(r.torcao.TskTfm,'momento',op)]);
      y=put('Carregamentos',fields(loads,inner,3),x,y,inner);
      y=put('Modelo de cálculo / seção',modelo(r,inner),x,y,inner);
      var results=[['Demanda / ramo',fmt(r.demandaPorRamoM)+' cm²/m'],['Disponível / ramo',fmt(r.disponivelPorRamoM)+' cm²/m']];
      if(r.cortante)results.push(['Asw,calc',fmt(r.cortante.aswCalcM)+' cm²/m'],['Asw,mín',fmt(r.cortante.aswMinM)+' cm²/m']);
      if(r.torcao)results.push(['A90,calc (1 ramo)',fmt(r.torcao.a90M)+' cm²/m'],['A90,mín (1 ramo)',fmt(r.torcao.a90MinM)+' cm²/m'],['Asl,necessária',fmt(r.torcao.aslTotal)+' cm²'],['Asl,mín total',fmt(r.torcao.aslMin*r.torcao.ue)+' cm²']);
      y=put('Resultados · calculado e mínimo',fields(results,inner,2),x,y,inner);
      y=put('Verificações da armadura adotada',checks(r,op,inner),x,y,inner);
      var adopted=[['Ø estribo',fmt(r.diamEstribo)+' mm'],['Ramos',String(r.nRamos)],['s,adotado',fmt(r.sAdotado)+' cm'],['s,máx',fmt(r.sMax)+' cm']];if(r.torcao)adopted.push(['Asl,adotada',r.aslAdotada===null?'não informada':fmt(r.aslAdotada)+' cm²']);
      y=put('Solução adotada',stack([fields(adopted,inner,3),note(r.operacao==='dimensionar'?'Espaçamento sugerido automaticamente para a bitola escolhida.':'Espaçamento e armadura longitudinal mantidos conforme informados.',inner,16.5)]),x,y,inner);
      var conclusion=note('Conclusão dos critérios apresentados: '+r.atendimento+'. '+(r.atendimento==='PENDENTE'?'Complete os dados pendentes. ':'')+'Espaçamento transversal entre ramos, ancoragens, distribuição longitudinal e demais detalhes não são verificados nesta análise.',inner,17,r.atendimento==='ATENDE'?C.text:r.atendimento==='NÃO ATENDE'?C.bad:C.wait);s+='<g transform="translate(14 '+y+')">'+conclusion.svg+'</g>';y+=conclusion.h;
      if(r.modelo==='II'||r.modo==='AMBOS'){var n=note('Capacidades disponíveis para a combinação informada: reserva-se a parcela exigida pelo outro esforço. No modelo II, Vc varia com VSd.',inner,16.5,C.muted);s+='<g transform="translate(14 '+y+')">'+n.svg+'</g>';y+=n.h;}
      r.avisos.forEach(function(a){var n=note(String(a).replace(/<[^>]*>/g,''),inner,16,C.wait);s+='<g transform="translate(14 '+y+')">'+n.svg+'</g>';y+=n.h;});
    }
    var foot=note('Flexão Simples 1.2.0 · Cortante/Torção · RV08 · 10 N = 1 kgf; 1 kN = 100 kgf. Unidades: cm, cm²/m, MPa e '+(op.unidade==='kgf'?'kgf / kgf·m':op.unidade==='kn'?'kN / kN·m':'tf / tf·m')+'.',inner,16,C.muted);s+='<g transform="translate(14 '+y+')">'+foot.svg+'</g>';y+=foot.h+12;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="'+Math.ceil(y)+'" viewBox="0 0 1000 '+Math.ceil(y)+'" role="img" aria-label="Memorial de cortante e torção"><style>text{font-family:Segoe UI,Arial,sans-serif;font-variant-numeric:tabular-nums}</style><rect width="1000" height="'+Math.ceil(y)+'" fill="white"/>'+s+'</svg>';
  }
  function atualizar(r,op,erros){ultimo=r;opAtual=op;errosAtuais=erros||[];document.getElementById('painelCisalhamento').innerHTML=r?resumoTela(r,op):erroHtml(errosAtuais);}
  function erroHtml(erros){var li=(erros||[]).map(function(m){return '<li>'+esc(m).replace(/\b([VT])(Sd)\b/g,'$1<sub>$2</sub>').replace(/\bbw,mín\b/g,'b<sub>w,mín</sub>').replace(/\bbw\b/g,'b<sub>w</sub>').replace(/\bAsl\b/g,'A<sub>sl</sub>')+'</li>';}).join('');return '<div class="aviso aviso-erro" role="alert"><strong>Corrija os dados para calcular:</strong><ul>'+li+'</ul></div>';}
  function resumoTela(r,op){try{return FS.ResumoHorizontal.cisalhamento(r,op);}catch(e){return montar(r,op,errosAtuais);}}
  function exportar(){if(!ultimo)throw new Error('Corrija as entradas antes de exportar.');return FS.ResumoHorizontal.cisalhamento(ultimo,opAtual);}
  function relatorioCompleto(){if(!ultimo)throw new Error('Corrija as entradas antes de exportar.');var svg=montar(ultimo,opAtual),r=ultimo;var data=[['ρmín',fmt(r.rhoMin*100)+' %'],['fctm',fmt(r.fctm)+' MPa'],['fctd',fmt(r.fctd)+' MPa'],['Área / ramo',fmt(r.areaPorRamo)+' cm²'],['s pelo aço',fmt(r.sExato)+' cm'],['st,máx (referência)',fmt(r.stMax)+' cm']];
    if(r.cortante)data.push(['Vc(VSd)',val(r.cortante.VcTf,'forca',opAtual)],['Vsw disponível',val(r.cortante.VswRealTf,'forca',opAtual)]);
    return '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Memória de cálculo — Cortante/Torção</title><style>body{font:11pt Segoe UI,Arial;max-width:165mm;margin:15mm auto;color:#20252a}svg{width:100%;height:auto}td,th{padding:6px;text-align:left;border-bottom:1px solid #aaa}table{border-collapse:collapse;width:100%}@media print{button{display:none}body{margin:0}}@page{size:A4;margin:18mm 22.5mm}</style><button onclick="window.print()">Imprimir / salvar PDF</button>'+svg+'<h2>Parâmetros e relações de cálculo</h2><table>'+data.map(function(z){return '<tr><th>'+esc(z[0])+'</th><td>'+esc(z[1])+'</td></tr>';}).join('')+'</table><p>Disponível por ramo = π (Ø/10)² / (4s), em cm²/cm. Demanda por ramo = Asw,necessária/n + A90,necessária, considerando apenas os esforços ativos. VRd3 = Vc(VSd) + Asw,disponível × braço do modelo. TRd3 = fatorT3 × A90,disponível. TRd4 = fatorT4 × Asl,adotada/ue. Na combinação, cada resistência reserva a armadura exigida pelo outro esforço.</p><p>Torção: Asl informada deve estar distribuída no perímetro, com estribos fechados. A conferência da distribuição física e das ancoragens depende do detalhamento. Referência mínima transversal selecionada: '+esc(r.refMin)+'.</p><p>Referências: ABNT NBR 6118:'+esc(opAtual.norma)+'; modelos existentes nos itens 17.4, 17.5, 17.7 e limites de espaçamento do item 18.3.3.2. Conferência das relações: <a href="https://wwwp.feb.unesp.br/pbastos/concreto2/Cortante.pdf">UNESP — Cortante</a> e <a href="https://wwwp.feb.unesp.br/pbastos/concreto2/Torcao.pdf">UNESP — Torção</a>. Nenhuma atualização normativa dos motores foi realizada nesta revisão.</p></html>';
  }
  FS.PainelCisalhamento={montar:montar,atualizar:atualizar,exportar:exportar,relatorioCompleto:relatorioCompleto};
})(typeof window!=='undefined'?window:globalThis);
