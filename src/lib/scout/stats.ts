import { POSITIONS, RESULTS, SHOT_TYPES, TACTICAL_PLAY_TYPES, TURNOVER_REASONS, positionLabel, type Zone } from "./constants";

export interface GoalkeeperItem {
  id: string;
  name: string;
}

export type Shot = {
  id: string;
  player_number: number | null;
  assist_number: number | null;
  shot_type: "6m" | "7m" | "9m";
  position: "ponta_esq" | "ponta_dir" | "armador_esq" | "armador_cen" | "armador_dir" | "pivo";
  zone: Zone;
  result: "gol" | "defesa" | "trave" | "fora" | "falta" | "perda" | string;
  game_time?: string | null;
  period?: string | null;
  possession_team?: string | null;
  sector?: string | null;
  is_pseudo_assist?: boolean | null;
  tactical_play?: string | null;
  turnover_reason?: string | null;
  defensive_sector?: string | null;
  numerical_status?: string | null;
  goalkeeper_name?: string | null;
  notes?: string | null;
  dominant_hand?: string | null;
  video_timestamp_seconds?: number;
  shot_origin_x?: number;
  shot_origin_y?: number;
  drawing_data?: string;
};

// 1. MÉTRICAS GERAIS DA PARTIDA
export function computeStats(shots: Shot[] = []) {
  const safeShots = Array.isArray(shots) ? shots : [];
  const total = safeShots.length;
  const gols = safeShots.filter((s) => s.result === "gol").length;
  const defesas = safeShots.filter((s) => s.result === "defesa").length;
  const trave = safeShots.filter((s) => s.result === "trave").length;
  const fora = safeShots.filter((s) => s.result === "fora").length;
  const perdas = safeShots.filter((s) => s.result && s.result.startsWith("perda")).length;

  const taxaConversao = total > 0 ? Math.round((gols / total) * 100) : 0;
  const taxaDefesa = total > 0 ? Math.round((defesas / total) * 100) : 0;

  return { total, gols, defesas, trave, fora, perdas, taxaConversao, taxaDefesa };
}

// 2. HEATMAP POR ZONA DO GOL (A1 a C3)
export function computeGoalHeatmap(shots: Shot[] = []) {
  const counts: Record<Zone, number> = {
    A1: 0, A2: 0, A3: 0,
    B1: 0, B2: 0, B3: 0,
    C1: 0, C2: 0, C3: 0,
  };

  const safeShots = Array.isArray(shots) ? shots : [];
  safeShots.forEach((s) => {
    if (s && s.zone && counts[s.zone] !== undefined) {
      counts[s.zone]++;
    }
  });

  return counts;
}

// Helper genérico para heatmap com filtro seguro
export function heatmapBy(shots: Shot[] = [], filterFn?: (s: Shot) => boolean) {
  const counts: Record<Zone, number> = {
    A1: 0, A2: 0, A3: 0,
    B1: 0, B2: 0, B3: 0,
    C1: 0, C2: 0, C3: 0,
  };

  const safeShots = Array.isArray(shots) ? shots : [];
  const list = typeof filterFn === "function" ? safeShots.filter(filterFn) : safeShots;
  list.forEach((s) => {
    if (s && s.zone && counts[s.zone] !== undefined) {
      counts[s.zone]++;
    }
  });

  return counts;
}

// 3. ESTATÍSTICAS POR POSIÇÃO EM QUADRA
export function computePositionStats(shots: Shot[] = []) {
  const safeShots = Array.isArray(shots) ? shots : [];
  return POSITIONS.map((pos) => {
    const list = safeShots.filter((s) => s.position === pos.value);
    const total = list.length;
    const gols = list.filter((s) => s.result === "gol").length;
    const taxa = total > 0 ? Math.round((gols / total) * 100) : 0;

    return {
      key: pos.value,
      value: pos.value,
      label: pos.label,
      total,
      gols,
      taxa,
    };
  });
}

export function statsByPosition(shots: Shot[] = []) {
  return computePositionStats(shots);
}

// 4. ESTATÍSTICAS POR DISTÂNCIA DA LINHA (6m, 7m, 9m)
export function computeShotTypeStats(shots: Shot[] = []) {
  const safeShots = Array.isArray(shots) ? shots : [];
  return SHOT_TYPES.map((type) => {
    const list = safeShots.filter((s) => s.shot_type === type.value);
    const total = list.length;
    const defesas = list.filter((s) => s.result === "defesa").length;
    const gols = list.filter((s) => s.result === "gol").length;
    const taxaDefesa = total > 0 ? Math.round((defesas / total) * 100) : 0;
    const taxa = total > 0 ? Math.round((gols / total) * 100) : 0;

    return {
      key: type.value,
      value: type.value,
      label: type.label,
      total,
      defesas,
      gols,
      taxa,
      taxaDefesa,
      eficiencia: taxaDefesa,
    };
  });
}

export function statsByShotType(shots: Shot[] = []) {
  return computeShotTypeStats(shots);
}

// 5. ARTILHARIA E RANKING DE ATLETAS
export function computePlayerLeaderboard(shots: Shot[] = [], teamName?: string) {
  const safeShots = Array.isArray(shots) ? shots : [];
  const filtered = teamName ? safeShots.filter((s) => !s.possession_team || s.possession_team === teamName) : safeShots;
  const playerMap: Record<number, { numero: number; player_number: number; gols: number; total: number; assistencias: number; perdas: number }> = {};

  filtered.forEach((s) => {
    if (s.player_number != null) {
      if (!playerMap[s.player_number]) {
        playerMap[s.player_number] = { numero: s.player_number, player_number: s.player_number, gols: 0, total: 0, assistencias: 0, perdas: 0 };
      }
      playerMap[s.player_number].total++;
      if (s.result === "gol") playerMap[s.player_number].gols++;
      if (s.result && s.result.startsWith("perda")) playerMap[s.player_number].perdas++;
    }

    if (s.assist_number != null) {
      if (!playerMap[s.assist_number]) {
        playerMap[s.assist_number] = { numero: s.assist_number, player_number: s.assist_number, gols: 0, total: 0, assistencias: 0, perdas: 0 };
      }
      playerMap[s.assist_number].assistencias++;
    }
  });

  return Object.values(playerMap).map((p) => ({
    ...p,
    eficiencia: p.total > 0 ? Math.round((p.gols / p.total) * 100) : 0,
    efetividade: p.total > 0 ? Math.round((p.gols / p.total) * 100) : 0,
  })).sort((a, b) => b.gols - a.gols || b.eficiencia - a.eficiencia);
}

// 6. MOTIVOS DE PERDA DE BOLA (TURNOVERS)
export function computeTurnoverStats(shots: Shot[] = [], teamName?: string) {
  const safeShots = Array.isArray(shots) ? shots : [];
  const perdas = safeShots.filter((s) => s.result && s.result.startsWith("perda") && (!teamName || !s.possession_team || s.possession_team === teamName));
  const counts: Record<string, number> = {};
  const totalPerdas = perdas.length;

  perdas.forEach((s) => {
    let reason = s.turnover_reason;
    if (!reason && s.result && s.result.includes(":")) {
      reason = s.result.split(":")[1];
    }
    reason = reason || "outros";
    counts[reason] = (counts[reason] || 0) + 1;
  });

  return Object.entries(counts).map(([reason, count]) => {
    const labelObj = TURNOVER_REASONS.find((t) => t.value === reason);
    const label = labelObj ? labelObj.label : reason;
    const pct = totalPerdas > 0 ? Math.round((count / totalPerdas) * 100) : 0;
    return {
      reason,
      label,
      count,
      pct,
    };
  }).sort((a, b) => b.count - a.count);
}

// 7. DESEMPENHO POR ESTRUTURA TÁTICA DE JOGADA
export function computeTacticalPlayStats(shots: Shot[] = [], teamName?: string) {
  const safeShots = Array.isArray(shots) ? shots : [];
  const filtered = teamName ? safeShots.filter((s) => !s.possession_team || s.possession_team === teamName) : safeShots;
  return TACTICAL_PLAY_TYPES.map((t) => {
    const list = filtered.filter((s) => s.tactical_play === t.value);
    const total = list.length;
    const gols = list.filter((s) => s.result === "gol").length;
    const eficiencia = total > 0 ? Math.round((gols / total) * 100) : 0;
    return {
      value: t.value,
      label: t.label,
      total,
      gols,
      eficiencia,
      efetividade: eficiencia,
    };
  }).filter((t) => t.total > 0);
}

// 8. ORIGEM DO PERIGO DEFENSIVO POR SETOR
export function computeDefensiveDangerStats(shots: Shot[] = [], teamName?: string) {
  const safeShots = Array.isArray(shots) ? shots : [];
  
  // Seleção de lances defensivos enfrentados pela nossa equipe
  const oppShots = safeShots.filter((s) => {
    if (!s) return false;
    if (s.sector === "Defesa") return true;
    if (teamName && s.possession_team && s.possession_team !== teamName) return true;
    if (s.result === "defesa") return true; // Defesa do nosso goleiro é sempre um lance defensivo contra nosso gol
    return false;
  });

  // Se não houver lances marcados com posse explícita, usa a lista geral de lances filtrados por posição
  const baseShots = oppShots.length > 0 ? oppShots : safeShots;

  const setores = POSITIONS.map((pos) => {
    const list = baseShots.filter((s) => s && s.position === pos.value);
    const total = list.length;
    const gols = list.filter((s) => s.result === "gol").length;
    const defesasGoleiro = list.filter((s) => s.result === "defesa").length;
    const errosAdversario = list.filter((s) => s.result === "fora" || s.result === "trave" || (s.result && s.result.startsWith("perda"))).length;
    
    // Eficiência defensiva % = (Arremessos sem Gol) / Total
    const eficienciaDefensiva = total > 0 ? Math.round(((total - gols) / total) * 100) : 0;

    return {
      key: pos.value,
      position: pos.value,
      label: pos.label,
      total,
      gols,
      defesasGoleiro,
      errosAdversario,
      eficienciaDefensiva,
    };
  });

  return { setores };
}

// 9. IMPACTO DO ESTADO NUMÉRICO (2 MINUTOS E GOLEIRO LINHA)
export function computeNumericalStatusStats(shots: Shot[] = [], teamName?: string, opponentName?: string) {
  const safeShots = Array.isArray(shots) ? shots : [];

  const calcForTeam = (tName?: string) => {
    const subset = tName
      ? safeShots.filter((s) => !s.possession_team || s.possession_team === tName)
      : safeShots;

    const calcStatus = (statusKey: string) => {
      const list = subset.filter((s) => {
        if (!s) return false;
        const sStatus = s.numerical_status || "6x6";
        if (statusKey === "6x6") {
          return !s.numerical_status || s.numerical_status === "6x6";
        }
        return sStatus === statusKey;
      });
      const oportunidades = list.length;
      const gols = list.filter((s) => s.result === "gol").length;
      const perdas = list.filter((s) => s.result && s.result.startsWith("perda")).length;
      const efetividade = oportunidades > 0 ? Math.round((gols / oportunidades) * 100) : 0;
      return { oportunidades, gols, perdas, efetividade };
    };

    return {
      igualdade: calcStatus("6x6"),
      superioridade: calcStatus("6x5"),
      inferioridade: calcStatus("5x6"),
      goleiroLinha: calcStatus("7x6"),
    };
  };

  return {
    nossoTime: calcForTeam(teamName),
    adversario: calcForTeam(opponentName),
  };
}

// 10. GOLEIROS & SECTOR STATS
export function computeGoalkeeperProfiles(shots: Shot[] = [], defaultGkName?: string) {
  const safeShots = Array.isArray(shots) ? shots : [];
  const gks = Array.from(new Set(safeShots.map((s) => s.goalkeeper_name).filter((n): n is string => Boolean(n))));
  if (defaultGkName && !gks.includes(defaultGkName)) {
    gks.unshift(defaultGkName);
  }
  return gks.map((name) => {
    const gkShots = safeShots.filter((s) => s && s.goalkeeper_name === name);
    const totalArremessos = gkShots.length;
    const defesas = gkShots.filter((s) => s.result === "defesa").length;
    const golsSofridos = gkShots.filter((s) => s.result === "gol").length;
    const taxaDefesa = totalArremessos > 0 ? Math.round((defesas / totalArremessos) * 100) : 0;
    return { name, totalArremessos, defesas, golsSofridos, taxaDefesa };
  });
}

export function statsByGoalkeeperSector(shots: Shot[] = [], gkName?: string) {
  const safeShots = Array.isArray(shots) ? shots : [];
  const filtered = gkName ? safeShots.filter((s) => !s.goalkeeper_name || s.goalkeeper_name === gkName) : safeShots;
  return POSITIONS.map((pos) => {
    const list = filtered.filter((s) => s.position === pos.value);
    const total = list.length;
    const defesas = list.filter((s) => s.result === "defesa").length;
    const gols = list.filter((s) => s.result === "gol").length;
    const taxa = total > 0 ? Math.round((defesas / total) * 100) : 0;
    return {
      key: pos.value,
      position: pos.value,
      label: pos.label,
      total,
      defesas,
      gols,
      taxa,
      eficiencia: taxa,
    };
  });
}

// 11. EVOLUÇÃO POR INTERVALOS DE 10 MINUTOS DE JOGO (00-10, 10-20, 20-30, 30-40, 40-50, 50-60)
export function compute10MinIntervalStats(shots: Shot[] = [], teamName?: string) {
  const safeShots = Array.isArray(shots) ? shots : [];
  const teamShots = teamName ? safeShots.filter((s) => !s.possession_team || s.possession_team === teamName) : safeShots;

  const intervals = [
    { label: "00' - 10'", period: "1º Tempo", minSec: 0, maxSec: 600 },
    { label: "10' - 20'", period: "1º Tempo", minSec: 600, maxSec: 1200 },
    { label: "20' - 30'", period: "1º Tempo", minSec: 1200, maxSec: 1800 },
    { label: "30' - 40'", period: "2º Tempo", minSec: 0, maxSec: 600 },
    { label: "40' - 50'", period: "2º Tempo", minSec: 600, maxSec: 1200 },
    { label: "50' - 60'", period: "2º Tempo", minSec: 1200, maxSec: 1800 },
  ];

  return intervals.map((it) => {
    const list = teamShots.filter((s) => {
      const isCorrectPeriod = s.period === it.period || (!s.period && it.period === "1º Tempo");
      if (!isCorrectPeriod) return false;
      const sec = s.game_time ? (parseInt(s.game_time.split(":")[0] || "0", 10) * 60 + parseInt(s.game_time.split(":")[1] || "0", 10)) : 0;
      return sec >= it.minSec && sec < it.maxSec;
    });

    const total = list.length;
    const gols = list.filter((s) => s.result === "gol").length;
    const perdas = list.filter((s) => s.result && s.result.startsWith("perda")).length;
    const eficiencia = total > 0 ? Math.round((gols / total) * 100) : 0;

    return {
      interval: it.label,
      total,
      gols,
      perdas,
      eficiencia,
    };
  });
}

// 12. DOSSIÊS INDIVIDUAIS DOS ATLETAS (COMPILADO COMPLETO POR CAMISA)
export interface DetailedPlayerReport {
  playerNumber: number;
  totalShots: number;
  gols: number;
  defesasSofridas: number;
  foraTrave: number;
  perdas: number;
  assistencias: number;
  taxaAcerto: number;
  assistTurnoverRatio: string;
  preferenciasDistancia: { shot_type: string; label: string; total: number; gols: number }[];
  posicaoPredominante: string;
  zonaPreferidaGol: Zone | "Nenhuma";
  heatmapData: Record<Zone, number>;
  insights: string[];
}

export function computeDetailedPlayerReports(shots: Shot[] = [], teamName?: string): DetailedPlayerReport[] {
  const safeShots = Array.isArray(shots) ? shots : [];
  const teamShots = teamName ? safeShots.filter((s) => !s.possession_team || s.possession_team === teamName) : safeShots;

  const playerNumbers = Array.from(
    new Set(
      teamShots.flatMap((s) => [s.player_number, s.assist_number]).filter((n): n is number => n != null)
    )
  ).sort((a, b) => a - b);

  return playerNumbers.map((num) => {
    const playerShots = teamShots.filter((s) => s.player_number === num);
    const playerAssists = teamShots.filter((s) => s.assist_number === num).length;

    const totalShots = playerShots.length;
    const gols = playerShots.filter((s) => s.result === "gol").length;
    const defesasSofridas = playerShots.filter((s) => s.result === "defesa").length;
    const foraTrave = playerShots.filter((s) => s.result === "fora" || s.result === "trave").length;
    const perdas = playerShots.filter((s) => s.result && s.result.startsWith("perda")).length;

    const taxaAcerto = totalShots > 0 ? Math.round((gols / totalShots) * 100) : 0;
    const assistTurnoverRatio = perdas > 0 ? (playerAssists / perdas).toFixed(2) : (playerAssists > 0 ? `${playerAssists}.0` : "0.0");

    // Distância preferida
    const preferenciasDistancia = SHOT_TYPES.map((st) => {
      const list = playerShots.filter((s) => s.shot_type === st.value);
      return {
        shot_type: st.value,
        label: st.label,
        total: list.length,
        gols: list.filter((s) => s.result === "gol").length,
      };
    });

    // Posição predominante
    const posCounts: Record<string, number> = {};
    playerShots.forEach((s) => {
      if (s.position) posCounts[s.position] = (posCounts[s.position] || 0) + 1;
    });
    const topPosKey = Object.entries(posCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const posicaoPredominante = topPosKey ? positionLabel(topPosKey as any) : "Em Definição";

    // Heatmap individual por quadrante do gol
    const heatmapData = computeGoalHeatmap(playerShots);
    const topZoneEntry = Object.entries(heatmapData).sort((a, b) => b[1] - a[1])[0];
    const zonaPreferidaGol = (topZoneEntry && topZoneEntry[1] > 0) ? (topZoneEntry[0] as Zone) : "Nenhuma";

    // Insights automáticos do jogador
    const insights: string[] = [];

    if (totalShots >= 3 && taxaAcerto >= 70) {
      insights.push(`🔥 Altíssima precisão de finalização (${taxaAcerto}% de acerto em ${totalShots} finalizações).`);
    } else if (totalShots >= 4 && taxaAcerto < 40) {
      insights.push(`⚠️ Eficiência abaixo do esperado (${taxaAcerto}% de acerto). Ajustar momento do passe e tomada de decisão.`);
    }

    if (playerAssists >= 3) {
      insights.push(`🎯 Excelente visão de jogo e passe: ${playerAssists} assistências decisivas para gol.`);
    }

    if (perdas >= 3) {
      insights.push(`🚨 Alerta de perdas de posse: ${perdas} turnovers registrados. Trabalhar passe sob pressão.`);
    }

    if (insights.length === 0) {
      insights.push("Atuação regular com participação dentro da média tática da equipe.");
    }

    return {
      playerNumber: num,
      totalShots,
      gols,
      defesasSofridas,
      foraTrave,
      perdas,
      assistencias: playerAssists,
      taxaAcerto,
      assistTurnoverRatio,
      preferenciasDistancia,
      posicaoPredominante,
      zonaPreferidaGol,
      heatmapData,
      insights,
    };
  });
}

// 13. GERADOR DE INSIGHTS AUTOMÁTICOS DA EQUIPE (REGRAS DE NEGÓCIO TÁTICAS)
export function generateTeamTacticalInsights(shots: Shot[] = [], teamName?: string) {
  const safeShots = Array.isArray(shots) ? shots : [];
  const teamShots = teamName ? safeShots.filter((s) => !s.possession_team || s.possession_team === teamName) : safeShots;

  const total = teamShots.length;
  const gols = teamShots.filter((s) => s.result === "gol").length;
  const taxaGeral = total > 0 ? Math.round((gols / total) * 100) : 0;

  const insights: { type: "alert" | "highlight" | "recommendation"; text: string }[] = [];

  // Regra 1: Arremessos de 9 Metros (Armação)
  const shots9m = teamShots.filter((s) => s.shot_type === "9m");
  const gols9m = shots9m.filter((s) => s.result === "gol").length;
  const taxa9m = shots9m.length > 0 ? Math.round((gols9m / shots9m.length) * 100) : 0;

  if (shots9m.length >= 4 && taxa9m < 35) {
    insights.push({
      type: "alert",
      text: `⚠️ Alerta de Eficiência Externa: Aproveitamento de 9m muito baixo (${taxa9m}% em ${shots9m.length} tentativas). Recomendado priorizar cruzamentos e infiltrações na linha de 6m.`,
    });
  } else if (shots9m.length >= 3 && taxa9m >= 60) {
    insights.push({
      type: "highlight",
      text: `🚀 Potência de Armação: Excelente conversão nos arremessos de 9m (${taxa9m}% de acerto). Forçar a saída dos defensores adversários.`,
    });
  }

  // Regra 2: Desempenho no 2º Tempo vs 1º Tempo
  const perdas1T = teamShots.filter((s) => s.period === "1º Tempo" && s.result && s.result.startsWith("perda")).length;
  const perdas2T = teamShots.filter((s) => s.period === "2º Tempo" && s.result && s.result.startsWith("perda")).length;

  if (perdas2T > perdas1T * 1.5 && perdas2T >= 4) {
    insights.push({
      type: "alert",
      text: `🚨 Desgaste Físico / Concentração no 2º Tempo: O volume de perdas de bola disparou na etapa final (${perdas2T} perdas no 2ºT vs ${perdas1T} no 1ºT). Trabalhar rotação de elenco.`,
    });
  }

  // Regra 3: Eficiência na Superioridade Numérica (6x5)
  const shots6x5 = teamShots.filter((s) => s.numerical_status === "6x5");
  const gols6x5 = shots6x5.filter((s) => s.result === "gol").length;
  const taxa6x5 = shots6x5.length > 0 ? Math.round((gols6x5 / shots6x5.length) * 100) : 0;

  if (shots6x5.length >= 2 && taxa6x5 < 50) {
    insights.push({
      type: "alert",
      text: `⚠️ Aproveitamento em Superioridade Numérica (6x5): Eficiência de apenas ${taxa6x5}% com 1 jogador a mais. Focar em paciência para rodar a bola até a ponta solta.`,
    });
  }

  return insights;
}
