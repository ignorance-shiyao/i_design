import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

enum IResultStatus { success, warning, error, info }

/// 结果页：一次操作结束后的反馈，图标、标题、描述、操作区四段结构，
/// 与 Web 端逐段对应。
class IResult extends StatelessWidget {
  const IResult({
    super.key,
    required this.title,
    this.description,
    this.status = IResultStatus.success,
    this.actions = const [],
  });

  final String title;
  final String? description;
  final IResultStatus status;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    final (Color tint, Color wash, String icon) = switch (status) {
      IResultStatus.success => (c.success, c.successSubtle, 'check-circle'),
      IResultStatus.warning => (c.warning, c.warningSubtle, 'warning-triangle'),
      IResultStatus.error => (c.danger, c.dangerSubtle, 'error-circle'),
      IResultStatus.info => (c.info, c.infoSubtle, 'info-circle'),
    };

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing8),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 64,
            height: 64,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: wash, shape: BoxShape.circle),
            child: IIcon(icon, size: 32, color: tint),
          ),
          const SizedBox(height: IDesignTokensLight.spacing4),
          Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: c.text,
              fontSize: IDesignTokensLight.fontSizeXl,
              fontWeight: FontWeight.w600,
            ),
          ),
          if (description != null) ...[
            const SizedBox(height: IDesignTokensLight.spacing2),
            Text(
              description!,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: c.textSecondary,
                fontSize: IDesignTokensLight.fontSizeMd,
                height: 1.6,
              ),
            ),
          ],
          if (actions.isNotEmpty) ...[
            const SizedBox(height: IDesignTokensLight.spacing5),
            Wrap(spacing: IDesignTokensLight.spacing3, children: actions),
          ],
        ],
      ),
    );
  }
}
