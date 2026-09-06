import { useIcon, type IconName } from '@i-design/core';
import { defineComponent, h, type PropType } from 'vue';
import { toProps } from '../utils.js';

export const Icon = defineComponent({
  name: 'IIcon',
  props: {
    name: { type: String as PropType<IconName>, required: true },
    size: { type: Number, default: 16 },
    // `default: undefined` matters: a bare Boolean prop defaults to false in Vue,
    // which would override core's "loading spins unless told otherwise" default
    // and make the Vue icon differ from React's.
    spin: { type: Boolean, default: undefined },
    label: String,
  },
  setup(props) {
    return () => {
      const behavior = useIcon(props);
      return h(
        'svg',
        toProps(behavior.root),
        behavior.paths.map((d) => h('path', { d })),
      );
    };
  },
});
