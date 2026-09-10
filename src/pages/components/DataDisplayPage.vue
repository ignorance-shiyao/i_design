<script setup lang="ts">
import { ref } from 'vue'
import ISegmented from '@/components/ISegmented.vue'
import IProgress from '@/components/IProgress.vue'
import IStatistic from '@/components/IStatistic.vue'
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
</script>

<template>
  <article>
    <h1>数据展示</h1>
    <p class="i-lead">
      仪表盘与详情页里最常出现的四件：切换视角、表示进度、突出一个数字、罗列已发生的事。
    </p>

    <h2>Segmented 分段控制器</h2>
    <p>
      与 Tabs 的分工：Tabs 切换的是页面区域，Segmented 切换的是同一块区域内的数据视角。
      滑块用位移动画而不是给选中项加底色，切换时视线不会丢。
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
      100% 不会自动变成成功色——进度走完不等于任务成功，上传完成还可能校验失败，
      状态由调用方显式给出。不知道还剩多少时用 <code>indeterminate</code>。
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
      轨道整条平移，而不是逐张淡入淡出：平移能让人看出「下一张从右边来」，
      方向感是这个组件比一排卡片多出来的唯一信息。移动端的 Swiper 就是它，
      只是默认关掉箭头——手势本身已经够用，箭头只会一直挡住图片两侧。
    </p>
    <p>
      翻页判定看位移<strong>或</strong>速度，任一达标即可。只看位移的话，
      快速的短促轻扫会被判成「没划够」，而那恰恰是手机上最自然的手势，
      用户会反复用力划几次，然后认为这个轮播很迟钝。
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
  </article>
</template>

<style scoped>
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
