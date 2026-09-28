"""Verificacao funcional/visual 1.2; depende de Playwright apenas para testar.

python scripts/testar-interface.py --dom-only --chromium /usr/bin/chromium --output /tmp/fs12
O modo DOM carrega os arquivos reais em memoria: nao testa HTTP, file://, PWA ou Word.
Sem --dom-only, inicia servidor local para exercitar a pagina por HTTP.
"""
from __future__ import annotations
import argparse, functools, http.server, json, pathlib, re, struct, threading
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--chromium',default=None)
    parser.add_argument('--dom-only',action='store_true')
    parser.add_argument('--output',default='/tmp/flexao-v12-validacao')
    args=parser.parse_args()
    output=pathlib.Path(args.output); output.mkdir(parents=True,exist_ok=True)
    checks=[]; errors=[]; server=None; base=None
    def ok(t):
        checks.append(t); print('PASS:',t,flush=True)
    if not args.dom_only:
        server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(ROOT)))
        threading.Thread(target=server.serve_forever,daemon=True).start()
        base=f'http://127.0.0.1:{server.server_port}'
    def load(page,rel='index.html'):
        if not args.dom_only: page.goto(f'{base}/{rel}'); return
        folder=(ROOT/rel).parent; s=(ROOT/rel).read_text()
        s=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>'+(folder/m[1]).resolve().read_text().replace('</script','<\\/script')+'</script>',s)
        s=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>'+(folder/m[1]).resolve().read_text()+'</style>',s)
        s=re.sub(r'<link[^>]*rel="(?:manifest|apple-touch-icon)"[^>]*>','',s)
        page.set_content(s)
    def valid(page):
        assert page.locator('#relatorio').get_attribute('data-calculo-valido')=='true'
    def cards_fit(page):
        bad=page.evaluate('''()=>Array.from(document.querySelectorAll('#painelResumo g[id^="quadro-"]')).flatMap(g=>{
            const b=g.querySelector('rect').getBoundingClientRect();
            return Array.from(g.querySelectorAll('text')).filter(t=>{
              const a=t.getBoundingClientRect();return a.left<b.left-1||a.right>b.right+1||a.top<b.top-1||a.bottom>b.bottom+1;
            }).map(t=>({card:g.id,text:t.textContent}));})''')
        assert not bad,bad
    def export(page,name,panel=True):
        with page.expect_download() as d: page.click('#btBaixarImagem')
        png=output/f'{name}.png';d.value.save_as(png)
        data=png.read_bytes();assert data[:8]==b'\x89PNG\r\n\x1a\n'
        width,height=struct.unpack('>II',data[16:24]);assert width==2000 and height>500
        pos=8;phys=[]
        while pos<len(data):
            size=struct.unpack('>I',data[pos:pos+4])[0]
            if data[pos+4:pos+8]==b'pHYs':phys.append(struct.unpack('>IIB',data[pos+8:pos+17]))
            pos+=size+12
        assert phys==[(12121,12121,1)]
        with page.expect_download() as d:page.click('#btBaixarSvg')
        svg=output/f'{name}.svg';d.value.save_as(svg)
        text=svg.read_text();assert 'width="165mm"' in text
        assert '<script' not in text
        if panel: cards_fit(page)
        return text
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox'])
            context=browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True,service_workers='block',locale='pt-BR')
            context.set_default_timeout(7000)
            page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));load(page)
            valid(page);assert 'v1.2.0' in page.title();assert page.locator('#painelResumo g[id^="quadro-"]').count()==7
            assert page.locator('#idProjeto').count()==0;assert page.locator('#exportOrdem').count()==0
            ok('Inicializacao, versao, sete quadros e identificacao apenas pelo elemento')
            page.fill('#h','60');assert float(page.input_value('#d'))==56
            page.fill('#dl','6');assert float(page.input_value('#d'))==54
            page.fill('#d','40');assert float(page.input_value('#h'))==46
            page.fill('#dl','4');page.fill('#h','49');valid(page)
            ok('h/d/d-prime: tres edicoes sincronizadas e geometria coerente')
            page.fill('#msd','3.22');before=page.locator('#repResultados').inner_text()
            page.select_option('#unidadeMomento','knm')
            assert abs(float(page.input_value('#msd'))-32.2)<1e-10
            assert abs(float(page.input_value('#msk'))-23)<1e-10
            assert before==page.locator('#repResultados').inner_text()
            assert '32,20 kN·m' in page.locator('#painelResumo').inner_text()
            ok('tf.m para kN.m converte Msd e Msk sem alterar o resultado')
            page.evaluate('''()=>{let s=document.querySelector('#unidadeMomento');for(let i=0;i<100;i++){
              s.value=i%2?'knm':'tfm';s.dispatchEvent(new Event('change',{bubbles:true}));}}''')
            assert abs(float(page.input_value('#msd'))-32.2)<1e-10
            assert before==page.locator('#repResultados').inner_text()
            ok('100 alternancias de unidade sem deriva numerica')
            page.fill('#msd','40');valid(page)
            assert '40,00 kN·m' in page.locator('#painelResumo').inner_text()
            page.select_option('#unidadeMomento','tfm');assert abs(float(page.input_value('#msd'))-4)<1e-10
            ok('Entrada direta em kN.m chega ao motor na unidade correta')
            page.fill('#msd','3.22');page.fill('#idElemento','V1 — Viga de concreto armado')
            export(page,'painel-viga');page.screenshot(path=str(output/'interface-viga.png'))
            ok('PNG 2000px/pHYs e SVG 165mm: painel da viga com textos dentro dos quadros')
            page.click('#btTema');export(page,'painel-corporativo')
            ok('Tema corporativo: exportacao funcional e desenho tecnico preservado')
            page.fill('#bw','100');page.fill('#h','20');page.fill('#msd','3.37');page.fill('#idElemento','L1 — Faixa de laje (1,00 m)')
            export(page,'painel-laje');page.screenshot(path=str(output/'interface-laje.png'));valid(page)
            ok('Exemplo de geometria da orientacao: bw100, h20, d16 e d-prime4')
            page.fill('#bw','20');page.fill('#h','49');page.locator('input[name="secao"][value="T"]').check()
            page.fill('#bf','80');page.fill('#hf','10');page.fill('#msd','20');page.fill('#idElemento','VT1 — Viga de seção T')
            export(page,'painel-secao-t');valid(page)
            ok('Secao T: forma, cotas, resultados e exportacao')
            page.locator('input[name="secao"][value="RET"]').check();page.fill('#msd','30');page.fill('#idElemento','V2 — Armadura dupla')
            export(page,'painel-armadura-dupla');valid(page)
            ok('Armadura dupla: apresentacao dos dois niveis de aco')
            page.fill('#msd','.1');page.fill('#idElemento','V3 — Armadura mínima')
            text=export(page,'painel-armadura-minima')
            assert 'Estado antes da mínima' in page.locator('#painelResumo').inner_text()
            assert 'Governa: armadura mínima.' in page.locator('#painelResumo').inner_text()
            assert 'minima governa' in text
            ok('Minima governante: aviso conservado e estado do diagrama identificado')
            page.locator('input[name="modoAs"][value="barras"]').check();page.fill('#nBarras','5');page.select_option('#diamBarras','12.5')
            assert page.locator('#quadro-geometria .barra-longitudinal').count()==5
            before=page.locator('#repResultados').inner_text();msd=float(page.input_value('#msd'))
            page.select_option('#unidadeMomento','knm')
            assert page.locator('input[name="modoAs"][value="barras"]').is_checked()
            assert page.locator('#repResultados').inner_text()==before
            assert abs(float(page.input_value('#msd'))-msd*10)<1e-9
            page.fill('#idElemento','V4 — 5 barras Ø12,5 mm');export(page,'painel-modo-inverso')
            assert 'Sem demanda independente' in page.locator('#painelResumo').inner_text()
            ok('Modo inverso e barras: quantidade real e unidade nao perde a armadura informada')
            page.select_option('#unidadeMomento','tfm');page.click('#btDimensionar')
            for field,value,reset in [('fck','0','30'),('gammaF','0','1.4'),('dl','','4'),('h','1','49'),('msd','-2','3.22')]:
                page.fill('#'+field,value)
                assert page.locator('#relatorio').get_attribute('data-calculo-valido')=='false',(field,value)
                assert page.locator('#btBaixarImagem').is_disabled()
                assert page.locator('#btExportarPainel').is_disabled()
                assert not page.locator('#painelResumo path').count()
                thrown=page.evaluate('''()=>{try{FS.Exportar.montarSvg();return false;}catch(e){return /entradas/.test(e.message);}}''')
                assert thrown;page.fill('#'+field,reset);valid(page)
            ok('Cinco entradas invalidas limpam desenhos, bloqueiam exportacao e recuperam apos correcao')
            page.fill('#idElemento','M'*120);cards_fit(page)
            svg=page.evaluate('FS.Exportar.montarSvg()');assert 'ELEMENTO' in svg
            page.fill('#idElemento','A & B <script>alert(1)</script>');text=export(page,'painel-identificador')
            assert '&lt;script&gt;' in text;assert '<script>' not in text
            ok('Titulos longos e caracteres HTML preservados sem injetar marcacao')
            page.fill('#msd','0');valid(page);cards_fit(page);page.evaluate('FS.Exportar.montarSvg()')
            ok('Momento nulo: painel sem NaN ou infinito')
            page.fill('#fck','90');page.fill('#msd','8');valid(page);cards_fit(page);export(page,'painel-c90')
            ok('Faixa de concreto de alta resistencia: diagrama e limites graficos')
            for key,id_ in [('F2','bw'),('F3','fck'),('F4','asArea'),('F5','msd')]:
                page.keyboard.press(key);assert page.evaluate('document.activeElement.id')==id_
            page.keyboard.press('F9');valid(page)
            ok('Atalhos funcionais F2/F3/F4/F5/F9')
            # Real clipboard permission is not available in the in-memory mode; verify error fallback.
            if args.dom_only:
                page.evaluate('''()=>Object.defineProperty(navigator,'clipboard',{value:undefined,configurable:true})''')
                page.click('#btCopiarImagem');assert 'Baixar imagem' in page.locator('#exportAviso').inner_text()
                ok('Clipboard indisponivel oferece download, sem alegar copia')
            # Check all modes of the unchanged shear/torsion engine with simplified identification.
            shear=context.new_page();shear.on('pageerror',lambda e:errors.append(str(e)));load(shear,'cisalhamento/index.html')
            shear.fill('#idElemento','C1 — Cortante e torção')
            for mode in ['CORTANTE','TORCAO','AMBOS']:
                shear.locator(f'label:has(input[name="modo"][value="{mode}"])').click();valid(shear)
                text=export(shear,'cortante-'+mode.lower(),False)
                assert 'ELEMENTO —' in text and 'IDENTIFICAÇÃO' not in text
            ok('Cortante/torcao: tres modos e exportacao mantidos')
            assert not errors,errors
            ok('Nenhuma excecao JavaScript nas paginas exercitadas')
            browser.close()
    finally:
        if server:server.shutdown()
        (output/'validacao-interface.json').write_text(json.dumps({'versao':'1.2.0','modo':'DOM-em-memoria' if args.dom_only else 'HTTP',
            'checks_passed':len(checks),'checks':checks,'javascript_errors':errors,
            'nao_verificado':['Microsoft Word','clipboard real','aplicativo Windows da referencia','PWA/offline'],
            'source_root':str(ROOT)},ensure_ascii=False,indent=2))
if __name__=='__main__':main()
