import 'package:flutter/material.dart';
import '../logic/multiselect.dart';
import '../logic/virtual.dart';
import '../theme/i_theme.dart';
import 'i_config_provider.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

@immutable
class ISelectOption {
  const ISelectOption({required this.value, required this.label, this.disabled = false});

  final String value;
  final String label;
  final bool disabled;
}

/// 下拉选择。
///
/// 短列表的面板用 showMenu 而非自绘浮层：系统菜单自带屏幕边界避让与返回键关闭，
/// 自绘一份只会在小屏上把选项顶出可视区。
///
/// 多选与长列表改用底部面板里的 ListView.builder：showMenu 会把每一项都先建出来，
/// 上万条时展开那一下就卡住了；而多选需要面板留在原处连点几下，菜单点一下就收。
/// 「选中了哪些」「挤不下的折成 +N」的规则来自 logic/multiselect，与 Web 端同一份。
class ISelect extends StatelessWidget {
  const ISelect({
    super.key,
    required this.options,
    required this.value,
    required this.onChanged,
    this.placeholder = '请选择',
    this.size = ISize.md,
    this.enabled = true,
    this.invalid = false,
    this.clearable = false,
    this.multiple = false,
    this.values = const [],
    this.onValuesChanged,
    this.maxTagCount = 0,
  });

  final List<ISelectOption> options;
  final String? value;
  final ValueChanged<String?> onChanged;
  final String placeholder;
  final ISize size;
  final bool enabled;
  final bool invalid;
  final bool clearable;

  /// 多选。值走 values / onValuesChanged，触发器里改成一排标签
  final bool multiple;
  final List<String> values;
  final ValueChanged<List<String>>? onValuesChanged;

  /// 多选时最多完整显示几个标签，其余折成「+N」。0 表示全部显示
  final int maxTagCount;

  List<ISelectOption> get _selectedOptions {
    final out = <ISelectOption>[];
    for (final v in multiple ? values : (value == null ? const <String>[] : [value!])) {
      for (final option in options) {
        if (option.value == v) {
          out.add(option);
          break;
        }
      }
    }
    return out;
  }

  /// 上万条时一次建完所有菜单项会卡住，交给能按需建子项的列表面板
  bool get _useSheet => multiple || shouldVirtualize(options.length);

  Future<void> _openSheet(BuildContext context) async {
    final c = iColorsOf(context);
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: c.bgElevated,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(IDesignTokensLight.radiusLg),
        ),
      ),
      builder: (sheetContext) => SafeArea(
        child: StatefulBuilder(
          builder: (innerContext, setSheetState) {
            final current = [...values];
            return SizedBox(
              height: MediaQuery.of(innerContext).size.height * 0.6,
              // ListView.builder 只建看得见的那几项，等同于 Web 端的虚拟窗口
              child: ListView.builder(
                itemCount: options.length,
                itemBuilder: (_, i) {
                  final option = options[i];
                  final picked = multiple
                      ? current.contains(option.value)
                      : option.value == value;
                  return ListTile(
                    enabled: !option.disabled,
                    title: Text(
                      option.label,
                      style: TextStyle(
                        color: option.disabled
                            ? c.textTertiary
                            : (picked ? c.brand : c.text),
                        fontSize: iFontSize(size),
                      ),
                    ),
                    trailing: picked ? IIcon('check', size: 14, color: c.brand) : null,
                    onTap: () {
                      if (multiple) {
                        // 多选不关面板：一次要选好几个，每选一个都收起来再打开是折磨
                        final next = toggleValue(current, option.value);
                        onValuesChanged?.call(next);
                        setSheetState(() {
                          current
                            ..clear()
                            ..addAll(next);
                        });
                        return;
                      }
                      Navigator.of(innerContext).pop();
                      onChanged(option.value);
                    },
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _open(BuildContext context) async {
    if (_useSheet) return _openSheet(context);
    final box = context.findRenderObject() as RenderBox;
    final overlay = Overlay.of(context).context.findRenderObject() as RenderBox;
    final topLeft = box.localToGlobal(Offset.zero, ancestor: overlay);
    final c = iColorsOf(context);

    final picked = await showMenu<String>(
      context: context,
      color: c.bgElevated,
      position: RelativeRect.fromLTRB(
        topLeft.dx,
        topLeft.dy + box.size.height,
        overlay.size.width - topLeft.dx - box.size.width,
        0,
      ),
      constraints: BoxConstraints(minWidth: box.size.width),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      items: [
        for (final option in options)
          PopupMenuItem<String>(
            value: option.value,
            enabled: !option.disabled,
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    option.label,
                    style: TextStyle(
                      color: option.disabled
                          ? c.textTertiary
                          : (option.value == value ? c.brand : c.text),
                      fontSize: iFontSize(size),
                    ),
                  ),
                ),
                if (option.value == value) IIcon('check', size: 14, color: c.brand),
              ],
            ),
          ),
      ],
    );

    if (picked != null) onChanged(picked);
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    // 不用 firstOrNull：那是 package:collection 的扩展，这里不额外引依赖
    ISelectOption? selected;
    for (final option in options) {
      if (option.value == value) {
        selected = option;
        break;
      }
    }
    final picked = _selectedOptions;
    final showClear = clearable && enabled && picked.isNotEmpty;
    final tags = collapseTags(picked, maxTagCount);

    return InkWell(
      onTap: enabled ? () => _open(context) : null,
      borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
      child: Container(
        constraints: BoxConstraints(minHeight: iControlHeight(size)),
        padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing3),
        decoration: BoxDecoration(
          color: enabled ? c.bg : c.bgMuted,
          border: Border.all(color: invalid ? c.danger : c.borderStrong),
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
        ),
        child: Row(
          children: [
            Expanded(
              child: multiple && picked.isNotEmpty
                  ? Wrap(
                      spacing: IDesignTokensLight.spacing1,
                      runSpacing: IDesignTokensLight.spacing1,
                      children: [
                        for (final option in tags.shown) _tag(c, option.label),
                        if (tags.rest > 0) _tag(c, '+${tags.rest}'),
                      ],
                    )
                  : Text(
                      multiple ? placeholder : (selected?.label ?? placeholder),
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: picked.isEmpty
                            ? c.textTertiary
                            : (enabled ? c.text : c.textTertiary),
                        fontSize: iFontSize(size),
                      ),
                    ),
            ),
            const SizedBox(width: IDesignTokensLight.spacing2),
            if (showClear)
              GestureDetector(
                onTap: () {
                  if (multiple) {
                    onValuesChanged?.call(const []);
                  } else {
                    onChanged(null);
                  }
                },
                child: IIcon('close', size: 14, color: c.textTertiary, semanticLabel: IConfigProvider.localeOf(context).clear),
              )
            else
              IIcon('chevron-down', size: 14, color: c.textTertiary),
          ],
        ),
      ),
    );
  }

  /// 标签用淡底色块与四边等宽的发丝线。某一条边加粗的话，一排标签里那一个
  /// 看起来就像它出了什么问题。
  Widget _tag(IColors c, String text) => Container(
        padding: const EdgeInsets.symmetric(
          horizontal: IDesignTokensLight.spacing1,
          vertical: 2,
        ),
        decoration: BoxDecoration(
          color: c.bgSubtle,
          border: Border.all(color: c.hairline),
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
        ),
        child: Text(
          text,
          style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeSm),
        ),
      );
}
