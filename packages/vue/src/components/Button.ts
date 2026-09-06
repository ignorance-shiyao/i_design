import { useButtonBehavior, type Size, type Status, type Variant } from '@i-design/core';
import { defineComponent, h, type PropType } from 'vue';
import { toProps } from '../utils.js';

export const Button = defineComponent({
  name: 'IButton',
  props: {
    variant: { type: String as PropType<Variant>, default: 'solid' },
    status: { type: String as PropType<Status>, default: 'default' },
    size: { type: String as PropType<Size>, default: 'm' },
    shape: { type: String as PropType<'rect' | 'round' | 'circle' | 'square'>, default: 'rect' },
    type: { type: String as PropType<'button' | 'submit' | 'reset'>, default: 'button' },
    href: String,
    block: Boolean,
    disabled: Boolean,
    loading: Boolean,
  },
  emits: ['click'],
  setup(props, { slots, emit }) {
    return () => {
      const behavior = useButtonBehavior({
        ...props,
        onClick: (event: Event) => emit('click', event),
      });
      return h(behavior.tag, toProps(behavior.root), [
        behavior.showSpinner ? h('span', { class: 'i-button__spinner' }) : slots.icon?.(),
        slots.default ? h('span', { class: 'i-button__content' }, slots.default()) : null,
        slots.suffix?.(),
      ]);
    };
  },
});
