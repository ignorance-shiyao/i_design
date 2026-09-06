<script setup lang="ts">
import { ref } from 'vue'
import IModal from '@/components/IModal.vue'
import IButton from '@/components/IButton.vue'
import IInput from '@/components/IInput.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const basic = ref(false)
const form = ref(false)
const confirm = ref(false)
const title = ref('')
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
      面板渲染为 <code>role="dialog" aria-modal="true"</code>，打开时自动获得焦点并锁定页面滚动，
      关闭后把焦点交还给触发元素。<code>Esc</code> 始终可关闭。
    </p>
  </article>
</template>
