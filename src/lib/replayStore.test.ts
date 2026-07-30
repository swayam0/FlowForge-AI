import { useReplayStore } from './replayStore';

describe('replayStore', () => {
  beforeEach(() => {
    const store = useReplayStore.getState();
    store.close();
  });

  it('should open and initialize state', () => {
    useReplayStore.getState().open(10000);
    const state = useReplayStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.totalDurationMs).toBe(10000);
    expect(state.currentTimeMs).toBe(0);
    expect(state.isPlaying).toBe(false);
  });

  it('should toggle play state', () => {
    useReplayStore.getState().open(10000);
    useReplayStore.getState().togglePlay();
    expect(useReplayStore.getState().isPlaying).toBe(true);
    
    useReplayStore.getState().togglePlay();
    expect(useReplayStore.getState().isPlaying).toBe(false);
  });

  it('should seek to specific time', () => {
    useReplayStore.getState().open(10000);
    useReplayStore.getState().seek(5000);
    expect(useReplayStore.getState().currentTimeMs).toBe(5000);
  });

  it('should clamp seek time to bounds', () => {
    useReplayStore.getState().open(10000);
    useReplayStore.getState().seek(15000);
    expect(useReplayStore.getState().currentTimeMs).toBe(10000);
    
    useReplayStore.getState().seek(-1000);
    expect(useReplayStore.getState().currentTimeMs).toBe(0);
  });

  it('should update speed', () => {
    useReplayStore.getState().setSpeed(2);
    expect(useReplayStore.getState().playbackSpeed).toBe(2);
  });

  it('should automatically stop when reaching total duration', () => {
    useReplayStore.getState().open(1000);
    useReplayStore.getState().togglePlay();
    
    // Simulate time passing
    useReplayStore.setState({ lastUpdateTimestamp: performance.now() - 1500 });
    useReplayStore.getState().tick();

    expect(useReplayStore.getState().currentTimeMs).toBe(1000);
    expect(useReplayStore.getState().isPlaying).toBe(false);
  });

  it('should replay from start when togglePlay called at end', () => {
    useReplayStore.getState().open(1000);
    useReplayStore.getState().seek(1000);
    useReplayStore.getState().togglePlay();
    
    expect(useReplayStore.getState().currentTimeMs).toBe(0);
    expect(useReplayStore.getState().isPlaying).toBe(true);
  });
});
