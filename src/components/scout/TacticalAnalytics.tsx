import { Target, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { computeTacticalPlayStats, computeTurnoverStats, type Shot } from "@/lib/scout/stats";

type Props = {
  shots: Shot[];
  teamName: string;
};

export function TacticalAnalytics({ shots, teamName }: Props) {
  const tacticalStats = computeTacticalPlayStats(shots, teamName);
  const turnoverStats = computeTurnoverStats(shots, teamName);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-primary">Análise Tática de Jogadas & Perdas de Bola</h2>
        <p className="text-sm text-muted-foreground">
          Efetividade por modelo de ataque e categorização detalhada dos erros de posse de bola.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        
        {/* EFETIVIDADE POR TIPO DE JOGADA */}
        <Card className="border-t-4 border-t-blue-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Efetividade por Tipo de Jogada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estrutura Tática</TableHead>
                  <TableHead>Oportunidades</TableHead>
                  <TableHead>Gols</TableHead>
                  <TableHead>Efetividade (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tacticalStats.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell className="font-mono">{row.oportunidades}</TableCell>
                    <TableCell className="font-bold text-emerald-600">{row.convertidos}</TableCell>
                    <TableCell className="font-bold text-primary">{row.efetividade}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* CATEGORIZAÇÃO DE PERDAS DE BOLA (TURNOVERS) */}
        <Card className="border-t-4 border-t-orange-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Origem das Perdas de Posse (Turnovers)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Motivo da Perda</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Proporção (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {turnoverStats.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell className="font-extrabold text-orange-600">{row.count}</TableCell>
                    <TableCell className="font-bold">{row.pct}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
