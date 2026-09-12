# 源码状态快照

<!-- 由 scripts/build-doc-status.mjs 生成，请勿手改。 -->

运行 `npm run build:docs` 更新；`npm run check:docs` 检查陈旧快照及旧任务去向。
数字是源码与生成物的统计，不代表包已发布，也不代表实机验收完成。

## 当前规模

| 端 | 覆盖矩阵（源组件文件口径） | frameworkStats（导出名口径） |
| --- | ---: | ---: |
| vue-next | 119 | 119 |
| vue | 119 | 120 |
| react | 119 | 119 |
| miniprogram | 119 | 121 |
| flutter | 119 | 112 |

两列口径不同，不能互当总数：矩阵数的是各端的源组件文件，frameworkStats 数的是
使用方能 import 到的名字。差额逐项如下——能一一对上，两个数字才都可信。
移动专有组件不进入 Web 覆盖矩阵。

| 端 | 导出里有、矩阵里没有 | 矩阵里有、导出里没有 | 说明 |
| --- | --- | --- | --- |
| vue-next | — | — | — |
| vue | IConfirmLayer | — | IConfirmLayer — confirm() 的宿主。Vue 2.7 没有 Teleport，宿主要由使用方自己放进模板，所以只有那一端对外导出 |
| react | — | — | — |

golden 文件包含 **1040** 条 expect；构建脚本生成断言，不执行 Dart SDK 测试。
共享 SVG 图标定义 **52** 项；共享逻辑模块 **48** 个。

## 共享逻辑目录

- [affix.ts](../packages/common/src/logic/affix.ts)
- [agent.ts](../packages/common/src/logic/agent.ts)
- [anchor.ts](../packages/common/src/logic/anchor.ts)
- [avatar.ts](../packages/common/src/logic/avatar.ts)
- [calendar.ts](../packages/common/src/logic/calendar.ts)
- [carousel.ts](../packages/common/src/logic/carousel.ts)
- [chart.ts](../packages/common/src/logic/chart.ts)
- [color.ts](../packages/common/src/logic/color.ts)
- [confirm.ts](../packages/common/src/logic/confirm.ts)
- [countdown.ts](../packages/common/src/logic/countdown.ts)
- [date.ts](../packages/common/src/logic/date.ts)
- [file.ts](../packages/common/src/logic/file.ts)
- [flow.ts](../packages/common/src/logic/flow.ts)
- [gantt.ts](../packages/common/src/logic/gantt.ts)
- [href.ts](../packages/common/src/logic/href.ts)
- [image.ts](../packages/common/src/logic/image.ts)
- [indexes.ts](../packages/common/src/logic/indexes.ts)
- [keypad.ts](../packages/common/src/logic/keypad.ts)
- [locale.ts](../packages/common/src/logic/locale.ts)
- [mention.ts](../packages/common/src/logic/mention.ts)
- [menu.ts](../packages/common/src/logic/menu.ts)
- [multiselect.ts](../packages/common/src/logic/multiselect.ts)
- [number.ts](../packages/common/src/logic/number.ts)
- [otp.ts](../packages/common/src/logic/otp.ts)
- [overflow.ts](../packages/common/src/logic/overflow.ts)
- [overlay.ts](../packages/common/src/logic/overlay.ts)
- [pagination.ts](../packages/common/src/logic/pagination.ts)
- [palette.ts](../packages/common/src/logic/palette.ts)
- [picker.ts](../packages/common/src/logic/picker.ts)
- [pull.ts](../packages/common/src/logic/pull.ts)
- [qrcode.ts](../packages/common/src/logic/qrcode.ts)
- [range.ts](../packages/common/src/logic/range.ts)
- [schedule.ts](../packages/common/src/logic/schedule.ts)
- [scroll.ts](../packages/common/src/logic/scroll.ts)
- [select.ts](../packages/common/src/logic/select.ts)
- [splitter.ts](../packages/common/src/logic/splitter.ts)
- [table.ts](../packages/common/src/logic/table.ts)
- [taginput.ts](../packages/common/src/logic/taginput.ts)
- [theme.ts](../packages/common/src/logic/theme.ts)
- [time.ts](../packages/common/src/logic/time.ts)
- [toast.ts](../packages/common/src/logic/toast.ts)
- [transfer.ts](../packages/common/src/logic/transfer.ts)
- [tree.ts](../packages/common/src/logic/tree.ts)
- [upload.ts](../packages/common/src/logic/upload.ts)
- [validate.ts](../packages/common/src/logic/validate.ts)
- [virtual.ts](../packages/common/src/logic/virtual.ts)
- [watermark.ts](../packages/common/src/logic/watermark.ts)
- [wordcloud.ts](../packages/common/src/logic/wordcloud.ts)

## F1 已校准项的源码证据

以下用于防止历史完成记录引用不存在的实现；关键词只提供代码锚点，不是完整行为测试。
Splitter 双击复位、水印节点恢复、动效全覆盖等要求单独保留在主台账。

| 原项 | 源码 |
| --- | --- |
| 动效曲线 | [packages/common/src/tokens/index.ts](../packages/common/src/tokens/index.ts) |
| 图片预览 | [src/components/IImageViewer.vue](../src/components/IImageViewer.vue) |
| 日历 | [src/components/ICalendar.vue](../src/components/ICalendar.vue) |
| 颜色选择 | [src/components/IColorPicker.vue](../src/components/IColorPicker.vue) |
| 页面框架 | [src/components/ILayout.vue](../src/components/ILayout.vue) |
| 吸顶与返回顶部 | [src/components/ISticky.vue](../src/components/ISticky.vue) |
| 吸顶与返回顶部 | [src/components/IBackTop.vue](../src/components/IBackTop.vue) |
| 索引栏（IndexBar 的现有实现） | [packages/mobile-vue/src/components/IIndexes.vue](../packages/mobile-vue/src/components/IIndexes.vue) |
| 索引栏（React） | [packages/mobile-react/src/components/Indexes.tsx](../packages/mobile-react/src/components/Indexes.tsx) |
| 下拉刷新（PullRefresh 的现有实现） | [packages/mobile-vue/src/components/IPullDownRefresh.vue](../packages/mobile-vue/src/components/IPullDownRefresh.vue) |
| 下拉刷新（React） | [packages/mobile-react/src/components/PullDownRefresh.tsx](../packages/mobile-react/src/components/PullDownRefresh.tsx) |
| 甘特图 | [src/components/IChartGantt.vue](../src/components/IChartGantt.vue) |
| 词云 | [src/components/IChartWordCloud.vue](../src/components/IChartWordCloud.vue) |
| 提及（与第 9 批重复） | [src/components/IMentions.vue](../src/components/IMentions.vue) |

当前动效曲线：`--i-motion-easing`、`--i-motion-easing-out`、`--i-motion-easing-in`、`--i-motion-easing-spring`。
曲线已定义不代表 Tree、列表、按压及所有动效开关均已接入，剩余范围见 A3。
