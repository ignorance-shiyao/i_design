<script setup lang="ts">
import IPopover from '@/components/IPopover.vue'
import IDropdown from '@/components/IDropdown.vue'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import { message } from '@/components/message'
import type { DropdownItem } from '@/components/IDropdown.vue'

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
      两者共用同一套定位规则：空间不足时翻到对侧，贴近边缘时推回视口内，
      而箭头始终指向触发元素。因此它们在页面任何位置都不会被裁切，
      也不会出现「气泡指着旁边一个按钮」。
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
  </article>
</template>
