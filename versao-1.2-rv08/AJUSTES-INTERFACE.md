# Renovação visual da interface (sobre a RV08)

Mudança de apresentação. Os motores (`norma.js`, `flexao.js`, `cisalhamento.js`,
`verificacao-*.js`, `entrada-flexao.js`) e a conversão 10 N = 1 kgf não foram alterados.

## 1. Interface (rodada 1)
- `css/*.css` reescritos sobre tokens (cores, raios, sombras); temas clássico e corporativo mantidos.
- Cabeçalho com marca e abas; dados em cartões, campos em duas colunas com rótulo e unidade
  acima do campo; seção RET/T como seletor visual; três formas de informar As como opções.
- "Copiar resumo" em destaque na barra superior e no painel, com confirmação flutuante.

## 2. Resumo da seção (rodada 2)
O resumo da Flexão (na tela **e** na imagem copiada, que agora são o mesmo desenho) foi
refeito no molde da janela "resumo da seção" do outro programa de referência:

- **Seção transversal**: concreto, armadura (barras só quando informadas; senão área
  equivalente), A′s, bloco comprimido λx, linha neutra e cotas (bw, h, d, d′; bf e hf na seção T).
- **Resultados**: materiais, armaduras e limites (As,calc/adotada, As,mín, As,máx, A′s, ρmín,
  Md,mín, βx/βx,lim, x, domínio).
- **Diagrama MRd × As**: curva da capacidade (o motor é reavaliado para 36 áreas de armadura),
  demanda MSd, armadura adotada, As,mín/As,máx e trecho tracejado onde βx > βx,lim.
- **Esforços (γf)**: tabela Msk, MSd, MRd, D/C e FS, com células coloridas e barra de utilização.
- **Verificações da seção**, **Adotada/Governa**, advertências e **Conclusão** (todas as
  informações do resumo anterior foram mantidas), com selo de situação no cabeçalho.
- Na tela: barra de status no rodapé (elemento, situação, unidades) e os diagramas de equilíbrio
  e de domínios em cartões visíveis, em vez de dentro do bloco recolhido.

O desenho é só apresentação: o diagrama chama `FS.VerificacaoFlexao.verificar` com outras
áreas de armadura e não altera o resultado exibido nem os dados de entrada.

## 3. Aba Cortante/Torção (rodada 3)
O mesmo tratamento foi aplicado ao resumo de cortante e torção (tela e imagem copiada são o mesmo desenho):

- **Seção transversal**: estribo (com ramos intermediários), barras ilustrativas, seta V (cortante), seta T
  e seção vazada equivalente tracejada com Ae (torção); cotas bw, h e d.
- **Dados e resultados**: materiais e modelo (fck, fyk, γc, γs, γf, α, bw,mín, c₁, modelo/θ, fywd),
  armadura por ramo (demanda, disponível, Asw, A90) e armadura longitudinal (Asl necessária e mínima).
- **Diagrama Estribos × espaçamento**: armadura disponível por ramo (A_ramo/s) contra a demanda, com s adotado,
  s,máx e a faixa s ≤ s,exato.
- **Esforços (γf)**: Sk, Sd, menor capacidade Rd, D/C e FS por esforço (cortante e torção), com células coloridas.
- **Solução adotada** (estribo, ramos, s, s,máx, s,exato, Asl) e **Verificações** com demanda, capacidade, D/C, FS,
  barra de utilização e situação por critério; selo de situação no cabeçalho e barra de status no rodapé.
- Erros de entrada passam a aparecer como aviso (mesmo estilo da aba Flexão). A barra superior ganhou
  Recalcular (F9) e Copiar resumo. Os botões de exportação seguem a mesma ordem nas duas abas.
- O "Relatório completo" da aba continua com a composição anterior (memorial), sem alteração.
- Critérios (fórmulas, ex.: "VSd ≤ VRd2") continuam no relatório completo; o resumo traz os valores.

## 3b. Acabamento (rodada 4, varredura visual das duas abas)
- **Números grandes (kgf, kgf·m)**: nas tabelas de esforços e nas colunas Demanda/Capacidade das verificações,
  o corpo da fonte diminui só quando o valor não cabe na célula (antes, valores de 7 dígitos se sobrepunham).
  Em casos normais (tf, tf·m, kN) nada muda.
- **Diagramas**: a margem esquerda acompanha o maior número do eixo vertical (o título do eixo não encosta nos
  números) e o eixo horizontal pula rótulos quando o gráfico fica estreito.
- **Seção de cortante/torção**: os rótulos Aₑ e T ganharam contorno na cor do concreto, para não se perderem sob
  os ramos do estribo; colunas da tabela de esforços reequilibradas.
- **Tela**: o resumo passa a ter largura mínima de 680 px (antes 720/760), o que elimina a rolagem horizontal em
  janelas de cerca de 760 px; o item da lista "Composição do resumo" foi encurtado para "Horizontal — com diagrama".

## 4. Testes
- `node --test`: 166 aprovados. Dois testes que descreviam o resumo antigo ("sem diagramas",
  altura entre 400 e 540, strings "D/C = 0,84"/"FS = 1,19") foram reescritos para o novo
  desenho; dez testes novos cobrem o diagrama, a seção T, o modo capacidade, casos extremos, o resumo de
  cortante/torção, os números de 7 dígitos e a margem do diagrama.
- Conferido em Chromium: cópia real do PNG (2000 px) para a área de transferência pelos dois
  botões, prévia 165 mm, seção T, tf·m, tema corporativo, erro de dados e tela de 760 px.
- Não testado: Edge e Word nativos, instalação como PWA.
- Após mexer em arquivos, rode `node scripts/atualizar-cache.cjs`.
