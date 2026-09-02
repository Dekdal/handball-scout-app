import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GoalMap } from "./GoalMap";
import { POSITIONS, SHOT_TYPES, RESULTS, type Position, type ShotType, type ShotResult, type Zone } from "@/lib/scout/constants";
import { cn } from "@/lib/utils";

export type ShotDraft = {
  player_number: number | null;
  position: Position;
  shot_type: ShotType;
  zone: Zone;
  result: ShotResult;
  game_time: string;
  dominant_hand: string | null;
};

export function ShotRegister({
  onSubmit,
  defaults,
}: {
  onSubmit: (draft: ShotDraft) => void;
  defaults?: Partial<ShotDraft>;
}) {
  const [playerNumber, setPlayerNumber] = useState<string>(defaults?.player_number?.toString() ?? "");
  const [position, setPosition] = useState<Position>(defaults?.position ?? "armador_cen");
  const [shotType, setShotType] = useState<ShotType>(defaults?.shot_type ?? "9m");
  const [gameTime, setGameTime] = useState<string>(defaults?.game_time ?? "");
  const [zone, setZone] = useState<Zone | null>(defaults?.zone ?? null);
  const [resultDialog, setResultDialog] = useState<Zone | null>(null);

  function handleZone(z: Zone) {
    setZone(z);
    setResultDialog(z);
  }

  function handleResult(result: ShotResult) {
    if (!resultDialog) return;
    onSubmit({
      player_number: playerNumber ? Number(playerNumber) : null,
      position,
      shot_type: shotType,
      zone: resultDialog,
      result,
      game_time: gameTime.trim(),
      dominant_hand: null,
    });
    setResultDialog(null);
    setZone(null);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <Label>Nº adversário</Label>
          <Input
            inputMode="numeric"
            value={playerNumber}
            onChange={(e) => setPlayerNumber(e.target.value.replace(/\D/g, "").slice(0, 3))}
          />
        </div>
        <div>
          <Label>Tempo</Label>
          <Input placeholder="12:34" value={gameTime} onChange={(e) => setGameTime(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label>Posição</Label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {POSITIONS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPosition(p.value)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition",
                  position === p.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary",
                )}
              >
                {p.short} · {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <Label>Tipo de arremesso</Label>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {SHOT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setShotType(t.value)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm font-medium transition",
                shotType === t.value
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card hover:border-accent",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Toque na zona do gol onde a bola foi finalizada</Label>
        <div className="mx-auto max-w-md">
          <GoalMap selected={zone} onSelect={handleZone} />
        </div>
      </div>

      <Dialog open={!!resultDialog} onOpenChange={(o) => { if (!o) { setResultDialog(null); setZone(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Resultado · zona {resultDialog}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {RESULTS.map((r) => (
              <Button
                key={r.value}
                type="button"
                className={cn("h-16 text-base font-bold", r.color, "hover:opacity-90")}
                onClick={() => handleResult(r.value)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
