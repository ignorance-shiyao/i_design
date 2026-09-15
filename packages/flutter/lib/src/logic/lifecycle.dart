/// 运行还没开始出字的那几种状态，怎么说给人听
/// （对应 packages/common/src/logic/lifecycle.ts）。
///
/// 一次智能体调用在吐出第一个字之前可能已经过去十几秒，而这段静止有好几种
/// 完全不同的原因：在排队、在连接、断了正在重连、或者在等人点一下。
/// 全都只显示一个转圈的话，它们在屏幕上长得一模一样，用户没有任何依据判断
/// 该继续等、该重试，还是该去检查网络。
library;

/// 一次运行的生命周期。
///
/// 叫 IRunPhase 而不是 IRunStatus，是为了给组件 IRunStatus 让出名字：
/// Dart 没有命名空间，枚举与 Widget 重名会直接编译不过。
enum IRunPhase { queued, connecting, streaming, awaitingApproval, completed, failed, cancelled }

/// 传输层的连接态。与 IRunPhase 分开：一次运行的状态与一条连接的状态不是一回事
enum IConnectionPhase { idle, connecting, streaming, reconnecting, closed }

/// 四类语气。决定图标的前景色与淡底色块，不决定有没有文字——文字永远有
enum INoticeTone { neutral, progress, success, danger }

class IRunNotice {
  const IRunNotice({
    required this.tone,
    required this.icon,
    required this.label,
    required this.detail,
    required this.busy,
    required this.cancelable,
    required this.waited,
  });

  final INoticeTone tone;
  final String icon;

  /// 状态本身。颜色不是唯一线索，灰度打印与色觉障碍都只能靠它
  final String label;

  /// 补充：排第几、第几次重连、还有几秒重试。没有补充时是空串
  final String detail;

  /// 要不要转圈。等人确认时不转——那不是机器在忙
  final bool busy;
  final bool cancelable;

  /// 已经等了多久（毫秒）
  final int waited;
}

/// 距离下一次重试还有几秒。
///
/// 向上取整：显示「3 秒后重试」时真实剩余不超过 3 秒，
/// 向下取整会先显示「0 秒后重试」再干等一下，那比不显示还让人起疑。
int retryCountdown(int retryAt, int now) {
  final diff = retryAt - now;
  if (diff <= 0) return 0;
  return (diff + 999) ~/ 1000;
}

/// 这一刻在排队还是在连接。
///
/// 只看 status 是不够的：重连是连接的状态，运行的状态在重连期间仍然是
/// streaming（它确实已经开始流式输出了，只是断了）。两者取其重。
IRunNotice describeRun({
  required IRunPhase status,
  required int now,
  int? queuePosition,
  IConnectionPhase? connection,
  int attempt = 0,
  int? retryAt,
  int? startedAt,
}) {
  final waited = startedAt == null ? 0 : (now - startedAt < 0 ? 0 : now - startedAt);

  IRunNotice notice(
    INoticeTone tone,
    String icon,
    String label,
    String detail,
    bool busy,
    bool cancelable,
  ) =>
      IRunNotice(
        tone: tone,
        icon: icon,
        label: label,
        detail: detail,
        busy: busy,
        cancelable: cancelable,
        waited: waited,
      );

  // 终态优先：已经结束的运行不该因为连接还没关干净而显示「重连中」
  if (status == IRunPhase.completed) {
    return notice(INoticeTone.success, 'check-circle', '已完成', '', false, false);
  }
  if (status == IRunPhase.failed) {
    return notice(INoticeTone.danger, 'error-circle', '生成失败', '', false, false);
  }
  if (status == IRunPhase.cancelled) {
    return notice(INoticeTone.neutral, 'close', '已取消', '', false, false);
  }

  // 断线压过一切进行中的状态：它是唯一一个「用户不做什么就可能永远停在这儿」的情况
  if (connection == IConnectionPhase.reconnecting) {
    final rounds = attempt > 0 ? '第 $attempt 次重连' : '正在重连';
    final countdown = retryAt == null ? '' : '，${retryCountdown(retryAt, now)} 秒后重试';
    return notice(INoticeTone.danger, 'offline', '连接断开', '$rounds$countdown', true, true);
  }

  if (status == IRunPhase.awaitingApproval) {
    // 不转圈：停在这儿是在等人，转圈会让人以为再等等就好了
    return notice(INoticeTone.neutral, 'help-circle', '等待确认', '需要你确认后继续', false, true);
  }

  if (status == IRunPhase.queued) {
    final detail = queuePosition == null
        ? ''
        : queuePosition > 0
            ? '前面还有 $queuePosition 个请求'
            : '马上就轮到了';
    return notice(INoticeTone.neutral, 'clock', '排队中', detail, true, true);
  }

  if (status == IRunPhase.connecting || connection == IConnectionPhase.connecting) {
    return notice(INoticeTone.progress, 'network', '连接中', '正在建立连接', true, true);
  }

  return notice(INoticeTone.progress, 'sparkle', '生成中', '', true, true);
}
