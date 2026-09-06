import {
  createTransitionController, motionClass, PRESET_DURATION, stagger,
  type MotionPreset, type TransitionPhase,
} from '@i-design/core';
import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch, type PropType } from 'vue';

export const Transition = defineComponent({
  name: 'ITransition',
  props: {
    visible: { type: Boolean, default: false },
    preset: { type: String as PropType<MotionPreset>, default: 'fade' },
    duration: Number,
    appear: Boolean,
    keepMounted: Boolean,
  },
  emits: ['exited'],
  setup(props, { slots, emit }) {
    const phase = ref<TransitionPhase>(props.visible && !props.appear ? 'entered' : 'exited');
    const mounted = ref(props.visible);
    let controller: ReturnType<typeof createTransitionController> | null = null;

    const duration = (): number => props.duration ?? PRESET_DURATION[props.preset];

    onMounted(() => {
      controller = createTransitionController({
        visible: props.visible,
        preset: props.preset,
        duration: duration(),
        appear: props.appear,
        onChange: (nextPhase, nextMounted) => {
          phase.value = nextPhase;
          mounted.value = nextMounted;
          if (nextPhase === 'exited') emit('exited');
        },
      });
    });

    watch(() => props.visible, (next) => controller?.setVisible(next));
    onBeforeUnmount(() => controller?.destroy());

    return () => {
      if (!mounted.value && !props.keepMounted) return null;
      return h(
        'div',
        {
          class: motionClass(props.preset, phase.value),
          style: { transitionDuration: `${duration()}ms` },
          hidden: !mounted.value && props.keepMounted ? true : undefined,
        },
        slots.default?.(),
      );
    };
  },
});

export const Stagger = defineComponent({
  name: 'IStagger',
  props: {
    preset: { type: String as PropType<MotionPreset>, default: 'slide-up' },
    step: { type: Number, default: 40 },
  },
  setup(props, { slots }) {
    return () =>
      h(
        'div',
        (slots.default?.() ?? []).map((child, index) =>
          h(
            'div',
            { class: motionClass(props.preset, 'entered'), style: { animationDelay: `${stagger(index, props.step)}ms` } },
            [child],
          ),
        ),
      );
  },
});
