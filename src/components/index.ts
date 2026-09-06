import type { App } from 'vue'
import IButton from './IButton.vue'
import IInput from './IInput.vue'
import ICard from './ICard.vue'
import ITag from './ITag.vue'
import IAlert from './IAlert.vue'
import ISwitch from './ISwitch.vue'
import ISelect from './ISelect.vue'
import IModal from './IModal.vue'
import ITable from './ITable.vue'

export { IButton, IInput, ICard, ITag, IAlert, ISwitch, ISelect, IModal, ITable }
export type { SelectOption } from './ISelect.vue'
export type { TableColumn, TableRow } from './ITable.vue'

const components = { IButton, IInput, ICard, ITag, IAlert, ISwitch, ISelect, IModal, ITable }

/** 全量注册，便于文档站与 demo 直接使用；业务侧推荐按需引入 */
export default {
  install(app: App) {
    Object.entries(components).forEach(([name, component]) => {
      app.component(name, component)
    })
  }
}
