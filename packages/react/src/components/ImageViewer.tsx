import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  IMAGE_IDENTITY,
  imageTransformStyle,
  panImage,
  resetImage,
  rotateImage,
  stepImage,
  zoomImage,
  type ImageTransform
} from '@i-design/common'
import { useConfig } from './ConfigProvider'
import { Icon } from './Icon'

export interface ImageViewerProps {
  images: string[]
  open: boolean
  onClose: () => void
  /** 打开时定位到第几张 */
  startIndex?: number
  alt?: string
  onChange?: (index: number) => void
}

/**
 * 全屏图片预览。
 *
 * 从 Image 里拆出来单独成件：列表页、聊天记录、上传回显都要「点开看大图」，
 * 但它们未必用 Image 渲染缩略图——预览层绑死在图片组件上，这些地方就得各自再写一遍。
 */
export function ImageViewer({
  images,
  open,
  onClose,
  startIndex = 0,
  alt = '',
  onChange
}: ImageViewerProps) {
  const { locale } = useConfig()
  const [index, setIndex] = useState(startIndex)
  const [transform, setTransform] = useState<ImageTransform>({ ...IMAGE_IDENTITY })
  const dragging = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!open) return
    setIndex(Math.min(Math.max(startIndex, 0), Math.max(images.length - 1, 0)))
    setTransform(resetImage())
  }, [open, startIndex, images.length])

  function step(delta: number) {
    setIndex((prev) => {
      const next = stepImage(prev, images.length, delta)
      // 翻页后把缩放旋转归零：带着上一张的 3 倍放大翻过去，看到的是一块局部
      if (next !== prev) {
        setTransform(resetImage())
        onChange?.(next)
      }
      return next
    })
  }

  useEffect(() => {
    if (!open) return
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowRight') step(1)
      else if (event.key === 'ArrowLeft') step(-1)
      else if (event.key === '+' || event.key === '=')
        setTransform((t) => zoomImage(t, 0.25))
      else if (event.key === '-') setTransform((t) => zoomImage(t, -0.25))
    }
    document.addEventListener('keydown', onKeydown)
    return () => document.removeEventListener('keydown', onKeydown)
  })

  if (!open) return null

  const onDown = (event: ReactPointerEvent) => {
    if (transform.scale <= 1) return
    dragging.current = { x: event.clientX, y: event.clientY }
    ;(event.currentTarget as Element).setPointerCapture(event.pointerId)
  }
  const onMove = (event: ReactPointerEvent) => {
    const from = dragging.current
    if (!from) return
    setTransform((t) => panImage(t, event.clientX - from.x, event.clientY - from.y))
    dragging.current = { x: event.clientX, y: event.clientY }
  }
  const onUp = () => {
    dragging.current = null
  }

  return createPortal(
    <div
      className="i-image-viewer"
      role="dialog"
      aria-modal="true"
      aria-label="图片预览"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <img
        className="i-image-viewer__full"
        src={images[index] ?? ''}
        alt={alt}
        style={{
          transform: imageTransformStyle(transform),
          cursor: transform.scale > 1 ? 'grab' : 'default'
        }}
        onWheel={(event) => setTransform((t) => zoomImage(t, event.deltaY > 0 ? -0.2 : 0.2))}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />

      <button className="i-image-viewer__close" type="button" aria-label={locale.close} onClick={onClose}>
        <Icon name="close" size={18} />
      </button>

      {/*
        到头不循环：循环会让「这是最后一张」这个信息消失，
        用户点着点着又回到第一张，分不清是翻完了还是自己看漏了。
      */}
      {images.length > 1 && (
        <>
          <button
            className="i-image-viewer__nav is-prev"
            type="button"
            aria-label="上一张"
            disabled={index === 0}
            onClick={() => step(-1)}
          >
            <Icon name="chevron-left" size={20} />
          </button>
          <button
            className="i-image-viewer__nav is-next"
            type="button"
            aria-label="下一张"
            disabled={index === images.length - 1}
            onClick={() => step(1)}
          >
            <Icon name="chevron-right" size={20} />
          </button>
        </>
      )}

      <div className="i-image-viewer__toolbar">
        <button type="button" aria-label="缩小" onClick={() => setTransform((t) => zoomImage(t, -0.25))}>
          <Icon name="minus" size={16} />
        </button>
        <span className="i-image-viewer__zoom">{Math.round(transform.scale * 100)}%</span>
        <button type="button" aria-label="放大" onClick={() => setTransform((t) => zoomImage(t, 0.25))}>
          <Icon name="plus" size={16} />
        </button>
        <button type="button" aria-label="旋转" onClick={() => setTransform((t) => rotateImage(t, 90))}>
          <Icon name="refresh" size={16} />
        </button>
        <button type="button" aria-label="还原" onClick={() => setTransform(resetImage())}>
          <Icon name="undo" size={16} />
        </button>
        {images.length > 1 && (
          <span className="i-image-viewer__count">
            {index + 1} / {images.length}
          </span>
        )}
      </div>
    </div>,
    document.body
  )
}
