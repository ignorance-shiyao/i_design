<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  cascaderActivate,
  cascaderColumns,
  flattenTree,
  labelPath,
  nodePath,
  type TreeNode
} from '@i-design/common'
import IIcon from './IIcon.vue'
import IPopover from './IPopover.vue'
import { useConfig } from './useConfig'

const props = withDefaults(
  defineProps<{
    data: TreeNode[]
    /** 选中的叶子 key */
    modelValue?: string
    placeholder?: string
    disabled?: boolean
    /** 允许选中非叶子节点；默认只有叶子才算完成选择 */
    changeOnSelect?: boolean
    separator?: string
  }>(),
  {
    modelValue: '',
    placeholder: '',
    disabled: false,
    changeOnSelect: false,
    separator: ' / '
  }
)

const { locale } = useConfig()
/* 传了就用传的，没传才回落到字典——组件自己的默认值不该盖过调用方 */
const placeholderText = computed(() => props.placeholder || locale.value.placeholder)

const emit = defineEmits<{
  'update:modelValue': [key: string]
  change: [key: string, path: string[]]
}>()

const entities = computed(() => flattenTree(props.data))
// 打开时从当前值恢复路径，用户看到的是上次停在哪儿，而不是从头开始
const active = ref<string[]>(props.modelValue ? nodePath(entities.value, props.modelValue) : [])
// 选完就收起：选择类控件停在展开态，用户会以为还没选上
const open = ref(false)

const columns = computed(() => cascaderColumns(props.data, entities.value, active.value))
const display = computed(() =>
  props.modelValue ? labelPath(entities.value, props.modelValue).join(props.separator) : ''
)

function isActive(key: string, columnIndex: number) {
  return active.value[columnIndex] === key
}

function choose(node: TreeNode) {
  if (node.disabled) return
  active.value = cascaderActivate(entities.value, active.value, node.key)
  const isLeaf = !node.children?.length
  if (isLeaf || props.changeOnSelect) {
    emit('update:modelValue', node.key)
    emit('change', node.key, nodePath(entities.value, node.key))
  }
  // 只有选到叶子才算完成，收起面板；中间层级要留着让用户继续往下走
  if (isLeaf) open.value = false
}
</script>

<template>
  <IPopover v-model:open="open" class="i-cascader" placement="bottom" align="start" :disabled="disabled">
    <button
      type="button"
      class="i-select__trigger"
      :class="{ 'is-disabled': disabled, 'is-placeholder': !display }"
      :disabled="disabled"
      :aria-label="display || placeholderText"
    >
      <span class="i-select__label">{{ display || placeholderText }}</span>
      <IIcon name="chevron-down" :size="14" />
    </button>

    <template #content>
      <div class="i-cascader__panel">
        <ul v-for="(column, columnIndex) in columns" :key="columnIndex" class="i-cascader__column">
          <li v-for="node in column" :key="node.key">
            <button
              type="button"
              class="i-cascader__option"
              :class="{
                'is-active': isActive(node.key, columnIndex),
                'is-selected': modelValue === node.key
              }"
              :disabled="node.disabled"
              @click="choose(node)"
            >
              <span>{{ node.label }}</span>
              <IIcon
                v-if="node.children?.length"
                name="chevron-right"
                :size="14"
                class="i-cascader__arrow"
              />
            </button>
          </li>
        </ul>
      </div>
    </template>
  </IPopover>
</template>
