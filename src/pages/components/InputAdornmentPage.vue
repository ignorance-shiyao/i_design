<script setup lang="ts">
import { ref } from 'vue'
import IInput from '@/components/IInput.vue'
import IInputNumber from '@/components/IInputNumber.vue'
import IInputAdornment from '@/components/IInputAdornment.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const site = ref('')
const domain = ref('')
const price = ref<number | null>(null)
</script>

<template>
  <article>
    <h1>InputAdornment 输入前后缀</h1>
    <p class="i-lead">
      把 <code>https://</code>、<code>.com</code>、<code>元</code> 这类固定不变的部分从输入框里挪出来。它们不是用户要填的内容，留在框里既占位置，又会连同输入一起被提交。
    </p>

    <DemoBlock
      title="前缀"
      code='<IInputAdornment prepend="https://">
  <IInput v-model="site" placeholder="example.com" />
</IInputAdornment>'
    >
      <div class="demo-field">
        <IInputAdornment prepend="https://">
          <IInput v-model="site" placeholder="example.com" />
        </IInputAdornment>
      </div>
    </DemoBlock>

    <DemoBlock
      title="后缀"
      code='<IInputAdornment append=".com">
  <IInput v-model="domain" placeholder="输入域名" />
</IInputAdornment>'
    >
      <div class="demo-field">
        <IInputAdornment append=".com">
          <IInput v-model="domain" placeholder="输入域名" />
        </IInputAdornment>
      </div>
    </DemoBlock>

    <DemoBlock
      title="与数字输入框组合"
      description="单位放在后缀里，用户填的就只是数字本身，校验与提交都不必再去剥单位。"
      code='<IInputAdornment prepend="￥" append="元/月">
  <IInputNumber v-model="price" :min="0" />
</IInputAdornment>'
    >
      <div class="demo-field">
        <IInputAdornment prepend="￥" append="元/月">
          <IInputNumber v-model="price" :min="0" aria-label="单价" />
        </IInputAdornment>
      </div>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>前后缀本身可点、且是一个独立操作时——那是按钮组合，别让人去点一个看起来像装饰的东西。</li>
      <li>前缀是用来解释这个字段的时——那是标签或说明文字，塞进框里会被当成输入内容的一部分。</li>
      <li>单位会随输入变化时——放在框外，框内的文字跟着跳会让人以为自己打错了。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>prepend</td><td><code>string</code></td><td><code>''</code></td><td>前缀文案，也可用同名插槽放图标或下拉</td></tr>
        <tr><td>append</td><td><code>string</code></td><td><code>''</code></td><td>后缀文案，同上</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.demo-field {
  max-width: 360px;
}
</style>
