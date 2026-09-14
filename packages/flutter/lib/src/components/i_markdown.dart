import 'package:flutter/material.dart';
import '../logic/markdown.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_code_block.dart';

/// Markdown 渲染。
///
/// 解析与 Web 端同一套规则（logic/markdown.dart），这里只负责渲染。
/// 不引 HTML 渲染库：那等于把不可信内容交给它去解释，而这些内容来自模型与后端。
class IMarkdown extends StatelessWidget {
  const IMarkdown({super.key, this.source = '', this.compact = false, this.onLinkTap});

  final String source;

  /// 紧凑排版：用在气泡、卡片这类空间紧张的地方
  final bool compact;

  /// 点链接时交给应用处理。组件自己不打开地址——打开什么是应用的决定
  final void Function(String href)? onLinkTap;

  @override
  Widget build(BuildContext context) {
    final blocks = parseMarkdown(source);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: _blocks(context, blocks),
    );
  }

  List<Widget> _blocks(BuildContext context, List<MdBlock> blocks) {
    final c = iColorsOf(context);
    final gap = compact ? IDesignTokensLight.spacing2 : IDesignTokensLight.spacing3;
    final out = <Widget>[];

    for (final block in blocks) {
      if (out.isNotEmpty) out.add(SizedBox(height: gap));
      switch (block.type) {
        case MdBlockType.heading:
          out.add(Text.rich(
            _inline(context, block.children),
            style: TextStyle(
              color: c.text,
              fontWeight: FontWeight.w600,
              fontSize: switch (block.level) {
                1 => IDesignTokensLight.fontSize2xl,
                2 => IDesignTokensLight.fontSizeXl,
                3 => IDesignTokensLight.fontSizeLg,
                _ => IDesignTokensLight.fontSizeMd,
              },
            ),
          ));
        case MdBlockType.paragraph:
          out.add(Text.rich(
            _inline(context, block.children),
            style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeMd, height: 1.7),
          ));
        case MdBlockType.code:
          // 还没收完的代码块不给复制按钮：复制到一半的代码比不给复制更坑
          out.add(ICodeBlock(code: block.text, lang: block.lang, copyable: !block.open));
        case MdBlockType.quote:
          out.add(Container(
            padding: const EdgeInsets.symmetric(
              horizontal: IDesignTokensLight.spacing3,
              vertical: IDesignTokensLight.spacing2,
            ),
            decoration: BoxDecoration(
              // 四边等宽的发丝线加淡底色，不用加粗的左边线
              border: Border.all(color: c.hairline),
              borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
              color: c.bgSubtle,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: _blocks(context, block.blocks),
            ),
          ));
        case MdBlockType.list:
          out.add(Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (var index = 0; index < block.items.length; index += 1)
                Padding(
                  padding: const EdgeInsets.only(bottom: IDesignTokensLight.spacing1),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 24,
                        child: Text(
                          block.ordered ? '${block.start + index}.' : '•',
                          style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeMd),
                        ),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: _blocks(context, block.items[index]),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ));
        case MdBlockType.table:
          // 表格自己横向滚动：让整页能左右拖比表格里滚更糟
          out.add(SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Table(
              defaultColumnWidth: const IntrinsicColumnWidth(),
              border: TableBorder.all(color: c.hairline),
              children: [
                TableRow(
                  decoration: BoxDecoration(color: c.bgSubtle),
                  children: [for (final cell in block.head) _cell(context, cell, bold: true)],
                ),
                for (final row in block.rows)
                  TableRow(children: [for (final cell in row) _cell(context, cell)]),
              ],
            ),
          ));
        case MdBlockType.hr:
          out.add(Container(height: 1, color: c.hairline));
      }
    }
    return out;
  }

  Widget _cell(BuildContext context, List<MdInline> nodes, {bool bold = false}) {
    final c = iColorsOf(context);
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: IDesignTokensLight.spacing3,
        vertical: IDesignTokensLight.spacing2,
      ),
      child: Text.rich(
        _inline(context, nodes),
        style: TextStyle(
          color: c.text,
          fontSize: IDesignTokensLight.fontSizeSm,
          fontWeight: bold ? FontWeight.w500 : FontWeight.w400,
        ),
      ),
    );
  }

  TextSpan _inline(BuildContext context, List<MdInline> nodes, {TextStyle? inherited}) {
    final c = iColorsOf(context);
    return TextSpan(
      children: nodes.map((node) {
        switch (node.type) {
          case MdInlineType.code:
            return TextSpan(
              text: node.text,
              style: (inherited ?? const TextStyle()).copyWith(
                fontFamily: 'monospace',
                backgroundColor: c.bgMuted,
              ),
            );
          case MdInlineType.strong:
            return _inline(context, node.children,
                inherited: (inherited ?? const TextStyle()).copyWith(fontWeight: FontWeight.w600));
          case MdInlineType.em:
            return _inline(context, node.children,
                inherited: (inherited ?? const TextStyle()).copyWith(fontStyle: FontStyle.italic));
          case MdInlineType.del:
            return _inline(context, node.children,
                inherited: (inherited ?? const TextStyle())
                    .copyWith(decoration: TextDecoration.lineThrough));
          case MdInlineType.link:
            return _inline(context, node.children,
                inherited: (inherited ?? const TextStyle()).copyWith(color: c.brandText));
          case MdInlineType.image:
            // 图片在行内流里不好排版，退到替代文本；整图由调用方用 IImage 渲染
            return TextSpan(text: node.alt, style: inherited);
          case MdInlineType.text:
            return TextSpan(text: node.text, style: inherited);
        }
      }).toList(),
    );
  }
}
