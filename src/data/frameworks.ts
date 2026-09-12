export type FrameworkId =
  | 'vue-next'
  | 'vue'
  | 'react'
  | 'miniprogram'
  | 'mobile-vue'
  | 'mobile-react'
  | 'flutter'

export interface Framework {
  id: FrameworkId
  /** 标签页上的短名 */
  label: string
  /** 侧栏与卡片上的完整说明 */
  runtime: string
  pkg: string
  install: string
  /** 代码高亮用的语言 */
  lang: string
  note: string
}

/** 各端的顺序：Web 三端 → 小程序 → 移动两端 → Flutter，与文档站的叙述顺序一致 */
export const frameworks: Framework[] = [
  {
    id: 'vue-next',
    label: 'Vue 3',
    runtime: 'Vue 3.4+',
    pkg: '@i-design/vue-next',
    install: 'npm i @i-design/vue-next',
    lang: 'vue',
    note: '组件源头。文档站本身就跑在这一端上，你看到的每个示例都是它。'
  },
  {
    id: 'vue',
    label: 'Vue 2',
    runtime: 'Vue 2.7',
    pkg: '@i-design/vue',
    install: 'npm i @i-design/vue',
    lang: 'vue',
    note: 'v-model 走 value / input，模板单根，Teleport 由 _Portal 代替——差异只在语法约束。'
  },
  {
    id: 'react',
    label: 'React',
    runtime: 'React 18 / 19',
    pkg: '@i-design/react',
    install: 'npm i @i-design/react',
    lang: 'tsx',
    note: '与 Vue 端共用同一份 CSS，因此「React 版长得不一样」在架构上不可能发生。'
  },
  {
    id: 'miniprogram',
    label: '小程序',
    runtime: '微信小程序基础库 2.9+',
    pkg: '@i-design/miniprogram',
    install: '把 dist 目录拷进小程序工程，或用 npm 构建',
    lang: 'html',
    note: 'WXSS 不支持部分选择器，样式由构建脚本自动降级；令牌值与 Web 端逐一相等。'
  },
  {
    id: 'mobile-vue',
    label: 'Mobile Vue',
    runtime: 'Vue 3.4+',
    pkg: '@i-design/mobile-vue',
    install: 'npm i @i-design/mobile-vue',
    lang: 'vue',
    note: '复用 Vue 3 全部组件，样式经移动覆盖层调到 44px 触控尺度，另加 Cell / ActionSheet / Toast。'
  },
  {
    id: 'mobile-react',
    label: 'Mobile React',
    runtime: 'React 18 / 19',
    pkg: '@i-design/mobile-react',
    install: 'npm i @i-design/mobile-react',
    lang: 'tsx',
    note: '与 Mobile Vue 同一套覆盖层，两端的触控尺度、安全区处理完全一致。'
  },
  {
    id: 'flutter',
    label: 'Flutter',
    runtime: 'Flutter 3.10+ / Dart 3',
    pkg: 'i_design',
    install: "在 pubspec.yaml 加 i_design: ^0.1.0",
    lang: 'dart',
    note: '唯一无法共享 CSS 与 TS 的一端：令牌编译成 Dart 常量，交互规则移植后由黄金测试锁住。'
  }
]

export const frameworkById = (id: FrameworkId) => frameworks.find((f) => f.id === id)!

/*
 * 这里不再对外给「各端有多少个组件」的取数口径。
 *
 * 站点上曾经有两个口径（源组件文件数与导出名数），数字对不上，读者无从判断谁对。
 * 现在口径只留在 docs/SOURCE_STATUS.md 里，两列并排且差额逐项解释；
 * 站点展示的是覆盖矩阵本身——读者真正关心的是「我这一端有没有这个组件」，
 * 而不是总数。
 */
