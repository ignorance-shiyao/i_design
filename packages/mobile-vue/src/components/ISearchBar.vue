<script setup lang="ts">
import { computed, ref } from 'vue'
import IIcon from './_Icon.vue'
import { useConfig } from '@i-design/vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    shape?: 'round' | 'square'
    /** 右侧「取消」：聚焦后才出现，不占用未使用时的横向空间 */
    cancelable?: boolean
    cancelText?: string
    disabled?: boolean
    readonly?: boolean
  }>(),
  {
    placeholder: '',
    shape: 'round',
    cancelable: true,
    cancelText: '',
    disabled: false,
    readonly: false
  }
)

/* 占位与取消走字典；组件自己传了以传进来的为准 */
const { locale } = useConfig()
const placeholder = computed(() => props.placeholder || locale.value.search)
const cancelText = computed(() => props.cancelText || locale.value.cancel)

const emit = defineEmits<{
  'update:modelValue': [string]
  search: [string]
  clear: []
  cancel: []
}>()

const focused = ref(false)
const input = ref<HTMLInputElement | null>(null)
const showCancel = computed(() => props.cancelable && (focused.value || props.modelValue !== ''))

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

function clear() {
  emit('update:modelValue', '')
  emit('clear')
  input.value?.focus()
}

function cancel() {
  emit('update:modelValue', '')
  emit('cancel')
  input.value?.blur()
}
</script>

<template>
  <!--
    用 <form> 包住并 action="."：iOS Safari 只有在表单里、且存在
    type="search" 的输入框时，才会把软键盘的回车键显示成「搜索」。
    这是移动端搜索框最容易漏掉的一处，纯 div 包裹时用户按到的是「换行」。
  -->
  <form class="i-search-bar" action="." @submit.prevent="emit('search', modelValue)">
    <div class="i-search-bar__field" :class="[`i-search-bar__field--${shape}`, { 'is-disabled': disabled }]">
      <IIcon name="search" class="i-search-bar__icon" />
      <input
        ref="input"
        class="i-search-bar__input"
        type="search"
        enterkeyhint="search"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        @input="onInput"
        @focus="focused = true"
        @blur="focused = false"
      />
      <button
        v-if="modelValue && !readonly && !disabled"
        type="button"
        class="i-search-bar__clear"
        aria-label="清空"
        @mousedown.prevent
        @click="clear"
      >
        <IIcon name="close" />
      </button>
    </div>
    <button v-if="showCancel" type="button" class="i-search-bar__cancel" @mousedown.prevent @click="cancel">
      {{ cancelText }}
    </button>
  </form>
</template>
