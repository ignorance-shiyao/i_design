// 由 packages/flutter/scripts/build-golden-test.mjs 生成，请勿手改。
//
// 期望值全部由 packages/common 的 TypeScript 实现算出，因此这份测试校验的是
// 「Dart 移植与公共层是否一致」，而不是「Dart 移植与自己是否一致」。
import 'package:flutter_test/flutter_test.dart';
import 'package:i_design/src/logic/pagination.dart';
import 'package:i_design/src/logic/number.dart';
import 'package:i_design/src/logic/select.dart';
import 'package:i_design/src/logic/table.dart';
import 'package:i_design/src/logic/overlay.dart';
import 'package:i_design/src/logic/tree.dart';
import 'package:i_design/src/logic/agent.dart';
import 'package:i_design/src/logic/chart.dart';

void _expectPages(List<IPageItem> actual, List<IPageItem> expected, String label) {
  expect(actual.length, expected.length, reason: '$label 长度不一致');
  for (var i = 0; i < expected.length; i++) {
    expect(actual[i].page, expected[i].page, reason: '$label 第 $i 项页码不一致');
    expect(actual[i].gap, expected[i].gap, reason: '$label 第 $i 项省略位不一致');
  }
}

void _expectOverlay(IOverlayPosition actual, double x, double y,
    IPlacement placement, double arrow, String label) {
  expect(actual.x, closeTo(x, 1e-9), reason: '$label x 不一致');
  expect(actual.y, closeTo(y, 1e-9), reason: '$label y 不一致');
  expect(actual.placement, placement, reason: '$label 方向不一致');
  expect(actual.arrow, closeTo(arrow, 1e-9), reason: '$label 箭头位置不一致');
}

void _expectTreeState(ITreeCheckState actual, Set<String> checked,
    Set<String> halfChecked, String label) {
  expect(actual.checked, checked, reason: '$label 选中集合不一致');
  expect(actual.halfChecked, halfChecked, reason: '$label 半选集合不一致');
}

void _expectTreeSearch(ITreeSearchResult actual, Set<String> visible,
    Set<String> expand, Set<String> matched, String label) {
  expect(actual.visible, visible, reason: '$label 可见集合不一致');
  expect(actual.expand, expand, reason: '$label 展开集合不一致');
  expect(actual.matched, matched, reason: '$label 命中集合不一致');
}

void _expectColumns(List<List<ITreeNode>> actual, List<List<String>> expected,
    String label) {
  expect(actual.length, expected.length, reason: '$label 列数不一致');
  for (var i = 0; i < expected.length; i++) {
    expect(actual[i].map((n) => n.key).toList(), expected[i],
        reason: '$label 第 $i 列内容不一致');
  }
}

void _expectTaskSummary(ITaskSummary actual, int total, int completed, int failed,
    int running, bool settled, int percent, String label) {
  expect(actual.total, total, reason: '$label total 不一致');
  expect(actual.completed, completed, reason: '$label completed 不一致');
  expect(actual.failed, failed, reason: '$label failed 不一致');
  expect(actual.running, running, reason: '$label running 不一致');
  expect(actual.settled, settled, reason: '$label settled 不一致');
  expect(actual.percent, percent, reason: '$label percent 不一致');
}

void _expectConfidence(IConfidence actual, IConfidenceLevel level, int bars,
    String labelText, String label) {
  expect(actual.level, level, reason: '$label 档位不一致');
  expect(actual.bars, bars, reason: '$label 格数不一致');
  expect(actual.label, labelText, reason: '$label 文案不一致');
}

void _expectDiff(IDiffSummary actual, int added, int removed, int changed,
    int selected, int total, String label, String reason) {
  expect(actual.added, added, reason: '$reason added 不一致');
  expect(actual.removed, removed, reason: '$reason removed 不一致');
  expect(actual.changed, changed, reason: '$reason changed 不一致');
  expect(actual.selected, selected, reason: '$reason selected 不一致');
  expect(actual.total, total, reason: '$reason total 不一致');
  expect(diffActionLabel(actual), label, reason: '$reason 按钮文案不一致');
}

void _expectBox(IBoxStats actual, double q1, double median, double q3,
    double lower, double upper, int outliers, String reason) {
  expect(actual.q1, closeTo(q1, 1e-9), reason: '$reason q1 不一致');
  expect(actual.median, closeTo(median, 1e-9), reason: '$reason 中位数不一致');
  expect(actual.q3, closeTo(q3, 1e-9), reason: '$reason q3 不一致');
  expect(actual.lower, closeTo(lower, 1e-9), reason: '$reason 下须不一致');
  expect(actual.upper, closeTo(upper, 1e-9), reason: '$reason 上须不一致');
  expect(actual.outliers.length, outliers, reason: '$reason 离群点数不一致');
}

void main() {
  test('buildPages 与 Web 端逐项一致', () {
    _expectPages(buildPages(1, 100, 5), <IPageItem>[const IPageItem.page(1), const IPageItem.page(2), const IPageItem.page(3), const IPageItem.page(4), const IPageItem.page(5), const IPageItem.page(6), const IPageItem.gap('right'), const IPageItem.page(100)],
        'buildPages(1, 100, 5)');
    _expectPages(buildPages(7, 100, 5), <IPageItem>[const IPageItem.page(1), const IPageItem.gap('left'), const IPageItem.page(5), const IPageItem.page(6), const IPageItem.page(7), const IPageItem.page(8), const IPageItem.page(9), const IPageItem.gap('right'), const IPageItem.page(100)],
        'buildPages(7, 100, 5)');
    _expectPages(buildPages(50, 100, 5), <IPageItem>[const IPageItem.page(1), const IPageItem.gap('left'), const IPageItem.page(48), const IPageItem.page(49), const IPageItem.page(50), const IPageItem.page(51), const IPageItem.page(52), const IPageItem.gap('right'), const IPageItem.page(100)],
        'buildPages(50, 100, 5)');
    _expectPages(buildPages(98, 100, 5), <IPageItem>[const IPageItem.page(1), const IPageItem.gap('left'), const IPageItem.page(95), const IPageItem.page(96), const IPageItem.page(97), const IPageItem.page(98), const IPageItem.page(99), const IPageItem.page(100)],
        'buildPages(98, 100, 5)');
    _expectPages(buildPages(100, 100, 5), <IPageItem>[const IPageItem.page(1), const IPageItem.gap('left'), const IPageItem.page(95), const IPageItem.page(96), const IPageItem.page(97), const IPageItem.page(98), const IPageItem.page(99), const IPageItem.page(100)],
        'buildPages(100, 100, 5)');
    _expectPages(buildPages(1, 3, 5), <IPageItem>[const IPageItem.page(1), const IPageItem.page(2), const IPageItem.page(3)],
        'buildPages(1, 3, 5)');
    _expectPages(buildPages(2, 7, 5), <IPageItem>[const IPageItem.page(1), const IPageItem.page(2), const IPageItem.page(3), const IPageItem.page(4), const IPageItem.page(5), const IPageItem.page(6), const IPageItem.page(7)],
        'buildPages(2, 7, 5)');
    _expectPages(buildPages(4, 8, 3), <IPageItem>[const IPageItem.page(1), const IPageItem.gap('left'), const IPageItem.page(3), const IPageItem.page(4), const IPageItem.page(5), const IPageItem.gap('right'), const IPageItem.page(8)],
        'buildPages(4, 8, 3)');
    _expectPages(buildPages(1, 0, 5), <IPageItem>[const IPageItem.page(1)],
        'buildPages(1, 0, 5)');
    _expectPages(buildPages(3, 12, 7), <IPageItem>[const IPageItem.page(1), const IPageItem.page(2), const IPageItem.page(3), const IPageItem.page(4), const IPageItem.page(5), const IPageItem.page(6), const IPageItem.page(7), const IPageItem.page(8), const IPageItem.gap('right'), const IPageItem.page(12)],
        'buildPages(3, 12, 7)');
  });

  test('pageCountOf 与 Web 端一致', () {
    expect(pageCountOf(0, 10), 1);
    expect(pageCountOf(1, 10), 1);
    expect(pageCountOf(10, 10), 1);
    expect(pageCountOf(11, 10), 2);
    expect(pageCountOf(95, 10), 10);
    expect(pageCountOf(7, 0), 7);
  });

  test('clampPage 与 Web 端一致', () {
    expect(clampPage(0, 5), 1);
    expect(clampPage(1, 5), 1);
    expect(clampPage(5, 5), 5);
    expect(clampPage(9, 5), 5);
    expect(clampPage(-3, 5), 1);
    expect(clampPage(2, 0), 1);
  });

  test('nextSortOrder 三态循环与 Web 端一致', () {
    expect(nextSortOrder(null), ISortOrder.asc);
    expect(nextSortOrder(ISortOrder.asc), ISortOrder.desc);
    expect(nextSortOrder(ISortOrder.desc), null);
  });

  test('sortRows 顺序与 Web 端一致（空值恒在末尾）', () {
    final rows = <Map<String, Object?>>[
      {'name': 'b', 'score': 8},
      {'name': 'a', 'score': 3},
      {'name': 'c', 'score': null},
      {'name': 'd', 'score': 5},
    ];
    expect(sortRows(rows, 'score', ISortOrder.asc).map((r) => r['name']).toList(),
        <String>['a', 'd', 'b', 'c']);
    expect(sortRows(rows, 'score', ISortOrder.desc).map((r) => r['name']).toList(),
        <String>['b', 'd', 'a', 'c']);
    expect(sortRows(rows, 'name', ISortOrder.asc).map((r) => r['name']).toList(),
        <String>['a', 'b', 'c', 'd']);
  });

  test('数值夹取 / 取整 / 步进 / 比例换算与 Web 端一致', () {
    expect(clampNumber(5, 0, 10), 5);
    expect(clampNumber(-3, 0, 10), 0);
    expect(clampNumber(99, 0, 10), 10);
    expect(roundTo(0.30000000000000004, 2), 0.3);
    expect(roundTo(1.005, 2), 1);
    expect(roundTo(2.5, 0), 3);
    expect(stepValue(0.1, 0.2, 0, 1, 2), 0.3);
    expect(stepValue(9.5, 1, 0, 10, 1), 10);
    expect(stepValue(0, -1, 0, 10, 0), 0);
    expect(ratioOf(25, 0, 100), 0.25);
    expect(ratioOf(0, 0, 100), 0);
    expect(ratioOf(7, 5, 5), 0);
    expect(valueFromRatio(0.37, 0, 100, 5, 0), 35);
    expect(valueFromRatio(0.5, 0, 1, 0.1, 1), 0.5);
    expect(valueFromRatio(1.2, 0, 10, 1, 0), 10);
  });

  test('bubbleRadius 按面积映射，与 Web 端一致', () {
    expect(bubbleRadius(0.0, 0.0, 100.0),
        closeTo(4, 1e-9));
    expect(bubbleRadius(50.0, 0.0, 100.0),
        closeTo(13.038404810405298, 1e-9));
    expect(bubbleRadius(100.0, 0.0, 100.0),
        closeTo(18, 1e-9));
    expect(bubbleRadius(7.0, 5.0, 5.0),
        closeTo(4, 1e-9));
    expect(bubbleRadius(-3.0, 0.0, 10.0),
        closeTo(4, 1e-9));
  });

  test('trendLine 斜率、截距与 R² 与 Web 端一致', () {
    final fit0 = trendLine(<ScatterPoint>[ScatterPoint(x: 1.0, y: 2.0), ScatterPoint(x: 2.0, y: 4.0), ScatterPoint(x: 3.0, y: 6.0), ScatterPoint(x: 4.0, y: 8.0)])!;
    expect(fit0.slope, closeTo(2, 1e-9));
    expect(fit0.intercept, closeTo(0, 1e-9));
    expect(fit0.r2, closeTo(1, 1e-9));
    final fit1 = trendLine(<ScatterPoint>[ScatterPoint(x: 1.0, y: 3.0), ScatterPoint(x: 2.0, y: 1.0), ScatterPoint(x: 3.0, y: 4.0), ScatterPoint(x: 4.0, y: 2.0), ScatterPoint(x: 5.0, y: 6.0)])!;
    expect(fit1.slope, closeTo(0.7, 1e-9));
    expect(fit1.intercept, closeTo(1.1, 1e-9));
    expect(fit1.r2, closeTo(0.33108108108108114, 1e-9));
    expect(trendLine(<ScatterPoint>[ScatterPoint(x: 1.0, y: 5.0), ScatterPoint(x: 2.0, y: 5.0)]), isNull, reason: '第 2 组应当不拟合');
    expect(trendLine(<ScatterPoint>[ScatterPoint(x: 2.0, y: 1.0), ScatterPoint(x: 2.0, y: 4.0), ScatterPoint(x: 2.0, y: 9.0)]), isNull, reason: '第 3 组应当不拟合');
  });

  test('moveActive / moveActiveLoop 与 Web 端一致', () {
    final disabled = <bool>[false, true, false, true, false];
    expect(moveActive(disabled, 0, 1), 2);
    expect(moveActiveLoop(disabled, 0, 1), 2);
    expect(moveActive(disabled, 0, -1), 0);
    expect(moveActiveLoop(disabled, 0, -1), 4);
    expect(moveActive(disabled, 2, 1), 4);
    expect(moveActiveLoop(disabled, 2, 1), 4);
    expect(moveActive(disabled, 4, 1), 4);
    expect(moveActiveLoop(disabled, 4, 1), 0);
    expect(moveActive(disabled, 4, -1), 2);
    expect(moveActiveLoop(disabled, 4, -1), 2);
    expect(moveActive(disabled, 2, -1), 0);
    expect(moveActiveLoop(disabled, 2, -1), 0);
  });

  test('resolveOverlay 落点、翻转与箭头位置与 Web 端一致', () {
    _expectOverlay(
        resolveOverlay(
          trigger: const IOverlayRect(400, 300, 80, 32),
          popup: const IOverlayRect(0, 0, 200, 100),
          viewport: const IOverlayRect(0, 0, 1000, 600),
          placement: IPlacement.top,
        ),
        340, 192, IPlacement.top, 100,
        'resolveOverlay(400,300 top)');
    _expectOverlay(
        resolveOverlay(
          trigger: const IOverlayRect(400, 10, 80, 32),
          popup: const IOverlayRect(0, 0, 200, 100),
          viewport: const IOverlayRect(0, 0, 1000, 600),
          placement: IPlacement.top,
        ),
        340, 50, IPlacement.bottom, 100,
        'resolveOverlay(400,10 top)');
    _expectOverlay(
        resolveOverlay(
          trigger: const IOverlayRect(400, 560, 80, 32),
          popup: const IOverlayRect(0, 0, 200, 100),
          viewport: const IOverlayRect(0, 0, 1000, 600),
          placement: IPlacement.bottom,
        ),
        340, 452, IPlacement.top, 100,
        'resolveOverlay(400,560 bottom)');
    _expectOverlay(
        resolveOverlay(
          trigger: const IOverlayRect(960, 300, 40, 32),
          popup: const IOverlayRect(0, 0, 200, 100),
          viewport: const IOverlayRect(0, 0, 1000, 600),
          placement: IPlacement.bottom,
        ),
        792, 340, IPlacement.bottom, 188,
        'resolveOverlay(960,300 bottom)');
    _expectOverlay(
        resolveOverlay(
          trigger: const IOverlayRect(4, 300, 40, 32),
          popup: const IOverlayRect(0, 0, 200, 100),
          viewport: const IOverlayRect(0, 0, 1000, 600),
          placement: IPlacement.bottom,
        ),
        8, 340, IPlacement.bottom, 16,
        'resolveOverlay(4,300 bottom)');
    _expectOverlay(
        resolveOverlay(
          trigger: const IOverlayRect(400, 300, 80, 32),
          popup: const IOverlayRect(0, 0, 200, 100),
          viewport: const IOverlayRect(0, 0, 1000, 600),
          placement: IPlacement.right,
        ),
        488, 266, IPlacement.right, 50,
        'resolveOverlay(400,300 right)');
    _expectOverlay(
        resolveOverlay(
          trigger: const IOverlayRect(960, 300, 40, 32),
          popup: const IOverlayRect(0, 0, 200, 100),
          viewport: const IOverlayRect(0, 0, 1000, 600),
          placement: IPlacement.right,
        ),
        752, 266, IPlacement.left, 50,
        'resolveOverlay(960,300 right)');
    _expectOverlay(
        resolveOverlay(
          trigger: const IOverlayRect(400, 300, 80, 32),
          popup: const IOverlayRect(0, 0, 300, 100),
          viewport: const IOverlayRect(0, 0, 1000, 600),
          placement: IPlacement.bottom,
          align: IOverlayAlign.start,
        ),
        400, 340, IPlacement.bottom, 40,
        'resolveOverlay(400,300 bottom start)');
    _expectOverlay(
        resolveOverlay(
          trigger: const IOverlayRect(900, 300, 80, 32),
          popup: const IOverlayRect(0, 0, 300, 100),
          viewport: const IOverlayRect(0, 0, 1000, 600),
          placement: IPlacement.bottom,
          align: IOverlayAlign.start,
        ),
        692, 340, IPlacement.bottom, 248,
        'resolveOverlay(900,300 bottom start)');
    _expectOverlay(
        resolveOverlay(
          trigger: const IOverlayRect(400, 300, 80, 32),
          popup: const IOverlayRect(0, 0, 200, 300),
          viewport: const IOverlayRect(0, 0, 1000, 600),
          placement: IPlacement.right,
          align: IOverlayAlign.start,
        ),
        488, 292, IPlacement.right, 24,
        'resolveOverlay(400,300 right start)');
  });

  test('moveMenuActive / firstMenuActive 与 Web 端一致', () {
    final selectable = [true,false,false,true,true];
    expect(firstMenuActive(selectable), 0);
    expect(moveMenuActive(selectable, 0, 1), 3);
    expect(moveMenuActive(selectable, 0, -1), 4);
    expect(moveMenuActive(selectable, 3, 1), 4);
    expect(moveMenuActive(selectable, 4, 1), 0);
    expect(moveMenuActive(selectable, 4, -1), 3);
  });

  test('树的选中/半选传播与 Web 端一致（含禁用继承）', () {
    final entities = flattenTree(<ITreeNode>[
      ITreeNode(key: 'a', label: '平台', children: <ITreeNode>[
        ITreeNode(key: 'a1', label: '账号'),
        ITreeNode(key: 'a2', label: '权限', children: <ITreeNode>[
          ITreeNode(key: 'a2x', label: '角色'),
          ITreeNode(key: 'a2y', label: '策略', disabled: true),
        ]),
      ]),
      ITreeNode(key: 'b', label: '计费', children: <ITreeNode>[
        ITreeNode(key: 'b1', label: '账单'),
      ]),
      ITreeNode(key: 'c', label: '归档', disabled: true, children: <ITreeNode>[
        ITreeNode(key: 'c1', label: '旧数据'),
      ]),
    ]);
    _expectTreeState(
        resolveCheckState(entities, toggleChecked(entities, <String>[], 'a2', true)),
        <String>{'a2', 'a2x'}, <String>{'a'},
        'toggleChecked(a2, true)');
    _expectTreeState(
        resolveCheckState(entities, toggleChecked(entities, <String>[], 'a', true)),
        <String>{'a', 'a1', 'a2', 'a2x'}, <String>{},
        'toggleChecked(a, true)');
    _expectTreeState(
        resolveCheckState(entities, toggleChecked(entities, <String>['a1'], 'a2', true)),
        <String>{'a', 'a1', 'a2', 'a2x'}, <String>{},
        'toggleChecked(a2, true)');
    _expectTreeState(
        resolveCheckState(entities, toggleChecked(entities, <String>['a1', 'a2'], 'a2x', false)),
        <String>{'a1'}, <String>{'a'},
        'toggleChecked(a2x, false)');
    _expectTreeState(
        resolveCheckState(entities, toggleChecked(entities, <String>[], 'c', true)),
        <String>{}, <String>{},
        'toggleChecked(c, true)');
    expect(
        (leafKeys(entities, resolveCheckState(entities, toggleChecked(entities, <String>[], 'a', true)).checked)..sort()),
        <String>['a1', 'a2x']);
  });

  test('树的搜索命中与祖先展开与 Web 端一致', () {
    final entities = flattenTree(<ITreeNode>[
      ITreeNode(key: 'a', label: '平台', children: <ITreeNode>[
        ITreeNode(key: 'a1', label: '账号'),
        ITreeNode(key: 'a2', label: '权限', children: <ITreeNode>[
          ITreeNode(key: 'a2x', label: '角色'),
          ITreeNode(key: 'a2y', label: '策略', disabled: true),
        ]),
      ]),
      ITreeNode(key: 'b', label: '计费', children: <ITreeNode>[
        ITreeNode(key: 'b1', label: '账单'),
      ]),
      ITreeNode(key: 'c', label: '归档', disabled: true, children: <ITreeNode>[
        ITreeNode(key: 'c1', label: '旧数据'),
      ]),
    ]);
    _expectTreeSearch(searchTree(entities, '角色'),
        <String>{'a', 'a2', 'a2x'}, <String>{'a', 'a2'}, <String>{'a2x'}, 'searchTree(角色)');
    _expectTreeSearch(searchTree(entities, '平台'),
        <String>{'a', 'a1', 'a2', 'a2x', 'a2y'}, <String>{}, <String>{'a'}, 'searchTree(平台)');
    _expectTreeSearch(searchTree(entities, '账'),
        <String>{'a', 'a1', 'b', 'b1'}, <String>{'a', 'b'}, <String>{'a1', 'b1'}, 'searchTree(账)');
  });

  test('级联列生成与换列截断与 Web 端一致', () {
    final data = <ITreeNode>[
      ITreeNode(key: 'cn', label: '中国', children: <ITreeNode>[
        ITreeNode(key: 'zj', label: '浙江', children: <ITreeNode>[
          ITreeNode(key: 'hz', label: '杭州'),
          ITreeNode(key: 'nb', label: '宁波'),
        ]),
        ITreeNode(key: 'js', label: '江苏', children: <ITreeNode>[
          ITreeNode(key: 'nj', label: '南京'),
        ]),
      ]),
      ITreeNode(key: 'us', label: '美国', children: <ITreeNode>[
        ITreeNode(key: 'ca', label: '加州'),
      ]),
    ];
    final entities = flattenTree(data);
    _expectColumns(cascaderColumns(data, entities, <String>[]),
        <List<String>>[<String>['cn', 'us']],
        'cascaderColumns()');
    _expectColumns(cascaderColumns(data, entities, <String>['cn']),
        <List<String>>[<String>['cn', 'us'], <String>['zj', 'js']],
        'cascaderColumns(cn)');
    _expectColumns(cascaderColumns(data, entities, <String>['cn', 'zj']),
        <List<String>>[<String>['cn', 'us'], <String>['zj', 'js'], <String>['hz', 'nb']],
        'cascaderColumns(cn/zj)');
    _expectColumns(cascaderColumns(data, entities, <String>['cn', 'zj', 'hz']),
        <List<String>>[<String>['cn', 'us'], <String>['zj', 'js'], <String>['hz', 'nb']],
        'cascaderColumns(cn/zj/hz)');
    expect(cascaderActivate(entities, <String>['cn', 'zj', 'hz'], 'js'),
        <String>['cn', 'js']);
    expect(cascaderActivate(entities, <String>['cn'], 'us'),
        <String>['us']);
    expect(cascaderActivate(entities, <String>[], 'hz'),
        <String>['cn', 'zj', 'hz']);
  });

  test('任务汇总与 Web 端一致（失败计入已结束）', () {
    _expectTaskSummary(summarizeTasks(<IAgentTask>[IAgentTask(id: '0', title: 't', status: IAgentTaskStatus.completed), IAgentTask(id: '1', title: 't', status: IAgentTaskStatus.failed), IAgentTask(id: '2', title: 't', status: IAgentTaskStatus.running), IAgentTask(id: '3', title: 't', status: IAgentTaskStatus.pending)]),
        4, 1, 1, 1, false, 50,
        'summarizeTasks(completed/failed/running/pending)');
    _expectTaskSummary(summarizeTasks(<IAgentTask>[IAgentTask(id: '0', title: 't', status: IAgentTaskStatus.completed), IAgentTask(id: '1', title: 't', status: IAgentTaskStatus.completed)]),
        2, 2, 0, 0, true, 100,
        'summarizeTasks(completed/completed)');
    _expectTaskSummary(summarizeTasks(<IAgentTask>[IAgentTask(id: '0', title: 't', status: IAgentTaskStatus.failed), IAgentTask(id: '1', title: 't', status: IAgentTaskStatus.failed)]),
        2, 0, 2, 0, true, 100,
        'summarizeTasks(failed/failed)');
    _expectTaskSummary(summarizeTasks(<IAgentTask>[IAgentTask(id: '0', title: 't', status: IAgentTaskStatus.running)]),
        1, 0, 0, 1, false, 0,
        'summarizeTasks(running)');
    _expectTaskSummary(summarizeTasks(const <IAgentTask>[]),
        0, 0, 0, 0, false, 0,
        'summarizeTasks(空)');
  });

  test('置信度分档与进度文本与 Web 端一致', () {
    _expectConfidence(confidenceOf(0.00), IConfidenceLevel.low, 1, '低置信度', 'confidenceOf(0)');
    _expectConfidence(confidenceOf(0.20), IConfidenceLevel.low, 1, '低置信度', 'confidenceOf(0.2)');
    _expectConfidence(confidenceOf(0.44), IConfidenceLevel.low, 1, '低置信度', 'confidenceOf(0.44)');
    _expectConfidence(confidenceOf(0.45), IConfidenceLevel.medium, 2, '中等置信度', 'confidenceOf(0.45)');
    _expectConfidence(confidenceOf(0.60), IConfidenceLevel.medium, 2, '中等置信度', 'confidenceOf(0.6)');
    _expectConfidence(confidenceOf(0.74), IConfidenceLevel.medium, 2, '中等置信度', 'confidenceOf(0.74)');
    _expectConfidence(confidenceOf(0.75), IConfidenceLevel.high, 3, '高置信度', 'confidenceOf(0.75)');
    _expectConfidence(confidenceOf(0.90), IConfidenceLevel.high, 3, '高置信度', 'confidenceOf(0.9)');
    _expectConfidence(confidenceOf(1.00), IConfidenceLevel.high, 3, '高置信度', 'confidenceOf(1)');
    _expectConfidence(confidenceOf(5.00), IConfidenceLevel.high, 3, '高置信度', 'confidenceOf(5)');
    _expectConfidence(confidenceOf(-1.00), IConfidenceLevel.low, 1, '低置信度', 'confidenceOf(-1)');
    expect(approvalProgress(0, 3), '1/3');
    expect(approvalProgress(1, 3), '2/3');
    expect(approvalProgress(2, 3), '3/3');
    expect(approvalProgress(9, 3), '3/3');
    expect(approvalProgress(0, 1), '1/1');
  });

  test('片段字符数与截断按码点计算，与 Web 端一致', () {
    expect(chunkLength("冷链认证"), 4);
    expect(chunkPreview("冷链认证", 10), "冷链认证");
    expect(chunkLength("a🎉b"), 3);
    expect(chunkPreview("a🎉b", 10), "a🎉b");
    expect(chunkLength(""), 0);
    expect(chunkPreview("", 10), "");
    expect(chunkLength("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"), 200);
    expect(chunkPreview("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", 10), "xxxxxxxxxx…");
    expect(chunkLength("🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉"), 20);
    expect(chunkPreview("🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉", 10), "🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉…");
  });

  test('差异统计、默认全选与按钮文案与 Web 端一致', () {
    final rows = <IDiffRow>[IDiffRow(id: 'r0', kind: IDiffRowKind.removed, cells: const {}), IDiffRow(id: 'r1', kind: IDiffRowKind.removed, cells: const {}), IDiffRow(id: 'r2', kind: IDiffRowKind.unchanged, cells: const {}), IDiffRow(id: 'r3', kind: IDiffRowKind.added, cells: const {}), IDiffRow(id: 'r4', kind: IDiffRowKind.changed, cells: const {})];
    expect(defaultDiffSelection(rows), <String>['r0', 'r1', 'r3', 'r4']);
    expect(toggleDiffRow(rows, <String>['r0', 'r1', 'r3', 'r4'], 'r2').length, 4);
    expect(toggleDiffRow(rows, <String>['r0', 'r1', 'r3', 'r4'], 'zz').length, 4);
    _expectDiff(summarizeDiff(rows, <String>['r0', 'r1', 'r3', 'r4']),
        1, 2, 1, 4, 4,
        "应用 4 处改动", 'summarizeDiff(4 选中)');
    _expectDiff(summarizeDiff(rows, <String>['r1', 'r3', 'r4']),
        1, 2, 1, 3, 4,
        "应用 3 处改动", 'summarizeDiff(3 选中)');
    _expectDiff(summarizeDiff(rows, <String>[]),
        1, 2, 1, 0, 4,
        "未选择改动", 'summarizeDiff(0 选中)');
    expect(diffActionLabel(summarizeDiff(<IDiffRow>[], <String>[])), "没有需要应用的改动");
  });

  test('分位数与箱线图五数概括与 Web 端一致', () {
    expect(quantile(<double>[1.0, 2.0, 3.0], 0.50), closeTo(2, 1e-9));
    expect(quantile(<double>[1.0, 2.0, 3.0, 4.0], 0.50), closeTo(2.5, 1e-9));
    expect(quantile(<double>[1.0, 2.0, 3.0, 4.0], 0.25), closeTo(1.75, 1e-9));
    expect(quantile(<double>[1.0, 2.0, 3.0, 4.0], 0.75), closeTo(3.25, 1e-9));
    expect(quantile(<double>[5.0], 0.25), closeTo(5, 1e-9));
    expect(quantile(<double>[1.0, 2.0, 3.0], 2.00), closeTo(3, 1e-9));
    expect(quantile(<double>[1.0, 2.0, 3.0], -1.00), closeTo(1, 1e-9));
    _expectBox(boxStats(<double>[1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0]),
        3, 5, 7, 1, 9, 0,
        'boxStats(9 个值)');
    _expectBox(boxStats(<double>[1.0, 2.0, 3.0, 4.0, 5.0, 100.0]),
        2.25, 3.5, 4.75, 1, 5, 1,
        'boxStats(6 个值)');
    _expectBox(boxStats(<double>[5.0, 5.0, 5.0]),
        5, 5, 5, 5, 5, 0,
        'boxStats(3 个值)');
    _expectBox(boxStats(<double>[10.0]),
        10, 10, 10, 10, 10, 0,
        'boxStats(1 个值)');
  });

  test('瀑布图柱子起止与值域与 Web 端一致', () {
    final bars = waterfallBars(<IWaterfallItem>[IWaterfallItem(label: '期初', value: 100.0), IWaterfallItem(label: '增', value: 40.0), IWaterfallItem(label: '减', value: -25.0), IWaterfallItem(label: '合计', value: 0.0, total: true)]);
    expect(bars[0].start, closeTo(0, 1e-9));
    expect(bars[0].end, closeTo(100, 1e-9));
    expect(bars[0].kind, IWaterfallKind.increase);
    expect(bars[1].start, closeTo(100, 1e-9));
    expect(bars[1].end, closeTo(140, 1e-9));
    expect(bars[1].kind, IWaterfallKind.increase);
    expect(bars[2].start, closeTo(140, 1e-9));
    expect(bars[2].end, closeTo(115, 1e-9));
    expect(bars[2].kind, IWaterfallKind.decrease);
    expect(bars[3].start, closeTo(0, 1e-9));
    expect(bars[3].end, closeTo(115, 1e-9));
    expect(bars[3].kind, IWaterfallKind.total);
    expect(
        waterfallDomain(waterfallBars(<IWaterfallItem>[
          const IWaterfallItem(label: 'a', value: 50.0),
          const IWaterfallItem(label: 'b', value: -80.0),
          const IWaterfallItem(label: 'c', value: 60.0),
        ])),
        <double>[-30.0, 50.0]);
  });
}
