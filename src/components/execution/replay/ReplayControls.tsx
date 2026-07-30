'use client';

import React from 'react';
import { Play, Pause, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { useReplayStore } from '@/lib/replayStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export function ReplayControls() {
  const { 
    isPlaying, togglePlay, currentTimeMs, totalDurationMs, 
    playbackSpeed, setSpeed, seek 
  } = useReplayStore();

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value));
  };

  const speeds = [0.5, 1, 2, 4];

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50 w-full max-w-2xl px-4">
      <div className="w-full bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
        {/* Timeline Slider */}
        <div className="flex items-center gap-4 w-full">
          <span className="text-xs font-mono text-gray-400 w-12 text-right">
            {formatTime(currentTimeMs)}
          </span>
          <input
            type="range"
            min="0"
            max={totalDurationMs}
            value={currentTimeMs}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <span className="text-xs font-mono text-gray-400 w-12">
            {formatTime(totalDurationMs)}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => seek(0)}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Restart"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button 
              onClick={() => seek(currentTimeMs - 5000)}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="-5 seconds"
            >
              <SkipBack className="h-4 w-4" />
            </button>
          </div>

          <button 
            onClick={togglePlay}
            className="h-12 w-12 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/20 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
          </button>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => seek(currentTimeMs + 5000)}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="+5 seconds"
            >
              <SkipForward className="h-4 w-4" />
            </button>
            <div className="flex items-center bg-black/50 rounded-lg p-1 ml-2 border border-white/5">
              {speeds.map(speed => (
                <button
                  key={speed}
                  onClick={() => setSpeed(speed)}
                  className={cn(
                    "px-2 py-1 text-xs font-mono rounded-md transition-colors",
                    playbackSpeed === speed 
                      ? "bg-white/20 text-white font-bold" 
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  )}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
