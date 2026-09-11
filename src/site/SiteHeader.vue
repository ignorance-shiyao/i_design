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
  { to: '/design/values', label: '设计原则' },
  { to: '/design/tokens', label: 'Token' },
  { to: '/design/cross-platform', label: '跨端' },
  { to: '/resources', label: '资源' }
]
</script>

<template>
  <header class="header">
    <div class="i-container header__inner">
      <RouterLink to="/" class="brand" aria-label="iDesign 首页">
        <span class="brand__mark">i/</span>
        <span class="brand__name">iDesign</span>
      </RouterLink>

      <nav class="nav" aria-label="主导航">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to">{{ link.label }}</RouterLink>
      </nav>

      <div class="actions">
        <a class="action" href="https://github.com/ignorance-shiyao/i_design" target="_blank" rel="noreferrer" aria-label="GitHub">
          <IIcon name="github" :size="15" />
        </a>
        <button class="action" data-theme-trigger :class="{ 'is-active': themePanelOpen }" aria-label="主题配置" @click="themePanelOpen = !themePanelOpen">
          <IIcon name="palette" :size="15" />
        </button>
        <button class="action" :aria-label="theme === 'dark' ? '切换到亮色' : '切换到暗色'" @click="onToggleTheme">
          <IIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="15" />
        </button>
        <button class="action action--menu" aria-label="打开导航" @click="mobileNavOpen = true">
          <IIcon name="menu" :size="17" />
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
  border-bottom: 1px solid var(--i-color-hairline);
  background: color-mix(in srgb, var(--i-color-bg) 92%, transparent);
  backdrop-filter: blur(14px);
}
.header__inner { display:flex; align-items:center; min-height:58px; }
.brand { display:flex; align-items:center; gap:9px; min-width:170px; color:var(--i-color-text); }
.brand__mark { font:700 14px/1 var(--i-font-family-mono); letter-spacing:-.08em; color:var(--i-color-brand); }
.brand__name { font-size:13px; font-weight:650; letter-spacing:-.02em; }
.nav { display:flex; align-items:stretch; gap:22px; margin:0 auto; align-self:stretch; }
.nav a { position:relative; display:flex; align-items:center; color:var(--i-color-text-tertiary); font-size:12px; font-weight:500; transition:color var(--i-motion-fast) var(--i-motion-easing); }
.nav a:hover { color:var(--i-color-text); }
.nav a.router-link-active { color:var(--i-color-text); }
.nav a.router-link-active::after { content:''; position:absolute; right:0; bottom:-1px; left:0; height:1px; background:var(--i-color-brand); }
.actions { display:flex; align-items:center; justify-content:flex-end; gap:2px; min-width:170px; }
.action { display:grid; place-items:center; width:32px; height:32px; padding:0; border:0; border-radius:7px; background:transparent; color:var(--i-color-text-tertiary); cursor:pointer; transition:background var(--i-motion-fast) var(--i-motion-easing),color var(--i-motion-fast) var(--i-motion-easing); }
.action:hover,.action.is-active { background:var(--i-color-bg-subtle); color:var(--i-color-text); }
.action--menu { display:none; }
@media (max-width:900px) { .nav { display:none; }.actions { margin-left:auto; min-width:0; }.brand { min-width:0; }.action--menu { display:grid; } }
</style>
