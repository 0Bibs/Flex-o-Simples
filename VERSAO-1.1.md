# Flexo Simples — versão 1.1.0

Atualização incremental de 18/09/2026, baseada no commit
`fe823df7493e4f32bedf9f3f2beee8a7accbcee9` do repositório `0Bibs/Flex-o-Simples`.

## Uso imediato

Extraia o pacote inteiro e abra `index.html`. A aba Cortante/Torção permanece
em `cisalhamento/index.html`. Não há instalação de dependências para usar o
programa. A branch de revisão não substitui automaticamente a publicação no
GitHub Pages.

As informações abaixo atualizam a seção de exportação do README anterior.

## O que mudou

O controle **Ordem da folha** oferece **Memorial: dados primeiro**, padrão da
versão 1.1, e **Mesma ordem da tela**, que conserva a sequência anterior.
A ordem visual do programa não é alterada por essa escolha.

No memorial de flexão, a sequência passa a ser identificação, informações
gerais, materiais, geometria, esforços, equilíbrio, deformações/domínios,
resultados e armadura. Cortante/torção utiliza a mesma lógica, com suas
figuras de seção, seção vazada equivalente e bielas. Blocos de modos
inativos continuam excluídos; avisos e blocos novos não são descartados.

**Baixar imagem** gera PNG com exatamente **2000 pixels de largura**,
independentemente da resolução da tela. O chunk PNG `pHYs` registra 12121
pixels por metro nos dois eixos, equivalente a aproximadamente **308 ppi**
e **165 mm** de largura, com a pequena diferença decorrente do arredondamento
inteiro do formato. O viewBox de composição continua com 760 unidades; a
rasterização deixa de ser 2× e passa a 2000/760.

**Baixar SVG** exporta a mesma folha vetorial, autossuficiente em relação às
cores e estilos dos desenhos, com largura física declarada de 165 mm.
Não são incorporados arquivos de fontes.

**Copiar imagem** mantém o fluxo de colar no Word. A chamada da API de
clipboard ocorre dentro do clique; o PNG é fornecido por uma Promise ao
ClipboardItem. Há mensagem de alternativa por download quando o navegador
não disponibiliza a operação ou recusa a permissão.

Textos extensos, identificadores sem espaços, avisos e linhas de comparação
agora quebram linha sem reduzir a fonte. Os subscritos e os destaques são
preservados, incluindo o destaque de resultado insuficiente.

Quando uma entrada é inválida, os resultados e desenhos anteriores são
limpos e a exportação é bloqueada. A chamada direta de exportação também
recusa esse estado. Corrigir a entrada recalcula o relatório e libera os
comandos novamente. Foram acrescentadas validações de valores negativos,
coeficientes nulos, geometria incompatível e faixas já presentes na interface.

Os relatórios mostram explicitamente M_Sd, V_Sd e T_Sd nos modos aplicáveis.
No modo inverso de flexão, mostram **M_Rd como capacidade**, sem apresentá-lo
como uma comparação com demanda independente. A convenção preexistente do
motor, **1 tf = 10 kN**, fica declarada no relatório; não foi substituída
silenciosamente pela conversão física exata.

## Limites que permanecem

Esta versão **não é uma revisão normativa integral**. `js/norma.js`,
`js/flexao.js` e `js/cisalhamento.js` permanecem byte a byte idênticos à
versão de partida. As opções de edição normativa continuam as já existentes.
A aprovação dos testes não significa aprovação de uma estrutura real.

A folha completa tem **altura variável e não possui paginação automática**.
No Word, confirme a largura de **16,5 cm** após inserir ou colar: o programa
receptor pode ignorar os metadados, reprocessar a imagem ou ajustá-la à altura
da página. Não foi realizado teste dentro do Microsoft Word. Para uma folha
mais alta do que a página disponível, a divisão em páginas ainda é uma etapa
de edição do memorial; a versão 1.1 não promete resolver essa paginação.

A exportação mantém os valores do relatório e não transforma ausência de
verificação, aviso ou resistência ainda não informada em aprovação global.

## Validação e manutenção

Execute `node --test`: há 88 testes, dos quais 72 são anteriores e 16 foram
acrescentados. Os novos testes cobrem ordenação estável, conservação dos
blocos, quebra de texto, dimensões SVG, densidade/CRC do PNG, rejeição de PNG
inconsistente, bloqueio de relatório inválido e integridade dos motores.

Depois de alterar arquivos incluídos no cache, execute
`node scripts/atualizar-cache.cjs`, seguido de `node --test`. O verificador do
cache existente continua independente do script de atualização.

O teste opcional de interface é `scripts/testar-interface.py`. Requer
Playwright e um Chromium para desenvolvimento/teste, não para usar o programa.
Pode exercitar HTTP, file:// e clipboard, ou carregar HTML/CSS/JavaScript em
memória com `--dom-only` em ambientes sem acesso a URLs. O relatório distingue
os dois modos. A validação em memória cobre as duas ferramentas, ambos os
temas, PNG/SVG, extensão dos textos e recuperação após entradas inválidas.

Referências de implementação: W3C, PNG Third Edition, seção 11.3.4.3 (`pHYs`);
MDN, `ClipboardItem()` (dados como Blob ou Promise). Essas referências são
sobre formatos e APIs, não sobre validação de engenharia.
