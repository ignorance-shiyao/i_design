import { createBem, cx, type Status } from '@i-design/core';
import { defineComponent, h, type PropType } from 'vue';

const bem = createBem('tag');

export const Tag = defineComponent({
  name: 'ITag',
  props: {
    variant: { type: String as PropType<'solid' | 'outline' | 'soft'>, default: 'soft' },
    status: { type: String as PropType<Status>, default: 'default' },
    size: { type: String as PropType<'s' | 'm'>, default: 's' },
    round: Boolean,
    closable: Boolean,
  },
  emits: ['close'],
  setup(props, { slots, emit }) {
    return () =>
      h(
        'span',
        {
          class: cx(bem(), bem(null, props.variant), bem(null, `status-${props.status}`), bem(null, `size-${props.size}`), {
            [bem(null, 'round')]: props.round,
          }),
        },
        [
          slots.default?.(),
          props.closable
            ? h(
                'button',
                { class: bem('close'), type: 'button', 'aria-label': 'close', onClick: (e: Event) => emit('close', e) },
                '×',
              )
            : null,
        ],
      );
  },
});
