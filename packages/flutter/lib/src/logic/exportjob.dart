/// 导出任务的纯逻辑（对应 packages/common/src/logic/exportjob.ts，astra.md 的 B11 后半）。
///
/// 这一层存在的理由只有一句：**导出是「任务」，不是「下载」。**
/// 几万行的导出要排队、要跑一段时间、要能中途取消，生成好的文件还有有效期。
///
/// 三条规则：不知道总数就不要画进度条（假进度条是谎）；文件过期之后给的是
/// 「重新生成」而不是一个坏链接；导出必须带出处——是什么时候、按哪套筛选、
/// 哪些列、多少行，四样缺一样两个人就对不上账。
library;

enum IExportStatus { queued, running, ready, expired, failed, cancelled }

enum IExportTone { neutral, progress, success, danger }

enum IExportAction { none, cancel, download, regenerate, retry }

class IExportJobView {
  const IExportJobView({
    required this.status,
    required this.tone,
    required this.label,
    required this.detail,
    required this.percent,
    required this.busy,
    required this.action,
  });

  final IExportStatus status;
  final IExportTone tone;

  /// 状态本身。颜色不是唯一线索，这句话必须出现
  final String label;
  final String detail;

  /// 进度百分比（0–100）。**总数未知时是 null**，界面拿到 null 就不该画进度条
  final int? percent;
  final bool busy;
  final IExportAction action;
}

/// 还能下载多久。过期返回 0
int remainingLife(int expiresAt, int now) {
  final diff = expiresAt - now;
  if (diff <= 0) return 0;
  return (diff + 999) ~/ 1000;
}

/// 把秒数说成人话。小时以下不说「0 小时」，分钟以下不说「0 分钟」
String humanDuration(int seconds) {
  if (seconds <= 0) return '已过期';
  if (seconds < 60) return '$seconds 秒';
  final minutes = seconds ~/ 60;
  if (minutes < 60) return '$minutes 分钟';
  final hours = minutes ~/ 60;
  final rest = minutes % 60;
  return rest != 0 ? '$hours 小时 $rest 分钟' : '$hours 小时';
}

IExportJobView describeExport({
  required IExportStatus status,
  required int now,
  int? queuePosition,
  int? processed,
  int? total,
  int? expiresAt,
  String? error,
}) {
  // 总数未知就不给百分比：假进度条比没有进度条更让人不敢离开
  final percent = (total != null && total > 0 && processed != null)
      ? (processed / total * 100).floor().clamp(0, 100)
      : null;

  if (status == IExportStatus.queued) {
    final detail = queuePosition == null
        ? '已提交，等待服务端安排'
        : queuePosition > 0
            ? '前面还有 $queuePosition 个任务'
            : '马上就轮到了';
    // 排队中也能取消：这时候取消是最省事的，不必等它跑完
    return IExportJobView(
      status: status,
      tone: IExportTone.neutral,
      label: '排队中',
      detail: detail,
      percent: null,
      busy: true,
      action: IExportAction.cancel,
    );
  }

  if (status == IExportStatus.running) {
    final detail = processed == null
        ? '正在生成'
        : total == null
            ? '已导出 $processed 行'
            : '已导出 $processed / $total 行';
    return IExportJobView(
      status: status,
      tone: IExportTone.progress,
      label: '生成中',
      detail: detail,
      percent: percent,
      busy: true,
      action: IExportAction.cancel,
    );
  }

  if (status == IExportStatus.ready) {
    final life = expiresAt == null ? null : remainingLife(expiresAt, now);
    // 已经到点的文件不算 ready：拿到 404 的人会以为是自己权限没了
    if (life != null && life <= 0) {
      return const IExportJobView(
        status: IExportStatus.expired,
        tone: IExportTone.neutral,
        label: '已过期',
        detail: '生成好的文件已经过期，重新生成一份即可',
        percent: null,
        busy: false,
        action: IExportAction.regenerate,
      );
    }
    return IExportJobView(
      status: status,
      tone: IExportTone.success,
      label: '可下载',
      detail: life == null ? '文件已生成' : '文件已生成，还可下载 ${humanDuration(life)}',
      percent: 100,
      busy: false,
      action: IExportAction.download,
    );
  }

  if (status == IExportStatus.expired) {
    return const IExportJobView(
      status: IExportStatus.expired,
      tone: IExportTone.neutral,
      label: '已过期',
      detail: '生成好的文件已经过期，重新生成一份即可',
      percent: null,
      busy: false,
      action: IExportAction.regenerate,
    );
  }

  if (status == IExportStatus.failed) {
    final reason = (error ?? '').trim();
    return IExportJobView(
      status: status,
      tone: IExportTone.danger,
      label: '生成失败',
      detail: reason.isEmpty ? '未知原因' : reason,
      percent: null,
      busy: false,
      action: IExportAction.retry,
    );
  }

  return const IExportJobView(
    status: IExportStatus.cancelled,
    tone: IExportTone.neutral,
    label: '已取消',
    detail: '没有生成任何文件',
    percent: null,
    busy: false,
    action: IExportAction.regenerate,
  );
}

/* ---------- 出处 ---------- */

class IStampParts {
  const IStampParts({
    required this.year,
    required this.month,
    required this.day,
    required this.hour,
    required this.minute,
  });

  final int year;
  final int month;
  final int day;
  final int hour;
  final int minute;
}

/// 把年月日时分排成 `2026-09-15 14:30`（文件名里用 `2026-09-15-14-30`）。
///
/// 只接受拆好的数字，不接受时间戳：时间戳转成年月日要看时区，而时区是各端
/// 从系统拿的。把转换留在各端、只把排版规则共享出来，两端才对得上。
String formatStamp(IStampParts parts, [String separator = ' ']) {
  String pad(int n) => n.toString().padLeft(2, '0');
  final date = '${parts.year}-${pad(parts.month)}-${pad(parts.day)}';
  final time = separator == ' '
      ? '${pad(parts.hour)}:${pad(parts.minute)}'
      : '${pad(parts.hour)}$separator${pad(parts.minute)}';
  return '$date$separator$time';
}

/// 本地时区的年月日时分。转换在这一端做，排版交给 formatStamp
String _stamp(int at, [String separator = ' ']) {
  final d = DateTime.fromMillisecondsSinceEpoch(at);
  return formatStamp(
    IStampParts(year: d.year, month: d.month, day: d.day, hour: d.hour, minute: d.minute),
    separator,
  );
}

class IExportMeta {
  const IExportMeta({
    required this.subject,
    required this.createdAt,
    this.filters = const [],
    this.columns = const [],
    this.rows,
  });

  /// 导出的是什么。「销售订单」「库存流水」
  final String subject;
  final int createdAt;

  /// 当时的筛选条件，已经翻译成人话
  final List<String> filters;
  final List<String> columns;
  final int? rows;
}

/// 出处清单。四样缺一样，两个人拿着两份表就对不上账——
/// 没有筛选也要明写「全量」，留空既可能是全量也可能是忘了记。
List<String> exportProvenance(IExportMeta meta) {
  final lines = <String>['导出内容：${meta.subject}', '生成时间：${_stamp(meta.createdAt)}'];
  lines.add(
    meta.filters.isNotEmpty ? '筛选条件：${meta.filters.join('；')}' : '筛选条件：没有筛选条件（全量）',
  );
  if (meta.columns.isNotEmpty) lines.add('导出列：${meta.columns.join('、')}');
  if (meta.rows != null) lines.add('行数：${meta.rows}');
  return lines;
}

/// 文件名。带上主题、时间与筛选摘要——都叫 export.csv 的两份文件谁也说不清。
/// 文件系统不认识的字符换成下划线：冒号与斜杠在 Windows 上直接存不下来。
String exportFileName(IExportMeta meta, {String extension = 'csv'}) {
  String safe(String text) => text.replaceAll(RegExp(r'[\\/:*?"<>|\s]+'), '_');
  final parts = <String>[safe(meta.subject), _stamp(meta.createdAt, '-')];
  if (meta.filters.isNotEmpty) parts.add(safe(meta.filters.join('_')));
  return '${parts.join('_')}.$extension';
}
