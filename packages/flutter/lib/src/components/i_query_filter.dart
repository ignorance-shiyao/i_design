import 'package:flutter/material.dart';
import '../logic/query.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 查询筛选条：列表页上方那一排条件（astra.md 的 B03）。
///
/// 状态机走 logic/query.dart，与 Web 端同一份：条件一变回第一页、
/// 快捷筛选整套替换、无效参数逐条报出来。
///
/// Flutter 没有地址栏，所以 onChange 吐的是参数记录（Map<String, String>），
/// 调用方把它放进路由参数对象即可——与 Web 的 query string 是同一份数据，
/// 这正是契约里不出现 URL 的原因。
class IQueryFilter extends StatefulWidget {
  const IQueryFilter({
    super.key,
    required this.fields,
    required this.value,
    required this.onChange,
    this.quickFilters = const [],
    this.invalid = const [],
    this.collapsedCount = 3,
    this.collapsed = true,
  });

  final List<IFilterField> fields;

  /// 受控：组件不自己存条件
  final IQueryState value;

  /// 新状态与对应的参数记录
  final void Function(IQueryState state, Map<String, String> params) onChange;
  final List<IQuickFilter> quickFilters;
  final List<IInvalidParam> invalid;

  /// 折叠时最多显示几个字段；标了 always 的不计入
  final int collapsedCount;
  final bool collapsed;

  @override
  State<IQueryFilter> createState() => _IQueryFilterState();
}

class _IQueryFilterState extends State<IQueryFilter> {
  late bool _folded = widget.collapsed;

  @override
  void didUpdateWidget(IQueryFilter old) {
    super.didUpdateWidget(old);
    if (old.collapsed != widget.collapsed) _folded = widget.collapsed;
  }

  void _push(IQueryState next) => widget.onChange(next, serializeQuery(next, widget.fields));

  void _change(String name, Object? value) => _push(changeFilter(widget.value, name, value));

  IFilterRange _rangeOf(String name) {
    final raw = widget.value.values[name];
    return raw is IFilterRange ? raw : const IFilterRange();
  }

  List<String> _listOf(String name) {
    final raw = widget.value.values[name];
    return raw is List ? [...raw.map((v) => '$v')] : const [];
  }

  String _textOf(String name) {
    final raw = widget.value.values[name];
    return raw is String ? raw : '';
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    // 标了 always 的字段折叠后仍然留在原位：收光之后每次都要先展开再筛，
    // 折叠反而变成了多一步
    final always = widget.fields.where((f) => f.always).toList();
    final rest = widget.fields.where((f) => !f.always).toList();
    final shown = _folded
        ? [...always, ...rest.take(widget.collapsedCount)]
        : widget.fields;
    final hiddenCount = widget.fields.length - shown.length;
    final active = activeFilterCount(widget.value.values);

    return Container(
      padding: const EdgeInsets.all(IDesignTokensLight.spacing4),
      decoration: BoxDecoration(
        color: c.bgElevated,
        border: Border.all(color: c.hairline),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 快捷筛选在最前：它替代的是「手工把三个条件依次选一遍」
          if (widget.quickFilters.isNotEmpty) ...[
            Wrap(
              spacing: IDesignTokensLight.spacing2,
              runSpacing: IDesignTokensLight.spacing2,
              children: [
                for (final quick in widget.quickFilters)
                  _Chip(
                    label: quick.label,
                    on: matchQuickFilter(widget.value.values, quick),
                    onTap: () => _push(applyQuickFilter(widget.value, quick)),
                  ),
              ],
            ),
            const SizedBox(height: IDesignTokensLight.spacing3),
          ],

          for (final field in shown) ...[
            Text(
              field.label,
              style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeXs),
            ),
            const SizedBox(height: IDesignTokensLight.spacing1),
            _fieldInput(field, c),
            const SizedBox(height: IDesignTokensLight.spacing3),
          ],

          Row(
            children: [
              if (active > 0)
                TextButton(
                  onPressed: () => _push(clearFilters(widget.value)),
                  child: Text('清空条件（$active）'),
                ),
              if (hiddenCount > 0 || !_folded)
                TextButton(
                  onPressed: () => setState(() => _folded = !_folded),
                  child: Text(_folded ? '展开其余 $hiddenCount 项' : '收起'),
                ),
            ],
          ),

          // 无效参数逐条说：链接是别人发给你的，你有权知道哪一条没生效
          if (widget.invalid.isNotEmpty)
            Text(
              '链接里有 ${widget.invalid.length} 个条件没生效：'
              '${widget.invalid.map((i) => '${i.name}=「${i.raw}」${i.reason}').join('；')}',
              style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeXs),
            ),
        ],
      ),
    );
  }

  Widget _fieldInput(IFilterField field, IColors c) {
    switch (field.kind) {
      case IFilterKind.text:
        return TextFormField(
          initialValue: _textOf(field.name),
          decoration: InputDecoration(hintText: field.placeholder),
          onChanged: (v) => _change(field.name, v),
        );
      case IFilterKind.select:
        return DropdownButton<String>(
          value: _textOf(field.name).isEmpty ? '' : _textOf(field.name),
          isExpanded: true,
          items: [
            const DropdownMenuItem(value: '', child: Text('全部')),
            for (final option in field.options)
              DropdownMenuItem(value: option.value, child: Text(option.label)),
          ],
          onChanged: (v) => _change(field.name, v ?? ''),
        );
      case IFilterKind.multiSelect:
        // 一排可切换的标签：下拉里的多选要点开才看得见已选了什么
        return Wrap(
          spacing: IDesignTokensLight.spacing2,
          runSpacing: IDesignTokensLight.spacing2,
          children: [
            for (final option in field.options)
              _Chip(
                label: option.label,
                on: _listOf(field.name).contains(option.value),
                onTap: () {
                  final list = _listOf(field.name);
                  _change(
                    field.name,
                    list.contains(option.value)
                        ? (list.where((v) => v != option.value).toList())
                        : ([...list, option.value]),
                  );
                },
              ),
          ],
        );
      case IFilterKind.numberRange:
      case IFilterKind.dateRange:
        final range = _rangeOf(field.name);
        final numeric = field.kind == IFilterKind.numberRange;
        return Row(
          children: [
            Expanded(
              child: TextFormField(
                initialValue: range.from ?? '',
                keyboardType: numeric ? TextInputType.number : TextInputType.datetime,
                onChanged: (v) => _change(
                  field.name,
                  IFilterRange(from: v.isEmpty ? null : v, to: range.to),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing2),
              child: Text('–', style: TextStyle(color: c.textTertiary)),
            ),
            Expanded(
              child: TextFormField(
                initialValue: range.to ?? '',
                keyboardType: numeric ? TextInputType.number : TextInputType.datetime,
                onChanged: (v) => _change(
                  field.name,
                  IFilterRange(from: range.from, to: v.isEmpty ? null : v),
                ),
              ),
            ),
          ],
        );
    }
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.on, required this.onTap});

  final String label;
  final bool on;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(IDesignTokensLight.radiusFull),
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: IDesignTokensLight.spacing3,
          vertical: 2,
        ),
        decoration: BoxDecoration(
          // 选中用实心底，字色与底色成对取——写死白字在浅色主题上会印不上去
          color: on ? c.brandSolid : Colors.transparent,
          border: Border.all(color: on ? Colors.transparent : c.hairline),
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusFull),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: on ? c.onBrand : c.textSecondary,
            fontSize: IDesignTokensLight.fontSizeSm,
          ),
        ),
      ),
    );
  }
}
