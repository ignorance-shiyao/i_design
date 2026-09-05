import { createId, useRadioGroup, type Orientation, type RadioOption, type Size } from '@i-design/core';
import { defineComponent, h, type PropType } from 'vue';
import { toProps, useControlled } from '../utils.js';

export const RadioGroup = defineComponent({
  name: 'IRadioGroup',
  props: {
    options: { type: Array as PropType<RadioOption<string>[]>, required: true },
    modelValue: { type: [String, Number] as PropType<string | undefined>, default: undefined },
    defaultValue: String,
    name: String,
    orientation: { type: String as PropType<Orientation>, default: 'horizontal' },
    variant: { type: String as PropType<'default' | 'button'>, default: 'default' },
    size: { type: String as PropType<Size>, default: 'm' },
    disabled: Boolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const groupName = props.name ?? createId('i-radio-group');
    const state = useControlled<string | null>(() => props.modelValue, props.defaultValue ?? null);

    return () => {
      const behavior = useRadioGroup<string>({
        options: props.options,
        value: state.value.value,
        name: groupName,
        orientation: props.orientation,
        variant: props.variant,
        size: props.size,
        disabled: props.disabled,
        onChange: (next: string) => {
          state.set(next);
          emit('update:modelValue', next);
          emit('change', next);
        },
      });

      return h(
        'div',
        toProps(behavior.root),
        props.options.map((option, index) =>
          h('label', toProps(behavior.item(option, index)), [
            h('input', toProps(behavior.input(option, index))),
            h('span', toProps(behavior.control)),
            h('span', toProps(behavior.label), option.label ?? String(option.value)),
          ]),
        ),
      );
    };
  },
});
