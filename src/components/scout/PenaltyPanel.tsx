import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GoalMap } from "./GoalMap";
import { heatmapBy, type Shot } from "@/lib/scout/stats";
import { ZONES, type Zone } from "@/lib/scout/constants";
import { Target } from "lucide-react";

export function PenaltyPanel({ shots }: { shots: Shot[] }) {
  // Filtrar todos os lances de 7 Metros (marcados como tipo 7m ou jogada 7m)
  const penalties = useMemo(
    () => shots.filter((s) => s.shot_type === "7m" || s.tactical_play === "7m"),
    [shots]
  );

  const heatmap7mGols = useMemo(() => heatmapBy(penalties, (s) => s.result === "gol"), [penalties]);
  const heatmap7mDefesas = useMemo(() => heatmapBy(penalties, (s) => s.result === "defesa"), [penalties]);
  const heatmap7mTotal = useMemo(() => heatmapBy(penalties), [penalties]);

  const byPlayer = useMemo(() => {
    const map = new Map<
      number,
      { tot: number; gols: number; def: number; hand: string | null; zones: Record<Zone, number> }
    >();
    for (const s of penalties) {
      if (s.player_number == null) continue;
      const cur = map.get(s.player_number) ?? {
        tot: 0,
        gols: 0,
        def: 0,
        hand: s.dominant_hand || null,
        zones: Object.fromEntries(ZONES.map((z) => [z, 0])) as Record<Zone, number>,
      };
      cur.tot += 1;
      if (s.result === "gol") cur.gols += 1;
      if (s.result === "defesa") cur.def += 1;
      if (s.dominant_hand) cur.hand = s.dominant_hand;
      if (ZONES.includes(s.zone as Zone)) cur.zones[s.zone as Zone] += 1;
      map.set(s.player_number, cur);
    }
    return Array.from(map.entries())
      .map(([num, v]) => {
        const fav = (Object.entries(v.zones) as [Zone, number][]).sort((a, b) => b[1] - a[1])[0];
        return {
          numero: num,
          tot: v.tot,
          gols: v.gols,
          def: v.def,
          hand: v.hand ? (v.hand === "canhota" ? "Canhoto (C)" : "Destro (D)") : "—",
          zona_pref: fav?.[1] ? fav[0] : "—",
          aproveitamento: ((v.gols / Math.max(v.tot, 1)) * 100).toFixed(0),
        };
      })
      .sort((a, b) => b.tot - a.tot);
  }, [penalties]);

  return (
    <div className="space-y-6">
      
      {/* PAINEL DE MAPA DO GOL EXCLUSIVO DE 7 METROS */}
      <Card className="border-2 border-purple-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Mapa de Finalização Exclusivo dos 7 Metros (Gols vs Defesas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase mb-2 text-center">Todas as Finalizações (7m)</p>
              <GoalMap heat={heatmap7mTotal} showCounts size="md" heatLabel="total 7m" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase mb-2 text-center">Gols Marcados em 7m</p>
              <GoalMap heat={heatmap7mGols} showCounts size="md" heatLabel="gols 7m" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase mb-2 text-center">Defesas de 7m pelo Goleiro</p>
              <GoalMap heat={heatmap7mDefesas} showCounts size="md" heatLabel="defesas 7m" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABELA DE COBRADORES DE 7 METROS */}
      <Card>
        <CardContent className="py-5">
          <h3 className="mb-3 font-display text-lg font-bold text-primary">Histórico de Cobradores de 7 Metros</h3>
          {byPlayer.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma cobrança de 7 metros registrada ainda nesta partida.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Camisa</TableHead>
                  <TableHead>Mão Dominante</TableHead>
                  <TableHead>Zona Preferida</TableHead>
                  <TableHead className="text-right">Cobranças</TableHead>
                  <TableHead className="text-right">Gols</TableHead>
                  <TableHead className="text-right">Defesas</TableHead>
                  <TableHead className="text-right">Aproveitamento (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byPlayer.map((p) => (
                  <TableRow key={p.numero}>
                    <TableCell className="font-bold font-mono">#{p.numero}</TableCell>
                    <TableCell className="text-xs font-semibold">{p.hand}</TableCell>
                    <TableCell className="font-mono font-bold text-purple-600">{p.zona_pref}</TableCell>
                    <TableCell className="text-right font-mono">{p.tot}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-bold">{p.gols}</TableCell>
                    <TableCell className="text-right text-blue-600 font-bold">{p.def}</TableCell>
                    <TableCell className="text-right font-bold text-primary">{p.aproveitamento}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
