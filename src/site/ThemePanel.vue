<script setup lang="ts">
import { computed, ref } from 'vue'
import IIcon from '@/components/IIcon.vue'
import ISegmented from '@/components/ISegmented.vue'
import ISwitch from '@/components/ISwitch.vue'
import IButton from '@/components/IButton.vue'
import { PRESET_BRANDS, useThemeConfig } from '@/composables/useThemeConfig'

const { themeConfig, currentRamp, resetThemeConfig } = useThemeConfig()
const open = ref(false)

const scaleOptions = [
  { value: 'compact', label: '紧凑' },
  { value: 'default', label: '默认' },
  { value: 'loose', label: '宽松' }
]

/*
 * 对比度告警据实显示，不做「看起来都合格」的粉饰。
 * 中等明度的主题色上白字与深字都到不了正文要求的 4.5:1，
 * 这是该颜色的固有限制——告诉用户，让他自己权衡。
 */
const contrastLevel = computed(() => {
  const ratio = currentRamp.value.onBrandContrast
  if (ratio >= 4.5) return { tone: 'ok', text: `按钮文字对比度 ${ratio.toFixed(2)}:1，达正文标准` }
  if (ratio >= 3) return { tone: 'warn', text: `按钮文字对比度 ${ratio.toFixed(2)}:1，仅达大字与控件标准` }
  return { tone: 'bad', text: `按钮文字对比度 ${ratio.toFixed(2)}:1，低于 3:1，不建议使用` }
})
</script>

<template>
  <button
    class="tp__fab"
    :class="{ 'is-open': open }"
    :aria-expanded="open"
    aria-label="主题配置"
    title="主题配置"
    @click="open = !open"
  >
    <IIcon :name="open ? 'close' : 'sparkle'" :size="18" />
  </button>

  <Transition name="tp">
    <aside v-if="open" class="tp" role="dialog" aria-label="主题配置">
      <header class="tp__head">
        <div>
          <p class="tp__title">主题配置</p>
          <p class="tp__sub">改动实时生效，并记住到下次访问</p>
        </div>
        <IButton size="sm" @click="resetThemeConfig">恢复默认</IButton>
      </header>

      <section class="tp__section">
        <p class="tp__label">主题色</p>
        <div class="tp__swatches">
          <button
            v-for="preset in PRESET_BRANDS"
            :key="preset.value"
            class="tp__swatch"
            :class="{ 'is-active': themeConfig.brand === preset.value }"
            :style="{ background: preset.value }"
            :title="preset.label"
            :aria-label="preset.label"
            :aria-pressed="themeConfig.brand === preset.value"
            @click="themeConfig.brand = preset.value"
          >
            <IIcon v-if="themeConfig.brand === preset.value" name="check" :size="14" />
          </button>

          <label class="tp__swatch tp__swatch--custom" title="自定义颜色">
            <input v-model="themeConfig.brand" type="color" aria-label="自定义主题色" />
            <IIcon name="plus" :size="14" />
          </label>
        </div>

        <!-- 推导出的整条色阶：让用户看到一个基色会变成什么，而不是只看一个方块 -->
        <div class="tp__ramp">
          <span
            v-for="step in [
              { key: 'active', label: '按下' },
              { key: 'brand', label: '常态' },
              { key: 'hover', label: '悬停' },
              { key: 'subtle', label: '浅底' }
            ]"
            :key="step.key"
            class="tp__ramp-step"
          >
            <span
              class="tp__ramp-chip"
              :style="{ background: (currentRamp as any)[step.key] }"
            />
            {{ step.label }}
          </span>
        </div>

        <p class="tp__contrast" :class="`is-${contrastLevel.tone}`">
          <IIcon
            :name="contrastLevel.tone === 'ok' ? 'check-circle' : 'warning-triangle'"
            :size="14"
          />
          {{ contrastLevel.text }}
        </p>
      </section>

      <section class="tp__section">
        <p class="tp__label">圆角</p>
        <ISegmented v-model="themeConfig.radius" :options="scaleOptions" block />
        <div class="tp__preview tp__preview--radius">
          <span class="tp__box" />
          <span class="tp__box tp__box--lg" />
          <IButton size="sm">按钮</IButton>
        </div>
      </section>

      <section class="tp__section">
        <p class="tp__label">字号</p>
        <ISegmented v-model="themeConfig.fontSize" :options="scaleOptions" block />
        <div class="tp__preview">
          <p class="tp__sample tp__sample--lg">Ignorance Design</p>
          <p class="tp__sample">正文示例：令牌驱动的设计体系</p>
          <p class="tp__sample tp__sample--xs">辅助说明文字</p>
        </div>
      </section>

      <section class="tp__section tp__section--row">
        <div>
          <p class="tp__label">动效</p>
          <p class="tp__hint">关闭后所有过渡立即停止</p>
        </div>
        <ISwitch v-model="themeConfig.motion" />
      </section>

      <footer class="tp__foot">
        当前配置只改写 CSS 变量，不触及任何组件代码——
        这也是对「组件只引用语义令牌」这条架构约定的验证。
      </footer>
    </aside>
  </Transition>
</template>

<style scoped>
.tp__fab {
  position: fixed;
  right: var(--i-spacing-6);
  bottom: var(--i-spacing-6);
  z-index: 1200;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-full);
  background: var(--i-color-bg-elevated);
  color: var(--i-color-brand);
  box-shadow: var(--i-shadow-lg);
  cursor: pointer;
  transition: transform var(--i-motion-base) var(--i-motion-easing),
    color var(--i-motion-fast) var(--i-motion-easing);
}
.tp__fab:hover { transform: scale(1.06); }
.tp__fab.is-open { color: var(--i-color-text-secondary); }

.tp {
  position: fixed;
  right: var(--i-spacing-6);
  bottom: calc(var(--i-spacing-6) + 56px);
  z-index: 1200;
  width: 320px;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
  padding: var(--i-spacing-5);
  border: 1px solid var(--i-color-border);
  border-radius: var(--i-radius-xl);
  background: var(--i-color-bg-elevated);
  box-shadow: var(--i-shadow-lg);
}

.tp__head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--i-spacing-3); }
.tp__title { font-size: var(--i-font-size-lg); font-weight: 600; color: var(--i-color-text); }
.tp__sub { margin-top: 2px; font-size: var(--i-font-size-xs); color: var(--i-color-text-tertiary); }

.tp__section { margin-top: var(--i-spacing-5); }
.tp__section--row { display: flex; align-items: center; justify-content: space-between; }
.tp__label { margin-bottom: var(--i-spacing-2); font-size: var(--i-font-size-sm); color: var(--i-color-text); }
.tp__hint { font-size: var(--i-font-size-xs); color: var(--i-color-text-tertiary); }

.tp__swatches { display: flex; flex-wrap: wrap; gap: var(--i-spacing-2); }
.tp__swatch {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-md);
  color: #fff;
  cursor: pointer;
  transition: transform var(--i-motion-fast) var(--i-motion-easing);
}
.tp__swatch:hover { transform: scale(1.1); }
/* 选中态用勾而不是加粗描边：色块本身已经是内容，描边会改变它的视觉面积 */
.tp__swatch.is-active { box-shadow: 0 0 0 2px var(--i-color-bg-elevated), 0 0 0 3px var(--i-color-brand); }
.tp__swatch--custom {
  position: relative;
  background: var(--i-color-bg-subtle);
  color: var(--i-color-text-tertiary);
  overflow: hidden;
}
.tp__swatch--custom input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.tp__ramp { display: flex; gap: var(--i-spacing-3); margin-top: var(--i-spacing-3); }
.tp__ramp-step {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-tertiary);
}
.tp__ramp-chip {
  width: 100%;
  min-width: 44px;
  height: 20px;
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-sm);
}

.tp__contrast {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-1);
  margin-top: var(--i-spacing-3);
  font-size: var(--i-font-size-xs);
}
.tp__contrast.is-ok { color: var(--i-color-success); }
.tp__contrast.is-warn { color: var(--i-color-warning); }
.tp__contrast.is-bad { color: var(--i-color-danger); }

.tp__preview {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-3);
  margin-top: var(--i-spacing-3);
  padding: var(--i-spacing-3);
  border-radius: var(--i-radius-md);
  background: var(--i-color-bg-subtle);
}
.tp__preview--radius { align-items: center; }
.tp__box {
  width: 32px;
  height: 32px;
  border-radius: var(--i-radius-md);
  background: var(--i-color-brand-subtle);
}
.tp__box--lg { border-radius: var(--i-radius-lg); }
.tp__preview:not(.tp__preview--radius) { display: block; }
.tp__sample { color: var(--i-color-text); font-size: var(--i-font-size-md); }
.tp__sample--lg { font-size: var(--i-font-size-xl); font-weight: 600; }
.tp__sample--xs { font-size: var(--i-font-size-xs); color: var(--i-color-text-tertiary); }

.tp__foot {
  margin-top: var(--i-spacing-5);
  padding-top: var(--i-spacing-3);
  border-top: 1px solid var(--i-color-hairline);
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-tertiary);
  line-height: 1.6;
}

.tp-enter-active,
.tp-leave-active {
  transition: opacity var(--i-motion-base) var(--i-motion-easing),
    transform var(--i-motion-base) var(--i-motion-easing);
  transform-origin: bottom right;
}
.tp-enter-from,
.tp-leave-to { opacity: 0; transform: translateY(8px) scale(0.96); }

@media (max-width: 600px) {
  .tp { right: var(--i-spacing-4); left: var(--i-spacing-4); width: auto; }
}
@media (prefers-reduced-motion: reduce) {
  .tp-enter-active,
  .tp-leave-active,
  .tp__fab { transition: none; }
}
</style>
