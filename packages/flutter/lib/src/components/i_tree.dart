import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import '../logic/tree.dart';
import 'i_icon.dart';
import 'i_checkbox.dart';

/// 树：层级数据的展开与选择。
///
/// 展开态与勾选态都由外部持有，组件只负责渲染与回调——
/// 与 Web 端一致，也让「勾选后要不要提交」这类决定留在业务侧。
class ITree extends StatefulWidget {
  const ITree({
    super.key,
    required this.data,
    this.checked = const [],
    this.expanded = const [],
    this.checkable = false,
    this.selected,
    this.height,
    this.emptyText = '没有匹配的节点',
    this.onCheckedChanged,
    this.onExpandedChanged,
    this.onSelect,
  });

  final List<ITreeNode> data;
  final List<String> checked;
  final List<String> expanded;

  /// 显示复选框；不显示时点击行即为选中
  final bool checkable;
  final String? selected;

  /// 列表区高度。给了就在这个高度里滚动，由 ListView.builder 按需建行——
  /// 上万行时一次建完会卡住。不给时整棵树平铺，由外层滚动容器负责。
  final double? height;
  final String emptyText;
  final ValueChanged<List<String>>? onCheckedChanged;
  final ValueChanged<List<String>>? onExpandedChanged;
  final ValueChanged<ITreeNode>? onSelect;

  @override
  State<ITree> createState() => _ITreeState();
}

class _ITreeState extends State<ITree> {
  late Set<String> _expanded = {...widget.expanded};

  @override
  void didUpdateWidget(ITree oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.expanded != widget.expanded) {
      _expanded = {...widget.expanded};
    }
  }

  void _toggleExpand(String key) {
    setState(() {
      if (_expanded.contains(key)) {
        _expanded.remove(key);
      } else {
        _expanded.add(key);
      }
    });
    widget.onExpandedChanged?.call(_expanded.toList());
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final entities = flattenTree(widget.data);
    final state = resolveCheckState(entities, widget.checked);
    final rows = visibleRows(widget.data, entities, _expanded);

    if (rows.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(IDesignTokensLight.spacing4),
        child: Text(
          widget.emptyText,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: IDesignTokensLight.fontSizeSm,
            color: c.textTertiary,
          ),
        ),
      );
    }

    if (widget.height != null) {
      // ListView.builder 只建看得见的那几行，等同于 Web 端自己算的虚拟窗口
      return SizedBox(
        height: widget.height,
        child: ListView.builder(
          itemCount: rows.length,
          itemBuilder: (_, i) => _buildRow(context, entities, state, rows[i]),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        for (final row in rows) _buildRow(context, entities, state, row),
      ],
    );
  }

  Widget _buildRow(
    BuildContext context,
    Map<String, ITreeEntity> entities,
    ITreeCheckState state,
    ITreeRow row,
  ) {
    final c = iColorsOf(context);
    final isSelected = !widget.checkable && widget.selected == row.key;

    return InkWell(
      onTap: row.disabled
          ? null
          : () {
              if (widget.checkable) {
                final next = !state.checked.contains(row.key);
                widget.onCheckedChanged?.call(
                  toggleChecked(entities, widget.checked, row.key, next).toList(),
                );
              } else {
                widget.onSelect?.call(row.node);
              }
            },
      borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
      child: Container(
        // 缩进按层级递增，与 Web 端同为 20：两端的层级观感要一致
        padding: EdgeInsets.only(left: row.level * 20 + 4),
        constraints: const BoxConstraints(minHeight: 34),
        decoration: BoxDecoration(
          color: isSelected ? c.brandSubtle : null,
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
        ),
        child: Row(
          children: [
            // 无子节点也保留占位，否则同级的叶子与分组左边缘对不齐
            SizedBox(
              width: 20,
              height: 20,
              child: row.hasChildren
                  ? GestureDetector(
                      onTap: () => _toggleExpand(row.key),
                      child: AnimatedRotation(
                        turns: row.expanded ? 0.25 : 0,
                        duration: IDesignTokensLight.motionFast,
                        child: IIcon(
                          name: 'chevron-right',
                          size: 14,
                          color: c.textTertiary,
                        ),
                      ),
                    )
                  : null,
            ),
            if (widget.checkable)
              // 禁用在 ICheckbox 里由 onChanged 为空表达，没有单独的 disabled 参数
              ICheckbox(
                checked: state.checked.contains(row.key),
                indeterminate: state.halfChecked.contains(row.key),
                onChanged: row.disabled
                    ? null
                    : (next) => widget.onCheckedChanged?.call(
                          toggleChecked(entities, widget.checked, row.key, next)
                              .toList(),
                        ),
              ),
            const SizedBox(width: IDesignTokensLight.spacing1),
            Expanded(
              child: Text(
                row.node.label,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: IDesignTokensLight.fontSizeSm,
                  color: row.disabled
                      ? c.textTertiary
                      : (isSelected ? c.brand : c.text),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
