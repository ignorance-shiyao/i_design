<script setup lang="ts">
import IPopover from '@/components/IPopover.vue'
import IDropdown from '@/components/IDropdown.vue'
import IButton from '@/components/IButton.vue'
import ITour from '@/components/ITour.vue'
import { ref } from 'vue'
import type { TourStep } from '@i-design/common'
import DemoBlock from '@/site/DemoBlock.vue'
import { message } from '@/components/message'
import type { DropdownItem } from '@/components/IDropdown.vue'

const tourStep = ref(-1)
const tourSteps: TourStep[] = [
  {
    target: '#tour-a',
    title: '从这里开始',
    description: '第一步指向的是页面上真实存在的元素——引导要贴着界面走，脱离界面的图文说明读者看完还是找不到入口。',
    placement: 'bottom'
  },
  {
    target: '#tour-b',
    title: '换个方向',
    description: '气泡的落位复用 Tooltip 那套定位规则：放不下就翻到对面，再夹回视口，不会有半个气泡露在屏幕外。',
    placement: 'right'
  },
  {
    target: '#tour-c',
    title: '最后一步',
    description: '末步的按钮写「我知道了」而不是「下一步」——按下去引导就结束了，按钮上得说清楚。',
    placement: 'top'
  }
]

const items: DropdownItem[] = [
  { key: 'edit', label: '编辑', icon: 'edit', hint: 'E' },
  { key: 'copy', label: '复制链接', icon: 'copy', hint: '⌘C' },
  { key: 'd1', divider: true },
  { key: 'archive', label: '归档', icon: 'folder' },
  { key: 'delete', label: '删除', icon: 'trash', danger: true, hint: '⌫' }
]

const grouped: DropdownItem[] = [
  { key: 'g1', group: '视图' },
  { key: 'list', label: '列表' },
  { key: 'board', label: '看板' },
  { key: 'g2', group: '导出' },
  { key: 'csv', label: '导出 CSV' },
  { key: 'pdf', label: '导出 PDF', disabled: true }
]
</script>

<template>
  <article>
    <h1>Popover 气泡卡片 / Dropdown 下拉菜单</h1>
    <p class="i-lead">
      两者共用同一套定位规则：空间不足时翻到对侧，贴近边缘时推回视口内，而箭头始终指向触发元素。因此它们在页面任何位置都不会被裁切，也不会出现「气泡指着旁边一个按钮」。
    </p>

    <DemoBlock
      title="气泡卡片"
      description="承载比文字提示更复杂的内容。与 Tooltip 的分界：只有一句话说明用 Tooltip，需要标题、段落或可交互元素时用 Popover。"
      lang="vue"
      code='<IPopover title="迭代容量" content="按最近三个迭代的完成量估算。">
  <IButton>查看说明</IButton>
</IPopover>'
    >
      <IPopover title="迭代容量" content="按最近三个迭代的完成量估算，仅供参考。">
        <IButton>查看说明</IButton>
      </IPopover>

      <IPopover trigger="hover" placement="bottom" title="悬浮触发" content="适合纯说明性内容。">
        <IButton>悬浮查看</IButton>
      </IPopover>
    </DemoBlock>

    <DemoBlock
      title="下拉菜单"
      description="收纳次级操作，避免一行摆满按钮。支持方向键导航、Home 跳首项、Esc 关闭，关闭后焦点回到触发元素。"
      lang="vue"
      code='<IDropdown :items="items" @select="onSelect">
  <IButton>更多操作</IButton>
</IDropdown>'
    >
      <IDropdown :items="items" @select="(key) => message.success(`执行：${key}`)">
        <IButton>更多操作</IButton>
      </IDropdown>

      <IDropdown :items="grouped" @select="(key) => message.info(`切换到：${key}`)">
        <IButton>视图与导出</IButton>
      </IDropdown>
    </DemoBlock>

    <DemoBlock
      title="边缘避让"
      description="把菜单放在页面最右侧：它会自动推回视口内，而不是被裁掉。这一条无法靠肉眼在开发机上发现，因此定位规则是可测试的纯函数。"
      lang="vue"
      code='<!-- 无需额外配置，避让是默认行为 -->
<IDropdown :items="items" placement="bottom" />'
    >
      <div style="display: flex; justify-content: flex-end">
        <IDropdown :items="items" @select="(key) => message.success(`执行：${key}`)">
          <IButton>贴右缘的菜单</IButton>
        </IDropdown>
      </div>
    </DemoBlock>
    <h2>Tour 新手引导</h2>
    <p>
      遮罩用一个带「洞」的 SVG，而不是四条挡板拼出来的：四条挡板对不上圆角，目标是圆角按钮时四个角会漏出暗色的直角，很显眼。高亮框向外扩一圈再描边——贴着元素边缘挖出来的洞看起来像元素被裁掉了一块，而且元素自身的外阴影、
      focus 环会落在洞外的暗区里，显得断开。
    </p>
    <p>
      气泡落位直接复用 <code>logic/overlay</code>：与 Tooltip、Dropdown 同一套翻转与夹取规则，不会有半个气泡露在屏幕外。目标不在视口里时先把它滚到正中，而不是滚到刚好露出来——刚好露出来时气泡多半就没地方放了，会被挤到另一侧，读者得先找一遍气泡在哪。
    </p>
    <DemoBlock
      title="分步指向界面上的关键位置"
      description="Esc 跳过，方向键前后走。目标元素不存在时（页面还没渲染到那一块）不画洞、气泡居中，引导仍然能走完，而不是卡在半路。"
      code='<ITour v-model="step" :steps="steps" />'
    >
      <div class="tour-demo">
        <IButton id="tour-a" @click="tourStep = 0">开始引导</IButton>
        <IButton id="tour-b" variant="secondary">第二个目标</IButton>
        <IButton id="tour-c" variant="secondary">第三个目标</IButton>
      </div>
      <ITour v-model="tourStep" :steps="tourSteps" />
    </DemoBlock>
    <h2>什么时候不该用它</h2>
    <ul>
      <li>内容是页面主线时——浮层一关就没了，主线内容该留在页面上。</li>
      <li>浮层里还要再开浮层时——层层叠叠之后没人知道关掉一层会丢什么，改用整页或分步。</li>
      <li>触屏为主时——悬停触发的浮层在那里根本摸不到，改成点击触发。</li>
    </ul>
  </article>
</template>

<style scoped>
.tour-demo { display: flex; gap: var(--i-spacing-3); flex-wrap: wrap; }
</style>
