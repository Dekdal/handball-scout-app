import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import type { Shot } from "./stats";
import {
  computeStats,
  statsByShotType,
  statsByPosition,
  computePlayerLeaderboard,
  computeTacticalPlayStats,
  computeTurnoverStats,
  computeNumericalStatusStats,
  computeGoalkeeperProfiles,
  statsByGoalkeeperSector,
  heatmapBy,
} from "./stats";
import { positionLabel, resultLabel, formattedResultLabel, SHOT_TYPES, POSITIONS, TACTICAL_PLAY_TYPES, ZONES, type Zone } from "./constants";

type Game = {
  team_name: string;
  opponent: string;
  game_date: string;
  goalkeeper_name: string;
  competition?: string | null;
  category?: string | null;
};

function rowsForBaseEventos(game: Game, shots: Shot[]) {
  return shots.map((s) => {
    const isGoal = s.result === "gol";
    const isSave = s.result === "defesa";
    const avaliacao = isGoal ? "Sucesso" : isSave ? "Erro" : "Neutro";
    return {
      Partida: `${game.team_name} vs ${game.opponent}`,
      Periodo: s.period || "1º Tempo",
      Tempo: s.game_time ?? "00:00",
      Equipe: s.possession_team || game.team_name,
      Setor: s.sector || "Ataque",
      Gol_Jogador: s.player_number ?? "",
      Assistencia: s.assist_number ?? "",
      Jogada: positionLabel(s.position) || s.shot_type || "Arremesso",
      Resultado: formattedResultLabel(s),
      Avaliacao: avaliacao,
      Quadrante_Gol: s.zone,
      Goleiro_Em_Quadra: s.goalkeeper_name || game.goalkeeper_name,
      Observacao: s.notes || "",
    };
  });
}

// RENDERIZADOR DE MAPAS DO GOL 3X3 PARA PDF (ALINHAMENTO E CORES PERFEITAS)
function drawGoalGrid(
  doc: jsPDF,
  title: string,
  counts: Partial<Record<Zone, number>>,
  startY: number,
  marginLeft = 14,
  colorType: "accent" | "emerald" | "blue" | "purple" | "destructive" = "accent"
) {
  const max = Math.max(1, ...Object.values(counts));

  const getBgAndText = (v: number): { bg: [number, number, number]; text: [number, number, number] } => {
    if (v === 0) return { bg: [248, 250, 252], text: [30, 41, 59] };
    const pct = Math.min(1, Math.max(0.15, v / max));

    let tr = 230, tg = 57, tb = 70;
    if (colorType === "emerald") { tr = 16; tg = 185; tb = 129; }
    else if (colorType === "destructive") { tr = 239; tg = 68; tb = 68; }
    else if (colorType === "blue") { tr = 59; tg = 130; tb = 246; }
    else if (colorType === "purple") { tr = 147; tg = 51; tb = 234; }

    const r = Math.round(255 * (1 - pct) + tr * pct);
    const g = Math.round(255 * (1 - pct) + tg * pct);
    const b = Math.round(255 * (1 - pct) + tb * pct);

    const textCol: [number, number, number] = pct > 0.45 ? [255, 255, 255] : [15, 23, 42];
    return { bg: [r, g, b], text: textCol };
  };

  doc.setFontSize(10);
  doc.setTextColor(14, 42, 71);
  doc.text(title, marginLeft, startY);

  const zNames = [
    ["A1", "A2", "A3"],
    ["B1", "B2", "B3"],
    ["C1", "C2", "C3"],
  ];

  const gridData = zNames.map((row) =>
    row.map((z) => `${z}\n(${counts[z as Zone] || 0})`)
  );

  autoTable(doc, {
    startY: startY + 4,
    tableWidth: 55,
    margin: { left: marginLeft },
    body: gridData,
    theme: "grid",
    styles: {
      halign: "center",
      valign: "middle",
      fontSize: 8,
      cellPadding: 4,
      fontStyle: "bold",
      minCellHeight: 12,
    },
    didParseCell: (data) => {
      const r = data.row.index;
      const c = data.column.index;
      if (r >= 0 && r < 3 && c >= 0 && c < 3) {
        const z = zNames[r][c] as Zone;
        const val = counts[z] || 0;
        const { bg, text } = getBgAndText(val);
        data.cell.styles.fillColor = bg;
        data.cell.styles.textColor = text;
      }
    },
  });

  return (doc as any).lastAutoTable.finalY;
}

export function exportCSV(game: Game, shots: Shot[]) {
  const rows = rowsForBaseEventos(game, shots);
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  download(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename(game, "csv"));
  toast.success("Planilha CSV baixada!");
}

export function exportXLSX(game: Game, shots: Shot[]) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsForBaseEventos(game, shots)), "Base_Eventos");

  const stats = computeStats(shots);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([
      { Métrica: "Total de arremessos", Valor: stats.total },
      { Métrica: "Defesas", Valor: stats.defesas },
      { Métrica: "Gols sofridos", Valor: stats.gols },
      { Métrica: "Trave", Valor: stats.trave },
      { Métrica: "Fora", Valor: stats.fora },
      { Métrica: "Eficiência (%)", Valor: stats.eficiencia.toFixed(1) },
    ]),
    "Resumo",
  );

  XLSX.writeFile(wb, filename(game, "xlsx"));
  toast.success("Arquivo Excel (.xlsx) baixado!");
}

// 1. PDF COMPLETO DA PARTIDA (GERAL)
export function exportPDF(game: Game, shots: Shot[]) {
  const toastId = toast.loading("Gerando Relatório PDF Completo da Partida...");
  try {
    const doc = new jsPDF();
    const stats = computeStats(shots);
    const leaderboard = computePlayerLeaderboard(shots, game.team_name);
    const tacticalPlayStats = computeTacticalPlayStats(shots, game.team_name);
    const turnoverStats = computeTurnoverStats(shots, game.team_name);
    const numericalStats = computeNumericalStatusStats(shots, game.team_name, game.opponent);

    // PÁGINA 1: CAPA & RESUMO ESTATÍSTICO GERAL
    doc.setFontSize(18);
    doc.setTextColor(14, 42, 71);
    doc.text("Relatório Tático Completo de Partida — Scout Handebol", 14, 16);

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(
      [
        `Partida: ${game.team_name} vs ${game.opponent}`,
        `Data: ${new Date(game.game_date + "T00:00").toLocaleDateString("pt-BR")}`,
        `Goleiro Titular: ${game.goalkeeper_name}`,
        game.competition ? `Competição: ${game.competition}` : "",
        game.category ? `Categoria: ${game.category}` : "",
      ]
        .filter(Boolean)
        .join("  |  "),
      14,
      24,
    );

    autoTable(doc, {
      startY: 30,
      head: [["Métrica Coletiva", "Valor"]],
      body: [
        ["Total de Oportunidades de Arremesso", String(stats.total)],
        ["Defesas Realizadas pelos Goleiros", String(stats.defesas)],
        ["Gols Marcados / Sofridos", String(stats.gols)],
        ["Bolas na Trave", String(stats.trave)],
        ["Bolas para Fora", String(stats.fora)],
        ["Taxa de Eficiência Geral de Ataque (%)", `${stats.eficiencia.toFixed(1)}%`],
      ],
      headStyles: { fillColor: [14, 42, 71] },
    });

    // MAPAS DO GOL COLETIVOS DA EQUIPE NO PDF GERAL
    const teamGolsHeat = heatmapBy(shots, (s) => s.result === "gol");
    const teamDefesasHeat = heatmapBy(shots, (s) => s.result === "defesa");
    const teamTotalHeat = heatmapBy(shots);

    const startYGrid = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(14, 42, 71);
    doc.text("Mapeamento do Gol Coletivo da Equipe (Grid 3x3)", 14, startYGrid);

    drawGoalGrid(doc, "Todas as Finalizações", teamTotalHeat, startYGrid + 6, 14, "accent");
    drawGoalGrid(doc, "Gols Marcados", teamGolsHeat, startYGrid + 6, 75, "emerald");
    drawGoalGrid(doc, "Defesas Sofridas", teamDefesasHeat, startYGrid + 6, 136, "blue");

    // PÁGINA 2: TÁTICA, TURNOVERS E 2 MINUTOS
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(14, 42, 71);
    doc.text("Análise Tática de Jogadas & Perdas de Bola (Turnovers)", 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [["Estrutura Tática de Jogada", "Oportunidades", "Gols", "Efetividade (%)"]],
      body: tacticalPlayStats.map((r) => [r.label, String(r.oportunidades), String(r.convertidos), `${r.efetividade}%`]),
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.setFontSize(12);
    doc.setTextColor(14, 42, 71);
    doc.text("Detalhamento de Perdas de Posse de Bola (Turnovers)", 14, (doc as any).lastAutoTable.finalY + 10);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 14,
      head: [["Motivo da Perda", "Quantidade", "Proporção (%)"]],
      body: turnoverStats.map((r) => [r.label, String(r.count), `${r.pct}%`]),
      headStyles: { fillColor: [220, 38, 38] },
    });

    doc.setFontSize(12);
    doc.setTextColor(14, 42, 71);
    doc.text("Desempenho por Estado Numérico (Exclusões de 2 Minutos)", 14, (doc as any).lastAutoTable.finalY + 10);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 14,
      head: [["Estado Numérico", "Oportunidades", "Gols Marcados", "Efetividade (%)"]],
      body: [
        ["Igualdade (6x6)", String(numericalStats.nossoTime.igualdade.oportunidades), String(numericalStats.nossoTime.igualdade.gols), `${numericalStats.nossoTime.igualdade.efetividade}%`],
        ["Superioridade (6x5)", String(numericalStats.nossoTime.superioridade.oportunidades), String(numericalStats.nossoTime.superioridade.gols), `${numericalStats.nossoTime.superioridade.efetividade}%`],
        ["Inferioridade (5x6)", String(numericalStats.nossoTime.inferioridade.oportunidades), String(numericalStats.nossoTime.inferioridade.gols), `${numericalStats.nossoTime.inferioridade.efetividade}%`],
      ],
      headStyles: { fillColor: [147, 51, 234] },
    });

    doc.save(filename(game, "pdf"));
    toast.success("PDF Completo baixado com sucesso!", { id: toastId });
  } catch (err: any) {
    console.error("Erro no PDF:", err);
    toast.error("Erro ao gerar PDF: " + (err?.message || "Tente novamente"), { id: toastId });
  }
}

// 2. EXPORTAR DOSSIÊ COMPLETO E 100% DETALHADO DO ATLETA (MULTI-PÁGINA COM CARDS, MAPAS 3X3, PENAIS 7M, TABELAS E TIMELINE)
export function exportSinglePlayerPDF(game: Game, shots: Shot[], playerNumber: number) {
  const toastId = toast.loading(`Gerando Dossiê Completo do Atleta #${playerNumber}...`);
  try {
    const doc = new jsPDF();
    const playerShots = shots.filter((s) => s.player_number === playerNumber || s.assist_number === playerNumber);
    const arremessosAutor = shots.filter((s) => s.player_number === playerNumber && (!s.possession_team || s.possession_team === game.team_name));

    const gols = arremessosAutor.filter((s) => s.result === "gol").length;
    const assistencias = shots.filter((s) => s.assist_number === playerNumber && s.result === "gol").length;
    const pseudoAssistencias = shots.filter((s) => s.assist_number === playerNumber && (s.is_pseudo_assist || s.result === "defesa" || s.result === "trave" || s.result === "fora")).length;
    const perdas = shots.filter((s) => s.player_number === playerNumber && s.result === "perda").length;
    const totalArremessos = arremessosAutor.length;
    const ef = totalArremessos > 0 ? ((gols / totalArremessos) * 100).toFixed(1) : "0.0";

    const arremessos7m = arremessosAutor.filter((s) => s.tactical_play === "7m");
    const gols7m = arremessos7m.filter((s) => s.result === "gol").length;
    const ef7m = arremessos7m.length > 0 ? ((gols7m / arremessos7m.length) * 100).toFixed(1) : "0.0";

    // HEATMAPS DO ATLETA
    const heatGeral = heatmapBy(arremessosAutor);
    const heatGols = heatmapBy(arremessosAutor, (s) => s.result === "gol");
    const heatDef = heatmapBy(arremessosAutor, (s) => s.result === "defesa");
    const heat7m = heatmapBy(arremessos7m);

    // PÁGINA 1: CABEÇALHO + CARDS DE DESEMPENHO + MAPAS DO GOL 3X3
    doc.setFontSize(16);
    doc.setTextColor(14, 42, 71);
    doc.text(`Dossiê Individual de Desempenho — Camisa #${playerNumber}`, 14, 16);

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(
      [
        `Atleta: Camisa #${playerNumber}`,
        `Equipe: ${game.team_name}`,
        `Adversário: ${game.opponent}`,
        `Data: ${new Date(game.game_date + "T00:00").toLocaleDateString("pt-BR")}`,
      ].join("  |  "),
      14,
      24,
    );

    // Tabela 1: Cards e Indicadores de Desempenho do Jogador
    autoTable(doc, {
      startY: 30,
      head: [["Indicador de Desempenho do Atleta", "Resultado Registrado"]],
      body: [
        ["Gols Marcados / Total Arremessos", `${gols} de ${totalArremessos} arremessos (${ef}% de eficiência)`],
        ["Cobranças de Tiro Livre 7m (Penais)", `${gols7m} de ${arremessos7m.length} cobranças (${ef7m}% de conversão)`],
        ["Assistências Diretas para Gol", `${assistencias} passes decisivos convertidos`],
        ["Pseudo-Assistências (Chances Claras Criadas)", `${pseudoAssistencias} bolas deixadas cara a cara`],
        ["Perdas de Posse de Bola (Turnovers)", `${perdas} perdas registradas`],
      ],
      headStyles: { fillColor: [14, 42, 71] },
    });

    // MAPAS DO GOL 3X3 (TODAS FINALIZAÇÕES, GOLS E DEFESAS SOFRIDAS)
    let yMap = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(14, 42, 71);
    doc.text("Mapeamento das Finalizações no Gol (Grids 3x3)", 14, yMap);

    drawGoalGrid(doc, "Onde Mais Finaliza", heatGeral, yMap + 6, 14, "accent");
    drawGoalGrid(doc, "Onde Faz Mais Gols", heatGols, yMap + 6, 75, "emerald");
    drawGoalGrid(doc, "Defesas Sofridas", heatDef, yMap + 6, 136, "blue");

    let nextY = yMap + 54;
    if (arremessos7m.length > 0) {
      drawGoalGrid(doc, "Penais 7m (Exclusivo)", heat7m, nextY + 4, 14, "purple");
      nextY += 54;
    }

    // PÁGINA 2: ESTRUTURA TÁTICA, LINHA 6M/7M/9M, POSIÇÕES E HISTÓRICO COMPLETO
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(14, 42, 71);
    doc.text(`Análise Tática e Histórico de Lances — Camisa #${playerNumber}`, 14, 16);

    // Tabela por Estrutura Tática de Jogada
    const byTactical = TACTICAL_PLAY_TYPES.map((t) => {
      const sub = arremessosAutor.filter((s) => s.tactical_play === t.value);
      const subGols = sub.filter((s) => s.result === "gol").length;
      const subEf = sub.length > 0 ? (subGols / sub.length) * 100 : 0;
      return [t.label, String(sub.length), String(subGols), `${subEf.toFixed(0)}%`];
    }).filter((r) => Number(r[1]) > 0);

    autoTable(doc, {
      startY: 22,
      head: [["Estrutura Tática da Jogada", "Finalizações", "Gols Marcados", "Efetividade (%)"]],
      body: byTactical.length > 0 ? byTactical : [["Sem jogadas específicas registradas", "0", "0", "0%"]],
      headStyles: { fillColor: [37, 99, 235] },
    });

    // Tabela por Distância da Linha de Arremesso (6m, 7m, 9m)
    const byDist = SHOT_TYPES.map((t) => {
      const sub = arremessosAutor.filter((s) => s.shot_type === t.value);
      const subGols = sub.filter((s) => s.result === "gol").length;
      const subEf = sub.length > 0 ? (subGols / sub.length) * 100 : 0;
      return [t.label, String(sub.length), String(subGols), `${subEf.toFixed(0)}%`];
    });

    doc.setFontSize(12);
    doc.setTextColor(14, 42, 71);
    doc.text("Desempenho por Distância da Linha de Arremesso (6m, 7m, 9m)", 14, (doc as any).lastAutoTable.finalY + 10);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 14,
      head: [["Distância da Linha", "Finalizações", "Gols Marcados", "Efetividade (%)"]],
      body: byDist,
      headStyles: { fillColor: [16, 185, 129] },
    });

    // Tabela de Histórico de Lances do Atleta com o motivo da perda formatado
    const historyRows = playerShots.map((s) => {
      const isAuthor = s.player_number === playerNumber;
      const papel = isAuthor ? "Autor" : "Assistente";
      return [
        s.game_time || "—",
        papel,
        positionLabel(s.position) || "—",
        s.shot_type || "—",
        s.zone || "—",
        formattedResultLabel(s),
        s.notes || "—",
      ];
    });

    doc.setFontSize(12);
    doc.setTextColor(14, 42, 71);
    doc.text("Histórico Completo de Participações e Lances do Atleta", 14, (doc as any).lastAutoTable.finalY + 10);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 14,
      head: [["Tempo", "Papel", "Posição", "Linha", "Zona", "Resultado / Motivo Perda", "Observação"]],
      body: historyRows.length > 0 ? historyRows : [["—", "—", "—", "—", "—", "—", "Sem lances"]],
      headStyles: { fillColor: [14, 42, 71] },
      styles: { fontSize: 8 },
    });

    doc.save(`dossie_atleta_camisa_${playerNumber}_${game.game_date}.pdf`);
    toast.success(`Dossiê em PDF do Atleta #${playerNumber} baixado com sucesso!`, { id: toastId });
  } catch (err: any) {
    console.error("Erro no PDF do atleta:", err);
    toast.error("Erro ao gerar PDF do atleta: " + (err?.message || "Tente novamente"), { id: toastId });
  }
}

// 3. EXPORTAR DOSSIÊ COMPLETO DO GOLEIRO (MULTI-PÁGINA COM CARDS, BALIZAS 3X3, ESTRUTURA TÁTICA E ORIGEM DA QUADRA)
export function exportSingleGoalkeeperPDF(game: Game, shots: Shot[], goalkeeperName: string) {
  const toastId = toast.loading(`Gerando Dossiê Completo do Goleiro (${goalkeeperName})...`);
  try {
    const doc = new jsPDF();
    const gkShots = shots.filter((s) => s.goalkeeper_name === goalkeeperName);
    const total = gkShots.length;
    const defesas = gkShots.filter((s) => s.result === "defesa").length;
    const gols = gkShots.filter((s) => s.result === "gol").length;
    const trave = gkShots.filter((s) => s.result === "trave").length;
    const fora = gkShots.filter((s) => s.result === "fora").length;
    const ef = total > 0 ? ((defesas / total) * 100).toFixed(1) : "0.0";

    doc.setFontSize(16);
    doc.setTextColor(14, 42, 71);
    doc.text(`Dossiê Individual de Desempenho — Goleiro: ${goalkeeperName}`, 14, 16);

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(
      [
        `Goleiro: ${goalkeeperName}`,
        `Equipe: ${game.team_name}`,
        `Adversário: ${game.opponent}`,
        `Data: ${new Date(game.game_date + "T00:00").toLocaleDateString("pt-BR")}`,
      ].join("  |  "),
      14,
      24,
    );

    autoTable(doc, {
      startY: 30,
      head: [["Métrica do Goleiro", "Valor Registrado"]],
      body: [
        ["Arremessos Enfrentados em Quadra", String(total)],
        ["Defesas Realizadas", String(defesas)],
        ["Gols Sofridos", String(gols)],
        ["Bolas na Trave", String(trave)],
        ["Bolas para Fora", String(fora)],
        ["Taxa Geral de Defesa (% Save Rate)", `${ef}%`],
      ],
      headStyles: { fillColor: [16, 185, 129] },
    });

    // MAPAS DO GOL DO GOLEIRO NO PDF
    const heatAll = heatmapBy(gkShots);
    const heatDef = heatmapBy(gkShots, (s) => s.result === "defesa");
    const heatGol = heatmapBy(gkShots, (s) => s.result === "gol");

    const yMap = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(14, 42, 71);
    doc.text("Mapeamento do Gol da Baliza (Grid 3x3 A1..C3)", 14, yMap);

    drawGoalGrid(doc, "Arremessos Sofridos", heatAll, yMap + 6, 14, "accent");
    drawGoalGrid(doc, "Defesas Realizadas", heatDef, yMap + 6, 75, "emerald");
    drawGoalGrid(doc, "Gols Sofridos", heatGol, yMap + 6, 136, "destructive");

    // PÁGINA 2: TÁTICA ENFRENTADA E ORIGEM DA QUADRA
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(14, 42, 71);
    doc.text(`Análise Detalhada da Defesa — Goleiro: ${goalkeeperName}`, 14, 16);

    // Tabela por Estrutura Tática Enfrentada pelo Goleiro
    const byGoalkeeperTactical = TACTICAL_PLAY_TYPES.map((t) => {
      const subset = gkShots.filter((s) => s.tactical_play === t.value);
      const subTotal = subset.length;
      const subDef = subset.filter((s) => s.result === "defesa").length;
      const subGols = subset.filter((s) => s.result === "gol").length;
      const subEf = subTotal > 0 ? (subDef / subTotal) * 100 : 0;
      return [t.label, String(subTotal), String(subDef), String(subGols), `${subEf.toFixed(0)}%`];
    }).filter((r) => Number(r[1]) > 0);

    autoTable(doc, {
      startY: 22,
      head: [["Estrutura Tática Enfrentada", "Arremessos", "Defesas", "Gols Sofridos", "Taxa de Defesa (%)"]],
      body: byGoalkeeperTactical.length > 0 ? byGoalkeeperTactical : [["Sem jogadas específicas", "0", "0", "0", "0%"]],
      headStyles: { fillColor: [37, 99, 235] },
    });

    // Tabela por Setor de Origem da Quadra
    const bySector = statsByGoalkeeperSector(shots, goalkeeperName);

    doc.setFontSize(12);
    doc.setTextColor(14, 42, 71);
    doc.text("Arremessos Sofridos por Setor de Origem da Quadra", 14, (doc as any).lastAutoTable.finalY + 10);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 14,
      head: [["Setor da Quadra", "Arremessos Sofridos", "Defesas Realizadas", "Gols Sofridos", "Taxa de Defesa (%)"]],
      body: bySector.map((s) => [s.label, String(s.total), String(s.defesas), String(s.gols), `${s.eficiencia}%`]),
      headStyles: { fillColor: [14, 42, 71] },
    });

    doc.save(`dossie_goleiro_${goalkeeperName.replace(/[^a-z0-9-_]+/gi, "_")}_${game.game_date}.pdf`);
    toast.success(`Dossiê em PDF do Goleiro ${goalkeeperName} baixado com sucesso!`, { id: toastId });
  } catch (err: any) {
    console.error("Erro no PDF do goleiro:", err);
    toast.error("Erro ao gerar PDF do goleiro: " + (err?.message || "Tente novamente"), { id: toastId });
  }
}

function filename(game: Game, ext: string) {
  const date = game.game_date;
  const safe = (s: string) => s.replace(/[^a-z0-9-_]+/gi, "-");
  return `relatorio_scout_completo_${safe(game.team_name)}_vs_${safe(game.opponent)}_${date}.${ext}`;
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
