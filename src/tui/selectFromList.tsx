import React from 'react';
import { render, Box, Text } from 'ink';
import SelectInput from 'ink-select-input';

interface Item {
  label: string;
  value: string;
}

function PickerApp({ message, items, onSelect }: { message: string; items: Item[]; onSelect: (value: string) => void }) {
  return (
    <Box flexDirection="column" paddingY={0}>
      <Text color="cyan">{message}</Text>
      <SelectInput items={items} onSelect={(item) => onSelect(item.value)} />
    </Box>
  );
}

/** Picker de una sola pasada — monta, espera una elección, desmonta. Nunca
 * se usa al mismo tiempo que otro consumidor de stdin (readline o el chat
 * de Ink ya montado). */
export async function selectFromList(message: string, items: Item[]): Promise<string | null> {
  if (items.length === 0) return null;
  return new Promise((resolve) => {
    let resolved = false;
    const instance = render(
      <PickerApp
        message={message}
        items={items}
        onSelect={(value) => {
          resolved = true;
          instance.unmount();
          resolve(value);
        }}
      />,
    );
    instance.waitUntilExit().then(() => {
      if (!resolved) resolve(null);
    });
  });
}
