import React, { useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';

const CUSTOM_VALUE = '__custom__';

export function AskUserPrompt({
  question,
  options,
  onAnswer,
}: {
  question: string;
  options: string[];
  onAnswer: (answer: string) => void;
}) {
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');

  const items = [...options.map((opt) => ({ label: opt, value: opt })), { label: '✎ Escribir mi propia respuesta', value: CUSTOM_VALUE }];

  return (
    <Box flexDirection="column">
      <Text color="magenta">? {question}</Text>
      {customMode ? (
        <Box>
          <Text color="cyan">{'> '}</Text>
          <TextInput value={customText} onChange={setCustomText} onSubmit={(v) => onAnswer(v.trim())} />
        </Box>
      ) : (
        <SelectInput
          items={items}
          onSelect={(item) => {
            if (item.value === CUSTOM_VALUE) setCustomMode(true);
            else onAnswer(item.value);
          }}
        />
      )}
    </Box>
  );
}
