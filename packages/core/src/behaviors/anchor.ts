import { createBem, cx } from '../classnames.js';
import { spec, type ElementSpec } from './types.js';

const bem = createBem('anchor');

export interface AnchorItem {
  id: string;
  label: string;
  /** Nested headings render indented. */
  depth?: number;
}

export interface AnchorOptions {
  items: AnchorItem[];
  active?: string | null;
  /** Sticky-header offset used when scrolling a target into view. */
  offset?: number;
  onChange?: (id: string) => void;
  extraClass?: string;
}

export function useAnchor(options: AnchorOptions) {
  const { items, active, offset = 0, onChange, extraClass } = options;
  return {
    root: spec(cx(bem(), extraClass), { 'aria-label': 'page sections' }),
    /** Position of the moving indicator, as an index into `items`. */
    activeIndex: items.findIndex((item) => item.id === active),
    link: (item: AnchorItem): ElementSpec =>
      spec(
        cx(bem('link'), { [bem('link', 'active')]: item.id === active }),
        { href: `#${item.id}`, 'data-depth': item.depth ?? 0, 'aria-current': item.id === active || undefined },
        {
          click: (event: any) => {
            event.preventDefault?.();
            onChange?.(item.id);
            if (typeof document === 'undefined') return;
            const target = document.getElementById(item.id);
            if (!target) return;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
          },
        },
      ),
    indicator: spec(bem('indicator'), { 'aria-hidden': true }),
  };
}

/**
 * Which section is "current" given the scroll position: the last one whose top
 * has passed the offset line. Cheaper and steadier than IntersectionObserver
 * when sections differ wildly in height.
 */
export function activeSection(
  positions: Array<{ id: string; top: number }>,
  scrollY: number,
  offset = 80,
): string | null {
  let current: string | null = positions[0]?.id ?? null;
  for (const item of positions) {
    if (item.top - offset <= scrollY) current = item.id;
    else break;
  }
  return current;
}

const backTopBem = createBem('back-top');

export function useBackTop(options: { visible: boolean; label?: string } = { visible: false }) {
  return spec(
    cx(backTopBem(), { [backTopBem(null, 'visible')]: options.visible }),
    {
      type: 'button',
      'aria-label': options.label ?? 'back to top',
      tabindex: options.visible ? 0 : -1,
      'aria-hidden': !options.visible || undefined,
    },
    { click: () => typeof window !== 'undefined' && window.scrollTo({ top: 0, behavior: 'smooth' }) },
  );
}
