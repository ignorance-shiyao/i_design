import { resolveAgentLabels, useApproval, useAgentStatus, safeSourceHref, useTaskList, type AgentStatus, type AgentTask, type ApprovalStatus, type AgentLabels } from '@i-design/core';
import { defineComponent, h, type PropType } from 'vue';
import { useConfig } from './ConfigProvider.js';
import { toProps } from '../utils.js';
const labelsProp = Object as PropType<Partial<AgentLabels>>;
export const ApprovalCard = defineComponent({
    name: 'IApprovalCard',
    props: { title: { type: String, required: true }, description: String, status: { type: String as PropType<ApprovalStatus>, default: 'pending' }, busy: Boolean, labels: labelsProp },
    emits: ['approve', 'reject'],
    setup(props, { emit, slots }) {
        const config = useConfig();
        return () => {
            const b = useApproval({ ...props, labels: resolveAgentLabels(config.value.locale, props.labels), onApprove: () => emit('approve'), onReject: () => emit('reject') });
            return h('section', toProps(b.root), [h('div', { class: 'i-agent-eyebrow' }, b.statusLabel), h('h3', { class: 'i-agent-title' }, props.title), props.description ? h('p', { class: 'i-agent-description' }, props.description) : null,
                slots.default ? h('div', { class: 'i-agent-detail' }, slots.default()) : null,
                h('div', { class: 'i-agent-actions' }, [h('button', toProps(b.reject), b.labels.reject), h('button', toProps(b.approve), props.busy ? b.labels.running : b.labels.approve)])]);
        };
    },
});
export const ToolChip = defineComponent({
    name: 'IToolChip', props: { label: { type: String, required: true }, status: { type: String as PropType<AgentStatus>, default: 'pending' }, detail: String, labels: labelsProp },
    setup(props) {
        const config = useConfig();
        return () => {
            const b = useAgentStatus(props.status, resolveAgentLabels(config.value.locale, props.labels));
            const content = [h('span', { class: 'i-agent-dot', 'aria-hidden': 'true' }), h('span', props.label), h('span', { class: 'i-agent-meta' }, b.label)];
            const attrs = { class: 'i-tool-chip', 'data-status': props.status };
            return props.detail ? h('details', attrs, [h('summary', content), h('pre', { class: 'i-agent-detail' }, props.detail)]) : h('span', attrs, content);
        };
    },
});
export const TaskList = defineComponent({
    name: 'ITaskList', props: { title: String, items: { type: Array as PropType<AgentTask[]>, required: true }, labels: labelsProp, onRetry: Function as PropType<(id: string) => void> },
    setup(props) {
        const config = useConfig();
        return () => {
            const labels = resolveAgentLabels(config.value.locale, props.labels);
            const title = props.title ?? labels.taskTitle;
            const count = useTaskList(props.items, props.onRetry, labels);
            return h('section', { class: 'i-agent-card i-task-list', 'aria-label': title }, [
                h('div', { class: 'i-agent-heading' }, [h('h3', { class: 'i-agent-title' }, title), h('span', { class: 'i-agent-meta' }, `${count.completed} / ${count.total}`)]),
                h('ol', { class: 'i-task-list__items' }, count.rows.map(({ item, status: b, retry }, index) => {
                    return h('li', { class: 'i-task-row', 'data-status': item.status, key: item.id }, [
                        h('span', { class: 'i-task-row__number', 'aria-hidden': 'true' }, String(index + 1)),
                        h('div', { class: 'i-task-row__body' }, [h('strong', item.title), item.description ? h('p', { class: 'i-agent-description' }, item.description) : null]),
                        h('span', toProps(b.root), b.label),
                        retry ? h('button', toProps(retry), count.retryLabel) : null,
                    ]);
                })),
            ]);
        };
    },
});
export const ContextCard = defineComponent({
    name: 'IContextCard', props: { title: { type: String, required: true }, excerpt: { type: String, required: true }, source: { type: String, required: true }, href: String, meta: String },
    setup(props) {
        const config = useConfig();
        return () => {
            const href = safeSourceHref(props.href);
            return h('article', { class: 'i-agent-card i-context-card' }, [h('div', { class: 'i-agent-eyebrow' }, props.meta ?? resolveAgentLabels(config.value.locale).sourceTitle), h('h3', { class: 'i-agent-title' }, props.title), h('p', { class: 'i-agent-description' }, props.excerpt), h('div', { class: 'i-context-card__source' }, [href ? h('a', { href }, props.source) : h('span', props.source)])]);
        };
    },
});
