/**
 * Empty —— 小程序实现。
 * 插画是 WebP 位图，小程序需要 https 地址或本地路径，因此由使用方通过 artBase 指定
 * 资源前缀（CDN 或包内路径），组件只负责按 type 拼出文件名。
 */
import { getLocale } from '../../config'

/* 只剩文件名留在这里，文案全部来自字典——换语言时空态不该是唯一还在说中文的地方 */
const ART = {
  empty: 'no-data',
  search: 'search-empty',
  error: 'load-failed',
  permission: 'no-permission'
}

Component({
  options: { addGlobalClass: true },
  properties: {
    type: { type: String, value: 'empty' },
    title: { type: String, value: '' },
    description: { type: String, value: '' },
    size: { type: String, value: 'md' },
    artBase: { type: String, value: '/assets/illustrations/empty' },
    hasAction: { type: Boolean, value: false }
  },
  data: { art: '', resolvedTitle: '', resolvedDesc: '' },
  observers: {
    'type, title, description, artBase': function (type, title, description, artBase) {
      const reason = ART[type] ? type : 'empty'
      const preset = getLocale().emptyPresets[reason]
      this.setData({
        art: `${artBase}/${ART[reason]}@2x.webp`,
        resolvedTitle: title || preset.title,
        resolvedDesc: description || preset.description
      })
    }
  }
})
