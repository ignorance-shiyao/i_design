import { describe, expect, it, vi } from 'vitest';
import {
  countdownParts, formatCountdown, formatTime, generateRamp, hexToRgb, hexToTriplet,
  hslToRgb, parseTime, resolvePath, rgbToHex, rgbToHsl,
  useAffix, useAutoComplete, useCascader, useColorPicker, useFloatButton, useImage,
  useInputOtp, useInputTag, useLink, useSplitter, useTimePicker, useTour, useTransfer,
  type CascaderNode, type TransferItem,
} from '@i-design/core';

const key = (k: string) => ({ key: k, preventDefault: vi.fn(), stopPropagation: vi.fn() });
const typed = (value: string) => ({ target: { value } });

/* --- Transfer ----------------------------------------------------------- */
const ITEMS: TransferItem[] = [
  { key: 'a', label: 'Alpha' },
  { key: 'b', label: 'Bravo' },
  { key: 'c', label: 'Charlie', disabled: true },
];

describe('transfer', () => {
  it('splits the items by which side they are on', () => {
    const behavior = useTransfer({ items: ITEMS, value: ['b'] });
    expect(behavior.source.items.map((item) => item.key)).toEqual(['a', 'c']);
    expect(behavior.target.items.map((item) => item.key)).toEqual(['b']);
  });

  it('moves only the ticked, enabled items and drops their ticks', () => {
    const onChange = vi.fn();
    const onCheckedChange = vi.fn();
    useTransfer({ items: ITEMS, value: [], checked: ['a', 'c'], onChange, onCheckedChange })
      .toTarget.on.click!({});
    expect(onChange).toHaveBeenCalledWith(['a']);
    // 'c' is disabled so it never moved; its tick therefore survives.
    expect(onCheckedChange).toHaveBeenCalledWith(['c']);
  });

  it('disables an arrow with nothing to move', () => {
    const behavior = useTransfer({ items: ITEMS, value: [], checked: [] });
    expect(behavior.toTarget.attrs.disabled).toBe(true);
    expect(behavior.toSource.attrs.disabled).toBe(true);
  });

  it('select-all is indeterminate on a partial tick and skips disabled rows', () => {
    const onCheckedChange = vi.fn();
    const behavior = useTransfer({ items: ITEMS, value: [], checked: ['a'], onCheckedChange });
    expect(behavior.source.selectAll.indeterminate).toBe(true);
    expect(behavior.source.selectAll.checked).toBe(false);
    behavior.source.selectAll.toggle();
    // Only 'a' and 'b' are selectable — 'c' is disabled.
    expect(onCheckedChange.mock.calls[0]![0]!.sort()).toEqual(['a', 'b']);
  });

  it('filters a panel by its own search keyword', () => {
    const behavior = useTransfer({ items: ITEMS, value: [], searchable: true, search: ['brav', ''] });
    expect(behavior.source.items.map((item) => item.key)).toEqual(['b']);
    expect(behavior.source.search).not.toBeNull();
  });
});

/* --- Cascader ----------------------------------------------------------- */
const TREE: CascaderNode[] = [
  {
    value: 'zj', label: '浙江',
    children: [
      { value: 'hz', label: '杭州', children: [{ value: 'xh', label: '西湖' }] },
      { value: 'nb', label: '宁波' },
    ],
  },
  { value: 'js', label: '江苏', disabled: true },
];

describe('cascader', () => {
  it('resolves a path to its nodes and stops at the first miss', () => {
    expect(resolvePath(TREE, ['zj', 'hz', 'xh']).map((node) => node.label)).toEqual(['浙江', '杭州', '西湖']);
    expect(resolvePath(TREE, ['zj', 'nope']).map((node) => node.label)).toEqual(['浙江']);
  });

  it('shows one column per browsed level that has children', () => {
    expect(useCascader({ options: TREE, value: [], id: 'c' }).columns).toHaveLength(1);
    expect(useCascader({ options: TREE, value: ['zj'], id: 'c' }).columns).toHaveLength(2);
    expect(useCascader({ options: TREE, value: ['zj', 'hz'], id: 'c' }).columns).toHaveLength(3);
    // A leaf adds no column.
    expect(useCascader({ options: TREE, value: ['zj', 'nb'], id: 'c' }).columns).toHaveLength(2);
  });

  it('commits only on a leaf, and closes when it does', () => {
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    const behavior = useCascader({ options: TREE, value: [], open: true, id: 'c', onChange, onOpenChange });
    behavior.option(TREE[0]!, 0).on.click!({});
    expect(onChange).not.toHaveBeenCalled();

    const inner = useCascader({ options: TREE, value: [], activePath: ['zj'], open: true, id: 'c', onChange, onOpenChange });
    inner.option(TREE[0]!.children![1]!, 1).on.click!({});
    expect(onChange).toHaveBeenCalledWith(['zj', 'nb'], ['浙江', '宁波']);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('changeOnSelect commits a branch without closing', () => {
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    useCascader({ options: TREE, value: [], changeOnSelect: true, id: 'c', onChange, onOpenChange })
      .option(TREE[0]!, 0).on.click!({});
    expect(onChange).toHaveBeenCalledWith(['zj'], ['浙江']);
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('ignores a disabled node and renders the joined display value', () => {
    const onChange = vi.fn();
    const behavior = useCascader({ options: TREE, value: ['zj', 'hz', 'xh'], id: 'c', onChange });
    behavior.option(TREE[1]!, 0).on.click!({});
    expect(onChange).not.toHaveBeenCalled();
    expect(behavior.displayValue).toBe('浙江 / 杭州 / 西湖');
  });
});

/* --- Colour ------------------------------------------------------------- */
describe('colour maths', () => {
  it('round-trips hex ↔ rgb ↔ hsl', () => {
    expect(hexToRgb('#4169ef')).toEqual([65, 105, 239]);
    expect(rgbToHex(65, 105, 239)).toBe('#4169ef');
    expect(hexToTriplet('#4169ef')).toBe('65, 105, 239');
    expect(rgbToHex(...hslToRgb(rgbToHsl(65, 105, 239)))).toBe('#4169ef');
  });

  it('accepts the three-digit shorthand and rejects nonsense', () => {
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
    expect(hexToRgb('#xyz')).toBeNull();
    expect(hexToTriplet('nope')).toBe('');
  });

  it('generates a ten-step ramp anchored on the input at step 5', () => {
    const ramp = generateRamp('#4169ef');
    expect(ramp).toHaveLength(10);
    expect(ramp[5]).toBe('#4169ef');
    // Monotonically darker: each step's luminance is below the last.
    const light = ramp.map((hex) => rgbToHsl(...hexToRgb(hex)!).l);
    for (let i = 1; i < light.length; i += 1) expect(light[i]!).toBeLessThan(light[i - 1]!);
  });

  it('picker exposes the ramp only when asked', () => {
    expect(useColorPicker({ value: '#4169ef', id: 'p' }).ramp).toHaveLength(0);
    expect(useColorPicker({ value: '#4169ef', id: 'p', showRamp: true }).ramp).toHaveLength(10);
  });
});

/* --- Time --------------------------------------------------------------- */
describe('time', () => {
  it('formats and parses, rejecting out-of-range parts', () => {
    expect(formatTime({ hour: 9, minute: 5 })).toBe('09:05');
    expect(formatTime({ hour: 9, minute: 5, second: 3 }, true)).toBe('09:05:03');
    expect(formatTime(null)).toBe('');
    expect(parseTime('09:05')).toEqual({ hour: 9, minute: 5, second: 0 });
    expect(parseTime('24:00')).toBeNull();
    expect(parseTime('09:60')).toBeNull();
    expect(parseTime('nope')).toBeNull();
  });

  it('honours the step when building the minute column', () => {
    const behavior = useTimePicker({ value: null, step: 15, id: 't' });
    expect(behavior.minutes).toEqual([0, 15, 30, 45]);
    expect(behavior.hours).toHaveLength(24);
  });

  it('counts down and clamps at zero', () => {
    expect(countdownParts(3661_000)).toMatchObject({ hours: 1, minutes: 1, seconds: 1 });
    expect(countdownParts(-5)).toMatchObject({ hours: 0, minutes: 0, seconds: 0 });
    expect(formatCountdown(3661_000, 'HH:mm:ss')).toBe('01:01:01');
  });
});

/* --- AutoComplete / InputTag / InputOtp --------------------------------- */
describe('autocomplete', () => {
  it('wraps the active index with the arrow keys', () => {
    const onActiveIndexChange = vi.fn();
    const behavior = useAutoComplete({
      value: '', suggestions: ['a', 'b'], open: true, activeIndex: 1, id: 'a', onActiveIndexChange,
    });
    behavior.input.on.keydown!(key('ArrowDown'));
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(0);
    behavior.input.on.keydown!(key('ArrowUp'));
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(0);
  });

  it('commits on Enter and reports combobox state', () => {
    const onSelect = vi.fn();
    const behavior = useAutoComplete({
      value: '', suggestions: ['alpha'], open: true, activeIndex: 0, id: 'a', onSelect,
    });
    behavior.input.on.keydown!(key('Enter'));
    expect(onSelect).toHaveBeenCalledWith('alpha');
    expect(behavior.input.attrs.role).toBe('combobox');
    expect(behavior.input.attrs['aria-activedescendant']).toBe('a-option-0');
  });

  it('typing reopens the list and clears the highlight', () => {
    const onOpenChange = vi.fn();
    const onActiveIndexChange = vi.fn();
    useAutoComplete({ value: '', suggestions: ['a'], id: 'a', onOpenChange, onActiveIndexChange })
      .input.on.input!(typed('al'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(onActiveIndexChange).toHaveBeenCalledWith(-1);
  });
});

describe('input tag', () => {
  it('commits on Enter but refuses blanks and duplicates', () => {
    const onTagsChange = vi.fn();
    useInputTag({ tags: [], draft: ' vue ', onTagsChange }).input.on.keydown!(key('Enter'));
    expect(onTagsChange).toHaveBeenCalledWith(['vue']);

    onTagsChange.mockClear();
    useInputTag({ tags: ['vue'], draft: 'vue', onTagsChange }).input.on.keydown!(key('Enter'));
    useInputTag({ tags: [], draft: '  ', onTagsChange }).input.on.keydown!(key('Enter'));
    expect(onTagsChange).not.toHaveBeenCalled();
  });

  it('does not commit mid-composition', () => {
    const onTagsChange = vi.fn();
    useInputTag({ tags: [], draft: '中文', onTagsChange })
      .input.on.keydown!({ ...key('Enter'), isComposing: true });
    expect(onTagsChange).not.toHaveBeenCalled();
  });

  it('Backspace on an empty field drops the last tag', () => {
    const onTagsChange = vi.fn();
    useInputTag({ tags: ['a', 'b'], draft: '', onTagsChange }).input.on.keydown!(key('Backspace'));
    expect(onTagsChange).toHaveBeenCalledWith(['a']);
  });

  it('stops accepting input at max', () => {
    const behavior = useInputTag({ tags: ['a'], draft: '', max: 1 });
    expect(behavior.full).toBe(true);
    expect(behavior.input.attrs.disabled).toBe(true);
  });
});

describe('input otp', () => {
  it('keeps digits only, truncates to length, and fires on completion', () => {
    const onChange = vi.fn();
    const onComplete = vi.fn();
    useInputOtp({ value: '', length: 4, onChange, onComplete }).input.on.input!(typed('12a34567'));
    expect(onChange).toHaveBeenCalledWith('1234');
    expect(onComplete).toHaveBeenCalledWith('1234');
  });

  it('renders one cell per slot and marks the filled ones', () => {
    const behavior = useInputOtp({ value: '12', length: 4 });
    expect(behavior.cells).toEqual(['1', '2', '', '']);
    expect(behavior.cell(0).class).toContain('filled');
    expect(behavior.cell(3).class).not.toContain('filled');
  });
});

/* --- Utility behaviours ------------------------------------------------- */
describe('image', () => {
  it('opens the preview only when previewing is enabled', () => {
    const onPreviewChange = vi.fn();
    useImage({ src: 'a.png', onPreviewChange }).img.on.click?.({});
    expect(onPreviewChange).not.toHaveBeenCalled();
    useImage({ src: 'a.png', preview: true, onPreviewChange }).img.on.click!({});
    expect(onPreviewChange).toHaveBeenCalledWith(true);
  });

  it('clamps zoom and wraps rotation from the keyboard', () => {
    const onZoom = vi.fn();
    const onRotate = vi.fn();
    useImage({ src: 'a.png', zoom: 4, rotation: 270, onZoom, onRotate }).mask.on.keydown!(key('+'));
    expect(onZoom).toHaveBeenCalledWith(4);
    useImage({ src: 'a.png', zoom: 0.25, onZoom }).mask.on.keydown!(key('-'));
    expect(onZoom).toHaveBeenLastCalledWith(0.25);
    useImage({ src: 'a.png', rotation: 270, onRotate }).mask.on.keydown!(key('r'));
    expect(onRotate).toHaveBeenCalledWith(0);
  });

  it('only closes on a click on the backdrop itself', () => {
    const onPreviewChange = vi.fn();
    const behavior = useImage({ src: 'a.png', onPreviewChange });
    behavior.mask.on.click!({ target: 1, currentTarget: 2 });
    expect(onPreviewChange).not.toHaveBeenCalled();
    behavior.mask.on.click!({ target: 1, currentTarget: 1 });
    expect(onPreviewChange).toHaveBeenCalledWith(false);
  });
});

describe('affix', () => {
  it('reserves the vacated height only once pinned', () => {
    expect(useAffix({ affixed: false, height: 40 }).placeholderStyle).toEqual({});
    const pinned = useAffix({ affixed: true, offset: 12, height: 40 });
    expect(pinned.placeholderStyle).toEqual({ height: '40px' });
    expect(pinned.contentStyle).toMatchObject({ position: 'fixed', insetBlockStart: '12px' });
  });
});

describe('splitter', () => {
  it('clamps a pointer ratio into the allowed band', () => {
    const behavior = useSplitter({ value: 50, min: 20, max: 80 });
    expect(behavior.ratioAt(0.05)).toBe(20);
    expect(behavior.ratioAt(0.95)).toBe(80);
    expect(behavior.ratioAt(0.5)).toBe(50);
  });

  it('steps with the arrows along its own axis and jumps with Home/End', () => {
    const onChange = vi.fn();
    const behavior = useSplitter({ value: 50, min: 20, max: 80, onChange });
    behavior.handle.on.keydown!(key('ArrowRight'));
    expect(onChange).toHaveBeenLastCalledWith(52);
    behavior.handle.on.keydown!(key('ArrowUp'));
    expect(onChange).toHaveBeenCalledTimes(1);
    behavior.handle.on.keydown!(key('End'));
    expect(onChange).toHaveBeenLastCalledWith(80);
    expect(behavior.handle.attrs.role).toBe('separator');
    expect(behavior.handle.attrs['aria-valuenow']).toBe(50);
  });

  it('splits the flex basis to match the value', () => {
    const behavior = useSplitter({ value: 30 });
    expect(behavior.firstStyle).toEqual({ flexBasis: '30%' });
    expect(behavior.secondStyle).toEqual({ flexBasis: '70%' });
  });
});

describe('tour', () => {
  const steps = [
    { target: '#a', title: 'A' },
    { target: '#b', title: 'B' },
  ];

  it('reports progress and disables Previous on the first step', () => {
    const behavior = useTour({ steps, current: 0, open: true });
    expect(behavior.progress).toBe('1 / 2');
    expect(behavior.prev.attrs.disabled).toBe(true);
    expect(behavior.isLast).toBe(false);
  });

  it('the last step finishes rather than advancing', () => {
    const onClose = vi.fn();
    const onChange = vi.fn();
    const behavior = useTour({ steps, current: 1, open: true, onChange, onClose });
    expect(behavior.isLast).toBe(true);
    behavior.next.on.click!({});
    expect(onClose).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('drives with the arrow keys and closes on Escape', () => {
    const onChange = vi.fn();
    const onClose = vi.fn();
    const behavior = useTour({ steps, current: 0, open: true, onChange, onClose });
    behavior.panel.on.keydown!(key('ArrowRight'));
    expect(onChange).toHaveBeenCalledWith(1);
    behavior.panel.on.keydown!(key('ArrowLeft'));
    expect(onChange).toHaveBeenCalledTimes(1);
    behavior.panel.on.keydown!(key('Escape'));
    expect(onClose).toHaveBeenCalled();
  });

  it('pads the spotlight around the target rect', () => {
    const style = useTour({ steps, current: 0, open: true })
      .spotlightStyle({ top: 100, left: 50, width: 200, height: 40 });
    expect(style).toEqual({
      insetBlockStart: '94px', insetInlineStart: '44px', inlineSize: '212px', blockSize: '52px',
    });
  });
});

describe('small parts', () => {
  it('a disabled link drops its href and leaves the tab order', () => {
    const link = useLink({ href: '/docs', disabled: true });
    expect(link.attrs.href).toBeUndefined();
    expect(link.attrs.tabindex).toBe(-1);
    expect(link.attrs['aria-disabled']).toBe(true);
    expect(useLink({ href: '/docs' }).attrs.href).toBe('/docs');
  });

  it('the float button reports its expanded state', () => {
    expect(useFloatButton({ open: true }).trigger.attrs['aria-expanded']).toBe(true);
    expect(useFloatButton().root.class).not.toContain('open');
    expect(useFloatButton({ open: true }).item('设置').attrs['aria-label']).toBe('设置');
  });
});
