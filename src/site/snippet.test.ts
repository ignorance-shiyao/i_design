/**
 * 代码片段排版的回归测试。
 *
 * 片段是给人粘贴用的，排得难看不会让任何检查失败，只会让人不愿意用。
 */
import { describe, expect, it } from 'vitest'
import { displayWidth, formatSnippet } from './snippet'

describe('调参面板生成的代码片段', () => {
  it('放得下就写成一行', () => {
    // 一个属性的按钮此前要占四行，读者得先在脑子里把它拼回一行
    expect(formatSnippet({ name: 'IButton', attrs: ['size="lg"'], slot: '提交' })).toBe(
      '<IButton size="lg">提交</IButton>'
    )
  })

  it('没有属性时也写成一行', () => {
    expect(formatSnippet({ name: 'IButton', attrs: [], slot: '提交' })).toBe(
      '<IButton>提交</IButton>'
    )
  })

  it('没有插槽内容时写成自闭合标签', () => {
    expect(formatSnippet({ name: 'IIcon', attrs: ['name="user"'] })).toBe('<IIcon name="user" />')
    expect(formatSnippet({ name: 'IIcon', attrs: [] })).toBe('<IIcon />')
  })

  it('汉字按两列算：这是中文文档站，按字符数算会把 100 列宽的行判成放得下', () => {
    expect(displayWidth('提交')).toBe(4)
    expect(displayWidth('ab')).toBe(2)
    expect(displayWidth('（全角）')).toBe(8)
  })

  it('放不下才折行，每个属性一行、缩进两格', () => {
    const code = formatSnippet({
      name: 'IButton',
      attrs: [
        'variant="secondary"',
        'size="lg"',
        'disabled',
        'loading',
        'block',
        'shape="round"',
        'icon="check"'
      ],
      slot: '提交'
    })
    expect(code).toBe(
      [
        '<IButton',
        '  variant="secondary"',
        '  size="lg"',
        '  disabled',
        '  loading',
        '  block',
        '  shape="round"',
        '  icon="check"',
        '>提交</IButton>'
      ].join('\n')
    )
  })

  it('自闭合标签折行时收尾写在自己一行上', () => {
    const code = formatSnippet({
      name: 'IInput',
      attrs: [
        'placeholder="请输入一段足够长的占位文字好把这一行真的撑过八十列"',
        'clearable',
        'disabled'
      ]
    })
    expect(code.endsWith('\n/>')).toBe(true)
  })

  it('属性值里带 > 时不会改错收尾', () => {
    // 此前是拿 open.replace(/>$/, ' />') 改写收尾的，值里正好有 > 就会改到那里
    expect(formatSnippet({ name: 'ITag', attrs: ['label="a > b"'] })).toBe(
      '<ITag label="a > b" />'
    )
  })

  it('空属性不占位：过滤掉之后该一行还是一行', () => {
    expect(formatSnippet({ name: 'IButton', attrs: ['', '  '], slot: '提交' })).toBe(
      '<IButton>提交</IButton>'
    )
  })
})
