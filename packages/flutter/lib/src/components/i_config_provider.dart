import 'package:flutter/widgets.dart';
import '../logic/locale.dart';

/// 全局配置。包住一棵子树，里面的组件就用这里给的字典与默认尺寸。
///
/// 用 InheritedWidget 而不是全局单例：同一个页面里可能嵌着一块另一种语言的内容
/// （英文合同原文旁边配中文说明），单例表达不了「这一块用另一份字典」。
/// 嵌套时内层覆盖外层——这正是 InheritedWidget 天然的行为。
class IConfigProvider extends InheritedWidget {
  const IConfigProvider({
    super.key,
    required super.child,
    ILocale? locale,
    this.size = IConfigSize.md,
  }) : _locale = locale;

  final ILocale? _locale;

  /// 表单类组件的默认尺寸。组件自己传了 size 就以自己的为准
  final IConfigSize size;

  ILocale get locale => _locale ?? zhCN;

  /// 没有 Provider 时回落到默认值，而不是抛错——绝大多数应用一份中文字典就够了，
  /// 不该为此逼所有人在根节点套一层。
  static IConfigProvider of(BuildContext context) {
    final found = context.dependOnInheritedWidgetOfExactType<IConfigProvider>();
    return found ?? const IConfigProvider(child: SizedBox.shrink());
  }

  /// 直接取字典的快捷方式，组件里最常用的就是这一句
  static ILocale localeOf(BuildContext context) => of(context).locale;

  @override
  bool updateShouldNotify(IConfigProvider old) =>
      old._locale != _locale || old.size != size;
}

enum IConfigSize { sm, md, lg }
