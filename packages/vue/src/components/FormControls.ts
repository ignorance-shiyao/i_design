import {
  formatBytes, uploadDragHandlers, useInputNumber, useRate, useSlider, useUpload,
  type Size, type SliderMark, type UploadFile,
} from '@i-design/core';
import { defineComponent, h, ref, type PropType } from 'vue';
import { toProps, useControlled } from '../utils.js';
import { Progress } from './Display.js';
import { Icon } from './Icon.js';

export const InputNumber = defineComponent({
  name: 'IInputNumber',
  props: {
    modelValue: { type: Number as PropType<number | null | undefined>, default: undefined },
    defaultValue: { type: Number as PropType<number | null>, default: null },
    min: Number,
    max: Number,
    step: { type: Number, default: 1 },
    precision: Number,
    size: { type: String as PropType<Size>, default: 'm' },
    status: { type: String as PropType<'default' | 'success' | 'warning' | 'danger'>, default: 'default' },
    controls: { type: String as PropType<'stack' | 'side' | 'none'>, default: 'stack' },
    placeholder: String,
    id: String,
    name: String,
    describedBy: String,
    disabled: Boolean,
    readonly: Boolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const state = useControlled<number | null>(() => props.modelValue, props.defaultValue);
    return () => {
      const behavior = useInputNumber({
        ...props,
        value: state.value.value,
        onChange: (next: number | null) => {
          state.set(next);
          emit('update:modelValue', next);
          emit('change', next);
        },
      });

      return h('div', toProps(behavior.root), [
        props.controls === 'side' ? h('button', toProps(behavior.decrease), [h(Icon, { name: 'minus', size: 14 })]) : null,
        h('input', toProps(behavior.input)),
        props.controls === 'stack'
          ? h('span', { class: 'i-input-number__steps' }, [
              h('button', toProps(behavior.increase), [h(Icon, { name: 'caret-up', size: 9 })]),
              h('button', toProps(behavior.decrease), [h(Icon, { name: 'caret-down', size: 9 })]),
            ])
          : null,
        props.controls === 'side' ? h('button', toProps(behavior.increase), [h(Icon, { name: 'plus', size: 14 })]) : null,
      ]);
    };
  },
});

export const Slider = defineComponent({
  name: 'ISlider',
  props: {
    modelValue: { type: Number as PropType<number | undefined>, default: undefined },
    defaultValue: { type: Number, default: 0 },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    marks: Array as PropType<SliderMark[]>,
    orientation: { type: String as PropType<'horizontal' | 'vertical'>, default: 'horizontal' },
    label: String,
    disabled: Boolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const state = useControlled(() => props.modelValue, props.defaultValue);
    const track = ref<HTMLElement | null>(null);
    let dragging = false;

    return () => {
      const behavior = useSlider({
        ...props,
        value: state.value.value,
        onChange: (next: number) => {
          state.set(next);
          emit('update:modelValue', next);
          emit('change', next);
        },
      });

      const seek = (clientX: number, clientY: number): void => {
        const node = track.value;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const ratio = props.orientation === 'vertical'
          ? 1 - (clientY - rect.top) / rect.height
          : (clientX - rect.left) / rect.width;
        const next = behavior.valueAt(ratio);
        state.set(next);
        emit('update:modelValue', next);
        emit('change', next);
      };

      return h('div', toProps(behavior.root), [
        h(
          'div',
          {
            ...toProps(behavior.track),
            ref: track,
            onPointerdown: (event: PointerEvent) => {
              dragging = true;
              (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
              seek(event.clientX, event.clientY);
            },
            onPointermove: (event: PointerEvent) => dragging && seek(event.clientX, event.clientY),
            onPointerup: () => (dragging = false),
            onPointercancel: () => (dragging = false),
          },
          [
            h('div', { ...toProps(behavior.fill), style: { inlineSize: `${behavior.percent}%` } }),
            h('div', { ...toProps(behavior.handle), style: { insetInlineStart: `${behavior.percent}%` }, title: behavior.text }),
          ],
        ),
        props.marks?.length
          ? h(
              'div',
              { class: 'i-slider__marks' },
              props.marks.map((mark) =>
                h(
                  'button',
                  { ...toProps(behavior.mark(mark)), style: { insetInlineStart: `${behavior.percentOf(mark.value)}%` } },
                  String(mark.label ?? mark.value),
                ),
              ),
            )
          : null,
      ]);
    };
  },
});

export const Rate = defineComponent({
  name: 'IRate',
  props: {
    modelValue: { type: Number as PropType<number | undefined>, default: undefined },
    defaultValue: { type: Number, default: 0 },
    count: { type: Number, default: 5 },
    character: { type: String, default: '★' },
    allowHalf: Boolean,
    allowClear: { type: Boolean, default: true },
    label: String,
    disabled: Boolean,
    readonly: Boolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const state = useControlled(() => props.modelValue, props.defaultValue);
    return () => {
      const behavior = useRate({
        ...props,
        value: state.value.value,
        onChange: (next: number) => {
          state.set(next);
          emit('update:modelValue', next);
          emit('change', next);
        },
      });
      return h(
        'div',
        toProps(behavior.root),
        Array.from({ length: props.count }, (_, index) =>
          h('span', toProps(behavior.item(index + 1)), props.character),
        ),
      );
    };
  },
});

export const Upload = defineComponent({
  name: 'IUpload',
  props: {
    files: { type: Array as PropType<UploadFile[]>, required: true },
    accept: String,
    multiple: Boolean,
    disabled: Boolean,
    maxCount: Number,
    maxSize: Number,
    variant: { type: String as PropType<'button' | 'drag'>, default: 'button' },
    hint: String,
  },
  emits: ['select', 'remove', 'reject'],
  setup(props, { slots, emit }) {
    const dragging = ref(false);
    const input = ref<HTMLInputElement | null>(null);

    return () => {
      const behavior = useUpload({
        ...props,
        dragging: dragging.value,
        onSelect: (files: File[]) => emit('select', files),
        onRemove: (file: UploadFile) => emit('remove', file),
        onReject: (file: File, reason: string) => emit('reject', file, reason),
      });

      const drop = uploadDragHandlers(
        (value) => (dragging.value = value),
        (incoming) => {
          const { accepted, rejected } = behavior.accept(incoming);
          for (const item of rejected) emit('reject', item.file, item.reason);
          if (accepted.length > 0) emit('select', accepted);
        },
      );

      return h('div', { class: 'i-upload' }, [
        h(
          'div',
          {
            ...toProps(behavior.root),
            onDragover: drop.dragover,
            onDragleave: drop.dragleave,
            onDrop: drop.drop,
            onClick: props.variant === 'drag' ? () => input.value?.click() : undefined,
          },
          [
            h('input', { ...toProps(behavior.input), ref: input }),
            props.variant === 'drag'
              ? [
                  h('div', slots.default?.() ?? '点击或拖拽文件到此处'),
                  props.hint ? h('div', { class: 'i-upload__hint' }, props.hint) : null,
                ]
              : h(
                  'button',
                  { ...toProps(behavior.trigger), onClick: () => input.value?.click() },
                  slots.default?.() ?? '选择文件',
                ),
          ],
        ),
        props.files.length > 0
          ? h(
              'ul',
              toProps(behavior.list),
              props.files.map((file) =>
                h('li', toProps(behavior.item(file)), [
                  h('span', { class: 'i-upload__name' }, file.name),
                  file.status === 'uploading'
                    ? h('span', { class: 'i-upload__progress' }, [
                        h(Progress, { value: file.percent ?? 0, size: 's', showLabel: false }),
                      ])
                    : h('span', { class: 'i-upload__size' }, file.size ? formatBytes(file.size) : ''),
                  h(
                    'span',
                    { class: 'i-upload__status' },
                    file.status === 'success'
                      ? [h(Icon, { name: 'check', size: 13 })]
                      : file.status === 'error'
                        ? [h(Icon, { name: 'warning-triangle', size: 13 })]
                        : '',
                  ),
                  h('button', toProps(behavior.remove(file)), [h(Icon, { name: 'close', size: 13 })]),
                ]),
              ),
            )
          : null,
      ]);
    };
  },
});
