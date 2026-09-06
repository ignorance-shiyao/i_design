import { createBem, cx } from '../classnames.js';
import { clampNumber, roundTo } from './number.js';
import { spec, type ElementSpec } from './types.js';

const bem = createBem('slider');

export interface SliderMark {
  value: number;
  label?: string;
}

export interface SliderOptions {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  marks?: SliderMark[];
  disabled?: boolean;
  /** Vertical sliders read bottom-to-top, which flips the arrow keys. */
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  /** Formats the tooltip / aria value text, e.g. `v => v + '%'`. */
  format?: (value: number) => string;
  onChange?: (value: number) => void;
  extraClass?: string;
}

export interface SliderBehavior {
  root: ElementSpec;
  track: ElementSpec;
  fill: ElementSpec;
  handle: ElementSpec;
  mark: (mark: SliderMark) => ElementSpec;
  /** 0–100, for `inline-size` / `inset-inline-start`. */
  percentOf: (value: number) => number;
  /** Converts a pointer position (0–1 along the track) into a stepped value. */
  valueAt: (ratio: number) => number;
  percent: number;
  text: string;
}

export function useSlider(options: SliderOptions): SliderBehavior {
  const {
    value, min = 0, max = 100, step = 1, disabled,
    orientation = 'horizontal', label, format, onChange, extraClass,
  } = options;

  const span = max - min || 1;
  const precision = String(step).includes('.') ? String(step).split('.')[1]!.length : 0;
  const percentOf = (input: number): number => ((clampNumber(input, min, max) - min) / span) * 100;

  const valueAt = (ratio: number): number => {
    const raw = min + clampNumber(ratio, 0, 1) * span;
    const stepped = Math.round((raw - min) / step) * step + min;
    return roundTo(clampNumber(stepped, min, max), precision);
  };

  const move = (delta: number) => (event: any): void => {
    if (disabled) return;
    event.preventDefault?.();
    onChange?.(roundTo(clampNumber(value + delta, min, max), precision));
  };

  const text = format ? format(value) : String(value);

  return {
    percent: percentOf(value),
    percentOf,
    valueAt,
    text,
    root: spec(
      cx(bem(), bem(null, orientation), { [bem(null, 'disabled')]: disabled }, extraClass),
    ),
    track: spec(bem('track')),
    fill: spec(bem('fill')),
    handle: spec(
      bem('handle'),
      {
        role: 'slider',
        tabindex: disabled ? -1 : 0,
        'aria-valuemin': min,
        'aria-valuemax': max,
        'aria-valuenow': value,
        'aria-valuetext': text,
        'aria-orientation': orientation,
        'aria-label': label,
        'aria-disabled': disabled || undefined,
      },
      {
        keydown: (event: any) => {
          const key = String(event?.key ?? '');
          // Vertical sliders grow upward, so Up increases on both axes.
          const forward = orientation === 'vertical' ? 'ArrowUp' : 'ArrowRight';
          const back = orientation === 'vertical' ? 'ArrowDown' : 'ArrowLeft';
          if (key === forward || key === 'ArrowUp') return move(step)(event);
          if (key === back || key === 'ArrowDown') return move(-step)(event);
          if (key === 'PageUp') return move(step * 10)(event);
          if (key === 'PageDown') return move(-step * 10)(event);
          if (key === 'Home') { event.preventDefault?.(); onChange?.(min); return; }
          if (key === 'End') { event.preventDefault?.(); onChange?.(max); return; }
        },
      },
    ),
    mark: (item) =>
      spec(
        cx(bem('mark'), { [bem('mark', 'active')]: item.value <= value }),
        { 'data-value': item.value },
        { click: () => !disabled && onChange?.(item.value) },
      ),
  };
}

/* --- Rate --------------------------------------------------------------- */
const rateBem = createBem('rate');

export interface RateOptions {
  value: number;
  count?: number;
  allowHalf?: boolean;
  /** Clicking the current value clears it — the behaviour Element Plus defaults to. */
  allowClear?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  label?: string;
  onChange?: (value: number) => void;
  extraClass?: string;
}

export function useRate(options: RateOptions) {
  const {
    value, count = 5, allowHalf, allowClear = true, disabled, readonly, label, onChange, extraClass,
  } = options;
  const inert = Boolean(disabled || readonly);

  const pick = (next: number): void => {
    if (inert) return;
    onChange?.(allowClear && next === value ? 0 : next);
  };

  return {
    root: spec(
      cx(rateBem(), { [rateBem(null, 'disabled')]: disabled, [rateBem(null, 'readonly')]: readonly }, extraClass),
      {
        role: 'slider',
        tabindex: inert ? -1 : 0,
        'aria-valuemin': 0,
        'aria-valuemax': count,
        'aria-valuenow': value,
        'aria-label': label ?? 'rating',
        'aria-readonly': readonly || undefined,
      },
      {
        keydown: (event: any) => {
          if (inert) return;
          const key = String(event?.key ?? '');
          const stepSize = allowHalf ? 0.5 : 1;
          if (key === 'ArrowRight' || key === 'ArrowUp') {
            event.preventDefault?.();
            onChange?.(Math.min(count, value + stepSize));
          } else if (key === 'ArrowLeft' || key === 'ArrowDown') {
            event.preventDefault?.();
            onChange?.(Math.max(0, value - stepSize));
          }
        },
      },
    ),
    /** `full` / `half` / `empty` for star `index` (1-based). */
    stateOf: (index: number): 'full' | 'half' | 'empty' =>
      value >= index ? 'full' : allowHalf && value >= index - 0.5 ? 'half' : 'empty',
    item: (index: number): ElementSpec =>
      spec(
        cx(rateBem('item'), rateBem('item', value >= index ? 'full' : allowHalf && value >= index - 0.5 ? 'half' : 'empty')),
        { 'aria-hidden': true },
        {
          click: (event: any) => {
            if (!allowHalf) return pick(index);
            // Left half of the glyph selects the half step.
            const target = event?.currentTarget;
            const rect = target?.getBoundingClientRect?.();
            const isLeft = rect && typeof event.clientX === 'number' ? event.clientX - rect.left < rect.width / 2 : false;
            pick(isLeft ? index - 0.5 : index);
          },
        },
      ),
  };
}
