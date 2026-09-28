'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

// Restore form values before executing the real startup and change handlers.
function startup(unit) {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      value: '', checked: false, listeners: {},
      addEventListener(type, callback) { this.listeners[type] = callback; },
      setAttribute() {}, querySelectorAll() { return []; }
    });
    return elements.get(id);
  }
  const values = { unidadeMomento: unit, msd: unit === 'knm' ? '32,2' : '3.22',
    msk: unit === 'knm' ? '23' : '2.3', norma: '2023', fck: '30', fyk: '500',
    tipoAco: 'A', gammaC: '1.4', gammaS: '1.15', gammaF: '1.4', bw: '20',
    bf: '80', hf: '10', h: '49', d: '45', dl: '4', betaXLim: '0.45',
    asArea: '0', aslArea: '0', secao: 'RET', modoAs: 'area' };
  for (const [id, value] of Object.entries(values)) element(id).value = value;
  element('usarMin').checked = element('usarDupla').checked = true;
  const document = {
    getElementById: element, querySelectorAll() { return []; }, addEventListener() {},
    querySelector(selector) { return element(selector.includes('secao') ? 'secao' : 'modoAs'); }
  };
  const context = vm.createContext({ document, navigator: {}, window: {} });
  for (const name of ['norma', 'flexao', 'entrada-flexao'])
    vm.runInContext(fs.readFileSync(path.join(root, 'js', name + '.js'), 'utf8'), context);
  let result;
  context.FS = context.window.FS;
  context.FS.DesenhoEquilibrio = context.FS.DesenhoDominios = { desenhar() { return ''; } };
  context.FS.PainelFlexao = { atualizar(value) { result = value; } };
  vm.runInContext(fs.readFileSync(path.join(root, 'js/app.js'), 'utf8'), context);
  return { element, result: () => result, change(unit) {
    element('unidadeMomento').value = unit;
    element('unidadeMomento').listeners.change();
  }, recalculate() { element('btRecalcular').listeners.click(); } };
}

for (const initial of ['knm', 'tfm']) {
  test(`startup em ${initial}: troca e 100 alternancias preservam momentos e calculo`, () => {
    const app = startup(initial);
    const original = JSON.stringify(app.result());
    assert.ok(Math.abs(app.result().MsdTfm - 3.22) < 1e-12);
    function check(unit) {
      app.change(unit);
      assert.equal(Number(app.element('msd').value), unit === 'knm' ? 32.2 : 3.22);
      assert.equal(Number(app.element('msk').value), unit === 'knm' ? 23 : 2.3);
      assert.equal(JSON.stringify(app.result()), original);
      app.recalculate();
      assert.equal(JSON.stringify(app.result()), original);
    }
    check(initial === 'knm' ? 'tfm' : 'knm');
    for (let i = 0; i < 100; i++) check(i % 2 ? 'tfm' : 'knm');
  });
}
