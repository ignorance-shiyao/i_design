<script setup lang="ts">
import CodeBlock from '@/site/CodeBlock.vue'
import FrameworkTabs from '@/site/FrameworkTabs.vue'
import IIcon from '@/components/IIcon.vue'
import ITag from '@/components/ITag.vue'
import { frameworks } from '@/data/frameworks'
import { snippets, sharedLogicSnippet } from '@/data/snippets'
import { currentFramework } from '@/composables/useFramework'
import { componentMatrix } from '@/data/componentMatrix'
import type { IconName } from '@/components/icons'

/** 共享层的四件东西，以及它们各自覆盖到哪些端 */
// 移动两端复用各自的基础包，因此它们的覆盖情况就是基础包的覆盖情况
const matrixKey = (id: string) =>
  id === 'mobile-vue' ? 'vue-next' : id === 'mobile-react' ? 'react' : id

const sharedLayers: { icon: IconName; title: string; detail: string; covers: string }[] = [
  {
    icon: 'palette',
    title: '设计令牌',
    detail: '颜色、字号、间距、圆角、阴影、动效共 99 个令牌，编译成 CSS / SCSS / JSON / WXSS / Dart 五种产物。',
    covers: '全部端'
  },
  {
    icon: 'grid',
    title: '图标数据',
    detail: '38 个图标只存 SVG path，不含任何框架代码；Web 内联、小程序用 CSS mask、Flutter 走 flutter_svg。',
    covers: '全部端'
  },
  {
    icon: 'code',
    title: '交互规则',
    detail: '分页序列、表格排序、选项移动、日期日历、表单校验、上传状态——纯函数，与渲染无关。',
    covers: 'Web 各端直接复用，Flutter 按同一算法移植'
  },
  {
    icon: 'layers',
    title: 'BEM 样式',
    detail: '一份 CSS。React 版与 Vue 版加载的是同一个文件，因此「两端长得不一样」在架构上不可能发生。',
    covers: 'Web 各端 + 小程序（自动降级为 WXSS）'
  }
]
</script>

<template>
  <article>
    <h1>跨端支持</h1>
    <p class="i-lead">
      一套设计体系，同时落在 Web、小程序、移动端与 Flutter 上。与框架无关的部分——
      令牌、图标、交互规则——只存在一份，各端只写渲染适配。所以「改一次颜色，处处生效」
      不是口号，而是构建的结果。
    </p>

    <h2>支持的端</h2>
    <div class="cp-grid">
      <section
        v-for="f in frameworks"
        :key="f.id"
        class="cp-card"
        :class="{ 'is-active': f.id === currentFramework }"
        @click="currentFramework = f.id"
      >
        <header class="cp-card__head">
          <h3 class="cp-card__title">{{ f.label }}</h3>
          <ITag type="brand">{{ f.runtime }}</ITag>
        </header>
        <p class="cp-card__note">{{ f.note }}</p>
        <div class="cp-card__foot"><code class="cp-card__pkg">{{ f.install }}</code></div>
      </section>
    </div>

    <h2>同一个用法，各端怎么写</h2>
    <p>
      下面三个片段里出现的每一个属性名，都由
      <code>scripts/check-snippets.mjs</code> 与那一端的真实实现核对过——文档写错的用法，
      比没有文档更浪费时间，所以这件事交给构建来保证，而不是靠记得更新。
    </p>

    <h3>Button 按钮</h3>
    <div class="cp-code"><FrameworkTabs :snippets="snippets.button" /></div>

    <h3>Select 下拉选择</h3>
    <div class="cp-code"><FrameworkTabs :snippets="snippets.select" /></div>

    <h3>Pagination 分页</h3>
    <div class="cp-code"><FrameworkTabs :snippets="snippets.pagination" /></div>

    <h2>覆盖矩阵</h2>
    <p>
      每个组件在各端的可用情况。这张表由构建时扫描各端源码生成，而不是人工维护——
      手写的清单会在补完第一个端的当天就写上「已支持」。
    </p>
    <div class="cp-matrix">
      <table class="i-table">
        <thead>
          <tr>
            <th>组件</th>
            <th v-for="f in frameworks" :key="f.id">{{ f.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in componentMatrix" :key="row.name">
            <td><code>{{ row.name }}</code></td>
            <td v-for="f in frameworks" :key="f.id" class="cp-cell">
              <span :class="row.ends[matrixKey(f.id)] ? 'cp-yes' : 'cp-no'">
                {{ row.ends[matrixKey(f.id)] ? '✓' : '—' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>共享的是什么</h2>
    <div class="cp-layers">
      <section v-for="layer in sharedLayers" :key="layer.title" class="cp-layer">
        <span class="cp-layer__icon"><IIcon :name="layer.icon" :size="18" /></span>
        <div>
          <h3 class="cp-layer__title">{{ layer.title }}</h3>
          <p class="cp-layer__detail">{{ layer.detail }}</p>
          <p class="cp-layer__covers">覆盖：{{ layer.covers }}</p>
        </div>
      </section>
    </div>

    <p>
      举个具体的：分页要显示哪些页码、省略号断在哪里，是一段与框架毫无关系的计算。
      它只写一次，各端引用同一份。
    </p>
    <CodeBlock :code="sharedLogicSnippet" lang="ts" />

    <h2>怎么保证它们真的一致</h2>
    <p>
      「共享」如果只靠自觉，迟早会分叉：某一端顺手改了个值，别处没人知道。
      因此一致性由脚本核验，跑在 CI 里，任何一项不通过就构建失败。
    </p>
    <ul class="cp-checks">
      <li><strong>令牌逐值比对</strong>：CSS、WXSS、JSON、Dart 四种产物的每个令牌值必须相等（Dart 颜色是 0xAARRGGBB，会先换算再比）。</li>
      <li><strong>规则黄金测试</strong>：Flutter 端的分页、排序、选项移动，期望值由 TypeScript 实现算出后生成 Dart 测试，而不是照着 Dart 反写。</li>
      <li><strong>样式不外泄</strong>：检查共享 CSS 里有没有 <code>.is-left</code> 这类过于通用的选择器——曾经它把表单整体挪了 83px。</li>
      <li><strong>Vue 2 语法约束</strong>：转换产物里不能残留 Teleport、多根节点这些 Vue 3 专有写法。</li>
      <li><strong>小程序四件套</strong>：每个组件的 wxml / js / json / wxss 齐全，用到的类名与图标在编译产物里确实存在。</li>
      <li><strong>代码片段核对</strong>：本页每个片段用到的属性，必须在那一端的实现里真实存在。</li>
    </ul>
  </article>
</template>

<style scoped>
.cp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--i-spacing-4);
  margin: var(--i-spacing-5) 0 var(--i-spacing-8);
}
.cp-card {
  /* 纵向弹性布局，让安装命令贴在卡片底部对齐，
     否则说明文字长短不一时七张卡片的命令行会参差 */
  display: flex;
  flex-direction: column;
  padding: var(--i-spacing-5);
  border: 1px solid var(--i-color-border);
  border-radius: var(--i-radius-xl);
  background: var(--i-color-bg-elevated);
  cursor: pointer;
  transition: border-color var(--i-motion-fast) var(--i-motion-easing),
    box-shadow var(--i-motion-base) var(--i-motion-easing),
    transform var(--i-motion-base) var(--i-motion-easing);
}
.cp-card:hover { box-shadow: var(--i-shadow-md); transform: translateY(-2px); }
.cp-card.is-active { border-color: var(--i-color-brand); box-shadow: var(--i-shadow-sm); }
.cp-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-2);
}
.cp-card__title { margin: 0; font-size: var(--i-font-size-lg); }
.cp-card__runtime {
  margin-top: var(--i-spacing-1);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-tertiary);
}
.cp-card__note {
  margin-top: var(--i-spacing-3);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-secondary);
  line-height: 1.7;
}
.cp-card__foot { margin-top: auto; padding-top: var(--i-spacing-4); }
.cp-card__pkg {
  display: block;
  border-radius: var(--i-radius-md);
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-secondary);
  word-break: break-all;
}
.cp-code {
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-lg);
  overflow: hidden;
  margin-bottom: var(--i-spacing-6);
}
.cp-matrix { overflow-x: auto; margin: var(--i-spacing-4) 0 var(--i-spacing-8); }
.cp-cell { text-align: center; }
.cp-yes { color: var(--i-color-success); font-weight: 600; }
.cp-no { color: var(--i-color-text-tertiary); }
.cp-layers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--i-spacing-4);
  margin: var(--i-spacing-5) 0;
}
.cp-layer {
  display: flex;
  gap: var(--i-spacing-3);
  padding: var(--i-spacing-4);
  border-radius: var(--i-radius-lg);
  background: var(--i-color-bg-subtle);
}
.cp-layer__icon {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--i-radius-md);
  background: var(--i-color-brand-subtle);
  color: var(--i-color-brand);
}
.cp-layer__title { margin: 0; font-size: var(--i-font-size-md); }
.cp-layer__detail {
  margin-top: var(--i-spacing-1);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-secondary);
  line-height: 1.7;
}
.cp-layer__covers {
  margin-top: var(--i-spacing-2);
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-tertiary);
}
.cp-checks { line-height: 1.9; }
.cp-checks li { margin-bottom: var(--i-spacing-2); }
</style>
