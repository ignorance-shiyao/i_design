<script setup lang="ts">
import { ref } from 'vue'
import IInputOtp from '@/components/IInputOtp.vue'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import { message } from '@/components/message'

const code = ref('')
const masked = ref('')
const split = ref('')
const invalid = ref('')

function onComplete(value: string) {
  message.success(`收到验证码 ${value}`)
}
</script>

<template>
  <article>
    <h1>InputOtp 验证码输入</h1>
    <p class="i-lead">
      分格填写一次性验证码。分格的意义在于「要填几位」和「填到第几位」都不必靠数，代价是粘贴、删除、自动填充这三件事都得自己处理——它们的规则在公共层，各端共用同一份。
    </p>

    <DemoBlock
      title="基础用法"
      description="试试直接粘贴「123 456」或「12-34-56」：不合规的字符会先被剔掉再逐格分配，而不是把空格也占掉一格。"
      code='<IInputOtp v-model="code" @complete="onComplete" />'
    >
      <div class="otp-demo">
        <IInputOtp v-model="code" @complete="onComplete" />
        <p class="otp-demo__value">当前值：{{ code || '（未填完）' }}</p>
        <IButton size="sm" @click="code = ''">清空</IButton>
      </div>
    </DemoBlock>

    <DemoBlock
      title="分隔与长度"
      code='<IInputOtp :length="6" :separator-at="3" />'
    >
      <IInputOtp v-model="split" :length="6" :separator-at="3" />
    </DemoBlock>

    <DemoBlock
      title="遮住字符"
      description="用 text-security 遮字符，而不是 type=password——后者会触发浏览器的密码管理器，在验证码场景下弹「保存密码吗」是错的。"
      code='<IInputOtp password :length="4" />'
    >
      <IInputOtp v-model="masked" password :length="4" />
    </DemoBlock>

    <DemoBlock title="校验失败" code='<IInputOtp invalid />'>
      <IInputOtp v-model="invalid" invalid :length="4" />
    </DemoBlock>

    <h2>键盘</h2>
    <table class="i-table">
      <thead><tr><th>按键</th><th>行为</th></tr></thead>
      <tbody>
        <tr><td>数字/字母</td><td>填入当前格并跳到下一格；最后一格填完停在原地</td></tr>
        <tr><td><code>Backspace</code></td><td>当前格有值只清当前格；已空才退到前一格并清掉</td></tr>
        <tr><td><code>← / →</code></td><td>在格子之间移动</td></tr>
        <tr><td><code>⌘/Ctrl + V</code></td><td>整串分配到各格</td></tr>
      </tbody>
    </table>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>要填的不是定长验证码时——普通输入框就好，分格会把正常文本切得七零八落。</li>
      <li>验证码可能被粘贴进来时要留意——组件支持整串粘贴，但别把格子做成只收单字符的死限制。</li>
      <li>位数超过八位时——分格反而更难数，用一个普通输入框加格式提示。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>modelValue</td><td><code>string</code></td><td><code>''</code></td><td>完整验证码；未填完时是空串——半截的码没有意义</td></tr>
        <tr><td>length</td><td><code>number</code></td><td><code>6</code></td><td>位数</td></tr>
        <tr><td>mode</td><td><code>numeric | alphanumeric</code></td><td><code>numeric</code></td><td>可接受的字符</td></tr>
        <tr><td>password</td><td><code>boolean</code></td><td><code>false</code></td><td>遮住字符，格数仍可见</td></tr>
        <tr><td>separatorAt</td><td><code>number</code></td><td><code>0</code></td><td>在第几格之后插入分隔符</td></tr>
        <tr><td>disabled / invalid</td><td><code>boolean</code></td><td><code>false</code></td><td>禁用 / 错误态</td></tr>
      </tbody>
    </table>
    <table class="i-table">
      <thead><tr><th>事件</th><th>参数</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>complete</td><td><code>(value: string)</code></td><td>最后一格填完时触发，通常在这里提交</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.otp-demo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--i-spacing-3);
}
.otp-demo__value {
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-secondary);
}
</style>
