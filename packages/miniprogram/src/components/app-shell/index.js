/**
 * AppShell —— 应用骨架（astra.md 的 B01）。
 *
 * 小程序上「顶栏 + 侧栏」的形态与 Web 不同：页面本来就窄，侧栏常驻等于把正文
 * 压成一条。所以这里默认就是抽屉形态——与 Web 端窄屏下的表现一致，
 * 不是另做一套交互。
 *
 * 组件不认识路由：点导航只抛事件，由页面决定 navigateTo 还是 switchTab。
 */
Component({
  options: { addGlobalClass: true },
  properties: {
    nav: { type: Array, value: [] },
    current: { type: String, value: '' },
    crumbs: { type: Array, value: [] },
    title: { type: String, value: '' },
    user: { type: String, value: '' }
  },
  data: { drawer: false, flatNav: [] },
  observers: {
    'nav, current': function () {
      const flat = []
      for (const item of this.data.nav || []) {
        flat.push({ key: item.key, label: item.label, child: false, on: item.key === this.data.current })
        for (const child of item.children || []) {
          flat.push({ key: child.key, label: child.label, child: true, on: child.key === this.data.current })
        }
      }
      this.setData({ flatNav: flat })
    }
  },
  methods: {
    onOpen() { this.setData({ drawer: true }) },
    onClose() { this.setData({ drawer: false }) },
    onNavigate(e) {
      this.setData({ drawer: false })
      this.triggerEvent('navigate', { key: e.currentTarget.dataset.key })
    }
  }
})
