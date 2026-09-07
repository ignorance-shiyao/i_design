import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

@immutable
class IActionSheetItem {
  const IActionSheetItem({
    required this.label,
    this.description,
    this.danger = false,
    this.disabled = false,
  });

  final String label;
  final String? description;

  /// 破坏性操作转为危险色
  final bool danger;
  final bool disabled;
}

/// 动作面板：从底部升起的一组操作。
///
/// 取消按钮与操作列表之间留出间隙并单独成块，是移动端的通行做法——
/// 紧挨着排会让「取消」看起来也是一个可执行的操作。
class IActionSheet extends StatelessWidget {
  const IActionSheet._({
    required this.items,
    this.title,
    this.cancelText = '取消',
  });

  final List<IActionSheetItem> items;
  final String? title;
  final String cancelText;

  /// 返回被选中项的下标；点遮罩或取消返回 null
  static Future<int?> show(
    BuildContext context, {
    required List<IActionSheetItem> items,
    String? title,
    String cancelText = '取消',
  }) {
    return showModalBottomSheet<int>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => IActionSheet._(items: items, title: title, cancelText: cancelText),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final radius = BorderRadius.circular(IDesignTokensLight.radiusLg);

    Widget block(Widget child) => Container(
          decoration: BoxDecoration(color: c.bgElevated, borderRadius: radius),
          clipBehavior: Clip.antiAlias,
          child: child,
        );

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.all(IDesignTokensLight.spacing3),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            block(Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (title != null)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(IDesignTokensLight.spacing4),
                    decoration: BoxDecoration(
                      border: Border(bottom: BorderSide(color: c.hairline)),
                    ),
                    child: Text(
                      title!,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: c.textTertiary,
                        fontSize: IDesignTokensLight.fontSizeSm,
                      ),
                    ),
                  ),
                for (var i = 0; i < items.length; i++)
                  InkWell(
                    onTap: items[i].disabled ? null : () => Navigator.of(context).pop(i),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        vertical: IDesignTokensLight.spacing4,
                        horizontal: IDesignTokensLight.spacing4,
                      ),
                      decoration: BoxDecoration(
                        border: i == 0 && title == null
                            ? null
                            : Border(top: BorderSide(color: c.hairline)),
                      ),
                      child: Column(
                        children: [
                          Text(
                            items[i].label,
                            style: TextStyle(
                              color: items[i].disabled
                                  ? c.textTertiary
                                  : (items[i].danger ? c.danger : c.text),
                              fontSize: IDesignTokensLight.fontSizeLg,
                            ),
                          ),
                          if (items[i].description != null) ...[
                            const SizedBox(height: 2),
                            Text(
                              items[i].description!,
                              style: TextStyle(
                                color: c.textTertiary,
                                fontSize: IDesignTokensLight.fontSizeSm,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
              ],
            )),
            const SizedBox(height: IDesignTokensLight.spacing2),
            block(InkWell(
              onTap: () => Navigator.of(context).pop(),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing4),
                alignment: Alignment.center,
                child: Text(
                  cancelText,
                  style: TextStyle(
                    color: c.text,
                    fontSize: IDesignTokensLight.fontSizeLg,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            )),
          ],
        ),
      ),
    );
  }
}
