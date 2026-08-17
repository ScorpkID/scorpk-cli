import { StoredProviderConfig } from './types';
import { LLMClient } from './llmClient';
import { OpenAICompatibleClient } from './openAICompatibleClient';
import { AnthropicClient } from './anthropicClient';

export function createClient(provider: StoredProviderConfig): LLMClient {
  if (provider.kind === 'anthropic') {
    return new AnthropicClient(provider.apiKey);
  }
  if (!provider.baseUrl) {
    throw new Error(`El proveedor "${provider.name}" no tiene baseUrl configurada.`);
  }
  return new OpenAICompatibleClient(provider.baseUrl, provider.apiKey);
}
