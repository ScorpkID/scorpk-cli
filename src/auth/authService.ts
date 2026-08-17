import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SCORPK_WEB_URL } from './supabaseConfig';
import { SessionStore } from './sessionStore';

export interface AuthUser {
  id: string;
  email: string | null;
  name: string;
  provider: string;
  plan: 'free' | 'pro';
}

export class AuthService {
  private readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: new SessionStore(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  async getUser(): Promise<AuthUser | null> {
    try {
      const { data } = await withTimeout(this.client.auth.getSession(), 8000);
      if (!data.session?.user) return null;
      const plan = await this.getPlan();
      return toAuthUser(data.session.user, plan);
    } catch {
      return null;
    }
  }

  /** Nunca "falla abierto" a pro — cualquier error o falta de fila cae a free. */
  private async getPlan(): Promise<'free' | 'pro'> {
    try {
      const { data } = await withTimeout(
        Promise.resolve(this.client.from('subscriptions').select('plan,status').maybeSingle()),
        5000,
      );
      const row = data as { plan: string; status: string } | null;
      if (row?.plan === 'pro' && (row.status === 'active' || row.status === 'trialing')) return 'pro';
      return 'free';
    } catch {
      return 'free';
    }
  }

  /** URL a abrir en el navegador — el login en sí ocurre en scorpk.tech. */
  beginSignInUrl(localCallbackUrl: string): string {
    const callback = encodeURIComponent(localCallbackUrl);
    return `${SCORPK_WEB_URL}/login?from=cli&callback=${callback}`;
  }

  /** Canjea el código de un solo uso que el sitio manda de vuelta por el callback local. */
  async completeSignIn(handoffCode: string): Promise<void> {
    const res = await fetch(`${SCORPK_WEB_URL}/api/vscode/handoff/consume`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: handoffCode }),
    });
    if (!res.ok) {
      throw new Error('No se pudo completar el login — probá de nuevo.');
    }
    const { access_token, refresh_token } = (await res.json()) as { access_token: string; refresh_token: string };
    const { error } = await this.client.auth.setSession({ access_token, refresh_token });
    if (error) throw new Error(error.message);
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }
}

function toAuthUser(user: User, plan: 'free' | 'pro'): AuthUser {
  const meta = user.user_metadata ?? {};
  const name: string = meta.full_name || meta.name || (user.email ? user.email.split('@')[0] : 'Usuario');
  const provider = user.app_metadata?.provider ?? 'email';
  return { id: user.id, email: user.email ?? null, name, provider, plan };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
