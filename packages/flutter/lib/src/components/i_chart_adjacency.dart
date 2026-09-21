import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 接收 common `buildAdjacency` 序列化后的模型：
/// 排序、空档语义与色阶档位都已算好，这里只负责画出来。
class IChartAdjacency extends StatelessWidget {
  const IChartAdjacency({
    super.key,
    required this.model,
    this.title = '邻接矩阵',
    this.selectedRow,
    this.selectedCol,
    this.onSelect,
  });

  final Map<String, dynamic> model;
  final String title;
  final int? selectedRow;
  final int? selectedCol;
  final void Function(int row, int col)? onSelect;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final nodes = (model['nodes'] as List).cast<Map<String, dynamic>>();
    final cells = (model['cells'] as List)
        .map((row) => (row as List).cast<Map<String, dynamic>>())
        .toList();
    final excluded = (model['excluded'] as List).cast<Map<String, dynamic>>();
    final counts = Map<String, dynamic>.from(model['counts'] as Map? ?? {});
    final min = model['min'] == null ? null : (model['min'] as num).toDouble();
    final max = model['max'] == null ? null : (model['max'] as num).toDouble();
    final sort = model['sort'] as String? ?? 'input';
    final directed = model['directed'] == true;
    final sortLabel = sort == 'input' ? '输入序' : sort == 'degree' ? '度数' : '社群';
    final zeroCount = cells.expand((row) => row).where((cell) => cell['state'] == 'ready' && cell['value'] == 0).length;

    Widget paragraph(String text, {Color? color}) => Padding(
          padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing2),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 45 * IDesignTokensLight.fontSizeSm),
            child: Text(
              text,
              style: TextStyle(
                color: color ?? c.textSecondary,
                fontSize: IDesignTokensLight.fontSizeSm,
              ),
            ),
          ),
        );

    Widget chip(String text, {Color? foreground, Color? background}) => Container(
          padding: const EdgeInsets.symmetric(
            horizontal: IDesignTokensLight.spacing2,
            vertical: IDesignTokensLight.spacing1,
          ),
          decoration: BoxDecoration(
            color: background ?? c.bgSubtle,
            border: Border.all(color: c.border),
            borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
          ),
          child: Text(
            text,
            style: TextStyle(
              color: foreground ?? c.text,
              fontSize: IDesignTokensLight.fontSizeXs,
            ),
          ),
        );

    Color? shadeColor(Map<String, dynamic> cell) {
      final state = cell['state'] as String?;
      if (state == 'absent') return null;
      if (state == 'unknown') return c.warningSubtle;
      final value = (cell['value'] as num?)?.toDouble();
      if (value == null || min == null || max == null) return c.bgSubtle;
      if (max == min) return const Color(0xFFB7C7F5);
      final t = ((value - min) / (max - min)).clamp(0.0, 1.0);
      final steps = [0xFFE8EEFB, 0xFFB7C7F5, 0xFF7A93E0, 0xFF4A63C4, 0xFF2F3F8F];
      final index = (t * (steps.length - 1)).round().clamp(0, steps.length - 1);
      return Color(steps[index]);
    }

    Color shadeInk(Map<String, dynamic> cell) {
      final state = cell['state'] as String?;
      if (state == 'unknown') return c.warning;
      if (state == 'absent') return c.textTertiary;
      final value = (cell['value'] as num?)?.toDouble();
      if (value == null || min == null || max == null || max == min) return c.text;
      final t = ((value - min) / (max - min)).clamp(0.0, 1.0);
      return t > 0.55 ? Colors.white : c.text;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeMd, fontWeight: FontWeight.w600)),
        paragraph(model['caption'] as String? ?? ''),
        paragraph('口径：${model['basis'] ?? ''}', color: c.text),
        Wrap(
          spacing: IDesignTokensLight.spacing2,
          runSpacing: IDesignTokensLight.spacing2,
          children: [
            chip(directed ? '有向' : '无向'),
            chip('排序 · $sortLabel'),
            if ((counts['absent'] as num? ?? 0) > 0) chip('${counts['absent']} 个无边空档'),
            if ((counts['unknown'] as num? ?? 0) > 0)
              chip('${counts['unknown']} 个未观测', foreground: c.warning, background: c.warningSubtle),
            if (zeroCount > 0) chip('$zeroCount 条零权边', foreground: c.info, background: c.infoSubtle),
          ],
        ),
        const SizedBox(height: IDesignTokensLight.spacing3),
        if (model['state'] == 'ready')
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Table(
              defaultColumnWidth: const IntrinsicColumnWidth(),
              border: TableBorder.all(color: c.hairline),
              children: [
                TableRow(
                  children: [
                    _head(c, '从 \\ 到'),
                    ...nodes.map((node) => _head(c, node['label'] as String? ?? '')),
                  ],
                ),
                ...List.generate(cells.length, (rowIndex) {
                  final row = cells[rowIndex];
                  return TableRow(
                    children: [
                      _head(c, '${nodes[rowIndex]['label']}\n度 ${nodes[rowIndex]['degree']}'),
                      ...List.generate(row.length, (colIndex) {
                        final cell = row[colIndex];
                        final selected = selectedRow == rowIndex && selectedCol == colIndex;
                        final label = () {
                          final state = cell['state'] as String?;
                          if (state == 'absent') return '无边';
                          if (state == 'unknown') return '未观测';
                          if (cell['value'] == 0) return '零权';
                          return '';
                        }();
                        return Material(
                          color: shadeColor(cell) ?? c.bg,
                          child: InkWell(
                            onTap: onSelect == null ? null : () => onSelect!(rowIndex, colIndex),
                            child: Container(
                              constraints: const BoxConstraints(minWidth: 56, minHeight: 44),
                              padding: const EdgeInsets.all(IDesignTokensLight.spacing2),
                              decoration: BoxDecoration(
                                border: selected ? Border.all(color: c.brand, width: 2) : null,
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    cell['valueText'] as String? ?? '—',
                                    style: TextStyle(color: shadeInk(cell), fontSize: IDesignTokensLight.fontSizeSm),
                                  ),
                                  if (label.isNotEmpty)
                                    Text(
                                      label,
                                      style: TextStyle(color: shadeInk(cell), fontSize: IDesignTokensLight.fontSize2xs),
                                    ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }),
                    ],
                  );
                }),
              ],
            ),
          ),
        paragraph('「—」且标「无边」是确认没有边；「—」且标「未观测」是没统计到；「0」是权重为零的边。'),
        ...excluded.map(
          (row) => paragraph('未计入 · ${row['id']}：${row['reason']}'),
        ),
      ],
    );
  }

  Widget _head(IColors c, String text) => Container(
        color: c.bgSubtle,
        padding: const EdgeInsets.all(IDesignTokensLight.spacing2),
        constraints: const BoxConstraints(minWidth: 56, minHeight: 44),
        alignment: Alignment.centerLeft,
        child: Text(
          text,
          style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm),
        ),
      );
}
