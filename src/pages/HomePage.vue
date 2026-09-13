<script setup lang="ts">
import { computed, ref } from "vue";
import IIcon from "@/components/IIcon.vue";
import { heroIllustrations } from "@i-design/common";
import { useTheme } from "@/composables/useTheme";
import ShowcaseDesk from "@/site/ShowcaseDesk.vue";
const { theme } = useTheme();
const illustration = computed(() =>
  theme.value === "dark" ? heroIllustrations.dark : heroIllustrations.light
);
const command = "git clone https://github.com/ignorance-shiyao/i_design.git";
const copyStatus = ref("");
async function copyCommand() {
  try {
    await navigator.clipboard.writeText(command);
    copyStatus.value = "已复制，粘贴到终端开始使用";
  } catch {
    copyStatus.value = "复制未成功，请选中命令手动复制";
  }
}
const collections = [
  {
    no: "01",
    title: "界面的每一个细节",
    en: "COMPONENTS",
    desc: "从输入、导航到反馈，为日常操作建立清晰的秩序。",
    to: "/components",
    tags: ["Button", "Form", "Table"],
    kind: "controls",
  },
  {
    no: "02",
    title: "让数据清晰可见",
    en: "DATA & CHARTS",
    desc: "趋势、构成与关联，用恰当的图形回答业务问题。",
    to: "/components/chart",
    tags: ["Chart", "Sankey", "Gantt"],
    kind: "charts",
  },
  {
    no: "03",
    title: "把复杂流程展开",
    en: "FLOW & LOGIC",
    desc: "连接节点、查看状态，让业务过程有迹可循。",
    to: "/components/flow",
    tags: ["Canvas", "Minimap", "Snapshot"],
    kind: "flow",
  },
  {
    no: "04",
    title: "与智能协同工作",
    en: "AI INTERACTIONS",
    desc: "对话、工具调用与行动确认，让人始终掌握进程。",
    to: "/components/chat",
    tags: ["Chat", "Approval", "Agent"],
    kind: "ai",
  },
];
const platforms = [
  { name: "Vue 3", detail: "组合式开发" },
  { name: "React", detail: "声明式交互" },
  { name: "Vue 2", detail: "存量系统接入" },
  { name: "Mobile", detail: "触摸优先体验" },
  { name: "小程序", detail: "轻量业务入口" },
  { name: "Flutter", detail: "原生应用体验" },
];
</script>
<template>
  <main class="design-home">
    <section class="i-container design-hero" aria-labelledby="home-title">
      <div class="hero-heading">
        <div>
          <span class="eyebrow"
            ><IIcon name="sparkle" :size="14" /> 为想法，赋予界面</span
          >
          <h1 id="home-title">让复杂，<br /><span>成为简洁。</span></h1>
        </div>
        <div class="hero-intro">
          <p>
            从一个组件，到一整个产品。<br />i-design
            让设计语言与业务体验自然相连。
          </p>
          <div class="hero-actions">
            <RouterLink class="primary-link" to="/components"
              >探索组件 <IIcon name="arrow-right" :size="18" /></RouterLink
            ><RouterLink class="text-link" to="/design/values"
              >了解设计体系 <IIcon name="chevron-right" :size="16"
            /></RouterLink>
          </div>
          <span class="hero-note">开源设计体系 · 多端实现 · 自由定制</span>
        </div>
      </div>
      <ShowcaseDesk />
      <div class="platform-strip">
        <span>同一种设计语言<br /><strong>在你熟悉的平台</strong></span
        ><RouterLink
          v-for="platform in platforms"
          :key="platform.name"
          :to="
            platform.name === 'Mobile'
              ? '/components/mobile'
              : '/design/cross-platform'
          "
          ><strong>{{ platform.name }}</strong
          ><span>{{ platform.detail }}</span></RouterLink
        >
      </div>
    </section>
    <section
      class="i-container home-section"
      aria-labelledby="collections-title"
    >
      <div class="section-heading">
        <div>
          <span class="eyebrow">THE COLLECTION</span>
          <h2 id="collections-title">好的界面，从这里生长。</h2>
        </div>
        <RouterLink class="text-link" to="/components"
          >浏览全部组件 <IIcon name="arrow-right" :size="16"
        /></RouterLink>
      </div>
      <div class="collections">
        <RouterLink
          v-for="item in collections"
          :key="item.no"
          :to="item.to"
          class="collection"
        >
          <div
            class="collection__art"
            :class="`collection__art--${item.kind}`"
            aria-hidden="true"
          >
            <template v-if="item.kind === 'controls'"
              ><div class="art-button">
                Create something <IIcon name="plus" :size="16" />
              </div>
              <div class="art-field">
                <IIcon name="search" :size="16" /> 一个好想法… <span>⌘ K</span>
              </div>
              <div class="art-chips">
                <span><IIcon name="check" :size="12" /> 已完成</span
                ><span>设计系统</span><i /></div
            ></template>
            <template v-else-if="item.kind === 'charts'"
              ><div class="art-chart">
                <i
                  v-for="(height, index) in [36, 56, 44, 76, 60, 88, 72, 100]"
                  :key="index"
                  :style="{ height: `${height}%` }"
                />
              </div>
              <span class="art-caption"
                >让每一个变化，都有依据。</span
              ></template
            >
            <template v-else-if="item.kind === 'flow'"
              ><div class="art-node">
                <IIcon name="file" :size="16" /> 提交申请
                <IIcon name="check-circle" :size="14" />
              </div>
              <div class="art-connector" />
              <div class="art-node art-node--active">
                <IIcon name="user" :size="16" /> 审批节点 <span>处理中</span>
              </div></template
            >
            <template v-else
              ><div class="art-ai">
                <IIcon name="sparkle" :size="24" /><span
                  >每一个想法，都值得回应。</span
                >
              </div>
              <div class="art-tool">
                <IIcon name="check-circle" :size="14" /> 已检索相关资料
                <span>查看来源</span>
              </div>
              <div class="art-field">
                接下来，一起做些什么？<IIcon
                  name="arrow-right"
                  :size="16"
                /></div
            ></template>
          </div>
          <div class="collection__meta">
            <span>{{ item.no }} / {{ item.en }}</span
            ><IIcon name="arrow-right" :size="18" />
          </div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
          <div class="collection__tags">
            <span v-for="tag in item.tags" :key="tag">{{ tag }}</span>
          </div>
        </RouterLink>
      </div>
    </section>
    <section class="system-section">
      <div class="i-container system-grid">
        <div class="system-copy">
          <span class="eyebrow">A SYSTEM THAT FEELS LIKE YOU</span>
          <h2>有自己的风格，<br />也有共同的秩序。</h2>
          <p>
            色彩、密度、圆角与动效彼此呼应。切换明暗，调整主题，让整套界面保持一致。
          </p>
          <RouterLink class="text-link" to="/design/tokens"
            >探索设计令牌 <IIcon name="arrow-right" :size="16"
          /></RouterLink>
        </div>
        <div class="system-specimen">
          <div class="specimen-type">
            <span>TYPE / 01</span><strong>Aa<span>字</span></strong>
            <p>清晰，始于可读。</p>
          </div>
          <div class="specimen-palette">
            <span>COLOR / 02</span>
            <div><i /><i /><i /><i /><i /></div>
            <p>不同语义，同样鲜明。</p>
          </div>
          <RouterLink class="specimen-mascot" to="/resources"
            ><img
              :src="illustration.src"
              :srcset="illustration.srcset"
              alt="小白与十五的设计世界"
              width="360"
              height="240"
              loading="lazy" /><span
              >给严谨的界面，一点温度。<IIcon
                name="arrow-right"
                :size="16" /></span
          ></RouterLink>
        </div>
      </div>
    </section>
    <section class="i-container start-section">
      <span class="eyebrow">MAKE IT YOURS</span>
      <h2>下一个好产品，<br />从你的想法开始。</h2>
      <div class="start-actions">
        <RouterLink class="primary-link" to="/design/cross-platform"
          >开始构建 <IIcon name="arrow-right" :size="18" /></RouterLink
        ><a
          class="text-link"
          href="https://github.com/ignorance-shiyao/i_design"
          target="_blank"
          rel="noreferrer"
          >GitHub <IIcon name="external-link" :size="16"
        /></a>
      </div>
      <div class="start-command">
        <code>{{ command }}</code
        ><button type="button" aria-label="复制克隆命令" @click="copyCommand">
          <IIcon name="copy" :size="16" />
        </button>
      </div>
      <p role="status" class="copy-status">{{ copyStatus }}</p>
    </section>
  </main>
</template>
<style scoped>
.design-home {
  --home-radius: var(--i-radius-xl);
}
.design-hero {
  padding-top: var(--i-spacing-20);
}
.hero-heading {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  align-items: end;
  gap: var(--i-spacing-12);
  margin-bottom: var(--i-spacing-12);
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: var(--i-spacing-2);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-xs);
  letter-spacing: 0.12em;
  font-family: var(--i-font-family-mono);
}
h1 {
  font-size: clamp(
    var(--i-font-size-4xl),
    5.9vw,
    calc(var(--i-font-size-5xl) * 1.4)
  );
  line-height: 1.14;
  letter-spacing: -0.065em;
  font-weight: var(--i-font-weight-medium);
  margin-top: var(--i-spacing-5);
}
h1 span {
  color: var(--i-color-brand-text);
}
.hero-intro {
  padding-bottom: var(--i-spacing-2);
}
.hero-intro p {
  font-size: var(--i-font-size-lg);
  line-height: var(--i-line-height-loose);
  color: var(--i-color-text-secondary);
}
.hero-actions,
.start-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--i-spacing-6);
  margin-top: var(--i-spacing-6);
}
.primary-link {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: var(--i-spacing-5);
  padding: var(--i-spacing-3) var(--i-spacing-5);
  border-radius: var(--i-radius-full);
  background: var(--i-color-brand-solid);
  color: var(--i-color-on-brand);
  font-size: var(--i-font-size-md);
}
.primary-link:hover {
  box-shadow: 0 0 0 var(--i-spacing-1) var(--i-color-ring);
}
.text-link {
  display: inline-flex;
  align-items: center;
  gap: var(--i-spacing-2);
  font-size: var(--i-font-size-md);
  color: var(--i-color-text);
}
.text-link:hover {
  color: var(--i-color-brand-text);
}
.hero-note {
  display: block;
  margin-top: var(--i-spacing-5);
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-secondary);
}
.platform-strip {
  display: grid;
  grid-template-columns: 1.5fr repeat(6, 1fr);
  gap: var(--i-spacing-4);
  padding: var(--i-spacing-8) 0;
  border-bottom: 1px solid var(--i-color-hairline);
}
.platform-strip > span {
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-secondary);
  line-height: var(--i-line-height-loose);
}
.platform-strip > span strong {
  font-weight: var(--i-font-weight-medium);
  color: var(--i-color-text);
}
.platform-strip a {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--i-spacing-1);
  color: var(--i-color-text);
}
.platform-strip a strong {
  font-weight: var(--i-font-weight-medium);
  font-size: var(--i-font-size-lg);
}
.platform-strip a span {
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-secondary);
}
.platform-strip a:hover strong {
  color: var(--i-color-brand-text);
}
.home-section {
  padding-top: var(--i-spacing-24);
  padding-bottom: var(--i-spacing-24);
}
.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: var(--i-spacing-6);
  margin-bottom: var(--i-spacing-10);
}
h2 {
  font-size: clamp(var(--i-font-size-2xl), 3vw, var(--i-font-size-4xl));
  font-weight: var(--i-font-weight-medium);
  letter-spacing: -0.045em;
  line-height: 1.4;
  margin-top: var(--i-spacing-4);
}
.collections {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--i-spacing-12) var(--i-spacing-8);
}
.collection {
  display: block;
  min-width: 0;
  color: var(--i-color-text);
}
.collection__art {
  min-height: calc(var(--i-spacing-24) * 2.6);
  padding: var(--i-spacing-10);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--home-radius);
  background: var(--i-color-bg-subtle);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.collection:hover .collection__art {
  border-color: var(--i-color-border-strong);
  box-shadow: var(--i-shadow-sm);
}
.collection__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--i-spacing-5);
  color: var(--i-color-text-secondary);
  font: var(--i-font-size-xs) var(--i-font-family-mono);
  letter-spacing: 0.08em;
}
.collection h3 {
  font-size: var(--i-font-size-2xl);
  font-weight: var(--i-font-weight-medium);
  margin: var(--i-spacing-2) 0;
  letter-spacing: -0.03em;
}
.collection p {
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-md);
  line-height: var(--i-line-height-loose);
}
.collection__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--i-spacing-2);
  margin-top: var(--i-spacing-4);
}
.collection__tags span {
  padding: var(--i-spacing-1) var(--i-spacing-2);
  background: var(--i-color-bg-subtle);
  border-radius: var(--i-radius-sm);
  font: var(--i-font-size-xs) var(--i-font-family-mono);
  color: var(--i-color-text-secondary);
}
.art-button,
.art-field,
.art-node,
.art-tool {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-3);
  border-radius: var(--i-radius-lg);
  font-size: var(--i-font-size-sm);
}
.art-button {
  background: var(--i-color-brand-solid);
  color: var(--i-color-on-brand);
  padding: var(--i-spacing-3) var(--i-spacing-5);
  align-self: flex-start;
  margin-left: 12%;
}
.art-field {
  background: var(--i-color-bg-elevated);
  color: var(--i-color-text-secondary);
  padding: var(--i-spacing-3) var(--i-spacing-4);
  border: 1px solid var(--i-color-border);
  width: 88%;
  margin-top: var(--i-spacing-4);
}
.art-field span,
.art-field > svg:last-child {
  margin-left: auto;
}
.art-chips {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-3);
  margin-top: var(--i-spacing-4);
  font-size: var(--i-font-size-xs);
}
.art-chips span {
  display: inline-flex;
  align-items: center;
  gap: var(--i-spacing-1);
  padding: var(--i-spacing-1) var(--i-spacing-2);
  border-radius: var(--i-radius-full);
  background: var(--i-color-bg-elevated);
}
.art-chips span:first-child {
  background: var(--i-color-success-subtle);
  color: var(--i-color-success-text);
}
.art-chips i {
  width: var(--i-spacing-8);
  height: var(--i-spacing-5);
  background: var(--i-color-brand-solid);
  border-radius: var(--i-radius-full);
  position: relative;
}
.art-chips i::after {
  content: "";
  position: absolute;
  right: var(--i-spacing-1);
  top: var(--i-spacing-1);
  width: var(--i-spacing-3);
  height: var(--i-spacing-3);
  border-radius: var(--i-radius-full);
  background: var(--i-color-on-brand);
}
.collection__art--charts {
  background: var(--i-color-brand-subtle);
}
.art-chart {
  display: flex;
  align-items: end;
  gap: var(--i-spacing-3);
  height: calc(var(--i-spacing-24) * 1.4);
  width: 85%;
  border-bottom: 1px solid var(--i-color-border-strong);
}
.art-chart i {
  flex: 1;
  background: var(--i-color-brand);
  border-radius: var(--i-radius-sm) var(--i-radius-sm) 0 0;
}
.art-chart i:nth-child(2n) {
  background: var(--i-color-brand-solid);
}
.art-caption {
  margin-top: var(--i-spacing-4);
  color: var(--i-color-brand-text);
  font-size: var(--i-font-size-xs);
}
.art-node {
  width: 80%;
  padding: var(--i-spacing-4);
  border: 1px solid var(--i-color-border);
  background: var(--i-color-bg-elevated);
}
.art-node > :last-child {
  margin-left: auto;
}
.art-node > svg:last-child {
  color: var(--i-color-success-text);
}
.art-node--active {
  background: var(--i-color-brand-subtle);
  color: var(--i-color-brand-text);
}
.art-node span {
  font-size: var(--i-font-size-xs);
}
.art-connector {
  width: 1px;
  height: var(--i-spacing-8);
  background: var(--i-color-border-strong);
}
.art-ai {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-3);
  color: var(--i-color-text);
  font-size: var(--i-font-size-md);
}
.art-ai > svg {
  color: var(--i-color-brand-text);
}
.art-tool {
  padding: var(--i-spacing-3);
  background: var(--i-color-success-subtle);
  color: var(--i-color-success-text);
  margin-top: var(--i-spacing-4);
  font-size: var(--i-font-size-xs);
}
.art-tool span {
  margin-left: var(--i-spacing-6);
}
.system-section {
  background: var(--i-color-bg-subtle);
  padding: var(--i-spacing-20) 0;
}
.system-grid {
  display: grid;
  grid-template-columns: 0.85fr 1fr;
  align-items: center;
  gap: var(--i-spacing-20);
}
.system-copy p {
  max-width: 32ch;
  margin: var(--i-spacing-6) 0;
  line-height: var(--i-line-height-loose);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-lg);
}
.system-specimen {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--i-spacing-4);
}
.specimen-type,
.specimen-palette {
  padding: var(--i-spacing-5);
  background: var(--i-color-bg-elevated);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--home-radius);
}
.specimen-type > span,
.specimen-palette > span {
  color: var(--i-color-text-secondary);
  font: var(--i-font-size-xs) var(--i-font-family-mono);
}
.specimen-type strong {
  display: block;
  font-size: var(--i-font-size-5xl);
  font-weight: var(--i-font-weight-medium);
  letter-spacing: -0.06em;
  margin: var(--i-spacing-4) 0;
}
.specimen-type strong span {
  font-size: var(--i-font-size-3xl);
  margin-left: var(--i-spacing-2);
  color: var(--i-color-brand-text);
}
.specimen-type p,
.specimen-palette p {
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-secondary);
}
.specimen-palette > div {
  display: flex;
  height: var(--i-spacing-16);
  gap: var(--i-spacing-1);
  margin: var(--i-spacing-5) 0;
}
.specimen-palette i {
  flex: 1;
  border-radius: var(--i-radius-full);
  background: var(--i-color-brand);
}
.specimen-palette i:nth-child(2) {
  background: var(--i-color-brand-active);
}
.specimen-palette i:nth-child(3) {
  background: var(--i-color-success);
}
.specimen-palette i:nth-child(4) {
  background: var(--i-color-warning);
}
.specimen-palette i:nth-child(5) {
  background: var(--i-color-danger);
}
.specimen-mascot {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--home-radius);
  background: var(--i-color-bg-elevated);
  overflow: hidden;
  padding: var(--i-spacing-3);
}
.specimen-mascot img {
  width: 48%;
  height: auto;
}
.specimen-mascot > span {
  display: flex;
  flex-direction: column;
  gap: var(--i-spacing-4);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
}
.start-section {
  text-align: center;
  padding-top: var(--i-spacing-24);
  padding-bottom: var(--i-spacing-16);
}
.start-section h2 {
  font-size: clamp(var(--i-font-size-3xl), 4vw, var(--i-font-size-5xl));
}
.start-actions {
  justify-content: center;
}
.start-command {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-3);
  width: fit-content;
  max-width: 100%;
  margin: var(--i-spacing-8) auto 0;
  background: var(--i-color-bg-subtle);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-lg);
  padding: var(--i-spacing-3) var(--i-spacing-4);
}
.start-command code {
  min-width: 0;
  overflow-wrap: anywhere;
  text-align: left;
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-secondary);
}
.start-command button {
  flex: none;
  padding: var(--i-spacing-2);
  background: none;
  border: 0;
  color: var(--i-color-text-secondary);
  cursor: pointer;
}
.copy-status {
  min-height: var(--i-spacing-6);
  margin-top: var(--i-spacing-2);
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-secondary);
}
@media (max-width: 900px) {
  .design-hero {
    padding-top: var(--i-spacing-12);
  }
  .hero-heading {
    gap: var(--i-spacing-6);
  }
  .hero-actions {
    gap: var(--i-spacing-4);
  }
  .platform-strip {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--i-spacing-5);
  }
  .platform-strip > span {
    grid-column: 1 / -1;
  }
  .system-grid {
    gap: var(--i-spacing-8);
  }
  .collection__art {
    padding: var(--i-spacing-5);
  }
}
@media (max-width: 640px) {
  .hero-heading,
  .system-grid {
    grid-template-columns: 1fr;
  }
  h1 {
    font-size: clamp(var(--i-font-size-4xl), 12vw, var(--i-font-size-5xl));
  }
  .collections {
    grid-template-columns: 1fr;
    gap: var(--i-spacing-10);
  }
  .section-heading {
    align-items: start;
    flex-direction: column;
  }
  .home-section {
    padding-top: var(--i-spacing-16);
    padding-bottom: var(--i-spacing-16);
  }
  .system-section {
    padding: var(--i-spacing-12) 0;
  }
  .system-copy p {
    max-width: none;
  }
  .specimen-type,
  .specimen-palette {
    padding: var(--i-spacing-3);
  }
  .start-section {
    padding-top: var(--i-spacing-16);
  }
}
</style>
