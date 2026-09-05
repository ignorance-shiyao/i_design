import { createBem, cx } from '../classnames.js';
import { spec, type ElementSpec, type Size, type Status } from './types.js';

const bem = createBem('input');

export interface InputBehaviorOptions {
  value?: string;
  size?: Size;
  status?: Extract<Status, 'default' | 'success' | 'warning' | 'danger'>;
  disabled?: boolean;
  readonly?: boolean;
  clearable?: boolean;
  placeholder?: string;
  maxlength?: number;
  type?: string;
  id?: string;
  name?: string;
  /** For `aria-describedby` on the form-item help/error text. */
  describedBy?: string;
  onInput?: (value: string, event: any) => void;
  onClear?: (event: any) => void;
  extraClass?: string;
}

export interface InputBehavior {
  root: ElementSpec;
  input: ElementSpec;
  clear: ElementSpec | null;
  /** `value.length / maxlength`, ready to render when `maxlength` is set. */
  count: { current: number; max: number } | null;
}

export function useInputBehavior(options: InputBehaviorOptions = {}): InputBehavior {
  const {
    value = '',
    size = 'm',
    status = 'default',
    disabled = false,
    readonly = false,
    clearable = false,
    placeholder,
    maxlength,
    type = 'text',
    id,
    name,
    describedBy,
    onInput,
    onClear,
    extraClass,
  } = options;

  const showClear = clearable && value.length > 0 && !disabled && !readonly;

  return {
    root: spec(
      cx(
        bem(),
        bem(null, `size-${size}`),
        bem(null, `status-${status}`),
        { [bem(null, 'disabled')]: disabled, [bem(null, 'readonly')]: readonly },
        extraClass,
      ),
    ),
    input: spec(
      bem('inner'),
      {
        type,
        id,
        name,
        value,
        placeholder,
        disabled,
        readonly,
        maxlength,
        'aria-invalid': status === 'danger' || undefined,
        'aria-describedby': describedBy,
      },
      { input: (event: any) => onInput?.(String(event?.target?.value ?? ''), event) },
    ),
    clear: showClear
      ? spec(
          bem('clear'),
          { type: 'button', tabindex: -1, 'aria-label': 'clear' },
          { click: (event: any) => onClear?.(event) },
        )
      : null,
    count: maxlength ? { current: value.length, max: maxlength } : null,
  };
}
