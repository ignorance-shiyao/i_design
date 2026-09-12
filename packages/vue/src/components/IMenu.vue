<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IMenu.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  accordionOpenKeys,
  menuEntities,
  openKeysFor,
  type MenuItem,
  type MenuMode
} from '@i-design/common'
import IIcon from './IIcon.vue'
import type { IconName } from './icons'

const props = withDefaults(
  defineProps<{
    items: MenuItem[]
    /** 当前选中项 */
    value?: string
    mode?: MenuMode
    /** 展开的分组；不传时组件自己管 */
    openKeys?: string[]
    /** 手风琴：同层只展开一个 */
    accordion?: boolean
    /** 收起为图标栏 */
    collapsed?: boolean
  }>(),
  { value: '', mode: 'vertical', openKeys: undefined, accordion: false, collapsed: false }
)

const emit = defineEmits<{ (e: 'input', key: string): void; (e: 'update:openKeys', keys: string[]): void; (e: 'select', item: MenuItem): void }>()

const entities = computed(() => menuEntities(props.items))
const inner = ref<string[]>(props.openKeys ? [...props.openKeys] : [])

/*
 * 选中项变化时补上它的祖先分组。
 * 只在外部改动（比如路由跳转）时也生效——否则切到另一个分支后，
 * 选中项会藏在收起的分组里，用户以为没跳成功。
 */
watch(
  () => props.value,
  (key) => {
    if (!key) return
    inner.value = openKeysFor(entities.value, key, inner.value)
    emit('update:openKeys', inner.value)
  },
  { immediate: true }
)
watch(
  () => props.openKeys,
  (next) => {
    if (next) inner.value = [...next]
  }
)

const opened = computed(() => new Set(props.openKeys ?? inner.value))

function toggle(key: string) {
  const next = props.accordion
    ? accordionOpenKeys(entities.value, opened.value, key)
    : opened.value.has(key)
      ? [...opened.value].filter((k) => k !== key)
      : [...opened.value, key]
  inner.value = next
  emit('update:openKeys', next)
}

function choose(item: MenuItem) {
  if (item.disabled) return
  emit('input', item.key)
  emit('select', item)
}
</script>

<template>
  <nav
    class="i-menu"
    :class="[`i-menu--${mode}`, { 'is-collapsed': collapsed && mode === 'vertical' }]"
  >
    <template v-for="item in items" :key="item.key">
      <!-- 有子项的是分组：点击展开，本身不承担选中 -->
      <template v-if="item.children?.length && mode === 'vertical'">
        <button
          type="button"
          class="i-menu__group-head"
          :aria-expanded="String(opened.has(item.key))"
          :title="collapsed ? item.label : undefined"
          @click="toggle(item.key)"
        >
          <IIcon v-if="item.icon" class="i-menu__icon" :name="item.icon" :size="16" />
          <span class="i-menu__label">{{ item.label }}</span>
          <IIcon
            class="i-menu__arrow"
            :class="{ 'is-open': opened.has(item.key) }"
            name="chevron-right"
            :size="14"
          />
        </button>

        <div v-show="opened.has(item.key)" class="i-menu__sub">
          <button
            v-for="child in item.children"
            :key="child.key"
            type="button"
            class="i-menu__item"
            :class="{ 'is-active': value === child.key, 'is-disabled': child.disabled }"
            :style="{ paddingLeft: collapsed ? undefined : '32px' }"
            :disabled="child.disabled"
            @click="choose(child)"
          >
            <IIcon v-if="child.icon" class="i-menu__icon" :name="child.icon" :size="16" />
            <span class="i-menu__label">{{ child.label }}</span>
          </button>
        </div>
      </template>

      <button
        v-else
        type="button"
        class="i-menu__item"
        :class="{ 'is-active': value === item.key, 'is-disabled': item.disabled }"
        :title="collapsed ? item.label : undefined"
        :disabled="item.disabled"
        @click="choose(item)"
      >
        <IIcon v-if="item.icon" class="i-menu__icon" :name="item.icon as IconName" :size="16" />
        <span class="i-menu__label">{{ item.label }}</span>
      </button>
    </template>
  </nav>
</template>
