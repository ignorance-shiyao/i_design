import type { App } from 'vue'
import IIcon from './IIcon.vue'
import IFlow from './IFlow.vue'
import IChart from './IChart.vue'
import IChartFunnel from './IChartFunnel.vue'
import IChartGauge from './IChartGauge.vue'
import IChartRadar from './IChartRadar.vue'
import IChartHeatmap from './IChartHeatmap.vue'
import IChartScatter from './IChartScatter.vue'
import IChartPie from './IChartPie.vue'
import ISparkline from './ISparkline.vue'
import IInputNumber from './IInputNumber.vue'
import ISlider from './ISlider.vue'
import IRate from './IRate.vue'
import IList from './IList.vue'
import ISpace from './ISpace.vue'
import ITypography from './ITypography.vue'
import IRow from './IRow.vue'
import ICol from './ICol.vue'
import ISegmented from './ISegmented.vue'
import IProgress from './IProgress.vue'
import IStatistic from './IStatistic.vue'
import ITimeline from './ITimeline.vue'
import IChatMessage from './IChatMessage.vue'
import IChatTyping from './IChatTyping.vue'
import IChatThinking from './IChatThinking.vue'
import IChatToolCall from './IChatToolCall.vue'
import IChatSources from './IChatSources.vue'
import IChatSuggestions from './IChatSuggestions.vue'
import IPromptInput from './IPromptInput.vue'
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
import IDescriptions from './IDescriptions.vue'
import ISkeleton from './ISkeleton.vue'
import IResult from './IResult.vue'
import IPopconfirm from './IPopconfirm.vue'
import IPopover from './IPopover.vue'
import IDropdown from './IDropdown.vue'
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
  IDescriptions,
  ISkeleton,
  IResult,
  IPopconfirm,
  IPopover,
  IDropdown,
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
  ILoading,
  IChatMessage,
  IChatTyping,
  IChatThinking,
  IChatToolCall,
  IChatSources,
  IChatSuggestions,
  IPromptInput,
  ISpace,
  ITypography,
  IRow,
  ICol,
  ISegmented,
  IProgress,
  IStatistic,
  ITimeline,
  IInputNumber,
  ISlider,
  IRate,
  IList,
  IChart,
  IChartPie,
  ISparkline,
  IFlow,
  IChartFunnel,
  IChartGauge,
  IChartRadar,
  IChartHeatmap,
  IChartScatter
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
export type { ChatSource } from './IChatSources.vue'
export type { PromptAttachment } from './IPromptInput.vue'
export type { SegmentedOption } from './ISegmented.vue'
export type { TimelineItem } from './ITimeline.vue'
export type { SliderMark } from './ISlider.vue'
export type { ListItem } from './IList.vue'
export type { PieItem } from './IChartPie.vue'
export type { FunnelStage } from './IChartFunnel.vue'
export type { RadarSeries } from './IChartRadar.vue'
export * from './date'
export type { UploadFile, UploadStatus } from './upload'
export type { CollapseItem } from './ICollapse.vue'
export type { DescriptionItem } from './IDescriptions.vue'
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
  IDescriptions,
  ISkeleton,
  IResult,
  IPopconfirm,
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
  ILoading,
  IChatMessage,
  IChatTyping,
  IChatThinking,
  IChatToolCall,
  IChatSources,
  IChatSuggestions,
  IPromptInput,
  ISpace,
  ITypography,
  IRow,
  ICol,
  ISegmented,
  IProgress,
  IStatistic,
  ITimeline,
  IInputNumber,
  ISlider,
  IRate,
  IList,
  IChart,
  IChartPie,
  ISparkline,
  IFlow,
  IChartFunnel,
  IChartGauge,
  IChartRadar,
  IChartHeatmap,
  IChartScatter
}

/** 全量注册，便于文档站与 demo 直接使用；业务侧推荐按需引入 */
export default {
  install(app: App) {
    Object.entries(components).forEach(([name, component]) => {
      app.component(name, component)
    })
  }
}
