import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  IMAGE_IDENTITY,
  imageAlt,
  imageTransformStyle,
  panImage,
  resetImage,
  rotateImage,
  stepImage,
  zoomImage,
  type ImageStatus,
  type ImageTransform
} from '@i-design/common'
import { Icon } from './Icon'

export interface ImageProps {
  src: string
  alt?: string
  width?: string | number
  height?: string | number
  /** 点击后全屏预览 */
  preview?: boolean
  /** 同组图片，预览时可左右翻页。不传则只预览自己 */
  group?: string[]
  fit?: 'cover' | 'contain' | 'fill' | 'none'
  className?: string
}

export function Image({
  src,
  alt = '',
  width = '',
  height = '',
  preview = true,
  group = [],
  fit = 'cover',
  className = ''
}: ImageProps) {
  const [status, setStatus] = useState<ImageStatus>('loading')
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [transform, setTransform] = useState<ImageTransform>({ ...IMAGE_IDENTITY })
  const dragging = useRef<{ x: number; y: number } | null>(null)

  const list = group.length ? group : [src]
  const current = list[index] ?? src

  useEffect(() => setStatus('loading'), [src])

  function openPreview() {
    if (!preview || status === 'error') return
    setIndex(Math.max(0, list.indexOf(src)))
    setTransform(resetImage())
    setOpen(true)
  }

  function step(delta: number) {
    setIndex((prev) => {
      const next = stepImage(prev, list.length, delta)
      // 翻页后把缩放旋转归零：带着上一张的 3 倍放大翻过去，看到的是一块局部
      if (next !== prev) setTransform(resetImage())
      return next
    })
  }

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
      else if (event.key === 'ArrowRight') step(1)
      else if (event.key === 'ArrowLeft') step(-1)
      else if (event.key === '+' || event.key === '=') setTransform((t) => zoomImage(t, 0.25))
      else if (event.key === '-') setTransform((t) => zoomImage(t, -0.25))
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })

  const onDown = (event: ReactPointerEvent) => {
    if (transform.scale <= 1) return
    dragging.current = { x: event.clientX, y: event.clientY }
    ;(event.currentTarget as Element).setPointerCapture(event.pointerId)
  }
  const onMove = (event: ReactPointerEvent) => {
    if (!dragging.current) return
    const dx = event.clientX - dragging.current.x
    const dy = event.clientY - dragging.current.y
    dragging.current = { x: event.clientX, y: event.clientY }
    setTransform((t) => panImage(t, dx, dy))
  }
  const onUp = () => {
    dragging.current = null
  }

  return (
    <div
      className={['i-image', className].filter(Boolean).join(' ')}
      style={{
        width: typeof width === 'number' ? width : width || undefined,
        height: typeof height === 'number' ? height : height || undefined
      }}
    >
      {/*
        图片一直渲染，只用透明度控制可见性。
        用 display: none 隐藏的话，loading="lazy" 的图浏览器根本不去加载——
        load 事件永不触发，状态就永远停在 loading，图片再也不会出现。
      */}
      <img
        className={['i-image__img', status !== 'loaded' ? 'is-pending' : ''].filter(Boolean).join(' ')}
        src={src}
        alt={imageAlt(status, alt)}
        style={{ objectFit: fit }}
        loading="lazy"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        onClick={openPreview}
      />

      {status === 'loading' && (
        <div className="i-skeleton is-animated i-image__placeholder">
          <span className="i-skeleton__block i-image__placeholder-bar" />
        </div>
      )}

      {/*
        加载失败要显式说出来。留一块空白或一个碎图标，读者分不清是没图还是没加载出来，
        而这两件事的处理完全不同。
      */}
      {status === 'error' && (
        <div className="i-image__error">
          <Icon name="file-image" size={20} />
          <span>加载失败</span>
        </div>
      )}

      {open &&
        createPortal(
          <div
            className="i-image__viewer"
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <img
              className="i-image__full"
              src={current}
              alt={alt}
              style={{
                transform: imageTransformStyle(transform),
                cursor: transform.scale > 1 ? 'grab' : 'default'
              }}
              onWheel={(e) => setTransform((t) => zoomImage(t, e.deltaY > 0 ? -0.2 : 0.2))}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            />

            <button className="i-image__close" type="button" aria-label="关闭" onClick={() => setOpen(false)}>
              <Icon name="close" size={18} />
            </button>

            {/*
              到头不循环：循环会让「这是最后一张」这个信息消失，
              用户点着点着又回到第一张，分不清是翻完了还是自己看漏了。
            */}
            {list.length > 1 && (
              <>
                <button
                  className="i-image__nav is-prev"
                  type="button"
                  aria-label="上一张"
                  disabled={index === 0}
                  onClick={() => step(-1)}
                >
                  <Icon name="chevron-left" size={20} />
                </button>
                <button
                  className="i-image__nav is-next"
                  type="button"
                  aria-label="下一张"
                  disabled={index === list.length - 1}
                  onClick={() => step(1)}
                >
                  <Icon name="chevron-right" size={20} />
                </button>
              </>
            )}

            <div className="i-image__toolbar">
              <button type="button" aria-label="缩小" onClick={() => setTransform((t) => zoomImage(t, -0.25))}>
                <Icon name="minus" size={16} />
              </button>
              <span className="i-image__zoom">{Math.round(transform.scale * 100)}%</span>
              <button type="button" aria-label="放大" onClick={() => setTransform((t) => zoomImage(t, 0.25))}>
                <Icon name="plus" size={16} />
              </button>
              <button type="button" aria-label="旋转" onClick={() => setTransform((t) => rotateImage(t, 90))}>
                <Icon name="refresh" size={16} />
              </button>
              <button type="button" aria-label="还原" onClick={() => setTransform(resetImage())}>
                <Icon name="undo" size={16} />
              </button>
              {list.length > 1 && (
                <span className="i-image__count">
                  {index + 1} / {list.length}
                </span>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
