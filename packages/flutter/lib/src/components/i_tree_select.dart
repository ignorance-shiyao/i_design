import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import '../logic/tree.dart';
import 'i_icon.dart';
import 'i_tree.dart';

/// 树选择：从层级数据里挑一个或多个节点。
///
/// 触发器沿用 Select 的外观，面板里装的就是 ITree 本身——
/// 展开、半选、禁用继承都不在这里重写。
class ITreeSelect extends StatefulWidget {
  const ITreeSelect({
    super.key,
    required this.data,
    this.value,
    this.checked = const [],
    this.multiple = false,
    this.placeholder = '请选择',
    this.disabled = false,

    /// 单选时是否显示完整路径，如「平台 / 权限 / 角色」
    this.showPath = true,
    this.separator = ' / ',

    /// 多选时最多展示几项，超出折叠为「等 N 项」
    this.maxDisplay = 2,
    this.onChanged,
    this.onCheckedChanged,
  });

  final List<ITreeNode> data;
  final String? value;
  final List<String> checked;
  final bool multiple;
  final String placeholder;
  final bool disabled;
  final bool showPath;
  final String separator;
  final int maxDisplay;
  final ValueChanged<String>? onChanged;
  final ValueChanged<List<String>>? onCheckedChanged;

  @override
  State<ITreeSelect> createState() => _ITreeSelectState();
}

class _ITreeSelectState extends State<ITreeSelect> {
  /*
   * 多选时只展示叶子：父节点在选中集合里只是「它的子节点都选了」的推论，
   * 把它也列出来会让用户以为多选了一项。
   */
  String _display(Map<String, ITreeEntity> entities) {
    if (widget.multiple) {
      final leaves = leafKeys(entities, widget.checked);
      if (leaves.isEmpty) return '';
      final labels =
          leaves.map((key) => entities[key]?.node.label ?? key).toList();
      if (labels.length <= widget.maxDisplay) return labels.join('、');
      return '${labels.take(widget.maxDisplay).join('、')} 等 ${labels.length} 项';
    }
    final value = widget.value;
    if (value == null || value.isEmpty) return '';
    return widget.showPath
        ? labelPath(entities, value).join(widget.separator)
        : (entities[value]?.node.label ?? value);
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final entities = flattenTree(widget.data);
    final display = _display(entities);

    return PopupMenuButton<void>(
      enabled: !widget.disabled,
      color: c.bgElevated,
      offset: const Offset(0, 40),
      constraints: const BoxConstraints(minWidth: 240, maxWidth: 360),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
      ),
      itemBuilder: (context) => [
        PopupMenuItem<void>(
          enabled: false,
          padding: const EdgeInsets.symmetric(
            vertical: IDesignTokensLight.spacing2,
          ),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 300),
            child: SingleChildScrollView(
              child: ITree(
                data: widget.data,
                checkable: widget.multiple,
                checked: widget.checked,
                selected: widget.value,
                onCheckedChanged: widget.onCheckedChanged,
                onSelect: (node) {
                  widget.onChanged?.call(node.key);
                  // 单选选完即收起；多选要留着让用户继续勾
                  Navigator.of(context).maybePop();
                },
              ),
            ),
          ),
        ),
      ],
      child: Container(
        height: 34,
        padding: const EdgeInsets.symmetric(
          horizontal: IDesignTokensLight.spacing3,
        ),
        decoration: BoxDecoration(
          border: Border.all(color: c.border),
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                display.isEmpty ? widget.placeholder : display,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: IDesignTokensLight.fontSizeSm,
                  color: display.isEmpty ? c.textTertiary : c.text,
                ),
              ),
            ),
            IIcon(name: 'chevron-down', size: 14, color: c.textTertiary),
          ],
        ),
      ),
    );
  }
}
