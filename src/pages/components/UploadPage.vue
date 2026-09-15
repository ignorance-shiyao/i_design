<script setup lang="ts">
import { ref } from 'vue'
import IUpload from '@/components/IUpload.vue'
import IImportWizard from '@/components/IImportWizard.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import { message } from '@/components/message'
import type { UploadFile } from '@/components/upload'
import {
  dryRun,
  guessMapping,
  importKey,
  type ColumnMapping,
  type DryRunReport
} from '@i-design/common'

/*
 * 导入向导的演示数据：一张三行的「表格」，其中两行有问题。
 *
 * 表头故意起成「联系人」而不是「负责人」——别名匹配得管用，
 * 否则每个客户的表都要手工映一遍；而「金额」那一列故意不存在，
 * 好让「必填字段还没映上」这条 error 一开始就摆在那儿。
 */
const importSources = [
  { key: '客户', sample: '明远制造' },
  { key: '联系人', sample: '林岚' },
  { key: '备注', sample: '急单' }
]
const importFields = [
  { key: 'customer', label: '客户', required: true },
  { key: 'owner', label: '负责人', required: true, aliases: ['联系人'] },
  { key: 'note', label: '备注' },
  { key: 'amount', label: '金额', required: true }
]
const importRows = [
  { 客户: '明远制造', 联系人: '林岚', 备注: '急单' },
  { 客户: '', 联系人: '沈黎', 备注: '' },
  { 客户: '合力重工', 联系人: '', 备注: '含逗号,的备注' }
]
const importMapping = ref<ColumnMapping>(guessMapping(importSources, importFields))
const importReport = ref<DryRunReport | undefined>(undefined)
const importBusy = ref(false)

function runDryRun() {
  importBusy.value = true
  // 预检只跑纯校验器：它拿不到任何写入口，所以不可能落库
  setTimeout(() => {
    importReport.value = dryRun(importRows, (row) => {
      const problems: { column?: string; message: string }[] = []
      for (const field of importFields) {
        if (!field.required) continue
        const source = importMapping.value[field.key]
        const value = source ? (row as Record<string, string>)[source] : ''
        if (!value) problems.push({ column: field.label, message: `${field.label}为空` })
      }
      return problems
    })
    importBusy.value = false
  }, 500)
}

const basic = ref<UploadFile[]>([])
const auto = ref<UploadFile[]>([])
const buttonMode = ref<UploadFile[]>([])

/** 模拟上传：分段推进进度，并按概率失败以便演示重试 */
function fakeRequest(file: File, onProgress: (p: number) => void) {
  return new Promise<{ url: string }>((resolve, reject) => {
    let percent = 0
    const timer = setInterval(() => {
      percent += Math.random() * 22 + 8
      if (percent >= 100) {
        clearInterval(timer)
        // 名字里带 fail 的文件必定失败，方便演示；其余固定成功
        if (file.name.toLowerCase().includes('fail')) reject(new Error('服务端拒绝了该文件'))
        else resolve({ url: `https://cdn.example.com/${file.name}` })
        return
      }
      onProgress(percent)
    }, 260)
  })
}

function onReject(file: File, reason: string) {
  message.warning(`${file.name}：${reason}`)
}
</script>

<template>
  <article>
    <h1>Upload 上传</h1>
    <p class="i-lead">
      把本地文件交给服务端。上传是少数「一定会失败」的交互——网络、体积、格式、权限都可能出问题，所以失败态和重试比成功态更值得设计。
    </p>

    <DemoBlock
      title="拖拽上传"
      description="不传 request 时组件只负责收集文件（状态为 ready），由业务在提交表单时统一上传。"
      lang="vue"
      code='<IUpload v-model="files" accept=".png,.jpg,image/*" :max-size="5" @reject="onReject" />'
    >
      <div class="w">
        <IUpload
          v-model="basic"
          accept=".png,.jpg,.jpeg,image/*"
          :max-size="5"
          @reject="onReject"
        />
      </div>
    </DemoBlock>

    <DemoBlock
      title="自动上传与失败重试"
      description="传入 request 后选中即开始上传；失败的条目保留在列表里并给出重试入口——把文件重新拖一遍是最糟糕的补救方式。试试把文件名改成含 fail 的，会走失败分支。"
      lang="ts"
      code='function request(file: File, onProgress: (p: number) => void) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (e) => onProgress((e.loaded / e.total) * 100)
    xhr.onload = () => (xhr.status < 300 ? resolve(xhr.response) : reject(new Error("上传失败")))
    xhr.open("POST", "/api/upload")
    xhr.send(new FormData().append("file", file))
  })
}

<IUpload v-model="files" :request="request" :max-count="5" />'
    >
      <div class="w">
        <IUpload v-model="auto" :request="fakeRequest" :max-count="5" tip="最多 5 个文件；文件名含 fail 会演示失败重试" @reject="onReject" />
      </div>
    </DemoBlock>

    <DemoBlock
      title="按钮形态"
      description="嵌在表单或工具栏里、空间不足以放拖拽区时使用。"
      lang="vue"
      code='<IUpload v-model="files" variant="button" :multiple="false" tip="仅支持单个文件" />'
    >
      <div class="w">
        <IUpload
          v-model="buttonMode"
          variant="button"
          :multiple="false"
          :max-count="1"
          tip="仅支持单个文件"
          @reject="onReject"
        />
      </div>
    </DemoBlock>

    <h2>导入向导：列映射与预检</h2>
    <p>
      导入向导通常是「上传 → 列映射 → 预校验 → 真正导入」。四步里有三处一做错就会让用户付出真实代价：<strong>预校验不能写业务数据</strong>——预检一旦落库，用户看完报告点了取消，数据已经脏了，而他以为自己什么也没做；<strong>列映射要能回退</strong>——映射是数据，不是一次性的向导步骤；<strong>重发不能导两份</strong>——同一份文件加同一套映射要算出同一个幂等键。
    </p>
    <p>
      映射表按「一行一个目标字段」排，不按来源列排：用户心里的问题是「我这张表里哪一列是客户」，从目标字段出发才答得上；反过来排，必填字段漏没漏映还得自己在脑子里对一遍。自动猜的那一版只按名字与别名<strong>精确</strong>匹配，不做模糊匹配——猜错的成本比没猜到高得多：没猜到用户会去选，猜错了他多半直接点下一步。
    </p>
    <DemoBlock
      title="映射、预检与错误清单"
      description="表头里叫「联系人」，字段叫「负责人」，靠别名自动映上了；而「金额」这一列文件里根本没有，于是「必填字段还没映上」拦住了预检。把「金额」指到「备注」就能往下走——再把「备注」指回去看看：一个来源列被指给别人时会从原处自动摘掉，不会悄悄变成「一列映给两个字段」。预检跑完给出逐行问题，行号是文件里的原始行号，下载下来的 CSV 第一列就是它。"
      lang="vue"
      code='<IImportWizard
  v-model="mapping"
  :sources="headerFromFile"
  :fields="targetFields"
  :report="report"
  @dry-run="runDryRun"
  @submit="startImport"
  @download="(csv) => saveAs(csv)"
/>'
    >
      <div class="import-demo">
        <IImportWizard
          v-model="importMapping"
          :sources="importSources"
          :fields="importFields"
          :report="importReport"
          :busy="importBusy"
          @dry-run="runDryRun"
          @submit="() => message.success(`开始导入，幂等键 ${importKey('demo-file', importMapping)}`)"
          @download="(csv: string) => message.info(`错误清单已交给调用方：${csv.split('\n').length - 1} 行`)"
        />
      </div>
    </DemoBlock>

    <h2>校验</h2>
    <p>
      浏览器原生的 <code>accept</code> 只过滤文件选择框，<strong>拖拽进来的文件不受它约束</strong>，因此组件对类型、体积、数量做了二次校验。被拒的文件通过 <code>reject</code>事件抛出而非静默丢弃——用户需要知道为什么少了一个文件。
    </p>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>文件很大且网络不稳时——先做分片与断点续传，一个进度条撑不住一次失败。</li>
      <li>用户其实是要粘贴一段文本时——给一个文本框，不要逼人先存成文件。</li>
      <li>格式要求很严时——在选文件之前就把要求写出来，等上传完再报错是浪费一次等待。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>modelValue</td><td><code>UploadFile[]</code></td><td><code>[]</code></td><td>文件列表，支持 v-model</td></tr>
        <tr><td>accept</td><td><code>string</code></td><td><code>''</code></td><td>支持扩展名与 MIME，如 <code>.png,image/*</code></td></tr>
        <tr><td>multiple</td><td><code>boolean</code></td><td><code>true</code></td><td>是否可多选</td></tr>
        <tr><td>maxSize</td><td><code>number</code></td><td><code>0</code></td><td>单文件大小上限（MB），0 表示不限</td></tr>
        <tr><td>maxCount</td><td><code>number</code></td><td><code>0</code></td><td>文件数量上限，0 表示不限</td></tr>
        <tr><td>variant</td><td><code>drag | button</code></td><td><code>drag</code></td><td>拖拽区或按钮</td></tr>
        <tr><td>tip</td><td><code>string</code></td><td><code>''</code></td><td>辅助说明；留空时按 accept / maxSize 自动生成</td></tr>
        <tr><td>request</td><td><code>(file, onProgress) =&gt; Promise</code></td><td>—</td><td>自定义上传实现；不传则只收集文件</td></tr>
        <tr><td>disabled</td><td><code>boolean</code></td><td><code>false</code></td><td>是否禁用</td></tr>
      </tbody>
    </table>
    <table class="i-table">
      <thead><tr><th>事件</th><th>回调参数</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>change</td><td><code>UploadFile[]</code></td><td>列表变化（新增、移除、状态更新）</td></tr>
        <tr><td>success</td><td><code>UploadFile</code></td><td>单个文件上传成功</td></tr>
        <tr><td>error</td><td><code>(file, message)</code></td><td>单个文件上传失败</td></tr>
        <tr><td>reject</td><td><code>(file: File, reason)</code></td><td>校验未通过，未进入列表</td></tr>
      </tbody>
    </table>

    <h3>UploadFile</h3>
    <table class="i-table">
      <thead><tr><th>字段</th><th>类型</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>uid</td><td><code>string</code></td><td>列表内唯一标识；重传复用同一个 id，列表不跳位</td></tr>
        <tr><td>name / size</td><td><code>string / number</code></td><td>文件名与字节数</td></tr>
        <tr><td>status</td><td><code>ready | uploading | success | error</code></td><td>当前状态</td></tr>
        <tr><td>percent</td><td><code>number</code></td><td>0-100</td></tr>
        <tr><td>error</td><td><code>string</code></td><td>失败原因，直接展示给用户</td></tr>
        <tr><td>response</td><td><code>unknown</code></td><td>request 成功时的返回值</td></tr>
        <tr><td>raw</td><td><code>File</code></td><td>原始文件对象</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.import-demo { width: min(640px, 100%); }

.w { width: 100%; max-width: 480px; }
</style>
