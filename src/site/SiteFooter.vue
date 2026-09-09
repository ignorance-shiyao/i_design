<template>
  <footer class="footer">
    <div class="i-container footer__inner">
      <div>
        <strong>Ignorance Design</strong>
        <p>沉浸 · 灵活 · 至简 —— 面向企业中后台产品的设计体系。</p>
      </div>
      <nav class="footer__links">
        <RouterLink to="/design/values">设计价值观</RouterLink>
        <RouterLink to="/design/tokens">设计令牌</RouterLink>
        <RouterLink to="/components">组件总览</RouterLink>
        <RouterLink to="/resources">设计资源</RouterLink>
        <a href="https://github.com/ignorance-shiyao/i_design" target="_blank" rel="noreferrer">
          GitHub 源码
        </a>
      </nav>
    </div>
    <div class="i-container footer__bottom">© 2026 Ignorance Design · MIT License</div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: var(--i-spacing-24);
  padding-top: var(--i-spacing-12);
  border-top: 1px solid var(--i-color-border);
  background: var(--i-color-bg-subtle);
}
.footer__inner {
  display: flex;
  flex-wrap: wrap;
  gap: var(--i-spacing-10);
  justify-content: space-between;
  padding-bottom: var(--i-spacing-8);
}
.footer__inner p {
  margin-top: var(--i-spacing-2);
  color: var(--i-color-text-tertiary);
  max-width: 40ch;
}
.footer__links { display: grid; gap: var(--i-spacing-2); }
.footer__links a { color: var(--i-color-text-secondary); font-size: var(--i-font-size-md); }
.footer__bottom {
  padding: var(--i-spacing-4) var(--i-spacing-6);
  border-top: 1px solid var(--i-color-border);
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-sm);
}
</style>
