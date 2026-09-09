import { spec } from './types.js';
export type AgentStatus = 'pending' | 'running' | 'complete' | 'error';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export interface AgentTask {
    id: string;
    title: string;
    description?: string;
    status: AgentStatus;
}
export interface AgentLabels {
    taskTitle: string;
    sourceTitle: string;
    pending: string;
    running: string;
    complete: string;
    error: string;
    approved: string;
    rejected: string;
    approve: string;
    reject: string;
    retry: string;
}
export const agentLabels: AgentLabels = {
    taskTitle: '执行计划', sourceTitle: '参考来源',
    pending: '等待中', running: '执行中', complete: '已完成', error: '失败',
    approved: '已确认', rejected: '已拒绝', approve: '确认操作', reject: '拒绝', retry: '重试',
};
export function useAgentStatus(status: AgentStatus = 'pending', labels: Partial<AgentLabels> = {}) {
    return { root: spec('i-agent-status', { 'data-status': status }), label: { ...agentLabels, ...labels }[status] };
}
export interface ApprovalOptions {
    title: string;
    status?: ApprovalStatus;
    busy?: boolean;
    labels?: Partial<AgentLabels>;
    onApprove?: () => void;
    onReject?: () => void;
}
/** Controlled approval: the host owns persistence, authorization and async failures. */
export function useApproval(options: ApprovalOptions) {
    const { title, status = 'pending', busy = false } = options;
    const labels = { ...agentLabels, ...options.labels };
    const locked = busy || status !== 'pending';
    return {
        root: spec('i-agent-card i-approval', { role: 'group', 'aria-label': title, 'aria-busy': busy, 'data-status': status }),
        approve: spec('i-agent-action i-agent-action--primary', { type: 'button', disabled: locked }, { click: () => { if (!locked)
                options.onApprove?.(); } }),
        reject: spec('i-agent-action', { type: 'button', disabled: locked }, { click: () => { if (!locked)
                options.onReject?.(); } }),
        labels, statusLabel: labels[status],
    };
}
/** Only web and relative links; executable and protocol-relative URLs are excluded. */
export function safeSourceHref(href?: string): string | undefined {
    if (!href || /[\u0000-\u0020\u007f\\]/.test(href))
        return undefined;
    return /^(https?:\/\/|\/(?!\/)|#|\.\.?\/)/i.test(href) ? href : undefined;
}
export function taskSummary(items: AgentTask[]) {
    return { completed: items.filter(item => item.status === 'complete').length, total: items.length };
}
export function useTaskList(items: AgentTask[], onRetry?: (id: string) => void, labels: Partial<AgentLabels> = {}) {
    const text = { ...agentLabels, ...labels };
    return {
        ...taskSummary(items),
        rows: items.map(item => ({
            item, status: useAgentStatus(item.status, text),
            retry: item.status === 'error' && onRetry ? spec('i-agent-action', {
                type: 'button', 'aria-label': `${text.retry}：${item.title}`,
            }, { click: () => onRetry(item.id) }) : undefined,
        })),
        retryLabel: text.retry,
    };
}
/** Shared locale fallback; explicit labels win over provider translations. */
export function resolveAgentLabels(locale: {
    name: string;
    agent?: Partial<AgentLabels>;
}, overrides?: Partial<AgentLabels>): AgentLabels {
    const fallback: Partial<AgentLabels> = locale.name.startsWith('en') ? {
        pending: 'Pending', running: 'Running', complete: 'Completed', error: 'Failed',
        approved: 'Approved', rejected: 'Rejected', approve: 'Approve', reject: 'Reject', retry: 'Retry',
        taskTitle: 'Execution plan', sourceTitle: 'Source',
    } : locale.name.startsWith('ar') ? {
        pending: 'قيد الانتظار', running: 'قيد التنفيذ', complete: 'مكتمل', error: 'فشل',
        approved: 'تمت الموافقة', rejected: 'مرفوض', approve: 'موافقة', reject: 'رفض', retry: 'إعادة المحاولة',
        taskTitle: 'خطة التنفيذ', sourceTitle: 'المصدر',
    } : {};
    return { ...agentLabels, ...fallback, ...locale.agent, ...overrides };
}
