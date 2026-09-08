import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

@immutable
class IListItem {
  const IListItem({
    required this.title,
    this.description,
    this.meta = const [],
    this.disabled = false,
  });

  final String title;
  final String? description;

  /// 附加信息，如时间、作者
  final List<String> meta;
  final bool disabled;
}

/// 结构化的条目列表。
///
/// 与 ITable 的分工：表格用于横向比较多个字段，列表用于逐条阅读。
/// 字段超过三个还在用列表，说明其实需要的是表格。
class IList extends StatelessWidget {
  const IList({
    super.key,
    required this.items,
    this.plain = false,
    this.header,
    this.footer,
    this.onSelect,
    this.mediaBuilder,
    this.extraBuilder,
  });

  final List<IListItem> items;

  /// 去掉外框与底色，用于嵌在卡片里
  final bool plain;
  final String? header;
  final String? footer;
  final void Function(IListItem item, int index)? onSelect;
  final Widget Function(IListItem item, int index)? mediaBuilder;
  final Widget Function(IListItem item, int index)? extraBuilder;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    Widget band(String text, {required bool top}) => Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(
            horizontal: IDesignTokensLight.spacing4,
            vertical: IDesignTokensLight.spacing3,
          ),
          decoration: BoxDecoration(
            color: c.bgSubtle,
            border: Border(
              top: top ? BorderSide(color: c.hairline) : BorderSide.none,
              bottom: top ? BorderSide.none : BorderSide(color: c.hairline),
            ),
          ),
          child: Text(
            text,
            style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeSm),
          ),
        );

    return Container(
      decoration: BoxDecoration(
        color: plain ? null : c.bgElevated,
        border: plain ? null : Border.all(color: c.border),
        borderRadius: plain ? null : BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      clipBehavior: plain ? Clip.none : Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (header != null) band(header!, top: false),
          for (var i = 0; i < items.length; i++)
            InkWell(
              onTap: onSelect == null || items[i].disabled
                  ? null
                  : () => onSelect!(items[i], i),
              child: Container(
                padding: const EdgeInsets.all(IDesignTokensLight.spacing4),
                decoration: BoxDecoration(
                  border: i == 0 ? null : Border(top: BorderSide(color: c.hairline)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (mediaBuilder != null) ...[
                      mediaBuilder!(items[i], i),
                      const SizedBox(width: IDesignTokensLight.spacing3),
                    ],
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            items[i].title,
                            style: TextStyle(
                              color: c.text,
                              fontSize: IDesignTokensLight.fontSizeMd,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          if (items[i].description != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 2),
                              child: Text(
                                items[i].description!,
                                style: TextStyle(
                                  color: c.textSecondary,
                                  fontSize: IDesignTokensLight.fontSizeSm,
                                  height: 1.7,
                                ),
                              ),
                            ),
                          if (items[i].meta.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: IDesignTokensLight.spacing2),
                              child: Wrap(
                                spacing: IDesignTokensLight.spacing3,
                                children: [
                                  for (final meta in items[i].meta)
                                    Text(
                                      meta,
                                      style: TextStyle(
                                        color: c.textTertiary,
                                        fontSize: IDesignTokensLight.fontSizeXs,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                    if (extraBuilder != null) ...[
                      const SizedBox(width: IDesignTokensLight.spacing3),
                      extraBuilder!(items[i], i),
                    ],
                  ],
                ),
              ),
            ),
          if (footer != null) band(footer!, top: true),
        ],
      ),
    );
  }
}
