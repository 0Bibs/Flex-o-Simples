/* Atualiza a impressao digital do cache sem mudar o conjunto de arquivos. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'sw.js');
const sw = fs.readFileSync(file, 'utf8');
const block = sw.slice(sw.indexOf('var ARQUIVOS'), sw.indexOf('];', sw.indexOf('var ARQUIVOS')));
const files = [...new Set([...block.matchAll(/'([^']+)'/g)].map(m => m[1]))]
  .filter(f => !f.endsWith('/')).sort();
if (!files.length) throw new Error('Lista de cache ausente.');
const hash = crypto.createHash('sha1');
for (const f of files) hash.update(f).update('\0').update(fs.readFileSync(path.join(root, f))).update('\0');
const name = 'flexo-simples-' + hash.digest('hex').slice(0, 10);
if (!/var CACHE = '[^']+';/.test(sw)) throw new Error('Constante CACHE ausente.');
fs.writeFileSync(file, sw.replace(/var CACHE = '[^']+';/, `var CACHE = '${name}';`));
console.log(name);
