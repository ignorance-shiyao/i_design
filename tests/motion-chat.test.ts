import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  createStreamController, createTransitionController, isAtBottom, motionClass,
  stagger, useCarousel, usePromptInput,
} from '@i-design/core';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('transition machine', () => {
  it('passes through an enter frame so CSS has a "from" state', () => {
    const phases: string[] = [];
    const controller = createTransitionController({
      visible: false, duration: 200,
      onChange: (phase) => phases.push(phase),
    });
    controller.setVisible(true);
    expect(phases).toEqual(['enter']);
    vi.advanceTimersByTime(20);
    expect(phases).toEqual(['enter', 'entered']);
  });

  it('keeps the element mounted for the whole exit', () => {
    const states: Array<[string, boolean]> = [];
    const controller = createTransitionController({
      visible: true, duration: 200,
      onChange: (phase, mounted) => states.push([phase, mounted]),
    });
    controller.setVisible(false);
    expect(states.at(-1)).toEqual(['exit', true]);
    vi.advanceTimersByTime(199);
    expect(states.at(-1)).toEqual(['exit', true]);
    vi.advanceTimersByTime(2);
    expect(states.at(-1)).toEqual(['exited', false]);
  });

  it('names the class per phase', () => {
    expect(motionClass('fade', 'entered')).toBe('i-motion-fade');
    expect(motionClass('slide-up', 'enter')).toBe('i-motion-slide-up i-motion-slide-up--enter');
  });

  it('caps the stagger so long lists stay snappy', () => {
    expect(stagger(0)).toBe(0);
    expect(stagger(3)).toBe(120);
    expect(stagger(50)).toBe(240);
  });
});

describe('carousel', () => {
  const base = { count: 3, index: 0 };

  it('wraps when looping and clamps when not', () => {
    const looped = vi.fn();
    useCarousel({ ...base, onChange: looped }).goTo(-1);
    expect(looped).toHaveBeenCalledWith(2);

    const clamped = vi.fn();
    useCarousel({ ...base, loop: false, onChange: clamped }).goTo(-1);
    expect(clamped).not.toHaveBeenCalled();
  });

  it('ignores a small drag and follows a decisive one', () => {
    const behavior = useCarousel(base);
    expect(behavior.resolveDrag(-20, 800)).toBe(0);
    expect(behavior.resolveDrag(-120, 800)).toBe(1);
    expect(behavior.resolveDrag(120, 800)).toBe(2); // wraps backwards
  });

  it('marks off-screen slides hidden and inert', () => {
    const behavior = useCarousel({ ...base, index: 1 });
    expect(behavior.slide(1).attrs['aria-hidden']).toBeUndefined();
    expect(behavior.slide(0).attrs['aria-hidden']).toBe(true);
    expect(behavior.slide(0).attrs.inert).toBe('');
    expect(behavior.slide(0).attrs['aria-label']).toBe('1 / 3');
  });

  it('announces itself as a carousel', () => {
    const behavior = useCarousel({ ...base, label: '产品图' });
    expect(behavior.root.attrs['aria-roledescription']).toBe('carousel');
    expect(behavior.root.attrs['aria-label']).toBe('产品图');
  });

  it('moves with the arrow keys along its own axis', () => {
    const onChange = vi.fn();
    const vertical = useCarousel({ ...base, orientation: 'vertical', onChange });
    vertical.root.on.keydown!({ key: 'ArrowRight', preventDefault() {} });
    expect(onChange).not.toHaveBeenCalled();
    vertical.root.on.keydown!({ key: 'ArrowDown', preventDefault() {} });
    expect(onChange).toHaveBeenCalledWith(1);
  });
});

describe('prompt input', () => {
  const key = (over: Record<string, unknown> = {}) => ({
    key: 'Enter', shiftKey: false, isComposing: false, preventDefault: vi.fn(), ...over,
  });

  it('sends on Enter', () => {
    const onSubmit = vi.fn();
    usePromptInput({ value: ' 你好 ', onSubmit }).textarea.on.keydown!(key());
    expect(onSubmit).toHaveBeenCalledWith('你好');
  });

  it('never sends mid-composition — the CJK input bug', () => {
    const onSubmit = vi.fn();
    const behavior = usePromptInput({ value: '你好', onSubmit });
    behavior.textarea.on.keydown!(key({ isComposing: true }));
    behavior.textarea.on.keydown!(key({ keyCode: 229 }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('Shift+Enter inserts a newline instead of sending', () => {
    const onSubmit = vi.fn();
    const event = key({ shiftKey: true });
    usePromptInput({ value: 'hi', onSubmit }).textarea.on.keydown!(event);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('refuses to send blank input', () => {
    const onSubmit = vi.fn();
    const behavior = usePromptInput({ value: '   ', onSubmit });
    expect(behavior.canSend).toBe(false);
    behavior.send.on.click!({});
    expect(onSubmit).not.toHaveBeenCalled();
    expect(behavior.send.attrs.disabled).toBe(true);
  });

  it('turns into a stop button while busy', () => {
    const onStop = vi.fn();
    const onSubmit = vi.fn();
    const behavior = usePromptInput({ value: 'hi', busy: true, onStop, onSubmit });
    behavior.send.on.click!({});
    expect(onStop).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(behavior.send.attrs['aria-label']).toBe('stop generating');
  });
});

describe('streaming', () => {
  it('reveals text at a steady pace regardless of chunk size', () => {
    const updates: string[] = [];
    const controller = createStreamController({ charsPerTick: 2, onUpdate: (text) => updates.push(text) });
    controller.push('abcdef');
    vi.advanceTimersByTime(16);
    expect(updates.at(-1)).toBe('ab');
    vi.advanceTimersByTime(32);
    expect(updates.at(-1)).toBe('abcdef');
  });

  it('calls onDone only after the buffer drains', () => {
    const onDone = vi.fn();
    const controller = createStreamController({ charsPerTick: 1, onUpdate: () => {}, onDone });
    controller.push('ab');
    controller.end();
    expect(onDone).not.toHaveBeenCalled();
    vi.advanceTimersByTime(32);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('flush reveals everything at once', () => {
    let latest = '';
    const controller = createStreamController({ onUpdate: (text) => (latest = text) });
    controller.push('long answer');
    controller.flush();
    expect(latest).toBe('long answer');
  });
});

describe('stick-to-bottom', () => {
  it('follows at the bottom and stops once the reader scrolls up', () => {
    expect(isAtBottom({ scrollTop: 900, scrollHeight: 1000, clientHeight: 100 })).toBe(true);
    expect(isAtBottom({ scrollTop: 880, scrollHeight: 1000, clientHeight: 100 })).toBe(true);
    expect(isAtBottom({ scrollTop: 400, scrollHeight: 1000, clientHeight: 100 })).toBe(false);
  });
});
