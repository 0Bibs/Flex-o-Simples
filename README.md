# Flexo Simples — 1.2.0

Calculadora de seção de concreto armado. Esta revisão implementa as orientações
fornecidas em **ORIENTAÇÕES FLEXÃO SIMPLES.docx** e o painel em três colunas,
com referência visual no **Pilar CA 1.0 R03** enviado pelo usuário.

## Abrir

Extraia a pasta inteira e abra `index.html` no Chrome ou Edge. Não há instalação
de dependências para usar o programa. A aba Cortante/Torção continua disponível.
A publicação no GitHub Pages depende de integração na branch publicada; uma
branch de revisão não substitui automaticamente o site.

## Painel de flexão

À esquerda: geometria, materiais e esforço. No centro: resultados e armaduras.
À direita: deformações/domínios e equilíbrio. Uma única composição SVG alimenta
a tela e as exportações PNG/SVG. A identificação inicial é somente
**ELEMENTO — título informado**. O painel não inclui projeto nem um subcapítulo
de identificação. Os dados completos e os gráficos anteriores podem ser
consultados em **Dados do cálculo e gráficos ampliados**, abaixo do painel.

A apresentação é compacta; avisos do motor aparecem integralmente abaixo dos
quadros. O painel não apresenta um selo de aprovação global da estrutura.

## Geometria e unidades

`bw`, `h`, `d` e `d′` estão disponíveis na geometria. A relação usada é a mesma
hipótese da versão anterior: **h = d + d′**. Alterar h ou d′ conserva h/d′ e
recalcula d; alterar d conserva d′ e recalcula h. Valores incompatíveis são
sinalizados, sem limitar a geometria silenciosamente.

Neste modelo d′ é o afastamento efetivo até o centro da armadura, já informado
pelo usuário incluindo cobrimento, estribo e posição das barras. Não é somente
o cobrimento nominal. Mantém-se a hipótese anterior de igual afastamento nas
duas faces. Não há determinação automática do centro de gravidade de várias
camadas nem dimensionamento de alojamento de barras nesta revisão.

O seletor **tf·m / kN·m** converte os valores de entrada e de saída sem mudar o
caso de carga ou a armadura selecionada. Foi preservada explicitamente a
**convenção legada 1 tf·m = 10 kN·m**. Trata-se da aproximação já existente,
não de uma nova adoção da definição física exata de tonelada-força.

## Exportar

**Baixar imagem** produz PNG com 2000 pixels de largura. O metadado pHYs informa
largura nominal de 165 mm, aproximadamente 308 ppi. **Baixar SVG** gera o painel
vetorial com largura declarada de 165 mm, sem incorporar arquivos de fontes.
**Copiar imagem** e **Copiar painel** usam o mesmo exportador; quando a API não
está disponível, é oferecida a alternativa de download. Ao colar no Word,
confira a largura final de 16,5 cm. Não foi testado o Microsoft Word.

## Escopo e validação

As rotinas `js/norma.js`, `js/flexao.js` e `js/cisalhamento.js` são idênticas às
anteriores, com verificação de hash. A revisão não atualiza as normas nem
constitui auditoria normativa ou validação completa do dimensionamento.

Execute `node --test` para os testes de regressão. O script opcional
`python scripts/testar-interface.py --dom-only --chromium /usr/bin/chromium`
usa Playwright/Chromium apenas para testes, não para o uso do programa.

Veja `VERSAO-1.2.md` e `VALIDACAO-1.2.md`. Depois de modificar recursos do
aplicativo, execute `node scripts/atualizar-cache.cjs` e `node --test`.
A documentação histórica está em `docs/README-ate-1.1.md` e `VERSAO-1.1.md`;
esta página prevalece quando descreve uma alteração da versão 1.2.
