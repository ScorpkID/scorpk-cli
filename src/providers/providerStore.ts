import { randomUUID } from 'crypto';
import { StoredProviderConfig } from './types';
import { readJsonFile, writeSecretJson } from '../config/paths';

const FILE = 'providers.json';

export class ProviderStore {
  async list(): Promise<StoredProviderConfig[]> {
    return readJsonFile<StoredProviderConfig[]>(FILE, []);
  }

  async get(id: string): Promise<StoredProviderConfig | undefined> {
    return (await this.list()).find((p) => p.id === id);
  }

  async add(input: Omit<StoredProviderConfig, 'id'>): Promise<StoredProviderConfig> {
    const provider: StoredProviderConfig = { ...input, id: randomUUID() };
    const providers = await this.list();
    providers.push(provider);
    await writeSecretJson(FILE, providers);
    return provider;
  }

  async remove(id: string): Promise<void> {
    const providers = (await this.list()).filter((p) => p.id !== id);
    await writeSecretJson(FILE, providers);
  }

  /** Primer proveedor configurado — usado por default cuando no se pasa --provider. */
  async getDefault(): Promise<StoredProviderConfig | undefined> {
    return (await this.list())[0];
  }
}
