/**
 * 由 scripts/build-framework-stats.mjs 统计各端对外导出的组件名生成，请勿手改。
 * 手填的覆盖数字必然会和代码对不上。
 */
export const frameworkStats: Record<string, number> = {
  "vue-next": 122,
  "vue": 123,
  "react": 122,
  "miniprogram": 124,
  "mobile-vue": 141,
  "mobile-react": 141,
  "flutter": 115
}

/** 以 vue-next 为基准的组件总数 */
export const totalComponents = 122
