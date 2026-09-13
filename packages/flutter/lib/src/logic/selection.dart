/// 选区操作的纯逻辑（对应 packages/common/src/logic/selection.ts）。
///
/// 「超过 2000 字不给动作」「引文从中间省略」「动作条默认开在上方」——
/// 这几条各端各写一遍的话，同一段话在一端能改、在另一端不能，
/// 而两边都不会有任何报错。
library;

import 'overlay.dart';

/// 一个选区动作。id 交给调用方去分派，组件不关心它到底怎么改写
class SelectionActionData {
  const SelectionActionData({
    required this.id,
    required this.label,
    this.icon = '',
    this.disabled = false,
  });

  final String id;
  final String label;

  /// 图标名，取自共享图标表
  final String icon;
  final bool disabled;
}

/// 选区上限。超过这个长度就不给动作——太长的选区改写出来读者无法逐句核对
const int selectionMax = 2000;

/// 选区文本的清理。
///
/// 折行处的换行换成空格而不是删掉：中英混排里删掉换行会把
/// 「the quick\nbrown」粘成「quickbrown」。段落之间的空行保留——
/// 那是作者的分段，不是多余空白。
String cleanSelection(String text) {
  final normalized = text.replaceAll(RegExp(r'\r\n?'), '\n');
  return normalized
      .split(RegExp(r'\n{2,}'))
      .map((para) => para.replaceAll(RegExp(r'\s+'), ' ').trim())
      .where((para) => para.isNotEmpty)
      .join('\n\n');
}

/// 这个选区值不值得弹出动作条。只选中空白不算——拖选时手一抖就会划过一个空格
bool hasSelection(String text, {int max = selectionMax}) {
  final clean = cleanSelection(text);
  return clean.isNotEmpty && clean.length <= max;
}

/// 选区过长：有内容但超出上限。与 hasSelection 分开，好给出不同的说法
bool selectionTooLong(String text, {int max = selectionMax}) =>
    cleanSelection(text).length > max;

/// 选区的字数。按清理后的长度数，不数原文里带了多少缩进空格
int selectionCount(String text) => cleanSelection(text).length;

/// 引文摘要：动作条上回显选了什么，太长就从中间省略
String selectionExcerpt(String text, {int max = 48}) {
  final clean = cleanSelection(text).replaceAll(RegExp(r'\n+'), ' ');
  if (clean.length <= max) return clean;
  // 从中间省略而不是掐尾：掐尾之后好几段不同的选区看起来一模一样
  final head = ((max - 1) / 2).ceil();
  final tail = max - 1 - head;
  return '${clean.substring(0, head)}…${clean.substring(clean.length - tail)}';
}

enum SelectionPlacement { top, bottom }

/// 动作条相对选区的落点
class SelectionAnchor {
  const SelectionAnchor({required this.x, required this.y, required this.placement});

  final double x;
  final double y;
  final SelectionPlacement placement;
}

/// 动作条摆哪儿。
///
/// 默认开在选区上方——手指刚划过的那片正被自己遮着，开在下方等于让用户
/// 挪开手才看得见。上方放不下时才翻到下方，判定复用 shouldFlipUp 的同一套算法。
/// 横向以选区中点为准再夹回视口，否则选区贴着右边缘时动作条一半在屏幕外。
SelectionAnchor selectionAnchor(
  IOverlayRect selection,
  double barWidth,
  double barHeight,
  double viewportWidth,
  double viewportHeight, {
  double gap = 8,
}) {
  final preferBelow =
      !shouldFlipUp(selection.y, selection.height, barHeight + gap, viewportHeight, padding: gap);
  final above = selection.y - barHeight - gap;
  final placement =
      preferBelow && above < gap ? SelectionPlacement.bottom : SelectionPlacement.top;

  final centered = selection.x + selection.width / 2 - barWidth / 2;
  final maxX = viewportWidth - barWidth - gap;
  final clampedMax = maxX < gap ? gap : maxX;
  var x = centered < gap ? gap : centered;
  if (x > clampedMax) x = clampedMax;

  return SelectionAnchor(
    x: x,
    y: placement == SelectionPlacement.top
        ? (above < gap ? gap : above)
        : selection.y + selection.height + gap,
    placement: placement,
  );
}
