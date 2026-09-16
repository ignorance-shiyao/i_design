<script setup lang="ts">
import { computed, ref } from 'vue'
import IComment from '@/components/IComment.vue'
import IThread from '@/components/IThread.vue'
import IButton from '@/components/IButton.vue'
import ILink from '@/components/ILink.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import { message } from '@/components/message'
import { checkMentions, discardComment, retryComment, type ThreadEntry } from '@i-design/common'

/*
 * 线程演示。时间戳都是相对「现在」算的固定偏移，好让文案稳定。
 *
 * 这一串里刻意放齐四件事：一条删掉但底下还有回复的父评论、一组连续的活动记录、
 * 一条发失败还带着原文的评论，以及一条我自己发的（它不该算进未读）。
 */
const base = Date.now() - 3600_000
const at = (n: number) => base + n * 60_000

const entries = ref<ThreadEntry[]>([
  {
    id: 'c1',
    kind: 'comment',
    authorId: 'u2',
    authorName: '沈黎',
    body: '这单客户要求先发一半，剩下的月底再发。',
    createdAt: at(1)
  },
  {
    id: 'c2',
    kind: 'comment',
    authorId: 'u3',
    authorName: '周其',
    body: '（这条原来写错了金额，已删）',
    createdAt: at(2),
    deleted: true
  },
  {
    id: 'c3',
    kind: 'comment',
    authorId: 'u1',
    authorName: '林岚',
    body: '那按 8 万走，分两次开票。',
    createdAt: at(3),
    parentId: 'c2'
  },
  { id: 'a1', kind: 'activity', actorId: 'u1', actorName: '林岚', change: '金额：12 万 → 8 万', createdAt: at(4) },
  { id: 'a2', kind: 'activity', actorId: 'u1', actorName: '林岚', change: '负责人：周其 → 林岚', createdAt: at(5) },
  { id: 'a3', kind: 'activity', actorId: 'u1', actorName: '林岚', change: '状态：待确认 → 已确认', createdAt: at(6) },
  {
    id: 'c4',
    kind: 'comment',
    authorId: 'u2',
    authorName: '沈黎',
    body: '收到，我去改合同附件。',
    createdAt: at(7),
    editedAt: at(8)
  },
  {
    id: 'c5',
    kind: 'comment',
    authorId: 'me',
    authorName: '我',
    body: '合同附件我也看一下再发。',
    createdAt: at(9)
  },
  {
    id: 'c6',
    kind: 'comment',
    authorId: 'me',
    authorName: '我',
    body: '另外提醒一句：这家客户的开票抬头上个月换过，别用旧的那份。',
    createdAt: at(10),
    sendState: 'failed',
    sendError: '网络没连上'
  }
])
/* 我上次读到第 2 分钟：之后沈黎与周其说的话是未读，我自己发的那两条不算 */
const lastReadAt = ref(at(2))

function addOne() {
  entries.value = [
    ...entries.value,
    {
      id: `c${entries.value.length + 7}`,
      kind: 'comment',
      authorId: 'u3',
      authorName: '周其',
      body: '我这边也同步一下仓库。',
      createdAt: Date.now()
    }
  ]
}

const mention = computed(() => checkMentions(['u4'], ['u1', 'u2', 'u3', 'me'], (id) => ({ u4: '陆停云' })[id] ?? id))
</script>

<template>
  <article>
    <h1>Comment 评论</h1>
    <p class="i-lead">
      展示一条讨论记录：谁、什么时候、说了什么。回复用缩进表达从属关系，不用加粗的竖线——那在这套体系里是留给状态与类型的暗示，会被读成别的意思。
    </p>

    <DemoBlock
      title="基础用法"
      code='<IComment author="沈言" datetime="3 小时前" content="这个改动我验过了，表格在窄屏下不再横向滚动。" />'
    >
      <IComment
        author="沈言"
        datetime="3 小时前"
        content="这个改动我验过了，表格在窄屏下不再横向滚动。"
      />
    </DemoBlock>

    <DemoBlock
      title="引用与操作"
      description="引用用淡底色块承载被回复的原文；操作区通常放回复、点赞这类轻量入口。"
      code='<IComment author="林澈" datetime="1 小时前" quote="表格在窄屏下不再横向滚动。" content="窄屏下建议直接切卡片，横向滚动在触屏上很难操作。">
  <template #actions>
    <ILink size="sm" underline="hover">回复</ILink>
  </template>
</IComment>'
    >
      <IComment
        author="林澈"
        datetime="1 小时前"
        quote="表格在窄屏下不再横向滚动。"
        content="窄屏下建议直接切卡片，横向滚动在触屏上很难操作。"
      >
        <template #actions>
          <ILink size="sm" underline="hover" href="#" @click.prevent>回复</ILink>
          <ILink size="sm" underline="hover" theme="default" href="#" @click.prevent>复制链接</ILink>
        </template>
      </IComment>
    </DemoBlock>

    <DemoBlock
      title="嵌套回复"
      description="回复放进 replies 插槽，缩进对齐到头像右侧，视线落在同一条竖轴上。"
      code='<IComment author="沈言" datetime="昨天" content="发版前最后一次确认。">
  <template #replies>
    <IComment reply author="林澈" datetime="昨天" content="确认过了，可以发。" />
  </template>
</IComment>'
    >
      <IComment author="沈言" datetime="昨天" content="发版前最后一次确认。">
        <template #replies>
          <IComment reply author="林澈" datetime="昨天" content="确认过了，可以发。" />
          <IComment reply author="周砚" datetime="昨天" content="移动端我也回归了一遍。" />
        </template>
      </IComment>
    </DemoBlock>

    <h2>线程：活动记录、未读定位与发失败的那条</h2>
    <p>
      一条工单下面那一栏，同时装着两种东西：人说的话，和系统记的账。它们必须按时间穿插在一起——分成两个标签页的话，读者永远拼不出「当时到底发生了什么」：一句「那就这么办」单独看没有意义，它上面那条「金额从 12 万改成 8 万」才是它在回应的东西。
    </p>
    <p>
      <strong>删掉的父评论要留一个坑。</strong>整条抽走之后，底下那几句「同意」「那按这个来」就挂在空气里——同意什么？<strong>未读分隔线在打开的那一刻钉死。</strong>新评论一直在进来，分隔线跟着往下跑的话，用户正读到一半，那条线就从他上方溜到了下方，他再也找不到自己读到哪儿了。<strong>自己说的话不算未读</strong>，否则刚发完一条就有一个未读角标，那个数字永远回不到零。<strong>发失败的评论留在原地，带着原文</strong>——悄悄丢掉是最糟的：用户写了三百字，切走再回来什么都没有，而他以为发出去了。
    </p>
    <DemoBlock
      title="一条真实的工单讨论"
      description="第二条评论被删了，但它底下还有回复，所以它留着位置显示「该评论已删除」。三条连续的变更折成一句「林岚 修改了 3 项」，展开看明细。分隔线停在第一条未读之前——点「来一条新的」看它不动：计数从 3 变 4，线还在原处。最后那条是我发失败的，原文还在，旁边是「重发 / 放弃这条」。"
      lang="vue"
      code='<IThread
  :entries="entries"
  me-id="me"
  :last-read-at="lastReadAt"
  @retry="(c) => resend(c.id)"
  @discard="(c) => drop(c.id)"
  @read="(at) => (lastReadAt = at)"
/>'
    >
      <div class="thread-demo">
        <IButton size="sm" @click="addOne">来一条新的（看分隔线不动）</IButton>
        <IThread
          :entries="entries"
          me-id="me"
          :last-read-at="lastReadAt"
          @reply="(c) => message.info(`回复 ${c.authorName}`)"
          @retry="(c) => (entries = retryComment(entries, c.id) as ThreadEntry[])"
          @discard="(c) => (entries = discardComment(entries, c.id) as ThreadEntry[])"
          @jump="(id) => message.info(`滚到 ${id}`)"
          @read="(at) => (lastReadAt = at)"
        />
        <!-- @ 到话题外的人：不拦，只说清会把 TA 加进来 -->
        <p v-if="mention.warning" class="thread-demo__warning">{{ mention.warning }}</p>
      </div>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>只是要展示一段引用或一条通知时——用引用块或提示条，评论的头像与时间会让人以为有人在等回复。</li>
      <li>讨论长到需要分页、搜索、@ 提醒时——那是一个讨论区功能，不是一个展示组件。</li>
      <li>内容来自不可信来源且未经处理时——评论正文按纯文本渲染，别自行拼 HTML。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>author</td><td><code>string</code></td><td><code>''</code></td><td>作者名，同时作为无图头像的取字来源</td></tr>
        <tr><td>datetime</td><td><code>string</code></td><td><code>''</code></td><td>已格式化的时间文案。相对时间用 <code>logic/date</code> 自行换算</td></tr>
        <tr><td>content</td><td><code>string</code></td><td><code>''</code></td><td>正文，也可用默认插槽传富文本</td></tr>
        <tr><td>quote</td><td><code>string</code></td><td><code>''</code></td><td>被回复的原文</td></tr>
        <tr><td>avatar</td><td><code>string</code></td><td><code>''</code></td><td>头像地址</td></tr>
        <tr><td>reply</td><td><code>boolean</code></td><td><code>false</code></td><td>作为回复出现，收紧留白并缩小头像</td></tr>
      </tbody>
    </table>
    <table class="i-table">
      <thead><tr><th>插槽</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>default</td><td>正文</td></tr>
        <tr><td>avatar</td><td>自定义头像</td></tr>
        <tr><td>quote</td><td>自定义引用内容</td></tr>
        <tr><td>actions</td><td>操作区</td></tr>
        <tr><td>replies</td><td>回复列表</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.thread-demo { display: grid; gap: var(--i-spacing-3); width: min(720px, 100%); }
.thread-demo__warning {
  margin: 0;
  font-size: var(--i-font-size-sm);
  color: var(--i-color-warning-text);
}
</style>
