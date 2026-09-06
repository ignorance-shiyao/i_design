import { createBem, cx } from '../classnames.js';
import { spec, type ElementSpec, type Size } from './types.js';

export type ToggleKind = 'checkbox' | 'switch';

export interface ToggleBehaviorOptions {
  kind: ToggleKind;
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  size?: Size;
  id?: string;
  name?: string;
  value?: string | number;
  onChange?: (checked: boolean, event: any) => void;
  extraClass?: string;
}

export interface ToggleBehavior {
  root: ElementSpec;
  /** The visually hidden native input that keeps forms and a11y working. */
  input: ElementSpec;
  /** The painted box / track. */
  control: ElementSpec;
  label: ElementSpec;
}

/**
 * One behaviour drives both Checkbox and Switch: they differ only in the ARIA
 * role and the painted control, never in state handling.
 */
export function useToggleBehavior(options: ToggleBehaviorOptions): ToggleBehavior {
  const {
    kind,
    checked,
    indeterminate = false,
    disabled = false,
    readonly = false,
    size = 'm',
    id,
    name,
    value,
    onChange,
    extraClass,
  } = options;

  const bem = createBem(kind);
  const inert = disabled || readonly;

  const handleChange = (event: any): void => {
    if (inert) {
      event.preventDefault?.();
      return;
    }
    onChange?.(!checked, event);
  };

  return {
    root: spec(
      cx(
        bem(),
        bem(null, `size-${size}`),
        {
          [bem(null, 'checked')]: checked,
          [bem(null, 'indeterminate')]: indeterminate,
          [bem(null, 'disabled')]: disabled,
        },
        extraClass,
      ),
      { 'data-checked': checked || undefined },
    ),
    input: spec(
      bem('input'),
      {
        type: 'checkbox',
        id,
        name,
        value,
        checked,
        disabled,
        role: kind === 'switch' ? 'switch' : undefined,
        'aria-checked': indeterminate ? 'mixed' : checked,
        'aria-readonly': readonly || undefined,
      },
      { change: handleChange },
    ),
    control: spec(bem('control'), { 'aria-hidden': true }),
    label: spec(bem('label'), {}),
  };
}
