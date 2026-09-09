<template>
  <footer class="footer">
    <div class="i-container footer__inner">
      <div class="footer__brand">
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
  margin-top: var(--i-spacing-16);
  padding-top: var(--i-spacing-8);
  border-top: 1px solid var(--i-color-border);
  background: var(--i-color-bg-subtle);
}
/*
 * 品牌与链接排在一行，链接自身也横排。
 * 竖排一列会把页脚拉到 300px 以上——它是页面的收尾，不该比一屏内容还占地方。
 */
.footer__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--i-spacing-4) var(--i-spacing-8);
  justify-content: space-between;
  padding-bottom: var(--i-spacing-4);
}
.footer__brand strong { font-size: var(--i-font-size-md); }
.footer__inner p {
  margin-top: var(--i-spacing-1);
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-sm);
  max-width: 44ch;
}
.footer__links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--i-spacing-2) var(--i-spacing-5);
}
.footer__links a { color: var(--i-color-text-secondary); font-size: var(--i-font-size-sm); }
.footer__links a:hover { color: var(--i-color-brand); }
.footer__bottom {
  padding: var(--i-spacing-3) var(--i-spacing-6);
  border-top: 1px solid var(--i-color-border);
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-sm);
}
</style>
