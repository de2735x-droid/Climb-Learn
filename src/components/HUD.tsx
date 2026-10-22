import React from 'react';
import { Volume2, VolumeX, Pause, Shield, Mountain, Zap } from 'lucide-react';

interface HUDProps {
  altitude: number;
  maxAltitude: number;
  score: number;
  gems: number;
  checkpointsFound: number;
  totalCheckpoints: number;
  hasKey: boolean;
  hasFeather: boolean;
  falls: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  toastText: string | null;
}

export const HUD: React.FC<HUDProps> = ({
  altitude,
  maxAltitude,
  score,
  gems,
  checkpointsFound,
  totalCheckpoints,
  hasKey,
  hasFeather,
  falls,
  isMuted,
  onToggleMute,
  onPause,
  toastText,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-2.5 sm:p-6 select-none font-sans">
      {/* Top Bar Perimeter Clusters */}
      <div className="w-full flex justify-between items-start gap-2">
        {/* Top-Left Cluster: Altitude & Status */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          {/* Altitude readout */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg text-white">
            <Mountain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
            <div className="flex flex-col">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">ALTITUDE</span>
              <div className="flex items-baseline gap-1 font-mono-numbers">
                <span className="text-base sm:text-xl font-black text-sky-300 leading-none">{altitude}m</span>
                <span className="text-[10px] sm:text-[11px] text-slate-400">/ {maxAltitude}m</span>
              </div>
            </div>
          </div>

          {/* Key and Safety Badges */}
          <div className="flex items-center gap-1.5">
            {hasKey && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/90 border border-amber-600/80 text-amber-300 text-xs font-semibold animate-pulse-subtle">
                <span>🔑</span>
                <span>SCHOLAR KEY</span>
              </div>
            )}
            {hasFeather && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/90 border border-sky-600/80 text-sky-300 text-xs font-semibold">
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                <span>FALL PARACHUTE</span>
              </div>
            )}
            <div className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 text-xs font-mono-numbers">
              FALLS: {falls}
            </div>
          </div>
        </div>

        {/* Top-Center Toast Notifications */}
        {toastText && (
          <div className="pointer-events-none px-4 py-2 rounded-xl bg-slate-900/95 border border-amber-500/70 text-amber-300 text-xs sm:text-sm font-semibold shadow-2xl animate-bounce">
            {toastText}
          </div>
        )}

        {/* Top-Right Cluster: Score, Flags, Sound, Pause */}
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
          {/* Score & Checkpoints */}
          <div className="flex items-center gap-2 sm:gap-3 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg text-white">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
              <div className="flex flex-col items-end font-mono-numbers">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">KNOWLEDGE</span>
                <span className="text-base sm:text-xl font-black text-amber-300 leading-none">{score}</span>
              </div>
            </div>

            <div className="h-6 sm:h-7 w-px bg-slate-700 mx-0.5 sm:mx-1" />

            <div className="flex flex-col items-end font-mono-numbers">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">FLAGS</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-400">
                {checkpointsFound} / {totalCheckpoints}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onToggleMute}
              tabIndex={-1}
              title="Toggle Audio (M)"
              className="p-1.5 sm:p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
            <button
              onClick={onPause}
              tabIndex={-1}
              title="Pause Game (Esc)"
              className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-[10px] sm:text-xs font-semibold"
            >
              <Pause className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>PAUSE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Subtle Hints (desktop only to prevent mobile touch button overlap) */}
      <div className="hidden sm:flex w-full justify-between items-end text-[11px] text-slate-400 font-mono tracking-wider">
        <div className="bg-slate-950/70 px-3 py-1 rounded-md border border-slate-800/60">
          HOLD W / SPACE TO CHARGE · RELEASE TO LEAP
        </div>
        <div className="bg-slate-950/70 px-3 py-1 rounded-md border border-slate-800/60">
          PRESS R TO RETURN TO CHECKPOINT
        </div>
      </div>
    </div>
  );
};
