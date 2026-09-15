<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import ITaskCenter from '@/components/ITaskCenter.vue'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import { message } from '@/components/message'
import { notification } from '@/components/notification'
import {
  commandEntries,
  firstRunnable,
  submitTask,
  taskNotice,
  type AsyncTaskItem,
  type GuardedCommand
} from '@i-design/common'

/*
 * 三者整合的演示：命令面板发起 → 任务中心追踪 → 通知定位到业务对象。
 *
 * 任务真的在跑（三秒后结束），因此「同一件事正在跑就不再排第二个」这条
 * 点两下就看得见；第二次的那条导入故意失败，好让失败通知里那句人话有内容。
 */
const seq = ref(0)
const tasks = ref<AsyncTaskItem[]>([
  {
    id: 'T-8840',
    title: '批量改负责人',
    state: 'succeeded',
    createdAt: Date.now() - 600_000,
    finishedAt: Date.now() - 590_000,
    actor: '林岚',
    result: '改了 42 张单',
    target: { kind: '订单', id: 'SO-2026-0912', label: 'SO-2026-0912' },
    seen: true
  },
  {
    id: 'T-8841',
    title: '导入客户',
    state: 'failed',
    createdAt: Date.now() - 300_000,
    finishedAt: Date.now() - 280_000,
    actor: '沈黎',
    error: '第 12 行客户为空'
  }
])

const timers: ReturnType<typeof setTimeout>[] = []
onUnmounted(() => timers.forEach(clearTimeout))

function finish(id: string, patch: Partial<AsyncTaskItem>) {
  tasks.value = tasks.value.map((task) =>
    task.id === id ? { ...task, finishedAt: Date.now(), ...patch } : task
  )
  const done = tasks.value.find((task) => task.id === id)!
  const notice = taskNotice(done)!
  /* 通知照抄任务的出口：有业务对象就直奔那张单，没有就至少能去任务详情 */
  notification[notice.tone === 'danger' ? 'danger' : 'success'](notice.title, {
    description: notice.description,
    actions: [
      {
        label: notice.actionLabel,
        onClick: () => message.info(`交给调用方去打开：${notice.target?.label ?? done.id}`)
      }
    ]
  })
}

function runExport() {
  seq.value += 1
  const id = `T-89${String(seq.value).padStart(2, '0')}`
  const result = submitTask(tasks.value, {
    id,
    title: '导出销售订单',
    state: 'running',
    createdAt: Date.now(),
    actor: '林岚',
    dedupeKey: '导出:已发货',
    target: { kind: '报表', id, label: '销售订单-已发货' }
  })
  tasks.value = result.tasks
  // 合并时要明说「它已经在跑了」，否则用户会以为没点着，接着点第三次
  message[result.merged ? 'warning' : 'success'](result.message)
  if (result.merged) return
  timers.push(
    setTimeout(() => finish(id, { state: 'succeeded', result: '导出 48000 行' }), 3000)
  )
}

/* 命令面板：没权限的照常出现，但禁用并写明理由 */
const commands: GuardedCommand[] = [
  { key: 'export', label: '导出销售订单', keywords: ['daochu', 'export'], group: '订单' },
  { key: 'import', label: '导入客户', keywords: ['daoru'], group: '客户' },
  { key: 'settings', label: '系统设置', keywords: ['settings'], group: '系统', permission: 'admin' }
]
const keyword = ref('')
const can = (permission: string) => permission !== 'admin'
const entries = computed(() => commandEntries(commands, keyword.value, can))
const runnable = computed(() => firstRunnable(entries.value))
</script>

<template>
  <article class="i-doc">
    <h1>TaskCenter 任务中心</h1>
    <p class="i-lead">
      凡是「点一下之后不会马上完事」的动作——导出、导入、批量改、生成报表——都会落到同一个地方。任务中心不是一个通知列表，它要回答的是「那件事现在怎么样了、它动了什么、出问题我找谁」。
    </p>

    <h2>三件必须做到的事</h2>
    <p>
      <strong>每条任务都追得到它改了什么。</strong>「导入完成」这四个字本身毫无用处：完成的是哪一次导入、改的是哪张单、出问题了找谁。所以任务号与业务对象一直摆在界面上，通知也照抄这两样；没有业务对象的任务，给的是任务号与「查看任务详情」，绝不只报一句「完成了」——那样用户唯一能做的就是去列表里一条条翻。任务号排在追踪行第一位：用户打电话给客服时，能报出来的只有它。
    </p>
    <p>
      <strong>角标数的是「要人处理的」，不是任务总数。</strong>把进行中的也算进去，那个数字永远回不到零，几天之后所有人都不再看它。要人处理的只有两类：失败了的，和跑完了但还没人看过的。
    </p>
    <p>
      <strong>同一件事正在跑，就不要再排一个。</strong>导出点三次拿三份一样的文件，是这一条没做的直接后果。合并时必须说清「它已经在跑了」，否则用户会以为没点着，接着点第三次。
    </p>

    <DemoBlock
      title="发起、追踪与定位"
      description="点「导出销售订单」：任务进入列表最上面，三秒后完成并弹出通知——通知里那个按钮写的是「查看报表」，点下去落到具体那份报表，不是一句「完成了」。在它跑完之前再点一次：不会排出第二条，而是告诉你它已经在跑了，并给出任务号。展开任意一条的「追踪」，第一行就是任务号。"
      lang="vue"
      code='<ITaskCenter
  v-model:tasks="tasks"
  @open="(target) => router.push(hrefOf(target))"
  @inspect="(task) => router.push(`/tasks/${task.id}`)"
  @retry="resubmit"
  @cancel="abort"
/>'
    >
      <div class="task-demo">
        <IButton variant="primary" @click="runExport">导出销售订单</IButton>
        <ITaskCenter
          v-model:tasks="tasks"
          @open="(target) => message.info(`交给调用方去打开：${target.kind}「${target.label}」`)"
          @inspect="(task) => message.info(`去任务详情：${task.id}`)"
          @retry="(task) => message.info(`重新提交：${task.title}`)"
          @cancel="(task) => message.info(`取消：${task.title}`)"
        />
      </div>
    </DemoBlock>

    <h2>命令面板里没权限的命令</h2>
    <p>
      与详情页的动作同一套口径：<strong>没权限的命令照常出现，但禁用并写明理由</strong>。直接过滤掉的话，用户搜「设置」搜不到，会以为系统没有这个功能，转头去问「你们这儿能改设置吗」——而正确答案是「能，但你这个角色不行」。回车执行的是第一条<strong>可用</strong>的命令，不是第一条：否则光标停在一条灰掉的命令上，按回车什么也不会发生，用户只会再按一次。
    </p>
    <DemoBlock
      title="搜得到，但点不动"
      description="输入「设置」：「系统设置」照常出现在结果里，灰着，后面写明「当前角色没有这个权限」。下面那行标出的是「回车会执行哪一条」——它跳过灰掉的那些。"
      lang="ts"
      code="const entries = commandEntries(commands, keyword, (p) => user.can(p))
const onEnter = () => firstRunnable(entries)?.command"
    >
      <div class="cmd-demo">
        <input v-model="keyword" class="i-input" placeholder="搜命令，试试「设置」" />
        <ul class="cmd-demo__list">
          <li v-for="entry in entries" :key="entry.command.key" :class="{ 'is-off': entry.disabled }">
            <span>{{ entry.command.label }}</span>
            <!-- 理由摆在条目上，不藏在提示里：悬停才看得见的解释等于没有 -->
            <span v-if="entry.disabled" class="cmd-demo__reason">{{ entry.reason }}</span>
          </li>
        </ul>
        <p class="cmd-demo__enter">
          回车会执行：{{ runnable ? runnable.command.label : '没有可执行的命令' }}
        </p>
      </div>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>动作一秒内就完事时——直接给结果，不要为它建一条任务，用户还得再去点开看。</li>
      <li>只有一条任务且用户正盯着它时——就地显示进度即可（见 ExportJob），不必把人送到别处。</li>
      <li>拿它当日志用时——任务中心是「我提交的那几件事」，全量审计要另一套按对象检索的记录。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>tasks</td><td><code>AsyncTaskItem[]</code></td><td><code>[]</code></td><td>任务列表，支持 v-model</td></tr>
        <tr><td>title</td><td><code>string</code></td><td><code>任务中心</code></td><td>标题</td></tr>
        <tr><td>formatTime</td><td><code>(ms) =&gt; string</code></td><td>本地格式</td><td>时间怎么排版；时区是各端从系统拿的，因此留在调用方</td></tr>
        <tr><td>showTrail</td><td><code>boolean</code></td><td><code>false</code></td><td>默认展开追踪行</td></tr>
      </tbody>
    </table>
    <table class="i-table">
      <thead><tr><th>事件</th><th>回调参数</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>open</td><td><code>(target, task)</code></td><td>去这条任务动到的业务对象</td></tr>
        <tr><td>inspect</td><td><code>task</code></td><td>没有业务对象时的出口：任务详情</td></tr>
        <tr><td>retry</td><td><code>task</code></td><td>重新提交失败的任务</td></tr>
        <tr><td>cancel</td><td><code>task</code></td><td>取消进行中的任务</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.task-demo { display: grid; gap: var(--i-spacing-4); width: min(720px, 100%); }
.cmd-demo { display: grid; gap: var(--i-spacing-2); width: min(480px, 100%); }
.cmd-demo__list { display: grid; gap: 2px; margin: 0; padding: 0; list-style: none; }
.cmd-demo__list li {
  display: flex;
  align-items: baseline;
  gap: var(--i-spacing-2);
  padding: var(--i-spacing-2) var(--i-spacing-3);
  border-radius: var(--i-radius-sm);
  background: var(--i-color-bg-subtle);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text);
}
/* 灰掉的那条仍然读得出来：过滤掉才是真的看不见 */
.cmd-demo__list li.is-off { color: var(--i-color-text-tertiary); }
.cmd-demo__reason { font-size: var(--i-font-size-xs); color: var(--i-color-text-tertiary); }
.cmd-demo__enter { font-size: var(--i-font-size-sm); color: var(--i-color-text-secondary); }
</style>
