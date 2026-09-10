/// 提及触发与插入的 Dart 移植（对应 packages/common/src/logic/mention.ts）。
///
/// 三条判定缺一条都会让候选在不该弹的时候弹出来，而各端各写一遍必然分叉：
/// 同一段输入在两端上一个弹一个不弹。
library;

class IMentionTrigger {
  const IMentionTrigger({required this.at, required this.symbol, required this.query});

  /// 触发符在文本中的下标
  final int at;

  /// 触发符本身，通常是 @ 或 /
  final String symbol;

  /// 触发符之后已经输入的查询串
  final String query;

  @override
  bool operator ==(Object other) =>
      other is IMentionTrigger && other.at == at && other.symbol == symbol && other.query == query;

  @override
  int get hashCode => Object.hash(at, symbol, query);

  @override
  String toString() => 'IMentionTrigger($at, $symbol, $query)';
}

/// 光标前是否正处在一次提及里。不在则返回 null。
///
/// 1. 触发符前面必须是行首或空白。`user@example.com` 里的 @ 前面是字母，
///    不该弹——用户在打邮箱，弹出来的候选会把回车键抢走。
/// 2. 触发符与光标之间不能有空白。打完 `@张三 然后` 之后候选就该收起。
/// 3. 查询串有长度上限。没有上限的话，一个没选中任何人的 @ 会让整段话
///    都被当成查询，候选列表永远是空的，而面板一直挂在那里。
IMentionTrigger? findMention(
  String text,
  int caret, {
  List<String> symbols = const ['@'],
  int maxQuery = 24,
}) {
  final before = text.substring(0, caret.clamp(0, text.length));
  final space = RegExp(r'\s');

  for (var i = before.length - 1; i >= 0 && before.length - i <= maxQuery + 1; i--) {
    final char = before[i];
    if (space.hasMatch(char)) return null;
    if (!symbols.contains(char)) continue;

    final prev = i == 0 ? '' : before[i - 1];
    // 前面必须是行首或空白，否则是邮箱、路径这类本来就带符号的文本
    if (prev != '' && !space.hasMatch(prev)) return null;
    return IMentionTrigger(at: i, symbol: char, query: before.substring(i + 1));
  }
  return null;
}

class IMentionResult {
  const IMentionResult({required this.text, required this.caret});
  final String text;
  final int caret;
}

/// 选中一个候选后，把触发段替换成完整的提及。
///
/// 末尾补一个空格：不补的话，光标紧贴着刚插入的名字，
/// 用户接着打字会立刻又触发一次候选——因为光标前正好还是那段提及。
IMentionResult applyMention(String text, IMentionTrigger trigger, String label, int caret) {
  final inserted = '${trigger.symbol}$label ';
  final safeCaret = caret.clamp(0, text.length);
  final next = text.substring(0, trigger.at) + inserted + text.substring(safeCaret);
  return IMentionResult(text: next, caret: trigger.at + inserted.length);
}

class IMentionOption {
  const IMentionOption({
    required this.value,
    required this.label,
    this.keywords = const [],
    this.desc = '',
    this.disabled = false,
  });

  final String value;
  final String label;

  /// 额外的搜索词，比如拼音或英文名
  final List<String> keywords;
  final String desc;
  final bool disabled;
}

/// 按查询串过滤候选。空查询给全量——刚打出 @ 时应当先看到有哪些人
List<IMentionOption> filterMentions(List<IMentionOption> options, String query) {
  if (query.isEmpty) return options;
  final needle = query.toLowerCase();
  return options
      .where((option) =>
          option.label.toLowerCase().contains(needle) ||
          option.keywords.any((k) => k.toLowerCase().contains(needle)))
      .toList();
}
