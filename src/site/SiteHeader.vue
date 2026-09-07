<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '@/composables/useTheme'
import IIcon from '@/components/IIcon.vue'

const { theme, toggleTheme } = useTheme()
const menuOpen = ref(false)

const links = [
  { to: '/design/values', label: '设计价值观' },
  { to: '/design/tokens', label: '设计令牌' },
  { to: '/components', label: '组件' },
  { to: '/resources', label: '资源' }
]
</script>

<template>
  <header class="header">
    <div class="i-container header__inner">
      <RouterLink to="/" class="header__brand">
        <span class="header__logo" aria-hidden="true">i</span>
        <span class="header__name">Ignorance Design</span>
      </RouterLink>

      <nav class="header__nav" :class="{ 'is-open': menuOpen }">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to" @click="menuOpen = false">
          {{ link.label }}
        </RouterLink>
      </nav>

      <div class="header__actions">
        <button class="header__icon" :title="theme === 'dark' ? '切换到亮色' : '切换到暗色'" @click="toggleTheme">
          <IIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="16" />
        </button>
        <button class="header__icon header__icon--menu" aria-label="菜单" @click="menuOpen = !menuOpen">
          <IIcon name="menu" :size="16" />
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: var(--i-z-sticky);
  background: color-mix(in srgb, var(--i-color-bg) 80%, transparent);
  backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid var(--i-color-hairline);
}
.header__inner {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-8);
  height: 60px;
}
.header__brand {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-2);
  color: var(--i-color-text);
  font-weight: 600;
}
.header__logo {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: var(--i-radius-md);
  background: var(--i-gradient-brand);
  color: #fff;
  font-family: var(--i-font-family-mono);
  font-weight: 600;
  box-shadow: var(--i-shadow-brand);
}
.header__nav {
  display: flex;
  gap: var(--i-spacing-1);
  margin-right: auto;
}
.header__nav a {
  padding: var(--i-spacing-1) var(--i-spacing-3);
  border-radius: var(--i-radius-full);
  color: var(--i-color-text-secondary);
  transition: color var(--i-motion-fast) var(--i-motion-easing),
    background var(--i-motion-fast) var(--i-motion-easing);
}
.header__nav a:hover { color: var(--i-color-text); background: var(--i-color-bg-subtle); }
.header__nav a.router-link-active {
  color: var(--i-color-brand);
  background: var(--i-color-brand-subtle);
}
.header__actions { display: flex; gap: var(--i-spacing-2); }
.header__icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-md);
  background: var(--i-color-bg-elevated);
  color: var(--i-color-text-secondary);
  cursor: pointer;
  transition: color var(--i-motion-fast) var(--i-motion-easing),
    border-color var(--i-motion-fast) var(--i-motion-easing);
}
.header__icon:hover { border-color: var(--i-color-brand); color: var(--i-color-brand); }
.header__icon--menu { display: none; }

@media (max-width: 860px) {
  .header__name { display: none; }
  .header__icon--menu { display: block; }
  .header__nav {
    position: absolute;
    top: 60px;
    left: 0;
    right: 0;
    flex-direction: column;
    gap: 0;
    background: var(--i-color-bg);
    border-bottom: 1px solid var(--i-color-border);
    display: none;
  }
  .header__nav.is-open { display: flex; }
  .header__nav a { padding: var(--i-spacing-3) var(--i-spacing-6); }
}
</style>
