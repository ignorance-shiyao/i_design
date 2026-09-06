import {
  useAffix, useButtonGroup, useFloatButton, useImage, useLink, usePageHeader,
  useSplitter, useTour, type IconName, type TourStep,
} from '@i-design/core';
import {
  defineComponent, h, onBeforeUnmount, onMounted, ref, Teleport, watch, type PropType,
} from 'vue';
import { toProps, useControlled } from '../utils.js';
import { Icon } from './Icon.js';

/* --- Image -------------------------------------------------------------- */
export const Image = defineComponent({
  name: 'IImage',
  props: {
    src: { type: String, required: true },
    alt: { type: String, default: '' },
    width: { type: [Number, String] as PropType<number | string | undefined>, default: undefined },
    height: { type: [Number, String] as PropType<number | string | undefined>, default: undefined },
    fit: { type: String as PropType<'cover' | 'contain' | 'fill' | 'none'>, default: 'cover' },
    ratio: { type: String, default: undefined },
    preview: Boolean,
  },
  setup(props) {
    const loaded = ref(false);
    const failed = ref(false);
    const open = ref(false);
    const zoom = ref(1);
    const rotation = ref(0);

    // The overlay owns the keyboard while open, so Escape and the zoom keys
    // work without the trigger having to keep focus.
    let onKey: ((event: KeyboardEvent) => void) | null = null;
    const detach = (): void => {
      if (onKey) document.removeEventListener('keydown', onKey);
      onKey = null;
    };
    onBeforeUnmount(detach);

    return () => {
      const behavior = useImage({
        src: props.src,
        alt: props.alt,
        fit: props.fit,
        ratio: props.ratio,
        preview: props.preview,
        previewOpen: open.value,
        loaded: loaded.value,
        failed: failed.value,
        zoom: zoom.value,
        rotation: rotation.value,
        onPreviewChange: (next: boolean) => {
          open.value = next;
          if (!next) {
            zoom.value = 1;
            rotation.value = 0;
          }
        },
        onZoom: (next: number) => (zoom.value = next),
        onRotate: (next: number) => (rotation.value = next),
      });

      detach();
      if (open.value) {
        onKey = (event: KeyboardEvent): void => behavior.mask.on.keydown?.(event);
        document.addEventListener('keydown', onKey);
      }

      const size = (value: number | string | undefined): string | undefined =>
        value === undefined ? undefined : typeof value === 'number' ? `${value}px` : value;

      return h('span', { ...toProps(behavior.root), style: { ...behavior.rootStyle, width: size(props.width), height: size(props.height) } }, [
        h('img', {
          ...toProps(behavior.img),
          onLoad: () => (loaded.value = true),
          onError: () => (failed.value = true),
        }),
        open.value
          ? h(Teleport, { to: 'body' }, [
              h('div', toProps(behavior.mask), [
                h('img', { src: props.src, alt: props.alt, class: 'i-image__preview', style: behavior.previewStyle }),
                h('div', { class: 'i-image__tools' }, [
                  h('button', toProps(behavior.zoomOut), [h(Icon, { name: 'minus', size: 16 })]),
                  h('button', toProps(behavior.zoomIn), [h(Icon, { name: 'plus', size: 16 })]),
                  h('button', toProps(behavior.rotate), [h(Icon, { name: 'refresh', size: 16 })]),
                  h('button', toProps(behavior.close), [h(Icon, { name: 'close', size: 16 })]),
                ]),
              ]),
            ])
          : null,
      ]);
    };
  },
});

/* --- Affix -------------------------------------------------------------- */
export const Affix = defineComponent({
  name: 'IAffix',
  props: {
    offset: { type: Number, default: 0 },
  },
  setup(props, { slots }) {
    const holder = ref<HTMLElement | null>(null);
    const affixed = ref(false);
    const box = ref({ width: 0, height: 0 });

    const update = (): void => {
      const node = holder.value;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      if (!affixed.value) box.value = { width: rect.width, height: rect.height };
      affixed.value = rect.top <= props.offset;
    };

    onMounted(() => {
      update();
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
    });
    onBeforeUnmount(() => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    });

    return () => {
      const behavior = useAffix({ affixed: affixed.value, offset: props.offset, height: box.value.height });
      return h('div', { ref: holder, ...toProps(behavior.root), style: behavior.placeholderStyle }, [
        h(
          'div',
          { style: { ...behavior.contentStyle, width: affixed.value ? `${box.value.width}px` : undefined } },
          slots.default?.(),
        ),
      ]);
    };
  },
});

/* --- Splitter ----------------------------------------------------------- */
export const Splitter = defineComponent({
  name: 'ISplitter',
  props: {
    modelValue: { type: Number as PropType<number | undefined>, default: undefined },
    defaultValue: { type: Number, default: 50 },
    min: { type: Number, default: 10 },
    max: { type: Number, default: 90 },
    orientation: { type: String as PropType<'horizontal' | 'vertical'>, default: 'horizontal' },
    disabled: Boolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit, slots }) {
    const state = useControlled(() => props.modelValue, props.defaultValue);
    const root = ref<HTMLElement | null>(null);
    const dragging = ref(false);

    const set = (next: number): void => {
      state.set(next);
      emit('update:modelValue', next);
      emit('change', next);
    };

    return () => {
      const behavior = useSplitter({
        value: state.value.value,
        min: props.min,
        max: props.max,
        orientation: props.orientation,
        disabled: props.disabled,
        onChange: set,
      });

      const seek = (clientX: number, clientY: number): void => {
        const node = root.value;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const ratio = props.orientation === 'vertical'
          ? (clientY - rect.top) / rect.height
          : (clientX - rect.left) / rect.width;
        set(behavior.ratioAt(ratio));
      };

      return h('div', { ref: root, ...toProps(behavior.root) }, [
        h('div', { ...toProps(behavior.first), style: behavior.firstStyle }, slots.start?.()),
        h('div', {
          ...toProps(behavior.handle),
          onPointerdown: (event: PointerEvent) => {
            dragging.value = true;
            (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
          },
          onPointermove: (event: PointerEvent) => dragging.value && seek(event.clientX, event.clientY),
          onPointerup: () => (dragging.value = false),
          onPointercancel: () => (dragging.value = false),
        }),
        h('div', { ...toProps(behavior.second), style: behavior.secondStyle }, slots.end?.()),
      ]);
    };
  },
});

/* --- Tour --------------------------------------------------------------- */
export const Tour = defineComponent({
  name: 'ITour',
  props: {
    steps: { type: Array as PropType<TourStep[]>, required: true },
    open: Boolean,
    current: { type: Number as PropType<number | undefined>, default: undefined },
  },
  emits: ['update:current', 'change', 'close'],
  setup(props, { emit }) {
    const state = useControlled(() => props.current, 0);
    const rect = ref<{ top: number; left: number; width: number; height: number } | null>(null);

    const setCurrent = (next: number): void => {
      state.set(next);
      emit('update:current', next);
      emit('change', next);
    };

    let measure: (() => void) | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const stopMeasuring = (): void => {
      if (measure) window.removeEventListener('resize', measure);
      if (timer) clearTimeout(timer);
      measure = null;
      timer = null;
    };

    // Re-measure whenever the tour opens or the step changes; the target may
    // still be scrolling into view, hence the delayed second read.
    watch(
      () => [props.open, state.value.value] as const,
      () => {
        stopMeasuring();
        const step = props.steps[state.value.value];
        if (!props.open || !step) return (rect.value = null);
        const target = document.querySelector(step.target);
        if (!target) return (rect.value = null);
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        measure = (): void => {
          const boxed = target.getBoundingClientRect();
          rect.value = { top: boxed.top, left: boxed.left, width: boxed.width, height: boxed.height };
        };
        measure();
        timer = setTimeout(measure, 320);
        window.addEventListener('resize', measure);
      },
      { immediate: true },
    );

    let onKey: ((event: KeyboardEvent) => void) | null = null;
    const detach = (): void => {
      if (onKey) document.removeEventListener('keydown', onKey);
      onKey = null;
    };
    onBeforeUnmount(() => {
      stopMeasuring();
      detach();
    });

    return () => {
      const behavior = useTour({
        steps: props.steps,
        current: state.value.value,
        open: props.open,
        onChange: setCurrent,
        onClose: () => emit('close'),
      });

      detach();
      if (props.open) {
        onKey = (event: KeyboardEvent): void => behavior.panel.on.keydown?.(event);
        document.addEventListener('keydown', onKey);
      }

      if (!props.open || !behavior.step) return null;

      const spot = rect.value;
      const panelTop = spot ? Math.min(spot.top + spot.height + 12, window.innerHeight - 200) : 120;
      const panelLeft = spot ? Math.min(Math.max(12, spot.left), window.innerWidth - 300) : 24;

      return h(Teleport, { to: 'body' }, [
        spot
          ? h('div', { ...toProps(behavior.spotlight), style: behavior.spotlightStyle(spot) })
          : h('div', toProps(behavior.mask)),
        h('div', { ...toProps(behavior.panel), style: { insetBlockStart: `${panelTop}px`, insetInlineStart: `${panelLeft}px` } }, [
          h('div', { class: 'i-tour__title' }, behavior.step.title),
          behavior.step.description ? h('div', { class: 'i-tour__desc' }, behavior.step.description) : null,
          h('div', { class: 'i-tour__footer' }, [
            h('span', { class: 'i-tour__progress' }, behavior.progress),
            h('span', { style: { display: 'inline-flex', gap: '4px' } }, [
              h('button', toProps(behavior.skip), '跳过'),
              h('button', toProps(behavior.prev), '上一步'),
              h('button', toProps(behavior.next), behavior.isLast ? '完成' : '下一步'),
            ]),
          ]),
        ]),
      ]);
    };
  },
});

/* --- Small parts -------------------------------------------------------- */
export const Link = defineComponent({
  name: 'ILink',
  props: {
    href: { type: String, default: undefined },
    status: { type: String as PropType<'default' | 'brand' | 'success' | 'warning' | 'danger'>, default: 'brand' },
    underline: { type: String as PropType<'always' | 'hover' | 'never'>, default: 'hover' },
    disabled: Boolean,
  },
  setup(props, { slots }) {
    return () =>
      h(
        'a',
        toProps(useLink({ href: props.href, status: props.status, underline: props.underline, disabled: props.disabled })),
        slots.default?.(),
      );
  },
});

export const ButtonGroup = defineComponent({
  name: 'IButtonGroup',
  props: {
    orientation: { type: String as PropType<'horizontal' | 'vertical'>, default: 'horizontal' },
  },
  setup(props, { slots }) {
    return () => h('div', toProps(useButtonGroup({ orientation: props.orientation })), slots.default?.());
  },
});

export const PageHeader = defineComponent({
  name: 'IPageHeader',
  props: {
    title: { type: String, default: undefined },
    subtitle: { type: String, default: undefined },
    back: Boolean,
  },
  emits: ['back'],
  setup(props, { emit, slots }) {
    return () => {
      const behavior = usePageHeader();
      return h('div', toProps(behavior.root), [
        h('div', { class: 'i-page-header__row' }, [
          props.back
            ? h('button', { ...toProps(behavior.back), onClick: () => emit('back') }, [h(Icon, { name: 'arrow-left', size: 16 })])
            : null,
          h('span', toProps(behavior.title), slots.title?.() ?? props.title),
          props.subtitle || slots.subtitle
            ? h('span', toProps(behavior.subtitle), slots.subtitle?.() ?? props.subtitle)
            : null,
          slots.extra ? h('span', toProps(behavior.extra), slots.extra()) : null,
        ]),
        slots.default ? h('div', toProps(behavior.content), slots.default()) : null,
      ]);
    };
  },
});

export const FloatButton = defineComponent({
  name: 'IFloatButton',
  props: {
    icon: { type: String as PropType<IconName>, default: 'plus' },
    items: {
      type: Array as PropType<Array<{ icon: IconName; label: string; onClick?: () => void }>>,
      default: undefined,
    },
  },
  emits: ['click'],
  setup(props, { emit }) {
    const open = ref(false);

    return () => {
      const behavior = useFloatButton({ open: open.value });

      if (!props.items?.length) {
        return h('div', toProps(behavior.root), [
          h('button', { ...toProps(behavior.trigger), onClick: () => emit('click') }, [h(Icon, { name: props.icon, size: 18 })]),
        ]);
      }

      return h(
        'div',
        {
          ...toProps(behavior.root),
          onMouseenter: () => (open.value = true),
          onMouseleave: () => (open.value = false),
        },
        [
          ...props.items.map((item) =>
            h('button', { ...toProps(behavior.item(item.label)), key: item.label, onClick: item.onClick }, [
              h(Icon, { name: item.icon, size: 16 }),
            ]),
          ),
          h('button', { ...toProps(behavior.trigger), onClick: () => (open.value = !open.value) }, [
            h(Icon, { name: props.icon, size: 18 }),
          ]),
        ],
      );
    };
  },
});
