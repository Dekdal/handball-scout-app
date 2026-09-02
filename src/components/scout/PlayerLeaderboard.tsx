import { Award, Zap, UserCheck, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { computePlayerLeaderboard, type Shot } from "@/lib/scout/stats";

type Props = {
  shots: Shot[];
  teamName: string;
};

export function PlayerLeaderboard({ shots, teamName }: Props) {
  const leaderboard = computePlayerLeaderboard(shots, teamName);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-primary">Dashboard de Atletas</h2>
          <p className="text-sm text-muted-foreground">
            Estatísticas individuais: Artilharia, Assistências, Pseudo-Assistências e Participação em Gols.
          </p>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Nenhum dado individual de atleta registrado ainda nesta partida.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* ARTILHARIA & PARTICIPAÇÃO */}
          <Card className="border-t-4 border-t-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-500" />
                Artilharia & Aproveitamento
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

          {/* ASSISTÊNCIAS & PSEUDO-ASSISTÊNCIAS */}
          <Card className="border-t-4 border-t-accent">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                Garçons & Criadores de Chances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Assistências</TableHead>
                    <TableHead>Pseudo-Assist.*</TableHead>
                    <TableHead>Goles + Assist.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((p) => (
                    <TableRow key={p.numero}>
                      <TableCell className="font-bold text-primary">Camisa #{p.numero}</TableCell>
                      <TableCell className="font-extrabold text-blue-600">{p.assistencias}</TableCell>
                      <TableCell className="font-mono text-amber-600 font-bold">{p.pseudoAssistencias}</TableCell>
                      <TableCell className="font-bold text-emerald-600">{p.totalParticipacoes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-3 text-xs text-muted-foreground italic">
                * Pseudo-Assistência: Passe que deixou o companheiro livre cara a cara com o gol, porém a finalização foi perdida.
              </p>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
