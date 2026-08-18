import React from 'react';
import { Box, Text } from 'ink';

export interface WelcomeBannerProps {
  version: string;
  cwd: string;
  providerLabel: string;
  model: string;
  userLabel?: string;
  planLabel?: string;
}

const TIPS = [
  '/model — cambiar el modelo activo',
  '/provider — cambiar de proveedor configurado',
  '/mode — alternar aprobación manual / automática',
  '/clear — vaciar el historial de esta sesión',
  '/help — ver todos los comandos',
];

export function WelcomeBanner({ version, cwd, providerLabel, model, userLabel, planLabel }: WelcomeBannerProps) {
  return (
    <Box borderStyle="round" borderColor="magenta" paddingX={1} marginBottom={1}>
      <Box flexDirection="column" width="50%">
        <Text>
          <Text color="magenta" bold>
            {'  Scorpk '}
          </Text>
          <Text dimColor>v{version}</Text>
        </Text>
        <Box marginTop={1} flexDirection="column">
          <Text>
            <Text dimColor>proveedor  </Text>
            <Text color="cyan">{providerLabel}</Text>
          </Text>
          <Text>
            <Text dimColor>modelo     </Text>
            <Text color="cyan">{model}</Text>
          </Text>
          {userLabel && (
            <Text>
              <Text dimColor>cuenta     </Text>
              <Text>{userLabel}</Text>
              {planLabel && <Text color={planLabel === 'Pro' ? 'magenta' : undefined}> ({planLabel})</Text>}
            </Text>
          )}
          <Text>
            <Text dimColor>carpeta    </Text>
            <Text>{cwd}</Text>
          </Text>
        </Box>
      </Box>
      <Box flexDirection="column" width="50%" paddingLeft={2} borderStyle="single" borderColor="gray" borderTop={false} borderBottom={false} borderRight={false}>
        <Text bold>Para empezar</Text>
        {TIPS.map((tip) => (
          <Text key={tip} dimColor>
            {tip}
          </Text>
        ))}
      </Box>
    </Box>
  );
}
