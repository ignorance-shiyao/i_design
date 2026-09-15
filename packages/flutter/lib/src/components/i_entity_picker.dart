import 'package:flutter/material.dart';
import '../logic/entitypicker.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';
import 'i_input.dart';

/// 人员 / 组织 / 资源的选择器（astra.md 的 B10）。
///
/// 检索本身交给调用方：谁去请求、请求哪个接口、怎么分页，都不是这个组件该管的。
/// 它管的是那三件一做错就出真问题的事，判断全在 logic/entitypicker.dart：
/// 翻页之后已选还看不看得见、不能选的为什么不能、停用的怎么办。
///
/// 已选排在结果列表之上：翻页时唯一会变的是结果，把已选压在列表底下，
/// 一翻页它就滚出视野，用户立刻开始怀疑自己选的东西还在不在。
class IEntityPicker extends StatelessWidget {
  const IEntityPicker({
    super.key,
    this.page = const [],
    this.chosen = const [],
    this.keyword = '',
    this.loading = false,
    this.multiple = false,
    this.max,
    this.unit = '项',
    this.placeholder = '搜索姓名、工号或部门',
    this.onChanged,
    this.onKeywordChanged,
  });

  /// 当前这一页的检索结果。由调用方去请求
  final List<IEntityOption> page;

  /// 已选。完整对象，不是 id——回显不能依赖它还在当前页里
  final List<IEntityOption> chosen;
  final String keyword;
  final bool loading;
  final bool multiple;

  /// 最多选几个
  final int? max;

  /// 「人」「个部门」「台设备」——摘要里那个量词
  final String unit;
  final String placeholder;
  final void Function(List<IEntityOption> chosen)? onChanged;
  final void Function(String keyword)? onKeywordChanged;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final rows = pickerRows(page: page, chosen: chosen, multiple: multiple, max: max);
    final summary = pickerSummary(chosen, max: max, unit: unit);
    // 已选里不在当前页的那些也要显示——不然翻一页就看不见自己选了谁
    final offPage = offPageChosen(chosen, page);
    final hint = pickerHint(keyword, loading, page.length);

    return Container(
      padding: const EdgeInsets.all(IDesignTokensLight.spacing3),
      decoration: BoxDecoration(
        color: c.bgElevated,
        border: Border.all(color: c.hairline),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          IInput(
            value: keyword,
            placeholder: placeholder,
            onChanged: onKeywordChanged,
          ),
          const SizedBox(height: IDesignTokensLight.spacing3),

          Wrap(
            spacing: IDesignTokensLight.spacing2,
            runSpacing: IDesignTokensLight.spacing1,
            children: [
              Text(
                summary.text,
                style: TextStyle(fontSize: IDesignTokensLight.fontSizeSm, color: c.text),
              ),
              // 不说「请移除」：历史记录里的停用项本来就该留着
              if (summary.notice.isNotEmpty)
                Text(
                  summary.notice,
                  style: TextStyle(
                    fontSize: IDesignTokensLight.fontSizeSm,
                    color: c.textTertiary,
                  ),
                ),
              if (offPage.isNotEmpty)
                Text(
                  '其中 ${offPage.length} $unit不在当前结果里，仍然算数',
                  style: TextStyle(
                    fontSize: IDesignTokensLight.fontSizeSm,
                    color: c.textTertiary,
                  ),
                ),
            ],
          ),

          // 已选排在结果之上：翻页时它不该跟着滚出视野
          if (chosen.isNotEmpty) ...[
            const SizedBox(height: IDesignTokensLight.spacing2),
            Wrap(
              spacing: IDesignTokensLight.spacing2,
              runSpacing: IDesignTokensLight.spacing2,
              children: [
                for (final item in chosen)
                  _Chip(
                    item: item,
                    onRemove: () => onChanged?.call(removePick(chosen, item.id)),
                  ),
              ],
            ),
          ],

          const SizedBox(height: IDesignTokensLight.spacing2),
          if (hint.isNotEmpty)
            Text(
              hint,
              style: TextStyle(fontSize: IDesignTokensLight.fontSizeSm, color: c.textTertiary),
            )
          else
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 260),
              child: ListView(
                shrinkWrap: true,
                children: [
                  for (final row in rows)
                    _Row(
                      row: row,
                      multiple: multiple,
                      onTap: row.disabled
                          ? null
                          : () => onChanged?.call(togglePick(
                                page: page,
                                chosen: chosen,
                                multiple: multiple,
                                max: max,
                                id: row.option.id,
                              )),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// 已选的一枚。停用的用淡底色块 + 「已停用」四个字，颜色不单独承担这个信息
class _Chip extends StatelessWidget {
  const _Chip({required this.item, required this.onRemove});

  final IEntityOption item;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing2, vertical: 2),
      decoration: BoxDecoration(
        color: item.inactive ? c.warningSubtle : c.bgSubtle,
        border: Border.all(color: c.hairline),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusFull),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            item.label,
            style: TextStyle(fontSize: IDesignTokensLight.fontSizeSm, color: c.text),
          ),
          if (item.inactive) ...[
            const SizedBox(width: IDesignTokensLight.spacing1),
            Text(
              '已停用',
              style: TextStyle(fontSize: IDesignTokensLight.fontSizeXs, color: c.warning),
            ),
          ],
          const SizedBox(width: IDesignTokensLight.spacing1),
          Semantics(
            button: true,
            label: '移除 ${item.label}',
            child: GestureDetector(
              onTap: onRemove,
              child: IIcon('close', size: 12, color: c.textTertiary),
            ),
          ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.row, required this.multiple, this.onTap});

  final IPickerRow row;
  final bool multiple;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    return Semantics(
      checked: row.selected,
      enabled: !row.disabled,
      label: row.reason.isEmpty ? row.option.label : '${row.option.label}，${row.reason}',
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
        child: Container(
          padding: const EdgeInsets.all(IDesignTokensLight.spacing2),
          decoration: BoxDecoration(
            color: row.selected ? c.brandSubtle : null,
            borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
          ),
          child: Row(
            children: [
              IIcon(
                row.selected ? 'check-circle' : (multiple ? 'plus' : 'user'),
                size: 14,
                color: row.selected ? c.brand : c.textTertiary,
              ),
              const SizedBox(width: IDesignTokensLight.spacing2),
              Text(
                row.option.label,
                style: TextStyle(
                  fontSize: IDesignTokensLight.fontSizeMd,
                  // 灰行不靠透明度单独表达：名字仍然要读得清
                  color: row.disabled
                      ? c.textTertiary
                      : row.selected
                          ? c.brand
                          : c.text,
                ),
              ),
              if (row.option.hint != null) ...[
                const SizedBox(width: IDesignTokensLight.spacing2),
                Expanded(
                  child: Text(
                    row.option.hint!,
                    style: TextStyle(
                      fontSize: IDesignTokensLight.fontSizeSm,
                      color: c.textTertiary,
                    ),
                  ),
                ),
              ] else
                const Spacer(),
              // 不能选的理由写在行里，不是长按提示：触摸屏没有悬停
              if (row.reason.isNotEmpty)
                Text(
                  row.reason,
                  style: TextStyle(
                    fontSize: IDesignTokensLight.fontSizeXs,
                    color: c.warning,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
