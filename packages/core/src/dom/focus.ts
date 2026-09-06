const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function focusableWithin(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement,
  );
}

/**
 * Traps Tab/Shift+Tab inside `root` and restores focus on release.
 * Used by Dialog and Drawer; deliberately dependency-free and reusable by both adapters.
 */
export function trapFocus(root: HTMLElement, options: { initial?: HTMLElement | null } = {}) {
  const previous = document.activeElement as HTMLElement | null;

  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;
    const items = focusableWithin(root);
    if (items.length === 0) {
      event.preventDefault();
      root.focus();
      return;
    }
    const first = items[0]!;
    const last = items[items.length - 1]!;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === root)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  document.addEventListener('keydown', onKeydown, true);
  (options.initial ?? focusableWithin(root)[0] ?? root).focus();

  return function release(): void {
    document.removeEventListener('keydown', onKeydown, true);
    previous?.focus?.();
  };
}

let lockCount = 0;
let previousOverflow = '';
let previousPadding = '';

/** Reference-counted scroll lock so nested overlays do not fight each other. */
export function lockScroll(): () => void {
  if (typeof document === 'undefined') return () => {};
  if (lockCount === 0) {
    const { body } = document;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    previousOverflow = body.style.overflow;
    previousPadding = body.style.paddingInlineEnd;
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingInlineEnd = `${gap}px`;
  }
  lockCount += 1;
  let released = false;
  return function unlock(): void {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingInlineEnd = previousPadding;
    }
  };
}
