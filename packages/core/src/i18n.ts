import type { AgentLabels } from './behaviors/agent.js';
/** Strings every component may need. Adding a key is a minor version bump. */
export interface Locale {
  agent?: Partial<AgentLabels>;
  name: string;
  dir: 'ltr' | 'rtl';
  common: { ok: string; cancel: string; close: string; clear: string; loading: string };
  dialog: { confirm: string; cancel: string };
  input: { placeholder: string };
  select: { placeholder: string; empty: string };
}

export const zhCN: Locale = {
  name: 'zh-CN',
  dir: 'ltr',
  common: { ok: '确定', cancel: '取消', close: '关闭', clear: '清空', loading: '加载中' },
  dialog: { confirm: '确定', cancel: '取消' },
  input: { placeholder: '请输入' },
  select: { placeholder: '请选择', empty: '暂无数据' },
};

export const enUS: Locale = {
  name: 'en-US',
  dir: 'ltr',
  common: { ok: 'OK', cancel: 'Cancel', close: 'Close', clear: 'Clear', loading: 'Loading' },
  dialog: { confirm: 'Confirm', cancel: 'Cancel' },
  input: { placeholder: 'Please enter' },
  select: { placeholder: 'Please select', empty: 'No data' },
};

export const arEG: Locale = {
  name: 'ar-EG',
  dir: 'rtl',
  common: { ok: 'موافق', cancel: 'إلغاء', close: 'إغلاق', clear: 'مسح', loading: 'جارٍ التحميل' },
  dialog: { confirm: 'تأكيد', cancel: 'إلغاء' },
  input: { placeholder: 'أدخل قيمة' },
  select: { placeholder: 'اختر', empty: 'لا توجد بيانات' },
};

export const locales = { 'zh-CN': zhCN, 'en-US': enUS, 'ar-EG': arEG } as const;
export type LocaleName = keyof typeof locales;

export const defaultLocale = zhCN;
