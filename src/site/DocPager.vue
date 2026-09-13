<script setup lang="ts">
/**
 * 文档页底部的上一页 / 下一页。
 *
 * **为什么放在正文末尾，而不是只靠侧栏。** 窄屏上侧栏是收起来的抽屉，
 * 读完一页想看下一个组件，得先点开抽屉、在几十个入口里找到自己刚才那一项、
 * 再点它下面那一个——而「下一个」这件事本身不需要一次查找。
 * 读到底正好就是想翻页的时刻，入口摆在那里最省事。
 *
 * **两个方向都显示分组名。** 只写组件名的话，跨组的那一次跳转看起来像
 * 跳到了不相干的地方；写上「导航 · Tabs 标签页」，读者就知道自己刚离开一组。
 *
 * **到头的那一侧留空，不放灰按钮。** 一个点不动的按钮要读者试一下才知道
 * 没有下一页；空着则一眼就看得出这是最后一篇。
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { docNeighbours } from '@/data/nav'
import IIcon from '@/components/IIcon.vue'

const route = useRoute()
const neighbours = computed(() => docNeighbours(route.path))
</script>

<template>
  <nav
    v-if="neighbours.prev || neighbours.next"
    class="doc-pager"
    aria-label="上一页与下一页"
  >
    <RouterLink
      v-if="neighbours.prev"
      class="doc-pager__link doc-pager__link--prev"
      :to="neighbours.prev.to"
    >
      <span class="doc-pager__dir">
        <IIcon name="chevron-left" :size="14" />
        上一页
      </span>
      <span class="doc-pager__group">{{ neighbours.prev.group }}</span>
      <span class="doc-pager__label">{{ neighbours.prev.label }}</span>
    </RouterLink>
    <!-- 只有一侧时用空格子占位，剩下那一个才不会跑到中间去 -->
    <span v-else class="doc-pager__blank" aria-hidden="true" />

    <RouterLink
      v-if="neighbours.next"
      class="doc-pager__link doc-pager__link--next"
      :to="neighbours.next.to"
    >
      <span class="doc-pager__dir">
        下一页
        <IIcon name="chevron-right" :size="14" />
      </span>
      <span class="doc-pager__group">{{ neighbours.next.group }}</span>
      <span class="doc-pager__label">{{ neighbours.next.label }}</span>
    </RouterLink>
    <span v-else class="doc-pager__blank" aria-hidden="true" />
  </nav>
</template>

<style scoped>
.doc-pager {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--i-spacing-3);
  margin-top: var(--i-spacing-10);
  padding-top: var(--i-spacing-6);
  border-top: 1px solid var(--i-color-hairline);
}
.doc-pager__link {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: var(--i-spacing-3) var(--i-spacing-4);
  /* 四边等宽的发丝线：方向由图标与「上一页 / 下一页」四个字说，不靠加粗某一边 */
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-lg);
  background: var(--i-color-bg-elevated);
  text-decoration: none;
  transition: border-color var(--i-motion-fast) var(--i-motion-easing),
    background var(--i-motion-fast) var(--i-motion-easing);
}
.doc-pager__link:hover {
  border-color: var(--i-color-border-strong);
  background: var(--i-color-bg-subtle);
}
.doc-pager__link:focus-visible {
  outline: 2px solid var(--i-color-brand);
  outline-offset: 2px;
}
/* 下一页靠右对齐：翻页控件的方向感来自它贴着哪一边 */
.doc-pager__link--next { align-items: flex-end; text-align: right; }

.doc-pager__dir {
  display: inline-flex;
  align-items: center;
  gap: var(--i-spacing-1);
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-tertiary);
}
.doc-pager__group {
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-tertiary);
}
.doc-pager__label {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 100%;
  font-size: var(--i-font-size-md);
  font-weight: 500;
  color: var(--i-color-text);
}
.doc-pager__link:hover .doc-pager__label { color: var(--i-color-brand-text); }

@media (max-width: 560px) {
  /*
   * 窄屏排成上下两格。并排时每格只剩一百多像素，组件名几乎全被省略号吃掉——
   * 而「下一页是哪一个」正是这个控件唯一要说的事。
   */
  .doc-pager { grid-template-columns: 1fr; }
  .doc-pager__blank { display: none; }
}
</style>
