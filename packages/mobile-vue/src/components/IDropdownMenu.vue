<script setup lang="ts">
import { ref } from 'vue'
import IIcon from './_Icon.vue'

export interface DropdownMenuOption {
  value: string
  label: string
}
export interface DropdownMenuField {
  name: string
  label: string
  options: DropdownMenuOption[]
}

/**
 * 移动端筛选条：一排筛选项，点开从条下方通栏展开。
 *
 * 与桌面的 Dropdown 不同——手机上「从哪儿弹出来的」比「弹在哪儿」更重要，
 * 一个飘在半空的小面板，用户不知道它属于哪一项。
 */
const props = defineProps<{
  fields: DropdownMenuField[]
  /** 各字段当前选中的值，形如 { sort: 'new' } */
  modelValue: Record<string, string>
}>()

const emit = defineEmits<{
  'update:modelValue': [Record<string, string>]
  change: [{ name: string; value: string }]
}>()

const openName = ref('')

function labelOf(field: DropdownMenuField) {
  const picked = field.options.find((option) => option.value === props.modelValue[field.name])
  return picked ? picked.label : field.label
}

function toggle(name: string) {
  openName.value = openName.value === name ? '' : name
}

function pick(field: DropdownMenuField, option: DropdownMenuOption) {
  emit('update:modelValue', { ...props.modelValue, [field.name]: option.value })
  emit('change', { name: field.name, value: option.value })
  // 选完就收起：手机上留着面板会挡住刚筛出来的结果
  openName.value = ''
}
</script>

<template>
  <div class="i-dropdown-menu">
    <div class="i-dropdown-menu__bar">
      <button
        v-for="field in fields"
        :key="field.name"
        class="i-dropdown-menu__item"
        :class="{
          'is-open': openName === field.name,
          'is-filtered': !!modelValue[field.name]
        }"
        type="button"
        :aria-expanded="openName === field.name"
        @click="toggle(field.name)"
      >
        <span class="i-dropdown-menu__label">{{ labelOf(field) }}</span>
        <IIcon class="i-dropdown-menu__arrow" name="chevron-down" :size="14" />
      </button>
    </div>

    <template v-for="field in fields" :key="`panel-${field.name}`">
      <template v-if="openName === field.name">
        <div class="i-dropdown-menu__mask" @click="openName = ''" />
        <div class="i-dropdown-menu__panel" role="listbox">
          <button
            v-for="option in field.options"
            :key="option.value"
            class="i-dropdown-menu__option"
            :class="{ 'is-active': modelValue[field.name] === option.value }"
            type="button"
            role="option"
            :aria-selected="modelValue[field.name] === option.value"
            @click="pick(field, option)"
          >
            {{ option.label }}
            <IIcon v-if="modelValue[field.name] === option.value" name="check" :size="16" />
          </button>
        </div>
      </template>
    </template>
  </div>
</template>
