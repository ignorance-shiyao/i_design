import 'dart:convert';

import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';
import 'i_loading.dart';

enum IChatToolStatus { running, success, error }

/// 一次工具调用：名称、状态、入参与结果。
///
/// 状态色沿用体系里既有的语义色，不为 AI 场景另造一套——
/// 否则同一个红色在别处表示「删除」、在这里表示「调用失败」，用户要学两遍。
class IChatToolCall extends StatefulWidget {
  const IChatToolCall({
    super.key,
    required this.name,
    this.summary = '',
    this.status = IChatToolStatus.success,
    this.args,
    this.result,
    this.error = '',
    this.defaultOpen = false,
  });

  final String name;

  /// 一句话说明这次调用在做什么，折叠时展示
  final String summary;
  final IChatToolStatus status;
  final Object? args;
  final Object? result;
  final String error;
  final bool defaultOpen;

  @override
  State<IChatToolCall> createState() => _IChatToolCallState();
}

class _IChatToolCallState extends State<IChatToolCall> {
  // 失败的调用默认展开：这时用户要看的正是出了什么错
  late bool _open = widget.defaultOpen || widget.status == IChatToolStatus.error;

  /// 对象转 JSON 展示；字符串原样输出，避免多一层引号
  String _format(Object? value) {
    if (value == null) return '';
    if (value is String) return value;
    return const JsonEncoder.withIndent('  ').convert(value);
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    final tint = switch (widget.status) {
      IChatToolStatus.running => c.brand,
      IChatToolStatus.success => c.success,
      IChatToolStatus.error => c.danger,
    };
    final border = switch (widget.status) {
      IChatToolStatus.running => c.brand,
      IChatToolStatus.success => c.border,
      IChatToolStatus.error => c.danger,
    };

    final argsText = _format(widget.args);
    final resultText = _format(widget.result);

    Widget section(String label, Widget body) => Container(
          width: double.infinity,
          padding: const EdgeInsets.all(IDesignTokensLight.spacing3),
          decoration: BoxDecoration(
            border: Border(top: BorderSide(color: c.hairline)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  color: c.textTertiary,
                  fontSize: IDesignTokensLight.fontSizeXs,
                ),
              ),
              const SizedBox(height: IDesignTokensLight.spacing1),
              body,
            ],
          ),
        );

    Widget code(String text) => Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(
            horizontal: IDesignTokensLight.spacing3,
            vertical: IDesignTokensLight.spacing2,
          ),
          decoration: BoxDecoration(
            color: c.bgSubtle,
            borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
          ),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Text(
              text,
              style: TextStyle(
                fontFamily: 'monospace',
                fontSize: IDesignTokensLight.fontSizeXs,
                height: 1.7,
                color: c.text,
              ),
            ),
          ),
        );

    return Container(
      decoration: BoxDecoration(
        color: c.bgElevated,
        border: Border.all(color: border),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          InkWell(
            onTap: () => setState(() => _open = !_open),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: IDesignTokensLight.spacing3,
                vertical: IDesignTokensLight.spacing2,
              ),
              child: Row(
                children: [
                  AnimatedRotation(
                    turns: _open ? 0.25 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: IIcon('chevron-right', size: 14, color: c.textTertiary),
                  ),
                  const SizedBox(width: IDesignTokensLight.spacing2),
                  Text(
                    widget.name,
                    style: TextStyle(
                      fontFamily: 'monospace',
                      fontSize: IDesignTokensLight.fontSizeXs,
                      color: c.text,
                    ),
                  ),
                  const SizedBox(width: IDesignTokensLight.spacing2),
                  Expanded(
                    child: Text(
                      widget.summary,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: c.textTertiary,
                        fontSize: IDesignTokensLight.fontSizeXs,
                      ),
                    ),
                  ),
                  if (widget.status == IChatToolStatus.running)
                    const ILoading(size: ISize.sm)
                  else
                    IIcon(
                      widget.status == IChatToolStatus.error ? 'error-circle' : 'check-circle',
                      size: 14,
                      color: tint,
                    ),
                ],
              ),
            ),
          ),
          if (_open) ...[
            if (argsText.isNotEmpty) section('入参', code(argsText)),
            if (widget.error.isNotEmpty)
              section(
                '错误',
                Text(
                  widget.error,
                  style: TextStyle(color: c.danger, fontSize: IDesignTokensLight.fontSizeSm),
                ),
              )
            else if (resultText.isNotEmpty)
              section('结果', code(resultText)),
          ],
        ],
      ),
    );
  }
}
