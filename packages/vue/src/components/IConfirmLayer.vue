<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IConfirmLayer.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { confirmActions, validatePromptValue, type ConfirmRole } from '@i-design/common'
import IModal from './IModal.vue'
import IButton from './IButton.vue'
import IInput from './IInput.vue'
import { confirms, dropConfirm, type ConfirmRecord } from './confirmState'

/**
 * 命令式对话框的渲染层。由 confirm.ts 挂载，页面里不直接用它。
 *
 * 每条记录自己持有输入值与错误文案：连着弹两个 prompt 时，
 * 共用一份状态会让第二个带着第一个的残值出现。
 */
const values = ref<Record<number, string>>({})
const errors = ref<Record<number, string>>({})

watch(
  confirms,
  (list) => {
    for (const item of list) {
      if (!(item.id in values.value)) values.value[item.id] = item.defaultValue
    }
  },
  { immediate: true, deep: true }
)

function settle(item: ConfirmRecord, role: ConfirmRole) {
  if (item.kind === 'prompt' && role === 'confirm') {
    const error = validatePromptValue(values.value[item.id] ?? '', item.rules)
    if (error) {
      errors.value[item.id] = error
      return
    }
  }
  item.settle(role, values.value[item.id] ?? '')
  dropConfirm(item.id)
  delete values.value[item.id]
  delete errors.value[item.id]
}

/* 改了就把错误清掉：留着旧错误会让人以为改了也没用 */
function onInput(item: ConfirmRecord) {
  if (errors.value[item.id]) delete errors.value[item.id]
}
</script>

<template>
  <IModal
    v-for="item in confirms"
    :key="item.id"
    :value="true"
    :title="item.title"
    width="420px"
    :mask-closable="item.maskClosable"
    @input="settle(item, 'close')"
  >
    <p v-if="item.content" class="i-confirm__text">{{ item.content }}</p>

    <div v-if="item.kind === 'prompt'" class="i-confirm__field">
      <IInput
        v-model="values[item.id]"
        :placeholder="item.placeholder"
        :invalid="!!errors[item.id]"
        @input="onInput(item)"
        @keydown.enter="settle(item, 'confirm')"
      />
      <p v-if="errors[item.id]" class="i-confirm__error">{{ errors[item.id] }}</p>
    </div>

    <template #footer>
      <IButton
        v-for="action in confirmActions(item.kind, {
          confirmText: item.confirmText,
          cancelText: item.cancelText,
          danger: item.danger
        })"
        :key="action.role"
        :variant="action.primary ? (action.danger ? 'danger' : 'primary') : 'secondary'"
        @click="settle(item, action.role)"
      >
        {{ action.text }}
      </IButton>
    </template>
  </IModal>
</template>
