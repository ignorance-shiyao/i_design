/// 导航菜单的展开规则：与 Web 端 logic/menu.ts 同一套判断。
library;

import 'tree.dart';

/// 选中某一项时应当展开的分组：补上它的全部祖先。
/// 从外部（比如路由跳转）切到另一个分支时，那个分支的祖先没被展开，
/// 用户会看到选中项藏在收起的分组里。
List<String> openKeysFor(
  Map<String, ITreeEntity> entities,
  String selectedKey,
  Iterable<String> current,
) {
  final next = <String>{...current};
  next.addAll(ancestorKeys(entities, selectedKey));
  return next.toList();
}

/// 手风琴模式：展开一个分组时收起同层的其它分组，但保留祖先——
/// 否则整条路径会一起塌掉。
List<String> accordionOpenKeys(
  Map<String, ITreeEntity> entities,
  Iterable<String> openKeys,
  String key,
) {
  final open = <String>{...openKeys};
  if (open.contains(key)) {
    open.remove(key);
    return open.toList();
  }
  final level = entities[key]?.level;
  final path = <String>{...ancestorKeys(entities, key), key};
  for (final other in open.toList()) {
    if (entities[other]?.level == level && !path.contains(other)) {
      open.remove(other);
    }
  }
  open.add(key);
  return open.toList();
}
