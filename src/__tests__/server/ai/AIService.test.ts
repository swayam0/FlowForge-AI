import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService } from '@/server/ai/AIService';
import { LoggingService } from '@/server/services/LoggingService';
import { SettingsRepository } from '@/repositories/SettingsRepository';

// Mock dependencies
vi.mock('@/repositories/SettingsRepository');
vi.mock('@/server/services/LoggingService');
vi.mock('@/server/ai/GeminiProvider', () => {
  return {
    GeminiProvider: class {
      getProviderName() { return 'Gemini'; }
      getModelName() { return 'gemini-1.5-pro'; }
      async generateJSON() { return { success: true, mocked: true }; }
    }
  };
});

describe('AIService', () => {
  let aiService: AIService;
  let mockLoggingService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoggingService = new LoggingService();
    aiService = new AIService(mockLoggingService);
  });

  it('should successfully call extract and return parsed JSON', async () => {
    const result = await aiService.extract('exec-1', 'node-1', { text: 'test data' });
    
    expect(result).toEqual({ success: true, mocked: true });
    expect(mockLoggingService.log).toHaveBeenCalledTimes(2); // AI_REQUEST and AI_RESPONSE
  });

  it('should successfully call classify and return parsed JSON', async () => {
    const result = await aiService.classify('exec-1', 'node-2', { content: 'test data' });
    
    expect(result).toEqual({ success: true, mocked: true });
    expect(mockLoggingService.log).toHaveBeenCalledTimes(2);
  });
});
