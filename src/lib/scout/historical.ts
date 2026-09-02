import { computeStats, type Shot } from "./stats";

export interface GameMetricSummary {
  totalShots: number;
  gols: number;
  defesasAdversarias: number;
  travesFora: number;
  accuracy: number; // % acerto geral
  m9Accuracy: number; // % acerto nos 9m
  m6Accuracy: number; // % acerto nos 6m
  m7Accuracy: number; // % acerto nos 7m
  turnovers: number;
  gkDefesas: number;
  gkShotsFaced: number;
  gkSaveRate: number;
  yellowCards: number;
  twoMinPenalties: number;
  redBlueCards: number;
}

export interface PlayerMetricSummary {
  playerNumber: number;
  totalShots: number;
  gols: number;
  accuracy: number;
  m9Gols: number;
  m9Shots: number;
  m9Accuracy: number;
  m6Gols: number;
  m6Shots: number;
  m6Accuracy: number;
  m7Gols: number;
  m7Shots: number;
  m7Accuracy: number;
  assists: number;
  turnovers: number;
  twoMinPenalties: number;
  yellowCards: number;
  redBlueCards: number;
}

export function computeGameSummary(shots: Shot[]): GameMetricSummary {
  const safeShots = Array.isArray(shots) ? shots : [];
  const stats = computeStats(safeShots);

  const shotShots = safeShots.filter((s) => s.result !== "perda" && !s.result.startsWith("cartao_") && !s.result.includes("2min"));
  const totalShots = shotShots.length;
  const gols = shotShots.filter((s) => s.result === "gol").length;
  const accuracy = totalShots > 0 ? (gols / totalShots) * 100 : 0;

  // 9m
  const shots9m = safeShots.filter((s) => s.shot_type === "9m");
  const gols9m = shots9m.filter((s) => s.result === "gol").length;
  const m9Accuracy = shots9m.length > 0 ? (gols9m / shots9m.length) * 100 : 0;

  // 6m
  const shots6m = safeShots.filter((s) => s.shot_type === "6m");
  const gols6m = shots6m.filter((s) => s.result === "gol").length;
  const m6Accuracy = shots6m.length > 0 ? (gols6m / shots6m.length) * 100 : 0;

  // 7m
  const shots7m = safeShots.filter((s) => s.shot_type === "7m");
  const gols7m = shots7m.filter((s) => s.result === "gol").length;
  const m7Accuracy = shots7m.length > 0 ? (gols7m / shots7m.length) * 100 : 0;

  const turnovers = safeShots.filter((s) => s.result === "perda").length;
  const gkDefesas = stats?.defesas || 0;
  const gkShotsFaced = stats?.total || 0;
  const gkSaveRate = gkShotsFaced > 0 ? (gkDefesas / gkShotsFaced) * 100 : 0;

  const yellowCards = safeShots.filter((s) => s.result.includes("amarelo")).length;
  const twoMinPenalties = safeShots.filter((s) => s.result.includes("2min")).length;
  const redBlueCards = safeShots.filter((s) => s.result.includes("vermelho") || s.result.includes("azul")).length;

  return {
    totalShots,
    gols,
    defesasAdversarias: stats?.defesas || 0,
    travesFora: shotShots.filter((s) => s.result === "trave" || s.result === "fora").length,
    accuracy: Math.round(accuracy * 10) / 10,
    m9Accuracy: Math.round(m9Accuracy * 10) / 10,
    m6Accuracy: Math.round(m6Accuracy * 10) / 10,
    m7Accuracy: Math.round(m7Accuracy * 10) / 10,
    turnovers,
    gkDefesas,
    gkShotsFaced,
    gkSaveRate: Math.round(gkSaveRate * 10) / 10,
    yellowCards,
    twoMinPenalties,
    redBlueCards,
  };
}

export function computePlayerSummary(shots: Shot[], playerNum: number): PlayerMetricSummary {
  const safeShots = Array.isArray(shots) ? shots : [];
  const playerShots = safeShots.filter((s) => s.player_number === playerNum);

  const realShots = playerShots.filter((s) => s.result !== "perda" && !s.result.startsWith("cartao_") && !s.result.includes("2min"));
  const totalShots = realShots.length;
  const gols = realShots.filter((s) => s.result === "gol").length;
  const accuracy = totalShots > 0 ? (gols / totalShots) * 100 : 0;

  // 9m
  const p9m = playerShots.filter((s) => s.shot_type === "9m");
  const m9Gols = p9m.filter((s) => s.result === "gol").length;
  const m9Accuracy = p9m.length > 0 ? (m9Gols / p9m.length) * 100 : 0;

  // 6m
  const p6m = playerShots.filter((s) => s.shot_type === "6m");
  const m6Gols = p6m.filter((s) => s.result === "gol").length;
  const m6Accuracy = p6m.length > 0 ? (m6Gols / p6m.length) * 100 : 0;

  // 7m
  const p7m = playerShots.filter((s) => s.shot_type === "7m");
  const m7Gols = p7m.filter((s) => s.result === "gol").length;
  const m7Accuracy = p7m.length > 0 ? (m7Gols / p7m.length) * 100 : 0;

  const assists = safeShots.filter((s) => s.assist_number === playerNum).length;
  const turnovers = playerShots.filter((s) => s.result === "perda").length;
  const yellowCards = playerShots.filter((s) => s.result.includes("amarelo")).length;
  const twoMinPenalties = playerShots.filter((s) => s.result.includes("2min")).length;
  const redBlueCards = playerShots.filter((s) => s.result.includes("vermelho") || s.result.includes("azul")).length;

  return {
    playerNumber: playerNum,
    totalShots,
    gols,
    accuracy: Math.round(accuracy * 10) / 10,
    m9Gols,
    m9Shots: p9m.length,
    m9Accuracy: Math.round(m9Accuracy * 10) / 10,
    m6Gols,
    m6Shots: p6m.length,
    m6Accuracy: Math.round(m6Accuracy * 10) / 10,
    m7Gols,
    m7Shots: p7m.length,
    m7Accuracy: Math.round(m7Accuracy * 10) / 10,
    assists,
    turnovers,
    twoMinPenalties,
    yellowCards,
    redBlueCards,
  };
}

export function calculateDelta(valA: number, valB: number, isLowerBetter = false) {
  const diff = Math.round((valB - valA) * 10) / 10;
  const percentChange = valA !== 0 ? Math.round(((valB - valA) / valA) * 100) : valB > 0 ? 100 : 0;

  let status: "positive" | "negative" | "neutral" = "neutral";
  if (diff > 0) {
    status = isLowerBetter ? "negative" : "positive";
  } else if (diff < 0) {
    status = isLowerBetter ? "positive" : "negative";
  }

  return {
    diff,
    percentChange,
    status,
    formattedDiff: diff > 0 ? `+${diff}` : `${diff}`,
  };
}
