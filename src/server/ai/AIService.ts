import { AIProvider } from './AIProvider';
import { GeminiProvider } from './GeminiProvider';
import { LoggingService } from '../services/LoggingService';
import { EventType } from '../../types/common';
import { SettingsRepository } from '../../repositories/SettingsRepository';

export class AIService {
  private provider: AIProvider | null = null;
  private settingsRepo: SettingsRepository;

  constructor(private loggingService: LoggingService) {
    this.settingsRepo = new SettingsRepository();
  }

  private async getProvider(): Promise<AIProvider> {
    if (this.provider) return this.provider;

    const apiKey = await this.settingsRepo.getSetting('geminiApiKey');
    this.provider = new GeminiProvider(apiKey || undefined);
    
    return this.provider;
  }

  private async executeWithRetry(
    executionId: string, 
    nodeId: string, 
    prompt: string, 
    context: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const maxRetries = 3;
    let attempt = 0;
    const provider = await this.getProvider();

    while (attempt <= maxRetries) {
      try {
        const startTime = Date.now();
        
        await this.loggingService.log(executionId, EventType.AI_REQUEST, 'Sending request to AI', nodeId, {
          provider: provider.getProviderName(),
          model: provider.getModelName(),
        });

        const result = await provider.generateJSON(prompt, context);
        
        const latency = Date.now() - startTime;
        
        await this.loggingService.log(executionId, EventType.AI_RESPONSE, 'Received response from AI', nodeId, {
          latencyMs: latency,
        });

        return result;
      } catch (error: unknown) {
        attempt++;
        const err = error as { status?: number; message?: string; errorDetails?: Array<{ '@type'?: string; retryDelay?: string | { seconds?: string; nanos?: string } }> };
        if (attempt > maxRetries) {
          throw new Error(`AI Request failed after ${maxRetries} retries. Last error: ${err.message}`);
        }

        let delayMs = 1000; // default small delay
        if (err.status === 429 || (err.message && err.message.includes('429'))) {
          try {
            let retryInfo = err.errorDetails?.find?.((d) => d['@type']?.includes('RetryInfo'));
            if (!retryInfo && err.message) {
              const match = err.message.match(/\[\{.*\}\]$/);
              if (match) {
                const details = JSON.parse(match[0]) as Array<{ '@type'?: string; retryDelay?: string | { seconds?: string; nanos?: string } }>;
                retryInfo = details.find((d) => d['@type']?.includes('RetryInfo'));
              }
            }
            if (retryInfo && retryInfo.retryDelay) {
              let delayStr = retryInfo.retryDelay;
              if (typeof delayStr === 'string' && delayStr.endsWith('s')) {
                delayMs = parseFloat(delayStr) * 1000;
              } else if (typeof delayStr === 'object' && delayStr.seconds !== undefined) {
                delayMs = (parseInt(delayStr.seconds || '0') || 0) * 1000 + (parseInt(delayStr.nanos || '0') || 0) / 1000000;
              }
              delayMs = Math.min(delayMs, 60000); // cap at 60s
            }
          } catch (e) {
            // fallback to default delay
          }
        }
        
        await this.loggingService.log(executionId, EventType.RETRY, `AI Request failed, retrying in ${delayMs}ms... (${attempt}/${maxRetries})`, nodeId, { error: err.message });
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    throw new Error('Unreachable');
  }

  async extract(executionId: string, nodeId: string, inputData: Record<string, unknown>): Promise<Record<string, unknown>> {
    const prompt = `Extract structured information from the supplied document. Return JSON only.`;
    return this.executeWithRetry(executionId, nodeId, prompt, inputData);
  }

  async classify(executionId: string, nodeId: string, inputData: Record<string, unknown>): Promise<Record<string, unknown>> {
    const prompt = `Classify the document priority as: LOW, MEDIUM, HIGH, or CRITICAL. Return JSON only in format: { "priority": "CRITICAL", "reasoning": "Explain why this priority was chosen" }. Never return markdown.`;
    return this.executeWithRetry(executionId, nodeId, prompt, inputData);
  }
}
