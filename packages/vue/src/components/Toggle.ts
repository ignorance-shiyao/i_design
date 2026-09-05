import { createId, useToggleBehavior, type Size, type ToggleKind } from '@i-design/core';
import { defineComponent, h, type PropType } from 'vue';
import { toProps, useControlled } from '../utils.js';

/**
 * Checkbox and Switch are one factory here for the same reason they are one
 * behaviour in core: they differ in painted control and ARIA role only.
 */
function createToggleComponent(kind: ToggleKind, name: string) {
  return defineComponent({
    name,
    props: {
      modelValue: { type: Boolean as PropType<boolean | undefined>, default: undefined },
      defaultChecked: { type: Boolean, default: false },
      indeterminate: Boolean,
      size: { type: String as PropType<Size>, default: 'm' },
      id: String,
      name: String,
      value: [String, Number] as PropType<string | number>,
      disabled: Boolean,
      readonly: Boolean,
    },
    emits: ['update:modelValue', 'change'],
    setup(props, { slots, emit }) {
      const state = useControlled(() => props.modelValue, props.defaultChecked);
      const autoId = props.id ?? createId(`i-${kind}`);

      return () => {
        const behavior = useToggleBehavior({
          ...props,
          kind,
          id: autoId,
          checked: state.value.value,
          indeterminate: kind === 'checkbox' ? props.indeterminate : false,
          onChange: (next: boolean, event: Event) => {
            state.set(next);
            emit('update:modelValue', next);
            emit('change', next, event);
          },
        });

        return h('label', { ...toProps(behavior.root), for: autoId }, [
          h('input', toProps(behavior.input)),
          h('span', toProps(behavior.control)),
          slots.default ? h('span', toProps(behavior.label), slots.default()) : null,
        ]);
      };
    },
  });
}

export const Checkbox = createToggleComponent('checkbox', 'ICheckbox');
export const Switch = createToggleComponent('switch', 'ISwitch');
