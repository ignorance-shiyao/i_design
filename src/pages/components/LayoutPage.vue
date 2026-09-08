<script setup lang="ts">
import ISpace from '@/components/ISpace.vue'
import ITypography from '@/components/ITypography.vue'
import IRow from '@/components/IRow.vue'
import ICol from '@/components/ICol.vue'
import IButton from '@/components/IButton.vue'
import ITag from '@/components/ITag.vue'
import DemoBlock from '@/site/DemoBlock.vue'
</script>

<template>
  <article>
    <h1>布局与排版</h1>
    <p class="i-lead">
      三个用来「把东西摆正」的基础件。它们本身没有视觉主张，作用是让间距、栅格与字号
      只能取自令牌——一旦允许就地写数值，一个产品里很快会长出七种正文字号与十几种间距。
    </p>

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
  </article>
</template>

<style scoped>
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
</style>
