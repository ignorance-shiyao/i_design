import { createBem, cx } from './classnames.js';
import { isBrowser } from './env.js';

const bem = createBem('message');

export type MessageStatus = 'default' | 'success' | 'warning' | 'danger';

export interface MessageOptions {
  content: string;
  status?: MessageStatus;
  /** ms; `0` keeps the message until it is closed manually. */
  duration?: number;
}

let container: HTMLElement | null = null;

function ensureContainer(): HTMLElement {
  if (container?.isConnected) return container;
  container = document.createElement('div');
  container.className = bem('list');
  // Mirror the document theme so portalled messages match the app.
  container.setAttribute('data-i-theme', document.documentElement.getAttribute('data-i-theme') ?? 'light');
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');
  document.body.appendChild(container);
  return container;
}

/**
 * Imperative toast API (`message.success('saved')`), the pattern Element Plus and
 * TDesign users expect. Framework-free on purpose: React and Vue re-export the
 * exact same function, so it also works in a plain script or a Svelte app.
 */
export function showMessage(options: MessageOptions): () => void {
  if (!isBrowser) return () => {};
  const { content, status = 'default', duration = 3000 } = options;
  const host = ensureContainer();
  const node = document.createElement('div');
  node.className = cx(bem(), status !== 'default' && bem(null, status));
  node.textContent = content;
  host.appendChild(node);

  const close = (): void => {
    node.remove();
    if (host.childElementCount === 0) host.remove();
  };
  if (duration > 0) setTimeout(close, duration);
  return close;
}

export const message = {
  open: showMessage,
  info: (content: string, duration?: number) => showMessage({ content, duration }),
  success: (content: string, duration?: number) => showMessage({ content, status: 'success', duration }),
  warning: (content: string, duration?: number) => showMessage({ content, status: 'warning', duration }),
  error: (content: string, duration?: number) => showMessage({ content, status: 'danger', duration }),
};
