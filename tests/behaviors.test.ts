import { describe, expect, it, vi } from 'vitest';
import {
  initialsOf, pageRange, useBadge, usePagination, useProgress, useRadioGroup,
  useRoving, useSelect, useTabs, useTextareaBehavior,
} from '@i-design/core';

const key = (k: string) => ({ key: k, preventDefault: vi.fn(), stopPropagation: vi.fn() });

describe('roving focus', () => {
  const items = [{ value: 'a' }, { value: 'b', disabled: true }, { value: 'c' }];

  it('skips disabled items with the arrow keys', () => {
    const onChange = vi.fn();
    useRoving({ items, value: 'a', onChange }).onKeydown(key('ArrowRight'));
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('wraps around when looping, and clamps when not', () => {
    const looped = vi.fn();
    useRoving({ items, value: 'c', onChange: looped }).onKeydown(key('ArrowRight'));
    expect(looped).toHaveBeenCalledWith('a');

    const clamped = vi.fn();
    useRoving({ items, value: 'c', loop: false, onChange: clamped }).onKeydown(key('ArrowRight'));
    expect(clamped).toHaveBeenCalledWith('c');
  });

  it('Home and End jump to the first and last enabled item', () => {
    const onChange = vi.fn();
    const roving = useRoving({ items, value: 'c', onChange });
    roving.onKeydown(key('Home'));
    expect(onChange).toHaveBeenLastCalledWith('a');
    roving.onKeydown(key('End'));
    expect(onChange).toHaveBeenLastCalledWith('c');
  });

  it('exposes exactly one tab stop', () => {
    const roving = useRoving({ items, value: 'c' });
    const tabindexes = items.map((item, index) => roving.itemProps(item, index).attrs.tabindex);
    expect(tabindexes.filter((t) => t === 0)).toHaveLength(1);
  });

  it('vertical orientation listens to ArrowDown, not ArrowRight', () => {
    const onChange = vi.fn();
    const roving = useRoving({ items, value: 'a', orientation: 'vertical', onChange });
    roving.onKeydown(key('ArrowRight'));
    expect(onChange).not.toHaveBeenCalled();
    roving.onKeydown(key('ArrowDown'));
    expect(onChange).toHaveBeenCalledWith('c');
  });
});

describe('select combobox', () => {
  const options = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana', disabled: true },
    { value: 'cherry', label: 'Cherry' },
  ];
  const base = { options, id: 'sel', value: null, open: false, activeIndex: -1 };

  it('opens on ArrowDown and highlights the first enabled option', () => {
    const onOpenChange = vi.fn();
    const onActiveIndexChange = vi.fn();
    useSelect({ ...base, onOpenChange, onActiveIndexChange }).trigger.on.keydown!(key('ArrowDown'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(onActiveIndexChange).toHaveBeenCalledWith(0);
  });

  it('type-ahead jumps to the matching option', () => {
    const onActiveIndexChange = vi.fn();
    useSelect({ ...base, open: true, activeIndex: 0, onActiveIndexChange }).trigger.on.keydown!(key('c'));
    expect(onActiveIndexChange).toHaveBeenCalledWith(2);
  });

  it('Enter commits the highlighted option and closes', () => {
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    useSelect({ ...base, open: true, activeIndex: 2, onChange, onOpenChange }).trigger.on.keydown!(key('Enter'));
    expect(onChange).toHaveBeenCalledWith('cherry');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('never commits a disabled option', () => {
    const onChange = vi.fn();
    useSelect({ ...base, open: true, activeIndex: 1, onChange }).trigger.on.keydown!(key('Enter'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('wires aria-activedescendant only while open', () => {
    expect(useSelect({ ...base, open: true, activeIndex: 2 }).trigger.attrs['aria-activedescendant']).toBe('sel-option-2');
    expect(useSelect({ ...base, activeIndex: 2 }).trigger.attrs['aria-activedescendant']).toBeUndefined();
  });

  it('shows the clear affordance only when something is selected', () => {
    expect(useSelect({ ...base, clearable: true }).clear).toBeNull();
    expect(useSelect({ ...base, clearable: true, value: 'apple' }).clear).not.toBeNull();
  });
});

describe('tabs', () => {
  const items = [{ value: 'one' }, { value: 'two' }];

  it('pairs each tab with its panel through aria', () => {
    const tabs = useTabs({ items, value: 'one', id: 't' });
    expect(tabs.tab(items[0]!, 0).attrs['aria-controls']).toBe('t-panel-one');
    expect(tabs.panel('one').attrs['aria-labelledby']).toBe('t-tab-one');
    expect(tabs.tab(items[0]!, 0).attrs['aria-selected']).toBe(true);
    expect(tabs.tab(items[1]!, 1).attrs['aria-selected']).toBe(false);
  });
});

describe('radio group', () => {
  const options = [{ value: 'a' }, { value: 'b' }];

  it('is a single tab stop with radiogroup semantics', () => {
    const group = useRadioGroup({ options, value: 'b', name: 'g' });
    expect(group.root.attrs.role).toBe('radiogroup');
    expect(group.input(options[0]!, 0).attrs.tabindex).toBe(-1);
    expect(group.input(options[1]!, 1).attrs.tabindex).toBe(0);
  });

  it('a disabled group emits nothing', () => {
    const onChange = vi.fn();
    const group = useRadioGroup({ options, value: 'a', name: 'g', disabled: true, onChange });
    group.input(options[1]!, 1).on.change!({});
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('pagination', () => {
  it('produces the ellipsis pattern around the current page', () => {
    expect(pageRange({ current: 6, total: 20 })).toEqual([1, 'ellipsis', 5, 6, 7, 'ellipsis', 20]);
    expect(pageRange({ current: 1, total: 5 })).toEqual([1, 2, 3, 4, 5]);
    expect(pageRange({ current: 2, total: 20 })).toEqual([1, 2, 3, 'ellipsis', 20]);
  });

  it('clamps out-of-range pages and disables the edge buttons', () => {
    const pager = usePagination({ current: 99, total: 45, pageSize: 10 });
    expect(pager.pageCount).toBe(5);
    expect(pager.current).toBe(5);
    expect(pager.next.attrs.disabled).toBe(true);
    expect(pager.prev.attrs.disabled).toBeUndefined();
  });

  it('does not emit when clicking the page you are already on', () => {
    const onChange = vi.fn();
    usePagination({ current: 3, total: 100, onChange }).page(3).on.click!({});
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('display helpers', () => {
  it('clamps progress and reports it to assistive tech', () => {
    expect(useProgress({ value: 150 }).percent).toBe(100);
    expect(useProgress({ value: -10 }).percent).toBe(0);
    expect(useProgress({ value: 30, max: 60 }).root.attrs['aria-valuenow']).toBe(30);
  });

  it('caps the badge count and hides an empty badge', () => {
    expect(useBadge({ count: 150 }).text).toBe('99+');
    expect(useBadge({ count: 0 }).visible).toBe(false);
    expect(useBadge({ count: 0, showZero: true }).visible).toBe(true);
    expect(useBadge({ dot: true }).visible).toBe(true);
  });

  it('derives initials for latin and CJK names', () => {
    expect(initialsOf('Ada Lovelace')).toBe('AL');
    expect(initialsOf('Ada')).toBe('Ad');
    expect(initialsOf('张三')).toBe('张');
    expect(initialsOf('')).toBe('');
  });
});

describe('textarea autosize', () => {
  it('stays between minRows and maxRows', () => {
    const behavior = useTextareaBehavior({ autosize: true, minRows: 2, maxRows: 4 });
    expect(behavior.autosizeHeight(10, 20)).toBe(40);
    expect(behavior.autosizeHeight(1000, 20)).toBe(80);
    expect(behavior.autosizeHeight(60, 20)).toBe(60);
  });
});
