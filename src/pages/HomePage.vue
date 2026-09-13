<script setup lang="ts">
import { computed, ref } from "vue";
import IIcon from "@/components/IIcon.vue";
import IButton from "@/components/IButton.vue";
import IInput from "@/components/IInput.vue";
import ISwitch from "@/components/ISwitch.vue";
import ITag from "@/components/ITag.vue";
import CodeBlock from "@/site/CodeBlock.vue";
import { heroIllustrations } from "@i-design/common";
import { useTheme } from "@/composables/useTheme";

const { theme } = useTheme();
const illustration = computed(() =>
  theme.value === "dark" ? heroIllustrations.dark : heroIllustrations.light
);
const baseUrl = import.meta.env.BASE_URL;
const name = ref("Design something good");
const notifications = ref(true);
const copied = ref(false);
const command = "git clone https://github.com/ignorance-shiyao/i_design.git";
async function copyCommand() {
  try {
    await navigator.clipboard.writeText(command);
    copied.value = true;
  } catch {
    copied.value = false;
  }
}
const platforms = [
  {
    title: "桌面端",
    en: "DESKTOP",
    icon: "layout",
    description: "为复杂业务提供清晰、稳定的操作体验。",
    tags: ["Vue 3", "Vue 2", "React"],
    to: "/components",
    kind: "desktop",
  },
  {
    title: "移动端",
    en: "MOBILE",
    icon: "layers",
    description: "统一视觉语言，适配移动设备的交互节奏。",
    tags: ["Mobile Vue", "Mobile React", "Flutter"],
    to: "/components/mobile",
    kind: "mobile",
  },
  {
    title: "小程序",
    en: "MINI PROGRAM",
    icon: "grid",
    description: "让轻量业务也拥有完整、一致的产品体验。",
    tags: ["微信小程序", "共享令牌"],
    to: "/design/cross-platform",
    kind: "mini",
  },
];
const resources = [
  {
    icon: "palette",
    title: "设计令牌",
    desc: "色彩、字体、间距与动效，从同一套规范出发。",
    to: "/design/tokens",
  },
  {
    icon: "code",
    title: "跨端实现",
    desc: "查看不同技术栈的组件实现与使用方式。",
    to: "/design/cross-platform",
  },
  {
    icon: "layers",
    title: "设计资源",
    desc: "把图标与插画带进你的下一件作品。",
    to: "/resources",
  },
] as const;
</script>

<template>
  <main class="design-home">
    <section class="design-hero">
      <div class="hero-art" aria-hidden="true">
        <img
          :src="`${baseUrl}images/component-sculpture.png`"
          alt=""
          width="1672"
          height="941"
          fetchpriority="high"
        />
      </div>
      <div class="i-container hero-content">
        <span class="hero-kicker">开源 · 多端 · 企业级设计体系</span>
        <h1>i-design<span>让设计与实现，自然一致。</span></h1>
        <p>从设计语言到业务界面，为设计师与开发者提供共同的起点。</p>
        <div class="hero-actions">
          <RouterLink class="primary-link" to="/components"
            >开始使用 <IIcon name="arrow-right" :size="18"
          /></RouterLink>
          <RouterLink class="secondary-link" to="/design/values"
            >了解设计体系 <IIcon name="chevron-right" :size="18"
          /></RouterLink>
        </div>
      </div>
      <nav class="i-container hero-resources" aria-label="设计体系资源">
        <RouterLink
          v-for="item in resources"
          :key="item.to"
          :to="item.to"
          class="resource-link"
        >
          <IIcon :name="item.icon" :size="22" />
          <div>
            <h2>{{ item.title }}</h2>
            <p>{{ item.desc }}</p>
          </div>
          <IIcon name="arrow-right" :size="18" />
        </RouterLink>
      </nav>
    </section>

    <section class="i-container home-section">
      <div class="section-heading">
        <div>
          <span class="section-label">面向不同平台</span>
          <h2>熟悉的技术栈，一致的体验</h2>
        </div>
        <RouterLink to="/design/cross-platform"
          >查看跨端支持 <IIcon name="arrow-right" :size="16"
        /></RouterLink>
      </div>
      <div class="platforms">
        <article
          v-for="platform in platforms"
          :key="platform.kind"
          class="platform"
        >
          <div
            class="platform__visual"
            :class="platform.kind"
            aria-hidden="true"
          >
            <div v-if="platform.kind === 'desktop'" class="device-desktop">
              <div class="device-bar"><i /><i /><i /></div>
              <div class="device-body">
                <aside />
                <div><b /><span /><span /><span /></div>
              </div>
            </div>
            <div v-else-if="platform.kind === 'mobile'" class="device-mobile">
              <i /><b /><span /><span />
              <div />
              <span />
            </div>
            <div v-else class="device-mini">
              <div />
              <i /><b /><span />
            </div>
          </div>
          <div class="platform__body">
            <span class="section-label">{{ platform.en }}</span>
            <h3>{{ platform.title }}</h3>
            <p>{{ platform.description }}</p>
            <div class="platform__tags">
              <span v-for="tag in platform.tags" :key="tag">{{ tag }}</span>
            </div>
            <RouterLink :to="platform.to"
              >探索组件 <IIcon name="arrow-right" :size="16"
            /></RouterLink>
          </div>
        </article>
      </div>
    </section>

    <section class="showcase-section">
      <div class="i-container showcase">
        <div class="showcase-copy">
          <span class="section-label">从规范，到细节</span>
          <h2>好的体验，<br />藏在每一次交互里。</h2>
          <p>
            清晰的层级，恰当的反馈。用真实组件搭建界面，让设计意图直接成为可操作的体验。
          </p>
          <RouterLink to="/components/button"
            >浏览组件文档 <IIcon name="arrow-right" :size="18" /></RouterLink
          ><img
            :src="illustration.src"
            :srcset="illustration.srcset"
            width="240"
            height="160"
            alt="小白与十五的设计世界"
            loading="lazy"
          />
        </div>
        <div class="component-gallery">
          <div class="sample sample-controls">
            <span class="sample-label">交互 / INTERACTION</span>
            <div class="sample-buttons">
              <IButton variant="primary" @click="name = '从一个好想法开始'"
                >开始创作<IIcon name="arrow-right" :size="16" /></IButton
              ><RouterLink to="/components/button" class="sample-text-link"
                >更多按钮</RouterLink
              >
            </div>
            <label for="sample-name">作品名称</label
            ><IInput
              id="sample-name"
              v-model="name"
              placeholder="输入作品名称"
            />
            <div class="sample-switch">
              <span>接收更新通知</span
              ><ISwitch v-model="notifications" aria-label="接收更新通知" />
            </div>
          </div>
          <RouterLink class="sample sample-colors" to="/design/tokens"
            ><span class="sample-label">色彩 / COLOR</span>
            <div class="color-swatch"><i /><i /><i /><i /><i /></div>
            <strong>品牌，从一个颜色开始。</strong
            ><span class="sample-note"
              >探索语义令牌 <IIcon name="arrow-right" :size="14" /></span
          ></RouterLink>
          <div class="sample sample-type">
            <span class="sample-label">字体 / TYPOGRAPHY</span>
            <div class="type-display">Aa<span>字</span></div>
            <p>清晰可读，主次分明。</p>
          </div>
          <div class="sample sample-status">
            <span class="sample-label">反馈 / FEEDBACK</span>
            <div class="status-line">
              <span class="status-icon"
                ><IIcon name="check-circle" :size="22"
              /></span>
              <div>
                <strong>每一步，都有回应</strong>
                <p>用明确的状态传递进展</p>
              </div>
            </div>
            <div class="status-tags">
              <ITag type="brand">进行中</ITag><ITag type="success">已完成</ITag
              ><ITag type="warning">待确认</ITag>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="i-container home-section start-section">
      <div>
        <span class="section-label">一起构建</span>
        <h2>从这里，开始下一件作品。</h2>
        <p>
          克隆源码，运行文档站，探索适合你的组件。<br />当前通过仓库使用，暂未发布到
          npm。
        </p>
        <a
          class="secondary-link"
          href="https://github.com/ignorance-shiyao/i_design"
          target="_blank"
          rel="noreferrer"
          >访问 GitHub <IIcon name="arrow-right" :size="16"
        /></a>
      </div>
      <div class="start-code">
        <div class="start-code__bar">
          <span>Terminal</span
          ><button @click="copyCommand">
            {{ copied ? "已复制克隆命令" : "复制克隆命令"
            }}<IIcon name="copy" :size="14" />
          </button>
        </div>
        <CodeBlock
          :copyable="false"
          lang="bash"
          :code="`${command}\ncd i_design\nnpm install\nnpm run dev`"
        />
      </div>
    </section>
  </main>
</template>

<style scoped>
.design-home {
  --home-radius: var(--i-radius-lg);
}
.design-hero {
  position: relative;
  overflow: hidden;
  background: var(--i-color-bg-subtle);
}
.hero-content {
  position: relative;
  z-index: 1;
  padding-top: 132px;
  padding-bottom: 76px;
  pointer-events: none;
}
.hero-content a {
  pointer-events: auto;
}
.hero-kicker,
.section-label {
  font-size: var(--i-font-size-xs);
  letter-spacing: 0.08em;
  color: var(--i-color-text-secondary);
}
h1 {
  margin: 18px 0 20px;
  color: var(--i-color-brand-text);
  font-size: clamp(
    var(--i-font-size-5xl),
    7vw,
    calc(var(--i-font-size-5xl) * 1.8)
  );
  line-height: 1;
  letter-spacing: -0.055em;
  font-weight: 700;
}
h1 span {
  display: block;
  margin-top: 24px;
  color: var(--i-color-text);
  font-size: clamp(var(--i-font-size-2xl), 2.7vw, var(--i-font-size-3xl));
  line-height: 1.4;
  font-weight: 500;
  letter-spacing: -0.035em;
}
.hero-content > p {
  max-width: 420px;
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-lg);
  line-height: 1.9;
}
.hero-actions {
  display: flex;
  gap: 24px;
  margin-top: 32px;
  align-items: center;
}
.primary-link,
.secondary-link {
  display: inline-flex;
  gap: 16px;
  align-items: center;
  font-size: var(--i-font-size-md);
}
.primary-link {
  padding: 14px 24px;
  /* 底色与字色成对取：品牌色原值上的白字只有 3.86，这是首屏最主要的那个入口 */
  background: var(--i-color-brand-solid);
  color: var(--i-color-on-brand);
  border-radius: var(--i-radius-md);
}
.primary-link:hover {
  background: var(--i-color-brand-active);
}
.secondary-link {
  color: var(--i-color-text);
}
.hero-resources {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding-bottom: 40px;
}
.resource-link {
  padding: 26px 24px;
  display: flex;
  gap: 18px;
  align-items: center;
  background: var(--i-color-bg-elevated);
  border-radius: var(--home-radius);
  color: var(--i-color-text);
  border: 1px solid var(--i-color-hairline);
  transition: border-color 0.2s;
}
.resource-link:hover {
  border-color: var(--i-color-brand);
}
.resource-link > svg {
  color: var(--i-color-brand-text);
  flex: none;
}
.resource-link > svg:last-child {
  margin-left: auto;
  color: var(--i-color-text-secondary);
}
.resource-link h2 {
  font-size: var(--i-font-size-lg);
  font-weight: 500;
  margin-bottom: 8px;
}
.resource-link p {
  font-size: var(--i-font-size-xs);
  line-height: 1.7;
  color: var(--i-color-text-secondary);
}
.hero-art {
  position: absolute;
  inset: 0 0 90px;
  overflow: hidden;
}
.hero-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
.hero-art::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    var(--i-color-bg-subtle) 0%,
    transparent 56%
  );
}
/*
 * 暗色下压低这张图的亮度，免得它比正文还抢眼。
 *
 * 不能写成 :global([data-theme="dark"]) .hero-art——作用域编译会把后代部分
 * 整个丢掉，只留下 [data-theme=dark]{opacity:.16}，于是整个 <html> 在暗色下
 * 都变成 16% 不透明度：全站文字与卡片一起发灰，而且不会有任何报错。
 * 祖先选择器本来就不需要 :global，作用域只会把属性加在末尾的选择器上。
 */
[data-theme="dark"] .hero-art {
  opacity: 0.16;
}
[data-theme="dark"] .hero-art::after {
  background: linear-gradient(
    90deg,
    var(--i-color-bg-subtle) 42%,
    transparent 100%
  );
}
.home-section {
  padding-top: 80px;
  padding-bottom: 80px;
}
.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 24px;
  margin-bottom: 36px;
}
.section-heading h2,
.start-section h2 {
  font-size: var(--i-font-size-3xl);
  font-weight: 500;
  letter-spacing: -0.035em;
  margin-top: 12px;
}
.section-heading > a,
.platform__body > a,
.showcase-copy > a {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--i-color-brand-text);
  font-size: var(--i-font-size-md);
}
.platforms {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}
.platform {
  border: 1px solid var(--i-color-border);
  border-radius: var(--home-radius);
  overflow: hidden;
}
.platform__visual {
  height: 210px;
  background: var(--i-color-bg-subtle);
  display: grid;
  place-items: center;
  overflow: hidden;
}
.platform__body {
  padding: 28px;
}
.platform__body h3 {
  font-size: var(--i-font-size-2xl);
  margin: 10px 0;
  font-weight: 500;
}
.platform__body p {
  font-size: var(--i-font-size-md);
  color: var(--i-color-text-secondary);
  line-height: 1.8;
}
.platform__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 24px 0 28px;
}
.platform__tags span {
  font-size: var(--i-font-size-xs);
  background: var(--i-color-bg-subtle);
  padding: 4px 10px;
  border-radius: var(--i-radius-sm);
  color: var(--i-color-text-secondary);
}
.device-desktop {
  width: 218px;
  height: 142px;
  transform: perspective(650px) rotateY(-16deg) rotateX(12deg);
  background: var(--i-color-bg-elevated);
  border: 1px solid var(--i-color-border);
  border-radius: 8px;
  box-shadow: 10px 12px 0 var(--i-color-border),
    18px 20px 24px var(--i-color-hairline);
  padding: 12px;
}
.device-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}
.device-bar i {
  width: 4px;
  height: 4px;
  background: var(--i-color-border-strong);
  border-radius: 50%;
}
.device-body {
  display: flex;
  gap: 12px;
  height: 95px;
}
.device-body aside {
  width: 35px;
  background: var(--i-color-bg-muted);
  border-radius: 3px;
}
.device-body > div {
  flex: 1;
}
.device-body b {
  display: block;
  height: 34px;
  background: var(--i-color-brand);
  border-radius: 3px;
  margin-bottom: 10px;
}
.device-body span {
  display: block;
  height: 8px;
  margin-top: 6px;
  background: var(--i-color-brand-subtle);
}
.device-mobile {
  width: 90px;
  height: 170px;
  padding: 12px 9px;
  border: 3px solid var(--i-color-border);
  border-radius: 16px;
  background: var(--i-color-bg-elevated);
  transform: rotate(-14deg);
  box-shadow: 8px 10px 0 var(--i-color-bg-muted);
}
.device-mobile i {
  display: block;
  width: 24px;
  height: 4px;
  background: var(--i-color-border-strong);
  border-radius: 9px;
  margin: 0 auto 14px;
}
.device-mobile b {
  display: block;
  height: 44px;
  background: var(--i-color-brand);
  border-radius: 5px;
}
.device-mobile span {
  display: block;
  height: 7px;
  background: var(--i-color-bg-muted);
  margin: 8px 0;
}
.device-mobile > div {
  height: 25px;
  background: var(--i-color-brand-subtle);
  border-radius: 4px;
}
.device-mini {
  width: 144px;
  height: 144px;
  border: 1px solid var(--i-color-border);
  border-radius: 30px;
  background: var(--i-color-bg-elevated);
  transform: rotate(-12deg);
  box-shadow: 10px 12px 0 var(--i-color-bg-muted);
  padding: 27px;
  position: relative;
}
.device-mini > div {
  width: 54px;
  height: 54px;
  border: 14px solid var(--i-color-brand);
  border-radius: 18px;
}
.device-mini i {
  position: absolute;
  top: 36px;
  right: 24px;
  width: 14px;
  height: 14px;
  background: var(--i-color-brand-subtle);
  border-radius: 50%;
}
.device-mini b,
.device-mini span {
  display: block;
  height: 6px;
  width: 86px;
  margin-top: 12px;
  background: var(--i-color-bg-muted);
}
.device-mini span {
  width: 55px;
  margin-top: 6px;
}
.showcase-section {
  background: var(--i-color-bg-subtle);
  padding: 80px 0;
}
.showcase {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 80px;
  align-items: center;
}
.showcase-copy h2 {
  font-size: var(--i-font-size-3xl);
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: -0.035em;
  margin: 18px 0;
}
.showcase-copy p {
  color: var(--i-color-text-secondary);
  line-height: 1.9;
  font-size: var(--i-font-size-lg);
  max-width: 350px;
  margin-bottom: 26px;
}
.showcase-copy img {
  display: block;
  object-fit: contain;
  margin-top: 24px;
}
.component-gallery {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.sample {
  min-width: 0;
  padding: 24px;
  border: 1px solid var(--i-color-hairline);
  background: var(--i-color-bg-elevated);
  border-radius: var(--home-radius);
  color: var(--i-color-text);
}
.sample-label {
  display: block;
  font-size: var(--i-font-size-xs);
  letter-spacing: 0.08em;
  color: var(--i-color-text-secondary);
  margin-bottom: 24px;
}
.sample-controls {
  grid-row: span 2;
}
.sample-buttons {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 28px;
}
.sample-text-link {
  font-size: var(--i-font-size-xs);
  /* 小字用 brand-text：品牌色在白底上只有 3.86:1 */
  color: var(--i-color-brand-text);
}
.sample-controls label {
  display: block;
  margin-bottom: 8px;
  font-size: var(--i-font-size-sm);
}
.sample-switch {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  font-size: var(--i-font-size-xs);
  margin-top: 24px;
}
.color-swatch {
  display: flex;
  margin-bottom: 20px;
  height: 44px;
}
.color-swatch i {
  flex: 1;
  background: var(--i-color-brand);
}
.color-swatch i:nth-child(1) {
  background: var(--i-color-brand-subtle);
}
.color-swatch i:nth-child(2) {
  background: var(--i-color-ring);
}
.color-swatch i:nth-child(3) {
  background: var(--i-color-brand-hover);
}
.color-swatch i:nth-child(5) {
  background: var(--i-color-brand-active);
}
.sample-colors strong {
  font-size: var(--i-font-size-sm);
  font-weight: 500;
}
.sample-note {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-secondary);
}
.sample-type .sample-label {
  margin-bottom: 8px;
}
.type-display {
  font-size: var(--i-font-size-4xl);
  font-weight: 500;
  letter-spacing: -0.06em;
}
.type-display span {
  font-size: var(--i-font-size-3xl);
  margin-left: 20px;
  color: var(--i-color-brand-text);
}
.sample-type p {
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-secondary);
}
.sample-status {
  grid-column: 1 / -1;
}
.status-line {
  display: flex;
  align-items: center;
  gap: 16px;
}
.status-icon {
  color: var(--i-color-success-text);
}
.status-line strong {
  font-size: var(--i-font-size-md);
  font-weight: 500;
}
.status-line p {
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-secondary);
  margin-top: 4px;
}
.status-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
}
.start-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}
.start-section p {
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-md);
  line-height: 1.9;
  margin: 22px 0;
}
.start-code {
  min-width: 0;
  border: 1px solid var(--i-color-border);
  border-radius: var(--home-radius);
  overflow: hidden;
}
.start-code__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--i-color-bg-subtle);
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-secondary);
}
.start-code__bar button {
  display: flex;
  gap: 8px;
  align-items: center;
  background: none;
  border: 0;
  color: var(--i-color-text-secondary);
  cursor: pointer;
  font: inherit;
}
.start-code :deep(.code) {
  border: 0;
  margin: 0;
  box-shadow: none;
  border-radius: 0;
}

@media (max-width: 1100px) {
  .hero-art img {
    object-position: 60% center;
  }
  .hero-content {
    padding-top: 100px;
  }
  .resource-link {
    padding: 20px;
  }
  .resource-link > svg:first-child {
    display: none;
  }
  .showcase {
    gap: 36px;
  }
  .platform__body {
    padding: 22px;
  }
}
@media (max-width: 800px) {
  .hero-content {
    padding-top: 64px;
    padding-bottom: 52px;
  }
  .hero-art {
    opacity: 0.32;
    bottom: 200px;
  }
  .hero-art img {
    object-position: 55% center;
  }
  .hero-resources,
  .platforms {
    grid-template-columns: 1fr;
  }
  .hero-resources {
    gap: 10px;
  }
  .resource-link {
    padding: 18px 22px;
  }
  .resource-link > svg:first-child {
    display: block;
  }
  .resource-link h2 {
    margin-bottom: 4px;
  }
  .home-section {
    padding-top: 48px;
    padding-bottom: 48px;
  }
  .section-heading {
    align-items: start;
    flex-direction: column;
    gap: 16px;
  }
  .section-heading h2,
  .start-section h2 {
    font-size: var(--i-font-size-2xl);
  }
  .showcase,
  .start-section {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  .showcase-section {
    padding: 48px 0;
  }
  .showcase-copy img {
    display: none;
  }
  .showcase-copy h2 {
    font-size: var(--i-font-size-3xl);
  }
  .platform {
    display: grid;
    grid-template-columns: 0.7fr 1fr;
  }
  .platform__visual {
    height: 100%;
    min-height: 220px;
  }
  .platform__tags {
    margin: 16px 0;
  }
}
@media (max-width: 480px) {
  h1 {
    font-size: var(--i-font-size-5xl);
  }
  .hero-actions {
    gap: 16px;
  }
  .primary-link {
    padding: 12px 18px;
  }
  .hero-content > p {
    font-size: var(--i-font-size-md);
  }
  .platform {
    display: block;
  }
  .platform__visual {
    height: 180px;
    min-height: 0;
  }
  .component-gallery {
    grid-template-columns: 1fr;
  }
  .sample-controls {
    grid-row: auto;
  }
  .sample-status {
    grid-column: auto;
  }
  .sample {
    padding: 22px;
  }
  .sample-type {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .resource-link {
    transition: none;
  }
}
</style>
