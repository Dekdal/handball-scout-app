import { cn } from "@/lib/utils";
import { ZONES, type Zone } from "@/lib/scout/constants";

type Counts = Partial<Record<Zone, number>>;

export function GoalMap({
  selected,
  onSelect,
  heat,
  heatLabel = "arremessos",
  maxValue,
  showCounts = false,
  size = "lg",
  colorScheme = "accent",
}: {
  selected?: Zone | null;
  onSelect?: (z: Zone) => void;
  heat?: Counts;
  heatLabel?: string;
  maxValue?: number;
  showCounts?: boolean;
  size?: "sm" | "md" | "lg";
  colorScheme?: "accent" | "emerald" | "destructive" | "blue" | "purple";
}) {
  const max = maxValue ?? Math.max(1, ...Object.values(heat ?? {}));

  // CÁLCULO DIRETO DE RGB EM JAVASCRIPT (SEM COLOR-MIX DO CSS PARA COMPATIBILIDADE 100% COM CANVAS E PDF)
  const getCellBgAndTextColor = (intensity: number) => {
    if (!heat || intensity === 0) {
      return { bg: "#ffffff", text: "#1e293b" };
    }

    const pct = Math.min(1, Math.max(0.15, intensity));

    // Target Colors in RGB:
    // emerald: #10b981 (16, 185, 129)
    // destructive: #ef4444 (239, 68, 68)
    // blue: #3b82f6 (59, 130, 246)
    // purple: #9333ea (147, 51, 234)
    // accent: #e63946 (230, 57, 70)
    let tr = 230, tg = 57, tb = 70;
    if (colorScheme === "emerald") { tr = 16; tg = 185; tb = 129; }
    else if (colorScheme === "destructive") { tr = 239; tg = 68; tb = 68; }
    else if (colorScheme === "blue") { tr = 59; tg = 130; tb = 246; }
    else if (colorScheme === "purple") { tr = 147; tg = 51; tb = 234; }

    const r = Math.round(255 * (1 - pct) + tr * pct);
    const g = Math.round(255 * (1 - pct) + tg * pct);
    const b = Math.round(255 * (1 - pct) + tb * pct);

    const bg = `rgb(${r}, ${g}, ${b})`;
    const text = pct > 0.45 ? "#ffffff" : "#0f172a";

    return { bg, text };
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "grid grid-cols-3 grid-rows-3 gap-1.5 rounded-xl border-[6px] border-[#0e2a47] bg-[#f8fafc] p-2 shadow-inner",
          size === "lg" ? "aspect-[4/3]" : size === "md" ? "aspect-[4/3] max-w-sm" : "aspect-[4/3] max-w-xs",
        )}
      >
        {ZONES.map((z) => {
          const v = heat?.[z] ?? 0;
          const intensity = max > 0 ? v / max : 0;
          const isSelected = selected === z;
          const { bg, text } = getCellBgAndTextColor(intensity);

          return (
            <button
              key={z}
              type="button"
              onClick={() => onSelect?.(z)}
              className={cn(
                "relative flex items-center justify-center rounded-md border border-slate-300 font-display font-bold transition-all",
                onSelect && "hover:scale-[1.03] hover:border-red-500 active:scale-95 cursor-pointer",
                !onSelect && "cursor-default",
                isSelected && "ring-4 ring-red-500",
                size === "lg" ? "text-xl" : "text-sm",
              )}
              style={{
                backgroundColor: bg,
                color: text,
              }}
              aria-label={`Zona ${z}${heat ? `, ${v} ${heatLabel}` : ""}`}
            >
              <span className="font-extrabold drop-shadow-sm">{z}</span>
              {showCounts && heat && v > 0 ? (
                <span className="absolute bottom-1 right-1 rounded bg-[#0e2a47] px-1.5 py-0.5 text-[11px] font-black text-white shadow">
                  {v}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
