<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { docNav } from '@/data/nav'

const side = ref<HTMLElement | null>(null)
const route = useRoute()

async function revealActive() {
  await nextTick()
  side.value?.querySelector('a.router-link-exact-active')?.scrollIntoView({ block: 'nearest' })
}

onMounted(revealActive)
watch(() => route.path, revealActive)
</script>

<template>
  <div class="i-container doc-layout">
    <aside ref="side" class="side" aria-label="文档导航">
      <div v-for="group in docNav" :key="group.title" class="side__group">
        <p>{{ group.title }}</p>
        <RouterLink v-for="item in group.items" :key="item.to" :to="item.to">
          <span>{{ item.label }}</span>
          <i aria-hidden="true" />
        </RouterLink>
      </div>
    </aside>

    <main class="content i-doc"><RouterView /></main>
  </div>
</template>

<style scoped>
.doc-layout { display:grid; grid-template-columns:180px minmax(0,1fr); gap:clamp(48px,7vw,96px); align-items:start; padding-top:44px; }
.side { position:sticky; top:86px; display:grid; gap:30px; max-height:calc(100vh - 108px); overflow-y:auto; padding-right:12px; overscroll-behavior:contain; }
.side::-webkit-scrollbar { width:3px; }.side::-webkit-scrollbar-thumb { border-radius:999px; background:transparent; }.side:hover::-webkit-scrollbar-thumb { background:var(--i-color-border); }
.side__group { display:grid; gap:1px; }.side__group > p { margin:0 0 8px; padding:0 8px; color:var(--i-color-text-tertiary); font:600 9px/1 var(--i-font-family-mono); letter-spacing:.1em; text-transform:uppercase; }
.side a { display:flex; align-items:center; justify-content:space-between; min-height:31px; padding:5px 8px; color:var(--i-color-text-tertiary); font-size:11px; transition:color var(--i-motion-fast) var(--i-motion-easing); }.side a:hover { color:var(--i-color-text); }.side a i { width:4px; height:4px; border-radius:50%; background:transparent; }.side a.router-link-exact-active { color:var(--i-color-text); font-weight:600; }.side a.router-link-exact-active i { background:var(--i-color-brand); }
.content { min-width:0; width:100%; max-width:940px; padding-bottom:96px; }
@media (max-width:860px) { .doc-layout { grid-template-columns:1fr; padding-top:28px; }.side { display:none; }.content { max-width:none; padding-bottom:64px; } }
</style>
