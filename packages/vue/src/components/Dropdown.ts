import { computePosition, createId, rectOf, useMenu, usePopconfirm, type MenuItem, type Placement } from '@i-design/core';
import { defineComponent, h, onBeforeUnmount, ref, Teleport, watch, type PropType } from 'vue';
import { toProps } from '../utils.js';
import { useConfig } from './ConfigProvider.js';
import { Icon } from './Icon.js';
import { Button } from './Button.js';

export const Dropdown = defineComponent({
  name: 'IDropdown',
  props: {
    items: { type: Array as PropType<MenuItem[]>, required: true },
    placement: { type: String as PropType<Placement>, default: 'bottom-start' },
    trigger: { type: String as PropType<'click' | 'hover'>, default: 'click' },
    disabled: Boolean,
  },
  emits: ['select'],
  setup(props, { slots, emit }) {
    const config = useConfig();
    const id = createId('i-dropdown');
    const open = ref(false);
    const pos = ref({ x: 0, y: 0 });
    const anchor = ref<HTMLElement | null>(null);
    const floating = ref<HTMLElement | null>(null);

    const update = (): void => {
      if (!anchor.value || !floating.value) return;
      const next = computePosition(rectOf(anchor.value), rectOf(floating.value), { placement: props.placement, offset: 6 });
      pos.value = { x: next.x, y: next.y };
    };

    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target as Node;
      if (!anchor.value?.contains(target) && !floating.value?.contains(target)) open.value = false;
    };
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') open.value = false;
    };

    watch(open, (next) => {
      if (next) {
        requestAnimationFrame(update);
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKey);
        window.addEventListener('scroll', update, true);
      } else {
        document.removeEventListener('pointerdown', onPointerDown);
        document.removeEventListener('keydown', onKey);
        window.removeEventListener('scroll', update, true);
      }
    });
    onBeforeUnmount(() => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', update, true);
    });

    return () => {
      const behavior = useMenu({
        items: props.items,
        id,
        mode: 'popup',
        expanded: [],
        onSelect: (value: string, item: MenuItem) => {
          emit('select', value, item);
          open.value = false;
        },
      });

      const handlers =
        props.trigger === 'hover'
          ? { onMouseenter: () => !props.disabled && (open.value = true), onMouseleave: () => (open.value = false) }
          : { onClick: () => !props.disabled && (open.value = !open.value) };

      return [
        h('span', { ref: anchor, style: { display: 'inline-flex' }, ...handlers }, slots.default?.()),
        open.value
          ? h(Teleport, { to: 'body' }, [
              h(
                'div',
                {
                  ...toProps(behavior.root),
                  ref: floating,
                  'data-i-theme': config.value.mode,
                  'data-i-density': config.value.density,
                  dir: config.value.dir,
                  style: {
                    position: 'fixed',
                    insetInlineStart: `${pos.value.x}px`,
                    insetBlockStart: `${pos.value.y}px`,
                    zIndex: 'var(--i-z-index-popup)',
                  },
                },
                props.items.map((item) =>
                  h('button', { ...toProps(behavior.item(item, 0)), key: item.value }, [
                    h('span', { class: 'i-menu__label' }, item.label ?? item.value),
                  ]),
                ),
              ),
            ])
          : null,
      ];
    };
  },
});

export const Popconfirm = defineComponent({
  name: 'IPopconfirm',
  props: {
    title: { type: String, required: true },
    status: { type: String as PropType<'warning' | 'danger' | 'info'>, default: 'warning' },
    confirmText: { type: String, default: '确定' },
    cancelText: { type: String, default: '取消' },
    placement: { type: String as PropType<Placement>, default: 'top' },
  },
  emits: ['confirm', 'cancel'],
  setup(props, { slots, emit }) {
    const config = useConfig();
    const id = createId('i-popconfirm');
    const open = ref(false);
    const pos = ref({ x: 0, y: 0 });
    const anchor = ref<HTMLElement | null>(null);
    const floating = ref<HTMLElement | null>(null);

    const update = (): void => {
      if (!anchor.value || !floating.value) return;
      const next = computePosition(rectOf(anchor.value), rectOf(floating.value), { placement: props.placement, offset: 8 });
      pos.value = { x: next.x, y: next.y };
    };
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target as Node;
      if (!anchor.value?.contains(target) && !floating.value?.contains(target)) open.value = false;
    };
    watch(open, (next) => {
      if (next) {
        requestAnimationFrame(update);
        document.addEventListener('pointerdown', onPointerDown);
      } else document.removeEventListener('pointerdown', onPointerDown);
    });
    onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown));

    return () => {
      const behavior = usePopconfirm({
        open: open.value,
        id,
        status: props.status,
        onConfirm: () => {
          open.value = false;
          emit('confirm');
        },
        onCancel: () => {
          open.value = false;
          emit('cancel');
        },
      });

      return [
        h('span', { ref: anchor, style: { display: 'inline-flex' }, onClick: () => (open.value = !open.value) }, slots.default?.()),
        open.value
          ? h(Teleport, { to: 'body' }, [
              h(
                'div',
                {
                  class: 'i-popup i-popup--panel',
                  ref: floating,
                  'data-i-theme': config.value.mode,
                  'data-i-density': config.value.density,
                  dir: config.value.dir,
                  style: { insetInlineStart: `${pos.value.x}px`, insetBlockStart: `${pos.value.y}px` },
                },
                [
                  h('div', toProps(behavior.panel), [
                    h('span', toProps(behavior.icon), [
                      h(Icon, {
                        name: props.status === 'danger' ? 'close-circle' : props.status === 'info' ? 'info-circle' : 'warning-triangle',
                        size: 16,
                      }),
                    ]),
                    h('div', toProps(behavior.body), [
                      h('div', props.title),
                      h('div', toProps(behavior.actions), [
                        h(Button, { size: 's', variant: 'outline', onClick: () => behavior.cancel.on.click?.({}) }, () => props.cancelText),
                        h(
                          Button,
                          { size: 's', status: props.status === 'danger' ? 'danger' : 'brand', onClick: () => behavior.confirm.on.click?.({}) },
                          () => props.confirmText,
                        ),
                      ]),
                    ]),
                  ]),
                ],
              ),
            ])
          : null,
      ];
    };
  },
});
