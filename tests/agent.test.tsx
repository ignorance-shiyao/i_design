import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { mount } from '@vue/test-utils';
import * as R from '@i-design/react';
import * as V from '@i-design/vue';
import { safeSourceHref, useApproval, useTaskList, type AgentStatus } from '@i-design/core';
afterEach(cleanup);
const normalize = (html: string) => html.replace(/<!--[^>]*-->/g, '').replace(/>\s+</g, '><').trim();
function parity(Component: React.ComponentType<any>, VueComponent: any, props: Record<string, unknown>) {
    const r = render(<Component {...props}/>);
    const v = mount(VueComponent, { props });
    expect(normalize(r.container.innerHTML)).toBe(normalize(v.html()));
    r.unmount();
    v.unmount();
}
describe('agent cross-framework contract', () => {
    it.each(['pending', 'approved', 'rejected'] as const)('approval parity: %s, including busy', status => {
        for (const busy of [false, true])
            parity(R.ApprovalCard, V.ApprovalCard, { title: 'Confirm', description: 'Scope', status, busy });
    });
    it.each(['pending', 'running', 'complete', 'error'] as AgentStatus[])('tool and task parity: %s', status => {
        for (const detail of [undefined, '<script>alert(1)</script>'])
            parity(R.ToolChip, V.ToolChip, { label: 'read', status, detail });
        parity(R.TaskList, V.TaskList, { items: [{ id: 'a', title: 'Check', description: 'Details', status }], onRetry: vi.fn() });
    });
    it('source and empty task parity', () => {
        for (const href of [undefined, 'https://example.com', 'javascript:alert(1)'])
            parity(R.ContextCard, V.ContextCard, { title: 'Source', excerpt: 'Evidence', source: 'Document', href });
        parity(R.TaskList, V.TaskList, { items: [] });
    });
    it('keeps approval controlled and locks completed requests in React', () => {
        const onApprove = vi.fn();
        const onReject = vi.fn();
        const view = render(<R.ApprovalCard title="Review" onApprove={onApprove} onReject={onReject}/>);
        fireEvent.click(view.getByText('确认操作'));
        expect(onApprove).toHaveBeenCalledTimes(1);
        expect(view.getByRole('group').getAttribute('data-status')).toBe('pending');
        view.rerender(<R.ApprovalCard title="Review" status="approved" onApprove={onApprove} onReject={onReject}/>);
        fireEvent.click(view.getByText('确认操作'));
        fireEvent.click(view.getByText('拒绝'));
        expect(onApprove).toHaveBeenCalledTimes(1);
        expect(onReject).not.toHaveBeenCalled();
    });
    it('emits decisions and respects busy in Vue', async () => {
        const wrapper = mount(V.ApprovalCard, { props: { title: 'Review' } });
        await wrapper.findAll('button')[1].trigger('click');
        expect(wrapper.emitted('approve')).toHaveLength(1);
        expect(wrapper.attributes('data-status')).toBe('pending');
        await wrapper.setProps({ busy: true });
        await wrapper.findAll('button')[1].trigger('click');
        expect(wrapper.emitted('approve')).toHaveLength(1);
        await wrapper.setProps({ busy: false });
        await wrapper.findAll('button')[0].trigger('click');
        expect(wrapper.emitted('reject')).toHaveLength(1);
        wrapper.unmount();
    });
    it('retries only failed items and passes their stable ID in both frameworks', async () => {
        const items = [{ id: 'failed', title: 'Check', status: 'error' as const }, { id: 'waiting', title: 'Write', status: 'pending' as const }];
        const retry = vi.fn();
        const view = render(<R.TaskList items={items} onRetry={retry}/>);
        expect(view.getAllByRole('button')).toHaveLength(1);
        fireEvent.click(view.getByRole('button'));
        expect(retry).toHaveBeenLastCalledWith('failed');
        view.unmount();
        const wrapper = mount(V.TaskList, { props: { items, onRetry: retry } });
        await wrapper.find('button').trigger('click');
        expect(retry).toHaveBeenCalledTimes(2);
        await wrapper.setProps({ items: [{ ...items[0], status: 'running' }] });
        expect(wrapper.find('button').exists()).toBe(false);
        wrapper.unmount();
    });
    it('registers all primitives with the Vue plugin', () => {
        const component = vi.fn();
        V.default.install({ component } as any);
        for (const name of ['IApprovalCard', 'IToolChip', 'ITaskList', 'IContextCard'])
            expect(component).toHaveBeenCalledWith(name, expect.anything());
    });
});
describe('shared behaviors', () => {
    it('guards programmatic approval callbacks while locked', () => {
        const fn = vi.fn();
        for (const props of [{ busy: true }, { status: 'approved' as const }, { status: 'rejected' as const }]) {
            const b = useApproval({ title: 'Review', ...props, onApprove: fn, onReject: fn });
            b.approve.on.click?.({});
            b.reject.on.click?.({});
        }
        expect(fn).not.toHaveBeenCalled();
    });
    it('supports labels and incomplete tasks without fabricated progress', () => {
        const b = useTaskList([{ id: 'x', title: 'X', status: 'error' }], vi.fn(), { error: 'Failed', retry: 'Retry' });
        expect(b.completed).toBe(0);
        expect(b.rows[0].status.label).toBe('Failed');
        expect(b.retryLabel).toBe('Retry');
    });
    it.each(['javascript:alert(1)', 'data:text/html,x', '//evil.test', '/\\evil.test', 'https://a\nb', ' https://a'])('rejects unsafe source %s', href => expect(safeSourceHref(href)).toBeUndefined());
    it.each(['https://example.com', 'http://example.com', '/docs', './docs', '../docs', '#source'])('allows web source %s', href => expect(safeSourceHref(href)).toBe(href));
});
describe('React attribute binding', () => {
    it('maps SVG and input attributes without changing DOM output', () => {
        const props = R.toProps({ class: 'test', attrs: { 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', inputmode: 'decimal' }, on: {} });
        expect(props).toEqual({ className: 'test', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', inputMode: 'decimal' });
    });
});
describe('agent provider localization', () => {
    it('inherits locale and updates it in both adapters', async () => {
        const r = render(<R.ConfigProvider locale="en-US"><R.ApprovalCard title="Review"/></R.ConfigProvider>);
        expect(r.getByText('Approve')).toBeTruthy();
        r.rerender(<R.ConfigProvider locale="zh-CN"><R.ApprovalCard title="Review"/></R.ConfigProvider>);
        expect(r.getByText('确认操作')).toBeTruthy();
        r.unmount();
        const { h } = await import('vue');
        const v = mount(V.ConfigProvider, { props: { locale: 'en-US' }, slots: { default: () => h(V.ApprovalCard, { title: 'Review' }) } });
        expect(v.text()).toContain('Approve');
        await v.setProps({ locale: 'zh-CN' });
        expect(v.text()).toContain('确认操作');
        v.unmount();
    });
    it('explicit labels override the provider', () => {
        const r = render(<R.ConfigProvider locale="en-US"><R.ApprovalCard title="Review" labels={{ approve: 'Apply' }}/></R.ConfigProvider>);
        expect(r.getByText('Apply')).toBeTruthy();
    });
});
