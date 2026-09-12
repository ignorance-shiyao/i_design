<script setup lang="ts">
import { ref } from 'vue'
import IInputNumber from '@/components/IInputNumber.vue'
import ISlider from '@/components/ISlider.vue'
import IRate from '@/components/IRate.vue'
import IList from '@/components/IList.vue'
import IAvatar from '@/components/IAvatar.vue'
import ITag from '@/components/ITag.vue'
import ITagInput from '@/components/ITagInput.vue'
import IAutoComplete from '@/components/IAutoComplete.vue'
import ITimePicker from '@/components/ITimePicker.vue'
import ITransfer from '@/components/ITransfer.vue'
import { message } from '@/components/message'
import DemoBlock from '@/site/DemoBlock.vue'

const count = ref<number | null>(3)
const price = ref<number | null>(19.9)
const volume = ref(40)
const threshold = ref(60)
const score = ref(3.5)

const tags = ref<string[]>(['设计系统', '多端'])
const limited = ref<string[]>([])

const start = ref('09:00')
const meeting = ref('')

const roles = [
  { key: 'read', label: '查看' },
  { key: 'write', label: '编辑' },
  { key: 'deploy', label: '部署' },
  { key: 'billing', label: '账单' },
  { key: 'audit', label: '审计日志' },
  { key: 'owner', label: '所有者', disabled: true },
  { key: 'invite', label: '邀请成员' },
  { key: 'secret', label: '密钥管理' }
]
const granted = ref<string[]>(['read'])

const city = ref('')
const cities = [
  { value: '北京' }, { value: '北海' }, { value: '湖北' }, { value: '河北' },
  { value: '上海' }, { value: '广州' }, { value: '深圳' }, { value: '珠海' },
  { value: '成都' }, { value: '重庆' }
]

const marks = [
  { value: 0, label: '0' },
  { value: 50, label: '50' },
  { value: 100, label: '100' }
]

const rows = [
  {
    title: 'WI-1024 登录页表单校验缺失',
    description: '手机号未做格式校验，空值也能提交到后端。',
    meta: ['林岚', '2 小时前', '缺陷']
  },
  {
    title: 'WI-1025 列表页分页丢失当前页',
    description: '从详情返回后回到第一页，用户需要重新翻页。',
    meta: ['陈序', '昨天', '缺陷']
  },
  {
    title: 'WI-1026 导出任务超时',
    description: '数据量超过 5 万条时导出接口 120 秒未返回。',
    meta: ['苏禾', '3 天前', '任务']
  }
]
</script>

<template>
  <article>
    <h1>数值、区间与列表</h1>
    <p class="i-lead">
      数字输入、滑块与评分都在解决同一件事——把一个受约束的取值交给用户；步进、夹取与按精度取整的规则只写一份，各端引用同一套，因此同一个字段不会在两个端上得到两种结果。列表则负责另一件事：当内容需要逐条阅读、而不是横向比较字段时，它比表格更合适。
    </p>

    <h2>InputNumber 数字输入</h2>
    <DemoBlock
      title="步进与精度"
      description="按住方向键也能步进；输入过程中的「-」「1.」这类中间态不回写，等失焦再规整，否则用户打不出负数。"
      code='<IInputNumber v-model="count" :min="0" :max="99" />
<IInputNumber v-model="price" :step="0.1" :precision="2" :min="0" />'
    >
      <div class="stack">
        <div class="row">
          <IInputNumber v-model="count" :min="0" :max="99" />
          <span class="hint">整数，0 – 99</span>
        </div>
        <div class="row">
          <IInputNumber v-model="price" :step="0.1" :precision="2" :min="0" />
          <span class="hint">两位小数，步进 0.1</span>
        </div>
        <div class="row">
          <IInputNumber v-model="count" hide-step size="sm" />
          <span class="hint">隐藏步进按钮</span>
        </div>
      </div>
    </DemoBlock>

    <h2>Slider 滑块</h2>
    <p>轨道只有 4px 高，但可点击区域撑到 20px——细轨道好看，细的点击区难用。</p>
    <DemoBlock
      title="拖动取值"
      code='<ISlider v-model="volume" />
<ISlider v-model="threshold" :step="10" :marks="marks" />'
    >
      <div class="stack">
        <div class="slider-row">
          <ISlider v-model="volume" />
          <span class="hint">{{ volume }}</span>
        </div>
        <div class="slider-row">
          <ISlider v-model="threshold" :step="10" :marks="marks" />
          <span class="hint">{{ threshold }}</span>
        </div>
      </div>
    </DemoBlock>

    <h2>Rate 评分</h2>
    <p>未选中的星形保留描边而不是整片变浅：全灰的星形在深色模式下几乎看不见，用户不知道总共可以打几分。</p>
    <DemoBlock
      title="整星与半星"
      description="再点一次当前分值即清零，这是评分组件的通行做法。"
      code='<IRate v-model="score" half :text="`${score} 分`" />'
    >
      <div class="stack">
        <IRate v-model="score" half :text="`${score} 分`" />
        <IRate :model-value="4" readonly text="只读" />
      </div>
    </DemoBlock>

    <h2>List 列表</h2>
    <p>与 Table 的分工：表格用于横向比较多个字段，列表用于逐条阅读。字段超过三个还在用列表，说明其实需要的是表格。</p>
    <DemoBlock
      title="条目列表"
      code='<IList :items="rows" header="我的工作项" clickable>
  <template #media="{ item }"><IAvatar :name="item.meta[0]" /></template>
  <template #extra="{ item }"><ITag>{{ item.meta[2] }}</ITag></template>
</IList>'
    >
      <div class="stack">
        <IList :items="rows" header="我的工作项" footer="共 3 条" clickable>
          <template #media="{ item }">
            <IAvatar :name="item.meta?.[0] ?? ''" :size="32" />
          </template>
          <template #extra="{ item }">
            <ITag :type="item.meta?.[2] === '缺陷' ? 'danger' : 'brand'">{{ item.meta?.[2] }}</ITag>
          </template>
        </IList>
      </div>
    </DemoBlock>
    <h2>TagInput 输入标签</h2>
    <p>
      回车成标签，退格删末项——但只有输入框已经空了才删，有内容时退格删的还是字符。破坏这条通用行为的话，用户会不敢用退格。
    </p>
    <p>
      粘贴才是这个组件的主用途：用户从表格里复制一列过来，拿到的是一段带换行和逗号的文本，逐个手敲显然不是设计意图。全角逗号与分号也算分隔符——中文输入法下打出来的就是全角。输入中途遇到分隔符时最后一段留在输入框里继续编辑，连它一起成标签的话，用户要补字就得先把标签删掉。
    </p>
    <DemoBlock
      title="回车、粘贴与上限"
      description="被拒绝时说出理由，而不是静默丢弃：粘贴十个只进去七个，不给理由的话用户会以为组件坏了，而最常见的原因（重复、超上限）恰恰是可以说清的。"
      code='<ITagInput v-model="tags" :max="5" @reject="message.warning" />'
    >
      <div class="stack">
        <ITagInput v-model="tags" placeholder="输入后回车，或粘贴一段逗号分隔的文本" @reject="message.warning($event)" />
        <ITagInput v-model="limited" :max="3" placeholder="最多 3 个" @reject="message.warning($event)" />
      </div>
    </DemoBlock>

    <h2>AutoComplete 自动完成</h2>
    <p>
      与 Select 的分工：Select 的值必须来自选项，自动完成的值可以是用户自己敲的，候选只是提示。所以只有真的用方向键高亮了某一条，回车才算「选中候选」；没高亮时回车应当照常提交表单——反过来做的话，用户敲完一串自定义内容按回车，会被静默替换成第一条候选。
    </p>
    <DemoBlock
      title="边输入边给候选"
      description="命中前缀的排在命中中段的前面：敲「北」，「北京」在「湖北」之上。不排序的话，候选顺序取决于数据源顺序，看起来像随机的。命中片段加重而不是换颜色——颜色在灰度打印与色觉障碍下会失效。"
      code='<IAutoComplete v-model="city" :options="cities" />'
    >
      <div class="stack narrow">
        <IAutoComplete v-model="city" :options="cities" placeholder="试试输入「北」或「海」" />
        <span class="hint">当前值：{{ city || '（空）' }}</span>
      </div>
    </DemoBlock>
    <h2>TimePicker 时间选择</h2>
    <p>
      三列并排而不是一个长下拉：时分秒拉成一条列表有八万多项，滚到想要的那一刻比手打还慢。「此刻」不是装饰——绝大多数时间输入填的就是现在，让人少滚三列。
    </p>
    <p>
      范围判定按位做，而不是先拼成完整时间再比大小。选择器是一列一列点的，用户点「小时」那一刻分和秒还是上一次的值；拼起来比较的话，一个本来合法的小时会因为分秒不合法而被禁掉，用户看到的是「这个点点不动」，而他根本没打算保留那个分秒。
    </p>
    <DemoBlock
      title="步长与可选范围"
      description="步长按 0 起算，所以 15 分钟步长给出 00 / 15 / 30 / 45。夹取时先夹范围再对齐步长——反过来的话，对齐可能把值推出范围外，再夹回来又不在步长上，列表里高亮的那一项就和实际值对不上。"
      code='<ITimePicker v-model="start" :minute-step="15" min="08:00" max="20:00" />'
    >
      <div class="row">
        <ITimePicker v-model="start" :minute-step="15" :show-second="false" min="08:00" max="20:00" />
        <ITimePicker v-model="meeting" placeholder="不限时间" />
        <span class="hint">上班时段：{{ start || '（空）' }}</span>
      </div>
    </DemoBlock>

    <h2>Transfer 穿梭框</h2>
    <p>
      两处最容易各端给出不同答案、而两种答案都说得通的地方，都收进了公共层：搬走的条目要从勾选里清掉，否则会出现「已选 3 项」而屏幕上一个勾都没有，这个状态用户没法自己纠正；表头全选只管当前可见的条目，搜索状态下用户的意思是「这些」，把看不见的一起选中，再点搬运就会搬走一批他从没见过的条目。
    </p>
    <DemoBlock
      title="搬运、搜索与禁用项"
      description="禁用项不跟着搬：它在界面上是灰的、勾不上，但全选很容易把它一起收进选中集合，于是点一下搬运，一个用户根本点不动的条目就跑到对面去了。「所有者」这一项就是禁用的。"
      code='<ITransfer v-model="granted" :items="roles" />'
    >
      <div class="stack">
        <ITransfer v-model="granted" :items="roles" :height="200" />
        <span class="hint">已授予：{{ granted.join('、') || '（无）' }}</span>
      </div>
    </DemoBlock>
  </article>
</template>

<style scoped>
.stack { display: flex; flex-direction: column; gap: var(--i-spacing-4); width: 100%; }
.row { display: flex; align-items: center; gap: var(--i-spacing-3); }
.slider-row { display: grid; grid-template-columns: 1fr 48px; align-items: center; gap: var(--i-spacing-4); }
.narrow { max-width: 320px; }
.hint { font-size: var(--i-font-size-sm); color: var(--i-color-text-tertiary); }
</style>
