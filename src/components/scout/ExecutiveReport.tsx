import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GoalMap } from "./GoalMap";
import { PlayerLeaderboard } from "./PlayerLeaderboard";
import { TacticalAnalytics } from "./TacticalAnalytics";
import {
  computeStats,
  compute10MinIntervalStats,
  computeDetailedPlayerReports,
  generateTeamTacticalInsights,
  computeShotTypeStats,
  computeTacticalPlayStats,
  computeTurnoverStats,
  type Shot,
  type DetailedPlayerReport,
} from "@/lib/scout/stats";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { FileCheck, Lightbulb, AlertOctagon, CheckCircle2, Users, User, TrendingUp, ShieldAlert, Award, Crosshair, Sparkles, Trophy, Target } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  game: any;
  shots: Shot[];
};

export function ExecutiveReport({ game, shots = [] }: Props) {
  const teamName = game?.team_name || "Nosso Time";
  const opponentName = game?.opponent || "Adversário";

  const safeShots = Array.isArray(shots) ? shots : [];
  const teamShots = safeShots.filter((s) => !s.possession_team || s.possession_team === teamName);

  // DADOS DE EQUIPE
  const generalStats = computeStats(teamShots);
  const intervalStats = compute10MinIntervalStats(safeShots, teamName);
  const shotTypeStats = computeShotTypeStats(teamShots);
  const turnoverStats = computeTurnoverStats(teamShots);
  const teamInsights = generateTeamTacticalInsights(safeShots, teamName);

  // DOSSIÊS INDIVIDUAIS
  const playerReports = computeDetailedPlayerReports(safeShots, teamName);

  // Estado para selecionar qual atleta analisar no Dossiê Individual
  const [selectedPlayerNum, setSelectedPlayerNum] = useState<string>(
    playerReports.length > 0 ? String(playerReports[0].playerNumber) : ""
  );

  const activePlayerReport: DetailedPlayerReport | undefined = playerReports.find(
    (p) => String(p.playerNumber) === selectedPlayerNum
  ) || playerReports[0];

  return (
    <div className="space-y-6">
      
      {/* CABEÇALHO DO RELATÓRIO TÁTICO EXPANDIDO E INCORPORADO */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            Relatório Tático & Inteligência de Jogo
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Módulo completo incorporando Visão Geral da Equipe, Ranking de Jogadores, Táticas & Perdas e Dossiês Individuais.
          </p>
        </div>
      </div>

      {/* ABAS INTERNAS INCORPORADAS DO RELATÓRIO */}
      <Tabs defaultValue="team_vision" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-3xl mb-6">
          <TabsTrigger value="team_vision" className="font-bold text-xs">
            <Users className="h-4 w-4 mr-1.5 text-accent" /> Visão Equipe
          </TabsTrigger>
          <TabsTrigger value="ranking" className="font-bold text-xs">
            <Trophy className="h-4 w-4 mr-1.5 text-amber-500" /> Ranking Jogadores
          </TabsTrigger>
          <TabsTrigger value="tactical_play" className="font-bold text-xs">
            <Target className="h-4 w-4 mr-1.5 text-blue-600" /> Táticas & Perdas
          </TabsTrigger>
          <TabsTrigger value="player_vision" className="font-bold text-xs">
            <User className="h-4 w-4 mr-1.5 text-emerald-600" /> Dossiês Atletas
          </TabsTrigger>
        </TabsList>

        {/* ==================================================================== */}
        {/* SUB-ABA 1: VISÃO GERAL DA EQUIPE */}
        {/* ==================================================================== */}
        <TabsContent value="team_vision" className="space-y-6">
          
          {/* CARDS RESUMO DA EQUIPE */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="py-4">
                <p className="text-xs uppercase font-semibold text-muted-foreground">Volume de Arremessos</p>
                <p className="text-2xl font-bold text-primary mt-1">{generalStats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-xs uppercase font-semibold text-muted-foreground">Gols Marcados</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{generalStats.gols}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-xs uppercase font-semibold text-muted-foreground">Aproveitamento Geral</p>
                <p className="text-2xl font-bold text-accent mt-1">{generalStats.taxaConversao}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-xs uppercase font-semibold text-muted-foreground">Perdas de Bola (Turnovers)</p>
                <p className="text-2xl font-bold text-destructive mt-1">{generalStats.perdas}</p>
              </CardContent>
            </Card>
          </div>

          {/* PAINEL DE INSIGHTS AUTOMÁTICOS DA COMISSÃO TÁTICA */}
          <Card className="border-l-4 border-l-amber-500 bg-amber-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-amber-900 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-600" />
                Parecer & Insights Automáticos do Treinador
              </CardTitle>
              <CardDescription className="text-xs">
                Diagnóstico gerado em tempo real com base no cruzamento das estatísticas da partida.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {teamInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-3 rounded-lg border text-xs font-semibold leading-relaxed flex items-start gap-2.5 shadow-sm",
                    insight.type === "alert" && "bg-red-50 text-red-950 border-red-200",
                    insight.type === "highlight" && "bg-emerald-50 text-emerald-950 border-emerald-200",
                    insight.type === "recommendation" && "bg-blue-50 text-blue-950 border-blue-200"
                  )}
                >
                  <span className="mt-0.5">{insight.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* EVOLUÇÃO TEMPORAL EM BLOCOS DE 10 MINUTOS */}
          <Card className="border-t-4 border-t-accent">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Desempenho Ofensivo por Intervalo de 10 Minutos
              </CardTitle>
              <CardDescription className="text-xs">
                Aproveitamento de arremessos (%) e perdas de bola por bloco de tempo de jogo.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={intervalStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="interval" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                  />
                  <Bar dataKey="gols" fill="#22c55e" name="Gols" stackId="a" />
                  <Bar dataKey="perdas" fill="#ef4444" name="Perdas de Bola" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* TABELAS DE DISTÂNCIA E ESTRUTURA TÁTICA */}
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* DISTÂNCIA DE ARREMESSO */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-primary flex items-center gap-1.5">
                  <Crosshair className="h-4 w-4 text-accent" /> Conversão por Distância (6m, 7m, 9m)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Distância</TableHead>
                      <TableHead className="text-right">Tentativas</TableHead>
                      <TableHead className="text-right">Gols</TableHead>
                      <TableHead className="text-right">Taxa (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shotTypeStats.map((st) => (
                      <TableRow key={st.value}>
                        <TableCell className="font-semibold text-primary">{st.label}</TableCell>
                        <TableCell className="text-right font-mono">{st.total}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">{st.gols}</TableCell>
                        <TableCell className="text-right font-bold text-accent">{st.taxa}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* PRINCIPAIS TURNOVERS */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-primary flex items-center gap-1.5">
                  <AlertOctagon className="h-4 w-4 text-destructive" /> Principais Perdas de Posse
                </CardTitle>
              </CardHeader>
              <CardContent>
                {turnoverStats.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4">Nenhuma perda de bola registrada.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Motivo da Perda</TableHead>
                        <TableHead className="text-right">Ocorrências</TableHead>
                        <TableHead className="text-right">Proporção (%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {turnoverStats.map((to) => (
                        <TableRow key={to.reason}>
                          <TableCell className="font-medium text-foreground">{to.label}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-destructive">{to.count}</TableCell>
                          <TableCell className="text-right font-bold">{to.pct}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* ==================================================================== */}
        {/* SUB-ABA 2: RANKING E ARTILHARIA DE JOGADORES (INCORPORADO) */}
        {/* ==================================================================== */}
        <TabsContent value="ranking" className="space-y-6">
          <PlayerLeaderboard shots={safeShots} teamName={teamName} />
        </TabsContent>

        {/* ==================================================================== */}
        {/* SUB-ABA 3: TÁTICAS E PERDAS DE BOLA (INCORPORADO) */}
        {/* ==================================================================== */}
        <TabsContent value="tactical_play" className="space-y-6">
          <TacticalAnalytics shots={safeShots} teamName={teamName} />
        </TabsContent>

        {/* ==================================================================== */}
        {/* SUB-ABA 4: DOSSIÊS INDIVIDUAIS DOS ATLETAS */}
        {/* ==================================================================== */}
        <TabsContent value="player_vision" className="space-y-6">
          
          {/* SELETOR DE ATLETA DROPDOWN */}
          <Card className="border-l-4 border-l-emerald-600 bg-card">
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-600" />
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Selecione o Atleta para Analisar</span>
                  <p className="text-sm font-bold text-primary">
                    {activePlayerReport ? `Dossiê Individual: Camisa #${activePlayerReport.playerNumber}` : "Nenhum atleta selecionado"}
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-64">
                <Select value={selectedPlayerNum} onValueChange={setSelectedPlayerNum}>
                  <SelectTrigger className="h-9 font-bold text-xs">
                    <SelectValue placeholder="Selecione o atleta" />
                  </SelectTrigger>
                  <SelectContent>
                    {playerReports.map((p) => (
                      <SelectItem key={p.playerNumber} value={String(p.playerNumber)}>
                        Camisa #{p.playerNumber} ({p.gols} gols · {p.taxaAcerto}% acerto)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {activePlayerReport ? (
            <div className="space-y-6">
              
              {/* MÉTRICAS INDIVIDUAIS DO ATLETA */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Card>
                  <CardContent className="py-4">
                    <p className="text-[11px] uppercase font-semibold text-muted-foreground">Posição Predominante</p>
                    <p className="text-base font-bold text-primary mt-1">{activePlayerReport.posicaoPredominante}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <p className="text-[11px] uppercase font-semibold text-muted-foreground">Gols / Finalizações</p>
                    <p className="text-xl font-bold text-emerald-600 mt-1">
                      {activePlayerReport.gols} <span className="text-xs font-normal text-muted-foreground">de {activePlayerReport.totalShots}</span>
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <p className="text-[11px] uppercase font-semibold text-muted-foreground">Taxa de Acerto</p>
                    <p className="text-xl font-bold text-accent mt-1">{activePlayerReport.taxaAcerto}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <p className="text-[11px] uppercase font-semibold text-muted-foreground">Assistências</p>
                    <p className="text-xl font-bold text-blue-600 mt-1">{activePlayerReport.assistencias}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <p className="text-[11px] uppercase font-semibold text-muted-foreground">Razão Assist. / Perdas</p>
                    <p className="text-xl font-bold text-purple-600 mt-1">{activePlayerReport.assistTurnoverRatio}</p>
                  </CardContent>
                </Card>
              </div>

              {/* MAPA DE CALOR DO ATLETA E INSIGHTS INDIVIDUAIS */}
              <div className="grid gap-6 md:grid-cols-12">
                
                {/* MAPA DE CALOR DO GOL DO ATLETA (5 COLS) */}
                <Card className="md:col-span-5 border-t-4 border-t-accent">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-primary flex items-center gap-1.5">
                      <Crosshair className="h-4 w-4 text-accent" /> Quadrante de Finalização Preferido
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Distribuição dos arremessos do atleta no gol (A1 a C3).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <GoalMap heat={activePlayerReport.heatmapData} showCounts colorScheme="accent" size="md" />
                  </CardContent>
                </Card>

                {/* TABELA DE DISTÂNCIA E INSIGHTS INDIVIDUAIS (7 COLS) */}
                <div className="md:col-span-7 space-y-4">
                  
                  {/* TABELA DE PREFERÊNCIA POR DISTÂNCIA */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold text-primary">Aproveitamento por Distância (6m, 7m, 9m)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Distância</TableHead>
                            <TableHead className="text-right">Arremessos</TableHead>
                            <TableHead className="text-right">Gols</TableHead>
                            <TableHead className="text-right">Aproveitamento</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activePlayerReport.preferenciasDistancia.map((pd) => {
                            const pct = pd.total > 0 ? Math.round((pd.gols / pd.total) * 100) : 0;
                            return (
                              <TableRow key={pd.shot_type}>
                                <TableCell className="font-semibold text-primary">{pd.label}</TableCell>
                                <TableCell className="text-right font-mono">{pd.total}</TableCell>
                                <TableCell className="text-right font-bold text-emerald-600">{pd.gols}</TableCell>
                                <TableCell className="text-right font-bold text-accent">{pct}%</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* PARECER TÁTICO INDIVIDUAL AUTOMÁTICO */}
                  <Card className="border-l-4 border-l-blue-600 bg-blue-50/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-blue-600" /> Parecer Técnico do Atleta #{activePlayerReport.playerNumber}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-1 text-xs font-semibold text-foreground">
                      {activePlayerReport.insights.map((ins, i) => (
                        <p key={i} className="leading-relaxed border-b pb-1 last:border-0">{ins}</p>
                      ))}
                    </CardContent>
                  </Card>

                </div>

              </div>

            </div>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              <User className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm font-bold text-foreground">Nenhum Atleta com Registro de Lance</p>
              <p className="text-xs max-w-sm mx-auto mt-1">
                Registre arremessos ou assistências informando o número da camisa do jogador para gerar seu dossiê individual completo.
              </p>
            </Card>
          )}

        </TabsContent>
      </Tabs>
    </div>
  );
}
