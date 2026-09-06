import {
  createId, formatCountdown, useAutoComplete, useCascader, useColorPicker,
  useInputOtp, useInputTag, useTimePicker, useTransfer,
  type CascaderNode, type TimeValue, type TransferItem,
} from '@i-design/core';
import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch, type PropType } from 'vue';
import { toProps, useControlled } from '../utils.js';
import { Checkbox } from './Toggle.js';
import { Icon } from './Icon.js';

/** Shared outside-click plumbing for the popup-backed controls below. */
function useOutside(open: { value: boolean }, root: { value: HTMLElement | null }) {
  const onPointerDown = (event: PointerEvent): void => {
    if (!root.value?.contains(event.target as Node)) open.value = false;
  };
  watch(
    () => open.value,
    (next) => {
      if (next) document.addEventListener('pointerdown', onPointerDown);
      else document.removeEventListener('pointerdown', onPointerDown);
    },
  );
  onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown));
}

export const Transfer = defineComponent({
  name: 'ITransfer',
  props: {
    items: { type: Array as PropType<TransferItem[]>, required: true },
    modelValue: { type: Array as PropType<string[] | undefined>, default: undefined },
    defaultValue: { type: Array as PropType<string[]>, default: () => [] },
    titles: { type: Array as unknown as PropType<[string, string]>, default: () => ['源列表', '目标列表'] },
    searchable: Boolean,
    disabled: Boolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const state = useControlled(() => props.modelValue, props.defaultValue);
    const checked = ref<string[]>([]);
    const search = ref<[string, string]>(['', '']);

    return () => {
      const behavior = useTransfer({
        items: props.items,
        value: state.value.value,
        checked: checked.value,
        search: search.value,
        titles: props.titles,
        searchable: props.searchable,
        disabled: props.disabled,
        onChange: (next: string[]) => {
          state.set(next);
          emit('update:modelValue', next);
          emit('change', next);
        },
        onCheckedChange: (next: string[]) => (checked.value = next),
        onSearch: (side: 0 | 1, keyword: string) => {
          search.value = side === 0 ? [keyword, search.value[1]] : [search.value[0], keyword];
        },
      });

      const panel = (side: 'source' | 'target') => {
        const p = behavior[side];
        return h('div', toProps(p.root), [
          h('div', toProps(p.header), [
            h(Checkbox, {
              size: 's',
              modelValue: p.selectAll.checked,
              indeterminate: p.selectAll.indeterminate,
              'onUpdate:modelValue': () => p.selectAll.toggle(),
            }),
            h('span', props.titles[side === 'source' ? 0 : 1]),
            h('span', p.count),
          ]),
          p.search ? h('input', toProps(p.search)) : null,
          h(
            'ul',
            toProps(p.list),
            p.items.map((item) =>
              h('li', { ...toProps(p.item(item)), key: item.key, onClick: () => p.toggle(item) }, [
                h(Checkbox, {
                  size: 's',
                  modelValue: p.isChecked(item),
                  disabled: item.disabled,
                  'onUpdate:modelValue': () => p.toggle(item),
                }),
                h('span', item.label),
              ]),
            ),
          ),
        ]);
      };

      return h('div', toProps(behavior.root), [
        panel('source'),
        h('div', { class: 'i-transfer__moves' }, [
          h('button', toProps(behavior.toTarget), [h(Icon, { name: 'chevron-right', size: 14 })]),
          h('button', toProps(behavior.toSource), [h(Icon, { name: 'chevron-left', size: 14 })]),
        ]),
        panel('target'),
      ]);
    };
  },
});

export const Cascader = defineComponent({
  name: 'ICascader',
  props: {
    options: { type: Array as PropType<CascaderNode[]>, required: true },
    modelValue: { type: Array as PropType<string[] | undefined>, default: undefined },
    defaultValue: { type: Array as PropType<string[]>, default: () => [] },
    placeholder: { type: String, default: '请选择' },
    separator: { type: String, default: ' / ' },
    disabled: Boolean,
    clearable: Boolean,
    changeOnSelect: Boolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const id = createId('i-cascader');
    const state = useControlled(() => props.modelValue, props.defaultValue);
    const activePath = ref<string[]>(state.value.value);
    const open = ref(false);
    const root = ref<HTMLElement | null>(null);
    useOutside(open, root);

    return () => {
      const behavior = useCascader({
        options: props.options,
        id,
        value: state.value.value,
        activePath: activePath.value,
        open: open.value,
        placeholder: props.placeholder,
        separator: props.separator,
        disabled: props.disabled,
        clearable: props.clearable,
        changeOnSelect: props.changeOnSelect,
        onChange: (next: string[], labels: string[]) => {
          state.set(next);
          emit('update:modelValue', next);
          emit('change', next, labels);
        },
        onActivePathChange: (next: string[]) => (activePath.value = next),
        onOpenChange: (next: boolean) => {
          open.value = next;
          if (next) activePath.value = state.value.value;
        },
      });

      return h('div', { ...toProps(behavior.root), ref: root }, [
        h('button', toProps(behavior.trigger), [
          h(
            'span',
            { class: `i-cascader__value${behavior.displayValue ? '' : ' i-cascader__value--placeholder'}` },
            behavior.displayValue || behavior.placeholder,
          ),
          behavior.clear
            ? h('span', { ...toProps(behavior.clear), role: 'button' }, [h(Icon, { name: 'close', size: 11 })])
            : null,
          h(Icon, { name: 'chevron-down', size: 14 }),
        ]),
        open.value
          ? h(
              'div',
              toProps(behavior.panel),
              behavior.columns.map((column, depth) =>
                h(
                  'div',
                  { ...toProps(behavior.column(depth)), key: depth },
                  column.map((node) =>
                    h('button', { ...toProps(behavior.option(node, depth)), key: node.value }, [
                      h('span', node.label),
                      node.children?.length ? h(Icon, { name: 'chevron-right', size: 12 }) : null,
                    ]),
                  ),
                ),
              ),
            )
          : null,
      ]);
    };
  },
});

const DEFAULT_PRESETS = ['#4169ef', '#12b76a', '#f79009', '#f04438', '#7c5cf5', '#0aa3b8', '#5a6376', '#171b23'];

export const ColorPicker = defineComponent({
  name: 'IColorPicker',
  props: {
    modelValue: { type: String as PropType<string | undefined>, default: undefined },
    defaultValue: { type: String, default: '#4169ef' },
    presets: { type: Array as PropType<string[]>, default: () => DEFAULT_PRESETS },
    showRamp: Boolean,
    disabled: Boolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const id = createId('i-color');
    const state = useControlled(() => props.modelValue, props.defaultValue);
    const open = ref(false);
    const root = ref<HTMLElement | null>(null);
    useOutside(open, root);

    return () => {
      const behavior = useColorPicker({
        id,
        value: state.value.value,
        presets: props.presets,
        showRamp: props.showRamp,
        disabled: props.disabled,
        open: open.value,
        onChange: (next: string) => {
          state.set(next);
          emit('update:modelValue', next);
          emit('change', next);
        },
        onOpenChange: (next: boolean) => (open.value = next),
      });

      return h('div', { ...toProps(behavior.root), ref: root }, [
        h('button', toProps(behavior.trigger), [
          h('span', {
            ...toProps(behavior.swatch),
            style: { backgroundColor: behavior.valid ? state.value.value : undefined },
          }),
          state.value.value,
        ]),
        open.value
          ? h('div', toProps(behavior.panel), [
              h('input', toProps(behavior.native)),
              h('input', toProps(behavior.hex)),
              h(
                'div',
                { class: 'i-color-picker__presets' },
                props.presets.map((hex) => h('button', { ...toProps(behavior.preset(hex)), key: hex, style: { background: hex } })),
              ),
              behavior.ramp.length
                ? h(
                    'div',
                    { class: 'i-color-picker__ramp' },
                    behavior.ramp.map((hex, index) =>
                      h('span', { ...toProps(behavior.rampStep(index)), key: hex + index, style: { background: hex } }),
                    ),
                  )
                : null,
            ])
          : null,
      ]);
    };
  },
});

export const TimePicker = defineComponent({
  name: 'ITimePicker',
  props: {
    modelValue: { type: Object as PropType<TimeValue | null | undefined>, default: undefined },
    defaultValue: { type: Object as PropType<TimeValue | null>, default: null },
    step: { type: Number, default: 1 },
    showSeconds: Boolean,
    placeholder: { type: String, default: '选择时间' },
    disabled: Boolean,
    clearable: Boolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const id = createId('i-time');
    const state = useControlled<TimeValue | null>(() => props.modelValue, props.defaultValue);
    const open = ref(false);
    const root = ref<HTMLElement | null>(null);
    useOutside(open, root);

    return () => {
      const behavior = useTimePicker({
        id,
        value: state.value.value,
        open: open.value,
        step: props.step,
        showSeconds: props.showSeconds,
        placeholder: props.placeholder,
        disabled: props.disabled,
        clearable: props.clearable,
        onChange: (next: TimeValue | null) => {
          state.set(next);
          emit('update:modelValue', next);
          emit('change', next);
        },
        onOpenChange: (next: boolean) => (open.value = next),
      });

      const column = (part: 'hour' | 'minute' | 'second', units: number[]) =>
        h(
          'div',
          { ...toProps(behavior.column(part)), key: part },
          units.map((unit) =>
            h('button', { ...toProps(behavior.cell(part, unit)), key: unit }, String(unit).padStart(2, '0')),
          ),
        );

      return h('div', { ...toProps(behavior.root), ref: root }, [
        h('button', toProps(behavior.trigger), [
          h(Icon, { name: 'clock', size: 15 }),
          h(
            'span',
            { class: `i-time-picker__value${state.value.value ? '' : ' i-time-picker__value--placeholder'}` },
            behavior.displayValue || behavior.placeholder,
          ),
          behavior.clear
            ? h('span', { ...toProps(behavior.clear), role: 'button' }, [h(Icon, { name: 'close', size: 11 })])
            : null,
        ]),
        open.value
          ? h('div', toProps(behavior.panel), [
              column('hour', behavior.hours),
              column('minute', behavior.minutes),
              props.showSeconds ? column('second', behavior.seconds) : null,
            ])
          : null,
      ]);
    };
  },
});

export const AutoComplete = defineComponent({
  name: 'IAutoComplete',
  props: {
    modelValue: { type: String as PropType<string | undefined>, default: undefined },
    defaultValue: { type: String, default: '' },
    suggestions: { type: Array as PropType<string[]>, required: true },
    placeholder: String,
    disabled: Boolean,
  },
  emits: ['update:modelValue', 'select'],
  setup(props, { emit }) {
    const id = createId('i-ac');
    const state = useControlled(() => props.modelValue, props.defaultValue);
    const open = ref(false);
    const activeIndex = ref(-1);

    return () => {
      const behavior = useAutoComplete({
        id,
        value: state.value.value,
        suggestions: props.suggestions,
        open: open.value,
        activeIndex: activeIndex.value,
        placeholder: props.placeholder,
        disabled: props.disabled,
        onInput: (next: string) => {
          state.set(next);
          emit('update:modelValue', next);
        },
        onSelect: (next: string) => {
          state.set(next);
          emit('update:modelValue', next);
          emit('select', next);
        },
        onOpenChange: (next: boolean) => (open.value = next),
        onActiveIndexChange: (index: number) => (activeIndex.value = index),
      });

      return h('div', toProps(behavior.root), [
        h('input', toProps(behavior.input)),
        open.value && props.suggestions.length
          ? h(
              'ul',
              toProps(behavior.listbox),
              props.suggestions.map((item, index) =>
                h('li', { ...toProps(behavior.option(item, index)), key: item }, item),
              ),
            )
          : null,
      ]);
    };
  },
});

export const InputTag = defineComponent({
  name: 'IInputTag',
  props: {
    modelValue: { type: Array as PropType<string[] | undefined>, default: undefined },
    defaultValue: { type: Array as PropType<string[]>, default: () => [] },
    max: Number,
    placeholder: String,
    disabled: Boolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const state = useControlled(() => props.modelValue, props.defaultValue);
    const draft = ref('');

    return () => {
      const behavior = useInputTag({
        tags: state.value.value,
        draft: draft.value,
        max: props.max,
        placeholder: props.placeholder,
        disabled: props.disabled,
        onTagsChange: (next: string[]) => {
          state.set(next);
          emit('update:modelValue', next);
          emit('change', next);
        },
        onDraftChange: (next: string) => (draft.value = next),
      });

      return h('div', toProps(behavior.root), [
        ...state.value.value.map((tag, index) =>
          h('span', { ...toProps(behavior.tag(tag, index)), key: tag }, [
            tag,
            h('button', toProps(behavior.remove(tag)), [h(Icon, { name: 'close', size: 11 })]),
          ]),
        ),
        h('input', toProps(behavior.input)),
      ]);
    };
  },
});

export const InputOtp = defineComponent({
  name: 'IInputOtp',
  props: {
    modelValue: { type: String as PropType<string | undefined>, default: undefined },
    defaultValue: { type: String, default: '' },
    length: { type: Number, default: 6 },
    mask: Boolean,
    disabled: Boolean,
  },
  emits: ['update:modelValue', 'complete'],
  setup(props, { emit }) {
    const state = useControlled(() => props.modelValue, props.defaultValue);

    return () => {
      const behavior = useInputOtp({
        value: state.value.value,
        length: props.length,
        mask: props.mask,
        disabled: props.disabled,
        onChange: (next: string) => {
          state.set(next);
          emit('update:modelValue', next);
        },
        onComplete: (next: string) => emit('complete', next),
      });

      return h('div', toProps(behavior.root), [
        ...behavior.cells.map((digit, index) =>
          h('span', { ...toProps(behavior.cell(index)), key: index }, digit ? (props.mask ? '•' : digit) : ''),
        ),
        h('input', toProps(behavior.input)),
      ]);
    };
  },
});

export const Countdown = defineComponent({
  name: 'ICountdown',
  props: {
    to: { type: Number, required: true },
    format: { type: String, default: 'HH:mm:ss' },
    label: String,
  },
  emits: ['finish'],
  setup(props, { emit }) {
    const remaining = ref(props.to - Date.now());
    let timer: ReturnType<typeof setInterval> | undefined;
    let finished = false;

    const tick = (): void => {
      remaining.value = props.to - Date.now();
      if (remaining.value <= 0 && !finished) {
        finished = true;
        emit('finish');
      }
    };

    onMounted(() => {
      tick();
      timer = setInterval(tick, 1000);
    });
    onBeforeUnmount(() => timer && clearInterval(timer));
    watch(() => props.to, () => {
      finished = false;
      tick();
    });

    return () =>
      h('div', { class: 'i-statistic' }, [
        props.label ? h('div', { class: 'i-statistic__label' }, props.label) : null,
        h('div', { class: 'i-statistic__value' }, formatCountdown(remaining.value, props.format)),
      ]);
  },
});
