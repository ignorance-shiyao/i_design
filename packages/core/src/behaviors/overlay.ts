import { createBem, cx } from '../classnames.js';
import { spec, type ElementSpec } from './types.js';

export interface DialogBehaviorOptions {
  open: boolean;
  titleId?: string;
  bodyId?: string;
  /** `false` disables click-outside-to-close. */
  closeOnMask?: boolean;
  closeOnEscape?: boolean;
  onClose?: (reason: 'mask' | 'escape' | 'close-button') => void;
  size?: 's' | 'm' | 'l' | 'full';
  extraClass?: string;
}

export interface DialogBehavior {
  mask: ElementSpec;
  panel: ElementSpec;
  closeButton: ElementSpec;
  /** Attach to `document` while open; returns the keydown handler. */
  onDocumentKeydown: (event: KeyboardEvent) => void;
}

const bem = createBem('dialog');

export function useDialogBehavior(options: DialogBehaviorOptions): DialogBehavior {
  const {
    open,
    titleId,
    bodyId,
    closeOnMask = true,
    closeOnEscape = true,
    onClose,
    size = 'm',
    extraClass,
  } = options;

  return {
    mask: spec(
      cx(bem('mask'), { [bem('mask', 'open')]: open }),
      { 'aria-hidden': true },
      {
        click: (event: any) => {
          if (!closeOnMask) return;
          if (event?.target === event?.currentTarget) onClose?.('mask');
        },
      },
    ),
    panel: spec(cx(bem(), bem(null, `size-${size}`), extraClass), {
      role: 'dialog',
      'aria-modal': true,
      'aria-labelledby': titleId,
      'aria-describedby': bodyId,
      tabindex: -1,
    }),
    closeButton: spec(
      bem('close'),
      { type: 'button', 'aria-label': 'close' },
      { click: () => onClose?.('close-button') },
    ),
    onDocumentKeydown: (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') onClose?.('escape');
    },
  };
}

export interface PopupBehaviorOptions {
  open: boolean;
  id: string;
  trigger?: 'hover' | 'click' | 'focus' | 'manual';
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface PopupBehavior {
  anchor: ElementSpec;
  content: ElementSpec;
}

const popupBem = createBem('popup');

export function usePopupBehavior(options: PopupBehaviorOptions): PopupBehavior {
  const { open, id, trigger = 'hover', disabled = false, onOpenChange } = options;
  const set = (next: boolean) => () => {
    if (disabled || trigger === 'manual') return;
    onOpenChange?.(next);
  };

  const on: ElementSpec['on'] = {};
  if (trigger === 'hover') {
    on.mouseenter = set(true);
    on.mouseleave = set(false);
    on.focus = set(true);
    on.blur = set(false);
  } else if (trigger === 'click') {
    on.click = () => !disabled && onOpenChange?.(!open);
  } else if (trigger === 'focus') {
    on.focus = set(true);
    on.blur = set(false);
  }
  on.keydown = (event: any) => {
    if (event?.key === 'Escape' && open) onOpenChange?.(false);
  };

  return {
    anchor: spec(
      popupBem('anchor'),
      { 'aria-describedby': open ? id : undefined, 'aria-expanded': trigger === 'click' ? open : undefined },
      on,
    ),
    content: spec(cx(popupBem(), { [popupBem(null, 'open')]: open }), {
      id,
      role: 'tooltip',
      'data-open': open,
    }),
  };
}
