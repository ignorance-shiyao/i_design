import { useCarousel, type Orientation } from '@i-design/core';
import { defineComponent, h, onBeforeUnmount, ref, watchEffect, type PropType } from 'vue';
import { toProps, useControlled } from '../utils.js';

export const Carousel = defineComponent({
  name: 'ICarousel',
  props: {
    modelValue: { type: Number as PropType<number | undefined>, default: undefined },
    defaultIndex: { type: Number, default: 0 },
    loop: { type: Boolean, default: true },
    autoplay: { type: Number, default: 0 },
    orientation: { type: String as PropType<Orientation>, default: 'horizontal' },
    dragThreshold: { type: Number, default: 40 },
    label: { type: String, default: 'carousel' },
    showArrows: { type: Boolean, default: true },
    showDots: { type: Boolean, default: true },
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { slots, emit }) {
    const state = useControlled(() => props.modelValue, props.defaultIndex);
    const drag = ref(0);
    const paused = ref(false);
    const viewport = ref<HTMLElement | null>(null);
    let start: number | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;

    const slides = () => slots.default?.() ?? [];

    const stopTimer = (): void => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };
    onBeforeUnmount(stopTimer);

    return () => {
      const children = slides();
      const count = children.length;

      const behavior = useCarousel({
        count,
        index: state.value.value,
        loop: props.loop,
        autoplay: props.autoplay,
        orientation: props.orientation,
        dragThreshold: props.dragThreshold,
        label: props.label,
        onChange: (next: number) => {
          state.set(next);
          emit('update:modelValue', next);
          emit('change', next);
        },
      });

      // Autoplay pauses on hover and focus — an unpausable carousel is an a11y bug.
      watchEffect(() => {
        stopTimer();
        if (props.autoplay <= 0 || paused.value || count < 2) return;
        timer = setInterval(() => behavior.goTo(state.value.value + 1), props.autoplay);
      });

      const endDrag = (): void => {
        if (start === null) return;
        behavior.goTo(behavior.resolveDrag(drag.value, viewport.value?.clientWidth ?? 0));
        start = null;
        drag.value = 0;
      };

      return h(
        'div',
        {
          ...toProps(behavior.root),
          onMouseenter: () => (paused.value = true),
          onMouseleave: () => (paused.value = false),
          onFocusin: () => (paused.value = true),
          onFocusout: () => (paused.value = false),
        },
        [
          h(
            'div',
            {
              ...toProps(behavior.viewport),
              ref: viewport,
              onPointerdown: (event: PointerEvent) => {
                start = event.clientX;
                (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
              },
              onPointermove: (event: PointerEvent) => {
                if (start === null) return;
                drag.value = event.clientX - start;
              },
              onPointerup: endDrag,
              onPointercancel: endDrag,
            },
            [
              h(
                'div',
                { ...toProps(behavior.track), style: behavior.trackStyle(drag.value) },
                children.map((child, index) => h('div', toProps(behavior.slide(index)), [child])),
              ),
            ],
          ),
          props.showArrows && count > 1
            ? [h('button', toProps(behavior.prev), '‹'), h('button', toProps(behavior.next), '›')]
            : null,
          props.showDots && count > 1
            ? h(
                'div',
                { class: 'i-carousel__dots' },
                children.map((_, index) => h('button', toProps(behavior.indicator(index)))),
              )
            : null,
        ],
      );
    };
  },
});
