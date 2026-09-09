/**
 * Empty —— 小程序实现。
 * 插画是 WebP 位图，小程序需要 https 地址或本地路径，因此由使用方通过 artBase 指定
 * 资源前缀（CDN 或包内路径），组件只负责按 type 拼出文件名。
 */
const PRESETS = {
  empty: { title: '暂无数据', desc: '这里还没有内容，创建第一条试试。', file: 'no-data' },
  search: { title: '没有匹配结果', desc: '换个关键词，或减少筛选条件。', file: 'search-empty' },
  error: { title: '加载失败', desc: '请检查网络后重试。', file: 'load-failed' },
  permission: { title: '无访问权限', desc: '请联系管理员申请该资源的访问权限。', file: 'no-permission' }
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
      const preset = PRESETS[type] || PRESETS.empty
      this.setData({
        art: `${artBase}/${preset.file}@2x.webp`,
        resolvedTitle: title || preset.title,
        resolvedDesc: description || preset.desc
      })
    }
  }
})
