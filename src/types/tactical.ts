export type TeamId = 'attack' | 'defense' | 'ball';

export type PositionCode = 'PE' | 'AE' | 'C' | 'AD' | 'PD' | 'PV' | 'G' | 'DEF' | string;

export interface Player {
  id: string;
  team: TeamId;
  number: string;
  position: PositionCode;
  name?: string;
  x: number; // Percentual 0 a 100 da largura da quadra
  y: number; // Percentual 0 a 100 da altura da quadra
  customColor?: string;
}

export type ToolType = 'select' | 'brush' | 'line' | 'dashed' | 'eraser';

export interface Point {
  x: number; // Percentual 0-100
  y: number; // Percentual 0-100
}

export interface DrawingStroke {
  id: string;
  tool: 'brush' | 'line' | 'dashed';
  points: Point[];
  color: string;
  width: number;
}

export type CourtMode = 'full' | 'half_attack' | 'half_defense';

export type CourtTheme = 'blue' | 'wood' | 'green';

export interface TacticalPreset {
  id: string;
  name: string;
  description: string;
  category: 'defensive' | 'offensive' | 'special';
  players: Player[];
}
