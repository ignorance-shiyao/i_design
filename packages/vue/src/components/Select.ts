import { createId, useSelect, type SelectOption, type Size } from '@i-design/core';
import { defineComponent, h, ref, type PropType } from 'vue';
import { toProps, useControlled } from '../utils.js';
import { useConfig } from './ConfigProvider.js';
import { Icon } from './Icon.js';

export const Select = defineComponent({
  name: 'ISelect',
  props: {
    options: { type: Array as PropType<SelectOption<string>[]>, required: true },
    modelValue: { type: String as PropType<string | null | undefined>, default: undefined },
    defaultValue: { type: String as PropType<string | null>, default: null },
    size: { type: String as PropType<Size>, default: 'm' },
    status: { type: String as PropType<'default' | 'success' | 'warning' | 'danger'>, default: 'default' },
    placeholder: String,
    disabled: Boolean,
    clearable: Boolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const config = useConfig();
    const id = createId('i-select');
    const state = useControlled<string | null>(() => props.modelValue, props.defaultValue);
    const open = ref(false);
    const activeIndex = ref(-1);

    return () => {
      const behavior = useSelect<string>({
        options: props.options,
        value: state.value.value,
        open: open.value,
        activeIndex: activeIndex.value,
        id,
        size: props.size,
        status: props.status,
        disabled: props.disabled,
        clearable: props.clearable,
        placeholder: props.placeholder ?? config.value.locale.select.placeholder,
        onOpenChange: (next: boolean) => (open.value = next),
        onActiveIndexChange: (index: number) => (activeIndex.value = index),
        onChange: (next: string | null) => {
          state.set(next);
          emit('update:modelValue', next);
          emit('change', next);
        },
      });

      return h('div', toProps(behavior.root), [
        h('button', toProps(behavior.trigger), [
          h(
            'span',
            { class: `i-select__value${behavior.selectedLabel ? '' : ' i-select__value--placeholder'}` },
            behavior.selectedLabel ?? behavior.placeholder,
          ),
          behavior.clear
            ? h('span', { ...toProps(behavior.clear), role: 'button' }, [h(Icon, { name: 'close', size: 11 })])
            : null,
          h('span', { class: 'i-select__arrow' }, [h(Icon, { name: 'chevron-down', size: 14 })]),
        ]),
        open.value
          ? h('ul', toProps(behavior.listbox), [
              props.options.length === 0
                ? h('li', { class: 'i-select__empty' }, config.value.locale.select.empty)
                : null,
              ...props.options.map((option, index) =>
                h('li', toProps(behavior.option(option, index)), option.label),
              ),
            ])
          : null,
      ]);
    };
  },
});
