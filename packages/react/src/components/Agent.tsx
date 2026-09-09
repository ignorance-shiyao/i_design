import { resolveAgentLabels, useApproval, useAgentStatus, safeSourceHref, useTaskList, type AgentStatus, type AgentTask, type ApprovalOptions, type AgentLabels } from '@i-design/core';
import type { ReactNode } from 'react';
import { useConfig } from './ConfigProvider.js';
import { toProps } from '../utils.js';
export interface ApprovalCardProps extends ApprovalOptions {
    description?: string;
    children?: ReactNode;
}
export function ApprovalCard(props: ApprovalCardProps) {
    const labels = resolveAgentLabels(useConfig().locale, props.labels);
    const b = useApproval({ ...props, labels });
    return <section {...toProps(b.root)}>
    <div className="i-agent-eyebrow">{b.statusLabel}</div>
    <h3 className="i-agent-title">{props.title}</h3>
    {props.description && <p className="i-agent-description">{props.description}</p>}
    {props.children && <div className="i-agent-detail">{props.children}</div>}
    <div className="i-agent-actions"><button {...toProps(b.reject)}>{b.labels.reject}</button><button {...toProps(b.approve)}>{props.busy ? b.labels.running : b.labels.approve}</button></div>
  </section>;
}
export interface ToolChipProps {
    label: string;
    status?: AgentStatus;
    detail?: string;
    labels?: Partial<AgentLabels>;
}
export function ToolChip({ label, status = 'pending', detail, labels }: ToolChipProps) {
    const b = useAgentStatus(status, resolveAgentLabels(useConfig().locale, labels));
    const content = <><span className="i-agent-dot" aria-hidden="true"/><span>{label}</span><span className="i-agent-meta">{b.label}</span></>;
    return detail ? <details className="i-tool-chip" data-status={status}><summary>{content}</summary><pre className="i-agent-detail">{detail}</pre></details>
        : <span className="i-tool-chip" data-status={status}>{content}</span>;
}
export interface TaskListProps {
    title?: string;
    items: AgentTask[];
    labels?: Partial<AgentLabels>;
    onRetry?: (id: string) => void;
}
export function TaskList({ title, items, labels, onRetry }: TaskListProps) {
    const text = resolveAgentLabels(useConfig().locale, labels);
    title = title ?? text.taskTitle;
    const count = useTaskList(items, onRetry, text);
    return <section className="i-agent-card i-task-list" aria-label={title}>
    <div className="i-agent-heading"><h3 className="i-agent-title">{title}</h3><span className="i-agent-meta">{count.completed} / {count.total}</span></div>
    <ol className="i-task-list__items">{count.rows.map(({ item, status: b, retry }, index) => {
            return <li className="i-task-row" data-status={item.status} key={item.id}>
        <span className="i-task-row__number" aria-hidden="true">{index + 1}</span>
        <div className="i-task-row__body"><strong>{item.title}</strong>{item.description && <p className="i-agent-description">{item.description}</p>}</div>
        <span {...toProps(b.root)}>{b.label}</span>
        {retry && <button {...toProps(retry)}>{count.retryLabel}</button>}
      </li>;
        })}</ol>
  </section>;
}
export interface ContextCardProps {
    title: string;
    excerpt: string;
    source: string;
    href?: string;
    meta?: string;
}
export function ContextCard({ title, excerpt, source, href, meta }: ContextCardProps) {
    const text = resolveAgentLabels(useConfig().locale);
    const safeHref = safeSourceHref(href);
    return <article className="i-agent-card i-context-card"><div className="i-agent-eyebrow">{meta ?? text.sourceTitle}</div><h3 className="i-agent-title">{title}</h3><p className="i-agent-description">{excerpt}</p><div className="i-context-card__source">{safeHref ? <a href={safeHref}>{source}</a> : <span>{source}</span>}</div></article>;
}
