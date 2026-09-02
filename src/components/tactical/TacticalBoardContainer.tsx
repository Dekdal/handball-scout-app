import React, { useState } from 'react';
import type { Player, DrawingStroke, ToolType, CourtMode, CourtTheme, TacticalPreset } from '../../types/tactical';
import { DEFAULT_PLAYERS } from '../../utils/defaultPositions';
import { Court } from './Court';
import { CanvasOverlay } from './CanvasOverlay';
import { PlayerChip } from './PlayerChip';
import { ControlBar } from './ControlBar';
import { PresetsBar } from './PresetsBar';
import { EditPlayerModal } from './EditPlayerModal';
import { exportTacticalBoardToPNG } from '../../utils/exportImage';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface TacticalBoardContainerProps {
  game?: any;
  teamName?: string;
  opponentName?: string;
}

export function TacticalBoardContainer({ game, teamName, opponentName }: TacticalBoardContainerProps) {
  // Estado dos Jogadores
  const [players, setPlayers] = useState<Player[]>(DEFAULT_PLAYERS);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Estado das Ferramentas e Canvas
  const [tool, setTool] = useState<ToolType>('select');
  const [color, setColor] = useState('#ffffff');
  const [lineWidth, setLineWidth] = useState(5);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>('preset-6-0');

  // Estado da Quadra
  const [mode, setMode] = useState<CourtMode>('full');
  const [theme, setTheme] = useState<CourtTheme>('blue');

  // Mover Posição do Jogador
  const handleUpdatePosition = (id: string, x: number, y: number) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, x, y } : p))
    );
  };

  // Adicionar Traço de Desenho
  const handleAddStroke = (newStroke: DrawingStroke) => {
    setStrokes((prev) => [...prev, newStroke]);
  };

  // Apagar Traço Específico
  const handleRemoveStroke = (strokeId: string) => {
    setStrokes((prev) => prev.filter((s) => s.id !== strokeId));
  };

  // Desfazer Último Traço (Undo)
  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1));
  };

  // Limpar Prancheta
  const handleClearBoard = () => {
    setStrokes([]);
    setPlayers(DEFAULT_PLAYERS);
    setActivePresetId('preset-6-0');
    toast.success('Prancheta limpa e jogadores restaurados para a formação 6-0!');
  };

  // Salvar / Editar Jogador
  const handleSavePlayer = (updatedPlayer: Player) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p))
    );
    toast.success(`Jogador #${updatedPlayer.number} (${updatedPlayer.position}) atualizado!`);
  };

  // Selecionar Preset Tático
  const handleSelectPreset = (preset: TacticalPreset) => {
    setPlayers(preset.players);
    setActivePresetId(preset.id);
    toast.success(`Sistema ${preset.name} aplicado!`);
  };

  // Exportar Imagem PNG
  const handleExportPNG = () => {
    const titleText = game
      ? `Prancheta Tática: ${game.team_name || teamName || 'Equipe'} vs ${game.opponent || opponentName || 'Adversário'}`
      : `Prancheta Tática - ${teamName || 'Handebol'}`;

    exportTacticalBoardToPNG({
      players,
      strokes,
      mode,
      theme,
      title: titleText,
    });

    // Efeito de celebração ao exportar a jogada
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
    });

    toast.success('Jogada tática exportada em imagem PNG com sucesso!');
  };

  return (
    <div className="space-y-4">
      {/* SELETOR DE PRESETS TÁTICOS */}
      <PresetsBar onSelectPreset={handleSelectPreset} activePresetId={activePresetId} />

      {/* QUADRA TÁTICA 2D INTERATIVA */}
      <div className="relative w-full aspect-[2/1] min-h-[420px] max-h-[700px] border-2 border-primary/20 rounded-2xl overflow-hidden shadow-2xl bg-black">
        <Court theme={theme} mode={mode}>
          {/* CAMADA DE DESENHO (TELESTRATOR OVERLAY) */}
          <CanvasOverlay
            tool={tool}
            color={color}
            lineWidth={lineWidth}
            strokes={strokes}
            onAddStroke={handleAddStroke}
            onRemoveStroke={handleRemoveStroke}
            mode={mode}
          />

          {/* FICHAS DOS JOGADORES & BOLA */}
          {players.map((player) => (
            <PlayerChip
              key={player.id}
              player={player}
              onUpdatePosition={handleUpdatePosition}
              onDoubleClick={(p) => setEditingPlayer(p)}
              mode={mode}
            />
          ))}
        </Court>
      </div>

      {/* BARRA DE FERRAMENTAS E CONTROLES */}
      <ControlBar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        lineWidth={lineWidth}
        setLineWidth={setLineWidth}
        mode={mode}
        setMode={setMode}
        theme={theme}
        setTheme={setTheme}
        canUndo={strokes.length > 0}
        onUndo={handleUndo}
        onClear={handleClearBoard}
        onExport={handleExportPNG}
      />

      {/* MODAL DE EDIÇÃO DE JOGADOR */}
      <EditPlayerModal
        player={editingPlayer}
        onClose={() => setEditingPlayer(null)}
        onSave={handleSavePlayer}
      />
    </div>
  );
}
