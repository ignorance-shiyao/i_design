import 'package:flutter/material.dart';
import '../logic/formhost.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_button.dart';
import 'i_drawer.dart';
import 'i_icon.dart';
import 'i_modal.dart';

/// 抽屉 / 弹窗里的表单壳（astra.md 的 B09）。
///
/// 与 IFormPage 是同一套判断（logic/formhost.dart），换了个容器。浮层多出来的
/// 那件事是：**关闭这个动作本身要被离开保护拦住**。在 Flutter 上这不只是右上角
/// 那个叉——系统返回手势同样会把这层弹掉，而用户做那个手势时想的往往是
/// 「回到上一屏看一眼」，不是「丢掉我填的二十个字段」。所以这里用 PopScope
/// 在还拦着的时候拦下返回，先问一句再走。
///
/// 确认就地展开在「取消」上方，而不是再叠一层对话框——两层浮层谁先关、
/// 焦点回到哪儿，这些问题没人答得上来。
class IModalForm extends StatefulWidget {
  const IModalForm({
    super.key,
    required this.values,
    required this.child,
    this.title,
    this.width = 480,
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
    this.onValuesChange,
    this.onSubmit,
    this.onCancel,
    this.onReset,
  });

  /// 当前表单值。受控：壳不自己存
  final Map<String, Object?> values;
  final Widget child;
  final String? title;
  final double width;

  /// 打开这张表时的样子。编辑态下就是原始数据，新建态是空 Map
  final Map<String, Object?> initial;

  /// 上次存下的草稿。给了之后「重置」才有「回到草稿」这一档
  final Map<String, Object?>? draft;
  final ISubmitPhase phase;

  /// 表单自身校验通过了吗。由里面的表单告诉壳
  final bool valid;
  final bool disabled;
  final bool resubmittable;
  final IResetScope resetScope;
  final String submitText;
  final String cancelText;
  final bool resettable;
  final void Function(Map<String, Object?>)? onValuesChange;
  final void Function(Map<String, Object?>)? onSubmit;

  /// 用户确认要走了。离开保护已经问过，调用方直接关即可
  final VoidCallback? onCancel;
  final void Function(Map<String, Object?>)? onReset;

  @override
  State<IModalForm> createState() => _IModalFormState();
}

class _IModalFormState extends State<IModalForm> {
  bool _asking = false;

  @override
  void didUpdateWidget(IModalForm oldWidget) {
    super.didUpdateWidget(oldWidget);
    // 表单一改动，之前那次「确定要走吗」就不作数了
    if (!identical(oldWidget.values, widget.values) && _asking) _asking = false;
  }

  @override
  Widget build(BuildContext context) {
    final host = _FormOverlayHost(
      values: widget.values,
      initial: widget.initial,
      draft: widget.draft,
      phase: widget.phase,
      valid: widget.valid,
      disabled: widget.disabled,
      resubmittable: widget.resubmittable,
      resetScope: widget.resetScope,
      submitText: widget.submitText,
      cancelText: widget.cancelText,
      resettable: widget.resettable,
      asking: _asking,
      onAsk: () => setState(() => _asking = true),
      onKeepEditing: () => setState(() => _asking = false),
      onValuesChange: widget.onValuesChange,
      onSubmit: widget.onSubmit,
      onCancel: widget.onCancel,
      onReset: widget.onReset,
    );

    return PopScope(
      canPop: !host.guard.blocked,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) setState(() => _asking = true);
      },
      child: IModal(
        title: widget.title,
        width: widget.width,
        footer: host.buildFoot(context),
        child: widget.child,
      ),
    );
  }
}

/// 抽屉里的表单壳。与 IModalForm 判断完全一样，只是容器换成 IDrawer——
/// 内容高、字段多、需要一边看列表一边填的用抽屉；三五个字段填完就走的用弹窗。
class IDrawerForm extends StatefulWidget {
  const IDrawerForm({
    super.key,
    required this.values,
    required this.child,
    this.title,
    this.placement = IDrawerPlacement.right,
    this.size = 420,
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
    this.onValuesChange,
    this.onSubmit,
    this.onCancel,
    this.onReset,
  });

  final Map<String, Object?> values;
  final Widget child;
  final String? title;
  final IDrawerPlacement placement;
  final double size;
  final Map<String, Object?> initial;
  final Map<String, Object?>? draft;
  final ISubmitPhase phase;
  final bool valid;
  final bool disabled;
  final bool resubmittable;
  final IResetScope resetScope;
  final String submitText;
  final String cancelText;
  final bool resettable;
  final void Function(Map<String, Object?>)? onValuesChange;
  final void Function(Map<String, Object?>)? onSubmit;
  final VoidCallback? onCancel;
  final void Function(Map<String, Object?>)? onReset;

  @override
  State<IDrawerForm> createState() => _IDrawerFormState();
}

class _IDrawerFormState extends State<IDrawerForm> {
  bool _asking = false;

  @override
  void didUpdateWidget(IDrawerForm oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!identical(oldWidget.values, widget.values) && _asking) _asking = false;
  }

  @override
  Widget build(BuildContext context) {
    final host = _FormOverlayHost(
      values: widget.values,
      initial: widget.initial,
      draft: widget.draft,
      phase: widget.phase,
      valid: widget.valid,
      disabled: widget.disabled,
      resubmittable: widget.resubmittable,
      resetScope: widget.resetScope,
      submitText: widget.submitText,
      cancelText: widget.cancelText,
      resettable: widget.resettable,
      asking: _asking,
      onAsk: () => setState(() => _asking = true),
      onKeepEditing: () => setState(() => _asking = false),
      onValuesChange: widget.onValuesChange,
      onSubmit: widget.onSubmit,
      onCancel: widget.onCancel,
      onReset: widget.onReset,
    );

    return PopScope(
      canPop: !host.guard.blocked,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) setState(() => _asking = true);
      },
      child: IDrawer(
        title: widget.title,
        placement: widget.placement,
        size: widget.size,
        footer: host.buildFoot(context),
        child: widget.child,
      ),
    );
  }
}

/// 两个浮层壳共用的那条操作条与离开确认。
///
/// 抽成一份而不是各写一遍：间距、按钮顺序、说明位置各走各的，
/// 用户在抽屉与弹窗里会看到两张不一样的表。
class _FormOverlayHost {
  _FormOverlayHost({
    required this.values,
    required this.initial,
    required this.draft,
    required this.phase,
    required this.valid,
    required this.disabled,
    required this.resubmittable,
    required this.resetScope,
    required this.submitText,
    required this.cancelText,
    required this.resettable,
    required this.asking,
    required this.onAsk,
    required this.onKeepEditing,
    this.onValuesChange,
    this.onSubmit,
    this.onCancel,
    this.onReset,
  })  : gate = submitGate(
          phase: phase,
          valid: valid,
          disabled: disabled,
          resubmittable: resubmittable,
        ),
        guard = leaveGuard(
          base: initial,
          current: values,
          phase: phase,
          draftSaved: draft != null,
        );

  final Map<String, Object?> values;
  final Map<String, Object?> initial;
  final Map<String, Object?>? draft;
  final ISubmitPhase phase;
  final bool valid;
  final bool disabled;
  final bool resubmittable;
  final IResetScope resetScope;
  final String submitText;
  final String cancelText;
  final bool resettable;
  final bool asking;
  final VoidCallback onAsk;
  final VoidCallback onKeepEditing;
  final void Function(Map<String, Object?>)? onValuesChange;
  final void Function(Map<String, Object?>)? onSubmit;
  final VoidCallback? onCancel;
  final void Function(Map<String, Object?>)? onReset;

  final ISubmitGate gate;
  final ILeaveGuard guard;

  Widget buildFoot(BuildContext context) {
    final c = iColorsOf(context);

    /*
     * 优先说「为什么不能提交」，没话说的时候才说「有几项没保存」。
     * 反过来的话，正在提交时显示的是「有 3 项未保存」，读起来像是没交上去。
     */
    final status = gate.reason.isNotEmpty
        ? gate.reason
        : guard.blocked
            ? guard.message.replaceAll('，确定离开吗？', '')
            : '';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        // 只有还拦着的时候才摆出来：提交中 leaveGuard 本来就不拦，message 是空的
        if (asking && guard.blocked) ...[
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
                  IButton(label: '继续编辑', size: IButtonSize.sm, onPressed: onKeepEditing),
                  IButton(
                    label: '放弃修改并离开',
                    size: IButtonSize.sm,
                    variant: IButtonVariant.danger,
                    onPressed: onCancel,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: IDesignTokensLight.spacing2),
        ],
        Row(
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
              label: cancelText,
              size: IButtonSize.sm,
              onPressed: () => guard.blocked ? onAsk() : onCancel?.call(),
            ),
            if (resettable) ...[
              const SizedBox(width: IDesignTokensLight.spacing2),
              IButton(
                label: resetLabel(resetScope, hasDraft: draft != null),
                size: IButtonSize.sm,
                onPressed: gate.busy
                    ? null
                    : () {
                        final next = resetValues(resetScope, initial, draft);
                        onValuesChange?.call(next);
                        onReset?.call(next);
                      },
              ),
            ],
            const SizedBox(width: IDesignTokensLight.spacing2),
            IButton(
              label: submitText,
              size: IButtonSize.sm,
              variant: IButtonVariant.primary,
              loading: gate.busy,
              onPressed: gate.allowed ? () => onSubmit?.call(values) : null,
            ),
          ],
        ),
      ],
    );
  }
}
