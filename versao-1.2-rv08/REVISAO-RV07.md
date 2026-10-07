# Flexão Simples 1.2.0 — RV07

Revisão de 22/09/2026. Estende os ajustes da RV06 à aba Cortante/Torção.

## Operação

- “Dimensionar espaçamento” sugere s para o diâmetro e o número de ramos escolhidos.
- “Verificar armadura adotada” mantém o espaçamento informado e a armadura longitudinal de torção independentemente dos esforços. Editar s ou Asl ativa essa operação.
- Informe simultaneamente VSd, TSd, diâmetro, ramos, s adotado e, para torção, Asl efetivamente distribuída no perímetro. A armadura longitudinal não é automaticamente igualada à necessária.
- Os modos Cortante, Torção e Ambos continuam disponíveis. Para torção, o modelo implementado utiliza estribos fechados perpendiculares ao eixo da peça (α = 90°).
- Asl em branco gera PENDENTE nas verificações correspondentes. Zero é um valor informado e pode resultar em NÃO ATENDE. Campos de esforço vazios invalidam o cálculo ativo e desabilitam a exportação.

## Apresentação e documentação

Até duas casas decimais, preservando os valores internos. Unidades iniciais kgf e kgf·m, com opções tf/tf·m e kN/kN·m. Conversão mantida: 10 N = 1 kgf.

Entradas, modelo, resultados, verificações, solução e conclusão aparecem em sequência. PNG e SVG são composições documentais, com largura nominal de 165 mm e PNG de 2.000 px. A opção “Relatório completo” acrescenta parâmetros e relações para auditoria. O texto de conferência por profissional habilitado foi removido desta aba, seguindo a mesma direção da RV06.

## Critérios apresentados

- Bielas ao cortante e à torção e interação VSd/VRd2 + TSd/TRd2.
- Resistência dos estribos adotados para cada esforço, reservando a armadura necessária ao outro esforço na combinação.
- Resistência longitudinal de torção a partir da Asl informada.
- Demanda transversal por ramo com mínimos, mínimo longitudinal e espaçamento longitudinal máximo.
- Demanda, capacidade, D/C e ATENDE/NÃO ATENDE/PENDENTE. Critério governante identificado entre os calculados.

No Modelo II, Vc depende de VSd; as capacidades apresentadas correspondem à combinação informada, não a uma capacidade invariável para qualquer carregamento. Hipóteses incompatíveis da parede equivalente impedem declarar atendimento completo. Distância transversal entre ramos, distribuição física das barras, ancoragens, cobrimento e demais disposições construtivas não foram implementados como novas verificações; esse alcance aparece na conclusão.

## Validação

147 testes automatizados aprovados. Os motores norma.js, flexao.js e cisalhamento.js permanecem idênticos à base validada. Foram acrescentados testes de armadura independente, estribos e Asl insuficientes, dados pendentes, interação das bielas, mínimos, espaçamento, Modelo II e arredondamento junto ao limite.

Testes de navegador: entrada simultânea, preservação de s e Asl após alteração de carga, unidades sem perda de precisão, ausência versus zero, validação de α, exportações PNG/SVG/HTML, dimensões de PNG e sobreposição de textos no exemplo. Sem erros de carregamento ou colisões de texto no resumo combinado conferido. Clipboard do Windows e impressão física não foram testados.

Exemplo combinado: bw = 40,00 cm, h = 50,00 cm, d = 47,50 cm, C30, fyk = 500 MPa, γc = 1,40, γs = 1,15, γf = 1,40, c₁ = 2,50 cm, Modelo I, α = 90°, referência mínima bw/2. VSd = 7.000,00 kgf, TSd = 6.960,00 kgf·m, estribo Ø10,00 mm, 2 ramos, s = 8,00 cm e Asl = 10,00 cm²: ATENDE aos nove critérios apresentados. Mantendo a armadura e elevando TSd para 10.000,00 kgf·m: NÃO ATENDE.

Referências de conferência das relações existentes: [UNESP — Cortante](https://wwwp.feb.unesp.br/pbastos/concreto2/Cortante.pdf) e [UNESP — Torção](https://wwwp.feb.unesp.br/pbastos/concreto2/Torcao.pdf). A revisão não constitui atualização normativa dos motores.
