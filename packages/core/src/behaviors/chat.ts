import { createBem, cx } from '../classnames.js';
import { spec, type ElementSpec } from './types.js';

/**
 * Primitives for AI conversation UIs. The fiddly parts of a chat surface —
 * IME-safe Enter-to-send, stick-to-bottom scrolling, streaming reveal, the
 * status vocabulary of a message — are exactly the parts that get re-implemented
 * badly per app, so they live here and are shared by both adapters.
 */

export type ChatRole = 'user' | 'assistant' | 'system';
export type ChatStatus = 'sending' | 'streaming' | 'complete' | 'error';

/* --- Message ------------------------------------------------------------ */
const messageBem = createBem('chat-message');

export interface ChatMessageOptions {
  role: ChatRole;
  status?: ChatStatus;
  /** Renders the assistant bubble without a surface, for long-form answers. */
  plain?: boolean;
  extraClass?: string;
}

export function useChatMessage(options: ChatMessageOptions) {
  const { role, status = 'complete', plain, extraClass } = options;
  return {
    root: spec(
      cx(messageBem(), messageBem(null, role), messageBem(null, `status-${status}`), {
        [messageBem(null, 'plain')]: plain,
      }, extraClass),
      {
        // Each turn is an article so screen readers can navigate turn by turn.
        role: 'article',
        'aria-label': role === 'user' ? 'you' : role,
        'data-status': status,
        // Only the streaming turn is a live region; finished ones must not re-announce.
        'aria-live': status === 'streaming' ? 'polite' : undefined,
        'aria-busy': status === 'streaming' || status === 'sending' || undefined,
      },
    ),
    avatar: spec(messageBem('avatar'), { 'aria-hidden': true }),
    body: spec(messageBem('body')),
    bubble: spec(messageBem('bubble')),
    header: spec(messageBem('header')),
    actions: spec(messageBem('actions')),
    action: (label: string, onClick?: () => void): ElementSpec =>
      spec(messageBem('action'), { type: 'button', 'aria-label': label, title: label }, { click: () => onClick?.() }),
  };
}

/* --- Prompt input ------------------------------------------------------- */
const promptBem = createBem('prompt');

export interface PromptInputOptions {
  value: string;
  placeholder?: string;
  disabled?: boolean;
  /** While busy, the send button becomes a stop button. */
  busy?: boolean;
  maxlength?: number;
  minRows?: number;
  maxRows?: number;
  onInput?: (value: string) => void;
  onSubmit?: (value: string) => void;
  onStop?: () => void;
  extraClass?: string;
}

export interface PromptInputBehavior {
  root: ElementSpec;
  textarea: ElementSpec;
  send: ElementSpec;
  toolbar: ElementSpec;
  canSend: boolean;
  autosizeHeight: (scrollHeight: number, lineHeight: number) => number;
}

export function usePromptInput(options: PromptInputOptions): PromptInputBehavior {
  const {
    value, placeholder, disabled, busy, maxlength, minRows = 1, maxRows = 10,
    onInput, onSubmit, onStop, extraClass,
  } = options;

  const canSend = value.trim().length > 0 && !disabled;

  const submit = (): void => {
    if (busy) { onStop?.(); return; }
    if (!canSend) return;
    onSubmit?.(value.trim());
  };

  return {
    canSend,
    root: spec(cx(promptBem(), { [promptBem(null, 'disabled')]: disabled, [promptBem(null, 'busy')]: busy }, extraClass)),
    textarea: spec(
      promptBem('textarea'),
      {
        value,
        placeholder,
        disabled,
        maxlength,
        rows: minRows,
        'aria-label': placeholder ?? 'message',
        'aria-multiline': true,
      },
      {
        input: (event: any) => onInput?.(String(event?.target?.value ?? '')),
        keydown: (event: any) => {
          if (event?.key !== 'Enter' || event?.shiftKey) return;
          // `isComposing` is the whole ballgame for CJK input: without this check,
          // pressing Enter to accept a candidate would send a half-typed message.
          if (event?.isComposing || event?.keyCode === 229 || event?.nativeEvent?.isComposing) return;
          event.preventDefault?.();
          submit();
        },
      },
    ),
    toolbar: spec(promptBem('toolbar')),
    send: spec(
      cx(promptBem('send'), { [promptBem('send', 'stop')]: busy }),
      {
        type: 'button',
        'aria-label': busy ? 'stop generating' : 'send message',
        disabled: (!canSend && !busy) || undefined,
      },
      { click: submit },
    ),
    autosizeHeight: (scrollHeight, lineHeight) =>
      Math.min(Math.max(scrollHeight, minRows * lineHeight), maxRows * lineHeight),
  };
}

/* --- Streaming ---------------------------------------------------------- */

export interface StreamOptions {
  /** Characters revealed per tick; a tick is one animation frame (~16ms). */
  charsPerTick?: number;
  onUpdate: (text: string) => void;
  onDone?: () => void;
}

export interface StreamController {
  /** Append a chunk as it arrives from the network. */
  push: (chunk: string) => void;
  /** No more chunks are coming; drain what is left, then finish. */
  end: () => void;
  /** Abandon the remaining buffer and reveal everything at once. */
  flush: () => void;
  stop: () => void;
  /** Text revealed so far. */
  revealed: string;
}

/**
 * Decouples network chunk size from reveal speed: tokens arrive in bursts, but
 * text should appear at a readable, even pace. Without this, streamed answers
 * jump in blocks.
 */
export function createStreamController(options: StreamOptions): StreamController {
  const { charsPerTick = 3, onUpdate, onDone } = options;
  let buffer = '';
  let revealed = '';
  let ended = false;
  let timer: ReturnType<typeof setInterval> | undefined;

  const finish = (): void => {
    if (timer) clearInterval(timer);
    timer = undefined;
    onDone?.();
  };

  const tick = (): void => {
    if (buffer.length === 0) {
      if (ended) finish();
      return;
    }
    const take = buffer.slice(0, charsPerTick);
    buffer = buffer.slice(charsPerTick);
    revealed += take;
    controller.revealed = revealed;
    onUpdate(revealed);
    if (buffer.length === 0 && ended) finish();
  };

  const start = (): void => {
    if (timer) return;
    timer = setInterval(tick, 16);
  };

  const controller: StreamController = {
    revealed: '',
    push(chunk: string) {
      buffer += chunk;
      start();
    },
    end() {
      ended = true;
      if (buffer.length === 0) finish();
    },
    flush() {
      revealed += buffer;
      buffer = '';
      controller.revealed = revealed;
      onUpdate(revealed);
      finish();
    },
    stop() {
      buffer = '';
      if (timer) clearInterval(timer);
      timer = undefined;
    },
  };

  return controller;
}

/* --- Stick-to-bottom scrolling ------------------------------------------ */

export interface ScrollAnchorState {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

/**
 * Should the view follow new content? Yes while the reader is at the bottom,
 * no as soon as they scroll up to read something — the behaviour every chat UI
 * needs and most get wrong.
 */
export function isAtBottom(state: ScrollAnchorState, threshold = 32): boolean {
  return state.scrollHeight - state.scrollTop - state.clientHeight <= threshold;
}

/* --- Small parts -------------------------------------------------------- */
const typingBem = createBem('typing');

export function useTypingIndicator(options: { label?: string } = {}) {
  return {
    root: spec(typingBem(), { role: 'status', 'aria-label': options.label ?? 'assistant is typing' }),
    dot: (index: number): ElementSpec =>
      spec(typingBem('dot'), { style: undefined, 'data-index': index }),
  };
}

const thinkingBem = createBem('thinking');

export function useThinkingBlock(options: { open: boolean; id: string; label?: string; onToggle?: () => void }) {
  const { open, id, onToggle } = options;
  return {
    root: spec(cx(thinkingBem(), { [thinkingBem(null, 'open')]: open })),
    trigger: spec(
      thinkingBem('trigger'),
      { type: 'button', 'aria-expanded': open, 'aria-controls': `${id}-panel` },
      { click: () => onToggle?.() },
    ),
    panel: spec(thinkingBem('panel'), { id: `${id}-panel`, role: 'region', hidden: !open || undefined }),
  };
}

const codeBem = createBem('code-block');

export function useCodeBlock(options: { language?: string; copied?: boolean; onCopy?: () => void }) {
  const { language, copied, onCopy } = options;
  return {
    root: spec(codeBem(), { 'data-language': language }),
    header: spec(codeBem('header')),
    pre: spec(codeBem('pre'), { tabindex: 0 }),
    copy: spec(
      cx(codeBem('copy'), { [codeBem('copy', 'copied')]: copied }),
      { type: 'button', 'aria-label': copied ? 'copied' : 'copy code' },
      { click: () => onCopy?.() },
    ),
  };
}

const suggestionBem = createBem('suggestions');

export function useSuggestions(options: { onPick?: (value: string) => void } = {}) {
  return {
    root: spec(suggestionBem(), { role: 'list', 'aria-label': 'suggested prompts' }),
    item: (value: string): ElementSpec =>
      spec(suggestionBem('item'), { type: 'button', role: 'listitem' }, { click: () => options.onPick?.(value) }),
  };
}
