import 'package:flutter/material.dart';
import '../logic/formhost.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_button.dart';
import 'i_icon.dart';

/// 分步表单的壳（astra.md 的 B09）。
///
/// 分步真正难的不是把字段切成几屏，是这三件事：
///
/// - **返回上一步不能丢数据**。值由调用方持有、逐步累积，这个壳一个字都不存，
///   所以往回翻天然是安全的。「进入某一步就重新初始化」是这条最常见的死法。
/// - **只用这一步自己的字段判断能不能往下走**。拿整张表的错误去拦，会出现
///   第一步填得好好的却点不动下一步，而错在他还没看到的第三步。
/// - **提交失败要跳回出错的那一步**。光在当前步说一句「提交失败」没有用——
///   错的字段可能在第一步，而用户正站在最后一步，他只会反复点提交。
///
/// 判断在 logic/formhost.dart，与 Web 端同一份规则。
class IStepForm extends StatefulWidget {
  const IStepForm({
    super.key,
    required this.steps,
    required this.values,
    required this.stepBuilder,
    this.initial = const {},
    this.draft,
    this.errorPaths = const [],
    this.phase = ISubmitPhase.idle,
    this.disabled = false,
    this.resubmittable = false,
    this.resetScope = IResetScope.initial,
    this.submitText = '提交',
    this.resettable = true,
    this.onValuesChange,
    this.onSubmit,
    this.onStepChange,
    this.onReset,
  });

  final List<IStepSpec> steps;

  /// 当前表单值。受控：壳不自己存，所以往回翻天然不丢
  final Map<String, Object?> values;

  /// 每一步渲染什么。Web 端是具名插槽，这里是一个 builder
  final Widget Function(BuildContext context, IStepSpec step, int index) stepBuilder;
  final Map<String, Object?> initial;
  final Map<String, Object?>? draft;

  /// 当前所有字段的错误路径，由里面的表单或服务端给
  final List<String> errorPaths;
  final ISubmitPhase phase;
  final bool disabled;
  final bool resubmittable;
  final IResetScope resetScope;
  final String submitText;
  final bool resettable;
  final void Function(Map<String, Object?>)? onValuesChange;
  final void Function(Map<String, Object?>)? onSubmit;

  /// 换步时抛出下标与那一步的 key，便于调用方按需拉数据
  final void Function(int index, String key)? onStepChange;
  final void Function(Map<String, Object?>)? onReset;

  @override
  State<IStepForm> createState() => _IStepFormState();
}

class _IStepFormState extends State<IStepForm> {
  int _index = 0;

  /// 走过哪些步。没走到过的不标红——那说的是「还没填」，不是「填错了」
  final List<int> _visited = [0];
  ISubmitPhase? _lastPhase;

  void _go(int next) {
    if (next < 0 || next >= widget.steps.length) return;
    setState(() {
      _index = next;
      if (!_visited.contains(next)) _visited.add(next);
    });
    widget.onStepChange?.call(next, widget.steps[next].key);
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    /*
     * 提交失败之后跳回出错的那一步。只在 failed 那一刻跳一次：
     * 每次错误变化都跳的话，用户在第一步改字时会被第三步的错误拽走。
     */
    if (widget.phase == ISubmitPhase.failed && _lastPhase != ISubmitPhase.failed) {
      final target = stepOfError(widget.steps, widget.errorPaths);
      if (target >= 0 && target != _index) {
        WidgetsBinding.instance.addPostFrameCallback((_) => _go(target));
      }
    }
    _lastPhase = widget.phase;

    final state = stepState(
      steps: widget.steps,
      index: _index,
      errorPaths: widget.errorPaths,
      visited: _visited,
    );
    final gate = submitGate(
      phase: widget.phase,
      // 最后一步的提交要求整张表没有错，不只是这一步
      valid: widget.errorPaths.isEmpty,
      disabled: widget.disabled,
      resubmittable: widget.resubmittable,
    );

    final status = state.blocked
        ? '这一步还有字段没填对'
        : gate.reason.isNotEmpty && state.isLast
            ? gate.reason
            : '';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 步骤条：形状 + 淡底色块 + 文字三重表达，颜色不单独承担「哪一步错了」
        Wrap(
          spacing: IDesignTokensLight.spacing2,
          runSpacing: IDesignTokensLight.spacing2,
          children: [
            for (var i = 0; i < state.marks.length; i++)
              _StepMark(mark: state.marks[i], no: i + 1),
          ],
        ),
        const SizedBox(height: IDesignTokensLight.spacing4),
        Flexible(child: widget.stepBuilder(context, widget.steps[_index], _index)),
        const SizedBox(height: IDesignTokensLight.spacing4),
        Row(
          children: [
            // 只把按钮置灰而不说原因，用户只会反复点它
            Expanded(
              child: Text(
                status,
                style: TextStyle(
                  fontSize: IDesignTokensLight.fontSizeSm,
                  color: status.isEmpty ? c.textSecondary : c.warning,
                ),
              ),
            ),
            IButton(
              label: '上一步',
              size: IButtonSize.sm,
              onPressed: state.canPrev ? () => _go(_index - 1) : null,
            ),
            if (widget.resettable) ...[
              const SizedBox(width: IDesignTokensLight.spacing2),
              IButton(
                label: resetLabel(widget.resetScope, hasDraft: widget.draft != null),
                size: IButtonSize.sm,
                onPressed: gate.busy
                    ? null
                    : () {
                        final next =
                            resetValues(widget.resetScope, widget.initial, widget.draft);
                        widget.onValuesChange?.call(next);
                        widget.onReset?.call(next);
                      },
              ),
            ],
            const SizedBox(width: IDesignTokensLight.spacing2),
            if (!state.isLast)
              IButton(
                label: '下一步',
                size: IButtonSize.sm,
                variant: IButtonVariant.primary,
                onPressed: state.canNext ? () => _go(_index + 1) : null,
              )
            else
              IButton(
                label: widget.submitText,
                size: IButtonSize.sm,
                variant: IButtonVariant.primary,
                loading: gate.busy,
                onPressed: gate.allowed ? () => widget.onSubmit?.call(widget.values) : null,
              ),
          ],
        ),
      ],
    );
  }
}

class _StepMark extends StatelessWidget {
  const _StepMark({required this.mark, required this.no});

  final IStepMark mark;
  final int no;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final current = mark.state == IStepMarkState.current;
    final (ink, tint) = switch (mark.state) {
      IStepMarkState.done => (c.success, c.successSubtle),
      IStepMarkState.error => (c.danger, c.dangerSubtle),
      IStepMarkState.current => (c.brand, c.bgElevated),
      IStepMarkState.todo => (c.textTertiary, c.bgSubtle),
    };

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: IDesignTokensLight.spacing3,
        vertical: IDesignTokensLight.spacing2,
      ),
      decoration: BoxDecoration(
        // 当前这一步用底色区分，而不是把边框加粗——加粗的边线不表达状态
        color: current ? c.brandSubtle : c.bgElevated,
        border: Border.all(color: c.hairline),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 22,
            height: 22,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: tint, shape: BoxShape.circle),
            child: switch (mark.state) {
              IStepMarkState.done => IIcon('check', size: 12, color: ink),
              IStepMarkState.error => IIcon('warning-triangle', size: 12, color: ink),
              _ => Text(
                  '$no',
                  style: TextStyle(fontSize: IDesignTokensLight.fontSizeXs, color: ink),
                ),
            },
          ),
          const SizedBox(width: IDesignTokensLight.spacing2),
          Text(
            mark.title,
            style: TextStyle(
              fontSize: IDesignTokensLight.fontSizeSm,
              color: current ? c.brand : c.textSecondary,
            ),
          ),
          // 「这一步有错」也要有字，不能只有一个红圈
          if (mark.state == IStepMarkState.error) ...[
            const SizedBox(width: IDesignTokensLight.spacing2),
            Text(
              '有错',
              style: TextStyle(fontSize: IDesignTokensLight.fontSizeXs, color: c.danger),
            ),
          ],
        ],
      ),
    );
  }
}
