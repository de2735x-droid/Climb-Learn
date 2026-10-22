import React from 'react';
import { GameMode, SubjectCategory } from '../game/types';
import { Trophy, BookOpen, Sparkles, Compass, Timer, Play, Bot } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: (mode: GameMode, category: SubjectCategory) => void;
  onOpenCodex: () => void;
  selectedMode: GameMode;
  setSelectedMode: (mode: GameMode) => void;
  selectedCategory: SubjectCategory;
  setSelectedCategory: (cat: SubjectCategory) => void;
  highScore: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenCodex,
  selectedMode,
  setSelectedMode,
  selectedCategory,
  setSelectedCategory,
  highScore,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between items-center p-6 md:p-8 pointer-events-auto bg-slate-950/80 select-none overflow-y-auto">
      {/* Top Bar: Team Mechatrons Badge & Codex button */}
      <div className="w-full max-w-3xl flex justify-between items-center text-xs tracking-wider">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
          <Bot className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-amber-300 tracking-widest text-[11px] uppercase font-mono">
            TEAM MECHATRONS
          </span>
          {highScore > 0 && (
            <>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 font-mono-numbers">BEST: {highScore.toLocaleString()}</span>
            </>
          )}
        </div>

        <button
          onClick={onOpenCodex}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 transition shadow text-xs font-semibold cursor-pointer active:scale-95"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>Study Codex</span>
        </button>
      </div>

      {/* Main Title Centerpiece - Clean & Punchy */}
      <div className="flex flex-col items-center text-center max-w-xl my-auto py-2">
        {/* Mechatrons Spire Emblem */}
        <div className="relative mb-2 flex items-center justify-center">
          <svg className="w-16 h-16 text-amber-400 drop-shadow-[0_0_16px_rgba(251,191,36,0.4)]" viewBox="0 0 100 100" fill="none">
            <polygon points="50,6 92,50 50,94 8,50" stroke="#f59e0b" strokeWidth="2.5" fill="#1e1b4b" fillOpacity="0.7" />
            <path d="M50 20 L50 80 M30 60 L50 40 L70 60" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="20" r="5" fill="#fef08a" />
          </svg>
        </div>

        <h1 className="font-cinzel text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
          CLIMB <span className="text-amber-400">&amp;</span> LEARN
        </h1>

        <p className="text-sky-300 font-semibold text-xs sm:text-sm mt-1 uppercase tracking-widest">
          The Scholar's Spire
        </p>

        <p className="text-slate-400 text-xs sm:text-sm max-w-sm mt-2">
          Precision platformer powered by real study science. Climb up, grab flags, and beat the spire!
        </p>

        {/* Mode Selector - Minimal & Human */}
        <div className="grid grid-cols-3 gap-2.5 w-full mt-5">
          <button
            onClick={() => setSelectedMode('campaign')}
            className={`p-3 rounded-xl text-left border transition cursor-pointer ${
              selectedMode === 'campaign'
                ? 'bg-amber-950/70 border-amber-500 text-white shadow-lg shadow-amber-950/50'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5 text-amber-400 mb-0.5">
              <Compass className="w-3.5 h-3.5" />
              <span className="font-bold text-xs">Campaign</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">6 Flags &amp; Gate</p>
          </button>

          <button
            onClick={() => setSelectedMode('procedural')}
            className={`p-3 rounded-xl text-left border transition cursor-pointer ${
              selectedMode === 'procedural'
                ? 'bg-sky-950/70 border-sky-500 text-white shadow-lg shadow-sky-950/50'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5 text-sky-400 mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-bold text-xs">Endless</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">Infinite Ascent</p>
          </button>

          <button
            onClick={() => setSelectedMode('daily')}
            className={`p-3 rounded-xl text-left border transition cursor-pointer ${
              selectedMode === 'daily'
                ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5 text-emerald-400 mb-0.5">
              <Timer className="w-3.5 h-3.5" />
              <span className="font-bold text-xs">Daily Seed</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">Shared Spire</p>
          </button>
        </div>

        {/* Quick Subject Toggle */}
        <div className="flex items-center justify-center gap-1.5 mt-4 text-xs">
          {(
            [
              ['all', 'All Topics'],
              ['study_skills', 'Study Hacks'],
              ['stem', 'STEM'],
              ['general_science', 'Science'],
            ] as const
          ).map(([cat, label]) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg border transition text-[11px] font-medium cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Start Button */}
        <div className="mt-6 flex flex-col items-center gap-1.5">
          <button
            data-start="true"
            onClick={() => onStartGame(selectedMode, selectedCategory)}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-base tracking-wider transition-all shadow-[0_0_25px_rgba(245,158,11,0.5)] active:scale-95 cursor-pointer flex items-center gap-2.5"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>PLAY NOW</span>
          </button>
          <span className="text-slate-500 text-[11px] font-mono">SPACE / ENTER to launch</span>
        </div>
      </div>

      {/* Clean controls line */}
      <div className="w-full text-center text-[11px] text-slate-500 font-mono tracking-wider pt-2 border-t border-slate-900">
        <span>A / D Move · Hold W / SPACE to Charge · Release to Leap · ESC Pause</span>
      </div>
    </div>
  );
};
