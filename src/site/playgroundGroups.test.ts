/**
 * 调参面板分档的回归测试。
 *
 * 分档看着简单，错了却只是「面板看起来还是乱的」——不会报错，也不会变红。
 */
import { describe, expect, it } from 'vitest'
import { groupPlaygroundProps } from './playgroundGroups'
import type { PropMeta } from '@/data/componentProps'

const meta = (name: string, kind: PropMeta['control'] extends infer _ ? string : never): PropMeta => ({
  name,
  type: 'string',
  doc: '',
  defaultText: null,
  control:
    kind === 'enum'
      ? { kind: 'enum', options: ['a', 'b'] }
      : kind === 'boolean'
        ? { kind: 'boolean' }
        : kind === 'number'
          ? { kind: 'number' }
          : kind === 'string'
            ? { kind: 'string' }
            : null
})

describe('调参面板的分档', () => {
  it('按控件形态分，而不是靠一份手维护的属性名清单', () => {
    // 手写清单会漂移，且漂移不会让任何构建失败，只会让新属性落到错误的一档
    const groups = groupPlaygroundProps([
      meta('variant', 'enum'),
      meta('disabled', 'boolean'),
      meta('title', 'string'),
      meta('size', 'enum'),
      meta('count', 'number'),
      meta('loading', 'boolean')
    ])
    expect(groups.map((g) => g.title)).toEqual(['外观', '内容', '开关'])
    expect(groups[0].metas.map((m) => m.name)).toEqual(['variant', 'size'])
    expect(groups[1].metas.map((m) => m.name)).toEqual(['title', 'count'])
    expect(groups[2].metas.map((m) => m.name)).toEqual(['disabled', 'loading'])
  })

  it('档内保持源码里的属性顺序，不另排一遍', () => {
    // 另排一遍的话，文档页的属性表与这里的顺序对不上，读者要来回找
    const groups = groupPlaygroundProps([meta('size', 'enum'), meta('variant', 'enum')])
    expect(groups[0].metas.map((m) => m.name)).toEqual(['size', 'variant'])
  })

  it('空档不渲染：只有开关的组件不该顶着两个空标题', () => {
    const groups = groupPlaygroundProps([meta('disabled', 'boolean')])
    expect(groups.map((g) => g.title)).toEqual(['开关'])
  })

  it('认不出控件类型的属性归到「内容」，不凭空多出一档', () => {
    const groups = groupPlaygroundProps([meta('items', 'none')])
    expect(groups.map((g) => g.title)).toEqual(['内容'])
  })

  it('没有可调属性时返回空数组，调用方据此整块不渲染', () => {
    expect(groupPlaygroundProps([])).toEqual([])
  })
})
