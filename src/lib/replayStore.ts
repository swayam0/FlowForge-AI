import { create } from 'zustand';

interface ReplayState {
  isOpen: boolean;
  isPlaying: boolean;
  currentTimeMs: number;
  totalDurationMs: number;
  playbackSpeed: number; // e.g. 0.5, 1, 2, 4
  activeNodeId: string | null;
  lastUpdateTimestamp: number;
  
  // Actions
  open: (durationMs: number) => void;
  close: () => void;
  togglePlay: () => void;
  pause: () => void;
  seek: (timeMs: number) => void;
  setSpeed: (speed: number) => void;
  setActiveNode: (nodeId: string | null) => void;
  tick: () => void; // Called by a requestAnimationFrame loop
}

export const useReplayStore = create<ReplayState>((set, get) => ({
  isOpen: false,
  isPlaying: false,
  currentTimeMs: 0,
  totalDurationMs: 0,
  playbackSpeed: 1,
  activeNodeId: null,
  lastUpdateTimestamp: 0,

  open: (durationMs) => set({ 
    isOpen: true, 
    totalDurationMs: durationMs, 
    currentTimeMs: 0, 
    isPlaying: false,
    activeNodeId: null
  }),
  
  close: () => set({ 
    isOpen: false,
    isPlaying: false,
    currentTimeMs: 0
  }),

  togglePlay: () => {
    const { isPlaying, currentTimeMs, totalDurationMs } = get();
    if (isPlaying) {
      set({ isPlaying: false });
    } else {
      if (currentTimeMs >= totalDurationMs) {
        set({ isPlaying: true, currentTimeMs: 0, lastUpdateTimestamp: performance.now() });
      } else {
        set({ isPlaying: true, lastUpdateTimestamp: performance.now() });
      }
    }
  },

  pause: () => set({ isPlaying: false }),

  seek: (timeMs) => {
    const { totalDurationMs } = get();
    const clamped = Math.max(0, Math.min(timeMs, totalDurationMs));
    set({ currentTimeMs: clamped, lastUpdateTimestamp: performance.now() });
  },

  setSpeed: (speed) => set({ playbackSpeed: speed, lastUpdateTimestamp: performance.now() }),
  
  setActiveNode: (nodeId) => set({ activeNodeId: nodeId }),

  tick: () => {
    const state = get();
    if (!state.isPlaying) return;

    const now = performance.now();
    const deltaMs = now - state.lastUpdateTimestamp;
    const timeToAdd = deltaMs * state.playbackSpeed;
    
    let nextTime = state.currentTimeMs + timeToAdd;
    let playing = true;

    if (nextTime >= state.totalDurationMs) {
      nextTime = state.totalDurationMs;
      playing = false;
    }

    set({ 
      currentTimeMs: nextTime, 
      isPlaying: playing,
      lastUpdateTimestamp: now
    });
  }
}));
