/// 推理轨迹（对应 packages/common/src/logic/thinking.ts）。
///
/// 一整块流水账式的推理文字，读者只会整段跳过。拆成步之后，
/// 「现在走到哪一步」与「哪一步出了问题」都摆在面上。
///
/// 「哪几步默认展开」必须与 Web 端一致：同一条轨迹在一端展开出错那步、
/// 在另一端全折叠的话，用户得学两遍。
library;

enum IThinkingStepKind { reason, search, code, tool }

enum IThinkingStepStatus { done, running, error }

class IThinkingStep {
  const IThinkingStep({
    required this.key,
    required this.title,
    this.detail,
    this.kind = IThinkingStepKind.reason,
    this.status = IThinkingStepStatus.done,
  });

  final String key;
  final String title;

  /// 展开后看到的内容
  final String? detail;
  final IThinkingStepKind kind;
  final IThinkingStepStatus status;
}

class IThinkingSummary {
  const IThinkingSummary({
    required this.total,
    required this.done,
    required this.running,
    required this.failed,
    required this.activeIndex,
  });

  final int total;
  final int done;
  final int running;
  final int failed;

  /// 现在走到哪一步：进行中的那一步，没有进行中的就是最后一步
  final int activeIndex;
}

/// 每种步骤用一个形状不同的图标。
///
/// 不用颜色区分种类：四种颜色的圆点在灰度打印下是同一个圆点，
/// 而且颜色在这套体系里已经被状态占了——再用一次，两种含义会打架。
String thinkingStepIcon([IThinkingStepKind kind = IThinkingStepKind.reason]) => switch (kind) {
      IThinkingStepKind.search => 'search',
      IThinkingStepKind.code => 'code',
      IThinkingStepKind.tool => 'layers',
      IThinkingStepKind.reason => 'sparkle',
    };

/// 整条轨迹的概括，折叠时顶在标题上。
IThinkingSummary summarizeThinking(List<IThinkingStep> steps) {
  var done = 0;
  var running = 0;
  var failed = 0;
  var activeIndex = steps.length - 1;
  for (var i = 0; i < steps.length; i++) {
    final status = steps[i].status;
    if (status == IThinkingStepStatus.done) done++;
    if (status == IThinkingStepStatus.error) failed++;
    if (status == IThinkingStepStatus.running) {
      running++;
      // 多步同时进行时以第一步为准：读者读的是从上往下的顺序
      if (running == 1) activeIndex = i;
    }
  }
  return IThinkingSummary(
    total: steps.length,
    done: done,
    running: running,
    failed: failed,
    activeIndex: steps.isEmpty ? -1 : activeIndex,
  );
}

/// 默认展开哪几步。
///
/// 出错的那步一定展开——用户此刻要看的正是错在哪，让他再点一下才看得到是白费一次操作。
/// 进行中的那步也展开：它的内容正在长出来，折着看不到它在动，界面就像卡住了。
List<String> defaultOpenSteps(List<IThinkingStep> steps) => [
      for (final s in steps)
        if (s.status == IThinkingStepStatus.error || s.status == IThinkingStepStatus.running) s.key,
    ];

/// 展开 / 收起一步。返回新列表而不是就地改，重建时才认得出变化
List<String> toggleThinkingStep(List<String> open, String key) =>
    open.contains(key) ? [for (final k in open) if (k != key) k] : [...open, key];
