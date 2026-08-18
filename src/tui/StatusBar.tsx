import React from 'react';
import { Box, Text } from 'ink';

export interface StatusBarProps {
  mode: 'manual' | 'auto';
  providerLabel: string;
  model: string;
  busy: boolean;
}

export function StatusBar({ mode, providerLabel, model, busy }: StatusBarProps) {
  return (
    <Box justifyContent="space-between" paddingX={1}>
      <Text dimColor>
        modo <Text color={mode === 'auto' ? 'yellow' : 'green'}>{mode}</Text> (ctrl+t para alternar) · / para comandos
      </Text>
      <Text dimColor>
        {busy && <Text color="cyan">generando… </Text>}
        {providerLabel} · {model}
      </Text>
    </Box>
  );
}
