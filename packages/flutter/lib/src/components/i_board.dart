import 'package:flutter/material.dart';
import '../logic/board.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 看板与人员泳道（astra.md 的 B15）。
///
/// 拖动（Draggable）与「移动到…」菜单**调的是同一个 `moveCard`**：
/// 各写一遍的话，同一次移动会落到两个结果——拖过去成了，用菜单却提示
/// 「不允许」，用户会以为其中一条坏了。
///
/// 拿起卡片的那一刻，每个格子的可落性就都算出来了：能落的提起来，
/// 落不下的压暗并在格子里写出理由。拖着卡悬停半天没反应，
/// 用户的结论是「这破东西又卡了」，不是「这一列不收」。
class IBoard extends StatefulWidget {
  const IBoard({
    super.key,
    required this.cards,
    required this.columns,
    this.lanes = const [],
    this.onCardsChanged,
    this.onMoved,
  });

  final List<IBoardCard> cards;
  final List<IBoardColumn> columns;

  /// 人员泳道。不给就是一张平看板
  final List<IBoardLane> lanes;
  final void Function(List<IBoardCard> cards)? onCardsChanged;

  /// 每次移动都抛出来：成了说动了什么，没成说为什么
  final void Function(String message, bool ok)? onMoved;

  @override
  State<IBoard> createState() => _IBoardState();
}

class _IBoardState extends State<IBoard> {
  String? _picked;

  IBoardCard? get _pickedCard {
    for (final card in widget.cards) {
      if (card.id == _picked) return card;
    }
    return null;
  }

  void _pick(IBoardCard card) {
    // 锁着的卡拿不起来，但理由一直写在卡上，用户不必反复试
    if (card.lockedReason != null && card.lockedReason!.isNotEmpty) return;
    setState(() => _picked = _picked == card.id ? null : card.id);
  }

  /// 拖动与菜单都落到这里——两条路径的结果因此必然一致
  void _commit(IMoveTarget to) {
    final card = _pickedCard;
    if (card == null) return;
    final result = moveCard(widget.cards, card.id, to, widget.columns, widget.lanes);
    widget.onMoved?.call(result.message, result.ok);
    if (!result.ok) return;
    widget.onCardsChanged?.call(result.cards);
    setState(() => _picked = null);
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final picked = _pickedCard;
    final targets = picked == null
        ? const <IDropTarget>[]
        : dropTargets(picked, widget.columns, widget.cards, widget.lanes);
    final laneList =
        widget.lanes.isEmpty ? <IBoardLane?>[null] : <IBoardLane?>[...widget.lanes];

    IDropTarget? targetOf(String columnId, String? laneId) {
      for (final target in targets) {
        if (target.columnId == columnId && target.laneId == laneId) return target;
      }
      return null;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (picked != null)
          Container(
            width: double.infinity,
            margin: const EdgeInsets.only(bottom: IDesignTokensLight.spacing3),
            padding: const EdgeInsets.symmetric(
              horizontal: IDesignTokensLight.spacing3,
              vertical: IDesignTokensLight.spacing2,
            ),
            decoration: BoxDecoration(
              color: c.bgSubtle,
              border: Border.all(color: c.hairline),
              borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
            ),
            child: Semantics(
              liveRegion: true,
              child: Row(
                children: [
                  IIcon('arrow-right', size: 14, color: c.textSecondary),
                  const SizedBox(width: IDesignTokensLight.spacing2),
                  Expanded(
                    child: Text(
                      '拿起「${picked.title}」：拖到别的格子，或在下面的清单里选。落不下的格子已经压暗并写明原因。',
                      style: TextStyle(
                        fontSize: IDesignTokensLight.fontSizeSm,
                        color: c.textSecondary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

        for (final lane in laneList) ...[
          if (lane != null)
            Padding(
              padding: const EdgeInsets.only(bottom: IDesignTokensLight.spacing2),
              child: Wrap(
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: IDesignTokensLight.spacing2,
                children: [
                  Text(
                    lane.title,
                    style: TextStyle(
                      fontSize: IDesignTokensLight.fontSizeSm,
                      fontWeight: FontWeight.w500,
                      color: c.text,
                    ),
                  ),
                  // 不收新卡的泳道：理由跟在名字后面，而不是只把它变灰
                  if ((lane.blockedReason ?? '').isNotEmpty)
                    Text(
                      lane.blockedReason!,
                      style: TextStyle(
                        fontSize: IDesignTokensLight.fontSizeXs,
                        color: c.textTertiary,
                      ),
                    ),
                ],
              ),
            ),
          Padding(
            padding: const EdgeInsets.only(bottom: IDesignTokensLight.spacing3),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final column in widget.columns)
                  Expanded(child: _cell(column, lane, targetOf(column.id, lane?.id), c)),
              ],
            ),
          ),
        ],

        // 「移动到…」：与拖动同一份清单，落不下的也列出来并写明理由
        if (picked != null)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(IDesignTokensLight.spacing2),
            decoration: BoxDecoration(
              color: c.bgElevated,
              border: Border.all(color: c.hairline),
              borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                for (final target
                    in moveMenu(picked, widget.columns, widget.cards, widget.lanes))
                  InkWell(
                    onTap: target.allowed
                        ? () => _commit(
                              IMoveTarget(columnId: target.columnId, laneId: target.laneId),
                            )
                        : null,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: IDesignTokensLight.spacing2,
                        vertical: IDesignTokensLight.spacing1,
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              '移动到 ${target.title}',
                              style: TextStyle(
                                fontSize: IDesignTokensLight.fontSizeSm,
                                color: target.allowed ? c.text : c.textTertiary,
                              ),
                            ),
                          ),
                          if (!target.allowed)
                            Text(
                              target.reason,
                              style: TextStyle(
                                fontSize: IDesignTokensLight.fontSizeXs,
                                color: c.textTertiary,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _cell(
    IBoardColumn column,
    IBoardLane? lane,
    IDropTarget? target,
    IColors c,
  ) {
    final picked = _pickedCard;
    final stat = columnStat(column, widget.cards, lane?.id);
    final cards = widget.cards
        .where((card) => card.columnId == column.id && card.laneId == lane?.id)
        .toList();

    return DragTarget<String>(
      onWillAcceptWithDetails: (_) => target?.allowed ?? true,
      onAcceptWithDetails: (_) =>
          _commit(IMoveTarget(columnId: column.id, laneId: lane?.id)),
      builder: (context, _, __) => Container(
        margin: const EdgeInsets.only(right: IDesignTokensLight.spacing2),
        padding: const EdgeInsets.all(IDesignTokensLight.spacing2),
        constraints: const BoxConstraints(minHeight: 72),
        decoration: BoxDecoration(
          // 能落的淡淡提起来，落不下的压暗——不用加粗边线表达状态
          color: picked == null
              ? c.bgSubtle
              : (target?.allowed ?? false)
                  ? c.brandSubtle
                  : c.bgMuted,
          border: Border.all(color: c.hairline),
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(
                  child: Text(
                    column.title,
                    style: TextStyle(
                      fontSize: IDesignTokensLight.fontSizeSm,
                      color: c.text,
                    ),
                  ),
                ),
                // 计数写成 2/2：没有分母，用户要等到拖不进去才知道有上限
                Text(
                  stat.text,
                  style: TextStyle(
                    fontSize: IDesignTokensLight.fontSizeXs,
                    color: stat.over ? c.warning : c.textTertiary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: IDesignTokensLight.spacing2),
            for (final card in cards) _card(card, c),
            // 落不下的原因就写在格子里，不靠悬停提示
            if (picked != null && (target?.allowed ?? true) == false)
              Padding(
                padding: const EdgeInsets.only(top: IDesignTokensLight.spacing1),
                child: Text(
                  target!.reason,
                  style: TextStyle(
                    fontSize: IDesignTokensLight.fontSizeXs,
                    color: c.textTertiary,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _card(IBoardCard card, IColors c) {
    final locked = (card.lockedReason ?? '').isNotEmpty;
    final body = Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: IDesignTokensLight.spacing2),
      padding: const EdgeInsets.symmetric(
        horizontal: IDesignTokensLight.spacing3,
        vertical: IDesignTokensLight.spacing2,
      ),
      decoration: BoxDecoration(
        color: _picked == card.id ? c.brandSubtle : c.bgElevated,
        border: Border.all(color: c.hairline),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            card.title,
            style: TextStyle(
              fontSize: IDesignTokensLight.fontSizeSm,
              color: locked ? c.textTertiary : c.text,
            ),
          ),
          // 锁着的卡说清为什么，而不是只变灰让人反复试
          if (locked)
            Text(
              card.lockedReason!,
              style: TextStyle(
                fontSize: IDesignTokensLight.fontSizeXs,
                color: c.textTertiary,
              ),
            ),
        ],
      ),
    );

    if (locked) return body;
    return Draggable<String>(
      data: card.id,
      onDragStarted: () => setState(() => _picked = card.id),
      onDraggableCanceled: (_, __) => setState(() => _picked = null),
      feedback: Material(color: Colors.transparent, child: Opacity(opacity: 0.9, child: body)),
      childWhenDragging: Opacity(opacity: 0.4, child: body),
      child: GestureDetector(onTap: () => _pick(card), child: body),
    );
  }
}
