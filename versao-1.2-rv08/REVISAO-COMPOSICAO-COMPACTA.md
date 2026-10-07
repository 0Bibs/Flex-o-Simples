# Flexão Simples 1.2 — revisão da composição

## Correções aplicadas

- Subscritos com tamanho e deslocamento explícitos, evitando o afastamento excessivo da linha de base. A conferência no navegador mediu tamanho de 74% e deslocamento de aproximadamente 18% da fonte principal.
- Rótulos e valores próximos; materiais e dimensões agrupados em duas colunas internas. Valores extensos fazem o grupo passar para uma coluna, sem redução da fonte.
- Cabeçalho em duas linhas, notas condensadas e somente um quadro final de resultados. Removidas as repetições de domínio e deformações que já constam dos diagramas e da síntese.
- Diagramas maiores na exportação, mantendo a proporção da seção e os níveis físicos das resultantes.
- Corrigidas as colisões entre rótulos de forças quando há armadura superior e entre os polos B/C do concreto C90. Polos coincidentes recebem identificação conjunta, sem deslocar seus pontos físicos.
- Tela, resumo e gráficos ampliados compartilham a correção de notação e os componentes atualizados.

## Comparação com a imagem enviada

A nova amostra utiliza os mesmos dados visíveis: bw = 100,0 cm, h = 20,0 cm, d = 14,0 cm, d′ = 6,0 cm, fck = 30 MPa, fyk = 500 MPa, γc = 1,40, γs = 1,15, γf = 1,40 e MSd = 22,20 kN·m.

Os resultados permanecem As = 3,77 cm², x = 1,12 cm, y = 0,90 cm, domínio 2 e Rc = 163,83 kN. Nenhum valor foi fixado no renderizador para reproduzir a imagem.

PNG anterior: 2000 × 3726 px. Nova amostra: **2000 × 2712 px**, aproximadamente **27% menos altura**. Na largura nominal de 165 mm, a nova altura corresponde a aproximadamente 224 mm. A compactação ocorreu pela redistribuição e remoção de repetições; o corpo documental permanece em aproximadamente 8,65 pt.

## Conferência executada

- 109 testes de regressão aprovados, incluindo integridade dos três motores de cálculo.
- 22 verificações locais em Edge, incluindo 13 cenários calculados na tela e no documento, troca de unidades, entradas inválidas, quantidade de barras e exportação.
- Conferência adicional de interseção entre caixas de texto nos 13 cenários, nas duas composições: nenhuma colisão remanescente pelo critério de interseção superior a 2 px em ambos os eixos. Essa medição complementa, mas não substitui, a inspeção visual.
- Inspeção da amostra com os mesmos dados da imagem enviada, na resolução de composição, na largura CSS de 165 mm e em tons de cinza. Tela também inspecionada.
- Nenhuma exceção JavaScript nos testes de navegador.
- Motor, coeficientes, critérios e conversão de 10 N = 1 kgf preservados. Cache do aplicativo atualizado.

Impressão física, Word e área de transferência do sistema não foram testados. Permanecem as limitações do motor já registradas: inversão automática da face comprimida não implementada e posição de Rc não disponibilizada no objeto de resultado para seção T com bloco na alma.

Esta revisão corrige a composição rejeitada pelo usuário. Aprovação nos testes não significa aprovação estética pelo usuário.
