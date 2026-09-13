<script setup lang="ts">
import { computed, ref } from "vue";
import IIcon from "@/components/IIcon.vue";
import IChart from "@/components/IChart.vue";
import ITag from "@/components/ITag.vue";
import IButton from "@/components/IButton.vue";
import IInput from "@/components/IInput.vue";

// 文档站场景预览：只组合已有组件，所有数据均为可重置的本地示例。
const scene = ref("erp");
const scenes = [
  {
    id: "erp",
    name: "经营分析",
    label: "ERP",
    icon: "grid",
    to: "/components/chart",
  },
  {
    id: "oa",
    name: "协同办公",
    label: "OA",
    icon: "file-text",
    to: "/components/steps",
  },
  {
    id: "ai",
    name: "智能工作台",
    label: "AI",
    icon: "sparkle",
    to: "/components/chat",
  },
] as const;
const current = computed(() => scenes.find((item) => item.id === scene.value)!);
const chartType = ref<"bar" | "line">("bar");
const labels = ["4月", "5月", "6月", "7月", "8月", "9月"];
const series = [
  { name: "销售额", data: [68, 85, 74, 106, 92, 128] },
  { name: "目标", data: [80, 80, 85, 90, 100, 120] },
];
const latestSales = series[0].data[series[0].data.length - 1];
const latestTarget = series[1].data[series[1].data.length - 1];
const growth = (
  (latestSales / series[0].data[series[0].data.length - 2] - 1) *
  100
).toFixed(1);
const completion = ((latestSales / latestTarget) * 100).toFixed(1);
const approved = ref(false);
const question = ref("");
const reply = ref(
  "这里可以用自然语言连接业务。试试选择一个问题，查看对应组件如何协同。"
);
const asked = ref("");
const prompts = [
  "销售额变化如何？",
  "如何设计审批确认？",
  "如何展示工具调用？",
];
function ask(text: string) {
  if (!text.trim()) return;
  asked.value = text.trim();
  question.value = "";
  if (/销售|经营|数据/.test(text))
    reply.value = `示例数据中，9 月销售额 ${latestSales} 万元，较 8 月增长 ${growth}%，目标完成率 ${completion}%。可以组合 Chart、Statistic 与 InsightCards 展示依据。`;
  else if (/审批|确认/.test(text))
    reply.value =
      "将待执行操作、影响范围与可选动作放入 ApprovalCard；确认后用 AgentTasks 更新任务状态。业务服务仍需验证权限与操作版本。";
  else if (/工具|调用/.test(text))
    reply.value =
      "用 ChatToolCall 展示工具名称、输入和执行结果，ToolChips 收纳连续调用；失败时保留错误信息和重试入口。";
  else
    reply.value =
      "这是本地交互示例，支持“销售额”“审批确认”“工具调用”三个主题。完整对话、引用与智能体组件可在 AI 会话文档中体验。";
}
function reset() {
  approved.value = false;
  question.value = "";
  asked.value = "";
  reply.value =
    "这里可以用自然语言连接业务。试试选择一个问题，查看对应组件如何协同。";
  chartType.value = "bar";
}
</script>
<template>
  <div class="showcase-desk">
    <div class="desk-top">
      <span class="desk-wordmark"
        ><IIcon name="layers" :size="18" /> i-design
        <span>/ workspace</span></span
      ><span class="desk-caption">交互场景 · 示例数据</span
      ><button
        type="button"
        class="reset-button"
        aria-label="重置场景示例"
        title="重置场景示例"
        @click="reset"
      >
        <IIcon name="refresh" :size="15" />
      </button>
    </div>
    <div class="desk-layout">
      <aside class="desk-sidebar">
        <span class="desk-label">WORKSPACE</span>
        <div class="scene-nav" role="group" aria-label="切换业务场景">
          <button
            v-for="item in scenes"
            :key="item.id"
            type="button"
            :aria-pressed="scene === item.id"
            :class="{ 'is-active': scene === item.id }"
            @click="scene = item.id"
          >
            <IIcon :name="item.icon" :size="17" /><span>{{ item.name }}</span
            ><small>{{ item.label }}</small>
          </button>
        </div>
        <RouterLink class="desk-guide" to="/design/tokens"
          ><IIcon name="palette" :size="16" /><span
            >你的品牌，你的风格<small>探索主题与令牌</small></span
          ><IIcon name="arrow-right" :size="14"
        /></RouterLink>
      </aside>
      <section class="desk-main" :aria-label="current.name">
        <div class="desk-heading">
          <div>
            <span class="desk-label">{{ current.label }} / OVERVIEW</span>
            <h2>
              {{ current.name }}<span>每一个细节，都在同一套体系里。</span>
            </h2>
          </div>
          <RouterLink :to="current.to" class="desk-doc"
            >组件文档 <IIcon name="arrow-right" :size="14"
          /></RouterLink>
        </div>
        <template v-if="scene === 'erp'">
          <div class="metrics">
            <div>
              <span>9 月销售额</span
              ><strong>{{ latestSales }}<small>万元</small></strong
              ><span class="metric-positive"
                ><IIcon name="arrow-right" :size="12" /> 较 8 月 +{{
                  growth
                }}%</span
              >
            </div>
            <div>
              <span>目标完成率</span
              ><strong>{{ completion }}<small>%</small></strong
              ><span>当月目标 {{ latestTarget }} 万元</span>
            </div>
            <div>
              <span>业务状态</span
              ><strong class="metric-state"
                ><IIcon name="check-circle" :size="21" /> 达成目标</strong
              ><span>统计口径：月度销售额</span>
            </div>
          </div>
          <div class="desk-chart">
            <div class="chart-heading">
              <h3>销售趋势<span>2026 年 / 单位：万元</span></h3>
              <div class="chart-toggle" role="group" aria-label="图表类型">
                <button
                  type="button"
                  :aria-pressed="chartType === 'bar'"
                  @click="chartType = 'bar'"
                >
                  柱状</button
                ><button
                  type="button"
                  :aria-pressed="chartType === 'line'"
                  @click="chartType = 'line'"
                >
                  折线
                </button>
              </div>
            </div>
            <IChart
              :series="series"
              :labels="labels"
              :type="chartType"
              :height="190"
              :label-last="false"
              title="月度销售额与目标"
              unit="万元"
            />
          </div>
        </template>
        <template v-else-if="scene === 'oa'">
          <div class="approval-overview">
            <span class="approval-icon"
              ><IIcon
                :name="approved ? 'check-circle' : 'file-text'"
                :size="28"
            /></span>
            <div>
              <h3>设计资源采购申请</h3>
              <p>申请编号 OA-2026-0913 · 产品设计组</p>
            </div>
            <ITag :type="approved ? 'success' : 'warning'">{{
              approved ? "已通过" : "待审批"
            }}</ITag>
          </div>
          <dl class="approval-fields">
            <div>
              <dt>申请项目</dt>
              <dd>组件库设计资源</dd>
            </div>
            <div>
              <dt>申请金额</dt>
              <dd>¥ 2,400.00</dd>
            </div>
            <div>
              <dt>申请日期</dt>
              <dd>2026-09-13</dd>
            </div>
          </dl>
          <ol class="approval-steps">
            <li>
              <IIcon name="check-circle" :size="20" />
              <div>提交申请<small>申请信息已完整提交</small></div>
              <ITag type="success">已完成</ITag>
            </li>
            <li>
              <IIcon :name="approved ? 'check-circle' : 'clock'" :size="20" />
              <div>
                负责人审批<small>{{
                  approved
                    ? "申请已通过，可进入采购流程"
                    : "核对采购内容与申请金额"
                }}</small>
              </div>
              <ITag :type="approved ? 'success' : 'warning'">{{
                approved ? "已完成" : "待处理"
              }}</ITag>
            </li>
          </ol>
          <div class="approval-actions">
            <p role="status">
              {{
                approved
                  ? "已更新本地示例状态。可点击重置再次体验。"
                  : "点击通过，体验状态反馈。仅影响本地示例。"
              }}
            </p>
            <IButton :disabled="approved" @click="approved = true">{{
              approved ? "已通过申请" : "通过申请"
            }}</IButton>
          </div>
        </template>
        <template v-else>
          <div class="ai-intro">
            <span class="ai-mark"><IIcon name="sparkle" :size="24" /></span>
            <div>
              <h3>把想法，变成下一步行动。</h3>
              <p>对话、依据与操作，在同一个上下文里。</p>
            </div>
          </div>
          <div class="ai-prompts">
            <button
              v-for="prompt in prompts"
              :key="prompt"
              type="button"
              @click="ask(prompt)"
            >
              {{ prompt }} <IIcon name="arrow-right" :size="12" />
            </button>
          </div>
          <div class="ai-answer" aria-live="polite">
            <span v-if="asked" class="ai-question">{{ asked }}</span>
            <p>{{ reply }}</p>
            <RouterLink to="/components/chat"
              ><IIcon name="file-text" :size="13" /> 查看 AI
              会话组件</RouterLink
            >
          </div>
          <form class="ai-form" @submit.prevent="ask(question)">
            <IInput
              v-model="question"
              aria-label="体验场景提问"
              placeholder="询问销售额、审批确认或工具调用…"
            /><IButton
              type="submit"
              :disabled="!question.trim()"
              aria-label="发送示例问题"
              ><IIcon name="arrow-right" :size="16"
            /></IButton>
          </form>
          <p class="ai-note">本地交互演示，回复来自预设示例。</p>
        </template>
      </section>
    </div>
    <div class="desk-bottom">
      <span><IIcon name="check-circle" :size="13" /> 真实组件，可直接交互</span
      ><RouterLink to="/components/icon"
        >探索图标 <IIcon name="arrow-right" :size="13"
      /></RouterLink>
    </div>
  </div>
</template>
<style scoped>
.showcase-desk {
  border: 1px solid var(--i-color-border);
  border-radius: var(--i-radius-xl);
  background: var(--i-color-bg-elevated);
  box-shadow: var(--i-shadow-lg);
  overflow: hidden;
}
.desk-top {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-3);
  padding: var(--i-spacing-4) var(--i-spacing-6);
  border-bottom: 1px solid var(--i-color-hairline);
  background: var(--i-color-bg-subtle);
}
.desk-wordmark {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-2);
  font-size: var(--i-font-size-sm);
  font-weight: var(--i-font-weight-semibold);
}
.desk-wordmark > span {
  color: var(--i-color-text-secondary);
  font-weight: var(--i-font-weight-regular);
}
.desk-wordmark svg {
  color: var(--i-color-brand-text);
}
.desk-caption {
  margin-left: auto;
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-secondary);
}
.reset-button {
  display: grid;
  place-items: center;
  border: 0;
  background: none;
  color: var(--i-color-text-secondary);
  padding: var(--i-spacing-2);
  cursor: pointer;
  border-radius: var(--i-radius-md);
}
.reset-button:hover {
  background: var(--i-color-bg-muted);
}
.desk-layout {
  display: grid;
  grid-template-columns: calc(var(--i-spacing-24) * 2.3) minmax(0, 1fr);
}
.desk-sidebar {
  display: flex;
  flex-direction: column;
  padding: var(--i-spacing-6) var(--i-spacing-4);
  border-right: 1px solid var(--i-color-hairline);
  background: var(--i-color-bg-subtle);
}
.desk-label {
  display: block;
  color: var(--i-color-text-secondary);
  font: var(--i-font-size-xs) var(--i-font-family-mono);
  letter-spacing: 0.09em;
}
.desk-sidebar > .desk-label {
  padding: var(--i-spacing-2) var(--i-spacing-3);
}
.scene-nav {
  display: grid;
  gap: var(--i-spacing-2);
  margin-top: var(--i-spacing-4);
}
.scene-nav button {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-3);
  border: 1px solid transparent;
  border-radius: var(--i-radius-lg);
  background: none;
  color: var(--i-color-text-secondary);
  padding: var(--i-spacing-3);
  font-size: var(--i-font-size-sm);
  cursor: pointer;
  text-align: left;
}
.scene-nav button small {
  margin-left: auto;
  font: var(--i-font-size-xs) var(--i-font-family-mono);
}
.scene-nav button:hover {
  background: var(--i-color-bg-muted);
}
.scene-nav button.is-active {
  background: var(--i-color-bg-elevated);
  color: var(--i-color-brand-text);
  border-color: var(--i-color-hairline);
  box-shadow: var(--i-shadow-sm);
  font-weight: var(--i-font-weight-semibold);
}
.desk-guide {
  margin-top: auto;
  padding: var(--i-spacing-8) var(--i-spacing-2) var(--i-spacing-2);
  display: flex;
  align-items: center;
  gap: var(--i-spacing-2);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-xs);
}
.desk-guide small {
  display: block;
  margin-top: var(--i-spacing-1);
  font-size: var(--i-font-size-xs);
}
.desk-guide > svg {
  flex: none;
}
.desk-main {
  min-width: 0;
  padding: var(--i-spacing-6) var(--i-spacing-8);
  min-height: calc(var(--i-spacing-24) * 4.8);
}
.desk-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-4);
  margin-bottom: var(--i-spacing-6);
}
.desk-heading h2 {
  font-size: var(--i-font-size-xl);
  margin-top: var(--i-spacing-2);
  font-weight: var(--i-font-weight-semibold);
  letter-spacing: -0.03em;
}
.desk-heading h2 span {
  display: block;
  font-size: var(--i-font-size-xs);
  font-weight: var(--i-font-weight-regular);
  color: var(--i-color-text-secondary);
  letter-spacing: 0;
  margin-top: var(--i-spacing-1);
}
.desk-doc {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: var(--i-spacing-2);
  color: var(--i-color-brand-text);
  font-size: var(--i-font-size-xs);
}
.metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--i-spacing-4);
  padding-bottom: var(--i-spacing-6);
  border-bottom: 1px solid var(--i-color-hairline);
}
.metrics > div {
  display: flex;
  flex-direction: column;
  gap: var(--i-spacing-1);
}
.metrics span {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-1);
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-secondary);
}
.metrics strong {
  font-size: var(--i-font-size-3xl);
  font-weight: var(--i-font-weight-medium);
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  line-height: 1.7;
}
.metrics strong small {
  font-size: var(--i-font-size-xs);
  margin-left: var(--i-spacing-1);
  font-weight: var(--i-font-weight-regular);
  color: var(--i-color-text-secondary);
}
.metrics .metric-positive {
  color: var(--i-color-success-text);
}
.metrics .metric-state {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-2);
  font-size: var(--i-font-size-lg);
  min-height: calc(var(--i-font-size-3xl) * 1.7);
}
.metric-state svg {
  color: var(--i-color-success-text);
}
.desk-chart {
  margin-top: var(--i-spacing-5);
}
.chart-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--i-spacing-3);
  margin-bottom: var(--i-spacing-3);
}
.chart-heading h3 {
  font-size: var(--i-font-size-sm);
  font-weight: var(--i-font-weight-medium);
}
.chart-heading h3 span {
  margin-left: var(--i-spacing-3);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-xs);
  font-weight: var(--i-font-weight-regular);
}
.chart-toggle {
  display: flex;
  padding: var(--i-spacing-1);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-lg);
  background: var(--i-color-bg-subtle);
}
.chart-toggle button {
  border: 0;
  border-radius: var(--i-radius-md);
  padding: var(--i-spacing-1) var(--i-spacing-3);
  background: none;
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-xs);
  cursor: pointer;
}
.chart-toggle button[aria-pressed="true"] {
  background: var(--i-color-bg-elevated);
  color: var(--i-color-brand-text);
  box-shadow: var(--i-shadow-sm);
  font-weight: var(--i-font-weight-semibold);
}
.desk-bottom {
  border-top: 1px solid var(--i-color-hairline);
  padding: var(--i-spacing-3) var(--i-spacing-6);
  display: flex;
  justify-content: space-between;
  gap: var(--i-spacing-3);
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-secondary);
}
.desk-bottom span,
.desk-bottom a {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-2);
}
.desk-bottom a {
  color: var(--i-color-text-secondary);
}
.approval-overview,
.ai-intro {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-4);
}
.approval-overview > :last-child {
  margin-left: auto;
}
.approval-overview h3,
.ai-intro h3 {
  font-size: var(--i-font-size-lg);
  font-weight: var(--i-font-weight-medium);
}
.approval-overview p,
.ai-intro p {
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-secondary);
  margin-top: var(--i-spacing-1);
}
.approval-icon,
.ai-mark {
  display: grid;
  place-items: center;
  width: var(--i-spacing-12);
  height: var(--i-spacing-12);
  flex: none;
  border-radius: var(--i-radius-lg);
  background: var(--i-color-brand-subtle);
  color: var(--i-color-brand-text);
}
.approval-fields {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: var(--i-spacing-5) 0;
  gap: var(--i-spacing-3);
  border-bottom: 1px solid var(--i-color-hairline);
}
.approval-fields dt {
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-secondary);
}
.approval-fields dd {
  margin-top: var(--i-spacing-2);
  font-size: var(--i-font-size-sm);
}
.approval-steps {
  list-style: none;
  margin: var(--i-spacing-5) 0;
  padding: 0;
}
.approval-steps li {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-3);
  padding: var(--i-spacing-3) 0;
  font-size: var(--i-font-size-sm);
}
.approval-steps li > svg {
  color: var(--i-color-brand-text);
  flex: none;
}
.approval-steps small {
  display: block;
  margin-top: var(--i-spacing-1);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-xs);
}
.approval-steps li > :last-child {
  margin-left: auto;
}
.approval-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-4);
}
.approval-actions p {
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-secondary);
}
.ai-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--i-spacing-2);
  margin: var(--i-spacing-5) 0;
}
.ai-prompts button {
  display: inline-flex;
  align-items: center;
  gap: var(--i-spacing-2);
  background: var(--i-color-bg-subtle);
  color: var(--i-color-text-secondary);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-full);
  padding: var(--i-spacing-2) var(--i-spacing-3);
  font-size: var(--i-font-size-xs);
  cursor: pointer;
}
.ai-prompts button:hover {
  color: var(--i-color-brand-text);
  border-color: var(--i-color-border-strong);
}
.ai-answer {
  padding: var(--i-spacing-5);
  background: var(--i-color-bg-subtle);
  border-radius: var(--i-radius-lg);
  min-height: calc(var(--i-spacing-16) * 2);
  font-size: var(--i-font-size-sm);
  line-height: var(--i-line-height-loose);
}
.ai-question {
  display: block;
  font-weight: var(--i-font-weight-semibold);
  margin-bottom: var(--i-spacing-2);
}
.ai-answer > a {
  display: inline-flex;
  align-items: center;
  gap: var(--i-spacing-2);
  margin-top: var(--i-spacing-3);
  color: var(--i-color-brand-text);
  font-size: var(--i-font-size-xs);
}
.ai-form {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-2);
  margin-top: var(--i-spacing-5);
}
.ai-form > :first-child {
  flex: 1;
  min-width: 0;
}
.ai-note {
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-xs);
  margin-top: var(--i-spacing-2);
}
@media (max-width: 900px) {
  .desk-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .desk-sidebar {
    padding: var(--i-spacing-3) var(--i-spacing-4);
    border-right: 0;
    border-bottom: 1px solid var(--i-color-hairline);
  }
  .desk-sidebar > .desk-label,
  .desk-guide {
    display: none;
  }
  .scene-nav {
    display: flex;
    margin: 0;
  }
  .scene-nav button {
    flex: 1;
    justify-content: center;
  }
  .scene-nav button small {
    display: none;
  }
}
@media (max-width: 640px) {
  .desk-top {
    padding: var(--i-spacing-3);
  }
  .desk-caption {
    display: none;
  }
  .reset-button {
    margin-left: auto;
  }
  .desk-sidebar {
    padding: var(--i-spacing-2);
  }
  .scene-nav {
    gap: var(--i-spacing-1);
  }
  .scene-nav button {
    flex-direction: column;
    gap: var(--i-spacing-1);
    padding: var(--i-spacing-2) var(--i-spacing-1);
    font-size: var(--i-font-size-xs);
  }
  .desk-main {
    padding: var(--i-spacing-5) var(--i-spacing-3);
  }
  .desk-heading {
    flex-wrap: wrap;
    gap: var(--i-spacing-2);
  }
  .desk-heading h2 span {
    margin-top: var(--i-spacing-2);
  }
  .metrics {
    grid-template-columns: 1fr 1fr;
    gap: var(--i-spacing-3);
  }
  .metrics > div:last-child {
    grid-column: 1 / -1;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--i-spacing-2);
  }
  .metrics .metric-state {
    font-size: var(--i-font-size-sm);
    min-height: 0;
  }
  .metrics > div:last-child > span:last-child {
    display: none;
  }
  .metrics strong {
    font-size: var(--i-font-size-2xl);
  }
  .chart-heading h3 span {
    display: block;
    margin-left: 0;
    margin-top: var(--i-spacing-1);
  }
  .chart-toggle button {
    padding: var(--i-spacing-1) var(--i-spacing-2);
  }
  .desk-bottom {
    padding: var(--i-spacing-3);
    flex-wrap: wrap;
  }
  .approval-overview {
    flex-wrap: wrap;
    gap: var(--i-spacing-2);
  }
  .approval-fields {
    grid-template-columns: 1fr;
  }
  .approval-fields > div {
    display: flex;
    justify-content: space-between;
  }
  .approval-fields dd {
    margin: 0;
  }
  .approval-actions {
    align-items: start;
    flex-direction: column;
  }
  .ai-intro {
    align-items: start;
    gap: var(--i-spacing-2);
  }
  .ai-intro h3 {
    font-size: var(--i-font-size-md);
  }
  .ai-mark {
    width: var(--i-spacing-8);
    height: var(--i-spacing-8);
  }
  .ai-answer {
    padding: var(--i-spacing-3);
  }
}
</style>
