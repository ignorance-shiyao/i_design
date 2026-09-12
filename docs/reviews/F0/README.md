# F0 交付与实机证据

基线：`main@d445e22b69983daa1e5ba7bfc8d2df766d81a804`。任务仅为 F0。

## 为什么这样改

全景原有 13 项已实现却标为规划中，二维码已实现却标为不做；总览的 TimePicker / Transfer
也标为规划中且没有链接。使用者会据此误判能力缺失。单次改成 ready 仍会在下次新增组件时过期，
因此去掉两页人工维护的 ready / planned，让它们读取同一份按源码目录生成的文件清单。

没有强行合并两页的编辑元数据：全景按选型场景说明能力及排除理由，总览按文档入口组织，
其中还有 Flow 的组合能力。F0 允许共用实现状态作为根治方式，保留分类可减少导航变化。
清单扫描同时包含移动专有组件；组合 API 要求全部组成文件存在，命令式 API 要求入口与宿主存在。
Web FloatButton 与移动 IFab 使用不同标识，避免拿移动实现冒充 Web 能力。

相关优化仅包括：修正二维码的错误排除说明，补上 TimePicker / Transfer 的现有示例入口，
移除图标说明里已过期的「38 个」数字。原因都是消除本次目录核对发现的错误信息。
未改全局视觉与组件实现，E1 / E2 / E4 等独立任务不在本 PR 内。

## 机器校验

- `npm run check:parity`：通过，原有 13 项及子检查通过，新增目录检查与 5 组回归测试通过。
- `npm run typecheck`：通过。
- `npm run build`：通过。
- `node scripts/check-theme-readability.mjs`：通过，报告深色文字/表面对比度下限 5.75:1。
- 覆盖矩阵：修改前后均为各端 119，生成物无 diff。
- golden：修改前后均为 1040 条 `expect`，生成物无 diff；本次执行生成与静态校验，未执行 Dart SDK 测试。
- 回归包含：新增文件后陈旧清单失败、再生成后状态变可用、缺失组合文件/命令式宿主变规划中、
  IFab 与 FloatButton 区分、硬写错误状态/错误排除/空链接失败。

这里记录的是实际基线，任务文档里的 117 / 925 已落后于本次 main 生成物。
目录状态仅表示示例源码存在，不代表包可安装或每个属性在各端一致。

## Playwright 实机验证

对 `npm run build` 的生产产物进行 Chromium 验证，桌面视口 1440×1000，移动视口 390×844。

- 亮/暗两态：全景只有「悬浮操作按钮」「会话列表」规划中，「弹性容器」不做。
- 逐项检查 13 项修正和二维码显示可用。
- 亮/暗两态实际点击 TimePicker / Transfer，进入 `/components/data-entry`，对应示例标题存在。
- 桌面两个页面均无 `pageerror`；移动全景没有水平溢出。
- 人工查看截图：中文标签正常、卡片布局完整、暗色使用浅色正文，未改变现有视觉规则。

截图为本 PR 的固定审核证据（不含临时调试截图）：

- [全景·亮色](catalog-light.png)
- [全景·暗色](catalog-dark.png)
- [总览·亮色](overview-light.png)
- [总览·暗色](overview-dark.png)
- [全景·移动暗色](catalog-mobile-dark.png)
- [自动断言结果](results.json)

复现：安装 Playwright Chromium 和系统中文字体，运行 `npm run build`；
启动 `npm run preview -- --host 127.0.0.1`，再运行 `node scripts/check-catalog-browser.mjs`。
可用 `CATALOG_BASE_URL` 指定预览地址、`CATALOG_SCREENSHOTS` 指定截图目录；默认写入临时目录，
不会覆盖本次固定证据。若使用预装 Chromium，可用 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指定路径。

## 后续维护

新增/删除组件后运行 `npm run build:catalog` 并提交 `componentInventory.ts`。
两份编辑目录填写稳定组件标识、说明及现有文档入口，禁止手填 ready / planned。
`check:parity` 会先检查清单是否陈旧，再执行其他构建；`dev` / `build` 会自动更新本地清单。
只有有意排除的能力可保留 excluded，检查会禁止已实现组件继续被排除。

回滚可直接 revert 本 PR，无数据迁移或组件 API 变化。
