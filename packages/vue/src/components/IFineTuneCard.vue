<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IFineTuneCard.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * 属性检查器：智能体生成之后，人接着微调。
 *
 * 与一张普通表单差在一件事上：**随时看得出「哪几项被我改过」，
 * 并且能单独退回去**。没有这条，用户调了七八下之后就不敢再动了——
 * 他不知道自己已经偏离原始结果多远，也不知道怎么退回某一项。
 *
 * 改动标记不是只给一个颜色：改过的那一项旁边多出一个「退回」按钮，
 * 标题上写着「改了 3 项」。灰度打印与色觉障碍下都读得出来。
 */
import { computed } from 'vue'
import IIcon from './IIcon.vue'
import ISwitch from './ISwitch.vue'
import ISelect from './ISelect.vue'
import {
  changedKeys,
  clampFieldValue,
  fieldRatio,
  fineTuneSummary,
  formatFieldValue,
  resetField,
  type FineTuneField,
  type FineTuneValue,
  type FineTuneValues
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    fields: FineTuneField[]
    /** 智能体给出的原始值。退回时回到这里 */
    original: FineTuneValues
    /** 当前值（用 v-model:values 控制） */
    values: FineTuneValues
    title?: string
  }>(),
  { title: '微调' }
)

const emit = defineEmits<{ (e: 'inputs', value: FineTuneValues): void; (e: 'reset'): void }>()

const changed = computed(() => new Set(changedKeys(props.fields, props.original, props.values)))
const summary = computed(() => fineTuneSummary(changed.value.size))

function set(field: FineTuneField, value: FineTuneValue) {
  // 夹范围与吸步长在逻辑层做：拖的和敲的必须得到同一个值
  emit('inputs', { ...props.values, [field.key]: clampFieldValue(field, value) })
}

function revert(field: FineTuneField) {
  emit('inputs', resetField(props.original, props.values, field.key))
}
</script>

<template>
  <section class="i-finetune">
    <header class="i-finetune__head">
      <h3 class="i-finetune__title">{{ title }}</h3>
      <!-- 改了几项写成字：一个小圆点说不清改了多少，也说不清改了哪几项 -->
      <span class="i-finetune__summary">{{ summary }}</span>
      <button
        class="i-finetune__reset-all"
        type="button"
        :disabled="changed.size === 0"
        @click="emit('reset')"
      >
        <IIcon name="undo" :size="13" />
        全部退回
      </button>
    </header>

    <div class="i-finetune__list">
      <div
        v-for="field in fields"
        :key="field.key"
        class="i-finetune__row"
        :class="{ 'is-changed': changed.has(field.key) }"
      >
        <div class="i-finetune__label">
          <span>{{ field.label }}</span>
          <span v-if="field.hint" class="i-finetune__hint">{{ field.hint }}</span>
        </div>

        <div class="i-finetune__control">
          <template v-if="field.kind === 'number'">
            <!--
              滑块与数字框都给：滑块看得见范围但敲不准，数字框敲得准但看不见范围。
              两者同时在，粗调用拖、定稿用敲。
            -->
            <input
              class="i-finetune__range"
              type="range"
              :min="field.min"
              :max="field.max"
              :step="field.step"
              :value="values[field.key]"
              :disabled="field.disabled"
              :aria-label="field.label"
              :style="{ '--i-fill': `${fieldRatio(field, values[field.key]) * 100}%` }"
              @input="set(field, Number(($event.target).value))"
            />
            <input
              class="i-finetune__number"
              type="number"
              :min="field.min"
              :max="field.max"
              :step="field.step"
              :value="values[field.key]"
              :disabled="field.disabled"
              :aria-label="`${field.label}（数值）`"
              @change="set(field, Number(($event.target).value))"
            />
          </template>

          <ISwitch
            v-else-if="field.kind === 'switch'"
            :value="Boolean(values[field.key])"
            :disabled="field.disabled"
            :aria-label="field.label"
            @input="set(field, $event)"
          />

          <ISelect
            v-else-if="field.kind === 'select'"
            :value="String(values[field.key] ?? '')"
            :options="field.options ?? []"
            :disabled="field.disabled"
            :aria-label="field.label"
            @input="set(field, String($event))"
          />

          <input
            v-else-if="field.kind === 'color'"
            class="i-finetune__color"
            type="color"
            :value="String(values[field.key] ?? '#000000')"
            :disabled="field.disabled"
            :aria-label="field.label"
            @input="set(field, ($event.target).value)"
          />

          <input
            v-else
            class="i-finetune__text"
            type="text"
            :value="String(values[field.key] ?? '')"
            :disabled="field.disabled"
            :aria-label="field.label"
            @change="set(field, ($event.target).value)"
          />
        </div>

        <!--
          改过的那一项才有退回按钮。没改的项上也摆一个灰按钮会让整列看起来
          全是可退回的，读者得逐个看清楚才知道自己动过哪些。
        -->
        <button
          v-if="changed.has(field.key)"
          class="i-finetune__revert"
          type="button"
          :aria-label="`把${field.label}退回 ${formatFieldValue(field, original[field.key])}`"
          @click="revert(field)"
        >
          <IIcon name="undo" :size="12" />
          {{ formatFieldValue(field, original[field.key]) }}
        </button>
        <span v-else class="i-finetune__value">{{ formatFieldValue(field, values[field.key]) }}</span>
      </div>
    </div>
  </section>
</template>
