<script setup lang="ts">
import IButton from '@/components/IButton.vue'
import IIcon from '@/components/IIcon.vue'
import { errorIllustrations } from '@i-design/common'

const art = errorIllustrations['404']
</script>

<template>
  <section class="nf i-container">
    <img class="nf__art" :src="art.src" :srcset="art.srcset" width="360" alt="" />
    <h1 class="nf__title">页面走丢了</h1>
    <p class="nf__desc">
      地址可能已经变更或删除。你可以回到首页，或直接去组件总览找想看的内容。
    </p>
    <div class="nf__actions">
      <RouterLink to="/"><IButton variant="primary">回到首页</IButton></RouterLink>
      <RouterLink to="/components">
        <IButton>浏览组件<IIcon name="arrow-right" :size="15" /></IButton>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.nf {
  display: grid;
  justify-items: center;
  gap: var(--i-spacing-3);
  padding: var(--i-spacing-20) var(--i-spacing-6);
  text-align: center;
}
.nf__art { width: 360px; max-width: 100%; height: auto; }
.nf__title { font-size: var(--i-font-size-2xl); margin-top: var(--i-spacing-4); }
.nf__desc { color: var(--i-color-text-secondary); max-width: 44ch; }
.nf__actions { display: flex; gap: var(--i-spacing-3); margin-top: var(--i-spacing-5); }
</style>
