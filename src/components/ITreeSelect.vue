<script setup lang="ts">
import { computed, ref } from 'vue'
import { flattenTree, labelPath, leafKeys, type TreeNode } from '@i-design/common'
import IIcon from './IIcon.vue'
import IPopover from './IPopover.vue'
import ITree from './ITree.vue'

const props = withDefaults(
  defineProps<{
    data: TreeNode[]
    /** 单选值 */
    modelValue?: string
    /** 多选值；传了 multiple 时用这个 */
    checked?: string[]
    multiple?: boolean
    placeholder?: string
    disabled?: boolean
    searchable?: boolean
    /** 单选时是否显示完整路径，如「平台 / 权限 / 角色」 */
    showPath?: boolean
    separator?: string
    /** 多选时最多展示几项，超出折叠为「等 N 项」 */
    maxDisplay?: number
  }>(),
  {
    modelValue: '',
    checked: () => [],
    multiple: false,
    placeholder: '请选择',
    disabled: false,
    searchable: true,
    showPath: true,
    separator: ' / ',
    maxDisplay: 2
  }
)

const emit = defineEmits<{
  'update:modelValue': [key: string]
  'update:checked': [keys: string[]]
  change: [value: string | string[]]
}>()

const entities = computed(() => flattenTree(props.data))
const open = ref(false)
const expanded = ref<string[]>([])

/*
 * 多选时只展示叶子：父节点在选中集合里只是「它的子节点都选了」的推论，
 * 把它也列出来会让用户以为多选了一项。
 */
const display = computed(() => {
  if (props.multiple) {
    const leaves = leafKeys(entities.value, props.checked)
    if (!leaves.length) return ''
    const labels = leaves.map((key) => entities.value.get(key)?.node.label ?? key)
    if (labels.length <= props.maxDisplay) return labels.join('、')
    return `${labels.slice(0, props.maxDisplay).join('、')} 等 ${labels.length} 项`
  }
  if (!props.modelValue) return ''
  return props.showPath
    ? labelPath(entities.value, props.modelValue).join(props.separator)
    : (entities.value.get(props.modelValue)?.node.label ?? props.modelValue)
})

function onSelect(node: TreeNode) {
  emit('update:modelValue', node.key)
  emit('change', node.key)
  // 单选选完即收起；多选要留着让用户继续勾
  open.value = false
}

function onChecked(keys: string[]) {
  emit('update:checked', keys)
  emit('change', keys)
}
</script>

<template>
  <IPopover
    v-model:open="open"
    class="i-tree-select"
    placement="bottom"
    align="start"
    :disabled="disabled"
  >
    <button
      type="button"
      class="i-select__trigger"
      :class="{ 'is-disabled': disabled, 'is-placeholder': !display }"
      :disabled="disabled"
      :aria-label="display || placeholder"
    >
      <span class="i-select__label">{{ display || placeholder }}</span>
      <IIcon name="chevron-down" :size="14" />
    </button>

    <template #content>
      <div class="i-tree-select__panel">
        <ITree
          :data="data"
          :checkable="multiple"
          :searchable="searchable"
          :checked="checked"
          :selected="modelValue"
          v-model:expanded="expanded"
          @select="onSelect"
          @update:checked="onChecked"
        />
      </div>
    </template>
  </IPopover>
</template>
