'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const root = path.join(__dirname, '..');
const scope = {};
new Function('globalThis', fs.readFileSync(path.join(root, 'js/exportar.js'), 'utf8'))(scope);
const E = scope.FS.Exportar;
const title = (texto, nivel = 2) => ({ tipo: 'titulo', nivel, texto });
const text = t => ({ tipo: 'texto', linhas: [[{ t }]] });

function chunk(type, data) {
  const out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length); out.write(type, 4); data.copy(out, 8);
  out.writeUInt32BE(E.crc32(out.subarray(4, -4)), out.length - 4);
  return out;
}
function png(width = 2000) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width); ihdr.writeUInt32BE(1, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.alloc(1 + width * 4))), chunk('IEND', Buffer.alloc(0))]);
}
function chunks(bytes) {
  const b = Buffer.from(bytes); const result = [];
  for (let pos = 8; pos < b.length;) {
    const n = b.readUInt32BE(pos);
    result.push({type:b.toString('ascii',pos+4,pos+8), data:b.subarray(pos+8,pos+8+n),
      crc:b.readUInt32BE(pos+8+n), raw:b.subarray(pos+4,pos+8+n)});
    pos += n + 12;
  }
  return result;
}

test('1.1: configura a largura nominal e o PNG sem alterar o viewBox', () => {
  assert.equal(E.VERSAO, '1.2.0'); assert.equal(scope.FS.VERSAO, '1.2.0');
  assert.equal(E.LARGURA_MM, 165); assert.equal(E.LARGURA_PNG, 2000);
  const svg = '<svg width="760" height="1520" viewBox="0 0 760 1520"></svg>';
  assert.equal(E.svgFisico(svg), '<svg width="165mm" height="330mm" viewBox="0 0 760 1520"></svg>');
});
test('1.1: memorial coloca dados, modelo, resultados e armadura nessa ordem', () => {
  const b = [title('Resultados'), text('resultado'), title('Armadura'), text('solucao'),
    title('Equilíbrio'), text('modelo'), title('Dados'), title('Informações gerais',3), text('criterios'),
    title('Geometria',3),text('geo'),title('Materiais',3),text('mat'),title('Esforços',3),text('forcas')];
  const original = JSON.stringify(b);
  assert.deepEqual(E.ordenarBlocos(b).filter(x => x.tipo === 'titulo').map(x => x.texto),
    ['Dados','Informações gerais','Materiais','Geometria','Esforços','Equilíbrio','Resultados','Armadura']);
  assert.equal(JSON.stringify(b), original);
});
test('1.1: opcao tela preserva a ordem anterior', () => {
  const b=[title('Resultados'),text('r'),title('Dados'),text('d')];
  assert.deepEqual(E.ordenarBlocos(b,'tela'),b); assert.notEqual(E.ordenarBlocos(b,'tela'),b);
});
test('1.1: grupos desconhecidos, avisos e conteudo sem titulo nao desaparecem', () => {
  const b=[text('inicio'),title('Resultados'),{tipo:'aviso',texto:'Aviso'},title('Novo'),text('x'),title('Dados'),text('y')];
  const out=E.ordenarBlocos(b); assert.equal(out.length,b.length);
  for(const item of b) assert.equal(out.filter(x=>x===item).length,1);
  assert.deepEqual(E.ordenarBlocos([]),[]);
});
test('1.1: cortante e torcao conservam grupos e colocam dados antes das figuras', () => {
  const b=[title('Resultados'),title('Torção',3),text('T'),title('Estribos',3),text('estribo'),
    title('Seção'),text('figura'),title('Bielas comprimidas'),text('biela'),title('Dados'),text('entrada')];
  const out=E.ordenarBlocos(b);
  assert.deepEqual(out.filter(x=>x.tipo==='titulo'&&x.nivel===2).map(x=>x.texto),
    ['Dados','Seção','Bielas comprimidas','Resultados']);
  assert.equal(out.filter(x=>x===b[1]).length,1);
});
test('1.1: quebra textos longos e identificadores sem espacos', () => {
  const linhas=E.quebrarTexto('IDENTIFICADOR'.repeat(12),16,160);
  assert.ok(linhas.length>2); assert.equal(linhas.join(''),'IDENTIFICADOR'.repeat(12));
  for(const linha of linhas) assert.ok(linha.length*16*0.52<=160);
});
test('1.1: quebra rich text preserva subscritos e destaques', () => {
  const original=[{t:'A'},{t:'s,necessaria',sub:true},{t:' = 19.80 cm², resultado de teste',forte:true}];
  const snapshot=JSON.stringify(original);
  const lines=E.quebrarSegmentos(original,16,150);
  assert.ok(lines.length>1); assert.ok(lines.flat().some(g=>g.sub));
  assert.ok(lines.flat().some(g=>g.forte)); assert.equal(JSON.stringify(original),snapshot);
});
test('1.1: marcadores nao se repetem a cada palavra durante a quebra', () => {
  const lines=E.quebrarSegmentos([{t:'a armadura mínima governa',marca:'min'}],16,130);
  const all=lines.flat().map(x=>x.t).join(''); assert.equal((all.match(/·/g)||[]).length,1);
});
test('1.1: CRC32 confere com o vetor padrao', () => {
  assert.equal(E.crc32(Buffer.from('123456789')),0xcbf43926);
});
test('1.1: pHYs define 2000 px em 165 mm e conserva IDAT', () => {
  const before=png(), after=E.definirDensidade(before,2000,165);
  const cs=chunks(after), phys=cs.filter(c=>c.type==='pHYs');
  assert.equal(phys.length,1); assert.equal(phys[0].data.readUInt32BE(0),12121);
  assert.equal(phys[0].data.readUInt32BE(4),12121); assert.equal(phys[0].data[8],1);
  assert.ok(cs.findIndex(c=>c.type==='pHYs')<cs.findIndex(c=>c.type==='IDAT'));
  assert.deepEqual(cs.find(c=>c.type==='IDAT').data,chunks(before).find(c=>c.type==='IDAT').data);
  for(const c of cs) assert.equal(c.crc,E.crc32(c.raw));
});
test('1.1: atualizar pHYs e idempotente e nao duplica o chunk', () => {
  const once=E.definirDensidade(png(),2000,165);
  assert.deepEqual(E.definirDensidade(once,2000,165),once);
  const altered=chunks(E.definirDensidade(once,2000,200)).find(c=>c.type==='pHYs');
  assert.equal(altered.data.readUInt32BE(0),10000);
});
test('1.1: PNG aceita Uint8Array com offset de buffer', () => {
  const base=png(), padded=new Uint8Array(base.length+20); padded.set(base,7);
  assert.deepEqual(E.definirDensidade(padded.subarray(7,7+base.length),2000,165),
    E.definirDensidade(base,2000,165));
});
test('1.1: PNG recusa assinatura, truncamento e dimensoes inconsistentes', () => {
  assert.throws(()=>E.definirDensidade(new Uint8Array(90),2000,165));
  assert.throws(()=>E.definirDensidade(png().subarray(0,-1),2000,165));
  assert.throws(()=>E.definirDensidade(png(),2001,165));
  for(const v of [0,-1,NaN,Infinity]) assert.throws(()=>E.definirDensidade(png(),2000,v));
  assert.throws(()=>E.svgFisico('<svg/>'));
});
test('1.1: exportacao direta recusa relatorio invalidado', () => {
  const previous=global.document;
  global.document={getElementById:()=>({getAttribute:()=> 'false'})};
  try {assert.throws(()=>E.montarSvg(),/entradas/);} finally {
    if(previous===undefined) delete global.document; else global.document=previous;
  }
});
test('1.1: rasterizacao recusa dimensoes antes de tentar criar imagem', async () => {
  await assert.rejects(E.paraBlob('<svg/>'),/dimensões/);
  for(const scale of [0,-1,NaN,Infinity,10000]) {
    await assert.rejects(E.paraBlob('<svg width="760" height="1200"></svg>',scale),/limite/);
  }
});
test('1.1: formulas dos tres modulos sao identicas ao commit base', () => {
  // Hash Git de blob: prova de integridade da implementacao, nao de conformidade normativa.
  const expected={
    'js/norma.js':'5e9fe9a88b9fe751d15dbf07cf99498b7acba8bb',
    'js/flexao.js':'528b684452f39a0199cbf6662ce75be72548abf9',
    'js/cisalhamento.js':'2d00aca2237b5cdd53abcb9dfb4fc01500677bf1'
  };
  for(const [file,hash] of Object.entries(expected)) {
    const data=fs.readFileSync(path.join(root,file));
    const actual=crypto.createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');
    assert.equal(actual,hash,file+' mudou: atualizar escopo e validacao antes de alterar este gabarito.');
  }
});
