import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import '../logic/agent.dart';
import '../logic/file.dart';
import 'i_icon.dart';
import 'i_button.dart';
import 'i_chart.dart' show iChartPalette;

/// 上下文卡：检索到的知识片段与它们的出处。
class IContextCards extends StatefulWidget {
  const IContextCards({
    super.key,
    required this.chunks,
    this.title = '引用片段',

    /// 超过这个字符数就折叠
    this.previewLimit = 140,
    this.onSourceTap,
  });

  final List<IContextChunk> chunks;
  final String title;
  final int previewLimit;
  final ValueChanged<IContextChunk>? onSourceTap;

  @override
  State<IContextCards> createState() => _IContextCardsState();
}

class _IContextCardsState extends State<IContextCards> {
  final Set<String> _open = {};

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            Text(
              widget.title,
              style: TextStyle(
                fontSize: IDesignTokensLight.fontSizeSm,
                color: c.textSecondary,
              ),
            ),
            const SizedBox(width: IDesignTokensLight.spacing2),
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: IDesignTokensLight.spacing2,
              ),
              decoration: BoxDecoration(
                color: c.bgMuted,
                borderRadius:
                    BorderRadius.circular(IDesignTokensLight.radiusFull),
              ),
              child: Text(
                '${widget.chunks.length}',
                style: TextStyle(
                  fontSize: IDesignTokensLight.fontSizeXs,
                  color: c.textTertiary,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: IDesignTokensLight.spacing3),
        for (final chunk in widget.chunks) ...[
          _buildChunk(context, chunk),
          const SizedBox(height: IDesignTokensLight.spacing3),
        ],
      ],
    );
  }

  Widget _buildChunk(BuildContext context, IContextChunk chunk) {
    final c = iColorsOf(context);
    final length = chunkLength(chunk.content);
    final expanded = _open.contains(chunk.id);
    final type = chunk.source == null ? null : fileTypeOf(chunk.source!);
    // 文件类型色复用图表分类色板：类型是「身份」而不是「程度」，
    // 与分类色的用途一致；slot 从 1 起算，减 1 换成下标
    final tone = type == null
        ? c.brand
        : iChartPalette[((type.slot == 0 ? 1 : type.slot) - 1) % iChartPalette.length];

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: IDesignTokensLight.spacing4,
        vertical: IDesignTokensLight.spacing3,
      ),
      decoration: BoxDecoration(
        color: c.bgElevated,
        border: Border.all(color: c.hairline),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              IIcon('layers', size: 14, color: c.textTertiary),
              const SizedBox(width: IDesignTokensLight.spacing2),
              Expanded(
                child: Text(
                  chunk.title,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: IDesignTokensLight.fontSizeMd,
                    color: c.text,
                  ),
                ),
              ),
              // 字符数而不是 token 数：token 是模型的内部单位，用户无从判断它的含义
              Text(
                '$length 字',
                style: TextStyle(
                  fontSize: IDesignTokensLight.fontSizeXs,
                  color: c.textTertiary,
                ),
              ),
            ],
          ),
          const SizedBox(height: IDesignTokensLight.spacing2),
          Text(
            expanded
                ? chunk.content
                : chunkPreview(chunk.content, widget.previewLimit),
            style: TextStyle(
              fontSize: IDesignTokensLight.fontSizeSm,
              color: c.textSecondary,
              height: 1.6,
            ),
          ),
          if (length > widget.previewLimit)
            GestureDetector(
              onTap: () => setState(() {
                if (expanded) {
                  _open.remove(chunk.id);
                } else {
                  _open.add(chunk.id);
                }
              }),
              child: Padding(
                padding: const EdgeInsets.only(top: IDesignTokensLight.spacing1),
                child: Text(
                  expanded ? '收起' : '展开全文',
                  style: TextStyle(
                    fontSize: IDesignTokensLight.fontSizeSm,
                    color: c.brand,
                  ),
                ),
              ),
            ),

          // 出处：读者看完片段最常问的下一个问题就是「这句话哪儿来的」
          if (chunk.source != null && type != null) ...[
            const SizedBox(height: IDesignTokensLight.spacing3),
            GestureDetector(
              onTap: () => widget.onSourceTap?.call(chunk),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: IDesignTokensLight.spacing2,
                  vertical: 2,
                ),
                decoration: BoxDecoration(
                  border: Border.all(color: c.hairline),
                  borderRadius:
                      BorderRadius.circular(IDesignTokensLight.radiusMd),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IIcon(type.icon, size: 13, color: tone),
                    const SizedBox(width: IDesignTokensLight.spacing1),
                    Text(
                      chunk.source!,
                      style: TextStyle(
                        fontSize: IDesignTokensLight.fontSizeXs,
                        color: c.textSecondary,
                      ),
                    ),
                    if (chunk.href != null) ...[
                      const SizedBox(width: IDesignTokensLight.spacing1),
                      IIcon('external-link', size: 11, color: c.textTertiary),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// 差异表：智能体提出的成批表格改动。
class IDiffTable extends StatefulWidget {
  const IDiffTable({
    super.key,
    this.title = '待应用的改动',
    required this.columns,
    required this.rows,
    this.onApply,
  });

  final String title;

  /// 列的 key 与表头文案
  final List<({String key, String label})> columns;
  final List<IDiffRow> rows;
  final ValueChanged<List<String>>? onApply;

  @override
  State<IDiffTable> createState() => _IDiffTableState();
}

class _IDiffTableState extends State<IDiffTable> {
  late List<String> _selected = defaultDiffSelection(widget.rows);

  @override
  void didUpdateWidget(IDiffTable oldWidget) {
    super.didUpdateWidget(oldWidget);
    // 数据换了就重置选择：沿用旧的勾选会把不存在的行算进去
    if (oldWidget.rows != widget.rows) {
      _selected = defaultDiffSelection(widget.rows);
    }
  }

  static const Map<IDiffRowKind, String> _sign = {
    IDiffRowKind.added: '＋',
    IDiffRowKind.removed: '−',
    IDiffRowKind.changed: '~',
    IDiffRowKind.unchanged: '',
  };

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final summary = summarizeDiff(widget.rows, _selected);

    return Container(
      decoration: BoxDecoration(
        color: c.bgElevated,
        border: Border.all(color: c.hairline),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: IDesignTokensLight.spacing4,
              vertical: IDesignTokensLight.spacing3,
            ),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: c.hairline)),
            ),
            child: Row(
              children: [
                Text(
                  widget.title,
                  style: TextStyle(
                    fontSize: IDesignTokensLight.fontSizeMd,
                    fontWeight: FontWeight.w500,
                    color: c.text,
                  ),
                ),
                const Spacer(),
                Text(
                  '点击改动行可以取消采纳',
                  style: TextStyle(
                    fontSize: IDesignTokensLight.fontSizeSm,
                    color: c.textTertiary,
                  ),
                ),
              ],
            ),
          ),

          _buildHeader(context),
          for (final row in widget.rows) _buildRow(context, row),

          Padding(
            padding: const EdgeInsets.all(IDesignTokensLight.spacing4),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    '${summary.removed} 处删除 · ${summary.added} 处新增 · ${summary.changed} 处修改',
                    style: TextStyle(
                      fontSize: IDesignTokensLight.fontSizeSm,
                      color: c.textTertiary,
                    ),
                  ),
                ),
                IButton(
                  label: diffActionLabel(summary),
                  size: IButtonSize.sm,
                  variant: IButtonVariant.primary,
                  onPressed: summary.selected == 0
                      ? null
                      : () => widget.onApply?.call(_selected),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final c = iColorsOf(context);
    return Container(
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: c.hairline)),
      ),
      child: Row(
        children: [
          // 勾选列不参与均分：它只放一个复选框
          const SizedBox(width: 40),
          for (final column in widget.columns)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: IDesignTokensLight.spacing2,
                  vertical: IDesignTokensLight.spacing2,
                ),
                child: Text(
                  column.label,
                  style: TextStyle(
                    fontSize: IDesignTokensLight.fontSizeSm,
                    color: c.textTertiary,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildRow(BuildContext context, IDiffRow row) {
    final c = iColorsOf(context);
    final changeable = row.kind != IDiffRowKind.unchanged;
    final picked = _selected.contains(row.id);
    // 改动类型用符号 + 淡底双重表达：只用红绿底色的话，
    // 色觉障碍用户看到的是两块一样的灰
    final (Color? tint, Color signColor) = switch (row.kind) {
      IDiffRowKind.added => (c.successSubtle, c.success),
      IDiffRowKind.removed => (c.dangerSubtle, c.danger),
      IDiffRowKind.changed => (c.warningSubtle, c.warning),
      IDiffRowKind.unchanged => (null, c.textTertiary),
    };

    return InkWell(
      onTap: changeable
          ? () => setState(() {
                _selected = toggleDiffRow(widget.rows, _selected, row.id);
              })
          : null,
      child: Opacity(
        opacity: changeable && !picked ? 0.55 : 1,
        child: Container(
          decoration: BoxDecoration(
            color: changeable && !picked ? null : tint,
            border: Border(bottom: BorderSide(color: c.hairline)),
          ),
          child: Row(
            children: [
              SizedBox(
                width: 40,
                child: changeable
                    ? Checkbox(
                        value: picked,
                        visualDensity: VisualDensity.compact,
                        onChanged: (_) => setState(() {
                          _selected =
                              toggleDiffRow(widget.rows, _selected, row.id);
                        }),
                      )
                    : null,
              ),
              for (var i = 0; i < widget.columns.length; i++)
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: IDesignTokensLight.spacing2,
                      vertical: IDesignTokensLight.spacing2,
                    ),
                    child: Row(
                      children: [
                        // 符号只出现在首列，避免每格都重复
                        if (i == 0)
                          Text(
                            _sign[row.kind] ?? '',
                            style: TextStyle(
                              fontSize: IDesignTokensLight.fontSizeSm,
                              color: signColor,
                            ),
                          ),
                        if (row.cells[widget.columns[i].key]?.before != null)
                          Text(
                            row.cells[widget.columns[i].key]!.before!,
                            style: TextStyle(
                              fontSize: IDesignTokensLight.fontSizeSm,
                              color: c.textTertiary,
                              decoration: TextDecoration.lineThrough,
                            ),
                          ),
                        const SizedBox(width: IDesignTokensLight.spacing1),
                        Expanded(
                          child: Text(
                            row.cells[widget.columns[i].key]?.value ?? '',
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: IDesignTokensLight.fontSizeSm,
                              color: c.text,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
