import { createBem, createId, lockScroll, trapFocus, useDrawerBehavior, type DrawerPlacement } from '@i-design/core';
import { defineComponent, h, onBeforeUnmount, ref, Teleport, watch, type PropType } from 'vue';
import { toProps } from '../utils.js';
import { useConfig } from './ConfigProvider.js';

const bem = createBem('drawer');

export const Drawer = defineComponent({
  name: 'IDrawer',
  props: {
    modelValue: { type: Boolean, default: false },
    title: String,
    placement: { type: String as PropType<DrawerPlacement>, default: 'right' },
    size: { type: String, default: '320px' },
    closeOnMask: { type: Boolean, default: true },
    closeOnEscape: { type: Boolean, default: true },
  },
  emits: ['update:modelValue', 'close'],
  setup(props, { slots, emit }) {
    const config = useConfig();
    const panel = ref<HTMLElement | null>(null);
    const base = createId('i-drawer');
    const ids = { title: `${base}-title`, body: `${base}-body` };

    let release: null | (() => void) = null;
    let unlock: null | (() => void) = null;
    let keyHandler: null | ((event: KeyboardEvent) => void) = null;

    const teardown = (): void => {
      if (keyHandler) document.removeEventListener('keydown', keyHandler);
      release?.();
      unlock?.();
      release = unlock = keyHandler = null;
    };

    const close = (reason: string): void => {
      emit('update:modelValue', false);
      emit('close', reason);
    };

    watch(
      () => props.modelValue,
      (open) => {
        if (!open) {
          teardown();
          return;
        }
        unlock = lockScroll();
        keyHandler = (event: KeyboardEvent) => {
          if (props.closeOnEscape && event.key === 'Escape') close('escape');
        };
        document.addEventListener('keydown', keyHandler);
        requestAnimationFrame(() => {
          if (panel.value) release = trapFocus(panel.value);
        });
      },
      { immediate: true },
    );

    onBeforeUnmount(teardown);

    return () => {
      if (!props.modelValue) return null;

      const behavior = useDrawerBehavior({
        open: true,
        titleId: ids.title,
        bodyId: ids.body,
        placement: props.placement,
        size: props.size,
        closeOnMask: props.closeOnMask,
        closeOnEscape: props.closeOnEscape,
        onClose: close,
      });

      return h(Teleport, { to: 'body' }, [
        h(
          'div',
          {
            ...toProps(behavior.mask),
            'data-i-theme': config.value.mode,
            'data-i-density': config.value.density,
            dir: config.value.dir,
          },
          [
            h('div', { ...toProps(behavior.panel), ref: panel, style: behavior.panelStyle }, [
              h('div', { class: bem('header') }, [
                h('span', { id: ids.title }, slots.title?.() ?? props.title),
                h('button', toProps(behavior.closeButton), '×'),
              ]),
              h('div', { class: bem('body'), id: ids.body }, slots.default?.()),
              slots.footer ? h('div', { class: bem('footer') }, slots.footer()) : null,
            ]),
          ],
        ),
      ]);
    };
  },
});
