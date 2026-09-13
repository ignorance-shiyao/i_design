import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  // 相对路径：GitHub Pages 部署在 /<repo>/ 子路径下也能正确取到资源
  base: "./",
  plugins: [vue()],
  optimizeDeps: { entries: ["index.html"] },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@i-design/common": fileURLToPath(
        new URL("./packages/common/src", import.meta.url)
      ),
      /*
       * 各包的 package.json 指向的是构建产物（dist），仓库自身开发时要走源码——
       * 否则改了组件得先构建才看得见，且会读到上一次构建的样子。
       * 与 tsconfig 的 paths 一一对应。
       */
      "@i-design/vue-next": fileURLToPath(
        new URL("./packages/vue-next/src", import.meta.url)
      ),
      "@i-design/react": fileURLToPath(
        new URL("./packages/react/src", import.meta.url)
      ),
    },
  },
});
