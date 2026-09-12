<script setup lang="ts">
/**
 * 站点里的代码块。
 *
 * 只是 `ICodeBlock` 的一层薄包装：站点原先有自己的一份实现（高亮 + 复制，
 * 另加一份 146 行的高亮器），与组件那份是两套代码——改一处另一处不会跟着变，
 * 而且站点那份是拼 HTML 再 `v-html` 渲染的。
 * 组件做好之后就没有第二份存在的理由了。
 */
import ICodeBlock from '@/components/ICodeBlock.vue'

defineProps<{ code: string; lang?: string; filename?: string; copyable?: boolean }>()
</script>

<template>
  <!-- 文档里的示例大多很短，行号反而会把注意力从代码本身引开 -->
  <ICodeBlock
    :code="code"
    :lang="lang"
    :filename="filename"
    :copyable="copyable ?? true"
    :line-numbers="false"
  />
</template>
