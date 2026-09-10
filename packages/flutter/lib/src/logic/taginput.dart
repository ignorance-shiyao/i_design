/// 输入标签成词规则的 Dart 移植（对应 packages/common/src/logic/taginput.ts）。
///
/// 粘贴同一段文本在两端上得到不同数量的标签，是这个组件最容易分叉的地方。
library;

/// 除回车外，哪些字符也触发成词。
/// 全角逗号与分号也在内——中文输入法下打出来的就是全角。
const List<String> kDefaultSeparators = [',', '，', ';', '；', '\n', '\t'];

/// 把一段文本拆成若干标签。
///
/// 粘贴场景才是这里的主用途：用户从表格里复制一列邮箱过来，
/// 拿到的是一段带换行和逗号的文本，逐个手敲显然不是设计意图。
List<String> splitTags(String text, [List<String> separators = kDefaultSeparators]) {
  if (text.isEmpty) return const [];
  final pattern = RegExp('[${separators.map(_escapeForClass).join()}]');
  return text
      .split(pattern)
      .map((part) => part.trim())
      .where((part) => part.isNotEmpty)
      .toList();
}

String _escapeForClass(String char) => char.replaceAllMapped(RegExp(r'[\\\]^-]'), (m) => '\\${m[0]}');

enum TagRejectReason { duplicate, max, empty }

class TagAddResult {
  const TagAddResult({required this.tags, this.rejected});
  final List<String> tags;

  /// 没加进去的原因，用来给出提示；null 表示都加成功了
  final TagRejectReason? rejected;
}

/// 往已有标签里加一批。
///
/// 返回被拒绝的原因而不是静默丢弃：用户粘贴了十个邮箱只进去七个，
/// 不给理由的话他会以为组件坏了，而最常见的原因恰恰是可以说清的。
TagAddResult addTags(
  List<String> current,
  List<String> incoming, {
  bool allowDuplicate = false,
  int max = 0,
}) {
  final next = [...current];
  TagRejectReason? rejected;

  for (final raw in incoming) {
    final tag = raw.trim();
    if (tag.isEmpty) {
      rejected ??= TagRejectReason.empty;
      continue;
    }
    if (!allowDuplicate && next.contains(tag)) {
      rejected = TagRejectReason.duplicate;
      continue;
    }
    if (max > 0 && next.length >= max) {
      rejected = TagRejectReason.max;
      break;
    }
    next.add(tag);
  }

  return TagAddResult(tags: next, rejected: rejected);
}

class TagBackspaceResult {
  const TagBackspaceResult({required this.tags, required this.consumed});
  final List<String> tags;
  final bool consumed;
}

/// 退格键该做什么。
///
/// 只有输入框为空时才删末项，且要删的是「整个标签」而不是它的最后一个字符——
/// 有内容时删字符是所有输入框的通用行为，破坏它会让人不敢用退格。
TagBackspaceResult backspace(List<String> current, String draft) {
  if (draft.isNotEmpty || current.isEmpty) {
    return TagBackspaceResult(tags: current, consumed: false);
  }
  return TagBackspaceResult(tags: current.sublist(0, current.length - 1), consumed: true);
}

/// 删掉指定位置的标签
List<String> removeTag(List<String> current, int index) {
  final next = [...current];
  if (index >= 0 && index < next.length) next.removeAt(index);
  return next;
}

class TagDraftSplit {
  const TagDraftSplit({required this.ready, required this.rest});
  final List<String> ready;
  final String rest;
}

/// 输入过程中是否触发了分隔符。
///
/// 返回「要成词的部分」和「留在输入框里的部分」：
/// 用户可能一次粘贴进来 "a,b,c"，前两个成标签，"c" 应当留着继续编辑，
/// 而不是连它一起变成标签——那样再补字就得先把标签删掉。
TagDraftSplit splitDraft(String draft, [List<String> separators = kDefaultSeparators]) {
  final hit = separators.any(draft.contains);
  if (!hit) return TagDraftSplit(ready: const [], rest: draft);
  final pattern = RegExp('[${separators.map(_escapeForClass).join()}]');
  final parts = draft.split(pattern);
  final rest = parts.removeLast();
  return TagDraftSplit(
    ready: parts.map((p) => p.trim()).where((p) => p.isNotEmpty).toList(),
    rest: rest,
  );
}
