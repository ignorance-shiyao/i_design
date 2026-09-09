import { useCallback, useRef, useState } from 'react'
import { fileTypeOf, formatSize, matchAccept, nextUid, type UploadFile } from '@i-design/common'
import { Icon } from './Icon'
import { Button } from './Button'

export interface UploadProps {
  value?: UploadFile[]
  onChange?: (files: UploadFile[]) => void
  accept?: string
  multiple?: boolean
  /** 单文件大小上限，单位 MB */
  maxSize?: number
  maxCount?: number
  disabled?: boolean
  variant?: 'drag' | 'button'
  tip?: string
  request?: (file: File, onProgress: (percent: number) => void) => Promise<unknown>
  onSuccess?: (file: UploadFile) => void
  onError?: (file: UploadFile, message: string) => void
  /** 校验未通过的文件不静默丢弃，用户需要知道为什么少了一个文件 */
  onReject?: (file: File, reason: string) => void
}

export function Upload({
  value = [],
  onChange,
  accept = '',
  multiple = true,
  maxSize = 0,
  maxCount = 0,
  disabled = false,
  variant = 'drag',
  tip = '',
  request,
  onSuccess,
  onError,
  onReject
}: UploadProps) {
  const input = useRef<HTMLInputElement | null>(null)
  const [dragging, setDragging] = useState(false)

  /**
   * 写操作基于最近一次派发的值而不是回读 props：一次 tick 内连续更新时
   * （新增文件后立即置为 uploading），父组件还没把新值传回来，
   * 回读 props 会拿到旧值并把前一次更新覆盖掉。
   */
  const latest = useRef<UploadFile[]>(value)
  latest.current = value

  const update = useCallback(
    (next: UploadFile[]) => {
      latest.current = next
      onChange?.(next)
    },
    [onChange]
  )

  const patch = useCallback(
    (uid: string, changes: Partial<UploadFile>) => {
      update(latest.current.map((f) => (f.uid === uid ? { ...f, ...changes } : f)))
    },
    [update]
  )

  const reachedMax = maxCount > 0 && value.length >= maxCount

  const start = useCallback(
    async (item: UploadFile) => {
      if (!request || !item.raw) return
      patch(item.uid, { status: 'uploading', percent: 0, error: undefined })
      try {
        const response = await request(item.raw, (percent) =>
          patch(item.uid, { percent: Math.min(100, Math.max(0, Math.round(percent))) })
        )
        patch(item.uid, { status: 'success', percent: 100, response })
        onSuccess?.({ ...item, status: 'success', percent: 100, response })
      } catch (e) {
        const message = e instanceof Error ? e.message : '上传失败'
        patch(item.uid, { status: 'error', error: message })
        onError?.({ ...item, status: 'error', error: message }, message)
      }
    },
    [request, patch, onSuccess, onError]
  )

  const add = useCallback(
    (list: File[]) => {
      const passed: File[] = []
      for (const file of list) {
        if (maxCount > 0 && latest.current.length + passed.length >= maxCount) {
          onReject?.(file, `最多只能上传 ${maxCount} 个文件`)
          continue
        }
        // 浏览器原生 accept 只过滤文件选择框，拖拽进来的文件不受约束，必须二次校验
        if (!matchAccept(file, accept)) {
          onReject?.(file, `不支持的文件类型，仅接受 ${accept}`)
          continue
        }
        if (maxSize > 0 && file.size > maxSize * 1024 * 1024) {
          onReject?.(file, `文件超过 ${maxSize} MB`)
          continue
        }
        passed.push(file)
      }
      if (!passed.length) return

      const items: UploadFile[] = passed.map((raw) => ({
        uid: nextUid(),
        name: raw.name,
        size: raw.size,
        status: request ? 'uploading' : 'ready',
        percent: 0,
        raw
      }))
      update([...latest.current, ...items])
      items.forEach(start)
    },
    [accept, maxCount, maxSize, onReject, request, start, update]
  )

  const openPicker = () => {
    if (disabled || reachedMax) return
    input.current?.click()
  }

  const autoTip =
    tip ||
    `${accept ? `支持 ${accept}` : ''}${accept && maxSize ? '，' : ''}${maxSize ? `单个不超过 ${maxSize} MB` : ''}`

  return (
    <div className={['i-upload', disabled ? 'is-disabled' : ''].filter(Boolean).join(' ')}>
      <input
        ref={input}
        className="i-upload__input"
        type="file"
        accept={accept || undefined}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          add(Array.from(e.target.files ?? []))
          // 清空以便再次选择同一个文件时仍触发 change
          e.target.value = ''
        }}
      />

      {variant === 'drag' ? (
        <div
          className={['i-upload__zone', dragging ? 'is-dragging' : '', reachedMax ? 'is-full' : '']
            .filter(Boolean)
            .join(' ')}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker() }
          }}
          onDragOver={(e) => { e.preventDefault(); if (!disabled && !reachedMax) setDragging(true) }}
          onDragLeave={(e) => { e.preventDefault(); setDragging(false) }}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            if (disabled || reachedMax) return
            add(Array.from(e.dataTransfer.files ?? []))
          }}
        >
          <Icon className="i-upload__zone-icon" name="download" size={26} />
          <p className="i-upload__zone-text">
            <span className="i-upload__link">点击选择</span>或将文件拖到此处
          </p>
          {autoTip && <p className="i-upload__tip">{autoTip}</p>}
        </div>
      ) : (
        <div className="i-upload__button">
          <Button disabled={disabled || reachedMax} onClick={openPicker}>
            <Icon name="plus" size={15} />
            选择文件
          </Button>
          {tip && <span className="i-upload__tip">{tip}</span>}
        </div>
      )}

      {!!value.length && (
        <ul className="i-upload__list">
          {value.map((item) => (
            <li
              key={item.uid}
              className={`i-upload__item is-${item.status}`}
              style={
                {
                  '--i-file-color': `var(--i-chart-${fileTypeOf(item.name).slot || 1})`
                } as React.CSSProperties
              }
            >
              {/* 类型图标带底色方块：一列文件里靠形状与色相区分类型，比一律灰色好扫 */}
              <span className="i-upload__file-icon">
                <Icon name={fileTypeOf(item.name).icon} size={16} />
              </span>
              <div className="i-upload__meta">
                <div className="i-upload__row">
                  <span className="i-upload__name" title={item.name}>{item.name}</span>
                  <span className="i-upload__size">
                    {fileTypeOf(item.name).label} · {formatSize(item.size)}
                  </span>
                </div>
                {item.status === 'uploading' && (
                  <div className="i-upload__progress">
                    <span className="i-upload__bar" style={{ width: `${item.percent}%` }} />
                  </div>
                )}
                {item.status === 'error' && <p className="i-upload__error">{item.error}</p>}
              </div>

              {item.status === 'uploading' && (
                <span className="i-upload__percent">{item.percent}%</span>
              )}
              {item.status === 'success' && (
                <Icon className="i-upload__ok" name="check-circle" size={16} />
              )}
              {item.status === 'error' && (
                <button
                  className="i-upload__act"
                  type="button"
                  aria-label="重新上传"
                  onClick={() => start(item)}
                >
                  <Icon name="refresh" size={15} />
                </button>
              )}

              <button
                className="i-upload__act"
                type="button"
                aria-label="移除"
                onClick={() => update(latest.current.filter((f) => f.uid !== item.uid))}
              >
                <Icon name="close" size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
