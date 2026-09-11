<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '@/composables/useTheme'
import IIcon from '@/components/IIcon.vue'
import MobileNav from './MobileNav.vue'
import { mobileNavOpen } from '@/composables/useMobileNav'
import ThemePanel from '@/site/ThemePanel.vue'
import { themeConfig } from '@/composables/useThemeConfig'

const { theme, toggleTheme } = useTheme()
const themePanelOpen = ref(false)

function onToggleTheme(event: MouseEvent) {
  const el = event.currentTarget as HTMLElement
  const box = el.getBoundingClientRect()
  toggleTheme({ x: box.x + box.width / 2, y: box.y + box.height / 2 }, themeConfig.themeTransition)
}

const links = [
  { to: '/components', label: '组件' },
  { to: '/design/tokens', label: '设计令牌' },
  { to: '/design/cross-platform', label: '跨端' },
  { to: '/resources', label: '资源' }
]
</script>

<template>
  <header class="header">
    <div class="i-container header__inner">
      <RouterLink to="/" class="header__brand" aria-label="Ignorance Design 首页">
        <span class="header__logo" aria-hidden="true">
          <span class="header__logo-dot" />
          <span class="header__logo-line" />
        </span>
        <span class="header__brand-copy">
          <strong>iDesign</strong>
          <small>Ignorance Design</small>
        </span>
      </RouterLink>

      <nav class="header__nav" aria-label="主导航">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to">{{ link.label }}</RouterLink>
      </nav>

      <div class="header__actions">
        <a
          class="header__text-action"
          href="https://github.com/ignorance-shiyao/i_design"
          target="_blank"
          rel="noreferrer"
          title="在 GitHub 上查看源码"
        >
          <IIcon name="github" :size="15" />
          <span>GitHub</span>
        </a>

        <span class="header__divider" aria-hidden="true" />

        <button
          class="header__icon"
          data-theme-trigger
          :class="{ 'is-active': themePanelOpen }"
          title="主题配置"
          aria-label="主题配置"
          :aria-expanded="themePanelOpen"
          @click="themePanelOpen = !themePanelOpen"
        >
          <IIcon name="palette" :size="16" />
        </button>

        <button
          class="header__icon"
          :title="theme === 'dark' ? '切换到亮色' : '切换到暗色'"
          :aria-label="theme === 'dark' ? '切换到亮色' : '切换到暗色'"
          @click="onToggleTheme"
        >
          <IIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="16" />
        </button>

        <button
          class="header__icon header__icon--menu"
          aria-label="打开导航"
          :aria-expanded="mobileNavOpen"
          @click="mobileNavOpen = true"
        >
          <IIcon name="menu" :size="18" />
        </button>
      </div>
    </div>

    <MobileNav />
    <ThemePanel v-model:open="themePanelOpen" />
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: var(--i-z-sticky);
  border-bottom: 1px solid color-mix(in srgb, var(--i-color-hairline) 88%, transparent);
  background: color-mix(in srgb, var(--i-color-bg) 82%, transparent);
  backdrop-filter: saturate(160%) blur(18px);
}

.header__inner {
  display: flex;
  align-items: center;
  min-height: 64px;
}

.header__brand {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 188px;
  color: var(--i-color-text);
}

.header__logo {
  position: relative;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--i-color-brand) 36%, var(--i-color-border));
  border-radius: 9px;
  background:
    linear-gradient(145deg, color-mix(in srgb, var(--i-color-brand) 16%, var(--i-color-bg-elevated)), var(--i-color-bg-elevated));
  box-shadow: inset 0 1px 0 color-mix(in srgb, #fff 52%, transparent), var(--i-shadow-sm);
}

.header__logo-dot {
  position: absolute;
  top: 7px;
  left: 7px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--i-color-brand);
}

.header__logo-line {
  position: absolute;
  right: 7px;
  bottom: 7px;
  width: 10px;
  height: 2px;
  border-radius: 99px;
  background: var(--i-color-text);
  box-shadow: 0 -5px 0 color-mix(in srgb, var(--i-color-text) 52%, transparent);
}

.header__brand-copy { display: grid; gap: 1px; }
.header__brand-copy strong { font-size: 13px; line-height: 1.2; letter-spacing: -.01em; }
.header__brand-copy small { color: var(--i-color-text-tertiary); font: 500 9px/1.2 var(--i-font-family-mono); letter-spacing: .06em; }

.header__nav {
  display: flex;
  align-items: center;
  gap: 3px;
  margin: 0 auto;
}

.header__nav a {
  position: relative;
  padding: 8px 12px;
  border-radius: 9px;
  color: var(--i-color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  transition: color var(--i-motion-fast) var(--i-motion-easing), background var(--i-motion-fast) var(--i-motion-easing);
}

.header__nav a:hover { color: var(--i-color-text); background: var(--i-color-bg-subtle); }
.header__nav a.router-link-active { color: var(--i-color-text); }
.header__nav a.router-link-active::after {
  content: '';
  position: absolute;
  right: 12px;
  bottom: 3px;
  left: 12px;
  height: 2px;
  border-radius: 99px;
  background: var(--i-color-brand);
}

.header__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  min-width: 188px;
}

.header__text-action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 0 10px;
  border-radius: 9px;
  color: var(--i-color-text-secondary);
  font-size: 12px;
}
.header__text-action:hover { color: var(--i-color-text); background: var(--i-color-bg-subtle); }

.header__divider { width: 1px; height: 18px; margin: 0 3px; background: var(--i-color-hairline); }

.header__icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--i-color-text-secondary);
  cursor: pointer;
  transition: color var(--i-motion-fast) var(--i-motion-easing), background var(--i-motion-fast) var(--i-motion-easing);
}
.header__icon:hover, .header__icon.is-active { color: var(--i-color-brand); background: var(--i-color-brand-subtle); }
.header__icon--menu { display: none; }

@media (max-width: 920px) {
  .header__nav { display: none; }
  .header__actions { margin-left: auto; min-width: 0; }
  .header__icon--menu { display: grid; }
  .header__text-action span, .header__divider { display: none; }
}

@media (max-width: 460px) {
  .header__brand { min-width: 0; }
  .header__brand-copy small { display: none; }
  .header__text-action { display: none; }
}
</style>
