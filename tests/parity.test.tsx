import { describe, expect, it } from 'vitest';
import { render as renderReact } from '@testing-library/react';
import { mount } from '@vue/test-utils';
import { h } from 'vue';
import * as R from '@i-design/react';
import * as V from '@i-design/vue';

/**
 * The contract of this library: for the same public props, the React and the Vue
 * component must produce the same DOM — same tags, same class names, same ARIA.
 * If a maintainer fixes a bug in only one adapter, these tests fail.
 */
function normalize(html: string): string {
  return (
    html
      // Vue renders `null` children as `<!---->` placeholders; React renders nothing.
      .replace(/<!--[^>]*-->/g, '')
      // ids are per-instance and intentionally differ between the two renders.
      .replace(/\s(?:id|for|aria-labelledby|aria-describedby)="[^"]*"/g, '')
      // `checked` is a DOM *property*: React also reflects it as an attribute,
      // Vue does not. The property itself is asserted separately below.
      .replace(/\schecked=""/g, '')
      .replace(/>\s+</g, '><')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

const reactHtml = (ui: React.ReactElement): string =>
  normalize(renderReact(ui).container.innerHTML);

const vueHtml = (component: unknown, props: Record<string, unknown>, slots?: Record<string, unknown>): string =>
  normalize(mount(component as never, { props, slots: slots as never }).html());

describe('React / Vue DOM parity', () => {
  it('Button — every variant × status × size combination', () => {
    for (const variant of ['solid', 'outline', 'soft', 'text'] as const) {
      for (const status of ['default', 'brand', 'success', 'warning', 'danger'] as const) {
        for (const size of ['s', 'm', 'l'] as const) {
          const props = { variant, status, size };
          expect(reactHtml(<R.Button {...props}>OK</R.Button>)).toBe(
            vueHtml(V.Button, props, { default: () => 'OK' }),
          );
        }
      }
    }
  });

  it('Button — loading and disabled states', () => {
    expect(reactHtml(<R.Button loading>Save</R.Button>)).toBe(
      vueHtml(V.Button, { loading: true }, { default: () => 'Save' }),
    );
    expect(reactHtml(<R.Button disabled>Save</R.Button>)).toBe(
      vueHtml(V.Button, { disabled: true }, { default: () => 'Save' }),
    );
  });

  it('Input — clearable, counted, statuses', () => {
    expect(reactHtml(<R.Input value="hello" clearable showCount maxlength={20} />)).toBe(
      vueHtml(V.Input, { modelValue: 'hello', clearable: true, showCount: true, maxlength: 20 }),
    );
    for (const status of ['default', 'success', 'warning', 'danger'] as const) {
      expect(reactHtml(<R.Input value="" status={status} />)).toBe(
        vueHtml(V.Input, { modelValue: '', status }),
      );
    }
  });

  it('Checkbox and Switch', () => {
    expect(reactHtml(<R.Checkbox checked>Agree</R.Checkbox>)).toBe(
      vueHtml(V.Checkbox, { modelValue: true }, { default: () => 'Agree' }),
    );
    expect(reactHtml(<R.Checkbox checked={false} indeterminate />)).toBe(
      vueHtml(V.Checkbox, { modelValue: false, indeterminate: true }),
    );
    expect(reactHtml(<R.Switch checked size="l" label="Dark" />)).toBe(
      vueHtml(V.Switch, { modelValue: true, size: 'l' }, { default: () => 'Dark' }),
    );
  });

  it('Tag and Space', () => {
    expect(reactHtml(<R.Tag status="danger" closable>Error</R.Tag>)).toBe(
      vueHtml(V.Tag, { status: 'danger', closable: true }, { default: () => 'Error' }),
    );
    expect(reactHtml(<R.Space direction="vertical" gap="l" wrap><span>a</span></R.Space>)).toBe(
      vueHtml(V.Space, { direction: 'vertical', gap: 'l', wrap: true }, { default: () => h('span', 'a') }),
    );
  });

  it('checked state reaches the real DOM in both adapters', () => {
    const reactInput = renderReact(<R.Checkbox checked />).container.querySelector('input')!;
    const vueInput = mount(V.Checkbox, { props: { modelValue: true }, attachTo: document.body })
      .element.querySelector('input') as HTMLInputElement;
    expect(reactInput.checked).toBe(true);
    expect(vueInput.checked).toBe(true);
  });

  it('ConfigProvider emits the same theme attributes', () => {
    expect(reactHtml(<R.ConfigProvider mode="dark" density="compact" />)).toBe(
      vueHtml(V.ConfigProvider, { mode: 'dark', density: 'compact' }),
    );
  });
});
