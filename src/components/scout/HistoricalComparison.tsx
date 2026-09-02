import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { computeGameSummary, computePlayerSummary, calculateDelta, type GameMetricSummary, type PlayerMetricSummary } from "@/lib/scout/historical";
import type { Shot } from "@/lib/scout/stats";
import { TrendingUp, TrendingDown, Minus, ArrowRight, Trophy, Users, User, ShieldAlert, BarChart3, Shield } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { cn } from "@/lib/utils";

interface Props {
  games: any[];
  shotsByGame: Record<string, Shot[]>;
}

function DeltaBadge({ delta, isPercent = false, unit = "" }: { delta: ReturnType<typeof calculateDelta>; isPercent?: boolean; unit?: string }) {
  const isPositive = delta.status === "positive";
  const isNegative = delta.status === "negative";

  const colorClass = isPositive
    ? "bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-emerald-950 dark:text-emerald-200 font-extrabold"
    : isNegative
    ? "bg-red-100 text-red-900 border-red-400 dark:bg-red-950 dark:text-red-200 font-extrabold"
    : "bg-muted text-muted-foreground border-border font-bold";

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border shadow-2xs", colorClass)}>
      <Icon className="h-3.5 w-3.5" />
      <span>{delta.formattedDiff}{isPercent ? "%" : unit}</span>
      {delta.percentChange !== 0 && (
        <span className="text-[10px] opacity-80">({delta.percentChange > 0 ? `+${delta.percentChange}%` : `${delta.percentChange}%`})</span>
      )}
    </span>
  );
}

export function HistoricalComparison({ games = [], shotsByGame = {} }: Props) {
  if (games.length < 2) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center space-y-3">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground opacity-40" />
          <h3 className="font-bold text-lg text-primary">Comparação Histórica Indisponível</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Você precisa ter pelo menos **2 partidas registradas** na temporada para gerar os relatórios de evolução e comparação atleta a atleta.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Extrair nomes únicos de equipes (ex: UFAL, NOBRE, etc.)
  const uniqueTeams = Array.from(new Set(games.map((g) => g.team_name).filter(Boolean)));
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("all");

  const filteredGamesForTeam = selectedTeamFilter === "all"
    ? games
    : games.filter((g) => g.team_name === selectedTeamFilter);

  const [gameAId, setGameAId] = useState<string>(filteredGamesForTeam[1]?.id || filteredGamesForTeam[0]?.id || games[0].id);
  const [gameBId, setGameBId] = useState<string>(filteredGamesForTeam[0]?.id || games[0].id);
  const [activeSubTab, setActiveSubTab] = useState<"team" | "player">("team");
  const [selectedPlayerNum, setSelectedPlayerNum] = useState<number | null>(null);

  const gameA = games.find((g) => g.id === gameAId) || filteredGamesForTeam[0] || games[0];
  const gameB = games.find((g) => g.id === gameBId) || filteredGamesForTeam[0] || games[0];

  const shotsA = shotsByGame[gameA.id] || [];
  const shotsB = shotsByGame[gameB.id] || [];

  const summaryA = computeGameSummary(shotsA);
  const summaryB = computeGameSummary(shotsB);

  // Extrair números de atletas presentes nos dois jogos
  const allPlayerNumbers = Array.from(
    new Set([
      ...shotsA.map((s) => s.player_number).filter((n): n is number => Boolean(n)),
      ...shotsB.map((s) => s.player_number).filter((n): n is number => Boolean(n)),
    ])
  ).sort((a, b) => a - b);

  const activePlayerNum = selectedPlayerNum !== null ? selectedPlayerNum : allPlayerNumbers[0] || 10;

  const playerA = computePlayerSummary(shotsA, activePlayerNum);
  const playerB = computePlayerSummary(shotsB, activePlayerNum);

  // Deltas da Equipe
  const deltaAccuracy = calculateDelta(summaryA.accuracy, summaryB.accuracy);
  const delta9m = calculateDelta(summaryA.m9Accuracy, summaryB.m9Accuracy);
  const delta6m = calculateDelta(summaryA.m6Accuracy, summaryB.m6Accuracy);
  const delta7m = calculateDelta(summaryA.m7Accuracy, summaryB.m7Accuracy);
  const deltaTurnovers = calculateDelta(summaryA.turnovers, summaryB.turnovers, true); // Menos perdas = Melhor
  const deltaGkSave = calculateDelta(summaryA.gkSaveRate, summaryB.gkSaveRate);

  // Deltas do Atleta Selecionado
  const pDeltaGols = calculateDelta(playerA.gols, playerB.gols);
  const pDeltaAccuracy = calculateDelta(playerA.accuracy, playerB.accuracy);
  const pDelta9m = calculateDelta(playerA.m9Accuracy, playerB.m9Accuracy);
  const pDelta6m = calculateDelta(playerA.m6Accuracy, playerB.m6Accuracy);
  const pDeltaAssists = calculateDelta(playerA.assists, playerB.assists);
  const pDeltaTurnovers = calculateDelta(playerA.turnovers, playerB.turnovers, true);

  // Dados para o Gráfico Recharts de Comparação
  const chartData = [
    { metric: "Aproveitamento Geral (%)", [gameA.opponent]: summaryA.accuracy, [gameB.opponent]: summaryB.accuracy },
    { metric: "Acerto 9m (%)", [gameA.opponent]: summaryA.m9Accuracy, [gameB.opponent]: summaryB.m9Accuracy },
    { metric: "Acerto 6m (%)", [gameA.opponent]: summaryA.m6Accuracy, [gameB.opponent]: summaryB.m6Accuracy },
    { metric: "Defesa Goleiros (%)", [gameA.opponent]: summaryA.gkSaveRate, [gameB.opponent]: summaryB.gkSaveRate },
  ];

  return (
    <div className="space-y-6">
      
      {/* SELEÇÃO DA EQUIPE AVALIADA + SELEÇÃO DAS DUAS PARTIDAS */}
      <Card className="border-l-4 border-l-accent bg-card">
        <CardContent className="py-4 space-y-4">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-accent" />
              <div>
                <h3 className="font-bold text-base text-primary">Comparador de Evolução Histórica</h3>
                <p className="text-xs text-muted-foreground">Filtre por equipe e selecione duas partidas passadas para analisar a variação percentual.</p>
              </div>
            </div>

            {/* SELETOR DE EQUIPE PRINCIPAL (EX: UFAL / NOBRE) */}
            <div className="flex items-center gap-2 bg-muted/60 p-1.5 rounded-lg border">
              <Shield className="h-4 w-4 text-emerald-600 ml-1" />
              <Label className="text-xs font-bold text-foreground">Equipe Avaliada:</Label>
              <select
                className="h-8 text-xs font-bold bg-background border border-input rounded-md px-3 py-1 focus:ring-1 focus:ring-accent"
                value={selectedTeamFilter}
                onChange={(e) => {
                  const team = e.target.value;
                  setSelectedTeamFilter(team);
                  const teamGames = team === "all" ? games : games.filter((g) => g.team_name === team);
                  if (teamGames.length >= 2) {
                    setGameAId(teamGames[1].id);
                    setGameBId(teamGames[0].id);
                  } else if (teamGames.length === 1) {
                    setGameAId(teamGames[0].id);
                    setGameBId(teamGames[0].id);
                  }
                }}
              >
                <option value="all">Todas as Equipes</option>
                {uniqueTeams.map((t) => (
                  <option key={t} value={t}>
                    Equipe: {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SELEÇÃO DAS PARTIDAS A E B */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full justify-between sm:justify-start">
              
              <div className="space-y-1 flex-1 sm:flex-none min-w-[220px]">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Jogo Base (Referência A):</Label>
                <select
                  className="w-full h-9 text-xs font-bold bg-background border border-input rounded-md px-3 py-1 focus:ring-1 focus:ring-accent"
                  value={gameA.id}
                  onChange={(e) => setGameAId(e.target.value)}
                >
                  {filteredGamesForTeam.map((g) => (
                    <option key={`a-${g.id}`} value={g.id}>
                      [{g.team_name}] vs {g.opponent} ({new Date(g.game_date + "T00:00").toLocaleDateString("pt-BR")})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-center pt-4">
                <ArrowRight className="h-5 w-5 text-accent animate-pulse" />
              </div>

              <div className="space-y-1 flex-1 sm:flex-none min-w-[220px]">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Jogo Comparado (Recente B):</Label>
                <select
                  className="w-full h-9 text-xs font-bold bg-background border border-input rounded-md px-3 py-1 focus:ring-1 focus:ring-accent"
                  value={gameB.id}
                  onChange={(e) => setGameBId(e.target.value)}
                >
                  {filteredGamesForTeam.map((g) => (
                    <option key={`b-${g.id}`} value={g.id}>
                      [{g.team_name}] vs {g.opponent} ({new Date(g.game_date + "T00:00").toLocaleDateString("pt-BR")})
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABS SUB-NAVEGAÇÃO: EVOLUÇÃO EQUIPE VS EVOLUÇÃO POR ATLETA */}
      <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2 sm:w-auto mb-4">
          <TabsTrigger value="team" className="font-bold text-xs">
            <Users className="h-4 w-4 mr-1.5 text-accent" /> 📊 Evolução da Equipe ({gameA.team_name})
          </TabsTrigger>
          <TabsTrigger value="player" className="font-bold text-xs">
            <User className="h-4 w-4 mr-1.5 text-emerald-600" /> 👤 Evolução Atleta a Atleta (Camisa #)
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: EVOLUÇÃO DA EQUIPE */}
        <TabsContent value="team" className="space-y-6">
          
          {/* CARDS DE EVOLUÇÃO DE MÉTRICAS CHAVE DA EQUIPE */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* APROVEITAMENTO GERAL */}
            <Card>
              <CardContent className="py-4">
                <span className="text-xs font-bold text-muted-foreground uppercase">Aproveitamento Geral de Arremessos</span>
                <div className="flex items-baseline justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg text-muted-foreground">{summaryA.accuracy}%</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-display text-2xl font-bold text-primary">{summaryB.accuracy}%</span>
                  </div>
                  <DeltaBadge delta={deltaAccuracy} isPercent />
                </div>
              </CardContent>
            </Card>

            {/* CHUTES DE 9 METROS */}
            <Card>
              <CardContent className="py-4">
                <span className="text-xs font-bold text-muted-foreground uppercase">Eficiência de 9 Metros (9m)</span>
                <div className="flex items-baseline justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg text-muted-foreground">{summaryA.m9Accuracy}%</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-display text-2xl font-bold text-primary">{summaryB.m9Accuracy}%</span>
                  </div>
                  <DeltaBadge delta={delta9m} isPercent />
                </div>
              </CardContent>
            </Card>

            {/* CHUTES DE 6 METROS E PONTAS */}
            <Card>
              <CardContent className="py-4">
                <span className="text-xs font-bold text-muted-foreground uppercase">Eficiência de 6 Metros (6m)</span>
                <div className="flex items-baseline justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg text-muted-foreground">{summaryA.m6Accuracy}%</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-display text-2xl font-bold text-primary">{summaryB.m6Accuracy}%</span>
                  </div>
                  <DeltaBadge delta={delta6m} isPercent />
                </div>
              </CardContent>
            </Card>

            {/* PERDAS DE BOLA */}
            <Card>
              <CardContent className="py-4">
                <span className="text-xs font-bold text-muted-foreground uppercase">Perdas de Bola (Turnovers)</span>
                <div className="flex items-baseline justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg text-muted-foreground">{summaryA.turnovers} er.</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-display text-2xl font-bold text-primary">{summaryB.turnovers} er.</span>
                  </div>
                  <DeltaBadge delta={deltaTurnovers} unit=" er." />
                </div>
              </CardContent>
            </Card>

            {/* DEFESA GOLEIROS */}
            <Card>
              <CardContent className="py-4">
                <span className="text-xs font-bold text-muted-foreground uppercase">Taxa de Defesas dos Goleiros (% Save Rate)</span>
                <div className="flex items-baseline justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg text-muted-foreground">{summaryA.gkSaveRate}%</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-display text-2xl font-bold text-primary">{summaryB.gkSaveRate}%</span>
                  </div>
                  <DeltaBadge delta={deltaGkSave} isPercent />
                </div>
              </CardContent>
            </Card>

            {/* 7 METROS */}
            <Card>
              <CardContent className="py-4">
                <span className="text-xs font-bold text-muted-foreground uppercase">Tiro Livre de 7 Metros (7m)</span>
                <div className="flex items-baseline justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg text-muted-foreground">{summaryA.m7Accuracy}%</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-display text-2xl font-bold text-primary">{summaryB.m7Accuracy}%</span>
                  </div>
                  <DeltaBadge delta={delta7m} isPercent />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* GRÁFICO COMPARATIVO RECHARTS LADO A LADO */}
          <Card className="border-t-4 border-t-accent">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent" />
                Comparativo Gráfico: {gameA.team_name} vs {gameA.opponent} x vs {gameB.opponent}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="metric" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey={gameA.opponent} fill="#94a3b8" name={`vs ${gameA.opponent} (${summaryA.gols}g)`} />
                  <Bar dataKey={gameB.opponent} fill="#059669" name={`vs ${gameB.opponent} (${summaryB.gols}g)`} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 2: EVOLUÇÃO ATLETA A ATLETA (CAMISA #) */}
        <TabsContent value="player" className="space-y-6">
          
          <Card className="border-l-4 border-l-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20">
            <CardContent className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <User className="h-6 w-6 text-emerald-600" />
                <div>
                  <h4 className="font-bold text-sm text-primary">Selecione o Atleta por Número da Camisa (#)</h4>
                  <p className="text-xs text-muted-foreground">Avalie a evolução individual de arremessos, assistências e turnovers entre as partidas.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 bg-muted/60 p-1.5 rounded-lg border">
                {allPlayerNumbers.length === 0 ? (
                  <span className="text-xs text-muted-foreground px-2 py-1">Nenhum jogador registrado nestes jogos.</span>
                ) : (
                  allPlayerNumbers.map((num) => {
                    const isSelected = activePlayerNum === num;
                    return (
                      <Button
                        key={`num-${num}`}
                        size="xs"
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "h-7 text-xs font-extrabold px-3",
                          isSelected && "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                        )}
                        onClick={() => setSelectedPlayerNum(num)}
                      >
                        #{num}
                      </Button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* PAINEL DE COMPARATIVO DO ATLETA SELECIONADO */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* GOLS MARCADOS PELO ATLETA */}
            <Card>
              <CardContent className="py-4">
                <span className="text-xs font-bold text-muted-foreground uppercase">Gols Marcados pelo Atleta #{activePlayerNum}</span>
                <div className="flex items-baseline justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg text-muted-foreground">{playerA.gols}g</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-display text-2xl font-bold text-emerald-600">{playerB.gols}g</span>
                  </div>
                  <DeltaBadge delta={pDeltaGols} unit="g" />
                </div>
              </CardContent>
            </Card>

            {/* APROVEITAMENTO DO ATLETA */}
            <Card>
              <CardContent className="py-4">
                <span className="text-xs font-bold text-muted-foreground uppercase">Aproveitamento (% Acerto)</span>
                <div className="flex items-baseline justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg text-muted-foreground">{playerA.accuracy}%</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-display text-2xl font-bold text-primary">{playerB.accuracy}%</span>
                  </div>
                  <DeltaBadge delta={pDeltaAccuracy} isPercent />
                </div>
              </CardContent>
            </Card>

            {/* ACERTO 9M ATLETA */}
            <Card>
              <CardContent className="py-4">
                <span className="text-xs font-bold text-muted-foreground uppercase">Acerto de 9m (Atleta #{activePlayerNum})</span>
                <div className="flex items-baseline justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg text-muted-foreground">{playerA.m9Accuracy}%</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-display text-2xl font-bold text-primary">{playerB.m9Accuracy}%</span>
                  </div>
                  <DeltaBadge delta={pDelta9m} isPercent />
                </div>
              </CardContent>
            </Card>

            {/* ASSISTÊNCIAS */}
            <Card>
              <CardContent className="py-4">
                <span className="text-xs font-bold text-muted-foreground uppercase">Assistências / Passes Decisivos</span>
                <div className="flex items-baseline justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg text-muted-foreground">{playerA.assists} ast</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-display text-2xl font-bold text-emerald-600">{playerB.assists} ast</span>
                  </div>
                  <DeltaBadge delta={pDeltaAssists} unit=" ast" />
                </div>
              </CardContent>
            </Card>

            {/* TURNOVERS DO ATLETA */}
            <Card>
              <CardContent className="py-4">
                <span className="text-xs font-bold text-muted-foreground uppercase">Perdas de Bola (Turnovers)</span>
                <div className="flex items-baseline justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg text-muted-foreground">{playerA.turnovers} er.</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-display text-2xl font-bold text-primary">{playerB.turnovers} er.</span>
                  </div>
                  <DeltaBadge delta={pDeltaTurnovers} unit=" er." />
                </div>
              </CardContent>
            </Card>

            {/* ACERTO 6M ATLETA */}
            <Card>
              <CardContent className="py-4">
                <span className="text-xs font-bold text-muted-foreground uppercase">Acerto de 6m (Infiltração / Pontas)</span>
                <div className="flex items-baseline justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg text-muted-foreground">{playerA.m6Accuracy}%</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-display text-2xl font-bold text-primary">{playerB.m6Accuracy}%</span>
                  </div>
                  <DeltaBadge delta={pDelta6m} isPercent />
                </div>
              </CardContent>
            </Card>
          </div>

        </TabsContent>
      </Tabs>
    </div>
  );
}
