<script setup lang="ts">
import { computed, ref } from 'vue'
import IIcon from '@/components/IIcon.vue'
import IInput from '@/components/IInput.vue'
import ISegmented from '@/components/ISegmented.vue'
import IDropdown from '@/components/IDropdown.vue'
import IButton from '@/components/IButton.vue'
import { iconNames, icons } from '@/components/icons'
import { message } from '@/components/message'
import DemoBlock from '@/site/DemoBlock.vue'
import { CATEGORY_LABELS, iconMeta, iconsByCategory, searchIcons } from '@i-design/common'

const keyword = ref('')
const size = ref(22)
const stroke = ref(1.8)

/*
 * 检索走元数据而不是「名字里包不包含」：使用方脑子里是「删除」「回收站」，
 * 而图标叫 trash。只按名字匹配的搜索框，等于要求他先知道答案。
 */
const hits = computed(() => (keyword.value.trim() ? new Set(searchIcons(keyword.value)) : null))

const groups = computed(() =>
  iconsByCategory()
    .map((group) => ({ ...group, names: group.names.filter((name) => !hits.value || hits.value.has(name)) }))
    .filter((group) => group.names.length > 0)
)

const total = computed(() => groups.value.reduce((sum, group) => sum + group.names.length, 0))

/** 与 IIcon 渲染出来的完全一致的独立 SVG，可直接存成文件 */
function svgOf(name: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" ` +
    `stroke="currentColor" stroke-width="${stroke.value}" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="${icons[name as keyof typeof icons]}"/></svg>`
}

async function copy(text: string, hint: string) {
  try {
    await navigator.clipboard.writeText(text)
    message.success(hint)
  } catch {
    message.warning('当前环境不支持剪贴板，请手动复制')
  }
}

/** 下载单个 SVG。浏览器里没有别的办法把文本变成文件，只能造一个临时链接 */
function download(name: string) {
  const blob = new Blob([svgOf(name)], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${name}.svg`
  anchor.click()
  URL.revokeObjectURL(url)
  message.success(`已下载 ${name}.svg`)
}

const actions = [
  { key: 'vue', label: '复制 Vue 用法' },
  { key: 'react', label: '复制 React 用法' },
  { key: 'svg', label: '复制 SVG' },
  { key: 'path', label: '复制按需引入' },
  { key: 'download', label: '下载 .svg' }
]

function act(name: string, key: string) {
  const bare = name.replace(/(^|-)([a-z0-9])/g, (_, __, ch) => ch.toUpperCase())
  if (key === 'vue') return copy(`<IIcon name="${name}" />`, `已复制 ${name} 的 Vue 用法`)
  if (key === 'react') return copy(`<Icon name="${name}" />`, `已复制 ${name} 的 React 用法`)
  if (key === 'svg') return copy(svgOf(name), `已复制 ${name} 的 SVG`)
  if (key === 'path') {
    return copy(
      `import { icon${bare} } from '@i-design/common/icons'\n<IIcon name="${name}" :path="icon${bare}" />`,
      '已复制按需引入的写法'
    )
  }
  return download(name)
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
      <span class="row" style="color: var(--i-color-brand-text)">
        <IIcon name="sparkle" :size="20" />
        <IIcon name="palette" :size="20" />
        <IIcon name="layers" :size="20" />
      </span>
      <span class="row" style="color: var(--i-color-danger-text)">
        <IIcon name="trash" :size="20" />
        <IIcon name="error-circle" :size="20" />
      </span>
    </DemoBlock>

    <DemoBlock
      title="描边与填充"
      description="描边在小尺寸、低对比的位置会「化掉」——徽标里的勾、16px 的状态点、移动端底栏的选中项。填充版把同一个形状做成实心，识别距离明显更远。不是每个图标都有填充版，没有的自动退回描边，任何时候都有东西可画。双色靠同一个 currentColor 的两档不透明度，不引第二种颜色：引入第二色就得为每个主题、每种底色重新验一遍对比度。"
      lang="vue"
      code='<IIcon name="check-circle" />
<IIcon name="check-circle" variant="fill" />
<IIcon name="user" variant="fill" />'
    >
      <span class="row">
        <IIcon name="check-circle" :size="20" />
        <IIcon name="info-circle" :size="20" />
        <IIcon name="warning-triangle" :size="20" />
        <IIcon name="error-circle" :size="20" />
      </span>
      <span class="row">
        <IIcon name="check-circle" :size="20" variant="fill" />
        <IIcon name="info-circle" :size="20" variant="fill" />
        <IIcon name="warning-triangle" :size="20" variant="fill" />
        <IIcon name="error-circle" :size="20" variant="fill" />
        <IIcon name="user" :size="20" variant="fill" />
      </span>
      <span class="row">
        <!-- 没有填充版的图标退回描边，而不是画一个空白 -->
        <IIcon name="search" :size="20" variant="fill" />
        <IIcon name="filter" :size="20" variant="fill" />
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
    <p>
      共 {{ iconNames.length }} 个，按语义域分组。搜索认业务词——搜「删除」「入库」「审计」都能找到对应的那个，不必先知道它叫什么。
    </p>
    <div class="browser">
      <div class="search">
        <IInput v-model="keyword" placeholder="搜索图标，如 删除、入库、cloud" clearable />
      </div>
      <ISegmented
        v-model="size"
        :options="[
          { label: '16px', value: 16 },
          { label: '22px', value: 22 },
          { label: '32px', value: 32 }
        ]"
        aria-label="预览尺寸"
      />
      <ISegmented
        v-model="stroke"
        :options="[
          { label: '细 1.5', value: 1.5 },
          { label: '标准 1.8', value: 1.8 },
          { label: '粗 2.2', value: 2.2 }
        ]"
        aria-label="预览线宽"
      />
      <p class="browser__count">{{ total }} / {{ iconNames.length }}</p>
    </div>

    <section v-for="group in groups" :key="group.category" class="group">
      <h3 class="group__title">{{ CATEGORY_LABELS[group.category] }}</h3>
      <div class="gallery">
        <div v-for="name in group.names" :key="name" class="cell">
          <IIcon :name="name" :size="size" :stroke-width="stroke" />
          <span class="cell__cn">{{ iconMeta[name].cn }}</span>
          <code class="cell__name">{{ name }}</code>
          <IDropdown :items="actions" @select="(key: string) => act(name, key)">
            <IButton variant="text" size="sm" :aria-label="`${iconMeta[name].cn} 的复制与下载`">
              复制 / 下载
            </IButton>
          </IDropdown>
        </div>
      </div>
    </section>
    <p v-if="!total" class="empty">
      没有匹配「{{ keyword }}」的图标。可以试试业务词，比如「发货」「合同」「定位」。
    </p>

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
.browser {
  display: flex;
  flex-wrap: wrap;
  gap: var(--i-spacing-3);
  align-items: center;
  margin-bottom: var(--i-spacing-5);
}
.search { flex: 1 1 240px; max-width: 320px; }
.browser__count { margin: 0; color: var(--i-color-text-tertiary); font-size: var(--i-font-size-sm); }
.group { margin-bottom: var(--i-spacing-6); }
.group__title {
  margin: 0 0 var(--i-spacing-3);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
  font-weight: 500;
}
.cell__cn { color: var(--i-color-text); font-size: var(--i-font-size-sm); }
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(150px, 100%), 1fr));
  gap: var(--i-spacing-2);
}
.cell {
  display: grid;
  justify-items: center;
  gap: var(--i-spacing-1);
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
  color: var(--i-color-brand-text);
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
