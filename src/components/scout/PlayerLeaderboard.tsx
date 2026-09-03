import { useState } from "react";
import { Zap, Flame, Shield, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { computePlayerLeaderboard, type Shot } from "@/lib/scout/stats";
import { cn } from "@/lib/utils";

type Props = {
  shots: Shot[];
  teamName: string;
  game?: any;
};

export function PlayerLeaderboard({ shots, teamName, game }: Props) {
  const opponentName = game?.opponent || "Adversário";
  const [selectedTeam, setSelectedTeam] = useState<string>(teamName);

  const leaderboard = computePlayerLeaderboard(shots, selectedTeam);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-primary">Dashboard de Atletas por Equipe</h2>
          <p className="text-sm text-muted-foreground">
            Estatísticas individuais separadas por time: Artilharia, Assistências e Participação em Gols.
          </p>
        </div>

        {/* SELETOR DE EQUIPE */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border">
          <Button
            size="sm"
            variant={selectedTeam === teamName ? "default" : "ghost"}
            className={cn("text-xs font-bold h-8", selectedTeam === teamName && "shadow")}
            onClick={() => setSelectedTeam(teamName)}
          >
            🛡️ {teamName}
          </Button>
          <Button
            size="sm"
            variant={selectedTeam === opponentName ? "destructive" : "ghost"}
            className={cn("text-xs font-bold h-8", selectedTeam === opponentName && "shadow")}
            onClick={() => setSelectedTeam(opponentName)}
          >
            ⚠️ {opponentName}
          </Button>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Nenhum dado individual de atleta registrado ainda para a equipe <strong>{selectedTeam}</strong> nesta partida.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* ARTILHARIA & PARTICIPAÇÃO */}
          <Card className="border-t-4 border-t-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-amber-500" />
                  Artilharia & Aproveitamento
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted">
                  {selectedTeam}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Gols</TableHead>
                    <TableHead>Arremessos</TableHead>
                    <TableHead>Eficiência (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard
                    .filter((p) => p.arremessos > 0)
                    .map((p) => (
                      <TableRow key={p.numero}>
                        <TableCell className="font-bold text-primary">Camisa #{p.numero}</TableCell>
                        <TableCell className="font-extrabold text-emerald-600">{p.gols}</TableCell>
                        <TableCell className="font-mono">{p.arremessos}</TableCell>
                        <TableCell className="font-bold">{p.eficiencia}%</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* ASSISTÊNCIAS & PARTICIPAÇÕES */}
          <Card className="border-t-4 border-t-accent">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-accent" />
                  Garçons & Criadores de Chances
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted">
                  {selectedTeam}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Assistências</TableHead>
                    <TableHead>Gols + Assist.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((p) => (
                    <TableRow key={p.numero}>
                      <TableCell className="font-bold text-primary">Camisa #{p.numero}</TableCell>
                      <TableCell className="font-extrabold text-blue-600">{p.assistencias}</TableCell>
                      <TableCell className="font-bold text-emerald-600">{p.gols + p.assistencias}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
