import { createBem, cx } from '../classnames.js';
import { spec, type ElementSpec, type Size } from './types.js';

const bem = createBem('date-picker');

/**
 * Date handling without a date library.
 *
 * Everything here works on local-time `Date` objects and compares by
 * year/month/day rather than by timestamp, which is what avoids the classic
 * off-by-one when a timezone offset pushes midnight across a boundary.
 */
export const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const isSameDay = (a: Date | null, b: Date | null): boolean =>
  Boolean(a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate());

export const isSameMonth = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const addMonths = (date: Date, months: number): Date => {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  // Clamp the day: 1月31日 + 1 month must land on 2月28/29日, not 3月3日.
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
};

export function formatDate(date: Date | null, pattern = 'YYYY-MM-DD'): string {
  if (!date) return '';
  const pad = (value: number, length = 2): string => String(value).padStart(length, '0');
  return pattern
    .replace('YYYY', String(date.getFullYear()))
    .replace('MM', pad(date.getMonth() + 1))
    .replace('DD', pad(date.getDate()))
    .replace('HH', pad(date.getHours()))
    .replace('mm', pad(date.getMinutes()));
}

export function parseDate(text: string): Date | null {
  const match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(text.trim());
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  // Reject 2026-02-31: the Date constructor would roll it forward silently.
  return date.getMonth() === Number(month) - 1 ? date : null;
}

export interface CalendarCell {
  date: Date;
  /** Belongs to the month being displayed, rather than the padding weeks. */
  current: boolean;
  today: boolean;
  selected: boolean;
  disabled: boolean;
  /** Between the two ends of a range selection. */
  inRange: boolean;
}

export interface DatePickerOptions {
  value: Date | null;
  /** The month on screen; separate from the selection so browsing is free. */
  viewDate: Date;
  open?: boolean;
  /** 0 = Sunday, 1 = Monday. Locale-dependent, so it is a prop, not a constant. */
  weekStart?: 0 | 1;
  min?: Date;
  max?: Date;
  disabledDate?: (date: Date) => boolean;
  size?: Size;
  status?: 'default' | 'success' | 'warning' | 'danger';
  placeholder?: string;
  format?: string;
  disabled?: boolean;
  clearable?: boolean;
  id?: string;
  onChange?: (value: Date | null) => void;
  onViewChange?: (view: Date) => void;
  onOpenChange?: (open: boolean) => void;
  extraClass?: string;
}

export interface DatePickerBehavior {
  root: ElementSpec;
  trigger: ElementSpec;
  panel: ElementSpec;
  header: ElementSpec;
  prevMonth: ElementSpec;
  nextMonth: ElementSpec;
  prevYear: ElementSpec;
  nextYear: ElementSpec;
  grid: ElementSpec;
  cell: (cell: CalendarCell) => ElementSpec;
  clear: ElementSpec | null;
  /** 6 rows × 7 days, always — a fixed grid stops the panel resizing per month. */
  weeks: CalendarCell[][];
  weekdayLabels: string[];
  monthLabel: string;
  displayValue: string;
  placeholder: string;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function useDatePicker(options: DatePickerOptions): DatePickerBehavior {
  const {
    value, viewDate, open = false, weekStart = 1, min, max, disabledDate,
    size = 'm', status = 'default', placeholder, format = 'YYYY-MM-DD',
    disabled, clearable, id, onChange, onViewChange, onOpenChange, extraClass,
  } = options;

  const today = startOfDay(new Date());

  const isDisabled = (date: Date): boolean => {
    if (min && startOfDay(date) < startOfDay(min)) return true;
    if (max && startOfDay(date) > startOfDay(max)) return true;
    return Boolean(disabledDate?.(date));
  };

  // Always six rows, so the panel never changes height between months.
  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const leading = (firstOfMonth.getDay() - weekStart + 7) % 7;
  const gridStart = addDays(firstOfMonth, -leading);

  const weeks: CalendarCell[][] = [];
  for (let row = 0; row < 6; row += 1) {
    const week: CalendarCell[] = [];
    for (let column = 0; column < 7; column += 1) {
      const date = addDays(gridStart, row * 7 + column);
      week.push({
        date,
        current: isSameMonth(date, viewDate),
        today: isSameDay(date, today),
        selected: isSameDay(date, value),
        disabled: isDisabled(date),
        inRange: false,
      });
    }
    weeks.push(week);
  }

  const select = (date: Date): void => {
    if (isDisabled(date)) return;
    onChange?.(startOfDay(date));
    onOpenChange?.(false);
  };

  const navButton = (months: number, years: number, label: string): ElementSpec =>
    spec(
      cx(bem('nav')),
      { type: 'button', 'aria-label': label },
      { click: () => onViewChange?.(addMonths(viewDate, months + years * 12)) },
    );

  return {
    weeks,
    weekdayLabels: Array.from({ length: 7 }, (_, index) => WEEKDAYS[(index + weekStart) % 7]!),
    monthLabel: `${viewDate.getFullYear()} 年 ${viewDate.getMonth() + 1} 月`,
    displayValue: formatDate(value, format),
    root: spec(
      cx(bem(), bem(null, `size-${size}`), bem(null, `status-${status}`), {
        [bem(null, 'open')]: open,
        [bem(null, 'disabled')]: disabled,
      }, extraClass),
    ),
    trigger: spec(
      bem('trigger'),
      {
        type: 'button',
        role: 'combobox',
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
        'aria-controls': `${id}-panel`,
        disabled: disabled || undefined,
      },
      {
        click: () => !disabled && onOpenChange?.(!open),
        keydown: (event: any) => {
          const key = String(event?.key ?? '');
          if (key === 'Escape' && open) onOpenChange?.(false);
          else if ((key === 'ArrowDown' || key === 'Enter') && !open) {
            event.preventDefault?.();
            onOpenChange?.(true);
          }
        },
      },
    ),
    panel: spec(bem('panel'), { id: `${id}-panel`, role: 'dialog', 'aria-label': '选择日期' }),
    header: spec(bem('header')),
    prevYear: navButton(0, -1, 'previous year'),
    prevMonth: navButton(-1, 0, 'previous month'),
    nextMonth: navButton(1, 0, 'next month'),
    nextYear: navButton(0, 1, 'next year'),
    grid: spec(
      bem('grid'),
      { role: 'grid' },
      {
        keydown: (event: any) => {
          const key = String(event?.key ?? '');
          const anchor = value ?? viewDate;
          const move = (days: number): void => {
            event.preventDefault?.();
            const next = addDays(anchor, days);
            onChange?.(next);
            if (!isSameMonth(next, viewDate)) onViewChange?.(next);
          };
          if (key === 'ArrowLeft') move(-1);
          else if (key === 'ArrowRight') move(1);
          else if (key === 'ArrowUp') move(-7);
          else if (key === 'ArrowDown') move(7);
          else if (key === 'PageUp') { event.preventDefault?.(); onViewChange?.(addMonths(viewDate, -1)); }
          else if (key === 'PageDown') { event.preventDefault?.(); onViewChange?.(addMonths(viewDate, 1)); }
          else if (key === 'Escape') onOpenChange?.(false);
        },
      },
    ),
    cell: (cell) =>
      spec(
        cx(bem('cell'), {
          [bem('cell', 'outside')]: !cell.current,
          [bem('cell', 'today')]: cell.today,
          [bem('cell', 'selected')]: cell.selected,
          [bem('cell', 'disabled')]: cell.disabled,
        }),
        {
          type: 'button',
          role: 'gridcell',
          // One tab stop for the whole grid; arrows move within it.
          tabindex: cell.selected || (!value && cell.today) ? 0 : -1,
          'aria-selected': cell.selected,
          'aria-disabled': cell.disabled || undefined,
          'aria-current': cell.today ? 'date' : undefined,
          'data-date': formatDate(cell.date),
          disabled: cell.disabled || undefined,
        },
        { click: () => select(cell.date) },
      ),
    clear:
      clearable && value && !disabled
        ? spec(
            bem('clear'),
            { type: 'button', tabindex: -1, 'aria-label': 'clear' },
            {
              pointerdown: (event: any) => {
                event.preventDefault?.();
                event.stopPropagation?.();
                onChange?.(null);
              },
            },
          )
        : null,
    placeholder: placeholder ?? '选择日期',
  };
}
