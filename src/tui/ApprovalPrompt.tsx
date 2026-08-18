import React from 'react';
import { Box, Text, useInput } from 'ink';
import { ToolCall } from '../agent/types';
import { FileChange } from '../tools';
import { ToolCallCard } from './ToolCallCard';

export function ApprovalPrompt({
  call,
  change,
  onDecide,
}: {
  call: ToolCall;
  change?: FileChange;
  onDecide: (approved: boolean) => void;
}) {
  useInput((input, key) => {
    if (key.return || input === 'y' || input === 's') onDecide(true);
    else if (key.escape || input === 'n') onDecide(false);
  });

  return (
    <Box flexDirection="column">
      <ToolCallCard call={call} change={change} />
      <Text color="yellow">Enter / y para aplicar · Esc / n para rechazar</Text>
    </Box>
  );
}
