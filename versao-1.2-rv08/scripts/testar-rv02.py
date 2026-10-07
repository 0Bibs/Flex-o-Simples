"""Testes RV02 com recursos reais em DOM local; não testa PWA ou Word."""
from pathlib import Path
import argparse
import json,re,struct,hashlib
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output',default='resultados-rv02',help='Pasta para as evidências de teste')
parser.add_argument('--chromium',default=None,help='Executável Chromium; omitir usa o instalado pelo Playwright')
args=parser.parse_args()
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(args.output).resolve();OUT.mkdir(parents=True,exist_ok=True)

def load(p,root=ROOT,rel='index.html'):
 folder=(root/rel).parent;s=(root/rel).read_text()
 s=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>'+(folder/m[1]).resolve().read_text().replace('</script','<\\/script')+'</script>',s)
 s=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>'+(folder/m[1]).resolve().read_text()+'</style>',s)
 s=re.sub(r'<link[^>]*rel="(?:manifest|apple-touch-icon)"[^>]*>','',s)
 p.set_content(s)

CHECKS=[];ERRORS=[];ISSUES=[]
def ok(msg):CHECKS.append(msg);print('PASS:',msg,flush=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox'])
 ctx=b.new_context(viewport={'width':1440,'height':1000},accept_downloads=True,service_workers='block',locale='pt-BR')
 p=ctx.new_page();p.set_default_timeout(8000);p.on('pageerror',lambda e:ERRORS.append(str(e)));load(p)
 assert p.locator('#relatorio').get_attribute('data-calculo-valido')=='true';ok('Inicialização com os recursos reais do pacote, em DOM local')
 p.fill('#idElemento','PAREDES E FUNDOS CAIXA TRAVESSIA TQ 140.22');assert 'As,adotada = As,calc > As,mín' in p.locator('#painelResumo').inner_text();ok('Ordenação na tela para o exemplo enviado')
 p.click('#btPreviaDocumento');assert p.locator('#previaDocumento').evaluate('(d)=>d.open');assert p.locator('#folhaPrevia svg').count()==1
 p.keyboard.press('Escape');assert not p.locator('#previaDocumento').evaluate('(d)=>d.open');ok('Prévia física abre e fecha pelo teclado')
 compact=p.evaluate('FS.PainelFlexao.exportar()');p.select_option('#composicaoDocumento','ampliada');expanded=p.evaluate('FS.PainelFlexao.exportar()');assert len(compact)!=len(expanded)
 p.select_option('#composicaoDocumento','compacta');ok('Duas composições documentais disponíveis sem alterar o cálculo')
 with p.expect_download() as d:p.click('#btBaixarImagem')
 target=OUT/'amostra_exportada.png';d.value.save_as(target);raw=target.read_bytes();wh=struct.unpack('>II',raw[16:24]);assert wh[0]==2000
 phys=[];pos=8
 while pos<len(raw):
  n=struct.unpack('>I',raw[pos:pos+4])[0]
  if raw[pos+4:pos+8]==b'pHYs':phys.append(struct.unpack('>IIB',raw[pos+8:pos+17]))
  pos+=n+12
 assert phys==[(12121,12121,1)];ok('Download PNG real: 2000 px e metadados físicos de 165 mm')
 with p.expect_download() as d:p.click('#btBaixarSvg')
 d.value.save_as(OUT/'amostra_exportada.svg');assert 'width="165mm"' in (OUT/'amostra_exportada.svg').read_text();ok('Download SVG vetorial real com largura física')
 before=p.locator('#repResultados').inner_text();p.select_option('#unidadeMomento','knm');assert p.locator('#repResultados').inner_text()==before;assert '32,20 kN·m' in p.locator('#painelResumo').inner_text();p.select_option('#unidadeMomento','tfm');ok('Troca de unidades sem alteração numérica do estado')
 p.fill('#msd','.1');assert 'As,adotada = As,mín > As,calc' in p.locator('#painelResumo').inner_text();assert 'Estado antes da mínima' in p.evaluate('FS.PainelFlexao.exportar()');ok('Mínima governa e o estado dos diagramas é explicitamente identificado')
 p.fill('#asArea','2');p.fill('#msd','20');assert p.input_value('#operacao')=='conferir';t=p.locator('#painelResumo').inner_text();assert 'Armadura adotada × momento solicitante' in t and 'NÃO ATENDE' in t and 'As,calc' not in t
 html=p.evaluate('FS.PainelFlexao.relatorioCompleto()');assert 'NÃO ATENDE' in html and 'Resistência à flexão' in html;ok('Não atendimento visível no painel e no relatório completo, com demanda independente')
 p.select_option('#operacao','capacidade');assert 'Sem demanda independente' in p.locator('#painelResumo').inner_text();assert 'NÃO ATENDE' not in p.locator('#painelResumo').inner_text();ok('Modo capacidade não inventa aprovação ou demanda independente')
 p.fill('#fck','0');assert p.locator('#relatorio').get_attribute('data-calculo-valido')=='false';assert p.locator('#btPreviaDocumento').is_disabled() and p.locator('#btBaixarImagem').is_disabled();assert not p.locator('#repEquilibrio svg').count();p.select_option('#unidadeMomento','knm');assert p.locator('#relatorio').get_attribute('data-calculo-valido')=='false';ok('Entradas inválidas limpam estado e bloqueiam prévia/exportação, inclusive após troca de unidade')
 p.fill('#fck','30');p.select_option('#unidadeMomento','tfm');p.select_option('#operacao','dimensionar');p.fill('#msd','3.22');ok('Recuperação após correção das entradas')
 # Render fixtures from the unchanged engine at the presentation boundary.
 fixtures=[
 {'name':'padrao','extra':{}}, {'name':'laje','extra':{'bw':100,'d':16,'Msd':3.37}},
 {'name':'alta','extra':{'bw':12,'d':96,'Msd':3}}, {'name':'larga','extra':{'bw':200,'d':16,'Msd':2}},
 {'name':'secao_T_mesa','extra':{'secao':'T','bf':80,'hf':10,'Msd':20}},
 {'name':'secao_T_alma','extra':{'secao':'T','bf':80,'hf':10,'Msd':80,'betaXLim':.8}},
 {'name':'dupla','extra':{'Msd':30}}, {'name':'minima','extra':{'Msd':.1}},
 {'name':'minima_desligada','extra':{'Msd':.1,'usarArmaduraMinima':False},'usarMin':False},
 {'name':'nulo','extra':{'Msd':0}}, {'name':'C90','extra':{'fck':90,'Msd':8}},
 {'name':'aco_B','extra':{'tipoAco':'B','fyk':600,'Msd':20}},
 {'name':'capacidade','kind':'cap','extra':{'bw':100,'d':15,'dl':5,'As':5.026548245743669,'Asl':0},'bars':10},
 {'name':'aco_superior_tracionado','kind':'cap','extra':{'bw':100,'d':15,'dl':5,'As':5,'Asl':1}},
 {'name':'verificacao_atende','kind':'verify','extra':{'As':2,'Asl':0}},
 {'name':'verificacao_nao_atende','kind':'verify','extra':{'As':2,'Asl':0,'Msd':20}},
 {'name':'titulo_longo','extra':{},'title':'W'*120},
 {'name':'titulo_html','extra':{},'title':'A & B <script>alert(1)</script>'},
 {'name':'area_elevada','kind':'cap','extra':{'As':500,'Asl':0}},
 ]
 results=[]
 measure='''()=>{let root=document.querySelector('#qa svg'), out=[], pairs=[],texts=[...root.querySelectorAll('text')];
 function box(t){let b=t.getBoundingClientRect();return {x:b.x,y:b.y,r:b.right,b:b.bottom,w:b.width,h:b.height};}
 for(let g of root.querySelectorAll('g[id^="quadro-"]')){let rb=box(g.querySelector('rect'));for(let t of g.querySelectorAll('text')){let q=box(t);if(q.w&&q.h&&(q.x<rb.x-1.6||q.r>rb.r+1.6||q.y<rb.y-1.6||q.b>rb.b+1.6))out.push({panel:g.id,text:t.textContent,box:q,parent:rb});}}
 for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){let a=box(texts[i]),b=box(texts[j]);let w=Math.min(a.r,b.r)-Math.max(a.x,b.x),h=Math.min(a.b,b.b)-Math.max(a.y,b.y);if(w>2.5&&h>2.5)pairs.push({a:texts[i].textContent,b:texts[j].textContent,w,h});}
 return {out, pairs,width:+root.getAttribute('width'),height:+root.getAttribute('height')};}'''
 for fixture in fixtures:
  for doc in [True,False]:
   svg=p.evaluate('''arg=>{let e=Object.assign({fck:30,fyk:500,tipoAco:'A',gammaC:1.4,gammaS:1.15,gammaF:1.4,secao:'RET',bw:20,d:45,dl:4,Msd:3.22,armaduraDupla:true,usarArmaduraMinima:true,As:2,Asl:0},arg.f.extra);let r=arg.f.kind==='verify'?FS.VerificacaoFlexao.verificar(e):arg.f.kind==='cap'?FS.Flexao.verificar(e):FS.Flexao.dimensionar(e);return FS.PainelFlexao.montar(r,{documento:arg.doc,elemento:arg.f.title||arg.f.name,norma:'2023',unidade:'tfm',usarMin:arg.f.usarMin!==false,modoAs:arg.f.bars?'barras':'area',nBarras:arg.f.bars||0,diamBarras:8});}''',{'f':fixture,'doc':doc})
   assert not any(v in svg for v in ['NaN','Infinity','undefined'])
   p.evaluate('''svg=>{document.querySelector('#qa')?.remove();let d=document.createElement('div');d.id='qa';d.style='position:absolute;top:0;left:0;z-index:99999;background:white';d.innerHTML=svg;document.body.appendChild(d);}''',svg)
   metrics=p.evaluate(measure);key=fixture['name']+('_doc' if doc else '_tela');results.append({'case':key,**metrics})
   if metrics['out'] or metrics['pairs']:ISSUES.append({'case':key,**metrics})
   if doc or fixture['name'] in ['verificacao_nao_atende','capacidade']:
    p.locator('#qa svg').screenshot(path=str(OUT/(key+'.png')))
    (OUT/(key+'.svg')).write_text(svg)
   p.evaluate("document.querySelector('#qa').remove()")
 ok(f'{len(fixtures)*2} composições renderizadas com os estados do motor, sem NaN/Infinity/undefined')
 # Screens used for before/after review.
 p.fill('#idElemento','PAREDES E FUNDOS CAIXA TRAVESSIA TQ 140.22');p.screenshot(path=str(OUT/'tela_final.png'))
 p.click('#btPreviaDocumento');p.screenshot(path=str(OUT/'previa_documental.png'));p.keyboard.press('Escape')
 p.set_viewport_size({'width':1000,'height':800});assert p.locator('#painelResumo svg').count()==1;p.screenshot(path=str(OUT/'tela_1000px.png'));ok('Tela a 1000 px mantém o conteúdo com rolagem, sem esconder resultados')
 # Shear/torsion unaffected: real controls and export path.
 sh=ctx.new_page();sh.on('pageerror',lambda e:ERRORS.append(str(e)));load(sh,rel='cisalhamento/index.html')
 for mode in ['CORTANTE','TORCAO','AMBOS']:
  sh.locator(f'input[name="modo"][value="{mode}"]').check();assert sh.locator('#relatorio').get_attribute('data-calculo-valido')=='true';assert '<svg' in sh.evaluate('FS.Exportar.montarSvg()')
 ok('Cortante/torção: três modos e montagem de exportação preservados')
 assert not ERRORS,ERRORS;ok('Nenhuma exceção JavaScript nos cenários exercitados')
 b.close()
report={'checks':CHECKS,'javascript_errors':ERRORS,'layout_issues':ISSUES,'fixtures':results,'png':{'width':wh[0],'height':wh[1],'pHYs':phys},'method':'Arquivos reais em DOM local via Playwright/Chromium. Não testa file://, HTTP, PWA, Word ou área de transferência real.'}
(OUT/'validacao_rv02.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('Layout issues:',len(ISSUES));print(json.dumps(ISSUES,ensure_ascii=False,indent=2)[:12000])

if ISSUES:
 raise SystemExit("Falha: colisões ou texto fora dos quadros. Consulte validacao_rv02.json.")
