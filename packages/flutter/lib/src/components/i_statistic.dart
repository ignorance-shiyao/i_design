import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

enum IStatisticTone { normal, brand, success, danger }

/// 一个关键数字。
///
/// 数字用等宽数位：仪表盘上的数字会随刷新变化，比例数位会让整块内容左右抖动。
class IStatistic extends StatelessWidget {
  const IStatistic({
    super.key,
    required this.value,
    this.title = '',
    this.prefix = '',
    this.suffix = '',
    this.precision = 0,
    this.separator = true,
    this.tone = IStatisticTone.normal,
    this.compact = false,
    this.trend = 0,
    this.extra = '',
  });

  /// 数字或已经格式化好的字符串
  final Object value;
  final String title;
  final String prefix;
  final String suffix;
  final int precision;

  /// 千分位分隔
  final bool separator;
  final IStatisticTone tone;

  /// 略小一号，用于密集的指标卡
  final bool compact;

  /// 同比变化，正数向上、负数向下
  final double trend;
  final String extra;

  /// 与 Web 端同一套格式化规则：只给整数部分加分隔符
  String get _display {
    final v = value;
    if (v is! num) return v.toString();
    final fixed = v.toStringAsFixed(precision);
    if (!separator) return fixed;
    final parts = fixed.split('.');
    // 变量不能叫 int：那是 Dart 的内建类型名
    final intPart = parts[0];
    final grouped = intPart.replaceAllMapped(
      RegExp(r'(\d)(?=(\d{3})+$)'),
      (m) => '${m[1]},',
    );
    return parts.length > 1 ? '$grouped.${parts[1]}' : grouped;
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final color = switch (tone) {
      IStatisticTone.normal => c.text,
      IStatisticTone.brand => c.brand,
      IStatisticTone.success => c.success,
      IStatisticTone.danger => c.danger,
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (title.isNotEmpty) ...[
          Text(
            title,
            style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeSm),
          ),
          const SizedBox(height: IDesignTokensLight.spacing2),
        ],
        Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (prefix.isNotEmpty) _affix(prefix, c),
            Text(
              _display,
              style: TextStyle(
                color: color,
                fontSize: compact
                    ? IDesignTokensLight.fontSize2xl
                    : IDesignTokensLight.fontSize3xl,
                fontWeight: FontWeight.w600,
                height: 1.2,
                fontFeatures: const [ui.FontFeature.tabularFigures()],
              ),
            ),
            if (suffix.isNotEmpty) _affix(suffix, c),
          ],
        ),
        if (trend != 0 || extra.isNotEmpty) ...[
          const SizedBox(height: IDesignTokensLight.spacing2),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (trend != 0) ...[
                IIcon(
                  trend > 0 ? 'chevron-up' : 'chevron-down',
                  size: 12,
                  color: trend > 0 ? c.success : c.danger,
                ),
                Text(
                  '${trend.abs()}%',
                  style: TextStyle(
                    color: trend > 0 ? c.success : c.danger,
                    fontSize: IDesignTokensLight.fontSizeSm,
                  ),
                ),
                const SizedBox(width: IDesignTokensLight.spacing1),
              ],
              if (extra.isNotEmpty)
                Text(
                  extra,
                  style: TextStyle(
                    color: c.textTertiary,
                    fontSize: IDesignTokensLight.fontSizeSm,
                  ),
                ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _affix(String text, IColors c) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing1),
        child: Text(
          text,
          style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeLg),
        ),
      );
}
