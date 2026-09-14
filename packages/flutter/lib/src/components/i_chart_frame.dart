import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../logic/dataset.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_button.dart';

/// 图的外框：标题、口径、状态与出口。
///
/// 「出口」是这个组件存在的主要理由：每张图都要有一条不看图也能拿到数的路。
/// 读屏读不了画布，色觉障碍分不清相邻两个系列，而任何人想把数抄走时都需要表格。
/// 表格与图同源——都从 iToSeries 出来。
class IChartFrame extends StatefulWidget {
  const IChartFrame({
    super.key,
    this.title = '',
    this.subtitle = '',
    this.note = '',
    this.dataset,
    this.spec,
    this.child,
  });

  final String title;
  final String subtitle;

  /// 统计口径。同一张图换个口径就是另一回事，而读者无从分辨，除非写出来
  final String note;
  final IChartDataset? dataset;
  final IChartSpec? spec;
  final Widget? child;

  @override
  State<IChartFrame> createState() => _IChartFrameState();
}

class _IChartFrameState extends State<IChartFrame> {
  bool _showTable = false;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final dataset = widget.dataset;
    final spec = widget.spec;
    final series = dataset != null && spec != null ? iToSeries(dataset, spec) : <IDatasetSeries>[];
    final axis = series.isEmpty ? <Object>[] : series.first.points.map((p) => p.x).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (widget.title.isNotEmpty)
                    Text(widget.title,
                        style: TextStyle(
                            color: c.text,
                            fontSize: IDesignTokensLight.fontSizeMd,
                            fontWeight: FontWeight.w600)),
                  if (widget.subtitle.isNotEmpty)
                    Text(widget.subtitle,
                        style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm)),
                ],
              ),
            ),
            IButton(
              variant: IButtonVariant.text,
              size: IButtonSize.sm,
              onPressed: () => setState(() => _showTable = !_showTable),
              child: Text(_showTable ? '看图' : '看数据'),
            ),
            IButton(
              variant: IButtonVariant.text,
              size: IButtonSize.sm,
              // 手机上没有「下载文件」这回事，出口换成复制——数还是能拿走
              onPressed: series.isEmpty ? null : () => _copy(series, axis),
              child: const Text('复制数据'),
            ),
          ],
        ),
        const SizedBox(height: IDesignTokensLight.spacing3),
        if (!_showTable && widget.child != null)
          widget.child!
        else if (_showTable)
          _table(c, series, axis),
        if (widget.note.isNotEmpty) ...[
          const SizedBox(height: IDesignTokensLight.spacing2),
          Text('口径：${widget.note}',
              style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm)),
        ],
      ],
    );
  }

  void _copy(List<IDatasetSeries> series, List<Object> axis) {
    final header = ['维度', ...series.map((s) => s.name)].join(',');
    final rows = [
      for (var i = 0; i < axis.length; i += 1)
        [
          '${axis[i]}',
          // 缺失值留空单元格，不是 0
          ...series.map((s) => s.points[i].y?.toString() ?? ''),
        ].join(',')
    ];
    Clipboard.setData(ClipboardData(text: [header, ...rows].join('\n')));
  }

  Widget _table(IColors c, List<IDatasetSeries> series, List<Object> axis) => SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Table(
          defaultColumnWidth: const IntrinsicColumnWidth(),
          border: TableBorder.all(color: c.hairline),
          children: [
            TableRow(
              decoration: BoxDecoration(color: c.bgSubtle),
              children: [
                _cell(c, '维度', bold: true),
                for (final s in series) _cell(c, s.name, bold: true),
              ],
            ),
            for (var i = 0; i < axis.length; i += 1)
              TableRow(children: [
                _cell(c, '${axis[i]}'),
                // 缺失值显示「—」而不是 0：写成 0 就等于在表格里也撒谎
                for (final s in series)
                  _cell(c, s.points[i].y?.toString() ?? '—', missing: s.points[i].y == null),
              ]),
          ],
        ),
      );

  Widget _cell(IColors c, String text, {bool bold = false, bool missing = false}) => Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: IDesignTokensLight.spacing3,
          vertical: IDesignTokensLight.spacing2,
        ),
        child: Text(
          text,
          style: TextStyle(
            color: missing ? c.textTertiary : c.text,
            fontSize: IDesignTokensLight.fontSizeSm,
            fontWeight: bold ? FontWeight.w500 : FontWeight.w400,
          ),
        ),
      );
}
