import React from 'react';
import type { CourtMode, CourtTheme } from '../../types/tactical';
import { COURT_THEMES } from '../../utils/courtDrawings';

interface CourtProps {
  theme: CourtTheme;
  mode: CourtMode;
  children?: React.ReactNode;
}

export const Court: React.FC<CourtProps> = ({ theme, mode, children }) => {
  const colors = COURT_THEMES[theme];

  // Configuração do ViewBox para Meia Quadra vs Quadra Inteira
  let viewBox = '0 0 1000 500';
  if (mode === 'half_attack') {
    // Foco na meia quadra ofensiva (lado direito x: 500 a 1000)
    viewBox = '500 0 500 500';
  } else if (mode === 'half_defense') {
    // Foco na meia quadra defensiva (lado esquerdo x: 0 a 500)
    viewBox = '0 0 500 500';
  }

  return (
    <div className="relative w-full h-full select-none overflow-hidden rounded-xl shadow-2xl transition-all duration-300">
      <svg
        viewBox={viewBox}
        className="w-full h-full block"
        style={{ backgroundColor: colors.bg }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* --- PISO & ÁREAS --- */}
        {/* Fundo total da quadra */}
        <rect x="0" y="0" width="1000" height="500" fill={colors.bg} />

        {/* --- ÁREA DE 6M (ESQUERDA) --- */}
        <path
          d="M 0 62.5 A 150 150 0 0 1 150 212.5 L 150 287.5 A 150 150 0 0 1 0 437.5 Z"
          fill={colors.area}
          stroke={colors.lines}
          strokeWidth="4"
        />

        {/* --- ÁREA DE 6M (DIREITA) --- */}
        <path
          d="M 1000 62.5 A 150 150 0 0 0 850 212.5 L 850 287.5 A 150 150 0 0 0 1000 437.5 Z"
          fill={colors.area}
          stroke={colors.lines}
          strokeWidth="4"
        />

        {/* --- LINHA DE 9M TRACEJADA (ESQUERDA) --- */}
        <path
          d="M 0 -12.5 A 225 225 0 0 1 225 212.5 L 225 287.5 A 225 225 0 0 1 0 512.5"
          fill="none"
          stroke={colors.lines}
          strokeWidth="3.5"
          strokeDasharray="16 10"
        />

        {/* --- LINHA DE 9M TRACEJADA (DIREITA) --- */}
        <path
          d="M 1000 -12.5 A 225 225 0 0 0 775 212.5 L 775 287.5 A 225 225 0 0 0 1000 512.5"
          fill="none"
          stroke={colors.lines}
          strokeWidth="3.5"
          strokeDasharray="16 10"
        />

        {/* --- LINHA CENTRAL & CÍRCULO --- */}
        <line x1="500" y1="0" x2="500" y2="500" stroke={colors.lines} strokeWidth="4" />
        <circle cx="500" cy="250" r="100" fill="none" stroke={colors.lines} strokeWidth="4" />
        <circle cx="500" cy="250" r="6" fill={colors.lines} />

        {/* --- MARCAÇÕES DE 4M (GOLEIRO) E 7M (PÊNALTI) --- */}
        {/* Esquerda */}
        <line x1="100" y1="240" x2="100" y2="260" stroke={colors.lines} strokeWidth="4" /> {/* 4m */}
        <line x1="175" y1="230" x2="175" y2="270" stroke={colors.lines} strokeWidth="5" /> {/* 7m */}

        {/* Direita */}
        <line x1="900" y1="240" x2="900" y2="260" stroke={colors.lines} strokeWidth="4" /> {/* 4m */}
        <line x1="825" y1="230" x2="825" y2="270" stroke={colors.lines} strokeWidth="5" /> {/* 7m */}

        {/* --- ZONAS DE SUBSTITUIÇÃO (4.5m do centro nas laterais) --- */}
        <line x1="387.5" y1="0" x2="387.5" y2="15" stroke={colors.lines} strokeWidth="4" />
        <line x1="612.5" y1="0" x2="612.5" y2="15" stroke={colors.lines} strokeWidth="4" />

        {/* --- BALIZAS / GOLS --- */}
        {/* Gol Esquerdo */}
        <g id="goal-left">
          <rect x="-25" y="212.5" width="25" height="75" fill={colors.goal} stroke="#ffffff" strokeWidth="2" opacity="0.9" />
          <path d="M -25 212.5 L 0 212.5 M -25 287.5 L 0 287.5" stroke="#ffffff" strokeWidth="4" />
          {/* Rede de gol */}
          <pattern id="net-pattern" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M 0 6 L 6 0 M 0 0 L 6 6" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.6" />
          </pattern>
          <rect x="-25" y="212.5" width="25" height="75" fill="url(#net-pattern)" />
        </g>

        {/* Gol Direito */}
        <g id="goal-right">
          <rect x="1000" y="212.5" width="25" height="75" fill={colors.goal} stroke="#ffffff" strokeWidth="2" opacity="0.9" />
          <path d="M 1000 212.5 L 1025 212.5 M 1000 287.5 L 1025 287.5" stroke="#ffffff" strokeWidth="4" />
          <rect x="1000" y="212.5" width="25" height="75" fill="url(#net-pattern)" />
        </g>

        {/* BORDA EXTERNA */}
        <rect x="0" y="0" width="1000" height="500" fill="none" stroke={colors.lines} strokeWidth="6" />
      </svg>

      {/* Camadas Filhas: Canvas de Desenho e Fichas de Jogadores */}
      <div className="absolute inset-0 pointer-events-auto">
        {children}
      </div>
    </div>
  );
};
