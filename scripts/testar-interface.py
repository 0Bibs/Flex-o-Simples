"""Teste opcional de interface/exportacao. Requer Playwright e Chromium.

Nao e dependencia do aplicativo. Execute:
  python scripts/testar-interface.py --chromium /usr/bin/chromium --output /tmp/fs-validacao
"""
from __future__ import annotations
import argparse
import functools
import http.server
import json
import pathlib
import re
import struct
import threading
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--chromium', default=None, help='Executavel Chromium; omitido usa o Playwright.')
    parser.add_argument('--output', default='/tmp/flexao-validacao')
    parser.add_argument('--dom-only', action='store_true', help='Carrega HTML/CSS/JS em memoria, sem acesso a URLs. Nao testa protocolos nem clipboard real.')
    args = parser.parse_args()
    output = pathlib.Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0),
        functools.partial(QuietHandler, directory=str(ROOT)))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f'http://127.0.0.1:{server.server_port}'
    checks = []
    def ok(name):
        checks.append(name)
        print('PASS: '+name, flush=True)
    def load(page, rel):
        if not args.dom_only:
            page.goto(f'{base}/{rel}'); return
        source=(ROOT/rel).read_text()
        folder=(ROOT/rel).parent
        source=re.sub(r'<script src="([^"]+)"></script>',
            lambda m:'<script>'+ (folder/m.group(1)).resolve().read_text()+'</script>',source)
        source=re.sub(r'<link rel="stylesheet" href="([^"]+)">',
            lambda m:'<style>'+ (folder/m.group(1)).resolve().read_text()+'</style>',source)
        source=re.sub(r'<link[^>]*rel="(?:manifest|apple-touch-icon)"[^>]*>', '',source)
        page.set_content(source)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=args.chromium, headless=True,
                args=['--no-sandbox'])
            context = browser.new_context(viewport={'width': 1440, 'height': 1000},
                accept_downloads=True, service_workers='block', locale='pt-BR')
            if not args.dom_only:
                context.grant_permissions(['clipboard-read', 'clipboard-write'], origin=base)
            context.set_default_timeout(5000)
            errors = []
            for rel, name, result in [('index.html','flexao','repResultados'),
                                       ('cisalhamento/index.html','cortante','repCortante')]:
                page = context.new_page()
                page.on('pageerror', lambda err: errors.append(str(err)))
                load(page,rel)
                page.wait_for_selector(f'#{result} p')
                assert page.locator('#exportOrdem').input_value() == 'memorial'
                assert page.locator('#relatorio').get_attribute('data-calculo-valido') == 'true'
                assert 'v1.1.0' in page.title()
                ok(name+': carregamento e versao')
                headings = page.locator('#relatorio h2').all_text_contents()
                svg = page.evaluate('FS.Exportar.montarSvg()')
                assert svg.index('>Dados<') < svg.index('>Resultados<')
                assert svg.index('>Materiais<') < svg.index('>Geometria<')
                page.select_option('#exportOrdem','tela')
                old_order = page.evaluate('FS.Exportar.montarSvg()')
                assert old_order.index('>Resultados<') < old_order.index('>Dados<')
                assert headings == page.locator('#relatorio h2').all_text_contents()
                page.select_option('#exportOrdem','memorial')
                ok(name+': ordem do memorial independente da tela')
                for theme in ['classico','corporativo']:
                    page.evaluate('(t)=>document.documentElement.setAttribute("data-tema",t)',theme)
                    page.fill('#idProjeto','EXEMPLO DE VALIDAÇÃO — GEOMETRIA E ARMADURAS DO ELEMENTO')
                    page.fill('#idElemento','VIGA-DE-VALIDACAO-COM-IDENTIFICACAO-LONGA-SEM-ESPACOS-01234567')
                    with page.expect_download() as d:
                        page.click('#btBaixarImagem')
                    png = output / f'{name}-{theme}.png'
                    d.value.save_as(png)
                    data = png.read_bytes()
                    assert data[:8] == bytes([137,80,78,71,13,10,26,10])
                    width,height = struct.unpack('>II',data[16:24])
                    assert width == 2000 and height > 1000
                    pos=8; phys=[]
                    while pos < len(data):
                        length=struct.unpack('>I',data[pos:pos+4])[0]
                        if data[pos+4:pos+8] == b'pHYs':
                            phys.append(struct.unpack('>IIB',data[pos+8:pos+17]))
                        pos += length+12
                    assert phys == [(12121,12121,1)]
                    with page.expect_download() as d:
                        page.click('#btBaixarSvg')
                    vector=output/f'{name}-{theme}.svg'
                    d.value.save_as(vector)
                    assert 'width="165mm"' in vector.read_text()
                    inspect=context.new_page()
                    if args.dom_only: inspect.set_content(vector.read_text())
                    else: inspect.goto(vector.as_uri())
                    overflow=inspect.evaluate('''() => {
                        const root=document.querySelector('svg');
                        return Array.from(root.children).filter(e=>e.tagName.toLowerCase()==='text')
                          .map(e=>({text:e.textContent,box:e.getBBox()}))
                          .filter(x=>x.box.x < -1 || x.box.x+x.box.width > 761)
                          .map(x=>x.text);
                    }''')
                    assert not overflow, overflow
                    inspect.close()
                    ok(name+': PNG 2000px/pHYs, SVG 165mm e texto sem corte ('+theme+')')
                page.screenshot(path=str(output/f'interface-{name}.png'),full_page=True)
                before=page.locator(f'#{result}').inner_text()
                page.fill('#fck','0')
                assert page.locator('#relatorio .bloco').all_text_contents() == ['']*page.locator('#relatorio .bloco').count()
                assert page.locator('#btBaixarImagem').is_disabled()
                assert page.locator('#btBaixarSvg').is_disabled()
                error=page.evaluate('''() => {try{FS.Exportar.montarSvg();return false;}catch(e){return e.message;}}''')
                assert error and 'entradas' in error
                page.fill('#fck','30')
                assert not page.locator('#btBaixarImagem').is_disabled()
                assert before == page.locator(f'#{result}').inner_text()
                ok(name+': entrada invalida limpa e bloqueia; restauracao recalcula')
                page.fill('#gammaF','0')
                assert page.locator('#btBaixarImagem').is_disabled()
                page.fill('#gammaF','1.4')
                assert not page.locator('#btBaixarImagem').is_disabled()
                ok(name+': coeficiente nulo recusado')
                if name=='flexao':
                    page.locator('input[name="secao"][value="T"]').check()
                    assert page.locator('#relatorio').get_attribute('data-calculo-valido') == 'true'
                    assert 'bf' in page.locator('#repGeometria').inner_text().replace(' ','')
                    page.locator('input[name="secao"][value="RET"]').check()
                    page.click('#btVerificar')
                    assert 'MRd' in page.locator('#repEsforcos').inner_text().replace(' ','')
                    assert 'Modo inverso' in page.locator('#repEsforcos').inner_text()
                    page.click('#btDimensionar')
                    ok(name+': secao T e distincao entre demanda e capacidade')
                else:
                    for mode in ['TORCAO','AMBOS','CORTANTE']:
                        page.locator(f'label:has(input[name="modo"][value="{mode}"])').click()
                        assert page.locator('#relatorio').get_attribute('data-calculo-valido') == 'true'
                        assert 'NaN' not in page.locator('#relatorio').inner_text()
                    grupo=page.locator('section.grupo').filter(has=page.locator('#modelo'))
                    if 'aberto' not in grupo.get_attribute('class'):
                        grupo.locator('h2').click()
                    page.select_option('#modelo','II')
                    page.fill('#theta','29')
                    assert page.locator('#btBaixarImagem').is_disabled()
                    page.fill('#theta','35')
                    assert not page.locator('#btBaixarImagem').is_disabled()
                    ok(name+': tres modos e faixa de angulo do Modelo II')
                if not args.dom_only:
                    page.click('#btCopiarImagem')
                    page.wait_for_function('document.getElementById("exportAviso").textContent.includes("Copiada")')
                    size=page.evaluate('''async()=>{const items=await navigator.clipboard.read();
                      const blob=await items[0].getType('image/png');return blob.size;}''')
                    assert size>1000
                    ok(name+': copiar PNG para area de transferencia isolada do teste')
                    page.close()
                    local=context.new_page()
                    local.on('pageerror', lambda err: errors.append(str(err)))
                    local.goto((ROOT/rel).as_uri())
                    local.wait_for_selector(f'#{result} p')
                    with local.expect_download() as d:
                        local.click('#btBaixarImagem')
                    d.value.save_as(output/f'{name}-file-protocol.png')
                    local.close()
                    ok(name+': funcionamento e PNG por duplo clique (file://)')
            assert not errors, errors
            ok('Nenhum erro JavaScript nas paginas testadas')
            browser.close()
    finally:
        server.shutdown(); server.server_close()
    report={'status':'PASS','mode': 'DOM em memoria' if args.dom_only else 'HTTP e file://', 'checks':len(checks),'details':checks,
            'scope':'Chromium; interface, exportacao e integridade. Nao e auditoria normativa nem teste no Microsoft Word.'}
    (output/'resultado-interface.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=='__main__': main()
