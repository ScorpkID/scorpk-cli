import * as fs from 'fs/promises';
import * as path from 'path';
import { diffLines } from 'diff';
import { ToolDef } from '../agent/types';

export function resolveInCwd(cwd: string, relativePath: string): string {
  const normalized = relativePath.replace(/^[/\\]+/, '');
  const resolved = path.join(cwd, normalized);
  const relative = path.relative(cwd, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Ruta fuera del directorio de trabajo: ${relativePath}`);
  }
  return resolved;
}

export const readFileTool: ToolDef = {
  name: 'read_file',
  description: 'Lee el contenido de un archivo de texto del directorio actual, dada una ruta relativa.',
  parameters: {
    type: 'object',
    properties: { path: { type: 'string', description: 'Ruta relativa al directorio de trabajo' } },
    required: ['path'],
  },
  requiresApproval: false,
};

export function makeReadFileHandler(cwd: string) {
  return async (args: Record<string, unknown>): Promise<string> => {
    const relPath = String(args.path ?? '');
    const filePath = resolveInCwd(cwd, relPath);
    return fs.readFile(filePath, 'utf8');
  };
}

export const listDirTool: ToolDef = {
  name: 'list_dir',
  description: 'Lista archivos y carpetas dentro de una ruta relativa del directorio actual.',
  parameters: {
    type: 'object',
    properties: { path: { type: 'string', description: 'Ruta relativa al directorio de trabajo ("." para la raíz)' } },
    required: ['path'],
  },
  requiresApproval: false,
};

export function makeListDirHandler(cwd: string) {
  return async (args: Record<string, unknown>): Promise<string> => {
    const relPath = String(args.path ?? '.');
    const dirPath = resolveInCwd(cwd, relPath);
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries.map((e) => `${e.isDirectory() ? 'DIR ' : 'FILE'}  ${e.name}`).join('\n');
  };
}

export const writeFileTool: ToolDef = {
  name: 'write_file',
  description: 'Crea o sobrescribe un archivo de texto en el directorio actual con el contenido dado.',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Ruta relativa al directorio de trabajo' },
      content: { type: 'string', description: 'Contenido completo a escribir en el archivo' },
    },
    required: ['path', 'content'],
  },
  requiresApproval: true,
};

export function makeWriteFileHandler(cwd: string) {
  return async (args: Record<string, unknown>): Promise<string> => {
    const relPath = String(args.path ?? '');
    const content = String(args.content ?? '');
    const filePath = resolveInCwd(cwd, relPath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf8');
    return `Archivo escrito: ${relPath} (${content.length} caracteres)`;
  };
}

export const editFileTool: ToolDef = {
  name: 'edit_file',
  description:
    'Reemplaza una porción puntual de un archivo existente (una sección, función, línea, etc.) sin reescribirlo ' +
    'entero. old_string tiene que aparecer exactamente una vez en el archivo — agregá líneas de contexto antes o ' +
    'después si hace falta para que sea único. new_string vacío borra esa porción. Para archivos nuevos o ' +
    'reescrituras completas de un archivo, usá write_file en vez de esta.',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Ruta relativa al directorio de trabajo' },
      old_string: { type: 'string', description: 'Texto exacto a reemplazar (debe aparecer una sola vez en el archivo)' },
      new_string: { type: 'string', description: 'Texto que lo reemplaza (vacío para borrar esa porción)' },
    },
    required: ['path', 'old_string', 'new_string'],
  },
  requiresApproval: true,
};

export function makeEditFileHandler(cwd: string) {
  return async (args: Record<string, unknown>): Promise<string> => {
    const relPath = String(args.path ?? '');
    const oldString = String(args.old_string ?? '');
    const newString = String(args.new_string ?? '');
    if (!oldString) {
      return 'Error: old_string no puede estar vacío. Para crear contenido nuevo usá write_file.';
    }

    const filePath = resolveInCwd(cwd, relPath);
    let current: string;
    try {
      current = await fs.readFile(filePath, 'utf8');
    } catch {
      return `Error: no se encontró el archivo ${relPath}. Para crearlo usá write_file.`;
    }

    const pattern = eolFlexiblePattern(oldString);
    const matches = current.match(pattern) ?? [];
    if (matches.length === 0) {
      return `Error: no se encontró ese texto en ${relPath}. Releé el archivo para confirmar el contenido exacto (espacios e indentación incluidos).`;
    }
    if (matches.length > 1) {
      return `Error: ese texto aparece ${matches.length} veces en ${relPath} — agregá más contexto (líneas antes/después) para que sea único.`;
    }

    pattern.lastIndex = 0;
    const match = pattern.exec(current)!;
    const replacement = normalizeEol(newString, detectDominantEol(current));
    const next = current.slice(0, match.index) + replacement + current.slice(match.index + match[0].length);
    await fs.writeFile(filePath, next, 'utf8');
    return `Archivo editado: ${relPath}`;
  };
}

export const moveFileTool: ToolDef = {
  name: 'move_file',
  description: 'Mueve o renombra un archivo dentro del directorio actual.',
  parameters: {
    type: 'object',
    properties: {
      from: { type: 'string', description: 'Ruta relativa actual del archivo' },
      to: { type: 'string', description: 'Ruta relativa destino' },
    },
    required: ['from', 'to'],
  },
  requiresApproval: true,
};

export function makeMoveFileHandler(cwd: string) {
  return async (args: Record<string, unknown>): Promise<string> => {
    const from = String(args.from ?? '');
    const to = String(args.to ?? '');
    if (!from || !to) return 'Error: from y to son obligatorios.';
    const fromPath = resolveInCwd(cwd, from);
    const toPath = resolveInCwd(cwd, to);
    try {
      await fs.mkdir(path.dirname(toPath), { recursive: true });
      await fs.rename(fromPath, toPath);
    } catch (err: any) {
      return `Error: no se pudo mover ${from} a ${to} (${err?.message ?? err}).`;
    }
    return `Movido: ${from} → ${to}`;
  };
}

export const deleteFileTool: ToolDef = {
  name: 'delete_file',
  description: 'Elimina un archivo del directorio actual, dada una ruta relativa.',
  parameters: {
    type: 'object',
    properties: { path: { type: 'string', description: 'Ruta relativa al directorio de trabajo' } },
    required: ['path'],
  },
  requiresApproval: true,
};

export function makeDeleteFileHandler(cwd: string) {
  return async (args: Record<string, unknown>): Promise<string> => {
    const relPath = String(args.path ?? '');
    const filePath = resolveInCwd(cwd, relPath);
    await fs.rm(filePath, { force: false });
    return `Archivo eliminado: ${relPath}`;
  };
}

/**
 * edit_file busca old_string tal cual lo mandó el modelo, pero los archivos
 * pueden tener fin de línea CRLF (Windows) mientras que el modelo casi
 * siempre genera '\n' — con comparación exacta eso hace fallar la búsqueda
 * siempre, aunque el texto sea "el mismo". Esta regex permite que cada salto
 * de línea del patrón matchee tanto '\n' como '\r\n' reales.
 */
function eolFlexiblePattern(text: string): RegExp {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const flexible = escaped.replace(/\n/g, '\\r?\\n');
  return new RegExp(flexible, 'g');
}

function detectDominantEol(text: string): '\r\n' | '\n' {
  const crlf = (text.match(/\r\n/g) ?? []).length;
  const lfOnly = (text.match(/(?<!\r)\n/g) ?? []).length;
  return crlf > lfOnly ? '\r\n' : '\n';
}

function normalizeEol(text: string, eol: '\r\n' | '\n'): string {
  return text.replace(/\r\n|\n/g, eol);
}

export interface FileChange {
  path: string;
  kind: 'write' | 'edit' | 'delete' | 'move';
  existedBefore: boolean;
  before: string;
  after: string;
  diff: string;
  movedFrom?: string;
}

/**
 * Calcula el cambio de contenido de un write_file/edit_file/delete_file
 * antes de que se ejecute — mismo cálculo que hace la extensión para la
 * tarjeta de diff, acá se usa para el preview que se muestra en la terminal
 * antes de pedir aprobación.
 */
export async function computeFileChange(cwd: string, name: string, args: Record<string, unknown>): Promise<FileChange | undefined> {
  if (name === 'move_file') return computeMoveChange(cwd, args);
  if (name !== 'write_file' && name !== 'edit_file' && name !== 'delete_file') return undefined;

  const relPath = String(args.path ?? '');
  if (!relPath) return undefined;

  let before = '';
  let existedBefore = true;
  const filePath = resolveInCwd(cwd, relPath);
  try {
    before = await fs.readFile(filePath, 'utf8');
  } catch {
    before = '';
    existedBefore = false;
  }

  let after: string;
  if (name === 'write_file') {
    after = String(args.content ?? '');
  } else if (name === 'edit_file') {
    const oldString = String(args.old_string ?? '');
    const newString = String(args.new_string ?? '');
    if (!oldString) return undefined;
    const pattern = eolFlexiblePattern(oldString);
    const matches = before.match(pattern) ?? [];
    if (matches.length !== 1) return undefined;
    pattern.lastIndex = 0;
    const match = pattern.exec(before)!;
    const replacement = normalizeEol(newString, detectDominantEol(before));
    after = before.slice(0, match.index) + replacement + before.slice(match.index + match[0].length);
  } else {
    after = '';
  }
  if (before === after) return undefined;

  const parts = diffLines(before, after);
  const lines: string[] = [];
  for (const part of parts) {
    const prefix = part.added ? '+' : part.removed ? '-' : ' ';
    const partLines = part.value.replace(/\n$/, '').split('\n');
    for (const line of partLines) {
      lines.push(prefix + ' ' + line);
    }
  }
  return {
    path: relPath,
    kind: name === 'write_file' ? 'write' : name === 'edit_file' ? 'edit' : 'delete',
    existedBefore,
    before,
    after,
    diff: lines.join('\n'),
  };
}

async function computeMoveChange(cwd: string, args: Record<string, unknown>): Promise<FileChange | undefined> {
  const from = String(args.from ?? '');
  const to = String(args.to ?? '');
  if (!from || !to) return undefined;

  let before = '';
  try {
    before = await fs.readFile(resolveInCwd(cwd, from), 'utf8');
  } catch {
    return undefined;
  }

  return {
    path: to,
    kind: 'move',
    existedBefore: false,
    before,
    after: before,
    diff: `Mover: ${from} → ${to}`,
    movedFrom: from,
  };
}
