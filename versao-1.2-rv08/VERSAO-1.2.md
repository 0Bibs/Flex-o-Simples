# Versão 1.2.0 — orientações de interface e exportação

Data: 18/09/2026. Base funcional: pacote 1.1.0 desta conversa, correspondente à
branch de revisão 1.1 no commit a89bb610e26e307b467d96cf63bd4e20966b0706.
O programa de referência Pilar CA foi usado somente como referência visual.
Seu motor, sua distribuição Windows e seus recursos binários não fazem parte
deste pacote.

## Correspondência com as orientações recebidas

| Orientação | Implementação |
|---|---|
| bw, h, d e d′ preenchíveis | Quatro campos no grupo Geometria; d′ foi movido do grupo Armadura dupla, sem duplicar o campo. |
| Materiais adequados; título em negrito | Campos e comportamento preservados; cabeçalho Materiais em negrito. |
| Seleção tfm ou kNm | Seletor de unidade de momento, com conversão de Msk, MSd, MRd e Md,mín. |
| Armaduras e armadura mínima mantidas | Modos por área, barras e espaçamento, opção de mínima e opção de dupla preservados. |
| Identificação somente por elemento | Campo Projeto removido da interface; exportação inicia por ELEMENTO — título. |
| Dados primeiro | Geometria/materiais/esforço na coluna esquerda; dados completos antes dos resultados no relatório expandido. |
| Layout em três colunas | Sete quadros, com o arranjo apresentado no esquema fornecido. |
| Geometria similar ao Pilar CA | Seção proporcional retangular/T, cotas e representação da armadura, em desenho vetorial. |
| Referência visual clássica | Moldura discreta, cinzas, linhas finas, controles compactos e atalhos para os grupos de entrada. |

## Decisões de implementação que o documento não especifica

**Coerência de h, d e d′.** Os três não são independentes na hipótese já existente
no motor. Ao editar h ou d′, o programa recalcula d = h − d′. Ao editar d,
recalcula h = d + d′. O afastamento d′ se refere ao centro da armadura, não
somente ao cobrimento nominal. O mesmo valor continua sendo adotado na face
oposta. A relação e a regra de edição estão descritas junto aos campos.

**Conversão de unidades.** Foi mantido o fator 10 do programa de origem, com
advertência explícita na entrada e na folha. A troca é uma operação de
apresentação e não dispara novo dimensionamento. Também não altera a escolha
do modo por barras ou por espaçamento. A definição física exata de tf não foi
introduzida silenciosamente.

**Armadura desenhada.** Quando o usuário fornece somente área, aparece uma linha
de área equivalente, não uma quantidade inventada de barras. No modo por
barras, a quantidade é representada, com distribuição horizontal ilustrativa.
Diâmetros gráficos possuem tamanho visual mínimo/máximo. O desenho não é uma
verificação de espaçamento, alojamento, cobrimento, ancoragem ou detalhamento.
Para quantidades acima de 100 barras, utiliza-se representação equivalente.

**Diagramas compactos.** Usam os parâmetros, deformações e resultantes
produzidos pelo motor. O diagrama de domínios compacto usa uma única escala
horizontal de deformação; o gráfico ampliado original permanece disponível.
O equilíbrio apresenta Rc, Rs′ e Rt,eq = Rc + Rs′ como resultante de equilíbrio,
não como uma verificação independente. Isso evita utilizar automaticamente
As·fyd quando a armadura mínima foi acrescentada depois do dimensionamento.

Quando a mínima governa, a folha identifica que a linha neutra e os diagramas
são do estado antes da mínima. Não é alegado que sejam um recálculo da seção
com a armadura final. No modo inverso os diagramas representam o estado
resistente da armadura informada e não um confronto com demanda independente.

**Altura e legibilidade.** O painel mantém a largura física de 165 mm e aumenta
sua altura para comportar identificação extensa e avisos. Não há paginação
automática. Identificações usuais ocupam uma linha; textos excepcionalmente
longos quebram linha sem truncar o título. Intermediários secundários podem ser
consultados no relatório expandido, não no resumo compacto.

## O que não foi alterado

As fórmulas dos três módulos de cálculo permanecem byte a byte idênticas às da
versão 1.1. Não houve atualização de edição normativa, validação integral de
engenharia, implementação de novas verificações, leitura de esforços de
modelos externos ou criação de executável Windows.

A aba Cortante/Torção mantém sua interface e seus cálculos. Apenas a
identificação e o exportador compartilhados recebem as adaptações necessárias.
As limitações de engenharia da base anterior permanecem.

## Testes e arquivos de manutenção

`node --test`: 105 testes aprovados, incluindo os testes anteriores com contratos
de interface ajustados às alterações pedidas e 17 novos testes da versão 1.2.
Os gabaritos de integridade dos três motores não foram alterados.

`python scripts/testar-interface.py --dom-only --chromium /usr/bin/chromium
--output /tmp/fs12`: 20 verificações de interface aprovadas. Este modo carrega
os arquivos reais em memória. Não representa execução do aplicativo Windows
de referência, validação dos protocolos HTTP/file ou teste do Microsoft Word.

A imagem exibida e a exportada são compostas pela mesma rotina
`FS.PainelFlexao.montar`. A rasterização respeita a largura real do SVG para
produzir exatamente 2000 px; a folha linear de cortante/torção continua usando
seu viewBox anterior.
