import { createBem, cx } from '../classnames.js';
import { spec, type ElementSpec, type Size } from './types.js';

const bem = createBem('table');

export type SortOrder = 'asc' | 'desc' | null;

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  title: string;
  /** Reads the cell value; defaults to `row[key]`. */
  accessor?: (row: T) => unknown;
  width?: number | string;
  align?: 'start' | 'center' | 'end';
  sortable?: boolean;
  /** Custom comparator; implies `sortable`. */
  sorter?: (a: T, b: T) => number;
  /** Sticky column. Needs a numeric `width` so offsets can be computed. */
  fixed?: 'start' | 'end';
  ellipsis?: boolean;
}

export interface TableSort {
  key: string;
  order: SortOrder;
}

export interface TableOptions<T = Record<string, unknown>> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string;
  sort?: TableSort | null;
  /** Skip local sorting — the caller sorts (server-side) and just reflects the state. */
  manualSort?: boolean;
  selection?: 'none' | 'single' | 'multiple';
  selectedKeys?: string[];
  size?: Size;
  bordered?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  stickyHeader?: boolean;
  loading?: boolean;
  onSortChange?: (sort: TableSort) => void;
  onSelectionChange?: (keys: string[]) => void;
  onRowClick?: (row: T, index: number) => void;
  extraClass?: string;
}

export interface TableBehavior<T = Record<string, unknown>> {
  /** Rows in display order — locally sorted unless `manualSort` is set. */
  rows: T[];
  wrapper: ElementSpec;
  table: ElementSpec;
  headerCell: (column: TableColumn<T>, index: number) => ElementSpec;
  bodyCell: (column: TableColumn<T>, index: number) => ElementSpec;
  /** Width and sticky offsets, as a style object both frameworks accept. */
  cellStyle: (column: TableColumn<T>, index: number) => Record<string, string>;
  row: (row: T, index: number) => ElementSpec;
  cellValue: (column: TableColumn<T>, row: T) => unknown;
  /** Header select-all state; `null` when selection is off or single. */
  selectAll: { checked: boolean; indeterminate: boolean; toggle: () => void } | null;
  rowSelected: (row: T, index: number) => boolean;
  toggleRow: (row: T, index: number) => void;
  isEmpty: boolean;
}

function defaultCompare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

/**
 * Nulls sort last in BOTH directions, so they must be decided before the
 * direction multiplier is applied — otherwise `desc` floats them to the top.
 */
function compareWithNullsLast<T>(compare: (a: T, b: T) => number, direction: number) {
  return (a: T, b: T, aValue: unknown, bValue: unknown): number => {
    const aEmpty = aValue == null;
    const bEmpty = bValue == null;
    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1;
    if (bEmpty) return -1;
    return compare(a, b) * direction;
  };
}

export function nextSortOrder(current: SortOrder): SortOrder {
  return current === null ? 'asc' : current === 'asc' ? 'desc' : null;
}

/**
 * Table's whole model — sorting, selection, sticky offsets and ARIA — computed
 * in core so the React and Vue tables cannot diverge on any of it. The adapters
 * render `<table>` markup and nothing else.
 */
export function useTable<T = Record<string, unknown>>(options: TableOptions<T>): TableBehavior<T> {
  const {
    columns, data, rowKey, sort = null, manualSort, selection = 'none', selectedKeys = [],
    size = 'm', bordered, striped, hoverable = true, stickyHeader, loading,
    onSortChange, onSelectionChange, onRowClick, extraClass,
  } = options;

  const cellValue = (column: TableColumn<T>, row: T): unknown =>
    column.accessor ? column.accessor(row) : (row as Record<string, unknown>)[column.key];

  const rows = (() => {
    if (manualSort || !sort || !sort.order) return data;
    const column = columns.find((item) => item.key === sort.key);
    if (!column) return data;
    const direction = sort.order === 'asc' ? 1 : -1;
    const compare = column.sorter ?? ((a: T, b: T) => defaultCompare(cellValue(column, a), cellValue(column, b)));
    const ordered = compareWithNullsLast(compare, direction);
    // Copy first: sorting the caller's array in place is a classic surprise.
    return [...data].sort((a, b) => ordered(a, b, cellValue(column, a), cellValue(column, b)));
  })();

  // Sticky offsets: sum the widths of the fixed columns before this one.
  const stickyOffset = (column: TableColumn<T>, index: number): string | undefined => {
    if (!column.fixed || typeof column.width !== 'number') return undefined;
    const siblings = columns.filter((item) => item.fixed === column.fixed);
    const position = siblings.indexOf(column);
    const before =
      column.fixed === 'start'
        ? siblings.slice(0, position)
        : siblings.slice(position + 1);
    const offset = before.reduce((sum, item) => sum + (typeof item.width === 'number' ? item.width : 0), 0);
    void index;
    return `${offset}px`;
  };

  const columnAttrs = (column: TableColumn<T>, index: number): Record<string, string | undefined> => {
    if (stickyOffset(column, index) === undefined) return {};
    return { 'data-fixed': column.fixed };
  };

  /**
   * Styles travel separately from attrs: a raw style string is the one thing
   * that does not survive the trip to React (see `spec()`).
   */
  const cellStyle = (column: TableColumn<T>, index: number): Record<string, string> => {
    const style: Record<string, string> = {};
    if (column.width !== undefined) style.width = typeof column.width === 'number' ? `${column.width}px` : column.width;
    const offset = stickyOffset(column, index);
    if (offset !== undefined) {
      if (column.fixed === 'start') style.insetInlineStart = offset;
      else style.insetInlineEnd = offset;
    }
    return style;
  };

  const selectableKeys = rows.map((row, index) => rowKey(row, index));
  const selectedSet = new Set(selectedKeys);
  const selectedCount = selectableKeys.filter((key) => selectedSet.has(key)).length;

  return {
    rows,
    cellValue,
    cellStyle,
    isEmpty: rows.length === 0 && !loading,
    wrapper: spec(
      cx(bem('wrapper'), { [bem('wrapper', 'sticky')]: stickyHeader, [bem('wrapper', 'loading')]: loading }, extraClass),
    ),
    table: spec(
      cx(bem(), bem(null, `size-${size}`), {
        [bem(null, 'bordered')]: bordered,
        [bem(null, 'striped')]: striped,
        [bem(null, 'hoverable')]: hoverable,
      }),
      { role: 'table', 'aria-busy': loading || undefined },
    ),
    headerCell: (column, index) => {
      const sortable = Boolean(column.sortable || column.sorter);
      const order = sort?.key === column.key ? sort.order : null;
      return spec(
        cx(bem('cell'), bem('cell', 'header'), bem('cell', `align-${column.align ?? 'start'}`), {
          [bem('cell', 'sortable')]: sortable,
          [bem('cell', 'sorted')]: Boolean(order),
          [bem('cell', 'fixed')]: Boolean(column.fixed),
          [bem('cell', 'ellipsis')]: column.ellipsis,
        }),
        {
          scope: 'col',
          // `aria-sort` is what makes a sortable table readable in a screen reader.
          'aria-sort': !sortable ? undefined : order === 'asc' ? 'ascending' : order === 'desc' ? 'descending' : 'none',
          tabindex: sortable ? 0 : undefined,
          ...columnAttrs(column, index),
        },
        sortable
          ? {
              click: () => onSortChange?.({ key: column.key, order: nextSortOrder(order) }),
              keydown: (event: any) => {
                if (event?.key === 'Enter' || event?.key === ' ') {
                  event.preventDefault?.();
                  onSortChange?.({ key: column.key, order: nextSortOrder(order) });
                }
              },
            }
          : {},
      );
    },
    bodyCell: (column, index) =>
      spec(
        cx(bem('cell'), bem('cell', `align-${column.align ?? 'start'}`), {
          [bem('cell', 'fixed')]: Boolean(column.fixed),
          [bem('cell', 'ellipsis')]: column.ellipsis,
        }),
        columnAttrs(column, index),
      ),
    row: (row, index) =>
      spec(
        cx(bem('row'), { [bem('row', 'selected')]: selectedSet.has(rowKey(row, index)) }),
        { 'aria-selected': selection === 'none' ? undefined : selectedSet.has(rowKey(row, index)) },
        { click: () => onRowClick?.(row, index) },
      ),
    selectAll:
      selection === 'multiple'
        ? {
            checked: selectedCount > 0 && selectedCount === selectableKeys.length,
            indeterminate: selectedCount > 0 && selectedCount < selectableKeys.length,
            toggle: () =>
              onSelectionChange?.(selectedCount === selectableKeys.length ? [] : selectableKeys),
          }
        : null,
    rowSelected: (row, index) => selectedSet.has(rowKey(row, index)),
    toggleRow: (row, index) => {
      if (selection === 'none') return;
      const key = rowKey(row, index);
      if (selection === 'single') {
        onSelectionChange?.(selectedSet.has(key) ? [] : [key]);
        return;
      }
      onSelectionChange?.(
        selectedSet.has(key) ? selectedKeys.filter((item) => item !== key) : [...selectedKeys, key],
      );
    },
  };
}
