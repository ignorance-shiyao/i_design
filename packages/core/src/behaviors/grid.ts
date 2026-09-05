import { createBem, cx } from '../classnames.js';
import { spec, type ElementSpec } from './types.js';

const rowBem = createBem('row');
const colBem = createBem('col');

/** 24-column grid, the convention Ant Design / Element / TDesign users already know. */
export const GRID_COLUMNS = 24;

export interface RowOptions {
  gutter?: number | [number, number];
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
  extraClass?: string;
}

export function useRow(options: RowOptions = {}): { root: ElementSpec; style: Record<string, string> } {
  const { gutter = 0, align = 'stretch', justify = 'start', wrap = true, extraClass } = options;
  const [x, y] = Array.isArray(gutter) ? gutter : [gutter, 0];
  return {
    root: spec(
      cx(rowBem(), rowBem(null, `align-${align}`), rowBem(null, `justify-${justify}`), { [rowBem(null, 'nowrap')]: !wrap }, extraClass),
    ),
    style: { '--i-row-gutter-x': `${x}px`, '--i-row-gutter-y': `${y}px` },
  };
}

export interface ColOptions {
  span?: number;
  offset?: number;
  /** Responsive spans; each maps to a min-width breakpoint in the stylesheet. */
  sm?: number;
  md?: number;
  lg?: number;
  extraClass?: string;
}

export function useCol(options: ColOptions = {}): { root: ElementSpec; style: Record<string, string> } {
  const { span = GRID_COLUMNS, offset = 0, sm, md, lg, extraClass } = options;
  const style: Record<string, string> = { '--i-col-span': String(span), '--i-col-offset': String(offset) };
  if (sm !== undefined) style['--i-col-span-sm'] = String(sm);
  if (md !== undefined) style['--i-col-span-md'] = String(md);
  if (lg !== undefined) style['--i-col-span-lg'] = String(lg);

  return {
    root: spec(
      cx(colBem(), {
        [colBem(null, 'sm')]: sm !== undefined,
        [colBem(null, 'md')]: md !== undefined,
        [colBem(null, 'lg')]: lg !== undefined,
      }, extraClass),
    ),
    style,
  };
}
