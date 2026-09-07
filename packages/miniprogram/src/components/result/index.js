const PRESETS = {
  success: { title: '操作成功', desc: '你可以继续下一步，或返回列表查看结果。', icon: 'check-circle' },
  info: { title: '处理中', desc: '结果稍后可在通知中心查看。', icon: 'info-circle' },
  warning: { title: '操作已提交，但有需要注意的地方', desc: '请检查下方提示后再继续。', icon: 'warning-triangle' },
  error: { title: '操作失败', desc: '请稍后重试；若持续失败请联系管理员。', icon: 'error-circle' },
  '403': { title: '无访问权限', desc: '当前账号没有该资源的权限，可向管理员申请。', icon: 'error-circle' },
  '404': { title: '页面走丢了', desc: '地址可能已经变更或删除。', file: '404' },
  '500': { title: '服务出错了', desc: '我们已经记录这次异常，请稍后重试。', file: '500' }
}

Component({
  options: { addGlobalClass: true },
  properties: {
    status: { type: String, value: 'info' },
    title: { type: String, value: '' },
    description: { type: String, value: '' },
    size: { type: String, value: 'md' },
    artBase: { type: String, value: '/assets/illustrations/error' },
    hasAction: { type: Boolean, value: false }
  },
  data: { art: '', icon: 'info-circle', resolvedTitle: '', resolvedDesc: '' },
  observers: {
    'status, title, description, artBase': function (status, title, description, artBase) {
      const preset = PRESETS[status] || PRESETS.info
      this.setData({
        // 404 / 500 有专门插画；其余状态用图标即可，不必为每种状态都画一张
        art: preset.file ? `${artBase}/${preset.file}@2x.webp` : '',
        icon: preset.icon || 'info-circle',
        resolvedTitle: title || preset.title,
        resolvedDesc: description || preset.desc
      })
    }
  }
})
