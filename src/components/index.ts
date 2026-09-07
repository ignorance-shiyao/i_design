import type { App } from 'vue'
import IIcon from './IIcon.vue'
import IButton from './IButton.vue'
import IInput from './IInput.vue'
import ITextarea from './ITextarea.vue'
import ISelect from './ISelect.vue'
import IRadio from './IRadio.vue'
import IRadioGroup from './IRadioGroup.vue'
import ICheckbox from './ICheckbox.vue'
import ICheckboxGroup from './ICheckboxGroup.vue'
import ISwitch from './ISwitch.vue'
import IDatePicker from './IDatePicker.vue'
import IUpload from './IUpload.vue'
import IAvatar from './IAvatar.vue'
import IAvatarGroup from './IAvatarGroup.vue'
import IBadge from './IBadge.vue'
import ICollapse from './ICollapse.vue'
import IForm from './IForm.vue'
import IFormItem from './IFormItem.vue'
import ITag from './ITag.vue'
import IDivider from './IDivider.vue'
import ITabs from './ITabs.vue'
import IBreadcrumb from './IBreadcrumb.vue'
import ISteps from './ISteps.vue'
import IPagination from './IPagination.vue'
import ICard from './ICard.vue'
import ITable from './ITable.vue'
import ITooltip from './ITooltip.vue'
import IEmpty from './IEmpty.vue'
import IAlert from './IAlert.vue'
import IModal from './IModal.vue'
import IDrawer from './IDrawer.vue'
import ILoading from './ILoading.vue'

export {
  IIcon,
  IButton,
  IInput,
  ITextarea,
  ISelect,
  IRadio,
  IRadioGroup,
  ICheckbox,
  ICheckboxGroup,
  ISwitch,
  IDatePicker,
  IUpload,
  IAvatar,
  IAvatarGroup,
  IBadge,
  ICollapse,
  IForm,
  IFormItem,
  ITag,
  IDivider,
  ITabs,
  IBreadcrumb,
  ISteps,
  IPagination,
  ICard,
  ITable,
  ITooltip,
  IEmpty,
  IAlert,
  IModal,
  IDrawer,
  ILoading
}

export { message } from './message'
export type { SelectOption } from './ISelect.vue'
export type { TableColumn, TableRow } from './ITable.vue'
export type { TabItem } from './ITabs.vue'
export type { BreadcrumbItem } from './IBreadcrumb.vue'
export type { StepItem } from './ISteps.vue'
export type { MessageOptions, MessageType } from './message'
export type { FormRule } from './validate'
export type { IconName } from './icons'
export * from './date'
export type { UploadFile, UploadStatus } from './upload'
export type { CollapseItem } from './ICollapse.vue'
export { icons, iconNames } from './icons'

const components = {
  IIcon,
  IButton,
  IInput,
  ITextarea,
  ISelect,
  IRadio,
  IRadioGroup,
  ICheckbox,
  ICheckboxGroup,
  ISwitch,
  IDatePicker,
  IUpload,
  IAvatar,
  IAvatarGroup,
  IBadge,
  ICollapse,
  IForm,
  IFormItem,
  ITag,
  IDivider,
  ITabs,
  IBreadcrumb,
  ISteps,
  IPagination,
  ICard,
  ITable,
  ITooltip,
  IEmpty,
  IAlert,
  IModal,
  IDrawer,
  ILoading
}

/** 全量注册，便于文档站与 demo 直接使用；业务侧推荐按需引入 */
export default {
  install(app: App) {
    Object.entries(components).forEach(([name, component]) => {
      app.component(name, component)
    })
  }
}
