<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import IIcon from './IIcon.vue'
import type { IconName } from './icons'
import { avatarSizePx } from '@i-design/common'

const props = withDefaults(
  defineProps<{
    src?: string
    /** 无图时的文字，通常取姓名；自动截取合适长度 */
    name?: string
    icon?: IconName
    size?: 'sm' | 'md' | 'lg' | number
    shape?: 'circle' | 'square'
    /** 按 name 生成稳定的底色，同一个人在任何页面颜色一致 */
    colorful?: boolean
  }>(),
  { src: '', name: '', icon: 'user', size: 'md', shape: 'circle', colorful: true }
)

const failed = ref(false)
watch(() => props.src, () => (failed.value = false))

const px = computed(() => avatarSizePx(props.size))

/** 中文取末两字（更能区分同姓），西文取首字母缩写 */
const initials = computed(() => {
  const name = props.name.trim()
  if (!name) return ''
  if (/[一-龥]/.test(name)) return name.slice(-2)
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
})

const palette = ['#5e7ce0', '#3ac295', '#fa9841', '#f66f6a', '#7048e8', '#0f766e']
const tint = computed(() => {
  if (!props.colorful || !props.name) return palette[0]
  // 字符码求和取模：稳定、无需存储，同名同色
  const sum = [...props.name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return palette[sum % palette.length]
})

const showImage = computed(() => !!props.src && !failed.value)
</script>

<template>
  <span
    class="i-avatar"
    :class="[`is-${shape}`]"
    :style="{
      width: `${px}px`,
      height: `${px}px`,
      fontSize: `${Math.max(11, Math.round(px * 0.38))}px`,
      background: showImage ? undefined : tint
    }"
    :title="name || undefined"
  >
    <!-- 图片加载失败时静默降级到文字/图标，不留破图 -->
    <img v-if="showImage" :src="src" :alt="name" @error="failed = true" />
    <span v-else-if="initials">{{ initials }}</span>
    <IIcon v-else :name="icon" :size="Math.round(px * 0.5)" />
  </span>
</template>
