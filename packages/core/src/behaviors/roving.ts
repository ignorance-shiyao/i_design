import type { ElementSpec } from './types.js';
import { spec } from './types.js';

export type Orientation = 'horizontal' | 'vertical';

export interface RovingItem<T = string> {
  value: T;
  disabled?: boolean;
}

export interface RovingOptions<T = string> {
  items: RovingItem<T>[];
  value: T | null;
  orientation?: Orientation;
  /** Wrap around at the ends, as WAI-ARIA recommends for radio groups and tabs. */
  loop?: boolean;
  /** `select` moves selection with the arrow keys (radios, tabs); `focus` only moves focus. */
  mode?: 'select' | 'focus';
  onChange?: (value: T) => void;
  onFocusChange?: (index: number) => void;
}

export interface RovingResult<T = string> {
  /** Index that owns `tabindex="0"`; every other item gets -1 (one tab stop per group). */
  activeIndex: number;
  itemProps: (item: RovingItem<T>, index: number) => ElementSpec;
  onKeydown: (event: any) => void;
}

const NEXT_KEYS: Record<Orientation, string[]> = {
  horizontal: ['ArrowRight'],
  vertical: ['ArrowDown'],
};
const PREV_KEYS: Record<Orientation, string[]> = {
  horizontal: ['ArrowLeft'],
  vertical: ['ArrowUp'],
};

/**
 * The keyboard-navigation engine shared by RadioGroup, Tabs and Select's listbox.
 *
 * Implementing roving tabindex once is the difference between "arrow keys work in
 * Tabs but not in Radio" (the usual state of affairs) and a library where every
 * grouped control behaves identically — in both frameworks, because this is core.
 */
export function useRoving<T = string>(options: RovingOptions<T>): RovingResult<T> {
  const { items, value, orientation = 'horizontal', loop = true, mode = 'select', onChange, onFocusChange } = options;

  const enabled = items.map((item, index) => ({ item, index })).filter(({ item }) => !item.disabled);
  const selectedIndex = items.findIndex((item) => item.value === value);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : (enabled[0]?.index ?? -1);

  const move = (from: number, delta: number): number | null => {
    if (enabled.length === 0) return null;
    const position = enabled.findIndex(({ index }) => index === from);
    let next = position + delta;
    if (next < 0) next = loop ? enabled.length - 1 : 0;
    if (next >= enabled.length) next = loop ? 0 : enabled.length - 1;
    return enabled[next]!.index;
  };

  const go = (target: number | null, event: any): void => {
    if (target === null) return;
    event.preventDefault?.();
    onFocusChange?.(target);
    if (mode === 'select') onChange?.(items[target]!.value);
  };

  return {
    activeIndex,
    itemProps: (item, index) =>
      spec(
        '',
        {
          tabindex: index === activeIndex && !item.disabled ? 0 : -1,
          'aria-disabled': item.disabled || undefined,
        },
        {
          click: () => {
            if (item.disabled) return;
            onFocusChange?.(index);
            onChange?.(item.value);
          },
        },
      ),
    onKeydown: (event: any) => {
      const key = String(event?.key ?? '');
      if (NEXT_KEYS[orientation].includes(key)) return go(move(activeIndex, 1), event);
      if (PREV_KEYS[orientation].includes(key)) return go(move(activeIndex, -1), event);
      if (key === 'Home') return go(enabled[0]?.index ?? null, event);
      if (key === 'End') return go(enabled[enabled.length - 1]?.index ?? null, event);
      if ((key === ' ' || key === 'Enter') && mode === 'focus') {
        event.preventDefault?.();
        const current = items[activeIndex];
        if (current && !current.disabled) onChange?.(current.value);
      }
    },
  };
}

export interface PageRangeOptions {
  current: number;
  total: number;
  /** How many page buttons to show around the current page. */
  siblings?: number;
}

/** `1 … 4 5 [6] 7 8 … 20` — the ellipsis algorithm every pagination needs. */
export function pageRange(options: PageRangeOptions): (number | 'ellipsis')[] {
  const { current, total, siblings = 1 } = options;
  if (total <= 0) return [];
  const window = siblings * 2 + 5;
  if (total <= window) return Array.from({ length: total }, (_, i) => i + 1);

  const start = Math.max(2, current - siblings);
  const end = Math.min(total - 1, current + siblings);
  const out: (number | 'ellipsis')[] = [1];
  if (start > 2) out.push('ellipsis');
  for (let page = start; page <= end; page += 1) out.push(page);
  if (end < total - 1) out.push('ellipsis');
  out.push(total);
  return out;
}
