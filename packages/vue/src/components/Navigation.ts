import {
  createId, useBreadcrumb, useCollapse, usePagination, useSteps, useTabs,
  type BreadcrumbItem, type CollapseItem, type Orientation, type Size, type StepItem, type TabItem,
} from '@i-design/core';
import { defineComponent, h, type PropType } from 'vue';
import { toProps, useControlled } from '../utils.js';
import { Icon } from './Icon.js';

export const Tabs = defineComponent({
  name: 'ITabs',
  props: {
    items: { type: Array as PropType<TabItem[]>, required: true },
    modelValue: { type: String as PropType<string | undefined>, default: undefined },
    defaultValue: String,
    orientation: { type: String as PropType<Orientation>, default: 'horizontal' },
    variant: { type: String as PropType<'line' | 'card' | 'segment'>, default: 'line' },
    size: { type: String as PropType<Size>, default: 'm' },
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { slots, emit }) {
    const id = createId('i-tabs');
    const state = useControlled(() => props.modelValue, props.defaultValue ?? props.items[0]?.value ?? '');

    return () => {
      const behavior = useTabs({
        items: props.items,
        value: state.value.value,
        orientation: props.orientation,
        variant: props.variant,
        size: props.size,
        id,
        onChange: (next: string) => {
          state.set(next);
          emit('update:modelValue', next);
          emit('change', next);
        },
      });
      const active = props.items.find((item) => item.value === state.value.value);
      // A tab strip used purely as a control (a toolbar switch) has no panel at
      // all; rendering an empty one would add a stray tab stop.
      const panel = active ? (slots[active.value]?.() ?? slots.default?.(active)) : null;

      return h('div', toProps(behavior.root), [
        h(
          'div',
          toProps(behavior.list),
          props.items.map((item, index) => h('button', toProps(behavior.tab(item, index)), item.label ?? item.value)),
        ),
        active && panel != null ? h('div', toProps(behavior.panel(active.value)), panel) : null,
      ]);
    };
  },
});

export const Collapse = defineComponent({
  name: 'ICollapse',
  props: {
    items: { type: Array as PropType<CollapseItem[]>, required: true },
    modelValue: { type: Array as PropType<string[] | undefined>, default: undefined },
    defaultValue: { type: Array as PropType<string[]>, default: () => [] },
    accordion: Boolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { slots, emit }) {
    const id = createId('i-collapse');
    const state = useControlled(() => props.modelValue, props.defaultValue);

    return () => {
      const behavior = useCollapse({
        items: props.items,
        value: state.value.value,
        accordion: props.accordion,
        id,
        onChange: (next: string[]) => {
          state.set(next);
          emit('update:modelValue', next);
          emit('change', next);
        },
      });

      return h(
        'div',
        toProps(behavior.root),
        props.items.map((item) =>
          h('div', toProps(behavior.item(item)), [
            h('button', toProps(behavior.trigger(item)), [
              h('span', item.header ?? item.value),
              h('span', toProps(behavior.arrow), [h(Icon, { name: 'chevron-right', size: 13 })]),
            ]),
            h('div', toProps(behavior.panel(item)), slots[item.value]?.() ?? slots.default?.(item)),
          ]),
        ),
      );
    };
  },
});

export const Pagination = defineComponent({
  name: 'IPagination',
  props: {
    modelValue: { type: Number as PropType<number | undefined>, default: undefined },
    defaultCurrent: { type: Number, default: 1 },
    total: { type: Number, required: true },
    pageSize: { type: Number, default: 10 },
    siblings: { type: Number, default: 1 },
    size: { type: String as PropType<Size>, default: 'm' },
    disabled: Boolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const state = useControlled(() => props.modelValue, props.defaultCurrent);

    return () => {
      const behavior = usePagination({
        current: state.value.value,
        total: props.total,
        pageSize: props.pageSize,
        siblings: props.siblings,
        size: props.size,
        disabled: props.disabled,
        onChange: (page: number) => {
          state.set(page);
          emit('update:modelValue', page);
          emit('change', page);
        },
      });

      return h('nav', toProps(behavior.root), [
        h('button', toProps(behavior.prev), [h(Icon, { name: 'chevron-left', size: 15 })]),
        ...behavior.pages.map((page) =>
          page === 'ellipsis'
            ? h('span', toProps(behavior.ellipsis), '···')
            : h('button', toProps(behavior.page(page)), String(page)),
        ),
        h('button', toProps(behavior.next), [h(Icon, { name: 'chevron-right', size: 15 })]),
      ]);
    };
  },
});

export const Steps = defineComponent({
  name: 'ISteps',
  props: {
    items: { type: Array as PropType<StepItem[]>, required: true },
    current: { type: Number, required: true },
    direction: { type: String as PropType<Orientation>, default: 'horizontal' },
  },
  setup(props) {
    return () => {
      const behavior = useSteps(props);
      return h(
        'div',
        toProps(behavior.root),
        props.items.map((item, index) => {
          const status = behavior.statusOf(item, index);
          return h('div', toProps(behavior.item(item, index)), [
            h('span', toProps(behavior.indicator), status === 'finish' ? [h(Icon, { name: 'check', size: 14 })] : status === 'error' ? '!' : String(index + 1)),
            h('div', { class: 'i-steps__content' }, [
              h('div', toProps(behavior.title), item.title),
              item.description ? h('div', toProps(behavior.description), item.description) : null,
            ]),
            index < props.items.length - 1 ? h('span', toProps(behavior.tail)) : null,
          ]);
        }),
      );
    };
  },
});

export const Breadcrumb = defineComponent({
  name: 'IBreadcrumb',
  props: {
    items: { type: Array as PropType<BreadcrumbItem[]>, required: true },
    separator: String,
  },
  setup(props) {
    return () => {
      const behavior = useBreadcrumb({ items: props.items });
      return h('nav', toProps(behavior.root), [
        h(
          'ol',
          toProps(behavior.list),
          props.items.map((item, index) =>
            h('li', toProps(behavior.item(item, index)), [
              h('a', toProps(behavior.link(item, index)), item.label),
              index < props.items.length - 1
                ? h('span', toProps(behavior.separator), props.separator ?? [h(Icon, { name: 'chevron-right', size: 13 })])
                : null,
            ]),
          ),
        ),
      ]);
    };
  },
});
