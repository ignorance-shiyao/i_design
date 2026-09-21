import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 接收 common `buildBalance` 序列化后的模型：台阶的起止、增减方向、
/// 对不上的差额与坐标范围都已算好，这里只把数值换算成宽度。
class IChartBalance extends StatelessWidget {
  const IChartBalance({super.key, required this.model, this.title = '贡献',
    this.selectedId = '', this.rowHeight = 32, this.onSelect});

  final Map<String, dynamic> model;
  final String title;
  final String selectedId;
  final double rowHeight;
  final ValueChanged<String>? onSelect;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final steps = (model['steps'] as List).cast<Map<String, dynamic>>();
    final excluded = (model['excluded'] as List).cast<Map<String, dynamic>>();
    final min = (model['min'] as num).toDouble();
    final max = (model['max'] as num).toDouble();
    final span = max - min == 0 ? 1.0 : max - min;

    Widget paragraph(String text) => Padding(
      padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing2),
      child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 45 * IDesignTokensLight.fontSizeSm),
        child: Text(text, style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm))));

    Color barColor(Map<String, dynamic> step) {
      // 期初期末是「现在有多少」，差额是账没平的那一段，都不占增减色
      if (step['kind'] == 'start' || step['kind'] == 'end') return c.brand;
      if (step['kind'] == 'gap') return c.warning;
      if (step['direction'] == 'up') return c.success;
      if (step['direction'] == 'down') return c.danger;
      return c.borderStrong;
    }

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeMd, fontWeight: FontWeight.w600)),
      paragraph(model['caption'] as String),
      if (model['state'] == 'ready') ...[
        for (final step in steps) SizedBox(height: rowHeight, child: Semantics(
          selected: selectedId == step['id'],
          label: step['description'] as String,
          child: InkWell(onTap: onSelect == null ? null : () => onSelect!(step['id'] as String),
            child: Container(
              color: selectedId == step['id'] ? c.brandSubtle : null,
              padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing2),
              child: Row(children: [
                SizedBox(width: 96, child: Text(step['label'] as String, overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeSm))),
                Expanded(child: LayoutBuilder(builder: (context, constraints) {
                  final from = (step['from'] as num).toDouble(), to = (step['to'] as num).toDouble();
                  final a = ((from < to ? from : to) - min) / span * constraints.maxWidth;
                  final b = ((from < to ? to : from) - min) / span * constraints.maxWidth;
                  final zero = (0 - min) / span * constraints.maxWidth;
                  return Stack(children: [
                    // 零线要画出来：负的那一段从哪儿开始，看的就是它
                    Positioned(left: zero, top: 0, bottom: 0, child: Container(width: 1, color: c.borderStrong)),
                    Positioned(left: a, top: rowHeight * 0.2, bottom: rowHeight * 0.2,
                      child: Container(width: (b - a).clamp(2.0, constraints.maxWidth),
                        decoration: BoxDecoration(color: barColor(step),
                          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm)))),
                  ]);
                })),
                SizedBox(width: 88, child: Text(step['valueText'] as String, textAlign: TextAlign.right,
                  style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeSm))),
                SizedBox(width: 88, child: Text(step['cumulativeText'] as String, textAlign: TextAlign.right,
                  style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm))),
              ]))))),
        paragraph('柱子从上一项的累计画起；右边两列是本项的增减与之后的累计。坐标轴含 0，负的那一段画在零线左边。'),
      ],
      for (final row in excluded) paragraph('源行 ${(row['sourceIndex'] as int) + 1} · ${row['label']}：${row['reason']}'),
    ]);
  }
}
