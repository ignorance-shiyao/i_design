import { computePosition, createId, cx, rectOf, usePopupBehavior, type Placement } from '@i-design/core';
import { defineComponent, h, onBeforeUnmount, ref, Teleport, watch, type PropType } from 'vue';
import { toProps } from '../utils.js';
import { useConfig } from './ConfigProvider.js';

export const Tooltip = defineComponent({
  name: 'ITooltip',
  props: {
    content: String,
    placement: { type: String as PropType<Placement>, default: 'top' },
    trigger: { type: String as PropType<'hover' | 'click' | 'focus' | 'manual'>, default: 'hover' },
    modelValue: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    appearance: { type: String as PropType<'tooltip' | 'panel'>, default: 'tooltip' },
    offset: { type: Number, default: 8 },
    disabled: Boolean,
  },
  emits: ['update:modelValue'],
  setup(props, { slots, emit }) {
    const config = useConfig();
    const internalOpen = ref(false);
    const anchor = ref<HTMLElement | null>(null);
    const floating = ref<HTMLElement | null>(null);
    const pos = ref({ x: 0, y: 0 });
    const id = createId('i-popup');

    const isOpen = () => props.modelValue ?? internalOpen.value;

    const update = (): void => {
      if (!anchor.value || !floating.value) return;
      const next = computePosition(rectOf(anchor.value), rectOf(floating.value), {
        placement: props.placement,
        offset: props.offset,
      });
      pos.value = { x: next.x, y: next.y };
    };

    watch(isOpen, (open) => {
      if (!open) {
        window.removeEventListener('scroll', update, true);
        window.removeEventListener('resize', update);
        return;
      }
      requestAnimationFrame(update);
      window.addEventListener('scroll', update, true);
      window.addEventListener('resize', update);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    });

    return () => {
      const open = isOpen();
      const behavior = usePopupBehavior({
        open,
        id,
        trigger: props.trigger,
        disabled: props.disabled,
        onOpenChange: (next: boolean) => {
          internalOpen.value = next;
          emit('update:modelValue', next);
        },
      });

      return [
        h('span', { ...toProps(behavior.anchor), ref: anchor }, slots.default?.()),
        open
          ? h(Teleport, { to: 'body' }, [
              h(
                'div',
                {
                  ...toProps(behavior.content),
                  ref: floating,
                  class: cx(behavior.content.class, props.appearance === 'panel' && 'i-popup--panel'),
                  'data-i-theme': config.value.mode,
                  'data-i-density': config.value.density,
                  dir: config.value.dir,
                  style: { insetInlineStart: `${pos.value.x}px`, insetBlockStart: `${pos.value.y}px` },
                },
                slots.content?.() ?? props.content,
              ),
            ])
          : null,
      ];
    };
  },
});
