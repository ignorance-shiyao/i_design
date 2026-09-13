/**
 * 把可调属性分成几档。
 *
 * 一个组件动辄十几个属性，全摊在一格网格里就是眼下这个样子：开关、分段器、
 * 输入框大小不一地混排，读者得逐个看过去才知道哪个控件配哪个属性。
 * 分档之后，找「改外观」还是「开关某个行为」只需要先看一眼小标题。
 *
 * 档位按**控件形态**分，而不是靠手维护一份属性名清单——手写清单会漂移，
 * 且漂移不会让任何构建失败，只会让新加的属性悄悄落到错误的一档里。
 */
import type { PropMeta } from '@/data/componentProps'

export interface PlaygroundGroup {
  title: string
  /** 这一档为什么存在，写在小标题旁边 */
  hint: string
  metas: PropMeta[]
}

/**
 * 分档顺序也是显示顺序：
 *
 * 1. **外观** 有限的几个取值里选一个（variant / size / shape），改完一眼看得出差别
 * 2. **内容** 要自己填的字（标题、占位符、数量）
 * 3. **开关** 布尔项。放最后是因为它们最小，混在前面会把网格的行高拉得参差
 */
export function groupPlaygroundProps(metas: PropMeta[]): PlaygroundGroup[] {
  const buckets: PlaygroundGroup[] = [
    { title: '外观', hint: '在几个取值里选一个', metas: [] },
    { title: '内容', hint: '自己填的文字与数值', metas: [] },
    { title: '开关', hint: '开或关', metas: [] }
  ]
  for (const meta of metas) {
    const kind = meta.control?.kind
    if (kind === 'enum') buckets[0].metas.push(meta)
    else if (kind === 'boolean') buckets[2].metas.push(meta)
    else buckets[1].metas.push(meta)
  }
  // 空档不渲染：一个只有开关的组件不该顶着「外观」「内容」两个空标题
  return buckets.filter((group) => group.metas.length > 0)
}
