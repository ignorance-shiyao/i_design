import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import '../logic/anchor.dart';

/// 页内锚点的一项
class IAnchorItem {
  const IAnchorItem({required this.key, required this.label, this.level = 2});
  final String key;
  final String label;

  /// 标题层级，用于缩进；2 为一级
  final int level;
}

/// 页内锚点：长文档的章节跳转与高亮。
///
/// 「当前章节」的判定走共享的 activeAnchor，含触底选中最后一项这条规则——
/// 否则页面底部的短章节永远高亮不到。
class IAnchor extends StatefulWidget {
  const IAnchor({
    super.key,
    required this.items,
    required this.controller,

    /// 各章节相对内容顶端的位置，由调用方在布局后测得
    required this.offsets,
    this.offset = 80,
    this.onChanged,
  });

  final List<IAnchorItem> items;
  final ScrollController controller;
  final Map<String, double> offsets;
  final double offset;
  final ValueChanged<String>? onChanged;

  @override
  State<IAnchor> createState() => _IAnchorState();
}

class _IAnchorState extends State<IAnchor> {
  String _active = '';

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_update);
    WidgetsBinding.instance.addPostFrameCallback((_) => _update());
  }

  @override
  void dispose() {
    widget.controller.removeListener(_update);
    super.dispose();
  }

  void _update() {
    if (!widget.controller.hasClients) return;
    final position = widget.controller.position;
    final targets = widget.items
        .where((item) => widget.offsets.containsKey(item.key))
        .map((item) => IAnchorTarget(item.key, widget.offsets[item.key]!))
        .toList();

    final next = activeAnchor(
      targets,
      scrollTop: position.pixels,
      viewportHeight: position.viewportDimension,
      documentHeight: position.maxScrollExtent + position.viewportDimension,
      offset: widget.offset,
    );
    if (next != _active) {
      setState(() => _active = next);
      widget.onChanged?.call(next);
    }
  }

  void _jump(String key) {
    final top = widget.offsets[key];
    if (top == null) return;
    widget.controller.animateTo(
      anchorScrollTop(top, widget.offset),
      duration: IDesignTokensLight.motionBase,
      curve: Curves.easeOut,
    );
    // 立即更新高亮：动画期间不等滚动回调，否则点了半天没反应
    setState(() => _active = key);
    widget.onChanged?.call(key);
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        for (final item in widget.items)
          InkWell(
            onTap: () => _jump(item.key),
            borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
            child: Container(
              padding: EdgeInsets.only(
                left: IDesignTokensLight.spacing3 + (item.level - 2) * 12,
                right: IDesignTokensLight.spacing3,
                top: IDesignTokensLight.spacing1,
                bottom: IDesignTokensLight.spacing1,
              ),
              decoration: BoxDecoration(
                // 当前章节只用底色与文字色，不加左侧竖条
                color: _active == item.key ? c.brandSubtle : null,
                borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
              ),
              child: Text(
                item.label,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: IDesignTokensLight.fontSizeSm,
                  fontWeight:
                      _active == item.key ? FontWeight.w500 : FontWeight.w400,
                  color: _active == item.key ? c.brand : c.textTertiary,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
