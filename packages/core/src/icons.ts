import { createBem, cx } from './classnames.js';
import { spec, type ElementSpec } from './behaviors/types.js';

/**
 * The icon set.
 *
 * Every library of consequence ships one, and for a reason we hit ourselves:
 * Unicode glyphs render differently per platform and font, and collapse into
 * mush at small sizes (our `▾` turned into a dash at 10px). These are 24×24
 * stroked paths — one grid, one stroke weight, so they sit together.
 *
 * Paths only, no <svg> wrapper, so React and Vue can each build the element
 * their own way while emitting identical markup.
 */
export const ICONS = {
  /* Direction */
  'chevron-up': ['M6 14.5 12 8.5 18 14.5'],
  'chevron-down': ['M6 9.5 12 15.5 18 9.5'],
  'chevron-left': ['M14.5 6 8.5 12 14.5 18'],
  'chevron-right': ['M9.5 6 15.5 12 9.5 18'],
  'arrow-up': ['M12 19V5', 'M6 11 12 5 18 11'],
  'arrow-down': ['M12 5v14', 'M6 13 12 19 18 13'],
  'arrow-left': ['M19 12H5', 'M11 6 5 12 11 18'],
  'arrow-right': ['M5 12h14', 'M13 6 19 12 13 18'],
  'caret-up': ['M12 9 17 15H7Z'],
  'caret-down': ['M12 15 7 9h10Z'],

  /* Status */
  check: ['M5 12.5 9.5 17 19 7.5'],
  close: ['M6.5 6.5 17.5 17.5', 'M17.5 6.5 6.5 17.5'],
  'check-circle': ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z', 'M8 12.2 10.9 15 16 9.5'],
  'info-circle': ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z', 'M12 11v5.5', 'M12 7.6v.9'],
  'warning-triangle': ['M12 4.2 21 19.5H3Z', 'M12 10v4', 'M12 16.6v.9'],
  'close-circle': ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z', 'M9.2 9.2 14.8 14.8', 'M14.8 9.2 9.2 14.8'],
  minus: ['M5 12h14'],
  plus: ['M12 5v14', 'M5 12h14'],

  /* Objects */
  search: ['M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Z', 'M16.2 16.2 20.5 20.5'],
  calendar: ['M4.5 6.5h15v13h-15Z', 'M4.5 10.5h15', 'M8.5 4v3', 'M15.5 4v3'],
  clock: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z', 'M12 7.5V12l3 2'],
  copy: ['M9 9h10v10H9Z', 'M15 9V5H5v10h4'],
  trash: ['M5.5 7h13', 'M9.5 7V4.5h5V7', 'M7 7l.8 12.5h8.4L17 7'],
  upload: ['M12 16V4', 'M7.5 8.5 12 4l4.5 4.5', 'M4.5 15v5h15v-5'],
  eye: ['M2.5 12S6 6.2 12 6.2 21.5 12 21.5 12 18 17.8 12 17.8 2.5 12 2.5 12Z', 'M12 9.4a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2Z'],
  star: ['M12 3.6l2.7 5.5 6 .9-4.35 4.2 1.03 6L12 17.35 6.62 20.2l1.03-6L3.3 10l6-.9Z'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  more: ['M6 12h.01', 'M12 12h.01', 'M18 12h.01'],
  filter: ['M4 6h16l-6.2 7.3V19l-3.6-2v-3.7Z'],
  user: ['M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z', 'M4.5 20a7.5 7.5 0 0 1 15 0'],
  folder: ['M3.5 6.5h6l2 2.5h9v10.5h-17Z'],
  file: ['M6.5 3.5h7l4.5 4.5v12.5h-11.5Z', 'M13.5 3.5V8H18'],
  send: ['M20.5 3.5 3.5 10.2l7.2 2.9 2.9 7.2Z', 'M10.7 13.1 20.5 3.5'],
  stop: ['M7.5 7.5h9v9h-9Z'],
  refresh: ['M20 12a8 8 0 1 1-2.4-5.7', 'M20 4v4.5h-4.5'],
  loading: ['M12 3a9 9 0 0 1 9 9'],
  'external-link': ['M14 5h5v5', 'M19 5 11 13', 'M17.5 14v5.5h-13v-13H10'],
  drag: ['M9 6h.01', 'M15 6h.01', 'M9 12h.01', 'M15 12h.01', 'M9 18h.01', 'M15 18h.01'],
} as const;

export type IconName = keyof typeof ICONS;

export interface IconOptions {
  name: IconName;
  /** px; the stroke stays optically even because it scales with the box. */
  size?: number;
  /** Spin continuously — used by the loading icon. */
  spin?: boolean;
  label?: string;
  extraClass?: string;
}

export interface IconSpec {
  root: ElementSpec;
  paths: readonly string[];
  size: number;
}

const bem = createBem('icon');

export function useIcon(options: IconOptions): IconSpec {
  const { name, size = 16, spin, label, extraClass } = options;
  return {
    size,
    paths: ICONS[name] ?? [],
    root: spec(
      cx(bem(), bem(null, name), { [bem(null, 'spin')]: spin ?? name === 'loading' }, extraClass),
      {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': 1.7,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        // Decorative unless it is the only label for its control.
        'aria-hidden': label ? undefined : true,
        role: label ? 'img' : undefined,
        'aria-label': label,
        focusable: false,
      },
    ),
  };
}

/** Solid-filled icons (caret, star) should not also be stroked. */
export const FILLED_ICONS = new Set<IconName>(['caret-up', 'caret-down', 'star', 'stop']);
