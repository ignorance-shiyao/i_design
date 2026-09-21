import{d as l,c as s,b as a,i as e,w as d,a as i,o as m,aE as o,u as f}from"./index-pxi08be3.js";import{D as n}from"./DemoBlock-B7uyjytc.js";import"./FrameworkTabs-CyJ64N6C.js";const u=`import { createApp } from 'vue'
import IDesign from '@i-design/vue-next'
import '@i-design/common/styles/index.css'

const app = createApp(App)
app.use(IDesign)
app.mount('#app')`,p=`function total(items) {
  let sum = 0
  for (const item of items) {
    sum += item.price
  }
  return sum
}`,g=`function total(items, rate = 1) {
  let sum = 0
  for (const item of items) {
    sum += item.price * rate
  }
  return Math.round(sum)
}`,k=l({__name:"CodeBlockPage",setup(b){const c=Array.from({length:24},(r,t)=>`const line${t+1} = ${t+1}`).join(`
`);return(r,t)=>(m(),s("article",null,[t[0]||(t[0]=a("h1",null,"CodeBlock 代码块",-1)),t[1]||(t[1]=a("p",{class:"i-lead"}," 展示一段代码：高亮、行号、可复制，以及「这次改了什么」的统一 diff 视图。高亮按词法单元渲染节点，而不是拼一段 HTML 再塞进去——代码块里的内容常常来自模型与工具的输出，那是不可信内容。 ",-1)),e(n,{title:"基本用法",description:"不传 lang 时按内容猜；猜不出就不高亮——宁可不高亮，也不要高亮错。行号不参与选中，复制下来不必再一行行删。",lang:"vue",code:'<ICodeBlock :code="code" lang="ts" filename="main.ts" />'},{default:d(()=>[e(o,{code:u,lang:"ts",filename:"main.ts"})]),_:1}),e(n,{title:"改了什么",description:"传 before 就切成统一 diff 视图：左右两列行号分别是改动前后的位置。增删用「淡底色 + 行首符号 + 顶部计数」三条线索，不只靠颜色——灰度打印与色觉障碍下同样读得出来。",lang:"vue",code:'<ICodeBlock :code="after" :before="before" lang="ts" filename="total.ts" />'},{default:d(()=>[e(o,{code:g,before:p,lang:"ts",filename:"total.ts"})]),_:1}),e(n,{title:"过长时折叠",description:"maxLines 限制高度，底部渐隐提示「下面还有」。纯截断会让人以为代码就这么多。",lang:"vue",code:'<ICodeBlock :code="code" :max-lines="8" />'},{default:d(()=>[e(o,{code:f(c),lang:"ts","max-lines":8},null,8,["code"])]),_:1}),t[2]||(t[2]=i('<h2>什么时候不该用它</h2><ul><li>只有一两个词的标识符（属性名、命令名）——用行内 <code>code</code> 就够，整块代码块会把它撑成一个段落。</li><li>需要编辑的场景——它是只读展示，要编辑该用编辑器组件。</li><li>几千行的文件——高亮是一次全量正则扫描，长文件该先截取相关片段再展示。</li></ul><h2>API</h2><table class="i-table"><thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead><tbody><tr><td>code</td><td><code>string</code></td><td>—</td><td>要展示的代码；首尾空行自动去掉</td></tr><tr><td>lang</td><td><code>string</code></td><td><code>&#39;&#39;</code></td><td>语言；不传则按内容猜</td></tr><tr><td>filename</td><td><code>string</code></td><td><code>&#39;&#39;</code></td><td>标题栏文件名；不传显示语言名</td></tr><tr><td>lineNumbers</td><td><code>boolean</code></td><td><code>true</code></td><td>显示行号</td></tr><tr><td>copyable</td><td><code>boolean</code></td><td><code>true</code></td><td>显示复制按钮</td></tr><tr><td>before</td><td><code>string</code></td><td><code>&#39;&#39;</code></td><td>改动前的内容；给了就切成 diff 视图</td></tr><tr><td>maxLines</td><td><code>number</code></td><td><code>0</code></td><td>超过多少行折叠；0 表示不折叠</td></tr></tbody></table>',4))]))}});export{k as default};
