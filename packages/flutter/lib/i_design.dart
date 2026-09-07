/// Ignorance Design · Flutter
///
/// Flutter 是唯一无法共享 CSS 与 TypeScript 的一端，因此：
///   - 令牌由 packages/common 的编译器生成 Dart 常量与 ThemeData，逐值与 Web 端一致；
///   - 交互规则按同一套算法移植（见 IAvatarRule），并以跨端一致性测试兜底。
library i_design;

export 'src/tokens/tokens.dart';
export 'src/components/i_button.dart';
export 'src/components/i_tag.dart';
export 'src/components/i_avatar.dart';
