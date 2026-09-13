<script setup lang="ts">
import { ref } from 'vue'
import IModal from '@/components/IModal.vue'
import IButton from '@/components/IButton.vue'
import IInput from '@/components/IInput.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import { confirm as confirmBox } from '@/components/confirm'

const basic = ref(false)
const form = ref(false)
const confirm = ref(false)
const title = ref('')

const lastResult = ref('（还没操作）')

async function askDelete() {
  try {
    await confirmBox.confirm({
      title: '删除这条迭代？',
      content: '迭代里的 12 个工作项会一并移入回收站，30 天后彻底清除。',
      confirmText: '删除',
      danger: true
    })
    lastResult.value = '用户确认了删除'
  } catch {
    lastResult.value = '用户取消了'
  }
}

async function askName() {
  try {
    const name = await confirmBox.prompt({
      title: '新建迭代',
      placeholder: '例如 2026 Q2 第三迭代',
      required: true,
      requiredMessage: '迭代名不能为空',
      validate: (value) => (value.trim().length > 20 ? '不超过 20 个字' : null)
    })
    lastResult.value = `新建了「${name}」`
  } catch {
    lastResult.value = '用户取消了'
  }
}

async function tellDone() {
  await confirmBox.alert({ title: '已提交', content: '审批结果会在一个工作日内通知你。' })
  lastResult.value = '用户读完了提示'
}
</script>

<template>
  <article>
    <h1>Modal 对话框</h1>
    <p class="i-lead">
      打断当前流程，要求用户先处理一件事。信息型提示请用 Alert，不要用对话框——它的打断成本很高。
    </p>

    <DemoBlock
      title="基础用法"
      description="默认点击遮罩或按 Esc 可关闭。"
      code='<IButton @click="visible = true">打开对话框</IButton>

<IModal v-model="visible" title="迭代说明">
  本迭代已冻结，如需变更请联系迭代负责人。
  <template #footer>
    <IButton variant="primary" @click="visible = false">我知道了</IButton>
  </template>
</IModal>'
    >
      <IButton @click="basic = true">打开对话框</IButton>
      <IModal v-model="basic" title="迭代说明">
        本迭代已冻结，如需变更请联系迭代负责人。
        <template #footer>
          <IButton variant="primary" @click="basic = false">我知道了</IButton>
        </template>
      </IModal>
    </DemoBlock>

    <DemoBlock
      title="表单对话框"
      description="表单类对话框建议关闭 maskClosable，避免误点遮罩丢失已填内容。"
      code='<IModal v-model="visible" title="新建工作项" :mask-closable="false" width="420px">
  <IInput v-model="title" placeholder="请输入标题" />
  <template #footer>
    <IButton variant="text" @click="visible = false">取消</IButton>
    <IButton variant="primary" @click="visible = false">创建</IButton>
  </template>
</IModal>'
    >
      <IButton variant="primary" @click="form = true">新建工作项</IButton>
      <IModal v-model="form" title="新建工作项" :mask-closable="false" width="420px">
        <IInput v-model="title" placeholder="请输入标题" />
        <template #footer>
          <IButton variant="text" @click="form = false">取消</IButton>
          <IButton variant="primary" @click="form = false">创建</IButton>
        </template>
      </IModal>
    </DemoBlock>

    <DemoBlock
      title="破坏性确认"
      description="不可逆操作使用 danger 按钮，并在正文中说明后果与影响范围。"
      code='<IModal v-model="visible" title="删除迭代" :mask-closable="false">
  删除后该迭代下的 24 个工作项将一并移入回收站，此操作不可撤销。
  <template #footer>
    <IButton variant="text" @click="visible = false">取消</IButton>
    <IButton variant="danger" @click="visible = false">确认删除</IButton>
  </template>
</IModal>'
    >
      <IButton variant="danger" @click="confirm = true">删除迭代</IButton>
      <IModal v-model="confirm" title="删除迭代" :mask-closable="false">
        删除后该迭代下的 24 个工作项将一并移入回收站，此操作不可撤销。
        <template #footer>
          <IButton variant="text" @click="confirm = false">取消</IButton>
          <IButton variant="danger" @click="confirm = false">确认删除</IButton>
        </template>
      </IModal>
    </DemoBlock>

    <h2>命令式确认框</h2>
    <p>
      「删除吗？」这种一次性的询问不值得在页面里养一个 <code>visible</code>：状态的生命周期只有那三秒，却要占一个 ref、一段模板和一个回调。<code>confirm</code> 把它折成一次 <code>await</code>。
    </p>
    <p>
      取消走 reject 而不是 <code>resolve(false)</code>：<code>await</code> 之后那几行就是「用户同意了才做的事」，不必再缩进一层 <code>if</code>。不想处理拒绝时<code>.catch(() =&gt; {})</code> 一笔带过。
    </p>
    <p>
      按钮顺序是取消在左、确认在右——对话框是一条从左读到右的句子，确认是句尾的动作。反过来放的话，视线读完正文落在右边，右边却是「取消」，最容易点到的位置放的是放弃操作。破坏性操作把主按钮换成危险色，并且默认不允许点遮罩关闭：那一下太容易误触，而它旁边就是「确定」。
    </p>

    <DemoBlock
      title="三种用法"
      description="prompt 的校验不通过时对话框不会关闭，错误文案跟在输入框下面——只把边框变红的话，色觉障碍用户看到的是「按了确定没反应」。"
      code="import { confirm } from '@i-design/vue-next'

await confirm.confirm({ title: '删除这条迭代？', danger: true })
const name = await confirm.prompt({ title: '新建迭代', required: true })
await confirm.alert({ title: '已提交' })"
    >
      <div class="confirm-demo">
        <div class="confirm-demo__actions">
          <IButton variant="danger" @click="askDelete">删除迭代</IButton>
          <IButton @click="askName">新建迭代</IButton>
          <IButton variant="text" @click="tellDone">提示</IButton>
        </div>
        <p class="confirm-demo__result">上一次的结果：{{ lastResult }}</p>
      </div>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>内容长到要在对话框里滚动时——那是一个页面，不是一个对话框。</li>
      <li>只是确认一次轻量操作时——用 Popconfirm，就地问一句，不必让整页失焦。</li>
      <li>要在对话框里再开一个对话框时——重新想一下流程，层层叠叠之后用户不知道关掉哪一层会丢什么。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>modelValue</td><td><code>boolean</code></td><td><code>false</code></td><td>是否可见，支持 v-model</td></tr>
        <tr><td>title</td><td><code>string</code></td><td><code>''</code></td><td>标题</td></tr>
        <tr><td>width</td><td><code>string</code></td><td><code>480px</code></td><td>面板宽度</td></tr>
        <tr><td>maskClosable</td><td><code>boolean</code></td><td><code>true</code></td><td>点击遮罩是否关闭</td></tr>
        <tr><td>closable</td><td><code>boolean</code></td><td><code>true</code></td><td>是否显示右上角关闭按钮</td></tr>
      </tbody>
    </table>
    <table class="i-table">
      <thead><tr><th>插槽 / 事件</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>default</td><td>对话框正文</td></tr>
        <tr><td>footer</td><td>底部操作区，未提供时不渲染</td></tr>
        <tr><td>close</td><td>关闭时触发（遮罩、关闭按钮、Esc 均会触发）</td></tr>
      </tbody>
    </table>

    <h2>无障碍</h2>
    <p>
      面板渲染为 <code>role="dialog" aria-modal="true"</code>，打开时自动获得焦点并锁定页面滚动，关闭后把焦点交还给触发元素。<code>Esc</code> 始终可关闭。
    </p>
  </article>
</template>

<style scoped>
.confirm-demo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--i-spacing-4);
}
.confirm-demo__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--i-spacing-2);
}
.confirm-demo__result {
  margin: 0;
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-secondary);
}
</style>
