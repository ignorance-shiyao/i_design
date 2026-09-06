import { describe, expect, it } from 'vitest';
import {
  computePosition, createBem, cx, resolveTokensSafe, useButtonBehavior,
  useInputBehavior, useToggleBehavior,
} from './helpers.js';

describe('classnames', () => {
  it('builds BEM names', () => {
    const bem = createBem('button');
    expect(bem()).toBe('i-button');
    expect(bem('icon')).toBe('i-button__icon');
    expect(bem(null, 'primary')).toBe('i-button--primary');
  });

  it('joins conditionals like clsx', () => {
    expect(cx('a', { b: true, c: false }, ['d', null], undefined)).toBe('a b d');
  });
});

describe('button behaviour', () => {
  it('swallows clicks while loading', () => {
    let clicks = 0;
    const behavior = useButtonBehavior({ loading: true, onClick: () => (clicks += 1) });
    behavior.root.on.click?.({ preventDefault() {}, stopPropagation() {} });
    expect(clicks).toBe(0);
    expect(behavior.root.attrs['aria-busy']).toBe(true);
  });

  it('renders as an anchor when href is given and disables it safely', () => {
    const behavior = useButtonBehavior({ href: '/docs', disabled: true });
    expect(behavior.tag).toBe('a');
    expect(behavior.root.attrs.href).toBeUndefined();
    expect(behavior.root.attrs['aria-disabled']).toBe(true);
  });
});

describe('toggle behaviour', () => {
  it('reports mixed state to assistive tech', () => {
    const behavior = useToggleBehavior({ kind: 'checkbox', checked: false, indeterminate: true });
    expect(behavior.input.attrs['aria-checked']).toBe('mixed');
  });

  it('does not emit when readonly', () => {
    let calls = 0;
    const behavior = useToggleBehavior({ kind: 'switch', checked: false, readonly: true, onChange: () => (calls += 1) });
    behavior.input.on.change?.({ preventDefault() {} });
    expect(calls).toBe(0);
  });
});

describe('input behaviour', () => {
  it('exposes the clear affordance only when there is something to clear', () => {
    expect(useInputBehavior({ clearable: true, value: '' }).clear).toBeNull();
    expect(useInputBehavior({ clearable: true, value: 'x' }).clear).not.toBeNull();
    expect(useInputBehavior({ clearable: true, value: 'x', disabled: true }).clear).toBeNull();
  });

  it('counts characters against maxlength', () => {
    expect(useInputBehavior({ value: 'abc', maxlength: 10 }).count).toEqual({ current: 3, max: 10 });
  });
});

describe('positioning', () => {
  const boundary = { width: 1000, height: 800 };
  const anchor = { top: 400, left: 400, width: 100, height: 40 };
  const floating = { top: 0, left: 0, width: 200, height: 100 };

  it('centres above the anchor for `top`', () => {
    const pos = computePosition(anchor, floating, { placement: 'top', boundary });
    expect(pos).toMatchObject({ x: 350, y: 292 });
  });

  it('flips when the preferred side does not fit', () => {
    const nearTop = { ...anchor, top: 10 };
    const pos = computePosition(nearTop, floating, { placement: 'top', boundary });
    expect(pos.placement).toBe('bottom');
    expect(pos.y).toBe(58);
  });

  it('clamps inside the boundary', () => {
    const nearEdge = { ...anchor, left: 960 };
    const pos = computePosition(nearEdge, floating, { placement: 'bottom', boundary });
    expect(pos.x).toBeLessThanOrEqual(boundary.width - floating.width);
  });
});

describe('tokens', () => {
  it('keeps light and dark token sets in sync', () => {
    const { light, dark } = resolveTokensSafe();
    expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort());
  });
});
