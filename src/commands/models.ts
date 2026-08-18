import chalk from 'chalk';
import { ProviderStore } from '../providers/providerStore';
import { findPreset } from '../providers/providerPresets';
import { listModelsFor } from '../providers/listModelsFor';

export async function models(presetId?: string): Promise<void> {
  const store = new ProviderStore();
  const providers = await store.list();

  const provider = presetId
    ? providers.find((p) => p.name === findPreset(presetId)?.label)
    : providers[0];

  if (!provider) {
    const hint = presetId
      ? `Corré \`scorpk config set-key ${presetId} <key>\` primero.`
      : 'No hay ningún proveedor configurado — corré `scorpk config set-key <proveedor> <key>` primero.';
    console.log(chalk.red(hint));
    process.exitCode = 1;
    return;
  }

  try {
    const list = await listModelsFor(provider, provider.apiKey);
    if (list.length === 0) {
      console.log('El proveedor no devolvió ningún modelo.');
      return;
    }
    for (const m of list) {
      console.log(m.free ? `${m.id}  ${chalk.green('(gratis)')}` : m.id);
    }
  } catch (err: any) {
    console.log(chalk.red(err?.message ?? String(err)));
    process.exitCode = 1;
  }
}
