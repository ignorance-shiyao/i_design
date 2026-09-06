import type { App } from 'vue'
import IButton from './IButton.vue'
import IInput from './IInput.vue'
import ICard from './ICard.vue'
import ITag from './ITag.vue'
import IAlert from './IAlert.vue'
import ISwitch from './ISwitch.vue'

export { IButton, IInput, ICard, ITag, IAlert, ISwitch }

const components = { IButton, IInput, ICard, ITag, IAlert, ISwitch }

/** 全量注册，便于文档站与 demo 直接使用；业务侧推荐按需引入 */
export default {
  install(app: App) {
    Object.entries(components).forEach(([name, component]) => {
      app.component(name, component)
    })
  }
}
