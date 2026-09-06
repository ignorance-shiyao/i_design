import {
  createId, startOfDay, useDatePicker, type DatePickerOptions,
} from '@i-design/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toProps, useControlled } from '../utils.js';
import { Icon } from './Icon.js';

export interface DatePickerProps
  extends Omit<DatePickerOptions, 'value' | 'viewDate' | 'open' | 'onChange' | 'onViewChange' | 'onOpenChange' | 'extraClass'> {
  value?: Date | null;
  defaultValue?: Date | null;
  className?: string;
  onChange?: (value: Date | null) => void;
}

export function DatePicker(props: DatePickerProps) {
  const { value: controlled, defaultValue = null, className, onChange, ...rest } = props;
  const id = useMemo(() => createId('i-date'), []);
  const [value, setValue] = useControlled<Date | null>(controlled, defaultValue);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => value ?? startOfDay(new Date()));
  const root = useRef<HTMLDivElement>(null);

  // Clicking outside closes the panel; the trigger keeps focus for the keyboard.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const behavior = useDatePicker({
    ...rest, id, value, viewDate, open,
    onChange: (next) => {
      setValue(next);
      onChange?.(next);
    },
    onViewChange: setViewDate,
    onOpenChange: (next) => {
      setOpen(next);
      if (next) setViewDate(value ?? startOfDay(new Date()));
    },
    extraClass: className,
  });

  return (
    <div ref={root} {...toProps(behavior.root)}>
      <button {...toProps(behavior.trigger)}>
        <Icon name="calendar" size={15} />
        <span className={`i-date-picker__value${value ? '' : ' i-date-picker__value--placeholder'}`}>
          {behavior.displayValue || behavior.placeholder}
        </span>
        {behavior.clear && (
          <span {...toProps(behavior.clear)} role="button">
            <Icon name="close" size={11} />
          </span>
        )}
      </button>

      {open && (
        <div {...toProps(behavior.panel)}>
          <div {...toProps(behavior.header)}>
            <button {...toProps(behavior.prevYear)}><Icon name="chevron-left" size={14} /><Icon name="chevron-left" size={14} /></button>
            <button {...toProps(behavior.prevMonth)}><Icon name="chevron-left" size={15} /></button>
            <span className="i-date-picker__month">{behavior.monthLabel}</span>
            <button {...toProps(behavior.nextMonth)}><Icon name="chevron-right" size={15} /></button>
            <button {...toProps(behavior.nextYear)}><Icon name="chevron-right" size={14} /><Icon name="chevron-right" size={14} /></button>
          </div>

          <div className="i-date-picker__weekdays">
            {behavior.weekdayLabels.map((label) => (
              <span className="i-date-picker__weekday" key={label}>{label}</span>
            ))}
          </div>

          <div {...toProps(behavior.grid)}>
            {behavior.weeks.map((week, index) => (
              <div className="i-date-picker__week" key={index}>
                {week.map((cell) => (
                  <button key={cell.date.toISOString()} {...toProps(behavior.cell(cell))}>
                    {cell.date.getDate()}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


