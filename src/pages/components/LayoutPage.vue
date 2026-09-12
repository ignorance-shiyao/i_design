<script setup lang="ts">
import ILayout from '@/components/ILayout.vue'
import IPageHeader from '@/components/IPageHeader.vue'
import { message } from '@/components/message'
import ISpace from '@/components/ISpace.vue'
import ITypography from '@/components/ITypography.vue'
import IRow from '@/components/IRow.vue'
import ICol from '@/components/ICol.vue'
import IButton from '@/components/IButton.vue'
import ITag from '@/components/ITag.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import IAffix from '@/components/IAffix.vue'
import IBackTop from '@/components/IBackTop.vue'
import IWatermark from '@/components/IWatermark.vue'
import IImage from '@/components/IImage.vue'
import ISplitter from '@/components/ISplitter.vue'
import IVirtualList from '@/components/IVirtualList.vue'
import IColorPicker from '@/components/IColorPicker.vue'
import { ref } from 'vue'

const collapsed = ref(false)
const split = ref(0.38)
const brandColor = ref('#5e7ce0')
/* 两万行：不虚拟化就是两万个 DOM 节点，滚动直接卡死 */
const bigList = Array.from({ length: 20000 }, (_, i) => ({
  id: i + 1,
  name: `工单 ${String(i + 1).padStart(5, '0')}`,
  owner: ['林岚', '陈序', '苏禾', '周迟'][i % 4]
}))
import { heroIllustrations } from '@i-design/common'

/* 预览用的图组：故意混一个坏地址进去，好让「加载失败」这一态在文档里看得见 */
const shots = [heroIllustrations.light.src, heroIllustrations.dark.src]
</script>

<template>
  <article>
    <h1>布局与排版</h1>
    <p class="i-lead">
      三个用来「把东西摆正」的基础件。它们本身没有视觉主张，作用是让间距、栅格与字号
      只能取自令牌——一旦允许就地写数值，一个产品里很快会长出七种正文字号与十几种间距。
    </p>

    <h2>PageHeader 页头</h2>
    <p>
      返回、标题、副标题与右侧操作。返回键与标题同一行而不是叠在标题上方：
      叠起来会让标题看着像副标题，而它是这一页最重要的那行字。
    </p>
    <DemoBlock
      title="页头"
      code='<IPageHeader title="实例详情" subtitle="ins-8f21c" @back="...">
  <template #extra><IButton>编辑</IButton></template>
</IPageHeader>'
    >
      <div class="full">
        <IPageHeader
          title="实例详情"
          subtitle="ins-8f21c · 华东一区"
          @back="message.info('返回列表')"
        >
          <template #extra>
            <IButton size="sm">编辑</IButton>
            <IButton size="sm" variant="primary">部署</IButton>
          </template>
        </IPageHeader>
      </div>
    </DemoBlock>

    <h2>Layout 页面骨架</h2>
    <p>
      顶栏、侧栏、正文、底栏。它只摆位置、不管内容——页面级的结构一旦被组件塞进具体内容，
      换一个产品就只能重写。四块都用语义标签落地（<code>header</code> / <code>aside</code> /
      <code>main</code> / <code>footer</code>）：读屏用户靠这几个地标在页面里跳转，
      全是 <code>div</code> 的页面对他们来说是一整块。
    </p>

    <DemoBlock
      title="带侧栏的页面"
      description="侧栏可收起，收起后只留图标宽度而不是整个藏掉——入口消失比变窄更难找回来。窄屏下侧栏自动转为顶部一条。"
      code='<ILayout>
  <template #header>顶栏</template>
  <template #aside>侧栏</template>
  正文
  <template #footer>底栏</template>
</ILayout>'
    >
      <div class="layout-demo">
        <ILayout :collapsed="collapsed" aside-width="180px" header-height="48px">
          <template #header>
            <strong>控制台</strong>
            <IButton size="sm" @click="collapsed = !collapsed">
              {{ collapsed ? '展开侧栏' : '收起侧栏' }}
            </IButton>
          </template>
          <template #aside>
            <p class="layout-demo__nav">概览</p>
            <p class="layout-demo__nav">实例</p>
            <p class="layout-demo__nav">告警</p>
          </template>
          <p>正文区域：页面的主要内容放在这里。</p>
          <template #footer>© Ignorance Design</template>
        </ILayout>
      </div>
    </DemoBlock>

    <h2>Space 间距</h2>
    <DemoBlock
      title="方向与尺寸"
      description="把相邻元素的间距收敛到令牌上；删掉其中一个元素也不会留下孤儿边距。"
      code='<ISpace><IButton>取消</IButton><IButton variant="primary">确定</IButton></ISpace>
<ISpace direction="vertical" size="lg">…</ISpace>'
    >
      <div class="stack">
        <ISpace>
          <IButton>取消</IButton>
          <IButton variant="primary">确定</IButton>
          <IButton variant="text">更多</IButton>
        </ISpace>
        <ISpace size="lg" wrap>
          <ITag type="brand">需求</ITag>
          <ITag type="success">已完成</ITag>
          <ITag type="warning">待评审</ITag>
        </ISpace>
      </div>
    </DemoBlock>

    <h2>Grid 栅格</h2>
    <p>
      24 栅格，列间距由行统一控制。窄屏（≤768px）下默认整栏铺满——中后台表单在小屏上
      并排两列几乎不可用；确需保持并排时给列加 <code>keep</code>。
    </p>
    <DemoBlock
      title="等分与偏移"
      code='<IRow :gutter="16">
  <ICol :span="8" :sm="24">…</ICol>
  <ICol :span="8" :sm="24">…</ICol>
</IRow>'
    >
      <div class="grid-demo">
        <IRow :gutter="16">
          <ICol :span="8"><div class="cell">span 8</div></ICol>
          <ICol :span="8"><div class="cell">span 8</div></ICol>
          <ICol :span="8"><div class="cell">span 8</div></ICol>
        </IRow>
        <IRow :gutter="16">
          <ICol :span="6"><div class="cell">span 6</div></ICol>
          <ICol :span="6" :offset="6"><div class="cell">offset 6</div></ICol>
          <ICol flex><div class="cell">flex 占满剩余</div></ICol>
        </IRow>
      </div>
    </DemoBlock>

    <h2>Typography 排版</h2>
    <DemoBlock
      title="层级与语气"
      description="标题的样式与标签默认绑定：视觉层级与文档结构一致，读屏才能正确导航。"
      code='<ITypography variant="h3">季度复盘</ITypography>
<ITypography type="secondary">上一次更新于 3 天前</ITypography>
<ITypography :ellipsis="2">很长的一段说明…</ITypography>'
    >
      <div class="stack">
        <ITypography variant="h3">季度复盘</ITypography>
        <ITypography>正文用于承载主要内容，行高 1.75，长段落读起来不费力。</ITypography>
        <ITypography type="secondary">次级文字用于补充说明。</ITypography>
        <ITypography variant="caption" type="tertiary">辅助文字用于时间戳、计数这类信息。</ITypography>
        <ITypography type="danger" strong>危险提示：该操作不可撤销</ITypography>
        <ITypography mono>packages/common/src/tokens/index.ts</ITypography>
        <ITypography :ellipsis="2" class="clamp-demo">
          多行省略用于列表里的摘要：超过指定行数后截断并显示省略号，避免一条特别长的内容把整个列表撑开，
          导致其余条目被挤到屏幕之外。这段文字足够长，用来演示两行之后的截断效果。
        </ITypography>
      </div>
    </DemoBlock>

    <DemoBlock
      title="展开与复制"
      description="截断作用在内层文本上，展开按钮和复制按钮不会被一起截掉——否则就成了「有省略号但没有展开入口」。复制在非安全上下文里会回退到旧接口，失败时静默，不打扰用户。"
      code='<ITypography :ellipsis="2" expandable>很长的一段说明…</ITypography>
<ITypography mono copyable>sk-live-8f21c0d4</ITypography>'
    >
      <div class="stack">
        <ITypography :ellipsis="2" expandable class="clamp-demo">
          可展开的多行省略：列表里默认只占两行，读者想读完整段时点「展开」即可，不必跳到详情页。
          这段文字足够长，用来演示截断与展开的切换效果，展开之后应当完整显示，收起后重新回到两行。
        </ITypography>
        <ITypography mono copyable>sk-live-8f21c0d4e75b</ITypography>
      </div>
    </DemoBlock>
    <DemoBlock
      title="截断才给提示"
      description="鼠标停在下面两行上看看：截断的那行会浮出完整内容，没截断的那行什么都不会出现。没截断也挂提示的话，鼠标扫过一列短文案会一路冒浮层，而浮层里的字与正文一模一样。"
      code='<ITypography ellipsis ellipsis-tooltip>一段可能放不下的文字</ITypography>
<ITypography :ellipsis="2" ellipsis-tooltip>多行截断同理</ITypography>'
    >
      <div class="stack tip-demo">
        <ITypography ellipsis ellipsis-tooltip>
          单行截断：这条工作项的标题很长，长到一行放不下，鼠标停上来才会浮出完整内容。
        </ITypography>
        <ITypography ellipsis ellipsis-tooltip>短标题，放得下</ITypography>
        <ITypography :ellipsis="2" ellipsis-tooltip>
          多行截断：判定要看高度而不是宽度——多行截断永远不会横向溢出，
          拿宽度去判断的话条件永远不成立，提示一次都不会出现，而且不报错，
          只是看起来像「这个功能好像没做」。
        </ITypography>
      </div>
    </DemoBlock>

    <p class="tip-note">
      各端差异：判定规则（单行看宽度、多行看高度，留 1px 亚像素容差）是共享的一份，
      但量法各按各端的能力——Web 端读布局值并挂 ResizeObserver，容器变宽后提示会自己撤掉；
      Flutter 端用 TextPainter 实地排一次版；小程序端没有 hover，那一端保持纯截断，
      需要读全文时给展开入口，而不是做一个手指碰不到的浮层。
    </p>

    <h2>Affix 固钉</h2>
    <p>
      吸住时元素脱离文档流，因此外层要撑出一块等高的占位。不占位的话，
      下面的内容会整块往上跳一次——而那一跳正好发生在用户滚动时，看起来像页面抖了一下。
    </p>
    <p>
      容器底部先于元素滚出视口时，元素跟着一起走，而不是继续钉在顶上：
      一个已经和内容无关的浮块钉在屏幕顶端，读者会以为它属于下一节。
    </p>
    <DemoBlock
      title="滚动时吸在顶部"
      description="滚动这一页试试。滚动事件合并到 requestAnimationFrame，每帧最多量一次布局——不合并的话长页面上滚动会明显发涩。"
      code='<IAffix :top="72"><IButton>我会吸住</IButton></IAffix>'
    >
      <IAffix :top="72">
        <IButton variant="secondary">我会吸在离顶部 72px 处</IButton>
      </IAffix>
    </DemoBlock>

    <h2>BackTop 回到顶部</h2>
    <p>
      默认滚过一屏才出现：不足一屏时用户自己往回划两下就到顶了，这时冒出一个按钮属于帮倒忙——
      它遮住的内容比它省下的力气多。回顶动画自己按帧算，而不是
      <code>scrollTo({ behavior: 'smooth' })</code>——后者的时长由浏览器按距离决定，
      长页面上会滚十几秒，用户以为卡住了。这一页右下角就有一个。
    </p>

    <h2>Watermark 水印</h2>
    <p>
      水印拦不住有心人，但能让随手截图的人留下痕迹。它的价值全在细节：太密挡内容，
      太疏截一小块就没有。用 SVG 平铺而不是 canvas 生成位图——高分屏上不会糊，
      而且首屏就能带上，不存在「先看到没水印的内容」那一小段窗口，而那正是要防的场景。
    </p>
    <DemoBlock
      title="盖在内容上，但不吃事件"
      description="水印层 aria-hidden：读屏把满屏重复的用户名念一遍，内容就没法听了。颜色跟随文字色，写死黑色的话深色主题上等于没有。"
      code='<IWatermark text="仅供内部评审"><YourContent /></IWatermark>'
    >
      <IWatermark :text="['仅供内部评审', 'zhang.wei@example.com']">
        <div class="wm-demo">
          <h4>季度经营简报</h4>
          <p>本季度新签客户 128 家，续约率 91%。下一步聚焦华东区的交付节奏。</p>
          <IButton size="sm">按钮仍然可以点</IButton>
        </div>
      </IWatermark>
    </DemoBlock>

    <h2>Image 图片</h2>
    <p>
      加载中给骨架、失败给明文，都不留空白：空白会被当成「这里本来就没图」，
      而那和「加载失败」的处理完全不同——前者不必管，后者该刷新或报障。
    </p>
    <p>
      预览里翻页到头不循环。循环会让「这是最后一张」这个信息消失，
      用户点着点着又回到第一张，分不清是翻完了还是自己看漏了。翻页后缩放旋转归零——
      带着上一张的三倍放大翻过去，看到的是一块局部。
    </p>
    <DemoBlock
      title="预览、缩放、旋转与翻页"
      description="点图放大。滚轮缩放，放大后可拖动，方向键翻页，Esc 关闭。缩回 1 倍时位移一并归零，否则图缩小了却还偏在角落。"
      code='<IImage :src="src" :group="shots" :width="200" :height="130" />'
    >
      <div class="row">
        <IImage v-for="s in shots" :key="s" :src="s" :group="shots" :width="200" :height="130" fit="contain" />
        <IImage src="/does-not-exist.png" :width="200" :height="130" alt="示例图" />
      </div>
    </DemoBlock>

    <h2>Splitter 分割面板</h2>
    <p>
      两栏的下限一起夹，而不是只夹被拖的那一栏：只夹一栏的话，把它拖到很大时
      另一栏会被挤到零宽，里面的内容全部换行成一列单字——那时用户已经看不出
      该往回拖多少了。
    </p>
    <p>
      分隔条可聚焦、可用方向键拖，按住 Shift 走大步。它是个真正的控件，不是装饰线：
      只能鼠标拖的话，用键盘操作的人永远改不了这个布局。<code>aria-valuenow</code>
      也不是形式——读屏使用者靠它知道现在是几几开，以及自己按方向键改到了多少。
    </p>
    <DemoBlock
      title="拖动分隔条，或用方向键"
      description="Tab 到分隔条上试试方向键。两栏最小 120px，拖到底就停住。"
      code='<ISplitter v-model="ratio" :min-first="120" :min-second="120" />'
    >
      <ISplitter v-model="split" :min-first="120" :min-second="160" class="split-demo">
        <template #first>
          <div class="split-pane">
            <strong>目录</strong>
            <p>当前 {{ Math.round(split * 100) }}%</p>
          </div>
        </template>
        <template #second>
          <div class="split-pane">
            <strong>内容</strong>
            <p>拖动中间那条线，或聚焦它后按左右方向键。</p>
          </div>
        </template>
      </ISplitter>
    </DemoBlock>

    <h2>VirtualList 虚拟滚动</h2>
    <p>
      万行表格不虚拟化就是万个 DOM 节点，滚动直接卡死。而虚拟化最容易写错的是
      「上下各多渲染几行」：不多渲染，快速拖动滚动条时上下边缘会闪出空白；
      多渲染太多，又等于没虚拟化——那些行永远来不及被看见。默认 3 行。
    </p>
    <p>
      条目少于 60 条时不虚拟化。那时它只是徒增复杂度与一次布局计算，
      而且会平白丢掉浏览器自带的查找——Ctrl+F 找不到没渲染出来的行。
    </p>
    <DemoBlock
      title="两万行，只渲染看得见的那些"
      description="上下用两块空白撑开，而不是绝对定位每一行：撑开的写法让滚动条长度天然正确，也不必为每一行算 top，少一处会算错的地方。"
      code='<IVirtualList :items="rows" :item-height="40" :height="280" v-slot="{ item }">
  {{ item.name }}
</IVirtualList>'
    >
      <IVirtualList :items="bigList" :item-height="40" :height="280" class="vl-demo">
        <template #default="{ item, index }">
          <span class="vl-row">
            <span class="vl-no">{{ index + 1 }}</span>
            <span>{{ (item as any).name }}</span>
            <span class="vl-owner">{{ (item as any).owner }}</span>
          </span>
        </template>
      </IVirtualList>
    </DemoBlock>

    <h2>ColorPicker 取色器</h2>
    <p>
      色彩换算直接用 <code>logic/palette</code> 已有的 OKLCH，不引第二套——
      同一个仓库里出现两份「什么叫更亮一点」，迟早会在某个组件上对不上。
      取色器界面本身用 HSV：饱和度与明度这两个轴正好对应方块的两条边，
      而 OKLCH 的轴不是矩形的，拿来画方块会有一大片取不到的颜色。
    </p>
    <p>
      对比度当场说出来。用户挑的是「好看的颜色」，而好不好看和上面的字能不能读
      是两件事——不提示的话，一个明黄的主色会一路走到线上，
      然后才发现按钮上的白字看不见。
    </p>
    <DemoBlock
      title="取色、输入与常用色"
      description="输入框失焦时才解析——边打边解析的话，用户删到只剩 #5 时颜色就已经跳了几次，他没法安心把值改完。接受 #abc、#aabbcc、abc 与 rgb(1,2,3)：用户会从各种地方复制色值过来。"
      code='<IColorPicker v-model="color" />'
    >
      <div class="row">
        <IColorPicker v-model="brandColor" />
        <IButton :style="{ background: brandColor, color: '#fff', borderColor: brandColor }">
          用这个色的按钮
        </IButton>
      </div>
    </DemoBlock>

    <IBackTop />
  </article>
</template>

<style scoped>
.wm-demo {
  padding: var(--i-spacing-6);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-lg);
  background: var(--i-color-bg-elevated);
}
.wm-demo h4 { margin: 0 0 var(--i-spacing-2); }
.wm-demo p { margin: 0 0 var(--i-spacing-4); color: var(--i-color-text-secondary); }
.row { display: flex; gap: var(--i-spacing-4); flex-wrap: wrap; align-items: center; }
.split-demo {
  height: 180px;
  border: 1px solid var(--i-color-border);
  border-radius: var(--i-radius-lg);
  overflow: hidden;
}
.split-pane { padding: var(--i-spacing-4); }
.split-pane p { margin: var(--i-spacing-2) 0 0; color: var(--i-color-text-secondary); font-size: var(--i-font-size-sm); }
.vl-demo {
  border: 1px solid var(--i-color-border);
  border-radius: var(--i-radius-lg);
}
.vl-row {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-4);
  width: 100%;
  padding: 0 var(--i-spacing-4);
  border-bottom: 1px solid var(--i-color-hairline);
  height: 100%;
  box-sizing: border-box;
}
.vl-no { width: 56px; color: var(--i-color-text-tertiary); font-variant-numeric: tabular-nums; }
.vl-owner { margin-left: auto; color: var(--i-color-text-secondary); }
.stack { display: flex; flex-direction: column; gap: var(--i-spacing-3); width: 100%; }
.grid-demo { display: flex; flex-direction: column; gap: var(--i-spacing-3); width: 100%; }
.cell {
  padding: var(--i-spacing-3);
  border-radius: var(--i-radius-md);
  background: var(--i-color-brand-subtle);
  color: var(--i-color-brand);
  font-size: var(--i-font-size-sm);
  text-align: center;
}
.clamp-demo { max-width: 460px; }
.tip-demo { max-width: 360px; }
.tip-note { color: var(--i-color-text-secondary); }

.layout-demo {
  height: 260px;
  overflow: hidden;
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-lg);
}
.layout-demo__nav {
  padding: var(--i-spacing-2) var(--i-spacing-4);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
}
.layout-demo :deep(.i-layout__header) {
  justify-content: space-between;
}
</style>
