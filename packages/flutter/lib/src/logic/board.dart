/// 看板、人员泳道与移动动作的 Dart 移植（对应 packages/common/src/logic/board.ts）。
///
/// 中心思想只有一个：**「移动一张卡」这件事只有一个实现**。
/// 拖动、右键菜单、键盘各写一遍的话，同一次移动会落到三个结果——
/// 拖过去成了，用菜单却提示「不允许」，用户会以为其中一条坏了。
///
/// 随之而来的三条：不能落的地方在拖起来之前就要看得出来并说明原因；
/// 键盘要有等价动作且清单与拖动完全一致；跨泳道移动同时改了负责人与状态，
/// 要说出来。
library;

class IBoardCard {
  const IBoardCard({
    required this.id,
    required this.title,
    required this.columnId,
    this.laneId,
    this.lockedReason,
  });

  final String id;
  final String title;
  final String columnId;

  /// 在哪条泳道。不分泳道时为 null
  final String? laneId;

  /// 这张卡自己不许动的理由。有值就哪儿都去不了
  final String? lockedReason;

  IBoardCard moveTo(String column, String? lane) => IBoardCard(
        id: id,
        title: title,
        columnId: column,
        laneId: lane,
        lockedReason: lockedReason,
      );
}

class IBoardColumn {
  const IBoardColumn({
    required this.id,
    required this.title,
    this.wipLimit,
    this.allowFrom,
  });

  final String id;
  final String title;

  /// 在制品上限。超了不许再进，但**已经在里面的不受影响**
  final int? wipLimit;

  /// 只能从这些列进来。null 表示谁都能进
  final List<String>? allowFrom;
}

class IBoardLane {
  const IBoardLane({required this.id, required this.title, this.blockedReason});

  final String id;
  final String title;
  final String? blockedReason;
}

class IMoveTarget {
  const IMoveTarget({required this.columnId, this.laneId});

  final String columnId;
  final String? laneId;
}

class IMoveCheck {
  const IMoveCheck({required this.allowed, required this.reason});

  final bool allowed;
  final String reason;
}

/// 一列（在某条泳道里）现在有几张卡
int countIn(List<IBoardCard> cards, String columnId, [String? laneId]) => cards
    .where((card) =>
        card.columnId == columnId && (laneId == null || card.laneId == laneId))
    .length;

/// 这张卡能不能落到那儿，不能的话为什么。
///
/// **拖动、菜单、键盘三条路径都问这一个函数。**
/// 判定顺序固定：卡片自己锁着 > 泳道不收 > 状态流转不允许 > 在制品满了——
/// 顺序一变，用户会按错的理由去解决问题。
IMoveCheck moveCheck(
  IBoardCard card,
  IMoveTarget to,
  List<IBoardColumn> columns,
  List<IBoardCard> cards, [
  List<IBoardLane> lanes = const [],
]) {
  final locked = card.lockedReason;
  if (locked != null && locked.isNotEmpty) {
    return IMoveCheck(allowed: false, reason: locked);
  }

  final sameColumn = card.columnId == to.columnId;
  final sameLane = card.laneId == to.laneId;
  // 原地不动永远允许：同格重排不该被在制品上限拦住
  if (sameColumn && sameLane) return const IMoveCheck(allowed: true, reason: '');

  if (to.laneId != null && !sameLane) {
    for (final lane in lanes) {
      if (lane.id != to.laneId) continue;
      final blocked = lane.blockedReason;
      if (blocked != null && blocked.isNotEmpty) {
        return IMoveCheck(allowed: false, reason: blocked);
      }
    }
  }

  IBoardColumn? column;
  for (final c in columns) {
    if (c.id == to.columnId) column = c;
  }
  if (column == null) {
    return const IMoveCheck(allowed: false, reason: '这一列不存在');
  }

  final allowFrom = column.allowFrom;
  if (!sameColumn && allowFrom != null && !allowFrom.contains(card.columnId)) {
    var fromTitle = card.columnId;
    for (final c in columns) {
      if (c.id == card.columnId) fromTitle = c.title;
    }
    return IMoveCheck(
      allowed: false,
      reason: '「$fromTitle」不能直接进「${column.title}」',
    );
  }

  final limit = column.wipLimit;
  if (!sameColumn && limit != null) {
    final count = countIn(cards, to.columnId, to.laneId);
    if (count >= limit) {
      return IMoveCheck(
        allowed: false,
        reason: '「${column.title}」在制品已满（$count/$limit），先挪走一张',
      );
    }
  }

  return const IMoveCheck(allowed: true, reason: '');
}

class IDropTarget {
  const IDropTarget({
    required this.columnId,
    required this.laneId,
    required this.title,
    required this.allowed,
    required this.reason,
  });

  final String columnId;
  final String? laneId;
  final String title;
  final bool allowed;
  final String reason;
}

/// 拿起这张卡的那一刻，把**每一个**落点的可落性算出来——
/// 拖着卡片在一列上悬停半天没反应，用户的结论是「这破东西又卡了」
List<IDropTarget> dropTargets(
  IBoardCard card,
  List<IBoardColumn> columns,
  List<IBoardCard> cards, [
  List<IBoardLane> lanes = const [],
]) {
  final targets = <IDropTarget>[];
  final laneList = lanes.isEmpty ? <IBoardLane?>[null] : <IBoardLane?>[...lanes];
  for (final lane in laneList) {
    for (final column in columns) {
      final to = IMoveTarget(columnId: column.id, laneId: lane?.id);
      final check = moveCheck(card, to, columns, cards, lanes);
      targets.add(IDropTarget(
        columnId: column.id,
        laneId: lane?.id,
        title: lane == null ? column.title : '${lane.title} / ${column.title}',
        allowed: check.allowed,
        reason: check.reason,
      ));
    }
  }
  return targets;
}

/// 键盘与右键菜单里的「移动到…」。不能落的**照常列出来，禁用并写明理由**；
/// 当前所在那一格不列：移到自己这儿不是一个动作
List<IDropTarget> moveMenu(
  IBoardCard card,
  List<IBoardColumn> columns,
  List<IBoardCard> cards, [
  List<IBoardLane> lanes = const [],
]) =>
    dropTargets(card, columns, cards, lanes)
        .where((t) => !(t.columnId == card.columnId && t.laneId == card.laneId))
        .toList();

class IMoveResult {
  const IMoveResult({
    required this.cards,
    required this.ok,
    required this.message,
  });

  final List<IBoardCard> cards;
  final bool ok;

  /// 成了说动了什么，没成说为什么
  final String message;
}

/// 这次移动到底动了什么。跨泳道时同时改了负责人与状态两件事——
/// 只说「已移动」的话，用户不会想到自己顺手换了负责人
String describeMove(
  IBoardCard card,
  IMoveTarget to,
  List<IBoardColumn> columns, [
  List<IBoardLane> lanes = const [],
]) {
  var columnTitle = to.columnId;
  for (final c in columns) {
    if (c.id == to.columnId) columnTitle = c.title;
  }
  final laneChanged = card.laneId != to.laneId;
  final columnChanged = card.columnId != to.columnId;
  if (!laneChanged && !columnChanged) return '「${card.title}」在本列内换了位置';
  if (!laneChanged) return '「${card.title}」移到了「$columnTitle」';
  var laneTitle = to.laneId ?? '';
  for (final l in lanes) {
    if (l.id == to.laneId) laneTitle = l.title;
  }
  if (!columnChanged) return '「${card.title}」转给了「$laneTitle」';
  return '「${card.title}」转给了「$laneTitle」，并移到「$columnTitle」（负责人与状态都变了）';
}

/// 移动一张卡。**拖动、菜单、键盘都调它**，因此三条路径的结果必然一致。
/// 同列内重排也走这里——单独写一份的话它会绕开 moveCheck，
/// 于是一张锁着的卡在原列里还能拖动
IMoveResult moveCard(
  List<IBoardCard> cards,
  String cardId,
  IMoveTarget to,
  List<IBoardColumn> columns, [
  List<IBoardLane> lanes = const [],
  int? index,
]) {
  IBoardCard? card;
  for (final c in cards) {
    if (c.id == cardId) card = c;
  }
  if (card == null) {
    return IMoveResult(
      cards: List<IBoardCard>.from(cards),
      ok: false,
      message: '这张卡已经不在了',
    );
  }

  final check = moveCheck(card, to, columns, cards, lanes);
  if (!check.allowed) {
    return IMoveResult(
      cards: List<IBoardCard>.from(cards),
      ok: false,
      message: check.reason,
    );
  }

  final moved = card.moveTo(to.columnId, to.laneId);
  final rest = cards.where((c) => c.id != cardId).toList();
  final targetIds = rest
      .where((c) => c.columnId == to.columnId && c.laneId == to.laneId)
      .map((c) => c.id)
      .toList();
  final anchorId = (index == null || index >= targetIds.length)
      ? null
      : targetIds[index < 0 ? 0 : index];

  final next = <IBoardCard>[];
  var placed = false;
  for (final item in rest) {
    if (anchorId != null && item.id == anchorId) {
      next.add(moved);
      placed = true;
    }
    next.add(item);
  }
  if (!placed) next.add(moved);

  return IMoveResult(
    cards: next,
    ok: true,
    message: describeMove(card, to, columns, lanes),
  );
}

/// 按方向键时下一个落点。**跳过不能落的格子**，走到头停在头上不绕回；
/// 全都不能落时返回 null，由调用方说明——悄悄不动与「按键坏了」是同一回事
IDropTarget? nextDropTarget(
  List<IDropTarget> targets,
  IMoveTarget current,
  int delta,
) {
  final usable = targets.where((t) => t.allowed).toList();
  if (usable.isEmpty) return null;
  var at = -1;
  for (var i = 0; i < usable.length; i += 1) {
    if (usable[i].columnId == current.columnId && usable[i].laneId == current.laneId) {
      at = i;
    }
  }
  if (at == -1) return delta == 1 ? usable.first : usable.last;
  final next = at + delta;
  if (next < 0 || next >= usable.length) return usable[at];
  return usable[next];
}

class IColumnStat {
  const IColumnStat({
    required this.columnId,
    required this.count,
    required this.wipLimit,
    required this.over,
    required this.text,
  });

  final String columnId;
  final int count;
  final int? wipLimit;

  /// 超了没有。**已经在里面的不赶出去**，只是不让新的再进
  final bool over;
  final String text;
}

/// 列头上的计数。有上限就写成「3/3」——没有分母的话，
/// 用户要等到拖不进去才知道有上限这回事
IColumnStat columnStat(
  IBoardColumn column,
  List<IBoardCard> cards, [
  String? laneId,
]) {
  final count = countIn(cards, column.id, laneId);
  final limit = column.wipLimit;
  return IColumnStat(
    columnId: column.id,
    count: count,
    wipLimit: limit,
    over: limit != null && count > limit,
    text: limit == null ? '$count' : '$count/$limit',
  );
}
