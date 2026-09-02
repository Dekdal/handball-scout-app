import React from "react";
import { type Position } from "@/lib/scout/constants";
import { cn } from "@/lib/utils";

export interface PointXY {
  x: number; // 0 a 100 (%)
  y: number; // 0 a 100 (%)
}

interface Props {
  selectedPoint: PointXY | null;
  onSelectPoint: (point: PointXY, positionHint?: Position) => void;
  readOnly?: boolean;
  shots?: { id: string; x?: number; y?: number; result: string; player_number?: number }[];
  size?: "sm" | "md" | "lg";
}

// Auto-detectar posição sugerida baseado nas coordenadas da meia-quadra
function inferPositionFromXY(x: number, y: number): Position {
  // y: 0 (área de gol) -> 100 (linha central)
  // x: 0 (linha lateral esquerda) -> 100 (linha lateral direita)
  if (y <= 35) {
    if (x < 30) return "ponta_esq";
    if (x > 70) return "ponta_dir";
    return "pivo";
  }
  if (y > 35 && y <= 65) {
    if (x < 35) return "armador_esq";
    if (x > 65) return "armador_dir";
    return "armador_cen";
  }
  if (x < 40) return "armador_esq";
  if (x > 60) return "armador_dir";
  return "armador_cen";
}

export function CourtMap({ selectedPoint, onSelectPoint, readOnly = false, shots = [], size = "md" }: Props) {
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Converter para porcentagem 0-100
    const x = Math.max(0, Math.min(100, Math.round((clickX / rect.width) * 100)));
    const y = Math.max(0, Math.min(100, Math.round((clickY / rect.height) * 100)));

    const point = { x, y };
    const hint = inferPositionFromXY(x, y);
    onSelectPoint(point, hint);
  };

  const dimensions = {
    sm: "h-48 w-full max-w-[280px]",
    md: "h-64 w-full max-w-[380px]",
    lg: "h-80 w-full max-w-[480px]",
  }[size];

  return (
    <div className="flex flex-col items-center space-y-1.5">
      <div className="flex items-center justify-between w-full text-[11px] font-bold text-muted-foreground px-1">
        <span>📍 Origem do Arremesso (Meia-Quadra)</span>
        {selectedPoint && (
          <span className="font-mono text-accent">
            X: {selectedPoint.x}% | Y: {selectedPoint.y}%
          </span>
        )}
      </div>

      <div className={cn("relative rounded-xl overflow-hidden border-2 border-primary/40 shadow-md bg-amber-900/10", dimensions)}>
        <svg
          viewBox="0 0 400 300"
          className="w-full h-full cursor-crosshair select-none"
          onClick={handleClick}
        >
          {/* Fundo da Meia-Quadra (Piso) */}
          <rect x="0" y="0" width="400" height="300" fill="#1e293b" />
          <rect x="10" y="10" width="380" height="280" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />

          {/* Área de Gol (D-Zone 6m) - Semicírculo Azul */}
          <path
            d="M 120 10 A 100 100 0 0 0 280 10 Z"
            fill="#0284c7"
            fillOpacity="0.25"
            stroke="#0284c7"
            strokeWidth="2.5"
          />

          {/* Linha de Tiro Livre (9m Pontilhada) */}
          <path
            d="M 70 10 A 140 140 0 0 0 330 10"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="6 4"
          />

          {/* Linha de 7 Metros (Penalti) */}
          <line x1="185" y1="95" x2="215" y2="95" stroke="#ef4444" strokeWidth="3" />

          {/* Baliza do Gol (160px a 240px no Y=10) */}
          <rect x="155" y="4" width="90" height="6" fill="#f87171" stroke="#ffffff" strokeWidth="1.5" />
          <text x="200" y="3" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
            GOL
          </text>

          {/* Linha Central / Meio de Quadra (Y=290) */}
          <line x1="10" y1="285" x2="390" y2="285" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 2" />
          <text x="200" y="278" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold">
            LINHA CENTRAL (MEIO-CAMPO)
          </text>

          {/* HISTÓRICO DE ARREMESSO (SE PASSSADO VIA PROPS) */}
          {shots.map((s) => {
            if (s.x == null || s.y == null) return null;
            const px = (s.x / 100) * 380 + 10;
            const py = (s.y / 100) * 280 + 10;
            const isGol = s.result === "gol";
            return (
              <g key={s.id}>
                <circle
                  cx={px}
                  cy={py}
                  r="6"
                  fill={isGol ? "#22c55e" : "#ef4444"}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                {s.player_number != null && (
                  <text x={px} y={py + 3} textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">
                    {s.player_number}
                  </text>
                )}
              </g>
            );
          })}

          {/* PONTO SELECIONADO ATUAL */}
          {selectedPoint && (
            <g>
              <circle
                cx={(selectedPoint.x / 100) * 380 + 10}
                cy={(selectedPoint.y / 100) * 280 + 10}
                r="9"
                fill="#f59e0b"
                fillOpacity="0.6"
                className="animate-ping"
              />
              <circle
                cx={(selectedPoint.x / 100) * 380 + 10}
                cy={(selectedPoint.y / 100) * 280 + 10}
                r="7"
                fill="#eab308"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle
                cx={(selectedPoint.x / 100) * 380 + 10}
                cy={(selectedPoint.y / 100) * 280 + 10}
                r="2"
                fill="#000000"
              />
            </g>
          )}
        </svg>
      </div>

      <p className="text-[10px] text-muted-foreground text-center italic">
        Clique em qualquer local da meia-quadra acima para marcar a origem do arremesso/falta.
      </p>
    </div>
  );
}
