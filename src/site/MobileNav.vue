<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import IIcon from '@/components/IIcon.vue'
import { docNav } from '@/data/nav'
import { mobileNavOpen } from '@/composables/useMobileNav'

const route = useRoute()

// 只放文档导航里没有的入口，避免同一条目在抽屉里出现两次
const primary = [
  { to: '/', label: '首页' },
  { to: '/resources', label: '资源' }
]

// 跳转后自动收起：留着一个盖住整屏的抽屉，用户还得再点一次才能看到目标页面
watch(() => route.fullPath, () => (mobileNavOpen.value = false))
</script>

<template>
  <Teleport to="body">
    <Transition name="i-mnav">
      <div v-if="mobileNavOpen" class="mnav" role="dialog" aria-modal="true" aria-label="站点导航">
        <div class="mnav__mask" @click="mobileNavOpen = false" />
        <nav class="mnav__panel">
          <header class="mnav__head">
            <span class="mnav__title">导航</span>
            <button class="mnav__close" aria-label="关闭导航" @click="mobileNavOpen = false">
              <IIcon name="close" :size="18" />
            </button>
          </header>

          <div class="mnav__body">
            <div class="mnav__group">
              <RouterLink v-for="link in primary" :key="link.to" :to="link.to" class="mnav__link is-primary">
                {{ link.label }}
              </RouterLink>
            </div>

            <div v-for="group in docNav" :key="group.title" class="mnav__group">
              <p class="mnav__group-title">{{ group.title }}</p>
              <RouterLink v-for="item in group.items" :key="item.to" :to="item.to" class="mnav__link">
                {{ item.label }}
              </RouterLink>
            </div>
          </div>
        </nav>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mnav {
  position: fixed;
  inset: 0;
  z-index: var(--i-z-modal);
  display: flex;
  justify-content: flex-end;
}
.mnav__mask { position: absolute; inset: 0; background: rgba(20, 24, 34, 0.45); }
.mnav__panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(84vw, 320px);
  background: var(--i-color-bg);
  border-left: 1px solid var(--i-color-hairline);
  box-shadow: var(--i-shadow-lg);
}
.mnav__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 var(--i-spacing-4);
  border-bottom: 1px solid var(--i-color-hairline);
  /* 与页头同高，抽屉展开时标题栏不会错位 */
  flex: none;
}
.mnav__title { font-weight: 600; color: var(--i-color-text); }
.mnav__close {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--i-radius-md);
  background: none;
  color: var(--i-color-text-secondary);
  cursor: pointer;
}
.mnav__body {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: var(--i-spacing-4) var(--i-spacing-3);
  /* 刘海屏底部安全区 */
  padding-bottom: calc(var(--i-spacing-6) + env(safe-area-inset-bottom));
}
.mnav__group + .mnav__group { margin-top: var(--i-spacing-5); }
.mnav__group-title {
  padding: 0 var(--i-spacing-3);
  margin-bottom: var(--i-spacing-2);
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--i-color-text-tertiary);
}
.mnav__link {
  display: block;
  /* 44px 触控高度：手指不是鼠标指针 */
  min-height: 44px;
  padding: var(--i-spacing-3);
  border-radius: var(--i-radius-md);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-md);
}
.mnav__link.is-primary { color: var(--i-color-text); font-weight: 500; }
.mnav__link.router-link-exact-active {
  background: var(--i-color-brand-subtle);
  color: var(--i-color-brand);
  font-weight: 500;
}

.i-mnav-enter-active .mnav__panel,
.i-mnav-leave-active .mnav__panel {
  transition: transform var(--i-motion-base) var(--i-motion-easing);
}
.i-mnav-enter-active .mnav__mask,
.i-mnav-leave-active .mnav__mask {
  transition: opacity var(--i-motion-base) var(--i-motion-easing);
}
.i-mnav-enter-from .mnav__panel,
.i-mnav-leave-to .mnav__panel { transform: translateX(100%); }
.i-mnav-enter-from .mnav__mask,
.i-mnav-leave-to .mnav__mask { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .i-mnav-enter-active .mnav__panel,
  .i-mnav-leave-active .mnav__panel,
  .i-mnav-enter-active .mnav__mask,
  .i-mnav-leave-active .mnav__mask { transition: none; }
}
</style>
