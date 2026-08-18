import React from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';

export function ListPicker({
  message,
  items,
  onSelect,
  onCancel,
}: {
  message: string;
  items: { label: string; value: string }[];
  onSelect: (value: string) => void;
  onCancel: () => void;
}) {
  useInput((_input, key) => {
    if (key.escape) onCancel();
  });

  if (items.length === 0) {
    return <Text color="yellow">Sin opciones disponibles. Esc para volver.</Text>;
  }

  return (
    <Box flexDirection="column">
      <Text color="cyan">{message}</Text>
      <SelectInput items={items} onSelect={(item) => onSelect(item.value)} />
      <Text dimColor>Esc para cancelar</Text>
    </Box>
  );
}
