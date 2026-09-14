import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_code_block.dart';
import 'i_icon.dart';
import 'i_markdown.dart';

/// 消息里的一段。字段与 contracts/run.ts 的 MessagePart 对应。
class IMessagePart {
  const IMessagePart({
    required this.id,
    required this.kind,
    this.text = '',
    this.complete = false,
    this.meta = const {},
  });

  final String id;

  /// text / reasoning / code / tool / artifact / citation
  final String kind;
  final String text;
  final bool complete;
  final Map<String, String> meta;
}

/// 一条消息的多段混排。
///
/// 模型的一次回答不是一块纯文本：正文、推理、代码、工具调用、产物、引用
/// 会交替出现，而且每一段的收尾时间不同。拼成一个字符串再渲染，
/// 会丢掉「这一段还没收完」这个信息——而那正是流式界面最需要表达的东西。
class IMessageParts extends StatelessWidget {
  const IMessageParts({
    super.key,
    this.parts = const [],
    this.sources = const {},
    this.compact = false,
    this.onCite,
  });

  final List<IMessagePart> parts;

  /// 来源 id → 标题，用于把角标写成人能读的东西
  final Map<String, String> sources;
  final bool compact;
  final void Function(String sourceId)? onCite;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final gap = compact ? IDesignTokensLight.spacing2 : IDesignTokensLight.spacing3;

    // 引用按出现顺序编号：读者看到的是 [1][2]，不是一串 uuid
    final order = <String, int>{};
    for (final part in parts) {
      if (part.kind != 'citation') continue;
      final id = part.meta['sourceId'] ?? part.text;
      order.putIfAbsent(id, () => order.length + 1);
    }

    final children = <Widget>[];
    for (final part in parts) {
      if (children.isNotEmpty) children.add(SizedBox(height: gap));
      switch (part.kind) {
        case 'text':
          children.add(IMarkdown(source: part.text, compact: compact));
        case 'reasoning':
          children.add(_panel(
            c,
            title: '推理过程${part.complete ? '' : '（进行中）'}',
            child: IMarkdown(source: part.text, compact: true),
          ));
        case 'code':
          children.add(ICodeBlock(code: part.text, lang: part.meta['lang'] ?? '', copyable: part.complete));
        case 'tool':
          children.add(_chip(c, 'code', part.meta['name'] ?? '工具调用',
              part.complete ? '已完成' : '执行中'));
        case 'artifact':
          children.add(_chip(c, 'file-text', part.meta['title'] ?? '产物',
              part.meta['version'] == null ? '' : 'v${part.meta['version']}'));
        case 'citation':
          final id = part.meta['sourceId'] ?? part.text;
          children.add(Semantics(
            button: true,
            label: '引用 ${order[id]}：${sources[id] ?? id}',
            child: GestureDetector(
              onTap: () => onCite?.call(id),
              child: Text('[${order[id]}]',
                  style: TextStyle(color: c.brandText, fontSize: IDesignTokensLight.fontSizeXs)),
            ),
          ));
      }
    }

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: children);
  }

  Widget _panel(IColors c, {required String title, required Widget child}) => Container(
        padding: const EdgeInsets.symmetric(
          horizontal: IDesignTokensLight.spacing3,
          vertical: IDesignTokensLight.spacing2,
        ),
        decoration: BoxDecoration(
          border: Border.all(color: c.hairline),
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
          color: c.bgSubtle,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              IIcon(name: 'sparkle', size: 14, color: c.textSecondary),
              const SizedBox(width: IDesignTokensLight.spacing2),
              Text(title, style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm)),
            ]),
            const SizedBox(height: IDesignTokensLight.spacing2),
            child,
          ],
        ),
      );

  Widget _chip(IColors c, String icon, String label, String state) => Container(
        padding: const EdgeInsets.symmetric(
          horizontal: IDesignTokensLight.spacing3,
          vertical: IDesignTokensLight.spacing1,
        ),
        decoration: BoxDecoration(
          border: Border.all(color: c.hairline),
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusFull),
          color: c.bgElevated,
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          IIcon(name: icon, size: 14, color: c.textSecondary),
          const SizedBox(width: IDesignTokensLight.spacing2),
          Text(label, style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeSm)),
          if (state.isNotEmpty) ...[
            const SizedBox(width: IDesignTokensLight.spacing2),
            Text(state, style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeXs)),
          ],
        ]),
      );
}
