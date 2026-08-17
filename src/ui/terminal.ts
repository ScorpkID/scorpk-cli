import * as readline from 'node:readline/promises';
import chalk from 'chalk';
import { FileChange } from '../tools';

let sharedRl: readline.Interface | undefined;
function rl(): readline.Interface {
  if (!sharedRl) sharedRl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return sharedRl;
}

export function closePrompt(): void {
  sharedRl?.close();
  sharedRl = undefined;
}

/** Único punto de entrada a stdin de todo el CLI — dos readline.Interface
 * separadas leyendo el mismo stdin (por ejemplo, el prompt principal de
 * `chat` y las confirmaciones de aprobación) se pisan entre sí. */
export async function promptLine(question: string): Promise<string> {
  return rl().question(question);
}

export function printDiff(change: FileChange): void {
  const header =
    change.kind === 'move'
      ? `${chalk.cyan('mover')} ${change.movedFrom} → ${change.path}`
      : `${chalk.cyan(change.kind)} ${change.path}`;
  console.log('\n' + header);
  if (change.kind === 'move') return;
  for (const line of change.diff.split('\n')) {
    if (line.startsWith('+ ')) console.log(chalk.green(line));
    else if (line.startsWith('- ')) console.log(chalk.red(line));
    else console.log(chalk.dim(line));
  }
}

export async function confirm(question: string): Promise<boolean> {
  const answer = (await rl().question(chalk.yellow(`${question} [y/N] `))).trim().toLowerCase();
  return answer === 'y' || answer === 'yes' || answer === 's' || answer === 'si' || answer === 'sí';
}

export async function askUserPrompt(question: string, options: string[]): Promise<string> {
  console.log('\n' + chalk.magenta('?') + ' ' + question);
  options.forEach((opt, i) => console.log(`  ${chalk.dim(`${i + 1}.`)} ${opt}`));
  const raw = (await rl().question(chalk.yellow('> '))).trim();
  const index = Number(raw);
  if (Number.isInteger(index) && index >= 1 && index <= options.length) {
    return options[index - 1];
  }
  return raw;
}

export function printToolCallHeader(name: string, needsApproval: boolean): void {
  const tag = needsApproval ? chalk.yellow('tool') : chalk.dim('tool');
  console.log(`${tag} ${chalk.bold(name)}`);
}
