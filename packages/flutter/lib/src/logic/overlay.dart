/// 浮层定位：与 Web 端 logic/overlay.ts 同一套规则的 Dart 实现。
///
/// 两端各写一遍是无法避免的（Dart 不能直接跑 TS），但规则必须逐条对应：
/// 空间不足翻到对侧、贴边推回可用区、箭头始终指向触发元素中心。
/// 任何一条只改一端，就会出现「同一个设计在两端表现不同」。
library;

import 'package:flutter/painting.dart' show Rect;

enum IPlacement { top, bottom, left, right }

/// 主轴对齐方式。
/// center 让浮层以触发元素为中心，适合气泡与提示；
/// start 让起始边与触发元素对齐，适合下拉菜单与选择器——
/// 面板通常比触发器宽得多，居中会让它向左溢出、压住旁边的内容。
enum IOverlayAlign { center, start }

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
  IOverlayAlign align = IOverlayAlign.center,
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
      align == IOverlayAlign.start
          ? trigger.x
          : trigger.x + trigger.width / 2 - popup.width / 2,
      viewport.x + padding,
      viewport.x + viewport.width - popup.width - padding,
    );
  } else {
    x = finalPlacement == IPlacement.left
        ? trigger.x - popup.width - offset
        : trigger.x + trigger.width + offset;
    y = _clamp(
      align == IOverlayAlign.start
          ? trigger.y
          : trigger.y + trigger.height / 2 - popup.height / 2,
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

/* ---------- 新手引导 ---------- */

class ITourStep {
  const ITourStep({
    required this.target,
    required this.title,
    required this.description,
    this.placement = IPlacement.bottom,
  });

  /// 要高亮的元素。Flutter 端传的是目标 Widget 的 GlobalKey 名，由调用方解析
  final String target;
  final String title;
  final String description;
  final IPlacement placement;
}

class ITourHole {
  const ITourHole({
    required this.x,
    required this.y,
    required this.width,
    required this.height,
    required this.radius,
  });
  final double x;
  final double y;
  final double width;
  final double height;
  final double radius;
}

/// 高亮框：目标元素向外扩一圈。
///
/// 不贴着元素边缘挖：贴边挖出来的洞看起来像元素被裁掉了一块，
/// 而且元素自身的外阴影、focus 环会落在洞外的暗区里，显得断开。
ITourHole tourHole(
  Rect rect, {
  double padding = 6,
  double radius = 8,
}) =>
    ITourHole(
      x: rect.left - padding,
      y: rect.top - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
      radius: radius,
    );

/// 下一步的下标。到末步返回 -1，表示引导结束。
///
/// 结束用 -1 而不是停在末步：停在末步时，「下一步」按钮点下去没有任何变化，
/// 用户不知道是走完了还是卡住了——调用方拿到 -1 才知道该关掉浮层。
int tourNext(int current, int total) {
  if (current + 1 >= total) return -1;
  return current + 1;
}

/// 上一步。首步不再后退，返回 0
int tourPrev(int current) => current - 1 < 0 ? 0 : current - 1;

/// 目标不在视口里时，要把它滚到哪个位置。
///
/// 滚到正中而不是滚到刚好露出来：刚好露出来时，说明气泡多半就没地方放了，
/// 会被挤到目标另一侧，读者得先找一遍气泡在哪。
double tourScrollTo(Rect rect, double viewportHeight, double scrollTop) {
  final center = rect.top + scrollTop + rect.height / 2;
  final target = center - viewportHeight / 2;
  return target < 0 ? 0 : target;
}

/// 目标此刻是否已经完整可见。可见就不滚，省掉一次没必要的跳动。
bool tourNeedsScroll(Rect rect, double viewportHeight, {double padding = 24}) =>
    rect.top < padding || rect.top + rect.height > viewportHeight - padding;
