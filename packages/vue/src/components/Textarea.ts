import { useTextareaBehavior } from '@i-design/core';
import { defineComponent, h, nextTick, onMounted, ref, watch, type PropType } from 'vue';
import { toProps, useControlled } from '../utils.js';
import { useConfig } from './ConfigProvider.js';

export const Textarea = defineComponent({
  name: 'ITextarea',
  props: {
    modelValue: { type: String as PropType<string | undefined>, default: undefined },
    defaultValue: { type: String, default: '' },
    status: { type: String as PropType<'default' | 'success' | 'warning' | 'danger'>, default: 'default' },
    placeholder: String,
    id: String,
    name: String,
    describedBy: String,
    rows: { type: Number, default: 3 },
    maxlength: Number,
    minRows: { type: Number, default: 2 },
    maxRows: { type: Number, default: 8 },
    resize: { type: String as PropType<'none' | 'vertical' | 'both'>, default: 'vertical' },
    autosize: Boolean,
    showCount: Boolean,
    disabled: Boolean,
    readonly: Boolean,
  },
  emits: ['update:modelValue', 'change', 'focus', 'blur'],
  setup(props, { emit }) {
    const config = useConfig();
    const state = useControlled(() => props.modelValue, props.defaultValue);
    const el = ref<HTMLTextAreaElement | null>(null);

    let measure: ((scrollHeight: number, lineHeight: number) => number) | null = null;
    onMounted(() => measure && resize(measure));

    const resize = (autosizeHeight: (scrollHeight: number, lineHeight: number) => number): void => {
      const node = el.value;
      if (!props.autosize || !node) return;
      node.style.height = 'auto';
      const lineHeight = Number.parseFloat(getComputedStyle(node).lineHeight) || 20;
      node.style.height = `${autosizeHeight(node.scrollHeight, lineHeight)}px`;
    };

    return () => {
      const behavior = useTextareaBehavior({
        ...props,
        value: state.value.value,
        placeholder: props.placeholder ?? config.value.locale.input.placeholder,
        onFocus: (event: Event) => emit('focus', event),
        onBlur: (event: Event) => emit('blur', event),
        onInput: (next: string, event: Event) => {
          state.set(next);
          emit('update:modelValue', next);
          emit('change', next, event);
          nextTick(() => resize(behavior.autosizeHeight));
        },
      });

      measure = behavior.autosizeHeight;
      watch(() => state.value.value, () => nextTick(() => resize(behavior.autosizeHeight)), { flush: 'post' });

      return h('div', toProps(behavior.root), [
        h('textarea', { ...toProps(behavior.textarea), ref: el }),
        props.showCount && behavior.count
          ? h('span', { class: 'i-textarea__count' }, `${behavior.count.current}/${behavior.count.max}`)
          : null,
      ]);
    };
  },
});
