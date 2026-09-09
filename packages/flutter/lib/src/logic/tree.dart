/// 树的选择与展开逻辑：与 Web 端 logic/tree.ts 同一套规则的 Dart 实现。
///
/// 半选传播与禁用继承是这里最容易在移植时抄错的两处，
/// 因此它们的期望值由 TS 侧算出，写进 golden test 逐条比对。
library;

class ITreeNode {
  const ITreeNode({
    required this.key,
    required this.label,
    this.children = const [],
    this.disabled = false,
  });

  final String key;
  final String label;
  final List<ITreeNode> children;
  final bool disabled;
}

class ITreeEntity {
  const ITreeEntity({
    required this.key,
    required this.node,
    required this.parentKey,
    required this.level,
    required this.childKeys,
    required this.disabled,
  });

  final String key;
  final ITreeNode node;

  /// 根节点为 null
  final String? parentKey;

  /// 根为 0
  final int level;
  final List<String> childKeys;
  final bool disabled;
}

/// 把嵌套结构拍平成索引表，顺序为深度优先前序（与渲染顺序一致）
Map<String, ITreeEntity> flattenTree(List<ITreeNode> nodes) {
  final entities = <String, ITreeEntity>{};

  void walk(List<ITreeNode> list, String? parentKey, int level) {
    for (final node in list) {
      entities[node.key] = ITreeEntity(
        key: node.key,
        node: node,
        parentKey: parentKey,
        level: level,
        childKeys: node.children.map((c) => c.key).toList(),
        // 禁用向下继承：父节点禁用时，子节点不该还能被单独勾选
        disabled: node.disabled ||
            (parentKey != null && (entities[parentKey]?.disabled ?? false)),
      );
      if (node.children.isNotEmpty) walk(node.children, node.key, level + 1);
    }
  }

  walk(nodes, null, 0);
  return entities;
}

/// 某个节点的全部后代 key
List<String> descendantKeys(Map<String, ITreeEntity> entities, String key) {
  final out = <String>[];
  final stack = <String>[...(entities[key]?.childKeys ?? const [])];
  while (stack.isNotEmpty) {
    final current = stack.removeLast();
    out.add(current);
    stack.addAll(entities[current]?.childKeys ?? const []);
  }
  return out;
}

/// 某个节点的全部祖先 key，由近及远
List<String> ancestorKeys(Map<String, ITreeEntity> entities, String key) {
  final out = <String>[];
  var parent = entities[key]?.parentKey;
  while (parent != null) {
    out.add(parent);
    parent = entities[parent]?.parentKey;
  }
  return out;
}

class ITreeRow {
  const ITreeRow({
    required this.key,
    required this.node,
    required this.level,
    required this.hasChildren,
    required this.expanded,
    required this.disabled,
  });

  final String key;
  final ITreeNode node;
  final int level;
  final bool hasChildren;
  final bool expanded;
  final bool disabled;
}

/// 当前应该渲染出来的行
List<ITreeRow> visibleRows(
  List<ITreeNode> nodes,
  Map<String, ITreeEntity> entities,
  Set<String> expandedKeys, {
  Set<String>? visibleKeys,
}) {
  final rows = <ITreeRow>[];

  void walk(List<ITreeNode> list) {
    for (final node in list) {
      if (visibleKeys != null && !visibleKeys.contains(node.key)) continue;
      final entity = entities[node.key];
      if (entity == null) continue;
      final hasChildren = node.children.isNotEmpty;
      final isExpanded = expandedKeys.contains(node.key);
      rows.add(ITreeRow(
        key: node.key,
        node: node,
        level: entity.level,
        hasChildren: hasChildren,
        expanded: isExpanded,
        disabled: entity.disabled,
      ));
      if (hasChildren && isExpanded) walk(node.children);
    }
  }

  walk(nodes);
  return rows;
}

class ITreeCheckState {
  const ITreeCheckState({required this.checked, required this.halfChecked});

  final Set<String> checked;

  /// 部分子节点被选中的父节点：复选框要显示为半选，而不是选中
  final Set<String> halfChecked;
}

/// 由一组选中的 key 推导出完整的选中态与半选态。
///
/// 自底向上按层级推。禁用节点不参与「全选」的判定，否则一个禁用的子节点
/// 会永远拖住父节点，让用户怎么点父节点都变不成选中。
ITreeCheckState resolveCheckState(
  Map<String, ITreeEntity> entities,
  Iterable<String> keys,
) {
  final checked = <String>{};
  for (final key in keys) {
    if (!entities.containsKey(key)) continue;
    checked.add(key);
    for (final child in descendantKeys(entities, key)) {
      if (!(entities[child]?.disabled ?? false)) checked.add(child);
    }
  }

  final halfChecked = <String>{};
  final byLevel = entities.values.toList()
    ..sort((a, b) => b.level.compareTo(a.level));
  for (final entity in byLevel) {
    if (entity.childKeys.isEmpty) continue;
    final selectable = entity.childKeys
        .where((k) => !(entities[k]?.disabled ?? false))
        .toList();
    if (selectable.isEmpty) continue;
    final all = selectable.every(checked.contains);
    final some = selectable
        .any((k) => checked.contains(k) || halfChecked.contains(k));
    if (all) {
      checked.add(entity.key);
    } else {
      checked.remove(entity.key);
      if (some) halfChecked.add(entity.key);
    }
  }
  return ITreeCheckState(checked: checked, halfChecked: halfChecked);
}

/// 勾选或取消一个节点后的新选中集合
Set<String> toggleChecked(
  Map<String, ITreeEntity> entities,
  Iterable<String> currentChecked,
  String key,
  bool next,
) {
  final checked = <String>{...currentChecked};
  final entity = entities[key];
  if (entity == null || entity.disabled) return checked;

  final affected = <String>[key, ...descendantKeys(entities, key)];
  for (final target in affected) {
    if (entities[target]?.disabled ?? false) continue;
    if (next) {
      checked.add(target);
    } else {
      checked.remove(target);
    }
  }
  // 祖先由 resolveCheckState 重新推导，这里先摘掉
  for (final parent in ancestorKeys(entities, key)) {
    checked.remove(parent);
  }
  return checked;
}

/// 只保留叶子节点的选中值，便于提交给后端
List<String> leafKeys(
  Map<String, ITreeEntity> entities,
  Iterable<String> checked,
) =>
    checked.where((key) => (entities[key]?.childKeys.isEmpty ?? false)).toList();

class ITreeSearchResult {
  const ITreeSearchResult({
    required this.visible,
    required this.expand,
    required this.matched,
  });

  final Set<String> visible;
  final Set<String> expand;
  final Set<String> matched;
}

/// 按关键字过滤。命中节点的祖先一并保留，否则命中项无处挂载——「搜得到却看不见」。
ITreeSearchResult searchTree(
  Map<String, ITreeEntity> entities,
  String keyword,
) {
  final matched = <String>{};
  final visible = <String>{};
  final expand = <String>{};
  final needle = keyword.trim().toLowerCase();
  if (needle.isEmpty) {
    return ITreeSearchResult(visible: visible, expand: expand, matched: matched);
  }

  for (final entity in entities.values) {
    if (!entity.node.label.toLowerCase().contains(needle)) continue;
    matched.add(entity.key);
    visible.add(entity.key);
    for (final parent in ancestorKeys(entities, entity.key)) {
      visible.add(parent);
      expand.add(parent);
    }
    for (final child in descendantKeys(entities, entity.key)) {
      visible.add(child);
    }
  }
  return ITreeSearchResult(visible: visible, expand: expand, matched: matched);
}
