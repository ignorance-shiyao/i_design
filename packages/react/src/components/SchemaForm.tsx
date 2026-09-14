/**
 * 按 schema 渲染的表单（astra.md 的 B08）。
 *
 * 组件不解释 schema，只渲染它：显隐、依赖、校验、服务端错误落位全部在公共层，
 * 五端共用一份——各端各写一遍的话，同一份 schema 在小程序上会比在 Web 上多显示
 * 一个字段，而这种差异没有任何检查拦得住。
 *
 * schema 里不执行任何字符串：条件是数据，异步规则只给 handler 名字。
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  applyServerErrors,
  asyncRulesOf,
  firstErrorPath,
  submitValues,
  validateSchema,
  visibleFields,
  type FormFieldError,
  type FormFieldSpec,
  type FormSchema
} from '@i-design/common'
import { Button } from './Button'
import { Input } from './Input'
import { InputNumber } from './InputNumber'
import { Select } from './Select'
import { Switch } from './Switch'
import { Textarea } from './Textarea'

export interface SchemaFormProps {
  schema: FormSchema
  /** 表单值。受控：组件不自己存 */
  value: Record<string, unknown>
  /** 服务端返回的错误，路径对不上字段的会显示在表单级 */
  serverErrors?: { path: string; message: string }[]
  /** 异步规则的实现，键是 schema 里的 handler 名 */
  asyncValidator?: Record<string, (value: unknown) => Promise<boolean>>
  submitText?: string
  disabled?: boolean
  onChange?: (values: Record<string, unknown>) => void
  /** 通过校验后的值，隐藏字段已经剔除 */
  onSubmit?: (values: Record<string, unknown>) => void
  onInvalid?: (errors: FormFieldError[]) => void
  className?: string
  children?: ReactNode
}

export function SchemaForm({
  schema,
  value,
  serverErrors = [],
  asyncValidator = {},
  submitText = '提交',
  disabled = false,
  onChange,
  onSubmit,
  onInvalid,
  className = '',
  children
}: SchemaFormProps) {
  const [touched, setTouched] = useState(false)
  const [asyncErrors, setAsyncErrors] = useState<FormFieldError[]>([])
  const root = useRef<HTMLFormElement>(null)

  /* 服务端错误在用户改动之后就过期了，留着会让人以为还在报同一件事 */
  useEffect(() => setAsyncErrors([]), [value])

  const fields = visibleFields(schema, value)
  const errors: FormFieldError[] = [
    ...(touched ? validateSchema(schema, value) : []),
    ...applyServerErrors(schema, serverErrors),
    ...asyncErrors
  ]
  const errorOf = (path: string) => errors.find((e) => e.path === path)?.message
  const formErrors = errors.filter((e) => e.orphan)

  const setValue = (name: string, next: unknown) => onChange?.({ ...value, [name]: next })
  const rowsOf = (field: FormFieldSpec) =>
    Array.isArray(value[field.name]) ? (value[field.name] as Record<string, unknown>[]) : []
  const setCell = (field: FormFieldSpec, index: number, key: string, next: unknown) =>
    setValue(field.name, rowsOf(field).map((row, i) => (i === index ? { ...row, [key]: next } : row)))

  /** 焦点送到第一个出错的格子：让用户自己从头找是最省事也最不负责的做法 */
  const focusFirst = (list: FormFieldError[]) => {
    const path = firstErrorPath(list)
    if (!path) return
    root.current
      ?.querySelector<HTMLElement>(`[data-path="${CSS.escape(path)}"] input, [data-path="${CSS.escape(path)}"] textarea`)
      ?.focus()
  }

  async function submit(event: { preventDefault: () => void }) {
    event.preventDefault()
    setTouched(true)
    setAsyncErrors([])
    const sync = validateSchema(schema, value)
    if (sync.length) {
      focusFirst(sync)
      onInvalid?.(sync)
      return
    }
    // 异步规则最后跑：先把同步错误都报完，免得用户改一条等一次网络
    const pending = asyncRulesOf(schema).filter((r) => asyncValidator[r.handler])
    const results = await Promise.all(
      pending.map(async (rule) => ({ rule, ok: await asyncValidator[rule.handler](value[rule.path]) }))
    )
    const failed = results.filter((r) => !r.ok).map((r) => ({ path: r.rule.path, message: r.rule.message }))
    if (failed.length) {
      setAsyncErrors(failed)
      focusFirst(failed)
      onInvalid?.(failed)
      return
    }
    onSubmit?.(submitValues(schema, value))
  }

  return (
    <form
      ref={root}
      className={['i-schema-form', className].filter(Boolean).join(' ')}
      noValidate
      onSubmit={submit}
    >
      {fields.map((field) => (
        <div className="i-schema-form__field" data-path={field.name} key={field.name}>
          <label className="i-schema-form__label" htmlFor={`f-${field.name}`}>
            {field.label}
            {(field.rules ?? []).some((r) => r.kind === 'required') && (
              <span className="i-schema-form__req" aria-hidden="true">*</span>
            )}
          </label>

          {field.kind === 'text' && (
            <Input
              id={`f-${field.name}`}
              value={String(value[field.name] ?? '')}
              placeholder={field.placeholder}
              disabled={disabled}
              invalid={!!errorOf(field.name)}
              onChange={(v) => setValue(field.name, v)}
            />
          )}

          {field.kind === 'textarea' && (
            <Textarea
              value={String(value[field.name] ?? '')}
              placeholder={field.placeholder}
              disabled={disabled}
              onChange={(v) => setValue(field.name, v)}
            />
          )}

          {field.kind === 'number' && (
            <InputNumber
              value={(value[field.name] as number | null) ?? null}
              disabled={disabled}
              onChange={(v) => setValue(field.name, v)}
            />
          )}

          {field.kind === 'switch' && (
            <Switch
              checked={!!value[field.name]}
              disabled={disabled}
              ariaLabel={field.label}
              onChange={(v) => setValue(field.name, v)}
            />
          )}

          {(field.kind === 'select' || field.kind === 'multi-select') && (
            <Select
              value={(value[field.name] as never) ?? (field.kind === 'multi-select' ? [] : '')}
              multiple={field.kind === 'multi-select'}
              options={(field.options ?? []).map((o) => ({
                value: o.value,
                label: o.label,
                disabled: !!o.disabledReason
              }))}
              disabled={disabled}
              onChange={(v) => setValue(field.name, v)}
            />
          )}

          {field.kind === 'date' && (
            <Input
              type="date"
              value={String(value[field.name] ?? '')}
              disabled={disabled}
              onChange={(v) => setValue(field.name, v)}
            />
          )}

          {/* 数组子表：错误落到具体那一格，而不是整张表报一句「有误」 */}
          {field.kind === 'array' && (
            <div className="i-schema-form__rows">
              {rowsOf(field).map((row, index) => (
                <div className="i-schema-form__row" key={index}>
                  {(field.item ?? []).map((sub) => {
                    const path = `${field.name}[${index}].${sub.name}`
                    return (
                      <div className="i-schema-form__cell" data-path={path} key={sub.name}>
                        {/* 子表的格子也要有真 label：否则读屏用户在一行三四个编辑框里
                            无从知道哪个是数量 */}
                        <label
                          className="i-schema-form__label"
                          htmlFor={`f-${field.name}-${index}-${sub.name}`}
                        >
                          {sub.label}
                        </label>
                        {sub.kind === 'number' ? (
                          /* 数字输入自己带加减按钮，没有可挂 htmlFor 的单一 id */
                          <InputNumber
                            ariaLabel={`第 ${index + 1} 行的${sub.label}`}
                            value={(row[sub.name] as number | null) ?? null}
                            disabled={disabled}
                            onChange={(v) => setCell(field, index, sub.name, v)}
                          />
                        ) : (
                          <Input
                            id={`f-${field.name}-${index}-${sub.name}`}
                            value={String(row[sub.name] ?? '')}
                            placeholder={sub.placeholder}
                            disabled={disabled}
                            invalid={!!errorOf(path)}
                            onChange={(v) => setCell(field, index, sub.name, v)}
                          />
                        )}
                        {errorOf(path) && <p className="i-schema-form__error">{errorOf(path)}</p>}
                      </div>
                    )
                  })}
                  <Button
                    size="sm"
                    disabled={disabled}
                    onClick={() => setValue(field.name, rowsOf(field).filter((_, i) => i !== index))}
                  >
                    删除这行
                  </Button>
                </div>
              ))}
              <Button size="sm" disabled={disabled} onClick={() => setValue(field.name, [...rowsOf(field), {}])}>
                加一行
              </Button>
            </div>
          )}

          {field.help && <p className="i-schema-form__help">{field.help}</p>}
          {errorOf(field.name) && (
            <p className="i-schema-form__error" role="alert">{errorOf(field.name)}</p>
          )}
        </div>
      ))}

      {/* 对不上字段的服务端错误显示在表单级，而不是丢掉 */}
      {formErrors.map((e) => (
        <p className="i-schema-form__error" role="alert" key={e.path}>
          {e.path}：{e.message}
        </p>
      ))}

      <div className="i-schema-form__actions">
        <Button variant="primary" htmlType="submit" disabled={disabled}>{submitText}</Button>
        {children}
      </div>
    </form>
  )
}
