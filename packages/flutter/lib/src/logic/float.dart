/// 悬浮操作按钮的展开几何（对应 packages/common/src/logic/float.ts）。
///
/// 间距与顺序若在各端各写一遍，同一个组件在三端会错开几像素——
/// 这种偏差没人会当成 bug 报，只会觉得「有点糙」。
library;

/// 主按钮直径
const double kFloatButtonSize = 48;

/// 动作按钮直径：比主按钮小一圈，层级一眼可辨
const double kFloatActionSize = 40;

/// 相邻两个之间的空隙
const double kFloatActionGap = 12;

/// 第 index 个动作距主按钮中心的距离（像素）。
///
/// 从 1 开始往外排：第一个动作要先跨过主按钮的半径与自己的半径，再加一个空隙，
/// 之后每个再加一整个动作直径与空隙。
double floatActionOffset(int index) {
  const first = kFloatButtonSize / 2 + kFloatActionGap + kFloatActionSize / 2;
  return first + index * (kFloatActionSize + kFloatActionGap);
}

/// 第 index 个动作相对「与主按钮同底对齐」这个起点要挪多远（像素）。
///
/// floatActionOffset 给的是两个圆心之间的距离，而摆放时的起点是底边对齐，
/// 两者差着半个直径之差。直接拿圆心距当位移，整排动作会统一偏低 4px。
double floatActionShift(int index) {
  return floatActionOffset(index) + (kFloatButtonSize - kFloatActionSize) / 2;
}

/// 展开动画里第 index 个动作的延迟（毫秒）。
///
/// 依次弹出而不是一起冒出来：一起出现时用户得重新扫一遍才知道有几个。
/// 总时长压在 150ms 内，再长就从「跟手」变成「等它」。
int floatActionDelay(int index, int count) {
  if (count <= 1) return 0;
  return (index * 150 / count).round();
}
