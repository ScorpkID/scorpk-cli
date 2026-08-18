import React, { useRef, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { runAgent, ApprovalResult } from '../agent/agentRuntime';
import { ChatMessage, ToolCall } from '../agent/types';
import { allTools, createToolHandlers, computeFileChange, FileChange } from '../tools';
import { createClient } from '../providers/clientFactory';
import { ProviderStore } from '../providers/providerStore';
import { StoredProviderConfig } from '../providers/types';
import { listModelsFor } from '../providers/listModelsFor';
import { findPreset } from '../providers/providerPresets';
import { WelcomeBanner } from './WelcomeBanner';
import { StatusBar } from './StatusBar';
import { MessageList, DisplayItem } from './MessageList';
import { SlashHint, SLASH_COMMANDS } from './SlashHint';
import { ApprovalPrompt } from './ApprovalPrompt';
import { AskUserPrompt } from './AskUserPrompt';
import { ListPicker } from './ListPicker';

const SILENT_TOOLS = new Set(['read_file', 'list_dir', 'search_files', 'git_status', 'git_diff']);

type Pending =
  | { kind: 'approval'; call: ToolCall; change?: FileChange }
  | { kind: 'askUser'; question: string; options: string[] }
  | { kind: 'modelPicker'; items: { label: string; value: string }[] }
  | { kind: 'providerPicker'; items: { label: string; value: string }[] }
  | null;

export interface AppProps {
  version: string;
  cwd: string;
  system: string;
  initialProvider: StoredProviderConfig;
  initialModel: string;
  initialMode: 'manual' | 'auto';
  userLabel?: string;
  planLabel?: string;
}

let idCounter = 0;
const nextId = () => String(idCounter++);

export function App(props: AppProps) {
  const { exit } = useApp();
  const providerStoreRef = useRef(new ProviderStore());
  const historyRef = useRef<ChatMessage[]>([]);

  const [provider, setProvider] = useState(props.initialProvider);
  const [model, setModel] = useState(props.initialModel);
  const [mode, setMode] = useState<'manual' | 'auto'>(props.initialMode);
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [streaming, setStreaming] = useState('');
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState<Pending>(null);

  const approvalResolveRef = useRef<((approved: boolean) => void) | null>(null);
  const askUserResolveRef = useRef<((answer: string) => void) | null>(null);

  function pushItem(item: DisplayItem) {
    setItems((prev) => [...prev, item]);
  }

  useInput((input2, key) => {
    if (key.ctrl && input2 === 't' && !pending && !busy) {
      setMode((m) => (m === 'manual' ? 'auto' : 'manual'));
    }
  });

  async function runTurn(userText: string) {
    historyRef.current.push({ role: 'user', content: userText });
    setBusy(true);
    setStreaming('');

    const toolHandlers = createToolHandlers(props.cwd);
    const pendingChanges = new Map<string, { call: ToolCall; change?: FileChange }>();

    const requestApproval = (call: ToolCall): Promise<ApprovalResult> => {
      const info = pendingChanges.get(call.id);
      return new Promise((resolve) => {
        approvalResolveRef.current = (approved: boolean) => {
          setPending(null);
          resolve(approved ? { approved: true } : { approved: false, reason: 'Rechazado por el usuario.' });
        };
        setPending({ kind: 'approval', call, change: info?.change });
      });
    };

    const askUser = (_callId: string, question: string, options: string[]): Promise<string> => {
      return new Promise((resolve) => {
        askUserResolveRef.current = (answer: string) => {
          setPending(null);
          resolve(answer);
        };
        setPending({ kind: 'askUser', question, options });
      });
    };

    let client;
    try {
      client = createClient(provider);
    } catch (err: any) {
      pushItem({ id: nextId(), kind: 'notice', text: err?.message ?? String(err), tone: 'error' });
      setBusy(false);
      return;
    }

    let assistantBuffer = '';
    const gen = runAgent({
      client,
      model,
      system: props.system,
      history: historyRef.current,
      tools: allTools,
      toolHandlers,
      requestApproval: mode === 'auto' ? async () => ({ approved: true }) : requestApproval,
      askUser,
    });

    try {
      for await (const ev of gen) {
        if (ev.type === 'text-delta') {
          assistantBuffer += ev.textDelta;
          setStreaming(assistantBuffer);
        } else if (ev.type === 'tool-call') {
          if (!pendingChanges.has(ev.call.id)) {
            const change = await computeFileChange(props.cwd, ev.call.name, ev.call.arguments);
            pendingChanges.set(ev.call.id, { call: ev.call, change });
          }
        } else if (ev.type === 'tool-result') {
          const info = pendingChanges.get(ev.callId);
          if (info && !SILENT_TOOLS.has(info.call.name)) {
            pushItem({ id: nextId(), kind: 'tool', display: { call: info.call, change: info.change, isError: ev.isError, errorText: ev.isError ? ev.result : undefined } });
          }
        } else if (ev.type === 'tool-rejected') {
          const info = pendingChanges.get(ev.callId);
          if (info) {
            pushItem({ id: nextId(), kind: 'tool', display: { call: info.call, change: info.change, rejected: true } });
          }
        }
      }
    } catch (err: any) {
      // Una key inválida o un corte de red no debe tirar abajo la sesión
      // entera — se corta el turno y se avisa en el transcript.
      pushItem({ id: nextId(), kind: 'notice', text: err?.message ?? String(err), tone: 'error' });
    }

    if (assistantBuffer.trim()) {
      pushItem({ id: nextId(), kind: 'assistant', text: assistantBuffer });
    }
    setStreaming('');
    setBusy(false);
  }

  async function openModelPicker() {
    try {
      const list = await listModelsFor(provider, provider.apiKey);
      const items2 = list.map((m) => ({ label: m.free ? `${m.id} (gratis)` : m.id, value: m.id }));
      setPending({ kind: 'modelPicker', items: items2 });
    } catch (err: any) {
      pushItem({ id: nextId(), kind: 'notice', text: `No se pudo listar modelos: ${err?.message ?? err}`, tone: 'error' });
    }
  }

  async function openProviderPicker() {
    const providers = await providerStoreRef.current.list();
    const items2 = providers.map((p) => ({ label: p.name, value: p.id }));
    setPending({ kind: 'providerPicker', items: items2 });
  }

  async function handleSubmit(text: string) {
    const trimmed = text.trim();
    setInput('');
    if (!trimmed || busy) return;

    if (trimmed.startsWith('/')) {
      const cmd = trimmed.split(/\s+/)[0];
      if (cmd === '/model') return openModelPicker();
      if (cmd === '/provider') return openProviderPicker();
      if (cmd === '/mode') {
        setMode((m) => (m === 'manual' ? 'auto' : 'manual'));
        return;
      }
      if (cmd === '/clear') {
        historyRef.current = [];
        setItems([]);
        return;
      }
      if (cmd === '/help') {
        const text2 = SLASH_COMMANDS.map((c) => `${c.name} — ${c.description}`).join('\n');
        pushItem({ id: nextId(), kind: 'notice', text: text2 });
        return;
      }
      if (cmd === '/exit') {
        exit();
        return;
      }
      pushItem({ id: nextId(), kind: 'notice', text: `Comando desconocido: ${cmd} — /help para ver la lista.`, tone: 'error' });
      return;
    }

    pushItem({ id: nextId(), kind: 'user', text: trimmed });
    await runTurn(trimmed);
  }

  const providerLabel = provider.name;

  return (
    <Box flexDirection="column">
      <WelcomeBanner
        version={props.version}
        cwd={props.cwd}
        providerLabel={providerLabel}
        model={model}
        userLabel={props.userLabel}
        planLabel={props.planLabel}
      />
      <MessageList items={items} streaming={streaming} />

      {pending?.kind === 'approval' && <ApprovalPrompt call={pending.call} change={pending.change} onDecide={(a) => approvalResolveRef.current?.(a)} />}
      {pending?.kind === 'askUser' && <AskUserPrompt question={pending.question} options={pending.options} onAnswer={(a) => askUserResolveRef.current?.(a)} />}
      {pending?.kind === 'modelPicker' && (
        <ListPicker
          message="Elegí el modelo:"
          items={pending.items}
          onSelect={(value) => {
            setModel(value);
            setPending(null);
          }}
          onCancel={() => setPending(null)}
        />
      )}
      {pending?.kind === 'providerPicker' && (
        <ListPicker
          message="Elegí el proveedor:"
          items={pending.items}
          onSelect={async (value) => {
            const all = await providerStoreRef.current.list();
            const next = all.find((p) => p.id === value);
            if (next) {
              setProvider(next);
              setModel(next.defaultModel ?? '');
            }
            setPending(null);
          }}
          onCancel={() => setPending(null)}
        />
      )}

      {!pending && (
        <>
          <Box borderStyle="single" borderColor="gray" paddingX={1}>
            <Text color="cyan">{'> '}</Text>
            <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} focus={!busy} />
          </Box>
          {input.startsWith('/') && <SlashHint filter={input} />}
          <StatusBar mode={mode} providerLabel={providerLabel} model={model} busy={busy} />
        </>
      )}
    </Box>
  );
}
