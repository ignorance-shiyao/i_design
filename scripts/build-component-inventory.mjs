import { readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export const inventoryFile = 'src/data/componentInventory.ts'

export function inventorySource(root = process.cwd()) {
  // 移动专有组件不在 Web 矩阵里；命令式入口也不能按 .vue 文件名猜。
  const files = ['src/components', 'packages/mobile-vue/src/components'].flatMap((dir) =>
    readdirSync(resolve(root, dir), { withFileTypes: true })
      .filter((file) => file.isFile() && /\.(vue|ts)$/.test(file.name) && !file.name.startsWith('_'))
      .map((file) => `${dir}/${file.name}`)
  ).sort()
  return `/** 由 scripts/build-component-inventory.mjs 按源码目录生成，请勿手改。 */\nexport const componentSourceFiles: readonly string[] = ${JSON.stringify(files, null, 2)}\n`
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  writeFileSync(inventoryFile, inventorySource())
  console.log('组件源码清单已生成')
}
