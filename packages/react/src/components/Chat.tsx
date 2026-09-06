import {
  createId, isAtBottom, useChatMessage, useCodeBlock, usePromptInput, useSuggestions,
  useThinkingBlock, useTypingIndicator,
  type ChatMessageOptions, type ChatRole, type ChatStatus, type PromptInputOptions,
} from '@i-design/core';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toProps } from '../utils.js';

/* --- ChatMessage -------------------------------------------------------- */
export interface ChatMessageProps extends Omit<ChatMessageOptions, 'extraClass'> {
  name?: ReactNode;
  time?: ReactNode;
  avatar?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

const ROLE_INITIAL: Record<ChatRole, string> = { user: '你', assistant: 'AI', system: '·' };

export function ChatMessage(props: ChatMessageProps) {
  const { name, time, avatar, actions, className, children, role, ...rest } = props;
  const behavior = useChatMessage({ ...rest, role, extraClass: className });

  return (
    <div {...toProps(behavior.root)}>
      {role !== 'system' && (
        <span {...toProps(behavior.avatar)}>{avatar ?? ROLE_INITIAL[role]}</span>
      )}
      <div {...toProps(behavior.body)}>
        {(name != null || time != null) && (
          <div {...toProps(behavior.header)}>
            {name}
            {time != null && <span>{time}</span>}
          </div>
        )}
        <div {...toProps(behavior.bubble)}>{children}</div>
        {actions && <div {...toProps(behavior.actions)}>{actions}</div>}
      </div>
    </div>
  );
}

export interface ChatActionProps {
  label: string;
  onClick?: () => void;
  children?: ReactNode;
}

export function ChatAction({ label, onClick, children }: ChatActionProps) {
  const behavior = useChatMessage({ role: 'assistant' });
  return <button {...toProps(behavior.action(label, onClick))}>{children ?? label}</button>;
}

/* --- TypingIndicator ---------------------------------------------------- */
export function TypingIndicator({ label }: { label?: string }) {
  const behavior = useTypingIndicator({ label });
  return (
    <span {...toProps(behavior.root)}>
      {[0, 1, 2].map((index) => (
        <span key={index} {...toProps(behavior.dot(index))} />
      ))}
    </span>
  );
}

/* --- ThinkingBlock ------------------------------------------------------ */
export interface ThinkingBlockProps {
  label?: string;
  defaultOpen?: boolean;
  children?: ReactNode;
}

export function ThinkingBlock({ label = '推理过程', defaultOpen = false, children }: ThinkingBlockProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useMemo(() => createId('i-thinking'), []);
  const behavior = useThinkingBlock({ open, id, onToggle: () => setOpen((value) => !value) });

  return (
    <div {...toProps(behavior.root)}>
      <button {...toProps(behavior.trigger)}>
        <span>{open ? '▾' : '▸'}</span>
        {label}
      </button>
      <div {...toProps(behavior.panel)}>{children}</div>
    </div>
  );
}

/* --- CodeBlock ---------------------------------------------------------- */
export interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language = 'text', className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const behavior = useCodeBlock({
    language,
    copied,
    onCopy: () => {
      void navigator.clipboard?.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    },
  });

  return (
    <div {...toProps(behavior.root)} className={[behavior.root.class, className].filter(Boolean).join(' ')}>
      <div {...toProps(behavior.header)}>
        <span>{language}</span>
        <button {...toProps(behavior.copy)}>{copied ? '已复制' : '复制'}</button>
      </div>
      <pre {...toProps(behavior.pre)}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* --- Suggestions -------------------------------------------------------- */
export interface SuggestionsProps {
  items: string[];
  onPick?: (value: string) => void;
}

export function Suggestions({ items, onPick }: SuggestionsProps) {
  const behavior = useSuggestions({ onPick });
  return (
    <div {...toProps(behavior.root)}>
      {items.map((item) => (
        <button key={item} {...toProps(behavior.item(item))}>
          {item}
        </button>
      ))}
    </div>
  );
}

/* --- PromptInput -------------------------------------------------------- */
export interface PromptInputProps extends Omit<PromptInputOptions, 'value' | 'onInput' | 'extraClass'> {
  value?: string;
  defaultValue?: string;
  className?: string;
  toolbar?: ReactNode;
  hint?: ReactNode;
  onChange?: (value: string) => void;
}

export function PromptInput(props: PromptInputProps) {
  const {
    value: controlled, defaultValue = '', className, toolbar, hint, onChange, onSubmit, ...rest
  } = props;
  const [internal, setInternal] = useState(defaultValue);
  const value = controlled ?? internal;
  const ref = useRef<HTMLTextAreaElement>(null);

  const setValue = (next: string): void => {
    if (controlled === undefined) setInternal(next);
    onChange?.(next);
  };

  const behavior = usePromptInput({
    ...rest, value,
    extraClass: className,
    onInput: setValue,
    onSubmit: (text) => {
      onSubmit?.(text);
      setValue('');
    },
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight) || 22;
    el.style.height = `${behavior.autosizeHeight(el.scrollHeight, lineHeight)}px`;
  }, [value, behavior]);

  return (
    <div {...toProps(behavior.root)}>
      <textarea ref={ref} {...toProps(behavior.textarea)} />
      <div {...toProps(behavior.toolbar)}>
        <span className="i-prompt__hint">{hint}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {toolbar}
          <button {...toProps(behavior.send)}>{rest.busy ? '■' : '↑'}</button>
        </span>
      </div>
    </div>
  );
}

/* --- Conversation shell ------------------------------------------------- */
export interface ChatProps {
  className?: string;
  footer?: ReactNode;
  children?: ReactNode;
  /** Re-run the stick-to-bottom check when this changes (e.g. message count). */
  scrollKey?: unknown;
}

export function Chat({ className, footer, children, scrollKey }: ChatProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || !stick.current) return;
    el.scrollTop = el.scrollHeight;
  }, [scrollKey, children]);

  return (
    <div className={['i-chat', className].filter(Boolean).join(' ')}>
      <div
        ref={scroller}
        className="i-chat__scroll"
        onScroll={(event) => {
          const el = event.currentTarget;
          // Following stops the moment the reader scrolls up, and resumes at the bottom.
          stick.current = isAtBottom({
            scrollTop: el.scrollTop,
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
          });
        }}
      >
        {children}
      </div>
      {footer && <div className="i-chat__footer">{footer}</div>}
    </div>
  );
}

export type { ChatRole, ChatStatus };
