<script setup lang="ts">
import { computed, ref } from 'vue'
import ICard from '@/components/ICard.vue'
import IButton from '@/components/IButton.vue'
import IDetailPage from '@/components/IDetailPage.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import { packReturn, type DetailActionSpec } from '@i-design/common'
import { message } from '@/components/message'

/*
 * 详情页演示的那条订单。
 *
 * 状态、权限、失效三档都能在页面上切，因为这条组件的全部内容就是
 * 「在这三档的不同组合下，按钮该出现、该灰、还是根本不该在」——
 * 说一遍不如让人自己切一下。
 */
const detailActionSpecs: DetailActionSpec[] = [
  { key: 'edit', label: '编辑', states: ['草稿'] },
  { key: 'submit', label: '提交', kind: 'primary', states: ['草稿'] },
  { key: 'approve', label: '通过', kind: 'primary', states: ['待审批'], permission: '审批' },
  { key: 'void', label: '作废', kind: 'danger', states: ['待审批'], permission: '作废' },
  { key: 'print', label: '打印', readonly: true }
]
const detailStatus = ref('待审批')
const detailPerms = ref<string[]>([])
const detailStale = ref(false)
const detailIds = ['SO-2026-0006', 'SO-2026-0007', 'SO-2026-0008']
const detailId = ref('SO-2026-0007')
/** 从列表第 7 页、滚到 1280px 的位置点进来的 */
const detailTicket = packReturn({ search: '?owner=林岚&page=6', scrollY: 1280, focusId: 'SO-2026-0007' })
const detailTone = computed(() => (detailStatus.value === '草稿' ? 'default' : 'warning') as 'default' | 'warning')
</script>

<template>
  <article>
    <h1>Card 卡片</h1>
    <p class="i-lead">承载一组相关信息的容器。同级卡片应保持等高与等宽，避免视觉上的主次误读。</p>

    <DemoBlock
      title="基础卡片"
      code='<ICard title="迭代概览">本迭代共 24 个工作项，已完成 18 个。</ICard>'
    >
      <div class="w"><ICard title="迭代概览">本迭代共 24 个工作项，已完成 18 个。</ICard></div>
    </DemoBlock>

    <DemoBlock
      title="悬浮与页脚"
      description="hoverable 用于可点击进入详情的卡片，为其提供明确的可交互暗示。"
      code='<ICard title="发布计划" hoverable>
  下一次发布定于本周五。
  <template #footer>
    <IButton variant="text">查看详情</IButton>
  </template>
</ICard>'
    >
      <div class="w">
        <ICard title="发布计划" hoverable>
          下一次发布定于本周五。
          <template #footer><IButton variant="text">查看详情</IButton></template>
        </ICard>
      </div>
    </DemoBlock>

    <h2>把一条记录摊开：DetailPage</h2>
    <p>
      详情页看着只是「把一条记录摊开」，真正难的是「这条记录现在能做什么」。这里有一条容易走反的分界：<strong>状态不允许的动作不出现</strong>——它在这个状态下根本不是一个动作，灰着摆在那儿只会让人反复去试、去猜要满足什么条件；<strong>没权限的动作出现但停用并说明原因</strong>——藏起来的话，用户会以为这个功能不存在，转头去问同事、提工单，而答案其实只是「你没有这个权限」。
    </p>
    <p>
      灰按钮的理由写在按钮下面一行，不只挂在 <code>title</code> 上：触摸屏没有悬停，读屏也不会主动去念 <code>title</code>。同一个原因挡住两个动作时按原因归并，不说两遍。
    </p>
    <DemoBlock
      title="切一下状态、权限与失效，看按钮怎么变"
      description="草稿态只有「编辑 / 提交 / 打印」，「通过 / 作废」根本不出现；切到待审批，它们出现了但是灰的，底下写着缺哪个权限。勾上「已被他人更新」：写动作全停，而「打印」照常可用——把打印一起停掉只会让人以为整页坏了；失效提示排在动作上面，放下面的话用户会先点、再读到「这份已经旧了」。左上角的返回按钮写的是「返回列表第 7 页」，因为进来时那张票据里记着页码与滚动位置。"
      lang="vue"
      code='<IDetailPage
  :title="order.id"
  :status="order.status"
  :actions="actionSpecs"
  :permissions="myPermissions"
  :seen-revision="seen"
  :current-revision="current"
  :sibling-ids="idsFromList"
  :current-id="order.id"
  :return-ticket="ticket"
  @action="run"
  @back="(t) => backToList(t)"
/>'
    >
      <div class="detail-demo">
        <div class="detail-demo__switches">
          <label><input v-model="detailStatus" type="radio" value="草稿" /> 草稿</label>
          <label><input v-model="detailStatus" type="radio" value="待审批" /> 待审批</label>
          <label><input v-model="detailPerms" type="checkbox" value="审批" /> 有「审批」权限</label>
          <label><input v-model="detailPerms" type="checkbox" value="作废" /> 有「作废」权限</label>
          <label><input v-model="detailStale" type="checkbox" /> 已被他人更新</label>
        </div>

        <IDetailPage
          :title="detailId"
          :status="detailStatus"
          :status-tone="detailTone"
          summary="客户：明远制造 · 金额 ￥12,800 · 明细 3 行"
          :actions="detailActionSpecs"
          :permissions="detailPerms"
          :seen-revision="3"
          :current-revision="detailStale ? 5 : 3"
          :sibling-ids="detailIds"
          :current-id="detailId"
          :return-ticket="detailTicket"
          @action="(k: string) => message.success(`执行了「${k}」`)"
          @refresh="() => { detailStale = false; message.info('已取到最新版本 v5') }"
          @back="(t) => message.info(`回列表：${t?.search ?? '（没有票据）'}，滚到 ${t?.scrollY ?? 0}px`)"
          @navigate="(id: string) => (detailId = id)"
        >
          <p class="detail-demo__body">字段组、关联列表与时间轴由调用方填在这里。</p>
        </IDetailPage>
      </div>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>内容是同构的一长串时——用列表或表格，卡片的边框与留白会让扫读变慢。</li>
      <li>只是想给一段文字加个底色时——卡片是「一个独立对象」的容器，滥用之后页面会变成一堆方块。</li>
      <li>卡片里只有一行字时——它的内边距比内容还多，直接写在页面上更好。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>title</td><td><code>string</code></td><td><code>''</code></td><td>标题，留空且无 header 插槽时不渲染头部</td></tr>
        <tr><td>hoverable</td><td><code>boolean</code></td><td><code>false</code></td><td>悬浮时抬升并加深阴影</td></tr>
        <tr><td>bordered</td><td><code>boolean</code></td><td><code>true</code></td><td>是否显示描边</td></tr>
      </tbody>
    </table>
    <table class="i-table">
      <thead><tr><th>插槽</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>default</td><td>卡片内容</td></tr>
        <tr><td>header</td><td>自定义头部，覆盖 title</td></tr>
        <tr><td>footer</td><td>页脚操作区，未提供时不渲染</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.detail-demo { display: grid; gap: var(--i-spacing-4); width: 100%; }
.detail-demo__switches {
  display: flex;
  flex-wrap: wrap;
  gap: var(--i-spacing-3);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-secondary);
}
.detail-demo__switches label { display: inline-flex; align-items: center; gap: var(--i-spacing-1); }
.detail-demo__body { margin: 0; color: var(--i-color-text-tertiary); font-size: var(--i-font-size-sm); }

.w { width: min(320px, 100%); }
</style>
