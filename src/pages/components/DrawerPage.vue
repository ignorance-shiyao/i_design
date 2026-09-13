<script setup lang="ts">
import { ref } from 'vue'
import IDrawer from '@/components/IDrawer.vue'
import IButton from '@/components/IButton.vue'
import IInput from '@/components/IInput.vue'
import ITextarea from '@/components/ITextarea.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const right = ref(false)
const left = ref(false)
const bottom = ref(false)
const form = ref(false)
const title = ref('')
const desc = ref('')
</script>

<template>
  <article>
    <h1>Drawer 抽屉</h1>
    <p class="i-lead">
      从屏幕边缘滑出的面板。与 Modal 的取舍：需要保留主页面上下文、或内容较长需要滚动时用抽屉，需要用户立刻二选一时用对话框。
    </p>

    <DemoBlock
      title="四个方向"
      code='<IDrawer v-model="visible" title="详情" placement="right">…</IDrawer>'
    >
      <IButton @click="right = true">右侧</IButton>
      <IButton @click="left = true">左侧</IButton>
      <IButton @click="bottom = true">底部</IButton>

      <IDrawer v-model="right" title="工作项详情">
        WI-1024 登录页支持短信验证码，负责人林岚，本迭代已完成。
      </IDrawer>
      <IDrawer v-model="left" title="筛选条件" placement="left" size="320px">
        按类型、负责人与迭代筛选工作项。
      </IDrawer>
      <IDrawer v-model="bottom" title="批量操作" placement="bottom" size="220px">
        已选中 3 个工作项，可批量修改负责人或迭代。
      </IDrawer>
    </DemoBlock>

    <DemoBlock
      title="表单抽屉"
      description="内容较长的表单适合抽屉：面板可滚动，页脚操作区始终固定在底部。"
      code='<IDrawer v-model="visible" title="新建工作项" :mask-closable="false">
  <IInput v-model="title" placeholder="标题" />
  <ITextarea v-model="desc" :rows="6" />
  <template #footer>
    <IButton variant="text" @click="visible = false">取消</IButton>
    <IButton variant="primary" @click="visible = false">创建</IButton>
  </template>
</IDrawer>'
    >
      <IButton variant="primary" @click="form = true">新建工作项</IButton>
      <IDrawer v-model="form" title="新建工作项" :mask-closable="false">
        <div class="field">
          <label>标题</label>
          <IInput v-model="title" placeholder="请输入标题" />
        </div>
        <div class="field">
          <label>描述</label>
          <ITextarea v-model="desc" :rows="6" placeholder="请输入描述" />
        </div>
        <template #footer>
          <IButton variant="text" @click="form = false">取消</IButton>
          <IButton variant="primary" @click="form = false">创建</IButton>
        </template>
      </IDrawer>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>内容很短、决策很轻时——用弹出框或对话框，抽屉滑出一整条边太重了。</li>
      <li>用户需要一边看列表一边改内容时——抽屉会盖住列表，那种场景该用并排的分栏。</li>
      <li>要在抽屉里再开一层抽屉时——层层叠叠之后没人记得自己在第几层，改用整页或分步。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>modelValue</td><td><code>boolean</code></td><td><code>false</code></td><td>是否可见，支持 v-model</td></tr>
        <tr><td>title</td><td><code>string</code></td><td><code>''</code></td><td>标题</td></tr>
        <tr><td>placement</td><td><code>right | left | top | bottom</code></td><td><code>right</code></td><td>滑出方向</td></tr>
        <tr><td>size</td><td><code>string</code></td><td><code>380px</code></td><td>横向抽屉的宽度 / 纵向抽屉的高度</td></tr>
        <tr><td>maskClosable</td><td><code>boolean</code></td><td><code>true</code></td><td>点击遮罩是否关闭</td></tr>
        <tr><td>closable</td><td><code>boolean</code></td><td><code>true</code></td><td>是否显示关闭按钮</td></tr>
      </tbody>
    </table>
    <p>
      与 Modal 一致：<code>role="dialog" aria-modal="true"</code>，打开时聚焦面板并锁定页面滚动，关闭后把焦点交还触发元素，<code>Esc</code> 始终可关闭。
    </p>
  </article>
</template>

<style scoped>
.field { margin-bottom: var(--i-spacing-4); }
.field label {
  display: block;
  margin-bottom: var(--i-spacing-2);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-secondary);
}
</style>
