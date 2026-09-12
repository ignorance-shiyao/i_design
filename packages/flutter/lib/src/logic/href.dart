/// 外链地址的协议白名单（对应 packages/common/src/logic/href.ts）。
///
/// 链接类组件的地址常常来自不可信的地方——模型与工具的输出、检索结果、用户填的字段。
/// 原样交给系统去打开，等于让数据决定点击时发生什么。这一端尤其要管：
/// Web 端至少还有浏览器在兜底，而 url_launcher 会把任意 scheme 直接交给操作系统。
library;

/// 放行：http(s)、mailto、tel、站内绝对路径、锚点、相对路径
final RegExp _allowed = RegExp(
  r'^(?:https?://|mailto:|tel:|/(?!/)|#|\.{1,2}/|[\w.~-]+(?:[/?#]|$))',
  caseSensitive: false,
);

/// 控制字符、空白与反斜杠一律拒绝。中间插一个 Tab 的「java…script:」
/// 能绕过朴素的前缀判断却照样执行；反斜杠在某些解析里等同于斜杠，
/// 可以拿来伪造出「看起来是相对路径」的跨站地址。
final RegExp _hostile = RegExp('[\u0000-\u0020\\\\]');

/// 地址能不能安全地打开。不能则返回 null，让调用方退化成纯文本，
/// 而不是给出一个点了会出事的链接。
///
/// 显式拒绝而不是「洗干净再用」：清洗要穷举所有变形，漏一种就前功尽弃；
/// 白名单只需要列全允许的那几种，列漏了顶多是某个合法链接点不开——
/// 这个方向的错误看得见，另一个方向的看不见。
String? safeHref(String? href) {
  if (href == null || href.isEmpty) return null;
  final value = href.trim();
  if (value.isEmpty || _hostile.hasMatch(value)) return null;
  return _allowed.hasMatch(value) ? value : null;
}
