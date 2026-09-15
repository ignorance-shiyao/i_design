<script setup lang="ts">
/**
 * 导入向导的列映射与预检报告（astra.md 的 B11）。
 *
 * 文件怎么读、预检怎么跑、导入怎么发，都在调用方手里——这个组件不碰任何 IO。
 * 它管的是三件事的呈现：映射对不对、预检说了什么、错误清单怎么拿走。
 *
 * 映射表按「一行一个目标字段」排，不按来源列排：用户心里的问题是「我这张表里
 * 哪一列是客户」，从目标字段出发才答得上；反过来排，必填字段漏没漏映还得自己
 * 在脑子里对一遍。
 *
 * 判断全在 logic/importjob.ts，五端共用一份。
 */
import { computed } from 'vue'
import {
  assignMapping,
  canProceed,
  mappingIssues,
  problemsCsv,
  type ColumnMapping,
  type DryRunReport,
  type SourceColumn,
  type TargetField
} from '@i-design/common'
import IIcon from './IIcon.vue'
import IButton from './IButton.vue'
import ISelect from './ISelect.vue'

const props = withDefaults(
  defineProps<{
    /** 文件表头。由调用方解析出来 */
    sources?: SourceColumn[]
    /** 要导入到哪些字段 */
    fields?: TargetField[]
    /** 目标字段 → 来源列。受控：映射是数据，不是向导的内部状态 */
    modelValue?: ColumnMapping
    /** 预检报告。跑过才有 */
    report?: DryRunReport
    busy?: boolean
    /** 问题清单最多列几条，再多折成一句 */
    maxProblems?: number
  }>(),
  {
    sources: () => [],
    fields: () => [],
    modelValue: () => ({}),
    report: undefined,
    busy: false,
    maxProblems: 8
  }
)

const emit = defineEmits<{
  'update:modelValue': [mapping: ColumnMapping]
  /** 跑预检。调用方保证它不写任何业务数据 */
  'dry-run': []
  /** 真的导入 */
  submit: []
  /** 把错误清单交出去，由调用方决定怎么落地（下载、复制、发邮件） */
  download: [csv: string]
}>()

const issues = computed(() => mappingIssues(props.modelValue, props.fields))
const ready = computed(() => canProceed(issues.value))

const options = computed(() => [
  { value: '', label: '（不映射）' },
  ...props.sources.map((s) => ({ value: s.key, label: s.key }))
])

const sampleOf = (field: string) =>
  props.sources.find((s) => s.key === props.modelValue[field])?.sample ?? ''

const visibleProblems = computed(() => props.report?.problems.slice(0, props.maxProblems) ?? [])
const hiddenProblems = computed(() =>
  Math.max(0, (props.report?.problems.length ?? 0) - props.maxProblems)
)

function pick(field: string, value: unknown) {
  // 多选的 Select 在这儿用不上：一个字段只能对着一列
  const one = Array.isArray(value) ? value[0] : value
  // 指给别人之前先从原处摘掉，否则会悄悄变成「一列映给两个字段」
  emit('update:modelValue', assignMapping(props.modelValue, field, one ? String(one) : null))
}
</script>

<template>
  <section class="i-import-wizard">
    <!-- 一行一个目标字段：用户心里的问题是「我这张表里哪一列是客户」 -->
    <ul class="i-import-wizard__map">
      <li v-for="field in fields" :key="field.key" class="i-import-wizard__row">
        <span class="i-import-wizard__field">
          {{ field.label }}
          <!-- 必填不只靠星号：后面跟着「必填」两个字 -->
          <span v-if="field.required" class="i-import-wizard__required">必填</span>
        </span>
        <ISelect
          class="i-import-wizard__pick"
          :model-value="modelValue[field.key] ?? ''"
          :options="options"
          :aria-label="`${field.label} 对应的来源列`"
          @update:model-value="(v: unknown) => pick(field.key, v)"
        />
        <span v-if="sampleOf(field.key)" class="i-import-wizard__sample">
          样例：{{ sampleOf(field.key) }}
        </span>
      </li>
    </ul>

    <ul v-if="issues.length" class="i-import-wizard__issues">
      <li
        v-for="issue in issues"
        :key="`${issue.level}-${issue.field}`"
        class="i-import-wizard__issue"
        :class="`i-import-wizard__issue--${issue.level}`"
      >
        <span class="i-import-wizard__issue-icon">
          <IIcon :name="issue.level === 'error' ? 'error-circle' : 'warning-triangle'" :size="12" />
        </span>
        <span>{{ issue.message }}</span>
      </li>
    </ul>

    <div class="i-import-wizard__actions">
      <IButton size="sm" :loading="busy" :disabled="busy || !ready" @click="emit('dry-run')">
        预检
      </IButton>
      <IButton
        size="sm"
        variant="primary"
        :loading="busy"
        :disabled="busy || !ready || !report"
        @click="emit('submit')"
      >
        开始导入
      </IButton>
      <IButton
        v-if="report && report.problems.length"
        size="sm"
        @click="emit('download', problemsCsv(report.problems))"
      >
        下载错误清单
      </IButton>
    </div>

    <template v-if="report">
      <div class="i-import-wizard__report" role="status">
        <span class="i-import-wizard__issue-icon">
          <IIcon :name="report.problems.length ? 'warning-triangle' : 'check-circle'" :size="12" />
        </span>
        <span class="i-import-wizard__report-text">{{ report.summary }}</span>
        <!-- 这句话要一直在：它是用户敢点预检的理由 -->
        <p class="i-import-wizard__safe">预检没有写入任何数据，现在取消不会留下半份记录。</p>
      </div>

      <ul v-if="visibleProblems.length" class="i-import-wizard__problems">
        <li v-for="(problem, i) in visibleProblems" :key="`${problem.row}-${i}`">
          <!-- 行号在最前面：用户手里那份是几千行的表格 -->
          <span class="i-import-wizard__row-no">第 {{ problem.row }} 行</span>
          <!-- 分隔符拼成一段插值：模板里的换行会把空格吃掉，「行·客户」读起来是另一个词 -->
          {{ problem.column ? ` · ${problem.column}` : '' }} —— {{ problem.message }}
        </li>
        <li v-if="hiddenProblems">
          还有 {{ hiddenProblems }} 条，下载错误清单看完整的
        </li>
      </ul>
    </template>
  </section>
</template>
