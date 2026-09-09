<script setup lang="ts">
import { ref } from 'vue'
import IMenu from '@/components/IMenu.vue'
import IAnchor from '@/components/IAnchor.vue'
import IButton from '@/components/IButton.vue'
import ISwitch from '@/components/ISwitch.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import { notification } from '@/components/notification'
import type { MenuItem } from '@i-design/common'

const items: MenuItem[] = [
  { key: 'overview', label: '概览', icon: 'grid' },
  {
    key: 'resource',
    label: '资源',
    icon: 'layers',
    children: [
      { key: 'instance', label: '实例' },
      { key: 'storage', label: '存储' },
      { key: 'network', label: '网络', disabled: true }
    ]
  },
  {
    key: 'billing',
    label: '费用',
    icon: 'file-text',
    children: [
      { key: 'bill', label: '账单' },
      { key: 'budget', label: '预算' }
    ]
  },
  { key: 'settings', label: '设置', icon: 'filter' }
]

const active = ref('instance')
const collapsed = ref(false)
const accordion = ref(true)

const anchors = [
  { key: 'nav-menu', label: '导航菜单' },
  { key: 'nav-anchor', label: '页内锚点' },
  { key: 'nav-notification', label: '通知' }
]
</script>

<template>
  <article>
    <h1>导航与通知</h1>
    <p class="i-lead">
      菜单负责「去哪里」，锚点负责「在这一页的哪儿」，通知负责「有件事需要你知道」。
      三者共用同一套展开与高亮规则。
    </p>

    <h2 id="nav-menu">导航菜单</h2>
    <p>
      选中项的祖先分组会自动展开——从外部跳转过来时，如果不展开，
      用户会看到选中项藏在收起的分组里，以为没跳成功。
    </p>
    <DemoBlock
      title="侧栏菜单"
      description="手风琴模式下同层只展开一个，但祖先始终保留，否则整条路径会一起塌掉。收起态只留图标，鼠标悬停给出名称。"
      lang="vue"
      code='<IMenu :items="items" v-model="active" accordion />'
    >
      <div class="nav-demo">
        <div class="nav-demo__side" :class="{ 'is-collapsed': collapsed }">
          <IMenu :items="items" v-model="active" :accordion="accordion" :collapsed="collapsed" />
        </div>
        <div class="nav-demo__ctrl">
          <label><ISwitch v-model="collapsed" /> 收起为图标栏</label>
          <label><ISwitch v-model="accordion" /> 手风琴</label>
          <p class="nav-demo__value">当前：{{ active }}</p>
        </div>
      </div>
    </DemoBlock>

    <h2 id="nav-anchor">页内锚点</h2>
    <p>
      长文档的章节跳转。判定线不取视口顶端，而是留出吸顶导航的高度——
      否则标题刚滚出视野才切换，读者已经在读下一节了。滚到页面底部时直接选中最后一项，
      因为末尾的短章节永远越不过判定线。
    </p>
    <DemoBlock
      title="跟随滚动"
      description="右侧这组锚点就是本页正在用的，滚动页面可以看到高亮跟着走。"
      lang="vue"
      code='<IAnchor :items="anchors" :offset="80" />'
    >
      <IAnchor :items="anchors" style="max-width: 220px" />
    </DemoBlock>

    <h2 id="nav-notification">通知</h2>
    <p>
      与 Message 的分界：一句话的结果反馈用 Message（居中、自动消失）；
      需要用户读完、甚至去点一下的用 Notification（角落、可常驻、带操作）。
      带操作的通知默认不自动关闭——正要去点，它消失了。
    </p>
    <DemoBlock
      title="四种语气"
      description="状态由图标与其淡底表达，不改整块底色。"
      lang="vue"
      code="notification.success('部署完成', { description: '3 个实例已全部更新到 v2.4.1。' })"
    >
      <div class="nav-demo__buttons">
        <IButton @click="notification.info('有 3 个新工单', { description: '其中 1 个标记为紧急。' })">
          提示
        </IButton>
        <IButton @click="notification.success('部署完成', { description: '3 个实例已全部更新到 v2.4.1。' })">
          成功
        </IButton>
        <IButton @click="notification.warning('配额即将用尽', { description: '当前用量 92%，建议提前扩容。' })">
          警告
        </IButton>
        <IButton
          variant="danger"
          @click="notification.danger('同步失败', {
            description: '上游服务连续三次超时，本次同步已中止。',
            actions: [
              { label: '重试', onClick: () => notification.success('已重新入队') },
              { label: '查看日志', onClick: () => {} }
            ]
          })"
        >
          带操作
        </IButton>
      </div>
    </DemoBlock>
  </article>
</template>

<style scoped>
.nav-demo { display: flex; gap: var(--i-spacing-6); flex-wrap: wrap; }
.nav-demo__side {
  width: 220px;
  padding: var(--i-spacing-2);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-lg);
  background: var(--i-color-bg-elevated);
  transition: width var(--i-motion-base) var(--i-motion-easing);
}
.nav-demo__side.is-collapsed { width: 60px; }
.nav-demo__ctrl { display: grid; gap: var(--i-spacing-3); align-content: start; }
.nav-demo__ctrl label { display: flex; align-items: center; gap: var(--i-spacing-2); font-size: var(--i-font-size-sm); }
.nav-demo__value { color: var(--i-color-text-tertiary); font-size: var(--i-font-size-sm); }
.nav-demo__buttons { display: flex; flex-wrap: wrap; gap: var(--i-spacing-3); }
</style>
