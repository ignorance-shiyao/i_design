<script setup lang="ts">
import { computed, ref } from 'vue'
import IIcon from '@/components/IIcon.vue'
import IInput from '@/components/IInput.vue'
import { iconNames } from '@/components/icons'
import { message } from '@/components/message'
import DemoBlock from '@/site/DemoBlock.vue'

const keyword = ref('')
const filtered = computed(() =>
  iconNames.filter((name) => name.includes(keyword.value.trim().toLowerCase()))
)

async function copyName(name: string) {
  try {
    await navigator.clipboard.writeText(`<IIcon name="${name}" />`)
    message.success(`已复制 ${name}`)
  } catch {
    message.warning('当前环境不支持剪贴板，请手动复制')
  }
}
</script>

<template>
  <article>
    <h1>Icon 图标</h1>
    <p class="i-lead">
      24×24 网格、2px 描边的内联 SVG 图标。用 <code>currentColor</code> 着色，因此图标天然跟随文字颜色与主题——不用为深色模式准备第二套资源。
    </p>

    <DemoBlock
      title="尺寸与颜色"
      description="size 默认为 1em，跟随上下文字号；也可传具体像素值。颜色由父级 color 决定。"
      lang="vue"
      code='<IIcon name="check-circle" />
<IIcon name="check-circle" :size="20" />
<IIcon name="check-circle" :size="28" :stroke-width="1.5" />'
    >
      <span class="row" style="color: var(--i-color-text-secondary)">
        <IIcon name="check-circle" />
        <IIcon name="check-circle" :size="20" />
        <IIcon name="check-circle" :size="28" :stroke-width="1.5" />
      </span>
      <span class="row" style="color: var(--i-color-brand)">
        <IIcon name="sparkle" :size="20" />
        <IIcon name="palette" :size="20" />
        <IIcon name="layers" :size="20" />
      </span>
      <span class="row" style="color: var(--i-color-danger)">
        <IIcon name="trash" :size="20" />
        <IIcon name="error-circle" :size="20" />
      </span>
    </DemoBlock>

    <DemoBlock
      title="旋转与无障碍"
      description="spin 用于加载态；label 会输出 role=img + aria-label，不传则视为装饰性图标并对读屏隐藏。"
      lang="vue"
      code='<IIcon name="refresh" spin />
<IIcon name="user" label="当前用户" />'
    >
      <span class="row">
        <IIcon name="refresh" :size="20" spin />
        <IIcon name="user" :size="20" label="当前用户" />
      </span>
    </DemoBlock>

    <h2>全部图标</h2>
    <p>共 {{ iconNames.length }} 个。点击任意图标复制其用法。</p>
    <div class="search">
      <IInput v-model="keyword" placeholder="搜索图标名，如 check、arrow" />
    </div>
    <div class="gallery">
      <button
        v-for="name in filtered"
        :key="name"
        class="cell"
        type="button"
        :title="name"
        @click="copyName(name)"
      >
        <IIcon :name="name" :size="22" />
        <span class="cell__name">{{ name }}</span>
      </button>
    </div>
    <p v-if="!filtered.length" class="empty">没有匹配「{{ keyword }}」的图标。</p>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>图标含义不是人人都懂时——配上文字。只有放大镜、齿轮这类极少数图标可以独自成立。</li>
      <li>想用它表达状态的强弱时——图标只有「是什么」，强弱靠颜色与文字标签。</li>
      <li>需要插画式的表达时——图标是 24 格线性图形，撑大到 100px 会露出描边的破绽。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>name</td><td><code>IconName</code></td><td>—</td><td>图标名，必填；类型受限于图标库，写错会有类型报错</td></tr>
        <tr><td>size</td><td><code>number | string</code></td><td><code>1em</code></td><td>数字按 px，字符串原样使用</td></tr>
        <tr><td>strokeWidth</td><td><code>number</code></td><td><code>1.8</code></td><td>线宽；小尺寸下可适当加粗</td></tr>
        <tr><td>label</td><td><code>string</code></td><td><code>''</code></td><td>无障碍标签；不传则对读屏隐藏</td></tr>
        <tr><td>spin</td><td><code>boolean</code></td><td><code>false</code></td><td>持续旋转，遵循「减少动效」偏好</td></tr>
      </tbody>
    </table>

    <h2>为什么不用图标字体</h2>
    <p>
      图标字体（iconfont 一类）需要额外的字体文件与外链请求，且只能整体着色、无法做半色调或局部动画；字体加载失败时还会退化成方块。内联 SVG 没有额外请求，能跟随<code>currentColor</code>、参与 CSS 过渡，也便于按需 tree-shaking。
    </p>
  </article>
</template>

<style scoped>
.row { display: inline-flex; align-items: center; gap: var(--i-spacing-4); }
.search { max-width: 280px; margin-bottom: var(--i-spacing-5); }
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: var(--i-spacing-2);
}
.cell {
  display: grid;
  justify-items: center;
  gap: var(--i-spacing-2);
  padding: var(--i-spacing-4) var(--i-spacing-2);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-lg);
  background: var(--i-color-bg-elevated);
  color: var(--i-color-text-secondary);
  font-family: inherit;
  cursor: pointer;
  transition: all var(--i-motion-fast) var(--i-motion-easing);
}
.cell:hover {
  color: var(--i-color-brand);
  border-color: color-mix(in srgb, var(--i-color-brand) 40%, transparent);
  box-shadow: var(--i-shadow-md);
  transform: translateY(-2px);
}
.cell__name {
  font-family: var(--i-font-family-mono);
  font-size: 10px;
  color: var(--i-color-text-tertiary);
  word-break: break-all;
  line-height: 1.3;
}
.empty { color: var(--i-color-text-tertiary); }
</style>
