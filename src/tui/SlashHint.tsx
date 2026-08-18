import React from 'react';
import { Box, Text } from 'ink';

export const SLASH_COMMANDS: { name: string; description: string }[] = [
  { name: '/model', description: 'cambiar el modelo activo' },
  { name: '/provider', description: 'cambiar de proveedor configurado' },
  { name: '/mode', description: 'alternar manual/auto' },
  { name: '/clear', description: 'vaciar el historial de esta sesión' },
  { name: '/help', description: 'ver todos los comandos' },
  { name: '/exit', description: 'salir' },
];

export function SlashHint({ filter }: { filter: string }) {
  const matches = SLASH_COMMANDS.filter((c) => c.name.startsWith(filter));
  if (matches.length === 0) return null;
  return (
    <Box flexDirection="column" paddingLeft={2}>
      {matches.map((c) => (
        <Text key={c.name} dimColor>
          {c.name} <Text color="gray">— {c.description}</Text>
        </Text>
      ))}
    </Box>
  );
}
