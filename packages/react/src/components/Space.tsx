import { createBem, cx } from '@i-design/core';
import type { CSSProperties, ReactNode } from 'react';

const bem = createBem('space');

export interface SpaceProps {
  direction?: 'horizontal' | 'vertical';
  gap?: 's' | 'm' | 'l';
  wrap?: boolean;
  align?: 'start' | 'center' | 'end';
  justify?: 'between';
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Space(props: SpaceProps) {
  const { direction = 'horizontal', gap = 'm', wrap, align, justify, className, style, children } = props;
  return (
    <div
      className={cx(bem(), bem(null, direction), bem(null, `gap-${gap}`), {
        [bem(null, 'wrap')]: wrap,
        [bem(null, `align-${align}`)]: !!align,
        [bem(null, `justify-${justify}`)]: !!justify,
      }, className)}
      style={style}
    >
      {children}
    </div>
  );
}
