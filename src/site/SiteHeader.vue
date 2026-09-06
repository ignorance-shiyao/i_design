<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { theme, toggleTheme } = useTheme()
const menuOpen = ref(false)

const links = [
  { to: '/design/values', label: '设计价值观' },
  { to: '/design/tokens', label: '设计令牌' },
  { to: '/components/button', label: '组件' },
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
          <svg v-if="theme === 'dark'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke-linecap="round" />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" stroke-linejoin="round" />
          </svg>
        </button>
        <button class="header__icon header__icon--menu" aria-label="菜单" @click="menuOpen = !menuOpen">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
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
  background: color-mix(in srgb, var(--i-color-bg) 88%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--i-color-border);
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
  background: var(--i-color-brand);
  color: #fff;
  font-family: var(--i-font-family-mono);
}
.header__nav {
  display: flex;
  gap: var(--i-spacing-6);
  margin-right: auto;
}
.header__nav a { color: var(--i-color-text-secondary); }
.header__nav a:hover,
.header__nav a.router-link-active { color: var(--i-color-brand); }
.header__actions { display: flex; gap: var(--i-spacing-2); }
.header__icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--i-color-border);
  border-radius: var(--i-radius-md);
  background: transparent;
  color: var(--i-color-text-secondary);
  cursor: pointer;
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
