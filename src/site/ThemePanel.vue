<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import IIcon from "@/components/IIcon.vue";
import ISegmented from "@/components/ISegmented.vue";
import ISlider from "@/components/ISlider.vue";
import ISwitch from "@/components/ISwitch.vue";
import IButton from "@/components/IButton.vue";
import IColorPicker from "@/components/IColorPicker.vue";
import {
  CONTROL_HEIGHT_RANGE,
  CONTROL_SIZE_KEYS,
  FONT_SIZE_KEYS,
  FONT_SIZE_RANGE,
  RADIUS_KEYS,
  RADIUS_RANGE,
  SEMANTIC_COLOR_KEYS,
  brandRamp,
  resolveControlHeights,
  resolveFontSizes,
  resolveRadii,
  resolveShadows,
  resolveSpacing,
  type IconName,
  type SemanticColorKey,
  type ShadowKey,
} from "@i-design/common";
import {
  PRESET_BRANDS,
  PRESET_SEMANTICS,
  useThemeConfig,
} from "@/composables/useThemeConfig";

const { themeConfig, themeMode, currentRamp, themeCss, resetThemeConfig } =
  useThemeConfig();

const open = defineModel<boolean>("open", { default: false });

/* 点击面板外部关闭：面板挂在顶栏下方，不该挡住用户接下来的操作 */
const root = ref<HTMLElement>();
function closePanel() {
  open.value = false;
  document.querySelector<HTMLElement>("[data-theme-trigger]")?.focus();
}
function onKeydown(event: KeyboardEvent) {
  if (open.value && event.key === "Escape") {
    event.preventDefault();
    closePanel();
  }
}
watch(open, async (value) => {
  if (value) {
    await nextTick();
    root.value?.focus();
  }
});
function onDocumentClick(event: MouseEvent) {
  if (!open.value) return;
  const target = event.target as HTMLElement;
  /*
   * 取色器的浮层 teleport 到了 body，不在面板的 DOM 里。
   * 不把它算作「面板之内」的话，用户一点进取色面板，整个配置面板就关了——
   * 看起来就像「自定义颜色不生效」：颜色其实改了，只是面板先没了。
   */
  if (
    root.value?.contains(target) ||
    target.closest("[data-theme-trigger]") ||
    target.closest(".i-colorpicker__panel")
  )
    return;
  open.value = false;
}
onMounted(() => {
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onKeydown);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick);
  document.removeEventListener("keydown", onKeydown);
});

/*
 * 配置项按令牌类别分组，而不是堆成一长条。
 * 分组本身就是这套体系的结构：色彩 / 字体 / 圆角 / 阴影 / 尺寸 各自是一层令牌，
 * 面板的信息结构照着令牌的结构走，用户改完一类就知道自己改的是什么。
 */
const tabs: { key: string; label: string; icon: IconName }[] = [
  { key: "color", label: "色彩", icon: "palette" },
  { key: "font", label: "字体", icon: "text-size" },
  { key: "radius", label: "圆角", icon: "corner-radius" },
  { key: "shadow", label: "阴影", icon: "shadow-layer" },
  { key: "size", label: "尺寸", icon: "ruler" },
  { key: "glass", label: "质感", icon: "layers" },
  { key: "motion", label: "动效", icon: "sparkle" },
  { key: "export", label: "导出", icon: "code" },
];
const tab = ref("color");

const scaleOptions = [
  { value: "compact", label: "紧凑" },
  { value: "default", label: "默认" },
  { value: "loose", label: "宽松" },
  { value: "custom", label: "自定义" },
];

const rampSteps = [
  { key: "active", label: "按下" },
  { key: "brand", label: "常态" },
  { key: "hover", label: "悬停" },
  { key: "subtle", label: "衬底" },
] as const;

/*
 * 对比度告警据实显示，不做「看起来都合格」的粉饰。
 * 中等明度的主题色上白字与深字都到不了正文要求的 4.5:1，
 * 这是该颜色的固有限制——告诉用户，让他自己权衡。
 */
const contrastLevel = computed(() => {
  const ratio = currentRamp.value.onBrandContrast;
  if (ratio >= 4.5)
    return {
      tone: "ok",
      text: `按钮文字对比度 ${ratio.toFixed(2)}:1，满足普通文字 4.5:1`,
    };
  if (ratio >= 3)
    return {
      tone: "warn",
      text: `按钮文字对比度 ${ratio.toFixed(
        2
      )}:1，仅满足大字 3:1，普通按钮文字不足 4.5:1`,
    };
  return {
    tone: "bad",
    text: `按钮文字对比度 ${ratio.toFixed(2)}:1，低于大字 3:1，建议调整主题色`,
  };
});

const semanticMeta: Record<
  SemanticColorKey,
  { label: string; icon: IconName }
> = {
  success: { label: "成功色", icon: "check-circle" },
  warning: { label: "警告色", icon: "warning-triangle" },
  danger: { label: "错误色", icon: "error-circle" },
};
const semanticRamps = computed(() =>
  Object.fromEntries(
    SEMANTIC_COLOR_KEYS.map((key) => [
      key,
      brandRamp(themeConfig[key], themeMode.value),
    ])
  )
);

/* 当前生效的数值：预设档由倍率算出，自定义档直接来自滑块。
   两种情况都显示同一份结果，用户改档位时能立刻看到每一级变成了多少 */
const fontValues = computed(() => resolveFontSizes(themeConfig));
const radiusValues = computed(() => resolveRadii(themeConfig));
const spacingValues = computed(() => resolveSpacing(themeConfig));
const controlValues = computed(() => resolveControlHeights(themeConfig));
const shadowValues = computed(() =>
  resolveShadows(themeConfig, themeMode.value)
);

/* 切到「自定义」时，先把当前档位的结果灌进去当起点——
   否则用户一点自定义，界面会跳回上一次编辑的旧值 */
watch(
  () => themeConfig.fontSize,
  (level, prev) => {
    if (level === "custom" && prev !== "custom")
      Object.assign(
        themeConfig.fontSizeCustom,
        resolveFontSizes({ ...themeConfig, fontSize: prev })
      );
  }
);
watch(
  () => themeConfig.radius,
  (level, prev) => {
    if (level === "custom" && prev !== "custom")
      Object.assign(
        themeConfig.radiusCustom,
        resolveRadii({ ...themeConfig, radius: prev })
      );
  }
);
watch(
  () => themeConfig.density,
  (level, prev) => {
    if (level === "custom" && prev !== "custom") {
      Object.assign(
        themeConfig.controlHeightCustom,
        resolveControlHeights({ ...themeConfig, density: prev })
      );
      themeConfig.spacingScale =
        prev === "compact" ? 80 : prev === "loose" ? 125 : 100;
    }
  }
);

const fontLabels: Record<string, string> = {
  xs: "辅助",
  sm: "次要",
  md: "正文",
  lg: "小标题",
  xl: "标题",
  "2xl": "大标题",
  "3xl": "章节标题",
  "4xl": "展示",
  "5xl": "超大展示",
};
const radiusLabels: Record<string, string> = {
  sm: "标签、角标",
  md: "按钮、输入框",
  lg: "卡片、下拉面板",
  xl: "对话框、抽屉",
};
const shadowSteps: { key: ShadowKey; label: string }[] = [
  { key: "sm", label: "轻微抬起" },
  { key: "md", label: "浮层" },
  { key: "lg", label: "对话框" },
  { key: "xl", label: "全屏浮层" },
];
const controlLabels: Record<string, string> = {
  sm: "小号控件",
  md: "默认控件",
  lg: "大号控件",
};

const spacingList = computed(() =>
  Object.entries(spacingValues.value).filter(([key]) => key !== "0")
);

/* 导出：复制到剪贴板。写不进去（无权限、非安全上下文）时据实告诉用户 */
const copied = ref<"idle" | "ok" | "fail">("idle");
let copyTimer: number | undefined;
async function copyCss() {
  try {
    await navigator.clipboard.writeText(themeCss.value);
    copied.value = "ok";
  } catch {
    copied.value = "fail";
  }
  window.clearTimeout(copyTimer);
  copyTimer = window.setTimeout(() => (copied.value = "idle"), 2000);
}
onBeforeUnmount(() => window.clearTimeout(copyTimer));
</script>

<template>
  <Teleport to="body">
    <Transition name="tp">
      <aside
        v-if="open"
        ref="root"
        class="tp i-glass"
        role="dialog"
        aria-label="主题配置"
        tabindex="-1"
      >
        <header class="tp__head">
          <div class="tp__headings">
            <p class="tp__title">主题配置</p>
            <p class="tp__sub">改动实时生效，并记住到下次访问</p>
          </div>
          <div class="tp__actions">
            <IButton size="sm" @click="resetThemeConfig">恢复默认</IButton
            ><button
              class="tp__close"
              aria-label="关闭主题配置"
              @click="closePanel"
            >
              <IIcon name="close" :size="18" />
            </button>
          </div>
        </header>

        <div class="tp__body">
          <!-- 分类导航。选中态用淡底色块加主题色图标，不靠加粗边线 -->
          <nav class="tp__rail" role="tablist" aria-label="配置分类">
            <button
              v-for="item in tabs"
              :key="item.key"
              class="tp__rail-item"
              :class="{ 'is-active': tab === item.key }"
              role="tab"
              :aria-selected="tab === item.key"
              @click="tab = item.key"
            >
              <IIcon :name="item.icon" :size="17" />
              {{ item.label }}
            </button>
          </nav>

          <div class="tp__panes">
            <!-- 色彩 -->
            <section v-if="tab === 'color'">
              <p class="tp__label">主题色</p>
              <div class="tp__swatches">
                <button
                  v-for="preset in PRESET_BRANDS"
                  :key="preset.value"
                  class="tp__swatch"
                  :class="{ 'is-active': themeConfig.brand === preset.value }"
                  :style="{ background: preset.value }"
                  :title="preset.label"
                  :aria-label="preset.label"
                  :aria-pressed="themeConfig.brand === preset.value"
                  @click="themeConfig.brand = preset.value"
                >
                  <IIcon
                    v-if="themeConfig.brand === preset.value"
                    name="check"
                    :size="13"
                  />
                </button>
              </div>
              <!-- 自定义走自家的取色器：原生取色器是浏览器的浮层，
                   样式不跟主题，也给不出对比度读数 -->
              <IColorPicker
                v-model="themeConfig.brand"
                class="tp__picker"
                :presets="PRESET_BRANDS.map((p) => p.value)"
              />

              <!-- 推导出的整条色阶：让用户看到一个基色会变成什么，而不是只看一个方块 -->
              <div class="tp__ramp">
                <span
                  v-for="step in rampSteps"
                  :key="step.key"
                  class="tp__ramp-step"
                >
                  <span
                    class="tp__ramp-chip"
                    :style="{ background: currentRamp[step.key] }"
                  />
                  {{ step.label }}
                </span>
              </div>

              <p class="tp__contrast" :class="`is-${contrastLevel.tone}`">
                <IIcon
                  :name="
                    contrastLevel.tone === 'ok'
                      ? 'check-circle'
                      : 'warning-triangle'
                  "
                  :size="14"
                />
                {{ contrastLevel.text }}
              </p>

              <p class="tp__label tp__label--sep">
                中性色偏移
                <span class="tp__value">{{ themeConfig.neutralTint }}%</span>
              </p>
              <ISlider
                v-model="themeConfig.neutralTint"
                :min="0"
                :max="100"
                :step="5"
                aria-label="中性色偏移"
              />
              <p class="tp__hint">
                给灰阶掺入主题色的色相。纯灰在饱和主题色旁边会显得发脏，掺一点同色相即可消掉；只动彩度不动明度，对比度保持不变。
              </p>

              <p class="tp__label tp__label--sep">语义色</p>
              <div class="tp__semantics">
                <div
                  v-for="key in SEMANTIC_COLOR_KEYS"
                  :key="key"
                  class="tp__semantic"
                >
                  <span class="tp__semantic-head">
                    <span
                      class="tp__semantic-icon"
                      :style="{
                        color: semanticRamps[key].brand,
                        background: semanticRamps[key].subtle,
                      }"
                    >
                      <IIcon :name="semanticMeta[key].icon" :size="14" />
                    </span>
                    {{ semanticMeta[key].label }}
                  </span>
                  <IColorPicker
                    v-model="themeConfig[key]"
                    class="tp__picker tp__picker--sm"
                    :presets="PRESET_SEMANTICS[key]"
                    :show-contrast="false"
                  />
                </div>
              </div>
            </section>

            <!-- 字体 -->
            <section v-else-if="tab === 'font'">
              <p class="tp__label">字体</p>
              <ISegmented
                v-model="themeConfig.fontFamily"
                aria-label="字体"
                :options="[
                  { value: 'system', label: '系统' },
                  { value: 'serif', label: '衬线' },
                  { value: 'mono', label: '等宽' },
                ]"
                block
              />

              <p class="tp__label tp__label--sep">字号</p>
              <ISegmented
                v-model="themeConfig.fontSize"
                aria-label="字号"
                :options="scaleOptions"
                block
              />
              <ul class="tp__steps">
                <li v-for="key in FONT_SIZE_KEYS" :key="key" class="tp__step">
                  <span class="tp__step-head">
                    <span
                      class="tp__step-demo"
                      :style="{
                        fontSize: `${Math.min(fontValues[key], 22)}px`,
                      }"
                      >Aa</span
                    >
                    <span class="tp__step-meta">
                      <code class="tp__code">font-size-{{ key }}</code>
                      {{ fontLabels[key] }}
                    </span>
                    <span class="tp__value">{{ fontValues[key] }}px</span>
                  </span>
                  <!-- 自定义档给滑块：拖的时候整页字号跟着变，
                       输入框要等失焦才提交，改完没反馈 -->
                  <ISlider
                    v-if="themeConfig.fontSize === 'custom'"
                    v-model="themeConfig.fontSizeCustom[key]"
                    :min="FONT_SIZE_RANGE[key][0]"
                    :max="FONT_SIZE_RANGE[key][1]"
                    :step="1"
                    :aria-label="`字号 ${key}`"
                  />
                </li>
              </ul>

              <p class="tp__label tp__label--sep">正文行高</p>
              <ISegmented
                v-model="themeConfig.lineHeight"
                aria-label="正文行高"
                :options="[
                  { value: 'tight', label: '紧凑 1.25' },
                  { value: 'base', label: '默认 1.6' },
                  { value: 'loose', label: '宽松 1.8' },
                ]"
                block
              />
              <div class="tp__preview tp__preview--text">
                <p class="tp__sample tp__sample--lg">Ignorance Design</p>
                <p class="tp__sample">
                  正文示例：令牌驱动的设计体系，同一套设计决策落到各端。
                </p>
                <p class="tp__sample tp__sample--xs">辅助说明文字</p>
              </div>
            </section>

            <!-- 圆角 -->
            <section v-else-if="tab === 'radius'">
              <p class="tp__label">圆角</p>
              <ISegmented
                v-model="themeConfig.radius"
                aria-label="圆角"
                :options="scaleOptions"
                block
              />
              <ul class="tp__steps">
                <li v-for="key in RADIUS_KEYS" :key="key" class="tp__step">
                  <span class="tp__step-head">
                    <span
                      class="tp__step-box"
                      :style="{ borderRadius: `${radiusValues[key]}px` }"
                    />
                    <span class="tp__step-meta">
                      <code class="tp__code">radius-{{ key }}</code>
                      {{ radiusLabels[key] }}
                    </span>
                    <span class="tp__value">{{ radiusValues[key] }}px</span>
                  </span>
                  <ISlider
                    v-if="themeConfig.radius === 'custom'"
                    v-model="themeConfig.radiusCustom[key]"
                    :min="RADIUS_RANGE[key][0]"
                    :max="RADIUS_RANGE[key][1]"
                    :step="1"
                    :aria-label="`圆角 ${key}`"
                  />
                </li>
              </ul>
              <div class="tp__preview">
                <span class="tp__box" />
                <span class="tp__box tp__box--lg" />
                <IButton size="sm">按钮</IButton>
              </div>
              <p class="tp__hint">
                圆全（头像、开关滑块）与直角不随档位变化：它们表达的是形状本身。
              </p>
            </section>

            <!-- 阴影 -->
            <section v-else-if="tab === 'shadow'">
              <p class="tp__label">阴影强度</p>
              <ISegmented
                v-model="themeConfig.shadow"
                aria-label="阴影强度"
                :options="[
                  { value: 'none', label: '无' },
                  { value: 'soft', label: '轻' },
                  { value: 'default', label: '默认' },
                  { value: 'strong', label: '重' },
                  { value: 'custom', label: '自定义' },
                ]"
                block
              />
              <template v-if="themeConfig.shadow === 'custom'">
                <p class="tp__label tp__label--sep">
                  强度系数
                  <span class="tp__value"
                    >{{ themeConfig.shadowIntensity }}%</span
                  >
                </p>
                <ISlider
                  v-model="themeConfig.shadowIntensity"
                  :min="0"
                  :max="200"
                  :step="5"
                  aria-label="阴影强度系数"
                />
              </template>
              <div class="tp__elevations">
                <div
                  v-for="step in shadowSteps"
                  :key="step.key"
                  class="tp__elevation"
                  :style="{ boxShadow: shadowValues[step.key] }"
                >
                  <code class="tp__code">shadow-{{ step.key }}</code>
                  <span class="tp__hint">{{ step.label }}</span>
                </div>
              </div>
              <p class="tp__hint">
                强度同时作用于透明度与模糊半径。只提高透明度会得到一圈生硬的黑边，模糊一起放大才像是光源更远。暗色主题下另有一套基准值，自动跟随。
              </p>
            </section>

            <!-- 尺寸 -->
            <section v-else-if="tab === 'size'">
              <p class="tp__label">密度</p>
              <ISegmented
                v-model="themeConfig.density"
                aria-label="密度"
                :options="scaleOptions"
                block
              />
              <template v-if="themeConfig.density === 'custom'">
                <p class="tp__label tp__label--sep">
                  间距倍率
                  <span class="tp__value">{{ themeConfig.spacingScale }}%</span>
                </p>
                <ISlider
                  v-model="themeConfig.spacingScale"
                  :min="50"
                  :max="200"
                  :step="5"
                  aria-label="间距倍率"
                />
              </template>

              <p class="tp__label tp__label--sep">控件高度</p>
              <ul class="tp__steps">
                <li
                  v-for="key in CONTROL_SIZE_KEYS"
                  :key="key"
                  class="tp__step"
                >
                  <span class="tp__step-head">
                    <span
                      class="tp__step-pill"
                      :style="{ height: `${controlValues[key] / 2}px` }"
                    />
                    <span class="tp__step-meta">
                      <code class="tp__code">control-height-{{ key }}</code>
                      {{ controlLabels[key] }}
                    </span>
                    <span class="tp__value">{{ controlValues[key] }}px</span>
                  </span>
                  <ISlider
                    v-if="themeConfig.density === 'custom'"
                    v-model="themeConfig.controlHeightCustom[key]"
                    :min="CONTROL_HEIGHT_RANGE[key][0]"
                    :max="CONTROL_HEIGHT_RANGE[key][1]"
                    :step="1"
                    :aria-label="`控件高度 ${key}`"
                  />
                </li>
              </ul>

              <p class="tp__label tp__label--sep">间距刻度</p>
              <ul class="tp__spacings">
                <li
                  v-for="[key, value] in spacingList"
                  :key="key"
                  class="tp__spacing"
                >
                  <span class="tp__spacing-track">
                    <span
                      class="tp__spacing-bar"
                      :style="{ width: `${value}px` }"
                    />
                  </span>
                  <code class="tp__code">spacing-{{ key }}</code>
                  <span class="tp__value">{{ value }}px</span>
                </li>
              </ul>
              <p class="tp__hint">
                间距缩放后仍对齐到偶数像素，避免发丝线被渲染成两像素的灰边。
              </p>
            </section>

            <!-- 质感 -->
            <section v-else-if="tab === 'glass'">
              <div class="tp__row">
                <div>
                  <p class="tp__label">液态玻璃</p>
                  <p class="tp__hint">浮层改用半透明毛玻璃面</p>
                </div>
                <ISwitch v-model="themeConfig.glass" aria-label="液态玻璃" />
              </div>

              <p class="tp__label tp__label--sep">
                玻璃强度
                <span class="tp__value">{{ themeConfig.glassIntensity }}%</span>
              </p>
              <ISlider
                v-model="themeConfig.glassIntensity"
                :min="0"
                :max="100"
                :step="5"
                :disabled="!themeConfig.glass"
                aria-label="玻璃强度"
              />

              <div class="tp__glass-demo">
                <span class="tp__glass-blob tp__glass-blob--a" />
                <span class="tp__glass-blob tp__glass-blob--b" />
                <div class="tp__glass-card i-glass">
                  <p class="tp__sample">浮层示例</p>
                  <p class="tp__hint">背后的色块被模糊与提饱和之后透上来</p>
                </div>
              </div>

              <p class="tp__hint">
                作用于弹窗、抽屉、下拉、气泡与吸顶条这类浮在内容之上的面；普通卡片背后是纯色底，模糊出来与实心面无异，因此不上玻璃。强度同时决定模糊半径与透明度——越透就越要糊，否则背后的文字会直接透上来。系统开启「减少动态效果」时自动退回实心面。
              </p>
            </section>

            <!-- 动效 -->
            <section v-else-if="tab === 'motion'">
              <div class="tp__row">
                <div>
                  <p class="tp__label">组件动效</p>
                  <p class="tp__hint">关闭后所有过渡立即停止</p>
                </div>
                <ISwitch v-model="themeConfig.motion" aria-label="组件动效" />
              </div>

              <p class="tp__label tp__label--sep">动效速度</p>
              <ISegmented
                v-model="themeConfig.motionSpeed"
                aria-label="动效速度"
                :options="[
                  { value: 'slow', label: '舒缓' },
                  { value: 'default', label: '默认' },
                  { value: 'fast', label: '轻快' },
                ]"
                :disabled="!themeConfig.motion"
                block
              />

              <p class="tp__label tp__label--sep">明暗切换动效</p>
              <ISegmented
                v-model="themeConfig.themeTransition"
                aria-label="明暗切换动效"
                :options="[
                  { value: 'reveal', label: '揭幕' },
                  { value: 'dim', label: '渐暗' },
                  { value: 'none', label: '直接' },
                ]"
                block
              />
              <p class="tp__hint" style="margin-top: 8px">
                {{
                  themeConfig.themeTransition === "reveal"
                    ? "从开关处圆形扩散，看得出是哪个键触发的"
                    : themeConfig.themeTransition === "dim"
                    ? "整屏压黑再亮起，像拉动调光开关"
                    : "不加动效，立即切换"
                }}
              </p>
            </section>

            <!-- 导出 -->
            <section v-else>
              <div class="tp__row">
                <div>
                  <p class="tp__label">导出为 CSS</p>
                  <p class="tp__hint">覆盖变量即可换肤，无需改任何组件代码</p>
                </div>
                <IButton size="sm" @click="copyCss">
                  {{
                    copied === "ok"
                      ? "已复制"
                      : copied === "fail"
                      ? "复制失败"
                      : "复制"
                  }}
                </IButton>
              </div>
              <pre class="tp__css">{{ themeCss }}</pre>
              <p class="tp__hint">
                导出的是当前配置解算出的全部令牌覆盖；亮暗两套一并给出，粘进项目样式表即可。
              </p>
            </section>
          </div>
        </div>

        <footer class="tp__foot">
          设置仅保存在当前浏览器。系统开启「减少动态效果」时，优先遵循系统设置。
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tp {
  /* 挂在顶栏正下方：入口在顶栏，面板就该从那里落下来 */
  position: fixed;
  right: var(--i-spacing-6);
  top: 76px;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  width: 468px;
  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 92px);
  overscroll-behavior: contain;
  padding: var(--i-spacing-5) var(--i-spacing-5) var(--i-spacing-4);
  border: 1px solid var(--i-color-border);
  border-radius: var(--i-radius-xl);
  background: var(--i-color-bg-elevated);
  box-shadow: var(--i-shadow-xl);
}

.tp__head {
  display: flex;
  flex: none;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--i-spacing-3);
  padding-bottom: var(--i-spacing-4);
  border-bottom: 1px solid var(--i-color-hairline);
}
.tp__headings {
  min-width: 0;
}
.tp__actions {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-2);
  flex: none;
}
.tp__close {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 0;
  background: var(--i-color-bg-subtle);
  color: var(--i-color-text-secondary);
  border-radius: var(--i-radius-md);
  cursor: pointer;
  transition: background var(--i-motion-fast) var(--i-motion-easing);
}
.tp__close:hover {
  background: var(--i-color-bg-muted);
  color: var(--i-color-text);
}
.tp__title {
  font-size: var(--i-font-size-lg);
  font-weight: 600;
  color: var(--i-color-text);
  letter-spacing: 0.01em;
}
.tp__sub {
  margin-top: 3px;
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-tertiary);
}

.tp__body {
  display: flex;
  gap: var(--i-spacing-4);
  min-height: 0;
  padding-top: var(--i-spacing-4);
}

/* 左侧分类：竖排图标加文字。图标本身已经标出类别，不再另加边线 */
.tp__rail {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 2px;
  width: 66px;
  overflow-y: auto;
  scrollbar-width: none;
}
.tp__rail::-webkit-scrollbar {
  display: none;
}
.tp__rail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 9px 0;
  border: 0;
  border-radius: var(--i-radius-lg);
  background: transparent;
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-xs);
  cursor: pointer;
  transition: background var(--i-motion-fast) var(--i-motion-easing),
    color var(--i-motion-fast) var(--i-motion-easing);
}
.tp__rail-item:hover {
  background: var(--i-color-bg-subtle);
  color: var(--i-color-text);
}
.tp__rail-item.is-active {
  background: var(--i-color-brand-subtle);
  color: var(--i-color-brand-text);
}

.tp__panes {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding-right: var(--i-spacing-2);
}

.tp__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-2);
  margin-bottom: var(--i-spacing-2);
  font-size: var(--i-font-size-sm);
  font-weight: 600;
  color: var(--i-color-text);
}
.tp__label--sep {
  margin-top: var(--i-spacing-6);
}
.tp__hint {
  font-size: var(--i-font-size-xs);
  line-height: 1.65;
  color: var(--i-color-text-tertiary);
}
.tp__label + .tp__hint,
.i-slider + .tp__hint {
  margin-top: var(--i-spacing-2);
}
.tp__value {
  flex: none;
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-xs);
  font-weight: 400;
  color: var(--i-color-text-secondary);
  font-variant-numeric: tabular-nums;
}
.tp__code {
  /* 站点的全局 code 是个带底色的行内块，在这里会把每一行撑成一排灰条，
     所以只保留等宽字形 */
  display: inline;
  padding: 0;
  border: 0;
  background: none;
  white-space: nowrap;
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-secondary);
}
.tp__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-3);
}
.tp__row .tp__label {
  margin-bottom: 2px;
}

.tp__swatches {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: var(--i-spacing-2);
}
.tp__swatch {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-md);
  color: #fff;
  cursor: pointer;
  transition: transform var(--i-motion-fast) var(--i-motion-easing);
}
.tp__swatch:hover {
  transform: translateY(-2px);
}
/* 选中态用勾而不是加粗描边：色块本身已经是内容，描边会改变它的视觉面积 */
.tp__swatch.is-active {
  box-shadow: 0 0 0 2px var(--i-color-bg-elevated),
    0 0 0 3px var(--i-color-brand);
}

.tp__picker {
  margin-top: var(--i-spacing-3);
}
.tp__picker--sm {
  margin-top: 0;
}

.tp__ramp {
  display: flex;
  gap: var(--i-spacing-2);
  margin-top: var(--i-spacing-4);
}
.tp__ramp-step {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-tertiary);
}
.tp__ramp-chip {
  width: 100%;
  height: 24px;
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-md);
}

.tp__contrast {
  display: flex;
  align-items: flex-start;
  gap: var(--i-spacing-2);
  margin-top: var(--i-spacing-3);
  padding: var(--i-spacing-2) var(--i-spacing-3);
  border-radius: var(--i-radius-md);
  font-size: var(--i-font-size-xs);
  line-height: 1.5;
}
.tp__contrast svg {
  flex: none;
  margin-top: 2px;
}
.tp__contrast.is-ok {
  color: var(--i-color-success-text);
  background: var(--i-color-success-subtle);
}
.tp__contrast.is-warn {
  color: var(--i-color-warning-text);
  background: var(--i-color-warning-subtle);
}
.tp__contrast.is-bad {
  color: var(--i-color-danger-text);
  background: var(--i-color-danger-subtle);
}

/* 语义色：图标加淡底色块表达类型，同时给出文字标签与色值，
   不让颜色成为唯一线索 */
.tp__semantics {
  display: flex;
  flex-direction: column;
  gap: var(--i-spacing-2);
}
.tp__semantic {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-3);
}
.tp__semantic-head {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-2);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text);
}
.tp__semantic-icon {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: var(--i-radius-md);
}

.tp__steps {
  display: flex;
  flex-direction: column;
  margin-top: var(--i-spacing-3);
  list-style: none;
}
.tp__step {
  padding: var(--i-spacing-3) 0;
  border-top: 1px solid var(--i-color-hairline);
}
.tp__step:first-child {
  border-top: 0;
  padding-top: 0;
}
.tp__step-head {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-3);
}
.tp__step-meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-tertiary);
}
.tp__step-demo {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 34px;
  color: var(--i-color-text);
  line-height: 1.1;
}
.tp__step-box {
  flex: none;
  width: 34px;
  height: 30px;
  border: 1px solid var(--i-color-hairline);
  background: var(--i-color-brand-subtle);
}
.tp__step-pill {
  flex: none;
  width: 34px;
  border-radius: var(--i-radius-sm);
  background: var(--i-color-brand-subtle);
}
.tp__step .i-slider {
  margin-top: var(--i-spacing-2);
  padding: 0;
}

.tp__spacings {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: var(--i-spacing-3);
  list-style: none;
}
.tp__spacing {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-3);
}
.tp__spacing-track {
  flex: none;
  width: 100px;
}
.tp__spacing-bar {
  display: block;
  max-width: 100%;
  height: 10px;
  border-radius: var(--i-radius-sm);
  background: var(--i-color-brand-subtle);
}
.tp__spacing .tp__value {
  margin-left: auto;
}

.tp__elevations {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--i-spacing-4);
  margin: var(--i-spacing-5) var(--i-spacing-2);
}
.tp__elevation {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: var(--i-spacing-3);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-lg);
  background: var(--i-color-bg-elevated);
}

/* 玻璃预览：底下摆两块彩色，否则「透过去」透到的是一片白，什么都看不出来 */
.tp__glass-demo {
  position: relative;
  display: grid;
  place-items: center;
  height: 132px;
  margin-top: var(--i-spacing-4);
  overflow: hidden;
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-lg);
  background: var(--i-color-bg-subtle);
}
.tp__glass-blob {
  position: absolute;
  width: 108px;
  height: 108px;
  border-radius: var(--i-radius-full);
}
.tp__glass-blob--a {
  left: 18px;
  top: -22px;
  background: var(--i-color-brand);
}
.tp__glass-blob--b {
  right: 24px;
  bottom: -30px;
  background: var(--i-color-warning);
}
.tp__glass-card {
  position: relative;
  z-index: 1;
  width: 78%;
  padding: var(--i-spacing-3) var(--i-spacing-4);
  border: 1px solid var(--i-color-border);
  border-radius: var(--i-radius-lg);
  background: var(--i-color-bg-elevated);
}

.tp__preview {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-3);
  margin-top: var(--i-spacing-3);
  padding: var(--i-spacing-4);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-lg);
  background: var(--i-color-bg-subtle);
}
.tp__preview--text {
  display: block;
}
.tp__box {
  width: 34px;
  height: 34px;
  border-radius: var(--i-radius-md);
  background: var(--i-color-brand-subtle);
}
.tp__box--lg {
  border-radius: var(--i-radius-lg);
}
.tp__sample {
  color: var(--i-color-text);
  font-size: var(--i-font-size-md);
  line-height: var(--i-line-height-base);
}
.tp__sample--lg {
  font-size: var(--i-font-size-xl);
  font-weight: 600;
}
.tp__sample--xs {
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-secondary);
}

.tp__css {
  max-height: 264px;
  margin: var(--i-spacing-3) 0;
  padding: var(--i-spacing-3);
  overflow: auto;
  border: 1px solid var(--i-color-code-border);
  border-radius: var(--i-radius-md);
  background: var(--i-color-code-bg);
  color: var(--i-color-code-text);
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-xs);
  line-height: 1.6;
}

.tp__foot {
  flex: none;
  margin-top: var(--i-spacing-3);
  padding-top: var(--i-spacing-3);
  border-top: 1px solid var(--i-color-hairline);
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-tertiary);
  line-height: 1.6;
}

.tp-enter-active,
.tp-leave-active {
  transition: opacity var(--i-motion-base) var(--i-motion-easing),
    transform var(--i-motion-base) var(--i-motion-easing);
  transform-origin: top right;
}
.tp-enter-from,
.tp-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}

@media (max-width: 600px) {
  .tp {
    right: var(--i-spacing-4);
    left: var(--i-spacing-4);
    width: auto;
  }
  .tp__rail {
    width: 58px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .tp-enter-active,
  .tp-leave-active {
    transition: none;
  }
}
</style>
