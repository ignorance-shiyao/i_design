<script setup lang="ts">
import SiteHeader from '@/site/SiteHeader.vue'
import SiteFooter from '@/site/SiteFooter.vue'
</script>

<template>
  <SiteHeader />
  <RouterView v-slot="{ Component, route }">
    <!-- 页面切换给一次短促的上浮，让用户知道内容换了而不是页面卡住 -->
    <Transition name="i-page" mode="out-in">
      <component :is="Component" :key="route.path" />
    </Transition>
  </RouterView>
  <SiteFooter />
</template>
