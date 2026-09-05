import { createBem, cx } from '../classnames.js';
import { spec, type ElementSpec, type Size, type Status, type Variant } from './types.js';

const bem = createBem('button');

export interface ButtonBehaviorOptions {
  variant?: Variant;
  status?: Status;
  size?: Size;
  block?: boolean;
  disabled?: boolean;
  loading?: boolean;
  shape?: 'rect' | 'round' | 'circle' | 'square';
  /** Renders as `<a>`; the adapter reads this to pick the tag. */
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: any) => void;
  extraClass?: string;
}

export interface ButtonBehavior {
  tag: 'button' | 'a';
  root: ElementSpec;
  /** True while `loading` — the adapter renders a spinner in place of the icon slot. */
  showSpinner: boolean;
}

export function useButtonBehavior(options: ButtonBehaviorOptions = {}): ButtonBehavior {
  const {
    variant = 'solid',
    status = 'default',
    size = 'm',
    block = false,
    disabled = false,
    loading = false,
    shape = 'rect',
    href,
    type = 'button',
    onClick,
    extraClass,
  } = options;

  const inert = disabled || loading;
  const tag: 'button' | 'a' = href ? 'a' : 'button';

  const handleClick = (event: any): void => {
    if (inert) {
      event.preventDefault?.();
      event.stopPropagation?.();
      return;
    }
    onClick?.(event);
  };

  const className = cx(
    bem(),
    bem(null, variant),
    bem(null, `status-${status}`),
    bem(null, `size-${size}`),
    bem(null, `shape-${shape}`),
    { [bem(null, 'block')]: block, [bem(null, 'loading')]: loading, [bem(null, 'disabled')]: inert },
    extraClass,
  );

  const attrs =
    tag === 'a'
      ? { href: inert ? undefined : href, role: 'button', 'aria-disabled': inert || undefined, tabindex: inert ? -1 : 0 }
      : { type, disabled: inert || undefined, 'aria-busy': loading || undefined };

  return {
    tag,
    showSpinner: loading,
    root: spec(className, attrs, { click: handleClick }),
  };
}
