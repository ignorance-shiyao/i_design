<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IQueryFilter.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * 查询筛选条：列表页上方那一排条件（astra.md 的 B03）。
 *
 * **为什么条件一变就回第一页。** 不回的话，改完筛选看到的是空白的第 7 页，
 * 而结果其实只有两页——用户会以为「没有数据」，而不是「翻过头了」。
 *
 * **为什么无效条件要说出来而不是丢掉。** 这一排条件大多是从别人那儿粘来的
 * 链接带进来的。里面带着已经下线的状态值时，静默丢掉的话，用户看到的是
 * 一份他没要的结果，却以为那就是链接的内容。
 *
 * **为什么折叠不是「收起全部」。** 常用的一两个字段标了 always，折叠后仍然
 * 留在原位：收光之后用户每次都要先展开再筛，折叠反而变成了多一步。
 *
 * 组件不碰地址栏：它只吐出参数记录，由页面决定写进 URL、页面参数还是路由对象。
 * 这是 pro 层跨端的前提——只有 Web 有地址栏。
 */
import { computed, ref, watch } from 'vue'
import IButton from './IButton.vue'
import IIcon from './IIcon.vue'
import IInput from './IInput.vue'
import ISelect from './ISelect.vue'
import {
  activeCount,
  applyQuickFilter,
  changeFilter,
  clearFilters,
  matchQuickFilter,
  serializeQuery,
  type FilterField,
  type FilterRange,
  type FilterValue,
  type InvalidParam,
  type QueryState,
  type QuickFilter
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    /** 字段定义；顺序即显示顺序 */
    fields: FilterField[]
    /** 当前条件与分页。受控：组件不自己存状态 */
    value: QueryState
    /** 快捷筛选：点一下整套替换当前条件 */
    quickFilters?: QuickFilter[]
    /** 解析链接时认不出来的参数，逐条显示 */
    invalid?: InvalidParam[]
    /** 折叠时最多显示几个字段；标了 always 的不计入 */
    collapsedCount?: number
    /** 默认是否折叠 */
    collapsed?: boolean
  }>(),
  { quickFilters: () => [], invalid: () => [], collapsedCount: 3, collapsed: true }
)

const emit = defineEmits<{ (e: 'input', state: QueryState): void; (e: 'change', payload: { state: QueryState; params: Record<string, string> }): void }>()

const folded = ref(props.collapsed)
watch(() => props.collapsed, (v) => (folded.value = v))

const alwaysFields = computed(() => props.fields.filter((f) => f.always))
const restFields = computed(() => props.fields.filter((f) => !f.always))
const shownFields = computed(() =>
  folded.value
    ? [...alwaysFields.value, ...restFields.value.slice(0, props.collapsedCount)]
    : props.fields
)
const hiddenCount = computed(() => props.fields.length - shownFields.value.length)

const active = computed(() => activeCount(props.value.values))

function push(next: QueryState) {
  emit('input', next)
  emit('change', { state: next, params: serializeQuery(next, props.fields) })
}

function onChange(name: string, value: FilterValue) {
  push(changeFilter(props.value, name, value))
}

function onRange(name: string, part: 'from' | 'to', raw: string) {
  const current = (props.value.values[name] ?? {}) as FilterRange
  onChange(name, { ...current, [part]: raw || undefined })
}

const rangeOf = (name: string) => (props.value.values[name] ?? {}) as FilterRange
const textOf = (name: string) => (props.value.values[name] as string) ?? ''
const listOf = (name: string) => (props.value.values[name] as string[]) ?? []

function toggleTag(name: string, value: string) {
  const list = listOf(name)
  onChange(name, list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
}
</script>

<template>
  <section class="i-query" :aria-label="'查询筛选'">
    <!-- 快捷筛选在最前：它替代的是「手工把三个条件依次选一遍」 -->
    <div v-if="quickFilters.length" class="i-query__quick">
      <button
        v-for="quick in quickFilters"
        :key="quick.key"
        type="button"
        class="i-query__quick-item"
        :class="{ 'is-on': matchQuickFilter(value.values, quick) }"
        :aria-pressed="String(matchQuickFilter(value.values, quick))"
        @click="push(applyQuickFilter(value, quick))"
      >
        {{ quick.label }}
      </button>
    </div>

    <div class="i-query__grid">
      <label v-for="field in shownFields" :key="field.name" class="i-query__field">
        <span class="i-query__label">{{ field.label }}</span>

        <IInput
          v-if="field.kind === 'text'"
          :value="textOf(field.name)"
          :placeholder="field.placeholder"
          @input="(v) => onChange(field.name, v)"
        />

        <ISelect
          v-else-if="field.kind === 'select'"
          :value="textOf(field.name)"
          :options="[{ value: '', label: '全部' }, ...(field.options ?? [])]"
          @input="(v) => onChange(field.name, Array.isArray(v) || v == null ? '' : String(v))"
        />

        <!-- 多选用一排可切换的标签：下拉里的多选要点开才看得见已选了什么 -->
        <span v-else-if="field.kind === 'multi-select'" class="i-query__tags">
          <button
            v-for="option in field.options ?? []"
            :key="option.value"
            type="button"
            class="i-query__tag"
            :class="{ 'is-on': listOf(field.name).includes(option.value) }"
            :aria-pressed="String(listOf(field.name).includes(option.value))"
            @click="toggleTag(field.name, option.value)"
          >
            {{ option.label }}
          </button>
        </span>

        <span v-else class="i-query__range">
          <IInput
            :value="rangeOf(field.name).from ?? ''"
            :type="field.kind === 'date-range' ? 'date' : 'number'"
            @input="(v) => onRange(field.name, 'from', v)"
          />
          <span class="i-query__range-sep" aria-hidden="true">–</span>
          <IInput
            :value="rangeOf(field.name).to ?? ''"
            :type="field.kind === 'date-range' ? 'date' : 'number'"
            @input="(v) => onRange(field.name, 'to', v)"
          />
        </span>
      </label>

      <div class="i-query__actions">
        <IButton v-if="active > 0" size="sm" @click="push(clearFilters(value))">
          清空条件（{{ active }}）
        </IButton>
        <button
          v-if="hiddenCount > 0 || !folded"
          type="button"
          class="i-query__fold"
          :aria-expanded="String(!folded)"
          @click="folded = !folded"
        >
          <IIcon :name="folded ? 'chevron-down' : 'chevron-up'" :size="14" />
          {{ folded ? `展开其余 ${hiddenCount} 项` : '收起' }}
        </button>
      </div>
    </div>

    <!--
      无效参数逐条说：链接是别人粘给你的，你有权知道哪一条没生效。
      用 role="status" 而不是 alert——这不是错误，是「这一条被忽略了」。
    -->
    <p v-if="invalid.length" class="i-query__invalid" role="status">
      链接里有 {{ invalid.length }} 个条件没生效：
      <span v-for="(item, i) in invalid" :key="item.name">
        <template v-if="i > 0">；</template>{{ item.name }}=「{{ item.raw }}」{{ item.reason }}
      </span>
    </p>
  </section>
</template>
