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
      .replace(/\s(?:id|for|aria-labelledby|aria-describedby|aria-controls|aria-activedescendant)="[^"]*"/g, '')
      // `checked` is a DOM *property*: React also reflects it as an attribute,
      // Vue does not. The property itself is asserted separately below.
      .replace(/\schecked=""/g, '')
      // Same story for `<textarea>`: React writes a `value` attribute, Vue sets
      // the property and the serialiser shows it as the element's text.
      .replace(/(<textarea[^>]*)\svalue="[^"]*"/g, '$1')
      .replace(/(<textarea[^>]*>)[^<]*(<\/textarea>)/g, '$1$2')
      .replace(/>\s+</g, '><')
      .replace(/\s+</g, '<')
      .replace(/>\s+/g, '>')
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

  it('textarea value reaches the real DOM in both adapters', () => {
    const reactEl = renderReact(<R.Textarea value="hi" />).container.querySelector('textarea')!;
    const vueEl = mount(V.Textarea, { props: { modelValue: 'hi' }, attachTo: document.body })
      .element.querySelector('textarea') as HTMLTextAreaElement;
    expect(reactEl.value).toBe('hi');
    expect(vueEl.value).toBe('hi');
  });

  it('checked state reaches the real DOM in both adapters', () => {
    const reactInput = renderReact(<R.Checkbox checked />).container.querySelector('input')!;
    const vueInput = mount(V.Checkbox, { props: { modelValue: true }, attachTo: document.body })
      .element.querySelector('input') as HTMLInputElement;
    expect(reactInput.checked).toBe(true);
    expect(vueInput.checked).toBe(true);
  });

  it('display components — Alert, Card, Divider, Avatar, Badge, Progress, Skeleton, Spinner, Empty', () => {
    for (const status of ['info', 'success', 'warning', 'danger'] as const) {
      for (const variant of ['soft', 'outline'] as const) {
        expect(reactHtml(<R.Alert status={status} variant={variant} title="标题" closable>内容</R.Alert>)).toBe(
          vueHtml(V.Alert, { status, variant, title: '标题', closable: true }, { default: () => '内容' }),
        );
      }
    }
    expect(reactHtml(<R.Card title="卡片" hoverable padding="l">正文</R.Card>)).toBe(
      vueHtml(V.Card, { title: '卡片', hoverable: true, padding: 'l' }, { default: () => '正文' }),
    );
    expect(reactHtml(<R.Divider dashed align="start">或</R.Divider>)).toBe(
      vueHtml(V.Divider, { dashed: true, align: 'start' }, { default: () => '或' }),
    );
    expect(reactHtml(<R.Avatar name="Ada Lovelace" size="l" shape="square" />)).toBe(
      vueHtml(V.Avatar, { name: 'Ada Lovelace', size: 'l', shape: 'square' }),
    );
    expect(reactHtml(<R.Badge count={120} status="brand"><span>x</span></R.Badge>)).toBe(
      vueHtml(V.Badge, { count: 120, status: 'brand' }, { default: () => h('span', 'x') }),
    );
    expect(reactHtml(<R.Progress value={42} status="success" size="l" />)).toBe(
      vueHtml(V.Progress, { value: 42, status: 'success', size: 'l' }),
    );
    expect(reactHtml(<R.Skeleton rows={4} />)).toBe(vueHtml(V.Skeleton, { rows: 4 }));
    expect(reactHtml(<R.Spinner size="l" />)).toBe(vueHtml(V.Spinner, { size: 'l' }));
    expect(reactHtml(<R.Empty description="没有数据" />)).toBe(vueHtml(V.Empty, { description: '没有数据' }));
  });

  it('grid — spans, offsets and responsive breakpoints', () => {
    expect(
      reactHtml(
        <R.Row gutter={[16, 8]} justify="between" align="center">
          <R.Col span={12} md={6}><span>a</span></R.Col>
        </R.Row>,
      ),
    ).toBe(
      vueHtml(V.Row, { gutter: [16, 8], justify: 'between', align: 'center' }, {
        default: () => h(V.Col, { span: 12, md: 6 }, () => h('span', 'a')),
      }),
    );
  });

  it('Tabs — every variant, with the same aria pairing', () => {
    const items = [{ value: 'a', label: '一' }, { value: 'b', label: '二', disabled: true }];
    for (const variant of ['line', 'card', 'segment'] as const) {
      expect(reactHtml(<R.Tabs items={items} value="a" variant={variant}>{() => '内容'}</R.Tabs>)).toBe(
        vueHtml(V.Tabs, { items, modelValue: 'a', variant }, { default: () => '内容' }),
      );
    }
  });

  it('Collapse, Pagination, Steps, Breadcrumb', () => {
    const items = [{ value: 'p1', header: '面板一' }, { value: 'p2', header: '面板二' }];
    expect(reactHtml(<R.Collapse items={items} value={['p1']}>{() => '正文'}</R.Collapse>)).toBe(
      vueHtml(V.Collapse, { items, modelValue: ['p1'] }, { default: () => '正文' }),
    );
    expect(reactHtml(<R.Pagination current={6} total={200} />)).toBe(
      vueHtml(V.Pagination, { modelValue: 6, total: 200 }),
    );
    const steps = [
      { title: '第一步', description: '已完成' },
      { title: '第二步' },
      { title: '第三步', status: 'error' as const },
    ];
    expect(reactHtml(<R.Steps items={steps} current={1} />)).toBe(
      vueHtml(V.Steps, { items: steps, current: 1 }),
    );
    const crumbs = [{ label: '首页', href: '/' }, { label: '列表', href: '/list' }, { label: '详情' }];
    expect(reactHtml(<R.Breadcrumb items={crumbs} />)).toBe(vueHtml(V.Breadcrumb, { items: crumbs }));
  });

  it('RadioGroup, Textarea, Select', () => {
    const options = [{ value: 'a', label: '甲' }, { value: 'b', label: '乙', disabled: true }];
    for (const variant of ['default', 'button'] as const) {
      expect(reactHtml(<R.RadioGroup options={options} value="a" name="g" variant={variant} />)).toBe(
        vueHtml(V.RadioGroup, { options, modelValue: 'a', name: 'g', variant }),
      );
    }
    expect(reactHtml(<R.Textarea value="hi" maxlength={100} showCount rows={4} />)).toBe(
      vueHtml(V.Textarea, { modelValue: 'hi', maxlength: 100, showCount: true, rows: 4 }),
    );
    const selectOptions = [{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana' }];
    expect(reactHtml(<R.Select options={selectOptions} value="a" clearable />)).toBe(
      vueHtml(V.Select, { options: selectOptions, modelValue: 'a', clearable: true }),
    );
    expect(reactHtml(<R.Select options={selectOptions} value={null} />)).toBe(
      vueHtml(V.Select, { options: selectOptions, modelValue: null }),
    );
  });

  it('ConfigProvider emits the same theme attributes', () => {
    expect(reactHtml(<R.ConfigProvider mode="dark" density="compact" />)).toBe(
      vueHtml(V.ConfigProvider, { mode: 'dark', density: 'compact' }),
    );
  });
});
