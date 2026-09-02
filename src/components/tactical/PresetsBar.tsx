import React from 'react';
import { TACTICAL_PRESETS } from '../../utils/defaultPositions';
import type { TacticalPreset } from '../../types/tactical';
import { ShieldAlert, Zap, Layers } from 'lucide-react';

interface PresetsBarProps {
  onSelectPreset: (preset: TacticalPreset) => void;
  activePresetId?: string;
}

export const PresetsBar: React.FC<PresetsBarProps> = ({ onSelectPreset, activePresetId }) => {
  return (
    <div className="bg-slate-900/70 backdrop-blur-sm border border-slate-800 rounded-2xl p-2.5 shadow-xl flex items-center justify-between gap-2 overflow-x-auto scrollbar-thin">
      <div className="flex items-center gap-2 px-2 text-slate-400 font-bold text-xs uppercase tracking-wider whitespace-nowrap">
        <Layers className="w-4 h-4 text-cyan-400" />
        <span>Sistemas Táticos:</span>
      </div>

      <div className="flex items-center gap-2">
        {TACTICAL_PRESETS.map((preset) => {
          const isDef = preset.category === 'defensive';
          const isActive = activePresetId === preset.id;

          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              title={preset.description}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap border ${
                isActive
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20 scale-105'
                  : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              {isDef ? (
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
