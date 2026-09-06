<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ title?: string; description?: string; code?: string }>()
const showCode = ref(false)
</script>

<template>
  <section class="demo">
    <header v-if="title" class="demo__head">
      <h3 class="demo__title">{{ title }}</h3>
      <p v-if="description" class="demo__desc">{{ description }}</p>
    </header>
    <div class="demo__stage"><slot /></div>
    <footer v-if="code" class="demo__foot">
      <button class="demo__toggle" @click="showCode = !showCode">
        {{ showCode ? '隐藏代码' : '显示代码' }}
      </button>
    </footer>
    <pre v-if="code && showCode" class="demo__code"><code>{{ code.trim() }}</code></pre>
  </section>
</template>

<style scoped>
.demo {
  border: 1px solid var(--i-color-border);
  border-radius: var(--i-radius-lg);
  overflow: hidden;
  margin-bottom: var(--i-spacing-6);
  background: var(--i-color-bg);
}
.demo__head { padding: var(--i-spacing-4) var(--i-spacing-5) 0; }
.demo__title { font-size: var(--i-font-size-md); }
.demo__desc {
  margin-top: var(--i-spacing-1);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-tertiary);
}
.demo__stage {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--i-spacing-3);
  padding: var(--i-spacing-6) var(--i-spacing-5);
}
.demo__foot {
  border-top: 1px dashed var(--i-color-border);
  padding: var(--i-spacing-2) var(--i-spacing-5);
  text-align: right;
}
.demo__toggle {
  border: none;
  background: none;
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-sm);
  cursor: pointer;
}
.demo__toggle:hover { color: var(--i-color-brand); }
.demo__code {
  margin: 0;
  padding: var(--i-spacing-4) var(--i-spacing-5);
  background: var(--i-color-bg-subtle);
  border-top: 1px solid var(--i-color-border);
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-secondary);
  overflow-x: auto;
}
.demo__code code { background: none; padding: 0; }
</style>
