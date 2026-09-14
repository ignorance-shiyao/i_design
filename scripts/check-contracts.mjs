/**
 * 组件不许直接读供应商的原始数据。
 *
 * 运行事件里留了一个 raw 字段放供应商原始载荷，只为排查用。一旦某个组件
 * 从 raw 里取字段，这层翻译就白做了：换一家供应商时，坏掉的不是适配层，
 * 而是散落在各端的那几个组件，而且要到真连上另一家才会发现。
 *
 * 同理，供应商特有的字段名（choices、delta.content、candidates 这些）
 * 不该出现在渲染层——它们只该出现在传输适配里。
 */
import { readFileSync, readdirSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const SOURCE = /\.(vue|ts|tsx)$/
const SKIP = /(^|\/)(node_modules|dist|\.git)$/
// 渲染层：组件与页面。传输适配层（logic/contracts）不在此列，翻译就发生在那儿
const RENDER_DIRS = [
  'src/components', 'src/pages',
  'packages/vue-next/src', 'packages/vue/src/components',
  'packages/react/src/components', 'packages/mobile-vue/src', 'packages/mobile-react/src'
]
const VENDOR_FIELDS = /\.(choices|candidates|completion_tokens|prompt_tokens)\b/

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`
    if (entry.isDirectory()) { if (!SKIP.test(path)) walk(path, out) }
    else if (SOURCE.test(entry.name)) out.push(path)
  }
  return out
}

export function checkContracts(root = process.cwd()) {
  const problems = []
  let scanned = 0
  for (const dir of RENDER_DIRS) {
    let files
    try { files = walk(resolve(root, dir)) } catch { continue }
    for (const file of files) {
      scanned += 1
      const text = readFileSync(file, 'utf8')
      const where = relative(root, file)
      text.split('\n').forEach((line, index) => {
        const at = `${where}:${index + 1}`
        // 只认运行事件上的 raw：IUpload 的 item.raw 是待上传的 File，与这条禁令无关
        if (/\b(event|evt|ev|runEvent)\.raw\b/.test(line)) {
          problems.push(`${at} 直接读了事件的 raw：供应商原始载荷只供排查，渲染层要用归一化后的字段`)
        }
        if (VENDOR_FIELDS.test(line)) {
          problems.push(`${at} 出现供应商特有字段：这类字段只该出现在传输适配层`)
        }
      })
    }
  }
  if (problems.length) {
    const error = new Error(`契约边界检查失败：\n  - ${problems.join('\n  - ')}`)
    error.problems = problems
    throw error
  }
  return `契约边界检查通过：${scanned} 个渲染层文件都没有直接解析供应商字段`
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    console.log(checkContracts())
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}
