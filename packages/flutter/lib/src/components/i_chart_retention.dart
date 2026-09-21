import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 接收 common `buildRetention` 序列化后的模型：口径、每格的读法与色阶档位
/// 都已算好。分母、未到期的判定与幸存者平均不在 Flutter 侧重做。
class IChartRetention extends StatelessWidget {
  const IChartRetention({super.key, required this.model, required this.shades,
    this.title = '留存', this.selectedId = '', this.onSelect});

  final Map<String, dynamic> model;

  /// common `retentionShade` 的结果：'<批次 id>#<第几期>' → 档位 1–5，未到期不收录
  final Map<String, int> shades;
  final String title;
  final String selectedId;
  final ValueChanged<String>? onSelect;

  /// 五档色阶，与 Web 端的 --i-chart-seq-N 同序；字色取配好的 -ink
  static const List<Color> _scale = [
    IDesignTokensLight.chartSeq1,
    IDesignTokensLight.chartSeq2,
    IDesignTokensLight.chartSeq3,
    IDesignTokensLight.chartSeq4,
    IDesignTokensLight.chartSeq5,
  ];
  static const List<Color> _ink = [
    IDesignTokensLight.chartSeq1Ink,
    IDesignTokensLight.chartSeq2Ink,
    IDesignTokensLight.chartSeq3Ink,
    IDesignTokensLight.chartSeq4Ink,
    IDesignTokensLight.chartSeq5Ink,
  ];

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final cohorts = (model['cohorts'] as List).cast<Map<String, dynamic>>();
    final averages = (model['averages'] as List).cast<Map<String, dynamic>>();
    final excluded = (model['excluded'] as List).cast<Map<String, dynamic>>();
    final periods = model['periods'] as int;

    Widget paragraph(String text, {Color? color}) => Padding(
      padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing2),
      child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 45 * IDesignTokensLight.fontSizeSm),
        child: Text(text, style: TextStyle(color: color ?? c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm))));

    Widget box(String text, {Color? background, Color? foreground, double width = 72}) => Container(
      width: width,
      padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing3, vertical: IDesignTokensLight.spacing2),
      decoration: BoxDecoration(color: background, border: Border.all(color: c.hairline)),
      alignment: Alignment.centerRight,
      child: Text(text, style: TextStyle(color: foreground ?? c.text, fontSize: IDesignTokensLight.fontSizeSm)));

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeMd, fontWeight: FontWeight.w600)),
      paragraph(model['caption'] as String),
      // 口径一直摆在图上：同一张留存图换个分母就是另一回事，而读者无从分辨
      paragraph('口径：${model['basis']}。空格表示这一期还没到，不是 0。', color: c.text),
      if (model['state'] == 'ready')
        SingleChildScrollView(scrollDirection: Axis.horizontal, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            box('批次', background: c.bgSubtle, foreground: c.textSecondary, width: 120),
            box('期初', background: c.bgSubtle, foreground: c.textSecondary),
            for (var period = 1; period <= periods; period++)
              box('第 $period 期', background: c.bgSubtle, foreground: c.textSecondary),
          ]),
          for (final cohort in cohorts) Row(children: [
            SizedBox(width: 120, child: Semantics(selected: selectedId == cohort['id'],
              child: InkWell(onTap: onSelect == null ? null : () => onSelect!(cohort['id'] as String),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing3, vertical: IDesignTokensLight.spacing2),
                  decoration: BoxDecoration(
                    color: selectedId == cohort['id'] ? c.brandSubtle : null,
                    border: Border.all(color: c.hairline)),
                  child: Text(cohort['label'] as String, style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeSm)))))),
            box(cohort['sizeText'] as String, foreground: c.textSecondary),
            for (var period = 1; period <= periods; period++)
              _cell(context, cohort, period, box),
          ]),
          Row(children: [
            box('各期平均', foreground: c.text, width: 120),
            box('—', foreground: c.textSecondary),
            for (final average in averages) SizedBox(width: 72, child: Semantics(label: average['description'] as String,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing3, vertical: IDesignTokensLight.spacing2),
                decoration: BoxDecoration(border: Border.all(color: c.hairline)),
                alignment: Alignment.centerRight,
                child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Text(average['rateText'] as String, style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeSm)),
                  // 幸存者平均另给一个文字角标：颜色不能是唯一线索
                  if (average['comparable'] == false) Text('${average['cohorts']} / ${cohorts.length} 批',
                    style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSize2xs)),
                ])))),
          ]),
        ])),
      if (averages.any((a) => a['comparable'] == false))
        paragraph('标着「N / M 批」的那几期只有部分批次到得了，是幸存者平均，不能和左边几期比。'),
      for (final row in excluded) paragraph('源行 ${(row['sourceIndex'] as int) + 1} · ${row['label']}：${row['reason']}'),
    ]);
  }

  Widget _cell(BuildContext context, Map<String, dynamic> cohort, int period,
      Widget Function(String, {Color? background, Color? foreground, double width}) box) {
    final c = iColorsOf(context);
    final cells = (cohort['cells'] as List).cast<Map<String, dynamic>>();
    final cell = cells.cast<Map<String, dynamic>?>().firstWhere(
      (item) => item!['period'] == period, orElse: () => null);
    final step = shades['${cohort['id']}#$period'];
    if (cell == null || step == null) {
      // 未到期不涂色，也不是最浅的一档
      return box(cell == null ? '—' : cell['rateText'] as String, foreground: c.textTertiary);
    }
    return Semantics(label: cell['description'] as String,
      child: box(cell['rateText'] as String, background: _scale[step - 1], foreground: _ink[step - 1]));
  }
}
