/// 统一 diff 视图的行比对（对应 packages/common/src/logic/diff.ts）。
///
/// 放公共层不是为了省代码量，是因为各端必须给出同一份结果：
/// 同一个补丁在 Web 上显示改了 3 行、在这一端显示改了 5 行，读者不知道该信哪个。
library;

enum IDiffKind { same, add, remove }

class IDiffLine {
  const IDiffLine({required this.kind, required this.text, this.before, this.after});

  final IDiffKind kind;
  final String text;

  /// 在旧文本里的行号（1 起）；新增行没有
  final int? before;

  /// 在新文本里的行号（1 起）；删除行没有
  final int? after;
}

/// 用 LCS 而不是逐行对齐：逐行比对在开头插入一行时会把后面所有行都标成改动，
/// 而实际只加了一行。那样的 diff 读者根本没法用。
List<List<int>> _lcsTable(List<String> a, List<String> b) {
  final table = List.generate(a.length + 1, (_) => List.filled(b.length + 1, 0));
  for (var i = a.length - 1; i >= 0; i--) {
    for (var j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] == b[j]
          ? table[i + 1][j + 1] + 1
          : (table[i + 1][j] > table[i][j + 1] ? table[i + 1][j] : table[i][j + 1]);
    }
  }
  return table;
}

/// 把两段文本比成一串带标记的行。
///
/// 同一处改动里，删除排在新增之前——读者的视线顺序是「原来是什么 → 变成了什么」。
List<IDiffLine> diffLines(String before, String after) {
  final a = before.split('\n');
  final b = after.split('\n');
  final table = _lcsTable(a, b);

  final out = <IDiffLine>[];
  var i = 0;
  var j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] == b[j]) {
      out.add(IDiffLine(kind: IDiffKind.same, text: a[i], before: i + 1, after: j + 1));
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      out.add(IDiffLine(kind: IDiffKind.remove, text: a[i], before: i + 1));
      i++;
    } else {
      out.add(IDiffLine(kind: IDiffKind.add, text: b[j], after: j + 1));
      j++;
    }
  }
  while (i < a.length) {
    i++;
    out.add(IDiffLine(kind: IDiffKind.remove, text: a[i - 1], before: i));
  }
  while (j < b.length) {
    j++;
    out.add(IDiffLine(kind: IDiffKind.add, text: b[j - 1], after: j));
  }
  return out;
}

/// 改动统计，用于「+13 −4」这类摘要
({int added, int removed}) diffStat(List<IDiffLine> lines) => (
      added: lines.where((l) => l.kind == IDiffKind.add).length,
      removed: lines.where((l) => l.kind == IDiffKind.remove).length,
    );


/// 去掉整段代码共有的那层缩进，并掐掉首尾的空行（对应 logic/highlight.ts 的 dedentCode）。
///
/// 文档里的示例都写在模板内部，本身带着页面的缩进，原样渲染出来读者照着抄
/// 还得先手工对齐一遍。按**最小的那一层缩进**裁，而不是逐行 trim：
/// 逐行 trim 会把代码本身的层级也抹平，那就不是同一段代码了。
///
/// 空行不参与最小缩进的计算——空行没有缩进可言，算进去的话最小值永远是 0。
String dedentCode(String code) {
  final lines = code.replaceAll(RegExp(r'\r\n?'), '\n').split('\n');
  while (lines.isNotEmpty && lines.first.trim().isEmpty) {
    lines.removeAt(0);
  }
  while (lines.isNotEmpty && lines.last.trim().isEmpty) {
    lines.removeLast();
  }
  if (lines.isEmpty) return '';

  var indent = -1;
  for (final line in lines) {
    if (line.trim().isEmpty) continue;
    final n = line.length - line.trimLeft().length;
    if (indent < 0 || n < indent) indent = n;
  }
  if (indent <= 0) {
    return lines.map((line) => line.trimRight()).join('\n');
  }
  return lines
      .map((line) => (line.length >= indent ? line.substring(indent) : line).trimRight())
      .join('\n');
}
