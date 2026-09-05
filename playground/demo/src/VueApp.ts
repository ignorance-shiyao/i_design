import { defineComponent, h, ref, type PropType } from 'vue';
import {
  Alert, Avatar, Badge, Breadcrumb, Button, Card, Checkbox, Col, Collapse, ConfigProvider, Dialog,
  Divider, Drawer, Empty, FormItem, Input, message, Pagination, Progress, RadioGroup, Row, Select,
  Skeleton, Space, Spinner, Steps, Switch, Tabs, Tag, Textarea, Tooltip,
  type Density, type LocaleName, type ThemeMode,
} from '@i-design/vue';

const block = (title: string, children: unknown[]) =>
  h('div', { class: 'demo-block' }, [h('h3', title), ...(children as never[])]);

export const VueApp = defineComponent({
  name: 'VueDemo',
  props: {
    mode: { type: String as PropType<ThemeMode>, required: true },
    density: { type: String as PropType<Density>, required: true },
    locale: { type: String as PropType<LocaleName>, required: true },
  },
  setup(props) {
    const open = ref(false);
    const drawer = ref(false);
    const tab = ref('a');
    const fruit = ref<string | null>('apple');
    const plan = ref('pro');
    const page = ref(6);
    const agreed = ref(true);
    const email = ref('');
    const invalid = () => email.value.length > 0 && !email.value.includes('@');

    return () =>
      h(ConfigProvider, { mode: props.mode, density: props.density, locale: props.locale }, () => [
        block('Button', [
          h(Space, { wrap: true }, () => [
            h(Button, { status: 'brand' }, () => '主要按钮'),
            h(Button, { variant: 'outline' }, () => '次要按钮'),
            h(Button, { variant: 'soft', status: 'success' }, () => '柔和'),
            h(Button, { variant: 'text', status: 'danger' }, () => '文字'),
            h(Button, { status: 'brand', loading: true }, () => '加载中'),
            h(Button, { disabled: true }, () => '禁用'),
          ]),
        ]),

        block('Form', [
          h(
            FormItem,
            { label: '邮箱', required: true, error: invalid() ? '请输入合法的邮箱地址' : undefined },
            () => [
              h(Input, {
                modelValue: email.value,
                clearable: true,
                maxlength: 40,
                showCount: true,
                status: invalid() ? 'danger' : 'default',
                'onUpdate:modelValue': (v: string) => (email.value = v),
              }),
            ],
          ),
          h(Space, null, () => [
            h(Checkbox, { modelValue: agreed.value, 'onUpdate:modelValue': (v: boolean) => (agreed.value = v) }, () => '同意条款'),
            h(Switch, { defaultChecked: true }, () => '订阅'),
          ]),
        ]),

        block('Tag / Tooltip / Overlay', [
          h(Space, { wrap: true }, () => [
            h(Tag, { status: 'brand' }, () => '品牌'),
            h(Tag, { status: 'success' }, () => '成功'),
            h(Tag, { status: 'danger', closable: true }, () => '可关闭'),
            h(Tooltip, { content: '定位、翻转、边界收敛都来自 core 里同一个 computePosition' }, {
              default: () => h(Button, { variant: 'outline' }, () => '悬停我'),
            }),
            h(Button, { onClick: () => (open.value = true) }, () => '打开对话框'),
            h(Button, { variant: 'soft', onClick: () => message.success('Vue 触发的全局提示') }, () => '全局提示'),
          ]),
        ]),

        block('Feedback', [
          h(Space, { direction: 'vertical', gap: 'm' }, () => [
            h(Alert, { status: 'success', title: '部署成功', closable: true }, () => '构建产物已发布到生产环境。'),
            h(Alert, { status: 'danger', variant: 'outline' }, () => '磁盘空间不足，无法继续写入。'),
            h(Progress, { value: 68, status: 'brand' }),
            h(Space, null, () => [h(Spinner), h(Skeleton, { rows: 2 })]),
          ]),
        ]),

        block('Data entry', [
          h(Space, { direction: 'vertical', gap: 'm' }, () => [
            h(RadioGroup, {
              variant: 'button',
              modelValue: plan.value,
              options: [
                { value: 'free', label: '免费版' },
                { value: 'pro', label: '专业版' },
                { value: 'ent', label: '企业版', disabled: true },
              ],
              'onUpdate:modelValue': (v: string) => (plan.value = v),
            }),
            h(Select, {
              clearable: true,
              modelValue: fruit.value,
              options: [
                { value: 'apple', label: '苹果' },
                { value: 'banana', label: '香蕉' },
                { value: 'cherry', label: '樱桃', disabled: true },
              ],
              'onUpdate:modelValue': (v: string | null) => (fruit.value = v),
            }),
            h(Textarea, { autosize: true, maxlength: 120, showCount: true, placeholder: '试试输入多行，高度会自动增长' }),
          ]),
        ]),

        block('Navigation', [
          h(Breadcrumb, { items: [{ label: '首页', href: '#' }, { label: '组件', href: '#' }, { label: '导航' }] }),
          h(Divider),
          h(
            Tabs,
            {
              variant: 'segment',
              modelValue: tab.value,
              items: [
                { value: 'a', label: '概览' },
                { value: 'b', label: '详情' },
                { value: 'c', label: '禁用', disabled: true },
              ],
              'onUpdate:modelValue': (v: string) => (tab.value = v),
            },
            { default: (item: { label?: string }) => h('span', `面板：${item?.label ?? ''}（← → 方向键可切换）`) },
          ),
          h(Divider),
          h(Steps, { current: 1, items: [{ title: '填写信息' }, { title: '确认订单' }, { title: '完成' }] }),
          h(Divider),
          h(
            Collapse,
            { accordion: true, defaultValue: ['q1'], items: [{ value: 'q1', header: '如何换肤？' }, { value: 'q2', header: '如何按需引入？' }] },
            {
              default: (item: { value?: string }) =>
                item?.value === 'q1'
                  ? '给 ConfigProvider 传 tokens 即可，运行时生效。'
                  : '样式与逻辑分包，后续提供 unplugin 自动引入。',
            },
          ),
          h(Divider),
          h(Pagination, { modelValue: page.value, total: 200, 'onUpdate:modelValue': (v: number) => (page.value = v) }),
        ]),

        block('Layout & data display', [
          h(Row, { gutter: [12, 12] }, () => [
            h(Col, { span: 12, md: 8 }, () => [
              h(Card, { title: '用户', hoverable: true }, {
                extra: () => h(Tag, { status: 'brand' }, () => 'VIP'),
                default: () =>
                  h(Space, null, () => [
                    h(Badge, { count: 12 }, () => h(Avatar, { name: 'Ada Lovelace' })),
                    h('span', 'Ada Lovelace'),
                  ]),
              }),
            ]),
            h(Col, { span: 12, md: 8 }, () => [h(Card, { title: '空状态' }, () => h(Empty))]),
            h(Col, { span: 24, md: 8 }, () => [
              h(Card, { title: '抽屉' }, () => h(Button, { variant: 'outline', onClick: () => (drawer.value = true) }, () => '打开抽屉')),
            ]),
          ]),
        ]),

        h(
          Drawer,
          {
            modelValue: drawer.value,
            title: '设置',
            'onUpdate:modelValue': (v: boolean) => (drawer.value = v),
          },
          () => '抽屉复用了对话框的焦点锁与 Esc 行为，只是换了进场方向；RTL 下会自动从另一侧滑入。',
        ),

        h(
          Dialog,
          {
            modelValue: open.value,
            title: '删除文件？',
            'onUpdate:modelValue': (v: boolean) => (open.value = v),
            onConfirm: () => {
              open.value = false;
              message.success('已删除');
            },
          },
          () => '该操作不可撤销。焦点被锁在对话框内，Esc 可以关闭。',
        ),
      ]);
  },
});
