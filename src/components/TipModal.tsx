import React from 'react';
import { StudyTip } from '../game/types';
import { Flag, Sparkles, Check, ArrowRight } from 'lucide-react';

interface TipModalProps {
  tip: StudyTip;
  tipIndex: number;
  totalTips: number;
  onProceedToQuiz: () => void;
  onClose: () => void;
}

export const TipModal: React.FC<TipModalProps> = ({
  tip,
  tipIndex,
  totalTips,
  onProceedToQuiz,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 pointer-events-auto select-none animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/60 rounded-2xl p-5 sm:p-6 shadow-[0_0_35px_rgba(245,158,11,0.2)] flex flex-col gap-3.5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-emerald-400 font-bold text-xs uppercase tracking-wider">
              Checkpoint {tipIndex + 1} of {totalTips}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 px-2 py-0.5 rounded-full bg-slate-800">
            {tip.category}
          </span>
        </div>

        {/* Tip Title & Summary */}
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">
            {tip.title}
          </h2>
          <p className="text-sky-300 font-medium text-xs mt-1 leading-snug">
            {tip.summary}
          </p>
        </div>

        {/* Actionable Student Takeaway */}
        <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white text-[11px] block mb-0.5">Quick Habit:</span>
            <p className="text-slate-300 leading-relaxed text-[11px]">{tip.actionableStep}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            onClick={onProceedToQuiz}
            className="flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Answer Question (+Reward)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};
