import { readFile } from 'fs/promises';
import { join } from 'path';

const INSTRUCTIONS_FILENAME = 'SCORPK.md';
const MAX_LENGTH = 8000;

/**
 * Lee SCORPK.md de la carpeta actual, si existe, para sumarlo como
 * instrucciones fijas al prompt (mismo espíritu que CLAUDE.md/.cursorrules
 * en otras herramientas).
 */
export async function readProjectInstructions(cwd: string): Promise<string | undefined> {
  try {
    const text = (await readFile(join(cwd, INSTRUCTIONS_FILENAME), 'utf8')).trim();
    if (!text) return undefined;
    return text.length > MAX_LENGTH ? text.slice(0, MAX_LENGTH) + '\n…(recortado)' : text;
  } catch {
    return undefined;
  }
}

export function withProjectInstructions(basePrompt: string, instructions: string | undefined): string {
  if (!instructions) return basePrompt;
  return `${basePrompt}\n\nInstrucciones específicas de este proyecto (de SCORPK.md):\n${instructions}`;
}
