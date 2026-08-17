import chalk from 'chalk';
import { ChatMessage } from '../agent/types';
import { SYSTEM_PROMPT } from '../agent/systemPrompt';
import { withProjectInstructions, readProjectInstructions } from '../agent/projectInstructions';
import { createClient } from '../providers/clientFactory';
import { ProviderStore } from '../providers/providerStore';
import { resolveProvider, runTurn } from './shared';
import { closePrompt } from '../ui/terminal';

export interface RunOptions {
  yes?: boolean;
  provider?: string;
  model?: string;
}

export async function run(task: string, opts: RunOptions): Promise<void> {
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
  const history: ChatMessage[] = [{ role: 'user', content: task }];

  try {
    await runTurn({
      client,
      model,
      system,
      history,
      cwd,
      mode: opts.yes ? 'auto' : 'manual',
    });
  } finally {
    closePrompt();
  }
}
