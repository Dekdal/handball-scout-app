import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { computeStats, statsByShotType, statsByPlayer, heatmapBy, type Shot } from "@/lib/scout/stats";
import { ZONES, type Zone } from "@/lib/scout/constants";
import { Sparkles } from "lucide-react";

export function Insights({ shots }: { shots: Shot[] }) {
  const insights = useMemo(() => generate(shots), [shots]);
  return (
    <Card className="border-accent/40 bg-accent/5">
      <CardContent className="py-5">
        <div className="mb-3 flex items-center gap-2 text-accent">
          <Sparkles className="h-5 w-5" />
          <h3 className="font-display text-lg font-bold">Recomendações táticas</h3>
        </div>
        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">Registre alguns arremessos para gerar insights automáticos.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {insights.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-accent">•</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function generate(shots: Shot[]): string[] {
  if (shots.length === 0) return [];
  const out: string[] = [];
  const stats = computeStats(shots);
  out.push(
    `Eficiência geral do goleiro: ${stats.eficiencia.toFixed(1)}% (${stats.defesas} defesas em ${stats.total} arremessos).`,
  );

  const players = statsByPlayer(shots);
  if (players[0] && players[0].gols >= 2) {
    out.push(
      `Principal artilheiro adversário: nº ${players[0].numero} com ${players[0].gols} gols em ${players[0].arremessos} arremessos.`,
    );
  }

  const sits = statsByShotType(shots).filter((r) => r.total >= 2);
  const best = [...sits].sort((a, b) => b.eficiencia - a.eficiencia)[0];
  const worst = [...sits].sort((a, b) => a.eficiencia - b.eficiencia)[0];
  if (best) out.push(`Melhor desempenho em ${best.label}: ${best.eficiencia.toFixed(0)}% de defesas.`);
  if (worst && worst !== best) {
    out.push(`Atenção: pior desempenho em ${worst.label} (${worst.eficiencia.toFixed(0)}%). Reforce treinos nessa situação.`);
  }

  const heat = heatmapBy(shots);
  const top = (Object.entries(heat) as [Zone, number][]).sort((a, b) => b[1] - a[1])[0];
  if (top) out.push(`Zona mais finalizada do gol: ${top[0]} (${top[1]} arremessos).`);

  const goalsZ = heatmapBy(shots, (s) => s.result === "gol");
  const topGoalZ = (Object.entries(goalsZ) as [Zone, number][]).sort((a, b) => b[1] - a[1])[0];
  if (topGoalZ && topGoalZ[1] >= 2) {
    out.push(`Zona com mais gols sofridos: ${topGoalZ[0]} (${topGoalZ[1]} gols). Trabalhar posicionamento.`);
  }

  // Penalty insight
  const pens = shots.filter((s) => s.shot_type === "7m" && s.player_number != null);
  if (pens.length >= 2) {
    const map = new Map<number, Record<Zone, number>>();
    for (const s of pens) {
      const z = map.get(s.player_number!) ?? (Object.fromEntries(ZONES.map((z) => [z, 0])) as Record<Zone, number>);
      if (ZONES.includes(s.zone as Zone)) z[s.zone as Zone] += 1;
      map.set(s.player_number!, z);
    }
    for (const [num, z] of map) {
      const fav = (Object.entries(z) as [Zone, number][]).sort((a, b) => b[1] - a[1])[0];
      if (fav && fav[1] >= 2) {
        out.push(`Tendência de 7m do nº ${num}: bate na zona ${fav[0]} (${fav[1]} cobranças).`);
      }
    }
  }
  return out;
}
