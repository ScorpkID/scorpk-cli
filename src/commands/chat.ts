import chalk from 'chalk';
import { ChatMessage } from '../agent/types';
import { SYSTEM_PROMPT } from '../agent/systemPrompt';
import { withProjectInstructions, readProjectInstructions } from '../agent/projectInstructions';
import { createClient } from '../providers/clientFactory';
import { ProviderStore } from '../providers/providerStore';
import { resolveProvider, runTurn } from './shared';
import { closePrompt, promptLine } from '../ui/terminal';

export interface ChatOptions {
  yes?: boolean;
  provider?: string;
  model?: string;
}

export async function chat(opts: ChatOptions): Promise<void> {
  const cwd = process.cwd();
  const store = new ProviderStore();

  let provider;
  try {
    provider = await resolveProvider(store, opts.provider);
  } catch (err: any) {
    console.log(chalk.red(err.message));
    process.exitCode = 1;
    return;
  }

  const client = createClient(provider);
  const model = opts.model ?? provider.defaultModel;
  if (!model) {
    console.log(chalk.red('No hay un modelo por default para este proveedor — pasá --model.'));
    process.exitCode = 1;
    return;
  }

  const instructions = await readProjectInstructions(cwd);
  const system = withProjectInstructions(SYSTEM_PROMPT, instructions);
  const history: ChatMessage[] = [];
  const mode: 'auto' | 'manual' = opts.yes ? 'auto' : 'manual';

  console.log(chalk.dim(`Scorpk — ${provider.name} (${model}). "salir" para terminar.\n`));

  try {
    for (;;) {
      const input = (await promptLine(chalk.cyan('> '))).trim();
      if (!input) continue;
      if (['salir', 'exit', 'quit'].includes(input.toLowerCase())) break;

      history.push({ role: 'user', content: input });
      await runTurn({ client, model, system, history, cwd, mode });
    }
  } finally {
    closePrompt();
  }
}
