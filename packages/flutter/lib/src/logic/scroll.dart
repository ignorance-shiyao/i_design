/// 无限滚动触发规则的 Dart 移植（对应 packages/common/src/logic/scroll.ts）。
///
/// 「什么时候该加载下一页」写错不会报错：要么同一页连发几十次请求，
/// 要么翻到底了再也不动。两端必须是同一套判定。
library;

enum LoadStatus { idle, loading, finished, error }

/// 距底多少像素开始加载。提前一屏的三分之一，用户基本感觉不到等待
const double kLoadThreshold = 120;

/// 状态闸门：loading / finished / error 时一律不许再发请求。
///
/// 单独抽出来是因为有些端自带「滚到底」事件，那时距底判定已经由平台做了，
/// 需要的只是这道闸门——而在那条路径上顺手省掉它，同一页会连发几十个请求。
bool canLoad(LoadStatus status) => status == LoadStatus.idle;

/// 此刻该不该去加载下一页。
///
/// 三条规则：
///
/// 1. loading / finished / error 时一律不触发。
/// 2. 内容还没撑满容器时直接触发。第一页太短就没有滚动条，
///    用户再怎么划也到不了底，列表会永远停在第一页——
///    这是无限滚动最常见的、且只在「窗口很高」或「第一页很少」时才暴露的死局。
/// 3. 否则看距底距离。
bool shouldLoadMore({
  required double scrollTop,
  required double clientHeight,
  required double scrollHeight,
  required LoadStatus status,
  double threshold = kLoadThreshold,
}) {
  if (!canLoad(status)) return false;
  // 内容没撑满容器：没有滚动条，用户永远划不到底
  if (scrollHeight <= clientHeight) return true;
  return scrollHeight - scrollTop - clientHeight <= threshold;
}

/// 底部该显示哪句话。文案与状态绑死，各端不会一个写「加载中」一个写「努力加载」
String loadHint(LoadStatus status, {bool empty = false}) {
  switch (status) {
    case LoadStatus.loading:
      return '加载中…';
    case LoadStatus.error:
      return '加载失败，点击重试';
    case LoadStatus.finished:
      return empty ? '暂无内容' : '没有更多了';
    case LoadStatus.idle:
      return '';
  }
}
