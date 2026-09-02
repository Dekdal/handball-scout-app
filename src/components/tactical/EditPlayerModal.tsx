import React, { useState, useEffect } from 'react';
import type { Player, PositionCode } from '../../types/tactical';
import { X, Check, Shield } from 'lucide-react';

interface EditPlayerModalProps {
  player: Player | null;
  onClose: () => void;
  onSave: (updatedPlayer: Player) => void;
}

const COMMON_POSITIONS: { code: PositionCode; label: string }[] = [
  { code: 'PE', label: 'Ponta Esquerda' },
  { code: 'AE', label: 'Armador Esquerdo' },
  { code: 'C', label: 'Central' },
  { code: 'AD', label: 'Armador Direito' },
  { code: 'PD', label: 'Ponta Direita' },
  { code: 'PV', label: 'Pivô' },
  { code: 'G', label: 'Goleiro' },
  { code: 'AV', label: 'Defensor Avançado' },
];

export const EditPlayerModal: React.FC<EditPlayerModalProps> = ({ player, onClose, onSave }) => {
  const [number, setNumber] = useState('');
  const [position, setPosition] = useState<PositionCode>('C');

  useEffect(() => {
    if (player) {
      setNumber(player.number);
      setPosition(player.position);
    }
  }, [player]);

  if (!player) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...player,
      number: number.trim() || '0',
      position: position.trim().toUpperCase() || 'JOG',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                player.team === 'attack'
                  ? 'bg-blue-600 border border-cyan-400'
                  : 'bg-red-600 border border-amber-400'
              }`}
            >
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Editar Jogador</h3>
              <p className="text-xs text-slate-400">
                {player.team === 'attack' ? 'Equipe de Ataque (Azul)' : 'Equipe de Defesa (Vermelha)'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Número da Camisa */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Número da Camisa
            </label>
            <input
              type="text"
              maxLength={3}
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Ex: 10"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              autoFocus
            />
          </div>

          {/* Sigla / Posição */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Posição no Handebol
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {COMMON_POSITIONS.map((pos) => (
                <button
                  type="button"
                  key={pos.code}
                  onClick={() => setPosition(pos.code)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between border ${
                    position === pos.code
                      ? 'bg-cyan-600/30 border-cyan-400 text-cyan-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span>{pos.label}</span>
                  <span className="text-[10px] opacity-75 font-mono">({pos.code})</span>
                </button>
              ))}
            </div>

            <input
              type="text"
              maxLength={5}
              value={position}
              onChange={(e) => setPosition(e.target.value.toUpperCase())}
              placeholder="Ou digite outra sigla (ex: C, PV)"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* RODAPÉ E SALVAR */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 font-semibold hover:text-white hover:bg-slate-800 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all text-sm flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
