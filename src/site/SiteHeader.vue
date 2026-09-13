<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useTheme } from "@/composables/useTheme";
import IIcon from "@/components/IIcon.vue";
import MobileNav from "./MobileNav.vue";
import ICommandSearch from "@/components/ICommandSearch.vue";
import { buildSearchIndex } from "./searchIndex";
import type { CommandItem } from "@i-design/common";
import { mobileNavOpen } from "@/composables/useMobileNav";

import ThemePanel from "@/site/ThemePanel.vue";
import { themeConfig } from "@/composables/useThemeConfig";
const { theme, toggleTheme } = useTheme();
const themePanelOpen = ref(false);

/* 揭幕从被点的那个开关展开，动效才解释得清因果 */
function onToggleTheme(event: MouseEvent) {
  const el = event.currentTarget as HTMLElement;
  const box = el.getBoundingClientRect();
  toggleTheme(
    { x: box.x + box.width / 2, y: box.y + box.height / 2 },
    themeConfig.themeTransition
  );
}

const router = useRouter();
const searchOpen = ref(false);
const searchItems = buildSearchIndex();

/* 条目的 key 就是它的路由，选中即跳转——搜索的产出是「到那一页」，不是「知道有这一页」 */
function onSelect(item: CommandItem) {
  router.push(item.key);
}

/*
 * Cmd/Ctrl + K 唤起。挂在 window 上而不是某个输入框上：
 * 快捷键的意义就是「不管现在在看哪一段，都能立刻开始搜」。
 */
function onKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchOpen.value = true;
  }
}
onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));

const links = [
  { to: "/design/values", label: "设计价值观" },
  { to: "/design/tokens", label: "设计令牌" },
  { to: "/components", label: "组件" },
  { to: "/resources", label: "资源" },
];
</script>

<template>
  <header class="header i-glass">
    <div class="i-container header__inner">
      <RouterLink to="/" class="header__brand">
        <span class="header__logo" aria-hidden="true">i</span>
        <span class="header__name">Ignorance Design</span>
      </RouterLink>

      <nav class="header__nav">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to">{{
          link.label
        }}</RouterLink>
      </nav>

      <div class="header__actions">
        <button
          class="header__search"
          title="搜索文档"
          aria-label="搜索文档"
          @click="searchOpen = true"
        >
          <IIcon name="search" :size="14" />
          <span class="header__search-text">搜索</span>
          <!-- 把快捷键写在按钮上：不写的话，会用快捷键的人也得先用一次鼠标才知道有 -->
          <kbd class="header__search-kbd">⌘K</kbd>
        </button>
        <a
          class="header__icon"
          href="https://github.com/ignorance-shiyao/i_design"
          target="_blank"
          rel="noreferrer"
          title="在 GitHub 上查看源码"
          aria-label="在 GitHub 上查看源码"
        >
          <IIcon name="github" :size="16" />
        </a>
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
    <ICommandSearch
      v-model:open="searchOpen"
      :items="searchItems"
      placeholder="搜索组件与文档"
      @select="onSelect"
    />
    <MobileNav />
    <ThemePanel v-model:open="themePanelOpen" />
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: var(--i-z-sticky);
  /*
   * 顶栏的底色写成不透明的：玻璃由 .i-glass 那一层接管（主题配置可关），
   * 关掉之后这里就是实心面，不会留下一条半透明的条压在内容上。
   */
  background: var(--i-color-bg);
  border-bottom: 1px solid var(--i-color-hairline);
}
.header__inner {
  max-width: 1440px;
  display: flex;
  align-items: center;
  gap: var(--i-spacing-8);
  height: 64px;
}
.header__brand {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-2);
  color: var(--i-color-text);
  font-weight: 600;
}
/* 绝不折行：折行会把顶栏撑成两行，吃掉手机上本就不多的一屏 */
.header__name {
  white-space: nowrap;
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
  font-weight: 600;
  box-shadow: none;
}
.header__nav {
  display: flex;
  gap: var(--i-spacing-1);
  margin-left: auto;
}
.header__nav a {
  padding: var(--i-spacing-1) var(--i-spacing-3);
  border-radius: var(--i-radius-md);
  color: var(--i-color-text-secondary);
  transition: color var(--i-motion-fast) var(--i-motion-easing),
    background var(--i-motion-fast) var(--i-motion-easing);
}
.header__nav a:hover {
  color: var(--i-color-text);
  background: var(--i-color-bg-subtle);
}
.header__nav a.router-link-active {
  /* 淡底上的字用 brand-text 那一档：填充色写在同色淡底上只有 3.37:1 */
  color: var(--i-color-brand-text);
  background: var(--i-color-brand-subtle);
}
.header__actions {
  display: flex;
  gap: var(--i-spacing-2);
}
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
.header__icon:hover {
  border-color: var(--i-color-brand);
  color: var(--i-color-brand-text);
}
.header__icon--menu {
  display: none;
}

.header__search {
  display: inline-flex;
  align-items: center;
  gap: var(--i-spacing-2);
  height: 32px;
  padding: 0 var(--i-spacing-2) 0 var(--i-spacing-3);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-md);
  background: var(--i-color-bg-elevated);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-xs);
  font-family: inherit;
  cursor: pointer;
  transition: color var(--i-motion-fast) var(--i-motion-easing),
    border-color var(--i-motion-fast) var(--i-motion-easing);
}
.header__search:hover {
  border-color: var(--i-color-brand);
  color: var(--i-color-brand-text);
}
.header__search-kbd {
  padding: 0 var(--i-spacing-1);
  border-radius: var(--i-radius-sm);
  background: var(--i-color-bg-muted);
  /* 灰底上用二级文字色：三级色在 #eef0f5 上只有 4.33，差一点点过不去 */
  color: var(--i-color-text-secondary);
  font-family: inherit;
}

@media (max-width: 860px) {
  .header__inner {
    gap: var(--i-spacing-3);
  }
  /* 顶部导航整体收进抽屉：窄屏上并排四个入口会挤掉产品名 */
  .header__nav {
    display: none;
  }
  .header__actions {
    margin-left: auto;
  }
  .header__icon--menu {
    display: grid;
  }
  .header__icon {
    width: 40px;
    height: 40px;
  }
  /* 窄屏上只留图标：快捷键提示对没有键盘的设备毫无意义，「搜索」二字也让位给导航 */
  .header__search {
    height: 40px;
    padding: 0 var(--i-spacing-3);
  }
  .header__search-text,
  .header__search-kbd {
    display: none;
  }
}
@media (max-width: 420px) {
  /* 窄屏才让位：产品名是身份，能留则留。
     但绝不让它折行——折行会把顶栏撑成两行，吃掉本就不多的一屏 */
  .header__name {
    display: none;
  }
}
</style>
