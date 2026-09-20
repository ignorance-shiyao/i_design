<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import IButton from '@/components/IButton.vue'
import IInput from '@/components/IInput.vue'
import ISelect from '@/components/ISelect.vue'
import ICheckbox from '@/components/ICheckbox.vue'
import IFormPage from '@/components/IFormPage.vue'
import ITag from '@/components/ITag.vue'
import {
  ACCESS_ROLES, ACCESS_SECTIONS, AccessError, accessActor, accessCan, accessDirectory,
  accessLogin, accessRolePermissions, accessSections, applyAccess, createAccessDemo,
  type AccessCommand, type AccessRole, type AccessSection, type AccessSession
} from '@i-design/common/logic/access-pattern'

const state = ref(createAccessDemo())
const session = ref<AccessSession | null>(null)
const account = ref('admin')
const section = ref<AccessSection>('profile')
const message = ref('')
const failed = ref(false)
const actor = computed(() => accessActor(state.value, session.value))
const sections = computed(() => accessSections(state.value, session.value))
const canManage = computed(() => accessCan(state.value, session.value, 'manage'))
const directory = computed(() => accessDirectory(state.value, session.value))
const accountOptions = computed(() => state.value.users.map(user => ({ value: user.id,
  label: `${user.name} · ${ACCESS_ROLES[user.role]}${user.enabled ? '' : ' · 已停用'}` })))
const roleOptions = Object.entries(ACCESS_ROLES).map(([value, label]) => ({ value, label }))
const orgOptions = computed(() => state.value.organizations.map(org => ({ value: org.id, label: org.name })))
const permissionLabels = { directory: '查看用户与组织', contact: '查看联系邮箱', manage: '修改用户与组织' }
const organizationName = (id: string) => state.value.organizations.find(org => org.id === id)?.name ?? '未分配'

type Editor = { kind: 'profile' | 'user' | 'organization' | 'organization.create'; id: string; revision: number; title: string }
const editor = ref<Editor | null>(null)
const values = ref<Record<string, unknown>>({})
const initial = ref<Record<string, unknown>>({})
function feedback(text: string, error = false) { message.value = text; failed.value = error }
function login() {
  try { session.value = accessLogin(state.value, account.value); section.value = 'profile'; feedback('已进入模拟工作区') }
  catch (error) { feedback((error as Error).message, true) }
}
function logout() { session.value = null; feedback('已退出，示例数据保留到本次页面关闭') }
function openEditor(next: Editor, fields: Record<string, unknown>) {
  editor.value = next; values.value = { ...fields }; initial.value = { ...fields }; feedback('')
}
function editProfile() {
  const user = actor.value!
  openEditor({ kind: 'profile', id: user.id, revision: user.revision, title: '编辑个人设置' }, { name: user.name, notifications: user.notifications })
}
function editUser(id: string) {
  // 投影不含主管不可读的联系字段；写入时再次由 common 授权。
  const user = directory.value.find(item => item.id === id)!
  openEditor({ kind: 'user', id, revision: user.revision, title: `管理 ${user.name}` }, {
    role: user.role, organizationId: user.organizationId, enabled: user.enabled
  })
}
function editOrganization(id?: string) {
  const org = state.value.organizations.find(item => item.id === id)
  openEditor({ kind: org ? 'organization' : 'organization.create', id: org?.id ?? '', revision: org?.revision ?? 0,
    title: org ? `编辑 ${org.name}` : '新建组织' }, { name: org?.name ?? '' })
}
function save() {
  const edit = editor.value!
  let command: AccessCommand
  if (edit.kind === 'profile') command = { kind: 'profile', revision: edit.revision, name: String(values.value.name ?? ''), notifications: values.value.notifications === true }
  else if (edit.kind === 'user') command = { kind: 'user', id: edit.id, revision: edit.revision, role: values.value.role as AccessRole, organizationId: String(values.value.organizationId ?? ''), enabled: values.value.enabled === true }
  else if (edit.kind === 'organization') command = { kind: 'organization', id: edit.id, revision: edit.revision, name: String(values.value.name ?? '') }
  else command = { kind: 'organization.create', name: String(values.value.name ?? '') }
  try {
    state.value = applyAccess(state.value, session.value, command)
    editor.value = null
    feedback('已保存，权限和组织信息已同步更新')
  } catch (error) {
    feedback(error instanceof AccessError ? `${error.code} · ${error.message}` : '保存失败，请重试', true)
  }
}
watch(sections, allowed => {
  if (!allowed.includes(section.value)) section.value = 'profile'
  if (!allowed.length) { session.value = null; editor.value = null }
})
</script>

<template>
  <article class="access-page">
    <h1>账号与权限</h1>
    <p class="i-lead">登录进入工作区，个人偏好归自己管理，用户和组织的变更归管理员处理。切换示例账号，查看同一份数据在不同权限下的菜单、字段与操作。</p>
    <p>此处为模拟登录，不采集密码，不连接真实账号。刷新页面会还原示例数据。实际应用必须由服务端验证身份和每次操作的权限。</p>

    <section class="access-demo" aria-label="账号与权限示例">
      <div v-if="!actor" class="access-login">
        <h2>进入模拟工作区</h2>
        <p>选择一个示例账号。停用的账号保留在列表中，可验证拒绝登录的反馈。</p>
        <ISelect :model-value="account" :options="accountOptions" aria-label="示例账号" @update:model-value="account = String($event)" />
        <IButton variant="primary" @click="login">模拟登录</IButton>
      </div>
      <template v-else>
        <header class="access-toolbar">
          <div><strong>{{ actor.name }}</strong> <ITag>{{ ACCESS_ROLES[actor.role] }}</ITag></div>
          <IButton :disabled="!!editor" @click="logout">退出登录</IButton>
        </header>
        <p v-if="editor">编辑中，请先保存或取消，再切换页面或退出。</p>
        <nav v-else class="access-nav" aria-label="工作区菜单">
          <IButton v-for="item in sections" :key="item" :variant="section === item ? 'primary' : 'secondary'"
            :aria-current="section === item ? 'page' : undefined" @click="section = item; feedback('')">{{ ACCESS_SECTIONS[item] }}</IButton>
        </nav>

        <IFormPage v-if="editor" v-model="values" :initial="initial" :title="editor.title" submit-text="保存" @submit="save" @cancel="editor = null; feedback('已取消编辑')">
          <div class="access-fields">
            <template v-if="editor.kind === 'user'">
              <ISelect :model-value="String(values.role)" :options="roleOptions" aria-label="用户角色" @update:model-value="values = { ...values, role: $event }" />
              <ISelect :model-value="String(values.organizationId)" :options="orgOptions" aria-label="所属组织" @update:model-value="values = { ...values, organizationId: $event }" />
              <ICheckbox :model-value="values.enabled === true" @update:model-value="values = { ...values, enabled: $event }">账号启用</ICheckbox>
              <p>权限变更立即影响该账号的工作区。至少保留一名启用的管理员。</p>
            </template>
            <template v-else>
              <label for="access-name">{{ editor.kind === 'profile' ? '显示名称' : '组织名称' }}</label>
              <IInput id="access-name" :model-value="String(values.name ?? '')" @update:model-value="values = { ...values, name: $event }" />
              <ICheckbox v-if="editor.kind === 'profile'" :model-value="values.notifications === true" @update:model-value="values = { ...values, notifications: $event }">接收工作通知</ICheckbox>
            </template>
          </div>
        </IFormPage>

        <section v-else-if="section === 'profile'" class="access-card" aria-label="个人设置">
          <h2>个人设置</h2>
          <dl><dt>显示名称</dt><dd>{{ actor.name }}</dd><dt>所属组织</dt><dd>{{ organizationName(actor.organizationId) }}</dd>
            <dt>工作通知</dt><dd>{{ actor.notifications ? '已开启' : '已关闭' }}</dd></dl>
          <IButton @click="editProfile">编辑个人设置</IButton>
        </section>

        <section v-else-if="section === 'users'" aria-label="用户管理">
          <h2>用户管理</h2>
          <p v-if="!canManage">当前可查看用户与所属组织。联系邮箱和管理操作仅向管理员开放。</p>
          <div class="access-cards">
            <section v-for="user in directory" :key="user.id" class="access-card" :aria-label="`用户 ${user.name}`">
              <h3>{{ user.name }}</h3><ITag>{{ user.enabled ? '已启用' : '已停用' }}</ITag>
              <dl><dt>角色</dt><dd>{{ ACCESS_ROLES[user.role] }}</dd><dt>组织</dt><dd>{{ organizationName(user.organizationId) }}</dd>
                <template v-if="user.email"><dt>联系邮箱</dt><dd>{{ user.email }}</dd></template></dl>
              <IButton :disabled="!canManage" :aria-label="`管理 ${user.name}`" @click="editUser(user.id)">管理</IButton>
              <p v-if="!canManage" class="access-hint">需要管理员权限</p>
            </section>
          </div>
        </section>

        <section v-else-if="section === 'roles'" aria-label="角色权限">
          <h2>角色权限</h2><p>角色采用固定权限组合。在用户管理中分配角色，变更后菜单、可读字段与动作同步更新。</p>
          <div class="access-cards">
            <section v-for="role in roleOptions" :key="role.value" class="access-card">
              <h3>{{ role.label }}</h3><ul><li>编辑本人设置</li>
                <li v-for="permission in accessRolePermissions(role.value as AccessRole)" :key="permission">{{ permissionLabels[permission] }}</li></ul>
            </section>
          </div>
        </section>

        <section v-else aria-label="组织管理">
          <h2>组织管理</h2>
          <IButton v-if="canManage" @click="editOrganization()">新建组织</IButton>
          <p v-else>当前为只读，组织变更需要管理员权限。</p>
          <div class="access-cards">
            <section v-for="org in state.organizations" :key="org.id" class="access-card" :aria-label="`组织 ${org.name}`">
              <h3>{{ org.name }}</h3><p>{{ directory.filter(user => user.organizationId === org.id).length }} 位成员（含停用账号）</p>
              <IButton :disabled="!canManage" :aria-label="`编辑组织 ${org.name}`" @click="editOrganization(org.id)">编辑名称</IButton>
            </section>
          </div>
        </section>
      </template>
      <p v-if="message" :role="failed ? 'alert' : 'status'" class="access-feedback">{{ message }}</p>
    </section>

    <h2>接入约定</h2>
    <p>登录后的角色来自服务端返回的当前身份。前端根据权限决定展示内容，提交时仍需服务端重新授权，并校验对象版本。权限下降后应清除不可读字段，账号停用后应结束会话。</p>
    <h2>什么时候不该用它</h2>
    <p>需要跨组织数据隔离、自定义角色、单点登录或多因素认证时，应先明确后端协议和会话策略。这份页面配方只演示固定角色与扁平组织，不承担生产认证。</p>
  </article>
</template>

<style scoped>
.access-page p { max-width: 45em; }
.access-demo { padding: var(--i-spacing-5); border: 1px solid var(--i-color-hairline); border-radius: var(--i-radius-lg); }
.access-login, .access-fields { display: flex; flex-direction: column; align-items: stretch; gap: var(--i-spacing-3); max-width: 28em; }
.access-toolbar, .access-nav { display: flex; align-items: center; flex-wrap: wrap; gap: var(--i-spacing-3); margin-bottom: var(--i-spacing-4); }
.access-toolbar { justify-content: space-between; }
.access-cards { columns: 20em; column-gap: var(--i-spacing-4); margin-top: var(--i-spacing-4); }
.access-card { break-inside: avoid; padding: var(--i-spacing-4); margin-bottom: var(--i-spacing-4); border: 1px solid var(--i-color-hairline); border-radius: var(--i-radius-md); background: var(--i-color-bg-elevated); }
.access-card h3 { margin-top: 0; }
.access-card dl { margin-block: var(--i-spacing-3); }
.access-card dt { color: var(--i-color-text-secondary); font-size: var(--i-font-size-sm); }
.access-card dd { margin: 0 0 var(--i-spacing-3); overflow-wrap: anywhere; }
.access-hint, .access-feedback { color: var(--i-color-text-secondary); }
.access-feedback { margin-top: var(--i-spacing-4); }
</style>
