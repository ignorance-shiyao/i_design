<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import IIcon from './IIcon.vue'

const props = withDefaults(
  defineProps<{
    /** 语义层级；h1-h5 会渲染成对应的标题标签 */
    variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'body' | 'caption'
    type?: 'default' | 'secondary' | 'tertiary' | 'brand' | 'success' | 'warning' | 'danger'
    strong?: boolean
    italic?: boolean
    underline?: boolean
    /** 删除线，用于表示已失效的值 */
    del?: boolean
    mono?: boolean
    /** 超出显示省略号；给数字表示最多几行 */
    ellipsis?: boolean | number
    /** 折叠时可展开：多行省略的长文案，读者要有办法读到后半段 */
    expandable?: boolean
    expandText?: string
    collapseText?: string
    /**
     * 末尾附一个复制按钮。
     * 不传 copyText 时复制的是插槽里的纯文本——最常见的用法是复制一段 ID 或密钥。
     */
    copyable?: boolean
    copyText?: string
    /** 覆盖默认标签，例如把 h3 的样式用在 div 上 */
    as?: string
  }>(),
  {
    variant: 'body',
    type: 'default',
    strong: false,
    italic: false,
    underline: false,
    del: false,
    mono: false,
    ellipsis: false,
    expandable: false,
    expandText: '展开',
    collapseText: '收起',
    copyable: false,
    copyText: '',
    as: ''
  }
)

// 标题的样式与标签默认绑定：视觉层级与文档结构一致，读屏才能正确导航。
// 确有需要时用 as 拆开，但那是例外，不是默认。
const tag = computed(() => {
  if (props.as) return props.as
  if (props.variant.startsWith('h')) return props.variant
  return props.variant === 'caption' ? 'span' : 'p'
})

const lines = computed(() => (typeof props.ellipsis === 'number' ? props.ellipsis : 0))

const expanded = ref(false)
// 展开后就不该再截断：clamp 类名必须跟着展开状态走，否则按钮点了没反应
const clamped = computed(() => lines.value > 0 && !expanded.value)

const slots = useSlots()
const root = ref<HTMLElement | null>(null)
const copied = ref(false)

async function copy() {
  // 优先读 DOM 里的实际文本：插槽内容可能是嵌套元素，取 textContent 才准
  const text = props.copyText || root.value?.querySelector('.i-typo__body')?.textContent?.trim() || ''
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    /*
     * 非安全上下文（http、部分 WebView）里 clipboard API 不可用。
     * 回退到 execCommand：它已废弃，但这是这些环境里唯一还能用的路径，
     * 失败时静默——弹一个「复制失败」对用户毫无帮助。
     */
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    try {
      document.execCommand('copy')
    } catch {
      document.body.removeChild(area)
      return
    }
    document.body.removeChild(area)
  }
  copied.value = true
  setTimeout(() => (copied.value = false), 1600)
}
void slots
</script>

<template>
  <component
    :is="tag"
    class="i-typo"
    :class="[
      `i-typo--${variant}`,
      type !== 'default' ? `i-typo--${type}` : '',
      {
        'is-strong': strong,
        'is-italic': italic,
        'is-underline': underline,
        'is-delete': del,
        'is-mono': mono,
        'is-ellipsis': ellipsis === true,
        'has-actions': (expandable && lines > 0) || copyable
      }
    ]"
    ref="root"
  >
    <!--
      截断作用在内层而不是根元素：clamp 会把展开按钮和复制按钮一起截掉，
      于是「有省略号但没有展开入口」——正是最该有入口的那种情况。
    -->
    <span
      class="i-typo__body"
      :class="{ 'is-clamp': clamped }"
      :style="clamped ? { '--i-typo-lines': lines } : undefined"
    ><slot /></span>

    <button
      v-if="expandable && lines > 0"
      type="button"
      class="i-typo__toggle"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      {{ expanded ? collapseText : expandText }}
    </button>

    <button
      v-if="copyable"
      type="button"
      class="i-typo__copy"
      :aria-label="copied ? '已复制' : '复制'"
      @click="copy"
    >
      <IIcon :name="copied ? 'check' : 'copy'" />
    </button>
  </component>
</template>
