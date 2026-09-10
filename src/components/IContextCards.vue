<script setup lang="ts">
import { ref } from 'vue'
import { chunkLength, chunkPreview, fileTypeOf, type ContextChunk } from '@i-design/common'
import IIcon from './IIcon.vue'

const props = withDefaults(
  defineProps<{
    chunks: ContextChunk[]
    title?: string
    /** 超过这个字符数就折叠，点「展开」看全文 */
    previewLimit?: number
  }>(),
  { title: '引用片段', previewLimit: 140 }
)

const expanded = ref<Set<string>>(new Set())

function toggle(id: string) {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expanded.value = next
}
</script>

<template>
  <section class="i-context">
    <header class="i-context__head">
      {{ title }}
      <span class="i-context__count">{{ chunks.length }}</span>
    </header>

    <article v-for="chunk in chunks" :key="chunk.id" class="i-chunk">
      <div class="i-chunk__head">
        <IIcon name="layers" :size="14" />
        <span class="i-chunk__title">{{ chunk.title }}</span>
        <!-- 字符数而不是 token 数：token 是模型的内部单位，用户无从判断它的含义 -->
        <span class="i-chunk__length">{{ chunkLength(chunk.content) }} 字</span>
      </div>

      <p class="i-chunk__body">
        {{ expanded.has(chunk.id) ? chunk.content : chunkPreview(chunk.content, previewLimit) }}
      </p>
      <button
        v-if="chunkLength(chunk.content) > previewLimit"
        class="i-chunk__more"
        @click="toggle(chunk.id)"
      >
        {{ expanded.has(chunk.id) ? '收起' : '展开全文' }}
      </button>

      <!-- 出处：读者看完片段最常问的下一个问题就是「这句话哪儿来的」 -->
      <a
        v-if="chunk.source"
        class="i-chunk__source"
        :href="chunk.href || undefined"
        :target="chunk.href ? '_blank' : undefined"
        rel="noreferrer"
        :style="{ '--i-file-color': `var(--i-chart-${fileTypeOf(chunk.source).slot || 1})` }"
      >
        <IIcon class="i-chunk__source-icon" :name="fileTypeOf(chunk.source).icon" :size="13" />
        {{ chunk.source }}
        <IIcon v-if="chunk.href" name="external-link" :size="11" />
      </a>
    </article>
  </section>
</template>
