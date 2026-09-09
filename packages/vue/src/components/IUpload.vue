<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IUpload.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import IIcon from './IIcon.vue'
import IButton from './IButton.vue'
import { formatSize, matchAccept, nextUid, type UploadFile } from './upload'

const props = withDefaults(
  defineProps<{
    /** 已选文件列表，支持 v-model */
    value?: UploadFile[]
    accept?: string
    multiple?: boolean
    /** 单文件大小上限，单位 MB */
    maxSize?: number
    maxCount?: number
    disabled?: boolean
    /** 拖拽区 or 单按钮 */
    variant?: 'drag' | 'button'
    tip?: string
    /**
     * 自定义上传实现。返回 Promise，过程中调用 onProgress 汇报进度。
     * 不传时组件只把文件挂进列表并标记为 ready，由业务在提交时统一上传。
     */
    request?: (file: File, onProgress: (percent: number) => void) => Promise<unknown>
  }>(),
  {
    value: () => [],
    accept: '',
    multiple: true,
    maxSize: 0,
    maxCount: 0,
    disabled: false,
    variant: 'drag',
    tip: '',
    request: undefined
  }
)

const emit = defineEmits<{ (e: 'input', a0: UploadFile[]): void; (e: 'change', a0: UploadFile[]): void; (e: 'success', a0: UploadFile): void; (e: 'error', a0: UploadFile, a1: string): void; (e: 'reject', a0: File, a1: string): void }>()

const input = ref<HTMLInputElement | null>(null)
const dragging = ref(false)

/**
 * 最近一次派发出去的列表。
 *
 * 写操作必须基于它而不是回读 props：一次 tick 内连续更新时（例如新增文件后立即把状态
 * 置为 uploading），父组件还没来得及把新值传回来，回读 props 会拿到旧值并把前一次
 * 更新覆盖掉。渲染仍然读 props，保持组件的受控语义。
 */
const latest = ref<UploadFile[]>([...props.value])
watch(
  () => props.value,
  (value) => (latest.value = [...value])
)

const files = computed(() => props.value)
const reachedMax = computed(() => props.maxCount > 0 && latest.value.length >= props.maxCount)

function update(next: UploadFile[]) {
  latest.value = next
  emit('input', next)
  emit('change', next)
}

function patch(uid: string, changes: Partial<UploadFile>) {
  update(latest.value.map((f) => (f.uid === uid ? { ...f, ...changes } : f)))
}

/** 逐个校验后入列；被拒的文件通过 reject 事件抛出，不静默丢弃 */
function accepted(list: File[]) {
  const out: File[] = []
  for (const file of list) {
    if (props.maxCount > 0 && latest.value.length + out.length >= props.maxCount) {
      emit('reject', file, `最多只能上传 ${props.maxCount} 个文件`)
      continue
    }
    if (!matchAccept(file, props.accept)) {
      emit('reject', file, `不支持的文件类型，仅接受 ${props.accept}`)
      continue
    }
    if (props.maxSize > 0 && file.size > props.maxSize * 1024 * 1024) {
      emit('reject', file, `文件超过 ${props.maxSize} MB`)
      continue
    }
    out.push(file)
  }
  return out
}

async function start(item: UploadFile) {
  if (!props.request || !item.raw) return
  patch(item.uid, { status: 'uploading', percent: 0, error: undefined })
  try {
    const response = await props.request(item.raw, (percent) =>
      patch(item.uid, { percent: Math.min(100, Math.max(0, Math.round(percent))) })
    )
    patch(item.uid, { status: 'success', percent: 100, response })
    emit('success', { ...item, status: 'success', percent: 100, response })
  } catch (e) {
    const message = e instanceof Error ? e.message : '上传失败'
    patch(item.uid, { status: 'error', error: message })
    emit('error', { ...item, status: 'error', error: message }, message)
  }
}

function add(list: File[]) {
  const passed = accepted(list)
  if (!passed.length) return
  const items: UploadFile[] = passed.map((raw) => ({
    uid: nextUid(),
    name: raw.name,
    size: raw.size,
    status: props.request ? 'uploading' : 'ready',
    percent: 0,
    raw
  }))
  update([...latest.value, ...items])
  items.forEach(start)
}

function onPick(event: Event) {
  const target = event.target as HTMLInputElement
  add(Array.from(target.files ?? []))
  // 清空以便再次选择同一个文件时仍触发 change
  target.value = ''
}

function onDrop(event: DragEvent) {
  dragging.value = false
  if (props.disabled || reachedMax.value) return
  add(Array.from(event.dataTransfer?.files ?? []))
}

function openPicker() {
  if (props.disabled || reachedMax.value) return
  input.value?.click()
}

function remove(item: UploadFile) {
  update(latest.value.filter((f) => f.uid !== item.uid))
}

function retry(item: UploadFile) {
  start(item)
}

defineExpose({ openPicker })
</script>

<template>
  <div class="i-upload" :class="{ 'is-disabled': disabled }">
    <input
      ref="input"
      class="i-upload__input"
      type="file"
      :accept="accept || undefined"
      :multiple="multiple"
      :disabled="disabled"
      @change="onPick"
    />

    <div
      v-if="variant === 'drag'"
      class="i-upload__zone"
      :class="{ 'is-dragging': dragging, 'is-full': reachedMax }"
      role="button"
      :tabindex="disabled ? -1 : 0"
      @click="openPicker"
      @keydown.enter.prevent="openPicker"
      @keydown.space.prevent="openPicker"
      @dragover.prevent="!disabled && !reachedMax && (dragging = true)"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <IIcon class="i-upload__zone-icon" name="download" :size="26" />
      <p class="i-upload__zone-text">
        <span class="i-upload__link">点击选择</span>或将文件拖到此处
      </p>
      <p v-if="tip || accept || maxSize" class="i-upload__tip">
        {{ tip || `${accept ? `支持 ${accept}` : ''}${accept && maxSize ? '，' : ''}${maxSize ? `单个不超过 ${maxSize} MB` : ''}` }}
      </p>
    </div>

    <div v-else class="i-upload__button">
      <IButton :disabled="disabled || reachedMax" @click="openPicker">
        <IIcon name="plus" :size="15" />选择文件
      </IButton>
      <span v-if="tip" class="i-upload__tip">{{ tip }}</span>
    </div>

    <ul v-if="files.length" class="i-upload__list">
      <li v-for="item in files" :key="item.uid" class="i-upload__item" :class="`is-${item.status}`">
        <IIcon class="i-upload__file-icon" name="file" :size="16" />
        <div class="i-upload__meta">
          <div class="i-upload__row">
            <span class="i-upload__name" :title="item.name">{{ item.name }}</span>
            <span class="i-upload__size">{{ formatSize(item.size) }}</span>
          </div>
          <!-- 进度条只在上传中出现，成功后让位给状态图标，避免残留一条满进度 -->
          <div v-if="item.status === 'uploading'" class="i-upload__progress">
            <span class="i-upload__bar" :style="{ width: `${item.percent}%` }" />
          </div>
          <p v-else-if="item.status === 'error'" class="i-upload__error">{{ item.error }}</p>
        </div>

        <span v-if="item.status === 'uploading'" class="i-upload__percent">{{ item.percent }}%</span>
        <IIcon v-else-if="item.status === 'success'" class="i-upload__ok" name="check-circle" :size="16" />
        <button
          v-else-if="item.status === 'error'"
          class="i-upload__act"
          type="button"
          aria-label="重新上传"
          @click="retry(item)"
        >
          <IIcon name="refresh" :size="15" />
        </button>

        <button class="i-upload__act" type="button" aria-label="移除" @click="remove(item)">
          <IIcon name="close" :size="15" />
        </button>
      </li>
    </ul>
  </div>
</template>
