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
import 'package:i_design/src/logic/flow.dart';
import 'package:i_design/src/logic/carousel.dart';
import 'package:i_design/src/logic/scroll.dart';
import 'package:i_design/src/logic/keypad.dart';
import 'package:i_design/src/logic/taginput.dart';
import 'package:i_design/src/logic/time.dart';
import 'package:i_design/src/logic/transfer.dart';
import 'package:i_design/src/logic/affix.dart';
import 'package:i_design/src/logic/image.dart';
import 'package:i_design/src/logic/splitter.dart';
import 'package:i_design/src/logic/virtual.dart';
import 'package:i_design/src/logic/color.dart';
import 'package:i_design/src/logic/calendar.dart';
import 'package:i_design/src/logic/mention.dart';
import 'package:i_design/src/logic/range.dart';
import 'package:i_design/src/logic/qrcode.dart';
import 'package:i_design/src/logic/pull.dart';
import 'package:i_design/src/logic/indexes.dart';
import 'package:i_design/src/logic/otp.dart';
import 'package:i_design/src/logic/time_select.dart';
import 'package:i_design/src/logic/scrollbar.dart';
import 'package:i_design/src/logic/countdown.dart';
import 'package:i_design/src/logic/multiselect.dart';
import 'package:i_design/src/logic/confirm.dart';

void _expectQr(String text, QrEcLevel level, int version, int mask, String rows) {
  final m = qrMatrix(text, level);
  expect(m, isNotNull, reason: '$text 应当能编码');
  expect(m!.version, version, reason: '$text 版本不一致');
  expect(m.mask, mask, reason: '$text 掩码不一致');
  final actual = m.modules.map((row) => row.map((v) => v ? '1' : '0').join()).join('|');
  expect(actual, rows, reason: '$text 矩阵与 Web 端不一致');
}

void _expectDots(DotRange actual, List<int> items, int active, String label) {
  expect(actual.items, items, reason: '$label 点位不一致');
  expect(actual.active, active, reason: '$label 当前项不一致');
}

void _expectDraft(TagDraftSplit actual, List<String> ready, String rest, String label) {
  expect(actual.ready, ready, reason: '$label 成词部分不一致');
  expect(actual.rest, rest, reason: '$label 留存部分不一致');
}

void _expectAdd(TagAddResult actual, List<String> tags, TagRejectReason? rejected, String label) {
  expect(actual.tags, tags, reason: '$label 结果不一致');
  expect(actual.rejected, rejected, reason: '$label 拒绝原因不一致');
}

void _expectParts(List<IMatchPart> actual, List<IMatchPart> expected, String label) {
  expect(actual.length, expected.length, reason: '$label 段数不一致');
  for (var i = 0; i < expected.length; i++) {
    expect(actual[i].text, expected[i].text, reason: '$label 第 $i 段文字不一致');
    expect(actual[i].hit, expected[i].hit, reason: '$label 第 $i 段命中标记不一致');
  }
}

void _expectHole(ITourHole actual, double x, double y, double w, double h, String label) {
  expect(actual.x, closeTo(x, 1e-9), reason: '$label x 不一致');
  expect(actual.y, closeTo(y, 1e-9), reason: '$label y 不一致');
  expect(actual.width, closeTo(w, 1e-9), reason: '$label 宽不一致');
  expect(actual.height, closeTo(h, 1e-9), reason: '$label 高不一致');
}

void _expectRect(Rect actual, double x, double y, double w, double h, String label) {
  expect(actual.left, closeTo(x, 1e-9), reason: '$label x 不一致');
  expect(actual.top, closeTo(y, 1e-9), reason: '$label y 不一致');
  expect(actual.width, closeTo(w, 1e-9), reason: '$label 宽不一致');
  expect(actual.height, closeTo(h, 1e-9), reason: '$label 高不一致');
}

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

void _expectWindow(IZoomWindow actual, int start, int end, String reason) {
  expect(actual.start, start, reason: '$reason start 不一致');
  expect(actual.end, end, reason: '$reason end 不一致');
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
    _expectWindow(clampWindow(const IZoomWindow(start: 2, end: 6), 10, 2), 2, 6,
        'clampWindow(2,6 / 10 / 2)');
    _expectWindow(clampWindow(const IZoomWindow(start: -5, end: 6), 10, 2), 0, 6,
        'clampWindow(-5,6 / 10 / 2)');
    _expectWindow(clampWindow(const IZoomWindow(start: 2, end: 99), 10, 2), 2, 9,
        'clampWindow(2,99 / 10 / 2)');
    _expectWindow(clampWindow(const IZoomWindow(start: 7, end: 3), 10, 2), 3, 7,
        'clampWindow(7,3 / 10 / 2)');
    _expectWindow(clampWindow(const IZoomWindow(start: 5, end: 5), 10, 3), 5, 7,
        'clampWindow(5,5 / 10 / 3)');
    _expectWindow(clampWindow(const IZoomWindow(start: 9, end: 9), 10, 3), 7, 9,
        'clampWindow(9,9 / 10 / 3)');
    _expectWindow(clampWindow(const IZoomWindow(start: 0, end: 0), 2, 5), 0, 1,
        'clampWindow(0,0 / 2 / 5)');
    _expectWindow(clampWindow(const IZoomWindow(start: 0, end: 5), 0, 2), 0, 0,
        'clampWindow(0,5 / 0 / 2)');
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

  test('区间缩放的夹取、交叉与平移与 Web 端一致', () {
    _expectWindow(clampWindow(const IZoomWindow(start: 2, end: 6), 10, 2), 2, 6,
        'clampWindow(2,6 / 10 / 2)');
    _expectWindow(clampWindow(const IZoomWindow(start: -5, end: 6), 10, 2), 0, 6,
        'clampWindow(-5,6 / 10 / 2)');
    _expectWindow(clampWindow(const IZoomWindow(start: 2, end: 99), 10, 2), 2, 9,
        'clampWindow(2,99 / 10 / 2)');
    _expectWindow(clampWindow(const IZoomWindow(start: 7, end: 3), 10, 2), 3, 7,
        'clampWindow(7,3 / 10 / 2)');
    _expectWindow(clampWindow(const IZoomWindow(start: 5, end: 5), 10, 3), 5, 7,
        'clampWindow(5,5 / 10 / 3)');
    _expectWindow(clampWindow(const IZoomWindow(start: 9, end: 9), 10, 3), 7, 9,
        'clampWindow(9,9 / 10 / 3)');
    _expectWindow(clampWindow(const IZoomWindow(start: 0, end: 0), 2, 5), 0, 1,
        'clampWindow(0,0 / 2 / 5)');
    _expectWindow(clampWindow(const IZoomWindow(start: 0, end: 5), 0, 2), 0, 0,
        'clampWindow(0,5 / 0 / 2)');
    expect(panImage(const IImageTransform(scale: 1, rotate: 0, x: 0, y: 0), 10.0, 10.0), const IImageTransform(scale: 1, rotate: 0, x: 0, y: 0));
    expect(panImage(const IImageTransform(scale: 2, rotate: 0, x: 0, y: 0), 10.0, -20.0), const IImageTransform(scale: 2, rotate: 0, x: 10, y: -20));
    expect(panImage(const IImageTransform(scale: 0.5, rotate: 0, x: 5, y: 5), 10.0, 10.0), const IImageTransform(scale: 0.5, rotate: 0, x: 5, y: 5));
    _expectWindow(windowFromRatio(0.00, 1.00, 10), 0, 9,
        'windowFromRatio(0,1)');
    _expectWindow(windowFromRatio(0.00, 0.50, 11), 0, 5,
        'windowFromRatio(0,0.5)');
  });

  test('轴标签抽稀与 Web 端一致', () {
    expect(stepImage(0, 3, 1), 1);
    expect(stepImage(2, 3, 1), 2);
    expect(stepImage(0, 3, -1), 0);
    expect(stepImage(1, 3, -1), 0);
    expect(stepImage(0, 0, 1), 0);
    expect(showLabelAt(0, 90, 8), true);
    expect(showLabelAt(1, 90, 8), false);
    expect(showLabelAt(8, 90, 8), true);
    expect(showLabelAt(88, 90, 8), false);
    expect(showLabelAt(89, 90, 8), true);
  });

  test('桑基图分层、节点高度与缎带几何与 Web 端一致', () {
    final layout = sankeyLayout(<ISankeyLink>[const ISankeyLink(from: 'visit', to: 'leave', value: 600.0), const ISankeyLink(from: 'visit', to: 'signup', value: 400.0), const ISankeyLink(from: 'signup', to: 'idle', value: 280.0), const ISankeyLink(from: 'signup', to: 'pay', value: 120.0)], 520.0, 260.0);
    expect(layout.nodes.length, 5);
    expect(layout.ribbons.length, 4);
    expect(layout.nodes[0].key, 'visit');
    expect(layout.nodes[0].depth, 0);
    expect(layout.nodes[0].value, closeTo(1000, 1e-9));
    expect(layout.nodes[0].x, closeTo(0, 1e-9));
    expect(layout.nodes[0].y, closeTo(0, 1e-9));
    expect(layout.nodes[0].height, closeTo(260, 1e-9));
    expect(layout.nodes[1].key, 'leave');
    expect(layout.nodes[1].depth, 1);
    expect(layout.nodes[1].value, closeTo(600, 1e-9));
    expect(layout.nodes[1].x, closeTo(254, 1e-9));
    expect(layout.nodes[1].y, closeTo(0, 1e-9));
    expect(layout.nodes[1].height, closeTo(148.79999999999998, 1e-9));
    expect(layout.nodes[2].key, 'signup');
    expect(layout.nodes[2].depth, 1);
    expect(layout.nodes[2].value, closeTo(400, 1e-9));
    expect(layout.nodes[2].x, closeTo(254, 1e-9));
    expect(layout.nodes[2].y, closeTo(160.79999999999998, 1e-9));
    expect(layout.nodes[2].height, closeTo(99.2, 1e-9));
    expect(layout.nodes[3].key, 'idle');
    expect(layout.nodes[3].depth, 2);
    expect(layout.nodes[3].value, closeTo(280, 1e-9));
    expect(layout.nodes[3].x, closeTo(508, 1e-9));
    expect(layout.nodes[3].y, closeTo(0, 1e-9));
    expect(layout.nodes[3].height, closeTo(173.6, 1e-9));
    expect(layout.nodes[4].key, 'pay');
    expect(layout.nodes[4].depth, 2);
    expect(layout.nodes[4].value, closeTo(120, 1e-9));
    expect(layout.nodes[4].x, closeTo(508, 1e-9));
    expect(layout.nodes[4].y, closeTo(185.6, 1e-9));
    expect(layout.nodes[4].height, closeTo(74.39999999999999, 1e-9));
    expect(layout.ribbons[0].from, 'visit');
    expect(layout.ribbons[0].to, 'leave');
    expect(layout.ribbons[0].source.top, closeTo(0, 1e-9));
    expect(layout.ribbons[0].source.bottom, closeTo(156, 1e-9));
    expect(layout.ribbons[0].target.top, closeTo(0, 1e-9));
    expect(layout.ribbons[0].target.bottom, closeTo(148.79999999999998, 1e-9));
    expect(layout.ribbons[0].controlX, closeTo(133, 1e-9));
    expect(layout.ribbons[1].from, 'visit');
    expect(layout.ribbons[1].to, 'signup');
    expect(layout.ribbons[1].source.top, closeTo(156, 1e-9));
    expect(layout.ribbons[1].source.bottom, closeTo(260, 1e-9));
    expect(layout.ribbons[1].target.top, closeTo(160.79999999999998, 1e-9));
    expect(layout.ribbons[1].target.bottom, closeTo(260, 1e-9));
    expect(layout.ribbons[1].controlX, closeTo(133, 1e-9));
    expect(layout.ribbons[2].from, 'signup');
    expect(layout.ribbons[2].to, 'idle');
    expect(layout.ribbons[2].source.top, closeTo(160.79999999999998, 1e-9));
    expect(layout.ribbons[2].source.bottom, closeTo(230.23999999999998, 1e-9));
    expect(layout.ribbons[2].target.top, closeTo(0, 1e-9));
    expect(layout.ribbons[2].target.bottom, closeTo(173.6, 1e-9));
    expect(layout.ribbons[2].controlX, closeTo(387, 1e-9));
    expect(layout.ribbons[3].from, 'signup');
    expect(layout.ribbons[3].to, 'pay');
    expect(layout.ribbons[3].source.top, closeTo(230.23999999999998, 1e-9));
    expect(layout.ribbons[3].source.bottom, closeTo(260, 1e-9));
    expect(layout.ribbons[3].target.top, closeTo(185.6, 1e-9));
    expect(layout.ribbons[3].target.bottom, closeTo(260, 1e-9));
    expect(layout.ribbons[3].controlX, closeTo(387, 1e-9));
  });

  test('框选矩形归一化与命中判定与 Web 端一致', () {
    final nodes = <FlowNodeData>[const FlowNodeData(id: 'a', label: 'A', x: 0.0, y: 0.0), const FlowNodeData(id: 'b', label: 'B', x: 200.0, y: 0.0), const FlowNodeData(id: 'c', label: 'C', x: 100.0, y: 120.0, width: 80.0, height: 40.0)];
    _expectRect(marqueeRect(const Offset(10.0, 10.0), const Offset(300.0, 200.0)),
        10.0, 10.0, 290.0, 190.0, 'marquee(10,10)');
    _expectRect(marqueeRect(const Offset(300.0, 200.0), const Offset(10.0, 10.0)),
        10.0, 10.0, 290.0, 190.0, 'marquee(300,200)');
    _expectRect(marqueeRect(const Offset(50.0, 50.0), const Offset(50.0, 50.0)),
        50.0, 50.0, 0.0, 0.0, 'marquee(50,50)');
    expect(
        nodesInRect(nodes, const Rect.fromLTWH(-10.0, -10.0, 400.0, 300.0), intersect: false),
        <String>['a', 'b', 'c']);
    expect(
        nodesInRect(nodes, const Rect.fromLTWH(-10.0, -10.0, 100.0, 60.0), intersect: false),
        <String>[]);
    expect(
        nodesInRect(nodes, const Rect.fromLTWH(-10.0, -10.0, 100.0, 60.0), intersect: true),
        <String>['a']);
    expect(
        nodesInRect(nodes, const Rect.fromLTWH(500.0, 500.0, 10.0, 10.0), intersect: true),
        <String>[]);
    expect(
        nodesInRect(nodes, const Rect.fromLTWH(0.0, 0.0, 132.0, 48.0), intersect: false),
        <String>['a']);
  });

  test('批量移动整组一个位移，与 Web 端一致', () {
    final nodes = <FlowNodeData>[const FlowNodeData(id: 'a', label: 'A', x: 0.0, y: 0.0), const FlowNodeData(id: 'b', label: 'B', x: 200.0, y: 0.0), const FlowNodeData(id: 'c', label: 'C', x: 100.0, y: 120.0, width: 80.0, height: 40.0)];
    expect(moveNodes(nodes, {'a', 'c'}, const Offset(10.0, 10.0))[0].x, closeTo(8, 1e-9));
    expect(moveNodes(nodes, {'a', 'c'}, const Offset(10.0, 10.0))[0].y, closeTo(8, 1e-9));
    expect(moveNodes(nodes, {'a', 'c'}, const Offset(10.0, 10.0))[1].x, closeTo(108, 1e-9));
    expect(moveNodes(nodes, {'a', 'c'}, const Offset(10.0, 10.0))[1].y, closeTo(128, 1e-9));
    expect(moveNodes(nodes, {'a', 'c'}, const Offset(3.0, -3.0))[0].x, closeTo(0, 1e-9));
    expect(moveNodes(nodes, {'a', 'c'}, const Offset(3.0, -3.0))[0].y, closeTo(0, 1e-9));
    expect(moveNodes(nodes, {'a', 'c'}, const Offset(3.0, -3.0))[1].x, closeTo(100, 1e-9));
    expect(moveNodes(nodes, {'a', 'c'}, const Offset(3.0, -3.0))[1].y, closeTo(120, 1e-9));
    expect(moveNodes(nodes, {'a', 'c'}, const Offset(-20.0, 44.0))[0].x, closeTo(-16, 1e-9));
    expect(moveNodes(nodes, {'a', 'c'}, const Offset(-20.0, 44.0))[0].y, closeTo(48, 1e-9));
    expect(moveNodes(nodes, {'a', 'c'}, const Offset(-20.0, 44.0))[1].x, closeTo(84, 1e-9));
    expect(moveNodes(nodes, {'a', 'c'}, const Offset(-20.0, 44.0))[1].y, closeTo(168, 1e-9));
  });

  test('节点缩放固定对角并夹到下限，与 Web 端一致', () {
    final nodes = <FlowNodeData>[const FlowNodeData(id: 'a', label: 'A', x: 0.0, y: 0.0), const FlowNodeData(id: 'b', label: 'B', x: 200.0, y: 0.0), const FlowNodeData(id: 'c', label: 'C', x: 100.0, y: 120.0, width: 80.0, height: 40.0)];
    _expectRect(resizeNode(nodes[0], FlowResizeHandle.se, const Offset(400.0, 300.0)),
        0.0, 0.0, 400.0, 304.0, 'resize se');
    _expectRect(resizeNode(nodes[0], FlowResizeHandle.nw, const Offset(-40.0, -40.0)),
        -40.0, -40.0, 172.0, 88.0, 'resize nw');
    _expectRect(resizeNode(nodes[0], FlowResizeHandle.se, const Offset(-999.0, -999.0)),
        0.0, 0.0, 72.0, 32.0, 'resize se');
    _expectRect(resizeNode(nodes[0], FlowResizeHandle.nw, const Offset(999.0, 999.0)),
        60.0, 16.0, 72.0, 32.0, 'resize nw');
    _expectRect(resizeNode(nodes[0], FlowResizeHandle.ne, const Offset(300.0, -30.0)),
        0.0, -32.0, 304.0, 80.0, 'resize ne');
    _expectRect(resizeNode(nodes[0], FlowResizeHandle.sw, const Offset(-30.0, 300.0)),
        -32.0, 0.0, 164.0, 304.0, 'resize sw');
  });

  test('缩略图布局与它的逆运算与 Web 端一致', () {
    final nodes = <FlowNodeData>[const FlowNodeData(id: 'a', label: 'A', x: 0.0, y: 0.0), const FlowNodeData(id: 'b', label: 'B', x: 200.0, y: 0.0), const FlowNodeData(id: 'c', label: 'C', x: 100.0, y: 120.0, width: 80.0, height: 40.0)];
    final mm = minimapLayout(nodes, const FlowView(x: -100.0, y: -50.0, scale: 1.5),
        const Size(640.0, 380.0), const Size(168.0, 112.0));
    expect(mm.scale, closeTo(0.4077669902912621, 1e-9));
    expect(mm.offset.dx, closeTo(16.310679611650485, 1e-9));
    expect(mm.offset.dy, closeTo(23.37864077669903, 1e-9));
    _expectRect(mm.viewport, 43.49514563106796, 36.970873786407765, 173.98058252427185, 103.30097087378641, 'viewport');
    final back = viewFromMinimap(const Offset(84.0, 56.0), mm,
        const FlowView(x: -100.0, y: -50.0, scale: 1.5), const Size(640.0, 380.0));
    expect(back.x, closeTo(71, 1e-9));
    expect(back.y, closeTo(70, 1e-9));
  });

  test('走马灯翻页判定与 Web 端一致（位移或速度任一达标）', () {
    expect(resolveSwipe(-200.0, 600.0, 400.0), 1);
    expect(resolveSwipe(-40.0, 600.0, 80.0), 1);
    expect(resolveSwipe(-40.0, 600.0, 600.0), 0);
    expect(resolveSwipe(200.0, 600.0, 400.0), -1);
    expect(resolveSwipe(0.0, 600.0, 100.0), 0);
    expect(resolveSwipe(-100.0, 0.0, 100.0), 0);
    expect(nextIndex(0, 5, -1, loop: true), 4);
    expect(nextIndex(4, 5, 1, loop: true), 0);
    expect(nextIndex(0, 5, -1, loop: false), 0);
    expect(nextIndex(4, 5, 1, loop: false), 4);
    expect(nextIndex(2, 5, 2, loop: false), 4);
    expect(nextIndex(0, 0, 1, loop: true), 0);
  });

  test('指示点收窗与两端阻尼与 Web 端一致', () {
    _expectDots(dotRange(0, 3, max: 7), <int>[0, 1, 2], 0, 'dots(0/3)');
    _expectDots(dotRange(0, 20, max: 7), <int>[0, 1, 2, 3, 4, 5, 6], 0, 'dots(0/20)');
    _expectDots(dotRange(10, 20, max: 7), <int>[7, 8, 9, 10, 11, 12, 13], 10, 'dots(10/20)');
    _expectDots(dotRange(19, 20, max: 7), <int>[13, 14, 15, 16, 17, 18, 19], 19, 'dots(19/20)');
    _expectDots(dotRange(2, 20, max: 5), <int>[0, 1, 2, 3, 4], 2, 'dots(2/20)');
    expect(rubberBand(-0.5, 5, loop: false), closeTo(-0.15, 1e-9));
    expect(rubberBand(5.5, 5, loop: false), closeTo(4.45, 1e-9));
    expect(rubberBand(2.0, 5, loop: false), closeTo(2, 1e-9));
    expect(rubberBand(-0.5, 5, loop: true), closeTo(-0.5, 1e-9));
  });

  test('无限滚动触发判定与 Web 端一致（含没撑满容器的情形）', () {
    expect(
        shouldLoadMore(scrollTop: 0.0, clientHeight: 600.0,
            scrollHeight: 300.0, status: LoadStatus.idle),
        true);
    expect(
        shouldLoadMore(scrollTop: 0.0, clientHeight: 600.0,
            scrollHeight: 300.0, status: LoadStatus.loading),
        false);
    expect(
        shouldLoadMore(scrollTop: 0.0, clientHeight: 600.0,
            scrollHeight: 300.0, status: LoadStatus.finished),
        false);
    expect(
        shouldLoadMore(scrollTop: 900.0, clientHeight: 600.0,
            scrollHeight: 1600.0, status: LoadStatus.idle),
        true);
    expect(
        shouldLoadMore(scrollTop: 400.0, clientHeight: 600.0,
            scrollHeight: 1600.0, status: LoadStatus.idle),
        false);
    expect(
        shouldLoadMore(scrollTop: 900.0, clientHeight: 600.0,
            scrollHeight: 1600.0, status: LoadStatus.error),
        false);
    expect(loadHint(LoadStatus.loading, empty: false), '加载中…');
    expect(loadHint(LoadStatus.error, empty: false), '加载失败，点击重试');
    expect(loadHint(LoadStatus.finished, empty: false), '没有更多了');
    expect(loadHint(LoadStatus.finished, empty: true), '暂无内容');
    expect(loadHint(LoadStatus.idle, empty: false), '');
  });

  test('数字键盘按键规则与 Web 端一致', () {
    expect(keyboardStep('ArrowLeft', false), -8);
    expect(keyboardStep('ArrowLeft', true), -48);
    expect(keyboardStep('ArrowRight', false), 8);
    expect(keyboardStep('ArrowRight', true), 48);
    expect(keyboardStep('ArrowUp', false), -8);
    expect(keyboardStep('ArrowDown', true), 48);
    expect(keyboardStep('Enter', false), 0);
    expect(pressKey('', '.', decimals: 2, maxLength: 12, negative: false),
        '0.');
    expect(pressKey('0', '5', decimals: 2, maxLength: 12, negative: false),
        '5');
    expect(pressKey('-0', '5', decimals: 2, maxLength: 12, negative: true),
        '-5');
    expect(pressKey('12', '.', decimals: 0, maxLength: 12, negative: false),
        '12');
    expect(pressKey('', 'sign', decimals: 2, maxLength: 12, negative: true),
        '-');
    expect(pressKey('-3', 'sign', decimals: 2, maxLength: 12, negative: true),
        '3');
    expect(pressKey('', 'sign', decimals: 2, maxLength: 12, negative: false),
        '');
    expect(pressKey('123456789012', '3', decimals: 2, maxLength: 12, negative: false),
        '123456789012');
    expect(pressKey('', 'backspace', decimals: 2, maxLength: 12, negative: false),
        '');
    expect(keypadRows(decimals: 2, negative: false),
        <List<String>>[<String>['1', '2', '3'], <String>['4', '5', '6'], <String>['7', '8', '9'], <String>['.', '0', 'backspace']]);
    expect(keypadRows(decimals: 0, negative: false),
        <List<String>>[<String>['1', '2', '3'], <String>['4', '5', '6'], <String>['7', '8', '9'], <String>['', '0', 'backspace']]);
    expect(keypadRows(decimals: 2, negative: true),
        <List<String>>[<String>['1', '2', '3'], <String>['4', '5', '6'], <String>['7', '8', '9'], <String>['sign', '0', 'backspace']]);
    expect(isComplete(''), false);
    expect(isComplete('-'), false);
    expect(isComplete('.'), false);
    expect(isComplete('12'), true);
    expect(isComplete('12.'), false);
    expect(isComplete('12.5'), true);
    expect(isComplete('-3.25'), true);
    expect(isComplete('1.2.3'), false);
  });

  test('新手引导的高亮框、步进与滚动判定与 Web 端一致', () {
    _expectHole(tourHole(const Rect.fromLTWH(10.0, 20.0, 100.0, 40.0), padding: 6.0),
        4.0, 14.0, 112.0, 52.0, 'hole(10,20)');
    _expectHole(tourHole(const Rect.fromLTWH(0.0, 0.0, 8.0, 8.0), padding: 0.0),
        0.0, 0.0, 8.0, 8.0, 'hole(0,0)');
    _expectHole(tourHole(const Rect.fromLTWH(-5.0, -5.0, 50.0, 50.0), padding: 12.0),
        -17.0, -17.0, 74.0, 74.0, 'hole(-5,-5)');
    expect(tourNext(0, 3), 1);
    expect(tourPrev(0), 0);
    expect(tourNext(1, 3), 2);
    expect(tourPrev(1), 0);
    expect(tourNext(2, 3), -1);
    expect(tourPrev(2), 1);
    expect(tourNext(0, 1), -1);
    expect(tourPrev(0), 0);
    expect(tourNext(5, 3), -1);
    expect(tourPrev(5), 4);
    expect(tourScrollTo(const Rect.fromLTWH(0.0, 1000.0, 0.0, 40.0), 800.0, 0.0),
        closeTo(620, 1e-9));
    expect(tourScrollTo(const Rect.fromLTWH(0.0, -200.0, 0.0, 40.0), 800.0, 500.0),
        closeTo(0, 1e-9));
    expect(tourScrollTo(const Rect.fromLTWH(0.0, 10.0, 0.0, 40.0), 800.0, 0.0),
        closeTo(0, 1e-9));
    expect(tourNeedsScroll(const Rect.fromLTWH(0.0, 10.0, 0.0, 40.0), 800.0),
        true);
    expect(tourNeedsScroll(const Rect.fromLTWH(0.0, 400.0, 0.0, 40.0), 800.0),
        false);
    expect(tourNeedsScroll(const Rect.fromLTWH(0.0, 780.0, 0.0, 40.0), 800.0),
        true);
    expect(tourNeedsScroll(const Rect.fromLTWH(0.0, -1.0, 0.0, 40.0), 800.0),
        true);
  });

  test('输入标签的拆分、去重与退格与 Web 端一致', () {
    expect(splitTags('a,b,c'),
        <String>['a', 'b', 'c']);
    expect(splitTags('a，b；c'),
        <String>['a', 'b', 'c']);
    expect(splitTags(' x1 , x2 \n x3 '),
        <String>['x1', 'x2', 'x3']);
    expect(splitTags('onlyone'),
        <String>['onlyone']);
    expect(splitTags(''),
        <String>[]);
    expect(splitTags(',,,'),
        <String>[]);
    expect(splitTags('a\tb'),
        <String>['a', 'b']);
    _expectDraft(splitDraft('a,b,c'), <String>['a', 'b'], 'c', 'draft(a,b,c)');
    _expectDraft(splitDraft('abc'), <String>[], 'abc', 'draft(abc)');
    _expectDraft(splitDraft('a,'), <String>['a'], '', 'draft(a,)');
    _expectDraft(splitDraft(',a'), <String>[], 'a', 'draft(,a)');
    _expectAdd(addTags(<String>['a'], <String>['b', 'c'], allowDuplicate: false, max: 0),
        <String>['a', 'b', 'c'], null, 'add(b|c)');
    _expectAdd(addTags(<String>['a'], <String>['a'], allowDuplicate: false, max: 0),
        <String>['a'], TagRejectReason.duplicate, 'add(a)');
    _expectAdd(addTags(<String>['a'], <String>['a'], allowDuplicate: true, max: 0),
        <String>['a', 'a'], null, 'add(a)');
    _expectAdd(addTags(<String>['a', 'b'], <String>['c'], allowDuplicate: false, max: 2),
        <String>['a', 'b'], TagRejectReason.max, 'add(c)');
    _expectAdd(addTags(<String>['a'], <String>['  '], allowDuplicate: false, max: 0),
        <String>['a'], TagRejectReason.empty, 'add(  )');
    _expectAdd(addTags(<String>[], <String>['x', 'x', 'y'], allowDuplicate: false, max: 0),
        <String>['x', 'y'], TagRejectReason.duplicate, 'add(x|x|y)');
    expect(backspace(<String>['a', 'b'], '').consumed, true);
    expect(backspace(<String>['a', 'b'], '').tags, <String>['a']);
    expect(backspace(<String>['a', 'b'], 'x').consumed, false);
    expect(backspace(<String>['a', 'b'], 'x').tags, <String>['a', 'b']);
    expect(backspace(<String>[], '').consumed, false);
    expect(backspace(<String>[], '').tags, <String>[]);
    expect(removeTag(<String>['a', 'b', 'c'], 1), <String>['a', 'c']);
    expect(removeTag(<String>['a'], 0), <String>[]);
    expect(removeTag(<String>['a'], 5), <String>['a']);
  });

  test('自动完成的命中切段与候选排序与 Web 端一致', () {
    _expectParts(matchParts('北京', '北'), <IMatchPart>[IMatchPart(text: '北', hit: true), IMatchPart(text: '京', hit: false)], 'match(北京,北)');
    _expectParts(matchParts('湖北', '北'), <IMatchPart>[IMatchPart(text: '湖', hit: false), IMatchPart(text: '北', hit: true)], 'match(湖北,北)');
    _expectParts(matchParts('Beijing', 'ji'), <IMatchPart>[IMatchPart(text: 'Bei', hit: false), IMatchPart(text: 'ji', hit: true), IMatchPart(text: 'ng', hit: false)], 'match(Beijing,ji)');
    _expectParts(matchParts('abcabc', 'bc'), <IMatchPart>[IMatchPart(text: 'a', hit: false), IMatchPart(text: 'bc', hit: true), IMatchPart(text: 'a', hit: false), IMatchPart(text: 'bc', hit: true)], 'match(abcabc,bc)');
    _expectParts(matchParts('abc', ''), <IMatchPart>[IMatchPart(text: 'abc', hit: false)], 'match(abc,)');
    _expectParts(matchParts('abc', 'z'), <IMatchPart>[IMatchPart(text: 'abc', hit: false)], 'match(abc,z)');
    expect(
        filterSuggestions(<ISuggestion>[const ISuggestion(value: '北京'), const ISuggestion(value: '北海'), const ISuggestion(value: '湖北'), const ISuggestion(value: '河北'), const ISuggestion(value: '上海'), const ISuggestion(value: '珠海')], '北', limit: 20).map((s) => s.value).toList(),
        <String>['北京', '北海', '湖北', '河北']);
    expect(
        filterSuggestions(<ISuggestion>[const ISuggestion(value: '北京'), const ISuggestion(value: '北海'), const ISuggestion(value: '湖北'), const ISuggestion(value: '河北'), const ISuggestion(value: '上海'), const ISuggestion(value: '珠海')], '海', limit: 20).map((s) => s.value).toList(),
        <String>['北海', '上海', '珠海']);
    expect(
        filterSuggestions(<ISuggestion>[const ISuggestion(value: '北京'), const ISuggestion(value: '北海'), const ISuggestion(value: '湖北'), const ISuggestion(value: '河北'), const ISuggestion(value: '上海'), const ISuggestion(value: '珠海')], '北', limit: 2).map((s) => s.value).toList(),
        <String>['北京', '北海']);
    expect(
        filterSuggestions(<ISuggestion>[const ISuggestion(value: '北京'), const ISuggestion(value: '北海'), const ISuggestion(value: '湖北'), const ISuggestion(value: '河北'), const ISuggestion(value: '上海'), const ISuggestion(value: '珠海')], '', limit: 3).map((s) => s.value).toList(),
        <String>['北京', '北海', '湖北']);
    expect(
        filterSuggestions(<ISuggestion>[const ISuggestion(value: '北京'), const ISuggestion(value: '北海'), const ISuggestion(value: '湖北'), const ISuggestion(value: '河北'), const ISuggestion(value: '上海'), const ISuggestion(value: '珠海')], 'zz', limit: 20).map((s) => s.value).toList(),
        <String>[]);
  });

  test('时间的格式化、解析、列与范围判定与 Web 端一致', () {
    expect(formatTime(const ITimeValue(hour: 9, minute: 5, second: 0), showSecond: true), '09:05:00');
    expect(formatTime(const ITimeValue(hour: 9, minute: 5, second: 0), showSecond: false), '09:05');
    expect(formatTime(const ITimeValue(hour: 23, minute: 59, second: 59), showSecond: true), '23:59:59');
    expect(parseTime('09:00'), const ITimeValue(hour: 9, minute: 0, second: 0));
    expect(parseTime('9:5'), const ITimeValue(hour: 9, minute: 5, second: 0));
    expect(parseTime('09:00:30'), const ITimeValue(hour: 9, minute: 0, second: 30));
    expect(parseTime('24:00'), isNull);
    expect(parseTime('09:60'), isNull);
    expect(parseTime('abc'), isNull);
    expect(parseTime(''), isNull);
    expect(timeColumn('hour', step: 1), <int>[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]);
    expect(timeColumn('hour', step: 6), <int>[0, 6, 12, 18]);
    expect(timeColumn('minute', step: 15), <int>[0, 15, 30, 45]);
    expect(timeColumn('minute', step: 1), <int>[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59]);
    expect(timeColumn('second', step: 30), <int>[0, 30]);
    expect(timeColumn('minute', step: 0), <int>[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59]);
    expect(
        isUnitEnabled('hour', 7, const ITimeValue(hour: 9, minute: 0, second: 0),
            min: const ITimeValue(hour: 8, minute: 30, second: 15), max: const ITimeValue(hour: 20, minute: 0, second: 0)),
        false);
    expect(
        isUnitEnabled('hour', 9, const ITimeValue(hour: 9, minute: 0, second: 0),
            min: const ITimeValue(hour: 8, minute: 30, second: 15), max: const ITimeValue(hour: 20, minute: 0, second: 0)),
        true);
    expect(
        isUnitEnabled('hour', 21, const ITimeValue(hour: 9, minute: 0, second: 0),
            min: const ITimeValue(hour: 8, minute: 30, second: 15), max: const ITimeValue(hour: 20, minute: 0, second: 0)),
        false);
    expect(
        isUnitEnabled('minute', 10, const ITimeValue(hour: 8, minute: 0, second: 0),
            min: const ITimeValue(hour: 8, minute: 30, second: 15), max: const ITimeValue(hour: 20, minute: 0, second: 0)),
        false);
    expect(
        isUnitEnabled('minute', 10, const ITimeValue(hour: 12, minute: 0, second: 0),
            min: const ITimeValue(hour: 8, minute: 30, second: 15), max: const ITimeValue(hour: 20, minute: 0, second: 0)),
        true);
    expect(
        isUnitEnabled('minute', 10, const ITimeValue(hour: 20, minute: 0, second: 0),
            min: const ITimeValue(hour: 8, minute: 30, second: 15), max: const ITimeValue(hour: 20, minute: 0, second: 0)),
        false);
    expect(
        isUnitEnabled('second', 10, const ITimeValue(hour: 8, minute: 30, second: 0),
            min: const ITimeValue(hour: 8, minute: 30, second: 15), max: const ITimeValue(hour: 20, minute: 0, second: 0)),
        false);
    expect(
        clampTime(const ITimeValue(hour: 7, minute: 3, second: 0), min: const ITimeValue(hour: 8, minute: 30, second: 15), max: const ITimeValue(hour: 20, minute: 0, second: 0),
            minuteStep: 15, showSecond: false),
        const ITimeValue(hour: 8, minute: 30, second: 0));
    expect(
        clampTime(const ITimeValue(hour: 22, minute: 40, second: 0), min: const ITimeValue(hour: 8, minute: 30, second: 15), max: const ITimeValue(hour: 20, minute: 0, second: 0),
            minuteStep: 15, showSecond: false),
        const ITimeValue(hour: 20, minute: 0, second: 0));
    expect(
        clampTime(const ITimeValue(hour: 12, minute: 37, second: 0), min: const ITimeValue(hour: 8, minute: 30, second: 15), max: const ITimeValue(hour: 20, minute: 0, second: 0),
            minuteStep: 15, showSecond: false),
        const ITimeValue(hour: 12, minute: 30, second: 0));
    expect(
        clampTime(const ITimeValue(hour: 12, minute: 37, second: 0), min: const ITimeValue(hour: 8, minute: 30, second: 15), max: const ITimeValue(hour: 20, minute: 0, second: 0),
            minuteStep: 1, showSecond: false),
        const ITimeValue(hour: 12, minute: 37, second: 0));
    expect(isValidRange(const ITimeValue(hour: 9, minute: 0, second: 0), const ITimeValue(hour: 18, minute: 0, second: 0)), true);
    expect(isValidRange(const ITimeValue(hour: 9, minute: 0, second: 0), const ITimeValue(hour: 9, minute: 0, second: 0)), true);
    expect(isValidRange(const ITimeValue(hour: 18, minute: 0, second: 0), const ITimeValue(hour: 9, minute: 0, second: 0)), false);
  });

  test('固定间隔的时间点与 Web 端一致', () {
    expect(timeSelectOptions(start: '09:00', end: '11:00', step: 30).map((o) => o.value).toList(), ['09:00', '09:30', '10:00', '10:30', '11:00']);
    expect(timeSelectOptions(start: '09:00', end: '11:00', step: 30).map((o) => o.disabled).toList(), [false, false, false, false, false]);
    expect(timeSelectOptions(start: '09:00', end: '12:00', step: 45).map((o) => o.value).toList(), ['09:00', '09:45', '10:30', '11:15', '12:00']);
    expect(timeSelectOptions(start: '09:00', end: '12:00', step: 45).map((o) => o.disabled).toList(), [false, false, false, false, false]);
    expect(timeSelectOptions(start: '09:00', end: '10:00', step: 90).map((o) => o.value).toList(), ['09:00']);
    expect(timeSelectOptions(start: '09:00', end: '10:00', step: 90).map((o) => o.disabled).toList(), [false]);
    expect(timeSelectOptions(start: '09:00', end: '11:00', step: 30, minTime: '09:30').map((o) => o.value).toList(), ['09:00', '09:30', '10:00', '10:30', '11:00']);
    expect(timeSelectOptions(start: '09:00', end: '11:00', step: 30, minTime: '09:30').map((o) => o.disabled).toList(), [true, true, false, false, false]);
    expect(timeSelectOptions(start: '09:00', end: '11:00', step: 30, maxTime: '10:00').map((o) => o.value).toList(), ['09:00', '09:30', '10:00', '10:30', '11:00']);
    expect(timeSelectOptions(start: '09:00', end: '11:00', step: 30, maxTime: '10:00').map((o) => o.disabled).toList(), [false, false, true, true, true]);
    expect(timeSelectOptions(start: '11:00', end: '09:00', step: 30).map((o) => o.value).toList(), []);
    expect(timeSelectOptions(start: '11:00', end: '09:00', step: 30).map((o) => o.disabled).toList(), []);
    expect(minutesOfClock('09:05'), 545);
    expect(minutesOfClock('23:59'), 1439);
    expect(minutesOfClock('24:00'), isNull);
    expect(minutesOfClock('9:5'), isNull);
    expect(clockOfMinutes(0), '00:00');
    expect(clockOfMinutes(545), '09:05');
    expect(clockOfMinutes(1439), '23:59');
    expect(clockOfMinutes(1440), '00:00');
  });

  test('确认框的按钮编排、关闭语义与输入校验与 Web 端一致', () {
    expect(confirmActions(IConfirmKind.confirm).length, 2);
    expect(confirmActions(IConfirmKind.confirm)[0].role, IConfirmRole.cancel);
    expect(confirmActions(IConfirmKind.confirm)[0].text, '取消');
    expect(confirmActions(IConfirmKind.confirm)[0].primary, false);
    expect(confirmActions(IConfirmKind.confirm)[0].danger, false);
    expect(confirmActions(IConfirmKind.confirm)[1].role, IConfirmRole.confirm);
    expect(confirmActions(IConfirmKind.confirm)[1].text, '确定');
    expect(confirmActions(IConfirmKind.confirm)[1].primary, true);
    expect(confirmActions(IConfirmKind.confirm)[1].danger, false);
    expect(confirmActions(IConfirmKind.alert).length, 1);
    expect(confirmActions(IConfirmKind.alert)[0].role, IConfirmRole.confirm);
    expect(confirmActions(IConfirmKind.alert)[0].text, '确定');
    expect(confirmActions(IConfirmKind.alert)[0].primary, true);
    expect(confirmActions(IConfirmKind.alert)[0].danger, false);
    expect(confirmActions(IConfirmKind.prompt).length, 2);
    expect(confirmActions(IConfirmKind.prompt)[0].role, IConfirmRole.cancel);
    expect(confirmActions(IConfirmKind.prompt)[0].text, '取消');
    expect(confirmActions(IConfirmKind.prompt)[0].primary, false);
    expect(confirmActions(IConfirmKind.prompt)[0].danger, false);
    expect(confirmActions(IConfirmKind.prompt)[1].role, IConfirmRole.confirm);
    expect(confirmActions(IConfirmKind.prompt)[1].text, '确定');
    expect(confirmActions(IConfirmKind.prompt)[1].primary, true);
    expect(confirmActions(IConfirmKind.prompt)[1].danger, false);
    expect(confirmActions(IConfirmKind.confirm, danger: true).length, 2);
    expect(confirmActions(IConfirmKind.confirm, danger: true)[0].role, IConfirmRole.cancel);
    expect(confirmActions(IConfirmKind.confirm, danger: true)[0].text, '取消');
    expect(confirmActions(IConfirmKind.confirm, danger: true)[0].primary, false);
    expect(confirmActions(IConfirmKind.confirm, danger: true)[0].danger, false);
    expect(confirmActions(IConfirmKind.confirm, danger: true)[1].role, IConfirmRole.confirm);
    expect(confirmActions(IConfirmKind.confirm, danger: true)[1].text, '确定');
    expect(confirmActions(IConfirmKind.confirm, danger: true)[1].primary, true);
    expect(confirmActions(IConfirmKind.confirm, danger: true)[1].danger, true);
    expect(confirmActions(IConfirmKind.confirm, confirmText: '删除', cancelText: '再想想', danger: true).length, 2);
    expect(confirmActions(IConfirmKind.confirm, confirmText: '删除', cancelText: '再想想', danger: true)[0].role, IConfirmRole.cancel);
    expect(confirmActions(IConfirmKind.confirm, confirmText: '删除', cancelText: '再想想', danger: true)[0].text, '再想想');
    expect(confirmActions(IConfirmKind.confirm, confirmText: '删除', cancelText: '再想想', danger: true)[0].primary, false);
    expect(confirmActions(IConfirmKind.confirm, confirmText: '删除', cancelText: '再想想', danger: true)[0].danger, false);
    expect(confirmActions(IConfirmKind.confirm, confirmText: '删除', cancelText: '再想想', danger: true)[1].role, IConfirmRole.confirm);
    expect(confirmActions(IConfirmKind.confirm, confirmText: '删除', cancelText: '再想想', danger: true)[1].text, '删除');
    expect(confirmActions(IConfirmKind.confirm, confirmText: '删除', cancelText: '再想想', danger: true)[1].primary, true);
    expect(confirmActions(IConfirmKind.confirm, confirmText: '删除', cancelText: '再想想', danger: true)[1].danger, true);
    expect(confirmActions(IConfirmKind.alert, confirmText: '知道了').length, 1);
    expect(confirmActions(IConfirmKind.alert, confirmText: '知道了')[0].role, IConfirmRole.confirm);
    expect(confirmActions(IConfirmKind.alert, confirmText: '知道了')[0].text, '知道了');
    expect(confirmActions(IConfirmKind.alert, confirmText: '知道了')[0].primary, true);
    expect(confirmActions(IConfirmKind.alert, confirmText: '知道了')[0].danger, false);
    expect(isConfirmed(IConfirmKind.confirm, IConfirmRole.confirm), true);
    expect(isConfirmed(IConfirmKind.confirm, IConfirmRole.cancel), false);
    expect(isConfirmed(IConfirmKind.confirm, IConfirmRole.close), false);
    expect(isConfirmed(IConfirmKind.alert, IConfirmRole.confirm), true);
    expect(isConfirmed(IConfirmKind.alert, IConfirmRole.close), true);
    expect(isConfirmed(IConfirmKind.prompt, IConfirmRole.confirm), true);
    expect(isConfirmed(IConfirmKind.prompt, IConfirmRole.close), false);
    expect(validatePromptValue('', required: true), '此项必填');
    expect(validatePromptValue('  ', required: true), '此项必填');
    expect(validatePromptValue('x', required: true), null);
    expect(validatePromptValue(''), null);
    expect(validatePromptValue('abc', pattern: RegExp(r'^\d+$')), '格式不正确');
    expect(validatePromptValue('123', pattern: RegExp(r'^\d+$')), null);
    expect(validatePromptValue('', required: true, requiredMessage: '请填写名称'), '请填写名称');
  });

  test('多选的追加顺序与标签折叠与 Web 端一致', () {
    expect(toggleValue<String>(['a', 'b'], 'c'), ['a', 'b', 'c']);
    expect(toggleValue<String>(['a', 'b'], 'a'), ['b']);
    expect(toggleValue<String>(['a', 'b'], 'b'), ['a']);
    expect(toggleValue<String>([], 'a'), ['a']);
    expect(toggleValue<String>(['a'], 'a'), []);
    expect(collapseTags<String>(['a', 'b', 'c', 'd'], 0).shown, ['a', 'b', 'c', 'd']);
    expect(collapseTags<String>(['a', 'b', 'c', 'd'], 0).rest, 0);
    expect(collapseTags<String>(['a', 'b', 'c', 'd'], 2).shown, ['a', 'b']);
    expect(collapseTags<String>(['a', 'b', 'c', 'd'], 2).rest, 2);
    expect(collapseTags<String>(['a', 'b'], 2).shown, ['a', 'b']);
    expect(collapseTags<String>(['a', 'b'], 2).rest, 0);
    expect(collapseTags<String>(['a', 'b', 'c'], 1).shown, ['a']);
    expect(collapseTags<String>(['a', 'b', 'c'], 1).rest, 2);
    expect(collapseTags<String>(['a', 'b', 'c'], 9).shown, ['a', 'b', 'c']);
    expect(collapseTags<String>(['a', 'b', 'c'], 9).rest, 0);
    expect(collapseTags<String>([], 2).shown, []);
    expect(collapseTags<String>([], 2).rest, 0);
  });

  test('倒计时的取整、并位与刷新间隔与 Web 端一致', () {
    expect(formatCountdown(3661000, 'HH:mm:ss'), '01:01:01');
    expect(formatCountdown(0, 'HH:mm:ss'), '00:00:00');
    expect(formatCountdown(1400, 'ss'), '02');
    expect(formatCountdown(1400, 'ss.SSS'), '01.400');
    expect(formatCountdown(5430000, 'mm:ss'), '90:30');
    expect(formatCountdown(176400000, 'DD 天 HH:mm:ss'), '02 天 01:00:00');
    expect(formatCountdown(176400000, 'HH:mm:ss'), '49:00:00');
    expect(formatCountdown(3661000, 'H:m:s'), '1:1:1');
    expect(formatCountdown(999, 'ss'), '01');
    expect(formatCountdown(1000, 'ss'), '01');
    expect(formatCountdown(1001, 'ss'), '02');
    expect(countdownParts(1400, false).days, 0);
    expect(countdownParts(1400, false).hours, 0);
    expect(countdownParts(1400, false).minutes, 0);
    expect(countdownParts(1400, false).seconds, 2);
    expect(countdownParts(1400, false).milliseconds, 400);
    expect(countdownParts(1400, true).days, 0);
    expect(countdownParts(1400, true).hours, 0);
    expect(countdownParts(1400, true).minutes, 0);
    expect(countdownParts(1400, true).seconds, 1);
    expect(countdownParts(1400, true).milliseconds, 400);
    expect(countdownParts(0, false).days, 0);
    expect(countdownParts(0, false).hours, 0);
    expect(countdownParts(0, false).minutes, 0);
    expect(countdownParts(0, false).seconds, 0);
    expect(countdownParts(0, false).milliseconds, 0);
    expect(countdownParts(86399999, false).days, 1);
    expect(countdownParts(86399999, false).hours, 0);
    expect(countdownParts(86399999, false).minutes, 0);
    expect(countdownParts(86399999, false).seconds, 0);
    expect(countdownParts(86399999, false).milliseconds, 999);
    expect(countdownParts(86400000, true).days, 1);
    expect(countdownParts(86400000, true).hours, 0);
    expect(countdownParts(86400000, true).minutes, 0);
    expect(countdownParts(86400000, true).seconds, 0);
    expect(countdownParts(86400000, true).milliseconds, 0);
    expect(countdownRemaining(500, 100), 400);
    expect(countdownRemaining(100, 500), 0);
    expect(countdownInterval(1400), 400);
    expect(countdownInterval(2000), 1000);
    expect(countdownInterval(1400, true), 50);
  });

  test('自绘滚动条的滑块长度与位置与 Web 端一致', () {
    expect(scrollThumb((scrollTop: 0.0, clientHeight: 300.0, scrollHeight: 900.0), 300.0).size, 100.0);
    expect(scrollThumb((scrollTop: 0.0, clientHeight: 300.0, scrollHeight: 900.0), 300.0).offset, 0.0);
    expect(scrollThumb((scrollTop: 0.0, clientHeight: 300.0, scrollHeight: 900.0), 300.0).visible, true);
    expect(scrollTopOfThumb(0.0, 100.0, 300.0, (scrollTop: 0.0, clientHeight: 300.0, scrollHeight: 900.0)), 0.0);
    expect(scrollThumb((scrollTop: 600.0, clientHeight: 300.0, scrollHeight: 900.0), 300.0).size, 100.0);
    expect(scrollThumb((scrollTop: 600.0, clientHeight: 300.0, scrollHeight: 900.0), 300.0).offset, 200.0);
    expect(scrollThumb((scrollTop: 600.0, clientHeight: 300.0, scrollHeight: 900.0), 300.0).visible, true);
    expect(scrollTopOfThumb(200.0, 100.0, 300.0, (scrollTop: 600.0, clientHeight: 300.0, scrollHeight: 900.0)), 600.0);
    expect(scrollThumb((scrollTop: 300.0, clientHeight: 300.0, scrollHeight: 900.0), 300.0).size, 100.0);
    expect(scrollThumb((scrollTop: 300.0, clientHeight: 300.0, scrollHeight: 900.0), 300.0).offset, 100.0);
    expect(scrollThumb((scrollTop: 300.0, clientHeight: 300.0, scrollHeight: 900.0), 300.0).visible, true);
    expect(scrollTopOfThumb(100.0, 100.0, 300.0, (scrollTop: 300.0, clientHeight: 300.0, scrollHeight: 900.0)), 300.0);
    expect(scrollThumb((scrollTop: 0.0, clientHeight: 300.0, scrollHeight: 300.0), 300.0).size, 0.0);
    expect(scrollThumb((scrollTop: 0.0, clientHeight: 300.0, scrollHeight: 300.0), 300.0).offset, 0.0);
    expect(scrollThumb((scrollTop: 0.0, clientHeight: 300.0, scrollHeight: 300.0), 300.0).visible, false);
    expect(scrollTopOfThumb(0.0, 0.0, 300.0, (scrollTop: 0.0, clientHeight: 300.0, scrollHeight: 300.0)), 0.0);
    expect(scrollThumb((scrollTop: 0.0, clientHeight: 100.0, scrollHeight: 10000.0), 200.0).size, 24.0);
    expect(scrollThumb((scrollTop: 0.0, clientHeight: 100.0, scrollHeight: 10000.0), 200.0).offset, 0.0);
    expect(scrollThumb((scrollTop: 0.0, clientHeight: 100.0, scrollHeight: 10000.0), 200.0).visible, true);
    expect(scrollTopOfThumb(0.0, 24.0, 200.0, (scrollTop: 0.0, clientHeight: 100.0, scrollHeight: 10000.0)), 0.0);
  });

  test('验证码的粘贴分配与退格与 Web 端一致', () {
    expect(otpFromText('123456', 6), ['1', '2', '3', '4', '5', '6']);
    expect(otpValue(['1', '2', '3', '4', '5', '6']), '123456');
    expect(otpFromText('123 456', 6), ['1', '2', '3', '4', '5', '6']);
    expect(otpValue(['1', '2', '3', '4', '5', '6']), '123456');
    expect(otpFromText('12-34-56', 6), ['1', '2', '3', '4', '5', '6']);
    expect(otpValue(['1', '2', '3', '4', '5', '6']), '123456');
    expect(otpFromText('12ab34', 6), ['1', '2', '3', '4', '', '']);
    expect(otpValue(['1', '2', '3', '4', '', '']), '');
    expect(otpFromText('1234567890', 6), ['1', '2', '3', '4', '5', '6']);
    expect(otpValue(['1', '2', '3', '4', '5', '6']), '123456');
    expect(otpFromText('', 6), ['', '', '', '', '', '']);
    expect(otpValue(['', '', '', '', '', '']), '');
    expect(otpBackspace(['1', '2', '3', '', '', ''], 2).cells, ['1', '2', '', '', '', '']);
    expect(otpBackspace(['1', '2', '3', '', '', ''], 2).index, 2);
    expect(otpBackspace(['1', '2', '3', '', '', ''], 3).cells, ['1', '2', '', '', '', '']);
    expect(otpBackspace(['1', '2', '3', '', '', ''], 3).index, 2);
    expect(otpBackspace(['1', '', '', '', '', ''], 0).cells, ['', '', '', '', '', '']);
    expect(otpBackspace(['1', '', '', '', '', ''], 0).index, 0);
    expect(otpBackspace(['1', '2', '3', '4', '5', '6'], 5).cells, ['1', '2', '3', '4', '5', '']);
    expect(otpBackspace(['1', '2', '3', '4', '5', '6'], 5).index, 5);
    expect(otpNextIndex(0, 6), 1);
    expect(otpNextIndex(4, 6), 5);
    expect(otpNextIndex(5, 6), 5);
    expect(otpNextIndex(5, 1), 0);
  });

  test('下拉刷新的阻尼与阈值与 Web 端一致', () {
    expect(pullDistance(0), 0);
    expect(pullRelease(0), 0);
    expect(pullRotate(0), 0);
    expect(pullDistance(10), 9);
    expect(pullRelease(9), 0);
    expect(pullRotate(9), 29);
    expect(pullDistance(30), 24);
    expect(pullRelease(24), 0);
    expect(pullRotate(24), 77);
    expect(pullDistance(56), 38);
    expect(pullRelease(38), 0);
    expect(pullRotate(38), 122);
    expect(pullDistance(80), 48);
    expect(pullRelease(48), 0);
    expect(pullRotate(48), 154);
    expect(pullDistance(120), 60);
    expect(pullRelease(60), 48);
    expect(pullRotate(60), 180);
    expect(pullDistance(200), 75);
    expect(pullRelease(75), 48);
    expect(pullRotate(75), 180);
    expect(pullDistance(480), 96);
    expect(pullRelease(96), 48);
    expect(pullRotate(96), 180);
    expect(pullDistance(1000), 107);
    expect(pullRelease(107), 48);
    expect(pullRotate(107), 180);
  });

  test('索引列表的分组与定位与 Web 端一致', () {
    final groups = groupByIndex<String>(["Anna","bob","3M","Zoe","apple","","中文","Bill"], (item) => item);
    expect(groups.map((g) => g.index).toList(), ["A","B","Z","#"]);
    expect(groups.map((g) => g.items.length).toList(), [2,2,1,3]);
    expect(activeIndexAt([(index: 'A', top: 0.0), (index: 'B', top: 120.0), (index: '#', top: 260.0)], 0.0), 'A');
    expect(activeIndexAt([(index: 'A', top: 0.0), (index: 'B', top: 120.0), (index: '#', top: 260.0)], 119.0), 'B');
    expect(activeIndexAt([(index: 'A', top: 0.0), (index: 'B', top: 120.0), (index: '#', top: 260.0)], 120.0), 'B');
    expect(activeIndexAt([(index: 'A', top: 0.0), (index: 'B', top: 120.0), (index: '#', top: 260.0)], 259.0), '#');
    expect(activeIndexAt([(index: 'A', top: 0.0), (index: 'B', top: 120.0), (index: '#', top: 260.0)], 400.0), '#');
  });

  test('二维码矩阵与 Web 端逐格一致', () {
    _expectQr('i-design', QrEcLevel.l, 1, 2, '111111100100101111111|100000101001001000001|101110100100001011101|101110101001001011101|101110100011101011101|100000101110101000001|111111101010101111111|000000000011100000000|111110111100110101010|111001010110111111001|100110101101001001100|011011001000000011110|100000100011000000001|000000001111111111101|111111101110101000110|100000100101111001100|101110101100100110001|101110101010100111100|101110101111010001100|100000101000000011100|111111101101010101010');
    _expectQr('https://ignorance-shiyao.github.io/', QrEcLevel.m, 3, 0, '11111110011101001011001111111|10000010100000111101101000001|10111010000011101000101011101|10111010011001110010101011101|10111010110010101111001011101|10000010000111011011101000001|11111110101010101010101111111|00000000010111101111000000000|10101010000010111111100010010|01000100110000100000101001001|10110010101011000100101100111|11000000011100001101011010010|10001011110110011101111001011|00101100001001001100111001001|10110010001110100100001001011|01011000100001110110000011010|11010011111000111100011001011|01111001010110101000111001101|10111011011101001010010100011|01011001101010001111111001010|10111111001010011101111110000|00000000100101000111100010111|11111110001000101001101011011|10000010011111100101100011001|10111010111000101100111110001|10111010001010101000000110111|10111010110001000011100111001|10000010010001011101110000010|11111110101010100101110000011');
    _expectQr('设计体系 · 多端一致', QrEcLevel.q, 3, 3, '11111110010101110001001111111|10000010101000100001001000001|10111010110100111110101011101|10111010001011010110101011101|10111010011100111111101011101|10000010011111100010101000001|11111110101010101010101111111|00000000010101111101000000000|01110110011110001001000000110|11101100101110100110011101011|00101110110111111001100010101|11100000101110000011011111101|00110011111011010111001001011|10000101011010010001001111001|10010011110110111110111011100|00011101101110000111010100100|00000011010001101110101111010|01101001100101001000110011100|10110111011000111011000100101|00110101101010000000100111000|01001111110111101011111111110|00000000100011000011100011111|11111110001001001100101010011|10000010111101110011100010101|10111010000110110011111110110|10111010100100001111101111110|10111010111011111100110010101|10000010111011101110011010110|11111110001010111000000110010');
    _expectQr('x', QrEcLevel.h, 1, 5, '111111101001101111111|100000100110101000001|101110101111001011101|101110100001101011101|101110101001101011101|100000100011001000001|111111101010101111111|000000001000100000000|000001100011101010101|001110000010010010101|110000101110100011100|111100000110001010100|010010101001011000110|000000001011000101011|111111100101100100010|100000101100000111011|101110100110001100100|101110100111010000100|101110100011110000111|100000100000100010100|111111100110001011110');
    expect(qrVersionFor(10, QrEcLevel.m), 1);
    expect(qrVersionFor(200, QrEcLevel.l), 9);
    expect(qrVersionFor(400, QrEcLevel.h), -1);
    expect(qrVersionFor(1, QrEcLevel.h), 1);
  });

  test('区间的起止对调与空判定与 Web 端一致', () {
    expect(orderRange(['1', '9']), ['1', '9']);
    expect(isRangeEmpty(['1', '9']), false);
    expect(orderRange(['9', '1']), ['1', '9']);
    expect(isRangeEmpty(['9', '1']), false);
    expect(orderRange(['', '5']), ['', '5']);
    expect(isRangeEmpty(['', '5']), false);
    expect(orderRange(['5', '']), ['5', '']);
    expect(isRangeEmpty(['5', '']), false);
    expect(orderRange(['', '']), ['', '']);
    expect(isRangeEmpty(['', '']), true);
    expect(orderRange(['10', '9']), ['9', '10']);
    expect(isRangeEmpty(['10', '9']), false);
    expect(orderRange(['2026-01-05', '2026-01-03']), ['2026-01-03', '2026-01-05']);
    expect(isRangeEmpty(['2026-01-05', '2026-01-03']), false);
    expect(orderRange(['b', 'a']), ['a', 'b']);
    expect(isRangeEmpty(['b', 'a']), false);
    expect(orderRange(['a', 'a']), ['a', 'a']);
    expect(isRangeEmpty(['a', 'a']), false);
  });

  test('穿梭框的搬运、勾选与全选与 Web 端一致', () {
    final items = <ITransferItem>[const ITransferItem(key: 'read', label: '查看'), const ITransferItem(key: 'write', label: '编辑'), const ITransferItem(key: 'owner', label: '所有者', disabled: true), const ITransferItem(key: 'secret', label: '密钥管理')];
    expect(splitSides(items, <String>['secret', 'read']).source.map((i) => i.key).toList(),
        <String>['write', 'owner']);
    expect(splitSides(items, <String>['secret', 'read']).target.map((i) => i.key).toList(),
        <String>['secret', 'read']);
    expect(moveKeys(items, <String>['read'], <String>['write'], ITransferSide.target),
        <String>['read', 'write']);
    expect(moveKeys(items, <String>['read'], <String>['owner'], ITransferSide.target),
        <String>['read']);
    expect(moveKeys(items, <String>['read'], <String>['write', 'read'], ITransferSide.target),
        <String>['read', 'write']);
    expect(moveKeys(items, <String>['read', 'write'], <String>['read'], ITransferSide.source),
        <String>['write']);
    expect(moveKeys(items, <String>['read'], <String>['owner'], ITransferSide.source),
        <String>['read']);
    expect(checkedAfterMove(<String>['a', 'b', 'c'], <String>['b']),
        <String>['a', 'c']);
    expect(checkedAfterMove(<String>['a'], <String>['a']),
        <String>[]);
    expect(checkedAfterMove(<String>['a'], <String>['z']),
        <String>['a']);
    expect(headerState(<ITransferItem>[const ITransferItem(key: 'read', label: '查看'), const ITransferItem(key: 'write', label: '编辑'), const ITransferItem(key: 'owner', label: '所有者', disabled: true), const ITransferItem(key: 'secret', label: '密钥管理')], <String>[]).selectable, 3);
    expect(headerState(<ITransferItem>[const ITransferItem(key: 'read', label: '查看'), const ITransferItem(key: 'write', label: '编辑'), const ITransferItem(key: 'owner', label: '所有者', disabled: true), const ITransferItem(key: 'secret', label: '密钥管理')], <String>[]).allChecked, false);
    expect(headerState(<ITransferItem>[const ITransferItem(key: 'read', label: '查看'), const ITransferItem(key: 'write', label: '编辑'), const ITransferItem(key: 'owner', label: '所有者', disabled: true), const ITransferItem(key: 'secret', label: '密钥管理')], <String>[]).someChecked, false);
    expect(headerState(<ITransferItem>[const ITransferItem(key: 'read', label: '查看'), const ITransferItem(key: 'write', label: '编辑'), const ITransferItem(key: 'owner', label: '所有者', disabled: true), const ITransferItem(key: 'secret', label: '密钥管理')], <String>['read', 'write', 'secret']).selectable, 3);
    expect(headerState(<ITransferItem>[const ITransferItem(key: 'read', label: '查看'), const ITransferItem(key: 'write', label: '编辑'), const ITransferItem(key: 'owner', label: '所有者', disabled: true), const ITransferItem(key: 'secret', label: '密钥管理')], <String>['read', 'write', 'secret']).allChecked, true);
    expect(headerState(<ITransferItem>[const ITransferItem(key: 'read', label: '查看'), const ITransferItem(key: 'write', label: '编辑'), const ITransferItem(key: 'owner', label: '所有者', disabled: true), const ITransferItem(key: 'secret', label: '密钥管理')], <String>['read', 'write', 'secret']).someChecked, false);
    expect(headerState(<ITransferItem>[const ITransferItem(key: 'read', label: '查看'), const ITransferItem(key: 'write', label: '编辑'), const ITransferItem(key: 'owner', label: '所有者', disabled: true), const ITransferItem(key: 'secret', label: '密钥管理')], <String>['read']).selectable, 3);
    expect(headerState(<ITransferItem>[const ITransferItem(key: 'read', label: '查看'), const ITransferItem(key: 'write', label: '编辑'), const ITransferItem(key: 'owner', label: '所有者', disabled: true), const ITransferItem(key: 'secret', label: '密钥管理')], <String>['read']).allChecked, false);
    expect(headerState(<ITransferItem>[const ITransferItem(key: 'read', label: '查看'), const ITransferItem(key: 'write', label: '编辑'), const ITransferItem(key: 'owner', label: '所有者', disabled: true), const ITransferItem(key: 'secret', label: '密钥管理')], <String>['read']).someChecked, true);
    expect(headerState(<ITransferItem>[const ITransferItem(key: 'secret', label: '密钥管理')], <String>['secret']).selectable, 1);
    expect(headerState(<ITransferItem>[const ITransferItem(key: 'secret', label: '密钥管理')], <String>['secret']).allChecked, true);
    expect(headerState(<ITransferItem>[const ITransferItem(key: 'secret', label: '密钥管理')], <String>['secret']).someChecked, false);
    expect(toggleAll(items, <String>[]), <String>['read', 'write', 'secret']);
    expect(toggleAll(items, <String>['read']), <String>['read', 'write', 'secret']);
    expect(toggleAll(items, <String>['read', 'write', 'secret']), <String>[]);
    expect(filterItems(items, '密钥').map((i) => i.key).toList(),
        <String>['secret']);
    expect(filterItems(items, '').map((i) => i.key).toList(),
        <String>['read', 'write', 'owner', 'secret']);
    expect(filterItems(items, '查').map((i) => i.key).toList(),
        <String>['read']);
  });

  test('固钉与回到顶部的判定与 Web 端一致', () {
    expect(
        resolveAffix(offsetTop: 400.0, height: 40.0,
            scrollTop: 100.0, viewportHeight: 800.0, top: 0.0),
        const IAffixState(mode: IAffixMode.none, offset: 0));
    expect(
        resolveAffix(offsetTop: 400.0, height: 40.0,
            scrollTop: 500.0, viewportHeight: 800.0, top: 0.0),
        const IAffixState(mode: IAffixMode.top, offset: 0));
    expect(
        resolveAffix(offsetTop: 400.0, height: 40.0,
            scrollTop: 500.0, viewportHeight: 800.0, top: 72.0),
        const IAffixState(mode: IAffixMode.top, offset: 72));
    expect(
        resolveAffix(offsetTop: 400.0, height: 40.0,
            scrollTop: 900.0, viewportHeight: 800.0, containerBottom: 920.0, top: 0.0),
        const IAffixState(mode: IAffixMode.top, offset: -20));
    expect(
        resolveAffix(offsetTop: 400.0, height: 40.0,
            scrollTop: 500.0, viewportHeight: 800.0, containerBottom: 2000.0, top: 0.0),
        const IAffixState(mode: IAffixMode.top, offset: 0));
    expect(
        resolveAffix(offsetTop: 400.0, height: 40.0,
            scrollTop: 0.0, viewportHeight: 800.0, bottom: 16.0),
        const IAffixState(mode: IAffixMode.none, offset: 0));
    expect(
        resolveAffix(offsetTop: 1400.0, height: 40.0,
            scrollTop: 0.0, viewportHeight: 800.0, bottom: 16.0),
        const IAffixState(mode: IAffixMode.bottom, offset: 16));
    expect(shouldShowBackTop(0.0, 800.0), false);
    expect(shouldShowBackTop(700.0, 800.0), false);
    expect(shouldShowBackTop(900.0, 800.0), true);
    expect(shouldShowBackTop(200.0, 800.0), false);
    expect(shouldShowBackTop(0.0, 800.0, threshold: 100.0), false);
    expect(shouldShowBackTop(150.0, 800.0, threshold: 100.0), true);
    expect(backTopFrame(1000.0, 0.0), closeTo(1000, 1e-9));
    expect(backTopFrame(1000.0, 80.0), closeTo(421.875, 1e-9));
    expect(backTopFrame(1000.0, 160.0), closeTo(125, 1e-9));
    expect(backTopFrame(1000.0, 320.0), closeTo(0, 1e-9));
    expect(backTopFrame(1000.0, 400.0), closeTo(0, 1e-9));
  });

  test('图片的缩放、旋转、拖动与翻页与 Web 端一致', () {
    expect(zoomImage(const IImageTransform(scale: 1, rotate: 0, x: 30, y: 30), 1.0), const IImageTransform(scale: 2, rotate: 0, x: 30, y: 30));
    expect(zoomImage(const IImageTransform(scale: 2, rotate: 0, x: 30, y: 30), 1.0), const IImageTransform(scale: 3, rotate: 0, x: 30, y: 30));
    expect(zoomImage(const IImageTransform(scale: 3, rotate: 0, x: 30, y: 30), 1.0), const IImageTransform(scale: 4, rotate: 0, x: 30, y: 30));
    expect(zoomImage(const IImageTransform(scale: 4, rotate: 0, x: 30, y: 30), 1.0), const IImageTransform(scale: 4, rotate: 0, x: 30, y: 30));
    expect(zoomImage(const IImageTransform(scale: 4, rotate: 0, x: 30, y: 30), -1.0), const IImageTransform(scale: 3, rotate: 0, x: 30, y: 30));
    expect(zoomImage(const IImageTransform(scale: 3, rotate: 0, x: 30, y: 30), -1.0), const IImageTransform(scale: 2, rotate: 0, x: 30, y: 30));
    expect(zoomImage(const IImageTransform(scale: 2, rotate: 0, x: 30, y: 30), -1.0), const IImageTransform(scale: 1, rotate: 0, x: 0, y: 0));
    expect(zoomImage(const IImageTransform(scale: 1, rotate: 0, x: 30, y: 30), -0.5), const IImageTransform(scale: 0.5, rotate: 0, x: 30, y: 30));
    expect(rotateImage(const IImageTransform(scale: 1, rotate: 0, x: 0, y: 0), 90.0).rotate, 90);
    expect(rotateImage(const IImageTransform(scale: 1, rotate: 90, x: 0, y: 0), 90.0).rotate, 180);
    expect(rotateImage(const IImageTransform(scale: 1, rotate: 180, x: 0, y: 0), 90.0).rotate, 270);
    expect(rotateImage(const IImageTransform(scale: 1, rotate: 270, x: 0, y: 0), 90.0).rotate, 0);
    expect(rotateImage(const IImageTransform(scale: 1, rotate: 360, x: 0, y: 0), -90.0).rotate, 270);
    expect(rotateImage(const IImageTransform(scale: 1, rotate: 450, x: 0, y: 0), 450.0).rotate, 180);
    expect(panImage(const IImageTransform(scale: 1, rotate: 0, x: 0, y: 0), 10.0, 10.0), const IImageTransform(scale: 1, rotate: 0, x: 0, y: 0));
    expect(panImage(const IImageTransform(scale: 2, rotate: 0, x: 0, y: 0), 10.0, -20.0), const IImageTransform(scale: 2, rotate: 0, x: 10, y: -20));
    expect(panImage(const IImageTransform(scale: 0.5, rotate: 0, x: 5, y: 5), 10.0, 10.0), const IImageTransform(scale: 0.5, rotate: 0, x: 5, y: 5));
    expect(stepImage(0, 3, 1), 1);
    expect(stepImage(2, 3, 1), 2);
    expect(stepImage(0, 3, -1), 0);
    expect(stepImage(1, 3, -1), 0);
    expect(stepImage(0, 0, 1), 0);
    expect(imageAlt(IImageStatus.loading, '示例图'), '示例图（加载中）');
    expect(imageAlt(IImageStatus.error, '示例图'), '示例图（加载失败）');
    expect(imageAlt(IImageStatus.loaded, '示例图'), '示例图');
    expect(imageAlt(IImageStatus.error, ''), '图片加载失败');
    expect(imageAlt(IImageStatus.loading, ''), '图片加载中');
  });

  test('分栏夹取与键盘步长与 Web 端一致', () {
    expect(
        resizePane(1000.0, 500.0,
            firstMin: 120.0, secondMin: 160.0, gutter: 4.0),
        closeTo(500, 1e-9));
    expect(
        resizePane(1000.0, 0.0,
            firstMin: 120.0, secondMin: 160.0, gutter: 4.0),
        closeTo(120, 1e-9));
    expect(
        resizePane(1000.0, 2000.0,
            firstMin: 120.0, secondMin: 160.0, gutter: 4.0),
        closeTo(836, 1e-9));
    expect(
        resizePane(1000.0, 100.0,
            firstMin: 120.0, secondMin: 160.0, gutter: 4.0),
        closeTo(120, 1e-9));
    expect(
        resizePane(1000.0, 900.0,
            firstMin: 120.0, secondMin: 160.0, gutter: 4.0),
        closeTo(836, 1e-9));
    expect(
        resizePane(300.0, 200.0,
            firstMin: 120.0, secondMin: 160.0, gutter: 4.0),
        closeTo(136, 1e-9));
    expect(
        resizePane(100.0, 50.0,
            firstMin: 120.0, secondMin: 160.0, gutter: 4.0),
        closeTo(120, 1e-9));
    expect(paneRatio(500.0, 1000.0, gutter: 4.0),
        closeTo(0.5020080321285141, 1e-9));
    expect(paneRatio(0.0, 1000.0, gutter: 4.0),
        closeTo(0, 1e-9));
    expect(paneRatio(1200.0, 1000.0, gutter: 4.0),
        closeTo(1, 1e-9));
    expect(paneSize(0.50, 1000.0, gutter: 4.0),
        closeTo(498, 1e-9));
    expect(paneSize(1.50, 1000.0, gutter: 4.0),
        closeTo(996, 1e-9));
    expect(paneSize(-0.20, 1000.0, gutter: 4.0),
        closeTo(0, 1e-9));
    expect(keyboardStep('ArrowLeft', false), -8);
    expect(keyboardStep('ArrowLeft', true), -48);
    expect(keyboardStep('ArrowRight', false), 8);
    expect(keyboardStep('ArrowRight', true), 48);
    expect(keyboardStep('ArrowUp', false), -8);
    expect(keyboardStep('ArrowDown', true), 48);
    expect(keyboardStep('Enter', false), 0);
  });

  test('虚拟滚动的窗口与定位与 Web 端一致', () {
    expect(virtualWindow(0.0, 320.0, 40.0, 20000).start, 0);
    expect(virtualWindow(0.0, 320.0, 40.0, 20000).end, 11);
    expect(virtualWindow(0.0, 320.0, 40.0, 20000).paddingTop,
        closeTo(0, 1e-9));
    expect(virtualWindow(0.0, 320.0, 40.0, 20000).paddingBottom,
        closeTo(799520, 1e-9));
    expect(virtualWindow(400000.0, 320.0, 40.0, 20000).start, 9997);
    expect(virtualWindow(400000.0, 320.0, 40.0, 20000).end, 10011);
    expect(virtualWindow(400000.0, 320.0, 40.0, 20000).paddingTop,
        closeTo(399880, 1e-9));
    expect(virtualWindow(400000.0, 320.0, 40.0, 20000).paddingBottom,
        closeTo(399520, 1e-9));
    expect(virtualWindow(799680.0, 320.0, 40.0, 20000).start, 19989);
    expect(virtualWindow(799680.0, 320.0, 40.0, 20000).end, 19999);
    expect(virtualWindow(799680.0, 320.0, 40.0, 20000).paddingTop,
        closeTo(799560, 1e-9));
    expect(virtualWindow(799680.0, 320.0, 40.0, 20000).paddingBottom,
        closeTo(0, 1e-9));
    expect(virtualWindow(0.0, 320.0, 40.0, 5).start, 0);
    expect(virtualWindow(0.0, 320.0, 40.0, 5).end, 4);
    expect(virtualWindow(0.0, 320.0, 40.0, 5).paddingTop,
        closeTo(0, 1e-9));
    expect(virtualWindow(0.0, 320.0, 40.0, 5).paddingBottom,
        closeTo(0, 1e-9));
    expect(virtualWindow(0.0, 320.0, 40.0, 0).start, 0);
    expect(virtualWindow(0.0, 320.0, 40.0, 0).end, -1);
    expect(virtualWindow(0.0, 320.0, 40.0, 0).paddingTop,
        closeTo(0, 1e-9));
    expect(virtualWindow(0.0, 320.0, 40.0, 0).paddingBottom,
        closeTo(0, 1e-9));
    expect(virtualWindow(100.0, 320.0, 40.0, 20000).start, 0);
    expect(virtualWindow(100.0, 320.0, 40.0, 20000).end, 13);
    expect(virtualWindow(100.0, 320.0, 40.0, 20000).paddingTop,
        closeTo(0, 1e-9));
    expect(virtualWindow(100.0, 320.0, 40.0, 20000).paddingBottom,
        closeTo(799440, 1e-9));
    expect(scrollToRow(0, 40.0, 0.0, 320.0),
        closeTo(0, 1e-9));
    expect(scrollToRow(3, 40.0, 0.0, 320.0),
        closeTo(0, 1e-9));
    expect(scrollToRow(20, 40.0, 0.0, 320.0),
        closeTo(520, 1e-9));
    expect(scrollToRow(2, 40.0, 200.0, 320.0),
        closeTo(80, 1e-9));
    expect(shouldVirtualize(10), false);
    expect(shouldVirtualize(60), false);
    expect(shouldVirtualize(61), true);
    expect(shouldVirtualize(20000), true);
  });

  test('取色器的解析、往返与对比度读数与 Web 端一致', () {
    expect(parseColor('rgb(30, 60, 90)'), '#1e3c5a');
    expect(parseColor('#0a0'), '#00aa00');
    expect(parseColor('#1E3C5A'), '#1e3c5a');
    expect(parseColor('aabbcc'), '#aabbcc');
    expect(parseColor('rgb(300,0,0)'), isNull);
    expect(parseColor('不是颜色'), isNull);
    expect(parseColor(''), isNull);
    expect(hsvToHex(hexToHsv('#5e7ce0')), '#5e7ce0');
    expect(hsvToHex(hexToHsv('#c2413d')), '#c2413d');
    expect(hsvToHex(hexToHsv('#ffffff')), '#ffffff');
    expect(hsvToHex(hexToHsv('#000000')), '#000000');
    expect(hsvToHex(hexToHsv('#00aa00')), '#00aa00');
    expect(hsvToHex(hexToHsv('#1e3c5a')), '#1e3c5a');
    expect(colorReadout('#5e7ce0').ink, '#ffffff');
    expect(colorReadout('#5e7ce0').ratio, closeTo(3.86, 0.02));
    expect(colorReadout('#5e7ce0').passesUi, true);
    expect(colorReadout('#5e7ce0').passesText, false);
    expect(colorReadout('#ffe066').ink, '#1d2129');
    expect(colorReadout('#ffe066').ratio, closeTo(12.37, 0.02));
    expect(colorReadout('#ffe066').passesUi, true);
    expect(colorReadout('#ffe066').passesText, true);
    expect(colorReadout('#1d2129').ink, '#ffffff');
    expect(colorReadout('#1d2129').ratio, closeTo(16.13, 0.02));
    expect(colorReadout('#1d2129').passesUi, true);
    expect(colorReadout('#1d2129').passesText, true);
    expect(colorReadout('#ffffff').ink, '#1d2129');
    expect(colorReadout('#ffffff').ratio, closeTo(16.13, 0.02));
    expect(colorReadout('#ffffff').passesUi, true);
    expect(colorReadout('#ffffff').passesText, true);
  });

  test('日历格子、范围选择与键盘导航与 Web 端一致', () {
    final cells = buildCalendar(DateTime(2026, 9, 15), weekStart: 1);
    expect(cells.length, 42);
    expect(cells.first.iso, '2026-08-31');
    expect(cells.last.iso, '2026-10-11');
    expect(cells.where((c) => !c.outside).length, 30);
    expect(weekdayLabels(weekStart: 1), <String>['一', '二', '三', '四', '五', '六', '日']);
    expect(weekdayLabels(weekStart: 0), <String>['日', '一', '二', '三', '四', '五', '六']);
    expect(selectRange(const IDateRange(start: null, end: null), '2026-09-10'), const IDateRange(start: '2026-09-10', end: null));
    expect(selectRange(const IDateRange(start: '2026-09-10', end: null), '2026-09-15'), const IDateRange(start: '2026-09-10', end: '2026-09-15'));
    expect(selectRange(const IDateRange(start: '2026-09-10', end: null), '2026-09-05'), const IDateRange(start: '2026-09-05', end: '2026-09-10'));
    expect(selectRange(const IDateRange(start: '2026-09-10', end: '2026-09-15'), '2026-09-20'), const IDateRange(start: '2026-09-20', end: null));
    expect(selectRange(const IDateRange(start: '2026-09-10', end: null), '2026-09-10'), const IDateRange(start: '2026-09-10', end: '2026-09-10'));
    expect(isInRange('2026-09-12', const IDateRange(start: '2026-09-10', end: '2026-09-15')), true);
    expect(isInRange('2026-09-10', const IDateRange(start: '2026-09-10', end: '2026-09-15')), true);
    expect(isInRange('2026-09-16', const IDateRange(start: '2026-09-10', end: '2026-09-15')), false);
    expect(isInRange('2026-09-12', const IDateRange(start: '2026-09-10', end: null)), false);
    expect(isRangeEdge('2026-09-10', const IDateRange(start: '2026-09-10', end: '2026-09-15')), 'start');
    expect(isRangeEdge('2026-09-15', const IDateRange(start: '2026-09-10', end: '2026-09-15')), 'end');
    expect(isRangeEdge('2026-09-12', const IDateRange(start: '2026-09-10', end: '2026-09-15')), isNull);
    expect(moveFocus('2026-09-15', 'ArrowLeft'), '2026-09-14');
    expect(moveFocus('2026-09-15', 'ArrowRight'), '2026-09-16');
    expect(moveFocus('2026-09-15', 'ArrowUp'), '2026-09-08');
    expect(moveFocus('2026-09-15', 'ArrowDown'), '2026-09-22');
    expect(moveFocus('2026-09-01', 'ArrowLeft'), '2026-08-31');
    expect(moveFocus('2026-09-30', 'ArrowDown'), '2026-10-07');
    expect(moveFocus('2026-09-15', 'Enter'), isNull);
  });

  test('提及的触发、插入与过滤与 Web 端一致', () {
    final options = <IMentionOption>[const IMentionOption(value: 'lin', label: '林岚', keywords: <String>['linlan']), const IMentionOption(value: 'chen', label: '陈序', keywords: <String>['chenxu']), const IMentionOption(value: 'su', label: '苏禾', keywords: <String>['suhe'])];
    expect(findMention("@", 1),
        const IMentionTrigger(at: 0, symbol: '@', query: ""));
    expect(findMention("@zh", 3),
        const IMentionTrigger(at: 0, symbol: '@', query: "zh"));
    expect(findMention("把这条同步给 @陈", 10),
        const IMentionTrigger(at: 7, symbol: '@', query: "陈"));
    expect(findMention("user@exam", 9), isNull);
    expect(findMention("@张三 然后", 6), isNull);
    expect(findMention("", 0), isNull);
    expect(findMention("a@b", 3), isNull);
    expect(findMention("\n@x", 3),
        const IMentionTrigger(at: 1, symbol: '@', query: "x"));
    expect(applyMention("@陈",
        const IMentionTrigger(at: 0, symbol: '@', query: "陈"),
        '陈序', 2).text, "@陈序 ");
    expect(applyMention("@陈",
        const IMentionTrigger(at: 0, symbol: '@', query: "陈"),
        '陈序', 2).caret, 4);
    expect(applyMention("把这条同步给 @陈",
        const IMentionTrigger(at: 7, symbol: '@', query: "陈"),
        '陈序', 10).text, "把这条同步给 @陈序 ");
    expect(applyMention("把这条同步给 @陈",
        const IMentionTrigger(at: 7, symbol: '@', query: "陈"),
        '陈序', 10).caret, 11);
    expect(applyMention("@a 尾巴",
        const IMentionTrigger(at: 0, symbol: '@', query: "a"),
        '林岚', 2).text, "@林岚  尾巴");
    expect(applyMention("@a 尾巴",
        const IMentionTrigger(at: 0, symbol: '@', query: "a"),
        '林岚', 2).caret, 4);
    expect(filterMentions(options, '').map((o) => o.value).toList(),
        <String>['lin', 'chen', 'su']);
    expect(filterMentions(options, '陈').map((o) => o.value).toList(),
        <String>['chen']);
    expect(filterMentions(options, 'lin').map((o) => o.value).toList(),
        <String>['lin']);
    expect(filterMentions(options, 'xu').map((o) => o.value).toList(),
        <String>['chen']);
    expect(filterMentions(options, '不存在').map((o) => o.value).toList(),
        <String>[]);
  });

  test('矩形树图 squarify 切块与 Web 端一致', () {
    final tiles = treemapLayout(<ITreemapItem>[const ITreemapItem(label: 'a', value: 4200.0), const ITreemapItem(label: 'b', value: 2600.0), const ITreemapItem(label: 'c', value: 1500.0), const ITreemapItem(label: 'd', value: 620.0), const ITreemapItem(label: 'e', value: 380.0), const ITreemapItem(label: 'f', value: 210.0)], 640.0, 300.0);
    expect(tiles.length, 6);
    expect(tiles[0].label, 'a');
    expect(tiles[0].percent, closeTo(0.4416403785488959, 1e-9));
    expect(tiles[0].x, closeTo(0, 1e-9));
    expect(tiles[0].y, closeTo(0, 1e-9));
    expect(tiles[0].width, closeTo(282.6498422712934, 1e-9));
    expect(tiles[0].height, closeTo(300, 1e-9));
    expect(tiles[1].label, 'b');
    expect(tiles[1].percent, closeTo(0.2733964248159832, 1e-9));
    expect(tiles[1].x, closeTo(282.6498422712934, 1e-9));
    expect(tiles[1].y, closeTo(0, 1e-9));
    expect(tiles[1].width, closeTo(174.97371188222925, 1e-9));
    expect(tiles[1].height, closeTo(300, 1e-9));
    expect(tiles[2].label, 'c');
    expect(tiles[2].percent, closeTo(0.15772870662460567, 1e-9));
    expect(tiles[2].x, closeTo(457.6235541535226, 1e-9));
    expect(tiles[2].y, closeTo(0, 1e-9));
    expect(tiles[2].width, closeTo(182.37644584647737, 1e-9));
    expect(tiles[2].height, closeTo(166.05166051660518, 1e-9));
    expect(tiles[3].label, 'd');
    expect(tiles[3].percent, closeTo(0.06519453207150368, 1e-9));
    expect(tiles[3].x, closeTo(457.6235541535226, 1e-9));
    expect(tiles[3].y, closeTo(166.05166051660518, 1e-9));
    expect(tiles[3].width, closeTo(93.44908795439338, 1e-9));
    expect(tiles[3].height, closeTo(133.94833948339482, 1e-9));
    expect(tiles[4].label, 'e');
    expect(tiles[4].percent, closeTo(0.03995793901156677, 1e-9));
    expect(tiles[4].x, closeTo(551.072642107916, 1e-9));
    expect(tiles[4].y, closeTo(166.05166051660518, 1e-9));
    expect(tiles[4].width, closeTo(88.92735789208399, 1e-9));
    expect(tiles[4].height, closeTo(86.27181187066111, 1e-9));
    expect(tiles[5].label, 'f');
    expect(tiles[5].percent, closeTo(0.022082018927444796, 1e-9));
    expect(tiles[5].x, closeTo(551.072642107916, 1e-9));
    expect(tiles[5].y, closeTo(252.3234723872663, 1e-9));
    expect(tiles[5].width, closeTo(88.92735789208412, 1e-9));
    expect(tiles[5].height, closeTo(47.67652761273371, 1e-9));
  });
}
