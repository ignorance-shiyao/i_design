import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { mount } from '@vue/test-utils';
import { h } from 'vue';
import * as R from '@i-design/react';
import * as V from '@i-design/vue';

describe('controlled / uncontrolled', () => {
  it('React Input keeps its own state when uncontrolled', () => {
    const onChange = vi.fn();
    const { container } = render(<R.Input defaultValue="a" onChange={onChange} />);
    const input = container.querySelector('input')!;
    fireEvent.input(input, { target: { value: 'ab' } });
    expect(onChange).toHaveBeenCalledWith('ab', expect.anything());
    expect(input.value).toBe('ab');
  });

  it('React Input does not move without the parent when controlled', () => {
    const { container } = render(<R.Input value="fixed" />);
    const input = container.querySelector('input')!;
    fireEvent.input(input, { target: { value: 'changed' } });
    expect(input.value).toBe('fixed');
  });

  it('Vue Input emits update:modelValue for v-model', async () => {
    const wrapper = mount(V.Input, { props: { modelValue: 'a' } });
    await wrapper.find('input').setValue('ab');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['ab']);
  });
});

describe('disabled semantics', () => {
  it('React Button does not fire onClick while loading', () => {
    const onClick = vi.fn();
    const { container } = render(<R.Button loading onClick={onClick}>Go</R.Button>);
    fireEvent.click(container.querySelector('button')!);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('Vue Button does not emit click while disabled', async () => {
    const wrapper = mount(V.Button, { props: { disabled: true } });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });
});

describe('Dialog accessibility', () => {
  it('React Dialog is a labelled modal and closes on Escape', () => {
    const onClose = vi.fn();
    render(
      <R.Dialog open title="Delete file" onClose={onClose}>
        This cannot be undone.
      </R.Dialog>,
    );
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const labelId = dialog.getAttribute('aria-labelledby')!;
    expect(document.getElementById(labelId)?.textContent).toBe('Delete file');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledWith('escape');
  });

  it('Vue Dialog teleports a labelled modal and closes on Escape', async () => {
    const wrapper = mount(V.Dialog, {
      props: { modelValue: true, title: 'Delete file' },
      slots: { default: () => h('p', 'This cannot be undone.') },
      attachTo: document.body,
    });
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    wrapper.unmount();
  });
});

describe('theming', () => {
  it('nested ConfigProviders override only what they set', () => {
    const { container } = render(
      <R.ConfigProvider mode="dark" density="compact">
        <R.ConfigProvider density="loose">
          <R.Button>x</R.Button>
        </R.ConfigProvider>
      </R.ConfigProvider>,
    );
    const inner = container.querySelector('[data-i-density="loose"]')!;
    expect(inner.getAttribute('data-i-theme')).toBe('dark');
  });

  it('token overrides are emitted as inline custom properties', () => {
    const { container } = render(<R.ConfigProvider tokens={{ 'color-brand': '#7c3aed' }} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue('--i-color-brand')).toBe('#7c3aed');
  });

  it('an RTL locale flips direction automatically', () => {
    const { container } = render(<R.ConfigProvider locale="ar-EG" />);
    expect((container.firstElementChild as HTMLElement).getAttribute('dir')).toBe('rtl');
  });
});
