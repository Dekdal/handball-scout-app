import React, { useRef, useState } from 'react';
import type { Player, CourtMode } from '../../types/tactical';

interface PlayerChipProps {
  player: Player;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onDoubleClick: (player: Player) => void;
  mode: CourtMode;
  isSelected?: boolean;
  onSelect?: (player: Player) => void;
}

export const PlayerChip: React.FC<PlayerChipProps> = ({
  player,
  onUpdatePosition,
  onDoubleClick,
  mode,
  isSelected,
  onSelect,
}) => {
  const chipRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calcula a posição percentual ajustada de acordo com o modo da quadra
  let displayX = player.x;
  if (mode === 'half_attack') {
    displayX = (player.x - 50) * 2;
  } else if (mode === 'half_defense') {
    displayX = player.x * 2;
  }

  // Oculta se o jogador estiver fora da visão na meia quadra
  if (displayX < -5 || displayX > 105) {
    return null;
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    if (onSelect) onSelect(player);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.stopPropagation();

    const parent = chipRef.current?.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    let xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    let yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    // Clampa valores dentro da quadra
    xPercent = Math.max(1, Math.min(99, xPercent));
    yPercent = Math.max(1, Math.min(99, yPercent));

    // Desfaz o mapeamento de meia quadra para coordenadas absolutas (0-100)
    let absoluteX = xPercent;
    if (mode === 'half_attack') {
      absoluteX = 50 + xPercent / 2;
    } else if (mode === 'half_defense') {
      absoluteX = xPercent / 2;
    }

    onUpdatePosition(player.id, absoluteX, yPercent);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignora se ponteiro já libertado
    }
    setIsDragging(false);
  };

  const isBall = player.team === 'ball';
  const isAttack = player.team === 'attack';

  return (
    <div
      ref={chipRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={() => onDoubleClick(player)}
      style={{
        left: `${displayX}%`,
        top: `${player.y}%`,
      }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 touch-none select-none cursor-grab active:cursor-grabbing transition-transform duration-75 ${
        isDragging ? 'scale-125 z-30 opacity-90' : 'hover:scale-110'
      }`}
    >
      {isBall ? (
        // FICHA DA BOLA DE HANDEBOL
        <div className="relative group">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-amber-700 via-amber-500 to-yellow-300 border-2 border-amber-950 shadow-lg flex items-center justify-center transform group-hover:rotate-12 transition-all">
            {/* Textura de costura da bola */}
            <div className="w-full h-full rounded-full border border-amber-900/40 relative flex items-center justify-center">
              <span className="text-[10px] font-black text-amber-950 tracking-tighter">HB</span>
            </div>
          </div>
          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-black text-amber-300 bg-black/70 px-1 rounded uppercase tracking-wider">
            BOLA
          </span>
        </div>
      ) : (
        // FICHA DO JOGADOR
        <div className="relative flex flex-col items-center group">
          <div
            className={`w-9 h-9 md:w-12 md:h-12 rounded-full border-2 flex flex-col items-center justify-center shadow-xl transition-all ${
              isAttack
                ? 'bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-900 border-cyan-300 text-white shadow-blue-500/40'
                : 'bg-gradient-to-br from-red-500 via-rose-600 to-red-950 border-amber-300 text-white shadow-red-500/40'
            } ${isSelected ? 'ring-4 ring-yellow-400 scale-110' : ''}`}
            style={player.customColor ? { backgroundColor: player.customColor } : undefined}
          >
            {/* Número da Camisa */}
            <span className="text-xs md:text-sm font-black tracking-tight drop-shadow">
              {player.number}
            </span>

            {/* Sigla da Posição dentro da ficha */}
            <span className="text-[8px] md:text-[9px] font-bold opacity-90 -mt-0.5 tracking-tighter uppercase">
              {player.position}
            </span>
          </div>

          {/* Indicador visual de duplo clique ao passar o mouse */}
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-white bg-slate-900/90 border border-slate-700/60 px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            2x para editar
          </span>
        </div>
      )}
    </div>
  );
};
