import { createId, startOfDay, useDatePicker, type Size } from '@i-design/core';
import { defineComponent, h, onBeforeUnmount, ref, watch, type PropType } from 'vue';
import { toProps, useControlled } from '../utils.js';
import { Icon } from './Icon.js';

export const DatePicker = defineComponent({
  name: 'IDatePicker',
  props: {
    modelValue: { type: Date as PropType<Date | null | undefined>, default: undefined },
    defaultValue: { type: Date as PropType<Date | null>, default: null },
    weekStart: { type: Number as PropType<0 | 1>, default: 1 },
    min: Date,
    max: Date,
    disabledDate: Function as PropType<(date: Date) => boolean>,
    size: { type: String as PropType<Size>, default: 'm' },
    status: { type: String as PropType<'default' | 'success' | 'warning' | 'danger'>, default: 'default' },
    placeholder: String,
    format: { type: String, default: 'YYYY-MM-DD' },
    disabled: Boolean,
    clearable: Boolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const id = createId('i-date');
    const state = useControlled<Date | null>(() => props.modelValue, props.defaultValue);
    const open = ref(false);
    const viewDate = ref(state.value.value ?? startOfDay(new Date()));
    const root = ref<HTMLElement | null>(null);

    const onPointerDown = (event: PointerEvent): void => {
      if (!root.value?.contains(event.target as Node)) open.value = false;
    };
    watch(open, (next) => {
      if (next) document.addEventListener('pointerdown', onPointerDown);
      else document.removeEventListener('pointerdown', onPointerDown);
    });
    onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown));

    return () => {
      const behavior = useDatePicker({
        ...props,
        id,
        value: state.value.value,
        viewDate: viewDate.value,
        open: open.value,
        onChange: (next: Date | null) => {
          state.set(next);
          emit('update:modelValue', next);
          emit('change', next);
        },
        onViewChange: (next: Date) => (viewDate.value = next),
        onOpenChange: (next: boolean) => {
          open.value = next;
          if (next) viewDate.value = state.value.value ?? startOfDay(new Date());
        },
      });

      return h('div', { ...toProps(behavior.root), ref: root }, [
        h('button', toProps(behavior.trigger), [
          h(Icon, { name: 'calendar', size: 15 }),
          h(
            'span',
            { class: `i-date-picker__value${state.value.value ? '' : ' i-date-picker__value--placeholder'}` },
            behavior.displayValue || behavior.placeholder,
          ),
          behavior.clear
            ? h('span', { ...toProps(behavior.clear), role: 'button' }, [h(Icon, { name: 'close', size: 11 })])
            : null,
        ]),
        open.value
          ? h('div', toProps(behavior.panel), [
              h('div', toProps(behavior.header), [
                h('button', toProps(behavior.prevYear), [
                  h(Icon, { name: 'chevron-left', size: 14 }),
                  h(Icon, { name: 'chevron-left', size: 14 }),
                ]),
                h('button', toProps(behavior.prevMonth), [h(Icon, { name: 'chevron-left', size: 15 })]),
                h('span', { class: 'i-date-picker__month' }, behavior.monthLabel),
                h('button', toProps(behavior.nextMonth), [h(Icon, { name: 'chevron-right', size: 15 })]),
                h('button', toProps(behavior.nextYear), [
                  h(Icon, { name: 'chevron-right', size: 14 }),
                  h(Icon, { name: 'chevron-right', size: 14 }),
                ]),
              ]),
              h(
                'div',
                { class: 'i-date-picker__weekdays' },
                behavior.weekdayLabels.map((label) => h('span', { class: 'i-date-picker__weekday' }, label)),
              ),
              h(
                'div',
                toProps(behavior.grid),
                behavior.weeks.map((week) =>
                  h(
                    'div',
                    { class: 'i-date-picker__week' },
                    week.map((cell) => h('button', toProps(behavior.cell(cell)), String(cell.date.getDate()))),
                  ),
                ),
              ),
            ])
          : null,
      ]);
    };
  },
});
