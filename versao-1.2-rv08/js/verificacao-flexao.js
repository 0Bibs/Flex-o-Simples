/* Independent applied demand versus the existing section-capacity engine.
   No changes to the resistance formulas or their internal units. */
(function(root){
  'use strict';var FS=root.FS=root.FS||{};
  function verificar(e){
    if(!Number.isFinite(e.Msd)||e.Msd<0)throw new Error('Informe MSd independente, não negativo.');
    if(!Number.isFinite(e.As)||e.As<0||!Number.isFinite(e.Asl)||e.Asl<0)throw new Error('Informe as áreas adotadas, não negativas.');
    var r=FS.Flexao.verificar(e);
    r.modo='AS_MSD';r.MsdTfm=e.Msd;r.Msd=e.Msd*1000;r.MskTfm=e.Msd/e.gammaF;
    var equilibrado=!(r.avisos||[]).some(function(a){return /possivel equilibrar/i.test(a);});
    function item(id,titulo,demanda,capacidade,unidade,criterio){
      var finito=Number.isFinite(demanda)&&Number.isFinite(capacidade);
      var atende=finito&&demanda<=capacidade+1e-10*Math.max(1,Math.abs(capacidade));
      return {id:id,titulo:titulo,demanda:demanda,capacidade:capacidade,unidade:unidade,
        razao:finito?(capacidade>0?demanda/capacidade:demanda>0?Infinity:0):null,criterio:criterio,
        situacao:finito?(atende?'ATENDE':'NÃO ATENDE'):'INCONCLUSIVO'};
    }
    var flexao=item('flexao','Resistência à flexão',e.Msd,r.MRdTfm,'momento','MSd ≤ MRd');
    if(!equilibrado)flexao.situacao='INCONCLUSIVO';
    r.verificacoes=[flexao,
      item('minima','Armadura mínima',r.asMin,r.As,'cm²','As,adotada ≥ As,mín'),
      item('maxima','Armadura máxima',r.As+r.Asl,r.asMax,'cm²','As + As′ ≤ As,máx'),
      item('ductilidade','Ductilidade',r.betaX,r.betaXLim,'','βx ≤ βx,lim')];
    if(!equilibrado)r.verificacoes.find(function(v){return v.id==='ductilidade';}).situacao='INCONCLUSIVO';
    r.atendimentoFlexao=flexao.situacao;
    r.atendimentoSecao=r.verificacoes.some(function(v){return v.situacao==='NÃO ATENDE';})?'NÃO ATENDE':
      r.verificacoes.some(function(v){return v.situacao==='INCONCLUSIVO';})?'INCONCLUSIVO':'ATENDE';
    r.criterioGovernante=r.verificacoes.reduce(function(a,b){return (b.razao===null?Infinity:b.razao)>(a.razao===null?Infinity:a.razao)?b:a;}).titulo;
    return r;
  }
  FS.VerificacaoFlexao={verificar:verificar};
})(typeof window!=='undefined'?window:globalThis);
