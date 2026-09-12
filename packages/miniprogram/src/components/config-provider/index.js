import { getLocale, setLocale } from '../../config'

/**
 * 全局配置的挂载点。
 *
 * 这一端没有 context，真正的配置存在模块级的 config.js 里；
 * 这个组件只是给页面一个声明式的写法：在页面顶层放一次
 * <i-config-provider locale="{{ { empty: '这个筛选条件下没有工单' } }}" />，
 * 它在 attached 时把字典装进去。需要在逻辑里改就直接调 setLocale。
 */
Component({
  options: { addGlobalClass: true },
  properties: {
    /** 只写要改的那几句即可，缺的沿用基准字典 */
    locale: { type: Object, value: {} },
    /** 换一份基准字典，例如 enUS */
    base: { type: Object, value: null }
  },
  observers: {
    'locale, base': function (locale, base) {
      setLocale(locale || {}, base || undefined)
      this.triggerEvent('change', { locale: getLocale() })
    }
  },
  lifetimes: {
    attached() {
      setLocale(this.data.locale || {}, this.data.base || undefined)
    }
  }
})
