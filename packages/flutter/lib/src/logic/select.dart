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

/* ---------- 自动完成 ---------- */

class ISuggestion {
  const ISuggestion({required this.value, this.label, this.disabled = false});
  final String value;
  final String? label;
  final bool disabled;

  String get text => label ?? value;
}

class IMatchPart {
  const IMatchPart({required this.text, required this.hit});
  final String text;
  final bool hit;
}

/// 把候选项按命中位置切成若干段，用来给命中的部分加粗。
///
/// 用原串截取而不是小写串：小写串在某些语言里长度会变，截出来就是错位的。
List<IMatchPart> matchParts(String label, String keyword) {
  if (keyword.isEmpty) return [IMatchPart(text: label, hit: false)];
  final haystack = label.toLowerCase();
  final needle = keyword.toLowerCase();
  final parts = <IMatchPart>[];
  var from = 0;

  while (true) {
    final at = haystack.indexOf(needle, from);
    if (at < 0) break;
    if (at > from) parts.add(IMatchPart(text: label.substring(from, at), hit: false));
    parts.add(IMatchPart(text: label.substring(at, at + needle.length), hit: true));
    from = at + needle.length;
  }

  if (from < label.length) parts.add(IMatchPart(text: label.substring(from), hit: false));
  return parts.isEmpty ? [IMatchPart(text: label, hit: false)] : parts;
}

/// 过滤候选。
///
/// 命中前缀的排在命中中段的前面：用户敲「北」，「北京」应当在「湖北」之上。
/// 不排序的话，候选顺序取决于数据源的顺序，看起来像随机的。
List<ISuggestion> filterSuggestions(List<ISuggestion> options, String keyword, {int limit = 20}) {
  if (keyword.isEmpty) {
    return options.length <= limit ? options : options.sublist(0, limit);
  }
  final needle = keyword.toLowerCase();
  final scored = <({ISuggestion option, int rank, int order})>[];

  for (final option in options) {
    final at = option.text.toLowerCase().indexOf(needle);
    if (at < 0) continue;
    scored.add((option: option, rank: at == 0 ? 0 : 1, order: scored.length));
  }

  /*
   * 同档内保持数据源原顺序，用户两次输入看到的顺序才一致。
   * Dart 的 List.sort 不保证稳定（JS 的 Array.sort 保证），
   * 所以把原下标作为第二关键字显式排进去——只写 rank 比较的话，
   * 两端在同档项上会给出不同的顺序，而两边看起来都「按相关度排好了」。
   */
  scored.sort((a, b) {
    final byRank = a.rank.compareTo(b.rank);
    return byRank != 0 ? byRank : a.order.compareTo(b.order);
  });
  final capped = scored.length <= limit ? scored : scored.sublist(0, limit);
  return capped.map((s) => s.option).toList();
}
