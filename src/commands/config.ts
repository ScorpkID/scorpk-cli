import chalk from 'chalk';
import { ProviderStore } from '../providers/providerStore';
import { findPreset, PROVIDER_PRESETS } from '../providers/providerPresets';

export async function setKey(presetId: string, apiKey: string): Promise<void> {
  const preset = findPreset(presetId);
  if (!preset) {
    const ids = PROVIDER_PRESETS.map((p) => p.id).join(', ');
    console.log(chalk.red(`Proveedor desconocido: "${presetId}". Opciones: ${ids}`));
    return;
  }
  const store = new ProviderStore();
  const existing = (await store.list()).find((p) => p.name === preset.label);
  if (existing) await store.remove(existing.id);
  await store.add({
    name: preset.label,
    kind: preset.kind,
    baseUrl: preset.baseUrl,
    defaultModel: preset.defaultModel,
    apiKey,
  });
  console.log(chalk.green(`✓ ${preset.label} configurado.`));
}

export async function listProviders(): Promise<void> {
  const store = new ProviderStore();
  const providers = await store.list();
  if (providers.length === 0) {
    console.log('No hay proveedores configurados — corré `scorpk config set-key <proveedor> <key>`.');
    return;
  }
  for (const p of providers) {
    console.log(`${chalk.bold(p.name)}  ${chalk.dim(p.defaultModel ?? '')}`);
  }
}
