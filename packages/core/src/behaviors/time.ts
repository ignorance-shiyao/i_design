import { createBem, cx } from '../classnames.js';
import { spec, type ElementSpec, type Size } from './types.js';

const bem = createBem('time-picker');

export interface TimeValue {
  hour: number;
  minute: number;
  second?: number;
}

export const formatTime = (time: TimeValue | null, withSeconds = false): string => {
  if (!time) return '';
  const pad = (value: number): string => String(value).padStart(2, '0');
  const base = `${pad(time.hour)}:${pad(time.minute)}`;
  return withSeconds ? `${base}:${pad(time.second ?? 0)}` : base;
};

export function parseTime(text: string): TimeValue | null {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(text.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = match[3] === undefined ? 0 : Number(match[3]);
  if (hour > 23 || minute > 59 || second > 59) return null;
  return { hour, minute, second };
}

export interface TimePickerOptions {
  value: TimeValue | null;
  open?: boolean;
  /** Minute/second granularity, e.g. 15 for quarter hours. */
  step?: number;
  showSeconds?: boolean;
  size?: Size;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  id: string;
  onChange?: (value: TimeValue | null) => void;
  onOpenChange?: (open: boolean) => void;
  extraClass?: string;
}

/**
 * Three scrolling columns rather than a text mask: typing "9:5" is ambiguous
 * (09:05? 09:50?) and every masked time input eventually fights the user's IME.
 */
export function useTimePicker(options: TimePickerOptions) {
  const {
    value, open = false, step = 1, showSeconds, size = 'm', placeholder = '选择时间',
    disabled, clearable, id, onChange, onOpenChange, extraClass,
  } = options;

  const range = (count: number, by: number): number[] =>
    Array.from({ length: Math.ceil(count / by) }, (_, index) => index * by);

  const set = (part: keyof TimeValue, next: number): void => {
    const base: TimeValue = value ?? { hour: 0, minute: 0, second: 0 };
    onChange?.({ ...base, [part]: next });
  };

  return {
    displayValue: formatTime(value, showSeconds),
    placeholder,
    hours: range(24, 1),
    minutes: range(60, step),
    seconds: range(60, step),
    root: spec(
      cx(bem(), bem(null, `size-${size}`), { [bem(null, 'open')]: open, [bem(null, 'disabled')]: disabled }, extraClass),
    ),
    trigger: spec(
      bem('trigger'),
      {
        type: 'button',
        role: 'combobox',
        'aria-haspopup': 'listbox',
        'aria-expanded': open,
        'aria-controls': `${id}-panel`,
        disabled: disabled || undefined,
      },
      {
        click: () => !disabled && onOpenChange?.(!open),
        keydown: (event: any) => {
          if (event?.key === 'Escape') onOpenChange?.(false);
        },
      },
    ),
    panel: spec(bem('panel'), { id: `${id}-panel`, role: 'group', 'aria-label': '选择时间' }),
    column: (part: keyof TimeValue): ElementSpec =>
      spec(bem('column'), { role: 'listbox', 'aria-label': part }),
    cell: (part: keyof TimeValue, unit: number): ElementSpec => {
      const active = (value?.[part] ?? -1) === unit;
      return spec(
        cx(bem('cell'), { [bem('cell', 'active')]: active }),
        { type: 'button', role: 'option', 'aria-selected': active },
        { click: () => set(part, unit) },
      );
    },
    clear:
      clearable && value && !disabled
        ? spec(
            bem('clear'),
            { type: 'button', tabindex: -1, 'aria-label': 'clear' },
            {
              pointerdown: (event: any) => {
                event.preventDefault?.();
                event.stopPropagation?.();
                onChange?.(null);
              },
            },
          )
        : null,
  };
}

/* --- Countdown ---------------------------------------------------------- */

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

/** Splits a remaining-millisecond count into display parts. */
export function countdownParts(remaining: number): CountdownParts {
  const clamped = Math.max(0, remaining);
  const totalSeconds = Math.floor(clamped / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    done: clamped === 0,
  };
}

export function formatCountdown(remaining: number, pattern = 'HH:mm:ss'): string {
  const parts = countdownParts(remaining);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return pattern
    .replace('DD', pad(parts.days))
    .replace('HH', pad(parts.hours))
    .replace('mm', pad(parts.minutes))
    .replace('ss', pad(parts.seconds));
}
