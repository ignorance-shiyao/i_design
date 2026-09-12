<script setup lang="ts">
import IBadge from '@/components/IBadge.vue'
import IButton from '@/components/IButton.vue'
import IAvatar from '@/components/IAvatar.vue'
import IIcon from '@/components/IIcon.vue'
import DemoBlock from '@/site/DemoBlock.vue'
</script>

<template>
  <article>
    <h1>Badge 徽标</h1>
    <p class="i-lead">
      标记数量或状态。徽标是在拉用户的注意力，因此同一屏里出现太多就等于一个都没有——优先只给真正需要处理的东西加。
    </p>

    <DemoBlock
      title="计数与上限"
      description="超过 max 显示为 max+。count 为 0 时默认隐藏，避免出现「0 条待办」这种噪音。"
      lang="vue"
      code='<IBadge :count="5"><IButton>消息</IButton></IBadge>
<IBadge :count="128"><IButton>通知</IButton></IBadge>
<IBadge :count="0" show-zero><IButton>已读</IButton></IBadge>'
    >
      <IBadge :count="5"><IButton>消息</IButton></IBadge>
      <IBadge :count="128"><IButton>通知</IButton></IBadge>
      <IBadge :count="1280" :max="999"><IButton>全部</IButton></IBadge>
      <IBadge :count="0" show-zero><IButton>已读</IButton></IBadge>
    </DemoBlock>

    <DemoBlock
      title="圆点"
      description="只表达「有更新」、不需要具体数量时用圆点，比数字更克制。"
      lang="vue"
      code='<IBadge dot><IIcon name="user" :size="20" /></IBadge>
<IBadge dot type="brand"><IAvatar name="林岚" /></IBadge>'
    >
      <IBadge dot><IIcon name="calendar" :size="20" /></IBadge>
      <IBadge dot type="brand"><IAvatar name="林岚" /></IBadge>
      <IBadge dot type="success"><IAvatar name="陈序" shape="square" /></IBadge>
    </DemoBlock>

    <DemoBlock
      title="独立使用"
      description="不包裹内容时就地渲染，可用于列表行内的状态计数。"
      lang="vue"
      code='<IBadge :count="3" type="brand" />
<IBadge :count="12" type="warning" />'
    >
      <IBadge :count="3" type="brand" />
      <IBadge :count="12" type="warning" />
      <IBadge :count="7" type="success" />
      <IBadge :count="99" />
    </DemoBlock>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>count</td><td><code>number</code></td><td><code>0</code></td><td>计数</td></tr>
        <tr><td>max</td><td><code>number</code></td><td><code>99</code></td><td>上限，超出显示 max+</td></tr>
        <tr><td>dot</td><td><code>boolean</code></td><td><code>false</code></td><td>只显示圆点</td></tr>
        <tr><td>showZero</td><td><code>boolean</code></td><td><code>false</code></td><td>count 为 0 时是否显示</td></tr>
        <tr><td>type</td><td><code>brand | success | warning | danger</code></td><td><code>danger</code></td><td>语义色</td></tr>
      </tbody>
    </table>
  </article>
</template>
