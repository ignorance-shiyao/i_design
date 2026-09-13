<script setup lang="ts">
/**
 * 属性 playground：现场改属性看效果，并给出对应的代码。
 *
 * 控件清单来自 `src/data/componentProps.ts`，那份文件由源码生成——
 * 手写的清单会和代码漂移，而漂移不会让任何构建失败，只会让使用方
 * 照着调一个早就改名的属性，然后以为是组件坏了。
 *
 * 只渲染认得出类型的属性。数组、对象、函数这类没法用一个控件表达的，
 * 由文档页自己以 `fixed` 传进来当固定值——渲染一个操作不了的控件
 * 比不渲染更糟。
 */
import { computed, ref, watch } from 'vue'
import { componentProps, type PropMeta } from '@/data/componentProps'
import CodeBlock from './CodeBlock.vue'
import { groupPlaygroundProps } from './playgroundGroups'
import { formatSnippet } from './snippet'
import ISegmented from '@/components/ISegmented.vue'
import ISwitch from '@/components/ISwitch.vue'
import IInput from '@/components/IInput.vue'
import IInputNumber from '@/components/IInputNumber.vue'

const props = withDefaults(
  defineProps<{
    /** 组件名，如 `IButton`，同时是属性清单的键与代码片段里的标签名 */
    name: string
    /** 要渲染的组件本身 */
    is: unknown
    /** 只放开这些属性；不传则放开全部认得出类型的 */
    only?: string[]
    /** 不由控件控制的属性（数组、对象等），原样传给组件 */
    fixed?: Record<string, unknown>
    /** 默认插槽的文本内容 */
    slotText?: string
    /** 代码片段里 fixed 属性的写法，如 `:options="options"` */
    fixedCode?: string[]
  }>(),
  { only: undefined, fixed: undefined, slotText: '', fixedCode: undefined }
)

/** 把 withDefaults 里的默认值文本还原成值。认不出的当作未设置 */
function parseDefault(meta: PropMeta): unknown {
  const text = meta.defaultText
  if (text === null || text === 'undefined') return undefined
  if (text === 'true') return true
  if (text === 'false') return false
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text)
  if (/^'.*'$/.test(text)) return text.slice(1, -1)
  return undefined
}

const metas = computed(() =>
  (componentProps[props.name] ?? [])
    .filter((m) => m.control)
    .filter((m) => !props.only || props.only.includes(m.name))
)

const values = ref<Record<string, unknown>>({})
watch(
  metas,
  (list) => {
    const next: Record<string, unknown> = {}
    for (const meta of list) next[meta.name] = parseDefault(meta)
    values.value = next
  },
  { immediate: true }
)

/*
 * 组件自己发出的更新要收下来。
 *
 * 不收的话，Select 点了选项不变、Tree 勾了复选框没反应——受控组件把值交出去了，
 * 而这里没人接。使用方看到的会是「组件坏了」，而不是「示例没接」。
 * 所以给每个已知属性都挂上 `onUpdate:xxx`，Vue 的 v-model 本质就是这一对。
 */
const echoes = ref<Record<string, unknown>>({})
watch(() => props.name, () => (echoes.value = {}))

const handlers = computed(() => {
  const map: Record<string, (value: unknown) => void> = {}
  for (const meta of componentProps[props.name] ?? []) {
    map[`onUpdate:${meta.name}`] = (value: unknown) => {
      // 控件管着的属性，回写到控件上，两边不会各说各话
      if (meta.name in values.value) values.value[meta.name] = value
      else echoes.value[meta.name] = value
    }
  }
  return map
})

const bound = computed(() => ({ ...props.fixed, ...echoes.value, ...values.value, ...handlers.value }))

/** 只写出与默认值不同的属性——把默认值也抄进去的代码片段没人愿意粘贴 */
const code = computed(() => {
  const attrs: string[] = [...(props.fixedCode ?? [])]
  for (const meta of metas.value) {
    const value = values.value[meta.name]
    if (value === undefined || value === parseDefault(meta)) continue
    if (typeof value === 'boolean') attrs.push(value ? meta.name : `:${meta.name}="false"`)
    else if (typeof value === 'number') attrs.push(`:${meta.name}="${value}"`)
    else if (value === '') continue
    else attrs.push(`${meta.name}="${value}"`)
  }
  // 放得下就一行，放不下才每个属性一行——读者要粘贴的往往就是一小段
  return formatSnippet({ name: props.name, attrs, slot: props.slotText })
})

/*
 * 分档显示：十几个属性摊在一格网格里，开关、分段器、输入框大小不一地混排，
 * 读者得逐个看过去才知道哪个控件配哪个属性。
 */
const groups = computed(() => groupPlaygroundProps(metas.value))

function reset() {
  const next: Record<string, unknown> = {}
  for (const meta of metas.value) next[meta.name] = parseDefault(meta)
  values.value = next
}
</script>

<template>
  <section class="pg">
    <div class="pg__stage">
      <component :is="props.is" v-bind="bound">{{ slotText }}</component>
    </div>

    <div class="pg__controls">
      <section v-for="group in groups" :key="group.title" class="pg__group">
        <h4 class="pg__group-title">
          {{ group.title }}
          <span class="pg__group-hint">{{ group.hint }}</span>
        </h4>
        <div class="pg__grid">
      <div v-for="meta in group.metas" :key="meta.name" class="pg__row">
        <div class="pg__label">
          <code>{{ meta.name }}</code>
          <span v-if="meta.doc" class="pg__doc">{{ meta.doc }}</span>
        </div>
        <!--
          每个控件都带上属性名作无障碍名：控件上面虽然写着属性名，
          但那是一个独立的 div，读屏不会把它和控件关联起来，
          听到的只是一串「开关，未选中」「编辑框，空」。
        -->
        <div class="pg__control">
          <ISwitch
            v-if="meta.control?.kind === 'boolean'"
            :model-value="values[meta.name] === true"
            :aria-label="meta.name"
            @update:model-value="values[meta.name] = $event"
          />
          <ISegmented
            v-else-if="meta.control?.kind === 'enum'"
            :model-value="values[meta.name] as string"
            :options="meta.control.options.map((o) => ({ label: o, value: o }))"
            :aria-label="meta.name"
            @update:model-value="values[meta.name] = $event"
          />
          <IInputNumber
            v-else-if="meta.control?.kind === 'number'"
            :model-value="(values[meta.name] as number) ?? 0"
            size="sm"
            :aria-label="meta.name"
            @update:model-value="values[meta.name] = $event"
          />
          <IInput
            v-else
            :model-value="(values[meta.name] as string) ?? ''"
            size="sm"
            :aria-label="meta.name"
            @update:model-value="values[meta.name] = $event"
          />
        </div>
      </div>
        </div>
      </section>
      <button class="pg__reset" type="button" @click="reset">恢复默认值</button>
    </div>

    <div class="pg__code">
      <CodeBlock :code="code" lang="vue" />
    </div>
  </section>
</template>

<style scoped>
.pg {
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-md);
  margin-bottom: var(--i-spacing-6);
  background: var(--i-color-bg-elevated);
  overflow: visible;
}
.pg__stage {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--i-spacing-4);
  flex-wrap: wrap;
  padding: var(--i-spacing-8) var(--i-spacing-6);
  border-bottom: 1px solid var(--i-color-hairline);
}
.pg__controls {
  display: grid;
  gap: var(--i-spacing-5);
  padding: var(--i-spacing-5) var(--i-spacing-6);
  border-bottom: 1px solid var(--i-color-hairline);
}
.pg__group {
  display: grid;
  gap: var(--i-spacing-3);
}
.pg__group-title {
  display: flex;
  align-items: baseline;
  gap: var(--i-spacing-2);
  margin: 0;
  font-size: var(--i-font-size-sm);
  font-weight: 600;
  color: var(--i-color-text);
}
.pg__group-hint {
  font-size: var(--i-font-size-xs);
  font-weight: 400;
  color: var(--i-color-text-tertiary);
}
.pg__grid {
  display: grid;
  /* 一行放不下时自动折成一列，窄屏上控件不会被挤扁 */
  grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
  gap: var(--i-spacing-4) var(--i-spacing-6);
}
/*
 * 属性名在上、控件在下，而不是左右分开。
 *
 * 左右分开时控件靠右对齐，而各个控件宽度差得很远（两个选项的分段器
 * 与一个开关差着三倍），于是每一行的控件各自停在不同的位置上，
 * 看起来像和左边的属性名没关系。名字压在控件正上方就不会有这个问题，
 * 说明文字也终于有整行的宽度可用，不必截成「视觉层级：主按钮…」。
 */
.pg__row {
  display: grid;
  gap: var(--i-spacing-2);
  align-content: start;
  min-width: 0;
}
.pg__label {
  display: flex;
  flex-direction: column;
  /* 收到内容宽度：属性名带着底色，铺满整格会看起来像一个空输入框 */
  align-items: flex-start;
  gap: 2px;
  min-width: 0;
}
/* 说明文字要整行，别跟着属性名一起收窄 */
.pg__label .pg__doc { align-self: stretch; }
.pg__label code {
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text);
}
.pg__doc {
  font-size: var(--i-font-size-xs);
  line-height: 1.5;
  color: var(--i-color-text-secondary);
  /*
   * 最多两行。属性名与控件改成上下排布之后，说明有整格的宽度可用，
   * 原先那条「一行截断」会把「不传时用字典里的『请选择』，由 ConfigProvider …」
   * 恰好截在最要紧的那半句上。留两行；再长的说明本来也该去看属性表。
   */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}
.pg__control {
  min-width: 0;
  /* 控件跟着格子走，不再限制在 60%：限制之后分段器会被压得选项挤在一起 */
  max-width: 100%;
}
.pg__reset {
  grid-column: 1 / -1;
  justify-self: start;
  padding: var(--i-spacing-1) var(--i-spacing-3);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-sm);
  background: var(--i-color-bg);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-xs);
  cursor: pointer;
}
.pg__reset:hover {
  border-color: var(--i-color-border-strong);
  color: var(--i-color-text);
}
</style>
