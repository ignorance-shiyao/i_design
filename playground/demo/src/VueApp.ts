import { defineComponent, h, ref, type PropType } from 'vue';
import {
  Button, Checkbox, ConfigProvider, Dialog, FormItem, Input, message, Space, Switch, Tag, Tooltip,
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
