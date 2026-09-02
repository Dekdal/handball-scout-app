import type { HeadToHeadSummary } from "./headToHead";

export function buildTacticalAiPrompt(h2h: HeadToHeadSummary): string {
  const oppName = h2h.opponentName;
  const teamName = h2h.selectedTeamName === "all" ? "Nossa Equipe" : h2h.selectedTeamName || "Nossa Equipe";

  return `
Você é um **Analista Tático de Elite e Estrategista de Handebol** com 20 anos de experiência na Liga Nacional e Seleções Internacionais.
Sua missão é gerar o **Relatório Tático Pré-Jogo Mais Detalhado e Completo Possível** para a comissão técnica de ${teamName} antes de enfrentar o adversário "${oppName}".

### 📊 DADOS ESTATÍSTICOS CONSOLIDADOS DOS CONFRONTOS (${h2h.totalGames} partidas analisadas):
- **Equipe Avaliada**: ${teamName}
- **Adversário**: ${oppName}
- **Média de Gols Marcados por Jogo**: ${h2h.avgGolsMarcados} gols
- **Média de Gols Sofridos por Jogo**: ${h2h.avgGolsSofridos} gols
- **Aproveitamento Geral de Arremessos**: ${h2h.accuracy}%
- **Aproveitamento de 9 Metros (9m)**: ${h2h.m9Accuracy}%
- **Aproveitamento de 6 Metros (6m)**: ${h2h.m6Accuracy}%
- **Aproveitamento de 7 Metros (7m)**: ${h2h.m7Accuracy}%
- **Defesas dos Goleiros (Save Rate)**: ${h2h.gkSaveRate}%
- **Turnovers (Perdas de Bola)**: ${h2h.turnovers} perdas totais (média de ${h2h.avgTurnovers} por jogo)
- **Sanções Disciplinares**: ${h2h.exclusoes2min} exclusões de 2 min | ${h2h.cartoesAmarelos} cartões amarelos | ${h2h.cartoesVermelhos + h2h.cartoesAzuis} cartões vermelhos/azuis

#### 🎯 ORIGEM DOS ARREMESSOS DO ADVERSÁRIO ("${oppName}"):
- **Por Posição**:
  - Armação (AE / AC / AD): ${h2h.opponentPositions.armacao.percent}% do volume (${h2h.opponentPositions.armacao.gols} gols em ${h2h.opponentPositions.armacao.total} chutes)
  - Pontas (PE / PD): ${h2h.opponentPositions.pontas.percent}% do volume (${h2h.opponentPositions.pontas.gols} gols em ${h2h.opponentPositions.pontas.total} chutes)
  - Pivô (PV): ${h2h.opponentPositions.pivo.percent}% do volume (${h2h.opponentPositions.pivo.gols} gols em ${h2h.opponentPositions.pivo.total} chutes)
- **Por Distância**:
  - 6 Metros (Infiltrações/Pontas/Pivô): ${h2h.opponentDistances.m6.percent}% do volume (${h2h.opponentDistances.m6.gols} gols)
  - 9 Metros (Longa Distância): ${h2h.opponentDistances.m9.percent}% do volume (${h2h.opponentDistances.m9.gols} gols)
  - 7 Metros (Tiros Libres): ${h2h.opponentDistances.m7.percent}% do volume (${h2h.opponentDistances.m7.gols} gols)

---

### 📋 ESTRUTURA OBRIGATÓRIA DO RELATÓRIO TÁTICO ULTRA-DETALHADO:

Por favor, escreva o relatório em **Português do Brasil (pt-BR)** usando Markdown rico com títulos, listas, negritos e emojis. O relatório DEVE conter as seguintes 5 seções detalhadas:

# 📋 RELATÓRIO TÁTICO PRÉ-JOGO: ${teamName.toUpperCase()} VS ${oppName.toUpperCase()}

## 1. 📊 RESUMO EXECUTIVO DO CONFRONTO
- Análise sintética da média de gols pró vs contra.
- Diagnóstico do saldo de gols e controle de ritmo da partida.

## 2. ⚔️ DIAGNÓSTICO OFENSIVO (${teamName.toUpperCase()})
- **Aproveitamento por Zona & Distância**: Análise do chute de 9m (${h2h.m9Accuracy}%) vs 6m (${h2h.m6Accuracy}%). Onde devemos agredir a defesa rival?
- **Gestão de Posse & Erros Técnicos**: Análise da média de ${h2h.avgTurnovers} perdas de bola por jogo. Como reduzir passes errados e passos na transição?
- **Orientação de Finalização nos Goleiros Rivas**: Quais quadrantes e alturas do gol devem ser explorados.

## 3. 🛡️ DIAGNÓSTICO DEFENSIVO & BLOQUEIO AMEAÇA
- **Mapeamento de Origem do Rival**: Como neutralizar a Armação (${h2h.opponentPositions.armacao.percent}%), Pontas (${h2h.opponentPositions.pontas.percent}%) e Pivô (${h2h.opponentPositions.pivo.percent}%).
- **Recomendação de Sistema Defensivo**: Indicar justificadamente qual sistema utilizar (ex: Defesa 6-0 Fechada, Defesa 5-1 com Flutuante, ou Defesa 3-2-1 agressiva).
- **Orientação de Cobertura para Nossos Goleiros**: Como posicionar a barreira defensiva e orientar os goleiros (${h2h.gkSaveRate}% de defesa atual).

## 4. ⏱️ GESTÃO DISCIPLINAR & INFERIORIDADE NUMÉRICA
- Análise do volume de 2 minutos (${h2h.exclusoes2min}) e cartões.
- Recomendações para evitar faltas de punição de 2min em momentos decisivos do jogo.

## 5. 🎯 PLANO DE AÇÃO PARA O VESTIÁRIO (PALESTRA PRÉ-JOGO)
- **Pilar 1 (Ataque)**: Instrução tática principal para a primeira linha de ataque.
- **Pilar 2 (Defesa)**: Instrução tática principal para a basculação e bloqueio central.
- **Pilar 3 (Transição / Contra-Ataque)**: Estratégia de repliegue defensivo e contra-ataque de 1ª e 2ª vagas.
`;
}
