/**
 * 转换器产出的是要给 Vue 2.7 编译的源码。
 * 曾经漏过具名元组、模板非空断言、内层 </template> 截断——这些错编译器 loc 还对不上源码。
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { convert, convertEmits, convertTemplate, rootTemplate } from './convert.mjs'

test('具名事件元组不再套一层 a0', () => {
  const out = convertEmits("defineEmits<{ select: [task: AgentTask]; 'update:modelValue': [string] }>()")
  assert.equal(out.includes('a0: task: AgentTask'), false)
  assert.equal(out.includes("(e: 'select', task: AgentTask): void"), true)
})

test('模板非空断言剥掉，!= / !== / 前缀 ! 留下', () => {
  const src = `<template>
    <span>{{ marks.get(iso)!.length }}</span>
    <button @click="onHandleDown($event, resizeTarget!, h.handle)" />
    <b v-if="a != b && c !== d && !hidden">x</b>
  </template>`
  const out = convertTemplate(src)
  assert.equal(out.includes('marks.get(iso).length'), true)
  assert.equal(out.includes('resizeTarget!'), false)
  assert.equal(out.includes('resizeTarget,'), true)
  assert.equal(out.includes('a != b'), true)
  assert.equal(out.includes('c !== d'), true)
  assert.equal(out.includes('!hidden'), true)
})

test('箭头参数类型剥掉，参数名留下', () => {
  const src = `<template>
    <ICheckbox @update:model-value="(next: boolean) => onCheck(row.key, next)" />
  </template>`
  const out = convertTemplate(src)
  assert.equal(out.includes('(next: boolean)'), false)
  assert.equal(out.includes('(next) => onCheck(row.key, next)'), true)
})

test('内层 </template> 不截断后面的表达式', () => {
  const src = `<script setup></script>
<template>
  <div>
    <template v-for="tick in ticks" :key="tick"><span>{{ tick }}</span></template>
    <rect @pointerdown="onHandleDown($event, resizeTarget!, h.handle)" />
  </div>
</template>`
  const root = rootTemplate(src)
  assert.ok(root.body.includes('resizeTarget!'))
  const out = convertTemplate(src)
  assert.equal(out.includes('resizeTarget!'), false)
  assert.equal(out.includes('v-for="tick in ticks"'), true)
})

test('kebab-case 的 v-model 也改成 value / input', () => {
  const src = `<script setup>
defineEmits<{ 'update:modelValue': [string] }>()
</script>
<template>
  <IModal :model-value="true" @update:model-value="close" />
</template>`
  const out = convert(src, 'IDemo.vue')
  assert.equal(out.includes('model-value'), false)
  assert.equal(out.includes('modelValue'), false)
  assert.equal(out.includes(':value="true"'), true)
  assert.equal(out.includes('@input="close"'), true)
  assert.equal(out.includes("(e: 'input'"), true)
})

test('defineModel 补成 value / input 的计算属性', () => {
  const src = `<script setup lang="ts">
const model = defineModel<string>({ default: '' })
</script>
<template><input :value="model" /></template>`
  const out = convert(src, 'IDemo.vue')
  assert.equal(out.includes('function defineModel'), true)
  assert.equal(out.includes("named ? nameOrOptions : 'value'"), true)
  assert.equal(out.includes("prop === 'value' ? 'input'"), true)
  assert.equal(out.includes('modelValue'), false)
})
