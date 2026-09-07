<script setup lang="ts">
import { computed, ref } from 'vue'
import { detectLang, highlight, normalizeLang, type Lang } from './highlight'

const props = withDefaults(
  defineProps<{ code: string; lang?: string; filename?: string; copyable?: boolean }>(),
  { lang: '', filename: '', copyable: true }
)

const source = computed(() => props.code.replace(/^\n+|\s+$/g, ''))
const resolved = computed<Lang>(() =>
  props.lang ? normalizeLang(props.lang) : detectLang(source.value)
)
const rendered = computed(() => highlight(source.value, resolved.value))

const labels: Record<Lang, string> = {
  vue: 'vue',
  html: 'html',
  ts: 'ts',
  js: 'js',
  css: 'css',
  json: 'json',
  bash: 'shell',
  text: 'text'
}

const copied = ref(false)
async function copy() {
  try {
    await navigator.clipboard.writeText(source.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  } catch {
    // 剪贴板不可用（无 HTTPS 或未授权）时静默失败，代码本身仍可手动选中复制
  }
}
</script>

<template>
  <div class="code">
    <div class="code__bar">
      <span class="code__lang">{{ filename || labels[resolved] }}</span>
      <button v-if="copyable" class="code__copy" type="button" @click="copy">
        {{ copied ? '已复制' : '复制' }}
      </button>
    </div>
    <pre class="code__body"><code v-html="rendered" /></pre>
  </div>
</template>

<style scoped>
.code {
  border: 1px solid var(--i-color-code-border);
  border-radius: var(--i-radius-lg);
  background: var(--i-color-code-bg);
  overflow: hidden;
}
.code__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--i-spacing-2) var(--i-spacing-3) var(--i-spacing-2) var(--i-spacing-4);
  border-bottom: 1px solid var(--i-color-code-border);
  background: var(--i-color-code-bar);
}
.code__lang {
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--i-color-code-muted);
}
.code__copy {
  padding: 2px var(--i-spacing-2);
  font-family: inherit;
  font-size: var(--i-font-size-xs);
  color: var(--i-color-code-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--i-radius-sm);
  cursor: pointer;
  transition: color var(--i-motion-fast) var(--i-motion-easing),
    border-color var(--i-motion-fast) var(--i-motion-easing);
}
.code__copy:hover { color: var(--i-color-code-text); border-color: var(--i-color-code-border); }

.code__body {
  margin: 0;
  padding: var(--i-spacing-4);
  overflow-x: auto;
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-sm);
  line-height: 1.7;
  color: var(--i-color-code-text);
  tab-size: 2;
}
.code__body code { background: none; padding: 0; font-size: inherit; }
</style>
