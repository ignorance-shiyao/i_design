import 'package:flutter/material.dart';
import '../logic/formhost.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_button.dart';
import 'i_icon.dart';

/// 整页表单的壳（astra.md 的 B09）。
///
/// 它不管字段怎么渲染——里面放 ISchemaForm 也好，放一堆手写的输入框也好。
/// 它管的是围着表单的那几件事：重复提交拦不拦、现在为什么不能提交、
/// 改了几项没保存、点「取消」要不要先问一句、「重置」到底重置到哪儿。
///
/// 判断全在 logic/formhost.dart，与 Web 端同一份规则。
class IFormPage extends StatefulWidget {
  const IFormPage({
    super.key,
    required this.title,
    required this.values,
    required this.child,
    this.description = '',
    this.initial = const {},
    this.draft,
    this.phase = ISubmitPhase.idle,
    this.valid = true,
    this.disabled = false,
    this.resubmittable = false,
    this.resetScope = IResetScope.initial,
    this.submitText = '提交',
    this.cancelText = '取消',
    this.resettable = true,
    this.extra,
    this.onValuesChange,
    this.onSubmit,
    this.onCancel,
    this.onReset,
  });

  final String title;
  final String description;

  /// 当前表单值。受控：壳不自己存
  final Map<String, Object?> values;

  /// 打开这张表时的样子。编辑态下就是原始数据，新建态是空 Map
  final Map<String, Object?> initial;

  /// 上次存下的草稿。给了之后「重置」才有「回到草稿」这一档
  final Map<String, Object?>? draft;
  final ISubmitPhase phase;

  /// 表单自身校验通过了吗。由里面的表单告诉壳
  final bool valid;
  final bool disabled;

  /// 提交成功之后还允许再提交吗。默认不允许——成功了就该走开了
  final bool resubmittable;
  final IResetScope resetScope;
  final String submitText;
  final String cancelText;
  final bool resettable;
  final Widget? extra;
  final Widget child;
  final void Function(Map<String, Object?>)? onValuesChange;
  final void Function(Map<String, Object?>)? onSubmit;

  /// 用户确认要走了。离开保护已经问过，调用方直接走即可
  final VoidCallback? onCancel;
  final void Function(Map<String, Object?>)? onReset;

  @override
  State<IFormPage> createState() => _IFormPageState();
}

class _IFormPageState extends State<IFormPage> {
  bool _asking = false;

  @override
  void didUpdateWidget(IFormPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    // 表单一改动，之前那次「确定要走吗」就不作数了
    if (!identical(oldWidget.values, widget.values) && _asking) {
      _asking = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final gate = submitGate(
      phase: widget.phase,
      valid: widget.valid,
      disabled: widget.disabled,
      resubmittable: widget.resubmittable,
    );
    final guard = leaveGuard(
      base: widget.initial,
      current: widget.values,
      phase: widget.phase,
      draftSaved: widget.draft != null,
    );
    final resetText = resetLabel(widget.resetScope, hasDraft: widget.draft != null);

    /*
     * 底部那句话优先说「为什么不能提交」，没话说的时候才说「有几项没保存」。
     * 反过来的话，正在提交时显示的是「有 3 项未保存」，读起来像是没交上去。
     */
    final status = gate.reason.isNotEmpty
        ? gate.reason
        : guard.blocked
            ? guard.message.replaceAll('，确定离开吗？', '')
            : '';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    widget.title,
                    style: TextStyle(
                      fontSize: IDesignTokensLight.fontSizeXl,
                      fontWeight: FontWeight.w500,
                      color: c.text,
                    ),
                  ),
                  if (widget.description.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: IDesignTokensLight.spacing1),
                      child: Text(
                        widget.description,
                        style: TextStyle(
                          fontSize: IDesignTokensLight.fontSizeSm,
                          color: c.textSecondary,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            if (widget.extra != null) widget.extra!,
          ],
        ),
        const SizedBox(height: IDesignTokensLight.spacing4),
        Flexible(child: widget.child),

        /*
         * 离开确认就地展开，而不是弹一个对话框：用户点的是底部的「取消」，
         * 答案就该出现在他手指所在的地方。
         */
        /*
         * 只有「还拦着」的时候才摆出来。不加这一道的话，正在提交时它会留在
         * 屏幕上、而问题本身是空串——leaveGuard 在提交中本来就不拦。
         */
        if (_asking && guard.blocked) ...[
          const SizedBox(height: IDesignTokensLight.spacing3),
          Semantics(
            liveRegion: true,
            label: guard.message,
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: IDesignTokensLight.spacing3,
                vertical: IDesignTokensLight.spacing2,
              ),
              decoration: BoxDecoration(
                color: c.warningSubtle,
                borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
              ),
              child: Wrap(
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: IDesignTokensLight.spacing2,
                runSpacing: IDesignTokensLight.spacing2,
                children: [
                  Container(
                    width: 22,
                    height: 22,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: c.bgElevated, shape: BoxShape.circle),
                    child: IIcon('warning-triangle', size: 14, color: c.warning),
                  ),
                  Text(
                    guard.message,
                    style: TextStyle(fontSize: IDesignTokensLight.fontSizeSm, color: c.text),
                  ),
                  IButton(
                    label: '继续编辑',
                    size: IButtonSize.sm,
                    onPressed: () => setState(() => _asking = false),
                  ),
                  IButton(
                    label: '放弃修改并离开',
                    size: IButtonSize.sm,
                    variant: IButtonVariant.danger,
                    onPressed: widget.onCancel,
                  ),
                ],
              ),
            ),
          ),
        ],

        const SizedBox(height: IDesignTokensLight.spacing3),
        Container(
          padding: const EdgeInsets.only(top: IDesignTokensLight.spacing3),
          decoration: BoxDecoration(
            border: Border(top: BorderSide(color: c.hairline)),
          ),
          child: Row(
            children: [
              // 只把按钮置灰而不说原因，用户只会反复点它
              Expanded(
                child: Text(
                  status,
                  style: TextStyle(
                    fontSize: IDesignTokensLight.fontSizeSm,
                    color: gate.reason.isNotEmpty ? c.warning : c.textSecondary,
                  ),
                ),
              ),
              IButton(
                label: widget.cancelText,
                size: IButtonSize.sm,
                onPressed: () {
                  if (guard.blocked) {
                    setState(() => _asking = true);
                  } else {
                    widget.onCancel?.call();
                  }
                },
              ),
              if (widget.resettable) ...[
                const SizedBox(width: IDesignTokensLight.spacing2),
                IButton(
                  label: resetText,
                  size: IButtonSize.sm,
                  onPressed: gate.busy
                      ? null
                      : () {
                          final next = resetValues(widget.resetScope, widget.initial, widget.draft);
                          widget.onValuesChange?.call(next);
                          widget.onReset?.call(next);
                        },
                ),
              ],
              const SizedBox(width: IDesignTokensLight.spacing2),
              IButton(
                label: widget.submitText,
                size: IButtonSize.sm,
                variant: IButtonVariant.primary,
                loading: gate.busy,
                onPressed: gate.allowed ? () => widget.onSubmit?.call(widget.values) : null,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
