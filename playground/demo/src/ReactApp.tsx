import { useState } from 'react';
import {
  Button, Checkbox, ConfigProvider, Dialog, FormItem, Input, message, Space, Switch, Tag, Tooltip,
  type Density, type LocaleName, type ThemeMode,
} from '@i-design/react';

export function ReactApp({ mode, density, locale }: { mode: ThemeMode; density: Density; locale: LocaleName }) {
  const [open, setOpen] = useState(false);
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
