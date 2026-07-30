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
    context: Record<string, any>
  ): Promise<any> {
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
      } catch (error: any) {
        attempt++;
        if (attempt > maxRetries) {
          throw new Error(`AI Request failed after ${maxRetries} retries. Last error: ${error.message}`);
        }

        let delayMs = 1000; // default small delay
        if (error.status === 429 || (error.message && error.message.includes('429'))) {
          try {
            let retryInfo = error.errorDetails?.find?.((d: any) => d['@type']?.includes('RetryInfo'));
            if (!retryInfo && error.message) {
              const match = error.message.match(/\[\{.*\}\]$/);
              if (match) {
                const details = JSON.parse(match[0]);
                retryInfo = details.find((d: any) => d['@type']?.includes('RetryInfo'));
              }
            }
            if (retryInfo && retryInfo.retryDelay) {
              let delayStr = retryInfo.retryDelay;
              if (typeof delayStr === 'string' && delayStr.endsWith('s')) {
                delayMs = parseFloat(delayStr) * 1000;
              } else if (typeof delayStr === 'object' && delayStr.seconds !== undefined) {
                delayMs = (parseInt(delayStr.seconds) || 0) * 1000 + (parseInt(delayStr.nanos) || 0) / 1000000;
              }
              delayMs = Math.min(delayMs, 60000); // cap at 60s
            }
          } catch (e) {
            // fallback to default delay
          }
        }
        
        await this.loggingService.log(executionId, EventType.RETRY, `AI Request failed, retrying in ${delayMs}ms... (${attempt}/${maxRetries})`, nodeId, { error: error.message });
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  async extract(executionId: string, nodeId: string, inputData: Record<string, any>): Promise<any> {
    const prompt = `Extract structured information from the supplied document. Return JSON only.`;
    return this.executeWithRetry(executionId, nodeId, prompt, inputData);
  }

  async classify(executionId: string, nodeId: string, inputData: Record<string, any>): Promise<any> {
    const prompt = `Classify the document priority as: LOW, MEDIUM, HIGH, or CRITICAL. Return JSON only in format: { "priority": "CRITICAL", "reasoning": "Explain why this priority was chosen" }. Never return markdown.`;
    return this.executeWithRetry(executionId, nodeId, prompt, inputData);
  }
}
