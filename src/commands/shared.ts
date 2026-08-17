import chalk from 'chalk';
import { runAgent, ApprovalResult } from '../agent/agentRuntime';
import { ChatMessage, ToolCall } from '../agent/types';
import { PermissionMode, resolveApproval } from '../agent/permissionMode';
import { LLMClient } from '../providers/llmClient';
import { allTools, createToolHandlers, computeFileChange } from '../tools';
import { confirm, askUserPrompt, printDiff, printToolCallHeader } from '../ui/terminal';
import { StoredProviderConfig } from '../providers/types';
import { ProviderStore } from '../providers/providerStore';

export async function resolveProvider(store: ProviderStore, providerId?: string): Promise<StoredProviderConfig> {
  const provider = providerId ? await store.get(providerId) : await store.getDefault();
  if (!provider) {
    throw new Error(
      'No hay ningún proveedor configurado. Corré `scorpk config set-key <proveedor> <key>` primero (por ejemplo: scorpk config set-key anthropic sk-ant-...).',
    );
  }
  return provider;
}

export interface RunTurnOptions {
  client: LLMClient;
  model: string;
  system: string;
  history: ChatMessage[];
  cwd: string;
  mode: PermissionMode;
  signal?: AbortSignal;
}

/** Corre un turno completo del agente (puede incluir varias tool calls), imprimiendo en la terminal a medida que pasa. */
export async function runTurn(opts: RunTurnOptions): Promise<void> {
  const { client, model, system, history, cwd, mode, signal } = opts;
  const toolHandlers = createToolHandlers(cwd);

  const requestApproval = async (call: ToolCall): Promise<ApprovalResult> => {
    const change = await computeFileChange(cwd, call.name, call.arguments);
    if (change) {
      printDiff(change);
    } else {
      console.log('\n' + chalk.cyan(call.name) + ' ' + chalk.dim(JSON.stringify(call.arguments)));
    }
    const { approved } = await resolveApproval(mode, () => confirm('¿Aplicar este cambio?'));
    return approved ? { approved: true } : { approved: false, reason: 'Rechazado por el usuario.' };
  };

  let printedAnyText = false;
  const gen = runAgent({
    client,
    model,
    system,
    history,
    tools: allTools,
    toolHandlers,
    requestApproval,
    askUser: (_callId, question, options) => askUserPrompt(question, options),
    signal,
  });

  for await (const ev of gen) {
    if (ev.type === 'text-delta') {
      process.stdout.write(ev.textDelta);
      printedAnyText = true;
    } else if (ev.type === 'tool-call') {
      if (!ev.needsApproval && !isSilentTool(ev.call.name)) printToolCallHeader(ev.call.name, false);
    } else if (ev.type === 'tool-result') {
      // El resultado ya se refleja en el texto que sigue del modelo; no lo dupli-
      // camos en pantalla salvo que sea un error, para no saturar la salida.
      if (ev.isError) console.log(chalk.red(`  error: ${ev.result}`));
    } else if (ev.type === 'tool-rejected') {
      console.log(chalk.dim('  (rechazado)'));
    } else if (ev.type === 'cancelled') {
      console.log(chalk.dim('\n(cancelado)'));
    }
  }

  if (printedAnyText) process.stdout.write('\n');
}

function isSilentTool(name: string): boolean {
  return name === 'read_file' || name === 'list_dir' || name === 'search_files' || name === 'git_status' || name === 'git_diff';
}
