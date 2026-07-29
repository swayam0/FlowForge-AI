export interface AIProvider {
  /**
   * Generates a structured JSON response from the given prompt.
   * Guaranteed to return an object (parsed JSON), throws on failure.
   */
  generateJSON(prompt: string, context?: Record<string, any>): Promise<any>;
  
  getProviderName(): string;
  getModelName(): string;
}
