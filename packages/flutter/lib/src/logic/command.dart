/// 命令搜索的匹配与排序（对应 packages/common/src/logic/command.ts）。
///
/// 搜索这件事的成败全在排序：把「按钮」输进去，第一条必须是 Button 而不是
/// 「按钮组」或者某个说明里恰好带这两个字的条目。排错一次，用户下次就不用搜索了，
/// 转回去用鼠标翻菜单——而那正是搜索本该省掉的事。
///
/// 与 Web 端逐条对齐：同一个词在两端给出的第一条必须是同一个。
library;

class ICommandItem {
  const ICommandItem({
    required this.key,
    required this.label,
    this.description,
    this.keywords = const [],
    this.group,
  });

  /// 稳定标识，用于选中回调
  final String key;

  /// 主标题，排序时权重最高
  final String label;

  /// 副标题或路径，次一级
  final String? description;

  /// 额外可搜的词：英文名、别名、缩写
  final List<String> keywords;

  /// 分组名，用于结果里的小标题
  final String? group;
}

class ICommandMatch {
  const ICommandMatch({required this.item, required this.score, required this.ranges});

  final ICommandItem item;
  final double score;

  /// 命中区间（在 label 上的下标），用于高亮
  final List<List<int>> ranges;
}

class _Hit {
  const _Hit(this.score, this.at);
  final double score;
  final int at;
}

/// 一个词在一段文本里的命中位置与得分。
///
/// 三档，差距拉得很开：整串相等 > 从头开始 > 出现在中间。
/// 差距小了，排序就会被「描述里也提到这个词」这类弱命中顶上来。
_Hit? _scoreText(String text, String query) {
  final lower = text.toLowerCase();
  final at = lower.indexOf(query);
  if (at < 0) return null;
  if (lower == query) return _Hit(100, at);
  if (at == 0) return _Hit(80, at);
  // 词首命中（「表单 校验」里搜「校验」）比词中命中有用得多。
  // 中文没有空格，因此把常见分隔符都算作词的起点。
  final prev = lower[at - 1];
  if (RegExp(r'[\s\-_/·、，,.（(]').hasMatch(prev)) return _Hit(60, at);
  return _Hit(40, at);
}

/// 字段权重：标题 > 关键词 > 描述。描述里命中只当作补充证据，不足以顶到前面
const double _weightLabel = 1;
const double _weightKeywords = 0.7;
const double _weightDescription = 0.4;

/// 过滤并排序。
///
/// 空查询返回原序的全部条目——搜索框刚打开时该看到「有哪些东西可搜」，
/// 而不是一片空白等着用户猜。
List<ICommandMatch> searchCommands(List<ICommandItem> items, String query, {int limit = 20}) {
  final q = query.trim().toLowerCase();
  if (q.isEmpty) {
    return [
      for (final item in items.take(limit))
        ICommandMatch(item: item, score: 0, ranges: const []),
    ];
  }

  final out = <ICommandMatch>[];
  for (final item in items) {
    final inLabel = _scoreText(item.label, q);
    _Hit? inKeywords;
    for (final k in item.keywords) {
      final hit = _scoreText(k, q);
      if (hit != null && (inKeywords == null || hit.score > inKeywords.score)) inKeywords = hit;
    }
    final inDesc = item.description == null ? null : _scoreText(item.description!, q);

    final score = [
      (inLabel?.score ?? 0) * _weightLabel,
      (inKeywords?.score ?? 0) * _weightKeywords,
      (inDesc?.score ?? 0) * _weightDescription,
    ].reduce((a, b) => a > b ? a : b);
    if (score == 0) continue;
    out.add(ICommandMatch(
      item: item,
      score: score,
      // 只高亮标题上的命中：把描述也标起来会让整行斑斑点点，反而看不出重点
      ranges: inLabel == null
          ? const []
          : [
              [inLabel.at, inLabel.at + q.length]
            ],
    ));
  }

  // 同分时按标题长度排：搜「按钮」时「按钮」与「按钮组」都是 80 分，
  // 短的那个几乎总是用户想要的——它是这个词本身，而不是以它开头的另一件东西。
  out.sort((a, b) {
    final byScore = b.score.compareTo(a.score);
    return byScore != 0 ? byScore : a.item.label.length.compareTo(b.item.label.length);
  });
  return out.take(limit).toList();
}

/// 上下键在结果里移动。
///
/// 到头要绕回去：一串结果里按到底之后再按一下，回到第一条比停在最后一条有用——
/// 停住的话用户会以为键盘失灵，然后去够鼠标。
int moveCommandIndex(int current, int delta, int total) {
  if (total <= 0) return 0;
  return (current + delta + total) % total;
}
