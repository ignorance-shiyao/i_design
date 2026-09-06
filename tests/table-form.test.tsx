import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import * as R from '@i-design/react';
import * as V from '@i-design/vue';
import { FormStore, nextSortOrder, spec, useTable, validateValue } from '@i-design/core';

const columns = [
  { key: 'name', title: '姓名', sortable: true },
  { key: 'age', title: '年龄', sortable: true, align: 'end' as const },
];
const data = [
  { name: 'Cara', age: 31 },
  { name: 'Alan', age: 24 },
  { name: 'Bea', age: null as number | null },
];
const rowKey = (row: { name: string }) => row.name;

describe('table model', () => {
  it('sorts locally without mutating the caller array', () => {
    const original = [...data];
    const behavior = useTable({ columns, data, rowKey, sort: { key: 'name', order: 'asc' } });
    expect(behavior.rows.map((r) => r.name)).toEqual(['Alan', 'Bea', 'Cara']);
    expect(data).toEqual(original);
  });

  it('sorts nulls last in both directions', () => {
    const asc = useTable({ columns, data, rowKey, sort: { key: 'age', order: 'asc' } });
    const desc = useTable({ columns, data, rowKey, sort: { key: 'age', order: 'desc' } });
    expect(asc.rows.map((r) => r.age)).toEqual([24, 31, null]);
    expect(desc.rows.map((r) => r.age)).toEqual([31, 24, null]);
  });

  it('leaves order alone when the caller sorts server-side', () => {
    const behavior = useTable({ columns, data, rowKey, manualSort: true, sort: { key: 'name', order: 'asc' } });
    expect(behavior.rows.map((r) => r.name)).toEqual(['Cara', 'Alan', 'Bea']);
  });

  it('cycles sort order asc → desc → none', () => {
    expect(nextSortOrder(null)).toBe('asc');
    expect(nextSortOrder('asc')).toBe('desc');
    expect(nextSortOrder('desc')).toBeNull();
  });

  it('reports sort state through aria-sort', () => {
    const behavior = useTable({ columns, data, rowKey, sort: { key: 'name', order: 'desc' } });
    expect(behavior.headerCell(columns[0]!, 0).attrs['aria-sort']).toBe('descending');
    expect(behavior.headerCell(columns[1]!, 1).attrs['aria-sort']).toBe('none');
  });

  it('derives select-all and indeterminate state', () => {
    const none = useTable({ columns, data, rowKey, selection: 'multiple', selectedKeys: [] });
    const some = useTable({ columns, data, rowKey, selection: 'multiple', selectedKeys: ['Alan'] });
    const all = useTable({ columns, data, rowKey, selection: 'multiple', selectedKeys: ['Cara', 'Alan', 'Bea'] });
    expect(none.selectAll).toMatchObject({ checked: false, indeterminate: false });
    expect(some.selectAll).toMatchObject({ checked: false, indeterminate: true });
    expect(all.selectAll).toMatchObject({ checked: true, indeterminate: false });
  });

  it('single selection replaces rather than accumulates', () => {
    const onSelectionChange = vi.fn();
    const behavior = useTable({ columns, data, rowKey, selection: 'single', selectedKeys: ['Cara'], onSelectionChange });
    behavior.toggleRow(data[1]!, 1);
    expect(onSelectionChange).toHaveBeenCalledWith(['Alan']);
  });

  it('computes sticky offsets from the widths before each fixed column', () => {
    const fixed = [
      { key: 'a', title: 'A', width: 80, fixed: 'start' as const },
      { key: 'b', title: 'B', width: 120, fixed: 'start' as const },
      { key: 'c', title: 'C' },
    ];
    const behavior = useTable({ columns: fixed, data: [], rowKey: () => 'x' });
    expect(behavior.cellStyle(fixed[0]!, 0)).toEqual({ width: '80px', insetInlineStart: '0px' });
    expect(behavior.cellStyle(fixed[1]!, 1)).toEqual({ width: '120px', insetInlineStart: '80px' });
    expect(behavior.cellStyle(fixed[2]!, 2)).toEqual({});
  });

  it('rejects a raw style string, which React cannot accept', () => {
    expect(() => spec('i-x', { style: 'color:red' })).toThrow(/not portable to React/);
  });
});

describe('validation rules', () => {
  const values = {};

  it('required catches empty values but not zero or false', async () => {
    expect(await validateValue('', [{ required: true }], values)).toBe('此项为必填项');
    expect(await validateValue([], [{ required: true }], values)).toBe('此项为必填项');
    expect(await validateValue(0, [{ required: true }], values)).toBeNull();
    expect(await validateValue(false, [{ required: true }], values)).toBeNull();
  });

  it('skips the other rules for empty optional values', async () => {
    expect(await validateValue('', [{ min: 5 }], values)).toBeNull();
    expect(await validateValue('ab', [{ min: 5 }], values)).toBe('不能少于 5');
  });

  it('measures length for strings and magnitude for numbers', async () => {
    expect(await validateValue('abc', [{ max: 2 }], values)).toBe('不能多于 2');
    expect(await validateValue(10, [{ max: 5 }], values)).toBe('不能多于 5');
  });

  it('runs async validators and returns the first failure', async () => {
    const rules = [
      { pattern: /@/, message: '必须是邮箱' },
      { validator: async (v: string) => (v.endsWith('.com') ? null : '只支持 .com') },
    ];
    expect(await validateValue('nope', rules, values)).toBe('必须是邮箱');
    expect(await validateValue('a@b.cn', rules, values)).toBe('只支持 .com');
    expect(await validateValue('a@b.com', rules, values)).toBeNull();
  });

  it('honours the trigger filter', async () => {
    const rules = [{ required: true, trigger: 'blur' as const }];
    expect(await validateValue('', rules, values, undefined, 'change')).toBeNull();
    expect(await validateValue('', rules, values, undefined, 'blur')).toBe('此项为必填项');
  });
});

describe('form store', () => {
  const makeStore = () =>
    new FormStore({
      initialValues: { email: '', age: 0 },
      rules: {
        email: [{ required: true }, { pattern: /@/, message: '必须是邮箱' }],
        age: [{ min: 18, message: '需要满 18 岁' }],
      },
    });

  it('validates everything on submit and blocks the callback', async () => {
    const onSubmit = vi.fn();
    const store = new FormStore({
      initialValues: { email: '' },
      rules: { email: [{ required: true }] },
      onSubmit,
    });
    expect(await store.submit()).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(store.getState().errors.email).toBe('此项为必填项');

    store.setFieldValue('email', 'a@b.com');
    expect(await store.submit()).toBe(true);
    expect(onSubmit).toHaveBeenCalledWith({ email: 'a@b.com' });
  });

  it('tracks dirty state and resets it', async () => {
    const store = makeStore();
    expect(store.isDirty()).toBe(false);
    store.setFieldValue('email', 'x');
    expect(store.isDirty()).toBe(true);
    store.reset();
    expect(store.isDirty()).toBe(false);
    expect(store.getState().errors).toEqual({});
  });

  it('notifies subscribers on every change', () => {
    const store = makeStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.setFieldValue('email', 'a');
    expect(listener).toHaveBeenCalled();
    unsubscribe();
    const count = listener.mock.calls.length;
    store.setFieldValue('email', 'b');
    expect(listener.mock.calls.length).toBe(count);
  });
});

describe('Form in both frameworks', () => {
  const rules = { email: [{ required: true }, { pattern: /@/, message: '必须是邮箱' }] };

  it('React shows the error only after the field is touched', async () => {
    function Demo() {
      const form = R.useForm({ initialValues: { email: '' }, rules });
      return (
        <R.Form form={form}>
          <R.FormField<string> name="email" label="邮箱">
            {({ value, onChange, onBlur }) => (
              <R.Input value={value} onChange={onChange} onBlur={onBlur} />
            )}
          </R.FormField>
          <R.Button type="submit">提交</R.Button>
        </R.Form>
      );
    }
    const { container } = render(<Demo />);
    expect(container.querySelector('[role="alert"]')).toBeNull();

    fireEvent.input(container.querySelector('input')!, { target: { value: 'bad' } });
    fireEvent.blur(container.querySelector('input')!);
    await waitFor(() => expect(container.querySelector('[role="alert"]')?.textContent).toBe('必须是邮箱'));
  });

  it('Vue validates the whole form on submit', async () => {
    const Demo = {
      setup() {
        const form = V.useForm({ initialValues: { email: '' }, rules });
        return () =>
          h(V.Form, { form }, () => [
            h(V.FormField, { name: 'email', label: '邮箱' }, {
              default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) =>
                h(V.Input, { modelValue: value, 'onUpdate:modelValue': onChange }),
            }),
            h(V.Button, { type: 'submit' }, () => '提交'),
          ]);
      },
    };
    const wrapper = mount(Demo, { attachTo: document.body });
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);

    await wrapper.find('form').trigger('submit');
    await nextTick();
    await nextTick();
    expect(wrapper.find('[role="alert"]').text()).toBe('此项为必填项');
    wrapper.unmount();
  });
});
