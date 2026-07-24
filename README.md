# Flexo Simples

Calculadora de **flexão simples em seções retangulares e T** de concreto armado, segundo a
**ABNT NBR 6118**. Calcula a área de armadura necessária para um momento solicitante
(`Msd → As`) e o momento resistente de uma armadura conhecida (`MRd ← As`).

Ferramenta livre, sem dependência de software comercial e **sem nenhuma biblioteca externa**:
é HTML, CSS e JavaScript puro.

## Como usar

Abra o arquivo `index.html` no navegador — duplo clique basta, não precisa de servidor,
instalação ou conexão com a internet.

### Publicar na web

O repositório já traz o fluxo de publicação em **GitHub Pages**
(`.github/workflows/pages.yml`): a cada push na branch padrão o site é publicado.
Só é preciso habilitar uma vez, em *Settings → Pages → Build and deployment*,
escolhendo a origem **GitHub Actions**. O endereço fica
`https://0bibs.github.io/Flex-o-Simples/`.

## O que a ferramenta faz

**Painel esquerdo (entrada)**

| Grupo | Campos |
|---|---|
| Materiais | `fyk`, tipo de aço (A ou B), `γs`, `γc`, `fck` |
| Geometria / Seção | seção retangular ou T, `bw`, `bf`, `hf`, `d` |
| Esforço solicitante | `Msd`, `Msk` e `γf` — os três campos são espelhados entre si |
| Armaduras | `As` por área, por `n × Ø` ou por `Ø c/ espaçamento`; `As'` |
| Armadura mínima | ρmín, As,mín, As,máx e Md,mín; opção de adotar a mínima quando governar |
| Armadura dupla | permitir ou não, `d'` e o limite `βx,lim` |

A altura da seção é `h = d + d'`.

**Painel direito (relatório)** — resultados (`As`, `As'`, `x`, `βx` e o domínio), desenho do
equilíbrio da seção, diagrama dos domínios de deformação e a lista dos dados de entrada.
Tudo é recalculado a cada alteração.

## Base de cálculo

Diagrama retângulo-parábola substituído pelo **bloco retangular equivalente** (NBR 6118,
itens 8.2.10 e 17.2.2), com equilíbrio de forças e compatibilidade de deformações.

| Grandeza | fck ≤ 50 MPa | 50 < fck ≤ 90 MPa |
|---|---|---|
| λ | 0,80 | 0,80 − (fck−50)/400 |
| αc | 0,85 | 0,85·[1 − (fck−50)/200] |
| εc2 | 2,0 ‰ | 2,0 + 0,085·(fck−50)^0,53 ‰ |
| εcu | 3,5 ‰ | 2,6 + 35·[(90−fck)/100]⁴ ‰ |
| βx,lim | 0,45 | 0,35 |

- `Es = 210 GPa`; `εyd = fyd/Es` para o aço tipo A (laminado, patamar definido). No tipo B
  (encruado a frio) a reta vai até 0,7·fyd e o patamar convencional fica em 0,2 % de
  deformação residual, ou seja `εyd = 0,7·fyd/Es + 2 ‰`.
- **Domínios**: `x23 = εcu/(εcu+10‰)·d`, `x34 = εcu/(εcu+εyd)·d`, `x = d` (4/4a), `x = h` (4a/5),
  com o polo C dos domínios 5 a `h·(1 − εc2/εcu)` do topo.
- **Seção T**: enquanto `λx ≤ hf` vale a seção retangular de largura `bf`; abaixo disso a
  compressão é decomposta em mesa e alma.
- **Armadura dupla**: acionada quando `βx > βx,lim`. `As' = ΔM/[σs'·(d−d')]` com
  `σs'` obtido de `εs' = εcu·(x−d')/x`. Se a armadura dupla estiver desativada, a seção é
  resolvida com armadura simples e emite-se o aviso de ductilidade (NBR 6118, item 14.6.4.3).
- **Armadura mínima** (item 17.3.5.2.1): `ρmín = máx(0,15 %; 0,1709·fctk,sup/fyd)`, expressão que
  reproduz a Tabela 17.3 da norma — C30 → 0,150 %, C35 → 0,164 %, C40 → 0,179 %, C50 → 0,208 %.
  Vale também fora da premissa da tabela (CA-50, γc = 1,4, γs = 1,15). Armadura máxima: 4 % de Ac.
- **`MRd ← As`** resolve a linha neutra por bisseção sobre o equilíbrio
  `Rcc + Rsc = Rst`, usando o mesmo diagrama do aço — os dois sentidos fecham no mesmo par.

### Unidades

A interface trabalha em **tf·m** e **tf**, adotando a convenção de engenharia **1 tf = 10 kN**
(a mesma da calculadora comercial usada como referência). Internamente tudo é calculado em
cm e kN. Comprimentos em cm, resistências em MPa, áreas em cm².

No modo `Ø c/ espaçamento` a área sai em **cm²/m** (convenção de laje): use `bw = 100` para
dimensionar uma faixa de 1 m.

## Verificação

O caso de referência (bw = 20 cm, d = 45 cm, d' = 4 cm, fck = 30 MPa, fyk = 500 MPa,
γc = 1,4, γs = 1,15, γf = 1,4, Msk = 2,30 tf·m) reproduz exatamente o resultado da
ferramenta comercial equivalente:

| | Flexo Simples | Referência |
|---|---|---|
| As | 1,68 cm² | 1,68 cm² |
| x | 2,5 cm | 2,5 cm |
| βx = x/d | 0,06 | 0,06 |
| Rcc = Rst | 7,32 tf | 7,32 tf |
| εc / εs | 0,6 ‰ / 10,0 ‰ | 0,6 ‰ / 10,0 ‰ |
| εyd | 2,07 ‰ | 2,07 ‰ |
| domínio | 2 | 2 |

Testes automatizados (sem dependências, com o `node:test` nativo):

```bash
node --test
```

São 22 testes em dois arquivos, executados a cada push pelo
`.github/workflows/testes.yml`:

- `test/flexao.test.js` — o caso de referência, os parâmetros normativos dos dois grupos de
  concreto, a reprodução da Tabela 17.3, ida-e-volta `Msd → As → MRd` nos domínios 2 e 3,
  armadura dupla, o aviso de ductilidade quando a dupla está desativada, seção T com a linha
  neutra na mesa e na alma, armadura mínima governando e o diagrama do aço tipo B.
- `test/pagina.test.js` — consistência entre `index.html` e `js/app.js` (todo id usado
  existe), ordem de carga dos scripts, ausência de qualquer recurso externo e geração dos
  dois SVG sem `NaN` para seção retangular, T, armadura dupla e momento nulo.

## Estrutura

```
index.html                 interface
css/styles.css             estilo
js/norma.js                parâmetros normativos e conversões
js/flexao.js               núcleo de cálculo
js/desenho-equilibrio.js   desenho do equilíbrio da seção
js/desenho-dominios.js     desenho dos domínios de deformação
js/app.js                  ligação da interface com o cálculo
test/flexao.test.js        testes do cálculo
test/pagina.test.js        testes de consistência da página e dos desenhos
.github/workflows/         testes automáticos e publicação no GitHub Pages
```

Os arquivos de `js/` funcionam tanto no navegador quanto no Node, sem transpilação.

## Observações

- `fctk` mostrado no relatório é o `fctk,sup = 1,3·fctm`, com duas casas decimais.
- Para flexão simples as edições de 2014 e 2023 da NBR 6118 levam às mesmas expressões; o
  seletor de norma registra a referência adotada no relatório.
- Verificações de fissuração, flecha, cisalhamento, ancoragem e detalhamento **não** fazem
  parte desta ferramenta.

> Os resultados devem ser conferidos por profissional habilitado. O uso é de
> responsabilidade do usuário.

## Licença

MIT — veja `LICENSE`.
