import { useState } from 'react';
import {
  Alert, Avatar, Badge, Breadcrumb, Button, Card, Checkbox, Col, Collapse, ConfigProvider, Dialog,
  Divider, Drawer, Empty, FormItem, Input, message, Pagination, Progress, RadioGroup, Row, Select,
  Skeleton, Space, Spinner, Steps, Switch, Tabs, Tag, Textarea, Tooltip,
  type Density, type LocaleName, type ThemeMode,
} from '@i-design/react';

export function ReactApp({ mode, density, locale }: { mode: ThemeMode; density: Density; locale: LocaleName }) {
  const [open, setOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [tab, setTab] = useState('a');
  const [fruit, setFruit] = useState<string | null>('apple');
  const [plan, setPlan] = useState('pro');
  const [page, setPage] = useState(6);
  const [agreed, setAgreed] = useState(true);
  const [email, setEmail] = useState('');
  const invalid = email.length > 0 && !email.includes('@');

  return (
    <ConfigProvider mode={mode} density={density} locale={locale}>
      <div className="demo-block">
        <h3>Button</h3>
        <Space wrap>
          <Button status="brand">主要按钮</Button>
          <Button variant="outline">次要按钮</Button>
          <Button variant="soft" status="success">柔和</Button>
          <Button variant="text" status="danger">文字</Button>
          <Button status="brand" loading>加载中</Button>
          <Button disabled>禁用</Button>
        </Space>
      </div>

      <div className="demo-block">
        <h3>Form</h3>
        <FormItem label="邮箱" required error={invalid ? '请输入合法的邮箱地址' : undefined}>
          <Input value={email} clearable maxlength={40} showCount onChange={setEmail} status={invalid ? 'danger' : 'default'} />
        </FormItem>
        <Space>
          <Checkbox checked={agreed} onChange={setAgreed}>同意条款</Checkbox>
          <Switch defaultChecked label="订阅" />
        </Space>
      </div>

      <div className="demo-block">
        <h3>Tag / Tooltip / Overlay</h3>
        <Space wrap>
          <Tag status="brand">品牌</Tag>
          <Tag status="success">成功</Tag>
          <Tag status="danger" closable>可关闭</Tag>
          <Tooltip content="定位、翻转、边界收敛都来自 core 里同一个 computePosition">
            <Button variant="outline">悬停我</Button>
          </Tooltip>
          <Button onClick={() => setOpen(true)}>打开对话框</Button>
          <Button variant="soft" onClick={() => message.success('React 触发的全局提示')}>全局提示</Button>
        </Space>
      </div>

      <div className="demo-block">
        <h3>Feedback</h3>
        <Space direction="vertical" gap="m">
          <Alert status="success" title="部署成功" closable>构建产物已发布到生产环境。</Alert>
          <Alert status="danger" variant="outline">磁盘空间不足，无法继续写入。</Alert>
          <Progress value={68} status="brand" />
          <Space>
            <Spinner />
            <Skeleton rows={2} />
          </Space>
        </Space>
      </div>

      <div className="demo-block">
        <h3>Data entry</h3>
        <Space direction="vertical" gap="m">
          <RadioGroup
            variant="button"
            value={plan}
            options={[{ value: 'free', label: '免费版' }, { value: 'pro', label: '专业版' }, { value: 'ent', label: '企业版', disabled: true }]}
            onChange={setPlan}
          />
          <Select
            clearable
            value={fruit}
            options={[{ value: 'apple', label: '苹果' }, { value: 'banana', label: '香蕉' }, { value: 'cherry', label: '樱桃', disabled: true }]}
            onChange={setFruit}
          />
          <Textarea autosize maxlength={120} showCount placeholder="试试输入多行，高度会自动增长" />
        </Space>
      </div>

      <div className="demo-block">
        <h3>Navigation</h3>
        <Breadcrumb items={[{ label: '首页', href: '#' }, { label: '组件', href: '#' }, { label: '导航' }]} />
        <Divider />
        <Tabs variant="segment" value={tab} onChange={setTab} items={[{ value: 'a', label: '概览' }, { value: 'b', label: '详情' }, { value: 'c', label: '禁用', disabled: true }]}>
          {(item) => <span>面板：{item.label}（← → 方向键可切换）</span>}
        </Tabs>
        <Divider />
        <Steps current={1} items={[{ title: '填写信息' }, { title: '确认订单' }, { title: '完成' }]} />
        <Divider />
        <Collapse accordion defaultValue={['q1']} items={[{ value: 'q1', header: '如何换肤？' }, { value: 'q2', header: '如何按需引入？' }]}>
          {(item) => (item.value === 'q1' ? '给 ConfigProvider 传 tokens 即可，运行时生效。' : '样式与逻辑分包，后续提供 unplugin 自动引入。')}
        </Collapse>
        <Divider />
        <Pagination current={page} total={200} onChange={setPage} />
      </div>

      <div className="demo-block">
        <h3>Layout & data display</h3>
        <Row gutter={[12, 12]}>
          <Col span={12} md={8}>
            <Card title="用户" extra={<Tag status="brand">VIP</Tag>} hoverable>
              <Space>
                <Badge count={12}><Avatar name="Ada Lovelace" /></Badge>
                <span>Ada Lovelace</span>
              </Space>
            </Card>
          </Col>
          <Col span={12} md={8}>
            <Card title="空状态"><Empty /></Card>
          </Col>
          <Col span={24} md={8}>
            <Card title="抽屉">
              <Button variant="outline" onClick={() => setDrawer(true)}>打开抽屉</Button>
            </Card>
          </Col>
        </Row>
      </div>

      <Drawer open={drawer} title="设置" onClose={() => setDrawer(false)}>
        抽屉复用了对话框的焦点锁与 Esc 行为，只是换了进场方向；RTL 下会自动从另一侧滑入。
      </Drawer>

      <Dialog
        open={open}
        title="删除文件？"
        onClose={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          message.success('已删除');
        }}
      >
        该操作不可撤销。焦点被锁在对话框内，Esc 可以关闭。
      </Dialog>
    </ConfigProvider>
  );
}
