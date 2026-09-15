import{d as _,c as h,b as t,i as a,w as s,a as M,o as k,z as w,ah as c,U as b,L as x,h as V,C as v,B as g,_ as I}from"./index-Bg0ycgGi.js";import{D as f}from"./DemoBlock-DcygJWoz.js";import{P as T}from"./Playground-CIE25W58.js";import"./FrameworkTabs-BID_met7.js";import"./componentProps-CCx93w_w.js";const L={class:"md-demo"},H={class:"md-edit"},y={class:"md-edit__preview"},B={class:"md-demo"},l=`## 采购建议

比对了 **12 家**供应商，交期与单价的权衡如下：

| 供应商 | 交期 | 单价 |
| --- | ---: | ---: |
| 明远制造 | 7 天 | ¥ 128 |
| 合力重工 | 12 天 | ¥ 119 |

1. 急单走明远，交期短
2. 常备库存走合力，单价低
   - 需要提前两周下单

> 单笔超过五万元要区域总监复核。

\`\`\`ts
const plan = suppliers.filter((s) => s.leadTime <= 7)
\`\`\`

参考：[采购制度 v3](/components/table)，~~旧版已作废~~。`,P=`正常的一段文字。

<img src=x onerror="alert(1)"> 这段 HTML 原样显示，不会被执行。

[看起来正常的链接](javascript:alert(1)) 会退化成纯文本。

![风险图](java	script:alert(1))`,C=_({__name:"MarkdownPage",setup(N){const o=v(l),r=v("sample"),m=g(()=>r.value==="hostile"?P:o.value),n=v("");let d=null;function p(){d&&clearInterval(d),n.value="";let i=0;d=setInterval(()=>{n.value=l.slice(0,i+=3),i>=l.length&&d&&clearInterval(d)},40)}return(i,e)=>(k(),h("article",null,[e[3]||(e[3]=t("h1",null,"Markdown 渲染",-1)),e[4]||(e[4]=t("p",{class:"i-lead"}," 内容来自模型与后端，也就是不可信的地方。所以这里不走「渲染成 HTML 再清洗」那条路——清洗要穷举所有变形，漏一种就等于给了对方一个 XSS，而 HTML 字符串在小程序与 Flutter 上也根本没法渲染。解析成 token 树，各端用自己的原生元素渲染：原始 HTML 一律当纯文本，地址一律过白名单，这两条不是可配置项。 ",-1)),e[5]||(e[5]=t("h2",null,"现场调参",-1)),a(T,{name:"IMarkdown",is:c,only:["compact"],fixed:{source:l}},null,8,["fixed"]),a(f,{title:"常见语法",description:"标题、列表（含嵌套一层）、表格、引用、代码块、行内代码、粗体、斜体、删除线、链接。不支持脚注与 HTML 内嵌——它们在对话里几乎不出现，而每多支持一种就多一处要防的地方。",lang:"vue",code:'<IMarkdown :source="text" />'},{default:s(()=>[t("div",L,[a(w,{modelValue:r.value,"onUpdate:modelValue":e[0]||(e[0]=u=>r.value=u),options:[{label:"正常内容",value:"sample"},{label:"带攻击载荷",value:"hostile"}],"aria-label":"示例内容"},null,8,["modelValue"]),a(c,{source:m.value},null,8,["source"])])]),_:1}),a(f,{title:"自己改着看",description:"左边改，右边即时渲染。贴一段模型的真实输出进来最能说明问题。",lang:"vue",code:'<IMarkdown :source="source" />'},{default:s(()=>[t("div",H,[a(b,{modelValue:o.value,"onUpdate:modelValue":e[1]||(e[1]=u=>o.value=u),rows:10,"aria-label":"Markdown 原文"},null,8,["modelValue"]),t("div",y,[a(c,{source:o.value},null,8,["source"])])])]),_:1}),a(f,{title:"流式",description:"模型一边写一边渲染，随时可能停在代码块中间。停在中间时按「还没收完的代码块」渲染，不会满屏反引号，写完的一瞬间也不会整段跳变——而且没收完的代码块不给复制按钮，复制到一半的代码比不给复制更坑。",lang:"vue",code:'<IMarkdown :source="streamedText" />'},{default:s(()=>[t("div",B,[a(x,{variant:"secondary",size:"sm",onClick:p},{default:s(()=>[...e[2]||(e[2]=[V("重放一次",-1)])]),_:1}),a(c,{source:n.value||l.slice(0,60)},null,8,["source"])])]),_:1}),e[6]||(e[6]=M('<h2 data-v-eec567f0>什么时候不该用它</h2><ul data-v-eec567f0><li data-v-eec567f0>内容是自己写死的静态文案时——直接写模板，多绕一层解析只会让排版更难控。</li><li data-v-eec567f0>需要所见即所得编辑时——这是只读渲染，编辑器是另一回事。</li><li data-v-eec567f0>内容里必须带自定义 HTML 或脚本时——那不属于这个组件的能力范围，也不该属于。</li></ul><h2 data-v-eec567f0>API</h2><table class="i-table" data-v-eec567f0><thead data-v-eec567f0><tr data-v-eec567f0><th data-v-eec567f0>属性</th><th data-v-eec567f0>类型</th><th data-v-eec567f0>默认值</th><th data-v-eec567f0>说明</th></tr></thead><tbody data-v-eec567f0><tr data-v-eec567f0><td data-v-eec567f0>source</td><td data-v-eec567f0><code data-v-eec567f0>string</code></td><td data-v-eec567f0><code data-v-eec567f0>&#39;&#39;</code></td><td data-v-eec567f0>Markdown 原文</td></tr><tr data-v-eec567f0><td data-v-eec567f0>compact</td><td data-v-eec567f0><code data-v-eec567f0>boolean</code></td><td data-v-eec567f0><code data-v-eec567f0>false</code></td><td data-v-eec567f0>紧凑排版，用在气泡、卡片这类空间紧张的地方</td></tr></tbody></table>',4))]))}}),D=I(C,[["__scopeId","data-v-eec567f0"]]);export{D as default};
