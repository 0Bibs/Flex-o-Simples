/* Camada de verificacao: mantem as equacoes e unidades do motor existente. */
(function(root){
  'use strict'; var FS=root.FS=root.FS||{};
  function item(id,nome,demanda,capacidade,unidade,criterio){
    var valido=Number.isFinite(demanda)&&Number.isFinite(capacidade)&&capacidade>=0;
    var atende=valido&&demanda<=capacidade+1e-10*Math.max(1,Math.abs(capacidade));
    return {id:id,nome:nome,demanda:demanda,capacidade:capacidade,unidade:unidade,criterio:criterio,
      razao:valido?(capacidade>0?demanda/capacidade:demanda>0?Infinity:0):null,
      situacao:valido?(atende?'ATENDE':'NÃO ATENDE'):'PENDENTE'};
  }
  function calcular(e){
    var r=FS.Cisalhamento.calcular(Object.assign({},e,{aslEf:Number.isFinite(e.aslEf)?e.aslEf:0}));
    var V=r.cortante,T=r.torcao,auto=e.operacao!=='verificar';
    var s=auto?r.sAdotado:e.sAdotado;
    if(!Number.isFinite(s)||s<=0)throw new Error('Informe espaçamento adotado positivo; se necessário, aumente a bitola ou o número de ramos.');
    r.operacao=auto?'dimensionar':'verificar';r.sSugerido=r.sAdotado;r.sAdotado=s;
    r.aslAdotada=Number.isFinite(e.aslEf)?e.aslEf:null;
    r.disponivelPorRamoM=r.areaPorRamo/s*100;
    r.avisos=r.avisos.filter(function(a){return !/Espaçamento|T<sub>Rd3|T<sub>Rd4|V<sub>Sd|T<sub>Sd/.test(a);});
    if(s<5)r.avisos.push('Espaçamento adotado inferior a 5 cm: conferir a viabilidade executiva.');
    var checks=[];
    if(V){
      var asw=Math.max(0,r.areaPorRamo/s-(T?T.a90Nec:0))*r.nRamos;
      V.aswRealM=asw*100;V.VswRealTf=asw*V.braco/10;V.VRd3Tf=V.VcTf+V.VswRealTf;
      checks.push(item('v2','Biela · cortante',V.VsdTf,V.VRd2Tf,'forca','VSd ≤ VRd2'));
      checks.push(item('v3','Estribo · cortante',V.VsdTf,V.VRd3Tf,'forca','VSd ≤ Vc(VSd) + Vsw,disp'));
    }
    if(T){
      var a90=Math.max(0,r.areaPorRamo/s-(V?V.aswNec/r.nRamos:0));
      T.a90RealM=a90*100;T.TRd3Tfm=T.fatorT3*a90/1000;
      T.TRd4Tfm=r.aslAdotada===null?null:T.fatorT4*r.aslAdotada/T.ue/1000;
      checks.push(item('t2','Biela · torção',T.TsdTfm,T.TRd2Tfm,'momento','TSd ≤ TRd2'));
      checks.push(item('t3','Estribo · torção',T.TsdTfm,T.TRd3Tfm,'momento','TSd ≤ TRd3,disponível'));
      checks.push(item('t4','Longitudinal · torção',T.TsdTfm,T.TRd4Tfm,'momento','TSd ≤ TRd4 (Asl adotada)'));
      checks.push(item('aslmin','Mínimo longitudinal',T.aslMin*T.ue,r.aslAdotada,'cm²','Asl,adotada ≥ Asl,mín'));
      var limiteHe=r.bw*r.h/(2*(r.bw+r.h));
      if(T.he>limiteHe+1e-9||T.he>=Math.min(r.bw,r.h)/2){
        var geom=item('geometria','Seção vazada equivalente',NaN,NaN,'cm','Hipótese 2c₁ ≤ he ≤ A/u não satisfeita');
        checks.push(geom);
      }
    }
    if(V&&T)checks.push(item('interacao','Bielas · V + T',r.interacao,1,'','VSd/VRd2 + TSd/TRd2 ≤ 1'));
    checks.push(item('transversal','Armadura transversal',r.demandaPorRamoM,r.disponivelPorRamoM,'cm²/m','Por ramo: parcelas necessárias de V + T, com mínimos'));
    checks.push(item('espacamento','Espaçamento longitudinal',s,r.sMax,'cm','s,adotado ≤ s,máx'));
    r.verificacoes=checks;
    r.atendimento=checks.some(function(v){return v.situacao==='NÃO ATENDE';})?'NÃO ATENDE':checks.some(function(v){return v.situacao==='PENDENTE';})?'PENDENTE':'ATENDE';
    r.governante=checks.filter(function(v){return v.razao!==null;}).reduce(function(a,b){return !a||b.razao>a.razao?b:a;},null);
    return r;
  }
  FS.VerificacaoCisalhamento={calcular:calcular};
})(typeof window!=='undefined'?window:globalThis);
