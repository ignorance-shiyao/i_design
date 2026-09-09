/// Select / Tabs 的高亮移动规则（对应 packages/common/src/logic/select.ts）。
///
/// 键盘与手势的触发方式各端不同，但「跳过禁用项、到边界停或循环」这条规则只有一份含义，
/// 因此按同一套算法移植，并由 scripts/check-parity.mjs 校验两边输出一致。
library;

// 入参只取禁用标记：调用方的选项类型各不相同，
// 把它们都塞进一个公共接口反而逼着每个组件去实现无关的成员。
int _move(List<bool> disabled, int current, int step, {required bool loop}) {
  final count = disabled.length;
  if (count == 0) return -1;
  var next = current;
  for (var i = 0; i < count; i++) {
    if (loop) {
      next = (next + step + count) % count;
    } else {
      next += step;
      if (next < 0 || next >= count) return current;
    }
    if (!disabled[next]) return next;
  }
  return current;
}

/// 到边界即停，不循环——列表型选项里循环回首项容易导致误选
int moveActive(List<bool> disabled, int current, int step) =>
    _move(disabled, current, step, loop: false);

/// 首尾相接，用于 Tabs 这类环形导航
int moveActiveLoop(List<bool> disabled, int current, int step) =>
    _move(disabled, current, step, loop: true);
