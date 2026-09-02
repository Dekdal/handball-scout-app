export const POSITIONS = [
  { value: "ponta_esq", label: "Ponta Esquerda", short: "PE" },
  { value: "ponta_dir", label: "Ponta Direita", short: "PD" },
  { value: "armador_esq", label: "Armador Esquerdo", short: "AE" },
  { value: "armador_cen", label: "Armador Central", short: "AC" },
  { value: "armador_dir", label: "Armador Direito", short: "AD" },
  { value: "pivo", label: "Pivô", short: "PV" },
] as const;

// DISTÂNCIA DE FINALIZAÇÃO (LINHAS DA QUADRA DE HANDEBOL)
export const SHOT_TYPES = [
  { value: "6m", label: "6 Metros (6m)" },
  { value: "7m", label: "7 Metros (7m)" },
  { value: "9m", label: "9 Metros (9m)" },
] as const;

export const RESULTS = [
  { value: "gol", label: "Gol", color: "bg-destructive text-destructive-foreground" },
  { value: "defesa", label: "Defesa", color: "bg-success text-success-foreground" },
  { value: "trave", label: "Trave", color: "bg-warning text-warning-foreground" },
  { value: "fora", label: "Fora", color: "bg-muted text-foreground" },
  { value: "falta", label: "Falta Cometida/Sofrida", color: "bg-blue-600 text-white" },
  { value: "perda", label: "Perda de Bola (Turnover)", color: "bg-orange-600 text-white" },
  { value: "cartao_amarelo", label: "Cartão Amarelo 🟨", color: "bg-amber-400 text-amber-950" },
  { value: "exclusao_2min", label: "2 Minutos ⏱️", color: "bg-orange-500 text-white" },
  { value: "cartao_vermelho", label: "Cartão Vermelho 🟥", color: "bg-red-600 text-white" },
  { value: "cartao_azul", label: "Cartão Azul 🟦", color: "bg-blue-600 text-white" },
] as const;

export const DISCIPLINARY_CARDS = [
  { value: "cartao_amarelo", label: "Cartão Amarelo 🟨", color: "bg-amber-400 text-amber-950 border-amber-500 font-bold" },
  { value: "exclusao_2min", label: "Exclusão 2 Min ⏱️", color: "bg-orange-500 text-white border-orange-600 font-bold" },
  { value: "cartao_vermelho", label: "Cartão Vermelho 🟥", color: "bg-red-600 text-white border-red-700 font-bold" },
  { value: "cartao_azul", label: "Cartão Azul 🟦", color: "bg-blue-600 text-white border-blue-700 font-bold" },
] as const;

export const SANCTION_REASONS = [
  { value: "falta_violenta", label: "Falta Violenta / Empurrão" },
  { value: "atitude_antidesportiva", label: "Atitude Antidesportiva" },
  { value: "reclamacao_arbitragem", label: "Reclamação com Arbitragem" },
  { value: "contato_pescoco_rosto", label: "Contato no Pescoço / Rosto" },
  { value: "reincidencia_faltas", label: "Reincidência de Faltas" },
  { value: "impedir_execucao", label: "Impedir Execução de Tiro Livre" },
  { value: "troca_irregular", label: "Substituição Irregular / Zona de Substituição" },
] as const;

export const ZONES = [
  "A1", "A2", "A3",
  "B1", "B2", "B3",
  "C1", "C2", "C3",
] as const;

// TIPOS DE JOGADA TÁTICA
export const TACTICAL_PLAY_TYPES = [
  { value: "engajamento_armacao_finta", label: "Engajamento - Armação - Finta" },
  { value: "engajamento_ponta", label: "Engajamento - Ponta" },
  { value: "trabalho_pivo", label: "Trabalho com Pivô" },
  { value: "chute_posicao_9m", label: "Chute de Posição" },
  { value: "contra_ataque", label: "Contra-Ataque" },
  { value: "7m", label: "7 Metros (Tiro Livre de 7m)" },
  { value: "jogada_ensaiada", label: "Jogada Ensaiada" },
] as const;

// CAUSAS DE PERDA DE BOLA (TURNOVERS)
export const TURNOVER_REASONS = [
  { value: "passe_pivo", label: "Passe Errado pro Pivô" },
  { value: "falta_ataque", label: "Falta de Ataque" },
  { value: "andada", label: "Andada" },
  { value: "passivo", label: "Jogo Passivo" },
  { value: "passe_ponta", label: "Passe Errado na Ponta" },
  { value: "passe_armacao", label: "Passe Errado na Armação" },
] as const;

// ORIGENS DE AMEAÇA DEFENSIVA (VISÃO NOSSA DEFESA)
export const DEFENSIVE_SECTORS = [
  { value: "ponta_circulando", label: "Ponta Circulando (2º Pivô)" },
  { value: "engajamento_ponta_sofrido", label: "Engajamento + Ponta Sofrido" },
  { value: "primeiros_defensores", label: "Ações nos Primeiros Defensores (Pontas)" },
  { value: "defensores_bases", label: "Ações nos Defensores Bases (Centrais)" },
  { value: "trabalho_pivo_sofrido", label: "Trabalho com Pivô Sofrido" },
  { value: "7m_cometido", label: "7 Metros Cometidos" },
] as const;

// MOTIVOS DE FALHA DEFENSIVA
export const DEFENSIVE_FAILURES = [
  { value: "finta_com_atraso", label: "Finta Sofrida com Atraso de Cobertura" },
  { value: "arremesso_sobre_defensor", label: "Arremesso por Cima do Defensor" },
  { value: "perda_posicionamento", label: "Desatenção / Perda de Posicionamento" },
] as const;

export type Zone = (typeof ZONES)[number];
export type Position = (typeof POSITIONS)[number]["value"];
export type ShotType = (typeof SHOT_TYPES)[number]["value"];
export type ShotResult = (typeof RESULTS)[number]["value"];
export type TacticalPlayType = (typeof TACTICAL_PLAY_TYPES)[number]["value"];
export type TurnoverReason = (typeof TURNOVER_REASONS)[number]["value"];

export const positionLabel = (v: string) =>
  POSITIONS.find((p) => p.value === v)?.label ?? v;
export const shotTypeLabel = (v: string) =>
  SHOT_TYPES.find((p) => p.value === v)?.label ?? v;
export const resultLabel = (v: string) =>
  RESULTS.find((r) => r.value === v)?.label ?? v;
export const tacticalPlayLabel = (v: string) =>
  TACTICAL_PLAY_TYPES.find((p) => p.value === v)?.label ?? v;
export const turnoverReasonLabel = (v: string) =>
  TURNOVER_REASONS.find((r) => r.value === v)?.label ?? v;
export const sanctionReasonLabel = (v: string) =>
  SANCTION_REASONS.find((r) => r.value === v)?.label ?? v;

// RÓTULO FORMATADO DO RESULTADO (E CARTÕES DISCIPLINARES)
export const formattedResultLabel = (s: { result: string; turnover_reason?: string | null }) => {
  if (s.result === "cartao_amarelo") return "🟨 Cartão Amarelo";
  if (s.result === "exclusao_2min") return "⏱️ Exclusão 2 Min";
  if (s.result === "cartao_vermelho") return "🟥 Cartão Vermelho";
  if (s.result === "cartao_azul") return "🟦 Cartão Azul";

  if (s.result && s.result.startsWith("cartao_")) {
    if (s.result.includes("amarelo")) return "🟨 Cartão Amarelo";
    if (s.result.includes("vermelho")) return "🟥 Cartão Vermelho";
    if (s.result.includes("azul")) return "🟦 Cartão Azul";
  }

  if (s.result === "perda") {
    if (s.turnover_reason) {
      const reason = turnoverReasonLabel(s.turnover_reason);
      return `Perda: ${reason}`;
    }
    return "Perda de Bola";
  }
  return resultLabel(s.result);
};
