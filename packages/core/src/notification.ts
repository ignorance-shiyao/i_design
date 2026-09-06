import { createBem, cx } from './classnames.js';
import { isBrowser } from './env.js';

const bem = createBem('notification');

export type NotificationStatus = 'default' | 'info' | 'success' | 'warning' | 'danger';
export type NotificationPlacement = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

export interface NotificationOptions {
  title: string;
  description?: string;
  status?: NotificationStatus;
  placement?: NotificationPlacement;
  /** ms; `0` keeps it until dismissed. */
  duration?: number;
  closable?: boolean;
  /** Label for a single inline action button. */
  actionText?: string;
  onAction?: () => void;
  onClose?: () => void;
}

const ICON: Record<NotificationStatus, string> = {
  default: '·', info: 'ⓘ', success: '✓', warning: '!', danger: '✕',
};

const containers = new Map<NotificationPlacement, HTMLElement>();

function ensureContainer(placement: NotificationPlacement): HTMLElement {
  const existing = containers.get(placement);
  if (existing?.isConnected) return existing;

  const node = document.createElement('div');
  node.className = cx(bem('list'), bem('list', placement));
  node.setAttribute('role', 'region');
  node.setAttribute('aria-label', 'notifications');
  // Mirror the document theme so a portalled notification matches the app.
  node.setAttribute('data-i-theme', document.documentElement.getAttribute('data-i-theme') ?? 'light');
  document.body.appendChild(node);
  containers.set(placement, node);
  return node;
}

/**
 * Imperative notifications, the "plugin" style TDesign and Element expose.
 * Framework-free, so React, Vue and a plain script all call the same function.
 */
export function showNotification(options: NotificationOptions): () => void {
  if (!isBrowser) return () => {};
  const {
    title, description, status = 'default', placement = 'top-end',
    duration = 4500, closable = true, actionText, onAction, onClose,
  } = options;

  const host = ensureContainer(placement);
  const node = document.createElement('div');
  node.className = cx(bem(), bem(null, status));
  node.setAttribute('role', status === 'danger' ? 'alert' : 'status');

  const icon = document.createElement('span');
  icon.className = bem('icon');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = ICON[status];

  const body = document.createElement('div');
  body.className = bem('body');

  const heading = document.createElement('div');
  heading.className = bem('title');
  heading.textContent = title;
  body.appendChild(heading);

  if (description) {
    const text = document.createElement('div');
    text.className = bem('description');
    text.textContent = description;
    body.appendChild(text);
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const close = (): void => {
    if (timer) clearTimeout(timer);
    node.classList.add(bem(null, 'leaving'));
    // Let the exit animation finish before removing the node.
    setTimeout(() => {
      node.remove();
      if (host.childElementCount === 0) {
        host.remove();
        containers.delete(placement);
      }
      onClose?.();
    }, 180);
  };

  if (actionText) {
    const action = document.createElement('button');
    action.className = bem('action');
    action.type = 'button';
    action.textContent = actionText;
    action.addEventListener('click', () => {
      onAction?.();
      close();
    });
    body.appendChild(action);
  }

  node.append(icon, body);

  if (closable) {
    const dismiss = document.createElement('button');
    dismiss.className = bem('close');
    dismiss.type = 'button';
    dismiss.setAttribute('aria-label', 'close');
    dismiss.textContent = '×';
    dismiss.addEventListener('click', close);
    node.appendChild(dismiss);
  }

  host.appendChild(node);

  if (duration > 0) {
    timer = setTimeout(close, duration);
    // Reading a notification should not race the timer.
    node.addEventListener('mouseenter', () => timer && clearTimeout(timer));
    node.addEventListener('mouseleave', () => {
      timer = setTimeout(close, duration);
    });
  }

  return close;
}

export const notification = {
  open: showNotification,
  info: (title: string, description?: string) => showNotification({ title, description, status: 'info' }),
  success: (title: string, description?: string) => showNotification({ title, description, status: 'success' }),
  warning: (title: string, description?: string) => showNotification({ title, description, status: 'warning' }),
  error: (title: string, description?: string) => showNotification({ title, description, status: 'danger' }),
};
