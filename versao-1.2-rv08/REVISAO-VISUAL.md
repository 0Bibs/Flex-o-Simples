# Flexão Simples 1.2.0 — revisão visual

Implementação aplicada em 18/09/2026 na pasta do programa indicada pelo usuário. Os arquivos de orientação `.md` e `.txt` eram idênticos. Foi preservada uma cópia anterior em `Backup-antes-revisao-visual-20260918-134036`, ao lado da pasta do aplicativo.

## Alterações implementadas

- Tela com identificação, modo, faixa de síntese e três colunas úteis de 30% / 28% / 42%; quadros com altura determinada pelo conteúdo.
- Segoe UI, paleta neutra, entradas identificadas em azul, valores alinhados, unidades, índices matemáticos e vírgula decimal. Capacidade resistente claramente identificada, sem aprovação global quando não existe solicitação independente.
- Seção em proporção real, cotas conectadas, d até o centroide e definição de d′ junto à geometria. Quantidades de barras somente quando informadas no modo correspondente; representação ilustrativa identificada.
- Domínios construídos com os parâmetros do estado calculado. Posição do número 2 calculada dentro de sua região, afastada da reta ativa. Deformação nula, alongamento e encurtamento identificados; limite de ductilidade diferenciado das fronteiras dos domínios.
- Equilíbrio com níveis comuns às duas subfiguras, LN tracejada, x e y distintos, Rc no centro do bloco retangular e setas esquemáticas de mesmo comprimento. Força zero não produz seta. Armadura superior respeita o sinal fornecido pelo motor.
- Exportação com composição própria: dados antes do modelo e resultados, PNG de 2000 px, densidade de 12121 px/m e SVG com largura nominal de 165 mm.
- Comandos “Copiar resumo” e “Relatório completo”. O relatório completo é um HTML autônomo com botão para imprimir/salvar PDF, critérios, modelo, parâmetros intermediários, resultados, alcance das verificações e conclusão.
- Campos vazios de armadura diferenciados de zero; análise inválida limpa desenhos e bloqueia também o relatório completo. Formatação decimal do relatório separada da escrita numérica dos campos utilizados pelo programa.
- Diagramas ampliados reutilizam os mesmos componentes da apresentação principal. Cache atualizado.

## Preservação do cálculo

Os arquivos `norma.js`, `flexao.js` e `cisalhamento.js` continuam iguais à base, conforme o teste de integridade existente. Nenhuma fórmula, coeficiente estrutural, critério normativo ou conversão foi alterado. A convenção existente permanece 10 N = 1 kgf.

O caso de referência usa a área interna 5,026548245743669 cm², exibida como 5,03 cm²; equivale a 10 barras de 8 mm quando o modo por barras é usado. Resultados obtidos: MRd = 31,47 kN·m, x = 1,50 cm, domínio 2, εs = 10,00‰, εc = 1,11‰ e Rc = 218,55 kN. Digitar literalmente 5,03 cm² constitui uma entrada ligeiramente diferente; os valores da captura não foram fixados no renderizador.

## Testes executados

- 109 testes de regressão aprovados, incluindo integridade dos motores e novos testes de ordem documental, proporção geométrica, sinal de forças, ausência de setas nulas e invalidação.
- 22 verificações locais no Microsoft Edge em modo de teste, carregando os arquivos reais por `file://`, sem exceções JavaScript.
- 13 cenários de tela e documento: referência, seção estreita/alta, larga/baixa, bloco muito pequeno, armadura superior tracionada, dupla, seção T na mesa e na alma, mínima governante, momento zero, C90, domínio 4 e números/identificação extensos. Nenhum texto fora dos quadros nos cenários medidos.
- Trocas de unidade sem alteração do estado; barras e valores de referência; entradas inválidas; identificação vazia e caracteres especiais; abertura do relatório autônomo; inicialização de cortante/torção.
- PNG e SVG produzidos pelos botões reais e conferidos quanto às dimensões e metadados.
- Inspeção visual da tela, documento, ampliação de 200% via CSS, tons de cinza e documento exibido a 165 mm via CSS. A ampliação mantém o conteúdo acessível por rolagem.

## Limitações e pendências explícitas

- Não houve impressão física, inserção no Word nem teste da área de transferência do sistema. A largura de 165 mm foi conferida no SVG e na exibição CSS; impressão/PDF do relatório deve ser conferida no ambiente de destino.
- Não foi feita homologação normativa, validação estrutural independente, instalação PWA ou publicação web.
- A inversão automática da face comprimida não existe no motor; a apresentação informa essa limitação.
- Para seção T com bloco na alma, o objeto de resultado não fornece a posição de Rc. O painel informa isso e omite essa seta, sem inventar um centro de resultante. O valor numérico de Rc permanece disponível.
- Domínios 4a e 5 continuam representados como referências gráficas; os cenários calculados exercitaram os domínios 1 a 4.
- As imagens de referência citadas dentro dos arquivos de orientação não estavam anexadas a este pedido; a implementação seguiu os critérios escritos e os arquivos do programa.

O aviso `access_programs` exibido pelo Codex informa indisponibilidade dessa integração para a organização. A implementação e os testes acima foram concluídos com os recursos locais disponíveis, sem depender dessa integração.
