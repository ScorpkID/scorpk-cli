import chalk from 'chalk';
import { ProviderStore } from '../providers/providerStore';
import { findPreset, PROVIDER_PRESETS } from '../providers/providerPresets';
import { listModelsFor } from '../providers/listModelsFor';
import { selectFromList } from '../tui/selectFromList';
import { promptLine, closePrompt } from '../ui/terminal';

export interface SetKeyOptions {
  model?: string;
}

export async function setKey(presetId: string, apiKey: string, opts: SetKeyOptions = {}): Promise<void> {
  const preset = findPreset(presetId);
  if (!preset) {
    const ids = PROVIDER_PRESETS.map((p) => p.id).join(', ');
    console.log(chalk.red(`Proveedor desconocido: "${presetId}". Opciones: ${ids}`));
    process.exitCode = 1;
    return;
  }

  const model = opts.model ?? (await pickModel(preset, apiKey));

  const store = new ProviderStore();
  const existing = (await store.list()).find((p) => p.name === preset.label);
  if (existing) await store.remove(existing.id);
  await store.add({
    name: preset.label,
    kind: preset.kind,
    baseUrl: preset.baseUrl,
    defaultModel: model,
    apiKey,
  });
  console.log(chalk.green(`✓ ${preset.label} configurado con el modelo ${model ?? '(ninguno — pasá --model más adelante)'}.`));
}

/** Nunca confía en el defaultModel del preset a ciegas — lo ofrece como
 * sugerencia dentro de la lista real de modelos del proveedor. Si el
 * listado falla (proveedor sin endpoint /models, key inválida), cae a
 * pedirlo escrito a mano. */
async function pickModel(preset: ReturnType<typeof findPreset>, apiKey: string): Promise<string | undefined> {
  if (!preset) return undefined;
  try {
    const list = await listModelsFor(preset, apiKey);
    if (list.length === 0) throw new Error('sin modelos');
    const items = list.map((m) => ({ label: m.free ? `${m.id} (gratis)` : m.id, value: m.id }));
    const picked = await selectFromList(`Elegí el modelo para ${preset.label}:`, items);
    return picked ?? preset.defaultModel;
  } catch {
    const typed = await promptLine(
      `No pude listar los modelos de ${preset.label} automáticamente. Escribilo a mano${preset.defaultModel ? ` (Enter para "${preset.defaultModel}")` : ''}: `,
    );
    closePrompt();
    return typed.trim() || preset.defaultModel;
  }
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
