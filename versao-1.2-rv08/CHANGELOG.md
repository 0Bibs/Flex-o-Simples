## RV05
- Ícones dos títulos convertidos para versão vetorial embutida no SVG, garantindo exibição no painel e na exportação.
- Tamanho, afastamento, opacidade e peso visual padronizados para presença discreta e legível.
- Revisão visual final dos cabeçalhos dos quadros.

## RV04
- Ícones dos quadros reimplementados como vetores SVG inline para garantir exibição no painel e nas exportações.
- Padronização visual dos ícones: tamanho discreto, espaçamento fixo, traço uniforme e leve acento azul técnico.
- Auditoria visual final com captura da tela do programa e verificação em prévia/exportação.

## RV03
- Inclusão discreta de ícones nos títulos dos quadros do painel e da exportação SVG/PNG, usando os arquivos fornecidos pelo usuário.
- Ícones redimensionados e incorporados sem alterar cálculos nem a composição principal do painel.

# Histórico de versões

## 1.2.0 — 18/09/2026

Painel de flexão em três colunas conforme o documento de orientações. Campos
h e d′ na geometria, com sincronização explícita h = d + d′. Seletor de momento
tf·m/kN·m, preservando a convenção legada 10 e o caso calculado. Identificação
somente por elemento. Seção cotada, armadura esquemática, diagramas compactos e
mesma composição vetorial na tela/PNG/SVG. Materiais, armaduras e armadura
mínima mantidos. Dados detalhados em bloco expandível. Testes adicionais e
registro de validação. Fórmulas dos motores preservadas.

## 1.1.0 — 18/09/2026

- Exportação em ordem de memorial, com opção de manter a ordem da tela.
- PNG de 2000 px com densidade física nominal de 165 mm; saída SVG vetorial.
- Quebra de textos e avisos extensos, sem reduzir fonte nem perder subscritos.
- Bloqueio de exportação e limpeza de resultados após entrada inválida.
- Esforços de cálculo explícitos e distinção entre capacidade e demanda no modo inverso.
- Identificação de versão, cache atualizado, 16 novos testes e teste opcional de interface.

Motor de cálculo preservado. Escopo, instruções e limitações em `VERSAO-1.1.md`.
