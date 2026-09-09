import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import '../logic/tree.dart';
import 'i_icon.dart';

/// 级联选择：省市区这类层级数据。
///
/// 列的生成与「换列时截断右侧旧列」都走共享的 cascaderColumns / cascaderActivate，
/// 与 Web 端同一套判断。
class ICascader extends StatefulWidget {
  const ICascader({
    super.key,
    required this.data,
    this.value,
    this.placeholder = '请选择',
    this.disabled = false,

    /// 允许选中非叶子节点；默认只有叶子才算完成选择
    this.changeOnSelect = false,
    this.separator = ' / ',
    this.onChanged,
  });

  final List<ITreeNode> data;
  final String? value;
  final String placeholder;
  final bool disabled;
  final bool changeOnSelect;
  final String separator;
  final void Function(String key, List<String> path)? onChanged;

  @override
  State<ICascader> createState() => _ICascaderState();
}

class _ICascaderState extends State<ICascader> {
  late List<String> _active;

  @override
  void initState() {
    super.initState();
    final entities = flattenTree(widget.data);
    // 从当前值恢复路径，用户看到的是上次停在哪儿，而不是从头开始
    _active = widget.value != null ? nodePath(entities, widget.value!) : <String>[];
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final entities = flattenTree(widget.data);
    final display = widget.value != null
        ? labelPath(entities, widget.value!).join(widget.separator)
        : '';

    return PopupMenuButton<void>(
      enabled: !widget.disabled,
      color: c.bgElevated,
      offset: const Offset(0, 40),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
      ),
      itemBuilder: (context) => [
        PopupMenuItem<void>(
          enabled: false,
          padding: EdgeInsets.zero,
          child: StatefulBuilder(
            builder: (context, setInner) => _buildPanel(context, entities, setInner),
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

  Widget _buildPanel(
    BuildContext context,
    Map<String, ITreeEntity> entities,
    StateSetter setInner,
  ) {
    final c = iColorsOf(context);
    final columns = cascaderColumns(widget.data, entities, _active);

    return ConstrainedBox(
      constraints: const BoxConstraints(maxHeight: 240),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (var level = 0; level < columns.length; level++)
            Container(
              width: 132,
              decoration: BoxDecoration(
                border: level == columns.length - 1
                    ? null
                    : Border(right: BorderSide(color: c.hairline)),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    for (final node in columns[level])
                      _buildOption(context, entities, setInner, node, level),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildOption(
    BuildContext context,
    Map<String, ITreeEntity> entities,
    StateSetter setInner,
    ITreeNode node,
    int level,
  ) {
    final c = iColorsOf(context);
    final isActive = level < _active.length && _active[level] == node.key;
    final isSelected = widget.value == node.key;

    return InkWell(
      onTap: node.disabled
          ? null
          : () {
              final next = cascaderActivate(entities, _active, node.key);
              setInner(() => _active = next);
              setState(() => _active = next);
              if (node.children.isEmpty || widget.changeOnSelect) {
                widget.onChanged?.call(node.key, nodePath(entities, node.key));
              }
              // 只有选到叶子才算完成，收起面板；中间层级要留着让用户继续往下走
              if (node.children.isEmpty) Navigator.of(context).maybePop();
            },
      child: Container(
        height: 34,
        padding: const EdgeInsets.symmetric(
          horizontal: IDesignTokensLight.spacing3,
        ),
        // 激活只是「路径经过这里」，选中才是结果：前者加底色，后者才上品牌色
        color: isActive ? c.bgSubtle : null,
        child: Row(
          children: [
            Expanded(
              child: Text(
                node.label,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: IDesignTokensLight.fontSizeSm,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  color: node.disabled
                      ? c.textTertiary
                      : (isSelected ? c.brand : c.text),
                ),
              ),
            ),
            if (node.children.isNotEmpty)
              IIcon(name: 'chevron-right', size: 14, color: c.textTertiary),
          ],
        ),
      ),
    );
  }
}
