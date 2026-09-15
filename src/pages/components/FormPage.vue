<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
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
import ISchemaForm from '@/components/ISchemaForm.vue'
import IFormPage from '@/components/IFormPage.vue'
import IDrawerForm from '@/components/IDrawerForm.vue'
import IModalForm from '@/components/IModalForm.vue'
import IStepForm from '@/components/IStepForm.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import type { FormSchema, SubmitPhase } from '@i-design/common'
import { message } from '@/components/message'
import type { FormRule } from '@/components/validate'

const formRef = ref<InstanceType<typeof IForm> | null>(null)

/*
 * 表单页壳的演示状态。
 *
 * initial 是「打开这张表时的样子」——这里模拟编辑一条已有记录，
 * 所以它不是空的；新建态下传空对象即可。
 * 提交故意做成第一次必失败：真正要看的是「失败之后输入还在、还能再交一次」，
 * 而一个永远成功的示例把这条最要紧的行为藏起来了。
 */
const hostValues = ref<Record<string, unknown>>({ title: '春季补货', owner: '林岚' })
const hostInitial = { title: '春季补货', owner: '林岚' }
const hostPhase = ref<SubmitPhase>('idle')
const hostAttempts = ref(0)

function hostSubmit() {
  hostPhase.value = 'submitting'
  setTimeout(() => {
    hostAttempts.value += 1
    // 第一次失败、第二次成功：两条路径在一个示例里都走得到
    hostPhase.value = hostAttempts.value === 1 ? 'failed' : 'succeeded'
    message[hostPhase.value === 'failed' ? 'error' : 'success'](
      hostPhase.value === 'failed' ? '提交失败：编号重复。输入都还在' : '提交成功'
    )
  }, 1200)
}

/*
 * 浮层表单壳的演示状态。两个壳共用同一份判断，所以这里也共用同一组字段——
 * 要看的是「关闭这个动作本身会不会被拦住」，抽屉与弹窗在这件事上没有区别。
 */
const overlayValues = ref<Record<string, unknown>>({ title: '春季补货' })
const overlayInitial = { title: '春季补货' }
const drawerOpen = ref(false)
const modalOpen = ref(false)

/*
 * 分步表单的演示状态。
 *
 * 错误故意来自「服务端」而不是即时校验，因为跳回那条路只在这种情况下才发生：
 * 第一步当场就能查出来的错，根本走不出第一步——是提交时服务端说「第 1 步那个
 * 编号不对」，而用户正站在第三步，这才需要把他带回去。
 *
 * 判定是「编号不以 PO- 开头」。改动编号时把服务端错误清掉，否则用户改对了
 * 按钮还是灰的。
 */
const stepSpecs = [
  { key: 'base', title: '基本信息', fields: ['code', 'title'] },
  { key: 'addr', title: '收货地址', fields: ['addr'] },
  { key: 'note', title: '备注', fields: ['note'], optional: true }
]
const stepValues = ref<Record<string, unknown>>({ code: 'X-1', title: '', addr: '', note: '' })
const stepPhase = ref<SubmitPhase>('idle')
const stepErrors = ref<string[]>([])

function setStepValue(key: string, value: string) {
  stepValues.value = { ...stepValues.value, [key]: value }
  // 改到哪个字段就把它身上的服务端错误清掉：改对了按钮还是灰的最让人火大
  if (stepErrors.value.includes(key)) {
    stepErrors.value = stepErrors.value.filter((p) => p !== key)
    stepPhase.value = 'idle'
  }
}

function stepSubmit() {
  stepPhase.value = 'submitting'
  setTimeout(() => {
    const ok = String(stepValues.value.code ?? '').startsWith('PO-')
    stepErrors.value = ok ? [] : ['code']
    stepPhase.value = ok ? 'succeeded' : 'failed'
    if (ok) message.success('提交成功')
    else message.error('提交失败：编号要以 PO- 开头（这条错在第 1 步）')
  }, 900)
}

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

/* ---------- 按 schema 渲染（B08）---------- */
const demoSchema: FormSchema = {
  fields: [
    {
      name: 'type',
      label: '客户类型',
      kind: 'select',
      rules: [{ kind: 'required', message: '请选择客户类型' }],
      options: [
        { value: 'person', label: '个人' },
        { value: 'company', label: '企业' }
      ]
    },
    {
      name: 'taxNo',
      label: '税号',
      kind: 'text',
      placeholder: '8 位以上大写字母或数字',
      when: { field: 'type', op: 'eq', value: 'company' },
      rules: [
        { kind: 'required', message: '企业客户必须填税号' },
        { kind: 'pattern', value: '^[A-Z0-9]{8,}$', message: '税号是 8 位以上的大写字母或数字' }
      ]
    },
    {
      name: 'lines',
      label: '明细',
      kind: 'array',
      minItems: 1,
      maxItems: 3,
      item: [
        { name: 'sku', label: '物料', kind: 'text', rules: [{ kind: 'required', message: '物料必填' }] },
        { name: 'quantity', label: '数量', kind: 'number', rules: [{ kind: 'min', value: 1, message: '数量至少为 1' }] }
      ]
    }
  ]
}

const schemaValues = ref<Record<string, unknown>>({ type: 'person', lines: [{ sku: 'SKU-1001', quantity: 2 }] })
/* 对不上任何字段的服务端错误：演示它显示在表单级而不是被丢掉 */
const demoServerErrors = [{ path: 'creditLimit', message: '超出授信额度，请联系财务' }]
const schemaSubmitted = ref<Record<string, unknown> | null>(null)
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

    <h2>按 schema 渲染</h2>
    <DemoBlock
      title="显隐依赖、数组子表与服务端错误"
      description="schema 里不出现任何可执行的东西：条件是数据结构，求值器只认识固定的算子表，异步规则也只给一个 handler 名字由宿主注册实现——schema 常常来自接口，能 eval 就等于把任意代码执行权交给了接口。把「客户类型」切到企业，税号才出现；切回个人时，已经填过的税号不会跟着提交上去（否则服务端会存下脏数据）。明细的错误落到具体那一格，而不是整张表报一句「有误」。下面还塞了一条服务端返回、但对不上任何字段的错误：它显示在表单级而不是被丢掉——丢掉等于「提交失败但没有原因」。"
      lang="vue"
      code='<ISchemaForm v-model="values" :schema="schema" :server-errors="serverErrors" @submit="onSubmit" />'
    >
      <div class="schema-demo">
        <ISchemaForm
          v-model="schemaValues"
          :schema="demoSchema"
          :server-errors="demoServerErrors"
          @submit="(v: Record<string, unknown>) => (schemaSubmitted = v)"
        />
        <p v-if="schemaSubmitted" class="schema-demo__out">
          提交上去的是：<code>{{ JSON.stringify(schemaSubmitted) }}</code>
        </p>
      </div>
    </DemoBlock>

    <h2>围着表单的那几件事</h2>
    <p>
      字段怎么算是一回事，表单被放进一个页面之后要解决的是另一批事，而且每一件都是在真实业务里踩出来的：网络慢的时候人一定会再点一次「提交」；提交失败就把表单清空，是最容易被当成「它坏了」的行为；改了一半点返回该不该拦；「重置」到底是清空、回到打开时的样子、还是回到上次的草稿。
    </p>
    <p>
      判断全在 <code>logic/formhost.ts</code>，多端共用一份——这些都是「该不该拦住用户」的决定，各端各判一遍就会出现同一张表在网页上拦住了、在小程序里直接放走。
    </p>
    <DemoBlock
      title="重复提交、失败保留输入、离开保护与重置范围"
      description="点「提交」后按钮变成加载中，这段时间再点不会发出第二次。第一次故意失败——要看的正是失败之后输入还在、还能再交一次。改一个字段再点「取消」，确认会就地展开在按钮旁边，而不是弹到屏幕正中；没改过则直接走，不拦。「撤销修改」回到打开这张表时的样子，不是清空。"
      lang="vue"
      code='<IFormPage
  v-model="values"
  :initial="initial"
  :phase="phase"
  title="编辑采购单"
  @submit="submit"
  @cancel="back"
/>'
    >
      <IFormPage
        v-model="hostValues"
        :initial="hostInitial"
        :phase="hostPhase"
        title="编辑采购单"
        description="改一个字段再点「取消」，看看离开保护；连点两次「提交」，第二次不会发出去。"
        @submit="hostSubmit"
        @cancel="() => message.info('已离开，修改未保存')"
        @reset="() => message.info('已回到打开这张表时的样子')"
      >
        <div class="host-fields">
          <!-- id 由 IFormItem 通过插槽给出：不接上，<label for> 就落空，读屏里这两个框没有名字 -->
          <IFormItem label="单据标题">
            <template #default="{ id }">
              <IInput
                :id="id"
                :model-value="String(hostValues.title ?? '')"
                @update:model-value="(v: string) => (hostValues = { ...hostValues, title: v })"
              />
            </template>
          </IFormItem>
          <IFormItem label="负责人">
            <template #default="{ id }">
              <IInput
                :id="id"
                :model-value="String(hostValues.owner ?? '')"
                @update:model-value="(v: string) => (hostValues = { ...hostValues, owner: v })"
              />
            </template>
          </IFormItem>
        </div>
      </IFormPage>
    </DemoBlock>

    <h2>放进抽屉与弹窗</h2>
    <p>
      同一套判断换个容器。浮层多出来的那件事是：<strong>关闭这个动作本身也要过离开保护</strong>。点遮罩、按 Esc、点右上角的叉，在改了一半的表单上都等于「放弃刚才填的东西」，而这三条路默认是直接把浮层关掉的——用户按 Esc 只是想收起键盘，二十个字段就没了。所以这两个壳不把容器的关闭直接放过去：先问一句，问完才关。
    </p>
    <p>
      确认就地展开在「取消」上方，而不是再叠一层对话框：两层浮层谁先关、焦点回到哪儿，这些问题没人答得上来。抽屉与弹窗的分工是内容量——字段多、需要一边看列表一边填的用抽屉；三五个字段、填完就走的用弹窗。
    </p>
    <DemoBlock
      title="关闭动作也要过离开保护"
      description="先改一个字段，再去点遮罩、按 Esc 或点右上角的叉——都不会直接关掉，而是就地问一句。没改过则三条路都直接关，不拦。"
      lang="vue"
      code='<IDrawerForm v-model="open" :values="values" :initial="initial" title="编辑采购单" @submit="submit" />
<IModalForm v-model="open" :values="values" :initial="initial" title="编辑采购单" @submit="submit" />'
    >
      <div class="row">
        <IButton @click="drawerOpen = true">在抽屉里打开</IButton>
        <IButton @click="modalOpen = true">在弹窗里打开</IButton>
      </div>

      <IDrawerForm
        v-model="drawerOpen"
        :values="overlayValues"
        :initial="overlayInitial"
        title="编辑采购单"
        @update:values="(v: Record<string, unknown>) => (overlayValues = v)"
        @submit="() => { drawerOpen = false; message.success('已提交') }"
        @cancel="() => message.info('已离开，修改未保存')"
      >
        <IFormItem label="单据标题">
          <template #default="{ id }">
            <IInput
              :id="id"
              :model-value="String(overlayValues.title ?? '')"
              @update:model-value="(v: string) => (overlayValues = { ...overlayValues, title: v })"
            />
          </template>
        </IFormItem>
      </IDrawerForm>

      <IModalForm
        v-model="modalOpen"
        :values="overlayValues"
        :initial="overlayInitial"
        title="编辑采购单"
        @update:values="(v: Record<string, unknown>) => (overlayValues = v)"
        @submit="() => { modalOpen = false; message.success('已提交') }"
        @cancel="() => message.info('已离开，修改未保存')"
      >
        <IFormItem label="单据标题">
          <template #default="{ id }">
            <IInput
              :id="id"
              :model-value="String(overlayValues.title ?? '')"
              @update:model-value="(v: string) => (overlayValues = { ...overlayValues, title: v })"
            />
          </template>
        </IFormItem>
      </IModalForm>
    </DemoBlock>

    <h2>切成几步</h2>
    <p>
      分步真正难的不是把字段切成几屏，是这三件事：返回上一步不能丢数据；只用这一步自己的字段判断能不能往下走——拿整张表的错误去拦，会出现第一步填得好好的却点不动下一步，而错在他还没看到的第三步；提交失败要跳回出错的那一步——光在当前步说一句「提交失败」没有用，错的字段可能在第一步，而用户正站在最后一步，他只会反复点提交。
    </p>
    <p>
      值由调用方持有、逐步累积，这个壳一个字都不存，所以往回翻天然是安全的。步骤条上每一步的状态用图标形状、淡底色块与文字三重表达：一排小圆点里哪个是红的、哪个是灰的，灰度打印与色觉障碍下分不出来，而「第几步填错了」正是最需要读出来的那条。
    </p>
    <DemoBlock
      title="返回上一步不丢数据；提交失败跳回出错的那一步"
      description="直接走到第三步点「提交」：服务端会说编号不对，于是被跳回第一步，底下那行字说清是「这一步还有字段没填对」——站在哪一步，那一步的标记就是「当前」，出错的提示由状态栏和字段本身给；被标成「有错」的是那些走过、但此刻不在上面的步骤，而且红圈旁边一定有「有错」两个字。没走到过的步骤不标红：一进来满屏红叉说的是「你还没填」，不是「你填错了」。错误当场就能查出来的话根本走不出第一步，所以跳回这条路只在服务端退回时才发生。"
      lang="vue"
      code='<IStepForm v-model="values" :steps="steps" :error-paths="errors" :phase="phase" @submit="submit">
  <template #base>…第一步的字段…</template>
  <template #addr>…第二步的字段…</template>
</IStepForm>'
    >
      <IStepForm
        v-model="stepValues"
        :steps="stepSpecs"
        :error-paths="stepErrors"
        :phase="stepPhase"
        :resettable="false"
        @submit="stepSubmit"
      >
        <template #base>
          <div class="host-fields">
            <IFormItem label="单据编号" help="不以 PO- 开头时，服务端会在提交那一刻退回来">
              <template #default="{ id }">
                <IInput
                  :id="id"
                  :model-value="String(stepValues.code ?? '')"
                  @update:model-value="(v: string) => setStepValue('code', v)"
                />
              </template>
            </IFormItem>
          </div>
        </template>
        <template #addr>
          <div class="host-fields">
            <IFormItem label="收货地址">
              <template #default="{ id }">
                <IInput
                  :id="id"
                  :model-value="String(stepValues.addr ?? '')"
                  @update:model-value="(v: string) => setStepValue('addr', v)"
                />
              </template>
            </IFormItem>
          </div>
        </template>
        <template #note>
          <div class="host-fields">
            <IFormItem label="备注">
              <template #default="{ id }">
                <IInput
                  :id="id"
                  :model-value="String(stepValues.note ?? '')"
                  @update:model-value="(v: string) => setStepValue('note', v)"
                />
              </template>
            </IFormItem>
          </div>
        </template>
      </IStepForm>
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

    <h2>Form 还是 SchemaForm</h2>
    <p>
      字段是写死在页面里的，就用 <code>IForm</code> + <code>IFormItem</code>：模板里看得见每一个字段，改起来最直接。字段来自配置或接口（不同租户不同字段、审批单按类型变形），才用 <code>ISchemaForm</code>——它多出来的是显隐依赖、环检测、数组子表与服务端错误落位。反过来用会很难受：几个固定字段也去写一份
      schema，等于把模板换成了 JSON；而动态字段硬写在模板里，最后总会变成一堆<code>v-if</code>。
    </p>

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
.host-fields {
  display: grid;
  gap: var(--i-spacing-3);
  max-width: 420px;
}

.schema-demo {
  display: grid;
  gap: var(--i-spacing-3);
  max-width: 560px;
}

.schema-demo__out {
  margin: 0;
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-xs);
  overflow-wrap: anywhere;
}

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
