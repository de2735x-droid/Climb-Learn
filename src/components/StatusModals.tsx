import React from 'react';
import { GameStats, RunSummary } from '../game/types';
import { Trophy, RotateCcw, Home, Play, Award, CheckCircle2, AlertCircle } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onRestart, onReturnTitle }) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 pointer-events-auto select-none animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center gap-5">
        <h2 className="font-cinzel text-2xl font-black text-white tracking-wider">
          PAUSED
        </h2>
        <p className="text-xs text-slate-400">
          The climb is suspended. Take a breath or review your route.
        </p>

        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>RESUME CLIMB</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART FROM BASE</span>
          </button>

          <button
            onClick={onReturnTitle}
            className="w-full py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>TITLE MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  stats: GameStats;
  summary: RunSummary;
  onPlayAgain: () => void;
  onReturnTitle: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stats,
  summary,
  onPlayAgain,
  onReturnTitle,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const accuracyPct = Math.round(
    stats.questionsAnswered > 0 ? (stats.questionsCorrect / stats.questionsAnswered) * 100 : 100
  );

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/90 pointer-events-auto select-none animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-500/70 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.3)] flex flex-col items-center text-center gap-5 my-auto">
        {/* Victory Emblem */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center shadow-lg">
            <Trophy className="w-9 h-9 text-amber-400 animate-bounce" />
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
            TEAM MECHATRONS PRESENTS
          </span>
          <h2 className="font-cinzel text-3xl sm:text-4xl font-black text-white tracking-wide mt-1">
            ZENITH CONQUERED!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
            You climbed the entire Spire and mastered the knowledge of the heights!
          </p>
        </div>

        {/* Grade Badge */}
        <div className="px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-500/30 to-amber-600/30 border border-amber-400/80 flex items-center gap-3">
          <Award className="w-6 h-6 text-amber-400" />
          <div className="flex flex-col items-start font-mono-numbers">
            <span className="text-[10px] text-amber-200 uppercase font-bold tracking-widest">RANK</span>
            <span className="text-2xl font-black text-amber-300 leading-none">GRADE {summary.grade}</span>
          </div>
        </div>

        {/* Competition Metrics Grid */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col font-mono-numbers">
            <span className="text-[10px] text-slate-400 uppercase font-bold">SCORE</span>
            <span className="text-lg font-black text-amber-300 mt-0.5">{summary.score}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col font-mono-numbers">
            <span className="text-[10px] text-slate-400 uppercase font-bold">TIME</span>
            <span className="text-lg font-black text-sky-300 mt-0.5">{formatTime(summary.timeSeconds)}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col font-mono-numbers">
            <span className="text-[10px] text-slate-400 uppercase font-bold">ACCURACY</span>
            <span className="text-lg font-black text-emerald-300 mt-0.5">{accuracyPct}%</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col font-mono-numbers">
            <span className="text-[10px] text-slate-400 uppercase font-bold">FALLS</span>
            <span className="text-lg font-black text-slate-300 mt-0.5">{summary.falls}</span>
          </div>
        </div>

        {/* Study tips collected checklist */}
        <div className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-left text-xs">
          <div className="flex items-center justify-between text-slate-400 font-semibold">
            <span>STUDY SECRETS UNLOCKED:</span>
            <span className="text-emerald-400 font-bold">{summary.tipsDiscovered} / {stats.totalTips}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <button
            data-start="true"
            onClick={onPlayAgain}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition shadow-xl cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ASCEND AGAIN</span>
          </button>

          <button
            onClick={onReturnTitle}
            className="py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            TITLE MENU
          </button>
        </div>
      </div>
    </div>
  );
};
