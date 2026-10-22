import React, { useState } from 'react';
import { KnowledgeQuestion } from '../game/types';
import { Sparkles, CheckCircle2, XCircle, Shield, Zap, ArrowUpCircle } from 'lucide-react';
import { sound } from '../game/audio';

interface QuizModalProps {
  question: KnowledgeQuestion;
  onAnswerComplete: (correct: boolean, chosenReward?: 'feather' | 'super_jump' | 'score') => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({ question, onAnswerComplete }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [rewardChosen, setRewardChosen] = useState<'feather' | 'super_jump' | 'score' | null>(null);

  const handleSelect = (idx: number) => {
    if (submitted) return;
    setSelectedIdx(idx);
    setSubmitted(true);

    const isCorrect = idx === question.correctIndex;
    if (isCorrect) {
      sound.playCorrect();
    } else {
      sound.playWrong();
    }
  };

  const handleClaim = (reward: 'feather' | 'super_jump' | 'score') => {
    setRewardChosen(reward);
    onAnswerComplete(true, reward);
  };

  const isCorrect = selectedIdx === question.correctIndex;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 pointer-events-auto select-none animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-indigo-500/60 rounded-2xl p-6 sm:p-7 shadow-[0_0_50px_rgba(99,102,241,0.25)] flex flex-col gap-4">
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-cinzel font-bold text-amber-300 text-sm sm:text-base tracking-wider uppercase">
              Active Recall Challenge
            </h3>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
            {question.category.toUpperCase().replace('_', ' ')}
          </span>
        </div>

        {/* Question Prompt */}
        <p className="text-white text-base sm:text-lg font-bold leading-snug">
          {question.question}
        </p>

        {/* Multiple Choice Options */}
        <div className="flex flex-col gap-2.5 my-1">
          {question.options.map((option, idx) => {
            let btnStyle = 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-slate-200';
            let icon = <span className="font-mono text-xs w-5 text-slate-400">[{idx + 1}]</span>;

            if (submitted) {
              if (idx === question.correctIndex) {
                btnStyle = 'bg-emerald-950/90 border-emerald-500 text-emerald-200 font-bold';
                icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
              } else if (idx === selectedIdx) {
                btnStyle = 'bg-rose-950/90 border-rose-500 text-rose-200';
                icon = <XCircle className="w-4 h-4 text-rose-400 shrink-0" />;
              } else {
                btnStyle = 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                disabled={submitted}
                onClick={() => handleSelect(idx)}
                className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center gap-3 cursor-pointer ${btnStyle}`}
              >
                {icon}
                <span className="flex-1">{option}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback & Explanation */}
        {submitted && (
          <div className="flex flex-col gap-3 pt-2 border-t border-slate-800 animate-fadeIn">
            <div className={`p-3 rounded-xl text-xs sm:text-sm ${
              isCorrect ? 'bg-emerald-950/60 border border-emerald-600/60 text-emerald-300' : 'bg-amber-950/60 border border-amber-600/60 text-amber-200'
            }`}>
              <div className="font-bold mb-0.5">
                {isCorrect ? '✓ Spot on!' : 'Good try! Remember:'}
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                {question.explanation}
              </p>
            </div>

            {/* If Correct: Choose Blessing */}
            {isCorrect ? (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-300 text-center">
                  Pick your reward:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleClaim('feather')}
                    className="p-2.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-600 text-sky-200 flex flex-col items-center gap-1.5 transition text-center cursor-pointer active:scale-95"
                  >
                    <Shield className="w-5 h-5 text-sky-400" />
                    <span className="font-bold text-[11px]">Safety Feather</span>
                    <span className="text-[9px] text-slate-400">1 Fall Parachute</span>
                  </button>

                  <button
                    onClick={() => handleClaim('super_jump')}
                    className="p-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-200 flex flex-col items-center gap-1.5 transition text-center cursor-pointer active:scale-95"
                  >
                    <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-[11px]">Super Launch</span>
                    <span className="text-[9px] text-slate-400">Instant Boost Up</span>
                  </button>

                  <button
                    onClick={() => handleClaim('score')}
                    className="p-2.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-600 text-amber-200 flex flex-col items-center gap-1.5 transition text-center cursor-pointer active:scale-95"
                  >
                    <Zap className="w-5 h-5 text-amber-400" />
                    <span className="font-bold text-[11px]">+500 Sparks</span>
                    <span className="text-[9px] text-slate-400">Score Bonus</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => onAnswerComplete(false)}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Continue Ascent
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
