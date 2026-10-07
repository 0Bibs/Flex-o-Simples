# Flexão Simples 1.2.0 · RV06

Revisão de 22/09/2026, baseada na RV05 com ícones ajustados.

- Apresentação limitada a duas casas decimais, incluindo β e taxas. O cálculo conserva a precisão interna. Pequenas grandezas do painel usam notação científica para não aparecerem como zero.
- Operação “Verificar As adotada × MSd”: permite informar simultaneamente área adotada e esforço solicitante. Editar o esforço, materiais ou geometria mantém a armadura adotada. Editar As ativa a verificação, exceto na operação explícita de capacidade.
- Entradas por área, número/diâmetro de barras ou diâmetro/espaçamento. A representação de barras também funciona na verificação com esforço independente.
- Resistência à flexão, armadura mínima, armadura máxima e ductilidade exibem demanda, capacidade, D/C, critério e situação. O critério com maior D/C é identificado. As situações utilizam os valores integrais; um D/C exibido como 1,00 pode representar pequeno excesso e resultar em NÃO ATENDE.
- kgf·m é a unidade inicial de momento, com tf·m e kN·m disponíveis. Em kgf·m, as resultantes são mostradas em kgf. Convenção: 10 N = 1 kgf; 1 kN = 100 kgf; 1 tf·m = 1.000 kgf·m = 10 kN·m.
- O modo “Calcular somente capacidade” continua disponível e não confunde esforço ausente com zero.
- Resumo PNG de 2.000 px / 165 mm, SVG e relatório completo contêm a verificação. A frase removida pelo usuário continua ausente.

## Uso

Informe a geometria, os materiais e o momento aplicado. Preencha As adotada e clique em “Verificar As adotada × MSd”. A capacidade MRd aparece separada de MSd. Para voltar a determinar uma nova área necessária a partir do esforço, use “MSd → As”.

## Validação

135 testes automatizados aprovados, incluindo integridade dos três motores existentes. Testes no Edge: independência entre As e MSd; mudança de unidades sem perda dos valores; atualização de materiais; entradas vazias; operação de capacidade; entradas por barras/espaçamento; exportações PNG, SVG e HTML. Conferência visual do resumo e teste de sobreposição dos textos técnicos do exemplo, sem colisões.

Exemplo de teste: seção retangular bw = 100,00 cm, h = 20,00 cm, d = 14,00 cm, d′ = 6,00 cm, fck = 30 MPa, fyk = 500 MPa, γc = 1,40, γs = 1,15, γf = 1,40, As = 5,03 cm², As′ = 0,00 cm². Para MSd = 2.220,00 kgf·m, MRd = 2.930,45 kgf·m e D/C = 0,76: ATENDE à resistência à flexão. Para MSd = 4.000,00 kgf·m, mantendo a mesma armadura: NÃO ATENDE.

Os diagramas da verificação representam o estado resistente MRd, não deformações em serviço. O atendimento está restrito aos quatro critérios apresentados. O motor de resistência e sua base normativa foram preservados; esta revisão não implementa novas verificações de detalhamento ou serviço.
