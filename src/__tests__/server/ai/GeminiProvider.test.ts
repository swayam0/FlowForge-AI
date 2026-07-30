import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiProvider } from '@/server/ai/GeminiProvider';

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel() {
        return {
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify({ extracted: true, priority: 'HIGH' })
            }
          })
        };
      }
    }
  };
});

describe('GeminiProvider', () => {
  let provider: GeminiProvider;

  beforeEach(() => {
    provider = new GeminiProvider('test-key');
  });

  it('should return correct provider name', () => {
    expect(provider.getProviderName()).toBe('Gemini');
  });

  it('should return correct model name', () => {
    expect(provider.getModelName()).toBe('gemini-3.6-flash'); // default
  });

  it('should generate JSON correctly', async () => {
    const result = await provider.generateJSON('test prompt', { some: 'context' });
    expect(result).toEqual({ extracted: true, priority: 'HIGH' });
  });
});
