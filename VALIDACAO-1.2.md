# Registro de verificação — 1.2.0

Execução nesta entrega, em 18/09/2026.

## Regressão

Node.js v22.16.0: `node --test`, 105 testes, 105 aprovados, nenhuma falha.
A checagem de integridade dos motores continua baseada nos hashes de blob Git:

`js/norma.js`: `5e9fe9a88b9fe751d15dbf07cf99498b7acba8bb`.

`js/flexao.js`: `528b684452f39a0199cbf6662ce75be72548abf9`.

`js/cisalhamento.js`: `2d00aca2237b5cdd53abcb9dfb4fc01500677bf1`.

## Interface em Chromium

Carregamento do HTML/CSS/JavaScript real em DOM em memória.

1. Inicializacao, versao, sete quadros e identificacao apenas pelo elemento.
2. h/d/d-prime: tres edicoes sincronizadas e geometria coerente.
3. tf.m para kN.m converte Msd e Msk sem alterar o resultado.
4. 100 alternancias de unidade sem deriva numerica.
5. Entrada direta em kN.m chega ao motor na unidade correta.
6. PNG 2000px/pHYs e SVG 165mm: painel da viga com textos dentro dos quadros.
7. Tema corporativo: exportacao funcional e desenho tecnico preservado.
8. Exemplo de geometria da orientacao: bw100, h20, d16 e d-prime4.
9. Secao T: forma, cotas, resultados e exportacao.
10. Armadura dupla: apresentacao dos dois niveis de aco.
11. Minima governante: aviso conservado e estado do diagrama identificado.
12. Modo inverso e barras: quantidade real e unidade nao perde a armadura informada.
13. Cinco entradas invalidas limpam desenhos, bloqueiam exportacao e recuperam apos correcao.
14. Titulos longos e caracteres HTML preservados sem injetar marcacao.
15. Momento nulo: painel sem NaN ou infinito.
16. Faixa de concreto de alta resistencia: diagrama e limites graficos.
17. Atalhos funcionais F2/F3/F4/F5/F9.
18. Clipboard indisponivel oferece download, sem alegar copia.
19. Cortante/torcao: tres modos e exportacao mantidos.
20. Nenhuma excecao JavaScript nas paginas exercitadas.

Não houve exceções JavaScript nos cenários exercitados. PNG/SVG foram gerados
pelos botões reais e conferidos quanto a dimensões, densidade e presença dos
quadros. Foram inspecionadas imagens de viga, laje, seção T, armadura dupla,
mínima e modo inverso. Os testes de textos nos quadros verificam os retângulos
de enquadramento dos textos, e não apenas se o SVG foi produzido.

## Limites da evidência

Não foi executado o Microsoft Word, nem verificada a área de transferência real
com suas permissões de sistema. O comportamento de indisponibilidade da cópia
foi testado. A navegação file:// foi bloqueada pelo ambiente de teste; foi
utilizado o modo em memória explicitamente registrado. PWA/service worker e a
publicação do site não foram exercitados. O aplicativo Windows Pilar CA não
foi executado; os recursos visuais HTML/CSS incorporados foram examinados.

Estes resultados são testes de implementação e regressão, não homologação
normativa nem certificação da segurança de qualquer estrutura.
