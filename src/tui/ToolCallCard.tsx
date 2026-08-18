import React from 'react';
import { Box, Text } from 'ink';
import { ToolCall } from '../agent/types';
import { FileChange } from '../tools';

export interface ToolCallDisplay {
  call: ToolCall;
  change?: FileChange;
  isError?: boolean;
  rejected?: boolean;
  errorText?: string;
}

export function ToolCallCard({ call, change, isError, rejected, errorText }: ToolCallDisplay) {
  const statusColor = rejected ? 'yellow' : isError ? 'red' : 'green';
  const statusLabel = rejected ? 'rechazado' : isError ? 'error' : 'aplicado';

  if (change) {
    const title =
      change.kind === 'move' ? `mover ${change.movedFrom} → ${change.path}` : `${change.kind} ${change.path}`;
    return (
      <Box flexDirection="column" borderStyle="round" borderColor={statusColor} paddingX={1} marginY={0}>
        <Box justifyContent="space-between">
          <Text bold color="cyan">
            {title}
          </Text>
          <Text color={statusColor} dimColor={rejected}>
            {statusLabel}
          </Text>
        </Box>
        {change.kind !== 'move' && (
          <Box flexDirection="column">
            {change.diff.split('\n').slice(0, 40).map((line, i) => (
              <Text key={i} color={line.startsWith('+') ? 'green' : line.startsWith('-') ? 'red' : undefined} dimColor={!line.startsWith('+') && !line.startsWith('-')}>
                {line}
              </Text>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <Text color="cyan">{call.name}</Text>
      <Text dimColor> {JSON.stringify(call.arguments).slice(0, 120)}</Text>
      <Text color={statusColor}> [{statusLabel}]</Text>
      {errorText && <Text color="red"> {errorText}</Text>}
    </Box>
  );
}
