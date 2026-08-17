import chalk from 'chalk';
import open from 'open';
import { AuthService } from '../auth/authService';
import { startLocalCallbackServer } from '../auth/localCallbackServer';

export async function login(): Promise<void> {
  const auth = new AuthService();
  const existing = await auth.getUser();
  if (existing) {
    console.log(`Ya estás logueado como ${chalk.bold(existing.email ?? existing.name)}.`);
    return;
  }

  const server = await startLocalCallbackServer();
  const url = auth.beginSignInUrl(`http://127.0.0.1:${server.port}/callback`);
  console.log('Abriendo el navegador para iniciar sesión…');
  console.log(chalk.dim(url));
  await open(url);

  try {
    const handoff = await Promise.race([
      server.waitForHandoff(),
      timeout(5 * 60_000, 'Se agotó el tiempo de espera del login (5 min).'),
    ]);
    await auth.completeSignIn(handoff);
    const user = await auth.getUser();
    console.log(chalk.green(`✓ Sesión iniciada como ${user?.email ?? user?.name ?? 'usuario'}.`));
  } finally {
    server.close();
  }
}

export async function logout(): Promise<void> {
  const auth = new AuthService();
  await auth.signOut();
  console.log('Sesión cerrada.');
}

export async function whoami(): Promise<void> {
  const auth = new AuthService();
  const user = await auth.getUser();
  if (!user) {
    console.log('No hay ninguna sesión activa — corré `scorpk auth login`.');
    return;
  }
  const planLabel = user.plan === 'pro' ? chalk.magenta('Pro') : 'Free';
  console.log(`${user.email ?? user.name} — plan ${planLabel}`);
}

function timeout(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));
}
