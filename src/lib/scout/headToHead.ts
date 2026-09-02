import { computeStats, heatmapBy, type Shot } from "./stats";

export interface HeadToHeadSummary {
  opponentName: string;
  selectedTeamName?: string;
  totalGames: number;
  totalShots: number;
  golsMarcados: number;
  golsSofridos: number;
  avgGolsMarcados: number;
  avgGolsSofridos: number;
  accuracy: number;
  m9Accuracy: number;
  m6Accuracy: number;
  m7Accuracy: number;
  turnovers: number;
  avgTurnovers: number;
  exclusoes2min: number;
  cartoesAmarelos: number;
  cartoesVermelhos: number;
  cartoesAzuis: number;
  gkDefesas: number;
  gkSaveRate: number;
  opponentDistances: {
    m6: { total: number; gols: number; percent: number };
    m7: { total: number; gols: number; percent: number };
    m9: { total: number; gols: number; percent: number };
  };
  opponentPositions: {
    pontas: { total: number; gols: number; percent: number };
    armacao: { total: number; gols: number; percent: number };
    pivo: { total: number; gols: number; percent: number };
  };
  opponentShots: Shot[];
  ourShots: Shot[];
  gameHistory: Array<{
    id: string;
    game_date: string;
    team_name: string;
    opponent: string;
    competition?: string;
    category?: string;
    golsMarcados: number;
    golsSofridos: number;
  }>;
}

export function computeHeadToHead(
  games: any[],
  shotsByGame: Record<string, Shot[]>,
  selectedOpponent: string = "all",
  selectedTeam: string = "all"
): HeadToHeadSummary | null {
  const safeGames = Array.isArray(games) ? games : [];
  
  const opponentGames = safeGames.filter((g) => {
    const matchesOpponent = selectedOpponent === "all" || g.opponent?.trim().toLowerCase() === selectedOpponent.trim().toLowerCase();
    const matchesTeam = selectedTeam === "all" || g.team_name?.trim().toLowerCase() === selectedTeam.trim().toLowerCase();
    return matchesOpponent && matchesTeam;
  });

  if (opponentGames.length === 0) return null;

  let totalShots = 0;
  let golsMarcados = 0;
  let golsSofridos = 0;
  let turnovers = 0;

  const allOurShots: Shot[] = [];
  const gameHistory: HeadToHeadSummary["gameHistory"] = [];

  opponentGames.forEach((g) => {
    const gameShots = shotsByGame[g.id] || [];
    allOurShots.push(...gameShots);

    const realShots = gameShots.filter((s) => s.result !== "perda" && !s.result.startsWith("cartao_") && !s.result.includes("2min"));
    const gMarcados = realShots.filter((s) => s.result === "gol").length;
    
    // Gols sofridos estimados pelas defesas do nosso goleiro e lances gravados
    const stats = computeStats(gameShots);
    const gSofridos = stats?.gols || 0;

    totalShots += realShots.length;
    golsMarcados += gMarcados;
    golsSofridos += gSofridos;
    turnovers += gameShots.filter((s) => s.result === "perda").length;

    gameHistory.push({
      id: g.id,
      game_date: g.game_date,
      team_name: g.team_name,
      opponent: g.opponent,
      competition: g.competition,
      category: g.category,
      golsMarcados: gMarcados,
      golsSofridos: gSofridos,
    });
  });

  const accuracy = totalShots > 0 ? (golsMarcados / totalShots) * 100 : 0;

  const shots9m = allOurShots.filter((s) => s.shot_type === "9m");
  const m9Accuracy = shots9m.length > 0 ? (shots9m.filter((s) => s.result === "gol").length / shots9m.length) * 100 : 0;

  const shots6m = allOurShots.filter((s) => s.shot_type === "6m");
  const m6Accuracy = shots6m.length > 0 ? (shots6m.filter((s) => s.result === "gol").length / shots6m.length) * 100 : 0;

  const shots7m = allOurShots.filter((s) => s.shot_type === "7m");
  const m7Accuracy = shots7m.length > 0 ? (shots7m.filter((s) => s.result === "gol").length / shots7m.length) * 100 : 0;

  const teamStats = computeStats(allOurShots);
  const gkDefesas = teamStats?.defesas || 0;
  const gkFaced = teamStats?.total || 0;
  const gkSaveRate = gkFaced > 0 ? (gkDefesas / gkFaced) * 100 : 0;

  // Sanções Disciplinares & Turnovers
  const exclusoes2min = allOurShots.filter((s) => s.result === "exclusao_2min" || s.result.includes("2min")).length;
  const cartoesAmarelos = allOurShots.filter((s) => s.result === "cartao_amarelo").length;
  const cartoesVermelhos = allOurShots.filter((s) => s.result === "cartao_vermelho").length;
  const cartoesAzuis = allOurShots.filter((s) => s.result === "cartao_azul").length;

  // Análise da origem dos arremessos do adversário (lances sofridos pela nossa defesa)
  const oppShots = allOurShots.filter((s) => s.result !== "perda" && !s.result.startsWith("cartao_") && !s.result.includes("2min"));
  const totalOppShots = oppShots.length || 1;

  const opp6m = oppShots.filter((s) => s.shot_type === "6m");
  const opp7m = oppShots.filter((s) => s.shot_type === "7m");
  const opp9m = oppShots.filter((s) => s.shot_type === "9m");

  const oppPontas = oppShots.filter((s) => s.position === "ponta_esq" || s.position === "ponta_dir");
  const oppArmacao = oppShots.filter((s) => s.position === "armador_esq" || s.position === "armador_cen" || s.position === "armador_dir");
  const oppPivo = oppShots.filter((s) => s.position === "pivo");

  const opponentDistances = {
    m6: { total: opp6m.length, gols: opp6m.filter((s) => s.result === "gol").length, percent: Math.round((opp6m.length / totalOppShots) * 100) },
    m7: { total: opp7m.length, gols: opp7m.filter((s) => s.result === "gol").length, percent: Math.round((opp7m.length / totalOppShots) * 100) },
    m9: { total: opp9m.length, gols: opp9m.filter((s) => s.result === "gol").length, percent: Math.round((opp9m.length / totalOppShots) * 100) },
  };

  const opponentPositions = {
    pontas: { total: oppPontas.length, gols: oppPontas.filter((s) => s.result === "gol").length, percent: Math.round((oppPontas.length / totalOppShots) * 100) },
    armacao: { total: oppArmacao.length, gols: oppArmacao.filter((s) => s.result === "gol").length, percent: Math.round((oppArmacao.length / totalOppShots) * 100) },
    pivo: { total: oppPivo.length, gols: oppPivo.filter((s) => s.result === "gol").length, percent: Math.round((oppPivo.length / totalOppShots) * 100) },
  };

  return {
    opponentName: selectedOpponent === "all" ? "Todos os Adversários" : selectedOpponent,
    selectedTeamName: selectedTeam,
    totalGames: opponentGames.length,
    totalShots,
    golsMarcados,
    golsSofridos,
    avgGolsMarcados: Math.round((golsMarcados / opponentGames.length) * 10) / 10,
    avgGolsSofridos: Math.round((golsSofridos / opponentGames.length) * 10) / 10,
    accuracy: Math.round(accuracy * 10) / 10,
    m9Accuracy: Math.round(m9Accuracy * 10) / 10,
    m6Accuracy: Math.round(m6Accuracy * 10) / 10,
    m7Accuracy: Math.round(m7Accuracy * 10) / 10,
    turnovers,
    avgTurnovers: Math.round((turnovers / opponentGames.length) * 10) / 10,
    exclusoes2min,
    cartoesAmarelos,
    cartoesVermelhos,
    cartoesAzuis,
    gkDefesas,
    gkSaveRate: Math.round(gkSaveRate * 10) / 10,
    opponentDistances,
    opponentPositions,
    opponentShots: allOurShots,
    ourShots: allOurShots,
    gameHistory,
  };
}
