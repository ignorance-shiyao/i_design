import { describe, expect, it, vi } from 'vitest';
import {
  activeSection, clampNumber, formatBytes, formatStatistic, roundTo,
  useInputNumber, useMenu, useRate, useSegmented, useSlider, useTree, useTypography, useUpload,
} from '@i-design/core';

const key = (k: string) => ({ key: k, preventDefault: vi.fn() });

describe('input number', () => {
  it('rounds away float noise', () => {
    expect(roundTo(0.1 + 0.2, 2)).toBe(0.3);
    expect(clampNumber(12, 0, 10)).toBe(10);
  });

  it('infers precision from the step', () => {
    const onChange = vi.fn();
    useInputNumber({ value: 0.1, step: 0.2, onChange }).increase.on.click!({});
    expect(onChange).toHaveBeenCalledWith(0.3);
  });

  it('clamps on arrow keys and reports spinbutton state', () => {
    const onChange = vi.fn();
    const behavior = useInputNumber({ value: 9, min: 0, max: 10, onChange });
    behavior.input.on.keydown!(key('ArrowUp'));
    expect(onChange).toHaveBeenLastCalledWith(10);
    behavior.input.on.keydown!(key('ArrowUp'));
    expect(onChange).toHaveBeenLastCalledWith(10);
    expect(behavior.input.attrs.role).toBe('spinbutton');
    expect(behavior.input.attrs['aria-valuemax']).toBe(10);
  });

  it('does not clamp mid-typing', () => {
    const onChange = vi.fn();
    // Typing "1" on the way to "15" must not jump to the minimum of 10.
    useInputNumber({ value: null, min: 10, max: 20, onChange }).input.on.input!({ target: { value: '1' } });
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('disables the step buttons at the bounds', () => {
    expect(useInputNumber({ value: 10, max: 10 }).increase.attrs.disabled).toBe(true);
    expect(useInputNumber({ value: 0, min: 0 }).decrease.attrs.disabled).toBe(true);
  });
});

describe('slider', () => {
  it('snaps a pointer position to the step grid', () => {
    const behavior = useSlider({ value: 0, min: 0, max: 100, step: 25 });
    expect(behavior.valueAt(0.3)).toBe(25);
    expect(behavior.valueAt(0.99)).toBe(100);
    expect(behavior.valueAt(-1)).toBe(0);
  });

  it('keeps Up increasing on a vertical track', () => {
    const onChange = vi.fn();
    const behavior = useSlider({ value: 50, orientation: 'vertical', onChange });
    behavior.handle.on.keydown!(key('ArrowUp'));
    expect(onChange).toHaveBeenCalledWith(51);
    behavior.handle.on.keydown!(key('ArrowDown'));
    expect(onChange).toHaveBeenLastCalledWith(49);
  });

  it('exposes value text to assistive tech', () => {
    const behavior = useSlider({ value: 40, format: (v) => `${v}%` });
    expect(behavior.handle.attrs['aria-valuetext']).toBe('40%');
  });
});

describe('rate', () => {
  it('clicking the current value clears it', () => {
    const onChange = vi.fn();
    useRate({ value: 3, onChange }).item(3).on.click!({});
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('half steps come from the arrow keys too', () => {
    const onChange = vi.fn();
    useRate({ value: 3, allowHalf: true, onChange }).root.on.keydown!(key('ArrowRight'));
    expect(onChange).toHaveBeenCalledWith(3.5);
  });

  it('reports per-star state', () => {
    const behavior = useRate({ value: 2.5, allowHalf: true });
    expect(behavior.stateOf(2)).toBe('full');
    expect(behavior.stateOf(3)).toBe('half');
    expect(behavior.stateOf(4)).toBe('empty');
  });
});

describe('upload', () => {
  const file = (name: string, size = 100, type = 'image/png') => ({ name, size, type }) as File;

  it('applies accept, size and count limits before any request', () => {
    const behavior = useUpload({ files: [], accept: '.png,image/*', maxSize: 500, maxCount: 2 });
    const { accepted, rejected } = behavior.accept([
      file('a.png'), file('b.png', 900), file('c.pdf', 10, 'application/pdf'), file('d.png'), file('e.png'),
    ]);
    expect(accepted.map((f) => f.name)).toEqual(['a.png', 'd.png']);
    expect(rejected.map((r) => r.reason)).toEqual(['size', 'accept', 'count']);
  });

  it('knows when the list is full', () => {
    const existing = [{ uid: '1', name: 'a', status: 'success' as const }];
    expect(useUpload({ files: existing, maxCount: 1 }).full).toBe(true);
    expect(useUpload({ files: existing, maxCount: 2 }).full).toBe(false);
  });

  it('formats sizes the same way for both adapters', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(15 * 1024 * 1024)).toBe('15 MB');
  });
});

describe('menu', () => {
  const items = [
    { value: 'a', label: 'A' },
    { value: 'group', label: 'G', children: [{ value: 'b', label: 'B' }] },
  ];

  it('only walks into expanded submenus', () => {
    expect(useMenu({ items, id: 'm', expanded: [] }).visible.map((v) => v.item.value)).toEqual(['a', 'group']);
    expect(useMenu({ items, id: 'm', expanded: ['group'] }).visible.map((v) => v.item.value)).toEqual(['a', 'group', 'b']);
  });

  it('wires submenu aria', () => {
    const behavior = useMenu({ items, id: 'm', expanded: ['group'] });
    const trigger = behavior.submenuTrigger(items[1]!, 0);
    expect(trigger.attrs['aria-haspopup']).toBe('menu');
    expect(trigger.attrs['aria-expanded']).toBe(true);
    expect(trigger.attrs['aria-controls']).toBe('m-group');
  });

  it('popup mode never expands inline', () => {
    const behavior = useMenu({ items, id: 'm', expanded: ['group'], mode: 'popup' });
    expect(behavior.visible.map((v) => v.item.value)).toEqual(['a', 'group']);
  });
});

describe('tree', () => {
  const nodes = [
    { key: 'src', label: 'src', children: [{ key: 'a', label: 'a.ts' }, { key: 'b', label: 'b.ts' }] },
    { key: 'readme', label: 'README' },
  ];

  it('flattens only what is visible', () => {
    expect(useTree({ nodes, expanded: [] }).rows.map((r) => r.node.key)).toEqual(['src', 'readme']);
    expect(useTree({ nodes, expanded: ['src'] }).rows.map((r) => r.node.key)).toEqual(['src', 'a', 'b', 'readme']);
  });

  it('checking a branch checks every descendant', () => {
    const onCheckedChange = vi.fn();
    const behavior = useTree({ nodes, expanded: ['src'], checkable: true, checked: [], onCheckedChange });
    behavior.checkbox(behavior.rows[0]!).toggle();
    expect(onCheckedChange.mock.calls[0]![0].sort()).toEqual(['a', 'b', 'src']);
  });

  it('a partially checked branch is indeterminate', () => {
    const behavior = useTree({ nodes, expanded: ['src'], checkable: true, checked: ['a'] });
    const box = behavior.checkbox(behavior.rows[0]!);
    expect(box.checked).toBe(false);
    expect(box.indeterminate).toBe(true);
  });

  it('sets aria-level from depth, 1-based', () => {
    const behavior = useTree({ nodes, expanded: ['src'] });
    expect(behavior.row(behavior.rows[0]!).attrs['aria-level']).toBe(1);
    expect(behavior.row(behavior.rows[1]!).attrs['aria-level']).toBe(2);
    // Only expandable rows carry aria-expanded.
    expect(behavior.row(behavior.rows[1]!).attrs['aria-expanded']).toBeUndefined();
  });
});

describe('anchor', () => {
  const positions = [{ id: 'a', top: 0 }, { id: 'b', top: 500 }, { id: 'c', top: 1200 }];

  it('picks the last section whose top has passed the offset line', () => {
    expect(activeSection(positions, 0, 80)).toBe('a');
    expect(activeSection(positions, 460, 80)).toBe('b');
    expect(activeSection(positions, 2000, 80)).toBe('c');
  });
});

describe('segmented and typography', () => {
  const options = [{ value: 'a' }, { value: 'b', disabled: true }, { value: 'c' }];

  it('arrow keys skip disabled segments', () => {
    const onChange = vi.fn();
    useSegmented({ options, value: 'a', onChange }).root.on.keydown!(key('ArrowRight'));
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('only the active segment is a tab stop', () => {
    const behavior = useSegmented({ options, value: 'c' });
    expect(behavior.item(options[0]!).attrs.tabindex).toBe(-1);
    expect(behavior.item(options[2]!).attrs.tabindex).toBe(0);
  });

  it('chooses the tag from the role and clamps by line count', () => {
    expect(useTypography({ as: 'title', level: 2 }).tag).toBe('h2');
    expect(useTypography({ as: 'paragraph' }).tag).toBe('p');
    expect(useTypography({ ellipsis: 3 }).style['--i-typography-lines']).toBe('3');
    expect(useTypography({ ellipsis: 1 }).root.class).toContain('ellipsis');
  });

  it('groups digits without touching the fraction', () => {
    expect(formatStatistic(1234567.891, 2)).toBe('1,234,567.89');
    expect(formatStatistic(1234, undefined, '')).toBe('1234');
    expect(formatStatistic('N/A')).toBe('N/A');
  });
});
