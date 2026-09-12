<script setup lang="ts">
import { ref } from 'vue'
import ICalendar from '@/components/ICalendar.vue'
import IMentions from '@/components/IMentions.vue'
import ISticky from '@/components/ISticky.vue'
import type { CalendarMark, DateRange } from '@i-design/common'
import ISegmented from '@/components/ISegmented.vue'
import IProgress from '@/components/IProgress.vue'
import IStatistic from '@/components/IStatistic.vue'
import ICountdown from '@/components/ICountdown.vue'
import IButton from '@/components/IButton.vue'
import { message } from '@/components/message'
import ITimeline from '@/components/ITimeline.vue'
import ICard from '@/components/ICard.vue'
import ICarousel from '@/components/ICarousel.vue'
import IRow from '@/components/IRow.vue'
import ICol from '@/components/ICol.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const range = ref('week')
const ranges = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '年', value: 'year', disabled: true }
]

const deadline = ref(Date.now() + 2 * 86400000 + 3 * 3600000 + 25 * 60000)
const sprint = ref(Date.now() + 95 * 1000)
const running = ref(true)
function onDraw() {
  message.success('开奖了')
}
function restartSprint() {
  sprint.value = Date.now() + 95 * 1000
  running.value = true
}

const slide = ref(0)
const slides = [
  { key: 's1', label: '季度营收创新高' },
  { key: 's2', label: '新版控制台上线' },
  { key: 's3', label: '两地三中心完成' }
]
const many = Array.from({ length: 20 }, (_, i) => ({ key: `m${i}`, label: `第 ${i + 1} 张` }))

const events = [
  { title: '需求评审通过', time: '2026-09-02 10:20', type: 'success' as const, description: '范围与验收标准已确认。' },
  { title: '开发中', time: '2026-09-04 09:00', current: true, description: '预计 9 月 12 日提测。' },
  { title: '待提测', time: '预计 09-12', type: 'muted' as const }
]

const today = new Date()
const iso = (d: number) => {
  const t = new Date(today.getFullYear(), today.getMonth(), d)
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}
const schedule: CalendarMark[] = [
  { date: iso(3), label: '需求评审', type: 'brand' },
  { date: iso(8), label: '版本封板', type: 'warning' },
  { date: iso(8), label: '回归测试', type: 'brand' },
  { date: iso(8), label: '例会', type: 'brand' },
  { date: iso(12), label: '发布', type: 'success' },
  { date: iso(19), label: '故障复盘', type: 'danger' }
]
const picked = ref<DateRange>({ start: iso(8), end: iso(12) })

const note = ref('把这条同步给 ')
const members = [
  { value: 'lin', label: '林岚', desc: '前端', keywords: ['linlan'] },
  { value: 'chen', label: '陈序', desc: '后端', keywords: ['chenxu'] },
  { value: 'su', label: '苏禾', desc: '设计', keywords: ['suhe'] },
  { value: 'zhou', label: '周迟', desc: '测试', keywords: ['zhouchi'] }
]

const groups = [
  { title: 'A', rows: ['阿里巴巴', '安居客', '爱奇艺'] },
  { title: 'B', rows: ['百度', '哔哩哔哩', '贝壳'] },
  { title: 'C', rows: ['菜鸟', '春秋航空'] }
]
</script>

<template>
  <article>
    <h1>数据展示</h1>
    <p class="i-lead">
      仪表盘与详情页里最常出现的四件：切换视角、表示进度、突出一个数字、罗列已发生的事。
    </p>

    <h2>Segmented 分段控制器</h2>
    <p>
      与 Tabs 的分工：Tabs 切换的是页面区域，Segmented 切换的是同一块区域内的数据视角。滑块用位移动画而不是给选中项加底色，切换时视线不会丢。
    </p>
    <DemoBlock
      title="切换数据视角"
      code='<ISegmented v-model="range" :options="ranges" />'
    >
      <div class="stack">
        <ISegmented v-model="range" :options="ranges" />
        <ISegmented v-model="range" :options="ranges" size="lg" />
        <p class="hint">当前：{{ range }}</p>
      </div>
    </DemoBlock>

    <h2>Progress 进度</h2>
    <p>
      100% 不会自动变成成功色——进度走完不等于任务成功，上传完成还可能校验失败，状态由调用方显式给出。不知道还剩多少时用 <code>indeterminate</code>。
    </p>
    <DemoBlock
      title="线形与环形"
      code='<IProgress :percent="62" />
<IProgress :percent="100" status="success" />
<IProgress indeterminate />
<IProgress type="circle" :percent="72" />'
    >
      <div class="stack">
        <IProgress :percent="62" />
        <IProgress :percent="100" status="success" />
        <IProgress :percent="38" status="danger" text="校验失败" />
        <IProgress indeterminate />
        <div class="row">
          <IProgress type="circle" :percent="72" />
          <IProgress type="circle" :percent="100" status="success" :width="80" />
        </div>
      </div>
    </DemoBlock>

    <h2>Statistic 统计数值</h2>
    <p>数字用等宽数位：仪表盘上的数字会随刷新变化，比例数位会让整块内容左右抖动。</p>
    <DemoBlock
      title="关键指标"
      code='<IStatistic title="本月活跃" :value="128430" :trend="12.4" extra="较上月" />'
    >
      <div class="metrics">
        <IRow :gutter="16">
          <ICol :span="8" :sm="24">
            <ICard><IStatistic title="本月活跃用户" :value="128430" :trend="12.4" extra="较上月" /></ICard>
          </ICol>
          <ICol :span="8" :sm="24">
            <ICard><IStatistic title="转化率" :value="32.65" :precision="2" suffix="%" type="brand" :trend="-2.1" extra="较上月" /></ICard>
          </ICol>
          <ICol :span="8" :sm="24">
            <ICard><IStatistic title="待处理工单" :value="27" type="danger" extra="其中 4 条超时" /></ICard>
          </ICol>
        </IRow>
      </div>
    </DemoBlock>

    <h2>Countdown 倒计时</h2>
    <p>
      每一跳都从绝对截止时刻重算，而不是把上一次的值减掉一个间隔——后者每跳都会积累几毫秒误差，页面挂一晚上能差出好几秒；标签页被切到后台时定时器还会被浏览器压慢，回来就直接错了。
    </p>
    <p>
      归零的时机也有讲究：不显示毫秒时按「向上取整到秒」显示，剩 1.4 秒时是 02 而不是 01。向下取整的话，最后那个 00 会挂满整整一秒才结束，用户看到的是「归零了却还没完」。
    </p>
    <DemoBlock
      title="截止时刻"
      description="模板里没写的那一位会并进相邻的更小单位，而不是被丢掉：用 mm:ss 而剩余超过一小时时显示 65:30，不会骗人地显示成 05:30。"
      code='<ICountdown title="距活动结束" :value="deadline" format="DD 天 HH:mm:ss" />'
    >
      <div class="metrics">
        <IRow :gutter="16">
          <ICol :span="8" :sm="24">
            <ICard><ICountdown title="距活动结束" :value="deadline" format="DD 天 HH:mm:ss" /></ICard>
          </ICol>
          <ICol :span="8" :sm="24">
            <ICard><ICountdown title="仅按分秒计" :value="deadline" format="mm:ss" size="sm" type="brand" /></ICard>
          </ICol>
          <ICol :span="8" :sm="24">
            <ICard><ICountdown title="精确到毫秒" :value="sprint" format="mm:ss.SSS" size="sm" type="danger" /></ICard>
          </ICol>
        </IRow>
      </div>
    </DemoBlock>

    <DemoBlock
      title="暂停与结束"
      description="暂停后重新打开走的仍是绝对时刻，不会「补回」暂停期间的时间。finish 只在真正走到零的那一次触发——截止时刻早已过去时刷新页面不该把跳转、弹窗这些副作用再跑一遍。"
      code='<ICountdown :value="sprint" :running="running" @finish="onFinish" />'
    >
      <div class="cd-demo">
        <ICountdown :value="sprint" :running="running" suffix="后开奖" @finish="onDraw" />
        <div class="cd-demo__actions">
          <IButton size="sm" @click="running = !running">{{ running ? '暂停' : '继续' }}</IButton>
          <IButton size="sm" @click="restartSprint">重新计时</IButton>
        </div>
      </div>
    </DemoBlock>

    <h2>Timeline 时间线</h2>
    <p>与 Steps 的分工：Steps 描述一个还没走完的流程（有「当前步」），Timeline 记录已经发生的事。</p>
    <DemoBlock
      title="事件流"
      code='<ITimeline :items="events" />'
    >
      <div class="stack"><ITimeline :items="events" /></div>
    </DemoBlock>

    <h2>Carousel 走马灯</h2>
    <p>
      轨道整条平移，而不是逐张淡入淡出：平移能让人看出「下一张从右边来」，方向感是这个组件比一排卡片多出来的唯一信息。移动端的 Swiper 就是它，只是默认关掉箭头——手势本身已经够用，箭头只会一直挡住图片两侧。
    </p>
    <p>
      翻页判定看位移<strong>或</strong>速度，任一达标即可。只看位移的话，快速的短促轻扫会被判成「没划够」，而那恰恰是手机上最自然的手势，用户会反复用力划几次，然后认为这个轮播很迟钝。
    </p>
    <DemoBlock
      title="自动播放与指示点"
      description="指示点当前项拉长而不是只变色——色觉障碍或灰度打印下，形状差异仍然读得出来。悬停、聚焦、拖动、页面切到后台、或系统要求减少动效时，自动播放都会停。"
      code='<ICarousel :items="slides" :interval="3000" />'
    >
      <div class="stack">
        <ICarousel v-model="slide" :items="slides" :interval="3000" :height="200">
          <template v-for="(s, i) in slides" #[s.key]="{ item }" :key="s.key">
            <div class="slide" :style="{ background: `var(--i-chart-${i + 1})` }">{{ item.label }}</div>
          </template>
        </ICarousel>
        <span class="hint">当前第 {{ slide + 1 }} 张</span>
      </div>
    </DemoBlock>

    <DemoBlock
      title="超过上限时指示点只显示一段"
      description="二十张图配二十个点，点会小到看不清，也数不出自己在第几张。显示一个滑动窗口，读者至少能看出「还在中间」还是「快到头了」。"
      code='<ICarousel :items="many" :max-dots="7" :loop="false" />'
    >
      <div class="stack">
        <ICarousel :items="many" :max-dots="7" :loop="false" :height="140">
          <template v-for="(s, i) in many" #[s.key]="{ item }" :key="s.key">
            <div class="slide slide--plain">{{ item.label }}</div>
          </template>
        </ICarousel>
      </div>
    </DemoBlock>
    <h2>Calendar 日历</h2>
    <p>
      标记用「淡底色块 + 文字」，不给整格换底色：换底色会和「选中」「今天」抢同一个视觉通道，三者叠在一起时读者分不出哪个是哪个。文字必须在——只靠色点的话，色觉障碍用户与灰度打印都读不出这是什么类型的日程。
    </p>
    <p>
      整块日历只占一个 Tab 停靠点，进来之后用方向键走，上下键按周跳。
      42 个格子各占一个 Tab 位的话，用键盘的人要按四十几下才能穿过这个月。选完一段再点是「重新开始选」而不是「延长这一段」——延长的语义在只有点击、没有拖拽的界面里说不清：用户点第三下时，没有任何线索告诉他这一下会改起点还是改终点。
    </p>
    <DemoBlock
      title="月视图、日程标记与范围选择"
      description="点两下选一段。从右往左点会自动对调，而不是拒绝——用户从后往前选是常事，拒绝的话他得先想明白「原来要从左边开始点」，而这条规则界面上没写。"
      code='<ICalendar v-model="range" mode="range" :marks="schedule" />'
    >
      <div class="cal-demo">
        <ICalendar v-model="picked" mode="range" :marks="schedule" />
        <p class="hint">
          已选：{{ picked.start || '（未选）' }}{{ picked.end ? ` 至 ${picked.end}` : '' }}
        </p>
      </div>
    </DemoBlock>

    <h2>Mentions 提及</h2>
    <p>
      三条判定缺一条都会让候选在不该弹的时候弹出来：触发符前面必须是行首或空白（<code>user@example.com</code> 里的 @ 不该弹，弹出来会把回车键抢走）；触发符与光标之间不能有空白（打完 <code>@张三 </code> 就该收起，否则往下写正文时回车会被候选吃掉）；查询串有长度上限（没有上限的话，一个没选中任何人的 @ 会让整段话都被当成查询）。
    </p>
    <DemoBlock
      title="输入 @ 唤起成员"
      description="方向键选、回车或 Tab 确认、Esc 收起。选中后自动补一个空格——不补的话，光标紧贴着刚插入的名字，接着打字会立刻又触发一次候选。"
      code='<IMentions v-model="text" :options="members" />'
    >
      <div class="mention-demo">
        <IMentions v-model="note" :options="members" placeholder="输入 @ 提及成员" />
        <p class="hint">当前内容：{{ note }}</p>
      </div>
    </DemoBlock>

    <h2>Sticky 吸顶</h2>
    <p>
      与 Affix 同一条判定，区别只在参照物：Affix 参照视口，Sticky 参照它所在的滚动容器——列表分组头要吸在列表顶部，而不是吸在整个页面顶部，后者会让它在页面别处也钉着。不传容器时组件自己往上找最近的可滚动祖先。
    </p>
    <DemoBlock
      title="分组头吸在列表顶部"
      description="吸住后必须有底色：透明的话，滚过它下面的内容会从字缝里透出来。"
      code='<ISticky><h4>分组标题</h4></ISticky>'
    >
      <div class="sticky-demo">
        <div v-for="group in groups" :key="group.title">
          <ISticky>
            <div class="sticky-head">{{ group.title }}</div>
          </ISticky>
          <div v-for="row in group.rows" :key="row" class="sticky-row">{{ row }}</div>
        </div>
      </div>
    </DemoBlock>
    <h2>什么时候不该用它</h2>
    <ul>
      <li>数据要被比较时——用表格或图表。头像、标签、描述列表都只解释「这一个是什么」。</li>
      <li>同一屏里堆三种以上展示形态时——先问哪一种是主线，其余降级或收进详情。</li>
      <li>内容还没到位时——先给骨架屏或空态，而不是渲染一个空壳让人以为坏了。</li>
    </ul>
  </article>
</template>

<style scoped>
.cd-demo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--i-spacing-4);
}
.cd-demo__actions {
  display: flex;
  gap: var(--i-spacing-2);
}
.cal-demo { max-width: 620px; }
.mention-demo { max-width: 520px; }
.hint { margin: var(--i-spacing-3) 0 0; color: var(--i-color-text-secondary); font-size: var(--i-font-size-sm); }
.sticky-demo {
  height: 220px;
  overflow-y: auto;
  border: 1px solid var(--i-color-border);
  border-radius: var(--i-radius-lg);
}
.sticky-head {
  padding: var(--i-spacing-2) var(--i-spacing-4);
  background: var(--i-color-bg-subtle);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
  border-bottom: 1px solid var(--i-color-hairline);
}
.sticky-row {
  padding: var(--i-spacing-3) var(--i-spacing-4);
  border-bottom: 1px solid var(--i-color-hairline);
}
.stack { display: flex; flex-direction: column; gap: var(--i-spacing-4); width: 100%; }
.row { display: flex; gap: var(--i-spacing-6); align-items: center; }
.metrics { width: 100%; }
.hint { font-size: var(--i-font-size-sm); color: var(--i-color-text-tertiary); }
.slide {
  display: grid;
  place-items: center;
  height: 100%;
  color: var(--i-color-on-media);
  font-size: var(--i-font-size-lg);
}
.slide--plain { background: var(--i-color-bg-subtle); color: var(--i-color-text-secondary); }
</style>
