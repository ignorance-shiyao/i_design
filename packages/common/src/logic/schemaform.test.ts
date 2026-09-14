import { describe, expect, it } from 'vitest'
import type { FormSchema } from '../contracts/form'
import {
  applyServerErrors,
  asyncRulesOf,
  dependencyOrder,
  evaluate,
  firstErrorPath,
  submitValues,
  validateSchema,
  visibleFields
} from './schemaform'

const schema: FormSchema = {
  fields: [
    {
      name: 'type',
      label: '客户类型',
      kind: 'select',
      options: [
        { value: 'person', label: '个人' },
        { value: 'company', label: '企业' }
      ],
      rules: [{ kind: 'required', message: '请选择客户类型' }]
    },
    {
      name: 'taxNo',
      label: '税号',
      kind: 'text',
      when: { field: 'type', op: 'eq', value: 'company' },
      rules: [
        { kind: 'required', message: '企业客户必须填税号' },
        { kind: 'pattern', value: '^[A-Z0-9]{8,}$', message: '税号是 8 位以上的大写字母或数字' }
      ]
    },
    {
      name: 'email',
      label: '邮箱',
      kind: 'text',
      rules: [
        { kind: 'email', message: '邮箱格式不对' },
        { kind: 'async', handler: 'checkEmailUnique', message: '这个邮箱已经被占用' }
      ]
    },
    {
      name: 'lines',
      label: '明细',
      kind: 'array',
      minItems: 1,
      maxItems: 3,
      item: [
        { name: 'sku', label: '物料', kind: 'text', rules: [{ kind: 'required', message: '物料必填' }] },
        { name: 'quantity', label: '数量', kind: 'number', rules: [{ kind: 'min', value: 1, message: '数量至少为 1' }] }
      ]
    }
  ]
}

describe('条件求值', () => {
  it('算子表是封闭的：不认识的算子报错，而不是猜它想干什么', () => {
    expect(() => evaluate({ field: 'a', op: 'matches' as never, value: 1 }, {})).toThrow(/不认识的条件算子/)
  })

  it('eq / ne / in / not-in', () => {
    const v = { a: 'x' }
    expect(evaluate({ field: 'a', op: 'eq', value: 'x' }, v)).toBe(true)
    expect(evaluate({ field: 'a', op: 'ne', value: 'x' }, v)).toBe(false)
    expect(evaluate({ field: 'a', op: 'in', value: ['x', 'y'] }, v)).toBe(true)
    expect(evaluate({ field: 'a', op: 'not-in', value: ['x'] }, v)).toBe(false)
  })

  it('truthy 把空串、空数组、false 都算作假', () => {
    expect(evaluate({ field: 'a', op: 'truthy' }, { a: '  ' })).toBe(false)
    expect(evaluate({ field: 'a', op: 'truthy' }, { a: [] })).toBe(false)
    expect(evaluate({ field: 'a', op: 'truthy' }, { a: false })).toBe(false)
    expect(evaluate({ field: 'a', op: 'truthy' }, { a: '0' })).toBe(true)
  })

  it('all / any / not 可以嵌套', () => {
    const cond = {
      all: [
        { field: 'a', op: 'eq' as const, value: 1 },
        { any: [{ field: 'b', op: 'truthy' as const }, { field: 'c', op: 'gt' as const, value: 5 }] }
      ]
    }
    expect(evaluate(cond, { a: 1, b: '', c: 9 })).toBe(true)
    expect(evaluate(cond, { a: 1, b: '', c: 2 })).toBe(false)
    expect(evaluate({ not: { field: 'a', op: 'truthy' } }, { a: '' })).toBe(true)
  })

  it('空分支的条件组当作「无条件」，而不是让整段字段凭空消失', () => {
    expect(evaluate({ all: [] }, {})).toBe(true)
  })

  it('写坏了的条件直接报错，而不是当成 true 放过去', () => {
    expect(() => evaluate({} as never, {})).toThrow(/既没有 field/)
  })
})

describe('依赖与环', () => {
  it('依赖成环时报错并点名参与的字段', () => {
    const cyclic: FormSchema = {
      fields: [
        { name: 'a', label: 'A', kind: 'text', when: { field: 'b', op: 'truthy' } },
        { name: 'b', label: 'B', kind: 'text', when: { field: 'a', op: 'truthy' } }
      ]
    }
    expect(() => dependencyOrder(cyclic)).toThrow(/成环：a → b → a/)
  })

  it('依赖一个不存在的字段时报错——条件永远取不到值等于把字段悄悄藏起来', () => {
    const bad: FormSchema = {
      fields: [{ name: 'a', label: 'A', kind: 'text', when: { field: 'ghost', op: 'truthy' } }]
    }
    expect(() => dependencyOrder(bad)).toThrow(/不存在的字段：ghost/)
  })

  it('无环时给出一个拓扑顺序', () => {
    expect(dependencyOrder(schema)).toContain('type')
  })
})

describe('显隐与提交值', () => {
  it('条件不满足的字段不显示', () => {
    expect(visibleFields(schema, { type: 'person' }).map((f) => f.name)).not.toContain('taxNo')
    expect(visibleFields(schema, { type: 'company' }).map((f) => f.name)).toContain('taxNo')
  })

  it('界面顺序保持 schema 的声明顺序，不按依赖顺序打乱', () => {
    expect(visibleFields(schema, { type: 'company' }).map((f) => f.name)).toEqual([
      'type',
      'taxNo',
      'email',
      'lines'
    ])
  })

  it('隐藏字段的值不参与提交——改回「个人」后税号不该跟着发上去', () => {
    const values = { type: 'person', taxNo: 'ABC12345', email: 'a@b.com', lines: [] }
    expect(submitValues(schema, values)).toEqual({ type: 'person', email: 'a@b.com', lines: [] })
  })
})

describe('校验', () => {
  it('隐藏字段的必填不挡提交——看不见的必填用户永远找不到', () => {
    const errors = validateSchema(schema, { type: 'person', lines: [{ sku: 'A', quantity: 1 }] })
    expect(errors.map((e) => e.path)).not.toContain('taxNo')
  })

  it('显示出来之后必填就生效', () => {
    const errors = validateSchema(schema, { type: 'company', lines: [{ sku: 'A', quantity: 1 }] })
    expect(errors.find((e) => e.path === 'taxNo')?.message).toBe('企业客户必须填税号')
  })

  it('选填留空时跳过格式规则，否则「选填但有格式要求」没法留空', () => {
    const errors = validateSchema(schema, { type: 'person', email: '', lines: [{ sku: 'A', quantity: 1 }] })
    expect(errors.map((e) => e.path)).not.toContain('email')
  })

  it('数组子表的错误带行号，定位到具体那一格', () => {
    const errors = validateSchema(schema, {
      type: 'person',
      lines: [{ sku: 'A', quantity: 1 }, { sku: '', quantity: 0 }]
    })
    expect(errors.map((e) => e.path)).toContain('lines[1].sku')
    expect(errors.map((e) => e.path)).toContain('lines[1].quantity')
  })

  it('行数下限与上限都管', () => {
    expect(validateSchema(schema, { type: 'person', lines: [] }).some((e) => e.message.includes('至少'))).toBe(true)
    const many = Array.from({ length: 4 }, () => ({ sku: 'A', quantity: 1 }))
    expect(validateSchema(schema, { type: 'person', lines: many }).some((e) => e.message.includes('最多'))).toBe(true)
  })

  it('异步规则不在同步校验里跑，只报出要宿主执行的清单', () => {
    expect(validateSchema(schema, { type: 'person', email: 'a@b.com', lines: [{ sku: 'A', quantity: 1 }] })).toEqual([])
    expect(asyncRulesOf(schema)).toEqual([
      { path: 'email', handler: 'checkEmailUnique', message: '这个邮箱已经被占用' }
    ])
  })
})

describe('服务端错误', () => {
  it('对得上的落回字段', () => {
    const [e] = applyServerErrors(schema, [{ path: 'taxNo', message: '税号在工商系统里查不到' }])
    expect(e).toEqual({ path: 'taxNo', message: '税号在工商系统里查不到' })
  })

  it('数组子表的路径按行解析', () => {
    const [e] = applyServerErrors(schema, [{ path: 'lines[2].quantity', message: '库存不足' }])
    expect(e.orphan).toBeUndefined()
    expect(e.path).toBe('lines[2].quantity')
  })

  it('对不上任何字段的保留原文并标成表单级——丢掉它等于「失败但没有原因」', () => {
    const [e] = applyServerErrors(schema, [{ path: 'creditLimit', message: '超出授信额度' }])
    expect(e.orphan).toBe(true)
    expect(e.message).toBe('超出授信额度')
  })

  it('第一个可定位的错误用来送焦点，表单级的不抢焦点', () => {
    const errors = applyServerErrors(schema, [
      { path: 'creditLimit', message: '超出授信额度' },
      { path: 'taxNo', message: '税号无效' }
    ])
    expect(firstErrorPath(errors)).toBe('taxNo')
  })
})
