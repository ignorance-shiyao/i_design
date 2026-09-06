import { useTable, type Size, type TableColumn, type TableSort } from '@i-design/core';
import { defineComponent, h, ref, type PropType, type VNodeChild } from 'vue';
import { toProps } from '../utils.js';
import { Checkbox } from './Toggle.js';
import { Empty, Spinner } from './Display.js';
import { Icon } from './Icon.js';

type Row = Record<string, unknown>;

export const Table = defineComponent({
  name: 'ITable',
  props: {
    columns: { type: Array as PropType<TableColumn<Row>[]>, required: true },
    data: { type: Array as PropType<Row[]>, required: true },
    rowKey: { type: Function as PropType<(row: Row, index: number) => string>, required: true },
    sort: { type: Object as PropType<TableSort | null>, default: undefined },
    defaultSort: { type: Object as PropType<TableSort | null>, default: null },
    manualSort: Boolean,
    selection: { type: String as PropType<'none' | 'single' | 'multiple'>, default: 'none' },
    selectedKeys: { type: Array as PropType<string[] | undefined>, default: undefined },
    defaultSelectedKeys: { type: Array as PropType<string[]>, default: () => [] },
    size: { type: String as PropType<Size>, default: 'm' },
    bordered: Boolean,
    striped: Boolean,
    hoverable: { type: Boolean, default: true },
    stickyHeader: Boolean,
    loading: Boolean,
  },
  emits: ['update:sort', 'update:selectedKeys', 'sortChange', 'selectionChange', 'rowClick'],
  setup(props, { slots, emit }) {
    const internalSort = ref<TableSort | null>(props.defaultSort);
    const internalKeys = ref<string[]>(props.defaultSelectedKeys);

    return () => {
      const sort = props.sort !== undefined ? props.sort : internalSort.value;
      const selectedKeys = props.selectedKeys ?? internalKeys.value;

      const behavior = useTable<Row>({
        columns: props.columns,
        data: props.data,
        rowKey: props.rowKey,
        manualSort: props.manualSort,
        selection: props.selection,
        size: props.size,
        bordered: props.bordered,
        striped: props.striped,
        hoverable: props.hoverable,
        stickyHeader: props.stickyHeader,
        loading: props.loading,
        sort,
        selectedKeys,
        onSortChange: (next: TableSort) => {
          if (props.sort === undefined) internalSort.value = next;
          emit('update:sort', next);
          emit('sortChange', next);
        },
        onSelectionChange: (keys: string[]) => {
          if (props.selectedKeys === undefined) internalKeys.value = keys;
          emit('update:selectedKeys', keys);
          emit('selectionChange', keys);
        },
        onRowClick: (row: Row, index: number) => emit('rowClick', row, index),
      });

      const columnCount = props.columns.length + (props.selection === 'none' ? 0 : 1);

      const sorterIcon = (column: TableColumn<Row>): VNodeChild =>
        column.sortable || column.sorter
          ? h(
              'span',
              {
                class: 'i-table__sorter',
                'aria-hidden': 'true',
                'data-order': sort?.key === column.key ? sort.order ?? '' : '',
              },
              [h(Icon, { name: 'caret-up', size: 9 }), h(Icon, { name: 'caret-down', size: 9 })],
            )
          : null;

      return h('div', toProps(behavior.wrapper), [
        h('table', toProps(behavior.table), [
          h('thead', [
            h('tr', [
              props.selection !== 'none'
                ? h('th', { class: 'i-table__cell i-table__cell--header i-table__selection', scope: 'col' }, [
                    behavior.selectAll
                      ? h(Checkbox, {
                          modelValue: behavior.selectAll.checked,
                          indeterminate: behavior.selectAll.indeterminate,
                          'onUpdate:modelValue': () => behavior.selectAll!.toggle(),
                        })
                      : null,
                  ])
                : null,
              ...props.columns.map((column, index) =>
                h('th', { ...toProps(behavior.headerCell(column, index)), style: behavior.cellStyle(column, index) }, [
                  column.title,
                  sorterIcon(column),
                ]),
              ),
            ]),
          ]),
          h('tbody', [
            behavior.isEmpty
              ? h('tr', [
                  h('td', { class: 'i-table__cell i-table__empty', colspan: columnCount }, slots.empty?.() ?? h(Empty)),
                ])
              : null,
            ...behavior.rows.map((row, index) =>
              h('tr', toProps(behavior.row(row, index)), [
                props.selection !== 'none'
                  ? h('td', { class: 'i-table__cell i-table__selection' }, [
                      h(Checkbox, {
                        modelValue: behavior.rowSelected(row, index),
                        'onUpdate:modelValue': () => behavior.toggleRow(row, index),
                      }),
                    ])
                  : null,
                ...props.columns.map((column, columnIndex) =>
                  h(
                    'td',
                    { ...toProps(behavior.bodyCell(column, columnIndex)), style: behavior.cellStyle(column, columnIndex) },
                    slots[`cell-${column.key}`]?.({ row, index }) ??
                      slots.cell?.({ column, row, index }) ??
                      String(behavior.cellValue(column, row) ?? ''),
                  ),
                ),
              ]),
            ),
          ]),
        ]),
        props.loading ? h('div', { class: 'i-table__loading' }, [h(Spinner)]) : null,
      ]);
    };
  },
});
