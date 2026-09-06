import { createBem, cx } from '../classnames.js';
import { spec, type ElementSpec } from './types.js';

const bem = createBem('carousel');

export interface CarouselOptions {
  count: number;
  index: number;
  loop?: boolean;
  /** ms between slides; 0 disables autoplay. */
  autoplay?: number;
  orientation?: 'horizontal' | 'vertical';
  /** How far a drag must go (in px) before it counts as a slide change. */
  dragThreshold?: number;
  /** Accessible label for the whole carousel. */
  label?: string;
  onChange?: (index: number) => void;
  extraClass?: string;
}

export interface CarouselBehavior {
  index: number;
  root: ElementSpec;
  viewport: ElementSpec;
  track: ElementSpec;
  /** Applied to the track; `dragOffset` is added live while dragging. */
  trackStyle: (dragOffset?: number) => Record<string, string>;
  slide: (index: number) => ElementSpec;
  prev: ElementSpec;
  next: ElementSpec;
  indicator: (index: number) => ElementSpec;
  goTo: (index: number) => void;
  /** Feed pointer deltas in; returns the index a release would land on. */
  resolveDrag: (delta: number, viewportSize: number) => number;
  canPrev: boolean;
  canNext: boolean;
}

export function useCarousel(options: CarouselOptions): CarouselBehavior {
  const {
    count, index, loop = true, autoplay = 0, orientation = 'horizontal',
    dragThreshold = 40, label = 'carousel', onChange, extraClass,
  } = options;

  const clamp = (next: number): number => {
    if (count === 0) return 0;
    if (loop) return (next + count) % count;
    return Math.min(Math.max(next, 0), count - 1);
  };

  const goTo = (next: number): void => {
    const target = clamp(next);
    if (target !== index) onChange?.(target);
  };

  const canPrev = loop || index > 0;
  const canNext = loop || index < count - 1;

  const navButton = (delta: number, labelText: string, enabled: boolean): ElementSpec =>
    spec(
      cx(bem('nav'), bem('nav', delta < 0 ? 'prev' : 'next'), { [bem('nav', 'disabled')]: !enabled }),
      { type: 'button', 'aria-label': labelText, disabled: !enabled || undefined },
      { click: () => enabled && goTo(index + delta) },
    );

  return {
    index,
    canPrev,
    canNext,
    goTo,
    root: spec(
      cx(bem(), bem(null, orientation), extraClass),
      {
        // The pattern screen readers expect: a labelled region announced as a carousel.
        role: 'region',
        'aria-roledescription': 'carousel',
        'aria-label': label,
        'data-autoplay': autoplay > 0 || undefined,
        tabindex: 0,
      },
      {
        keydown: (event: any) => {
          const key = String(event?.key ?? '');
          const back = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
          const forward = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
          if (key === back) { event.preventDefault?.(); goTo(index - 1); }
          else if (key === forward) { event.preventDefault?.(); goTo(index + 1); }
          else if (key === 'Home') { event.preventDefault?.(); goTo(0); }
          else if (key === 'End') { event.preventDefault?.(); goTo(count - 1); }
        },
      },
    ),
    viewport: spec(bem('viewport'), { 'aria-live': autoplay > 0 ? 'off' : 'polite' }),
    track: spec(bem('track')),
    trackStyle: (dragOffset = 0) => {
      const axis = orientation === 'horizontal' ? 'X' : 'Y';
      return {
        transform: `translate${axis}(calc(${-index * 100}% + ${dragOffset}px))`,
        transitionDuration: dragOffset === 0 ? '' : '0ms',
      };
    },
    slide: (slideIndex) =>
      spec(
        cx(bem('slide'), { [bem('slide', 'active')]: slideIndex === index }),
        {
          role: 'group',
          'aria-roledescription': 'slide',
          'aria-label': `${slideIndex + 1} / ${count}`,
          'aria-hidden': slideIndex !== index || undefined,
          // Keep off-screen slides out of the tab order entirely. Emitted as an
          // empty string, not `true`: React 18 drops unknown boolean attributes,
          // so a boolean here would silently vanish in React and not in Vue.
          inert: slideIndex !== index ? '' : undefined,
        },
      ),
    prev: navButton(-1, 'previous slide', canPrev),
    next: navButton(1, 'next slide', canNext),
    indicator: (dotIndex) =>
      spec(
        cx(bem('dot'), { [bem('dot', 'active')]: dotIndex === index }),
        {
          type: 'button',
          'aria-label': `go to slide ${dotIndex + 1}`,
          'aria-current': dotIndex === index || undefined,
        },
        { click: () => goTo(dotIndex) },
      ),
    resolveDrag: (delta, viewportSize) => {
      // Either a decisive flick or a drag past half the viewport moves a slide.
      const ratio = viewportSize > 0 ? Math.abs(delta) / viewportSize : 0;
      if (Math.abs(delta) < dragThreshold && ratio < 0.5) return index;
      return clamp(index + (delta < 0 ? 1 : -1));
    },
  };
}
