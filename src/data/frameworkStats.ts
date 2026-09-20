/**
 * 由 scripts/build-framework-stats.mjs 统计各端对外导出的组件名生成，请勿手改。
 * 手填的覆盖数字必然会和代码对不上。
 */
export const frameworkStats: Record<string, number> = {
  "vue-next": 154,
  "vue": 155,
  "react": 154,
  "miniprogram": 156,
  "mobile-vue": 173,
  "mobile-react": 173,
  "flutter": 146
}

/** 以 vue-next 为基准的组件总数 */
export const totalComponents = 154
