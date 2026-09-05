import type { ElementSpec, EventName } from '@i-design/core';
import { computed, ref, type Ref } from 'vue';

const EVENT_PROP: Record<EventName, string> = {
  click: 'onClick',
  keydown: 'onKeydown',
  keyup: 'onKeyup',
  input: 'onInput',
  change: 'onChange',
  focus: 'onFocus',
  blur: 'onBlur',
  mouseenter: 'onMouseenter',
  mouseleave: 'onMouseleave',
  pointerdown: 'onPointerdown',
};

/**
 * Vue counterpart of the React `toProps`. Vue takes kebab-case attributes
 * natively, so the mapping is even thinner — but the point is the same: no
 * component logic lives here, only the translation of an `ElementSpec`.
 */
export function toProps(el: ElementSpec): Record<string, unknown> {
  const props: Record<string, unknown> = { class: el.class };
  for (const [key, value] of Object.entries(el.attrs)) {
    if (value === undefined) continue;
    props[key] = value;
  }
  for (const [name, handler] of Object.entries(el.on)) {
    if (handler) props[EVENT_PROP[name as EventName]] = handler;
  }
  return props;
}

/**
 * `v-model`-friendly controlled/uncontrolled state.
 * When the parent binds `modelValue`, that wins; otherwise we keep local state,
 * so `<IInput />` works with zero props just like `<IInput v-model="x" />`.
 */
export function useControlled<T>(
  read: () => T | undefined,
  defaultValue: T,
): { value: Ref<T>; set: (next: T) => void } {
  const internal = ref(defaultValue) as Ref<T>;
  const value = computed({
    get: () => {
      const external = read();
      return external === undefined ? internal.value : external;
    },
    set: (next: T) => {
      internal.value = next;
    },
  }) as unknown as Ref<T>;
  return { value, set: (next: T) => { internal.value = next; } };
}
