<script setup lang="ts">
import { ref } from 'vue'
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
import DemoBlock from '@/site/DemoBlock.vue'

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
