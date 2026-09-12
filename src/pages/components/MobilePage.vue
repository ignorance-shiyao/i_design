<script setup lang="ts">
import { ref } from 'vue'
import INavBar from '../../../packages/mobile-vue/src/components/INavBar.vue'
import ITabbar from '../../../packages/mobile-vue/src/components/ITabbar.vue'
import INoticeBar from '../../../packages/mobile-vue/src/components/INoticeBar.vue'
import IPopup from '../../../packages/mobile-vue/src/components/IPopup.vue'
import IGrid from '../../../packages/mobile-vue/src/components/IGrid.vue'
import ISwipeCell from '../../../packages/mobile-vue/src/components/ISwipeCell.vue'
import ICell from '../../../packages/mobile-vue/src/components/ICell.vue'
import ISearchBar from '../../../packages/mobile-vue/src/components/ISearchBar.vue'
import ICountDown from '../../../packages/mobile-vue/src/components/ICountDown.vue'
import IStepper from '../../../packages/mobile-vue/src/components/IStepper.vue'
import IFab from '../../../packages/mobile-vue/src/components/IFab.vue'
import IFooter from '../../../packages/mobile-vue/src/components/IFooter.vue'
import ISideBar from '../../../packages/mobile-vue/src/components/ISideBar.vue'
import IPullDownRefresh from '../../../packages/mobile-vue/src/components/IPullDownRefresh.vue'
import IIndexes from '../../../packages/mobile-vue/src/components/IIndexes.vue'
import IDropdownMenu from '../../../packages/mobile-vue/src/components/IDropdownMenu.vue'
import IPicker from '../../../packages/mobile-vue/src/components/IPicker.vue'
import IButton from '@/components/IButton.vue'
import IInfiniteScroll from '@/components/IInfiniteScroll.vue'
import INumberKeypad from '@/components/INumberKeypad.vue'
import type { LoadStatus } from '@i-design/common'
import DemoBlock from '@/site/DemoBlock.vue'
import { message } from '@/components/message'
import type { IconName } from '@/components/icons'

const tab = ref('home')
const tabs = [
  { value: 'home', label: '首页', icon: 'grid' as IconName },
  { value: 'flow', label: '工作台', icon: 'layers' as IconName, badge: 5 },
  { value: 'msg', label: '消息', icon: 'info-circle' as IconName, dot: true },
  { value: 'me', label: '我的', icon: 'user' as IconName }
]

const entries = [
  { label: '待办', icon: 'check' as IconName },
  { label: '审批', icon: 'file' as IconName },
  { label: '报表', icon: 'grid' as IconName },
  { label: '成员', icon: 'user' as IconName },
  { label: '日程', icon: 'calendar' as IconName },
  { label: '文档', icon: 'folder' as IconName },
  { label: '设置', icon: 'edit' as IconName },
  { label: '更多', icon: 'more' as IconName }
]

const popupOpen = ref(false)
const keyword = ref('')
const quantity = ref(1)
const category = ref('cloud')
const refreshing = ref(false)
const feedTime = ref('刚刚')
function onRefresh() {
  refreshing.value = true
  // 真实业务里这里是一次请求；示例用定时器代替
  window.setTimeout(() => {
    refreshing.value = false
    feedTime.value = new Date().toLocaleTimeString('zh-CN')
  }, 900)
}

/* 列表要够长才看得出索引的意义：一屏装得下的列表不需要索引 */
const contacts = [
  { key: 'An', label: '安可', description: '产品' },
  { key: 'Ao', label: '敖雪', description: '运营' },
  { key: 'Bai', label: '白鹭', description: '设计' },
  { key: 'Bo', label: '柏舟', description: '前端' },
  { key: 'Bian', label: '卞宁', description: '数据' },
  { key: 'Chen', label: '陈迹', description: '后端' },
  { key: 'Cui', label: '崔序', description: '测试' },
  { key: 'Ding', label: '丁未', description: '安全' },
  { key: 'Fang', label: '方岐', description: '前端' },
  { key: 'Gu', label: '顾昀', description: '架构' },
  { key: 'He', label: '何遇', description: '产品' },
  { key: 'Ji', label: '纪桉', description: '设计' },
  { key: 'Lin', label: '林澈', description: '设计' },
  { key: 'Lu', label: '陆沉', description: '后端' },
  { key: 'Meng', label: '孟冬', description: '运营' },
  { key: 'Qin', label: '秦叙', description: '前端' },
  { key: 'Shen', label: '沈言', description: '前端' },
  { key: 'Su', label: '苏晏', description: '数据' },
  { key: 'Tang', label: '唐棠', description: '客服' },
  { key: 'Wei', label: '韦禾', description: '测试' },
  { key: 'Xu', label: '徐迟', description: '架构' },
  { key: 'Yan', label: '言溪', description: '设计' },
  { key: 'Zhou', label: '周砚', description: '测试' },
  { key: 'Zhu', label: '朱砂', description: '产品' },
  { key: '1', label: '13800000000', description: '未命名联系人' },
  { key: '@', label: 'support@i-design', description: '技术支持' }
]

const filters = ref<Record<string, string>>({ sort: 'new' })
const filterFields = [
  {
    name: 'sort',
    label: '排序',
    options: [
      { value: 'new', label: '最新发布' },
      { value: 'hot', label: '最多讨论' },
      { value: 'price', label: '价格从低到高' }
    ]
  },
  {
    name: 'status',
    label: '状态',
    options: [
      { value: 'open', label: '进行中' },
      { value: 'done', label: '已完成' }
    ]
  }
]

const categories = [
  { value: 'cloud', label: '云服务' },
  { value: 'data', label: '数据库', badge: 3 },
  { value: 'net', label: '网络' },
  { value: 'sec', label: '安全' }
]

// 级联：下一列的候选由上一列决定，children 里放下级
const regions = [
  {
    text: '广东省',
    value: 'gd',
    children: [
      { text: '深圳市', value: 'sz' },
      { text: '广州市', value: 'gz' },
      { text: '珠海市', value: 'zh' }
    ]
  },
  {
    text: '浙江省',
    value: 'zj',
    children: [
      { text: '杭州市', value: 'hz' },
      { text: '宁波市', value: 'nb' }
    ]
  },
  {
    text: '四川省',
    value: 'sc',
    children: [
      { text: '成都市', value: 'cd' },
      { text: '绵阳市', value: 'my' }
    ]
  }
]
const region = ref<(string | number)[]>(['gd', 'sz'])
const pickerOpen = ref(false)
const noticeVisible = ref(true)

/* 无限滚动：故意让第一页只有 3 条——不撑满容器时没有滚动条，
   用户永远划不到底，这正是要验证的那个死局 */
const feed = ref<string[]>([])
const feedStatus = ref<LoadStatus>('idle')
const feedRounds = ref(0)
function loadFeed() {
  feedStatus.value = 'loading'
  setTimeout(() => {
    feedRounds.value += 1
    const size = feedRounds.value === 1 ? 3 : 8
    const from = feed.value.length
    feed.value = [...feed.value, ...Array.from({ length: size }, (_, i) => `动态 ${from + i + 1}`)]
    feedStatus.value = feed.value.length >= 27 ? 'finished' : 'idle'
  }, 600)
}

const amount = ref('')

const rows = ref([
  { title: 'WI-1024 登录页表单校验缺失', description: '林岚 · 2 小时前' },
  { title: 'WI-1025 列表页分页丢失当前页', description: '陈序 · 昨天' }
])

const swipeActions = [
  { text: '置顶', type: 'brand' as const },
  { text: '删除', type: 'danger' as const }
]

function onSwipe(action: { text: string }, index: number, rowIndex: number) {
  if (action.text === '删除') {
    rows.value = rows.value.filter((_, i) => i !== rowIndex)
    message.success('已删除')
    return
  }
  message.info(`${action.text}：第 ${rowIndex + 1} 条`)
}
</script>

<template>
  <article>
    <h1>移动端形态</h1>
    <p class="i-lead">
      有些形态只在触屏上成立：底部标签栏、从边缘滑出的浮层、左滑出操作的单元格。它们与桌面端共用同一套令牌与语义色，因此同一个产品的两端看起来仍是一家的东西——只是把尺度调到了手指而不是鼠标指针。
    </p>

    <DemoBlock
      title="一屏完整的移动界面"
      description="导航栏、通告栏、宫格入口、可左滑的列表与底部标签栏，装在真实的手机尺寸里。"
    >
      <div class="phone-wrap">
        <div class="phone">
          <div class="phone__screen">
            <INavBar title="工作台" back back-text="返回" @back="message.info('返回上一页')">
              <template #right>
                <button class="phone__link" @click="popupOpen = true">筛选</button>
              </template>
            </INavBar>

            <INoticeBar
              v-if="noticeVisible"
              text="系统将于本周六 02:00 - 04:00 维护升级，期间审批流将暂停处理，请提前安排。"
              closable
              @close="noticeVisible = false"
            />

            <ISearchBar v-model="keyword" placeholder="搜索工作项" @search="(v) => message.info(`搜索：${v}`)" />

            <IGrid :items="entries" :columns="4" @select="(item) => message.info(item.label)" />

            <div class="phone__section">
              <button class="phone__link" @click="pickerOpen = true">选择地区</button>
            </div>

            <div class="phone__section">
              距本期结束
              <ICountDown :time="2 * 3600 * 1000 + 45 * 60 * 1000" separated />
            </div>

            <div class="phone__section">我的工作项（左滑试试）</div>
            <ISwipeCell
              v-for="(row, index) in rows"
              :key="row.title"
              :actions="swipeActions"
              @action="(action) => onSwipe(action, index, index)"
            >
              <ICell :title="row.title" :description="row.description" clickable />
            </ISwipeCell>
            <p v-if="!rows.length" class="phone__empty">全部处理完了</p>

            <div class="phone__spacer" />
            <ITabbar v-model="tab" :items="tabs" />
          </div>
        </div>

        <IPopup v-model="pickerOpen">
          <IPicker
            v-model="region"
            :columns="regions"
            title="选择地区"
            @confirm="pickerOpen = false"
            @cancel="pickerOpen = false"
          />
        </IPopup>

        <IPopup v-model="popupOpen">
          <div class="sheet">
            <h3>筛选</h3>
            <p>弹层的内容完全由调用方决定：这里可以是选择器、表单，或一段说明。</p>
            <IButton variant="primary" block @click="popupOpen = false">确定</IButton>
          </div>
        </IPopup>
      </div>
    </DemoBlock>

    <h2>步进器、悬浮按钮、侧边导航与页脚</h2>
    <p>
      这四件都是手机上才成立的形态。步进器不是把桌面端的数字输入框放大——桌面端以键盘输入为主、加减键是补充，手机上反过来：拇指点加减是主路径，弹一次键盘要占掉半屏。因此加减键做到 44px，数字反而是那个补充。
    </p>
    <p>
      悬浮按钮一页只该有一个：它表达的是「这一页最主要的那件事」，出现两个就等于没有主次。底部留出安全区高度，否则在全面屏上会压住手势条，上滑会先被系统吃掉。
    </p>

    <DemoBlock
      title="分类页与购买数量"
      description="侧边导航的选中项底色与右侧内容区相同，表达「右边这块属于它」——不用左侧粗竖线，那在这套体系里是留给状态与类型的暗示。"
      code='<ISideBar v-model="category" :items="categories" />
<IStepper v-model="quantity" :min="1" :max="99" />
<IFab text="新建" @click="..." />'
    >
      <div class="phone-wrap">
        <!-- 加 transform 让 .phone 成为固定定位的包含块，
             悬浮按钮才会贴在这台「手机」里而不是整个浏览器视口上 -->
        <div class="phone phone--contained">
          <div class="phone__screen phone__screen--split">
            <ISideBar v-model="category" :items="categories" />
            <div class="phone__pane">
              <div class="phone__section">
                购买数量
                <IStepper v-model="quantity" :min="1" :max="99" />
              </div>
              <div class="phone__section">
                当前类目：{{ categories.find((c) => c.value === category)?.label }}
              </div>
              <IFooter
                text="© 2026 Ignorance Design"
                :links="[{ label: '服务协议' }, { label: '隐私政策' }]"
                @select="(link) => message.info(link.label)"
              />
            </div>
          </div>
          <IFab text="新建" @click="message.info('新建工作项')" />
        </div>
      </div>
    </DemoBlock>

    <h2>下拉刷新、索引列表与筛选条</h2>
    <p>
      下拉刷新的三件事都在公共层：手指拉了多远换算成内容下移多少、拉到哪里算「松手就刷新」、松手后停在哪。阻尼曲线特意不用平方根——那条曲线在起手那一小段会把位移放大，手指才动 10px 内容已经走了 17px，人会觉得页面在自己跑。现在这条起手处正好跟手，越往下越重，到上限停住。
    </p>

    <DemoBlock
      title="下拉刷新"
      description="在手机上按住列表往下拉；箭头随进度转，到阈值正好转满 180°——这本身就是「可以松手了」的提示，不必只靠文案。"
      code='<IPullDownRefresh :refreshing="refreshing" @refresh="onRefresh">
  <ICell v-for="row in rows" :key="row" :title="row" />
</IPullDownRefresh>'
    >
      <div class="phone-wrap">
        <div class="phone">
          <div class="phone__screen">
            <IPullDownRefresh :refreshing="refreshing" @refresh="onRefresh">
              <div class="phone__section">上次更新：{{ feedTime }}</div>
              <ICell v-for="row in ['待我审批', '我发起的', '抄送我的']" :key="row" :title="row" />
            </IPullDownRefresh>
          </div>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock
      title="索引列表"
      description="分组标题吸顶，右侧字母条可点可滑。非字母一律归到 #，并且永远排最后——它是「其余」，不是某个字母。中文转拼音由调用方给 key：「重庆」归 C 还是 Z 取决于词库，组件不替业务决定。"
      code='<IIndexes :items="contacts" @select="..." />'
    >
      <div class="phone-wrap">
        <div class="phone">
          <div class="phone__screen">
            <IIndexes :items="contacts" @select="(item) => message.info(item.label)" />
          </div>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock
      title="筛选条"
      description="面板通栏铺开、贴着条的下沿展开。手机上「从哪儿弹出来的」比「弹在哪儿」更重要——一个飘在半空的小面板，用户不知道它属于哪一项。选完即收起，留着会挡住刚筛出来的结果。"
      code='<IDropdownMenu v-model="filters" :fields="fields" />'
    >
      <div class="phone-wrap">
        <div class="phone">
          <div class="phone__screen">
            <IDropdownMenu v-model="filters" :fields="filterFields" />
            <div class="phone__section">当前筛选：{{ JSON.stringify(filters) }}</div>
          </div>
        </div>
      </div>
    </DemoBlock>

    <h2>无限滚动</h2>
    <p>
      触发规则里最容易漏的一条是「内容还没撑满容器时直接加载」。第一页太短就没有滚动条，用户再怎么划也到不了底，列表会永远停在第一页——而它只在窗口很高或每页很少时才暴露，本地开发时几乎撞不上。下面这个示例第一页故意只给 3 条。
    </p>
    <p>
      另一条是加载中、已加载完、出错时一律不再触发。少了它，滚动事件每帧一次，同一页会连发几十个请求；接口够快的话，重复的响应互相覆盖，页面看着还是对的。
    </p>
    <DemoBlock
      title="翻到底自动续上"
      description="底部状态区一直占位，不是加载时才插进来——插进来会把列表往上顶一下，用户正在读的那一行会跳走。"
      code='<IInfiniteScroll :status="status" :height="260" @load="loadMore" />'
    >
      <div class="phone">
        <IInfiniteScroll :status="feedStatus" :height="260" :empty="!feed.length" @load="loadFeed">
          <ICell v-for="row in feed" :key="row" :title="row" />
        </IInfiniteScroll>
      </div>
    </DemoBlock>

    <h2>数字键盘</h2>
    <p>
      用手机拨号盘的顺序（1 在左上）而不是计算器的顺序（7 在左上）：输入金额和验证码时，用户的肌肉记忆来自拨号盘。约束（几位小数、能不能有负号、最长多少位）全在公共层判定，各端不会一个能输 12.345 一个不能。
    </p>
    <DemoBlock
      title="金额输入"
      description="小数位满了再按数字应当无效，而不是悄悄替换掉最后一位；0 后面直接接数字会替换掉那个 0，否则会得到 0123。长按删除键连续退格。"
      code='<INumberKeypad v-model="amount" :decimals="2" confirm-text="确认" />'
    >
      <div class="phone">
        <div class="amount">
          <span class="amount__currency">¥</span>
          <span class="amount__value">{{ amount || '0.00' }}</span>
        </div>
        <INumberKeypad v-model="amount" :decimals="2" :max-length="10" confirm-text="确认" />
      </div>
    </DemoBlock>

    <h2>与桌面端的分工</h2>
    <ul class="rules">
      <li><strong>标签栏不是标签页</strong>：Tabs 切换的是页面内的一块区域，标签栏切换的是整个页面，且常驻在拇指够得到的位置。</li>
      <li><strong>浮层不是抽屉</strong>：抽屉是桌面端的侧边面板，自带标题与关闭按钮；移动端的浮层是裸容器，内容全交给调用方。</li>
      <li><strong>通告栏不是警告提示</strong>：警告提示针对当前操作，通告栏是与操作无关的广播，因此常驻顶部且默认不可关闭。</li>
      <li><strong>滑动操作不能是唯一入口</strong>：不是所有用户都知道可以左滑，删除这类操作在详情页里也要能找到。</li>
    </ul>

    <h2>安全区</h2>
    <p>
      标签栏与底部浮层都让出手势条区域：iPhone 的横条会盖住最下面 34px，不留安全区的话，最下面一排图标点不到。导航栏同理让出状态栏。
    </p>
  </article>
</template>

<style scoped>
.phone-wrap { display: flex; justify-content: center; width: 100%; }
/* 手机外框：让桌面读者一眼看出这些形态的实际尺度 */
.phone {
  width: 375px;
  border: 10px solid var(--i-color-text);
  border-radius: 40px;
  overflow: hidden;
  box-shadow: var(--i-shadow-lg);
  background: var(--i-color-text);
}
.phone__screen {
  display: flex;
  flex-direction: column;
  height: 640px;
  overflow-y: auto;
  background: var(--i-color-bg-subtle);
}
.phone__section {
  padding: var(--i-spacing-4) var(--i-spacing-4) var(--i-spacing-2);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-tertiary);
}
.phone__empty {
  padding: var(--i-spacing-6);
  text-align: center;
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-sm);
}
.phone__spacer { flex: 1; }
.phone__link {
  border: none;
  background: none;
  color: var(--i-color-brand);
  font-family: inherit;
  font-size: var(--i-font-size-md);
  cursor: pointer;
  min-height: 44px;
}
.sheet { padding: var(--i-spacing-5); }
.sheet h3 { margin: 0 0 var(--i-spacing-2); }
.sheet p {
  margin: 0 0 var(--i-spacing-4);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
}
.amount {
  display: flex;
  align-items: baseline;
  gap: var(--i-spacing-1);
  padding: var(--i-spacing-4) var(--i-spacing-5);
  font-variant-numeric: tabular-nums;
}
.amount__currency { color: var(--i-color-text-secondary); }
.amount__value { font-size: var(--i-font-size-3xl); color: var(--i-color-text); }
.rules { line-height: 1.9; }
.rules li { margin-bottom: var(--i-spacing-2); }

/* 分类页示例：左导航固定宽度，右侧内容自适应。
   .phone__screen 本身是竖向 flex，这里必须显式改回横向 */
.phone__screen--split {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  overflow: hidden;
}
.phone__pane {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--i-color-bg-elevated);
}
.phone__pane .i-footer {
  margin-top: auto;
  /* 给悬浮按钮让出位置：真实页面里同样要留，否则页脚最后一行会被按钮压住 */
  padding-bottom: 72px;
}

.phone--contained {
  transform: translateZ(0);
}
</style>
