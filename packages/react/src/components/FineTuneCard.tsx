/**
 * 属性检查器：智能体生成之后，人接着微调。
 *
 * 与一张普通表单差在一件事上：随时看得出「哪几项被我改过」，并且能单独退回去。
 * 没有这条，用户调了七八下之后就不敢再动了——他不知道自己已经偏离原始结果多远。
 */
import {
  changedKeys,
  clampFieldValue,
  fieldRatio,
  fineTuneSummary,
  formatFieldValue,
  resetField,
  type FineTuneField,
  type FineTuneValue,
  type FineTuneValues
} from '@i-design/common'
import { Icon } from './Icon'
import { Select } from './Select'
import { Switch } from './Switch'

export interface FineTuneCardProps {
  fields: FineTuneField[]
  /** 智能体给出的原始值。退回时回到这里 */
  original: FineTuneValues
  values: FineTuneValues
  title?: string
  onValuesChange?: (values: FineTuneValues) => void
  /** 整份退回。与逐项退回分开，好让调用方决定要不要二次确认 */
  onReset?: () => void
}

export function FineTuneCard({
  fields,
  original,
  values,
  title = '微调',
  onValuesChange,
  onReset
}: FineTuneCardProps) {
  const changed = new Set(changedKeys(fields, original, values))

  // 夹范围与吸步长在逻辑层做：拖的和敲的必须得到同一个值
  const set = (field: FineTuneField, value: FineTuneValue) =>
    onValuesChange?.({ ...values, [field.key]: clampFieldValue(field, value) })

  return (
    <section className="i-finetune">
      <header className="i-finetune__head">
        <h3 className="i-finetune__title">{title}</h3>
        {/* 改了几项写成字：一个小圆点说不清改了多少，也说不清改了哪几项 */}
        <span className="i-finetune__summary">{fineTuneSummary(changed.size)}</span>
        <button
          className="i-finetune__reset-all"
          type="button"
          disabled={changed.size === 0}
          onClick={() => onReset?.()}
        >
          <Icon name="undo" size={13} />
          全部退回
        </button>
      </header>

      <div className="i-finetune__list">
        {fields.map((field) => (
          <div
            key={field.key}
            className={`i-finetune__row${changed.has(field.key) ? ' is-changed' : ''}`}
          >
            <div className="i-finetune__label">
              <span>{field.label}</span>
              {field.hint ? <span className="i-finetune__hint">{field.hint}</span> : null}
            </div>

            <div className="i-finetune__control">
              {field.kind === 'number' ? (
                <>
                  {/*
                    滑块与数字框都给：滑块看得见范围但敲不准，数字框敲得准但看不见范围。
                    两者同时在，粗调用拖、定稿用敲。
                  */}
                  <input
                    className="i-finetune__range"
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={Number(values[field.key] ?? field.min ?? 0)}
                    disabled={field.disabled}
                    aria-label={field.label}
                    style={
                      { '--i-fill': `${fieldRatio(field, values[field.key]) * 100}%` } as never
                    }
                    onChange={(e) => set(field, Number(e.target.value))}
                  />
                  <input
                    className="i-finetune__number"
                    type="number"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={Number(values[field.key] ?? field.min ?? 0)}
                    disabled={field.disabled}
                    aria-label={`${field.label}（数值）`}
                    onChange={(e) => set(field, Number(e.target.value))}
                  />
                </>
              ) : field.kind === 'switch' ? (
                <Switch
                  checked={Boolean(values[field.key])}
                  disabled={field.disabled}
                  ariaLabel={field.label}
                  onChange={(v) => set(field, v)}
                />
              ) : field.kind === 'select' ? (
                <Select
                  value={String(values[field.key] ?? '')}
                  options={field.options ?? []}
                  disabled={field.disabled}
                  ariaLabel={field.label}
                  onChange={(v) => set(field, String(v))}
                />
              ) : field.kind === 'color' ? (
                <input
                  className="i-finetune__color"
                  type="color"
                  value={String(values[field.key] ?? '#000000')}
                  disabled={field.disabled}
                  aria-label={field.label}
                  onChange={(e) => set(field, e.target.value)}
                />
              ) : (
                <input
                  className="i-finetune__text"
                  type="text"
                  value={String(values[field.key] ?? '')}
                  disabled={field.disabled}
                  aria-label={field.label}
                  onChange={(e) => set(field, e.target.value)}
                />
              )}
            </div>

            {/*
              改过的那一项才有退回按钮。没改的项上也摆一个灰按钮会让整列看起来
              全是可退回的，读者得逐个看清楚才知道自己动过哪些。
            */}
            {changed.has(field.key) ? (
              <button
                className="i-finetune__revert"
                type="button"
                aria-label={`把${field.label}退回 ${formatFieldValue(field, original[field.key])}`}
                onClick={() => onValuesChange?.(resetField(original, values, field.key))}
              >
                <Icon name="undo" size={12} />
                {formatFieldValue(field, original[field.key])}
              </button>
            ) : (
              <span className="i-finetune__value">
                {formatFieldValue(field, values[field.key])}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
