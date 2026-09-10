<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IColorPicker.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import IPortal from './_Portal.vue'
import IIcon from './IIcon.vue'
import {
  colorReadout,
  hexToHsv,
  hsvToHex,
  parseColor,
  resolveOverlay,
  type Hsv
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    value?: string
    /** 常用色，点一下直接取用 */
    presets?: string[]
    disabled?: boolean
    /** 显示对比度读数：挑主色时最该看的就是这个 */
    showContrast?: boolean
  }>(),
  {
    value: '#5e7ce0',
    presets: () => ['#5e7ce0', '#0f8a68', '#b7622a', '#c2413d', '#7a4ee0', '#1f86b8', '#1d2129', '#86909c'],
    disabled: false,
    showContrast: true
  }
)

const emit = defineEmits<{ (e: 'input', a0: string): void }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const position = ref({ x: 0, y: 0 })
const hsv = ref<Hsv>(hexToHsv(props.value))
const text = ref(props.value)

watch(
  () => props.value,
  (v) => {
    hsv.value = hexToHsv(v)
    text.value = v
  }
)

const readout = computed(() => colorReadout(props.value))

function commit(next: Hsv) {
  hsv.value = next
  const hex = hsvToHex(next)
  text.value = hex
  emit('input', hex)
}

async function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (!open.value) return
  const trigger = root.value?.getBoundingClientRect()
  await nextTick()
  const box = panel.value
  if (!trigger || !box) return
  const resolved = resolveOverlay({
    trigger: { x: trigger.x, y: trigger.y, width: trigger.width, height: trigger.height },
    // 量 offsetWidth 而不是 getBoundingClientRect：入场动画里有 scale
    popup: { x: 0, y: 0, width: box.offsetWidth, height: box.offsetHeight },
    viewport: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
    placement: 'bottom',
    align: 'start',
    offset: 6
  })
  position.value = { x: resolved.x, y: resolved.y }
}

/* 饱和度-明度方块：横轴是饱和度，纵轴是明度（上亮下暗） */
const area = ref<HTMLElement | null>(null)
let picking = false

function pickFromArea(event: PointerEvent) {
  const rect = area.value?.getBoundingClientRect()
  if (!rect) return
  const s = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  const v = 1 - Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
  commit({ ...hsv.value, s, v })
}

function onAreaDown(event: PointerEvent) {
  picking = true
  ;(event.currentTarget as Element).setPointerCapture(event.pointerId)
  pickFromArea(event)
}
function onAreaMove(event: PointerEvent) {
  if (picking) pickFromArea(event)
}
const onAreaUp = () => { picking = false }

function onHue(event: Event) {
  commit({ ...hsv.value, h: Number((event.target as HTMLInputElement).value) })
}

/*
 * 输入框失焦时才解析。
 *
 * 边打边解析的话，用户删到只剩 "#5" 时会被当成一个合法的颜色（或直接清空），
 * 光标还在框里颜色就已经跳了几次——他没法安心把值改完。
 */
function onTextCommit() {
  const parsed = parseColor(text.value)
  if (parsed) {
    hsv.value = hexToHsv(parsed)
    emit('input', parsed)
  } else {
    // 解析不出来就退回原值，而不是留一个红框让人猜哪里错了
    text.value = props.value
  }
}

const areaBackground = computed(() => `hsl(${hsv.value.h} 100% 50%)`)
const thumbStyle = computed(() => ({
  left: `${hsv.value.s * 100}%`,
  top: `${(1 - hsv.value.v) * 100}%`
}))
</script>

<template>
  <div ref="root" class="i-colorpicker" :class="{ 'is-disabled': disabled }">
    <button
      class="i-colorpicker__trigger"
      type="button"
      :disabled="disabled"
      :aria-expanded="String(open)"
      aria-haspopup="dialog"
      @click="toggle"
    >
      <span class="i-colorpicker__swatch" :style="{ background: value }" />
      <span class="i-colorpicker__value">{{ value }}</span>
      <IIcon name="chevron-down" :size="14" />
    </button>

    <!-- 2.7 没有 Teleport，_Portal 在挂载后把节点搬到 body -->
    <IPortal>
      <div
        v-if="open"
        ref="panel"
        class="i-colorpicker__panel"
        :style="{ left: `${position.x}px`, top: `${position.y}px` }"
      >
        <div
          ref="area"
          class="i-colorpicker__area"
          :style="{ background: areaBackground }"
          @pointerdown="onAreaDown"
          @pointermove="onAreaMove"
          @pointerup="onAreaUp"
          @pointercancel="onAreaUp"
        >
          <span class="i-colorpicker__thumb" :style="thumbStyle" />
        </div>

        <input
          class="i-colorpicker__hue"
          type="range"
          min="0"
          max="359"
          :value="Math.round(hsv.h)"
          aria-label="色相"
          @input="onHue"
        />

        <div class="i-colorpicker__row">
          <input
            v-model="text"
            class="i-colorpicker__text"
            aria-label="色值"
            spellcheck="false"
            @blur="onTextCommit"
            @keydown.enter="onTextCommit"
          />
          <!--
            对比度当场说出来。用户挑的是「好看的颜色」，
            而好不好看和上面的字能不能读是两件事——不提示的话，
            一个明黄的主色会一路走到线上，然后才发现按钮上的白字看不见。
          -->
          <span
            v-if="showContrast"
            class="i-colorpicker__contrast"
            :style="{ background: value, color: readout.ink }"
          >
            {{ readout.ratio }}:1
          </span>
        </div>
        <p v-if="showContrast" class="i-colorpicker__hint">
          {{ readout.passesText ? '正文与控件文字都够读' : readout.passesUi ? '够做控件文字，正文偏低' : '对比度不足，文字会看不清' }}
        </p>

        <div class="i-colorpicker__presets">
          <button
            v-for="preset in presets"
            :key="preset"
            class="i-colorpicker__preset"
            type="button"
            :style="{ background: preset }"
            :aria-label="preset"
            :aria-pressed="String(preset.toLowerCase() === value.toLowerCase())"
            @click="emit('input', preset)"
          >
            <IIcon v-if="preset.toLowerCase() === value.toLowerCase()" name="check" :size="12" />
          </button>
        </div>
      </div>
    </IPortal>
  </div>
</template>
