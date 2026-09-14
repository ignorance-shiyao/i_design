/**
 * 把根目录的许可证复制进每个发布目录，并生成第三方与素材来源清单。
 *
 * 复制而不是留个链接：npm 与 pub 分发的是目录本身，
 * 使用方拿到的 node_modules/@i-design/react 里要能直接读到许可证。
 */
import { copyFileSync, writeFileSync } from 'node:fs'
import { licenseFile, thirdPartyFile, thirdPartySource, packageLicensePaths } from './lib/licenses.mjs'

const copied = packageLicensePaths()
for (const target of copied) copyFileSync(licenseFile, target)
writeFileSync(thirdPartyFile, thirdPartySource())
console.log(`许可证已复制到 ${copied.length} 个发布目录；${thirdPartyFile} 已生成`)
