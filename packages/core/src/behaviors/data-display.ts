import { createBem, cx } from '../classnames.js';
import { spec, type ElementSpec, type Size, type Status } from './types.js';

/* --- List --------------------------------------------------------------- */
const listBem = createBem('list');

export interface ListOptions {
  bordered?: boolean;
  split?: boolean;
  size?: Size;
  hoverable?: boolean;
  extraClass?: string;
}

export function useList(options: ListOptions = {}) {
  const { bordered = true, split = true, size = 'm', hoverable, extraClass } = options;
  return {
    root: spec(
      cx(listBem(), listBem(null, `size-${size}`), {
        [listBem(null, 'bordered')]: bordered,
        [listBem(null, 'split')]: split,
        [listBem(null, 'hoverable')]: hoverable,
      }, extraClass),
      { role: 'list' },
    ),
    header: spec(listBem('header')),
    footer: spec(listBem('footer')),
    item: spec(listBem('item'), { role: 'listitem' }),
    meta: spec(listBem('meta')),
    avatar: spec(listBem('avatar')),
    content: spec(listBem('content')),
    title: spec(listBem('title')),
    description: spec(listBem('description')),
    actions: spec(listBem('actions')),
  };
}

/* --- Descriptions ------------------------------------------------------- */
const descBem = createBem('descriptions');

export interface DescriptionsOptions {
  /** `horizontal` puts the label beside the value, `vertical` above it. */
  layout?: 'horizontal' | 'vertical';
  bordered?: boolean;
  columns?: number;
  size?: Size;
  extraClass?: string;
}

export function useDescriptions(options: DescriptionsOptions = {}) {
  const { layout = 'horizontal', bordered, columns = 2, size = 'm', extraClass } = options;
  return {
    columns,
    root: spec(
      cx(descBem(), descBem(null, layout), descBem(null, `size-${size}`), {
        [descBem(null, 'bordered')]: bordered,
      }, extraClass),
    ),
    style: { '--i-descriptions-columns': String(columns) } as Record<string, string>,
    item: (span = 1): ElementSpec =>
      spec(descBem('item'), { 'data-span': span > 1 ? span : undefined }),
    itemStyle: (span = 1): Record<string, string> =>
      span > 1 ? { gridColumn: `span ${Math.min(span, columns)}` } : {},
    label: spec(descBem('label')),
    value: spec(descBem('value')),
  };
}

/* --- Statistic ---------------------------------------------------------- */
const statBem = createBem('statistic');

export interface StatisticOptions {
  value: number | string;
  precision?: number;
  /** Thousands separator; pass '' to disable. */
  groupSeparator?: string;
  trend?: 'up' | 'down' | 'flat';
  status?: Status;
  extraClass?: string;
}

export function formatStatistic(value: number | string, precision?: number, separator = ','): string {
  if (typeof value === 'string') return value;
  const fixed = precision === undefined ? String(value) : value.toFixed(precision);
  const [whole, fraction] = fixed.split('.');
  const grouped = separator ? whole!.replace(/\B(?=(\d{3})+(?!\d))/g, separator) : whole!;
  return fraction ? `${grouped}.${fraction}` : grouped;
}

export function useStatistic(options: StatisticOptions) {
  const { value, precision, groupSeparator = ',', trend, status = 'default', extraClass } = options;
  return {
    text: formatStatistic(value, precision, groupSeparator),
    root: spec(cx(statBem(), statBem(null, `status-${status}`), { [statBem(null, `trend-${trend}`)]: !!trend }, extraClass)),
    label: spec(statBem('label')),
    value: spec(statBem('value')),
    prefix: spec(statBem('prefix')),
    suffix: spec(statBem('suffix')),
    trendIcon: spec(statBem('trend'), { 'aria-hidden': true }),
  };
}

/* --- Timeline ----------------------------------------------------------- */
const timelineBem = createBem('timeline');

export interface TimelineItem {
  key: string;
  title: string;
  time?: string;
  description?: string;
  status?: 'default' | 'success' | 'warning' | 'danger' | 'process';
}

export function useTimeline(options: { items: TimelineItem[]; mode?: 'left' | 'alternate'; extraClass?: string }) {
  const { mode = 'left', extraClass } = options;
  return {
    root: spec(cx(timelineBem(), timelineBem(null, mode), extraClass), { role: 'list' }),
    item: (item: TimelineItem, index: number): ElementSpec =>
      spec(
        cx(timelineBem('item'), timelineBem('item', item.status ?? 'default'), {
          [timelineBem('item', 'alt')]: mode === 'alternate' && index % 2 === 1,
        }),
        { role: 'listitem' },
      ),
    dot: spec(timelineBem('dot'), { 'aria-hidden': true }),
    line: spec(timelineBem('line'), { 'aria-hidden': true }),
    content: spec(timelineBem('content')),
    time: spec(timelineBem('time')),
  };
}

/* --- Segmented ---------------------------------------------------------- */
const segBem = createBem('segmented');

export interface SegmentedOption {
  value: string;
  label?: string;
  disabled?: boolean;
}

export function useSegmented(options: {
  options: SegmentedOption[];
  value: string;
  size?: Size;
  block?: boolean;
  onChange?: (value: string) => void;
  extraClass?: string;
}) {
  const { options: items, value, size = 'm', block, onChange, extraClass } = options;
  const activeIndex = items.findIndex((item) => item.value === value);

  return {
    activeIndex,
    root: spec(
      cx(segBem(), segBem(null, `size-${size}`), { [segBem(null, 'block')]: block }, extraClass),
      { role: 'radiogroup' },
      {
        keydown: (event: any) => {
          const key = String(event?.key ?? '');
          const delta = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0;
          if (delta === 0) return;
          event.preventDefault?.();
          const enabled = items.map((item, index) => ({ item, index })).filter(({ item }) => !item.disabled);
          const position = enabled.findIndex(({ index }) => index === activeIndex);
          const next = enabled[(position + delta + enabled.length) % enabled.length];
          if (next) onChange?.(next.item.value);
        },
      },
    ),
    /** The sliding pill; the adapter only positions it. */
    thumbStyle: (): Record<string, string> => ({
      transform: `translateX(${activeIndex * 100}%)`,
      inlineSize: `${100 / Math.max(items.length, 1)}%`,
    }),
    thumb: spec(segBem('thumb'), { 'aria-hidden': true }),
    item: (item: SegmentedOption): ElementSpec =>
      spec(
        cx(segBem('item'), {
          [segBem('item', 'active')]: item.value === value,
          [segBem('item', 'disabled')]: item.disabled,
        }),
        {
          type: 'button',
          role: 'radio',
          'aria-checked': item.value === value,
          'aria-disabled': item.disabled || undefined,
          tabindex: item.value === value ? 0 : -1,
        },
        { click: () => !item.disabled && onChange?.(item.value) },
      ),
  };
}

/* --- Typography --------------------------------------------------------- */
const typoBem = createBem('typography');

export interface TypographyOptions {
  as?: 'text' | 'title' | 'paragraph';
  level?: 1 | 2 | 3 | 4 | 5;
  status?: Status;
  /** Number of lines before clamping; 1 uses ellipsis, >1 uses line-clamp. */
  ellipsis?: number;
  strong?: boolean;
  italic?: boolean;
  underline?: boolean;
  delete?: boolean;
  code?: boolean;
  copyable?: boolean;
  copied?: boolean;
  onCopy?: () => void;
  extraClass?: string;
}

export function useTypography(options: TypographyOptions = {}) {
  const {
    as = 'text', level = 3, status = 'default', ellipsis, strong, italic,
    underline, delete: strike, code, copyable, copied, onCopy, extraClass,
  } = options;

  return {
    tag: as === 'title' ? (`h${level}` as const) : as === 'paragraph' ? ('p' as const) : ('span' as const),
    root: spec(
      cx(typoBem(), typoBem(null, as), typoBem(null, `status-${status}`), {
        [typoBem(null, `level-${level}`)]: as === 'title',
        [typoBem(null, 'strong')]: strong,
        [typoBem(null, 'italic')]: italic,
        [typoBem(null, 'underline')]: underline,
        [typoBem(null, 'delete')]: strike,
        [typoBem(null, 'code')]: code,
        [typoBem(null, 'ellipsis')]: ellipsis === 1,
        [typoBem(null, 'clamp')]: (ellipsis ?? 0) > 1,
      }, extraClass),
    ),
    style: (ellipsis ?? 0) > 1 ? ({ '--i-typography-lines': String(ellipsis) } as Record<string, string>) : {},
    copy: copyable
      ? spec(
          cx(typoBem('copy'), { [typoBem('copy', 'copied')]: copied }),
          { type: 'button', 'aria-label': copied ? 'copied' : 'copy' },
          { click: () => onCopy?.() },
        )
      : null,
  };
}

/* --- Result ------------------------------------------------------------- */
const resultBem = createBem('result');

export function useResult(options: { status?: 'success' | 'warning' | 'danger' | 'info' | '404' | '500'; extraClass?: string } = {}) {
  const { status = 'info', extraClass } = options;
  return {
    root: spec(cx(resultBem(), resultBem(null, `status-${status}`), extraClass), { role: 'status' }),
    icon: spec(resultBem('icon'), { 'aria-hidden': true }),
    title: spec(resultBem('title')),
    description: spec(resultBem('description')),
    extra: spec(resultBem('extra')),
  };
}

/* --- Watermark ---------------------------------------------------------- */

export interface WatermarkOptions {
  text: string;
  fontSize?: number;
  color?: string;
  rotate?: number;
  gap?: number;
}

/**
 * Draws a tiling watermark to a data URI. Canvas rather than repeated DOM nodes:
 * one background-image is far cheaper than hundreds of absolutely placed spans,
 * and it survives being printed.
 */
export function createWatermark(options: WatermarkOptions): string {
  const { text, fontSize = 14, color = 'rgba(0,0,0,0.08)', rotate = -22, gap = 32 } = options;
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return '';

  const ratio = window.devicePixelRatio || 1;
  context.font = `${fontSize}px sans-serif`;
  const width = Math.ceil(context.measureText(text).width) + gap * 2;
  const height = fontSize + gap * 2;

  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.scale(ratio, ratio);
  context.translate(width / 2, height / 2);
  context.rotate((rotate * Math.PI) / 180);
  context.font = `${fontSize}px sans-serif`;
  context.fillStyle = color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, 0, 0);

  return canvas.toDataURL();
}
