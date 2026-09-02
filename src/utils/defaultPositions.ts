import type { Player, TacticalPreset } from '../types/tactical';

// Formação padrão inicial (6-0 Defesa em Vermelho vs 3-3 Ataque em Azul)
export const DEFAULT_PLAYERS: Player[] = [
  // TIME ATAQUE (Azul - Casa)
  { id: 'att-1', team: 'attack', number: '12', position: 'G', x: 2, y: 50 },
  { id: 'att-2', team: 'attack', number: '7', position: 'PE', x: 26, y: 12 },
  { id: 'att-3', team: 'attack', number: '24', position: 'AE', x: 34, y: 28 },
  { id: 'att-4', team: 'attack', number: '10', position: 'C', x: 37, y: 50 },
  { id: 'att-5', team: 'attack', number: '5', position: 'AD', x: 34, y: 72 },
  { id: 'att-6', team: 'attack', number: '11', position: 'PD', x: 26, y: 88 },
  { id: 'att-7', team: 'attack', number: '9', position: 'PV', x: 21, y: 44 },

  // TIME DEFESA (Vermelho - Visitante)
  { id: 'def-1', team: 'defense', number: '1', position: 'G', x: 5, y: 50 },
  { id: 'def-2', team: 'defense', number: '2', position: 'PE', x: 17, y: 16 },
  { id: 'def-3', team: 'defense', number: '3', position: 'AE', x: 18.5, y: 32 },
  { id: 'def-4', team: 'defense', number: '4', position: 'C', x: 19, y: 44 },
  { id: 'def-5', team: 'defense', number: '6', position: 'C', x: 19, y: 56 },
  { id: 'def-6', team: 'defense', number: '8', position: 'AD', x: 18.5, y: 68 },
  { id: 'def-7', team: 'defense', number: '14', position: 'PD', x: 17, y: 84 },

  // BOLA
  { id: 'ball-1', team: 'ball', number: '', position: 'BOLA', x: 37, y: 53 },
];

export const TACTICAL_PRESETS: TacticalPreset[] = [
  {
    id: 'preset-6-0',
    name: 'Defesa 6-0 Clássica',
    description: 'Sistema defensivo compacto na linha dos 6 metros travando os pivôs e finalizações de média distância.',
    category: 'defensive',
    players: DEFAULT_PLAYERS,
  },
  {
    id: 'preset-5-1',
    name: 'Defesa 5-1 com Avançado',
    description: 'Um defensor avança na linha dos 9m para pressionar o armador central e interceptar passes.',
    category: 'defensive',
    players: [
      // TIME ATAQUE
      { id: 'att-1', team: 'attack', number: '12', position: 'G', x: 2, y: 50 },
      { id: 'att-2', team: 'attack', number: '7', position: 'PE', x: 26, y: 12 },
      { id: 'att-3', team: 'attack', number: '24', position: 'AE', x: 34, y: 28 },
      { id: 'att-4', team: 'attack', number: '10', position: 'C', x: 38, y: 50 },
      { id: 'att-5', team: 'attack', number: '5', position: 'AD', x: 34, y: 72 },
      { id: 'att-6', team: 'attack', number: '11', position: 'PD', x: 26, y: 88 },
      { id: 'att-7', team: 'attack', number: '9', position: 'PV', x: 21, y: 58 },

      // TIME DEFESA (5-1)
      { id: 'def-1', team: 'defense', number: '1', position: 'G', x: 5, y: 50 },
      { id: 'def-2', team: 'defense', number: '2', position: 'PE', x: 17, y: 16 },
      { id: 'def-3', team: 'defense', number: '3', position: 'AE', x: 18.5, y: 34 },
      { id: 'def-4', team: 'defense', number: '4', position: 'C', x: 19, y: 50 },
      { id: 'def-5', team: 'defense', number: '6', position: 'AD', x: 18.5, y: 66 },
      { id: 'def-6', team: 'defense', number: '14', position: 'PD', x: 17, y: 84 },
      { id: 'def-7', team: 'defense', number: '5', position: 'AV', x: 27, y: 50 }, // Defensor avançado

      // BOLA
      { id: 'ball-1', team: 'ball', number: '', position: 'BOLA', x: 38, y: 53 },
    ],
  },
  {
    id: 'preset-3-2-1',
    name: 'Defesa 3-2-1 Dinâmica',
    description: 'Sistema defensivo agressivo em profundidade, criando armadilhas e forçando erros no passe.',
    category: 'defensive',
    players: [
      { id: 'att-1', team: 'attack', number: '12', position: 'G', x: 2, y: 50 },
      { id: 'att-2', team: 'attack', number: '7', position: 'PE', x: 26, y: 12 },
      { id: 'att-3', team: 'attack', number: '24', position: 'AE', x: 34, y: 28 },
      { id: 'att-4', team: 'attack', number: '10', position: 'C', x: 37, y: 50 },
      { id: 'att-5', team: 'attack', number: '5', position: 'AD', x: 34, y: 72 },
      { id: 'att-6', team: 'attack', number: '11', position: 'PD', x: 26, y: 88 },
      { id: 'att-7', team: 'attack', number: '9', position: 'PV', x: 20, y: 50 },

      // TIME DEFESA (3-2-1)
      { id: 'def-1', team: 'defense', number: '1', position: 'G', x: 5, y: 50 },
      { id: 'def-2', team: 'defense', number: '2', position: 'PE', x: 17, y: 18 },
      { id: 'def-3', team: 'defense', number: '4', position: 'C', x: 19, y: 50 },
      { id: 'def-4', team: 'defense', number: '14', position: 'PD', x: 17, y: 82 },
      { id: 'def-5', team: 'defense', number: '3', position: 'AE', x: 24, y: 32 },
      { id: 'def-6', team: 'defense', number: '8', position: 'AD', x: 24, y: 68 },
      { id: 'def-7', team: 'defense', number: '5', position: 'AV', x: 28, y: 50 },

      { id: 'ball-1', team: 'ball', number: '', position: 'BOLA', x: 37, y: 53 },
    ],
  },
  {
    id: 'preset-7x6-double-pivot',
    name: 'Ataque 7x6 (Dois Pivôs / 2-4)',
    description: 'Ataque em linha superior com goleiro-linha e dois pivôs infiltrados criando espaço nos 6 metros.',
    category: 'offensive',
    players: [
      // TIME ATAQUE (7 jogadores de campo)
      { id: 'att-1', team: 'attack', number: '88', position: 'PE', x: 25, y: 10 },
      { id: 'att-2', team: 'attack', number: '24', position: 'AE', x: 35, y: 30 },
      { id: 'att-3', team: 'attack', number: '10', position: 'C', x: 37, y: 50 },
      { id: 'att-4', team: 'attack', number: '5', position: 'AD', x: 35, y: 70 },
      { id: 'att-5', team: 'attack', number: '11', position: 'PD', x: 25, y: 90 },
      { id: 'att-6', team: 'attack', number: '9', position: 'PV1', x: 21, y: 38 },
      { id: 'att-7', team: 'attack', number: '19', position: 'PV2', x: 21, y: 62 },

      // TIME DEFESA (6-0)
      { id: 'def-1', team: 'defense', number: '1', position: 'G', x: 5, y: 50 },
      { id: 'def-2', team: 'defense', number: '2', position: 'PE', x: 17, y: 16 },
      { id: 'def-3', team: 'defense', number: '3', position: 'AE', x: 18.5, y: 32 },
      { id: 'def-4', team: 'defense', number: '4', position: 'C', x: 19, y: 44 },
      { id: 'def-5', team: 'defense', number: '6', position: 'C', x: 19, y: 56 },
      { id: 'def-6', team: 'defense', number: '8', position: 'AD', x: 18.5, y: 68 },
      { id: 'def-7', team: 'defense', number: '14', position: 'PD', x: 17, y: 84 },

      { id: 'ball-1', team: 'ball', number: '', position: 'BOLA', x: 35, y: 33 },
    ],
  },
  {
    id: 'preset-fast-break',
    name: 'Contra-Ataque Direto',
    description: 'Transição defensiva para ofensiva com pontas e armadores disparando na saída de bola.',
    category: 'offensive',
    players: [
      // TIME ATAQUE EM TRANSIÇÃO
      { id: 'att-1', team: 'attack', number: '12', position: 'G', x: 6, y: 50 },
      { id: 'att-2', team: 'attack', number: '7', position: 'PE', x: 65, y: 10 },
      { id: 'att-3', team: 'attack', number: '24', position: 'AE', x: 52, y: 30 },
      { id: 'att-4', team: 'attack', number: '10', position: 'C', x: 45, y: 50 },
      { id: 'att-5', team: 'attack', number: '5', position: 'AD', x: 52, y: 70 },
      { id: 'att-6', team: 'attack', number: '11', position: 'PD', x: 65, y: 90 },
      { id: 'att-7', team: 'attack', number: '9', position: 'PV', x: 48, y: 50 },

      // TIME DEFESA RECOMPONDO
      { id: 'def-1', team: 'defense', number: '1', position: 'G', x: 95, y: 50 },
      { id: 'def-2', team: 'defense', number: '2', position: 'PE', x: 75, y: 20 },
      { id: 'def-3', team: 'defense', number: '3', position: 'AE', x: 68, y: 35 },
      { id: 'def-4', team: 'defense', number: '4', position: 'C', x: 60, y: 50 },
      { id: 'def-5', team: 'defense', number: '6', position: 'C', x: 60, y: 50 },
      { id: 'def-6', team: 'defense', number: '8', position: 'AD', x: 68, y: 65 },
      { id: 'def-7', team: 'defense', number: '14', position: 'PD', x: 75, y: 80 },

      { id: 'ball-1', team: 'ball', number: '', position: 'BOLA', x: 12, y: 50 },
    ],
  },
];
