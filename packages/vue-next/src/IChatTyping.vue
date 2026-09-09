<script setup lang="ts">
/**
 * 等待首个字符时的三点提示。
 * 一旦开始流式输出就应换成 IChatMessage 的光标，
 * 否则同一条消息上会同时出现两种「正在进行」的信号。
 */
</script>

<template>
  <div class="i-chat-typing" role="status" aria-label="正在生成回答">
    <span class="i-chat-typing__dot" />
    <span class="i-chat-typing__dot" />
    <span class="i-chat-typing__dot" />
  </div>
</template>
