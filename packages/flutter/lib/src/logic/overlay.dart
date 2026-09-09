/// 浮层定位：与 Web 端 logic/overlay.ts 同一套规则的 Dart 实现。
///
/// 两端各写一遍是无法避免的（Dart 不能直接跑 TS），但规则必须逐条对应：
/// 空间不足翻到对侧、贴边推回可用区、箭头始终指向触发元素中心。
/// 任何一条只改一端，就会出现「同一个设计在两端表现不同」。
library;

enum IPlacement { top, bottom, left, right }

class IOverlayRect {
  const IOverlayRect(this.x, this.y, this.width, this.height);
  final double x;
  final double y;
  final double width;
  final double height;
}

class IOverlayPosition {
  const IOverlayPosition({
    required this.x,
    required this.y,
    required this.placement,
    required this.arrow,
  });

  final double x;
  final double y;

  /// 实际采用的方向，可能因翻转而与传入的不同；箭头要按它来画
  final IPlacement placement;

  /// 箭头相对浮层左上角的位置
  final double arrow;
}

const Map<IPlacement, IPlacement> _opposite = {
  IPlacement.top: IPlacement.bottom,
  IPlacement.bottom: IPlacement.top,
  IPlacement.left: IPlacement.right,
  IPlacement.right: IPlacement.left,
};

bool _isVertical(IPlacement p) => p == IPlacement.top || p == IPlacement.bottom;

bool _fits(
  IPlacement placement,
  IOverlayRect trigger,
  IOverlayRect popup,
  IOverlayRect viewport,
  double offset,
  double padding,
) {
  switch (placement) {
    case IPlacement.top:
      return trigger.y - popup.height - offset >= viewport.y + padding;
    case IPlacement.bottom:
      return trigger.y + trigger.height + popup.height + offset <=
          viewport.y + viewport.height - padding;
    case IPlacement.left:
      return trigger.x - popup.width - offset >= viewport.x + padding;
    case IPlacement.right:
      return trigger.x + trigger.width + popup.width + offset <=
          viewport.x + viewport.width - padding;
  }
}

/// 区间不够宽时贴住起点，避免算出负数位置
double _clamp(double value, double min, double max) =>
    max < min ? min : (value < min ? min : (value > max ? max : value));

/// 计算浮层最终落点，规则与 Web 端逐条一致。
IOverlayPosition resolveOverlay({
  required IOverlayRect trigger,
  required IOverlayRect popup,
  required IOverlayRect viewport,
  IPlacement placement = IPlacement.top,
  double offset = 8,
  double padding = 8,
  bool flip = true,
}) {
  var finalPlacement = placement;
  if (flip &&
      !_fits(placement, trigger, popup, viewport, offset, padding) &&
      _fits(_opposite[placement]!, trigger, popup, viewport, offset, padding)) {
    finalPlacement = _opposite[placement]!;
  }

  double x;
  double y;
  if (_isVertical(finalPlacement)) {
    y = finalPlacement == IPlacement.top
        ? trigger.y - popup.height - offset
        : trigger.y + trigger.height + offset;
    x = _clamp(
      trigger.x + trigger.width / 2 - popup.width / 2,
      viewport.x + padding,
      viewport.x + viewport.width - popup.width - padding,
    );
  } else {
    x = finalPlacement == IPlacement.left
        ? trigger.x - popup.width - offset
        : trigger.x + trigger.width + offset;
    y = _clamp(
      trigger.y + trigger.height / 2 - popup.height / 2,
      viewport.y + padding,
      viewport.y + viewport.height - popup.height - padding,
    );
  }

  // 箭头跟着触发元素中心走，而不是跟着浮层中心
  final center = _isVertical(finalPlacement)
      ? trigger.x + trigger.width / 2 - x
      : trigger.y + trigger.height / 2 - y;
  final span = _isVertical(finalPlacement) ? popup.width : popup.height;
  final arrow = _clamp(center, 12, span - 12 < 12 ? 12 : span - 12);

  return IOverlayPosition(
    x: x,
    y: y,
    placement: finalPlacement,
    arrow: arrow,
  );
}

/// 菜单项的键盘/手势移动，跳过禁用项与分隔线；到边界回绕
int moveMenuActive(List<bool> selectable, int current, int step) {
  final count = selectable.length;
  if (count == 0) return -1;
  var next = current;
  for (var i = 0; i < count; i++) {
    next = (next + step + count) % count;
    if (selectable[next]) return next;
  }
  return current;
}

/// 首个可选项
int firstMenuActive(List<bool> selectable) =>
    selectable.indexWhere((ok) => ok);
