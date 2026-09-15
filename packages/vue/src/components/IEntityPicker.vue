<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IEntityPicker.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * 人员 / 组织 / 资源的选择器（astra.md 的 B10）。
 *
 * 检索本身交给调用方：谁去请求、请求哪个接口、怎么分页，都不是这个组件该管的。
 * 它管的是那三件一做错就出真问题的事，判断全在 logic/entitypicker.ts：
 * 翻页之后已选还看不看得见、不能选的为什么不能、停用的怎么办。
 *
 * 已选排在结果列表之上：翻页时唯一会变的是结果，把已选压在列表底下，
 * 一翻页它就滚出视野，用户立刻开始怀疑自己选的东西还在不在。
 */
import { computed } from 'vue'
import {
  offPageChosen,
  pickerHint,
  pickerRows,
  pickerSummary,
  removePick,
  togglePick,
  type EntityOption
} from '@i-design/common'
import IIcon from './IIcon.vue'
import IInput from './IInput.vue'

const props = withDefaults(
  defineProps<{
    /** 当前这一页的检索结果。由调用方去请求 */
    page?: EntityOption[]
    /** 已选。完整对象，不是 id——回显不能依赖它还在当前页里 */
    value?: EntityOption[]
    keyword?: string
    loading?: boolean
    multiple?: boolean
    /** 最多选几个 */
    max?: number
    /** 「人」「个部门」「台设备」——摘要里那个量词 */
    unit?: string
    placeholder?: string
  }>(),
  {
    page: () => [],
    value: () => [],
    keyword: '',
    loading: false,
    multiple: false,
    max: undefined,
    unit: '项',
    placeholder: '搜索姓名、工号或部门'
  }
)

const emit = defineEmits<{ (e: 'input', chosen: EntityOption[]): void; (e: 'update:keyword', keyword: string): void }>()

const input = computed(() => ({
  page: props.page,
  chosen: props.value,
  multiple: props.multiple,
  max: props.max
}))

const rows = computed(() => pickerRows(input.value))
const summary = computed(() => pickerSummary(props.value, props.max, props.unit))
/** 已选里不在当前页的那些也要显示——不然翻一页就看不见自己选了谁 */
const offPage = computed(() => offPageChosen(props.value, props.page))
const hint = computed(() => pickerHint(props.keyword, props.loading, props.page.length))
</script>

<template>
  <div class="i-entity-picker">
    <IInput
      :value="keyword"
      :placeholder="placeholder"
      @input="(v) => emit('update:keyword', v)"
    />

    <p class="i-entity-picker__summary">
      <span class="i-entity-picker__count">{{ summary.text }}</span>
      <!-- 不说「请移除」：历史记录里的停用项本来就该留着 -->
      <span v-if="summary.notice" class="i-entity-picker__notice">{{ summary.notice }}</span>
      <span v-if="offPage.length" class="i-entity-picker__notice">
        其中 {{ offPage.length }} {{ unit }}不在当前结果里，仍然算数
      </span>
    </p>

    <!-- 已选排在结果之上：翻页时它不该跟着滚出视野 -->
    <ul v-if="value.length" class="i-entity-picker__chosen">
      <li
        v-for="item in value"
        :key="item.id"
        class="i-entity-picker__chip"
        :class="{ 'is-inactive': item.inactive }"
      >
        <span>{{ item.label }}</span>
        <!-- 「已停用」四个字必须在：颜色不单独承担这个信息 -->
        <span v-if="item.inactive" class="i-entity-picker__chip-tag">已停用</span>
        <button
          type="button"
          class="i-entity-picker__chip-off"
          :aria-label="`移除 ${item.label}`"
          @click="emit('input', removePick(value, item.id))"
        >
          <IIcon name="close" :size="12" />
        </button>
      </li>
    </ul>

    <p v-if="hint" class="i-entity-picker__hint">{{ hint }}</p>

    <ul v-else class="i-entity-picker__list">
      <li v-for="row in rows" :key="row.id">
        <button
          type="button"
          class="i-entity-picker__row"
          :class="{ 'is-selected': row.selected }"
          role="checkbox"
          :aria-checked="String(row.selected)"
          :disabled="row.disabled"
          @click="emit('input', togglePick(input, row.id))"
        >
          <IIcon
            :name="row.selected ? 'check-circle' : multiple ? 'plus' : 'user'"
            :size="14"
          />
          <span class="i-entity-picker__label">{{ row.label }}</span>
          <span v-if="row.hint" class="i-entity-picker__sub">{{ row.hint }}</span>
          <!-- 不能选的理由写在行里，不是 title：触摸屏没有悬停 -->
          <span v-if="row.reason" class="i-entity-picker__reason">{{ row.reason }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
