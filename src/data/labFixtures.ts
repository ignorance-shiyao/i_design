import { buildHierarchy, buildPareto } from '@i-design/common'
/**
 * Patterns Lab 的最小可运行数据。
 *
 * Lab 里的每个组件都要真的渲染出来——只列名字或摆一张截图不算覆盖，
 * 那种「覆盖」骗不了别人只骗得了自己：组件早就坏了，页面上照样有它的名字。
 *
 * 大多数组件的必填属性能从类型推出来（枚举取第一项、字符串给一段示例文字），
 * 由 Lab 自动合成；只有必填属性是数组或对象的才需要在这里给一份。
 * 缺一份 `npm run check:registry` 就会失败，不会悄悄少一个组件。
 *
 * 数据一律虚构，且不带随机：同一份 fixture 每次渲染出来完全一样，
 * 视觉回归才不会每跑一次漂一点。
 */

const people = ['林岚', '陈序', '苏禾', '周迟']

export const labFixtures: Record<string, Record<string, unknown>> = {
  IAgentTasks: {
    tasks: [
      { id: 't1', title: '检索近三个月的供应商报价', status: 'completed', meta: '12 个供应商' },
      { id: 't2', title: '比对交期与单价', status: 'running', index: 2 },
      { id: 't3', title: '生成采购建议', status: 'pending' }
    ]
  },
  IAnchor: {
    items: [
      { key: 'intro', label: '概述', level: 2 },
      { key: 'usage', label: '用法', level: 2 },
      { key: 'api', label: '接口', level: 3 }
    ]
  },
  IApprovalCard: {
    questions: [
      {
        id: 'q1',
        title: '这批采购走哪条审批线？',
        options: [
          { value: 'normal', label: '常规线' },
          { value: 'fast', label: '快速线', hint: '（金额 5 万以下）' }
        ]
      }
    ]
  },
  IAutoComplete: { options: [{ value: '明远制造' }, { value: '合力重工' }, { value: '南屿食品' }] },
  IBreadcrumb: { items: [{ label: '首页', to: '/' }, { label: '订单', to: '/orders' }, { label: 'SO-2026-0007' }] },
  ICarousel: { items: [{ key: 'a', label: '第一屏' }, { key: 'b', label: '第二屏' }, { key: 'c', label: '第三屏' }] },
  ICascader: {
    data: [
      { key: 'east', label: '华东', children: [{ key: 'sh', label: '上海' }, { key: 'hz', label: '杭州' }] },
      { key: 'south', label: '华南', children: [{ key: 'gz', label: '广州' }] }
    ]
  },
  IChart: {
    labels: ['一月', '二月', '三月', '四月', '五月', '六月'],
    series: [{ name: '销售额', data: [820, 932, 901, 1290, 1330, 1320] }]
  },
  IChartBox: {
    groups: [
      { label: '华东', values: [12, 18, 22, 25, 31, 38, 44] },
      { label: '华南', values: [9, 14, 19, 24, 28, 33, 51] }
    ]
  },
  IChartFunnel: {
    stages: [
      { name: '访问', value: 12000 }, { name: '注册', value: 5400 },
      { name: '试用', value: 2100 }, { name: '成交', value: 640 }
    ]
  },
  IChartGantt: {
    tasks: [
      { id: 'g1', name: '需求梳理', start: '2026-03-02', end: '2026-03-06', progress: 1 },
      { id: 'g2', name: '接口联调', start: '2026-03-09', end: '2026-03-18', progress: 0.4 }
    ]
  },
  IChartGauge: { value: 72 },
  IChartHeatmap: {
    rows: ['周一', '周二', '周三'],
    columns: ['09:00', '12:00', '15:00', '18:00'],
    matrix: [[2, 8, 5, 1], [4, 9, 7, 3], [1, 5, 9, 6]]
  },
  IChartPie: { items: [{ name: '直销', value: 48 }, { name: '代理', value: 31 }, { name: '线上', value: 21 }] },
  IChartRadar: {
    axes: ['交期', '价格', '质量', '服务', '产能'],
    series: [{ name: '明远制造', data: [82, 74, 91, 68, 77] }]
  },
  IChartSankey: {
    links: [
      { from: '询价', to: '报价', value: 42 },
      { from: '报价', to: '成交', value: 26 },
      { from: '报价', to: '流失', value: 16 }
    ]
  },
  IChartScatter: {
    series: [{ name: '订单', data: [{ x: 12, y: 40, size: 8, label: '明远' }, { x: 28, y: 66, size: 14, label: '合力' }, { x: 41, y: 22, size: 5, label: '南屿' }] }]
  },
  IChartTreemap: {
    items: [{ label: '网关', value: 42 }, { label: '传感器', value: 28 }, { label: '边缘盒', value: 18 }, { label: '模块', value: 12 }]
  },
  IChartWaterfall: {
    items: [
      { label: '期初', value: 120, total: true }, { label: '新签', value: 48 },
      { label: '流失', value: -22 }, { label: '期末', value: 0, total: true }
    ]
  },
  IChartWordCloud: {
    words: [
      { text: '交期', value: 40 }, { text: '单价', value: 32 }, { text: '质检', value: 24 },
      { text: '返修', value: 18 }, { text: '产能', value: 12 }
    ]
  },
  IChartZoom: { values: [12, 18, 9, 24, 31, 27, 19, 22, 35, 29, 17, 25] },
  IChatList: {
    sessions: [
      { id: 'c1', title: '采购建议', preview: '比对了 12 家供应商', updatedAt: Date.UTC(2026, 2, 16, 1, 10) },
      { id: 'c2', preview: '还没起名的会话', updatedAt: Date.UTC(2026, 2, 15, 9, 0) }
    ]
  },
  IChatSources: {
    sources: [
      { title: '2026 年 Q1 供应商报价单', origin: 'quotes.xlsx' },
      { title: '采购制度 v3', origin: '制度库' }
    ]
  },
  IChatSuggestions: { items: ['对比这两家的交期', '生成采购建议', '导出为表格'] },
  IChatToolCall: { name: 'search_suppliers' },
  /* status 的类型是从 contracts 引来的别名，属性解析器看不到它的字面量，得在这儿给 */
  IRunStatus: { status: 'queued', queuePosition: 3 },
  /* 浮层类组件在 Lab 里默认不展开（见 LabPage 的 INTERACTIVE），必填属性仍要齐 */
  IDrawerForm: { values: {}, initial: {} },
  IModalForm: { values: {}, initial: {} },
  IImportWizard: {
    sources: [
      { key: '客户', sample: '明远制造' },
      { key: '联系人', sample: '林岚' }
    ],
    fields: [
      { key: 'customer', label: '客户', required: true },
      { key: 'owner', label: '负责人', required: true, aliases: ['联系人'] }
    ],
    modelValue: { customer: '客户', owner: '联系人' }
  },
  /* 导出卡的时间是受控的：不给 now 与 createdAt，Lab 每次截图都会变 */
  IExportJob: {
    status: 'running',
    processed: 12000,
    total: 48000,
    now: 1_757_900_000_000,
    meta: {
      subject: '销售订单',
      createdAt: 1_757_900_000_000,
      filters: ['负责人：林岚', '状态：已发货'],
      columns: ['订单号', '客户', '金额'],
      rows: 48_000
    }
  },
  /* 树表在 Lab 里要有层级、有小计、有一条不可选的行，否则看不出它与 Table 的差别 */
  ITreeTable: {
    columns: [
      { key: 'name', title: '客户 / 大区', sortable: true },
      { key: 'amount', title: '金额', numeric: true, sortable: true }
    ],
    data: [
      {
        key: 'east',
        name: '华东大区',
        amount: 3000,
        children: [
          { key: 'east-1', name: '明远制造', amount: 1200 },
          { key: 'east-2', name: '合力重工', amount: 2600 },
          { key: 'east-3', name: '安泰化工', selectableReason: '没有查看权限' }
        ]
      }
    ],
    expanded: ['east'],
    selected: ['east-1'],
    aggregates: [{ field: 'amount', kind: 'sum' }],
    selectable: true,
    showTotal: true
  },
  /* 任务中心要同时出现失败、完成待查看与进行中，才看得出角标数的是哪两类 */
  ITaskCenter: {
    tasks: [
      {
        id: 'T-8841',
        title: '导入客户',
        state: 'failed',
        createdAt: 1_757_900_000_000,
        finishedAt: 1_757_900_020_000,
        actor: '沈黎',
        error: '第 12 行客户为空'
      },
      {
        id: 'T-8842',
        title: '导出销售订单',
        state: 'running',
        createdAt: 1_757_900_100_000,
        actor: '林岚',
        target: { kind: '报表', id: 'R-1', label: '销售订单-已发货' }
      }
    ]
  },
  /* 线程在 Lab 里要同时出现留坑、活动折叠与未读分隔线 */
  IThread: {
    meId: 'me',
    lastReadAt: 1_757_900_060_000,
    entries: [
      {
        id: 'c1',
        kind: 'comment',
        authorId: 'u2',
        authorName: '沈黎',
        body: '这单客户要求先发一半。',
        createdAt: 1_757_900_000_000
      },
      {
        id: 'c2',
        kind: 'comment',
        authorId: 'u3',
        authorName: '周其',
        body: '',
        createdAt: 1_757_900_030_000,
        deleted: true
      },
      {
        id: 'c3',
        kind: 'comment',
        authorId: 'u1',
        authorName: '林岚',
        body: '那按 8 万走。',
        createdAt: 1_757_900_090_000,
        parentId: 'c2'
      },
      {
        id: 'a1',
        kind: 'activity',
        actorId: 'u1',
        actorName: '林岚',
        change: '金额：12 万 → 8 万',
        createdAt: 1_757_900_120_000
      },
      {
        id: 'a2',
        kind: 'activity',
        actorId: 'u1',
        actorName: '林岚',
        change: '状态：待确认 → 已确认',
        createdAt: 1_757_900_150_000
      }
    ]
  },
  /* 看板在 Lab 里要有在制品满、流转限制与锁着的卡，才看得出它与普通列表的差别 */
  IBoard: {
    columns: [
      { id: 'todo', title: '待办' },
      { id: 'doing', title: '进行中', wipLimit: 2 },
      { id: 'done', title: '已完成', allowFrom: ['doing'] }
    ],
    lanes: [{ id: 'lan', title: '林岚' }],
    cards: [
      { id: 'k1', title: '对账单核对', columnId: 'todo', laneId: 'lan' },
      { id: 'k2', title: '合同附件更新', columnId: 'doing', laneId: 'lan' },
      { id: 'k3', title: '去年的结转单', columnId: 'todo', laneId: 'lan', lockedReason: '已归档' }
    ]
  },
  IEntityPicker: {
    page: [
      { id: 'p1', label: '张三', hint: '销售一部' },
      { id: 'p2', label: '李四', hint: '销售二部', blockedReason: '没有该部门的查看权限' },
      { id: 'p3', label: '王五', hint: '已离职', inactive: true }
    ],
    modelValue: [{ id: 'p1', label: '张三', hint: '销售一部' }],
    keyword: '张',
    multiple: true
  },
  IDetailPage: {
    title: 'SO-2026-0007',
    status: 'submitted',
    actions: [
      { key: 'approve', label: '通过', kind: 'primary', states: ['submitted'], permission: '审批' },
      { key: 'print', label: '打印', readonly: true }
    ],
    siblingIds: ['SO-2026-0006', 'SO-2026-0007', 'SO-2026-0008'],
    currentId: 'SO-2026-0007'
  },
  IBulkBar: { scope: 'page', pageIds: ['SO-1', 'SO-2', 'SO-3'], selectedIds: ['SO-1'], matchedTotal: 8000 },
  IStepForm: {
    modelValue: {},
    steps: [
      { key: 'base', title: '基本信息', fields: ['title'] },
      { key: 'more', title: '补充说明', fields: ['note'] }
    ]
  },
  IFormPage: {
    title: '编辑采购单',
    modelValue: { title: '春季补货' },
    initial: { title: '春季补货' }
  },
  ICodeBlock: { code: "import { IButton } from '@i-design/vue-next'\n\nconst ok = true\n" },
  ICollapse: {
    items: [
      { name: '1', title: '交期怎么算', content: '从确认订单的次日起算，不含法定假日。' },
      { name: '2', title: '能不能改单', content: '进入审批之后需要撤回再改。' }
    ]
  },
  ICommandSearch: {
    items: [
      { key: 'new-order', label: '新建订单', description: '销售 / 订单' },
      { key: 'inventory', label: '库存查询', description: '供应链 / 库存' }
    ]
  },
  IContextCards: {
    chunks: [
      { id: 'x1', title: '采购制度 v3 · 第 4 条', content: '单笔超过五万元的采购需要区域总监复核。', source: '制度库.md' }
    ]
  },
  ICountdown: { value: 90 * 1000 },
  IDescriptions: {
    items: [
      { label: '单号', value: 'SO-2026-0007' },
      { label: '客户', value: '明远制造' },
      { label: '负责人', value: people[0] },
      { label: '备注', value: '交期提前一周', span: 2 }
    ]
  },
  IDiffTable: {
    columns: [{ key: 'name', label: '名称' }, { key: 'qty', label: '数量' }],
    rows: [
      { id: 'r1', kind: 'unchanged', cells: { name: { value: '工业网关 A1' }, qty: { value: '12' } } },
      { id: 'r2', kind: 'changed', cells: { name: { value: '温湿度传感器' }, qty: { value: '30', before: '20' } } },
      { id: 'r3', kind: 'added', cells: { name: { value: '边缘计算盒' }, qty: { value: '2' } } }
    ]
  },
  IArtifactWorkspace: {
    artifactId: 'plan',
    version: 2,
    artifacts: [
      { id: 'plan', kind: 'document', title: '采购方案', version: 2, createdAt: 1_757_030_400_000, content: '保留开心果与黑芝麻两项补货。', itemIds: ['keep-pistachio', 'keep-sesame'] },
      { id: 'plan', kind: 'document', title: '采购方案', version: 1, createdAt: 1_756_944_000_000, content: '建议补货开心果、黑芝麻与石板街。', itemIds: ['keep-pistachio', 'keep-stone-street'] }
    ],
    adopted: ['keep-pistachio']
  },
  IDropdown: {
    items: [
      { key: 'edit', label: '编辑', icon: 'edit' },
      { key: 'copy', label: '复制', icon: 'copy', hint: '⌘C' },
      { key: 'delete', label: '删除', icon: 'trash', danger: true }
    ]
  },
  IFineTuneCard: {
    fields: [
      { key: 'radius', label: '圆角', kind: 'number', min: 0, max: 24, step: 2 },
      { key: 'dense', label: '紧凑', kind: 'switch' }
    ],
    original: { radius: 8, dense: false },
    values: { radius: 12, dense: true }
  },
  IFlow: {
    nodes: [
      { id: 'start', x: 40, y: 40, label: '提交', shape: 'start' },
      { id: 'check', x: 200, y: 40, label: '审批', shape: 'decision' },
      { id: 'done', x: 380, y: 40, label: '完成', shape: 'end' }
    ],
    edges: [{ from: 'start', to: 'check' }, { from: 'check', to: 'done', label: '通过' }]
  },
  IForm: { model: { name: '明远制造', owner: people[0] } },
  IIcon: { name: 'check' },
  IImage: { src: '', alt: '示例图片' },
  IImageViewer: { images: [] },
  IInsightCards: {
    items: [
      { id: 'i1', title: '华东回款变慢', summary: '平均回款周期从 32 天拉长到 41 天，主要来自两家大客户。', series: [32, 33, 35, 38, 41], labels: ['11月', '12月', '1月', '2月', '3月'] }
    ]
  },
  IList: {
    items: [
      { title: '采购申请 PR-0031', description: '边缘计算盒 ×2', meta: ['今天 09:12', people[1]] },
      { title: '采购申请 PR-0030', description: '温湿度传感器 ×30', meta: ['昨天 17:40', people[2]] }
    ]
  },
  IMentions: {
    options: people.map((name, i) => ({ value: `p${i + 1}`, label: name, desc: '供应链部' }))
  },
  IMenu: {
    items: [
      { key: 'orders', label: '订单', icon: 'file' },
      { key: 'stock', label: '库存', icon: 'box', children: [{ key: 'in', label: '入库' }, { key: 'out', label: '出库' }] }
    ]
  },
  IPagination: { total: 186 },
  IQrcode: { value: 'https://ignorance-shiyao.github.io/i_design/' },
  IRadio: { value: 'a' },
  IRecommendCard: { title: '建议把这批网关的采购提前到下周' },
  ISegmented: { options: [{ label: '全部', value: 'all' }, { label: '待审批', value: 'pending' }, { label: '已完成', value: 'done' }] },
  ISelect: { options: [{ label: '明远制造', value: 'my' }, { label: '合力重工', value: 'hl' }] },
  ISelectionActions: {
    actions: [{ id: 'export', label: '导出', icon: 'download' }, { id: 'close', label: '关闭', icon: 'check' }]
  },
  ISparkline: { data: [12, 18, 9, 24, 31, 27, 19, 22, 35] },
  IStatistic: { value: 1286 },
  ISteps: {
    items: [
      { title: '提交', description: '填写并提交申请' },
      { title: '审批', description: '主管复核' },
      { title: '完成' }
    ]
  },
  IStickyTool: {
    items: [
      { value: 'top', label: '回到顶部', icon: 'chevron-up' },
      { value: 'help', label: '帮助', icon: 'info-circle' }
    ]
  },
  IChartPareto: { model: buildPareto([{ id: 'timeout', label: '请求超时', value: 60 }, { id: 'other', label: '其他', value: 40 }]) },
  IChartSunburst: { model: buildHierarchy([{ id: 'direct', parentId: null, label: '直销', value: 60 }, { id: 'key', parentId: 'direct', label: '大客户', value: 40 }, { id: 'channel', parentId: null, label: '渠道', value: 40 }]) },
  IChartDistribution: {
    values: [
      12, 15, 15, 16, 18, 18, 19, 20, 21, 22, 22, 23, 24, 25, 26, 28, 29, 31, 33, 35,
      36, 38, 41, 44, 48, 52, 57, 63, 70, 88
    ],
    type: 'histogram',
    title: '订单金额分布',
    unit: ' 万元'
  },
  IAppShell: {
    title: '青禾 ERP',
    user: '林岚（销售经理）',
    nav: [
      { key: 'orders', label: '销售订单', icon: 'file-text', children: [{ key: 'orders/draft', label: '草稿箱' }] },
      { key: 'stock', label: '库存', icon: 'warehouse' }
    ],
    current: 'orders',
    crumbs: [{ label: '销售订单' }]
  },
  IProTable: {
    columns: [
      { key: 'id', title: '单号', width: '120px', locked: true },
      { key: 'customer', title: '客户' },
      { key: 'amount', title: '金额', width: '120px' },
      { key: 'cost', title: '成本', width: '110px', restricted: true }
    ],
    state: {
      query: { filters: {}, sort: { key: null, order: null }, page: 1, pageSize: 20 },
      rows: [
        { id: 'SO-2026-0007', customer: '明远制造', amount: '¥ 12,800', cost: '¥ 9,100' },
        { id: 'SO-2026-0008', customer: '合力重工', amount: '¥ 26,400', cost: '¥ 18,300' }
      ],
      total: 2,
      status: 'success',
      seq: 1,
      settledSeq: 1,
      error: null,
      discarded: []
    }
  },
  IQueryFilter: {
    fields: [
      { name: 'keyword', label: '关键词', kind: 'text', placeholder: '单号或客户', always: true },
      {
        name: 'status',
        label: '状态',
        kind: 'select',
        options: [
          { value: 'open', label: '进行中' },
          { value: 'done', label: '已完成' }
        ],
        always: true
      },
      {
        name: 'owner',
        label: '负责人',
        kind: 'multi-select',
        options: [
          { value: 'lin', label: '林岚' },
          { value: 'shen', label: '沈黎' }
        ]
      },
      { name: 'created', label: '创建时间', kind: 'date-range' },
      { name: 'amount', label: '金额', kind: 'number-range' }
    ],
    modelValue: { values: { status: 'open' }, page: 1, pageSize: 20 },
    quickFilters: [{ key: 'open', label: '进行中', values: { status: 'open' } }]
  },
  ISchemaForm: {
    schema: {
      fields: [
        {
          name: 'type',
          label: '客户类型',
          kind: 'select',
          rules: [{ kind: 'required', message: '请选择客户类型' }],
          options: [
            { value: 'person', label: '个人' },
            { value: 'company', label: '企业' }
          ]
        },
        {
          name: 'taxNo',
          label: '税号',
          kind: 'text',
          when: { field: 'type', op: 'eq', value: 'company' },
          rules: [{ kind: 'required', message: '企业客户必须填税号' }]
        },
        {
          name: 'lines',
          label: '明细',
          kind: 'array',
          minItems: 1,
          item: [
            { name: 'sku', label: '物料', kind: 'text' },
            { name: 'quantity', label: '数量', kind: 'number' }
          ]
        }
      ]
    },
    modelValue: { type: 'company', taxNo: 'ABC12345', lines: [{ sku: 'SKU-1001', quantity: 2 }] }
  },
  ITable: {
    columns: [
      { key: 'id', title: '单号' },
      { key: 'customer', title: '客户' },
      { key: 'amount', title: '金额', align: 'right' }
    ],
    data: [
      { id: 'SO-2026-0007', customer: '明远制造', amount: '¥ 12,800' },
      { id: 'SO-2026-0008', customer: '合力重工', amount: '¥ 26,400' }
    ]
  },
  ITabs: { items: [{ name: 'detail', label: '详情' }, { name: 'lines', label: '明细' }, { name: 'log', label: '操作记录' }] },
  ITimeline: {
    items: [
      { title: '提交申请', time: '09:12', type: 'brand' },
      { title: '主管通过', time: '10:05', type: 'success' },
      { title: '等待入库', time: '待办', current: true }
    ]
  },
  IToolChips: {
    items: [
      { key: 'read', label: 'orders.ts', status: 'done', added: 12 },
      { key: 'edit', label: 'stock.ts', status: 'running' }
    ]
  },
  ITour: {
    steps: [{ target: '.i-lab__stage', title: '这里是演示区', description: '每个组件都在这里真的渲染一次。' }]
  },
  ITransfer: {
    items: [
      { key: 'a', label: '明远制造' }, { key: 'b', label: '合力重工' }, { key: 'c', label: '南屿食品' }
    ]
  },
  ITree: {
    data: [
      { key: 'root', label: '青禾科技', children: [{ key: 'sales', label: '销售部' }, { key: 'supply', label: '供应链部' }] }
    ]
  },
  ITreeSelect: {
    data: [
      { key: 'root', label: '青禾科技', children: [{ key: 'sales', label: '销售部' }, { key: 'supply', label: '供应链部' }] }
    ]
  },
  IVirtualList: {
    items: Array.from({ length: 200 }, (_, i) => ({ id: i + 1, name: `工单 ${String(i + 1).padStart(4, '0')}` }))
  },
  IWatermark: { text: ['青禾科技', '仅供内部查阅'] }
}
