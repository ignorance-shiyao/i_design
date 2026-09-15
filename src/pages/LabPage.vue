<script setup lang="ts">
/**
 * Patterns Lab：每个组件在这里真的渲染一次。
 *
 * 组件清单来自能力注册表（按目录生成），不是手写的——手写的清单会漏掉
 * 新组件，而漏掉不会让任何检查失败。所以这一页与源码目录同步：
 * 新增一个组件，它第二天就会出现在这里；渲染不出来，`check:lab` 会红。
 *
 * 必填属性的值分两种来源：能从类型推出来的（枚举取第一项、字符串给一段示例
 * 文字、数字给 1）由这里自动合成；必填属性是数组或对象的，从 labFixtures 取。
 * 两样都没有的组件会被明确标出来——「只列了个名字」不算覆盖。
 */
import { computed, ref, shallowRef, watchEffect } from 'vue'
import { capabilityRegistry } from '@/data/capabilityRegistry'
import { componentProps } from '@/data/componentProps'
import { labFixtures } from '@/data/labFixtures'
import ISegmented from '@/components/ISegmented.vue'
import IInput from '@/components/IInput.vue'
import ITag from '@/components/ITag.vue'
import IEmpty from '@/components/IEmpty.vue'

/** 组件实现按需加载：一次性把一百多个组件都装进来，这一页会先白屏两秒 */
const modules = import.meta.glob('@/components/I*.vue')

/** 命令式 API 的宿主没有可看的形态，由 message()/notification() 自己挂载 */
const HOSTS = ['IMessageList', 'IConfirmLayer', 'INotificationLayer']

/*
 * 这几个组件默认不可见：要么挂到 body 上接管整页（弹层、抽屉、引导），
 * 要么要等一个交互才出现（回到顶部要先滚动）。在 Lab 里默认打开的话，
 * 一个格子会盖住其余一百多个。
 *
 * 它们不能因此就只剩一个名字——那正是「只列名字不算覆盖」要防的。
 * 所以这里必须给出它可运行演示的位置，check:lab 会核对这个链接真的存在。
 */
const INTERACTIVE: Record<string, string> = {
  IModal: '要点开才出现，且会接管整页',
  IModalForm: '要点开才出现，且会接管整页',
  IDrawerForm: '要点开才出现，且会接管整页',
  IDrawer: '要点开才出现，且会接管整页',
  IImageViewer: '要点开才出现，且会接管整页',
  ITour: '要开始引导才出现，会高亮整页元素',
  ICommandSearch: '要按快捷键或点击入口才出现',
  IBackTop: '要页面滚动到一定距离才出现'
}

interface Entry {
  name: string
  /** 这个组件有几种样子：属性里的字面量联合 */
  states: Record<string, string[]>
  props: Record<string, unknown>
  /** 无法自动合成必填属性时的原因 */
  blocked?: string
  /** 默认不可见的原因，以及它的可运行演示在哪儿 */
  interactive?: { reason: string; route: string | null }
}

/*
 * 这些属性哪怕是可选的也一定要给：它们是组件的无障碍名。
 * 自动渲染出来的输入框、图标按钮如果没有名字，读屏里就是一串「编辑框」「按钮」，
 * 而 check:a11y 是零容忍的——Lab 自己先得过得去，否则它示范的是错误做法。
 */
const NAMING_PROPS = ['label', 'placeholder', 'title', 'alt', 'ariaLabel']

/** 从类型文本推一个能用的值。推不出来返回 undefined，交给 fixture */
function synthesize(type: string, name: string): unknown {
  const literals = [...type.matchAll(/'([^']*)'/g)].map((m) => m[1])
  if (literals.length) return literals[0]
  if (/^boolean$/.test(type)) return false
  if (/^number$/.test(type)) return 1
  if (/^string$/.test(type)) return name === 'src' ? '' : '示例'
  if (/^string \| number$/.test(type)) return '示例'
  return undefined
}

const entries = computed<Entry[]>(() =>
  capabilityRegistry
    .filter((row) => !HOSTS.includes(row.name))
    .map((row) => {
      const metas = componentProps[row.name] ?? []
      const fixture = labFixtures[row.name] ?? {}
      const props: Record<string, unknown> = { ...fixture }
      const missing: string[] = []
      const bare = row.name.replace(/^I/, '')
      for (const meta of metas) {
        if (meta.name in props) continue
        if (meta.optional) {
          // 可选属性里只补无障碍名，其余一律保持默认——Lab 要展示的是默认形态
          if (NAMING_PROPS.includes(meta.name) && /string/.test(meta.type)) props[meta.name] = `${bare} 示例`
          continue
        }
        const value = synthesize(meta.type, meta.name)
        if (value === undefined) missing.push(meta.name)
        else props[meta.name] = value
      }
      const reason = INTERACTIVE[row.name]
      return {
        name: row.name,
        states: row.states,
        props,
        blocked: missing.length ? `缺少必填属性的示例数据：${missing.join('、')}` : undefined,
        interactive: reason
          ? { reason, route: row.doc?.route ?? row.demoRoutes[0] ?? null }
          : undefined
      }
    })
)

const keyword = ref('')
const density = ref<'default' | 'compact'>('default')
const stateFilter = ref<'all' | 'stateful'>('all')

const visible = computed(() =>
  entries.value
    .filter((e) => (stateFilter.value === 'stateful' ? Object.keys(e.states).length > 0 : true))
    .filter((e) => e.name.toLowerCase().includes(keyword.value.trim().toLowerCase()))
)

const blockedCount = computed(() => entries.value.filter((e) => e.blocked).length)

/** 按需把组件实现装进来 */
const loaded = shallowRef<Record<string, unknown>>({})
watchEffect(() => {
  for (const entry of visible.value) {
    if (loaded.value[entry.name]) continue
    const loader = modules[`/src/components/${entry.name}.vue`]
    if (!loader) continue
    loader().then((module) => {
      loaded.value = { ...loaded.value, [entry.name]: (module as { default: unknown }).default }
    })
  }
})
</script>

<template>
  <article class="lab">
    <h1>Patterns Lab</h1>
    <p class="i-lead">
      每个组件在这里真的渲染一次。清单来自按目录生成的能力注册表，不是手写的——新增一个组件会自动出现在这里，渲染不出来会让检查失败。只列名字或摆一张截图不算覆盖。
    </p>

    <div class="lab__bar">
      <IInput v-model="keyword" placeholder="按组件名筛选" clearable />
      <ISegmented
        v-model="stateFilter"
        :options="[
          { label: '全部组件', value: 'all' },
          { label: '有状态集的', value: 'stateful' }
        ]"
      />
      <ISegmented
        v-model="density"
        :options="[
          { label: '默认密度', value: 'default' },
          { label: '紧凑', value: 'compact' }
        ]"
      />
      <p class="lab__count">
        显示 {{ visible.length }} / {{ entries.length }}
        <template v-if="blockedCount">， {{ blockedCount }} 个还缺示例数据</template>
      </p>
    </div>

    <IEmpty v-if="!visible.length" type="search" title="没有匹配的组件" />

    <ul v-else class="lab__grid" :class="{ 'is-compact': density === 'compact' }">
      <li v-for="entry in visible" :key="entry.name" class="lab__cell" :data-component="entry.name">
        <header class="lab__head">
          <code class="lab__name">{{ entry.name }}</code>
          <span class="lab__states">
            <ITag v-for="(values, prop) in entry.states" :key="prop" size="sm">
              {{ prop }}：{{ values.length }}
            </ITag>
          </span>
        </header>

        <div v-if="entry.blocked" class="lab__blocked" role="note">
          <ITag tone="warning" size="sm">缺示例数据</ITag>
          <span>{{ entry.blocked }}</span>
        </div>
        <div v-else-if="entry.interactive" class="lab__blocked" role="note">
          <ITag size="sm">需要交互</ITag>
          <span>
            {{ entry.interactive.reason }}。
            <RouterLink v-if="entry.interactive.route" :to="entry.interactive.route">
              到文档页看可运行的演示
            </RouterLink>
            <template v-else>还没有可运行的演示</template>
          </span>
        </div>
        <!--
          演示区自己是可滚动容器，必须能用键盘聚焦，否则只能用鼠标滚——
          这条正是 axe 的 scrollable-region-focusable。名字也要给：
          一百多个同构的区域，读屏里不能都叫「分组」。
        -->
        <div
          v-else
          class="lab__stage"
          role="group"
          tabindex="0"
          :aria-label="`${entry.name} 演示`"
          :data-ready="loaded[entry.name] ? 'yes' : 'no'"
        >
          <component :is="loaded[entry.name]" v-if="loaded[entry.name]" v-bind="entry.props">
            {{ entry.name.replace(/^I/, '') }}
          </component>
          <span v-else class="lab__loading">装载中…</span>
        </div>
      </li>
    </ul>
  </article>
</template>

<style scoped>
.lab__bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--i-spacing-3);
  align-items: center;
  margin: var(--i-spacing-5) 0;
}
.lab__count {
  margin: 0;
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
}
/*
 * 一百多个格子高矮差得很远：IAffix 只有一行字，IAgentTasks 有三行任务列表。
 * 用网格排，同一行里所有格子都会被最高的那个拉齐——量出来整片网格 18% 的高度
 * 是这么撑出来的空白，最惨的一格被拉高 224px，滚过去看到的大半是灰底不是组件。
 * 改成 `align-items: start` 只是把空白从格子里挪到格子之间，页面一样长。
 *
 * 所以这里用多列（masonry 那种排法）：每一格按自己的内容定高，
 * 下一格紧接着往上补，列与列之间不互相牵制。
 * `break-inside: avoid` 保证一个格子不会被从中间劈到下一列去。
 *
 * 代价是阅读顺序变成「先下后右」。这一页的清单本来就是按组件名排的，
 * 顺着一列往下读和横着读一样自然；而 DOM 顺序没变，键盘 Tab 与读屏
 * 走的仍是同一条路，视觉顺序和焦点顺序对得上。
 */
.lab__grid {
  column-width: 320px;
  column-gap: var(--i-spacing-4);
  margin: 0;
  padding: 0;
  list-style: none;
}
.lab__grid.is-compact {
  column-gap: var(--i-spacing-2);
}
.lab__grid.is-compact .lab__cell { margin-bottom: var(--i-spacing-2); }
.lab__cell {
  /* 多列里一个格子被从中间劈到下一列的话，读起来就成了两个半截组件 */
  break-inside: avoid;
  margin-bottom: var(--i-spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--i-spacing-2);
  padding: var(--i-spacing-4);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-md);
  background: var(--i-color-bg-elevated);
}
.lab__head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--i-spacing-2);
  align-items: baseline;
  justify-content: space-between;
}
.lab__name { font-size: var(--i-font-size-sm); color: var(--i-color-text-secondary); }
.lab__states { display: flex; flex-wrap: wrap; gap: var(--i-spacing-1); }
.lab__stage {
  display: flex;
  flex-wrap: wrap;
  gap: var(--i-spacing-2);
  align-items: center;
  min-height: 72px;
  padding: var(--i-spacing-3);
  border-radius: var(--i-radius-sm);
  background: var(--i-color-bg-muted);
  /* 演示区里的内容再高也不撑破格子：一百多个格子里只要有一个失控，整页就没法扫读 */
  max-height: 240px;
  overflow: auto;
}
.lab__blocked {
  display: flex;
  gap: var(--i-spacing-2);
  align-items: center;
  padding: var(--i-spacing-3);
  border-radius: var(--i-radius-sm);
  background: var(--i-color-bg-muted);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
}
.lab__loading { color: var(--i-color-text-tertiary); font-size: var(--i-font-size-sm); }
</style>
