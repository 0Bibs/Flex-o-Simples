# Flexão Simples 1.2.0 — auditoria técnica visual e revisão RV02

**Data:** 18/09/2026. **Fonte:** pacote `Flexao-Simples-v1.2.0.zip` e captura enviada pelo usuário. **Natureza:** auditoria da apresentação, coerência entre estado e informação exibida, composição documental e regressão de software. Não constitui validação normativa ou certificação do dimensionamento.

## 1. Parecer executivo

A apresentação fornecida evoluiu em sobriedade, mas ainda confundia compactação com empilhamento de pequenos quadros. A seção estreita ocupava uma caixa larga, as áreas de aço formavam uma lista vertical, os diagramas repetiam elementos decorativos e diferentes linhas de quadros herdavam a altura do bloco vizinho. O resultado era alto no Word, mesmo havendo espaços internos pouco utilizados.

A inspeção do código revelou também uma questão mais importante que o acabamento: a camada de apresentação não distinguia corretamente a verificação de uma armadura existente contra um momento solicitante independente. Essa operação já era calculada pelo programa, mas o painel podia mostrá-la como dimensionamento e omitir um não atendimento. Portanto, a revisão precisava corrigir a semântica antes de tratar apenas de margens e cores.

Foi preparada uma cópia identificada como **RV02**, sem substituir o ZIP original e sem modificar os cinco arquivos de cálculo/entrada relacionados no registro de hashes. A nova composição documental é padrão; a composição ampliada continua disponível. As imagens de demonstração foram produzidas pelo código revisado, não por um gerador de imagens.

## 2. Dimensões efetivamente medidas

A comparação foi feita com o mesmo caso do painel enviado: seção de 20 × 49 cm, d = 45 cm, d′ = 4 cm, fck = 30 MPa, fyk = 500 MPa, Msk = 2,30 tf·m, MSd = 3,22 tf·m e identificação completa do elemento. Os valores são do programa, não de uma recomputação normativa independente.

| Parâmetro | Pacote original | RV02 compacta |
|---|---:|---:|
| Prancheta vetorial lógica | 1000 × 1409 | 1000 × 1006 |
| PNG efetivamente exportado | 2000 × 2818 px | 2000 × 2012 px |
| Largura de inserção | 165 mm | 165 mm |
| Altura nessa largura | 232,49 mm | 165,99 mm |
| Corpo principal nessa largura | 8,65 pt | 8,65 pt |

**Ganho vertical:** 66,50 mm; **redução de altura:** 28,60%. O ganho não foi obtido reduzindo a resolução nem diminuindo o corpo do texto. A altura física vem da proporção do arquivo: `altura_mm = largura_mm × altura_lógica / largura_lógica`.

Não se promete essa redução para todas as entradas. Identificação longa, seção T, advertências e tabela de verificações aumentam legitimamente a altura. Também não se promete uma figura de meia página. O resultado deste caso é aproximadamente 16,5 × 16,6 cm, liberando cerca de 6,65 cm verticais para o restante do memorial.

## 3. Ordenação das armaduras

### Problema observado

A função original mantinha a sequência dos rótulos e alternava os sinais. A tela principal e o texto detalhado também tinham caminhos de apresentação separados. A igualdade podia ser decidida após arredondamento a duas casas, confundindo valores distintos.

### Regra aplicada

A comparação usa os valores numéricos do estado do motor, ordenados do maior para o menor. O sinal não muda para “<” apenas para acomodar um rótulo fixo. Entretanto, a igualdade real é preservada; tornar todo separador um “>” seria matematicamente incorreto.

No caso enviado, a apresentação correta é:

**As,adotada = As,calc > As,mín**, com 1,68 = 1,68 > 1,47 cm².

Quando o mínimo governa:

**As,adotada = As,mín > As,calc.**

Quando uma armadura adotada excede a calculada e esta excede a mínima:

**As,adotada > As,calc > As,mín.**

Os seis arranjos possíveis de três valores distintos foram testados. Empates mantêm uma prioridade estável: adotada, calculada e mínima. Usa-se tolerância numérica de `1e-10 × max(1, |a|, |b|)` para ruído de ponto flutuante; ela não é uma margem de aceitação estrutural.

A quantidade de casas decimais aumenta quando valores diferentes pareceriam iguais na precisão padrão. Ausência de valor não é substituída por zero. Nos modos em que As,calc não existe como dimensionamento por demanda, esse termo não é inventado apenas para completar a cadeia.

## 4. Correção prioritária: identificar os três modos reais

O código possui dimensionamento por momento (`MSD_AS`), capacidade da armadura (`AS_MRD`) e verificação da armadura contra momento (`AS_MSD`). O renderizador original distinguia apenas o segundo; o terceiro acabava herdando textos de dimensionamento.

Uma contraprova com As = 2,00 cm² e MSd = 20,00 tf·m produziu, no verificador já existente, MRd = 3,809259 tf·m e “NÃO ATENDE” à resistência. O painel original não mostrava esse não atendimento, apresentava o cabeçalho “Momento → armadura” e podia concluir que a armadura estava conforme os critérios indicados. O registro do teste está em `contraprova_modo_original.json`.

Na RV02, a apresentação separa:

**Momento → armadura:** destaca a armadura resultante e o critério governante. Não transforma o dimensionamento em aprovação integral de detalhamento.

**Armadura → capacidade:** destaca MRd e explicita ausência de demanda independente. Não inventa MSd, utilização ou aprovação global.

**Armadura adotada × momento solicitante:** exibe MSd, MRd e os quatro critérios que o módulo já calcula: resistência à flexão, mínima, máxima e ductilidade. O não atendimento aparece com texto, não apenas por cor, tanto no painel como no relatório completo.

Essa correção não altera a resistência calculada. Corrige a transferência do resultado já existente para aquilo que o usuário lê.

## 5. Nova composição documental

O documento deixa de ser uma grade rígida de duas colunas iguais e passa a usar uma composição híbrida orientada pelo conteúdo.

No topo, a seção ocupa aproximadamente 37% da largura útil. Para seções estreitas, os valores de bw, h, d e d′ ficam ao lado da figura. À direita, materiais e critérios usam duas colunas numéricas e o carregamento ocupa uma faixa horizontal de três campos. Para seções muito largas, o componente muda a distribuição interna sem deformar a geometria.

As armaduras ocupam uma faixa de largura integral. Os oito campos existentes ficam em duas linhas de quatro posições, com a comparação ordenada e a regra governante abaixo. Essa reorganização elimina o principal empilhamento vertical sem retirar parâmetros.

Os domínios e o equilíbrio permanecem lado a lado, cada um com espaço suficiente para o gráfico e seus valores. O resumo final concentra o resultado principal, domínio, βx e limite. MSd permanece no carregamento, mas deixa de consumir outra coluna no resumo apenas por repetição.

As notas comuns foram reunidas no rodapé. Advertências específicas continuam próximas do resultado ou do modelo que qualificam. Uma nota crítica nunca deve ser transferida para o rodapé apenas para diminuir a altura.

A tela de operação continua separada da composição do memorial: síntese no início, controles disponíveis e painel técnico central. A exportação não é uma captura literal da janela.

## 6. Geometria, cotas e notação

As proporções da seção foram preservadas. A configuração de 20 × 49 cm não se transforma em uma figura quadrada, e a configuração de 100 × 20 cm permanece horizontal. A identificação textual “parede” ou “fundo” não provoca mudança automática de largura nem conversão para valores por metro.

Os rótulos mantêm a distinção entre d, d′ e h. A hipótese h = d + d′ permanece a existente no motor, com afastamento efetivo simétrico; d′ não foi renomeado como cobrimento nominal. A representação das armaduras continua ilustrativa, sem fabricar detalhamento de camadas, estribos ou alojamento.

A medição tipográfica passou a considerar índices e tamanhos de caracteres, reduzindo o risco de colisões em fórmulas. Símbolos e valores não são alinhados por espaços. Foram corrigidas posições de cotas, incluindo a cota superior de uma seção T, que colidia com o cabeçalho em uma configuração de teste.

A uniformidade não exige que todas as caixas tenham a mesma altura. Exige margens externas coerentes, proximidade entre rótulo e valor e a preservação do tamanho físico de leitura.

## 7. Domínios e equilíbrio: clareza do estado representado

A malha pontilhada e o fundo amarelado foram retirados dos gráficos. Esses elementos imitavam uma folha de gráfico sem oferecer uma escala de coordenadas necessária à leitura. Permanecem limites dos domínios, eixo de deformação nula, níveis relevantes, pontos notáveis e reta ativa.

A reta ativa usa azul técnico; as referências ficam em grafite. A linha neutra é identificada por “LN” e tracejado. A região ativa não depende de uma cor isolada. Os limites continuam vindo dos parâmetros do estado de cálculo, sem fixar no desenho o valor do exemplo inicial.

Foram acrescentadas qualificações importantes:

Quando a mínima modifica a área adotada, o motor existente não recalcula automaticamente o mesmo estado gráfico com a nova área. O painel agora avisa, junto dos diagramas, que estes correspondem ao estado anterior à adoção da mínima. Não se desenhou uma coerência inexistente e não se alterou o cálculo silenciosamente.

Nos modos de capacidade e verificação, os diagramas correspondem ao estado resistente MRd da armadura informada. Eles não são apresentados como deformações de serviço sob o carregamento informado.

No momento nulo, domínio e deformações fornecidos pelo motor são identificados como convenções do cálculo, não como previsão de uma deformada em serviço.

O quadro de equilíbrio distingue deformações de tensões e resultantes, mantém alinhamento dos níveis físicos e não desenha seta finita para força nula. A soma Rt,eq = Rc + R′s continua identificada como soma por identidade; não constitui uma checagem independente do equilíbrio.

Para um bloco comprimido muito pequeno, a espessura visual também fica pequena. Não foi artificialmente ampliada. A opção ampliada melhora a leitura, mas um detalhe ampliado explícito seria uma evolução possível.

Na seção T com bloco alcançando a alma, o estado existente não fornece ao renderizador a posição da resultante total Rc. A seta é omitida com uma advertência específica, em vez de colocá-la falsamente em y/2. A localização correta dessa resultante exige ampliação do contrato de dados do motor e permanece fora desta revisão visual.

## 8. Identidade visual e legibilidade

A referência Pilar CA foi aproveitada pela organização técnica, não pela reprodução literal de todos os seus recursos antigos. O resultado usa superfícies brancas, cabeçalhos cinza discretos, bordas finas, alinhamento numérico e uma cor funcional principal.

Azul `#245E91` destaca a armadura adotada, o resultado principal e o estado ativo. Grafite organiza os dados. Verde e vermelho identificam critérios de atendimento acompanhados dos respectivos textos; não decoram grandezas normais. Campos de entrada deixaram de parecer todos selecionados simultaneamente; o realce acompanha o foco.

O corpo principal documental permanece em 18,5 unidades na prancheta de 1000 unidades, equivalente a 8,65 pt quando inserida a 165 mm. Notas são menores, resultados principais maiores, sem misturar escalas arbitrárias entre quadros.

Como critérios de projeto, considerar contraste mínimo de 4,5:1 para texto corrente e 3:1 para elementos gráficos essenciais, além de não usar apenas cor para transmitir estado. Esses valores são referências W3C; não representam uma declaração de conformidade WCAG integral desta aplicação. Referências externas: W3C, Understanding SC 1.4.3, SC 1.4.11 e SC 1.4.1, consultadas em 18/09/2026.

https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html

## 9. Exportação e uso no Word

Foi acrescentado o seletor **Composição documental**, com **Compacta — padrão Word** e **Ampliada — diagramas maiores**, além do botão **Prévia 165 mm**. A interface mostra largura, altura resultante e dimensões do PNG antes de exportar. Trocar a composição não recalcula a seção.

O PNG continua com 2000 px de largura. A exportação foi realmente acionada em navegador e contém metadados pHYs de 12121 pixels por metro, coerentes com a largura nominal de 165 mm. O SVG tem largura física declarada de 165 mm. Não há incorporação de arquivos de fonte.

Ao inserir no Word, conferir **16,5 cm de largura com proporção bloqueada**. O tamanho físico exibido pelo monitor não é uma régua, pois depende de zoom e escala de tela. A amostra DOCX entregue contém a imagem nessa largura exata; ela foi renderizada por ferramenta baseada em LibreOffice e inspecionada visualmente. Não foi aberta no Microsoft Word nativo.

## 10. Código alterado e rastreabilidade

| Arquivo | Função na revisão |
|---|---|
| `js/painel-flexao.js` | Ordenação comum, semântica dos três modos, layout compacto/ampliado, diagramas, prévia e relatórios. |
| `js/app.js` | Reutilização da mesma comparação de áreas na apresentação textual. |
| `index.html` | Identificação RV02, seletor, prévia e dimensões físicas. |
| `css/painel-flexao.css` | Campos, cores, modal, espaçamento e largura mínima. |
| `sw.js` | Atualização da impressão digital dos recursos em cache. |
| `test/revisao-visual-rv02.test.js` | Dezoito testes novos de apresentação e semântica. |
| `scripts/testar-rv02.py` | Cenários de navegador reproduzíveis. |

Pontos de origem auditados: `compareAreas` em `js/painel-flexao.js:142`, `montar` em `:227`, composição documental em `:229–239`, `comparacao` em `js/app.js:156` e verificações em `js/verificacao-flexao.js:20`. As posições são da cópia original e mudam após a revisão; os nomes de funções são as referências estáveis.

Permaneceram byte a byte iguais: `js/norma.js`, `js/flexao.js`, `js/cisalhamento.js`, `js/verificacao-flexao.js` e `js/entrada-flexao.js`. Os hashes SHA-256 completos e o hash do ZIP original estão em `evidencias.json`. Preservar hashes comprova ausência de alteração nesses arquivos; não comprova, por si só, correção de suas fórmulas.

## 11. Validação efetivamente executada

O pacote original apresentou 108 testes aprovados e uma falha entre 109 testes: a impressão digital do cache estava desatualizada. Na RV02 foram executados **127 testes Node, todos aprovados**, incluindo os 18 novos testes. A impressão digital do cache foi regenerada.

Em Chromium com Playwright foram executados **16 grupos funcionais** e **19 cenários, cada um renderizado em tela e documento: 38 composições**. A análise automática não encontrou textos fora dos quadros nem colisões entre caixas de texto superiores à tolerância de 2,5 px simultaneamente nas duas direções. Não ocorreram exceções JavaScript. Essa verificação automática não substitui julgamento visual nem verifica toda possível colisão entre texto e linha de desenho.

Os casos incluíram seção estreita, alta, larga, seção T, armadura dupla, mínima governante, mínima automática desabilitada, momento nulo, concreto C90, aço tipo B, capacidade, aço superior em tração, verificação atendida e não atendida, título longo, caracteres especiais e área elevada. Não houve NaN, Infinity ou undefined nas composições exercitadas.

Foram exercitados abertura/fechamento da prévia, exportações reais PNG/SVG, troca de unidade sem mudar o estado, invalidação e recuperação de entradas, indicação de falha no relatório completo e os três modos do módulo Cortante/Torção. Foram inspecionadas visualmente as amostras representativas, inclusive a seção T e os estados que exigiam notas.

Os recursos HTML/CSS/JS reais foram carregados em DOM local porque a navegação direta file:// estava bloqueada pelo ambiente. Assim, os testes não representam homologação de abertura local em Windows, HTTP, instalação PWA, atualização offline, área de transferência do sistema ou Microsoft Word.

## 12. Limites e próxima rodada de aceitação

A revisão melhora a densidade, mas não implementa uma interface totalmente responsiva. A largura mínima foi reduzida; em janelas menores existe rolagem horizontal, preservando o conteúdo. Não foi comprovado reflow completo a 200% de zoom nem conformidade global de acessibilidade.

A composição compacta privilegia o caso documental usual sem forçar a mesma altura em estados mais complexos. A seção T e advertências longas ainda podem produzir espaço residual entre quadros. É preferível um vazio localizado a suprimir um alerta ou deformar uma figura.

Antes de adotar a revisão como versão operacional de produção, conferir no ambiente real: abertura após extração, exportação e inserção no Word a 165 mm, integridade de fontes/subscritos, funcionamento da área de transferência e atualização da PWA. Publicação em GitHub Pages e substituição da versão instalada não foram realizadas.

A aceitação estrutural continua dependendo da revisão dos critérios e do dimensionamento por profissional habilitado. A RV02 entrega uma apresentação mais fiel ao estado calculado e uma exportação mais eficiente; não amplia silenciosamente o escopo de segurança da aplicação.

## 13. Diretriz permanente para futuras alterações

Manter duas composições sobre a mesma fonte de dados: operação e documento. Ordenar comparações por números, nunca por textos formatados. Não produzir aprovação sem demanda independente e verificações existentes. Não esconder zero, ausência ou advertência para reduzir altura. Não criar As calculada em um modo que recebeu As como entrada. Identificar a qual estado pertence cada diagrama. Conservar proporções, níveis e sinais do modelo. Dar preferência à reorganização horizontal antes de diminuir fonte. Medir exportação em milímetros, não apenas em pixels. Toda alteração deve terminar com os testes de regressão, exportação real e inspeção visual dos estados representativos.
