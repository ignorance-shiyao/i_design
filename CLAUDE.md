# i_design 项目约定

本文件是这个仓库的硬性规则。**违反其中任何一条都算缺陷**，即使构建通过、测试全绿。

## 视觉禁令

### 禁止用加粗/加深的边线表达状态或类型

**绝对禁止**这类写法：

```css
/* 禁止 */
border-left: 3px solid var(--i-color-brand);
border-left: 4px solid var(--i-color-danger);
border-top: 3px solid …;   /* 任何方向都一样 */
```

即用一条比其余边框更粗、颜色更重的边线，去标记「这是什么类型」「这是什么状态」。
不论出现在提示条、卡片、列表项、附件条、标签页还是任何别处，一律不用。

**替代做法**：状态与类型用**图标 + 淡底色块**表达，边框保持四边等宽的发丝线：

```css
/* 正确 */
border: 1px solid var(--i-color-hairline);

.x__icon {
  color: var(--i-color-danger);
  background: color-mix(in srgb, var(--i-color-danger) 12%, transparent);
}
```

并且**颜色不能是唯一线索**——同时给出文字标签（「图片」「错误」），
色觉障碍用户与灰度打印才读得出来。

例外：用 `border` 拼几何形状（例如表格排序的小三角，靠
`border-left: 4px solid transparent` 构成三角形）不属于此列，那不是边线样式。

### 元素颜色一律纯色，不用渐变

按钮、徽标、进度条、日期选中态、卡片底色等**元素的填充色必须是纯色**：

```css
/* 禁止 */
background: var(--i-gradient-brand);
background: linear-gradient(135deg, #6d8bff, #4a63c4);

/* 正确 */
background: var(--i-color-brand);
```

渐变会让同一个主题色在不同尺寸的元素上呈现出不同的观感，
主题配置换色后也更难保证对比度。

例外：**纹理与氛围底**不属于元素色，可以继续用渐变——
点阵网格（`radial-gradient` 画点）、页面顶部的光晕、遮罩
（`mask-image`）、骨架屏的扫光。它们描述的是背景质感，不是某个控件的颜色。

### 图标不用 emoji

图标一律走 `packages/common/src/icons/index.ts` 的 SVG path，小程序端用 CSS mask
跟随 `currentColor`。任何位置都不得用 emoji 充当图标。

## 架构约定

- **令牌、图标、纯逻辑只存在一份**，放在 `packages/common`；各端只写渲染适配。
- 组件样式**只引用语义令牌**（`var(--i-color-*)` / `var(--i-radius-*)`），
  不写死色值与尺寸——否则主题配置面板一调就会露馅。
- 「清单类」文件一律按目录生成（导出清单、覆盖矩阵、小程序四件套），
  手写必然会漏，且漏掉不会让构建失败。生成物见 `docs/HANDOVER.md`。

## 交付约定

- **「构建通过」不等于「能用」**：改了界面就用 Playwright 真跑一遍看截图；
  改了依赖就在 `git archive` 出的干净树里验证。
- 新增组件要五端齐备（Vue3 / Vue2 / React / 小程序 / Flutter），
  跑 `npm run check:parity`，覆盖矩阵不得回退。
- 文档站文案从**产品自身视角**写：不写「对标某某库」、不写「抄自哪里」、
  不把组件数量当卖点。

详细的目录地图、生成物清单与待办见 `docs/HANDOVER.md`。
