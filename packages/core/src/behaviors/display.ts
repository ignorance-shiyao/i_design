import { createBem, cx } from '../classnames.js';
import { spec, type ElementSpec, type Size, type Status } from './types.js';

/**
 * Presentational components still route their class names and ARIA through core,
 * for the same reason the interactive ones do: React and Vue must not be allowed
 * to drift. Each helper returns plain `ElementSpec`s.
 */

/* --- Alert -------------------------------------------------------------- */
const alertBem = createBem('alert');

export interface AlertOptions {
  status?: Exclude<Status, 'default'> | 'info';
  variant?: 'soft' | 'outline';
  closable?: boolean;
  onClose?: (event: any) => void;
  extraClass?: string;
}

export function useAlert(options: AlertOptions = {}) {
  const { status = 'info', variant = 'soft', closable, onClose, extraClass } = options;
  return {
    root: spec(cx(alertBem(), alertBem(null, `status-${status}`), alertBem(null, variant), extraClass), {
      role: status === 'danger' ? 'alert' : 'status',
    }),
    close: closable
      ? spec(alertBem('close'), { type: 'button', 'aria-label': 'close' }, { click: (e: any) => onClose?.(e) })
      : null,
  };
}

/* --- Progress ----------------------------------------------------------- */
const progressBem = createBem('progress');

export interface ProgressOptions {
  value: number;
  max?: number;
  shape?: 'line' | 'circle';
  status?: 'brand' | 'success' | 'warning' | 'danger';
  size?: Size;
  label?: string;
}

export function useProgress(options: ProgressOptions) {
  const { value, max = 100, shape = 'line', status = 'brand', size = 'm', label } = options;
  const clamped = Math.min(Math.max(value, 0), max);
  const percent = max === 0 ? 0 : (clamped / max) * 100;
  return {
    percent,
    root: spec(cx(progressBem(), progressBem(null, shape), progressBem(null, `status-${status}`), progressBem(null, `size-${size}`)), {
      role: 'progressbar',
      'aria-valuenow': clamped,
      'aria-valuemin': 0,
      'aria-valuemax': max,
      'aria-label': label,
    }),
    track: spec(progressBem('track'), {}),
    bar: spec(progressBem('bar'), {}),
  };
}

/* --- Avatar ------------------------------------------------------------- */
const avatarBem = createBem('avatar');

export interface AvatarOptions {
  size?: Size;
  shape?: 'circle' | 'square';
  src?: string;
  alt?: string;
  /** Falls back to initials when there is no image. */
  name?: string;
  extraClass?: string;
}

/** First grapheme of each of the first two words — works for CJK and latin names. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return [...parts[0]!].slice(0, /[一-龥]/.test(parts[0]!) ? 1 : 2).join('');
  return [...parts[0]!][0]! + [...parts[parts.length - 1]!][0]!;
}

export function useAvatar(options: AvatarOptions = {}) {
  const { size = 'm', shape = 'circle', src, alt, name, extraClass } = options;
  return {
    initials: name ? initialsOf(name) : '',
    root: spec(cx(avatarBem(), avatarBem(null, `size-${size}`), avatarBem(null, shape), extraClass), {
      role: src ? undefined : 'img',
      'aria-label': src ? undefined : (alt ?? name),
    }),
    image: src ? spec(avatarBem('image'), { src, alt: alt ?? name ?? '' }) : null,
  };
}

/* --- Badge -------------------------------------------------------------- */
const badgeBem = createBem('badge');

export interface BadgeOptions {
  count?: number;
  max?: number;
  dot?: boolean;
  status?: Status;
  /** Keep rendering the badge when the count is zero. */
  showZero?: boolean;
  extraClass?: string;
}

export function useBadge(options: BadgeOptions = {}) {
  const { count, max = 99, dot, status = 'danger', showZero, extraClass } = options;
  const visible = Boolean(dot) || (count !== undefined && (count > 0 || Boolean(showZero)));
  const text = count === undefined ? '' : count > max ? `${max}+` : String(count);
  return {
    visible,
    text,
    root: spec(cx(badgeBem('wrapper'), extraClass)),
    indicator: spec(cx(badgeBem(), badgeBem(null, `status-${status}`), { [badgeBem(null, 'dot')]: !!dot }), {
      'aria-label': dot ? undefined : text,
    }),
  };
}

/* --- Skeleton / Spinner / Empty / Divider / Card ------------------------- */
const skeletonBem = createBem('skeleton');

export function useSkeleton(options: { rows?: number; animated?: boolean; extraClass?: string } = {}) {
  const { rows = 3, animated = true, extraClass } = options;
  return {
    rows: Array.from({ length: rows }, (_, index) => index),
    root: spec(cx(skeletonBem(), { [skeletonBem(null, 'animated')]: animated }, extraClass), {
      'aria-busy': true,
      'aria-live': 'polite',
    }),
    row: (index: number, total: number): ElementSpec =>
      // The last row is short, the way real text wraps — it reads as content, not as bars.
      spec(cx(skeletonBem('row'), { [skeletonBem('row', 'last')]: index === total - 1 })),
  };
}

const spinnerBem = createBem('spinner');

export function useSpinner(options: { size?: Size; label?: string } = {}) {
  const { size = 'm', label } = options;
  return {
    root: spec(cx(spinnerBem(), spinnerBem(null, `size-${size}`)), { role: 'status', 'aria-label': label ?? 'loading' }),
    indicator: spec(spinnerBem('indicator'), { 'aria-hidden': true }),
  };
}

const cardBem = createBem('card');

export function useCard(options: { hoverable?: boolean; bordered?: boolean; padding?: 'none' | 'm' | 'l'; extraClass?: string } = {}) {
  const { hoverable, bordered = true, padding = 'm', extraClass } = options;
  return {
    root: spec(
      cx(cardBem(), cardBem(null, `padding-${padding}`), {
        [cardBem(null, 'hoverable')]: hoverable,
        [cardBem(null, 'bordered')]: bordered,
      }, extraClass),
    ),
    header: spec(cardBem('header')),
    body: spec(cardBem('body')),
    footer: spec(cardBem('footer')),
  };
}

const dividerBem = createBem('divider');

export function useDivider(options: { direction?: 'horizontal' | 'vertical'; dashed?: boolean; align?: 'start' | 'center' | 'end'; extraClass?: string } = {}) {
  const { direction = 'horizontal', dashed, align = 'center', extraClass } = options;
  return spec(
    cx(dividerBem(), dividerBem(null, direction), dividerBem(null, `align-${align}`), { [dividerBem(null, 'dashed')]: dashed }, extraClass),
    { role: 'separator', 'aria-orientation': direction },
  );
}

const emptyBem = createBem('empty');

export function useEmpty(options: { extraClass?: string } = {}) {
  return {
    root: spec(cx(emptyBem(), options.extraClass), { role: 'status' }),
    icon: spec(emptyBem('icon'), { 'aria-hidden': true }),
    description: spec(emptyBem('description')),
  };
}
