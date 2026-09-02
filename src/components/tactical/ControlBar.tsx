import React from 'react';
import type { ToolType, CourtMode, CourtTheme } from '../../types/tactical';
import {
  MousePointer,
  Pencil,
  ArrowUpRight,
  MoveHorizontal,
  Eraser,
  Undo2,
  Trash2,
  Download,
  ZoomIn,
  Palette,
} from 'lucide-react';

interface ControlBarProps {
  tool: ToolType;
  setTool: (tool: ToolType) => void;
  color: string;
  setColor: (color: string) => void;
  lineWidth: number;
  setLineWidth: (width: number) => void;
  mode: CourtMode;
  setMode: (mode: CourtMode) => void;
  theme: CourtTheme;
  setTheme: (theme: CourtTheme) => void;
  canUndo: boolean;
  onUndo: () => void;
  onClear: () => void;
  onExport: () => void;
}

const COLOR_OPTIONS = [
  { hex: '#ffffff', name: 'Branco' },
  { hex: '#facc15', name: 'Amarelo' },
  { hex: '#4ade80', name: 'Verde Neón' },
  { hex: '#ef4444', name: 'Vermelho' },
  { hex: '#38bdf8', name: 'Ciano' },
  { hex: '#000000', name: 'Preto' },
];

export const ControlBar: React.FC<ControlBarProps> = ({
  tool,
  setTool,
  color,
  setColor,
  lineWidth,
  setLineWidth,
  mode,
  setMode,
  theme,
  setTheme,
  canUndo,
  onUndo,
  onClear,
  onExport,
}) => {
  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-3 md:p-4 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-white">
      {/* SEÇÃO 1: FERRAMENTAS DE ARRASTE E DESENHO */}
      <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80">
        {/* Mover Jogadores */}
        <button
          onClick={() => setTool('select')}
          title="Mover Jogadores / Selecionar (Pointer)"
          className={`p-2.5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition-all ${
            tool === 'select'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <MousePointer className="w-4 h-4" />
          <span className="hidden sm:inline">Mover</span>
        </button>

        <div className="w-px h-6 bg-slate-800 my-auto" />

        {/* Pincel Livre */}
        <button
          onClick={() => setTool('brush')}
          title="Pincel Livre - Desenhar rotas de infiltração e fintas"
          className={`p-2.5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition-all ${
            tool === 'brush'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Pencil className="w-4 h-4" />
          <span className="hidden sm:inline">Infiltração</span>
        </button>

        {/* Linha Reta / Seta */}
        <button
          onClick={() => setTool('line')}
          title="Linha Reta / Seta - Deslocamento direto de jogador"
          className={`p-2.5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition-all ${
            tool === 'line'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span className="hidden sm:inline">Deslocamento</span>
        </button>

        {/* Linha Tracejada / Passe */}
        <button
          onClick={() => setTool('dashed')}
          title="Linha Tracejada - Trajetória e opção de passe de bola"
          className={`p-2.5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition-all ${
            tool === 'dashed'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <MoveHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Passe Bola</span>
        </button>

        {/* Borracha */}
        <button
          onClick={() => setTool('eraser')}
          title="Borracha - Apagar traço individual ao tocar"
          className={`p-2.5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition-all ${
            tool === 'eraser'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Eraser className="w-4 h-4" />
          <span className="hidden sm:inline">Borracha</span>
        </button>
      </div>

      {/* SEÇÃO 2: SELETOR DE CORES E ESPESSURA */}
      {tool !== 'select' && tool !== 'eraser' && (
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 animate-in fade-in">
          <Palette className="w-4 h-4 text-slate-400 ml-1" />
          <div className="flex items-center gap-1">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.hex}
                onClick={() => setColor(c.hex)}
                title={`Cor ${c.name}`}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  color === c.hex
                    ? 'scale-125 border-white ring-2 ring-cyan-400/50'
                    : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>

          <div className="w-px h-6 bg-slate-800 mx-1" />

          {/* Espessura */}
          <div className="flex items-center gap-1 px-1">
            <span className="text-[10px] text-slate-400 font-bold">Tam:</span>
            {[3, 5, 8].map((w) => (
              <button
                key={w}
                onClick={() => setLineWidth(w)}
                className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                  lineWidth === w ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {w === 3 ? 'P' : w === 5 ? 'M' : 'G'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SEÇÃO 3: CONTROLES DA QUADRA (ZOOM & PISO) */}
      <div className="flex items-center gap-2">
        {/* Toggle Zoom: Quadra Inteira vs Meia Quadra */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setMode('full')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'full' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Quadra Inteira
          </button>
          <button
            onClick={() => setMode('half_attack')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              mode === 'half_attack' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ZoomIn className="w-3.5 h-3.5" />
            Meia Quadra
          </button>
        </div>

        {/* Tema do Piso */}
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as CourtTheme)}
          className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500 cursor-pointer"
        >
          <option value="blue">Piso Azul Oficial</option>
          <option value="wood">Taco de Madeira</option>
          <option value="green">Piso Verde Clássico</option>
        </select>
      </div>

      {/* SEÇÃO 4: AÇÕES GERAIS (DESFAZER, LIMPAR, SALVAR) */}
      <div className="flex items-center gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Desfazer último traço (Undo)"
          className="p-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 rounded-xl transition-all font-bold text-xs flex items-center gap-1"
        >
          <Undo2 className="w-4 h-4" />
          <span className="hidden lg:inline">Desfazer</span>
        </button>

        {/* Limpar Prancheta */}
        <button
          onClick={onClear}
          title="Limpar todos os desenhos e resetar posições dos jogadores"
          className="px-3 py-2.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-200 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-950/30"
        >
          <Trash2 className="w-4 h-4" />
          <span>Limpar Prancheta</span>
        </button>

        {/* Exportar PNG */}
        <button
          onClick={onExport}
          title="Salvar visão atual do quadro tático como Imagem PNG"
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl transition-all text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/30 animate-pulse"
        >
          <Download className="w-4 h-4" />
          <span>Salvar Jogada</span>
        </button>
      </div>
    </div>
  );
};
