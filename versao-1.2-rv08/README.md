Versão revisada RV04 com ícones vetoriais nos títulos do painel.

# Flexão Simples 1.2.0 — revisão visual RV02

Cópia revisada do pacote fornecido, com exportação documental compacta, comparação de armaduras ordenada e apresentação correta dos três modos de flexão. O motor não foi atualizado. Esta revisão não constitui validação normativa ou certificação do dimensionamento.

## Abrir e exportar

Extraia a pasta inteira e abra **index.html** no Chrome ou Edge. Não abra o programa dentro do ZIP. O atalho `.lnk` herdado pode apontar para outra pasta: prefira `index.html`. Não há dependências de desenvolvimento para usar a aplicação.

No seletor **Composição documental**, escolha **Compacta — padrão Word** ou **Ampliada — diagramas maiores**. Use **Prévia 165 mm** para conferir a distribuição e a altura antes de baixar PNG ou SVG. Ao inserir no Word, confirme a largura de **16,5 cm**, mantendo a proporção. A revisão não publica automaticamente o programa no GitHub nem substitui sua PWA instalada.

No exemplo enviado, o documento passou de 165 × 232,49 mm para 165 × 165,99 mm: redução de 28,60% na altura, preservando o corpo de 8,65 pt. A altura aumenta com advertências e casos mais complexos.

## O que mudou

A comparação passa a ordenar as áreas do maior para o menor e preservar empates: no exemplo, **As,adotada = As,calc > As,mín**. Foi corrigido o modo “Armadura adotada × momento solicitante”, exibindo demanda, capacidade e os quatro critérios já calculados pelo verificador. Os diagramas informam quando representam o estado resistente ou o estado anterior à adoção da armadura mínima.

Os arquivos `js/norma.js`, `js/flexao.js`, `js/cisalhamento.js`, `js/verificacao-flexao.js` e `js/entrada-flexao.js` permanecem idênticos aos originais. A convenção legada de unidades, os critérios e os coeficientes não foram alterados. O módulo Cortante/Torção continua disponível.

## Evidência e limites

Leia **auditoria/AUDITORIA-RV02.md** para a auditoria completa, medidas físicas, contraprova do modo de verificação e limitações. Os resultados e hashes estão em `auditoria/`. A documentação anterior foi preservada como histórico; este README e a auditoria RV02 prevalecem nas questões de apresentação revisadas.

Foram aprovados **127 testes Node** e executados **16 grupos funcionais / 38 composições** em Chromium com DOM local. Isso não constitui teste de instalação PWA, abertura file:// em Windows, Word nativo ou área de transferência real. A interface ainda pode exigir rolagem horizontal em janelas estreitas. Não foi alegada conformidade integral de acessibilidade.

## Reexecutar os testes

```sh
node --test
```

O teste de navegador exige Python com Playwright e Chromium. São dependências apenas de teste:

```sh
python scripts/testar-rv02.py --output resultados-rv02
```

Para indicar um Chromium instalado:

```sh
python scripts/testar-rv02.py --chromium /caminho/do/chromium --output resultados-rv02
```

O script usa os recursos reais em DOM local; não testa o ciclo da PWA. O script histórico `testar-interface.py` foi preservado, mas suas expectativas antigas não são a evidência de aceitação da RV02.

Após mudar recursos do aplicativo:

```sh
node scripts/atualizar-cache.cjs
node --test
```
