<script setup lang="ts">
import { computed, ref } from 'vue'
import IIcon from './IIcon.vue'
import { useConfig } from './useConfig'

const props = withDefaults(
  defineProps<{
    /** 推理耗时的展示文案，如「思考了 12 秒」 */
    duration?: string
    label?: string
    /** 仍在推理中：标题旁的点持续呼吸 */
    pending?: boolean
    /** 初始是否展开；默认折叠——推理过程有用，但它不是答案 */
    defaultOpen?: boolean
  }>(),
  { duration: '', label: '', pending: false, defaultOpen: false }
)

/*
 * 标题走字典：不传时用「推理过程」那一句，传了以传进来的为准。
 * 默认值写死中文的话，换成英文字典后这里会是整块界面里唯一还说中文的地方。
 */
const { locale } = useConfig()
const label = computed(() => props.label || locale.value.thinking)

// 推理结束后不自动展开：用户此时正在读答案，弹开一大段过程会把答案推走
const open = ref(props.defaultOpen)
</script>

<template>
  <section class="i-chat-thinking" :class="{ 'is-open': open }">
    <button class="i-chat-thinking__head" :aria-expanded="open" @click="open = !open">
      <span v-if="pending" class="i-chat-thinking__pulse" />
      <IIcon class="i-chat-thinking__arrow" name="chevron-right" :size="14" />
      <span class="i-chat-thinking__label">{{ label }}</span>
      <span v-if="duration" class="i-chat-thinking__duration">{{ duration }}</span>
    </button>
    <div v-show="open" class="i-chat-thinking__body"><slot /></div>
  </section>
</template>
