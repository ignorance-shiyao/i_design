import {
  createWatermark, useDescriptions, useList, useResult, useSegmented, useStatistic,
  useTimeline, useTypography,
  type SegmentedOption, type Size, type Status, type TimelineItem,
} from '@i-design/core';
import { defineComponent, h, onMounted, ref, watch, type PropType } from 'vue';
import { toProps, useControlled } from '../utils.js';

export const List = defineComponent({
  name: 'IList',
  props: {
    bordered: { type: Boolean, default: true },
    split: { type: Boolean, default: true },
    size: { type: String as PropType<Size>, default: 'm' },
    hoverable: Boolean,
  },
  setup(props, { slots }) {
    return () => {
      const behavior = useList(props);
      return h('div', toProps(behavior.root), [
        slots.header ? h('div', toProps(behavior.header), slots.header()) : null,
        slots.default?.(),
        slots.footer ? h('div', toProps(behavior.footer), slots.footer()) : null,
      ]);
    };
  },
});

export const ListItem = defineComponent({
  name: 'IListItem',
  props: { title: String, description: String },
  setup(props, { slots }) {
    return () => {
      const behavior = useList();
      return h('div', toProps(behavior.item), [
        h('div', toProps(behavior.meta), [
          slots.avatar ? h('span', toProps(behavior.avatar), slots.avatar()) : null,
          h('div', toProps(behavior.content), [
            props.title || slots.title ? h('div', toProps(behavior.title), slots.title?.() ?? props.title) : null,
            props.description || slots.description
              ? h('div', toProps(behavior.description), slots.description?.() ?? props.description)
              : null,
            slots.default?.(),
          ]),
        ]),
        slots.actions ? h('div', toProps(behavior.actions), slots.actions()) : null,
      ]);
    };
  },
});

export const Descriptions = defineComponent({
  name: 'IDescriptions',
  props: {
    items: { type: Array as PropType<Array<{ label: string; value: string; span?: number }>>, required: true },
    layout: { type: String as PropType<'horizontal' | 'vertical'>, default: 'horizontal' },
    bordered: Boolean,
    columns: { type: Number, default: 2 },
    size: { type: String as PropType<Size>, default: 'm' },
  },
  setup(props) {
    return () => {
      const behavior = useDescriptions(props);
      return h(
        'div',
        { ...toProps(behavior.root), style: behavior.style },
        props.items.map((item, index) =>
          h('div', { ...toProps(behavior.item(item.span)), key: index, style: behavior.itemStyle(item.span) }, [
            h('span', toProps(behavior.label), item.label),
            h('span', toProps(behavior.value), item.value),
          ]),
        ),
      );
    };
  },
});

export const Statistic = defineComponent({
  name: 'IStatistic',
  props: {
    value: { type: [Number, String] as PropType<number | string>, required: true },
    label: String,
    precision: Number,
    groupSeparator: { type: String, default: ',' },
    prefix: String,
    suffix: String,
    trend: String as PropType<'up' | 'down' | 'flat'>,
    status: { type: String as PropType<Status>, default: 'default' },
  },
  setup(props, { slots }) {
    return () => {
      const behavior = useStatistic(props);
      const arrow = props.trend === 'up' ? '↑' : props.trend === 'down' ? '↓' : props.trend === 'flat' ? '→' : null;
      return h('div', toProps(behavior.root), [
        props.label || slots.label ? h('div', toProps(behavior.label), slots.label?.() ?? props.label) : null,
        h('div', toProps(behavior.value), [
          props.prefix ? h('span', toProps(behavior.prefix), props.prefix) : null,
          arrow ? h('span', toProps(behavior.trendIcon), arrow) : null,
          behavior.text,
          props.suffix ? h('span', toProps(behavior.suffix), props.suffix) : null,
        ]),
      ]);
    };
  },
});

export const Timeline = defineComponent({
  name: 'ITimeline',
  props: {
    items: { type: Array as PropType<TimelineItem[]>, required: true },
    mode: { type: String as PropType<'left' | 'alternate'>, default: 'left' },
  },
  setup(props) {
    return () => {
      const behavior = useTimeline(props);
      return h(
        'ul',
        toProps(behavior.root),
        props.items.map((item, index) =>
          h('li', { ...toProps(behavior.item(item, index)), key: item.key }, [
            h('span', toProps(behavior.dot)),
            h('div', toProps(behavior.content), [
              h('strong', item.title),
              item.time ? h('span', toProps(behavior.time), item.time) : null,
              item.description ? h('span', item.description) : null,
            ]),
          ]),
        ),
      );
    };
  },
});

export const Segmented = defineComponent({
  name: 'ISegmented',
  props: {
    options: { type: Array as PropType<SegmentedOption[]>, required: true },
    modelValue: { type: String as PropType<string | undefined>, default: undefined },
    defaultValue: String,
    size: { type: String as PropType<Size>, default: 'm' },
    block: Boolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const state = useControlled(() => props.modelValue, props.defaultValue ?? props.options[0]?.value ?? '');
    return () => {
      const behavior = useSegmented({
        options: props.options,
        value: state.value.value,
        size: props.size,
        block: props.block,
        onChange: (next: string) => {
          state.set(next);
          emit('update:modelValue', next);
          emit('change', next);
        },
      });
      return h('div', toProps(behavior.root), [
        h('span', { ...toProps(behavior.thumb), style: behavior.thumbStyle() }),
        ...props.options.map((option) =>
          h('button', { ...toProps(behavior.item(option)), key: option.value }, option.label ?? option.value),
        ),
      ]);
    };
  },
});

export const Typography = defineComponent({
  name: 'ITypography',
  props: {
    as: { type: String as PropType<'text' | 'title' | 'paragraph'>, default: 'text' },
    level: { type: Number as PropType<1 | 2 | 3 | 4 | 5>, default: 3 },
    status: { type: String as PropType<Status>, default: 'default' },
    ellipsis: Number,
    strong: Boolean,
    italic: Boolean,
    underline: Boolean,
    delete: Boolean,
    code: Boolean,
    copyable: Boolean,
    copyText: String,
  },
  setup(props, { slots }) {
    const copied = ref(false);
    return () => {
      const behavior = useTypography({
        ...props,
        copied: copied.value,
        onCopy: () => {
          void navigator.clipboard?.writeText(props.copyText ?? '');
          copied.value = true;
          setTimeout(() => (copied.value = false), 1600);
        },
      });
      return [
        h(behavior.tag, { ...toProps(behavior.root), style: behavior.style }, slots.default?.()),
        behavior.copy ? h('button', toProps(behavior.copy), copied.value ? '✓' : '⧉') : null,
      ];
    };
  },
});

const RESULT_ICON: Record<string, string> = {
  success: '✓', warning: '!', danger: '✕', info: 'ⓘ', '404': '404', '500': '500',
};

export const Result = defineComponent({
  name: 'IResult',
  props: {
    status: { type: String as PropType<'success' | 'warning' | 'danger' | 'info' | '404' | '500'>, default: 'info' },
    title: String,
    description: String,
  },
  setup(props, { slots }) {
    return () => {
      const behavior = useResult({ status: props.status });
      return h('div', toProps(behavior.root), [
        h('span', toProps(behavior.icon), slots.icon?.() ?? RESULT_ICON[props.status]),
        props.title || slots.title ? h('div', toProps(behavior.title), slots.title?.() ?? props.title) : null,
        props.description || slots.description
          ? h('div', toProps(behavior.description), slots.description?.() ?? props.description)
          : null,
        slots.extra ? h('div', toProps(behavior.extra), slots.extra()) : null,
      ]);
    };
  },
});

export const Watermark = defineComponent({
  name: 'IWatermark',
  props: {
    text: { type: String, required: true },
    fontSize: { type: Number, default: 14 },
    color: { type: String, default: 'rgba(0,0,0,0.08)' },
    rotate: { type: Number, default: -22 },
    gap: { type: Number, default: 32 },
  },
  setup(props, { slots }) {
    const image = ref('');
    const draw = (): void => {
      image.value = createWatermark(props);
    };
    onMounted(draw);
    watch(() => [props.text, props.fontSize, props.color, props.rotate, props.gap], draw);

    return () =>
      h('div', { class: 'i-watermark' }, [
        slots.default?.(),
        h('div', { class: 'i-watermark__layer', style: { backgroundImage: image.value ? `url(${image.value})` : undefined } }),
      ]);
  },
});
