import {
  activeSection, createId, useAnchor, useBackTop, useMenu, useTree,
  type AnchorItem, type MenuItem, type TreeNode,
} from '@i-design/core';
import { defineComponent, h, onBeforeUnmount, onMounted, ref, type PropType, type VNodeChild } from 'vue';
import { toProps, useControlled } from '../utils.js';
import { Checkbox } from './Toggle.js';
import { Icon } from './Icon.js';

export const Layout = defineComponent({
  name: 'ILayout',
  props: { direction: { type: String as PropType<'column' | 'row'>, default: 'column' } },
  setup(props, { slots }) {
    return () =>
      h('div', { class: ['i-layout', props.direction === 'row' ? 'i-layout--row' : ''] }, slots.default?.());
  },
});

const part = (name: string, tag = 'div') =>
  defineComponent({
    name: `ILayout${name[0]!.toUpperCase()}${name.slice(1)}`,
    setup(_, { slots }) {
      return () => h(tag, { class: `i-layout__${name}` }, slots.default?.());
    },
  });

export const LayoutHeader = part('header');
export const LayoutContent = part('content');
export const LayoutFooter = part('footer');

export const LayoutSider = defineComponent({
  name: 'ILayoutSider',
  props: {
    collapsed: Boolean,
    width: { type: [Number, String], default: 220 },
    collapsedWidth: { type: [Number, String], default: 56 },
  },
  setup(props, { slots }) {
    return () =>
      h(
        'aside',
        {
          class: ['i-layout__sider', props.collapsed ? 'i-layout__sider--collapsed' : ''],
          style: {
            '--i-layout-sider-width': typeof props.width === 'number' ? `${props.width}px` : props.width,
            '--i-layout-sider-collapsed':
              typeof props.collapsedWidth === 'number' ? `${props.collapsedWidth}px` : props.collapsedWidth,
          },
        },
        slots.default?.(),
      );
  },
});

export const Menu = defineComponent({
  name: 'IMenu',
  props: {
    items: { type: Array as PropType<MenuItem[]>, required: true },
    value: { type: String as PropType<string | null>, default: null },
    expanded: { type: Array as PropType<string[] | undefined>, default: undefined },
    defaultExpanded: { type: Array as PropType<string[]>, default: () => [] },
    orientation: { type: String as PropType<'vertical' | 'horizontal'>, default: 'vertical' },
    mode: { type: String as PropType<'inline' | 'popup'>, default: 'inline' },
    collapsed: Boolean,
  },
  emits: ['select', 'update:expanded'],
  setup(props, { emit }) {
    const id = createId('i-menu');
    const state = useControlled(() => props.expanded, props.defaultExpanded);

    return () => {
      const behavior = useMenu({
        items: props.items,
        value: props.value,
        expanded: state.value.value,
        orientation: props.orientation,
        mode: props.mode,
        collapsed: props.collapsed,
        id,
        onSelect: (value: string, item: MenuItem) => emit('select', value, item),
        onExpandedChange: (keys: string[]) => {
          state.set(keys);
          emit('update:expanded', keys);
        },
      });

      const render = (list: MenuItem[], depth: number): VNodeChild[] =>
        list.map((item) =>
          item.children?.length
            ? h('div', { key: item.value }, [
                h('button', toProps(behavior.submenuTrigger(item, depth)), [
                  h('span', { class: 'i-menu__label' }, item.label ?? item.value),
                  h('span', { class: 'i-menu__arrow', 'aria-hidden': 'true' }, [h(Icon, { name: 'chevron-right', size: 13 })]),
                ]),
                h('div', toProps(behavior.submenu(item)), render(item.children!, depth + 1)),
              ])
            : h('button', { ...toProps(behavior.item(item, depth)), key: item.value }, [
                h('span', { class: 'i-menu__label' }, item.label ?? item.value),
              ]),
        );

      return h('nav', toProps(behavior.root), render(props.items, 0));
    };
  },
});

export const Tree = defineComponent({
  name: 'ITree',
  props: {
    nodes: { type: Array as PropType<TreeNode[]>, required: true },
    expanded: { type: Array as PropType<string[] | undefined>, default: undefined },
    defaultExpanded: { type: Array as PropType<string[]>, default: () => [] },
    checked: { type: Array as PropType<string[] | undefined>, default: undefined },
    defaultChecked: { type: Array as PropType<string[]>, default: () => [] },
    selected: { type: Array as PropType<string[]>, default: () => [] },
    checkable: Boolean,
    multiple: Boolean,
  },
  emits: ['select', 'update:expanded', 'update:checked'],
  setup(props, { emit }) {
    const expandedState = useControlled(() => props.expanded, props.defaultExpanded);
    const checkedState = useControlled(() => props.checked, props.defaultChecked);

    return () => {
      const behavior = useTree({
        nodes: props.nodes,
        expanded: expandedState.value.value,
        checked: checkedState.value.value,
        selected: props.selected,
        checkable: props.checkable,
        multiple: props.multiple,
        onExpandedChange: (keys: string[]) => {
          expandedState.set(keys);
          emit('update:expanded', keys);
        },
        onCheckedChange: (keys: string[]) => {
          checkedState.set(keys);
          emit('update:checked', keys);
        },
        onSelect: (key: string, node: TreeNode) => emit('select', key, node),
      });

      return h(
        'div',
        toProps(behavior.root),
        behavior.rows.map((entry) => {
          const box = behavior.checkbox(entry);
          return h('div', { ...toProps(behavior.row(entry)), key: entry.node.key }, [
            entry.expandable
              ? h('button', toProps(behavior.toggle(entry)), [h(Icon, { name: 'chevron-right', size: 12 })])
              : h('span', { class: 'i-tree__spacer' }),
            props.checkable
              ? h(Checkbox, {
                  size: 's',
                  modelValue: box.checked,
                  indeterminate: box.indeterminate,
                  disabled: entry.node.disabled,
                  'onUpdate:modelValue': () => box.toggle(),
                })
              : null,
            h('span', { class: 'i-tree__label' }, entry.node.label),
          ]);
        }),
      );
    };
  },
});

export const Anchor = defineComponent({
  name: 'IAnchor',
  props: {
    items: { type: Array as PropType<AnchorItem[]>, required: true },
    offset: { type: Number, default: 80 },
  },
  setup(props) {
    const active = ref<string | null>(props.items[0]?.id ?? null);

    const update = (): void => {
      const positions = props.items
        .map((item) => {
          const node = document.getElementById(item.id);
          return node ? { id: item.id, top: node.getBoundingClientRect().top + window.scrollY } : null;
        })
        .filter((item): item is { id: string; top: number } => item !== null);
      active.value = activeSection(positions, window.scrollY, props.offset);
    };

    onMounted(() => {
      update();
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
    });
    onBeforeUnmount(() => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    });

    return () => {
      const behavior = useAnchor({
        items: props.items,
        active: active.value,
        offset: props.offset,
        onChange: (id: string) => (active.value = id),
      });
      return h(
        'nav',
        toProps(behavior.root),
        props.items.map((item) => h('a', { ...toProps(behavior.link(item)), key: item.id }, item.label)),
      );
    };
  },
});

export const BackTop = defineComponent({
  name: 'IBackTop',
  props: { threshold: { type: Number, default: 240 }, label: String },
  setup(props) {
    const visible = ref(false);
    const update = (): void => {
      visible.value = window.scrollY > props.threshold;
    };
    onMounted(() => {
      update();
      window.addEventListener('scroll', update, { passive: true });
    });
    onBeforeUnmount(() => window.removeEventListener('scroll', update));

    return () =>
      h('button', toProps(useBackTop({ visible: visible.value, label: props.label })), [
        h(Icon, { name: 'arrow-up', size: 16 }),
      ]);
  },
});
