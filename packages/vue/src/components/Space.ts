import { createBem, cx } from '@i-design/core';
import { defineComponent, h, type PropType } from 'vue';

const bem = createBem('space');

export const Space = defineComponent({
  name: 'ISpace',
  props: {
    direction: { type: String as PropType<'horizontal' | 'vertical'>, default: 'horizontal' },
    gap: { type: String as PropType<'s' | 'm' | 'l'>, default: 'm' },
    wrap: Boolean,
    align: String as PropType<'start' | 'center' | 'end'>,
    justify: String as PropType<'between'>,
  },
  setup(props, { slots }) {
    return () =>
      h(
        'div',
        {
          class: cx(bem(), bem(null, props.direction), bem(null, `gap-${props.gap}`), {
            [bem(null, 'wrap')]: props.wrap,
            [bem(null, `align-${props.align}`)]: !!props.align,
            [bem(null, `justify-${props.justify}`)]: !!props.justify,
          }),
        },
        slots.default?.(),
      );
  },
});
