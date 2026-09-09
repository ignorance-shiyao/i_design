import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import '../logic/tree.dart';
import '../logic/menu.dart';
import 'i_icon.dart';

/// 导航菜单项。有 children 的是分组，本身不承担选中。
class IMenuItem {
  const IMenuItem({
    required this.key,
    required this.label,
    this.icon,
    this.disabled = false,
    this.children = const [],
  });

  final String key;
  final String label;
  final String? icon;
  final bool disabled;
  final List<IMenuItem> children;

  ITreeNode toNode() => ITreeNode(
        key: key,
        label: label,
        disabled: disabled,
        children: children.map((c) => c.toNode()).toList(),
      );
}

/// 导航菜单：侧栏的多级入口。
///
/// 展开规则走共享的 logic/menu：选中项的祖先自动展开、手风琴收起同层但保留祖先。
class IMenu extends StatefulWidget {
  const IMenu({
    super.key,
    required this.items,
    this.value,
    this.accordion = false,
    this.collapsed = false,
    this.onChanged,
  });

  final List<IMenuItem> items;
  final String? value;

  /// 手风琴：同层只展开一个
  final bool accordion;

  /// 收起为图标栏
  final bool collapsed;
  final ValueChanged<String>? onChanged;

  @override
  State<IMenu> createState() => _IMenuState();
}

class _IMenuState extends State<IMenu> {
  late Map<String, ITreeEntity> _entities;
  List<String> _open = const [];

  @override
  void initState() {
    super.initState();
    _rebuild();
  }

  @override
  void didUpdateWidget(IMenu oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value || oldWidget.items != widget.items) {
      _rebuild();
    }
  }

  void _rebuild() {
    _entities = flattenTree(widget.items.map((i) => i.toNode()).toList());
    final value = widget.value;
    if (value != null && value.isNotEmpty) {
      _open = openKeysFor(_entities, value, _open);
    }
  }

  void _toggle(String key) {
    setState(() {
      _open = widget.accordion
          ? accordionOpenKeys(_entities, _open, key)
          : (_open.contains(key)
              ? (_open.toList()..remove(key))
              : (_open.toList()..add(key)));
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        for (final item in widget.items)
          if (item.children.isNotEmpty) ..._buildGroup(context, item) else _buildItem(context, item, 0),
      ],
    );
  }

  List<Widget> _buildGroup(BuildContext context, IMenuItem item) {
    final c = iColorsOf(context);
    final expanded = _open.contains(item.key);
    return [
      InkWell(
        onTap: () => _toggle(item.key),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
        child: Container(
          height: 42,
          padding: EdgeInsets.symmetric(
            horizontal: widget.collapsed ? 0 : IDesignTokensLight.spacing3,
          ),
          child: Row(
            mainAxisAlignment:
                widget.collapsed ? MainAxisAlignment.center : MainAxisAlignment.start,
            children: [
              if (item.icon != null)
                IIcon(name: item.icon!, size: 16, color: c.textSecondary),
              if (!widget.collapsed) ...[
                const SizedBox(width: IDesignTokensLight.spacing2),
                Expanded(
                  child: Text(
                    item.label,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: IDesignTokensLight.fontSizeMd,
                      color: c.textSecondary,
                    ),
                  ),
                ),
                AnimatedRotation(
                  turns: expanded ? 0.25 : 0,
                  duration: IDesignTokensLight.motionFast,
                  child: IIcon(
                    name: 'chevron-right',
                    size: 14,
                    color: c.textTertiary,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
      if (expanded && !widget.collapsed)
        for (final child in item.children) _buildItem(context, child, 32),
    ];
  }

  Widget _buildItem(BuildContext context, IMenuItem item, double indent) {
    final c = iColorsOf(context);
    final active = widget.value == item.key;

    return InkWell(
      onTap: item.disabled ? null : () => widget.onChanged?.call(item.key),
      borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
      child: Container(
        height: 42,
        padding: EdgeInsets.only(
          left: widget.collapsed ? 0 : indent + IDesignTokensLight.spacing3,
          right: widget.collapsed ? 0 : IDesignTokensLight.spacing3,
        ),
        decoration: BoxDecoration(
          // 选中态只用底色与文字色，不加边线标记
          color: active ? c.brandSubtle : null,
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
        ),
        child: Row(
          mainAxisAlignment:
              widget.collapsed ? MainAxisAlignment.center : MainAxisAlignment.start,
          children: [
            if (item.icon != null)
              IIcon(
                name: item.icon!,
                size: 16,
                color: item.disabled
                    ? c.textTertiary
                    : (active ? c.brand : c.textSecondary),
              ),
            if (!widget.collapsed) ...[
              const SizedBox(width: IDesignTokensLight.spacing2),
              Expanded(
                child: Text(
                  item.label,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: IDesignTokensLight.fontSizeMd,
                    fontWeight: active ? FontWeight.w500 : FontWeight.w400,
                    color: item.disabled
                        ? c.textTertiary
                        : (active ? c.brand : c.textSecondary),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
