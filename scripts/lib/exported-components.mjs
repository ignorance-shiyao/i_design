/**
 * 各端「对外导出的组件名」。
 *
 * 两处在用：`build-framework-stats.mjs` 拿它数数量，
 * `build-doc-status.mjs` 拿它解释覆盖矩阵与导出名两列为什么对不上。
 * 各写一份的话，两处会对同一个端给出不同的名单，而那正是这条口径要解决的问题。
 *
 * 不数文件数：React 把 Checkbox 与 CheckboxGroup 放在同一个文件里，按文件数会少算；
 * 小程序把两者合成一个组件，按文件数又会多算。能横向比较的是「使用方能拿到几个组件」。
 */
import { readFileSync } from 'node:fs'

/** 从 export 语句里取出大写开头的值导出（跳过 type 导出与工具函数） */
export function exportedComponents(file) {
  const src = readFileSync(file, 'utf8')
  const names = new Set()

  // export { default as IButton } from './...'
  for (const [, name] of src.matchAll(/export \{ default as ([A-Z]\w*) \}/g)) names.add(name)
  // export { Button, type ButtonProps } from './...'
  for (const [, group] of src.matchAll(/export \{([^}]*)\} from/g)) {
    for (const entry of group.split(',')) {
      const token = entry.trim()
      if (!token || token.startsWith('type ') || token.startsWith('default ')) continue
      const name = token.split(/\s+as\s+/).pop().trim()
      /*
       * FormContext 之类的上下文对象是给使用方拼装表单用的，不是组件。
       * 但 Provider 结尾的要算：ConfigProvider 是使用方实实在在会 import 的组件，
       * Vue 端也把 IConfigProvider 算进去了——排除它只会让两端的口径对不上。
       */
      if (/^[A-Z]/.test(name) && !/Context$/.test(name)) names.add(name)
    }
  }
  // export { IButton, IInput, ... }（vue-next 的聚合导出块）
  for (const [, group] of src.matchAll(/export \{([^}]*)\}\s*(?:\n|$)/g)) {
    for (const entry of group.split(',')) {
      const name = entry.trim()
      if (/^I[A-Z]\w*$/.test(name)) names.add(name)
    }
  }
  return names
}
