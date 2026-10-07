(function(){
  'use strict';var FS=window.FS,P=FS.PainelCisalhamento,exatos=Object.create(null),ultimo=null,unidadeAnterior='tf';
  function $(id){return document.getElementById(id);}
  function valor(id){return Object.prototype.hasOwnProperty.call(exatos,id)?exatos[id]:FS.EntradaFlexao.numero($(id).value);}
  function set(id,x){if(!Number.isFinite(x)){delete exatos[id];$(id).value='';return;}exatos[id]=x;$(id).value=x!==0&&Math.abs(x)<.005?x.toExponential(2):x.toFixed(2);}
  function fator(u){return u==='kgf'?1000:u==='kn'?10:1;}
  function modo(){return document.querySelector('input[name="modo"]:checked').value;}
  function op(){return {elemento:$('idElemento').value,norma:$('norma').value,unidade:$('unidadeEsforcos').value};}
  function entrada(){return {modo:modo(),operacao:$('operacaoCis').value,fck:valor('fck'),fyk:valor('fyk'),gammaC:valor('gammaC'),gammaS:valor('gammaS'),gammaF:valor('gammaF'),bw:valor('bw'),bwMin:valor('bwMin'),h:valor('h'),d:valor('d'),c1:valor('c1'),modelo:$('modelo').value,theta:valor('theta'),alpha:valor('alpha'),refMin:$('refMin').value,aslEf:valor('aslEf'),Vsd:valor('vsd')/fator(op().unidade),Tsd:valor('tsd')/fator(op().unidade),diamEstribo:valor('diamEstribo'),nRamos:valor('nRamos'),sAdotado:valor('sAdotado')};}
  function validar(e){var a=[];
    ['bw','bwMin','h','d','fck','fyk','gammaC','gammaS','gammaF','diamEstribo'].forEach(function(id){if(!Number.isFinite(e[id])||e[id]<=0)a.push('Informe '+id+' positivo.');});
    if(e.d>=e.h)a.push('d deve ser menor que h.');if(e.bwMin>e.bw)a.push('bw,mín não pode superar bw.');
    if(e.fck<10||e.fck>90)a.push('fck deve estar entre 10 e 90 MPa.');
    if(!Number.isInteger(e.nRamos)||e.nRamos<2||e.nRamos>6)a.push('Informe 2 a 6 ramos inteiros.');
    if(e.modelo==='II'&&!(e.theta>=30&&e.theta<=45))a.push('θ deve estar entre 30° e 45°.');
    if(!(e.alpha>=45&&e.alpha<=90))a.push('α deve estar entre 45° e 90°.');
    if(e.modo!=='CORTANTE'){
      if(e.alpha!==90)a.push('A verificação de torção implementada exige estribos fechados com α = 90°.');
      if(!(e.c1>0&&e.c1<Math.min(e.bw,e.h)/4))a.push('Informe c₁ positivo e menor que um quarto da menor dimensão da seção.');
      if(!Number.isFinite(e.Tsd)||e.Tsd<0)a.push('Informe TSd não negativo; vazio não equivale a zero.');
      if($('aslEf').value.trim()&&(!Number.isFinite(e.aslEf)||e.aslEf<0))a.push('Asl adotada deve ser não negativa.');
    }
    if(e.modo!=='TORCAO'&&(!Number.isFinite(e.Vsd)||e.Vsd<0))a.push('Informe VSd não negativo; vazio não equivale a zero.');
    if(e.operacao==='verificar'&&!(Number.isFinite(e.sAdotado)&&e.sAdotado>0))a.push('Informe espaçamento adotado positivo.');
    return a;
  }
  var estadoStatus={r:null};
  function pintaStatus(){var esq=$('statusEsq'),sit=$('statusSit'),dir=$('statusDir');if(!esq||!sit||!dir)return;
    var nome=String($('idElemento').value||'').trim(),a=estadoStatus.r?estadoStatus.r.atendimento:'ERRO',u=op().unidade;
    esq.textContent='Flexão Simples 1.2.0 / RV08 • '+(nome?nome+' • ':'')+'resumo de cortante e torção';
    sit.textContent=a==='ATENDE'?'atende aos critérios':a==='NÃO ATENDE'?'não atende':a==='PENDENTE'?'verificação pendente':'dados inválidos';
    sit.setAttribute('data-situacao',a);
    dir.textContent=(u==='kgf'?'kgf · kgf·m':u==='kn'?'kN · kN·m':'tf · tf·m')+' · cm · MPa';}
  function invalidar(problemas){ultimo=null;estadoStatus={r:null};pintaStatus();$('relatorio').setAttribute('data-calculo-valido','false');P.atualizar(null,op(),problemas);$('resumoAtendimento').textContent='Entradas inválidas';$('outS').textContent='—';botoes(false);}
  function botoes(valido){['btBaixarImagem','btCopiarImagem','btBaixarSvg','btRelatorioCompleto','btExportarPainel'].forEach(function(id){if($(id))$(id).disabled=!valido;});}
  function render(r){ultimo=r;estadoStatus={r:r};pintaStatus();$('relatorio').setAttribute('data-calculo-valido','true');P.atualizar(r,op());botoes(true);$('outS').textContent=r.sSugerido.toFixed(2).replace('.',',');$('gammaFT').textContent=r.gammaF.toFixed(2).replace('.',',');$('gammaFV').textContent=r.gammaF.toFixed(2).replace('.',',');$('resumoAtendimento').textContent=r.atendimento+' · critérios apresentados';$('resumoAtendimento').dataset.situacao=r.atendimento;}
  function calcular(){var e=entrada();document.body.classList.toggle('modo-v',e.modo!=='TORCAO');document.body.classList.toggle('modo-t',e.modo!=='CORTANTE');document.body.classList.toggle('modo-vt',e.modo==='AMBOS');var erros=validar(e);if(erros.length)return invalidar(erros);try{var r=FS.VerificacaoCisalhamento.calcular(e);if(e.operacao==='dimensionar')set('sAdotado',r.sAdotado);render(r);}catch(err){invalidar([err.message]);}}
  function sincronizar(id){var gf=valor('gammaF');if(id==='vsk'||id==='gammaF')set('vsd',valor('vsk')*gf);else if(id==='vsd')set('vsk',valor('vsd')/gf);if(id==='tsk'||id==='gammaF')set('tsd',valor('tsk')*gf);else if(id==='tsd')set('tsk',valor('tsd')/gf);}
  $('diamEstribo').innerHTML=[5,6.3,8,10,12.5,16].map(function(d){return '<option value="'+d+'">'+d.toFixed(2).replace('.',',')+'</option>';}).join('');$('diamEstribo').value='6.3';
  document.querySelector('.painel').addEventListener('input',function(ev){delete exatos[ev.target.id];},true);
  document.querySelectorAll('.painel input[type="number"]').forEach(function(el){el.addEventListener('blur',function(){if(el.value.trim()&&Number.isFinite(valor(el.id)))set(el.id,valor(el.id));});});
  document.querySelectorAll('.grupo .cab .chev').forEach(function(c){c.parentNode.addEventListener('click',function(){c.closest('.grupo').classList.toggle('aberto');});});
  ['fck','fyk','gammaC','gammaS','bw','bwMin','h','d','c1','modelo','theta','alpha','refMin','diamEstribo','nRamos','norma','operacaoCis'].forEach(function(id){$(id).addEventListener('input',calcular);$(id).addEventListener('change',calcular);});
  ['sAdotado','aslEf'].forEach(function(id){$(id).addEventListener('input',function(){$('operacaoCis').value='verificar';calcular();});});
  ['vsd','vsk','tsd','tsk','gammaF'].forEach(function(id){$(id).addEventListener('input',function(){sincronizar(id);calcular();});});
  document.querySelectorAll('input[name="modo"]').forEach(function(el){el.addEventListener('change',calcular);});
  $('unidadeEsforcos').addEventListener('change',function(){var nova=op().unidade;['vsd','vsk','tsd','tsk'].forEach(function(id){set(id,valor(id)/fator(unidadeAnterior)*fator(nova));});unidadeAnterior=nova;document.querySelectorAll('[data-forca]').forEach(function(el){el.textContent=nova==='kgf'?'kgf':nova==='kn'?'kN':'tf';});document.querySelectorAll('[data-torque]').forEach(function(el){el.textContent=nova==='kgf'?'kgf·m':nova==='kn'?'kN·m':'tf·m';});if(ultimo)render(ultimo);else calcular();});
  $('btDimensionarCis').addEventListener('click',function(){$('operacaoCis').value='dimensionar';calcular();});
  $('btVerificarCis').addEventListener('click',function(){$('operacaoCis').value='verificar';calcular();});
  $('idElemento').addEventListener('input',function(){P.atualizar(ultimo,op());pintaStatus();});$('unidadeEsforcos').addEventListener('change',pintaStatus);if($('btRecalcular'))$('btRecalcular').addEventListener('click',calcular);if($('btExportarPainel'))$('btExportarPainel').addEventListener('click',function(){window.FS.Exportar.copiar();});
  document.addEventListener('keydown',function(ev){if(ev.key==='F9'){ev.preventDefault();calcular();}});
  ['vsd','vsk','tsd','tsk'].forEach(function(id){set(id,valor(id)*fator(op().unidade));});unidadeAnterior=op().unidade;
  calcular();
  if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))window.addEventListener('load',function(){navigator.serviceWorker.register('../sw.js').catch(function(){});});
})();
