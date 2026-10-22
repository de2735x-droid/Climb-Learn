import React, { useState, useEffect } from 'react';
import { STUDY_TIPS } from '../game/knowledgeData';
import { BookOpen, X, Timer, Play, Pause, RotateCcw, Brain, Check, Search } from 'lucide-react';
import { sound } from '../game/audio';

interface CodexModalProps {
  onClose: () => void;
}

export const CodexModal: React.FC<CodexModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'tips' | 'pomodoro'>('tips');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTipId, setSelectedTipId] = useState(STUDY_TIPS[0].id);

  // Pomodoro Timer State
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'study' | 'break'>('study');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            sound.playVictory();
            // Switch modes
            if (timerMode === 'study') {
              setTimerMode('break');
              return 5 * 60;
            } else {
              setTimerMode('study');
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timerMode]);

  const toggleTimer = () => {
    setTimerRunning(!timerRunning);
  };

  const resetTimer = (mode: 'study' | 'break' = timerMode) => {
    setTimerRunning(false);
    setTimerMode(mode);
    setTimerSeconds(mode === 'study' ? 25 * 60 : 5 * 60);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredTips = STUDY_TIPS.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTip = STUDY_TIPS.find(t => t.id === selectedTipId) || STUDY_TIPS[0];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 pointer-events-auto select-none animate-fadeIn">
      <div className="w-full max-w-4xl h-[90vh] max-h-[750px] bg-slate-900 border border-slate-700 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="font-cinzel text-lg font-bold text-white tracking-wide">
                STUDY CODEX
              </h2>
              <p className="text-xs text-slate-400">
                Team Mechatrons · Science-backed student habits &amp; focus timer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('tips')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  activeTab === 'tips' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Study Codex
              </button>
              <button
                onClick={() => setActiveTab('pomodoro')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  activeTab === 'pomodoro' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>Focus Timer</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {activeTab === 'tips' ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Tip List */}
            <div className="w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-950/40">
              {/* Search Bar */}
              <div className="p-3 border-b border-slate-800">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search techniques..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredTips.map((tip) => (
                  <button
                    key={tip.id}
                    onClick={() => setSelectedTipId(tip.id)}
                    className={`w-full p-2.5 rounded-xl text-left transition cursor-pointer ${
                      selectedTipId === tip.id
                        ? 'bg-indigo-950/80 border border-indigo-600/70 text-white'
                        : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                        {tip.category}
                      </span>
                    </div>
                    <div className="font-bold text-xs leading-tight mb-1">{tip.title}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{tip.summary}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Detail View */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5 bg-slate-900">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300">
                  {selectedTip.category}
                </span>
                <h3 className="text-2xl font-black text-white mt-2">
                  {selectedTip.title}
                </h3>
                <p className="text-sm font-semibold text-amber-300 mt-1">
                  {selectedTip.summary}
                </p>
              </div>

              {/* Why it works */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs sm:text-sm leading-relaxed flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <Brain className="w-4 h-4" />
                  <span>Why it works</span>
                </div>
                <p>{selectedTip.deepDive}</p>
              </div>

              {/* Practical Action Steps */}
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-700/50 text-emerald-200 text-xs sm:text-sm leading-relaxed flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Check className="w-4 h-4" />
                  <span>How to use it</span>
                </div>
                <p>{selectedTip.actionableStep}</p>
              </div>
            </div>
          </div>
        ) : (
          /* Real Pomodoro Timer for Students */
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900">
            <div className="max-w-md w-full flex flex-col items-center text-center gap-6">
              {/* Mode switch */}
              <div className="flex p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
                <button
                  onClick={() => resetTimer('study')}
                  className={`px-5 py-2 rounded-lg transition cursor-pointer ${
                    timerMode === 'study' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400'
                  }`}
                >
                  25 Min Deep Focus
                </button>
                <button
                  onClick={() => resetTimer('break')}
                  className={`px-5 py-2 rounded-lg transition cursor-pointer ${
                    timerMode === 'break' ? 'bg-emerald-500 text-slate-950 font-bold shadow' : 'text-slate-400'
                  }`}
                >
                  5 Min Rest
                </button>
              </div>

              {/* Timer Giant Display */}
              <div className="font-mono-numbers text-7xl sm:text-8xl font-black text-white tracking-tight drop-shadow-[0_0_35px_rgba(245,158,11,0.25)]">
                {formatTimer(timerSeconds)}
              </div>

              <p className="text-xs text-slate-400 max-w-xs">
                {timerMode === 'study'
                  ? 'Put your phone away. Dedicate your mind fully to one problem or chapter.'
                  : 'Step away from all screens. Drink a glass of water, stretch, and let your hippocampus consolidate memory.'}
              </p>

              {/* Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleTimer}
                  className={`px-8 py-3.5 rounded-2xl font-black text-sm tracking-wider uppercase transition-all shadow-xl flex items-center gap-2 cursor-pointer active:scale-95 ${
                    timerRunning
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  {timerRunning ? (
                    <>
                      <Pause className="w-5 h-5 fill-white" />
                      <span>PAUSE</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-slate-950" />
                      <span>START FOCUS</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => resetTimer()}
                  className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
