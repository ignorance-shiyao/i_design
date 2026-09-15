/**
 * 由 scripts/build-framework-stats.mjs 统计各端对外导出的组件名生成，请勿手改。
 * 手填的覆盖数字必然会和代码对不上。
 */
export const frameworkStats: Record<string, number> = {
  "vue-next": 147,
  "vue": 148,
  "react": 147,
  "miniprogram": 149,
  "mobile-vue": 166,
  "mobile-react": 166,
  "flutter": 139
}

/** 以 vue-next 为基准的组件总数 */
export const totalComponents = 147
