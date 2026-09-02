import { ShieldAlert, Users, AlertOctagon, FileWarning, Shield, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { computeDefensiveDangerStats, computeNumericalStatusStats, computeGoalkeeperProfiles, type Shot } from "@/lib/scout/stats";
import { sanctionReasonLabel, formattedResultLabel } from "@/lib/scout/constants";
import { cn } from "@/lib/utils";

type Props = {
  shots: Shot[];
  teamName: string;
  opponentName: string;
};

export function DefensiveImpact({ shots = [], teamName, opponentName }: Props) {
  const safeShots = Array.isArray(shots) ? shots : [];
  const defensiveStats = computeDefensiveDangerStats(safeShots, teamName);
  const numericalStats = computeNumericalStatusStats(safeShots, teamName, opponentName);
  const gkProfiles = computeGoalkeeperProfiles(safeShots);

  // CONTAGEM DE DEFESAS DE GOLEIRO
  const defesasGoleiroCount = safeShots.filter((s) => s.result === "defesa").length;
  const totalFinalizacoesContra = safeShots.filter(
    (s) => s.result === "gol" || s.result === "defesa" || s.result === "trave" || s.result === "fora"
  ).length;
  const taxaDefesaGeral = totalFinalizacoesContra > 0 ? Math.round((defesasGoleiroCount / totalFinalizacoesContra) * 100) : 0;

  // FILTRAR TODOS OS LANCES COM SANÇÕES DISCIPLINARES, CARTÕES E 2 MINUTOS
  const disciplinaryShots = safeShots.filter((s) => {
    if (!s || !s.result) return false;
    const r = s.result;
    return (
      r === "cartao_amarelo" ||
      r === "exclusao_2min" ||
      r === "cartao_vermelho" ||
      r === "cartao_azul" ||
      r.startsWith("cartao_") ||
      r.includes("2min") ||
      r.includes("exclusao")
    );
  });

  const amarelos = safeShots.filter((s) => s.result && s.result.includes("amarelo")).length;
  const exclusoes2min = safeShots.filter((s) => s.result && (s.result.includes("2min") || s.result.includes("exclusao"))).length;
  const vermelhos = safeShots.filter((s) => s.result && s.result.includes("vermelho")).length;
  const azuis = safeShots.filter((s) => s.result && s.result.includes("azul")).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-red-600" />
          Análise Defensiva, Defesas de Goleiro & Punições (2 min)
        </h2>
        <p className="text-sm text-muted-foreground">
          Estatísticas de defesas efetuadas pelos goleiros, advertências formais, exclusões de 2 minutos e cartões (Amarelo, Vermelho, Azul).
        </p>
      </div>

      {/* CARDS DE RESUMO DEFENSIVO E PUNIÇÕES DISCIPLINARES */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        
        {/* DEFESAS DE GOLEIRO */}
        <Card className="border-l-4 border-l-emerald-600 bg-emerald-50/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase">Defesas Goleiro 🧤</span>
              <span className="text-2xl font-extrabold text-emerald-600">{defesasGoleiroCount}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-semibold">
              Taxa de Defesa: {taxaDefesaGeral}%
            </p>
          </CardContent>
        </Card>

        {/* CARTÕES AMARELOS */}
        <Card className="border-l-4 border-l-amber-500 bg-amber-50/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase">Amarelos 🟨</span>
              <span className="text-2xl font-extrabold text-amber-600">{amarelos}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Advertências Formais</p>
          </CardContent>
        </Card>

        {/* EXCLUSÕES DE 2 MINUTOS */}
        <Card className="border-l-4 border-l-orange-500 bg-orange-50/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-900 uppercase">2 Minutos ⏱️</span>
              <span className="text-2xl font-extrabold text-orange-600">{exclusoes2min}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Inferioridade Numérica</p>
          </CardContent>
        </Card>

        {/* CARTÕES VERMELHOS */}
        <Card className="border-l-4 border-l-red-600 bg-red-50/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-900 uppercase">Vermelhos 🟥</span>
              <span className="text-2xl font-extrabold text-red-600">{vermelhos}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Desqualificações Diretas</p>
          </CardContent>
        </Card>

        {/* CARTÕES AZUIS */}
        <Card className="border-l-4 border-l-blue-600 bg-blue-50/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 uppercase">Azuis 🟦</span>
              <span className="text-2xl font-extrabold text-blue-600">{azuis}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Relatório Escrito (Séria)</p>
          </CardContent>
        </Card>
      </div>

      {/* TABELA DE GOLEIROS E DEFESAS REALIZADAS */}
      <Card className="border-t-4 border-t-emerald-600">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            Desempenho dos Goleiros na Partida (Defesas & Eficiência %)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gkProfiles.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3">Nenhum goleiro registrado com intervenções nesta partida.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Goleiro</TableHead>
                  <TableHead className="text-right">Total Finalizações</TableHead>
                  <TableHead className="text-right">Defesas Efetuadas 🧤</TableHead>
                  <TableHead className="text-right">Gols Sofridos</TableHead>
                  <TableHead className="text-right">Taxa de Defesa (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gkProfiles.map((gk) => (
                  <TableRow key={gk.name}>
                    <TableCell className="font-bold text-sm text-primary flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-emerald-600" /> {gk.name}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">{gk.totalArremessos}</TableCell>
                    <TableCell className="text-right font-mono font-extrabold text-emerald-600">{gk.defesas}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-red-600">{gk.golsSofridos}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30">
                      {gk.taxaDefesa}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* TABELA DETALHADA DE SANÇÕES DISCIPLINARES & 2 MINUTOS REGISTRADOS */}
      <Card className="border-t-4 border-t-amber-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-amber-500" />
            Registro Detalhado de Cartões & Exclusões de 2 Minutos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {disciplinaryShots.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4">Nenhuma punição disciplinar ou exclusão de 2 minutos registrada nesta partida.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período / Tempo</TableHead>
                  <TableHead>Equipe</TableHead>
                  <TableHead>Nº Atleta</TableHead>
                  <TableHead>Sanção Disciplinar</TableHead>
                  <TableHead>Motivo da Punição</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disciplinaryShots.map((s) => {
                  let cardBadgeClass = "bg-amber-400 text-amber-950 font-bold";
                  if (s.result && s.result.includes("2min")) cardBadgeClass = "bg-orange-500 text-white font-bold";
                  if (s.result && s.result.includes("vermelho")) cardBadgeClass = "bg-red-600 text-white font-bold";
                  if (s.result && s.result.includes("azul")) cardBadgeClass = "bg-blue-600 text-white font-bold";

                  const reasonText = s.turnover_reason ? sanctionReasonLabel(s.turnover_reason) : "—";

                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs font-bold text-primary">
                        {s.period} ({s.game_time || "00:00"})
                      </TableCell>
                      <TableCell className="text-xs font-semibold">{s.possession_team || teamName}</TableCell>
                      <TableCell className="font-bold text-sm">
                        {s.player_number ? `#${s.player_number}` : "—"}
                      </TableCell>
                      <TableCell>
                        <span className={cn("px-2.5 py-1 rounded text-xs font-bold shadow-xs", cardBadgeClass)}>
                          {formattedResultLabel(s)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">{reasonText}</TableCell>
                      <TableCell className="text-xs text-muted-foreground italic">{s.notes || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        
        {/* FRAGILIDADE & AÇÕES DEFENSIVAS SOFRIDAS POR SETOR */}
        <Card className="border-t-4 border-t-red-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                Origem do Perigo Sofrido na Defesa
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setor Defensivo</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                  <TableHead className="text-center text-red-600">Gols</TableHead>
                  <TableHead className="text-center text-emerald-600">Defesas 🧤</TableHead>
                  <TableHead className="text-right">Eficiência %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {defensiveStats.setores.map((sec) => {
                  let badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold";
                  if (sec.eficienciaDefensiva < 60) badgeColor = "bg-amber-100 text-amber-800 border-amber-300 font-bold";
                  if (sec.eficienciaDefensiva < 40) badgeColor = "bg-red-100 text-red-800 border-red-300 font-bold";

                  return (
                    <TableRow key={sec.key}>
                      <TableCell className="font-bold text-xs text-primary">{sec.label}</TableCell>
                      <TableCell className="text-center font-mono font-bold text-xs">{sec.total}</TableCell>
                      <TableCell className="text-center font-extrabold text-xs text-red-600">{sec.gols}</TableCell>
                      <TableCell className="text-center font-mono font-bold text-xs text-emerald-600">{sec.defesasGoleiro}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn("px-2 py-0.5 rounded text-[11px] border shadow-xs", badgeColor)}>
                          {sec.eficienciaDefensiva}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ANÁLISE NUMÉRICA DE EXCLUSÕES (2 MINUTOS E GOLEIRO LINHA) */}
        <Card className="border-t-4 border-t-purple-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Desempenho por Estado Numérico (2 min)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* NOSSO TIME */}
            <div>
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Nosso Time ({teamName})</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado Numérico</TableHead>
                    <TableHead className="text-right">Lances</TableHead>
                    <TableHead className="text-right">Gols ⚽</TableHead>
                    <TableHead className="text-right">Efetividade %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold text-xs text-primary">Igualdade (6x6)</TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs">{numericalStats.nossoTime.igualdade.oportunidades}</TableCell>
                    <TableCell className="text-right font-bold text-xs text-emerald-600">{numericalStats.nossoTime.igualdade.gols}</TableCell>
                    <TableCell className="text-right font-bold text-xs">{numericalStats.nossoTime.igualdade.efetividade}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold text-xs text-emerald-600">Superioridade (6x5)</TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs">{numericalStats.nossoTime.superioridade.oportunidades}</TableCell>
                    <TableCell className="text-right font-bold text-xs text-emerald-600">{numericalStats.nossoTime.superioridade.gols}</TableCell>
                    <TableCell className="text-right font-bold text-xs text-emerald-600">{numericalStats.nossoTime.superioridade.efetividade}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold text-xs text-red-600">Inferioridade (5x6)</TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs">{numericalStats.nossoTime.inferioridade.oportunidades}</TableCell>
                    <TableCell className="text-right font-bold text-xs text-emerald-600">{numericalStats.nossoTime.inferioridade.gols}</TableCell>
                    <TableCell className="text-right font-bold text-xs text-red-600">{numericalStats.nossoTime.inferioridade.efetividade}%</TableCell>
                  </TableRow>
                  {numericalStats.nossoTime.goleiroLinha && (
                    <TableRow>
                      <TableCell className="font-semibold text-xs text-purple-600">Goleiro Linha (7x6)</TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs">{numericalStats.nossoTime.goleiroLinha.oportunidades}</TableCell>
                      <TableCell className="text-right font-bold text-xs text-emerald-600">{numericalStats.nossoTime.goleiroLinha.gols}</TableCell>
                      <TableCell className="text-right font-bold text-xs text-purple-600">{numericalStats.nossoTime.goleiroLinha.efetividade}%</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* ADVERSÁRIO */}
            <div>
              <h4 className="text-xs font-bold text-destructive uppercase tracking-wider mb-2">Adversário ({opponentName})</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado Numérico</TableHead>
                    <TableHead className="text-right">Lances</TableHead>
                    <TableHead className="text-right text-destructive">Gols ⚽</TableHead>
                    <TableHead className="text-right">Efetividade %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold text-xs text-primary">Igualdade (6x6)</TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs">{numericalStats.adversario.igualdade.oportunidades}</TableCell>
                    <TableCell className="text-right font-bold text-xs text-destructive">{numericalStats.adversario.igualdade.gols}</TableCell>
                    <TableCell className="text-right font-bold text-xs">{numericalStats.adversario.igualdade.efetividade}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold text-xs text-emerald-600">Superioridade (6x5)</TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs">{numericalStats.adversario.superioridade.oportunidades}</TableCell>
                    <TableCell className="text-right font-bold text-xs text-destructive">{numericalStats.adversario.superioridade.gols}</TableCell>
                    <TableCell className="text-right font-bold text-xs text-emerald-600">{numericalStats.adversario.superioridade.efetividade}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold text-xs text-red-600">Inferioridade (5x6)</TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs">{numericalStats.adversario.inferioridade.oportunidades}</TableCell>
                    <TableCell className="text-right font-bold text-xs text-destructive">{numericalStats.adversario.inferioridade.gols}</TableCell>
                    <TableCell className="text-right font-bold text-xs text-red-600">{numericalStats.adversario.inferioridade.efetividade}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
