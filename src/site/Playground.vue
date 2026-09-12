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
  const open = attrs.length ? `<${props.name}\n  ${attrs.join('\n  ')}\n>` : `<${props.name}>`
  return props.slotText ? `${open}${props.slotText}</${props.name}>` : open.replace(/>$/, ' />')
})

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
      <div v-for="meta in metas" :key="meta.name" class="pg__row">
        <div class="pg__label">
          <code>{{ meta.name }}</code>
          <span v-if="meta.doc" class="pg__doc">{{ meta.doc }}</span>
        </div>
        <div class="pg__control">
          <ISwitch
            v-if="meta.control?.kind === 'boolean'"
            :model-value="values[meta.name] === true"
            @update:model-value="values[meta.name] = $event"
          />
          <ISegmented
            v-else-if="meta.control?.kind === 'enum'"
            :model-value="values[meta.name] as string"
            :options="meta.control.options.map((o) => ({ label: o, value: o }))"
            @update:model-value="values[meta.name] = $event"
          />
          <IInputNumber
            v-else-if="meta.control?.kind === 'number'"
            :model-value="(values[meta.name] as number) ?? 0"
            size="sm"
            @update:model-value="values[meta.name] = $event"
          />
          <IInput
            v-else
            :model-value="(values[meta.name] as string) ?? ''"
            size="sm"
            @update:model-value="values[meta.name] = $event"
          />
        </div>
      </div>
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
  /* 一行放不下时自动折成一列，窄屏上控件不会被挤扁 */
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--i-spacing-4) var(--i-spacing-6);
  padding: var(--i-spacing-5) var(--i-spacing-6);
  border-bottom: 1px solid var(--i-color-hairline);
}
.pg__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-4);
  min-width: 0;
}
.pg__label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.pg__label code {
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text);
}
.pg__doc {
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-secondary);
  /* 说明可能很长，占满一行会把控件挤走 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pg__control {
  flex: none;
  max-width: 60%;
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
