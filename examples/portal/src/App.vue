<script setup lang="ts">
/**
 * 示例门户（astra.md 的 G02）。
 *
 * 门户只做三件事：说清每个示例演的是哪条业务闭环、给出入口、指到源码。
 * 规划中的应用显示为「规划中」且不给链接——点进去是空白页比没有入口更糟。
 */
import { computed } from 'vue'
import { exampleApps, readyApps } from '@i-design/examples-shell/apps'

const ready = computed(() => readyApps())
const planned = computed(() => exampleApps.filter((a) => a.status === 'planned'))

/** 文档站的地址由构建注入；没注入时指仓库内相对路径，而不是猜一个域名 */
const docsHref = import.meta.env.VITE_DOCS_BASE || '../../'
</script>

<template>
  <main class="portal">
    <header class="portal__head">
      <h1>i-design 示例应用</h1>
      <p>
        每个示例是一条完整的业务闭环，不是组件的堆叠——成功、校验失败、没权限、
        版本冲突、重复提交这些分支都在里面，因为它们才是真实业务里最花时间的部分。
      </p>
      <p class="portal__links">
        <a :href="docsHref">← 回到组件文档</a>
      </p>
    </header>

    <section>
      <h2>可以打开的</h2>
      <ul class="portal__grid">
        <li v-for="app in ready" :key="app.id" class="portal__card">
          <h3><a :href="app.path">{{ app.name }}</a></h3>
          <p>{{ app.summary }}</p>
          <p class="portal__topics">
            <span v-for="topic in app.topics" :key="topic">{{ topic }}</span>
          </p>
          <p class="portal__source">源码：<code>{{ app.source }}</code></p>
        </li>
      </ul>
    </section>

    <section>
      <h2>规划中的</h2>
      <ul class="portal__grid">
        <li v-for="app in planned" :key="app.id" class="portal__card is-planned">
          <h3>{{ app.name }}</h3>
          <p>{{ app.summary }}</p>
          <p class="portal__source">还没有可运行的版本，所以这里没有链接。</p>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.portal {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--i-spacing-6) var(--i-spacing-4);
  display: grid;
  gap: var(--i-spacing-6);
}

.portal__head h1 {
  margin: 0 0 var(--i-spacing-3);
}

.portal__head p {
  margin: 0 0 var(--i-spacing-2);
  color: var(--i-color-text-secondary);
}

.portal__links a {
  color: var(--i-color-brand-text);
}

.portal__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: var(--i-spacing-4);
  margin: var(--i-spacing-4) 0 0;
  padding: 0;
  list-style: none;
}

.portal__card {
  display: grid;
  gap: var(--i-spacing-2);
  padding: var(--i-spacing-4);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-lg);
  background: var(--i-color-bg-elevated);
}

.portal__card h3 {
  margin: 0;
  font-size: var(--i-font-size-md);
}

.portal__card h3 a {
  color: var(--i-color-brand-text);
  text-decoration: none;
}

.portal__card p {
  margin: 0;
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
}

.portal__card.is-planned {
  background: var(--i-color-bg-subtle);
}

.portal__topics {
  display: flex;
  flex-wrap: wrap;
  gap: var(--i-spacing-2);
}

.portal__topics span {
  padding: 1px var(--i-spacing-2);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-full);
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-tertiary);
}

.portal__source {
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-xs);
}
</style>
