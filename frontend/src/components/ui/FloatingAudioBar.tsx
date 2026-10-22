import React from 'react';
import { useAudioStore } from '../../stores/audioStore';
import { Play, Pause, Volume2, Moon, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FloatingAudioBar: React.FC = () => {
  const { currentTrack, isPlaying, togglePlay, volume, setVolume, stopTrack, sleepTimerSecondsLeft } =
    useAudioStore();
  const navigate = useNavigate();

  if (!currentTrack) return null;

  const minutesLeft = sleepTimerSecondsLeft ? Math.ceil(sleepTimerSecondsLeft / 60) : null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-xl">
      <div className="bg-white/95 dark:bg-cozy-darkCard/95 backdrop-blur-md rounded-3xl p-3 px-4 shadow-soft-lg border border-purple-200/80 dark:border-purple-800/40 flex items-center justify-between gap-3">
        {/* Track Info */}
        <div
          onClick={() => navigate('/relax')}
          className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
        >
          <div className="w-10 h-10 rounded-2xl bg-cozy-lavender-soft dark:bg-purple-900/40 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
            {currentTrack.icon || '🎧'}
          </div>
          <div className="min-w-0">
            <h5 className="text-xs font-bold text-cozy-text dark:text-cozy-darkText truncate group-hover:text-cozy-lavender transition-colors">
              {currentTrack.title}
            </h5>
            <p className="text-[11px] text-cozy-muted dark:text-cozy-darkMuted truncate">
              {currentTrack.category}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {minutesLeft !== null && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 px-2.5 py-1 rounded-full">
              <Moon className="w-3 h-3 text-purple-500 animate-pulse" />
              {minutesLeft}m
            </span>
          )}

          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-cozy-lavender hover:bg-violet-500 text-white flex items-center justify-center shadow-soft-sm transition-transform active:scale-95"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Volume control */}
          <div className="hidden sm:flex items-center gap-1.5 group/vol">
            <Volume2 className="w-4 h-4 text-cozy-muted" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1.5 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-cozy-lavender"
            />
          </div>

          <button
            onClick={() => navigate('/relax')}
            className="p-1.5 rounded-xl hover:bg-cozy-lavender-soft dark:hover:bg-purple-900/40 text-cozy-muted hover:text-cozy-lavender transition-colors"
            title="Open sanctuary player"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={stopTrack}
            className="p-1.5 rounded-xl hover:bg-cozy-lavender-soft dark:hover:bg-purple-900/40 text-cozy-muted hover:text-rose-500 transition-colors"
            title="Close audio player"
            aria-label="Close audio player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
