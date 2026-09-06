import { describe, expect, it, vi } from 'vitest';
import {
  ICONS, addDays, addMonths, formatDate, isSameDay, parseDate, startOfDay,
  useDatePicker, useIcon, usePopconfirm,
} from '@i-design/core';

describe('icon set', () => {
  it('every icon has at least one path and no empty entries', () => {
    for (const [name, paths] of Object.entries(ICONS)) {
      expect(paths.length, name).toBeGreaterThan(0);
      for (const d of paths) expect(d.trim(), name).not.toBe('');
    }
  });

  it('is decorative by default and labelled on request', () => {
    expect(useIcon({ name: 'check' }).root.attrs['aria-hidden']).toBe(true);
    const labelled = useIcon({ name: 'check', label: '完成' });
    expect(labelled.root.attrs['aria-hidden']).toBeUndefined();
    expect(labelled.root.attrs.role).toBe('img');
  });

  it('scales the box, and spins the loading icon by default', () => {
    expect(useIcon({ name: 'close', size: 24 }).root.attrs.width).toBe(24);
    expect(useIcon({ name: 'loading' }).root.class).toContain('spin');
    expect(useIcon({ name: 'close' }).root.class).not.toContain('spin');
  });
});

describe('date maths', () => {
  it('clamps the day when a month is shorter', () => {
    // 1月31日 + 1 month must land on 2月28/29日, not roll into March.
    expect(formatDate(addMonths(new Date(2026, 0, 31), 1))).toBe('2026-02-28');
    expect(formatDate(addMonths(new Date(2024, 0, 31), 1))).toBe('2024-02-29');
    expect(formatDate(addMonths(new Date(2026, 2, 15), -1))).toBe('2026-02-15');
  });

  it('compares by calendar day, not timestamp', () => {
    expect(isSameDay(new Date(2026, 8, 6, 23, 59), new Date(2026, 8, 6, 0, 1))).toBe(true);
    expect(isSameDay(new Date(2026, 8, 6), new Date(2026, 8, 7))).toBe(false);
    expect(isSameDay(null, new Date())).toBe(false);
  });

  it('rejects impossible dates instead of rolling them forward', () => {
    expect(formatDate(parseDate('2026-02-31'))).toBe('');
    expect(formatDate(parseDate('2026-2-3'))).toBe('2026-02-03');
    expect(parseDate('not a date')).toBeNull();
  });

  it('crosses month and year boundaries', () => {
    expect(formatDate(addDays(new Date(2026, 11, 31), 1))).toBe('2027-01-01');
    expect(formatDate(startOfDay(new Date(2026, 8, 6, 18, 30)))).toBe('2026-09-06');
  });
});

describe('date picker', () => {
  const view = new Date(2026, 8, 1);

  it('always lays out six rows of seven, so the panel never resizes', () => {
    const behavior = useDatePicker({ value: null, viewDate: view });
    expect(behavior.weeks).toHaveLength(6);
    for (const week of behavior.weeks) expect(week).toHaveLength(7);
  });

  it('honours the week start', () => {
    expect(useDatePicker({ value: null, viewDate: view, weekStart: 1 }).weekdayLabels[0]).toBe('一');
    expect(useDatePicker({ value: null, viewDate: view, weekStart: 0 }).weekdayLabels[0]).toBe('日');
  });

  it('marks padding days as outside the current month', () => {
    const behavior = useDatePicker({ value: null, viewDate: view, weekStart: 1 });
    const first = behavior.weeks[0]![0]!;
    expect(first.current).toBe(false);
    expect(behavior.weeks[2]![0]!.current).toBe(true);
  });

  it('disables dates outside min/max and refuses to select them', () => {
    const onChange = vi.fn();
    const behavior = useDatePicker({
      value: null, viewDate: view, min: new Date(2026, 8, 10), max: new Date(2026, 8, 20), onChange,
    });
    const early = behavior.weeks.flat().find((cell) => formatDate(cell.date) === '2026-09-05')!;
    expect(early.disabled).toBe(true);
    behavior.cell(early).on.click!({});
    expect(onChange).not.toHaveBeenCalled();
  });

  it('arrow keys walk days and pull the view along', () => {
    const onChange = vi.fn();
    const onViewChange = vi.fn();
    const behavior = useDatePicker({
      value: new Date(2026, 8, 1), viewDate: view, onChange, onViewChange,
    });
    behavior.grid.on.keydown!({ key: 'ArrowLeft', preventDefault() {} });
    expect(formatDate(onChange.mock.calls[0]![0])).toBe('2026-08-31');
    // Stepping out of the month scrolls the panel to follow.
    expect(onViewChange).toHaveBeenCalled();
  });

  it('keeps one tab stop in the grid', () => {
    const behavior = useDatePicker({ value: new Date(2026, 8, 15), viewDate: view });
    const stops = behavior.weeks.flat().filter((cell) => behavior.cell(cell).attrs.tabindex === 0);
    expect(stops).toHaveLength(1);
  });
});

describe('popconfirm', () => {
  it('is an alertdialog that is not modal', () => {
    const behavior = usePopconfirm({ open: true, id: 'p' });
    expect(behavior.panel.attrs.role).toBe('alertdialog');
    expect(behavior.panel.attrs['aria-modal']).toBe(false);
  });

  it('Escape cancels', () => {
    const onCancel = vi.fn();
    usePopconfirm({ open: true, id: 'p', onCancel }).panel.on.keydown!({ key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
  });
});
