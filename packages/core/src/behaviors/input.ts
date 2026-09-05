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

/* --- Textarea ----------------------------------------------------------- */
const textareaBem = createBem('textarea');

export interface TextareaBehaviorOptions
  extends Omit<InputBehaviorOptions, 'type' | 'clearable' | 'onClear' | 'size'> {
  rows?: number;
  /** Grow with the content, between `minRows` and `maxRows`. */
  autosize?: boolean;
  minRows?: number;
  maxRows?: number;
  resize?: 'none' | 'vertical' | 'both';
}

export interface TextareaBehavior {
  root: ElementSpec;
  textarea: ElementSpec;
  count: { current: number; max: number } | null;
  /** Height in px for the autosize case, given the scrollHeight the adapter measured. */
  autosizeHeight: (scrollHeight: number, lineHeight: number) => number;
}

export function useTextareaBehavior(options: TextareaBehaviorOptions = {}): TextareaBehavior {
  const {
    value = '', status = 'default', disabled = false, readonly = false, placeholder,
    maxlength, id, name, describedBy, onInput, rows = 3, autosize, minRows = 2, maxRows = 8,
    resize = 'vertical', extraClass,
  } = options;

  return {
    root: spec(
      cx(textareaBem(), textareaBem(null, `status-${status}`), textareaBem(null, `resize-${autosize ? 'none' : resize}`), {
        [textareaBem(null, 'disabled')]: disabled,
      }, extraClass),
    ),
    textarea: spec(
      textareaBem('inner'),
      {
        id, name, value, placeholder, disabled, readonly, maxlength,
        rows: autosize ? minRows : rows,
        'aria-invalid': status === 'danger' || undefined,
        'aria-describedby': describedBy,
      },
      { input: (event: any) => onInput?.(String(event?.target?.value ?? ''), event) },
    ),
    count: maxlength ? { current: value.length, max: maxlength } : null,
    autosizeHeight: (scrollHeight, lineHeight) =>
      Math.min(Math.max(scrollHeight, minRows * lineHeight), maxRows * lineHeight),
  };
}
