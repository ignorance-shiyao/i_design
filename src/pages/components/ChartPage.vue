<script setup lang="ts">
import { computed, ref } from 'vue'
import IChart from '@/components/IChart.vue'
import IChartPie from '@/components/IChartPie.vue'
import ISparkline from '@/components/ISparkline.vue'
import ICard from '@/components/ICard.vue'
import IStatistic from '@/components/IStatistic.vue'
import IRow from '@/components/IRow.vue'
import ICol from '@/components/ICol.vue'
import ISegmented from '@/components/ISegmented.vue'
import IChartFunnel from '@/components/IChartFunnel.vue'
import IChartGauge from '@/components/IChartGauge.vue'
import IChartRadar from '@/components/IChartRadar.vue'
import IChartHeatmap from '@/components/IChartHeatmap.vue'
import IChartScatter from '@/components/IChartScatter.vue'
import IChartBox from '@/components/IChartBox.vue'
import IChartWaterfall from '@/components/IChartWaterfall.vue'
import IChartZoom from '@/components/IChartZoom.vue'
import IChartSankey from '@/components/IChartSankey.vue'
import IChartTreemap from '@/components/IChartTreemap.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import { sliceByWindow } from '@i-design/common'

const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月']

const trend = [
  { name: '新建工作项', data: [820, 932, 901, 1290, 1330, 1520, 1410, 1680] },
  { name: '已完成', data: [620, 732, 851, 934, 1090, 1230, 1290, 1420] }
]

const channels = [
  { name: '自建平台', data: [320, 302, 341, 374, 390, 420, 405, 460] },
  { name: '合作渠道', data: [220, 182, 191, 234, 290, 330, 310, 350] },
  { name: '公开注册', data: [150, 212, 201, 154, 190, 230, 250, 280] }
]

const distribution = [
  { name: '需求', value: 4200 },
  { name: '缺陷', value: 2680 },
  { name: '任务', value: 1890 },
  { name: '风险', value: 720 },
  { name: '其他', value: 310 }
]

const thresholds = [
  { from: 900, to: 1300, label: '健康区间', status: 'success' as const },
  { value: 1500, label: '目标 1500', status: 'warning' as const }
]

const scatter = [
  {
    name: '平台组',
    data: [
      { x: 42, y: 18, size: 6, label: '平台 · 一季度' },
      { x: 58, y: 26, size: 6, label: '平台 · 二季度' },
      { x: 71, y: 30, size: 7, label: '平台 · 三季度' },
      { x: 96, y: 44, size: 8, label: '平台 · 四季度' }
    ]
  },
  {
    name: '业务组',
    data: [
      { x: 35, y: 22, size: 4, label: '业务 · 一季度' },
      { x: 52, y: 35, size: 5, label: '业务 · 二季度' },
      { x: 64, y: 39, size: 5, label: '业务 · 三季度' },
      { x: 88, y: 58, size: 6, label: '业务 · 四季度' }
    ]
  }
]

const view = ref<'line' | 'bar'>('line')
const views = [
  { label: '折线', value: 'line' },
  { label: '柱状', value: 'bar' }
]

const funnel = [
  { name: '访问', value: 12800 },
  { name: '注册', value: 6400 },
  { name: '创建工作项', value: 3100 },
  { name: '完成首个流程', value: 1420 },
  { name: '次周留存', value: 860 }
]

const radarAxes = ['响应速度', '功能完整', '易用性', '稳定性', '可扩展']
const radarSeries = [
  { name: '本季度', data: [82, 74, 68, 90, 61] },
  { name: '上季度', data: [65, 70, 55, 76, 58] }
]

const hours = ['0-4', '4-8', '8-12', '12-16', '16-20', '20-24']
const weekdays = ['周一', '周二', '周三', '周四', '周五']
const heat = [
  [2, 6, 42, 38, 30, 9],
  [1, 5, 45, 41, 33, 8],
  [2, 7, 48, 44, 29, 11],
  [3, 8, 51, 47, 35, 14],
  [2, 6, 39, 36, 24, 18]
]

const sparks = [
  { title: '今日活跃', value: 12840, trend: 8.2, data: [12, 18, 15, 22, 19, 26, 31, 29, 34] },
  { title: '平均响应', value: '248 ms', trend: -12.4, data: [42, 38, 40, 33, 31, 28, 26, 25, 24] },
  { title: '错误率', value: '0.42%', trend: 3.1, data: [3, 2, 4, 3, 5, 4, 6, 5, 7] }
]

/* 流向：一次投放的用户去了哪里 */
const sankeyLinks = [
  { from: 'visit', to: 'signup', value: 400 },
  { from: 'visit', to: 'bounce', value: 600 },
  { from: 'signup', to: 'paid', value: 120 },
  { from: 'signup', to: 'idle', value: 280 }
]
const sankeyLabels = {
  visit: '访问', signup: '注册', bounce: '未注册离开',
  paid: '付费', idle: '注册未活跃'
}

/* 层级占比：各品类的销售额 */
const treemapItems = [
  { label: '冰淇淋', value: 4200 },
  { label: '咖啡', value: 2600 },
  { label: '烘焙', value: 1500 },
  { label: '周边', value: 620 },
  { label: '礼盒', value: 380 },
  { label: '其他', value: 210 }
]

/* 区间缩放：90 天的日活，足够长才看得出「缩放」的必要 */
const zoomLabels = Array.from({ length: 90 }, (_, i) => `第 ${i + 1} 天`)
const zoomValues = Array.from({ length: 90 }, (_, i) => {
  const trend = 1200 + i * 14
  const weekly = Math.sin((i / 7) * Math.PI * 2) * 180
  const noise = Math.sin(i * 2.7) * 60
  return Math.round(trend + weekly + noise)
})
const zoomWindow = ref({ start: 0, end: 89 })
const zoomCode = `<IChart :labels="zoomed.labels" :series="[{ name: '日活', data: zoomed.values }]" />
<IChartZoom v-model:window="zoomWindow" :values="zoomValues" :labels="zoomLabels" />`
const zoomed = computed(() => ({
  labels: sliceByWindow(zoomLabels, zoomWindow.value),
  values: sliceByWindow(zoomValues, zoomWindow.value)
}))

/* 分布：三个门店的单日出杯量，第三组刻意含离群点 */
const boxGroups = [
  { label: '城东店', values: [82, 88, 91, 95, 97, 99, 103, 106, 110, 118] },
  { label: '城西店', values: [64, 70, 73, 75, 78, 80, 83, 86, 90, 96] },
  { label: '机场店', values: [88, 92, 95, 98, 101, 104, 108, 112, 186, 204] }
]

/* 增减归因：期初到期末之间发生了什么 */
const waterfallItems = [
  { label: '期初库存', value: 1200 },
  { label: '到货', value: 480 },
  { label: '门店消耗', value: -620 },
  { label: '损耗', value: -85 },
  { label: '退货入库', value: 140 },
  { label: '期末库存', value: 0, total: true }
]
</script>

<template>
  <article>
    <h1>图表</h1>
    <p class="i-lead">
      仪表盘里的图表不是装饰，它替读者回答一个具体问题。这套图表把颜色、刻度与交互都固定下来：
      分类色按固定顺序分配、坐标轴刻度吸附到人能心算的数、每张图都带图例与数据表——
      于是「这条线是谁」永远不需要靠猜。
    </p>

    <h2>趋势</h2>
    <p>
      看变化用折线。悬停出现十字线与同一时刻的全部数值，比逐条对照图例快得多；
      末点直接标注系列名与数值，读者不必在图例和线之间来回找。
    </p>
    <DemoBlock
      title="多系列趋势"
      description="同一份数据在折线与柱状之间切换：折线读的是速率，柱状读的是每期的量。"
    >
      <div class="chart-demo">
        <ISegmented v-model="view" :options="views" />
        <IChart :series="trend" :labels="months" :type="view" title="工作项趋势" unit=" 条" />
      </div>
    </DemoBlock>

    <h2>阈值</h2>
    <p>
      只看趋势看不出「现在是不是超了」，而后者往往才是看这张图的原因。
      阈值线与阈值带把「多少算正常」画进图里：线用虚线、带用极低不透明度，
      并且用状态色而不是分类色——阈值不是又一组数据，借分类色会被当成第 N 个系列。
      落在值域之外的阈值会被丢弃，而不是压到边缘假装「刚好卡在临界」。
    </p>
    <DemoBlock
      title="阈值线与阈值带"
      description="虚线是目标值，色带是可接受区间。数据表下方的「导出 CSV」把这张图变回可以自己算的数字。"
    >
      <IChart
        :series="trend"
        :labels="months"
        title="工作项趋势与目标"
        unit=" 条"
        :thresholds="thresholds"
      />
    </DemoBlock>

    <h2>构成</h2>
    <p>
      比较各项大小用柱状图，且必须从零起——截断基线会放大差异，是最常见的图表误导。
      堆叠用于表达「合计由哪些部分构成」，相邻段之间留出底色缝隙，色觉障碍下也能分清边界。
    </p>
    <DemoBlock
      title="分组、堆叠与堆叠面积"
      description="只有可相加的量才能堆叠。这里三个渠道相加等于总新增，堆叠成立；「新建」与「已完成」相加没有意义，就不该堆。"
    >
      <div class="chart-demo">
        <IChart :series="channels" :labels="months" type="bar" title="各渠道新增（分组比较）" unit=" 人" />
        <IChart :series="channels" :labels="months" type="bar" stacked title="各渠道新增（堆叠看总量）" unit=" 人" />
        <IChart :series="channels" :labels="months" type="area" title="各渠道新增（堆叠面积看趋势）" unit=" 人" />
      </div>
    </DemoBlock>

    <h2>占比</h2>
    <p>
      环形而不是实心饼：读者比较的是弧长，比面积更容易读准。数值写在图例上而不是扇区里，
      扇区一小就会互相压字。
    </p>
    <DemoBlock title="占比分布">
      <div class="chart-demo">
        <IChartPie :items="distribution" title="工作项类型分布" center-label="总计" unit=" 条" />
      </div>
    </DemoBlock>

    <h2>迷你图</h2>
    <p>嵌在指标卡或表格行里，只表达走势形状。它不带坐标轴，也因此不从零起——形状才是它的信息。</p>
    <DemoBlock title="指标卡中的走势">
      <div class="chart-demo">
        <IRow :gutter="16">
          <ICol v-for="item in sparks" :key="item.title" :span="8" :sm="24">
            <ICard>
              <IStatistic :title="item.title" :value="item.value" :trend="item.trend" extra="较昨日" compact />
              <div class="spark">
                <ISparkline :data="item.data" :tone="item.trend > 0 ? 'success' : 'danger'" :width="140" />
              </div>
            </ICard>
          </ICol>
        </IRow>
      </div>
    </DemoBlock>

    <h2>转化</h2>
    <p>
      漏斗回答的是「在哪一步流失最多」，所以每层旁边写的是相对上一层的转化率，
      而不只是占起点的百分比。层宽按数值比例缩，不做等差递减——等差看着更顺，
      但那是画出来的顺，不是数据里的顺。层级有序，因此用单色阶而不是分类色。
    </p>
    <DemoBlock title="转化漏斗">
      <div class="chart-demo">
        <IChartFunnel :stages="funnel" title="新用户转化" unit=" 人" />
      </div>
    </DemoBlock>

    <h2>单值与阈值</h2>
    <p>
      仪表盘用于「一个值离目标还有多远」。开口朝下的 270° 而不是整圆——
      整圆会让满值与零值落在同一个位置，无法分辨。越过阈值时整条弧转为对应的状态色。
    </p>
    <DemoBlock title="仪表盘">
      <div class="chart-demo chart-demo--row">
        <IChartGauge :value="86" title="接口可用性" unit="%" :thresholds="[{ value: 0, status: 'danger' }, { value: 80, status: 'warning' }, { value: 95, status: 'success' }]" />
        <IChartGauge :value="97" title="任务完成率" unit="%" :thresholds="[{ value: 0, status: 'danger' }, { value: 80, status: 'warning' }, { value: 95, status: 'success' }]" />
        <IChartGauge :value="42" title="资源水位" unit="%" />
      </div>
    </DemoBlock>

    <h2>多维对比</h2>
    <p>雷达图适合看「同一对象在多个维度上的形状」，维度超过八个就该换成条形图——顶点太密时形状不再可读。</p>
    <DemoBlock title="能力雷达">
      <div class="chart-demo">
        <IChartRadar :axes="radarAxes" :series="radarSeries" title="产品能力评估" />
      </div>
    </DemoBlock>

    <h2>相关性</h2>
    <p>
      散点回答的是「这两个量之间有没有关系」。两个轴都要写清楚在量什么，
      只标数字读者不知道自己在看什么。气泡半径按<strong>面积</strong>映射而不是按半径——
      直接拿数值当半径，数值翻一倍看上去会是四倍大。
    </p>
    <p>
      散点的系列上限是 3，这不是随手定的：折线与柱状里只有相邻系列会挨在一起，
      散点则是任意两个点都可能贴着，所以配色必须按「所有两两组合」校验。
      本体系的分类色在这个更严的口径下，亮色与暗色两种模式都只有前三槽同时通过；
      第四槽与品牌蓝的常色差低于可分辨下限，色觉正常的人也难分。
      超出的系列会合并成「其他」，而不是再调一个颜色把问题藏起来。
    </p>
    <DemoBlock
      title="散点与拟合线"
      description="气泡面积表示团队规模，虚线是最小二乘拟合，R² 把「看着像有关系」变成可核对的数字。"
    >
      <IChartScatter
        :series="scatter"
        x-label="投入人天"
        y-label="交付工作项"
        title="投入与产出"
        trend
      />
    </DemoBlock>

    <h2>二维密度</h2>
    <p>
      热力图看「什么时候最忙」这类二维分布。用单色阶而不是彩虹：彩虹会让读者以为
      不同颜色代表不同类别，而不是多与少。深色格子上的数字自动转为反色，任何一格都读得出来。
    </p>
    <DemoBlock title="时段分布">
      <div class="chart-demo">
        <IChartHeatmap :matrix="heat" :rows="weekdays" :columns="hours" title="工作项创建时段" unit=" 条" />
      </div>
    </DemoBlock>

    <h2>流向</h2>
    <p>
      桑基图回答的是「量从哪儿来、到哪儿去、中途漏掉多少」。节点高度按流量占比分配，
      而不是等分——等分会让一条极小的支流和主干看起来一样粗，那正是它要避免的误读。
    </p>
    <DemoBlock
      title="桑基图"
      description="节点是身份，用分类色；缎带继承来源节点的颜色，读者才能顺着颜色追一条流从哪儿来。悬停某个节点会压暗无关的流，一条路径才追得下去。"
      lang="vue"
      code='<IChartSankey :links="sankeyLinks" :labels="sankeyLabels" title="投放去向" unit=" 人" />'
    >
      <IChartSankey :links="sankeyLinks" :labels="sankeyLabels" title="一次投放的用户去向" unit=" 人" />
    </DemoBlock>

    <h2>层级占比</h2>
    <p>
      矩形树图用面积表达占比，适合项数多到饼图已经切不动的场景。
      布局用 squarify 而不是简单切条——切条会产出又长又细的矩形，
      而人眼比较细长条的面积极不准。
    </p>
    <DemoBlock
      title="矩形树图"
      description="块表达的是「多少」而不是「谁」，因此用单色顺序色阶：分类色会让人以为颜色另有含义，而面积已经在表达量级了。放不下文字的小块只在悬停时给出数值——硬塞会溢出到相邻块上，看起来像标错了。"
      lang="vue"
      code='<IChartTreemap :items="treemapItems" title="品类销售额" unit=" 元" />'
    >
      <IChartTreemap :items="treemapItems" title="各品类销售额" unit=" 元" />
    </DemoBlock>

    <h2>区间缩放</h2>
    <p>
      序列一长，整屏画出来就是一团噪声。缩放条给出全量的缩略走势，
      拖动窗口即可放大其中一段——窗口之外压暗而不是隐藏，
      用户才知道自己漏看了什么。
    </p>
    <DemoBlock
      title="拖动缩放"
      description="拖两端的手柄改变范围，拖中间整体平移。手柄可聚焦，方向键微调、Shift 加速、Home/End 归位。窗口最少保留三个点——缩到零宽等于把图表擦掉，而用户无法再拖回来。"
      lang="vue"
      :code="zoomCode"
    >
      <div style="width: 100%">
        <IChart
          :labels="zoomed.labels"
          :series="[{ name: '日活', data: zoomed.values }]"
          :height="220"
        />
        <IChartZoom v-model:window="zoomWindow" :values="zoomValues" :labels="zoomLabels" />
      </div>
    </DemoBlock>

    <h2>分布</h2>
    <p>
      箱线图回答的是「这批数据散得开不开、有没有异常」。它用单一色相而不是分类色——
      每个箱子都是同一件事（一个分布），给它们各上一个颜色会让人以为颜色本身有含义。
    </p>
    <DemoBlock
      title="箱线图"
      description="须延伸到 1.5 倍四分位距内的实测值，而不是画到围栏位置——后者会让须端出现一个数据里根本不存在的数，读者却会把它当成实际的最小值。机场店那两个高值因此被单独标为离群点。"
      lang="vue"
      code='<IChartBox :groups="boxGroups" title="单日出杯量分布" unit=" 杯" />'
    >
      <IChartBox :groups="boxGroups" title="各店单日出杯量分布" unit=" 杯" />
    </DemoBlock>

    <h2>增减归因</h2>
    <p>
      瀑布图回答的是「从期初到期末，中间都发生了什么」。连接线把上一根的终点引到下一根的起点，
      这正是它区别于普通柱状图的地方。
    </p>
    <DemoBlock
      title="瀑布图"
      description="涨跌用双向色阶的两端，而不是状态色的绿与红：收入增加是好事、成本增加是坏事，「增加」这个方向本身并没有好坏，用状态色会把一个中性的方向读成评价。小计柱用中性灰，因为它是绝对量而不是又一次增减。"
      lang="vue"
      code='<IChartWaterfall :items="waterfallItems" title="库存变动" unit=" 件" />'
    >
      <IChartWaterfall :items="waterfallItems" title="本月库存变动" unit=" 件" />
    </DemoBlock>

    <h2>色彩规则</h2>
    <ul class="rules">
      <li><strong>身份用分类色，按固定顺序分配</strong>：第一个系列永远是品牌蓝，第九个系列不再生成新颜色，而应合并为「其他」或改用分面小图。</li>
      <li><strong>量级用单色阶</strong>：同一色相由浅到深，绝不用彩虹——彩虹色阶让读者以为颜色之间有类别差异。</li>
      <li><strong>正负用双向色阶</strong>：两端两个色相，中点是中性灰；有色中点会让「零」看起来像一种倾向。</li>
      <li><strong>语义色是保留的</strong>：成功、警告、危险只表达状态，不会被当成「第四个系列」。</li>
      <li><strong>文字不穿系列色</strong>：数值与标签一律用文字色，身份由旁边那个色块承担。</li>
    </ul>
  </article>
</template>

<style scoped>
.chart-demo { display: flex; flex-direction: column; gap: var(--i-spacing-6); width: 100%; }
.chart-demo--row { flex-direction: row; flex-wrap: wrap; gap: var(--i-spacing-8); }
.spark { margin-top: var(--i-spacing-3); }
.rules { line-height: 1.9; }
.rules li { margin-bottom: var(--i-spacing-2); }
</style>
