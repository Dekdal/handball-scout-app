import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { computeHeadToHead } from "@/lib/scout/headToHead";
import { GoalMap } from "./GoalMap";
import { AiTacticalReport } from "./AiTacticalReport";
import { heatmapBy, type Shot } from "@/lib/scout/stats";
import { Swords, Trophy, Shield, Target, CalendarDays, ExternalLink, Activity, Sparkles, Compass, Layers, AlertTriangle, Timer, AlertOctagon } from "lucide-react";

interface Props {
  games: any[];
  shotsByGame: Record<string, Shot[]>;
  onGenerateAiAnalysis?: (h2hSummary: any) => void;
}

export function HeadToHeadDashboard({ games = [], shotsByGame = {}, onGenerateAiAnalysis }: Props) {
  // Extrair equipes e adversários
  const allTeams = Array.from(
    new Set(games.map((g) => g.team_name?.trim()).filter(Boolean))
  ).sort();

  const [selectedTeam, setSelectedTeam] = useState<string>("all");

  // Adversários filtrados pela equipe selecionada
  const filteredGamesForTeam = selectedTeam === "all"
    ? games
    : games.filter((g) => g.team_name?.trim().toLowerCase() === selectedTeam.trim().toLowerCase());

  const availableOpponents = Array.from(
    new Set(filteredGamesForTeam.map((g) => g.opponent?.trim()).filter(Boolean))
  ).sort();

  const [selectedOpponent, setSelectedOpponent] = useState<string>("all");

  const activeOpponent = selectedOpponent === "all" || availableOpponents.includes(selectedOpponent)
    ? selectedOpponent
    : "all";

  if (allTeams.length === 0 || filteredGamesForTeam.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center space-y-3">
          <Swords className="mx-auto h-12 w-12 text-muted-foreground opacity-40" />
          <h3 className="font-bold text-lg text-primary">Nenhum Adversário Encontrado</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Crie e registre partidas com adversários para desbloquear a análise Head-to-Head de confrontos diretos.
          </p>
        </CardContent>
      </Card>
    );
  }

  const h2h = computeHeadToHead(games, shotsByGame, activeOpponent, selectedTeam);

  if (!h2h) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhum dado encontrado para o confronto.
        </CardContent>
      </Card>
    );
  }

  const displayOpponentName = activeOpponent === "all" ? "Todos os Adversários" : activeOpponent;

  return (
    <div className="space-y-6">
      
      {/* SELEÇÃO DUPLA: MINHA EQUIPE E ADVERSÁRIO DE CONFRONTO DIRETO */}
      <Card className="border-l-4 border-l-purple-600 bg-purple-50/20 dark:bg-purple-950/20">
        <CardContent className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Swords className="h-6 w-6 text-purple-600" />
            <div>
              <h3 className="font-bold text-base text-primary">Head-to-Head (Confronto Direto)</h3>
              <p className="text-xs text-muted-foreground">Consolidado histórico de todas as partidas disputadas contra um rival específico ou todos os adversários.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* SELETOR DA MINHA EQUIPE */}
            <div className="flex items-center gap-1.5 bg-muted/60 p-1.5 rounded-lg border">
              <Shield className="h-4 w-4 text-emerald-600 ml-1" />
              <Label className="text-xs font-bold text-foreground">Minha Equipe:</Label>
              <select
                className="h-8 text-xs font-bold bg-background border border-input rounded-md px-2.5 py-1 focus:ring-1 focus:ring-purple-600 shadow-xs"
                value={selectedTeam}
                onChange={(e) => {
                  const team = e.target.value;
                  setSelectedTeam(team);
                  setSelectedOpponent("all");
                }}
              >
                <option value="all">Todas as Equipes</option>
                {allTeams.map((t) => (
                  <option key={t} value={t}>
                    Equipe: {t}
                  </option>
                ))}
              </select>
            </div>

            {/* SELETOR DO ADVERSÁRIO */}
            <div className="flex items-center gap-1.5 bg-muted/60 p-1.5 rounded-lg border">
              <Swords className="h-4 w-4 text-purple-600 ml-1" />
              <Label className="text-xs font-bold text-foreground">Adversário:</Label>
              <select
                className="h-8 text-xs font-bold bg-background border border-input rounded-md px-2.5 py-1 focus:ring-1 focus:ring-purple-600 shadow-xs"
                value={activeOpponent}
                onChange={(e) => setSelectedOpponent(e.target.value)}
              >
                <option value="all">Todos os Adversários ({filteredGamesForTeam.length} jogos)</option>
                {availableOpponents.map((opp) => (
                  <option key={opp} value={opp}>
                    vs {opp} ({filteredGamesForTeam.filter((g) => g.opponent === opp).length} jogos)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PAINEL DE IMPACTO DO CONFRONTO DIRETO */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-t-4 border-t-purple-600">
          <CardContent className="py-4">
            <span className="text-xs font-bold text-muted-foreground uppercase">Histórico de Partidas</span>
            <p className="font-display text-2xl font-bold text-primary mt-1">{h2h.totalGames} {h2h.totalGames === 1 ? "Jogo" : "Jogos"}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Confrontos Registrados</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-emerald-600">
          <CardContent className="py-4">
            <span className="text-xs font-bold text-muted-foreground uppercase">Média de Gols a Favor</span>
            <p className="font-display text-2xl font-bold text-emerald-600 mt-1">{h2h.avgGolsMarcados} <span className="text-xs text-muted-foreground">g/jogo</span></p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Total de {h2h.golsMarcados} gols marcados</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-red-600">
          <CardContent className="py-4">
            <span className="text-xs font-bold text-muted-foreground uppercase">Média de Gols Sofridos</span>
            <p className="font-display text-2xl font-bold text-red-600 mt-1">{h2h.avgGolsSofridos} <span className="text-xs text-muted-foreground">g/jogo</span></p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Total de {h2h.golsSofridos} gols tomados</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-accent">
          <CardContent className="py-4">
            <span className="text-xs font-bold text-muted-foreground uppercase">Eficiência nos 9 Metros (9m)</span>
            <p className="font-display text-2xl font-bold text-accent mt-1">{h2h.m9Accuracy}%</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Acerto de longa distância vs {displayOpponentName}</p>
          </CardContent>
        </Card>
      </div>

      {/* NOVO BLOCO: PERDAS DE BOLA (TURNOVERS) & SANÇÕES DISCIPLINARES (2MIN, CARTÕES) */}
      <Card className="border-t-4 border-t-amber-500 bg-amber-50/10 dark:bg-amber-950/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Perdas de Bola (Turnovers) & Sanções Disciplinares nos Confrontos
          </CardTitle>
          <CardDescription className="text-xs">Volume de erros técnicos, exclusões de 2 minutos e cartões acumulados contra {displayOpponentName}.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* TURNOVERS / PERDAS DE BOLA */}
            <div className="bg-background p-3 rounded-lg border flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 font-extrabold text-lg">
                🔄
              </div>
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Perdas de Bola</span>
                <p className="font-mono text-xl font-bold text-primary">{h2h.turnovers} <span className="text-xs font-normal text-muted-foreground">erros</span></p>
                <p className="text-[10px] text-muted-foreground">Média de {h2h.avgTurnovers} perdas/jogo</p>
              </div>
            </div>

            {/* EXCLUSÕES DE 2 MINUTOS */}
            <div className="bg-background p-3 rounded-lg border flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 font-extrabold text-lg">
                ⏱️
              </div>
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Exclusões (2 Min)</span>
                <p className="font-mono text-xl font-bold text-blue-600">{h2h.exclusoes2min} <span className="text-xs font-normal text-muted-foreground">punições</span></p>
                <p className="text-[10px] text-muted-foreground">Tempo em inferioridade</p>
              </div>
            </div>

            {/* CARTÕES AMARELOS */}
            <div className="bg-background p-3 rounded-lg border flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-yellow-100 dark:bg-yellow-950 text-yellow-600 font-extrabold text-lg">
                🟨
              </div>
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Cartões Amarelos</span>
                <p className="font-mono text-xl font-bold text-yellow-600">{h2h.cartoesAmarelos} <span className="text-xs font-normal text-muted-foreground">cartões</span></p>
                <p className="text-[10px] text-muted-foreground">Advertências de faltas</p>
              </div>
            </div>

            {/* CARTÕES VERMELHOS / AZUIS */}
            <div className="bg-background p-3 rounded-lg border flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-950 text-red-600 font-extrabold text-lg">
                🟥
              </div>
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Vermelhos / Azuis</span>
                <p className="font-mono text-xl font-bold text-red-600">{h2h.cartoesVermelhos + h2h.cartoesAzuis} <span className="text-xs font-normal text-muted-foreground">expulsões</span></p>
                <p className="text-[10px] text-muted-foreground">🟪 Azul: {h2h.cartoesAzuis} | 🟥 Vermelho: {h2h.cartoesVermelhos}</p>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* BLOCO: DE ONDE O ADVERSÁRIO MAIS ARREMASSA (POSIÇÃO & DISTÂNCIA 6M, 7M, 9M) */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* POR POSIÇÃO (ARMAÇÃO, PONTAS, PIVÔ) */}
        <Card className="border-t-4 border-t-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
              <Compass className="h-5 w-5 text-amber-500" />
              Origem dos Arremessos por Posição ({displayOpponentName})
            </CardTitle>
            <CardDescription className="text-xs">De qual setor da quadra os adversários mais finalizam contra nossa defesa.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setor / Posição Rival</TableHead>
                  <TableHead className="text-right">Total Arremessos</TableHead>
                  <TableHead className="text-right">Gols Cometidos</TableHead>
                  <TableHead className="text-right">Volume Relativo (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-bold text-primary">Armação (AE / AC / AD)</TableCell>
                  <TableCell className="text-right font-mono font-bold">{h2h.opponentPositions.armacao.total}</TableCell>
                  <TableCell className="text-right font-bold text-red-600">{h2h.opponentPositions.armacao.gols}</TableCell>
                  <TableCell className="text-right font-bold text-amber-600">{h2h.opponentPositions.armacao.percent}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-bold text-primary">Pontas (Ponta Esquerda / Direita)</TableCell>
                  <TableCell className="text-right font-mono font-bold">{h2h.opponentPositions.pontas.total}</TableCell>
                  <TableCell className="text-right font-bold text-red-600">{h2h.opponentPositions.pontas.gols}</TableCell>
                  <TableCell className="text-right font-bold text-amber-600">{h2h.opponentPositions.pontas.percent}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-bold text-primary">Pivô (Trabalho de 6m)</TableCell>
                  <TableCell className="text-right font-mono font-bold">{h2h.opponentPositions.pivo.total}</TableCell>
                  <TableCell className="text-right font-bold text-red-600">{h2h.opponentPositions.pivo.gols}</TableCell>
                  <TableCell className="text-right font-bold text-amber-600">{h2h.opponentPositions.pivo.percent}%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* POR DISTÂNCIA (6M, 7M, 9M) */}
        <Card className="border-t-4 border-t-purple-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-600" />
              Origem dos Arremessos por Distância (6m, 7m, 9m)
            </CardTitle>
            <CardDescription className="text-xs">Volume de arremessos por linha da quadra de handebol.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Distância de Arremesso</TableHead>
                  <TableHead className="text-right">Total Arremessos</TableHead>
                  <TableHead className="text-right">Gols Cometidos</TableHead>
                  <TableHead className="text-right">Volume Relativo (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-bold text-primary">6 Metros (6m - Infiltrações/Pontas/Pivô)</TableCell>
                  <TableCell className="text-right font-mono font-bold">{h2h.opponentDistances.m6.total}</TableCell>
                  <TableCell className="text-right font-bold text-red-600">{h2h.opponentDistances.m6.gols}</TableCell>
                  <TableCell className="text-right font-bold text-purple-600">{h2h.opponentDistances.m6.percent}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-bold text-primary">9 Metros (9m - Tiros de Longa Distância)</TableCell>
                  <TableCell className="text-right font-mono font-bold">{h2h.opponentDistances.m9.total}</TableCell>
                  <TableCell className="text-right font-bold text-red-600">{h2h.opponentDistances.m9.gols}</TableCell>
                  <TableCell className="text-right font-bold text-purple-600">{h2h.opponentDistances.m9.percent}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-bold text-primary">7 Metros (7m - Tiros Libres Diretos)</TableCell>
                  <TableCell className="text-right font-mono font-bold">{h2h.opponentDistances.m7.total}</TableCell>
                  <TableCell className="text-right font-bold text-red-600">{h2h.opponentDistances.m7.gols}</TableCell>
                  <TableCell className="text-right font-bold text-purple-600">{h2h.opponentDistances.m7.percent}%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>

      {/* MAPAS DE CALOR CONSOLIDADO DO CONFRONTO DIRETO */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-t-4 border-t-emerald-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-600" />
              Onde Nossa Equipe mais Marcou Gols vs {displayOpponentName}
            </CardTitle>
            <CardDescription className="text-xs">Consolidado dos quadrantes mais vulneráveis da defesa rival.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <GoalMap heat={heatmapBy(h2h.ourShots, (s) => s.result === "gol")} showCounts colorScheme="emerald" />
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-red-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Onde {displayOpponentName} mais Marcou Gols contra Nossa Defesa
            </CardTitle>
            <CardDescription className="text-xs">Consolidado dos setores onde sofremos perigo histórico.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <GoalMap heat={heatmapBy(h2h.opponentShots, (s) => s.result === "gol")} showCounts colorScheme="destructive" />
          </CardContent>
        </Card>
      </div>

      {/* GERADOR DE ANÁLISE TÁTICA ULTRA-DETALHADA COM IA */}
      <AiTacticalReport h2h={h2h} />

      {/* HISTÓRICO DE PARTIDAS CONTRA O RIVAL */}
      <Card className="border-t-4 border-t-purple-600">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-purple-600" />
            Histórico das Partidas vs {displayOpponentName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data da Partida</TableHead>
                <TableHead>Competição / Categoria</TableHead>
                <TableHead>Nossa Equipe</TableHead>
                <TableHead>Adversário</TableHead>
                <TableHead className="text-right">Placar do Scout</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {h2h.gameHistory.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-mono text-xs font-bold text-primary">
                    {new Date(g.game_date + "T00:00").toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-xs">
                    {g.competition || "—"} {g.category ? `(${g.category})` : ""}
                  </TableCell>
                  <TableCell className="font-semibold text-emerald-600">{g.team_name}</TableCell>
                  <TableCell className="font-semibold text-red-600">{g.opponent}</TableCell>
                  <TableCell className="text-right font-mono font-extrabold text-sm">
                    <span className="text-emerald-600">{g.golsMarcados}</span> - <span className="text-red-600">{g.golsSofridos}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="xs" variant="outline" className="font-bold border-purple-300 text-purple-900 hover:bg-purple-600 hover:text-white">
                      <Link to="/app/game/$gameId" params={{ gameId: g.id }}>
                        Abrir Scout <ExternalLink className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
