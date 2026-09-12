import { componentSourceFiles } from './componentInventory'

const files = new Set(componentSourceFiles)

// 这些是组合能力或命令式 API，没有同名 SFC；明确真实宿主，避免误报为规划中。
const aliases: Record<string, readonly string[]> = {
  Message: ['src/components/message.ts', 'src/components/IMessageList.vue'],
  'message()': ['src/components/message.ts', 'src/components/IMessageList.vue'],
  Notification: ['src/components/notification.ts', 'src/components/INotificationLayer.vue'],
  notification: ['src/components/notification.ts', 'src/components/INotificationLayer.vue'],
  Confirm: ['src/components/confirm.ts', 'src/components/IConfirmLayer.vue'],
  Marquee: ['src/components/IFlow.vue'],
  Minimap: ['src/components/IFlow.vue'],
  Snapshot: ['src/components/IFlow.vue']
}

/** 仅表示示例源码存在；发布包可安装性、跨端覆盖分别由对应检查负责。 */
export function implementationStatus(api: string): 'ready' | 'planned' {
  return api.split(' / ').every((name) => {
    const required = aliases[name]
    if (required) return required.every((path) => files.has(path))
    const component = /^I[A-Z]/.test(name) ? name : `I${name}`
    return files.has(`src/components/${component}.vue`) ||
      files.has(`packages/mobile-vue/src/components/${component}.vue`)
  }) ? 'ready' : 'planned'
}
