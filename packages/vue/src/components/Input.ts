import { useInputBehavior, type Size } from '@i-design/core';
import { defineComponent, h, type PropType } from 'vue';
import { toProps, useControlled } from '../utils.js';
import { useConfig } from './ConfigProvider.js';

export const Input = defineComponent({
  name: 'IInput',
  props: {
    modelValue: { type: String as PropType<string | undefined>, default: undefined },
    defaultValue: { type: String, default: '' },
    size: { type: String as PropType<Size>, default: 'm' },
    status: { type: String as PropType<'default' | 'success' | 'warning' | 'danger'>, default: 'default' },
    type: { type: String, default: 'text' },
    placeholder: String,
    id: String,
    name: String,
    describedBy: String,
    maxlength: Number,
    disabled: Boolean,
    readonly: Boolean,
    clearable: Boolean,
    showCount: Boolean,
  },
  emits: ['update:modelValue', 'change', 'clear', 'focus', 'blur'],
  setup(props, { slots, emit }) {
    const config = useConfig();
    const state = useControlled(() => props.modelValue, props.defaultValue);

    return () => {
      const behavior = useInputBehavior({
        ...props,
        value: state.value.value,
        placeholder: props.placeholder ?? config.value.locale.input.placeholder,
        onInput: (next: string, event: Event) => {
          state.set(next);
          emit('update:modelValue', next);
          emit('change', next, event);
        },
        onFocus: (event: Event) => emit('focus', event),
        onBlur: (event: Event) => emit('blur', event),
        onClear: (event: Event) => {
          state.set('');
          emit('update:modelValue', '');
          emit('change', '', event);
          emit('clear');
        },
      });

      return h('div', toProps(behavior.root), [
        slots.prefix ? h('span', { class: 'i-input__prefix' }, slots.prefix()) : null,
        h('input', toProps(behavior.input)),
        props.showCount && behavior.count
          ? h('span', { class: 'i-input__count' }, `${behavior.count.current}/${behavior.count.max}`)
          : null,
        behavior.clear ? h('button', toProps(behavior.clear), '×') : null,
        slots.suffix ? h('span', { class: 'i-input__suffix' }, slots.suffix()) : null,
      ]);
    };
  },
});
