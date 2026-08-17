#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { login, logout, whoami } from './commands/auth';
import { setKey, listProviders } from './commands/config';
import { run } from './commands/run';
import { chat } from './commands/chat';
import { version } from '../package.json';

const program = new Command();

program.name('scorpk').description('Agente de IA para programar desde la terminal.').version(version);

const auth = program.command('auth').description('Cuenta de scorpk.tech (opcional — solo hace falta para Modo equipo/MCP más adelante)');
auth.command('login').description('Iniciar sesión vía el navegador').action(login);
auth.command('logout').description('Cerrar sesión').action(logout);
auth.command('whoami').description('Mostrar el usuario y plan actuales').action(whoami);

const config = program.command('config').description('Proveedores de IA (BYOK)');
config
  .command('set-key <proveedor> <key>')
  .description('Guardar la API key de un proveedor (anthropic, openai, gemini, groq, cerebras, openrouter, deepseek, fireworks)')
  .action(setKey);
config.command('list').description('Listar proveedores configurados').action(listProviders);

program
  .command('run <tarea>')
  .description('Correr una tarea puntual sobre el directorio actual')
  .option('-y, --yes', 'aplicar los cambios sin pedir confirmación')
  .option('-p, --provider <id>', 'proveedor a usar (por defecto, el primero configurado)')
  .option('-m, --model <modelo>', 'modelo a usar (por defecto, el del proveedor)')
  .action(run);

program
  .command('chat')
  .description('Sesión interactiva multi-turno sobre el directorio actual')
  .option('-y, --yes', 'aplicar los cambios sin pedir confirmación')
  .option('-p, --provider <id>', 'proveedor a usar (por defecto, el primero configurado)')
  .option('-m, --model <modelo>', 'modelo a usar (por defecto, el del proveedor)')
  .action(chat);

program.parseAsync(process.argv).catch((err) => {
  console.error(chalk.red(err?.message ?? String(err)));
  process.exitCode = 1;
});
