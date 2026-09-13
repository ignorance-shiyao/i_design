import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../logic/diff.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_config_provider.dart';
import 'i_icon.dart';

/// 代码块：行号、复制与统一 diff 视图。
///
/// 这一端不做语法高亮：Web 端的高亮靠一组正则切 token，移植过来要连同
/// 六种语言的词法规则一起搬，而 Flutter 上的代码块多半是「展示一段补丁」，
/// 增删的色块与行号才是读者要的信息。**宁可不高亮，也不要高亮错**——
/// 半套移植的规则会在某些语言上把字符串与注释标反，比纯文本更难读。
/// 行的比对走公共层，与 Web 端逐行一致。
class ICodeBlock extends StatelessWidget {
  const ICodeBlock({
    super.key,
    required this.code,
    this.filename = '',
    this.lineNumbers = true,
    this.copyable = true,
    this.before,
  });

  final String code;

  /// 标题栏左侧的文件名
  final String filename;
  final bool lineNumbers;
  final bool copyable;

  /// 改动前的内容。给了就切成统一 diff 视图
  final String? before;

  String get _source => code.replaceAll(RegExp(r'^\n+'), '').trimRight();

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final locale = IConfigProvider.localeOf(context);
    final isDiff = before != null;
    final lines = isDiff
        ? diffLines(before!.replaceAll(RegExp(r'^\n+'), '').trimRight(), _source)
        : [
            for (final (i, text) in _source.split('\n').indexed)
              IDiffLine(kind: IDiffKind.same, text: text, before: i + 1),
          ];
    final stat = diffStat(lines);

    return Container(
      decoration: BoxDecoration(
        color: c.codeBg,
        border: Border.all(color: c.codeBorder),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _bar(context, c, locale, isDiff, stat),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [for (final line in lines) _line(c, line, isDiff)],
            ),
          ),
        ],
      ),
    );
  }

  Widget _bar(
    BuildContext context,
    IColors c,
    dynamic locale,
    bool isDiff,
    ({int added, int removed}) stat,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: c.codeBar,
        border: Border(bottom: BorderSide(color: c.codeBorder)),
      ),
      child: Row(
        children: [
          Text(
            filename.isEmpty ? 'text' : filename,
            style: TextStyle(color: c.codeMuted, fontSize: 12, fontFamily: 'monospace'),
          ),
          if (isDiff) ...[
            const SizedBox(width: 12),
            // 改动统计用文字而不是只用颜色：灰度下「绿加红删」读不出来，「+13」读得出来
            Text('+${stat.added}', style: TextStyle(color: c.success, fontSize: 12)),
            const SizedBox(width: 6),
            Text('−${stat.removed}', style: TextStyle(color: c.danger, fontSize: 12)),
          ],
          const Spacer(),
          if (copyable)
            GestureDetector(
              onTap: () => Clipboard.setData(ClipboardData(text: _source)),
              child: Semantics(
                button: true,
                label: locale.copy as String,
                child: Row(
                  children: [
                    IIcon('copy', size: 13, color: c.codeMuted),
                    const SizedBox(width: 4),
                    Text(locale.copy as String, style: TextStyle(color: c.codeMuted, fontSize: 12)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _line(IColors c, IDiffLine line, bool isDiff) {
    final background = switch (line.kind) {
      IDiffKind.add => c.success.withValues(alpha: 0.12),
      IDiffKind.remove => c.danger.withValues(alpha: 0.12),
      IDiffKind.same => null,
    };
    final sign = switch (line.kind) {
      IDiffKind.add => '+',
      IDiffKind.remove => '−',
      IDiffKind.same => ' ',
    };

    return Container(
      color: background,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        children: [
          if (lineNumbers)
            SizedBox(
              width: 28,
              child: Text(
                '${line.before ?? ''}',
                textAlign: TextAlign.right,
                style: TextStyle(color: c.codeMuted, fontSize: 13, fontFamily: 'monospace'),
              ),
            ),
          if (lineNumbers && isDiff)
            SizedBox(
              width: 28,
              child: Text(
                '${line.after ?? ''}',
                textAlign: TextAlign.right,
                style: TextStyle(color: c.codeMuted, fontSize: 13, fontFamily: 'monospace'),
              ),
            ),
          const SizedBox(width: 8),
          // 行首符号是增删的第二条线索，与底色一起给，不靠颜色单打独斗
          if (isDiff) Text(sign, style: TextStyle(color: c.codeMuted, fontSize: 13, fontFamily: 'monospace')),
          const SizedBox(width: 4),
          Text(
            line.text,
            style: TextStyle(color: c.codeText, fontSize: 13, fontFamily: 'monospace', height: 1.7),
          ),
        ],
      ),
    );
  }
}
