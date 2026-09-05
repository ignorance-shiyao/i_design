import { createBem, createId, lockScroll, trapFocus, useDialogBehavior } from '@i-design/core';
import { defineComponent, h, onBeforeUnmount, ref, Teleport, watch, type PropType } from 'vue';
import { toProps } from '../utils.js';
import { useConfig } from './ConfigProvider.js';
import { Button } from './Button.js';

const bem = createBem('dialog');

export const Dialog = defineComponent({
  name: 'IDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    title: String,
    size: { type: String as PropType<'s' | 'm' | 'l' | 'full'>, default: 'm' },
    closeOnMask: { type: Boolean, default: true },
    closeOnEscape: { type: Boolean, default: true },
    confirmText: String,
    cancelText: String,
    confirmLoading: Boolean,
    showFooter: { type: Boolean, default: true },
  },
  emits: ['update:modelValue', 'close', 'confirm'],
  setup(props, { slots, emit }) {
    const config = useConfig();
    const panel = ref<HTMLElement | null>(null);
    const base = createId('i-dialog');
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
      async (open) => {
        if (!open) {
          teardown();
          return;
        }
        unlock = lockScroll();
        keyHandler = (event: KeyboardEvent) => {
          if (props.closeOnEscape && event.key === 'Escape') close('escape');
        };
        document.addEventListener('keydown', keyHandler);
        // Wait a frame so the teleported panel exists before trapping focus.
        requestAnimationFrame(() => {
          if (panel.value) release = trapFocus(panel.value);
        });
      },
      // `immediate` matters: a dialog mounted with `modelValue` already true
      // must get its Escape handler and focus trap too, not only on a change.
      { immediate: true },
    );

    onBeforeUnmount(teardown);

    return () => {
      if (!props.modelValue) return null;

      const behavior = useDialogBehavior({
        open: true,
        titleId: ids.title,
        bodyId: ids.body,
        size: props.size,
        closeOnMask: props.closeOnMask,
        closeOnEscape: props.closeOnEscape,
        onClose: close,
      });

      const footer =
        slots.footer?.() ?? [
          h(Button, { variant: 'outline', onClick: () => close('cancel') }, () => props.cancelText ?? config.value.locale.dialog.cancel),
          h(Button, { status: 'brand', loading: props.confirmLoading, onClick: () => emit('confirm') }, () => props.confirmText ?? config.value.locale.dialog.confirm),
        ];

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
            h('div', { ...toProps(behavior.panel), ref: panel }, [
              h('div', { class: bem('header') }, [
                h('span', { id: ids.title }, slots.title?.() ?? props.title),
                h('button', toProps(behavior.closeButton), '×'),
              ]),
              h('div', { class: bem('body'), id: ids.body }, slots.default?.()),
              props.showFooter ? h('div', { class: bem('footer') }, footer) : null,
            ]),
          ],
        ),
      ]);
    };
  },
});
