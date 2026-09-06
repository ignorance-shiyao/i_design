import { useCarousel, type CarouselOptions } from '@i-design/core';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { toProps, useControlled } from '../utils.js';

export interface CarouselProps extends Omit<CarouselOptions, 'count' | 'index' | 'onChange' | 'extraClass'> {
  index?: number;
  defaultIndex?: number;
  showArrows?: boolean;
  showDots?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode[];
  onChange?: (index: number) => void;
}

export function Carousel(props: CarouselProps) {
  const {
    index: controlled, defaultIndex = 0, showArrows = true, showDots = true,
    className, style, children, onChange, autoplay = 0, ...rest
  } = props;

  const count = children.length;
  const [index, setIndex] = useControlled(controlled, defaultIndex);
  const [drag, setDrag] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  const start = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);

  const behavior = useCarousel({
    ...rest, autoplay, count, index,
    onChange: (next) => {
      setIndex(next);
      onChange?.(next);
    },
    extraClass: className,
  });

  // Autoplay pauses on hover and focus — an unpausable carousel is an a11y bug.
  useEffect(() => {
    if (autoplay <= 0 || paused || count < 2) return;
    const timer = setInterval(() => behavior.goTo(index + 1), autoplay);
    return () => clearInterval(timer);
  }, [autoplay, paused, index, count, behavior]);

  const onPointerDown = (event: React.PointerEvent): void => {
    start.current = event.clientX;
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent): void => {
    if (start.current === null) return;
    setDrag(event.clientX - start.current);
  };
  const onPointerUp = (): void => {
    if (start.current === null) return;
    const width = viewport.current?.clientWidth ?? 0;
    behavior.goTo(behavior.resolveDrag(drag, width));
    start.current = null;
    setDrag(0);
  };

  return (
    <div
      {...toProps(behavior.root)}
      style={style}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        ref={viewport}
        {...toProps(behavior.viewport)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div {...toProps(behavior.track)} style={behavior.trackStyle(drag) as CSSProperties}>
          {children.map((child, slideIndex) => (
            <div key={slideIndex} {...toProps(behavior.slide(slideIndex))}>
              {child}
            </div>
          ))}
        </div>
      </div>

      {showArrows && count > 1 && (
        <>
          <button {...toProps(behavior.prev)}>‹</button>
          <button {...toProps(behavior.next)}>›</button>
        </>
      )}
      {showDots && count > 1 && (
        <div className="i-carousel__dots">
          {children.map((_, dotIndex) => (
            <button key={dotIndex} {...toProps(behavior.indicator(dotIndex))} />
          ))}
        </div>
      )}
    </div>
  );
}
