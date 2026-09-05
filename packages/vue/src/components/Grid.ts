import { useCol, useRow, GRID_COLUMNS } from '@i-design/core';
import { defineComponent, h, type PropType } from 'vue';
import { toProps } from '../utils.js';

export const Row = defineComponent({
  name: 'IRow',
  props: {
    gutter: { type: [Number, Array] as PropType<number | [number, number]>, default: 0 },
    align: { type: String as PropType<'start' | 'center' | 'end' | 'stretch'>, default: 'stretch' },
    justify: { type: String as PropType<'start' | 'center' | 'end' | 'between' | 'around'>, default: 'start' },
    wrap: { type: Boolean, default: true },
  },
  setup(props, { slots }) {
    return () => {
      const { root, style } = useRow(props);
      return h('div', { ...toProps(root), style }, slots.default?.());
    };
  },
});

export const Col = defineComponent({
  name: 'ICol',
  props: {
    span: { type: Number, default: GRID_COLUMNS },
    offset: { type: Number, default: 0 },
    sm: Number,
    md: Number,
    lg: Number,
  },
  setup(props, { slots }) {
    return () => {
      const { root, style } = useCol(props);
      return h('div', { ...toProps(root), style }, slots.default?.());
    };
  },
});
