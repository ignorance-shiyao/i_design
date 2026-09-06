import { useState } from 'react';
import {
  Anchor, BackTop, Button, Descriptions, InputNumber, Layout, LayoutContent, LayoutFooter,
  LayoutHeader, LayoutSider, List, ListItem, Menu, Rate, Result, Segmented, Slider, Space,
  Statistic, Tag, Timeline, Tree, Typography, Upload, Watermark, notification,
  type UploadFile,
} from '@i-design/react';
import type { DocEntry } from './types.js';

function NumberDemo() {
  const [count, setCount] = useState<number | null>(3);
  const [volume, setVolume] = useState(40);
  const [score, setScore] = useState(3.5);
  return (
    <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Space gap="l" wrap>
        <span style={{ width: 150 }}><InputNumber value={count} onChange={setCount} min={0} max={10} /></span>
        <span style={{ width: 170 }}><InputNumber value={count} onChange={setCount} controls="side" min={0} max={10} /></span>
      </Space>
      <Slider
        value={volume}
        onChange={setVolume}
        marks={[{ value: 0, label: '静音' }, { value: 50, label: '50%' }, { value: 100, label: '最大' }]}
        format={(v) => `${v}%`}
        label="音量"
      />
      <Space>
        <Rate value={score} onChange={setScore} allowHalf />
        <span style={{ color: 'var(--i-color-text-tertiary)' }}>{score} 分</span>
      </Space>
    </div>
  );
}

function UploadDemo() {
  const [files, setFiles] = useState<UploadFile[]>([
    { uid: '1', name: '需求文档.pdf', size: 240_000, status: 'success' },
  ]);
  return (
    <div style={{ width: '100%', maxWidth: 460 }}>
      <Upload
        variant="drag"
        files={files}
        accept=".pdf,.png,image/*"
        maxSize={2 * 1024 * 1024}
        maxCount={4}
        hint="支持 PDF 与图片，单个不超过 2MB，最多 4 个"
        onSelect={(picked) =>
          setFiles((prev) => [
            ...prev,
            ...picked.map((file, index) => ({
              uid: `${Date.now()}-${index}`,
              name: file.name,
              size: file.size,
              status: 'success' as const,
            })),
          ])
        }
        onRemove={(file) => setFiles((prev) => prev.filter((item) => item.uid !== file.uid))}
        onReject={(file, reason) =>
          notification.warning('文件被拒绝', `${file.name}：${reason === 'size' ? '超过大小限制' : reason === 'count' ? '超过数量限制' : '类型不符'}`)
        }
      />
    </div>
  );
}

function LayoutDemo() {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState('overview');
  return (
    <div style={{ width: '100%', height: 300, border: '1px solid var(--i-color-border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
      <Layout style={{ height: '100%' }}>
        <LayoutHeader>
          <Button size="s" variant="text" onClick={() => setCollapsed((value) => !value)}>☰</Button>
          <strong>控制台</strong>
        </LayoutHeader>
        <Layout direction="row" style={{ flex: 1, minHeight: 0 }}>
          <LayoutSider collapsed={collapsed} width={180}>
            <Menu
              value={active}
              onSelect={setActive}
              collapsed={collapsed}
              defaultExpanded={['content']}
              items={[
                { value: 'overview', label: '概览' },
                { value: 'content', label: '内容', children: [{ value: 'posts', label: '文章' }, { value: 'media', label: '素材' }] },
                { value: 'settings', label: '设置' },
                { value: 'danger', label: '删除站点', danger: true, divided: true },
              ]}
            />
          </LayoutSider>
          <LayoutContent>当前选中：{active}</LayoutContent>
        </Layout>
        <LayoutFooter>© i-design</LayoutFooter>
      </Layout>
    </div>
  );
}

function TreeDemo() {
  const [checked, setChecked] = useState<string[]>(['button.tsx']);
  return (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <Tree
        checkable
        checked={checked}
        onCheckedChange={setChecked}
        defaultExpanded={['packages', 'core']}
        nodes={[
          {
            key: 'packages',
            label: 'packages',
            children: [
              { key: 'core', label: 'core', children: [{ key: 'button.tsx', label: 'button.ts' }, { key: 'table.ts', label: 'table.ts' }] },
              { key: 'react', label: 'react' },
              { key: 'vue', label: 'vue' },
            ],
          },
          { key: 'readme', label: 'README.md' },
        ]}
      />
      <div style={{ marginBlockStart: 12, color: 'var(--i-color-text-tertiary)', fontSize: 12 }}>
        已选 {checked.length} 项
      </div>
    </div>
  );
}

function DisplayDemo() {
  const [range, setRange] = useState('week');
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Segmented
        value={range}
        onChange={setRange}
        options={[{ value: 'day', label: '今日' }, { value: 'week', label: '本周' }, { value: 'month', label: '本月' }]}
      />
      <Space gap="l" wrap>
        <Statistic label="活跃用户" value={1234567} trend="up" suffix="人" />
        <Statistic label="转化率" value={3.482} precision={2} suffix="%" trend="down" />
        <Statistic label="平均时长" value="4m 12s" />
      </Space>
      <Descriptions
        bordered
        columns={2}
        items={[
          { label: '订单号', value: 'o-20260906-1024' },
          { label: '状态', value: '已完成' },
          { label: '收货地址', value: '上海市杨浦区某某路 123 号', span: 2 },
        ]}
      />
      <List header="最近提交" hoverable>
        <ListItem title="fix: 修复深色模式下的对比度" description="2 小时前 · Ada" actions={<Tag status="success">已合并</Tag>} />
        <ListItem title="feat: 新增 Tree 组件" description="昨天 · Alan" actions={<Tag status="warning">评审中</Tag>} />
      </List>
    </div>
  );
}

function FeedbackDemo() {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Space wrap>
        <Button onClick={() => notification.success('部署完成', '产物已发布到生产环境。')}>成功通知</Button>
        <Button variant="outline" onClick={() => notification.error('构建失败', '依赖安装超时，请重试。')}>错误通知</Button>
        <Button
          variant="soft"
          onClick={() =>
            notification.open({
              title: '有新版本可用',
              description: 'v0.6.0 包含 20 个新组件。',
              status: 'info',
              actionText: '查看更新',
              duration: 0,
            })
          }
        >
          带操作的通知
        </Button>
      </Space>
      <Result
        status="success"
        title="提交成功"
        description="我们已收到你的申请，将在 1 个工作日内回复。"
        extra={<><Button status="brand">返回首页</Button><Button variant="outline">查看详情</Button></>}
      />
      <Watermark text="i-design · 内部资料" color="rgba(120,130,150,0.14)">
        <div style={{ padding: 24, border: '1px solid var(--i-color-border-subtle)', borderRadius: 12, minHeight: 120 }}>
          水印用 canvas 画成一张平铺背景图，而不是几百个绝对定位的节点——打印时也不会丢。
        </div>
      </Watermark>
    </div>
  );
}

export const moreEntries: DocEntry[] = [
  {
    id: 'input-number',
    name: 'InputNumber / Slider / Rate',
    cn: '数值输入',
    category: '数据录入',
    description:
      '三个都在 core 里共用同一套数值规则：步长推断精度、边界夹紧、以及 0.1 + 0.2 不会变成 0.30000000000000004 的四舍五入。键盘上 ↑↓ / PageUp / PageDown / Home / End 全部可用。',
    whenToUse: [
      '数值有明确上下界且需要精确输入时用 InputNumber；只需要大致选择时用 Slider。',
      'InputNumber 的 controls 有两种：stack 是 Ant 那样的上下箭头，side 是 Element 那样的两端加减。',
      '打分场景用 Rate，支持半星；再次点击当前值会清零。',
    ],
    demos: [
      {
        caption: '数值、区间与评分',
        hint: '输入框在输入过程中不会夹紧，避免「1」在去往「15」的路上跳到最小值',
        render: () => <NumberDemo />,
        react: `<InputNumber value={count} onChange={setCount} min={0} max={10} />
<InputNumber value={count} onChange={setCount} controls="side" />

<Slider value={volume} onChange={setVolume} format={(v) => \`\${v}%\`}
  marks={[{ value: 0, label: '静音' }, { value: 100, label: '最大' }]} />

<Rate value={score} onChange={setScore} allowHalf />`,
        vue: `<IInputNumber v-model="count" :min="0" :max="10" />
<IInputNumber v-model="count" controls="side" />

<ISlider v-model="volume" :marks="marks" />

<IRate v-model="score" allow-half />`,
      },
    ],
    props: [
      { name: 'min / max / step', type: 'number', default: '−∞ / ∞ / 1', desc: '取值范围与步长' },
      { name: 'precision', type: 'number', desc: '小数位；不传时从 step 推断' },
      { name: 'controls', type: `'stack' | 'side' | 'none'`, default: `'stack'`, desc: 'InputNumber 步进按钮样式' },
      { name: 'formatter / parser', type: '(value) => string / (text) => number', desc: '显示与解析转换，如千分位或单位后缀' },
      { name: 'marks', type: 'Array<{ value, label? }>', desc: 'Slider 刻度，可点击跳转' },
      { name: 'allowHalf', type: 'boolean', default: 'false', desc: 'Rate 半星' },
    ],
  },
  {
    id: 'upload',
    name: 'Upload',
    cn: '上传',
    category: '数据录入',
    description:
      '组件只负责选择、校验与列表状态，不发请求——上传用什么协议是业务的事。accept / maxSize / maxCount 三道限制在 core 里统一执行，拖拽与点击两条入口走同一段逻辑。',
    whenToUse: [
      '需要用户提交文件时。上传请求由你自己发起，组件通过 files 的 status 与 percent 反映进度。',
      '限制条件请交给组件：被拒绝的文件会带上原因（size / count / accept），不会静默丢弃。',
    ],
    demos: [
      {
        caption: '拖拽上传与限制',
        hint: '试着拖一个超过 2MB 的文件进来，会收到带原因的通知',
        render: () => <UploadDemo />,
        react: `<Upload
  variant="drag"
  files={files}
  accept=".pdf,image/*"
  maxSize={2 * 1024 * 1024}
  maxCount={4}
  onSelect={(picked) => upload(picked)}
  onRemove={(file) => remove(file)}
  onReject={(file, reason) => notification.warning('文件被拒绝', reason)}
/>`,
        vue: `<IUpload
  variant="drag"
  :files="files"
  accept=".pdf,image/*"
  :max-size="2 * 1024 * 1024"
  :max-count="4"
  @select="upload"
  @remove="remove"
  @reject="(file, reason) => notification.warning('文件被拒绝', reason)"
/>`,
      },
    ],
    props: [
      { name: 'files', type: 'UploadFile[]', desc: '受控文件列表：uid / name / size / status / percent' },
      { name: 'accept', type: 'string', desc: '同原生 accept，支持 .ext 与 image/*' },
      { name: 'maxSize / maxCount', type: 'number', desc: '单文件字节上限 / 总数量上限' },
      { name: 'variant', type: `'button' | 'drag'`, default: `'button'`, desc: '触发方式' },
      { name: 'onReject', type: `(file, reason: 'size' | 'count' | 'accept') => void`, desc: '被限制拦下的文件' },
    ],
  },
  {
    id: 'layout',
    name: 'Layout / Menu',
    cn: '布局与菜单',
    category: '导航',
    description:
      'Menu 的模型同时服务侧边菜单和 Dropdown：inline 模式就地展开子菜单，popup 模式浮出——两者在选中、展开、键盘处理上完全一致。',
    whenToUse: [
      '后台应用的整体骨架用 Layout；侧边导航用 Menu 的 inline 模式。',
      '折叠侧栏时给 Menu 传 collapsed，标签会隐藏但图标与可达性保留。',
      '危险操作用 danger 标记，并配合 divided 与其他项拉开距离。',
    ],
    demos: [
      {
        caption: '控制台骨架',
        hint: '点左上角按钮折叠侧栏；菜单项支持方向键移动',
        render: () => <LayoutDemo />,
        react: `<Layout>
  <LayoutHeader>…</LayoutHeader>
  <Layout direction="row">
    <LayoutSider collapsed={collapsed} width={180}>
      <Menu value={active} onSelect={setActive} items={items} />
    </LayoutSider>
    <LayoutContent>…</LayoutContent>
  </Layout>
  <LayoutFooter>© i-design</LayoutFooter>
</Layout>`,
        vue: `<ILayout>
  <ILayoutHeader>…</ILayoutHeader>
  <ILayout direction="row">
    <ILayoutSider :collapsed="collapsed" :width="180">
      <IMenu :value="active" :items="items" @select="onSelect" />
    </ILayoutSider>
    <ILayoutContent>…</ILayoutContent>
  </ILayout>
  <ILayoutFooter>© i-design</ILayoutFooter>
</ILayout>`,
      },
    ],
    props: [
      { name: 'items', type: 'MenuItem[]', desc: 'value / label / disabled / danger / divided / children' },
      { name: 'mode', type: `'inline' | 'popup'`, default: `'inline'`, desc: '子菜单就地展开还是浮层' },
      { name: 'collapsed', type: 'boolean', default: 'false', desc: '折叠为图标条' },
      { name: 'direction', type: `'column' | 'row'`, default: `'column'`, desc: 'Layout 主轴方向' },
      { name: 'width / collapsedWidth', type: 'number | string', default: '220 / 56', desc: 'Sider 宽度' },
    ],
  },
  {
    id: 'tree',
    name: 'Tree',
    cn: '树形控件',
    category: '导航',
    description:
      '树是扁平渲染的：core 把可见节点展平成一维数组，组件不做递归渲染，长列表也能虚拟化。勾选带父子联动，半选状态由子节点算出来。',
    whenToUse: [
      '层级数据的浏览与选择：文件树、组织架构、分类。',
      '需要批量选择时开 checkable，勾选父节点会连带全部子孙。',
      '层级很深时优先考虑 Cascader 或 TreeSelect（规划中）。',
    ],
    demos: [
      {
        caption: '可勾选的文件树',
        hint: '→ / ← 展开收起，Enter 选中',
        render: () => <TreeDemo />,
        react: `<Tree
  checkable
  checked={checked}
  onCheckedChange={setChecked}
  defaultExpanded={['packages']}
  nodes={nodes}
/>`,
        vue: `<ITree
  checkable
  v-model:checked="checked"
  :default-expanded="['packages']"
  :nodes="nodes"
/>`,
      },
    ],
    props: [
      { name: 'nodes', type: 'TreeNode[]', desc: 'key / label / children / disabled' },
      { name: 'expanded', type: 'string[]', desc: '展开的节点 key，可受控' },
      { name: 'checkable', type: 'boolean', default: 'false', desc: '显示复选框并启用父子联动' },
      { name: 'checked', type: 'string[]', desc: '勾选的 key；半选状态自动推导' },
    ],
  },
  {
    id: 'display-more',
    name: 'List / Descriptions / Statistic / Timeline / Segmented',
    cn: '数据展示',
    category: '数据展示',
    description:
      '后台界面的日常零件。Statistic 的千分位分组只作用于整数部分，不会把小数也切开；Descriptions 用 grid 布局，跨列通过 span 表达。',
    whenToUse: [
      '键值对信息用 Descriptions，条目列表用 List，单个关键指标用 Statistic。',
      '有时间顺序的状态变化用 Timeline；同级视图切换用 Segmented。',
      'Segmented 与 Tabs 的区别：Segmented 只切换数据范围，不承载面板内容。',
    ],
    demos: [
      {
        caption: '组合示例',
        render: () => <DisplayDemo />,
        react: `<Segmented value={range} onChange={setRange}
  options={[{ value: 'day', label: '今日' }, { value: 'week', label: '本周' }]} />

<Statistic label="活跃用户" value={1234567} trend="up" suffix="人" />

<Descriptions bordered columns={2} items={[
  { label: '订单号', value: 'o-1024' },
  { label: '地址', value: '…', span: 2 },
]} />

<List header="最近提交" hoverable>
  <ListItem title="fix: …" description="2 小时前" actions={<Tag>已合并</Tag>} />
</List>`,
        vue: `<ISegmented v-model="range" :options="options" />

<IStatistic label="活跃用户" :value="1234567" trend="up" suffix="人" />

<IDescriptions bordered :columns="2" :items="items" />

<IList header="最近提交" hoverable>
  <IListItem title="fix: …" description="2 小时前">
    <template #actions><ITag>已合并</ITag></template>
  </IListItem>
</IList>`,
      },
    ],
    props: [
      { name: 'items', type: 'Array', desc: 'Descriptions / Timeline 的数据项' },
      { name: 'columns', type: 'number', default: '2', desc: 'Descriptions 列数；单项可用 span 跨列' },
      { name: 'precision / groupSeparator', type: 'number / string', default: '— / ,', desc: 'Statistic 小数位与千分位' },
      { name: 'trend', type: `'up' | 'down' | 'flat'`, desc: 'Statistic 趋势，会带上箭头与语义色' },
      { name: 'mode', type: `'left' | 'alternate'`, default: `'left'`, desc: 'Timeline 布局' },
      { name: 'block', type: 'boolean', default: 'false', desc: 'Segmented 占满整行' },
    ],
  },
  {
    id: 'typography',
    name: 'Typography',
    cn: '排版',
    category: '数据展示',
    description:
      '标题、正文、行内文本的统一入口，带省略与复制。单行省略用 text-overflow，多行用 line-clamp，行数通过 CSS 变量下发——不需要 JS 测量。',
    whenToUse: [
      '需要语义标题（h1–h5）或统一的正文样式时。',
      '内容长度不可控的地方用 ellipsis，避免撑破布局。',
      '需要用户复制的标识、ID、密钥用 copyable。',
    ],
    demos: [
      {
        caption: '层级、状态与省略',
        render: () => (
          <div style={{ width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Typography as="title" level={2}>二级标题</Typography>
            <Typography as="paragraph">
              正文段落使用 secondary 色与更宽松的行高，适合成段阅读的内容。
            </Typography>
            <Space wrap>
              <Typography strong>加粗</Typography>
              <Typography status="success">成功</Typography>
              <Typography status="danger" delete>已废弃</Typography>
              <Typography code>--i-color-brand</Typography>
            </Space>
            <Typography ellipsis={2}>
              多行省略：当内容超过指定行数时用省略号截断。这段文字足够长，用来演示 line-clamp 的效果，行数通过 CSS 变量下发，不需要 JavaScript 参与测量，因此在服务端渲染时也不会闪烁。
            </Typography>
          </div>
        ),
        react: `<Typography as="title" level={2}>二级标题</Typography>
<Typography as="paragraph">正文段落…</Typography>
<Typography status="danger" delete>已废弃</Typography>
<Typography code>--i-color-brand</Typography>
<Typography ellipsis={2}>多行省略…</Typography>`,
        vue: `<ITypography as="title" :level="2">二级标题</ITypography>
<ITypography as="paragraph">正文段落…</ITypography>
<ITypography status="danger" delete>已废弃</ITypography>
<ITypography code>--i-color-brand</ITypography>
<ITypography :ellipsis="2">多行省略…</ITypography>`,
      },
    ],
    props: [
      { name: 'as', type: `'text' | 'title' | 'paragraph'`, default: `'text'`, desc: '语义角色，决定渲染的标签' },
      { name: 'level', type: '1 | 2 | 3 | 4 | 5', default: '3', desc: 'as="title" 时的标题级别' },
      { name: 'ellipsis', type: 'number', desc: '1 为单行省略，>1 为多行截断' },
      { name: 'copyable', type: 'boolean', default: 'false', desc: '显示复制按钮' },
      { name: 'strong / italic / underline / delete / code', type: 'boolean', desc: '行内修饰' },
    ],
  },
  {
    id: 'notification',
    name: 'Notification / Result / Watermark',
    cn: '反馈',
    category: '反馈',
    description:
      'Notification 是命令式的：它不是组件，而是一个普通函数，React、Vue 甚至原生脚本调用同一份实现。鼠标悬停时会暂停自动关闭——读到一半被关掉是最常见的体验缺陷。',
    whenToUse: [
      '需要标题 + 描述、甚至一个操作按钮的通知用 Notification；一句话结果用 message。',
      '整页的操作结果（成功、失败、404）用 Result。',
      '内部资料、预览页用 Watermark 标识来源。',
    ],
    demos: [
      {
        caption: '通知、结果页与水印',
        hint: '把鼠标停在通知上，倒计时会暂停',
        render: () => <FeedbackDemo />,
        react: `notification.success('部署完成', '产物已发布到生产环境。');

notification.open({
  title: '有新版本可用',
  description: 'v0.6.0 包含 20 个新组件。',
  actionText: '查看更新',
  duration: 0,          // 0 表示不自动关闭
});

<Result status="success" title="提交成功" extra={<Button>返回首页</Button>} />

<Watermark text="内部资料"><Report /></Watermark>`,
        vue: `import { notification } from '@i-design/vue';

notification.success('部署完成', '产物已发布到生产环境。');

<IResult status="success" title="提交成功">
  <template #extra><IButton>返回首页</IButton></template>
</IResult>

<IWatermark text="内部资料"><Report /></IWatermark>`,
      },
    ],
    props: [
      { name: 'title / description', type: 'string', desc: 'Notification 主副文案' },
      { name: 'status', type: `'default' | 'info' | 'success' | 'warning' | 'danger'`, default: `'default'`, desc: '语义；danger 会用 role="alert"' },
      { name: 'placement', type: `'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'`, default: `'top-end'`, desc: '出现位置' },
      { name: 'duration', type: 'number', default: '4500', desc: '毫秒；0 表示不自动关闭' },
      { name: 'actionText / onAction', type: 'string / () => void', desc: '内联操作按钮' },
      { name: 'text / color / rotate / gap', type: 'string / string / number / number', desc: 'Watermark 文案与样式' },
    ],
  },
  {
    id: 'anchor',
    name: 'Anchor / BackTop',
    cn: '锚点',
    category: '导航',
    description:
      '当前区块的判定用滚动位置而不是 IntersectionObserver：区块高度差异很大时，观察器的阈值会来回抖动，而「最后一个越过了偏移线的区块」这个规则稳定且可测试。',
    whenToUse: ['长文档、设置页这类需要快速跳转的页面。', '页面很长时配合 BackTop。'],
    demos: [
      {
        caption: '锚点导航',
        render: () => (
          <div style={{ display: 'flex', gap: 24, width: '100%' }}>
            <Anchor
              items={[
                { id: 'demos', label: '代码演示' },
                { id: 'api', label: 'API' },
              ]}
            />
            <span style={{ color: 'var(--i-color-text-tertiary)', fontSize: 12 }}>
              指向本页的区块，点击平滑滚动并高亮。右下角的 BackTop 在滚动后出现。
            </span>
            <BackTop />
          </div>
        ),
        react: `<Anchor items={[{ id: 'intro', label: '简介' }, { id: 'api', label: 'API' }]} offset={80} />
<BackTop threshold={240} />`,
        vue: `<IAnchor :items="[{ id: 'intro', label: '简介' }]" :offset="80" />
<IBackTop :threshold="240" />`,
      },
    ],
    props: [
      { name: 'items', type: 'Array<{ id, label, depth? }>', desc: '锚点项，id 对应页面元素' },
      { name: 'offset', type: 'number', default: '80', desc: '判定与滚动时的顶部偏移（粘性头部高度）' },
      { name: 'threshold', type: 'number', default: '240', desc: 'BackTop 出现的滚动距离' },
    ],
  },
];
