/**
 * 由 scripts/build-framework-stats.mjs 统计各端对外导出的组件名生成，请勿手改。
 * 手填的覆盖数字必然会和代码对不上。
 */
export const frameworkStats: Record<string, number> = {
  "vue-next": 138,
  "vue": 139,
  "react": 138,
  "miniprogram": 140,
  "mobile-vue": 157,
  "mobile-react": 157,
  "flutter": 131
}

/** 以 vue-next 为基准的组件总数 */
export const totalComponents = 138
