import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 下拉菜单里的一项。
///
/// 分隔线与分组标题也走同一个类型：菜单是一个有序序列，把它们拆成两个列表
/// 会让调用方自己去拼顺序，反而更容易出错。
class IDropdownItem {
  const IDropdownItem({
    required this.key,
    this.label,
    this.icon,
    this.hint,
    this.disabled = false,
    this.danger = false,
    this.divider = false,
    this.group,
  });

  /// 分隔线
  const IDropdownItem.divider({required this.key})
      : label = null,
        icon = null,
        hint = null,
        disabled = true,
        danger = false,
        divider = true,
        group = null;

  /// 分组标题
  const IDropdownItem.group({required this.key, required String title})
      : label = null,
        icon = null,
        hint = null,
        disabled = true,
        danger = false,
        divider = false,
        group = title;

  final String key;
  final String? label;
  final String? icon;

  /// 快捷键提示，只作展示，不代为绑定
  final String? hint;
  final bool disabled;

  /// 危险操作单独着色，删除类命令不应与普通命令同样朴素
  final bool danger;
  final bool divider;
  final String? group;
}

/// 下拉菜单：收纳次级操作，避免一行摆满按钮。
///
/// 位置由触发器的屏幕坐标算出并交给 showMenu，因此菜单贴着触发元素出现，
/// 而不是飘到屏幕另一头；Flutter 自己会把超出屏幕的部分推回可视区。
class IDropdown extends StatelessWidget {
  const IDropdown({
    super.key,
    required this.child,
    required this.items,
    this.onSelect,
    this.disabled = false,
  });

  final Widget child;
  final List<IDropdownItem> items;
  final ValueChanged<String>? onSelect;
  final bool disabled;

  Future<void> _open(BuildContext context) async {
    final c = iColorsOf(context);
    final box = context.findRenderObject() as RenderBox;
    final overlay = Overlay.of(context).context.findRenderObject() as RenderBox;
    final topLeft = box.localToGlobal(Offset.zero, ancestor: overlay);

    final selected = await showMenu<String>(
      context: context,
      color: c.bgElevated,
      position: RelativeRect.fromLTRB(
        topLeft.dx,
        topLeft.dy + box.size.height + IDesignTokensLight.spacing1,
        overlay.size.width - topLeft.dx - box.size.width,
        0,
      ),
      constraints: const BoxConstraints(minWidth: 160),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
      ),
      items: [
        for (final item in items)
          if (item.divider)
            PopupMenuItem<String>(
              enabled: false,
              height: 1,
              padding: EdgeInsets.zero,
              child: Divider(height: 1, thickness: 1, color: c.hairline),
            )
          else if (item.group != null)
            PopupMenuItem<String>(
              enabled: false,
              height: 28,
              child: Text(
                item.group!,
                style: TextStyle(
                  fontSize: IDesignTokensLight.fontSizeXs,
                  color: c.textTertiary,
                ),
              ),
            )
          else
            PopupMenuItem<String>(
              value: item.key,
              enabled: !item.disabled,
              child: Row(
                children: [
                  if (item.icon != null) ...[
                    IIcon(
                      name: item.icon!,
                      size: 16,
                      color: item.danger ? c.danger : c.text,
                    ),
                    const SizedBox(width: IDesignTokensLight.spacing2),
                  ],
                  Expanded(
                    child: Text(
                      item.label ?? '',
                      style: TextStyle(
                        fontSize: IDesignTokensLight.fontSizeSm,
                        color: item.disabled
                            ? c.textTertiary
                            : (item.danger ? c.danger : c.text),
                      ),
                    ),
                  ),
                  // 快捷键提示右对齐，一列键位是齐的，比跟在文字后面好扫
                  if (item.hint != null)
                    Text(
                      item.hint!,
                      style: TextStyle(
                        fontSize: IDesignTokensLight.fontSizeXs,
                        color: c.textTertiary,
                      ),
                    ),
                ],
              ),
            ),
      ],
    );

    if (selected != null) onSelect?.call(selected);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: disabled ? null : () => _open(context),
      child: child,
    );
  }
}
