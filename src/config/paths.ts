import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';

export const CONFIG_DIR = path.join(os.homedir(), '.scorpk');

export async function ensureConfigDir(): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
}

/**
 * Escribe un archivo JSON dentro de ~/.scorpk con los permisos más
 * restrictivos posibles (0600, solo el dueño puede leer/escribir) — ahí
 * viven tanto las API keys de los proveedores como la sesión de Supabase.
 * chmod es un best-effort en Windows (no tiene el mismo modelo de permisos
 * POSIX), pero no falla la escritura si no se puede aplicar.
 */
export async function writeSecretJson(filename: string, data: unknown): Promise<void> {
  await ensureConfigDir();
  const filePath = path.join(CONFIG_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  try {
    await fs.chmod(filePath, 0o600);
  } catch {
    // Windows u otro FS sin soporte de chmod POSIX — no es fatal.
  }
}

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(CONFIG_DIR, filename), 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function deleteJsonFile(filename: string): Promise<void> {
  try {
    await fs.unlink(path.join(CONFIG_DIR, filename));
  } catch {
    // No existía — nada que borrar.
  }
}
