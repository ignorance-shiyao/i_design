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

const view = ref<'line' | 'bar'>('line')
const views = [
  { label: '折线', value: 'line' },
  { label: '柱状', value: 'bar' }
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
.spark { margin-top: var(--i-spacing-3); }
.rules { line-height: 1.9; }
.rules li { margin-bottom: var(--i-spacing-2); }
</style>
