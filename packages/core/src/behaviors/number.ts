import { createBem, cx } from '../classnames.js';
import { spec, type ElementSpec, type Size } from './types.js';

const bem = createBem('input-number');

export interface NumberBehaviorOptions {
  value: number | null;
  min?: number;
  max?: number;
  step?: number;
  /** Decimal places to round to; inferred from `step` when omitted. */
  precision?: number;
  size?: Size;
  disabled?: boolean;
  readonly?: boolean;
  status?: 'default' | 'success' | 'warning' | 'danger';
  placeholder?: string;
  id?: string;
  name?: string;
  describedBy?: string;
  /** `side` puts − / + on the ends (Element Plus style); `stack` stacks them. */
  controls?: 'stack' | 'side' | 'none';
  /** Display transform, e.g. thousands separators or a unit suffix. */
  formatter?: (value: number | null) => string;
  parser?: (text: string) => number | null;
  onChange?: (value: number | null) => void;
  extraClass?: string;
}

export interface NumberBehavior {
  root: ElementSpec;
  input: ElementSpec;
  increase: ElementSpec;
  decrease: ElementSpec;
  displayValue: string;
  canIncrease: boolean;
  canDecrease: boolean;
}

const decimalsOf = (step: number): number => {
  const text = String(step);
  const dot = text.indexOf('.');
  return dot === -1 ? 0 : text.length - dot - 1;
};

/** Rounds away float noise: 0.1 + 0.2 must not become 0.30000000000000004. */
export function roundTo(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function useInputNumber(options: NumberBehaviorOptions): NumberBehavior {
  const {
    value, min = -Infinity, max = Infinity, step = 1, size = 'm', disabled, readonly,
    status = 'default', placeholder, id, name, describedBy, controls = 'stack',
    formatter, parser, onChange, extraClass,
  } = options;

  const precision = options.precision ?? decimalsOf(step);
  const inert = Boolean(disabled || readonly);

  const commit = (next: number | null): void => {
    if (inert) return;
    if (next === null) {
      onChange?.(null);
      return;
    }
    onChange?.(roundTo(clampNumber(next, min, max), precision));
  };

  const nudge = (direction: 1 | -1) => (): void => {
    const base = value ?? (Number.isFinite(min) ? min : 0);
    commit(base + direction * step);
  };

  const canIncrease = !inert && (value === null || value < max);
  const canDecrease = !inert && (value === null || value > min);

  return {
    canIncrease,
    canDecrease,
    displayValue: formatter ? formatter(value) : value === null ? '' : String(value),
    root: spec(
      cx(bem(), bem(null, `size-${size}`), bem(null, `status-${status}`), bem(null, `controls-${controls}`), {
        [bem(null, 'disabled')]: disabled,
      }, extraClass),
    ),
    input: spec(
      bem('inner'),
      {
        id,
        name,
        type: 'text',
        inputmode: 'decimal',
        role: 'spinbutton',
        value: formatter ? formatter(value) : value === null ? '' : String(value),
        placeholder,
        disabled,
        readonly,
        'aria-valuenow': value ?? undefined,
        'aria-valuemin': Number.isFinite(min) ? min : undefined,
        'aria-valuemax': Number.isFinite(max) ? max : undefined,
        'aria-invalid': status === 'danger' || undefined,
        'aria-describedby': describedBy,
      },
      {
        input: (event: any) => {
          const text = String(event?.target?.value ?? '');
          if (text.trim() === '') return commit(null);
          const parsed = parser ? parser(text) : Number(text.replace(/[^\d.eE+-]/g, ''));
          if (parsed === null || Number.isNaN(parsed)) return;
          // Don't clamp while typing — "1" on the way to "15" would jump to the min.
          onChange?.(parsed);
        },
        blur: () => {
          if (value === null) return;
          commit(value);
        },
        keydown: (event: any) => {
          const key = String(event?.key ?? '');
          if (key === 'ArrowUp') { event.preventDefault?.(); nudge(1)(); }
          else if (key === 'ArrowDown') { event.preventDefault?.(); nudge(-1)(); }
          else if (key === 'PageUp') { event.preventDefault?.(); commit((value ?? 0) + step * 10); }
          else if (key === 'PageDown') { event.preventDefault?.(); commit((value ?? 0) - step * 10); }
          else if (key === 'Home' && Number.isFinite(min)) { event.preventDefault?.(); commit(min); }
          else if (key === 'End' && Number.isFinite(max)) { event.preventDefault?.(); commit(max); }
        },
      },
    ),
    increase: spec(
      cx(bem('step'), bem('step', 'up'), { [bem('step', 'disabled')]: !canIncrease }),
      { type: 'button', tabindex: -1, 'aria-label': 'increase', disabled: !canIncrease || undefined },
      { click: nudge(1) },
    ),
    decrease: spec(
      cx(bem('step'), bem('step', 'down'), { [bem('step', 'disabled')]: !canDecrease }),
      { type: 'button', tabindex: -1, 'aria-label': 'decrease', disabled: !canDecrease || undefined },
      { click: nudge(-1) },
    ),
  };
}
