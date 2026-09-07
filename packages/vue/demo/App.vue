<script setup lang="ts">
import { ref } from 'vue'
import {
  IAlert, IAvatar, IAvatarGroup, IBadge, IBreadcrumb, IButton, ICard, ICheckbox,
  ICheckboxGroup, ICollapse, IDatePicker, IDescriptions, IDivider, IDrawer, IEmpty,
  IIcon, IInput, ILoading, IModal, IPagination, IPopconfirm, IRadio, IRadioGroup,
  IResult, ISelect, ISkeleton, ISteps, ISwitch, ITable, ITabs, ITag, ITextarea,
  ITooltip, IUpload, message
} from '../src'

/** 与 Vue 3 / React 端相同的用例，用于三端逐项比对 */
const text = ref('')
const area = ref('复现步骤：1. 打开工作项列表')
const on = ref(true)
const page = ref(12)
const tab = ref('overview')
const sel = ref<string | number | null>('requirement')
const date = ref<string | null>('2026-09-07')
const radio = ref('week')
const checks = ref<(string | number)[]>(['bug'])
const collapse = ref<string[]>(['what'])
const modal = ref(false)
const drawer = ref(false)
const loading = ref(true)
const files = ref<any[]>([])

const rows = [
  { id: 'WI-1024', title: '登录页支持短信验证码', owner: '林岚', points: 5 },
  { id: 'WI-1031', title: '工作项列表虚拟滚动', owner: '陈序', points: 8 },
  { id: 'WI-1042', title: '深色模式对比度校准', owner: '苏禾', points: 3 }
]
const columns = [
  { key: 'id', title: '编号', width: '110px' },
  { key: 'title', title: '标题', sortable: true },
  { key: 'points', title: '故事点', width: '90px', align: 'right' as const, sortable: true }
]
</script>

<template>
  <div style="padding: 32px; display: grid; gap: 28px; max-width: 760px">
    <section data-probe="button" style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
      <IButton variant="primary">主按钮</IButton>
      <IButton>次按钮</IButton>
      <IButton variant="danger">删除</IButton>
      <IButton variant="primary" loading>提交中</IButton>
      <ITag type="brand">需求</ITag>
      <IIcon name="sparkle" :size="20" />
      <IBadge :count="5"><IButton>消息</IButton></IBadge>
      <IAvatar name="林岚" />
      <IAvatar name="Susan Wong" />
      <IAvatarGroup :max="3" :total="8">
        <IAvatar name="林岚" /><IAvatar name="陈序" /><IAvatar name="苏禾" />
      </IAvatarGroup>
    </section>

    <section data-probe="input" style="display: flex; gap: 12px; flex-wrap: wrap">
      <div style="width: 220px"><IInput v-model="text" placeholder="标题" /></div>
      <div style="width: 220px">
        <ISelect
          v-model="sel"
          clearable
          :options="[
            { label: '需求', value: 'requirement' },
            { label: '缺陷', value: 'bug' },
            { label: '风险（禁用）', value: 'risk', disabled: true }
          ]"
        />
      </div>
      <div style="width: 220px"><IDatePicker v-model="date" clearable /></div>
      <div style="width: 320px"><ITextarea v-model="area" :maxlength="120" show-count :rows="3" /></div>
    </section>

    <section data-probe="choice" style="display: flex; gap: 20px; flex-wrap: wrap; align-items: center">
      <IRadioGroup v-model="radio" variant="button">
        <IRadio value="day">今日</IRadio><IRadio value="week">本周</IRadio>
        <IRadio value="month" disabled>本月</IRadio>
      </IRadioGroup>
      <ICheckboxGroup v-model="checks" :max="2">
        <ICheckbox value="bug">缺陷</ICheckbox><ICheckbox value="req">需求</ICheckbox>
        <ICheckbox value="task">任务</ICheckbox>
      </ICheckboxGroup>
      <ISwitch v-model="on" />
    </section>

    <IBreadcrumb :items="[{ label: '首页', to: '#' }, { label: '组件', to: '#' }, { label: '当前' }]" />
    <ISteps :current="1" :items="[{ title: '基本信息' }, { title: '关联迭代' }, { title: '确认' }]" />
    <ITabs
      v-model="tab"
      :items="[
        { name: 'overview', label: '概览' },
        { name: 'members', label: '成员' },
        { name: 'audit', label: '审计', disabled: true }
      ]"
    >
      <template #overview>概览内容</template>
      <template #members>成员内容</template>
    </ITabs>
    <IPagination v-model="page" :total="1000" />
    <ITable row-key="id" :data="rows" :columns="columns" />
    <IDescriptions
      title="工作项详情"
      :column="2"
      :items="[
        { label: '编号', value: 'WI-1024' },
        { label: '负责人', value: '林岚' },
        { label: '预计完成', value: '' },
        { label: '描述', value: '支持短信验证码', span: 2 }
      ]"
    />
    <ICollapse
      v-model="collapse"
      :items="[
        { name: 'what', title: '什么是设计令牌？', content: '设计与代码之间唯一的契约。' },
        { name: 'why', title: '为什么不写死色值？', content: '换肤只需覆盖语义层。' }
      ]"
    />

    <section data-probe="overlay" style="display: flex; gap: 12px; flex-wrap: wrap">
      <IButton @click="modal = true">打开对话框</IButton>
      <IButton @click="drawer = true">打开抽屉</IButton>
      <IPopconfirm title="确认归档？" @confirm="message.success('已归档')">
        <IButton>归档</IButton>
      </IPopconfirm>
      <ITooltip content="补充说明"><IButton>悬浮提示</IButton></ITooltip>
      <IButton @click="message.info('这是一条全局提示')">全局提示</IButton>
    </section>

    <IAlert type="success" title="提交成功">已同步到看板。</IAlert>
    <section style="display: flex; gap: 16px; align-items: center">
      <ILoading size="md" text="加载中" />
      <IButton size="sm" @click="loading = !loading">切换骨架</IButton>
    </section>
    <div style="width: 320px">
      <ISkeleton :loading="loading" variant="avatar"><div>真实内容已加载</div></ISkeleton>
    </div>
    <IEmpty type="search" size="sm" />
    <IResult status="success" size="sm" title="操作成功"><IButton variant="primary">继续</IButton></IResult>

    <IDivider>卡片与上传</IDivider>
    <section style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
      <ICard title="迭代概览" hoverable>本迭代共 24 个工作项，已完成 18 个。</ICard>
      <ICard title="加载中"><ISkeleton variant="paragraph" :rows="3" /></ICard>
    </section>
    <div style="width: 420px">
      <IUpload v-model="files" accept=".png,.pdf" :max-size="5" />
    </div>

    <IModal v-model="modal" title="迭代说明">
      本迭代已冻结。
      <template #footer><IButton variant="primary" @click="modal = false">我知道了</IButton></template>
    </IModal>
    <IDrawer v-model="drawer" title="工作项详情">WI-1024 登录页支持短信验证码。</IDrawer>
  </div>
</template>
