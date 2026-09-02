import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { GoalMap } from "./GoalMap";
import { computeStats, statsByShotType, statsByGoalkeeperSector, heatmapBy, type Shot } from "@/lib/scout/stats";
import { TACTICAL_PLAY_TYPES } from "@/lib/scout/constants";
import { exportSingleGoalkeeperPDF } from "@/lib/scout/exports";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { UserCheck, Shield, FileText, Layers, ShieldCheck, User } from "lucide-react";
import { cn } from "@/lib/utils";

function StatCard({ label, value, accent }: { label: string; value: string; accent?: "primary" | "destructive" | "success" }) {
  const cls = accent === "destructive" ? "text-destructive" : accent === "success" ? "text-emerald-600 font-bold" : "text-primary";
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
        <p className={`mt-1 font-display text-3xl font-bold ${cls}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

export function StatsDashboard({ shots = [], defaultGoalkeeper, game }: { shots?: Shot[]; defaultGoalkeeper?: string; game?: any }) {
  const safeShots = Array.isArray(shots) ? shots : [];

  // Extrair todos os goleiros cadastrados no elenco da partida (Titular + Reservas) + lances
  const rosterNames = game?.goalkeeper_name
    ? game.goalkeeper_name.split(",").map((s: string) => s.trim()).filter(Boolean)
    : (defaultGoalkeeper ? defaultGoalkeeper.split(",").map((s: string) => s.trim()).filter(Boolean) : []);

  const goalkeeperList = Array.from(
    new Set([
      ...rosterNames,
      ...safeShots.map((s) => s?.goalkeeper_name).filter((g): g is string => Boolean(g)),
    ])
  );

  const [selectedGkFilter, setSelectedGkFilter] = useState<string | null>(null);

  const activeGkName = selectedGkFilter || rosterNames[0] || goalkeeperList[0] || "Goleiro";

  // Filtrar os arremessos caso um goleiro específico (Titular ou Reserva) esteja selecionado
  const filteredShots = selectedGkFilter
    ? safeShots.filter((s) => s?.goalkeeper_name === selectedGkFilter)
    : safeShots;

  const stats = computeStats(filteredShots);
  const saveRate = stats?.total > 0 ? Math.round((stats.defesas / stats.total) * 100) : 0;

  const bySit = statsByShotType(filteredShots) || [];
  const bySector = statsByGoalkeeperSector(filteredShots, selectedGkFilter || undefined) || [];

  // ESTRUTURA TÁTICA DA JOGADA ENFRENTADA PELO GOLEIRO SELECIONADO
  const byGoalkeeperTactical = TACTICAL_PLAY_TYPES.map((t) => {
    const subset = filteredShots.filter((s) => s?.tactical_play === t.value);
    const total = subset.length;
    const defesas = subset.filter((s) => s?.result === "defesa").length;
    const gols = subset.filter((s) => s?.result === "gol").length;
    const ef = total > 0 ? (defesas / total) * 100 : 0;
    return {
      key: t.value,
      label: t.label,
      total,
      defesas,
      gols,
      eficiencia: ef.toFixed(1),
    };
  }).filter((p) => p.total > 0);

  return (
    <div className="space-y-6">
      
      {/* SELETOR DE GOLEIRO (VISÃO GERAL, TITULAR E TODOS OS RESERVAS) */}
      <Card className="border-l-4 border-l-accent bg-card">
        <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase">Análise de Goleiros da Partida</span>
              <p className="text-sm font-bold text-primary">
                {selectedGkFilter ? `Dossiê: ${selectedGkFilter}` : "Visão Geral (Todos os Goleiros da Equipe)"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1.5 bg-muted/50 p-1.5 rounded-lg border">
              {/* BOTAO VISÃO GERAL */}
              <Button
                size="sm"
                variant={selectedGkFilter === null ? "default" : "outline"}
                className={cn("text-xs font-bold", selectedGkFilter === null && "bg-accent text-accent-foreground")}
                onClick={() => setSelectedGkFilter(null)}
              >
                Visão Geral (Todos)
              </Button>

              {/* BOTÕES PARA CADA GOLEIRO DO ELENCO (TITULAR + RESERVAS) */}
              {goalkeeperList.map((gk, index) => {
                const isTitular = index === 0;
                const isSelected = selectedGkFilter === gk;
                const gkShotsCount = safeShots.filter((s) => s?.goalkeeper_name === gk).length;
                const label = isTitular ? `⭐ ${gk} (Titular)` : `🧤 ${gk} (Reserva)`;

                return (
                  <Button
                    key={gk}
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "text-xs font-bold",
                      isSelected && "bg-emerald-600 text-white"
                    )}
                    onClick={() => setSelectedGkFilter(gk)}
                  >
                    <span>{label}</span>
                    <span className={cn(
                      "ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full",
                      isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {gkShotsCount} lances
                    </span>
                  </Button>
                );
              })}
            </div>

            {game && (
              <Button
                size="sm"
                variant="default"
                className="h-9 font-bold text-xs bg-emerald-600 text-white shadow hover:bg-emerald-700"
                onClick={() => exportSingleGoalkeeperPDF(game, safeShots, activeGkName)}
              >
                <FileText className="mr-1.5 h-4 w-4" />
                Baixar PDF ({activeGkName})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ÁREA DO DOSSIÊ DO GOLEIRO SELECIONADO */}
      <div className="space-y-6">
        
        {/* CARDS DE IMPACTO VISUAL DO GOLEIRO */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Arremessos Sofridos" value={String(stats?.total || 0)} accent="primary" />
          <StatCard label="Defesas Realizadas" value={String(stats?.defesas || 0)} accent="success" />
          <StatCard label="Gols Sofridos" value={String(stats?.gols || 0)} accent="destructive" />
          <StatCard label="Taxa de Defesa (% Save Rate)" value={`${saveRate}%`} accent="success" />
        </div>

        {/* TABELA DE ESTRUTURA TÁTICA DA JOGADA ENFRENTADA PELO GOLEIRO */}
        <Card className="border-t-4 border-t-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
              <Layers className="h-5 w-5 text-accent" />
              Desempenho por Estrutura Tática Enfrentada por {activeGkName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {byGoalkeeperTactical.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Nenhuma jogada tática com arremesso registrada para este goleiro ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estrutura Tática Enfrentada</TableHead>
                    <TableHead className="text-right">Arremessos Enfrentados</TableHead>
                    <TableHead className="text-right">Defesas Realizadas</TableHead>
                    <TableHead className="text-right">Gols Sofridos</TableHead>
                    <TableHead className="text-right">Taxa de Defesa (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byGoalkeeperTactical.map((r) => (
                    <TableRow key={r.key}>
                      <TableCell className="font-semibold text-primary">{r.label}</TableCell>
                      <TableCell className="text-right font-mono font-bold">{r.total}</TableCell>
                      <TableCell className="text-right text-emerald-600 font-bold">{r.defesas}</TableCell>
                      <TableCell className="text-right text-destructive font-bold">{r.gols}</TableCell>
                      <TableCell className="text-right font-bold text-accent">{r.eficiencia}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* ORIGEM DOS ARREMESSOS SOFRIDOS (SETOR DA QUADRA DE ATAQUE ADVERSÁRIO) */}
        <Card className="border-t-4 border-t-emerald-600">
          <CardContent className="py-5">
            <h3 className="mb-3 font-display text-lg font-bold text-primary flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Setor da Quadra de Origem dos Arremessos Sofridos por {activeGkName}
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setor de Origem na Quadra</TableHead>
                  <TableHead className="text-right">Arremessos Sofridos</TableHead>
                  <TableHead className="text-right">Defesas Realizadas</TableHead>
                  <TableHead className="text-right">Gols Sofridos</TableHead>
                  <TableHead className="text-right">Taxa de Defesa (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bySector.map((r) => (
                  <TableRow key={r.key || r.position}>
                    <TableCell className="font-medium">{r.label}</TableCell>
                    <TableCell className="text-right font-mono">{r.total}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-bold">{r.defesas}</TableCell>
                    <TableCell className="text-right text-destructive font-bold">{r.gols}</TableCell>
                    <TableCell className="text-right font-bold">{r.eficiencia || r.taxa || 0}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="py-5">
              <h3 className="mb-3 font-display text-lg font-bold text-primary">Defesas vs Gols por situação</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={bySit}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                  />
                  <Bar dataKey="defesas" stackId="a" fill="var(--color-success)" name="Defesas" />
                  <Bar dataKey="gols" stackId="a" fill="var(--color-destructive)" name="Gols" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-5">
              <h3 className="mb-3 font-display text-lg font-bold text-primary">Estatísticas por situação</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right">Arr.</TableHead>
                    <TableHead className="text-right">Def.</TableHead>
                    <TableHead className="text-right">Efic. Defesa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bySit.map((r) => (
                    <TableRow key={r.key || r.value}>
                      <TableCell className="font-medium">{r.label}</TableCell>
                      <TableCell className="text-right">{r.total}</TableCell>
                      <TableCell className="text-right text-emerald-600 font-bold">{r.defesas || 0}</TableCell>
                      <TableCell className="text-right font-bold">{r.taxaDefesa || r.eficiencia || 0}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardContent className="py-5">
              <h3 className="mb-3 font-display text-lg font-bold text-primary">Onde finalizam contra o Goleiro</h3>
              <GoalMap heat={heatmapBy(filteredShots)} showCounts colorScheme="accent" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5">
              <h3 className="mb-3 font-display text-lg font-bold text-primary">Onde o Goleiro defendeu</h3>
              <GoalMap heat={heatmapBy(filteredShots, (s) => s?.result === "defesa")} showCounts colorScheme="emerald" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5">
              <h3 className="mb-3 font-display text-lg font-bold text-primary">Onde o Goleiro sofreu gols</h3>
              <GoalMap heat={heatmapBy(filteredShots, (s) => s?.result === "gol")} showCounts colorScheme="destructive" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
