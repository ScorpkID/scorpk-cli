import { ProviderPreset } from './providerPresets';
import { listAnthropicModels, listOpenAICompatibleModels, ModelInfo } from './modelLister';

export async function listModelsFor(preset: Pick<ProviderPreset, 'kind' | 'baseUrl'>, apiKey: string): Promise<ModelInfo[]> {
  if (preset.kind === 'anthropic') return listAnthropicModels(apiKey);
  if (!preset.baseUrl) throw new Error('Este proveedor no tiene una URL base configurada.');
  return listOpenAICompatibleModels(preset.baseUrl, apiKey);
}
