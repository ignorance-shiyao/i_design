import 'package:flutter/material.dart';
import '../logic/transfer.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_checkbox.dart';
import 'i_icon.dart';

/// 穿梭框。
///
/// 搬运、勾选与全选的规则全部走公共层：
/// 「搬走之后勾选怎么办」「搜索时全选选的是谁」这两处各端极容易给出不同答案，
/// 而两种答案都说得通——正因如此才必须只写一份。
class ITransfer extends StatefulWidget {
  const ITransfer({
    super.key,
    required this.items,
    this.value = const [],
    this.onChanged,
    this.titles = const ['待选', '已选'],
    this.searchable = true,
    this.height = 260,
  });

  final List<ITransferItem> items;

  /// 右栏的 key，顺序即用户搬过去的顺序
  final List<String> value;
  final ValueChanged<List<String>>? onChanged;
  final List<String> titles;
  final bool searchable;
  final double height;

  @override
  State<ITransfer> createState() => _ITransferState();
}

class _ITransferState extends State<ITransfer> {
  final _checked = <ITransferSide, List<String>>{
    ITransferSide.source: [],
    ITransferSide.target: [],
  };
  final _keyword = <ITransferSide, String>{
    ITransferSide.source: '',
    ITransferSide.target: '',
  };

  List<ITransferItem> _visible(ITransferSide side) {
    final sides = splitSides(widget.items, widget.value);
    final list = side == ITransferSide.source ? sides.source : sides.target;
    return filterItems(list, _keyword[side]!);
  }

  void _move(ITransferSide to) {
    final from = to == ITransferSide.target ? ITransferSide.source : ITransferSide.target;
    final moving = _checked[from]!;
    if (moving.isEmpty) return;
    widget.onChanged?.call(moveKeys(widget.items, widget.value, moving, to));
    // 搬走的要从勾选里清掉，否则会出现「已选 3 项」而屏幕上一个勾都没有
    setState(() => _checked[from] = checkedAfterMove(_checked[from]!, moving));
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(child: _pane(c, ITransferSide.source, widget.titles[0])),
          // 按钮列是两栏之间真正的一格，不做绝对定位
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing4),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _moveButton(c, 'chevron-right', '移到右栏',
                    _checked[ITransferSide.source]!.isNotEmpty, () => _move(ITransferSide.target)),
                const SizedBox(height: IDesignTokensLight.spacing2),
                _moveButton(c, 'chevron-left', '移到左栏',
                    _checked[ITransferSide.target]!.isNotEmpty, () => _move(ITransferSide.source)),
              ],
            ),
          ),
          Expanded(child: _pane(c, ITransferSide.target, widget.titles[1])),
        ],
      ),
    );
  }

  Widget _pane(IColors c, ITransferSide side, String title) {
    final visible = _visible(side);
    final state = headerState(visible, _checked[side]!);

    return Container(
      decoration: BoxDecoration(
        color: c.bgElevated,
        border: Border.all(color: c.border),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: IDesignTokensLight.spacing3,
              vertical: IDesignTokensLight.spacing2,
            ),
            decoration: BoxDecoration(
              color: c.bgSubtle,
              border: Border(bottom: BorderSide(color: c.hairline)),
            ),
            child: Row(
              children: [
                // 表头的全选只管当前可见的条目：搜索状态下用户的意思是「这些」
                // 这一端的 ICheckbox 没有 disabled 属性，不可用就不给回调——
                // 视觉上的灰由外层的 Opacity 负责，行为上点了没反应才是关键
                Opacity(
                  opacity: state.selectable == 0 ? 0.5 : 1,
                  child: ICheckbox(
                    checked: state.allChecked,
                    indeterminate: state.someChecked,
                    onChanged: state.selectable == 0
                        ? null
                        : (_) => setState(() => _checked[side] = toggleAll(visible, _checked[side]!)),
                  ),
                ),
                const SizedBox(width: IDesignTokensLight.spacing2),
                Text(title, style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeSm)),
                const Spacer(),
                Text(
                  '${state.checked} / ${visible.length}',
                  style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeXs),
                ),
              ],
            ),
          ),
          if (widget.searchable)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                IDesignTokensLight.spacing3,
                IDesignTokensLight.spacing2,
                IDesignTokensLight.spacing3,
                0,
              ),
              child: TextField(
                decoration: InputDecoration(
                  isDense: true,
                  hintText: '搜索',
                  hintStyle: TextStyle(color: c.textTertiary),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: IDesignTokensLight.spacing2,
                    vertical: IDesignTokensLight.spacing2,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
                    borderSide: BorderSide(color: c.border),
                  ),
                ),
                style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeSm),
                onChanged: (text) => setState(() => _keyword[side] = text),
              ),
            ),
          SizedBox(
            height: widget.height,
            child: visible.isEmpty
                ? Center(
                    child: Text(
                      _keyword[side]!.isEmpty ? '空' : '没有匹配的条目',
                      style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeSm),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(IDesignTokensLight.spacing2),
                    itemCount: visible.length,
                    itemBuilder: (context, i) {
                      final item = visible[i];
                      return Opacity(
                        opacity: item.disabled ? 0.5 : 1,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing1),
                          child: ICheckbox(
                            checked: _checked[side]!.contains(item.key),
                            label: item.label,
                            onChanged: item.disabled
                                ? null
                                : (_) => setState(
                                      () => _checked[side] = toggleItem(_checked[side]!, item.key),
                                    ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _moveButton(IColors c, String icon, String label, bool enabled, VoidCallback onTap) =>
      Opacity(
        // 没勾选任何东西时按钮不可点：能点但点了没反应，比灰着更让人困惑
        opacity: enabled ? 1 : 0.4,
        child: GestureDetector(
          onTap: enabled ? onTap : null,
          child: Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: c.bgElevated,
              border: Border.all(color: c.border),
              borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
            ),
            child: Center(child: IIcon(icon, size: 16, semanticLabel: label, color: c.textSecondary)),
          ),
        ),
      );
}
