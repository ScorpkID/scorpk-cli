import React from 'react';
import { render } from 'ink';
import chalk from 'chalk';
import { SYSTEM_PROMPT } from '../agent/systemPrompt';
import { withProjectInstructions, readProjectInstructions } from '../agent/projectInstructions';
import { ProviderStore } from '../providers/providerStore';
import { AuthService } from '../auth/authService';
import { App } from '../tui/App';
import { resolveProvider } from './shared';
import { version } from '../version';

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

  const model = opts.model ?? provider.defaultModel;
  if (!model) {
    console.log(chalk.red('No hay un modelo por default para este proveedor — pasá --model o corré /model dentro del chat.'));
    process.exitCode = 1;
    return;
  }

  const instructions = await readProjectInstructions(cwd);
  const system = withProjectInstructions(SYSTEM_PROMPT, instructions);

  let userLabel: string | undefined;
  let planLabel: string | undefined;
  try {
    const auth = new AuthService();
    const user = await auth.getUser();
    if (user) {
      userLabel = user.email ?? user.name;
      planLabel = user.plan === 'pro' ? 'Pro' : 'Free';
    }
  } catch {
    // sin sesión o sin red — el chat funciona igual en modo BYOK.
  }

  const { waitUntilExit } = render(
    React.createElement(App, {
      version,
      cwd,
      system,
      initialProvider: provider,
      initialModel: model,
      initialMode: opts.yes ? 'auto' : 'manual',
      userLabel,
      planLabel,
    }),
  );
  await waitUntilExit();
}
