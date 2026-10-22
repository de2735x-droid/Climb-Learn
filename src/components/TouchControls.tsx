import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';

interface TouchControlsProps {
  onInput: (control: 'left' | 'right' | 'jumpCharge', active: boolean) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onInput }) => {
  return (
    <div className="absolute inset-x-0 bottom-4 pointer-events-none z-20 flex justify-between px-6 select-none sm:hidden">
      {/* Left/Right directional cluster */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onTouchStart={(e) => { e.preventDefault(); onInput('left', true); }}
          onTouchEnd={(e) => { e.preventDefault(); onInput('left', false); }}
          onMouseDown={() => onInput('left', true)}
          onMouseUp={() => onInput('left', false)}
          className="w-14 h-14 rounded-2xl bg-slate-900/80 active:bg-indigo-600/80 border border-slate-700 active:border-indigo-400 text-white flex items-center justify-center shadow-lg active:scale-95 transition"
          aria-label="Move Left"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <button
          onTouchStart={(e) => { e.preventDefault(); onInput('right', true); }}
          onTouchEnd={(e) => { e.preventDefault(); onInput('right', false); }}
          onMouseDown={() => onInput('right', true)}
          onMouseUp={() => onInput('right', false)}
          className="w-14 h-14 rounded-2xl bg-slate-900/80 active:bg-indigo-600/80 border border-slate-700 active:border-indigo-400 text-white flex items-center justify-center shadow-lg active:scale-95 transition"
          aria-label="Move Right"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {/* Jump Charge Button */}
      <div className="pointer-events-auto">
        <button
          onTouchStart={(e) => { e.preventDefault(); onInput('jumpCharge', true); }}
          onTouchEnd={(e) => { e.preventDefault(); onInput('jumpCharge', false); }}
          onMouseDown={() => onInput('jumpCharge', true)}
          onMouseUp={() => onInput('jumpCharge', false)}
          className="w-16 h-16 rounded-2xl bg-amber-500/90 active:bg-amber-400 border border-amber-300 text-slate-950 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-90 transition font-bold"
          aria-label="Hold to Charge Jump, Release to Leap"
        >
          <ArrowUp className="w-6 h-6 stroke-[3]" />
          <span className="text-[9px] tracking-wider uppercase font-black">LEAP</span>
        </button>
      </div>
    </div>
  );
};
