/// 页内锚点的「当前章节」判定：与 Web 端 logic/anchor.ts 同一套规则。
library;

class IAnchorTarget {
  const IAnchorTarget(this.key, this.top);
  final String key;
  final double top;
}

/// 返回当前应当高亮的锚点 key。
///
/// 两个容易漏的分支：触底时最后几个短章节永远越不过判定线，必须直接选中最后一个；
/// 还没滚到第一个标题时高亮第一项，留空会让人以为锚点坏了。
String activeAnchor(
  List<IAnchorTarget> targets, {
  required double scrollTop,
  required double viewportHeight,
  required double documentHeight,
  double offset = 80,
}) {
  if (targets.isEmpty) return '';

  final atBottom = scrollTop + viewportHeight >= documentHeight - 2;
  if (atBottom) return targets.last.key;

  final line = scrollTop + offset;
  var active = '';
  for (final target in targets) {
    if (target.top <= line) {
      active = target.key;
    } else {
      break;
    }
  }
  return active.isEmpty ? targets.first.key : active;
}

/// 滚动到某个锚点时的目标位置，减去吸顶高度，避免标题被导航盖住
double anchorScrollTop(double top, [double offset = 80]) {
  final value = top - offset;
  return value < 0 ? 0 : value;
}
