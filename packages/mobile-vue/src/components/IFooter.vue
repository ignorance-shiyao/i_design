<script setup lang="ts">
export interface FooterLink {
  label: string
  href?: string
}

/**
 * 页脚：版权、备案、几个次要链接。
 * 字号与颜色都压到最低一档——它存在的意义是「需要时找得到」，不是被看见。
 */
withDefaults(defineProps<{ text?: string; links?: FooterLink[] }>(), {
  text: '',
  links: () => []
})

const emit = defineEmits<{ select: [FooterLink] }>()
</script>

<template>
  <footer class="i-footer">
    <div v-if="links.length" class="i-footer__links">
      <template v-for="(link, index) in links" :key="link.label">
        <span v-if="index > 0" class="i-footer__sep" aria-hidden="true">·</span>
        <a
          class="i-footer__link"
          :href="link.href"
          @click="!link.href && emit('select', link)"
          >{{ link.label }}</a
        >
      </template>
    </div>

    <p v-if="text" class="i-footer__text">{{ text }}</p>
    <slot />
  </footer>
</template>
