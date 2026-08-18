import React from 'react';
import { Box, Text, Static } from 'ink';
import { ToolCallCard, ToolCallDisplay } from './ToolCallCard';

export type DisplayItem =
  | { id: string; kind: 'user'; text: string }
  | { id: string; kind: 'assistant'; text: string }
  | { id: string; kind: 'tool'; display: ToolCallDisplay }
  | { id: string; kind: 'notice'; text: string; tone?: 'error' | 'info' };

export function MessageList({ items, streaming }: { items: DisplayItem[]; streaming: string }) {
  return (
    <Box flexDirection="column">
      <Static items={items}>{(item) => <MessageItem key={item.id} item={item} />}</Static>
      {streaming.length > 0 && (
        <Box marginY={0}>
          <Text>{streaming}</Text>
        </Box>
      )}
    </Box>
  );
}

function MessageItem({ item }: { item: DisplayItem }) {
  if (item.kind === 'user') {
    return (
      <Box marginY={0}>
        <Text color="cyan" bold>
          {'> '}
        </Text>
        <Text>{item.text}</Text>
      </Box>
    );
  }
  if (item.kind === 'assistant') {
    return (
      <Box marginY={0}>
        <Text>{item.text}</Text>
      </Box>
    );
  }
  if (item.kind === 'tool') {
    return <ToolCallCard {...item.display} />;
  }
  return (
    <Box marginY={0}>
      <Text color={item.tone === 'error' ? 'red' : 'yellow'} dimColor={item.tone !== 'error'}>
        {item.text}
      </Text>
    </Box>
  );
}
