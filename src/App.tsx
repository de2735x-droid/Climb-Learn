/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameMode, SubjectCategory, GameStats, RunSummary, KnowledgeQuestion } from './game/types';
import { SpireGameEngine } from './game/engine';
import { STUDY_TIPS, getCheckpointQuestion } from './game/knowledgeData';
import { calculateScore, calculateGrade } from './game/rules';
import { sound } from './game/audio';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { QuizModal } from './components/QuizModal';
import { TipModal } from './components/TipModal';
import { CodexModal } from './components/CodexModal';
import { PauseModal, VictoryModal } from './components/StatusModals';
import { TouchControls } from './components/TouchControls';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<SpireGameEngine | null>(null);

  // High-level Game State Machine
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'victory'>('title');

  // Modes & Subjects
  const [selectedMode, setSelectedMode] = useState<GameMode>('campaign');
  const [selectedCategory, setSelectedCategory] = useState<SubjectCategory>('all');

  // Modals & Unique Checkpoint Questions
  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [activeTipIndex, setActiveTipIndex] = useState<number | null>(null);
  const [activeQuizQuestion, setActiveQuizQuestion] = useState<KnowledgeQuestion | null>(null);
  const [currentCheckpointIdx, setCurrentCheckpointIdx] = useState<number>(0);
  const [usedQuestionIds, setUsedQuestionIds] = useState<Set<string>>(new Set());

  // HUD & Stats
  const [stats, setStats] = useState<GameStats>({
    altitude: 0,
    maxAltitude: 0,
    score: 0,
    gemsCollected: 0,
    tipsCollected: 0,
    totalTips: STUDY_TIPS.length,
    questionsAnswered: 0,
    questionsCorrect: 0,
    falls: 0,
    safetiesUsed: 0,
    timeElapsed: 0,
    combo: 0,
    bestCombo: 0,
  });

  const [hasKey, setHasKey] = useState(false);
  const [hasFeather, setHasFeather] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [highScore, setHighScore] = useState<number>(0);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);

  // Sync state to body dataset
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Load High Score
  useEffect(() => {
    try {
      const saved = localStorage.getItem('spire_high_score');
      if (saved) setHighScore(parseInt(saved, 10));
    } catch {
      // Storage unavailable in private browsing
    }
  }, []);

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  // Initialize Game Engine once
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new SpireGameEngine(canvasRef.current, {
      onScoreUpdate: (delta, _reason) => {
        setStats(prev => ({ ...prev, score: prev.score + delta }));
      },
      onAltitudeChange: (altitude, maxAltitude) => {
        setStats(prev => ({
          ...prev,
          altitude,
          maxAltitude,
          score: calculateScore({
            maxAltitude,
            gemsCollected: prev.gemsCollected,
            questionsCorrect: prev.questionsCorrect,
            falls: prev.falls,
            timeSeconds: prev.timeElapsed,
            victory: false,
          }),
        }));
      },
      onCheckpointReached: (checkpointIndex) => {
        setStats(prev => ({
          ...prev,
          tipsCollected: Math.max(prev.tipsCollected, checkpointIndex + 1),
        }));
        setCurrentCheckpointIdx(checkpointIndex);
        setActiveTipIndex(checkpointIndex);
      },
      onKnowledgePrompt: () => {
        // Triggered via TipModal "Proceed to Quiz"
      },
      onGemCollected: (count) => {
        setStats(prev => ({ ...prev, gemsCollected: count }));
      },
      onKeyFound: () => {
        setHasKey(true);
        triggerToast('Scholar Key obtained! The Gateway is open.');
      },
      onFall: (fallCount) => {
        setStats(prev => ({ ...prev, falls: fallCount }));
        triggerToast('Fell from height! Returning to checkpoint...');
      },
      onVictory: (timeSeconds) => {
        setGameState('victory');
        const calculated = calculateScore({
          maxAltitude: 2400,
          gemsCollected: stats.gemsCollected,
          questionsCorrect: stats.questionsCorrect,
          falls: stats.falls,
          timeSeconds,
          victory: true,
        });

        const acc = stats.questionsAnswered > 0 ? stats.questionsCorrect / stats.questionsAnswered : 1.0;
        const grade = calculateGrade(calculated, true, acc);

        const summary: RunSummary = {
          mode: selectedMode,
          date: new Date().toLocaleDateString(),
          altitude: 2400,
          maxAltitude: 2400,
          score: calculated,
          grade,
          timeSeconds,
          falls: stats.falls,
          questionsCorrect: stats.questionsCorrect,
          totalQuestions: stats.questionsAnswered,
          tipsDiscovered: stats.tipsCollected,
          victory: true,
        };

        setRunSummary(summary);

        try {
          if (calculated > highScore) {
            setHighScore(calculated);
            localStorage.setItem('spire_high_score', calculated.toString());
          }
        } catch {
          // ignore
        }
      },
      onToast: (msg) => {
        triggerToast(msg);
      },
    });

    engineRef.current = engine;

    // Window resize handler
    const handleResize = () => {
      if (canvasRef.current) {
        engine.resize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Check autostart parameter for ultra-mode verification
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startGame('campaign', 'all');
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
    };
  }, []);

  const startGame = useCallback((mode: GameMode, category: SubjectCategory) => {
    setSelectedMode(mode);
    setSelectedCategory(category);
    setGameState('playing');
    setHasKey(false);
    setHasFeather(false);
    setActiveTipIndex(null);
    setActiveQuizQuestion(null);
    setIsCodexOpen(false);
    setUsedQuestionIds(new Set());
    setCurrentCheckpointIdx(0);

    setStats({
      altitude: 0,
      maxAltitude: 0,
      score: 0,
      gemsCollected: 0,
      tipsCollected: 0,
      totalTips: STUDY_TIPS.length,
      questionsAnswered: 0,
      questionsCorrect: 0,
      falls: 0,
      safetiesUsed: 0,
      timeElapsed: 0,
      combo: 0,
      bestCombo: 0,
    });

    if (engineRef.current) {
      engineRef.current.startRun(mode, category);
    }
  }, []);

  const handlePause = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('paused');
      if (engineRef.current) engineRef.current.setPaused(true);
    }
  }, [gameState]);

  const handleResume = useCallback(() => {
    if (gameState === 'paused') {
      setGameState('playing');
      if (engineRef.current) engineRef.current.setPaused(false);
    }
  }, [gameState]);

  const handleRestart = useCallback(() => {
    startGame(selectedMode, selectedCategory);
  }, [startGame, selectedMode, selectedCategory]);

  const handleReturnTitle = useCallback(() => {
    setGameState('title');
    if (engineRef.current) engineRef.current.stop();
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
    triggerToast(nextMuted ? 'Audio Muted' : 'Audio Unmuted');
  }, [triggerToast]);

  // Global key bindings for shortcuts (Title start, Pause, Mute, Checkpoint)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      const code = e.code;
      if (gameState === 'title') {
        if (code === 'Space' || code === 'Enter') {
          startGame(selectedMode, selectedCategory);
        }
      } else if (gameState === 'playing') {
        if (code === 'Escape' || code === 'KeyP') {
          handlePause();
        } else if (code === 'KeyM') {
          handleToggleMute();
        } else if (code === 'KeyR') {
          if (engineRef.current) engineRef.current.respawnAtCheckpoint();
        }
      } else if (gameState === 'paused') {
        if (code === 'Escape' || code === 'KeyP') {
          handleResume();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [gameState, selectedMode, selectedCategory, startGame, handlePause, handleResume, handleToggleMute]);

  // Quiz Handling
  const handleProceedToQuiz = () => {
    setActiveTipIndex(null);
    const q = getCheckpointQuestion(currentCheckpointIdx, selectedCategory, usedQuestionIds);
    setUsedQuestionIds(prev => new Set(prev).add(q.id));
    setActiveQuizQuestion(q);
  };

  const handleQuizAnswerComplete = (correct: boolean, reward?: 'feather' | 'super_jump' | 'score') => {
    setStats(prev => ({
      ...prev,
      questionsAnswered: prev.questionsAnswered + 1,
      questionsCorrect: prev.questionsCorrect + (correct ? 1 : 0),
    }));

    if (reward && engineRef.current) {
      engineRef.current.grantBonus(reward);
      if (reward === 'feather') setHasFeather(true);
    }

    setActiveQuizQuestion(null);
  };

  // Sync feather state from engine
  useEffect(() => {
    if (gameState === 'playing' && engineRef.current) {
      setHasFeather(engineRef.current.player.hasFeather);
    }
  }, [gameState, stats.altitude]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 60fps Isolated Game Canvas */}
      <canvas
        ref={canvasRef}
        className="game-canvas absolute inset-0 w-full h-full block"
        tabIndex={0}
      />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={startGame}
          onOpenCodex={() => setIsCodexOpen(true)}
          selectedMode={selectedMode}
          setSelectedMode={setSelectedMode}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          highScore={highScore}
        />
      )}

      {/* In-Game Active HUD */}
      {gameState === 'playing' && (
        <>
          <HUD
            altitude={stats.altitude}
            maxAltitude={stats.maxAltitude}
            score={stats.score}
            gems={stats.gemsCollected}
            checkpointsFound={stats.tipsCollected}
            totalCheckpoints={stats.totalTips}
            hasKey={hasKey}
            hasFeather={hasFeather}
            falls={stats.falls}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onPause={handlePause}
            toastText={toastMessage}
          />
          {/* Mobile Touch Controls */}
          <TouchControls
            onInput={(ctrl, active) => {
              if (engineRef.current) {
                engineRef.current.setVirtualInput(ctrl, active);
              }
            }}
          />
        </>
      )}

      {/* Checkpoint Study Strategy Reveal Modal */}
      {activeTipIndex !== null && (
        <TipModal
          tip={STUDY_TIPS[Math.min(activeTipIndex, STUDY_TIPS.length - 1)]}
          tipIndex={activeTipIndex}
          totalTips={STUDY_TIPS.length}
          onProceedToQuiz={handleProceedToQuiz}
          onClose={() => setActiveTipIndex(null)}
        />
      )}

      {/* Active Recall Knowledge Quiz Modal */}
      {activeQuizQuestion !== null && (
        <QuizModal
          question={activeQuizQuestion}
          onAnswerComplete={handleQuizAnswerComplete}
        />
      )}

      {/* Paused State Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onReturnTitle={handleReturnTitle}
        />
      )}

      {/* Victory Summit Modal */}
      {gameState === 'victory' && runSummary && (
        <VictoryModal
          stats={stats}
          summary={runSummary}
          onPlayAgain={handleRestart}
          onReturnTitle={handleReturnTitle}
        />
      )}

      {/* Full-Featured Student Study Codex & Pomodoro Timer Modal */}
      {isCodexOpen && (
        <CodexModal onClose={() => setIsCodexOpen(false)} />
      )}
    </div>
  );
}
