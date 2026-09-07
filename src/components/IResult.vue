<script setup lang="ts">
import { computed } from 'vue'
import IIcon from './IIcon.vue'
import type { IconName } from './icons'
import err404 from '@/assets/illustrations/error/404.webp'
import err4042x from '@/assets/illustrations/error/404@2x.webp'
import err500 from '@/assets/illustrations/error/500.webp'
import err5002x from '@/assets/illustrations/error/500@2x.webp'

const props = withDefaults(
  defineProps<{
    /** 整页级的操作结果或异常状态 */
    status?: 'success' | 'info' | 'warning' | 'error' | '403' | '404' | '500'
    title?: string
    description?: string
    size?: 'sm' | 'md'
  }>(),
  { status: 'info', title: '', description: '', size: 'md' }
)

/** 404 / 500 有专门的插画；其余状态用图标即可，不必为每种都画一张 */
const artwork: Partial<Record<string, { src: string; srcset: string }>> = {
  '404': { src: err404, srcset: `${err404} 1x, ${err4042x} 2x` },
  '500': { src: err500, srcset: `${err500} 1x, ${err5002x} 2x` }
}

const icons: Record<string, IconName> = {
  success: 'check-circle',
  info: 'info-circle',
  warning: 'warning-triangle',
  error: 'error-circle',
  '403': 'error-circle'
}

const presets: Record<string, { title: string; description: string }> = {
  success: { title: '操作成功', description: '你可以继续下一步，或返回列表查看结果。' },
  info: { title: '处理中', description: '结果稍后可在通知中心查看。' },
  warning: { title: '操作已提交，但有需要注意的地方', description: '请检查下方提示后再继续。' },
  error: { title: '操作失败', description: '请稍后重试；若持续失败请联系管理员。' },
  '403': { title: '无访问权限', description: '当前账号没有该资源的权限，可向管理员申请。' },
  '404': { title: '页面走丢了', description: '地址可能已经变更或删除。' },
  '500': { title: '服务出错了', description: '我们已经记录这次异常，请稍后重试。' }
}

const art = computed(() => artwork[props.status])
const icon = computed(() => icons[props.status])
const text = computed(() => presets[props.status])
</script>

<template>
  <div class="i-result" :class="[`i-result--${size}`, `is-${status}`]">
    <slot name="illustration">
      <img v-if="art" class="i-result__art" :src="art.src" :srcset="art.srcset" alt="" />
      <span v-else class="i-result__icon"><IIcon :name="icon" :size="size === 'sm' ? 28 : 40" /></span>
    </slot>
    <h2 class="i-result__title">{{ title || text.title }}</h2>
    <p class="i-result__desc">{{ description || text.description }}</p>
    <div v-if="$slots.default" class="i-result__actions"><slot /></div>
    <div v-if="$slots.extra" class="i-result__extra"><slot name="extra" /></div>
  </div>
</template>

<style scoped>
.i-result {
  display: grid;
  justify-items: center;
  gap: var(--i-spacing-2);
  padding: var(--i-spacing-16) var(--i-spacing-6);
  text-align: center;
}
.i-result--sm { padding: var(--i-spacing-8) var(--i-spacing-4); }

.i-result__art { width: 300px; max-width: 100%; height: auto; margin-bottom: var(--i-spacing-2); }
.i-result--sm .i-result__art { width: 180px; }

.i-result__icon {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  margin-bottom: var(--i-spacing-3);
  border-radius: var(--i-radius-full);
}
.i-result--sm .i-result__icon { width: 52px; height: 52px; }
.is-success .i-result__icon { color: var(--i-color-success); background: var(--i-color-success-subtle); }
.is-info .i-result__icon { color: var(--i-color-info); background: var(--i-color-info-subtle); }
.is-warning .i-result__icon { color: var(--i-color-warning); background: var(--i-color-warning-subtle); }
.is-error .i-result__icon,
.is-403 .i-result__icon { color: var(--i-color-danger); background: var(--i-color-danger-subtle); }

.i-result__title { font-size: var(--i-font-size-xl); }
.i-result--sm .i-result__title { font-size: var(--i-font-size-lg); }
.i-result__desc { color: var(--i-color-text-secondary); max-width: 46ch; }
.i-result__actions { display: flex; flex-wrap: wrap; gap: var(--i-spacing-3); margin-top: var(--i-spacing-5); }
.i-result__extra {
  width: 100%;
  max-width: 560px;
  margin-top: var(--i-spacing-6);
  text-align: left;
}
</style>
