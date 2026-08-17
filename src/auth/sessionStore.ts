import { readJsonFile, writeSecretJson, deleteJsonFile } from '../config/paths';

const FILE = 'session.json';

/**
 * @supabase/supabase-js persiste la sesión (tokens) a través de una interfaz
 * de storage tipo localStorage. En la extensión eso se respalda en
 * SecretStorage de VS Code; acá, en un archivo local con permisos 600 —
 * mismo criterio que usan la mayoría de las CLIs (gh, vercel, etc.).
 */
export class SessionStore {
  async getItem(key: string): Promise<string | null> {
    const data = await readJsonFile<Record<string, string>>(FILE, {});
    return data[key] ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    const data = await readJsonFile<Record<string, string>>(FILE, {});
    data[key] = value;
    await writeSecretJson(FILE, data);
  }

  async removeItem(key: string): Promise<void> {
    const data = await readJsonFile<Record<string, string>>(FILE, {});
    delete data[key];
    await writeSecretJson(FILE, data);
  }

  async clear(): Promise<void> {
    await deleteJsonFile(FILE);
  }
}
