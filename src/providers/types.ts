// v0.1 del CLI: solo proveedores por API key propia (BYOK). Copilot es
// exclusivo de VS Code y Hugging Face OAuth queda para una vuelta futura —
// ver el plan de portabilidad.
export type ProviderKind = 'openai-compatible' | 'anthropic';

export interface StoredProviderConfig {
  id: string;
  name: string;
  kind: ProviderKind;
  baseUrl?: string;
  defaultModel?: string;
  apiKey: string;
}
