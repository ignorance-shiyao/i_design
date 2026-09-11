import { useEffect, useState } from 'react'
import { imageAlt, type ImageStatus } from '@i-design/common'
import { Icon } from './Icon'
import { ImageViewer } from './ImageViewer'

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

  /* 预览层本身是 ImageViewer：缩放、旋转、翻页只该有一份实现 */
  const list = group.length ? group : [src]

  useEffect(() => setStatus('loading'), [src])

  function openPreview() {
    if (!preview || status === 'error') return
    setIndex(Math.max(0, list.indexOf(src)))
    setOpen(true)
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

      <ImageViewer
        images={list}
        open={open}
        startIndex={index}
        alt={alt}
        onClose={() => setOpen(false)}
      />
    </div>
  )
}
