<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { firstMenuActive, moveMenuActive, resolveOverlay, type Placement } from '@i-design/common'
import IIcon from './IIcon.vue'
import type { IconName } from './icons'

export interface DropdownItem {
  key: string
  label?: string
  icon?: IconName
  /** 快捷键提示，只作展示，不代为绑定 */
  hint?: string
  disabled?: boolean
  /** 危险操作单独着色，删除类命令不应与普通命令同样朴素 */
  danger?: boolean
  divider?: boolean
  /** 分组标题：不可聚焦，仅用于分段 */
  group?: string
}

const props = withDefaults(
  defineProps<{
    items: DropdownItem[]
    placement?: Placement
    disabled?: boolean
  }>(),
  { placement: 'bottom', disabled: false }
)

const emit = defineEmits<{ select: [key: string] }>()

const visible = ref(false)
const active = ref(-1)
const triggerEl = ref<HTMLElement>()
const popupEl = ref<HTMLElement>()
const pos = ref({ x: 0, y: 0, placement: props.placement, arrow: 0 })
const id = `i-dropdown-${useId()}`

/** 分隔线与分组标题不参与键盘导航，这里统一按 divider 标记 */
const navItems = computed(() =>
  props.items.map((item) => ({ disabled: item.disabled, divider: !!item.divider || !!item.group }))
)

async function place() {
  await nextTick()
  const t = triggerEl.value?.getBoundingClientRect()
  const el = popupEl.value
  if (!t || !el) return
  /*
   * 浮层尺寸用 offsetWidth/offsetHeight，而不是 getBoundingClientRect：
   * 出现动画带 scale(0.97)，用外接矩形会量到缩放中的尺寸，
   * 于是按偏小的宽度算中心，浮层最终停在偏移几像素的位置。
   */
  const p = { x: 0, y: 0, width: el.offsetWidth, height: el.offsetHeight }
  pos.value = resolveOverlay({
    trigger: t,
    popup: p,
    viewport: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
    placement: props.placement,
    offset: 4,
    // 菜单通常比触发按钮宽，居中会向左溢出压住旁边的内容
    align: 'start'
  })
}

function open() {
  if (props.disabled) return
  visible.value = true
  active.value = firstMenuActive(navItems.value)
}

function close() {
  visible.value = false
  active.value = -1
}

/**
 * 焦点交还触发元素：菜单关闭后焦点若落在 body，键盘用户就失去了位置。
 * 真正可聚焦的是插槽里的控件，不是包裹用的 span。
 */
function focusTrigger() {
  const focusable = triggerEl.value?.querySelector<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  focusable?.focus()
}

function choose(item: DropdownItem) {
  if (item.disabled || item.divider || item.group) return
  emit('select', item.key)
  close()
  focusTrigger()
}

function onKeydown(event: KeyboardEvent) {
  if (!visible.value) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      open()
    }
    return
  }
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      active.value = moveMenuActive(navItems.value, active.value, 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      active.value = moveMenuActive(navItems.value, active.value, -1)
      break
    case 'Home':
      event.preventDefault()
      active.value = firstMenuActive(navItems.value)
      break
    case 'Escape':
      event.preventDefault()
      close()
      focusTrigger()
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (active.value >= 0) choose(props.items[active.value])
      break
  }
}

function onDocumentClick(event: MouseEvent) {
  const target = event.target as Node
  if (triggerEl.value?.contains(target) || popupEl.value?.contains(target)) return
  close()
}

watch(visible, (open) => {
  if (open) {
    place()
    window.addEventListener('scroll', place, { passive: true, capture: true })
    window.addEventListener('resize', place)
    document.addEventListener('click', onDocumentClick)
  } else {
    window.removeEventListener('scroll', place, true)
    window.removeEventListener('resize', place)
    document.removeEventListener('click', onDocumentClick)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', place, true)
  window.removeEventListener('resize', place)
  document.removeEventListener('click', onDocumentClick)
})

const style = computed(() => ({ left: `${pos.value.x}px`, top: `${pos.value.y}px` }))
</script>

<template>
  <!--
    触发器只做包裹，不自称 button：插槽里传入的通常已经是一个真正的按钮，
    外层再声明 role/tabindex 会形成嵌套按钮语义（读屏念两遍），并多出一个焦点点。
    键盘事件由内部控件冒泡上来，这里照样收得到。
  -->
  <span
    ref="triggerEl"
    class="i-overlay-trigger"
    :aria-haspopup="'menu'"
    :aria-expanded="visible"
    :aria-controls="visible ? id : undefined"
    @click="visible ? close() : open()"
    @keydown="onKeydown"
  >
    <slot />
  </span>

  <Teleport to="body">
    <Transition name="i-overlay-fade">
      <div v-if="visible" :id="id" ref="popupEl" class="i-dropdown" :style="style" @keydown="onKeydown">
        <ul class="i-dropdown__list" role="menu">
          <template v-for="(item, index) in items" :key="item.key">
            <li v-if="item.divider" class="i-dropdown__divider" role="separator" />
            <li v-else-if="item.group" class="i-dropdown__group" role="presentation">{{ item.group }}</li>
            <li v-else role="none">
              <button
                type="button"
                class="i-dropdown__item"
                :class="{ 'is-active': index === active, 'is-danger': item.danger }"
                role="menuitem"
                :disabled="item.disabled"
                @click="choose(item)"
                @mouseenter="active = index"
              >
                <IIcon v-if="item.icon" :name="item.icon" class="i-dropdown__icon" :size="16" />
                <span>{{ item.label }}</span>
                <span v-if="item.hint" class="i-dropdown__hint">{{ item.hint }}</span>
              </button>
            </li>
          </template>
        </ul>
      </div>
    </Transition>
  </Teleport>
</template>
