/// 智能体屏幕的纯逻辑（对应 packages/common/src/logic/screen.ts）。
///
/// 一张静止的画面，看起来和一张卡住的画面一模一样。所以「画面几秒前」
/// 这行字的写法、以及「多久算卡住」这个阈值必须两端一致：
/// 一端 15 秒提醒、另一端一分钟才提醒的话，同一次卡死在两端是两种体验。
library;

enum AgentScreenState { connecting, working, paused, done, error }

/// 状态行的文字。「工作中」三个字没有信息量——用户想知道的是「在做什么」
String screenStatusText(AgentScreenState state, [String action = '']) {
  final trimmed = action.trim();
  switch (state) {
    case AgentScreenState.connecting:
      return '正在连接屏幕';
    case AgentScreenState.working:
      return trimmed.isEmpty ? '正在操作' : trimmed;
    case AgentScreenState.paused:
      return trimmed.isEmpty ? '已暂停' : '已暂停：$trimmed';
    case AgentScreenState.done:
      return '已完成';
    case AgentScreenState.error:
      return trimmed.isEmpty ? '出错了' : trimmed;
  }
}

/// 状态对应的图标。与文字成对使用——图标是补充，不是唯一线索
String screenStatusIcon(AgentScreenState state) {
  switch (state) {
    case AgentScreenState.connecting:
      return 'refresh';
    case AgentScreenState.working:
      return 'sparkle';
    case AgentScreenState.paused:
      return 'minus';
    case AgentScreenState.done:
      return 'check-circle';
    case AgentScreenState.error:
      return 'error-circle';
  }
}

/// 现在能不能接管。只有正在做事或已暂停时接管才有意义——
/// 没连上时没东西可管，做完或出错后接管等于重新开一局
bool canTakeOver(AgentScreenState state) =>
    state == AgentScreenState.working || state == AgentScreenState.paused;

/// 画面的新鲜度说明。
///
/// 两秒内不说话（返回空串）：正常刷新时每一帧都挂一句「刚刚更新」，
/// 那行字就成了噪声，真卡住时反而没人注意到它变了。
String frameAge(int now, int updatedAt) {
  final seconds = ((now - updatedAt) / 1000).floor();
  if (seconds < 2) return '';
  if (seconds < 60) return '画面 $seconds 秒前';
  final minutes = seconds ~/ 60;
  if (minutes < 60) return '画面 $minutes 分钟前';
  return '画面 ${minutes ~/ 60} 小时前';
}

/// 画面已经多久没动了，写成一段时长。
///
/// 与 frameAge 分开：那一个说的是「什么时候的」（画面 44 秒前），
/// 这一个说的是「多久没动」（已经 44 秒）。混用会写出
/// 「画面已经 44 秒前没动了」这种句子——「44 秒前」是一个时刻，不是一段时长。
String frameStaleText(int now, int updatedAt) {
  final seconds = ((now - updatedAt) / 1000).floor();
  if (seconds < 60) return '画面已经 $seconds 秒没动了，可能卡住了';
  final minutes = seconds ~/ 60;
  if (minutes < 60) return '画面已经 $minutes 分钟没动了，可能卡住了';
  return '画面已经 ${minutes ~/ 60} 小时没动了，可能卡住了';
}

/// 画面停太久就该提醒：超过这个秒数，「在思考」与「卡住了」得由用户来判断
const int frameStaleSeconds = 15;

/// 画面是不是已经旧到该提醒了。做完之后不提醒——那张画面本来就不会再变
bool frameStale(int now, int updatedAt, AgentScreenState state) {
  if (state == AgentScreenState.done || state == AgentScreenState.error) return false;
  return (now - updatedAt) / 1000 >= frameStaleSeconds;
}

/// 画面框的高宽比（宽 ÷ 高）。必须在第一帧到达之前就定下来：
/// 不定的话，占位框是一个高度、画面来了是另一个，连上的那一刻整页会跳
double screenAspect([double? width, double? height]) {
  if (width == null || height == null || width <= 0 || height <= 0) return 16 / 10;
  return width / height;
}
