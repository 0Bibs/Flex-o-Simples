'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.join(__dirname,'..');
const scope={};
for(const f of ['norma','flexao','entrada-flexao','painel-flexao'])
  new Function('globalThis',fs.readFileSync(path.join(ROOT,'js',f+'.js'),'utf8'))(scope);
const {Flexao:F,EntradaFlexao:E,PainelFlexao:P}=scope.FS;
const base={fck:30,fyk:500,tipoAco:'A',gammaC:1.4,gammaS:1.15,gammaF:1.4,
  secao:'RET',bw:20,d:45,dl:4,Msd:3.22,armaduraDupla:true,usarArmaduraMinima:true};
const options={elemento:'V1',norma:'2023',unidade:'tfm',usarMin:true,modoAs:'area'};
const clean=s=>s.replace(/<[^>]*>/g,'').replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&');
const compact=s=>s.replace(/\s+/g,'');
test('1.2: unidade usa a convencao legada 10, sem mudar o motor',()=>{
  assert.equal(E.paraMotor(32.2,'knm'),3.22);
  assert.equal(E.doMotor(3.22,'knm'),32.2);
  assert.equal(E.converter(2.3,'tfm','knm'),23);
  assert.equal(E.converter(23,'knm','tfm'),2.3);
  assert.equal(E.rotulo('knm'),'kN·m');assert.equal(E.rotulo('tfm'),'tf·m');
});
test('1.2: entradas vazias nao sao convertidas silenciosamente em zero',()=>{
  assert.ok(Number.isNaN(E.numero('')));assert.ok(Number.isNaN(E.numero(' ')));
  assert.equal(E.numero('1,4'),1.4);assert.ok(Number.isNaN(E.paraMotor('','tfm')));
  assert.throws(()=>E.converter(2,'tfm','psi'));
});
test('1.2: editar h conserva d-prime e deriva d',()=>{
  const g=E.sincronizar({h:60,d:45,dl:4},'h');assert.deepEqual(g,{h:60,d:56,dl:4});assert.ok(E.coerente(g));
});
test('1.2: editar d-prime conserva h e deriva d',()=>{
  assert.deepEqual(E.sincronizar({h:49,d:45,dl:6},'dl'),{h:49,d:43,dl:6});
});
test('1.2: editar d conserva d-prime e deriva h',()=>{
  assert.deepEqual(E.sincronizar({h:49,d:16,dl:4},'d'),{h:20,d:16,dl:4});
});
test('1.2: geometria incoerente, infinita ou com afastamento maior que d e recusada',()=>{
  for(const g of [{h:20,d:16,dl:3},{h:20,d:0,dl:20},{h:20,d:5,dl:15},
    {h:Infinity,d:16,dl:4},{h:20,d:16,dl:NaN},{h:'',d:16,dl:4}])assert.equal(E.coerente(g),false);
  assert.ok(E.coerente({h:20,d:16,dl:4}));
});
test('1.2: conversao e neutra para resultados numericos e deformacoes',()=>{
  const tf=F.dimensionar(base),kn=F.dimensionar({...base,Msd:E.paraMotor(32.2,'knm')});
  assert.deepEqual(tf,kn);
});
test('1.2: painel tem os sete quadros do esquema, em tres colunas alinhadas',()=>{
  const svg=P.montar(F.dimensionar(base),options);
  for(const id of ['geometria','materiais','esforco','resultados','armaduras','dominios','equilibrio'])
    assert.equal((svg.match(new RegExp('id="quadro-'+id+'"','g'))||[]).length,1);
  const boxes=[...svg.matchAll(/id="quadro-([^"]+)"[^>]*><rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/g)];
  assert.equal(boxes.length,7);
  const pos=Object.fromEntries(boxes.map(m=>[m[1],m.slice(2).map(Number)]));
  assert.equal(pos.geometria[1],pos.dominios[1]);assert.equal(pos.armaduras[1],pos.dominios[1]);assert.ok(pos.resultados[1]>pos.armaduras[1]);
  assert.equal(pos.geometria[0],pos.materiais[0]);assert.equal(pos.materiais[0],pos.esforco[0]);
  assert.ok(pos.geometria[0]<pos.resultados[0]&&pos.resultados[0]<pos.dominios[0]);
});
test('1.2: elemento e unico identificador exportado e e escapado',()=>{
  const svg=P.montar(F.dimensionar(base),{...options,elemento:'A & B <script>alert(1)</script>',projeto:'NAO_EXPORTAR'});
  assert.match(svg,/ELEMENTO — A &amp; B &lt;script&gt;/);
  assert.ok(!svg.includes('<script>'));assert.ok(!svg.includes('NAO_EXPORTAR'));assert.ok(!svg.includes('IDENTIFICAÇÃO'));
});
test('1.2: rotulos matematicos tem subscrito real no vetor',()=>{
  const svg=P.montar(F.dimensionar(base),options);
  assert.match(svg,/baseline-shift="-[0-9.]+" font-size="[0-9.]+"/);assert.match(svg,/>s,adotada<\/tspan>/);
});
test('1.2: dados em kN.m aparecem convertidos, com convencao explicita',()=>{
  const svg=clean(P.montar(F.dimensionar(base),{...options,unidade:'knm'}));
  assert.ok(svg.includes('32,20 kN·m'));assert.ok(svg.includes('23,00 kN·m'));assert.ok(svg.includes('1 tf·m = 10 kN·m'));
});
test('1.2: secao T, laje, dupla, minima e momento nulo nao geram valores invalidos no vetor',()=>{
  for(const extra of [{secao:'T',bf:80,hf:10,Msd:20},{bw:100,d:16,dl:4,Msd:3.37},
    {Msd:30},{Msd:.1},{Msd:0},{fck:90,Msd:8}]){
    const r=F.dimensionar({...base,...extra}),svg=P.montar(r,options);
    assert.ok(!/NaN|Infinity|undefined/.test(svg));assert.ok(svg.startsWith('<svg '));assert.ok(svg.endsWith('</svg>'));
  }
});
test('1.2: diagramas e calculo nao fabricam barras no modo area equivalente',()=>{
  const r=F.verificar({...base,As:F.areaBarras(5,12.5),Asl:0}),area=P.geometria(r,options),barras=P.geometria(r,{...options,modoAs:'barras',nBarras:5,diamBarras:12.5});
  assert.ok(!area.includes('barra-longitudinal'));assert.equal((barras.match(/barra-longitudinal/g)||[]).length,5);
});
test('1.2: avisos do motor permanecem na exportacao e nao viram aprovacao global',()=>{
  const r=F.dimensionar({...base,Msd:100,armaduraDupla:false});assert.ok(r.avisos.length);
  const svg=clean(P.montar(r,options));for(const a of r.avisos)assert.ok(compact(svg).includes(compact(a)),a);
  assert.ok(!svg.includes('APROVADO'));assert.ok(!svg.includes('ATENDE'));
});
test('1.2: modo inverso e rotulado como capacidade, sem minimo ficticiamente adotado',()=>{
  const r=F.verificar({...base,As:3.2,Asl:0});const out=clean(P.montar(r,options));
  assert.ok(compact(out).includes('capacidaderesistente'));assert.ok(out.includes('Sem demanda independente'));assert.ok(out.includes('As,informada'));
  assert.ok(!out.includes('Governa:'));assert.ok(!out.includes('As,calc'));
});
test('1.2: identificador extenso aumenta a altura, sem truncar dados',()=>{
  const r=F.dimensionar(base),a=P.montar(r,options),b=P.montar(r,{...options,elemento:'M'.repeat(120)});
  assert.ok(Number(/height="(\d+)"/.exec(b)[1])>Number(/height="(\d+)"/.exec(a)[1]));
  const parts=P.quebrar('M'.repeat(120),21,972);assert.equal(parts.join(''),'M'.repeat(120));
});
test('1.2: HTML mantem a armadura minima e oferece h/d/d-prime e seletor de unidades',()=>{
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  for(const id of ['h','d','dl','bw','unidadeMomento','usarMin','usarDupla','outRhoMin','outAsMin','outAsMax','outMdMin'])
    assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
  assert.ok(!html.includes('id="idProjeto"'));assert.match(html,/<strong>Materiais<\/strong>/);
});

test('revisao visual: documento coloca dados e modelo antes dos resultados',()=>{
  const r=F.verificar({...base,bw:100,d:15,dl:5,As:Math.PI*.8**2/4*10,Asl:0});
  const svg=P.montar(r,{...options,unidade:'knm',documento:true});
  assert.ok(svg.indexOf('id="quadro-geometria"')<svg.indexOf('id="quadro-dominios"'));
  assert.ok(svg.indexOf('id="quadro-dominios"')<svg.indexOf('id="quadro-resultados"'));
  assert.ok(clean(svg).includes('31,47 kN·m'));
  assert.ok(clean(svg).includes('218,55 kN'));
});
test('revisao visual: geometria preserva proporcao e nao fabrica barras no dimensionamento',()=>{
  const r=F.dimensionar({...base,bw:100,d:15,dl:5});
  const s=P.geometria(r,{...options,modoAs:'barras',nBarras:10,diamBarras:8});
  const m=/<rect[^>]*width="([^"]+)" height="([^"]+)"/.exec(s);
  assert.ok(Math.abs(Number(m[1])/Number(m[2])-5)<.001);
  assert.ok(!s.includes('barra-longitudinal'));
});
test('revisao visual: resultantes nulas sem seta e armadura superior respeita sinal',()=>{
  const r=F.verificar({...base,bw:100,d:15,dl:5,As:5,Asl:1});
  assert.ok(r.Rsc<0);
  const s=P.equilibrio(r);
  assert.ok(s.includes('data-forca="'+r.Rsc+'"'));
  const z=P.equilibrio(F.dimensionar({...base,Msd:0}));
  assert.ok(!z.includes('class="resultante"'));
});
test('revisao visual: invalidacao nao conserva resultados ou diagramas',()=>{
  const s=P.montar(null,options,['Geometria inválida']);
  assert.ok(!s.includes('class="estado-atual"'));
  assert.ok(!s.includes('class="resultante"'));
  assert.ok(clean(s).includes('Geometria inválida'));
  assert.ok(!clean(s).includes('0,00'));
});
