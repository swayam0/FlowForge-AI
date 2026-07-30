import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService } from './AIService';
import { LoggingService } from '../services/LoggingService';
import { GeminiProvider } from './GeminiProvider';

vi.mock('./GeminiProvider');
vi.mock('../../repositories/SettingsRepository', () => {
  return {
    SettingsRepository: class {
      getSetting = vi.fn().mockResolvedValue('test_key');
    }
  };
});
vi.mock('../services/LoggingService');

describe('AIService Retry Logic', () => {
  let aiService: AIService;
  let loggingService: LoggingService;

  beforeEach(() => {
    vi.clearAllMocks();
    loggingService = new LoggingService();
    aiService = new AIService(loggingService);
    // spy on setTimeout
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should parse retryDelay from a 429 error and wait accordingly', async () => {
    const mockProvider = {
      getProviderName: () => 'Gemini',
      getModelName: () => 'gemini-3.6-flash',
      generateJSON: vi.fn()
    };
    
    // @ts-ignore
    vi.mocked(GeminiProvider).mockImplementation(function() { return mockProvider; } as any);

    const error429 = new Error('429 Too Many Requests');
    (error429 as any).status = 429;
    (error429 as any).errorDetails = [
      {
        "@type": "type.googleapis.com/google.rpc.RetryInfo",
        "retryDelay": "2.5s"
      }
    ];

    mockProvider.generateJSON
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce({ test: 'success' });

    // Execute extract asynchronously
    const extractPromise = aiService.extract('run-1', 'node-1', {});

    // Fast-forward 1ms so it catches the error and sets up the setTimeout
    await vi.advanceTimersByTimeAsync(10);
    
    // The retry should be scheduled for 2.5s (2500ms) later
    expect(mockProvider.generateJSON).toHaveBeenCalledTimes(1);

    // Fast-forward 2000ms, it should not have retried yet
    await vi.advanceTimersByTimeAsync(2000);
    expect(mockProvider.generateJSON).toHaveBeenCalledTimes(1);

    // Fast-forward another 500ms, it should retry
    await vi.advanceTimersByTimeAsync(500);
    
    const result = await extractPromise;
    expect(mockProvider.generateJSON).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ test: 'success' });
    
    // Check logs to verify correct wait message
    expect(loggingService.log).toHaveBeenCalledWith(
      'run-1', 
      'RETRY', 
      'AI Request failed, retrying in 2500ms... (1/1)', 
      'node-1', 
      { error: '429 Too Many Requests' }
    );
  });
  
  it('should fall back to 1000ms delay when no retryDelay is present', async () => {
    const mockProvider = {
      getProviderName: () => 'Gemini',
      getModelName: () => 'gemini-3.6-flash',
      generateJSON: vi.fn()
    };
    
    // @ts-ignore
    vi.mocked(GeminiProvider).mockImplementation(function() { return mockProvider; } as any);

    const error429 = new Error('429 Too Many Requests');
    (error429 as any).status = 429;

    mockProvider.generateJSON
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce({ test: 'success' });

    const extractPromise = aiService.extract('run-1', 'node-1', {});

    await vi.advanceTimersByTimeAsync(10);
    expect(mockProvider.generateJSON).toHaveBeenCalledTimes(1);

    // Fast forward 500ms
    await vi.advanceTimersByTimeAsync(500);
    expect(mockProvider.generateJSON).toHaveBeenCalledTimes(1);

    // Fast forward remaining 500ms
    await vi.advanceTimersByTimeAsync(500);
    const result = await extractPromise;
    expect(mockProvider.generateJSON).toHaveBeenCalledTimes(2);
  });
});
