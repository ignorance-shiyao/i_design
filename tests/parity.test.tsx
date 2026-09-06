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

  it('Tabs used as a control renders no panel in either framework', () => {
    const items = [{ value: 'a', label: '浅' }, { value: 'b', label: '深' }];
    const react = reactHtml(<R.Tabs items={items} value="a" variant="segment">{() => null}</R.Tabs>);
    expect(react).not.toContain('i-tabs__panel');
    expect(react).toBe(vueHtml(V.Tabs, { items, modelValue: 'a', variant: 'segment' }));
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

  it('Table — sorting, selection, sticky columns and the empty state', () => {
    const columns = [
      { key: 'name', title: '姓名', sortable: true, width: 120, fixed: 'start' as const },
      { key: 'age', title: '年龄', sortable: true, align: 'end' as const },
      { key: 'city', title: '城市', ellipsis: true },
    ];
    const rows = [
      { name: 'Cara', age: 31, city: '上海' },
      { name: 'Alan', age: 24, city: '北京' },
    ];
    const rowKey = (row: { name: string }) => row.name;

    expect(
      reactHtml(
        <R.Table
          columns={columns}
          data={rows}
          rowKey={rowKey}
          sort={{ key: 'age', order: 'desc' }}
          selection="multiple"
          selectedKeys={['Alan']}
          bordered
          striped
        />,
      ),
    ).toBe(
      vueHtml(V.Table, {
        columns, data: rows, rowKey,
        sort: { key: 'age', order: 'desc' },
        selection: 'multiple',
        selectedKeys: ['Alan'],
        bordered: true,
        striped: true,
      }),
    );

    expect(reactHtml(<R.Table columns={columns} data={[]} rowKey={rowKey} />)).toBe(
      vueHtml(V.Table, { columns, data: [], rowKey }),
    );
  });

  it('Carousel — slide semantics, dots and nav', () => {
    const slides = [h('div', 'A'), h('div', 'B'), h('div', 'C')];
    expect(
      reactHtml(
        <R.Carousel index={1} label="产品图">
          <div>A</div>
          <div>B</div>
          <div>C</div>
        </R.Carousel>,
      ),
    ).toBe(vueHtml(V.Carousel, { modelValue: 1, label: '产品图' }, { default: () => slides }));
  });

  it('AI chat surface — message roles, statuses and the prompt input', () => {
    for (const role of ['user', 'assistant', 'system'] as const) {
      expect(reactHtml(<R.ChatMessage role={role} name="Ada" time="10:24">你好</R.ChatMessage>)).toBe(
        vueHtml(V.ChatMessage, { role, name: 'Ada', time: '10:24' }, { default: () => '你好' }),
      );
    }
    for (const status of ['sending', 'streaming', 'complete', 'error'] as const) {
      expect(reactHtml(<R.ChatMessage role="assistant" status={status}>回答</R.ChatMessage>)).toBe(
        vueHtml(V.ChatMessage, { role: 'assistant', status }, { default: () => '回答' }),
      );
    }
    expect(reactHtml(<R.TypingIndicator />)).toBe(vueHtml(V.TypingIndicator, {}));
    expect(reactHtml(<R.Suggestions items={['总结这段代码', '写单元测试']} />)).toBe(
      vueHtml(V.Suggestions, { items: ['总结这段代码', '写单元测试'] }),
    );
    // Highlighted output must match token for token, not just as raw text.
    const snippet = `import { Button } from '@i-design/react'; // 用法\nconst n = 42;`;
    const reactCode = reactHtml(<R.CodeBlock language="tsx" code={snippet} />);
    expect(reactCode).toContain('i-code-block__token--keyword');
    expect(reactCode).toContain('i-code-block__token--comment');
    expect(reactCode).toBe(vueHtml(V.CodeBlock, { language: 'tsx', code: snippet }));
    expect(reactHtml(<R.PromptInput value="问点什么" placeholder="发消息" />)).toBe(
      vueHtml(V.PromptInput, { modelValue: '问点什么', placeholder: '发消息' }),
    );
    expect(reactHtml(<R.PromptInput value="生成中" busy />)).toBe(
      vueHtml(V.PromptInput, { modelValue: '生成中', busy: true }),
    );
  });

  it('form controls — InputNumber, Slider, Rate, Upload', () => {
    for (const controls of ['stack', 'side', 'none'] as const) {
      expect(reactHtml(<R.InputNumber value={5} min={0} max={10} controls={controls} />)).toBe(
        vueHtml(V.InputNumber, { modelValue: 5, min: 0, max: 10, controls }),
      );
    }
    const marks = [{ value: 0, label: '0' }, { value: 50, label: '一半' }, { value: 100, label: '100' }];
    expect(reactHtml(<R.Slider value={40} marks={marks} label="音量" />)).toBe(
      vueHtml(V.Slider, { modelValue: 40, marks, label: '音量' }),
    );
    expect(reactHtml(<R.Rate value={2.5} allowHalf />)).toBe(vueHtml(V.Rate, { modelValue: 2.5, allowHalf: true }));

    const files = [
      { uid: '1', name: 'report.pdf', size: 1536, status: 'success' as const },
      { uid: '2', name: 'big.zip', size: 900, status: 'error' as const },
    ];
    expect(reactHtml(<R.Upload files={files} variant="drag" hint="最大 5MB" />)).toBe(
      vueHtml(V.Upload, { files, variant: 'drag', hint: '最大 5MB' }),
    );
  });

  it('structure — Layout, Menu, Tree, Anchor, BackTop', () => {
    expect(
      reactHtml(
        <R.Layout direction="row">
          <R.LayoutSider collapsed>侧栏</R.LayoutSider>
          <R.LayoutContent>正文</R.LayoutContent>
        </R.Layout>,
      ),
    ).toBe(
      vueHtml(V.Layout, { direction: 'row' }, {
        default: () => [
          h(V.LayoutSider, { collapsed: true }, () => '侧栏'),
          h(V.LayoutContent, null, () => '正文'),
        ],
      }),
    );

    const menuItems = [
      { value: 'home', label: '首页' },
      { value: 'group', label: '分组', children: [{ value: 'a', label: '子项' }] },
      { value: 'danger', label: '删除', danger: true, divided: true },
    ];
    expect(reactHtml(<R.Menu items={menuItems} value="home" expanded={['group']} />)).toBe(
      vueHtml(V.Menu, { items: menuItems, value: 'home', expanded: ['group'] }),
    );

    const nodes = [
      { key: 'src', label: 'src', children: [{ key: 'a', label: 'a.ts' }] },
      { key: 'readme', label: 'README' },
    ];
    expect(reactHtml(<R.Tree nodes={nodes} expanded={['src']} checkable checked={['a']} />)).toBe(
      vueHtml(V.Tree, { nodes, expanded: ['src'], checkable: true, checked: ['a'] }),
    );
  });

  it('data display — List, Descriptions, Statistic, Timeline, Segmented, Typography, Result', () => {
    expect(
      reactHtml(
        <R.List header="标题">
          <R.ListItem title="第一项" description="说明" />
        </R.List>,
      ),
    ).toBe(
      vueHtml(V.List, { header: undefined }, {
        header: () => '标题',
        default: () => h(V.ListItem, { title: '第一项', description: '说明' }),
      }),
    );

    const items = [
      { label: '订单号', value: 'o-1024' },
      { label: '状态', value: '已完成' },
      { label: '备注', value: '无', span: 2 },
    ];
    expect(reactHtml(<R.Descriptions items={items} bordered columns={2} />)).toBe(
      vueHtml(V.Descriptions, { items, bordered: true, columns: 2 }),
    );

    expect(reactHtml(<R.Statistic label="月活" value={1234567.891} precision={2} trend="up" suffix="人" />)).toBe(
      vueHtml(V.Statistic, { label: '月活', value: 1234567.891, precision: 2, trend: 'up', suffix: '人' }),
    );

    const events = [
      { key: '1', title: '创建订单', time: '10:00', status: 'success' as const },
      { key: '2', title: '等待付款', time: '10:02', status: 'process' as const },
    ];
    expect(reactHtml(<R.Timeline items={events} />)).toBe(vueHtml(V.Timeline, { items: events }));

    const segments = [{ value: 'day', label: '日' }, { value: 'week', label: '周' }];
    expect(reactHtml(<R.Segmented options={segments} value="week" />)).toBe(
      vueHtml(V.Segmented, { options: segments, modelValue: 'week' }),
    );

    expect(reactHtml(<R.Typography as="title" level={2} strong>标题</R.Typography>)).toBe(
      vueHtml(V.Typography, { as: 'title', level: 2, strong: true }, { default: () => '标题' }),
    );
    expect(reactHtml(<R.Typography ellipsis={2}>很长的一段文字</R.Typography>)).toBe(
      vueHtml(V.Typography, { ellipsis: 2 }, { default: () => '很长的一段文字' }),
    );

    expect(reactHtml(<R.Result status="success" title="提交成功" description="我们会尽快处理" />)).toBe(
      vueHtml(V.Result, { status: 'success', title: '提交成功', description: '我们会尽快处理' }),
    );
  });

  it('Icon renders identical SVG in both frameworks', () => {
    for (const name of ['check', 'chevron-down', 'star', 'loading'] as const) {
      expect(reactHtml(<R.Icon name={name} size={18} />)).toBe(vueHtml(V.Icon, { name, size: 18 }));
    }
    expect(reactHtml(<R.Icon name="check" label="完成" />)).toBe(
      vueHtml(V.Icon, { name: 'check', label: '完成' }),
    );
  });

  it('DatePicker — closed trigger and the open calendar grid', () => {
    const value = new Date(2026, 8, 15);
    expect(reactHtml(<R.DatePicker value={value} clearable />)).toBe(
      vueHtml(V.DatePicker, { modelValue: value, clearable: true }),
    );
    expect(reactHtml(<R.DatePicker value={null} placeholder="选择日期" />)).toBe(
      vueHtml(V.DatePicker, { modelValue: null, placeholder: '选择日期' }),
    );
  });

  it('ConfigProvider emits the same theme attributes', () => {
    expect(reactHtml(<R.ConfigProvider mode="dark" density="compact" />)).toBe(
      vueHtml(V.ConfigProvider, { mode: 'dark', density: 'compact' }),
    );
  });

  it('Transfer — both panels, ticks and the move buttons', () => {
    const items = [
      { key: 'a', label: 'Alpha' },
      { key: 'b', label: 'Bravo' },
      { key: 'c', label: 'Charlie', disabled: true },
    ];
    expect(reactHtml(<R.Transfer items={items} value={['b']} />)).toBe(
      vueHtml(V.Transfer, { items, modelValue: ['b'] }),
    );
    expect(reactHtml(<R.Transfer items={items} value={[]} searchable />)).toBe(
      vueHtml(V.Transfer, { items, modelValue: [], searchable: true }),
    );
  });

  it('Cascader — closed trigger and a browsed path', () => {
    const options = [
      { value: 'zj', label: '浙江', children: [{ value: 'hz', label: '杭州' }] },
      { value: 'js', label: '江苏', disabled: true },
    ];
    expect(reactHtml(<R.Cascader options={options} value={[]} placeholder="请选择地区" />)).toBe(
      vueHtml(V.Cascader, { options, modelValue: [], placeholder: '请选择地区' }),
    );
    expect(reactHtml(<R.Cascader options={options} value={['zj', 'hz']} clearable />)).toBe(
      vueHtml(V.Cascader, { options, modelValue: ['zj', 'hz'], clearable: true }),
    );
  });

  it('ColorPicker, TimePicker and AutoComplete triggers', () => {
    expect(reactHtml(<R.ColorPicker value="#4169ef" />)).toBe(
      vueHtml(V.ColorPicker, { modelValue: '#4169ef' }),
    );
    expect(reactHtml(<R.TimePicker value={{ hour: 9, minute: 30 }} clearable />)).toBe(
      vueHtml(V.TimePicker, { modelValue: { hour: 9, minute: 30 }, clearable: true }),
    );
    expect(reactHtml(<R.AutoComplete value="al" suggestions={['alpha', 'algo']} />)).toBe(
      vueHtml(V.AutoComplete, { modelValue: 'al', suggestions: ['alpha', 'algo'] }),
    );
  });

  it('InputTag and InputOtp — cells and chips line up', () => {
    expect(reactHtml(<R.InputTag tags={['vue', 'react']} placeholder="回车添加" />)).toBe(
      vueHtml(V.InputTag, { modelValue: ['vue', 'react'], placeholder: '回车添加' }),
    );
    expect(reactHtml(<R.InputOtp value="123" length={6} />)).toBe(
      vueHtml(V.InputOtp, { modelValue: '123', length: 6 }),
    );
  });

  it('Image, Splitter and the small parts', () => {
    expect(reactHtml(<R.Image src="/a.png" alt="示例" ratio="16 / 9" preview />)).toBe(
      vueHtml(V.Image, { src: '/a.png', alt: '示例', ratio: '16 / 9', preview: true }),
    );
    expect(reactHtml(<R.Splitter value={30}>{[<div key="a">左</div>, <div key="b">右</div>]}</R.Splitter>)).toBe(
      vueHtml(V.Splitter, { modelValue: 30 }, { start: () => h('div', '左'), end: () => h('div', '右') }),
    );
    expect(reactHtml(<R.Link href="/docs">文档</R.Link>)).toBe(
      vueHtml(V.Link, { href: '/docs' }, { default: () => '文档' }),
    );
    expect(reactHtml(<R.Link href="/docs" disabled underline="always">文档</R.Link>)).toBe(
      vueHtml(V.Link, { href: '/docs', disabled: true, underline: 'always' }, { default: () => '文档' }),
    );
    expect(reactHtml(<R.ButtonGroup><R.Button>一</R.Button></R.ButtonGroup>)).toBe(
      vueHtml(V.ButtonGroup, {}, { default: () => h(V.Button, null, { default: () => '一' }) }),
    );
    expect(reactHtml(<R.PageHeader title="订单详情" subtitle="#10241" />)).toBe(
      vueHtml(V.PageHeader, { title: '订单详情', subtitle: '#10241' }),
    );
    expect(reactHtml(<R.FloatButton icon="plus" />)).toBe(vueHtml(V.FloatButton, { icon: 'plus' }));
  });
});
