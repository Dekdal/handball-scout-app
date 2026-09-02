import { useState } from "react";
import { User, Target, Flame, Zap, AlertTriangle, ListFilter, Crosshair, BarChart3, Award, Shield, Layers, FileText, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { GoalMap } from "./GoalMap";
import { CourtMap } from "./CourtMap";
import { positionLabel, resultLabel, formattedResultLabel, RESULTS, POSITIONS, SHOT_TYPES, TACTICAL_PLAY_TYPES, type Zone } from "@/lib/scout/constants";
import { heatmapBy, type Shot } from "@/lib/scout/stats";
import { exportSinglePlayerPDF } from "@/lib/scout/exports";
import { cn } from "@/lib/utils";

type Props = {
  shots: Shot[];
  teamName: string;
  game?: any;
};

export function PlayerProfile({ shots, teamName, game }: Props) {
  const opponentName = game?.opponent || "Adversário";

  const [selectedTeam, setSelectedTeam] = useState<string>(teamName);

  // Lista de camisa de atletas do nosso time
  const ourPlayerNumbers = Array.from(
    new Set(
      shots
        .filter((s) => !s.possession_team || s.possession_team === teamName)
        .flatMap((s) => [s.player_number, s.assist_number])
        .filter((n): n is number => n != null)
    )
  ).sort((a, b) => a - b);

  // Lista de camisa de atletas do time adversário
  const oppPlayerNumbers = Array.from(
    new Set(
      shots
        .filter((s) => s.possession_team === opponentName)
        .flatMap((s) => [s.player_number, s.assist_number])
        .filter((n): n is number => n != null)
    )
  ).sort((a, b) => a - b);

  const activePlayerNumbers = selectedTeam === teamName ? ourPlayerNumbers : oppPlayerNumbers;

  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(
    activePlayerNumbers.length > 0 ? activePlayerNumbers[0] : null
  );

  const handleTeamChange = (team: string) => {
    setSelectedTeam(team);
    const newNumbers = team === teamName ? ourPlayerNumbers : oppPlayerNumbers;
    setSelectedPlayer(newNumbers.length > 0 ? newNumbers[0] : null);
  };

  const playerShots = shots.filter((s) => {
    const matchTeam = selectedTeam === teamName ? (!s.possession_team || s.possession_team === teamName) : s.possession_team === opponentName;
    return matchTeam && (s.player_number === selectedPlayer || s.assist_number === selectedPlayer);
  });

  const playerAttacks = playerShots.filter((s) => s.player_number === selectedPlayer);
  const playerAssists = playerShots.filter((s) => s.assist_number === selectedPlayer);

  const totalArremessos = playerAttacks.length;
  const totalGols = playerAttacks.filter((s) => s.result === "gol").length;
  const taxaEficiencia = totalArremessos > 0 ? Math.round((totalGols / totalArremessos) * 100) : 0;
  const totalPerdas = playerAttacks.filter((s) => s.result.startsWith("perda")).length;

  const playerHeatmapGeral = heatmapBy(playerAttacks, () => true);
  const playerHeatmapGols = heatmapBy(playerAttacks, (s) => s.result === "gol");

  const byTacticalPlay = TACTICAL_PLAY_TYPES.map((t) => {
    const list = playerAttacks.filter((s) => s.tactical_play === t.value);
    const total = list.length;
    const gols = list.filter((s) => s.result === "gol").length;
    const ef = total > 0 ? Math.round((gols / total) * 100) : 0;
    return { key: t.value, label: t.label, total, gols, eficiencia: ef };
  }).filter((t) => t.total > 0);

  return (
    <div className="space-y-6">
      
      {/* PAINEL SUPERIOR: SELEÇÃO DE EQUIPE E CAMISA */}
      <Card className="border-2 border-primary/20 bg-card">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary">Perfil Individual do Atleta</h2>
                <p className="text-xs text-muted-foreground">
                  Filtre o atleta por equipe e número para visualizar a eficiência, o mapa de arremessos no gol e o mapa de origem na meia-quadra.
                </p>
              </div>
            </div>

            {/* SELETOR DE EQUIPE */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border">
              <Button
                size="sm"
                variant={selectedTeam === teamName ? "default" : "ghost"}
                className={cn("text-xs font-bold h-8", selectedTeam === teamName && "shadow")}
                onClick={() => handleTeamChange(teamName)}
              >
                🛡️ {teamName}
              </Button>
              <Button
                size="sm"
                variant={selectedTeam === opponentName ? "destructive" : "ghost"}
                className={cn("text-xs font-bold h-8", selectedTeam === opponentName && "shadow")}
                onClick={() => handleTeamChange(opponentName)}
              >
                ⚠️ {opponentName}
              </Button>
            </div>

            {/* SELETOR DE CAMISAS */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-muted-foreground mr-1">Camisa:</span>
              {activePlayerNumbers.length === 0 ? (
                <span className="text-xs text-muted-foreground italic">Nenhum atleta nesta equipe</span>
              ) : (
                activePlayerNumbers.map((num) => (
                  <Button
                    key={num}
                    size="sm"
                    variant={selectedPlayer === num ? "default" : "outline"}
                    className={cn("font-bold font-mono h-8 px-2.5 text-xs", selectedPlayer === num && "ring-2 ring-accent")}
                    onClick={() => setSelectedPlayer(num)}
                  >
                    #{num}
                  </Button>
                ))
              )}
            </div>

            {/* BOTÃO DE BAIXAR PDF */}
            {selectedPlayer !== null && game && selectedTeam === teamName && (
              <Button
                size="sm"
                variant="default"
                className="h-8 font-bold text-xs bg-primary text-primary-foreground shadow"
                onClick={() => exportSinglePlayerPDF(game, shots, selectedPlayer)}
              >
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                PDF #{selectedPlayer}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedPlayer === null ? (
        <Card className="p-8 text-center text-muted-foreground">
          Selecione uma camisa de jogador acima para abrir a análise de desempenho.
        </Card>
      ) : (
        <div className="space-y-6">
          
          {/* CARDS DE RESUMO DO JOGADOR */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Gols Convertidos</p>
                  <h3 className="text-2xl font-black text-primary">{totalGols} / {totalArremessos}</h3>
                </div>
                <Award className="h-8 w-8 text-primary opacity-80" />
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-accent">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Aproveitamento (%)</p>
                  <h3 className="text-2xl font-black text-accent">{taxaEficiencia}%</h3>
                </div>
                <Flame className="h-8 w-8 text-accent opacity-80" />
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Assistências Efetuadas</p>
                  <h3 className="text-2xl font-black text-blue-600">{playerAssists.length}</h3>
                </div>
                <Zap className="h-8 w-8 text-blue-500 opacity-80" />
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Perdas de Bola (Turnover)</p>
                  <h3 className="text-2xl font-black text-orange-600">{totalPerdas}</h3>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500 opacity-80" />
              </CardContent>
            </Card>
          </div>

          {/* MAPA ESPACIAL 2D DE ORIGEM DOS ARREMESSO NA MEIA-QUADRA DO ATLETA */}
          <Card className="border-t-4 border-t-accent">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent" />
                Mapa Espacial de Origem dos Arremessos na Meia-Quadra ({selectedTeam} #{selectedPlayer})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-4">
              <CourtMap
                selectedPoint={null}
                onSelectPoint={() => {}}
                readOnly
                shots={playerAttacks.map((s) => ({
                  id: s.id,
                  x: s.shot_origin_x,
                  y: s.shot_origin_y,
                  result: s.result,
                  player_number: s.player_number ?? undefined,
                }))}
                size="lg"
              />
              <div className="flex items-center gap-4 mt-3 text-xs font-bold">
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-emerald-500 border border-white" /> Gol Convertido</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-500 border border-white" /> Defesa / Fora / Trave / Perda</span>
              </div>
            </CardContent>
          </Card>

          {/* OS MAPAS DE GOL DO JOGADOR */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
                <Crosshair className="h-5 w-5 text-accent" />
                Mapeamento dos Quadrantes do Gol ({selectedTeam} #{selectedPlayer})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 justify-center">
                    <Crosshair className="h-4 w-4 text-accent" />
                    <h4 className="text-xs font-extrabold uppercase text-primary">Todas as Finalizações</h4>
                  </div>
                  <GoalMap heat={playerHeatmapGeral} showCounts size="md" colorScheme="accent" heatLabel="finalizações" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 justify-center">
                    <Award className="h-4 w-4 text-emerald-600" />
                    <h4 className="text-xs font-extrabold uppercase text-emerald-600">Gols Convertidos</h4>
                  </div>
                  <GoalMap heat={playerHeatmapGols} showCounts size="md" colorScheme="emerald" heatLabel="gols" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* HISTÓRICO COMPLETO DE LANCES DO ATLETA */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
                <ListFilter className="h-5 w-5 text-accent" />
                Histórico Completo de Participações de #{selectedPlayer}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {playerShots.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Nenhum lance registrado para este atleta nesta partida.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead>Tempo Jogo</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Posição</TableHead>
                      <TableHead>Distância</TableHead>
                      <TableHead>Zona Gol</TableHead>
                      <TableHead>Coordenadas (X, Y)</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Observação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {playerShots.map((s) => {
                      const isAtletaAcao = s.player_number === selectedPlayer;
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-semibold text-xs text-primary">{s.period || "1º Tempo"}</TableCell>
                          <TableCell className="font-mono text-xs font-bold text-accent">{s.game_time}</TableCell>
                          <TableCell className="font-bold">
                            {isAtletaAcao ? "Arremesso / Ação" : `Assistência (para #${s.player_number})`}
                          </TableCell>
                          <TableCell>{positionLabel(s.position)}</TableCell>
                          <TableCell>{s.shot_type}</TableCell>
                          <TableCell className="font-mono font-bold">{s.zone}</TableCell>
                          <TableCell className="font-mono text-xs font-semibold text-accent">
                            {s.shot_origin_x != null && s.shot_origin_y != null ? `X:${s.shot_origin_x}% Y:${s.shot_origin_y}%` : "—"}
                          </TableCell>
                          <TableCell>
                            <span className={cn(
                              "rounded px-2 py-0.5 text-xs font-semibold",
                              RESULTS.find((r) => r.value === (s.result.startsWith("perda") ? "perda" : s.result))?.color || "bg-orange-600 text-white",
                            )}>
                              {formattedResultLabel(s)}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground italic">{s.notes || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
