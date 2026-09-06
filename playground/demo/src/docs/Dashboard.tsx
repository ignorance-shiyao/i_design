import { useMemo, useState } from 'react';
import {
  Avatar, Badge, Breadcrumb, Button, Card, DatePicker, Descriptions, Drawer, Dropdown, Icon,
  Input, Layout, LayoutContent, LayoutHeader, LayoutSider, Menu, Pagination, Popconfirm,
  Segmented, Select, Space, Statistic, Table, Tag, Timeline, Tooltip, message, notification,
  type TableSort,
} from '@i-design/react';
import { Sparkline, TrafficChart } from './Charts.js';

interface Order {
  id: string;
  customer: string;
  channel: string;
  amount: number;
  status: '已完成' | '处理中' | '已取消';
  date: string;
}

const CHANNELS = ['自然搜索', '直接访问', '推荐链接'];
const STATUSES = ['已完成', '处理中', '已取消'] as const;
const NAMES = ['张三', '李四', 'Ada Lovelace', 'Alan Turing', '王五', 'Grace Hopper', '赵六', 'Linus'];

const ORDERS: Order[] = Array.from({ length: 46 }, (_, index) => ({
  id: `o-${20260906 - index}`,
  customer: NAMES[index % NAMES.length]!,
  channel: CHANNELS[index % CHANNELS.length]!,
  amount: 320 + ((index * 977) % 9200),
  status: STATUSES[index % 3]!,
  date: `2026-09-${String(28 - (index % 28)).padStart(2, '0')}`,
}));

const TONE: Record<string, 'success' | 'warning' | 'danger'> = {
  已完成: 'success', 处理中: 'warning', 已取消: 'danger',
};

const STATS = [
  { label: '本月成交额', value: 1284500, prefix: '¥', trend: 'up' as const, delta: '+12.4%', spark: [42, 48, 44, 56, 61, 58, 72] },
  { label: '订单数', value: 3482, trend: 'up' as const, delta: '+4.1%', spark: [30, 32, 31, 38, 36, 41, 44] },
  { label: '转化率', value: 3.48, suffix: '%', precision: 2, trend: 'down' as const, delta: '−0.6%', spark: [4.1, 4.0, 3.9, 3.7, 3.6, 3.5, 3.48] },
  { label: '退款率', value: 0.42, suffix: '%', precision: 2, trend: 'flat' as const, delta: '持平', spark: [0.45, 0.4, 0.44, 0.41, 0.43, 0.42, 0.42] },
];

/**
 * A console built the way a real one is — filters above a table, a detail drawer,
 * destructive actions behind a confirm. It exists to show the components under
 * load rather than one at a time.
 */
export function Dashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [nav, setNav] = useState('orders');
  const [keyword, setKeyword] = useState('');
  const [channel, setChannel] = useState<string | null>(null);
  const [status, setStatus] = useState('全部');
  const [since, setSince] = useState<Date | null>(null);
  const [sort, setSort] = useState<TableSort | null>({ key: 'amount', order: 'desc' });
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Order | null>(null);
  const pageSize = 6;

  const filtered = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    return ORDERS.filter((order) => {
      if (needle && !order.customer.toLowerCase().includes(needle) && !order.id.includes(needle)) return false;
      if (channel && order.channel !== channel) return false;
      if (status !== '全部' && order.status !== status) return false;
      if (since && new Date(order.date) < since) return false;
      return true;
    });
  }, [keyword, channel, status, since]);

  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const reset = (): void => {
    setKeyword('');
    setChannel(null);
    setStatus('全部');
    setSince(null);
    setPage(1);
  };

  return (
    <div className="console">
      <Layout style={{ height: '100%' }}>
        <LayoutHeader>
          <Button size="s" variant="text" aria-label="切换侧栏" onClick={() => setCollapsed((value) => !value)}>
            <Icon name="menu" size={16} />
          </Button>
          <span className="console__brand">
            <span className="console__mark">i</span>
            商家控制台
          </span>
          <span className="console__spacer" />
          <Space gap="s">
            <Tooltip content="搜索 ⌘K">
              <Button size="s" variant="text" aria-label="搜索"><Icon name="search" size={16} /></Button>
            </Tooltip>
            <Badge count={3}>
              <Button size="s" variant="text" aria-label="通知" onClick={() => notification.info('有 3 条待处理工单', '最早一条已等待 2 小时。')}>
                <Icon name="info-circle" size={16} />
              </Button>
            </Badge>
            <Dropdown
              items={[
                { value: 'profile', label: '个人资料' },
                { value: 'team', label: '团队设置' },
                { value: 'logout', label: '退出登录', danger: true, divided: true },
              ]}
              onSelect={(value) => message.info(`菜单：${value}`)}
            >
              <button className="console__user">
                <Avatar name="Ada Lovelace" size="s" />
                <Icon name="chevron-down" size={13} />
              </button>
            </Dropdown>
          </Space>
        </LayoutHeader>

        <Layout direction="row" style={{ flex: 1, minHeight: 0 }}>
          <LayoutSider collapsed={collapsed} width={188}>
            <Menu
              value={nav}
              onSelect={setNav}
              collapsed={collapsed}
              defaultExpanded={['content']}
              items={[
                { value: 'overview', label: '概览' },
                { value: 'orders', label: '订单管理' },
                { value: 'content', label: '商品', children: [{ value: 'goods', label: '商品列表' }, { value: 'stock', label: '库存' }] },
                { value: 'settings', label: '设置' },
              ]}
            />
          </LayoutSider>

          <LayoutContent>
            <Breadcrumb items={[{ label: '首页', href: '#' }, { label: '交易' }, { label: '订单管理' }]} />

            <div className="console__stats">
              {STATS.map((stat) => (
                <Card key={stat.label} bordered>
                  <div className="console__stat">
                    <Statistic
                      label={stat.label}
                      value={stat.value}
                      precision={stat.precision}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                    />
                    <Sparkline points={stat.spark} />
                  </div>
                  <div className="console__delta">
                    <Tag size="s" status={stat.trend === 'up' ? 'success' : stat.trend === 'down' ? 'danger' : 'default'}>
                      {stat.delta}
                    </Tag>
                    <span>较上月</span>
                  </div>
                </Card>
              ))}
            </div>

            <Card bordered padding="l" className="console__chart">
              <TrafficChart />
            </Card>

            <Card bordered padding="l">
              <div className="console__filters">
                <Input
                  size="s"
                  value={keyword}
                  onChange={(value) => { setKeyword(value); setPage(1); }}
                  clearable
                  placeholder="搜索订单号或客户"
                  prefix={<Icon name="search" size={14} />}
                />
                <Select
                  size="s"
                  clearable
                  value={channel}
                  placeholder="全部渠道"
                  onChange={(value) => { setChannel(value); setPage(1); }}
                  options={CHANNELS.map((item) => ({ value: item, label: item }))}
                />
                <DatePicker size="s" clearable value={since} onChange={(value) => { setSince(value); setPage(1); }} placeholder="起始日期" />
                <Segmented
                  size="s"
                  value={status}
                  onChange={(value) => { setStatus(value); setPage(1); }}
                  options={[{ value: '全部' }, ...STATUSES.map((item) => ({ value: item }))]}
                />
                <Space gap="s">
                  <Button size="s" variant="outline" onClick={reset}>重置</Button>
                  <Button size="s" status="brand" onClick={() => message.success(`筛选出 ${filtered.length} 条`)}>查询</Button>
                </Space>
              </div>

              {selected.length > 0 && (
                <div className="console__bulk">
                  <span>已选 {selected.length} 项</span>
                  <Space gap="s">
                    <Button size="s" variant="text" onClick={() => setSelected([])}>取消选择</Button>
                    <Popconfirm
                      status="danger"
                      title={`确定删除选中的 ${selected.length} 条订单？该操作不可撤销。`}
                      onConfirm={() => { message.success('已删除'); setSelected([]); }}
                    >
                      <Button size="s" variant="soft" status="danger">批量删除</Button>
                    </Popconfirm>
                  </Space>
                </div>
              )}

              <Table
                striped
                stickyHeader
                selection="multiple"
                sort={sort}
                selectedKeys={selected}
                onSortChange={setSort}
                onSelectionChange={setSelected}
                rowKey={(row) => String(row.id)}
                columns={[
                  { key: 'id', title: '订单号', width: 130 },
                  { key: 'customer', title: '客户', sortable: true },
                  { key: 'channel', title: '来源', sortable: true },
                  { key: 'amount', title: '金额', sortable: true, align: 'end' },
                  { key: 'status', title: '状态', width: 96 },
                  { key: 'date', title: '日期', width: 110 },
                  { key: 'actions', title: '操作', width: 110 },
                ]}
                data={pageRows as unknown as Record<string, unknown>[]}
                empty={<div style={{ padding: 32, textAlign: 'center', color: 'var(--i-color-text-tertiary)' }}>没有符合条件的订单</div>}
                renderCell={(column, row) =>
                  column.key === 'amount' ? `¥${(row.amount as number).toLocaleString()}`
                  : column.key === 'status' ? <Tag size="s" status={TONE[row.status as string]}>{row.status as string}</Tag>
                  : column.key === 'actions' ? (
                    <Space gap="s">
                      <Button size="s" variant="text" onClick={() => setDetail(row as unknown as Order)}>详情</Button>
                      <Popconfirm title="确定取消这笔订单？" onConfirm={() => message.success('已取消')}>
                        <Button size="s" variant="text" status="danger">取消</Button>
                      </Popconfirm>
                    </Space>
                  ) : undefined
                }
              />

              <div className="console__pager">
                <span>共 {filtered.length} 条</span>
                <Pagination current={page} total={filtered.length} pageSize={pageSize} onChange={setPage} size="s" />
              </div>
            </Card>
          </LayoutContent>
        </Layout>
      </Layout>

      <Drawer open={detail !== null} title={`订单 ${detail?.id ?? ''}`} size="420px" onClose={() => setDetail(null)}>
        {detail && (
          <Space direction="vertical" gap="l">
            <Descriptions
              columns={1}
              items={[
                { label: '客户', value: detail.customer },
                { label: '来源', value: detail.channel },
                { label: '金额', value: `¥${detail.amount.toLocaleString()}` },
                { label: '状态', value: detail.status },
                { label: '下单日期', value: detail.date },
              ]}
            />
            <div>
              <div style={{ marginBlockEnd: 12, color: 'var(--i-color-text-tertiary)', fontSize: 12 }}>处理进度</div>
              <Timeline
                items={[
                  { key: '1', title: '创建订单', time: `${detail.date} 10:02`, status: 'success' },
                  { key: '2', title: '支付成功', time: `${detail.date} 10:05`, status: 'success' },
                  { key: '3', title: '仓库出库', time: `${detail.date} 14:20`, status: detail.status === '已完成' ? 'success' : 'process' },
                  { key: '4', title: '已签收', status: detail.status === '已完成' ? 'success' : 'default' },
                ]}
              />
            </div>
          </Space>
        )}
      </Drawer>
    </div>
  );
}
