import { useTable, type TableColumn, type TableOptions, type TableSort } from '@i-design/core';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { toProps } from '../utils.js';
import { Checkbox } from './Checkbox.js';
import { Empty } from './Display.js';
import { Spinner } from './Display.js';
import { Icon } from './Icon.js';

export interface TableProps<T = Record<string, unknown>>
  extends Omit<TableOptions<T>, 'sort' | 'selectedKeys' | 'onSortChange' | 'onSelectionChange' | 'extraClass'> {
  sort?: TableSort | null;
  defaultSort?: TableSort | null;
  selectedKeys?: string[];
  defaultSelectedKeys?: string[];
  className?: string;
  /** Per-column cell renderer, keyed by column key. */
  renderCell?: (column: TableColumn<T>, row: T, index: number) => ReactNode;
  empty?: ReactNode;
  onSortChange?: (sort: TableSort) => void;
  onSelectionChange?: (keys: string[]) => void;
}

export function Table<T = Record<string, unknown>>(props: TableProps<T>) {
  const {
    sort: controlledSort, defaultSort = null, selectedKeys: controlledKeys, defaultSelectedKeys = [],
    className, renderCell, empty, onSortChange, onSelectionChange, columns, selection = 'none', ...rest
  } = props;

  const [internalSort, setInternalSort] = useState<TableSort | null>(defaultSort);
  const [internalKeys, setInternalKeys] = useState<string[]>(defaultSelectedKeys);
  const sort = controlledSort !== undefined ? controlledSort : internalSort;
  const selectedKeys = controlledKeys ?? internalKeys;

  const behavior = useTable<T>({
    ...rest, columns, selection, sort, selectedKeys,
    onSortChange: (next) => {
      if (controlledSort === undefined) setInternalSort(next);
      onSortChange?.(next);
    },
    onSelectionChange: (keys) => {
      if (controlledKeys === undefined) setInternalKeys(keys);
      onSelectionChange?.(keys);
    },
    extraClass: className,
  });

  const columnCount = columns.length + (selection === 'none' ? 0 : 1);

  return (
    <div {...toProps(behavior.wrapper)}>
      <table {...toProps(behavior.table)}>
        <thead>
          <tr>
            {selection !== 'none' && (
              <th className="i-table__cell i-table__cell--header i-table__selection" scope="col">
                {behavior.selectAll && (
                  <Checkbox
                    checked={behavior.selectAll.checked}
                    indeterminate={behavior.selectAll.indeterminate}
                    onChange={() => behavior.selectAll!.toggle()}
                  />
                )}
              </th>
            )}
            {columns.map((column, index) => (
              <th
                key={column.key}
                {...toProps(behavior.headerCell(column, index))}
                style={behavior.cellStyle(column, index) as CSSProperties}
              >
                {column.title}
                {(column.sortable || column.sorter) && (
                  <span
                    className="i-table__sorter"
                    aria-hidden="true"
                    data-order={sort?.key === column.key ? sort.order ?? '' : ''}
                  >
                    <Icon name="caret-up" size={9} />
                    <Icon name="caret-down" size={9} />
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {behavior.isEmpty && (
            <tr>
              <td className="i-table__cell i-table__empty" colSpan={columnCount}>
                {empty ?? <Empty />}
              </td>
            </tr>
          )}
          {behavior.rows.map((row, index) => (
            <tr key={props.rowKey(row, index)} {...toProps(behavior.row(row, index))}>
              {selection !== 'none' && (
                <td className="i-table__cell i-table__selection">
                  <Checkbox
                    checked={behavior.rowSelected(row, index)}
                    onChange={() => behavior.toggleRow(row, index)}
                  />
                </td>
              )}
              {columns.map((column, columnIndex) => (
                <td
                  key={column.key}
                  {...toProps(behavior.bodyCell(column, columnIndex))}
                  style={behavior.cellStyle(column, columnIndex) as CSSProperties}
                >
                  {renderCell?.(column, row, index) ?? String(behavior.cellValue(column, row) ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rest.loading && (
        <div className="i-table__loading">
          <Spinner />
        </div>
      )}
    </div>
  );
}
