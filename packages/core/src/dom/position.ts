export type Placement =
  | 'top' | 'top-start' | 'top-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'left-start' | 'left-end'
  | 'right' | 'right-start' | 'right-end';

export interface PositionOptions {
  placement?: Placement;
  /** Gap between the anchor and the floating element, in px. */
  offset?: number;
  /** Flip to the opposite side when the preferred side does not fit. */
  flip?: boolean;
  boundary?: { width: number; height: number };
}

export interface PositionResult {
  x: number;
  y: number;
  placement: Placement;
}

interface Rect { top: number; left: number; width: number; height: number }

const side = (p: Placement) => p.split('-')[0] as 'top' | 'bottom' | 'left' | 'right';
const align = (p: Placement) => (p.split('-')[1] ?? 'center') as 'start' | 'end' | 'center';
const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const;

function place(anchor: Rect, floating: Rect, placement: Placement, offset: number): PositionResult {
  const s = side(placement);
  const a = align(placement);
  let x = 0;
  let y = 0;

  if (s === 'top' || s === 'bottom') {
    y = s === 'top' ? anchor.top - floating.height - offset : anchor.top + anchor.height + offset;
    x =
      a === 'start' ? anchor.left
      : a === 'end' ? anchor.left + anchor.width - floating.width
      : anchor.left + (anchor.width - floating.width) / 2;
  } else {
    x = s === 'left' ? anchor.left - floating.width - offset : anchor.left + anchor.width + offset;
    y =
      a === 'start' ? anchor.top
      : a === 'end' ? anchor.top + anchor.height - floating.height
      : anchor.top + (anchor.height - floating.height) / 2;
  }
  return { x, y, placement };
}

function fits(pos: PositionResult, floating: Rect, boundary: { width: number; height: number }) {
  return (
    pos.x >= 0 &&
    pos.y >= 0 &&
    pos.x + floating.width <= boundary.width &&
    pos.y + floating.height <= boundary.height
  );
}

/**
 * Tiny positioning engine (viewport-relative, flip + clamp). Popup, Tooltip and
 * Select all share it, so placement behaviour is identical in React and Vue.
 * Kept intentionally small — swap in floating-ui by replacing this one file.
 */
export function computePosition(
  anchor: Rect,
  floating: Rect,
  options: PositionOptions = {},
): PositionResult {
  const { placement = 'bottom', offset = 8, flip = true } = options;
  const boundary =
    options.boundary ??
    (typeof window === 'undefined'
      ? { width: 1024, height: 768 }
      : { width: window.innerWidth, height: window.innerHeight });

  let result = place(anchor, floating, placement, offset);
  if (flip && !fits(result, floating, boundary)) {
    const flipped = `${opposite[side(placement)]}${align(placement) === 'center' ? '' : `-${align(placement)}`}` as Placement;
    const candidate = place(anchor, floating, flipped, offset);
    if (fits(candidate, floating, boundary)) result = candidate;
  }

  // Clamp so the floating element never leaves the boundary entirely.
  return {
    ...result,
    x: Math.min(Math.max(4, result.x), Math.max(4, boundary.width - floating.width - 4)),
    y: Math.min(Math.max(4, result.y), Math.max(4, boundary.height - floating.height - 4)),
  };
}

export function rectOf(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}
