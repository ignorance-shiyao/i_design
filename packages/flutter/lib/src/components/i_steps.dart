import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

class IStepItem {
  const IStepItem({required this.title, this.description});
  final String title;
  final String? description;
}

enum IStepsStatus { process, error }

/// 步骤条：把长任务拆成有序的几步，并随时告诉用户「走到哪了、还剩几步」。
class ISteps extends StatelessWidget {
  const ISteps({
    super.key,
    required this.items,
    this.current = 0,
    this.status = IStepsStatus.process,
    this.vertical = false,
  });

  final List<IStepItem> items;
  final int current;
  final IStepsStatus status;
  final bool vertical;

  String _stateOf(int index) {
    if (index < current) return 'finish';
    if (index > current) return 'wait';
    return status == IStepsStatus.error ? 'error' : 'process';
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    Widget stepIcon(int index, String state) {
      final (bg, border, fg) = switch (state) {
        'finish' => (c.brandSubtle, c.brand, c.brand),
        'process' => (c.brand, c.brand, Colors.white),
        'error' => (c.danger, c.danger, Colors.white),
        _ => (c.bg, c.borderStrong, c.textTertiary),
      };
      return Container(
        width: 24,
        height: 24,
        alignment: Alignment.center,
        decoration: BoxDecoration(color: bg, border: Border.all(color: border), shape: BoxShape.circle),
        child: switch (state) {
          'finish' => IIcon('check', size: 14, color: fg, strokeWidth: 2.4),
          'error' => IIcon('close', size: 14, color: fg, strokeWidth: 2.4),
          _ => Text('${index + 1}', style: TextStyle(color: fg, fontSize: IDesignTokensLight.fontSizeSm)),
        },
      );
    }

    final children = <Widget>[];
    for (var i = 0; i < items.length; i++) {
      final state = _stateOf(i);
      final item = items[i];
      children.add(
        Expanded(
          flex: vertical ? 0 : 1,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  stepIcon(i, state),
                  if (i < items.length - 1)
                    Expanded(
                      child: Container(
                        height: 1,
                        margin: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing2),
                        color: state == 'finish' ? c.brand : c.border,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: IDesignTokensLight.spacing2),
              Text(
                item.title,
                style: TextStyle(
                  color: state == 'wait'
                      ? c.textTertiary
                      : state == 'error'
                          ? c.danger
                          : c.text,
                  fontWeight: FontWeight.w500,
                ),
              ),
              if (item.description != null)
                Padding(
                  padding: const EdgeInsets.only(top: IDesignTokensLight.spacing1),
                  child: Text(
                    item.description!,
                    style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeSm),
                  ),
                ),
            ],
          ),
        ),
      );
    }

    return vertical
        ? Column(crossAxisAlignment: CrossAxisAlignment.start, children: children)
        : Row(crossAxisAlignment: CrossAxisAlignment.start, children: children);
  }
}
