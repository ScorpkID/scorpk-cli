import { createRequire } from 'node:module';

// createRequire(import.meta.url) resuelve relativo a donde termine viviendo
// el bundle (dist/cli.js, un nivel bajo la raíz) — no al archivo fuente
// original, que puede estar más anidado (src/commands/chat.ts, por
// ejemplo). Por eso este es el ÚNICO lugar que hace este require, y todo
// lo demás importa la constante ya resuelta en vez de repetir el cálculo.
const require = createRequire(import.meta.url);
export const version: string = require('../package.json').version;
