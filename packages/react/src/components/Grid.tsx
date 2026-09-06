import { useCol, useRow, type ColOptions, type RowOptions } from '@i-design/core';
import type { CSSProperties, ReactNode } from 'react';
import { toProps } from '../utils.js';

export interface RowProps extends Omit<RowOptions, 'extraClass'> {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Row({ className, style, children, ...rest }: RowProps) {
  const { root, style: gutterStyle } = useRow({ ...rest, extraClass: className });
  return (
    <div {...toProps(root)} style={{ ...(gutterStyle as CSSProperties), ...style }}>
      {children}
    </div>
  );
}

export interface ColProps extends Omit<ColOptions, 'extraClass'> {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Col({ className, style, children, ...rest }: ColProps) {
  const { root, style: spanStyle } = useCol({ ...rest, extraClass: className });
  return (
    <div {...toProps(root)} style={{ ...(spanStyle as CSSProperties), ...style }}>
      {children}
    </div>
  );
}
