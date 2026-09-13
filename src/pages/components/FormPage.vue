<script setup lang="ts">
import { reactive, ref } from 'vue'
import IForm from '@/components/IForm.vue'
import IFormItem from '@/components/IFormItem.vue'
import IInput from '@/components/IInput.vue'
import ITextarea from '@/components/ITextarea.vue'
import ISelect from '@/components/ISelect.vue'
import IRadio from '@/components/IRadio.vue'
import IRadioGroup from '@/components/IRadioGroup.vue'
import ICheckbox from '@/components/ICheckbox.vue'
import ISwitch from '@/components/ISwitch.vue'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import { message } from '@/components/message'
import type { FormRule } from '@/components/validate'

const formRef = ref<InstanceType<typeof IForm> | null>(null)

const model = reactive({
  title: '',
  type: null as string | number | null,
  owner: '',
  priority: 'normal',
  points: '',
  desc: '',
  notify: true,
  agree: false
})

const typeOptions = [
  { label: '需求', value: 'requirement' },
  { label: '缺陷', value: 'bug' },
  { label: '任务', value: 'task' }
]

// 模拟服务端查重：异步 validator 返回字符串即视为不通过
const takenTitles = ['登录页支持短信验证码']
const rules: Record<string, FormRule[]> = {
  title: [
    { required: true, message: '请输入工作项标题' },
    { min: 4, max: 40, message: '标题需为 4-40 个字符' },
    {
      trigger: 'blur',
      validator: async (value) => {
        await new Promise((r) => setTimeout(r, 300))
        return takenTitles.includes(String(value)) ? '该标题已存在，换一个吧' : true
      }
    }
  ],
  type: [{ required: true, message: '请选择工作项类型' }],
  owner: [
    { required: true, message: '请输入负责人工号' },
    { pattern: /^[A-Z]\d{5}$/, message: '工号格式为 1 位大写字母 + 5 位数字，如 A10086' }
  ],
  points: [
    {
      validator: (value) => {
        if (value === '' || value === null) return true
        const n = Number(value)
        if (Number.isNaN(n)) return '请输入数字'
        return n > 0 && n <= 13 ? true : '故事点需在 1-13 之间'
      }
    }
  ],
  agree: [{ validator: (value) => (value === true ? true : '请先确认提交规范')}]
}

const submitted = ref('')

function onSubmit(data: Record<string, any>) {
  submitted.value = JSON.stringify(data, null, 2)
  message.success('校验通过，已提交')
}

function onInvalid(errors: Record<string, string>) {
  message.error(`还有 ${Object.keys(errors).length} 项未通过校验`)
}

function reset() {
  Object.assign(model, {
    title: '',
    type: null,
    owner: '',
    priority: 'normal',
    points: '',
    desc: '',
    notify: true,
    agree: false
  })
  formRef.value?.clearValidate()
  submitted.value = ''
}
</script>

<template>
  <article>
    <h1>Form 表单</h1>
    <p class="i-lead">
      把一组输入组织成一次提交。校验的分寸最要紧：用户还在填的时候不打断，离开字段或提交时才给出反馈——错误提示是帮助，不是催促。
    </p>

    <DemoBlock
      title="完整示例"
      description="包含必填、长度、正则、自定义与异步校验（标题「登录页支持短信验证码」会触发查重失败）。"
      code='const model = reactive({ title: "", type: null, owner: "" })

const rules = {
  title: [
    { required: true, message: "请输入工作项标题" },
    { min: 4, max: 40, message: "标题需为 4-40 个字符" },
    { trigger: "blur", validator: async (v) => await checkUnique(v) }
  ],
  owner: [{ pattern: /^[A-Z]\d{5}$/, message: "工号格式如 A10086" }]
}

<IForm ref="formRef" :model="model" :rules="rules" @submit="onSubmit" @invalid="onInvalid">
  <IFormItem prop="title" label="标题">
    <template #default="{ id, invalid }">
      <IInput :id="id" v-model="model.title" :invalid="invalid" />
    </template>
  </IFormItem>
  <IButton type="submit" variant="primary">提交</IButton>
</IForm>'
    >
      <div class="form-wrap">
        <IForm
          ref="formRef"
          :model="model"
          :rules="rules"
          label-width="104px"
          @submit="onSubmit"
          @invalid="onInvalid"
        >
          <IFormItem prop="title" label="标题">
            <template #default="{ invalid }">
              <IInput v-model="model.title" :invalid="invalid" placeholder="请输入工作项标题" />
            </template>
          </IFormItem>

          <IFormItem prop="type" label="类型">
            <template #default="{ invalid }">
              <ISelect v-model="model.type" :options="typeOptions" :invalid="invalid" />
            </template>
          </IFormItem>

          <IFormItem prop="owner" label="负责人工号" help="示例：A10086">
            <template #default="{ invalid }">
              <IInput v-model="model.owner" :invalid="invalid" placeholder="请输入工号" />
            </template>
          </IFormItem>

          <IFormItem label="优先级">
            <IRadioGroup v-model="model.priority" variant="button">
              <IRadio value="low">低</IRadio>
              <IRadio value="normal">中</IRadio>
              <IRadio value="high">高</IRadio>
            </IRadioGroup>
          </IFormItem>

          <IFormItem prop="points" label="故事点" help="选填，1-13">
            <template #default="{ invalid }">
              <IInput v-model="model.points" :invalid="invalid" placeholder="留空表示未估算" />
            </template>
          </IFormItem>

          <IFormItem prop="desc" label="描述">
            <template #default="{ id }">
              <ITextarea :id="id" v-model="model.desc" :rows="3" :maxlength="200" show-count />
            </template>
          </IFormItem>

          <IFormItem label="通知负责人">
            <template #default="{ id }">
              <ISwitch :id="id" v-model="model.notify" />
            </template>
          </IFormItem>

          <IFormItem prop="agree">
            <ICheckbox v-model="model.agree">我已阅读并遵守工作项提交规范</ICheckbox>
          </IFormItem>

          <IFormItem>
            <div class="row">
              <IButton variant="primary" type="submit" @click="formRef?.validate()">提交</IButton>
              <IButton @click="reset">重置</IButton>
            </div>
          </IFormItem>
        </IForm>

        <pre v-if="submitted" class="result"><code>{{ submitted }}</code></pre>
      </div>
    </DemoBlock>

    <h2>校验时机</h2>
    <p>三条规则决定什么时候报错，目的都是不在用户还在输入时打断他：</p>
    <table class="i-table">
      <thead><tr><th>时机</th><th>行为</th></tr></thead>
      <tbody>
        <tr><td>输入过程中</td><td>首次提交前不主动报错；若该字段已有错误，则边改边重新校验，让错误尽快消失</td></tr>
        <tr><td>离开字段（blur）</td><td>校验该字段，包含 <code>trigger: 'blur'</code> 的规则（异步查重通常放在这里）</td></tr>
        <tr><td>提交时</td><td>并行校验全部字段；此后输入过程中的每次变化都会立即重新校验</td></tr>
      </tbody>
    </table>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>只有一个输入框、回车即走时——用输入框本身（搜索框、加一项），套一层表单是多余的仪式。</li>
      <li>字段超过一屏还在增加时——拆成分步，一屏填不完的表单放弃率极高。</li>
      <li>校验要靠一次网络往返、而用户每敲一个键就触发一次时——那是在打断人，改成失焦或提交时校验。</li>
    </ul>

    <h2>API</h2>
    <h3>IForm</h3>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>model</td><td><code>Record&lt;string, any&gt;</code></td><td>—</td><td>表单数据对象，必填</td></tr>
        <tr><td>rules</td><td><code>Record&lt;string, FormRule[]&gt;</code></td><td><code>{}</code></td><td>按字段名声明的规则</td></tr>
        <tr><td>labelWidth</td><td><code>string</code></td><td><code>96px</code></td><td>左侧标签宽度</td></tr>
        <tr><td>labelPlacement</td><td><code>left | top</code></td><td><code>left</code></td><td>标签位置，窄容器用 top</td></tr>
        <tr><td>disabled</td><td><code>boolean</code></td><td><code>false</code></td><td>整表禁用</td></tr>
      </tbody>
    </table>
    <table class="i-table">
      <thead><tr><th>事件 / 方法</th><th>签名</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>submit</td><td><code>(model) =&gt; void</code></td><td>校验通过后触发</td></tr>
        <tr><td>invalid</td><td><code>(errors: Record&lt;string, string&gt;) =&gt; void</code></td><td>校验失败时触发，含逐字段错误</td></tr>
        <tr><td>validate()</td><td><code>() =&gt; Promise&lt;{ valid, errors }&gt;</code></td><td>手动校验全部字段</td></tr>
        <tr><td>clearValidate()</td><td><code>() =&gt; void</code></td><td>清除全部错误并回到「未提交」状态</td></tr>
      </tbody>
    </table>

    <h3>IFormItem</h3>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>prop</td><td><code>string</code></td><td><code>''</code></td><td>对应字段名；不传则只做布局不校验</td></tr>
        <tr><td>label</td><td><code>string</code></td><td><code>''</code></td><td>标签文案</td></tr>
        <tr><td>rules</td><td><code>FormRule[]</code></td><td>—</td><td>覆盖 Form 上该字段的规则</td></tr>
        <tr><td>required</td><td><code>boolean</code></td><td>—</td><td>仅控制星号显示，默认由规则推导</td></tr>
        <tr><td>help</td><td><code>string</code></td><td><code>''</code></td><td>辅助说明，出错时让位给错误信息</td></tr>
      </tbody>
    </table>
    <p>
      默认插槽提供作用域参数 <code>{ id, invalid }</code>：把 <code>invalid</code>透传给控件即可让边框转为危险色，无需在业务里重复维护错误状态。
    </p>

    <h3>FormRule</h3>
    <table class="i-table">
      <thead><tr><th>字段</th><th>类型</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>required</td><td><code>boolean</code></td><td>必填；空字符串、空数组、null 均视为空</td></tr>
        <tr><td>min / max</td><td><code>number</code></td><td>字符串按长度、数组按元素数、数字按大小</td></tr>
        <tr><td>pattern</td><td><code>RegExp</code></td><td>正则匹配</td></tr>
        <tr><td>validator</td><td><code>(value) =&gt; boolean | string | Promise&lt;…&gt;</code></td><td>自定义；返回字符串即为错误信息，支持异步</td></tr>
        <tr><td>message</td><td><code>string</code></td><td>该条规则的错误提示</td></tr>
        <tr><td>trigger</td><td><code>change | blur | both</code></td><td>触发时机，默认 both</td></tr>
      </tbody>
    </table>
    <p>
      规则按声明顺序依次执行，遇到第一条不通过即停止——用户一次只需要看到一个错误。非必填字段留空时会跳过其余规则，因此「选填但有格式要求」的字段可以正常留空。
    </p>
  </article>
</template>

<style scoped>
.form-wrap { width: 100%; max-width: 560px; }
.row { display: flex; gap: var(--i-spacing-2); }
.result {
  margin-top: var(--i-spacing-5);
  padding: var(--i-spacing-4);
  background: var(--i-color-bg-subtle);
  border: 1px solid var(--i-color-border);
  border-radius: var(--i-radius-md);
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-secondary);
  overflow-x: auto;
}
</style>
