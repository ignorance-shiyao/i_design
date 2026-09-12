import 'package:flutter/material.dart';
import '../logic/command.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_config_provider.dart';
import 'i_empty.dart';
import 'i_icon.dart';

/// 命令搜索：一个搜索框，一串实时过滤的结果。
///
/// 它解决的是「东西太多，翻不动」——超过几十项的菜单、设置、文档页，
/// 再怎么分组都不如直接搜。匹配与排序走公共层，同一个词在各端给出的第一条一致。
///
/// 这一端按内容面板给出，交给调用方用 `showDialog` 之类的方式唤起：
/// Flutter 的弹层有自己的一套（路由、返回键、无障碍焦点陷阱），
/// 组件自己再包一层遮罩只会和平台的行为打架。
class ICommandSearch extends StatefulWidget {
  const ICommandSearch({
    super.key,
    required this.items,
    this.onSelect,
    this.placeholder,
    this.limit = 20,
  });

  /// 可搜的全部条目
  final List<ICommandItem> items;
  final ValueChanged<ICommandItem>? onSelect;
  final String? placeholder;

  /// 最多显示多少条
  final int limit;

  @override
  State<ICommandSearch> createState() => _ICommandSearchState();
}

class _ICommandSearchState extends State<ICommandSearch> {
  final _controller = TextEditingController();
  String _keyword = '';

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final locale = IConfigProvider.localeOf(context);
    final label = widget.placeholder ?? locale.search;
    final matches = searchCommands(widget.items, _keyword, limit: widget.limit);

    return Container(
      constraints: const BoxConstraints(maxWidth: 560, maxHeight: 480),
      decoration: BoxDecoration(
        color: c.bg,
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: IDesignTokensLight.spacing5,
              vertical: IDesignTokensLight.spacing4,
            ),
            child: Row(
              children: [
                IIcon('search', size: 16, color: c.textTertiary),
                const SizedBox(width: IDesignTokensLight.spacing3),
                Expanded(
                  child: TextField(
                    controller: _controller,
                    autofocus: true,
                    style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeMd),
                    decoration: InputDecoration(
                      isDense: true,
                      border: InputBorder.none,
                      hintText: label,
                      hintStyle: TextStyle(color: c.textTertiary),
                    ),
                    onChanged: (value) => setState(() => _keyword = value),
                  ),
                ),
              ],
            ),
          ),
          // 四边等宽的发丝线，不靠加粗某一边表达层次
          Divider(height: 1, thickness: 1, color: c.hairline),
          Flexible(
            child: matches.isEmpty
                // 空态给的是「换个词」而不是「没有结果」：后者只是把已经看到的事实重复一遍
                ? const IEmpty(type: IEmptyType.search, compact: true)
                : ListView.builder(
                    shrinkWrap: true,
                    padding: const EdgeInsets.all(IDesignTokensLight.spacing2),
                    itemCount: matches.length,
                    itemBuilder: (context, index) => _row(c, matches[index]),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _row(IColors c, ICommandMatch match) {
    final item = match.item;
    return InkWell(
      borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
      onTap: () => widget.onSelect?.call(item),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: IDesignTokensLight.spacing3,
          vertical: IDesignTokensLight.spacing2,
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text.rich(TextSpan(children: _spans(c, item.label, match.ranges))),
                  if (item.description != null)
                    Text(
                      item.description!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeXs),
                    ),
                ],
              ),
            ),
            if (item.group != null)
              Text(
                item.group!,
                style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeXs),
              ),
          ],
        ),
      ),
    );
  }

  /// 高亮命中的那几个字：把整行都标起来反而看不出重点
  List<TextSpan> _spans(IColors c, String label, List<List<int>> ranges) {
    final base = TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeSm);
    if (ranges.isEmpty) return [TextSpan(text: label, style: base)];
    final from = ranges.first[0];
    final to = ranges.first[1];
    return [
      TextSpan(text: label.substring(0, from), style: base),
      TextSpan(
        text: label.substring(from, to),
        style: base.copyWith(color: c.brand, fontWeight: FontWeight.w500),
      ),
      TextSpan(text: label.substring(to), style: base),
    ].where((s) => s.text!.isNotEmpty).toList();
  }
}
