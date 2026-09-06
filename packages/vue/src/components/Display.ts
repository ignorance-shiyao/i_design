import {
  useAlert, useAvatar, useBadge, useCard, useDivider, useEmpty, useProgress, useSkeleton, useSpinner,
  type Size, type Status,
} from '@i-design/core';
import { defineComponent, h, type PropType } from 'vue';
import { Icon } from './Icon.js';
import type { IconName } from '@i-design/core';
import { toProps } from '../utils.js';
import { useConfig } from './ConfigProvider.js';

const STATUS_ICON: Record<string, IconName> = {
  info: 'info-circle', brand: 'info-circle', success: 'check-circle',
  warning: 'warning-triangle', danger: 'close-circle',
};

export const Alert = defineComponent({
  name: 'IAlert',
  props: {
    status: { type: String as PropType<'info' | 'brand' | 'success' | 'warning' | 'danger'>, default: 'info' },
    variant: { type: String as PropType<'soft' | 'outline'>, default: 'soft' },
    title: String,
    closable: Boolean,
    showIcon: { type: Boolean, default: true },
  },
  emits: ['close'],
  setup(props, { slots, emit }) {
    return () => {
      const behavior = useAlert({ ...props, onClose: (e: Event) => emit('close', e) });
      return h('div', toProps(behavior.root), [
        props.showIcon
          ? h('span', { class: 'i-alert__icon' }, slots.icon?.() ?? [h(Icon, { name: STATUS_ICON[props.status]!, size: 16 })])
          : null,
        h('div', { class: 'i-alert__content' }, [
          props.title || slots.title ? h('div', { class: 'i-alert__title' }, slots.title?.() ?? props.title) : null,
          slots.default?.(),
        ]),
        behavior.close ? h('button', toProps(behavior.close), [h(Icon, { name: 'close', size: 14 })]) : null,
      ]);
    };
  },
});

export const Card = defineComponent({
  name: 'ICard',
  props: {
    title: String,
    hoverable: Boolean,
    bordered: { type: Boolean, default: true },
    padding: { type: String as PropType<'none' | 'm' | 'l'>, default: 'm' },
  },
  setup(props, { slots }) {
    return () => {
      const behavior = useCard(props);
      return h('div', toProps(behavior.root), [
        props.title || slots.title || slots.extra
          ? h('div', toProps(behavior.header), [h('span', slots.title?.() ?? props.title), slots.extra?.()])
          : null,
        h('div', toProps(behavior.body), slots.default?.()),
        slots.footer ? h('div', toProps(behavior.footer), slots.footer()) : null,
      ]);
    };
  },
});

export const Divider = defineComponent({
  name: 'IDivider',
  props: {
    direction: { type: String as PropType<'horizontal' | 'vertical'>, default: 'horizontal' },
    dashed: Boolean,
    align: { type: String as PropType<'start' | 'center' | 'end'>, default: 'center' },
  },
  setup(props, { slots }) {
    return () => h('div', toProps(useDivider(props)), slots.default?.());
  },
});

export const Avatar = defineComponent({
  name: 'IAvatar',
  props: {
    size: { type: String as PropType<Size>, default: 'm' },
    shape: { type: String as PropType<'circle' | 'square'>, default: 'circle' },
    src: String,
    alt: String,
    name: String,
  },
  setup(props, { slots }) {
    return () => {
      const behavior = useAvatar(props);
      return h('span', toProps(behavior.root), [
        behavior.image ? h('img', toProps(behavior.image)) : (slots.default?.() ?? behavior.initials),
      ]);
    };
  },
});

export const Badge = defineComponent({
  name: 'IBadge',
  props: {
    count: Number,
    max: { type: Number, default: 99 },
    dot: Boolean,
    status: { type: String as PropType<Status>, default: 'danger' },
    showZero: Boolean,
  },
  setup(props, { slots }) {
    return () => {
      const behavior = useBadge(props);
      return h('span', toProps(behavior.root), [
        slots.default?.(),
        behavior.visible ? h('span', toProps(behavior.indicator), behavior.text) : null,
      ]);
    };
  },
});

export const Progress = defineComponent({
  name: 'IProgress',
  props: {
    value: { type: Number, required: true },
    max: { type: Number, default: 100 },
    shape: { type: String as PropType<'line' | 'circle'>, default: 'line' },
    status: { type: String as PropType<'brand' | 'success' | 'warning' | 'danger'>, default: 'brand' },
    size: { type: String as PropType<Size>, default: 'm' },
    label: String,
    showLabel: { type: Boolean, default: true },
  },
  setup(props) {
    return () => {
      const behavior = useProgress(props);
      const percent = Math.round(behavior.percent);
      return h('div', toProps(behavior.root), [
        h('div', { ...toProps(behavior.track), style: { '--i-progress-percent': percent } }, [
          h('div', { ...toProps(behavior.bar), style: { inlineSize: `${percent}%` } }),
        ]),
        props.showLabel ? h('span', { class: 'i-progress__label' }, `${percent}%`) : null,
      ]);
    };
  },
});

export const Skeleton = defineComponent({
  name: 'ISkeleton',
  props: {
    rows: { type: Number, default: 3 },
    animated: { type: Boolean, default: true },
    loading: { type: Boolean, default: true },
  },
  setup(props, { slots }) {
    return () => {
      if (!props.loading) return slots.default?.();
      const behavior = useSkeleton(props);
      return h(
        'div',
        toProps(behavior.root),
        behavior.rows.map((index) => h('div', toProps(behavior.row(index, behavior.rows.length)))),
      );
    };
  },
});

export const Spinner = defineComponent({
  name: 'ISpinner',
  props: {
    size: { type: String as PropType<Size>, default: 'm' },
    label: String,
  },
  setup(props) {
    const config = useConfig();
    return () => {
      const behavior = useSpinner({ size: props.size, label: props.label ?? config.value.locale.common.loading });
      return h('span', toProps(behavior.root), [h('span', toProps(behavior.indicator))]);
    };
  },
});

export const Empty = defineComponent({
  name: 'IEmpty',
  props: { description: String },
  setup(props, { slots }) {
    const config = useConfig();
    return () => {
      const behavior = useEmpty();
      return h('div', toProps(behavior.root), [
        h('span', toProps(behavior.icon), slots.icon?.() ?? [h(Icon, { name: 'folder', size: 28 })]),
        h('div', toProps(behavior.description), props.description ?? config.value.locale.select.empty),
        slots.default?.(),
      ]);
    };
  },
});
