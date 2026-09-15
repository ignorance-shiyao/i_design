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
import 'package:i_design/src/logic/axis.dart';
import 'package:i_design/src/logic/query.dart';
import 'package:i_design/src/logic/schemaform.dart';
import 'package:i_design/src/logic/protable.dart';
import 'package:i_design/src/logic/stats.dart';
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
import 'package:i_design/src/logic/overflow.dart';
import 'package:i_design/src/logic/diff.dart';
import 'package:i_design/src/logic/elapsed.dart';
import 'package:i_design/src/logic/lifecycle.dart';
import 'package:i_design/src/logic/formhost.dart';
import 'package:i_design/src/logic/bulk.dart';
import 'package:i_design/src/logic/detail.dart';
import 'package:i_design/src/logic/entitypicker.dart';
import 'package:i_design/src/logic/importjob.dart';
import 'package:i_design/src/logic/exportjob.dart';
import 'package:i_design/src/logic/float.dart';
import 'package:i_design/src/logic/href.dart';
import 'package:i_design/src/logic/gantt.dart';
import 'package:i_design/src/logic/wordcloud.dart';
import 'package:i_design/src/logic/locale.dart';

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

  test('确认的过期与版本失效判定与 Web 端一致', () {
    final g0 = approvalGate(now: 1000000);
    expect(g0.state, IApprovalGateState.open);
    expect(g0.decidable, true);
    expect(g0.label, "待确认");
    expect(g0.detail, "");
    expect(g0.action, IApprovalGateAction.none);
    expect(g0.remaining, null);
    final g1 = approvalGate(now: 1000000, expiresAt: 1300000);
    expect(g1.state, IApprovalGateState.open);
    expect(g1.decidable, true);
    expect(g1.label, "待确认");
    expect(g1.detail, "");
    expect(g1.action, IApprovalGateAction.none);
    expect(g1.remaining, 300);
    final g2 = approvalGate(now: 1000000, expiresAt: 1012000);
    expect(g2.state, IApprovalGateState.expiring);
    expect(g2.decidable, true);
    expect(g2.label, "即将过期");
    expect(g2.detail, "还有 12 秒");
    expect(g2.action, IApprovalGateAction.none);
    expect(g2.remaining, 12);
    final g3 = approvalGate(now: 1000000, expiresAt: 1030000);
    expect(g3.state, IApprovalGateState.expiring);
    expect(g3.decidable, true);
    expect(g3.label, "即将过期");
    expect(g3.detail, "还有 30 秒");
    expect(g3.action, IApprovalGateAction.none);
    expect(g3.remaining, 30);
    final g4 = approvalGate(now: 1000000, expiresAt: 999999);
    expect(g4.state, IApprovalGateState.expired);
    expect(g4.decidable, false);
    expect(g4.label, "已过期");
    expect(g4.detail, "这条确认等待太久已失效，需要重新发起");
    expect(g4.action, IApprovalGateAction.renew);
    expect(g4.remaining, null);
    final g5 = approvalGate(now: 1000000, version: 2, currentVersion: 3);
    expect(g5.state, IApprovalGateState.stale);
    expect(g5.decidable, false);
    expect(g5.label, "内容已更新");
    expect(g5.detail, "这条确认是针对第 2 版发出的，现在是第 3 版");
    expect(g5.action, IApprovalGateAction.review);
    expect(g5.remaining, null);
    final g6 = approvalGate(now: 1000000, version: 2, currentVersion: 2);
    expect(g6.state, IApprovalGateState.open);
    expect(g6.decidable, true);
    expect(g6.label, "待确认");
    expect(g6.detail, "");
    expect(g6.action, IApprovalGateAction.none);
    expect(g6.remaining, null);
    final g7 = approvalGate(now: 1000000, version: 2);
    expect(g7.state, IApprovalGateState.open);
    expect(g7.decidable, true);
    expect(g7.label, "待确认");
    expect(g7.detail, "");
    expect(g7.action, IApprovalGateAction.none);
    expect(g7.remaining, null);
    final g8 = approvalGate(now: 1000000, expiresAt: 999999, version: 1, currentVersion: 4);
    expect(g8.state, IApprovalGateState.stale);
    expect(g8.decidable, false);
    expect(g8.label, "内容已更新");
    expect(g8.detail, "这条确认是针对第 1 版发出的，现在是第 4 版");
    expect(g8.action, IApprovalGateAction.review);
    expect(g8.remaining, null);
    final g9 = approvalGate(now: 1000000, expiresAt: 1012000, warnBefore: 5000);
    expect(g9.state, IApprovalGateState.open);
    expect(g9.decidable, true);
    expect(g9.label, "待确认");
    expect(g9.detail, "");
    expect(g9.action, IApprovalGateAction.none);
    expect(g9.remaining, 12);
    expect(approvalRemaining(1009001, 1000000), 10);
    expect(approvalRemaining(1010000, 1000000), 10);
    expect(approvalRemaining(1000001, 1000000), 1);
    expect(approvalRemaining(1000000, 1000000), 0);
    expect(approvalRemaining(992000, 1000000), 0);
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

  test('分布统计的分箱、带宽与误差棒与 Web 端一致', () {
    final uniform = <double>[0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0, 19.0, 20.0, 21.0, 22.0, 23.0, 24.0, 25.0, 26.0, 27.0, 28.0, 29.0, 30.0, 31.0, 32.0, 33.0, 34.0, 35.0, 36.0, 37.0, 38.0, 39.0, 40.0, 41.0, 42.0, 43.0, 44.0, 45.0, 46.0, 47.0, 48.0, 49.0, 50.0, 51.0, 52.0, 53.0, 54.0, 55.0, 56.0, 57.0, 58.0, 59.0, 60.0, 61.0, 62.0, 63.0, 64.0, 65.0, 66.0, 67.0, 68.0, 69.0, 70.0, 71.0, 72.0, 73.0, 74.0, 75.0, 76.0, 77.0, 78.0, 79.0, 80.0, 81.0, 82.0, 83.0, 84.0, 85.0, 86.0, 87.0, 88.0, 89.0, 90.0, 91.0, 92.0, 93.0, 94.0, 95.0, 96.0, 97.0, 98.0, 99.0];
    final skewed = <double>[5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 1.0, 2.0, 3.0, 40.0, 80.0];
    final small = <double>[2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0];
    final h_uniform = histogram(uniform);
    expect(h_uniform.rule, 'freedman-diaconis');
    expect(h_uniform.bins.length, 5);
    expect(h_uniform.width, closeTo(21.32890343131565, 1e-9));
    expect(h_uniform.bins.fold<int>(0, (s, b) => s + b.count), 100);
    expect(h_uniform.issues.length, 0);
    final h_skewed = histogram(skewed);
    expect(h_skewed.rule, 'sturges');
    expect(h_skewed.bins.length, 8);
    expect(h_skewed.width, closeTo(9.875, 1e-9));
    expect(h_skewed.bins.fold<int>(0, (s, b) => s + b.count), 65);
    expect(h_skewed.issues.length, 0);
    final h_small = histogram(small);
    expect(h_small.rule, 'freedman-diaconis');
    expect(h_small.bins.length, 5);
    expect(h_small.width, closeTo(1.5, 1e-9));
    expect(h_small.bins.fold<int>(0, (s, b) => s + b.count), 8);
    expect(h_small.issues.length, 1);
    expect(h_small.issues[0].kind, 'too-few');
    expect(histogram(uniform, rule: 'fixed', width: 25.0).bins.length, 4);
    expect(kde(uniform).bandwidth, closeTo(10.39471468564849, 1e-9));
    expect(kde(small).bandwidth, closeTo(0.664677492366943, 1e-9));
    expect(kde(uniform).points.length, 64);
    expect(kde(uniform).points.first.y, closeTo(0.000015733206686884343, 1e-12));
    expect(kde(uniform).points[32].y, closeTo(0.00999998225256465, 1e-12));
    expect(kde(<double>[4.0, 4.0, 4.0, 4.0]).points.length, 0);
    expect(kde(<double>[4.0, 4.0, 4.0, 4.0]).issues.last.kind, 'all-equal');
    expect(errorBar(small, 'sd').delta, closeTo(2.138089935299395, 1e-9));
    expect(errorBar(small, 'sd').low, closeTo(2.861910064700605, 1e-9));
    expect(errorBar(small, 'sd').caption, '误差棒为 ±1 标准差（n=8），说的是数据有多散');
    expect(errorBar(small, 'sem').delta, closeTo(0.7559289460184544, 1e-9));
    expect(errorBar(small, 'sem').low, closeTo(4.244071053981545, 1e-9));
    expect(errorBar(small, 'sem').caption, '误差棒为 ±1 标准误（n=8），说的是均值估得有多准');
    expect(errorBar(small, 'ci95').delta, closeTo(1.4816207341961707, 1e-9));
    expect(errorBar(small, 'ci95').low, closeTo(3.518379265803829, 1e-9));
    expect(errorBar(small, 'ci95').caption, '误差棒为 95% 置信区间（正态近似，n=8）');
    expect(errorBar(<double>[5.0], 'sd').delta, 0);
    expect(violinShape(uniform).peak, closeTo(0.009999982252564652, 1e-12));
    expect(pearson(<double>[1.0, 2.0, 3.0, 4.0], <double>[2.0, 4.0, 6.0, 8.0]), closeTo(1, 1e-12));
    expect(pearson(<double>[1.0, 1.0, 1.0, 1.0], <double>[1.0, 2.0, 3.0, 4.0]), null);
    expect(pearson(<double>[1.0, 2.0], <double>[2.0, 4.0]), null);
  });

  test('ProTable 的过期响应与分页规则与 Web 端一致', () {
    var s = const ITableState<Map<String, Object?>>();
    final a = startRequest(s);
    final b = startRequest(a.state);
    var after = receive(b.state, ITableResult<Map<String, Object?>>(seq: b.seq, rows: <Map<String, Object?>>[<String, Object?>{'id': 'new'}], total: 1));
    expect(after.rows.first['id'], 'new');
    expect(after.status.name, 'success');
    after = receive(after, ITableResult<Map<String, Object?>>(seq: a.seq, rows: <Map<String, Object?>>[<String, Object?>{'id': 'old'}], total: 99));
    expect(after.rows.first['id'], 'new');
    expect(after.total, 1);
    expect(after.discarded, <int>[1]);
    after = fail(after, a.seq, '超时');
    expect(after.status.name, 'success');
    expect(after.error, null);
    expect(toggleSort(const ISortState(), 'name').order, ISortOrder.asc);
    expect(toggleSort(toggleSort(const ISortState(), 'name'), 'name').order, ISortOrder.desc);
    expect(toggleSort(toggleSort(toggleSort(const ISortState(), 'name'), 'name'), 'name').order, null);
    final paged = setPage(const ITableState<Map<String, Object?>>(), 0);
    expect(paged.query.page, 1);
    expect(setSort(const ITableState<Map<String, Object?>>(query: ITableQuery(page: 3)), 'name').query.page, 1);
    expect(setPageSize(const ITableState<Map<String, Object?>>(query: ITableQuery(page: 3)), 100).query.page, 1);
    expect(clampTablePage(const ITableState<Map<String, Object?>>(query: ITableQuery(page: 5), total: 21)).query.page, 2);
  });

  test('ProTable 的列能力与 Web 端一致', () {
    final columns = <IColumnSpec>[IColumnSpec(key: 'id', title: '单号', width: 120, locked: true), IColumnSpec(key: 'customer', title: '客户'), IColumnSpec(key: 'cost', title: '成本价', width: 120, restricted: true), IColumnSpec(key: 'amount', title: '金额', width: 140)];
    final base = defaultColumnState(columns);
    expect(visibleTableColumns(columns, base).length, 4);
    final hiddenCost = toggleColumn(base, 'cost', columns);
    expect(visibleTableColumns(columns, hiddenCost).map((c) => c.key).toList(), <String>['id', 'customer', 'amount']);
    expect(restrictedTableColumns(columns), <String>['cost']);
    final lockedTry = toggleColumn(base, 'id', columns);
    expect(visibleTableColumns(columns, lockedTry).map((c) => c.key).toList(), <String>['id', 'customer', 'cost', 'amount']);
    final moved = moveColumn(base, 3, 0);
    expect(resolveTableColumns(columns, moved).map((c) => c.key).toList(), <String>['amount', 'id', 'customer', 'cost']);
    final withNew = <IColumnSpec>[IColumnSpec(key: 'id', title: '单号', width: 120, locked: true), IColumnSpec(key: 'customer', title: '客户'), IColumnSpec(key: 'cost', title: '成本价', width: 120, restricted: true), IColumnSpec(key: 'amount', title: '金额', width: 140), IColumnSpec(key: 'tax', title: '税额')];
    expect(resolveTableColumns(withNew, base).map((c) => c.key).toList(), <String>['id', 'customer', 'cost', 'amount', 'tax']);
    expect(resolveTableColumns(withNew, base).last.hidden, false);
  });

  test('表单 schema 的显隐、提交值与校验与 Web 端一致', () {
    final schema = const IFormSchema(fields: <IFormFieldSpec>[IFormFieldSpec(name: 'type', label: '客户类型', kind: IFormFieldKind.select, rules: <IFormFieldRule>[IFormFieldRule(kind: 'required', message: '请选择客户类型')]), IFormFieldSpec(name: 'taxNo', label: '税号', kind: IFormFieldKind.text, when: ICondition(field: 'type', op: IConditionOp.eq, value: 'company'), rules: <IFormFieldRule>[IFormFieldRule(kind: 'required', message: '企业客户必须填税号'), IFormFieldRule(kind: 'pattern', message: '税号是 8 位以上的大写字母或数字', value: '^[A-Z0-9]{8,}$')]), IFormFieldSpec(name: 'lines', label: '明细', kind: IFormFieldKind.array, item: <IFormFieldSpec>[IFormFieldSpec(name: 'sku', label: '物料', kind: IFormFieldKind.text, rules: <IFormFieldRule>[IFormFieldRule(kind: 'required', message: '物料必填')]), IFormFieldSpec(name: 'quantity', label: '数量', kind: IFormFieldKind.number, rules: <IFormFieldRule>[IFormFieldRule(kind: 'min', message: '数量至少为 1', value: 1)])], minItems: 1, maxItems: 3)]);
    final v0 = <String, Object?>{'type': 'person', 'lines': <Object?>[<String, Object?>{'sku': 'A', 'quantity': 1}]};
    expect(visibleFields(schema, v0).map((f) => f.name).toList(), <String>['type', 'lines']);
    expect(submitValues(schema, v0).keys.toList(), <String>['type', 'lines']);
    expect(validateSchema(schema, v0).length, 0);
    final v1 = <String, Object?>{'type': 'company', 'lines': <Object?>[<String, Object?>{'sku': 'A', 'quantity': 1}]};
    expect(visibleFields(schema, v1).map((f) => f.name).toList(), <String>['type', 'taxNo', 'lines']);
    expect(submitValues(schema, v1).keys.toList(), <String>['type', 'lines']);
    expect(validateSchema(schema, v1).length, 1);
    expect(validateSchema(schema, v1)[0].path, 'taxNo');
    expect(validateSchema(schema, v1)[0].message, '企业客户必须填税号');
    final v2 = <String, Object?>{'type': 'company', 'taxNo': 'abc', 'lines': <Object?>[<String, Object?>{'sku': 'A', 'quantity': 1}]};
    expect(visibleFields(schema, v2).map((f) => f.name).toList(), <String>['type', 'taxNo', 'lines']);
    expect(submitValues(schema, v2).keys.toList(), <String>['type', 'taxNo', 'lines']);
    expect(validateSchema(schema, v2).length, 1);
    expect(validateSchema(schema, v2)[0].path, 'taxNo');
    expect(validateSchema(schema, v2)[0].message, '税号是 8 位以上的大写字母或数字');
    final v3 = <String, Object?>{'type': 'person', 'taxNo': 'ABC12345', 'lines': <Object?>[]};
    expect(visibleFields(schema, v3).map((f) => f.name).toList(), <String>['type', 'lines']);
    expect(submitValues(schema, v3).keys.toList(), <String>['type', 'lines']);
    expect(validateSchema(schema, v3).length, 1);
    expect(validateSchema(schema, v3)[0].path, 'lines');
    expect(validateSchema(schema, v3)[0].message, '至少要有 1 行');
    final v4 = <String, Object?>{'type': 'person', 'lines': <Object?>[<String, Object?>{'sku': 'A', 'quantity': 1}, <String, Object?>{'sku': '', 'quantity': 0}]};
    expect(visibleFields(schema, v4).map((f) => f.name).toList(), <String>['type', 'lines']);
    expect(submitValues(schema, v4).keys.toList(), <String>['type', 'lines']);
    expect(validateSchema(schema, v4).length, 2);
    expect(validateSchema(schema, v4)[0].path, 'lines[1].sku');
    expect(validateSchema(schema, v4)[0].message, '物料必填');
    expect(validateSchema(schema, v4)[1].path, 'lines[1].quantity');
    expect(validateSchema(schema, v4)[1].message, '数量至少为 1');
    expect(evaluateCondition(const ICondition(field: 'a', op: IConditionOp.eq, value: 'x'), <String, Object?>{'a': 'x'}), true);
    expect(evaluateCondition(const ICondition(field: 'a', op: IConditionOp.ne, value: 'x'), <String, Object?>{'a': 'y'}), true);
    expect(evaluateCondition(const ICondition(field: 'a', op: IConditionOp.truthy), <String, Object?>{'a': ''}), false);
    expect(evaluateCondition(const ICondition(field: 'a', op: IConditionOp.falsy), <String, Object?>{'a': ''}), true);
    expect(evaluateCondition(const ICondition(field: 'a', op: IConditionOp.gt, value: 5), <String, Object?>{'a': 9}), true);
    expect(evaluateCondition(const ICondition(field: 'a', op: IConditionOp.lt, value: 5), <String, Object?>{'a': 9}), false);
  });

  test('服务端错误落位与 Web 端一致', () {
    final schema = const IFormSchema(fields: <IFormFieldSpec>[IFormFieldSpec(name: 'type', label: '客户类型', kind: IFormFieldKind.select, rules: <IFormFieldRule>[IFormFieldRule(kind: 'required', message: '请选择客户类型')]), IFormFieldSpec(name: 'taxNo', label: '税号', kind: IFormFieldKind.text, when: ICondition(field: 'type', op: IConditionOp.eq, value: 'company'), rules: <IFormFieldRule>[IFormFieldRule(kind: 'required', message: '企业客户必须填税号'), IFormFieldRule(kind: 'pattern', message: '税号是 8 位以上的大写字母或数字', value: '^[A-Z0-9]{8,}$')]), IFormFieldSpec(name: 'lines', label: '明细', kind: IFormFieldKind.array, item: <IFormFieldSpec>[IFormFieldSpec(name: 'sku', label: '物料', kind: IFormFieldKind.text, rules: <IFormFieldRule>[IFormFieldRule(kind: 'required', message: '物料必填')]), IFormFieldSpec(name: 'quantity', label: '数量', kind: IFormFieldKind.number, rules: <IFormFieldRule>[IFormFieldRule(kind: 'min', message: '数量至少为 1', value: 1)])], minItems: 1, maxItems: 3)]);
    final se0 = applyServerErrors(schema, <({String path, String message})>[(path: 'taxNo', message: '税号在工商系统里查不到')]);
    expect(se0[0].orphan, false);
    expect(firstErrorPath(se0), 'taxNo');
    final se1 = applyServerErrors(schema, <({String path, String message})>[(path: 'lines[2].quantity', message: '库存不足')]);
    expect(se1[0].orphan, false);
    expect(firstErrorPath(se1), 'lines[2].quantity');
    final se2 = applyServerErrors(schema, <({String path, String message})>[(path: 'creditLimit', message: '超出授信额度')]);
    expect(se2[0].orphan, true);
    expect(firstErrorPath(se2), null);
    final se3 = applyServerErrors(schema, <({String path, String message})>[(path: 'creditLimit', message: '超出授信额度'), (path: 'taxNo', message: '税号无效')]);
    expect(se3[0].orphan, true);
    expect(se3[1].orphan, false);
    expect(firstErrorPath(se3), 'taxNo');
  });

  test('查询条件的状态机与 Web 端一致', () {
    final fields = <IFilterField>[IFilterField(name: 'keyword', label: '关键词', kind: IFilterKind.text), IFilterField(name: 'status', label: '状态', kind: IFilterKind.select, options: <IFilterOption>[IFilterOption(value: 'open', label: '进行中'), IFilterOption(value: 'done', label: '已完成')]), IFilterField(name: 'tags', label: '标签', kind: IFilterKind.multiSelect, options: <IFilterOption>[IFilterOption(value: 'vip', label: 'VIP'), IFilterOption(value: 'new', label: '新客')]), IFilterField(name: 'created', label: '创建时间', kind: IFilterKind.dateRange)];
    final start = const IQueryState(values: <String, Object>{'status': 'open'}, page: 3, pageSize: 20);
    expect(changeFilter(start, 'keyword', '订单').page, 1);
    expect(changeFilter(start, 'status', 'open').page, 3);
    expect(clearFilters(const IQueryState(values: <String, Object>{'keyword': 'x'}, page: 5, pageSize: 50)).pageSize, 50);
    expect(clearFilters(const IQueryState(values: <String, Object>{'keyword': 'x'}, page: 5, pageSize: 50)).values.length, 0);
    expect(applyQuickFilter(start, const IQuickFilter(key: 'mine', label: '我的进行中', values: <String, Object>{'status': 'open'})).page, 1);
    expect(matchQuickFilter(const <String, Object>{'status': 'open'}, const IQuickFilter(key: 'mine', label: '我的进行中', values: <String, Object>{'status': 'open'})), true);
    expect(matchQuickFilter(const <String, Object>{'status': 'open', 'keyword': 'x'}, const IQuickFilter(key: 'mine', label: '我的进行中', values: <String, Object>{'status': 'open'})), false);
  });

  test('查询参数序列化与 Web 端一致（键顺序也要一样）', () {
    final fields = <IFilterField>[IFilterField(name: 'keyword', label: '关键词', kind: IFilterKind.text), IFilterField(name: 'status', label: '状态', kind: IFilterKind.select, options: <IFilterOption>[IFilterOption(value: 'open', label: '进行中'), IFilterOption(value: 'done', label: '已完成')]), IFilterField(name: 'tags', label: '标签', kind: IFilterKind.multiSelect, options: <IFilterOption>[IFilterOption(value: 'vip', label: 'VIP'), IFilterOption(value: 'new', label: '新客')]), IFilterField(name: 'created', label: '创建时间', kind: IFilterKind.dateRange)];
    final s0 = serializeQuery(IQueryState(values: <String, Object>{'status': 'open', 'keyword': 'x'}, page: 1, pageSize: 20), fields);
    expect(s0.keys.toList(), <String>['keyword', 'status']);
    expect(s0['keyword'], 'x');
    expect(s0['status'], 'open');
    final s1 = serializeQuery(IQueryState(values: <String, Object>{'tags': <String>['vip', 'new'], 'created': IFilterRange(from: '2024-01-01', to: '2024-03-31')}, page: 4, pageSize: 50), fields);
    expect(s1.keys.toList(), <String>['created', 'tags', 'page', 'pageSize']);
    expect(s1['created'], '2024-01-01~2024-03-31');
    expect(s1['tags'], 'vip,new');
    expect(s1['page'], '4');
    expect(s1['pageSize'], '50');
    final s2 = serializeQuery(IQueryState(values: <String, Object>{}, page: 1, pageSize: 20), fields);
    expect(s2.keys.toList(), <String>[]);
  });

  test('无效查询参数的判定与文案与 Web 端一致', () {
    final fields = <IFilterField>[IFilterField(name: 'keyword', label: '关键词', kind: IFilterKind.text), IFilterField(name: 'status', label: '状态', kind: IFilterKind.select, options: <IFilterOption>[IFilterOption(value: 'open', label: '进行中'), IFilterOption(value: 'done', label: '已完成')]), IFilterField(name: 'tags', label: '标签', kind: IFilterKind.multiSelect, options: <IFilterOption>[IFilterOption(value: 'vip', label: 'VIP'), IFilterOption(value: 'new', label: '新客')]), IFilterField(name: 'created', label: '创建时间', kind: IFilterKind.dateRange)];
    final p0 = parseQuery(const <String, String>{'status': 'archived'}, fields);
    expect(p0.state.page, 1);
    expect(p0.state.values.length, 0);
    expect(p0.invalid.length, 1);
    expect(p0.invalid[0].reason, '状态 里没有这个取值');
    final p1 = parseQuery(const <String, String>{'tags': 'vip,ghost'}, fields);
    expect(p1.state.page, 1);
    expect(p1.state.values.length, 1);
    expect(p1.invalid.length, 1);
    expect(p1.invalid[0].reason, '标签 里没有这个取值');
    final p2 = parseQuery(const <String, String>{'removedField': 'x'}, fields);
    expect(p2.state.page, 1);
    expect(p2.state.values.length, 0);
    expect(p2.invalid.length, 1);
    expect(p2.invalid[0].reason, '这个筛选项已经不存在了');
    final p3 = parseQuery(const <String, String>{'created': '2024-05-01~2024-01-01'}, fields);
    expect(p3.state.page, 1);
    expect(p3.state.values.length, 0);
    expect(p3.invalid.length, 1);
    expect(p3.invalid[0].reason, '创建时间 的开始晚于结束');
    final p4 = parseQuery(const <String, String>{'created': '2024-01-01~'}, fields);
    expect(p4.state.page, 1);
    expect(p4.state.values.length, 1);
    expect(p4.invalid.length, 0);
    final p5 = parseQuery(const <String, String>{'page': '0'}, fields);
    expect(p5.state.page, 1);
    expect(p5.state.values.length, 0);
    expect(p5.invalid.length, 1);
    expect(p5.invalid[0].reason, '页码不是正整数');
    final p6 = parseQuery(const <String, String>{'status': 'open', 'page': '2'}, fields);
    expect(p6.state.page, 2);
    expect(p6.state.values.length, 1);
    expect(p6.invalid.length, 0);
  });

  test('值轴刻度与像素位置横纵一致，与 Web 端一致', () {
    final axis0 = valueAxis(0.0, 100.0, 200.0, orientation: IAxisOrientation.vertical);
    expect(axis0.min, closeTo(0, 1e-9));
    expect(axis0.max, closeTo(100, 1e-9));
    expect(axis0.baseline, closeTo(200, 1e-9));
    expect(axis0.ticks.length, 6);
    expect(axis0.ticks[0].offset, closeTo(200, 1e-9));
    expect(axis0.ticks[1].offset, closeTo(160, 1e-9));
    expect(axis0.ticks[2].offset, closeTo(120, 1e-9));
    expect(axis0.ticks[3].offset, closeTo(80, 1e-9));
    expect(axis0.ticks[4].offset, closeTo(40, 1e-9));
    expect(axis0.ticks[5].offset, closeTo(0, 1e-9));
    final axis1 = valueAxis(0.0, 137.0, 200.0, orientation: IAxisOrientation.horizontal);
    expect(axis1.min, closeTo(0, 1e-9));
    expect(axis1.max, closeTo(150, 1e-9));
    expect(axis1.baseline, closeTo(0, 1e-9));
    expect(axis1.ticks.length, 4);
    expect(axis1.ticks[0].offset, closeTo(0, 1e-9));
    expect(axis1.ticks[1].offset, closeTo(66.66666666666666, 1e-9));
    expect(axis1.ticks[2].offset, closeTo(133.33333333333331, 1e-9));
    expect(axis1.ticks[3].offset, closeTo(200, 1e-9));
    final axis2 = valueAxis(-50.0, 50.0, 100.0, orientation: IAxisOrientation.vertical);
    expect(axis2.min, closeTo(-60, 1e-9));
    expect(axis2.max, closeTo(60, 1e-9));
    expect(axis2.baseline, closeTo(50, 1e-9));
    expect(axis2.ticks.length, 7);
    expect(axis2.ticks[0].offset, closeTo(100, 1e-9));
    expect(axis2.ticks[1].offset, closeTo(83.33333333333334, 1e-9));
    expect(axis2.ticks[2].offset, closeTo(66.66666666666667, 1e-9));
    expect(axis2.ticks[3].offset, closeTo(50, 1e-9));
    expect(axis2.ticks[4].offset, closeTo(33.33333333333334, 1e-9));
    expect(axis2.ticks[5].offset, closeTo(16.666666666666657, 1e-9));
    expect(axis2.ticks[6].offset, closeTo(0, 1e-9));
    final axis3 = valueAxis(20.0, 80.0, 100.0, orientation: IAxisOrientation.horizontal);
    expect(axis3.min, closeTo(20, 1e-9));
    expect(axis3.max, closeTo(80, 1e-9));
    expect(axis3.baseline, closeTo(0, 1e-9));
    expect(axis3.ticks.length, 4);
    expect(axis3.ticks[0].offset, closeTo(0, 1e-9));
    expect(axis3.ticks[1].offset, closeTo(33.33333333333333, 1e-9));
    expect(axis3.ticks[2].offset, closeTo(66.66666666666666, 1e-9));
    expect(axis3.ticks[3].offset, closeTo(100, 1e-9));
  });

  test('类目带、条形矩形与排名顺序与 Web 端一致', () {
    final axisBands = categoryBands(4, 200.0);
    expect(axisBands.length, 4);
    expect(axisBands[0].start, closeTo(0, 1e-9));
    expect(axisBands[0].center, closeTo(25, 1e-9));
    expect(axisBands[1].start, closeTo(50, 1e-9));
    expect(axisBands[1].center, closeTo(75, 1e-9));
    expect(axisBands[2].start, closeTo(100, 1e-9));
    expect(axisBands[2].center, closeTo(125, 1e-9));
    expect(axisBands[3].start, closeTo(150, 1e-9));
    expect(axisBands[3].center, closeTo(175, 1e-9));
    final rect0 = barRect(band: axisBands[1], thickness: 20.0, offsetInBand: 5.0, from: 100.0, to: 40.0, orientation: IAxisOrientation.vertical);
    expect(rect0.x, closeTo(55, 1e-9));
    expect(rect0.y, closeTo(40, 1e-9));
    expect(rect0.width, closeTo(20, 1e-9));
    expect(rect0.height, closeTo(60, 1e-9));
    expect(rect0.negative, false);
    final rect1 = barRect(band: axisBands[1], thickness: 20.0, offsetInBand: 5.0, from: 0.0, to: 60.0, orientation: IAxisOrientation.horizontal);
    expect(rect1.x, closeTo(0, 1e-9));
    expect(rect1.y, closeTo(55, 1e-9));
    expect(rect1.width, closeTo(60, 1e-9));
    expect(rect1.height, closeTo(20, 1e-9));
    expect(rect1.negative, false);
    final rect2 = barRect(band: axisBands[1], thickness: 20.0, offsetInBand: 5.0, from: 50.0, to: 90.0, orientation: IAxisOrientation.vertical);
    expect(rect2.x, closeTo(55, 1e-9));
    expect(rect2.y, closeTo(50, 1e-9));
    expect(rect2.width, closeTo(20, 1e-9));
    expect(rect2.height, closeTo(40, 1e-9));
    expect(rect2.negative, true);
    final rect3 = barRect(band: axisBands[1], thickness: 20.0, offsetInBand: 5.0, from: 50.0, to: 10.0, orientation: IAxisOrientation.horizontal);
    expect(rect3.x, closeTo(10, 1e-9));
    expect(rect3.y, closeTo(55, 1e-9));
    expect(rect3.width, closeTo(40, 1e-9));
    expect(rect3.height, closeTo(20, 1e-9));
    expect(rect3.negative, true);
    expect(rankOrder(<double>[3.0, 9.0, 1.0], 'desc'), [1, 0, 2]);
    expect(rankOrder(<double>[3.0, 9.0, 1.0], 'asc'), [2, 0, 1]);
    expect(rankOrder(<double>[3.0, 9.0, 1.0], 'none'), [0, 1, 2]);
  });

  test('双轴的提示与零位判定与 Web 端一致', () {
    final series = <IChartSeries>[IChartSeries(name: '销售额', data: <double>[100.0, 120.0, 140.0]), IChartSeries(name: '转化率', data: <double>[3.0, 4.0, 5.0]), IChartSeries(name: '净增', data: <double>[-40.0, 20.0, 60.0])];
    final dual0 = dualAxis(series, IDualAxisSide(series: <int>[0], unit: '元'), IDualAxisSide(series: <int>[1], unit: '%'), 200.0);
    expect(dual0.issues.length, 1);
    expect(dual0.issues[0], '有系列没有指定归属哪个轴：净增');
    expect(dual0.zeroAligned, true);
    expect(dual0.left.baseline, closeTo(200, 1e-9));
    expect(dual0.right.baseline, closeTo(200, 1e-9));
    final dual1 = dualAxis(series, IDualAxisSide(series: <int>[0], unit: '元'), IDualAxisSide(series: <int>[1], unit: '元'), 200.0);
    expect(dual1.issues.length, 2);
    expect(dual1.issues[0], '两侧单位都是「元」，这是一个轴的事——分成两个轴之后等高不再等值，读者会按位置比大小');
    expect(dual1.issues[1], '有系列没有指定归属哪个轴：净增');
    expect(dual1.zeroAligned, true);
    expect(dual1.left.baseline, closeTo(200, 1e-9));
    expect(dual1.right.baseline, closeTo(200, 1e-9));
    final dual2 = dualAxis(series, IDualAxisSide(series: <int>[0], unit: '元'), IDualAxisSide(series: <int>[1], unit: '  '), 200.0);
    expect(dual2.issues.length, 2);
    expect(dual2.issues[0], '双轴的两侧都必须写明单位，否则读者无从判断另一条线在说什么量');
    expect(dual2.issues[1], '有系列没有指定归属哪个轴：净增');
    expect(dual2.zeroAligned, true);
    expect(dual2.left.baseline, closeTo(200, 1e-9));
    expect(dual2.right.baseline, closeTo(200, 1e-9));
    final dual3 = dualAxis(series, IDualAxisSide(series: <int>[2], unit: '人'), IDualAxisSide(series: <int>[1], unit: '%'), 200.0);
    expect(dual3.issues.length, 2);
    expect(dual3.issues[0], '有系列没有指定归属哪个轴：销售额');
    expect(dual3.issues[1], '两侧的零位不在同一条线上，正负看起来会错位——把其中一侧的范围调成对称可以对齐');
    expect(dual3.zeroAligned, false);
    expect(dual3.left.baseline, closeTo(120, 1e-9));
    expect(dual3.right.baseline, closeTo(200, 1e-9));
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

  test('甘特图的时间域、条形与依赖折线与 Web 端一致', () {
    final domain = ganttDomain(<IGanttTask>[const IGanttTask(id: 'a', name: '调研', start: '2026-03-04', end: '2026-03-12', progress: 1), const IGanttTask(id: 'b', name: '定稿', start: '2026-03-11', end: '2026-03-20', progress: 0.6, deps: <String>['a']), const IGanttTask(id: 'c', name: '开发', start: '2026-03-18', end: '2026-04-08', progress: 0.25, deps: <String>['b']), const IGanttTask(id: 'm', name: '发布', start: '2026-04-17', end: '2026-04-17', deps: <String>['c'], milestone: true)]);
    final bars = ganttBars(<IGanttTask>[const IGanttTask(id: 'a', name: '调研', start: '2026-03-04', end: '2026-03-12', progress: 1), const IGanttTask(id: 'b', name: '定稿', start: '2026-03-11', end: '2026-03-20', progress: 0.6, deps: <String>['a']), const IGanttTask(id: 'c', name: '开发', start: '2026-03-18', end: '2026-04-08', progress: 0.25, deps: <String>['b']), const IGanttTask(id: 'm', name: '发布', start: '2026-04-17', end: '2026-04-17', deps: <String>['c'], milestone: true)], domain,
        dayWidth: 18.0, rowHeight: 34.0, barHeight: 18.0, today: '2026-03-25');
    final ticks = ganttTicks(domain, dayWidth: 18.0, today: '2026-03-25');
    final links = ganttLinks(bars);
    expect(domain.from, '2026-03-02');
    expect(domain.to, '2026-04-19');
    expect(domain.days, 49);
    expect(bars[0].x, closeTo(36, 1e-9));
    expect(bars[0].width, closeTo(162, 1e-9));
    expect(bars[0].y, closeTo(8, 1e-9));
    expect(bars[0].progressWidth, closeTo(162, 1e-9));
    expect(bars[0].overdue, false);
    expect(bars[1].x, closeTo(162, 1e-9));
    expect(bars[1].width, closeTo(180, 1e-9));
    expect(bars[1].y, closeTo(42, 1e-9));
    expect(bars[1].progressWidth, closeTo(108, 1e-9));
    expect(bars[1].overdue, true);
    expect(bars[2].x, closeTo(288, 1e-9));
    expect(bars[2].width, closeTo(396, 1e-9));
    expect(bars[2].y, closeTo(76, 1e-9));
    expect(bars[2].progressWidth, closeTo(99, 1e-9));
    expect(bars[2].overdue, false);
    expect(bars[3].x, closeTo(828, 1e-9));
    expect(bars[3].width, closeTo(0, 1e-9));
    expect(bars[3].y, closeTo(110, 1e-9));
    expect(bars[3].progressWidth, closeTo(0, 1e-9));
    expect(bars[3].overdue, false);
    expect(ticks.map((t) => t.label).toList(),
        <String>['3/2', '3/9', '3/16', '3/23', '3/30', '4/6', '4/13']);
    expect(ticks.map((t) => t.current).toList(),
        <bool>[false, false, false, true, false, false, false]);
    expect(ganttTodayX(domain, dayWidth: 18.0, today: '2026-03-25'),
        closeTo(414, 1e-9));
    expect(ganttTodayX(domain, dayWidth: 18.0, today: '2027-01-01'), closeTo(-1, 1e-9));
    expect(links.map((l) => l.id).toList(),
        <String>['a->b', 'b->c', 'c->m']);
    expect(links[0].points, <double>[198.0, 17.0, 206.0, 17.0, 206.0, 51.0, 162.0, 51.0]);
    expect(links[1].points, <double>[342.0, 51.0, 350.0, 51.0, 350.0, 85.0, 288.0, 85.0]);
    expect(links[2].points, <double>[684.0, 85.0, 820.0, 85.0, 820.0, 119.0, 828.0, 119.0]);
    expect(daysBetween('2026-03-04', '2026-03-12') + 1, 9);
    expect(ganttCycle(<IGanttTask>[
      const IGanttTask(id: 'x', name: 'x', start: '2026-01-01', end: '2026-01-02', deps: <String>['y']),
      const IGanttTask(id: 'y', name: 'y', start: '2026-01-01', end: '2026-01-02', deps: <String>['x']),
    ]), <String>['x', 'y']);
    expect(ganttCycle(<IGanttTask>[const IGanttTask(id: 'a', name: '调研', start: '2026-03-04', end: '2026-03-12', progress: 1), const IGanttTask(id: 'b', name: '定稿', start: '2026-03-11', end: '2026-03-20', progress: 0.6, deps: <String>['a']), const IGanttTask(id: 'c', name: '开发', start: '2026-03-18', end: '2026-04-08', progress: 0.25, deps: <String>['b']), const IGanttTask(id: 'm', name: '发布', start: '2026-04-17', end: '2026-04-17', deps: <String>['c'], milestone: true)]), isEmpty);
  });

  test('词云的字号映射、螺线落点与档位与 Web 端一致', () {
    final placed = wordLayout(<IWordMeasured>[const IWordMeasured(text: '设计令牌', value: 96.0, width: 192.0, height: 54.0), const IWordMeasured(text: '多端一致', value: 84.0, width: 192.0, height: 54.0), const IWordMeasured(text: '无障碍', value: 71.0, width: 144.0, height: 54.0), const IWordMeasured(text: '主题定制', value: 65.0, width: 192.0, height: 54.0), const IWordMeasured(text: '暗色模式', value: 58.0, width: 192.0, height: 54.0), const IWordMeasured(text: '组件库', value: 54.0, width: 144.0, height: 54.0), const IWordMeasured(text: '覆盖矩阵', value: 47.0, width: 192.0, height: 54.0), const IWordMeasured(text: '小程序', value: 43.0, width: 144.0, height: 54.0), const IWordMeasured(text: '图表', value: 39.0, width: 96.0, height: 54.0), const IWordMeasured(text: '动效', value: 28.0, width: 96.0, height: 54.0)], 640.0, 320.0);
    expect(placed.length, 10);
    expect(placed[0].text, '设计令牌');
    expect(placed[0].x, closeTo(320, 1e-9));
    expect(placed[0].y, closeTo(160, 1e-9));
    expect(placed[0].fontSize, closeTo(48, 1e-9));
    expect(placed[0].rotated, false);
    expect(placed[1].text, '多端一致');
    expect(placed[1].x, closeTo(318.7899723173482, 1e-9));
    expect(placed[1].y, closeTo(105.2832468838476, 1e-9));
    expect(placed[1].fontSize, closeTo(44.66946766702908, 1e-9));
    expect(placed[1].rotated, false);
    expect(placed[2].text, '无障碍');
    expect(placed[2].x, closeTo(309.8119413228986, 1e-9));
    expect(placed[2].y, closeTo(212.16122769550807, 1e-9));
    expect(placed[2].fontSize, closeTo(40.62742412032046, 1e-9));
    expect(placed[2].rotated, false);
    expect(placed[3].text, '主题定制');
    expect(placed[3].x, closeTo(459.3704053439161, 1e-9));
    expect(placed[3].y, closeTo(213.26857025348818, 1e-9));
    expect(placed[3].fontSize, closeTo(38.55515902020237, 1e-9));
    expect(placed[3].rotated, false);
    expect(placed[4].text, '暗色模式');
    expect(placed[4].x, closeTo(198.58391723563753, 1e-9));
    expect(placed[4].y, closeTo(164.4396765071006, 1e-9));
    expect(placed[4].fontSize, closeTo(35.91160190958257, 1e-9));
    expect(placed[4].rotated, true);
    expect(placed[5].text, '组件库');
    expect(placed[5].x, closeTo(474.1244179903161, 1e-9));
    expect(placed[5].y, closeTo(152.47533066017857, 1e-9));
    expect(placed[5].fontSize, closeTo(34.260489926430324, 1e-9));
    expect(placed[5].rotated, false);
    expect(placed[6].text, '覆盖矩阵');
    expect(placed[6].x, closeTo(479.3297089489002, 1e-9));
    expect(placed[6].y, closeTo(111.5456237598478, 1e-9));
    expect(placed[6].fontSize, closeTo(31.02938903535328, 1e-9));
    expect(placed[6].rotated, false);
    expect(placed[7].text, '小程序');
    expect(placed[7].x, closeTo(354.78305859193415, 1e-9));
    expect(placed[7].y, closeTo(253.6508761607068, 1e-9));
    expect(placed[7].fontSize, closeTo(28.908055859299036, 1e-9));
    expect(placed[7].rotated, false);
    expect(placed[8].text, '图表');
    expect(placed[8].x, closeTo(149.58127350379775, 1e-9));
    expect(placed[8].y, closeTo(182.15830812456863, 1e-9));
    expect(placed[8].fontSize, closeTo(26.47919399771719, 1e-9));
    expect(placed[8].rotated, false);
    expect(placed[9].text, '动效');
    expect(placed[9].x, closeTo(228.8717691882244, 1e-9));
    expect(placed[9].y, closeTo(202.63415751810908, 1e-9));
    expect(placed[9].fontSize, closeTo(12, 1e-9));
    expect(placed[9].rotated, true);
    expect(wordOverflow(<IWordItem>[const IWordItem(text: '设计令牌', value: 96.0), const IWordItem(text: '多端一致', value: 84.0), const IWordItem(text: '无障碍', value: 71.0), const IWordItem(text: '主题定制', value: 65.0), const IWordItem(text: '暗色模式', value: 58.0), const IWordItem(text: '组件库', value: 54.0), const IWordItem(text: '覆盖矩阵', value: 47.0), const IWordItem(text: '小程序', value: 43.0), const IWordItem(text: '图表', value: 39.0), const IWordItem(text: '动效', value: 28.0)], placed), 0);
    expect(wordFontSize(96.0, 12.0, 96.0), closeTo(48, 1e-9));
    expect(wordFontSize(12.0, 12.0, 96.0), closeTo(12, 1e-9));
    expect(wordFontSize(54.0, 12.0, 96.0), closeTo(37.45584412271572, 1e-9));
    expect(wordFontSize(5.0, 5.0, 5.0), closeTo(30, 1e-9));
    expect(wordTone(0, 10), IWordTone.strong);
    expect(wordTone(1, 10), IWordTone.strong);
    expect(wordTone(2, 10), IWordTone.base);
    expect(wordTone(5, 10), IWordTone.base);
    expect(wordTone(6, 10), IWordTone.muted);
    expect(wordTone(9, 10), IWordTone.muted);
    expect(wordTone(0, 0), IWordTone.base);
  });

  test('外链白名单的放行与拒绝清单与 Web 端一致', () {
    expect(safeHref('https://a.com/x'), 'https://a.com/x');
    expect(safeHref('http://a.com'), 'http://a.com');
    expect(safeHref('/docs/a'), '/docs/a');
    expect(safeHref('#top'), '#top');
    expect(safeHref('./a'), './a');
    expect(safeHref('../a'), '../a');
    expect(safeHref('a/b'), 'a/b');
    expect(safeHref('mailto:a@b.c'), 'mailto:a@b.c');
    expect(safeHref('tel:123'), 'tel:123');
    expect(safeHref('javascript:alert(1)'), null);
    expect(safeHref('JavaScript:alert(1)'), null);
    expect(safeHref('java\tscript:alert(1)'), null);
    expect(safeHref('data:text/html,x'), null);
    expect(safeHref('//evil.com'), null);
    expect(safeHref('vbscript:m'), null);
    expect(safeHref('\\\\evil.com'), null);
    expect(safeHref('  javascript:alert(1)  '), null);
    expect(safeHref(''), null);
  });

  test('行 diff 的分组、顺序与统计与 Web 端一致', () {
    // 第 1 组
    expect(diffLines('b\nc', 'a\nb\nc').length, 3);
    expect(diffStat(diffLines('b\nc', 'a\nb\nc')).added, 1);
    expect(diffStat(diffLines('b\nc', 'a\nb\nc')).removed, 0);
    expect(diffLines('b\nc', 'a\nb\nc')[0].kind, IDiffKind.add);
    expect(diffLines('b\nc', 'a\nb\nc')[1].kind, IDiffKind.same);
    expect(diffLines('b\nc', 'a\nb\nc')[2].kind, IDiffKind.same);
    // 第 2 组
    expect(diffLines('x\nold\ny', 'x\nnew\ny').length, 4);
    expect(diffStat(diffLines('x\nold\ny', 'x\nnew\ny')).added, 1);
    expect(diffStat(diffLines('x\nold\ny', 'x\nnew\ny')).removed, 1);
    expect(diffLines('x\nold\ny', 'x\nnew\ny')[0].kind, IDiffKind.same);
    expect(diffLines('x\nold\ny', 'x\nnew\ny')[1].kind, IDiffKind.remove);
    expect(diffLines('x\nold\ny', 'x\nnew\ny')[2].kind, IDiffKind.add);
    expect(diffLines('x\nold\ny', 'x\nnew\ny')[3].kind, IDiffKind.same);
    // 第 3 组
    expect(diffLines('a\nb', 'a\nb').length, 2);
    expect(diffStat(diffLines('a\nb', 'a\nb')).added, 0);
    expect(diffStat(diffLines('a\nb', 'a\nb')).removed, 0);
    expect(diffLines('a\nb', 'a\nb')[0].kind, IDiffKind.same);
    expect(diffLines('a\nb', 'a\nb')[1].kind, IDiffKind.same);
    // 第 4 组
    expect(diffLines('a\nb\nc', 'c\nb\na').length, 5);
    expect(diffStat(diffLines('a\nb\nc', 'c\nb\na')).added, 2);
    expect(diffStat(diffLines('a\nb\nc', 'c\nb\na')).removed, 2);
    expect(diffLines('a\nb\nc', 'c\nb\na')[0].kind, IDiffKind.remove);
    expect(diffLines('a\nb\nc', 'c\nb\na')[1].kind, IDiffKind.remove);
    expect(diffLines('a\nb\nc', 'c\nb\na')[2].kind, IDiffKind.same);
    expect(diffLines('a\nb\nc', 'c\nb\na')[3].kind, IDiffKind.add);
    expect(diffLines('a\nb\nc', 'c\nb\na')[4].kind, IDiffKind.add);
    // 第 5 组
    expect(diffLines('', 'a').length, 2);
    expect(diffStat(diffLines('', 'a')).added, 1);
    expect(diffStat(diffLines('', 'a')).removed, 1);
    expect(diffLines('', 'a')[0].kind, IDiffKind.remove);
    expect(diffLines('', 'a')[1].kind, IDiffKind.add);
  });

  test('命令搜索的排序、高亮区间与索引环绕与 Web 端一致', () {
    final items = <ICommandItem>[ICommandItem(key: 'button', label: '按钮', description: '触发一个动作', keywords: <String>['button'], group: '基础'), ICommandItem(key: 'button-group', label: '按钮组', description: '一组并排的按钮', keywords: <String>['button group']), ICommandItem(key: 'tag', label: '标签', description: '用按钮旁的小块标记状态', keywords: <String>['tag']), ICommandItem(key: 'form-validate', label: '表单 校验', keywords: <String>['validate']), ICommandItem(key: 'empty', label: '空状态', keywords: <String>['empty', 'placeholder'])];
    // 搜 按钮
    expect(searchCommands(items, '按钮').length, 3);
    expect(searchCommands(items, '按钮')[0].item.key, 'button');
    expect(searchCommands(items, '按钮')[1].item.key, 'button-group');
    expect(searchCommands(items, '按钮')[2].item.key, 'tag');
    expect(searchCommands(items, '按钮')[0].ranges.first[0], 0);
    expect(searchCommands(items, '按钮')[0].ranges.first[1], 2);
    // 搜 button
    expect(searchCommands(items, 'button').length, 2);
    expect(searchCommands(items, 'button')[0].item.key, 'button');
    expect(searchCommands(items, 'button')[1].item.key, 'button-group');
    // 搜 校验
    expect(searchCommands(items, '校验').length, 1);
    expect(searchCommands(items, '校验')[0].item.key, 'form-validate');
    expect(searchCommands(items, '校验')[0].ranges.first[0], 3);
    expect(searchCommands(items, '校验')[0].ranges.first[1], 5);
    // 搜 placeholder
    expect(searchCommands(items, 'placeholder').length, 1);
    expect(searchCommands(items, 'placeholder')[0].item.key, 'empty');
    // 搜 （空）
    expect(searchCommands(items, '').length, 5);
    expect(searchCommands(items, '')[0].item.key, 'button');
    expect(searchCommands(items, '')[1].item.key, 'button-group');
    expect(searchCommands(items, '')[2].item.key, 'tag');
    expect(searchCommands(items, '')[3].item.key, 'form-validate');
    expect(searchCommands(items, '')[4].item.key, 'empty');
    // 搜 不存在的词
    expect(searchCommands(items, '不存在的词').length, 0);
    // 搜 标签
    expect(searchCommands(items, '标签').length, 1);
    expect(searchCommands(items, '标签')[0].item.key, 'tag');
    expect(searchCommands(items, '标签')[0].ranges.first[0], 0);
    expect(searchCommands(items, '标签')[0].ranges.first[1], 2);
    expect(searchCommands(items, '', limit: 2).length, 2);
    expect(moveCommandIndex(0, 1, 3), 1);
    expect(moveCommandIndex(2, 1, 3), 0);
    expect(moveCommandIndex(0, -1, 3), 2);
    expect(moveCommandIndex(1, -1, 3), 0);
    expect(moveCommandIndex(0, 1, 0), 0);
    expect(moveCommandIndex(5, 1, 0), 0);
  });

  test('工具芯片的统计写法与折叠汇总与 Web 端一致', () {
    final chips = <IToolChipItem>[IToolChipItem(key: 'a', label: 'App.tsx', status: IToolChipStatus.success, added: 74, removed: 41), IToolChipItem(key: 'b', label: 'flavors.css', status: IToolChipStatus.error, added: 0, removed: 0), IToolChipItem(key: 'c', label: 'grep', status: IToolChipStatus.running, added: 2, removed: 0), IToolChipItem(key: 'd', label: 'main.ts', status: IToolChipStatus.success, added: 0, removed: 9)];
    expect(toolChipStat(13, 4), "+13 −4");
    expect(toolChipStat(13, 0), "+13");
    expect(toolChipStat(0, 4), "−4");
    expect(toolChipStat(0, 0), "");
    expect(toolChipStat(1, 1), "+1 −1");
    expect(toolChipStat(999, 1000), "+999 −1000");
    expect(summarizeToolChips(chips).total, 4);
    expect(summarizeToolChips(chips).running, 1);
    expect(summarizeToolChips(chips).failed, 1);
    expect(summarizeToolChips(chips).added, 76);
    expect(summarizeToolChips(chips).removed, 50);
    expect(summarizeToolChips(<IToolChipItem>[]).total, 0);
    expect(summarizeToolChips(<IToolChipItem>[]).added, 0);
    expect(toolChipIcon(IToolChipStatus.success), "check-circle");
    expect(toolChipIcon(IToolChipStatus.error), "error-circle");
  });

  test('洞察卡的翻页边界、擦洗取点与涨跌说法与 Web 端一致', () {
    final item = InsightItemData(id: 'i1', title: '转化率', summary: '周三回升', series: <double>[12, 9, 11, 15], labels: <String>['周一', '周二', '周三', '周四'], unit: '%');
    expect(insightPage(3, 2, 1), 2);
    expect(insightPage(3, 0, -1), 0);
    expect(insightPage(3, 0, 1), 1);
    expect(insightPage(0, 0, 1), 0);
    expect(insightPage(3, 1, -1), 0);
    expect(scrubIndex(0, 300, 4), 0);
    expect(scrubIndex(60, 300, 4), 1);
    expect(scrubIndex(160, 300, 4), 2);
    expect(scrubIndex(300, 300, 4), 3);
    expect(scrubIndex(-40, 300, 4), 0);
    expect(scrubIndex(999, 300, 4), 3);
    expect(scrubIndex(160, 300, 1), 0);
    expect(scrubX(0, 300, 4), 0);
    expect(scrubX(1, 300, 4), 100);
    expect(scrubX(2, 300, 4), 200);
    expect(scrubX(3, 300, 4), 300);
    expect(scrubReadout(item, 0).label, "周一");
    expect(scrubReadout(item, 0).value, "12%");
    expect(scrubReadout(item, 2).label, "周三");
    expect(scrubReadout(item, 2).value, "11%");
    expect(scrubReadout(item, 3).label, "周四");
    expect(scrubReadout(item, 3).value, "15%");
    expect(trendLabel(insightTrend(<double>[12, 15])), "上升 25%");
    expect(trendIcon(insightTrend(<double>[12, 15])), "chevron-up");
    expect(trendLabel(insightTrend(<double>[15, 12])), "下降 20%");
    expect(trendIcon(insightTrend(<double>[15, 12])), "chevron-down");
    expect(trendLabel(insightTrend(<double>[8, 8])), "持平");
    expect(trendIcon(insightTrend(<double>[8, 8])), "minus");
    expect(trendLabel(insightTrend(<double>[0, 5])), "上升 5");
    expect(trendIcon(insightTrend(<double>[0, 5])), "chevron-up");
    expect(trendLabel(insightTrend(<double>[10, 30, 28])), "上升 180%");
    expect(trendIcon(insightTrend(<double>[10, 30, 28])), "chevron-up");
    expect(trendLabel(insightTrend(<double>[])), "持平");
    expect(insightPlot(320).inner, 310);
    expect(insightPlot(320).inset, 5);
    expect(insightPlot(12).inner, 6);
    expect(insightPlot(12).inset, 3);
    expect(insightPlot(8).inner, 4);
    expect(insightPlot(8).inset, 2);
    expect(insightPlot(400.5).inner, 390.5);
    expect(insightPlot(400.5).inset, 5);
    expect(formatInsightValue(12), "12");
    expect(formatInsightValue(12.34), "12.3");
    expect(formatInsightValue(0), "0");
    expect(formatInsightValue(-3.5), "-3.5");
  });

  test('选区的清理、字数上限、引文省略与动作条落点与 Web 端一致', () {
    expect(cleanSelection('the quick\nbrown fox'), 'the quick brown fox');
    expect(cleanSelection('第一段\n\n\n第二段'), '第一段\n\n第二段');
    expect(cleanSelection('  改   一下  '), '改 一下');
    expect(cleanSelection('   \n  '), '');
    expect(hasSelection('the quick\nbrown fox'), true);
    expect(hasSelection('第一段\n\n\n第二段'), true);
    expect(hasSelection('  改   一下  '), true);
    expect(hasSelection('   \n  '), false);
    expect(selectionTooLong('the quick\nbrown fox'), false);
    expect(selectionTooLong('第一段\n\n\n第二段'), false);
    expect(selectionTooLong('  改   一下  '), false);
    expect(selectionTooLong('   \n  '), false);
    expect(selectionCount('the quick\nbrown fox'), 19);
    expect(selectionCount('第一段\n\n\n第二段'), 8);
    expect(selectionCount('  改   一下  '), 4);
    expect(selectionCount('   \n  '), 0);
    expect(hasSelection('改一改这一整段话', max: 4), false);
    expect(selectionTooLong('改一改这一整段话', max: 4), true);
    expect(selectionExcerpt('短句', max: 11), '短句');
    expect(selectionExcerpt('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaMIDDLEbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', max: 11), 'aaaaa…bbbbb');
    expect(selectionAnchor(IOverlayRect(200, 300, 120, 20), 200, 40, 1000, 800).x, 160);
    expect(selectionAnchor(IOverlayRect(200, 300, 120, 20), 200, 40, 1000, 800).y, 252);
    expect(selectionAnchor(IOverlayRect(200, 300, 120, 20), 200, 40, 1000, 800).placement, SelectionPlacement.top);
    expect(selectionAnchor(IOverlayRect(200, 4, 120, 20), 200, 40, 1000, 800).x, 160);
    expect(selectionAnchor(IOverlayRect(200, 4, 120, 20), 200, 40, 1000, 800).y, 32);
    expect(selectionAnchor(IOverlayRect(200, 4, 120, 20), 200, 40, 1000, 800).placement, SelectionPlacement.bottom);
    expect(selectionAnchor(IOverlayRect(940, 300, 60, 20), 200, 40, 1000, 800).x, 792);
    expect(selectionAnchor(IOverlayRect(940, 300, 60, 20), 200, 40, 1000, 800).y, 252);
    expect(selectionAnchor(IOverlayRect(940, 300, 60, 20), 200, 40, 1000, 800).placement, SelectionPlacement.top);
    expect(selectionAnchor(IOverlayRect(0, 780, 40, 20), 200, 40, 1000, 800).x, 8);
    expect(selectionAnchor(IOverlayRect(0, 780, 40, 20), 200, 40, 1000, 800).y, 732);
    expect(selectionAnchor(IOverlayRect(0, 780, 40, 20), 200, 40, 1000, 800).placement, SelectionPlacement.top);
  });

  test('属性检查器的夹范围、改动判定与显示文字与 Web 端一致', () {
    expect(clampFieldValue(FineTuneFieldData(key: 'size', label: '字号', kind: FineTuneKind.number, min: 12, max: 32, step: 2, unit: 'px'), 12.7), 12);
    expect(clampFieldValue(FineTuneFieldData(key: 'size', label: '字号', kind: FineTuneKind.number, min: 12, max: 32, step: 2, unit: 'px'), 13.2), 14);
    expect(clampFieldValue(FineTuneFieldData(key: 'size', label: '字号', kind: FineTuneKind.number, min: 12, max: 32, step: 2, unit: 'px'), 99), 32);
    expect(clampFieldValue(FineTuneFieldData(key: 'size', label: '字号', kind: FineTuneKind.number, min: 12, max: 32, step: 2, unit: 'px'), -5), 12);
    expect(clampFieldValue(FineTuneFieldData(key: 'opacity', label: '不透明度', kind: FineTuneKind.number, min: 0, max: 1, step: 0.1), 0.31), 0.3);
    expect(clampFieldValue(FineTuneFieldData(key: 'opacity', label: '不透明度', kind: FineTuneKind.number, min: 0, max: 1, step: 0.1), 0.44), 0.4);
    expect(clampFieldValue(FineTuneFieldData(key: 'opacity', label: '不透明度', kind: FineTuneKind.number, min: 0, max: 1, step: 0.1), 1.4), 1);
    expect(changedKeys(<FineTuneFieldData>[FineTuneFieldData(key: 'size', label: '字号', kind: FineTuneKind.number, min: 12, max: 32, step: 2, unit: 'px'), FineTuneFieldData(key: 'opacity', label: '不透明度', kind: FineTuneKind.number, min: 0, max: 1, step: 0.1), FineTuneFieldData(key: 'tone', label: '语气', kind: FineTuneKind.select, options: <FineTuneOption>[FineTuneOption(value: 'calm', label: '克制')]), FineTuneFieldData(key: 'bold', label: '加粗', kind: FineTuneKind.switchKind)], <String, Object?>{'size': 16, 'opacity': 0.5, 'tone': 'calm', 'bold': false}, <String, Object?>{'size': 24, 'opacity': 0.5, 'tone': 'calm', 'bold': true}), <String>['size', 'bold']);
    expect(changedKeys(<FineTuneFieldData>[FineTuneFieldData(key: 'size', label: '字号', kind: FineTuneKind.number, min: 12, max: 32, step: 2, unit: 'px'), FineTuneFieldData(key: 'opacity', label: '不透明度', kind: FineTuneKind.number, min: 0, max: 1, step: 0.1), FineTuneFieldData(key: 'tone', label: '语气', kind: FineTuneKind.select, options: <FineTuneOption>[FineTuneOption(value: 'calm', label: '克制')]), FineTuneFieldData(key: 'bold', label: '加粗', kind: FineTuneKind.switchKind)], <String, Object?>{'size': 16, 'opacity': 0.5, 'tone': 'calm', 'bold': false}, <String, Object?>{'size': 16, 'opacity': 0.5, 'tone': 'calm', 'bold': false}), <String>[]);
    expect(fineTuneSummary(0), "与原始结果一致");
    expect(fineTuneSummary(1), "改了 1 项");
    expect(fineTuneSummary(3), "改了 3 项");
    expect(formatFieldValue(FineTuneFieldData(key: 'size', label: '字号', kind: FineTuneKind.number, min: 12, max: 32, step: 2, unit: 'px'), 16), "16px");
    expect(formatFieldValue(FineTuneFieldData(key: 'tone', label: '语气', kind: FineTuneKind.select, options: <FineTuneOption>[FineTuneOption(value: 'calm', label: '克制')]), 'calm'), "克制");
    expect(formatFieldValue(FineTuneFieldData(key: 'bold', label: '加粗', kind: FineTuneKind.switchKind), true), "开");
    expect(formatFieldValue(FineTuneFieldData(key: 'bold', label: '加粗', kind: FineTuneKind.switchKind), false), "关");
    expect(formatFieldValue(FineTuneFieldData(key: 'size', label: '字号', kind: FineTuneKind.number, min: 12, max: 32, step: 2, unit: 'px'), null), "—");
    expect(fieldRatio(FineTuneFieldData(key: 'size', label: '字号', kind: FineTuneKind.number, min: 12, max: 32, step: 2, unit: 'px'), 22), 0.5);
    expect(fieldRatio(FineTuneFieldData(key: 'size', label: '字号', kind: FineTuneKind.number, min: 12, max: 32, step: 2, unit: 'px'), 99), 1);
    expect(fieldRatio(FineTuneFieldData(key: 'size', label: '字号', kind: FineTuneKind.number, min: 12, max: 32, step: 2, unit: 'px'), 12), 0);
    expect(fieldRatio(FineTuneFieldData(key: 'tone', label: '语气', kind: FineTuneKind.select, options: <FineTuneOption>[FineTuneOption(value: 'calm', label: '克制')]), 'calm'), 0);
  });

  test('智能体屏幕的状态说法、接管条件与画面新鲜度与 Web 端一致', () {
    expect(screenStatusText(AgentScreenState.connecting), "正在连接屏幕");
    expect(screenStatusText(AgentScreenState.connecting, '正在填写收货地址'), "正在连接屏幕");
    expect(screenStatusIcon(AgentScreenState.connecting), "refresh");
    expect(canTakeOver(AgentScreenState.connecting), false);
    expect(screenStatusText(AgentScreenState.working), "正在操作");
    expect(screenStatusText(AgentScreenState.working, '正在填写收货地址'), "正在填写收货地址");
    expect(screenStatusIcon(AgentScreenState.working), "sparkle");
    expect(canTakeOver(AgentScreenState.working), true);
    expect(screenStatusText(AgentScreenState.paused), "已暂停");
    expect(screenStatusText(AgentScreenState.paused, '正在填写收货地址'), "已暂停：正在填写收货地址");
    expect(screenStatusIcon(AgentScreenState.paused), "minus");
    expect(canTakeOver(AgentScreenState.paused), true);
    expect(screenStatusText(AgentScreenState.done), "已完成");
    expect(screenStatusText(AgentScreenState.done, '正在填写收货地址'), "已完成");
    expect(screenStatusIcon(AgentScreenState.done), "check-circle");
    expect(canTakeOver(AgentScreenState.done), false);
    expect(screenStatusText(AgentScreenState.error), "出错了");
    expect(screenStatusText(AgentScreenState.error, '正在填写收货地址'), "正在填写收货地址");
    expect(screenStatusIcon(AgentScreenState.error), "error-circle");
    expect(canTakeOver(AgentScreenState.error), false);
    expect(frameAge(10000, 9000), "");
    expect(frameAge(10000, 7000), "画面 3 秒前");
    expect(frameAge(200000, 20000), "画面 3 分钟前");
    expect(frameAge(8000000, 200000), "画面 2 小时前");
    expect(frameStale(30000, 10000, AgentScreenState.working), true);
    expect(frameStale(20000, 10000, AgentScreenState.working), false);
    expect(frameStale(30000, 10000, AgentScreenState.done), false);
    expect(frameStale(30000, 10000, AgentScreenState.error), false);
    expect(frameStaleText(54000, 10000), "画面已经 44 秒没动了，可能卡住了");
    expect(frameStaleText(200000, 20000), "画面已经 3 分钟没动了，可能卡住了");
    expect(frameStaleText(8000000, 200000), "画面已经 2 小时没动了，可能卡住了");
    expect(screenAspect(1280, 800), 1.6);
    expect(screenAspect(), 1.6);
    expect(screenAspect(0, 800), 1.6);
  });

  test('会话列表的分组、空标题兜底与删除后落点与 Web 端一致', () {
    // 本地墙钟，不是纪元毫秒数：分组问的是「用户的今天」
    final now = DateTime(2026, 9, 13, 14).millisecondsSinceEpoch;
    final sessions = <ChatSessionData>[ChatSessionData(id: 'a', updatedAt: now - 3600000, title: '报销流程', preview: ''), ChatSessionData(id: 'b', updatedAt: now - 86400000, title: '', preview: '帮我把这段话改得更简短'), ChatSessionData(id: 'c', updatedAt: now - 2592000000, title: '旧的讨论', preview: ''), ChatSessionData(id: 'd', updatedAt: now - 864000000, title: '常用清单', preview: '', pinned: true), ChatSessionData(id: 'e', updatedAt: now - 432000000, title: '上周的图', preview: '')];
    expect(sessionTitle(sessions[0]), "报销流程");
    expect(sessionTitle(sessions[1]), "帮我把这段话改得更简短");
    expect(sessionTitle(sessions[2]), "旧的讨论");
    expect(sessionTitle(sessions[3]), "常用清单");
    expect(sessionTitle(sessions[4]), "上周的图");
    expect(sessionTitle(ChatSessionData(id: 'x', updatedAt: 0)), "新会话");
    expect(groupKeyOf(sessions[0], now), ChatGroupKey.today);
    expect(groupKeyOf(sessions[1], now), ChatGroupKey.yesterday);
    expect(groupKeyOf(sessions[2], now), ChatGroupKey.earlier);
    expect(groupKeyOf(sessions[3], now), ChatGroupKey.pinned);
    expect(groupKeyOf(sessions[4], now), ChatGroupKey.week);
    expect(groupSessions(sessions, now).length, 5);
    expect(groupSessions(sessions, now)[0].key, ChatGroupKey.pinned);
    expect(groupSessions(sessions, now)[0].label, "置顶");
    expect(groupSessions(sessions, now)[0].sessions.map((s) => s.id).toList(), <String>['d']);
    expect(groupSessions(sessions, now)[1].key, ChatGroupKey.today);
    expect(groupSessions(sessions, now)[1].label, "今天");
    expect(groupSessions(sessions, now)[1].sessions.map((s) => s.id).toList(), <String>['a']);
    expect(groupSessions(sessions, now)[2].key, ChatGroupKey.yesterday);
    expect(groupSessions(sessions, now)[2].label, "昨天");
    expect(groupSessions(sessions, now)[2].sessions.map((s) => s.id).toList(), <String>['b']);
    expect(groupSessions(sessions, now)[3].key, ChatGroupKey.week);
    expect(groupSessions(sessions, now)[3].label, "最近 7 天");
    expect(groupSessions(sessions, now)[3].sessions.map((s) => s.id).toList(), <String>['e']);
    expect(groupSessions(sessions, now)[4].key, ChatGroupKey.earlier);
    expect(groupSessions(sessions, now)[4].label, "更早");
    expect(groupSessions(sessions, now)[4].sessions.map((s) => s.id).toList(), <String>['c']);
    expect(filterSessions(sessions, "简短").map((s) => s.id).toList(), <String>['b']);
    expect(filterSessions(sessions, "报销").map((s) => s.id).toList(), <String>['a']);
    expect(filterSessions(sessions, "  ").map((s) => s.id).toList(), <String>['a', 'b', 'c', 'd', 'e']);
    expect(nextAfterDelete(groupSessions(sessions, now), 'b', 'b'), "e");
    expect(nextAfterDelete(groupSessions(sessions, now), 'e', 'e'), "c");
    expect(nextAfterDelete(groupSessions(sessions, now), 'c', 'c'), "e");
    expect(nextAfterDelete(groupSessions(sessions, now), 'a', 'c'), "c");
    expect(moveActiveSession(groupSessions(sessions, now), 'd', 1), "a");
    expect(moveActiveSession(groupSessions(sessions, now), 'd', -1), "d");
    expect(moveActiveSession(groupSessions(sessions, now), 'c', 1), "c");
    expect(moveActiveSession(groupSessions(sessions, now), 'c', -1), "e");
  });

  test('代码块的缩进归一与 Web 端一致', () {
    expect(dedentCode('      <div>\n        <span />\n      </div>'), '<div>\n  <span />\n</div>');
    expect(dedentCode('\n\n  <p />\n  \n'), '<p />');
    expect(dedentCode('    a\n\n    b'), 'a\n\nb');
    expect(dedentCode('a  \nb'), 'a\nb');
    expect(dedentCode('\n   \n  \n'), '');
    expect(dedentCode('<IButton>提交</IButton>'), '<IButton>提交</IButton>');
  });

  test('推理轨迹的默认展开、进度与图标与 Web 端一致', () {
    final steps = <IThinkingStep>[IThinkingStep(key: 'a', title: '拆解问题', kind: IThinkingStepKind.reason, status: IThinkingStepStatus.done), IThinkingStep(key: 'b', title: '检索文档', kind: IThinkingStepKind.search, status: IThinkingStepStatus.error), IThinkingStep(key: 'c', title: '写补丁', kind: IThinkingStepKind.code, status: IThinkingStepStatus.running), IThinkingStep(key: 'd', title: '复核', kind: IThinkingStepKind.tool, status: IThinkingStepStatus.done)];
    expect(defaultOpenSteps(steps), <String>['b', 'c']);
    expect(defaultOpenSteps(<IThinkingStep>[]), <String>[]);
    expect(summarizeThinking(steps).total, 4);
    expect(summarizeThinking(steps).done, 2);
    expect(summarizeThinking(steps).running, 1);
    expect(summarizeThinking(steps).failed, 1);
    expect(summarizeThinking(steps).activeIndex, 2);
    expect(summarizeThinking(<IThinkingStep>[]).activeIndex, -1);
    expect(thinkingStepIcon(IThinkingStepKind.reason), "sparkle");
    expect(thinkingStepIcon(IThinkingStepKind.search), "search");
    expect(thinkingStepIcon(IThinkingStepKind.code), "code");
    expect(thinkingStepIcon(IThinkingStepKind.tool), "layers");
    expect(toggleThinkingStep(<String>['b'], 'c'), <String>['b', 'c']);
    expect(toggleThinkingStep(<String>['b', 'c'], 'b'), <String>['c']);
  });

  test('贴着触发器的面板往哪边开与 Web 端一致', () {
    expect(shouldFlipUp(400, 32, 160, 720), false);
    expect(shouldFlipUp(400, 32, 160, 520), true);
    expect(shouldFlipUp(100, 32, 600, 300), false);
    expect(shouldFlipUp(400, 32, 280, 720), false);
    expect(shouldFlipUp(0, 32, 100, 200), false);
    expect(shouldFlipUp(650, 32, 60, 720), true);
  });

  test('对齐辅助线的吸附量与线位置与 Web 端一致', () {
    // 第 1 组
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 103, y: 200, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 20, width: 120, height: 48)]).dx, -3);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 103, y: 200, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 20, width: 120, height: 48)]).dy, 0);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 103, y: 200, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 20, width: 120, height: 48)]).guides.length, 3);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 103, y: 200, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 20, width: 120, height: 48)]).guides[0].at, 100);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 103, y: 200, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 20, width: 120, height: 48)]).guides[1].at, 160);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 103, y: 200, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 20, width: 120, height: 48)]).guides[2].at, 220);
    // 第 2 组
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 140, y: 200, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 20, width: 120, height: 48)]).dx, 0);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 140, y: 200, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 20, width: 120, height: 48)]).dy, 0);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 140, y: 200, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 20, width: 120, height: 48)]).guides.length, 0);
    // 第 3 组
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 100, y: 300, width: 60, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 70, y: 20, width: 120, height: 48)]).dx, 0);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 100, y: 300, width: 60, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 70, y: 20, width: 120, height: 48)]).dy, 0);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 100, y: 300, width: 60, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 70, y: 20, width: 120, height: 48)]).guides.length, 1);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 100, y: 300, width: 60, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 70, y: 20, width: 120, height: 48)]).guides[0].at, 130);
    // 第 4 组
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 102, y: 203, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 200, width: 120, height: 48)]).dx, -2);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 102, y: 203, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 200, width: 120, height: 48)]).dy, -3);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 102, y: 203, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 200, width: 120, height: 48)]).guides.length, 6);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 102, y: 203, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 200, width: 120, height: 48)]).guides[0].at, 100);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 102, y: 203, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 200, width: 120, height: 48)]).guides[1].at, 160);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 102, y: 203, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 200, width: 120, height: 48)]).guides[2].at, 220);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 102, y: 203, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 200, width: 120, height: 48)]).guides[3].at, 200);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 102, y: 203, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 200, width: 120, height: 48)]).guides[4].at, 224);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 102, y: 203, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 200, width: 120, height: 48)]).guides[5].at, 248);
    // 第 5 组
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 100, y: 400, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 20, width: 120, height: 48)]).dx, 0);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 100, y: 400, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 20, width: 120, height: 48)]).dy, 0);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 100, y: 400, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 20, width: 120, height: 48)]).guides.length, 3);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 100, y: 400, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 20, width: 120, height: 48)]).guides[0].at, 100);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 100, y: 400, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 20, width: 120, height: 48)]).guides[1].at, 160);
    expect(alignGuides(FlowNodeData(id: 'a', label: 'a', x: 100, y: 400, width: 120, height: 48), <FlowNodeData>[FlowNodeData(id: 'b', label: 'b', x: 100, y: 20, width: 120, height: 48)]).guides[2].at, 220);
  });

  test('指定锚点的落点与 Web 端一致', () {
    expect(anchorOf(FlowNodeData(id: 'a', label: 'a', x: 100, y: 200, width: 120, height: 48), 0, 0, 'left').x, 100);
    expect(anchorOf(FlowNodeData(id: 'a', label: 'a', x: 100, y: 200, width: 120, height: 48), 0, 0, 'left').y, 224);
    expect(anchorOf(FlowNodeData(id: 'a', label: 'a', x: 100, y: 200, width: 120, height: 48), 0, 0, 'left').side, 'left');
    expect(anchorOf(FlowNodeData(id: 'a', label: 'a', x: 100, y: 200, width: 120, height: 48), 0, 0, 'right').x, 220);
    expect(anchorOf(FlowNodeData(id: 'a', label: 'a', x: 100, y: 200, width: 120, height: 48), 0, 0, 'right').y, 224);
    expect(anchorOf(FlowNodeData(id: 'a', label: 'a', x: 100, y: 200, width: 120, height: 48), 0, 0, 'right').side, 'right');
    expect(anchorOf(FlowNodeData(id: 'a', label: 'a', x: 100, y: 200, width: 120, height: 48), 0, 0, 'top').x, 160);
    expect(anchorOf(FlowNodeData(id: 'a', label: 'a', x: 100, y: 200, width: 120, height: 48), 0, 0, 'top').y, 200);
    expect(anchorOf(FlowNodeData(id: 'a', label: 'a', x: 100, y: 200, width: 120, height: 48), 0, 0, 'top').side, 'top');
    expect(anchorOf(FlowNodeData(id: 'a', label: 'a', x: 100, y: 200, width: 120, height: 48), 0, 0, 'bottom').x, 160);
    expect(anchorOf(FlowNodeData(id: 'a', label: 'a', x: 100, y: 200, width: 120, height: 48), 0, 0, 'bottom').y, 248);
    expect(anchorOf(FlowNodeData(id: 'a', label: 'a', x: 100, y: 200, width: 120, height: 48), 0, 0, 'bottom').side, 'bottom');
    expect(anchorOf(FlowNodeData(id: 'a', label: 'a', x: 100, y: 200, width: 120, height: 48), 160, 900).side, "bottom");
  });

  test('节点分组折叠后的节点与连线与 Web 端一致', () {
    final gNodes = <FlowNodeData>[FlowNodeData(id: 'a', label: 'a', x: 100, y: 100, width: 120, height: 48), FlowNodeData(id: 'b', label: 'b', x: 300, y: 200, width: 120, height: 48), FlowNodeData(id: 'c', label: 'c', x: 600, y: 100, width: 120, height: 48)];
    final box = groupBounds(gNodes, FlowGroupData(id: 'g1', label: '审批', nodeIds: <String>['a', 'b'], collapsed: false))!;
    expect(box.left, 84);
    expect(box.top, 66);
    expect(box.width, 352);
    expect(box.height, 198);
    expect(groupBounds(gNodes, FlowGroupData(id: 'g', label: 'x', nodeIds: <String>['zz'])), null);
    final shown = visibleNodes(gNodes, <FlowGroupData>[FlowGroupData(id: 'g1', label: '审批', nodeIds: <String>['a', 'b'], collapsed: true)]);
    expect(shown.length, 2);
    expect(shown[0].id, 'c');
    expect(shown[1].id, 'g1');
    expect(shown.last.label, "审批 · 2");
    final links = visibleEdges(<FlowEdgeData>[FlowEdgeData(from: 'a', to: 'c'), FlowEdgeData(from: 'b', to: 'c'), FlowEdgeData(from: 'a', to: 'b')], <FlowGroupData>[FlowGroupData(id: 'g1', label: '审批', nodeIds: <String>['a', 'b'], collapsed: true)]);
    expect(links.length, 1);
    expect(links[0].from, 'g1');
    expect(links[0].to, 'c');
  });

  test('等待时长的显示阈值、进位与刷新间隔与 Web 端一致', () {
    expect(shouldShowElapsed(0), false);
    expect(shouldShowElapsed(2999), false);
    expect(shouldShowElapsed(3000), true);
    expect(shouldShowElapsed(61000), true);
    expect(shouldShowElapsed(3599999), true);
    expect(elapsedParts(0).minutes, 0);
    expect(elapsedParts(0).seconds, 0);
    expect(elapsedParts(5400).minutes, 0);
    expect(elapsedParts(5400).seconds, 5);
    expect(elapsedParts(59999).minutes, 0);
    expect(elapsedParts(59999).seconds, 59);
    expect(elapsedParts(60000).minutes, 1);
    expect(elapsedParts(60000).seconds, 0);
    expect(elapsedParts(125000).minutes, 2);
    expect(elapsedParts(125000).seconds, 5);
    expect(elapsedParts(-100).minutes, 0);
    expect(elapsedParts(-100).seconds, 0);
    expect(elapsedInterval(0), 1000);
    expect(elapsedInterval(1), 999);
    expect(elapsedInterval(500), 500);
    expect(elapsedInterval(999), 1);
    expect(elapsedInterval(1000), 1000);
    expect(elapsedInterval(5400), 600);
  });

  test('排队/连接/断线/等人确认的叙述与可取消性与 Web 端一致', () {
    final n0 = describeRun(status: IRunPhase.queued, now: 1000000, queuePosition: 3);
    expect(n0.label, "排队中");
    expect(n0.detail, "前面还有 3 个请求");
    expect(n0.icon, "clock");
    expect(n0.tone, INoticeTone.neutral);
    expect(n0.busy, true);
    expect(n0.cancelable, true);
    expect(n0.waited, 0);
    final n1 = describeRun(status: IRunPhase.queued, now: 1000000, queuePosition: 0);
    expect(n1.label, "排队中");
    expect(n1.detail, "马上就轮到了");
    expect(n1.icon, "clock");
    expect(n1.tone, INoticeTone.neutral);
    expect(n1.busy, true);
    expect(n1.cancelable, true);
    expect(n1.waited, 0);
    final n2 = describeRun(status: IRunPhase.queued, now: 1000000);
    expect(n2.label, "排队中");
    expect(n2.detail, "");
    expect(n2.icon, "clock");
    expect(n2.tone, INoticeTone.neutral);
    expect(n2.busy, true);
    expect(n2.cancelable, true);
    expect(n2.waited, 0);
    final n3 = describeRun(status: IRunPhase.connecting, now: 1000000);
    expect(n3.label, "连接中");
    expect(n3.detail, "正在建立连接");
    expect(n3.icon, "network");
    expect(n3.tone, INoticeTone.progress);
    expect(n3.busy, true);
    expect(n3.cancelable, true);
    expect(n3.waited, 0);
    final n4 = describeRun(status: IRunPhase.streaming, now: 1000000);
    expect(n4.label, "生成中");
    expect(n4.detail, "");
    expect(n4.icon, "sparkle");
    expect(n4.tone, INoticeTone.progress);
    expect(n4.busy, true);
    expect(n4.cancelable, true);
    expect(n4.waited, 0);
    final n5 = describeRun(status: IRunPhase.streaming, now: 1000000, connection: IConnectionPhase.reconnecting, attempt: 2, retryAt: 1002400);
    expect(n5.label, "连接断开");
    expect(n5.detail, "第 2 次重连，3 秒后重试");
    expect(n5.icon, "offline");
    expect(n5.tone, INoticeTone.danger);
    expect(n5.busy, true);
    expect(n5.cancelable, true);
    expect(n5.waited, 0);
    final n6 = describeRun(status: IRunPhase.streaming, now: 1000000, connection: IConnectionPhase.reconnecting);
    expect(n6.label, "连接断开");
    expect(n6.detail, "正在重连");
    expect(n6.icon, "offline");
    expect(n6.tone, INoticeTone.danger);
    expect(n6.busy, true);
    expect(n6.cancelable, true);
    expect(n6.waited, 0);
    final n7 = describeRun(status: IRunPhase.streaming, now: 1000000, connection: IConnectionPhase.connecting);
    expect(n7.label, "连接中");
    expect(n7.detail, "正在建立连接");
    expect(n7.icon, "network");
    expect(n7.tone, INoticeTone.progress);
    expect(n7.busy, true);
    expect(n7.cancelable, true);
    expect(n7.waited, 0);
    final n8 = describeRun(status: IRunPhase.awaitingApproval, now: 1000000);
    expect(n8.label, "等待确认");
    expect(n8.detail, "需要你确认后继续");
    expect(n8.icon, "help-circle");
    expect(n8.tone, INoticeTone.neutral);
    expect(n8.busy, false);
    expect(n8.cancelable, true);
    expect(n8.waited, 0);
    final n9 = describeRun(status: IRunPhase.completed, now: 1000000, connection: IConnectionPhase.reconnecting);
    expect(n9.label, "已完成");
    expect(n9.detail, "");
    expect(n9.icon, "check-circle");
    expect(n9.tone, INoticeTone.success);
    expect(n9.busy, false);
    expect(n9.cancelable, false);
    expect(n9.waited, 0);
    final n10 = describeRun(status: IRunPhase.failed, now: 1000000);
    expect(n10.label, "生成失败");
    expect(n10.detail, "");
    expect(n10.icon, "error-circle");
    expect(n10.tone, INoticeTone.danger);
    expect(n10.busy, false);
    expect(n10.cancelable, false);
    expect(n10.waited, 0);
    final n11 = describeRun(status: IRunPhase.cancelled, now: 1000000);
    expect(n11.label, "已取消");
    expect(n11.detail, "");
    expect(n11.icon, "close");
    expect(n11.tone, INoticeTone.neutral);
    expect(n11.busy, false);
    expect(n11.cancelable, false);
    expect(n11.waited, 0);
    final n12 = describeRun(status: IRunPhase.queued, now: 1000000, startedAt: 995800);
    expect(n12.label, "排队中");
    expect(n12.detail, "");
    expect(n12.icon, "clock");
    expect(n12.tone, INoticeTone.neutral);
    expect(n12.busy, true);
    expect(n12.cancelable, true);
    expect(n12.waited, 4200);
    expect(retryCountdown(1002001, 1000000), 3);
    expect(retryCountdown(1003000, 1000000), 3);
    expect(retryCountdown(1000001, 1000000), 1);
    expect(retryCountdown(1000000, 1000000), 0);
    expect(retryCountdown(995000, 1000000), 0);
  });

  test('表单壳的提交闸、离开保护、重置范围与分步状态与 Web 端一致', () {
    final sg0 = submitGate(phase: ISubmitPhase.idle, valid: true);
    expect(sg0.allowed, true);
    expect(sg0.busy, false);
    expect(sg0.reason, "");
    final sg1 = submitGate(phase: ISubmitPhase.idle, valid: false);
    expect(sg1.allowed, false);
    expect(sg1.busy, false);
    expect(sg1.reason, "还有字段没填对");
    final sg2 = submitGate(phase: ISubmitPhase.submitting, valid: true);
    expect(sg2.allowed, false);
    expect(sg2.busy, true);
    expect(sg2.reason, "正在提交，请稍候");
    final sg3 = submitGate(phase: ISubmitPhase.submitting, valid: false);
    expect(sg3.allowed, false);
    expect(sg3.busy, true);
    expect(sg3.reason, "正在提交，请稍候");
    final sg4 = submitGate(phase: ISubmitPhase.failed, valid: true);
    expect(sg4.allowed, true);
    expect(sg4.busy, false);
    expect(sg4.reason, "");
    final sg5 = submitGate(phase: ISubmitPhase.succeeded, valid: true);
    expect(sg5.allowed, false);
    expect(sg5.busy, false);
    expect(sg5.reason, "已提交");
    final sg6 = submitGate(phase: ISubmitPhase.succeeded, valid: true, resubmittable: true);
    expect(sg6.allowed, true);
    expect(sg6.busy, false);
    expect(sg6.reason, "");
    final sg7 = submitGate(phase: ISubmitPhase.idle, valid: true, disabled: true);
    expect(sg7.allowed, false);
    expect(sg7.busy, false);
    expect(sg7.reason, "当前不可提交");
    expect(changedFields({"a": 1}, {"a": 1}), []);
    expect(isDirty({"a": 1}, {"a": 1}), false);
    expect(changedFields({"a": 1, "b": "x"}, {"a": 2, "b": "x"}), ["a"]);
    expect(isDirty({"a": 1, "b": "x"}, {"a": 2, "b": "x"}), true);
    expect(changedFields({"a": 1}, {"a": 1, "b": 2}), ["b"]);
    expect(isDirty({"a": 1}, {"a": 1, "b": 2}), true);
    expect(changedFields({"a": 1, "b": 2}, {"a": 1}), ["b"]);
    expect(isDirty({"a": 1, "b": 2}, {"a": 1}), true);
    expect(changedFields({"tags": ["x"]}, {"tags": ["x"]}), []);
    expect(isDirty({"tags": ["x"]}, {"tags": ["x"]}), false);
    expect(changedFields({"tags": ["x"]}, {"tags": ["y"]}), ["tags"]);
    expect(isDirty({"tags": ["x"]}, {"tags": ["y"]}), true);
    expect(changedFields({}, {}), []);
    expect(isDirty({}, {}), false);
    final lg0 = leaveGuard(base: {"a": 1}, current: {"a": 1}, phase: ISubmitPhase.idle);
    expect(lg0.blocked, false);
    expect(lg0.message, "");
    final lg1 = leaveGuard(base: {"a": 1, "b": 1}, current: {"a": 2, "b": 3}, phase: ISubmitPhase.idle);
    expect(lg1.blocked, true);
    expect(lg1.message, "有 2 项修改还没保存，确定离开吗？");
    final lg2 = leaveGuard(base: {"a": 1}, current: {"a": 2}, phase: ISubmitPhase.submitting);
    expect(lg2.blocked, false);
    expect(lg2.message, "");
    final lg3 = leaveGuard(base: {"a": 1}, current: {"a": 2}, phase: ISubmitPhase.succeeded);
    expect(lg3.blocked, false);
    expect(lg3.message, "");
    final lg4 = leaveGuard(base: {"a": 1}, current: {"a": 2}, phase: ISubmitPhase.idle, draftSaved: true);
    expect(lg4.blocked, false);
    expect(lg4.message, "");
    final lg5 = leaveGuard(base: {"a": 1}, current: {"a": 2}, phase: ISubmitPhase.failed);
    expect(lg5.blocked, true);
    expect(lg5.message, "有 1 项修改还没保存，确定离开吗？");
    expect(resetValues(IResetScope.initial, {"a": 1, "b": 2}, {"a": 9}), {"a": 1, "b": 2});
    expect(resetValues(IResetScope.initial, {"a": 1, "b": 2}), {"a": 1, "b": 2});
    expect(resetLabel(IResetScope.initial, hasDraft: true), "撤销修改");
    expect(resetLabel(IResetScope.initial), "撤销修改");
    expect(resetValues(IResetScope.draft, {"a": 1, "b": 2}, {"a": 9}), {"a": 9});
    expect(resetValues(IResetScope.draft, {"a": 1, "b": 2}), {"a": 1, "b": 2});
    expect(resetLabel(IResetScope.draft, hasDraft: true), "回到草稿");
    expect(resetLabel(IResetScope.draft), "撤销修改");
    expect(resetValues(IResetScope.empty, {"a": 1, "b": 2}, {"a": 9}), {});
    expect(resetValues(IResetScope.empty, {"a": 1, "b": 2}), {});
    expect(resetLabel(IResetScope.empty, hasDraft: true), "清空");
    expect(resetLabel(IResetScope.empty), "清空");
    final ss0 = stepState(steps: [IStepSpec(key: "s1", title: "基本信息", fields: ["name", "code"]), IStepSpec(key: "s2", title: "收货地址", fields: ["addr"]), IStepSpec(key: "s3", title: "备注", fields: ["note"], optional: true)], index: 0, errorPaths: ["addr"], visited: [0]);
    expect(ss0.blocked, false);
    expect(ss0.canPrev, false);
    expect(ss0.canNext, true);
    expect(ss0.isLast, false);
    expect(ss0.marks.map((m) => m.state).toList(), [IStepMarkState.current, IStepMarkState.todo, IStepMarkState.todo]);
    final ss1 = stepState(steps: [IStepSpec(key: "s1", title: "基本信息", fields: ["name", "code"]), IStepSpec(key: "s2", title: "收货地址", fields: ["addr"]), IStepSpec(key: "s3", title: "备注", fields: ["note"], optional: true)], index: 0, errorPaths: ["name"], visited: [0]);
    expect(ss1.blocked, true);
    expect(ss1.canPrev, false);
    expect(ss1.canNext, false);
    expect(ss1.isLast, false);
    expect(ss1.marks.map((m) => m.state).toList(), [IStepMarkState.current, IStepMarkState.todo, IStepMarkState.todo]);
    final ss2 = stepState(steps: [IStepSpec(key: "s1", title: "基本信息", fields: ["name", "code"]), IStepSpec(key: "s2", title: "收货地址", fields: ["addr"]), IStepSpec(key: "s3", title: "备注", fields: ["note"], optional: true)], index: 2, errorPaths: ["note"], visited: [0, 1, 2]);
    expect(ss2.blocked, false);
    expect(ss2.canPrev, true);
    expect(ss2.canNext, false);
    expect(ss2.isLast, true);
    expect(ss2.marks.map((m) => m.state).toList(), [IStepMarkState.done, IStepMarkState.done, IStepMarkState.current]);
    final ss3 = stepState(steps: [IStepSpec(key: "s1", title: "基本信息", fields: ["name", "code"]), IStepSpec(key: "s2", title: "收货地址", fields: ["addr"]), IStepSpec(key: "s3", title: "备注", fields: ["note"], optional: true)], index: 2, errorPaths: ["addr"], visited: [0, 1, 2]);
    expect(ss3.blocked, false);
    expect(ss3.canPrev, true);
    expect(ss3.canNext, false);
    expect(ss3.isLast, true);
    expect(ss3.marks.map((m) => m.state).toList(), [IStepMarkState.done, IStepMarkState.error, IStepMarkState.current]);
    final ss4 = stepState(steps: [IStepSpec(key: "s1", title: "基本信息", fields: ["name", "code"]), IStepSpec(key: "s2", title: "收货地址", fields: ["addr"]), IStepSpec(key: "s3", title: "备注", fields: ["note"], optional: true)], index: 1, errorPaths: [], visited: [0, 1]);
    expect(ss4.blocked, false);
    expect(ss4.canPrev, true);
    expect(ss4.canNext, true);
    expect(ss4.isLast, false);
    expect(ss4.marks.map((m) => m.state).toList(), [IStepMarkState.done, IStepMarkState.current, IStepMarkState.todo]);
    final ss5 = stepState(steps: [IStepSpec(key: "s1", title: "基本信息", fields: ["name", "code"]), IStepSpec(key: "s2", title: "收货地址", fields: ["addr"]), IStepSpec(key: "s3", title: "备注", fields: ["note"], optional: true)], index: 0, errorPaths: [], visited: [0]);
    expect(ss5.blocked, false);
    expect(ss5.canPrev, false);
    expect(ss5.canNext, true);
    expect(ss5.isLast, false);
    expect(ss5.marks.map((m) => m.state).toList(), [IStepMarkState.current, IStepMarkState.todo, IStepMarkState.todo]);
    expect(stepOfError([IStepSpec(key: "s1", title: "基本信息", fields: ["name", "code"]), IStepSpec(key: "s2", title: "收货地址", fields: ["addr"]), IStepSpec(key: "s3", title: "备注", fields: ["note"], optional: true)], ["name"]), 0);
    expect(stepOfError([IStepSpec(key: "s1", title: "基本信息", fields: ["name", "code"]), IStepSpec(key: "s2", title: "收货地址", fields: ["addr"]), IStepSpec(key: "s3", title: "备注", fields: ["note"], optional: true)], ["addr"]), 1);
    expect(stepOfError([IStepSpec(key: "s1", title: "基本信息", fields: ["name", "code"]), IStepSpec(key: "s2", title: "收货地址", fields: ["addr"]), IStepSpec(key: "s3", title: "备注", fields: ["note"], optional: true)], ["note"]), 2);
    expect(stepOfError([IStepSpec(key: "s1", title: "基本信息", fields: ["name", "code"]), IStepSpec(key: "s2", title: "收货地址", fields: ["addr"]), IStepSpec(key: "s3", title: "备注", fields: ["note"], optional: true)], ["__form"]), -1);
    expect(stepOfError([IStepSpec(key: "s1", title: "基本信息", fields: ["name", "code"]), IStepSpec(key: "s2", title: "收货地址", fields: ["addr"]), IStepSpec(key: "s3", title: "备注", fields: ["note"], optional: true)], []), -1);
  });

  test('批量操作的作用域、升级入口与部分失败重试与 Web 端一致', () {
    final bs0 = bulkSelection(scope: IBulkScope.selected, pageIds: [1, 2, 3], selectedIds: [1], matchedTotal: 8000);
    expect(bs0.count, 1);
    expect(bs0.summary, "已勾选的 1 项");
    expect(bs0.needsConfirm, false);
    expect(bs0.confirmMessage, "");
    expect(bs0.ids, [1]);
    final bs1 = bulkSelection(scope: IBulkScope.selected, pageIds: [1, 2, 3], selectedIds: [], matchedTotal: 8000);
    expect(bs1.count, 0);
    expect(bs1.summary, "未选择任何项");
    expect(bs1.needsConfirm, false);
    expect(bs1.confirmMessage, "");
    expect(bs1.ids, []);
    final bs2 = bulkSelection(scope: IBulkScope.page, pageIds: [1, 2, 3], selectedIds: [1], matchedTotal: 8000);
    expect(bs2.count, 3);
    expect(bs2.summary, "当前页的 3 项");
    expect(bs2.needsConfirm, false);
    expect(bs2.confirmMessage, "");
    expect(bs2.ids, [1, 2, 3]);
    final bs3 = bulkSelection(scope: IBulkScope.page, pageIds: [], selectedIds: [], matchedTotal: 0);
    expect(bs3.count, 0);
    expect(bs3.summary, "未选择任何项");
    expect(bs3.needsConfirm, false);
    expect(bs3.confirmMessage, "");
    expect(bs3.ids, []);
    final bs4 = bulkSelection(scope: IBulkScope.matched, pageIds: [1, 2, 3], selectedIds: [], matchedTotal: 8000);
    expect(bs4.count, 8000);
    expect(bs4.summary, "全表的全部 8000 项");
    expect(bs4.needsConfirm, true);
    expect(bs4.confirmMessage, "即将对全表的全部 8000 项执行操作，其中包含当前页看不到的数据。");
    expect(bs4.ids, null);
    final bs5 = bulkSelection(scope: IBulkScope.matched, pageIds: [1, 2, 3], selectedIds: [], matchedTotal: 20, filtered: true);
    expect(bs5.count, 20);
    expect(bs5.summary, "符合当前筛选条件的全部 20 项");
    expect(bs5.needsConfirm, true);
    expect(bs5.confirmMessage, "即将对符合当前筛选条件的全部 20 项执行操作，其中包含当前页看不到的数据。");
    expect(bs5.ids, null);
    final bs6 = bulkSelection(scope: IBulkScope.matched, pageIds: [1, 2, 3], selectedIds: [], matchedTotal: 0);
    expect(bs6.count, 0);
    expect(bs6.summary, "未选择任何项");
    expect(bs6.needsConfirm, false);
    expect(bs6.confirmMessage, "");
    expect(bs6.ids, []);
    expect(canEscalate(pageIds: [1, 2, 3], selectedIds: [1, 2, 3], matchedTotal: 8000), true);
    expect(canEscalate(pageIds: [1, 2, 3], selectedIds: [1, 2], matchedTotal: 8000), false);
    expect(canEscalate(pageIds: [1, 2, 3], selectedIds: [1, 2, 3], matchedTotal: 3), false);
    expect(canEscalate(pageIds: [], selectedIds: [], matchedTotal: 8000), false);
    expect(escalateLabel(8000, filtered: true), "选择符合当前筛选条件的全部 8000 项");
    expect(escalateLabel(8000, filtered: false), "选择全表的全部 8000 项");
    expect(escalateLabel(3, filtered: true), "选择符合当前筛选条件的全部 3 项");
    final bo0 = bulkOutcome([IBulkResultItem(id: 1, ok: true), IBulkResultItem(id: 2, ok: false, reason: "已出库，不能撤销"), IBulkResultItem(id: 3, ok: false)]);
    expect(bo0.kind, IBulkOutcomeKind.partial);
    expect(bo0.total, 3);
    expect(bo0.succeeded, [1]);
    expect(bo0.retryIds, [2, 3]);
    expect(bo0.summary, "1 项成功，2 项失败");
    expect(failureIndex(bo0), {"2": "已出库，不能撤销", "3": "未知原因"});
    final bo1 = bulkOutcome([IBulkResultItem(id: 1, ok: true)]);
    expect(bo1.kind, IBulkOutcomeKind.allOk);
    expect(bo1.total, 1);
    expect(bo1.succeeded, [1]);
    expect(bo1.retryIds, []);
    expect(bo1.summary, "1 项全部成功");
    expect(failureIndex(bo1), <String, String>{});
    final bo2 = bulkOutcome([IBulkResultItem(id: 1, ok: false, reason: "库存不足")]);
    expect(bo2.kind, IBulkOutcomeKind.allFailed);
    expect(bo2.total, 1);
    expect(bo2.succeeded, []);
    expect(bo2.retryIds, [1]);
    expect(bo2.summary, "1 项全部失败");
    expect(failureIndex(bo2), {"1": "库存不足"});
    final bo3 = bulkOutcome([]);
    expect(bo3.kind, IBulkOutcomeKind.allOk);
    expect(bo3.total, 0);
    expect(bo3.succeeded, []);
    expect(bo3.retryIds, []);
    expect(bo3.summary, "0 项全部成功");
    expect(failureIndex(bo3), <String, String>{});
    final bm0 = mergeOutcome(bulkOutcome([IBulkResultItem(id: 1, ok: true), IBulkResultItem(id: 2, ok: false, reason: "库存不足"), IBulkResultItem(id: 3, ok: false, reason: "库存不足")]), bulkOutcome([IBulkResultItem(id: 2, ok: true), IBulkResultItem(id: 3, ok: false, reason: "库存不足")]));
    expect(bm0.succeeded, [1, 2]);
    expect(bm0.retryIds, [3]);
    expect(bm0.total, 3);
    expect(bm0.summary, "2 项成功，1 项失败");
    expect(bm0.failed, [IBulkFailure(id: 3, reason: "库存不足")]);
    final bm1 = mergeOutcome(bulkOutcome([IBulkResultItem(id: 1, ok: true), IBulkResultItem(id: 2, ok: false, reason: "库存不足"), IBulkResultItem(id: 3, ok: false, reason: "库存不足")]), bulkOutcome([IBulkResultItem(id: 2, ok: true), IBulkResultItem(id: 3, ok: true)]));
    expect(bm1.succeeded, [1, 2, 3]);
    expect(bm1.retryIds, []);
    expect(bm1.total, 3);
    expect(bm1.summary, "3 项全部成功");
    expect(bm1.failed, []);
    final bm2 = mergeOutcome(bulkOutcome([IBulkResultItem(id: 1, ok: true), IBulkResultItem(id: 2, ok: false, reason: "库存不足"), IBulkResultItem(id: 3, ok: false, reason: "库存不足")]), bulkOutcome([IBulkResultItem(id: 2, ok: false, reason: "已被他人锁定"), IBulkResultItem(id: 3, ok: true)]));
    expect(bm2.succeeded, [1, 3]);
    expect(bm2.retryIds, [2]);
    expect(bm2.total, 3);
    expect(bm2.summary, "2 项成功，1 项失败");
    expect(bm2.failed, [IBulkFailure(id: 2, reason: "已被他人锁定")]);
  });

  test('详情页的动作可用性、记录失效、相邻条目与返回票据与 Web 端一致', () {
    final da0 = detailActions([IDetailActionSpec(key: "edit", label: "编辑", states: ["draft"]), IDetailActionSpec(key: "submit", label: "提交", kind: IDetailActionKind.primary, states: ["draft"]), IDetailActionSpec(key: "approve", label: "通过", states: ["submitted"], permission: "审批"), IDetailActionSpec(key: "print", label: "打印", readOnly: true), IDetailActionSpec(key: "void", label: "作废", kind: IDetailActionKind.danger, states: ["submitted"], permission: "作废")], status: "draft", permissions: ["审批"]);
    expect(da0.map((a) => a.key).toList(), ["edit", "submit", "print"]);
    expect(da0.map((a) => a.disabled).toList(), [false, false, false]);
    expect(da0.map((a) => a.reason).toList(), ["", "", ""]);
    expect(da0.map((a) => a.kind).toList(), [IDetailActionKind.standard, IDetailActionKind.primary, IDetailActionKind.standard]);
    final da1 = detailActions([IDetailActionSpec(key: "edit", label: "编辑", states: ["draft"]), IDetailActionSpec(key: "submit", label: "提交", kind: IDetailActionKind.primary, states: ["draft"]), IDetailActionSpec(key: "approve", label: "通过", states: ["submitted"], permission: "审批"), IDetailActionSpec(key: "print", label: "打印", readOnly: true), IDetailActionSpec(key: "void", label: "作废", kind: IDetailActionKind.danger, states: ["submitted"], permission: "作废")], status: "submitted", permissions: []);
    expect(da1.map((a) => a.key).toList(), ["approve", "print", "void"]);
    expect(da1.map((a) => a.disabled).toList(), [true, false, true]);
    expect(da1.map((a) => a.reason).toList(), ["需要「审批」权限", "", "需要「作废」权限"]);
    expect(da1.map((a) => a.kind).toList(), [IDetailActionKind.standard, IDetailActionKind.standard, IDetailActionKind.danger]);
    final da2 = detailActions([IDetailActionSpec(key: "edit", label: "编辑", states: ["draft"]), IDetailActionSpec(key: "submit", label: "提交", kind: IDetailActionKind.primary, states: ["draft"]), IDetailActionSpec(key: "approve", label: "通过", states: ["submitted"], permission: "审批"), IDetailActionSpec(key: "print", label: "打印", readOnly: true), IDetailActionSpec(key: "void", label: "作废", kind: IDetailActionKind.danger, states: ["submitted"], permission: "作废")], status: "submitted", permissions: ["审批", "作废"]);
    expect(da2.map((a) => a.key).toList(), ["approve", "print", "void"]);
    expect(da2.map((a) => a.disabled).toList(), [false, false, false]);
    expect(da2.map((a) => a.reason).toList(), ["", "", ""]);
    expect(da2.map((a) => a.kind).toList(), [IDetailActionKind.standard, IDetailActionKind.standard, IDetailActionKind.danger]);
    final da3 = detailActions([IDetailActionSpec(key: "edit", label: "编辑", states: ["draft"]), IDetailActionSpec(key: "submit", label: "提交", kind: IDetailActionKind.primary, states: ["draft"]), IDetailActionSpec(key: "approve", label: "通过", states: ["submitted"], permission: "审批"), IDetailActionSpec(key: "print", label: "打印", readOnly: true), IDetailActionSpec(key: "void", label: "作废", kind: IDetailActionKind.danger, states: ["submitted"], permission: "作废")], status: "draft", permissions: [], freshness: IRecordFreshness.stale);
    expect(da3.map((a) => a.key).toList(), ["edit", "submit", "print"]);
    expect(da3.map((a) => a.disabled).toList(), [true, true, false]);
    expect(da3.map((a) => a.reason).toList(), ["这条记录已被他人更新，请先刷新", "这条记录已被他人更新，请先刷新", ""]);
    expect(da3.map((a) => a.kind).toList(), [IDetailActionKind.standard, IDetailActionKind.primary, IDetailActionKind.standard]);
    final da4 = detailActions([IDetailActionSpec(key: "edit", label: "编辑", states: ["draft"]), IDetailActionSpec(key: "submit", label: "提交", kind: IDetailActionKind.primary, states: ["draft"]), IDetailActionSpec(key: "approve", label: "通过", states: ["submitted"], permission: "审批"), IDetailActionSpec(key: "print", label: "打印", readOnly: true), IDetailActionSpec(key: "void", label: "作废", kind: IDetailActionKind.danger, states: ["submitted"], permission: "作废")], status: "draft", permissions: [], freshness: IRecordFreshness.deleted);
    expect(da4.map((a) => a.key).toList(), ["edit", "submit", "print"]);
    expect(da4.map((a) => a.disabled).toList(), [true, true, false]);
    expect(da4.map((a) => a.reason).toList(), ["这条记录已被删除", "这条记录已被删除", ""]);
    expect(da4.map((a) => a.kind).toList(), [IDetailActionKind.standard, IDetailActionKind.primary, IDetailActionKind.standard]);
    final da5 = detailActions([IDetailActionSpec(key: "edit", label: "编辑", states: ["draft"]), IDetailActionSpec(key: "submit", label: "提交", kind: IDetailActionKind.primary, states: ["draft"]), IDetailActionSpec(key: "approve", label: "通过", states: ["submitted"], permission: "审批"), IDetailActionSpec(key: "print", label: "打印", readOnly: true), IDetailActionSpec(key: "void", label: "作废", kind: IDetailActionKind.danger, states: ["submitted"], permission: "作废")], status: "submitted", permissions: ["审批"], denied: {"approve": "不能审批自己提交的单据"});
    expect(da5.map((a) => a.key).toList(), ["approve", "print", "void"]);
    expect(da5.map((a) => a.disabled).toList(), [true, false, true]);
    expect(da5.map((a) => a.reason).toList(), ["不能审批自己提交的单据", "", "需要「作废」权限"]);
    expect(da5.map((a) => a.kind).toList(), [IDetailActionKind.standard, IDetailActionKind.standard, IDetailActionKind.danger]);
    final da6 = detailActions([IDetailActionSpec(key: "edit", label: "编辑", states: ["draft"]), IDetailActionSpec(key: "submit", label: "提交", kind: IDetailActionKind.primary, states: ["draft"]), IDetailActionSpec(key: "approve", label: "通过", states: ["submitted"], permission: "审批"), IDetailActionSpec(key: "print", label: "打印", readOnly: true), IDetailActionSpec(key: "void", label: "作废", kind: IDetailActionKind.danger, states: ["submitted"], permission: "作废")], status: "submitted", permissions: [], freshness: IRecordFreshness.stale, denied: {"approve": "不能审批自己提交的单据"});
    expect(da6.map((a) => a.key).toList(), ["approve", "print", "void"]);
    expect(da6.map((a) => a.disabled).toList(), [true, false, true]);
    expect(da6.map((a) => a.reason).toList(), ["需要「审批」权限", "", "需要「作废」权限"]);
    expect(da6.map((a) => a.kind).toList(), [IDetailActionKind.standard, IDetailActionKind.standard, IDetailActionKind.danger]);
    final da7 = detailActions([IDetailActionSpec(key: "edit", label: "编辑", states: ["draft"]), IDetailActionSpec(key: "submit", label: "提交", kind: IDetailActionKind.primary, states: ["draft"]), IDetailActionSpec(key: "approve", label: "通过", states: ["submitted"], permission: "审批"), IDetailActionSpec(key: "print", label: "打印", readOnly: true), IDetailActionSpec(key: "void", label: "作废", kind: IDetailActionKind.danger, states: ["submitted"], permission: "作废")], status: "shipped", permissions: []);
    expect(da7.map((a) => a.key).toList(), ["print"]);
    expect(da7.map((a) => a.disabled).toList(), [false]);
    expect(da7.map((a) => a.reason).toList(), [""]);
    expect(da7.map((a) => a.kind).toList(), [IDetailActionKind.standard]);
    expect(noActionHint("已发货"), "「已发货」状态下没有可执行的操作");
    expect(noActionHint("draft"), "「draft」状态下没有可执行的操作");
    final df0 = recordFreshness(seenRevision: 3, currentRevision: 3);
    expect(df0.kind, IRecordFreshness.fresh);
    expect(df0.label, "最新");
    expect(df0.detail, "");
    expect(df0.action, IFreshnessAction.none);
    final df1 = recordFreshness(seenRevision: 3, currentRevision: 5);
    expect(df1.kind, IRecordFreshness.stale);
    expect(df1.label, "已被他人更新");
    expect(df1.detail, "你看到的是 v3，现在已经是 v5");
    expect(df1.action, IFreshnessAction.refresh);
    final df2 = recordFreshness(seenRevision: 3, currentRevision: 3, exists: false);
    expect(df2.kind, IRecordFreshness.deleted);
    expect(df2.label, "已被删除");
    expect(df2.detail, "这条记录已经不在了，页面上显示的是你进来时的那一份");
    expect(df2.action, IFreshnessAction.back);
    final df3 = recordFreshness(seenRevision: 1, currentRevision: 9, exists: false);
    expect(df3.kind, IRecordFreshness.deleted);
    expect(df3.label, "已被删除");
    expect(df3.detail, "这条记录已经不在了，页面上显示的是你进来时的那一份");
    expect(df3.action, IFreshnessAction.back);
    final dn0 = detailNeighbours(["a", "b", "c"], "a");
    expect(dn0.index, 0);
    expect(dn0.prevId, null);
    expect(dn0.nextId, "b");
    expect(dn0.position, "第 1 条，共 3 条");
    expect(dn0.edgeHint, "已经是第一条");
    final dn1 = detailNeighbours(["a", "b", "c"], "b");
    expect(dn1.index, 1);
    expect(dn1.prevId, "a");
    expect(dn1.nextId, "c");
    expect(dn1.position, "第 2 条，共 3 条");
    expect(dn1.edgeHint, "");
    final dn2 = detailNeighbours(["a", "b", "c"], "c");
    expect(dn2.index, 2);
    expect(dn2.prevId, "b");
    expect(dn2.nextId, null);
    expect(dn2.position, "第 3 条，共 3 条");
    expect(dn2.edgeHint, "已经是最后一条");
    final dn3 = detailNeighbours(["a", "b", "c"], "zz");
    expect(dn3.index, -1);
    expect(dn3.prevId, null);
    expect(dn3.nextId, null);
    expect(dn3.position, "");
    expect(dn3.edgeHint, "");
    expect(detailNeighbours(["a"], "a").edgeHint, "只有这一条");
    final dr0 = unpackReturn(packReturn(IReturnTicket(search: "?owner=林岚&status=archived&page=6", scrollY: 1280, focusId: "SO-7")));
    expect(dr0!.search, "?owner=林岚&status=archived&page=6");
    expect(dr0.scrollY, 1280);
    expect(dr0.focusId, "SO-7");
    final dr1 = unpackReturn(packReturn(IReturnTicket(search: "", scrollY: 13)));
    expect(dr1!.search, "");
    expect(dr1.scrollY, 13);
    expect(dr1.focusId, null);
    final dr2 = unpackReturn(packReturn(IReturnTicket(search: "", scrollY: 0)));
    expect(dr2!.search, "");
    expect(dr2.scrollY, 0);
    expect(dr2.focusId, null);
    final dr3 = unpackReturn(packReturn(IReturnTicket(search: "?q=A%26B&tag=x", scrollY: 0)));
    expect(dr3!.search, "?q=A%26B&tag=x");
    expect(dr3.scrollY, 0);
    expect(dr3.focusId, null);
    expect(unpackReturn("{不是 JSON"), null);
    expect(unpackReturn(""), null);
    expect(unpackReturn("123"), null);
    expect(unpackReturn(null), null);
    final drp = unpackReturn('{"s":"?a=1"}');
    expect(drp!.search, "?a=1");
    expect(drp.scrollY, 0);
    expect(drp.focusId, null);
    expect(returnLabel(IReturnTicket(search: "?page=6", scrollY: 0)), "返回列表第 7 页");
    expect(returnLabel(IReturnTicket(search: "?owner=x", scrollY: 0)), "返回列表");
    expect(returnLabel(null), "返回列表");
  });

  test('人员选择的可选性、已选顺序、翻页回显与提示与 Web 端一致', () {
    final pr0 = pickerRows(page: [IEntityOption(id: "p1", label: "张三", hint: "销售一部"), IEntityOption(id: "p2", label: "李四", hint: "销售二部", blockedReason: "没有该部门的查看权限"), IEntityOption(id: "p3", label: "王五", hint: "已离职", inactive: true)], chosen: []);
    expect(pr0.map((r) => r.selected).toList(), [false, false, false]);
    expect(pr0.map((r) => r.disabled).toList(), [false, true, true]);
    expect(pr0.map((r) => r.reason).toList(), ["", "没有该部门的查看权限", "已停用，只能保留原有的"]);
    final pr1 = pickerRows(page: [IEntityOption(id: "p1", label: "张三", hint: "销售一部"), IEntityOption(id: "p2", label: "李四", hint: "销售二部", blockedReason: "没有该部门的查看权限"), IEntityOption(id: "p3", label: "王五", hint: "已离职", inactive: true)], chosen: [IEntityOption(id: "p3", label: "王五", inactive: true)], multiple: true, max: 1);
    expect(pr1.map((r) => r.selected).toList(), [false, false, true]);
    expect(pr1.map((r) => r.disabled).toList(), [true, true, false]);
    expect(pr1.map((r) => r.reason).toList(), ["最多选 1 个", "没有该部门的查看权限", ""]);
    final pr2 = pickerRows(page: [IEntityOption(id: "p1", label: "张三", hint: "销售一部"), IEntityOption(id: "p2", label: "李四", hint: "销售二部", blockedReason: "没有该部门的查看权限"), IEntityOption(id: "p3", label: "王五", hint: "已离职", inactive: true)], chosen: [IEntityOption(id: "p9", label: "赵六")], multiple: true, max: 1);
    expect(pr2.map((r) => r.selected).toList(), [false, false, false]);
    expect(pr2.map((r) => r.disabled).toList(), [true, true, true]);
    expect(pr2.map((r) => r.reason).toList(), ["最多选 1 个", "没有该部门的查看权限", "已停用，只能保留原有的"]);
    final pr3 = pickerRows(page: [IEntityOption(id: "p1", label: "张三", hint: "销售一部"), IEntityOption(id: "p2", label: "李四", hint: "销售二部", blockedReason: "没有该部门的查看权限"), IEntityOption(id: "p3", label: "王五", hint: "已离职", inactive: true)], chosen: [IEntityOption(id: "p1", label: "张三", hint: "销售一部")], multiple: true);
    expect(pr3.map((r) => r.selected).toList(), [true, false, false]);
    expect(pr3.map((r) => r.disabled).toList(), [false, true, true]);
    expect(pr3.map((r) => r.reason).toList(), ["", "没有该部门的查看权限", "已停用，只能保留原有的"]);
    expect(togglePick(page: [IEntityOption(id: "p1", label: "张三", hint: "销售一部"), IEntityOption(id: "p2", label: "李四", hint: "销售二部", blockedReason: "没有该部门的查看权限"), IEntityOption(id: "p3", label: "王五", hint: "已离职", inactive: true)], chosen: [], multiple: true, id: "p1"), [IEntityOption(id: "p1", label: "张三", hint: "销售一部")]);
    expect(togglePick(page: [IEntityOption(id: "p1", label: "张三", hint: "销售一部"), IEntityOption(id: "p2", label: "李四", hint: "销售二部", blockedReason: "没有该部门的查看权限"), IEntityOption(id: "p3", label: "王五", hint: "已离职", inactive: true)], chosen: [], multiple: true, id: "p2"), []);
    expect(togglePick(page: [IEntityOption(id: "p1", label: "张三", hint: "销售一部"), IEntityOption(id: "p2", label: "李四", hint: "销售二部", blockedReason: "没有该部门的查看权限"), IEntityOption(id: "p3", label: "王五", hint: "已离职", inactive: true)], chosen: [], multiple: true, id: "p3"), []);
    expect(togglePick(page: [IEntityOption(id: "p1", label: "张三", hint: "销售一部"), IEntityOption(id: "p2", label: "李四", hint: "销售二部", blockedReason: "没有该部门的查看权限"), IEntityOption(id: "p3", label: "王五", hint: "已离职", inactive: true)], chosen: [IEntityOption(id: "p9", label: "赵六")], id: "p1"), [IEntityOption(id: "p1", label: "张三", hint: "销售一部")]);
    expect(togglePick(page: [IEntityOption(id: "p1", label: "张三", hint: "销售一部"), IEntityOption(id: "p2", label: "李四", hint: "销售二部", blockedReason: "没有该部门的查看权限"), IEntityOption(id: "p3", label: "王五", hint: "已离职", inactive: true)], chosen: [IEntityOption(id: "p1", label: "张三", hint: "销售一部")], multiple: true, id: "p1"), []);
    expect(togglePick(page: [IEntityOption(id: "p1", label: "张三", hint: "销售一部"), IEntityOption(id: "p2", label: "李四", hint: "销售二部", blockedReason: "没有该部门的查看权限"), IEntityOption(id: "p3", label: "王五", hint: "已离职", inactive: true)], chosen: [], multiple: true, id: "zz"), []);
    expect(removePick([IEntityOption(id: "zz", label: "不在本页的人")], "zz"), <IEntityOption>[]);
    expect(offPageChosen([IEntityOption(id: "p1", label: "张三"), IEntityOption(id: "zz", label: "远处的人")], [IEntityOption(id: "p1", label: "张三", hint: "销售一部"), IEntityOption(id: "p2", label: "李四", hint: "销售二部", blockedReason: "没有该部门的查看权限"), IEntityOption(id: "p3", label: "王五", hint: "已离职", inactive: true)]), [IEntityOption(id: "zz", label: "远处的人")]);
    expect(offPageChosen([IEntityOption(id: "a", label: "A"), IEntityOption(id: "b", label: "B")], [IEntityOption(id: "p1", label: "张三", hint: "销售一部"), IEntityOption(id: "p2", label: "李四", hint: "销售二部", blockedReason: "没有该部门的查看权限"), IEntityOption(id: "p3", label: "王五", hint: "已离职", inactive: true)]), [IEntityOption(id: "a", label: "A"), IEntityOption(id: "b", label: "B")]);
    expect(offPageChosen([], [IEntityOption(id: "p1", label: "张三", hint: "销售一部"), IEntityOption(id: "p2", label: "李四", hint: "销售二部", blockedReason: "没有该部门的查看权限"), IEntityOption(id: "p3", label: "王五", hint: "已离职", inactive: true)]), []);
    final ps0 = pickerSummary([IEntityOption(id: "a", label: "A")], max: 3, unit: "人");
    expect(ps0.count, 1);
    expect(ps0.text, "已选 1 / 3 人");
    expect(ps0.full, false);
    expect(ps0.notice, "");
    final ps1 = pickerSummary([IEntityOption(id: "a", label: "A")]);
    expect(ps1.count, 1);
    expect(ps1.text, "已选 1 项");
    expect(ps1.full, false);
    expect(ps1.notice, "");
    final ps2 = pickerSummary([IEntityOption(id: "p3", label: "王五", inactive: true)], unit: "人");
    expect(ps2.count, 1);
    expect(ps2.text, "已选 1 人");
    expect(ps2.full, false);
    expect(ps2.notice, "其中 1 人已停用，保留自历史记录");
    final ps3 = pickerSummary([], max: 0);
    expect(ps3.count, 0);
    expect(ps3.text, "已选 0 / 0 项");
    expect(ps3.full, true);
    expect(ps3.notice, "");
    expect(inactiveChosen([IEntityOption(id: "p3", label: "王五", inactive: true)]).length, 1);
    expect(pickerHint("", false, 0), "输入姓名、工号或部门开始检索");
    expect(pickerHint("张", false, 0), "没有匹配「张」的结果");
    expect(pickerHint("张", true, 0), "检索中…");
    expect(pickerHint("张", false, 3), "");
    expect(pickerHint("  ", false, 0), "输入姓名、工号或部门开始检索");
  });

  test('导入的列映射、错误清单转义与幂等键与 Web 端一致', () {
    expect(guessMapping([ISourceColumn(key: "客户", sample: "明远制造"), ISourceColumn(key: "联系人", sample: "林岚"), ISourceColumn(key: "备注", sample: "急")], [ITargetField(key: "customer", label: "客户", required: true), ITargetField(key: "owner", label: "负责人", required: true, aliases: ["联系人"]), ITargetField(key: "note", label: "备注"), ITargetField(key: "amount", label: "金额", required: true)]), {"customer": "客户", "owner": "联系人", "note": "备注", "amount": null});
    final mi0 = mappingIssues({"customer": "客户", "owner": "联系人", "note": "备注", "amount": null}, [ITargetField(key: "customer", label: "客户", required: true), ITargetField(key: "owner", label: "负责人", required: true, aliases: ["联系人"]), ITargetField(key: "note", label: "备注"), ITargetField(key: "amount", label: "金额", required: true)]);
    expect(mi0.map((x) => x.level).toList(), [IMappingIssueLevel.error]);
    expect(mi0.map((x) => x.message).toList(), ["必填字段「金额」还没映上"]);
    expect(canProceed(mi0), false);
    final mi1 = mappingIssues({"customer": "客户", "owner": "联系人", "note": null, "amount": "备注"}, [ITargetField(key: "customer", label: "客户", required: true), ITargetField(key: "owner", label: "负责人", required: true, aliases: ["联系人"]), ITargetField(key: "note", label: "备注"), ITargetField(key: "amount", label: "金额", required: true)]);
    expect(mi1.map((x) => x.level).toList(), [IMappingIssueLevel.warning]);
    expect(mi1.map((x) => x.message).toList(), ["「备注」没映上，导入后留空"]);
    expect(canProceed(mi1), true);
    final mi2 = mappingIssues({"customer": "客户", "owner": "客户", "note": null, "amount": "备注"}, [ITargetField(key: "customer", label: "客户", required: true), ITargetField(key: "owner", label: "负责人", required: true, aliases: ["联系人"]), ITargetField(key: "note", label: "备注"), ITargetField(key: "amount", label: "金额", required: true)]);
    expect(mi2.map((x) => x.level).toList(), [IMappingIssueLevel.warning, IMappingIssueLevel.error]);
    expect(mi2.map((x) => x.message).toList(), ["「备注」没映上，导入后留空", "来源列「客户」同时映给了 客户、负责人"]);
    expect(canProceed(mi2), false);
    expect(clearMapping({"customer": "客户", "owner": "联系人", "note": "备注", "amount": null}, "customer"), {"customer": null, "owner": "联系人", "note": "备注", "amount": null});
    expect(assignMapping({"customer": "客户", "owner": "联系人", "note": "备注", "amount": null}, "amount", "备注"), {"customer": "客户", "owner": "联系人", "note": null, "amount": "备注"});
    expect(assignMapping({"customer": "客户", "owner": "联系人", "note": "备注", "amount": null}, "amount", null), {"customer": "客户", "owner": "联系人", "note": "备注", "amount": null});
    expect(assignMapping({"customer": "客户", "owner": "联系人", "note": "备注", "amount": null}, "customer", "联系人"), {"customer": "联系人", "owner": null, "note": "备注", "amount": null});
    expect(problemsCsv([IRowProblem(row: 3, column: "客户", message: "客户为空")]), "行号,列,问题\n3,客户,客户为空");
    expect(problemsCsv([IRowProblem(row: 1, column: "客户", message: "「明远,制造」不存在")]), "行号,列,问题\n1,客户,\"「明远,制造」不存在\"");
    expect(problemsCsv([IRowProblem(row: 1, message: "含\"引号\"")]), "行号,列,问题\n1,,\"含\"\"引号\"\"\"");
    expect(problemsCsv([]), "行号,列,问题");
    expect(importKey("sha-1", {"customer": "客户", "owner": "联系人", "note": null}), "sha-1|customer=客户&note=&owner=联系人");
    expect(importKey("sha-1", {"note": null, "owner": "联系人", "customer": "客户"}), "sha-1|customer=客户&note=&owner=联系人");
    expect(importKey("sha-2", {"customer": "客户", "owner": "联系人", "note": null}), "sha-2|customer=客户&note=&owner=联系人");
    expect(importKey("sha-1", {"customer": "客户", "owner": "联系人", "note": "备注"}), "sha-1|customer=客户&note=备注&owner=联系人");
  });

  test('异步任务中心的排序、角标、通知定位与命令权限与 Web 端一致', () {
    final tasks = [IAsyncTask(id: "T3", title: "导出销售订单", state: ITaskState.succeeded, createdAt: 1700000001000, finishedAt: 1700000009000), IAsyncTask(id: "T1", title: "导出销售订单", state: ITaskState.running, createdAt: 1700000005000), IAsyncTask(id: "T4", title: "批量改负责人", state: ITaskState.succeeded, createdAt: 1700000000000, finishedAt: 1700000020000), IAsyncTask(id: "T2", title: "导入客户", state: ITaskState.failed, createdAt: 1700000002000, finishedAt: 1700000003000, error: "第 12 行客户为空"), IAsyncTask(id: "T0", title: "生成对账单", state: ITaskState.queued, createdAt: 1700000004000), IAsyncTask(id: "T5", title: "导出销售订单", state: ITaskState.succeeded, createdAt: 1700000006000, finishedAt: 1700000007000, seen: true)];
    expect(taskOrder(tasks).map((t) => t.id).toList(), ["T0","T1","T2","T4","T3","T5"]);
    expect(taskBadge(tasks).count, 3);
    expect(taskBadge(tasks).failed, 1);
    expect(taskBadge(tasks).unseen, 2);
    expect(taskBadge(tasks).running, 2);
    expect(taskBadge(tasks).text, "任务中心：1 条失败，2 条已完成待查看，2 条进行中");
    expect(taskBadge(const []).text, "任务中心：没有待处理的任务");
    expect(taskBadge(markSeen(tasks, 'T4')).count, 2);
    expect(markSeen(tasks, 'T1')[1].seen, false);
    expect(markAllSeen(tasks).map((t) => t.seen).toList(), [true,false,true,true,false,true]);
    final notice0 = taskNotice(IAsyncTask(id: "N1", title: "导出销售订单", state: ITaskState.succeeded, createdAt: 1700000000000, finishedAt: 1700000001000, target: ITaskTarget(kind: "订单", id: "SO-1", label: "SO-2026-0912"), result: "导出 48000 行"))!;
    expect(notice0.tone, ITaskNoticeTone.success);
    expect(notice0.title, "导出销售订单完成");
    expect(notice0.description, "订单「SO-2026-0912」：导出 48000 行");
    expect(notice0.actionLabel, "查看订单");
    expect(notice0.target?.id, "SO-1");
    final notice1 = taskNotice(IAsyncTask(id: "N2", title: "导出销售订单", state: ITaskState.succeeded, createdAt: 1700000000000, finishedAt: 1700000001000))!;
    expect(notice1.tone, ITaskNoticeTone.success);
    expect(notice1.title, "导出销售订单完成");
    expect(notice1.description, "任务 N2");
    expect(notice1.actionLabel, "查看任务详情");
    expect(notice1.target?.id, null);
    final notice2 = taskNotice(IAsyncTask(id: "N3", title: "导入客户", state: ITaskState.failed, createdAt: 1700000000000, finishedAt: 1700000001000, target: ITaskTarget(kind: "订单", id: "SO-1", label: "SO-2026-0912"), error: "第 12 行客户为空"))!;
    expect(notice2.tone, ITaskNoticeTone.danger);
    expect(notice2.title, "导入客户失败");
    expect(notice2.description, "订单「SO-2026-0912」：第 12 行客户为空");
    expect(notice2.actionLabel, "查看订单");
    expect(notice2.target?.id, "SO-1");
    final notice3 = taskNotice(IAsyncTask(id: "N4", title: "导入客户", state: ITaskState.failed, createdAt: 1700000000000, finishedAt: 1700000001000, error: "   "))!;
    expect(notice3.tone, ITaskNoticeTone.danger);
    expect(notice3.title, "导入客户失败");
    expect(notice3.description, "任务 N4：未知原因");
    expect(notice3.actionLabel, "查看任务详情");
    expect(notice3.target?.id, null);
    final notice4 = taskNotice(IAsyncTask(id: "N5", title: "批量改负责人", state: ITaskState.cancelled, createdAt: 1700000000000, finishedAt: 1700000001000, target: ITaskTarget(kind: "订单", id: "SO-1", label: "SO-2026-0912")))!;
    expect(notice4.tone, ITaskNoticeTone.neutral);
    expect(notice4.title, "批量改负责人已取消");
    expect(notice4.description, "订单「SO-2026-0912」没有发生变化");
    expect(notice4.actionLabel, "查看订单");
    expect(notice4.target?.id, "SO-1");
    expect(taskNotice(IAsyncTask(id: "N6", title: "导出销售订单", state: ITaskState.running, createdAt: 1700000000000)), null);
    expect(taskNotice(IAsyncTask(id: "N7", title: "导出销售订单", state: ITaskState.queued, createdAt: 1700000000000)), null);
    expect(taskIsActive(IAsyncTask(id: "N7", title: "导出销售订单", state: ITaskState.queued, createdAt: 1700000000000)), true);
    expect(dedupeNotices([taskNotice(IAsyncTask(id: "N1", title: "导出销售订单", state: ITaskState.succeeded, createdAt: 1700000000000, finishedAt: 1700000001000, target: ITaskTarget(kind: "订单", id: "SO-1", label: "SO-2026-0912"), result: "导出 48000 行"))!, taskNotice(IAsyncTask(id: "N3", title: "导入客户", state: ITaskState.failed, createdAt: 1700000000000, finishedAt: 1700000001000, target: ITaskTarget(kind: "订单", id: "SO-1", label: "SO-2026-0912"), error: "第 12 行客户为空"))!, taskNotice(IAsyncTask(id: "N1", title: "导出销售订单", state: ITaskState.failed, createdAt: 1700000000000, finishedAt: 1700000001000, target: ITaskTarget(kind: "订单", id: "SO-1", label: "SO-2026-0912"), error: "超时", result: "导出 48000 行"))!]).map((n) => n.taskId).toList(), ["N1","N3"]);
    final submit0 = submitTask([IAsyncTask(id: "S1", title: "导出销售订单", state: ITaskState.running, createdAt: 1700000000000, dedupeKey: "导出:已发货")], IAsyncTask(id: "S2", title: "导出销售订单", state: ITaskState.queued, createdAt: 1700000001000, dedupeKey: "导出:已发货"));
    expect(submit0.merged, true);
    expect(submit0.taskId, "S1");
    expect(submit0.tasks.length, 1);
    expect(submit0.message, "「导出销售订单」已经在跑了，完成后会通知你（任务号 S1）");
    final submit1 = submitTask([IAsyncTask(id: "S1", title: "导出销售订单", state: ITaskState.succeeded, createdAt: 1700000000000, finishedAt: 1700000001000, dedupeKey: "导出:已发货")], IAsyncTask(id: "S2", title: "导出销售订单", state: ITaskState.queued, createdAt: 1700000002000, dedupeKey: "导出:已发货"));
    expect(submit1.merged, false);
    expect(submit1.taskId, "S2");
    expect(submit1.tasks.length, 2);
    expect(submit1.message, "已提交，完成后会通知你（任务号 S2）");
    final submit2 = submitTask([IAsyncTask(id: "S1", title: "导出销售订单", state: ITaskState.running, createdAt: 1700000000000, dedupeKey: "导出:已发货")], IAsyncTask(id: "S3", title: "生成对账单", state: ITaskState.queued, createdAt: 1700000001000));
    expect(submit2.merged, false);
    expect(submit2.taskId, "S3");
    expect(submit2.tasks.length, 2);
    expect(submit2.message, "已提交，完成后会通知你（任务号 S3）");
    expect(taskTrail(IAsyncTask(id: "T-8842", title: "导出销售订单", state: ITaskState.succeeded, createdAt: 1700000000000, finishedAt: 1700000060000, actor: "林岚", target: ITaskTarget(kind: "订单", id: "SO-1", label: "SO-2026-0912")), (ms) => 't${(ms - 1700000000000) ~/ 1000}'), ["任务号：T-8842","提交时间：t0","提交人：林岚","影响对象：订单「SO-2026-0912」","结束时间：t60"]);
    expect(taskTrail(IAsyncTask(id: "T-1", title: "导出销售订单", state: ITaskState.running, createdAt: 1700000000000), (ms) => 't${(ms - 1700000000000) ~/ 1000}'), ["任务号：T-1","提交时间：t0"]);
    final commands = [IGuardedCommand(item: ICommandItem(key: "export", label: "导出订单", keywords: ["daochu"]), permission: "order:export"), IGuardedCommand(item: ICommandItem(key: "new", label: "新建订单")), IGuardedCommand(item: ICommandItem(key: "settings", label: "系统设置"), permission: "admin")];
    final cmd0 = commandEntries(commands, "", (p) => p == 'order:export');
    expect(cmd0.map((e) => e.command.key).toList(), ["export","new","settings"]);
    expect(cmd0.map((e) => e.disabled).toList(), [false,false,true]);
    expect(cmd0.map((e) => e.reason).toList(), ["","","当前角色没有这个权限"]);
    final cmd1 = commandEntries(commands, "设置", (p) => p == 'order:export');
    expect(cmd1.map((e) => e.command.key).toList(), ["settings"]);
    expect(cmd1.map((e) => e.disabled).toList(), [true]);
    expect(cmd1.map((e) => e.reason).toList(), ["当前角色没有这个权限"]);
    final cmd2 = commandEntries(commands, "导出", (p) => p == 'order:export');
    expect(cmd2.map((e) => e.command.key).toList(), ["export"]);
    expect(cmd2.map((e) => e.disabled).toList(), [false]);
    expect(cmd2.map((e) => e.reason).toList(), [""]);
    expect(firstRunnable(commandEntries(commands, '', (p) => p == 'order:export'))?.command.key, "export");
    expect(firstRunnable(commandEntries([commands[2]], '', (p) => false)), null);
  });

  test('树表的兄弟内排序、折叠不丢选择与分组汇总与 Web 端一致', () {
    final rows = const [ITreeRow(key: "g1", children: [ITreeRow(key: "a", fields: const {"name": "alpha", "amount": 100}), ITreeRow(key: "b", fields: const {"name": "bravo", "amount": 200})], fields: const {"name": "east", "amount": 300}), ITreeRow(key: "g2", children: [ITreeRow(key: "c", fields: const {"name": "charlie", "amount": 500}), ITreeRow(key: "d", selectableReason: "没有该客户的查看权限", fields: const {"name": "delta"})], fields: const {"name": "north", "amount": 500})];
    final sorted0 = sortTree(rows, 'amount', ISortOrder.asc);
    expect(sorted0.map((r) => r.key).toList(), ["g1","g2"]);
    expect(sorted0[0].children.map((r) => r.key).toList(), ["a","b"]);
    expect(sorted0[1].children.map((r) => r.key).toList(), ["c","d"]);
    final sorted1 = sortTree(rows, 'amount', ISortOrder.desc);
    expect(sorted1.map((r) => r.key).toList(), ["g2","g1"]);
    expect(sorted1[0].children.map((r) => r.key).toList(), ["c","d"]);
    expect(sorted1[1].children.map((r) => r.key).toList(), ["b","a"]);
    expect(sortTree(rows, null, null).map((r) => r.key).toList(), ["g1","g2"]);
    final flat0 = flattenRows(rows, <String>{});
    expect(flat0.map((r) => r.key).toList(), ["g1","g2"]);
    expect(flat0.map((r) => r.level).toList(), [0,0]);
    expect(flat0.map((r) => r.hasChildren).toList(), [true,true]);
    final flat1 = flattenRows(rows, {"g1"});
    expect(flat1.map((r) => r.key).toList(), ["g1","a","b","g2"]);
    expect(flat1.map((r) => r.level).toList(), [0,1,1,0]);
    expect(flat1.map((r) => r.hasChildren).toList(), [true,false,false,true]);
    final flat2 = flattenRows(rows, {"g1", "g2"});
    expect(flat2.map((r) => r.key).toList(), ["g1","a","b","g2","c","d"]);
    expect(flat2.map((r) => r.level).toList(), [0,1,1,0,1,1]);
    expect(flat2.map((r) => r.hasChildren).toList(), [true,false,false,true,false,false]);
    final seq0 = renderRows(rows, {"g1", "g2"}).map((e) => e.kind == IRenderKind.row ? e.row!.key : '小计:${e.groupKey}').toList();
    expect(seq0, ["g1","a","b","小计:g1","g2","c","d","小计:g2"]);
    final seq1 = renderRows(rows, {"g1"}).map((e) => e.kind == IRenderKind.row ? e.row!.key : '小计:${e.groupKey}').toList();
    expect(seq1, ["g1","a","b","小计:g1","g2"]);
    final seq2 = renderRows(rows, <String>{}).map((e) => e.kind == IRenderKind.row ? e.row!.key : '小计:${e.groupKey}').toList();
    expect(seq2, ["g1","g2"]);
    expect(allRows(rows).length, 6);
    expect(leafRows(rows).map((r) => r.key).toList(), ["a","b","c","d"]);
    expect(expandAll(rows), {"g1", "g2"});
    expect(toggleExpanded({"g1"}, "g2"), {"g1", "g2"});
    expect(toggleExpanded({"g1", "g2"}, "g1"), {"g2"});
    final sum0 = selectionSummary({"a", "b", "g2"}, flattenRows(rows, {"g1", "g2"}));
    expect(sum0.total, 3);
    expect(sum0.visible, 3);
    expect(sum0.hidden, 0);
    expect(sum0.text, "已选 3 项");
    final sum1 = selectionSummary({"a", "b", "g2"}, flattenRows(rows, {"g2"}));
    expect(sum1.total, 3);
    expect(sum1.visible, 1);
    expect(sum1.hidden, 2);
    expect(sum1.text, "已选 3 项，其中 2 项在收起的分组里");
    final sum2 = selectionSummary({"a", "b", "g2"}, flattenRows(rows, <String>{}));
    expect(sum2.total, 3);
    expect(sum2.visible, 1);
    expect(sum2.hidden, 2);
    expect(sum2.text, "已选 3 项，其中 2 项在收起的分组里");
    final sum3 = selectionSummary(<String>{}, flattenRows(rows, <String>{}));
    expect(sum3.total, 0);
    expect(sum3.visible, 0);
    expect(sum3.hidden, 0);
    expect(sum3.text, "未选择任何行");
    expect(toggleSelectAll(rows, <String>{}), {"g1", "a", "b", "g2", "c"});
    expect(toggleSelectAll(rows, toggleSelectAll(rows, <String>{})), <String>{});
    expect(selectAllState(rows, <String>{}), ISelectAllState.none);
    expect(selectAllState(rows, {"a"}), ISelectAllState.some);
    expect(selectAllState(rows, {"g1", "a", "b", "g2", "c"}), ISelectAllState.all);
    expect(selectAllState(rows, {"d"}), ISelectAllState.none);
    expect(toggleRow(rows, <String>{}, "g1"), {"g1"});
    expect(toggleRow(rows, {"g1"}, "g1"), <String>{});
    expect(toggleRow(rows, <String>{}, "d"), <String>{});
    expect(toggleRow(rows, <String>{}, "不存在的 key"), <String>{});
    expect(rowSelectable(rows[1].children[1]), false);
    expect(pruneSelection(rows, {"a", "已经不在了"}), {"a"});
    expect(aggregateField(leafRows(rows), IAggregateSpec(field: "amount", kind: IAggregation.sum)), 800);
    expect(aggregateField(rows[1].children, IAggregateSpec(field: "amount", kind: IAggregation.sum)), 500);
    expect(aggregateField(leafRows(rows), IAggregateSpec(field: "amount", kind: IAggregation.avg)), 266.6666666666667);
    expect(aggregateField(rows[1].children, IAggregateSpec(field: "amount", kind: IAggregation.avg)), 500);
    expect(aggregateField(leafRows(rows), IAggregateSpec(field: "amount", kind: IAggregation.count)), 4);
    expect(aggregateField(rows[1].children, IAggregateSpec(field: "amount", kind: IAggregation.count)), 2);
    expect(aggregateField(leafRows(rows), IAggregateSpec(field: "amount", kind: IAggregation.min)), 100);
    expect(aggregateField(rows[1].children, IAggregateSpec(field: "amount", kind: IAggregation.min)), 500);
    expect(aggregateField(leafRows(rows), IAggregateSpec(field: "amount", kind: IAggregation.max)), 500);
    expect(aggregateField(rows[1].children, IAggregateSpec(field: "amount", kind: IAggregation.max)), 500);
    expect(groupSummary(rows[0], [IAggregateSpec(field: "amount", kind: IAggregation.sum)]).count, 2);
    expect(groupSummary(rows[0], [IAggregateSpec(field: "amount", kind: IAggregation.sum)]).values['amount'], 300);
    expect(groupSummary(rows[1], [IAggregateSpec(field: "amount", kind: IAggregation.sum)]).count, 2);
    expect(groupSummary(rows[1], [IAggregateSpec(field: "amount", kind: IAggregation.sum)]).values['amount'], 500);
    expect(grandTotal(rows, [IAggregateSpec(field: "amount", kind: IAggregation.sum)]).values['amount'], 800);
    expect(grandTotal(rows, const []).count, 4);
    expect(summaryLabel(groupSummary(rows[0], const [])), "小计（2 条明细）");
    expect(summaryLabel(grandTotal(rows, const []), '合计'), "合计（4 条明细）");
  });

  test('导出任务的状态、进度与时间排版与 Web 端一致', () {
    final ex0 = describeExport(status: IExportStatus.queued, now: 1700000000000, queuePosition: 3);
    expect(ex0.status, IExportStatus.queued);
    expect(ex0.tone, IExportTone.neutral);
    expect(ex0.label, "排队中");
    expect(ex0.detail, "前面还有 3 个任务");
    expect(ex0.percent, null);
    expect(ex0.busy, true);
    expect(ex0.action, IExportAction.cancel);
    final ex1 = describeExport(status: IExportStatus.queued, now: 1700000000000, queuePosition: 0);
    expect(ex1.status, IExportStatus.queued);
    expect(ex1.tone, IExportTone.neutral);
    expect(ex1.label, "排队中");
    expect(ex1.detail, "马上就轮到了");
    expect(ex1.percent, null);
    expect(ex1.busy, true);
    expect(ex1.action, IExportAction.cancel);
    final ex2 = describeExport(status: IExportStatus.queued, now: 1700000000000);
    expect(ex2.status, IExportStatus.queued);
    expect(ex2.tone, IExportTone.neutral);
    expect(ex2.label, "排队中");
    expect(ex2.detail, "已提交，等待服务端安排");
    expect(ex2.percent, null);
    expect(ex2.busy, true);
    expect(ex2.action, IExportAction.cancel);
    final ex3 = describeExport(status: IExportStatus.running, now: 1700000000000, processed: 12000);
    expect(ex3.status, IExportStatus.running);
    expect(ex3.tone, IExportTone.progress);
    expect(ex3.label, "生成中");
    expect(ex3.detail, "已导出 12000 行");
    expect(ex3.percent, null);
    expect(ex3.busy, true);
    expect(ex3.action, IExportAction.cancel);
    final ex4 = describeExport(status: IExportStatus.running, now: 1700000000000, processed: 3000, total: 12000);
    expect(ex4.status, IExportStatus.running);
    expect(ex4.tone, IExportTone.progress);
    expect(ex4.label, "生成中");
    expect(ex4.detail, "已导出 3000 / 12000 行");
    expect(ex4.percent, 25);
    expect(ex4.busy, true);
    expect(ex4.action, IExportAction.cancel);
    final ex5 = describeExport(status: IExportStatus.running, now: 1700000000000, processed: 0, total: 0);
    expect(ex5.status, IExportStatus.running);
    expect(ex5.tone, IExportTone.progress);
    expect(ex5.label, "生成中");
    expect(ex5.detail, "已导出 0 / 0 行");
    expect(ex5.percent, null);
    expect(ex5.busy, true);
    expect(ex5.action, IExportAction.cancel);
    final ex6 = describeExport(status: IExportStatus.running, now: 1700000000000);
    expect(ex6.status, IExportStatus.running);
    expect(ex6.tone, IExportTone.progress);
    expect(ex6.label, "生成中");
    expect(ex6.detail, "正在生成");
    expect(ex6.percent, null);
    expect(ex6.busy, true);
    expect(ex6.action, IExportAction.cancel);
    final ex7 = describeExport(status: IExportStatus.ready, now: 1700000000000, expiresAt: 1700000720000);
    expect(ex7.status, IExportStatus.ready);
    expect(ex7.tone, IExportTone.success);
    expect(ex7.label, "可下载");
    expect(ex7.detail, "文件已生成，还可下载 12 分钟");
    expect(ex7.percent, 100);
    expect(ex7.busy, false);
    expect(ex7.action, IExportAction.download);
    final ex8 = describeExport(status: IExportStatus.ready, now: 1700000000000, expiresAt: 1699999999999);
    expect(ex8.status, IExportStatus.expired);
    expect(ex8.tone, IExportTone.neutral);
    expect(ex8.label, "已过期");
    expect(ex8.detail, "生成好的文件已经过期，重新生成一份即可");
    expect(ex8.percent, null);
    expect(ex8.busy, false);
    expect(ex8.action, IExportAction.regenerate);
    final ex9 = describeExport(status: IExportStatus.ready, now: 1700000000000);
    expect(ex9.status, IExportStatus.ready);
    expect(ex9.tone, IExportTone.success);
    expect(ex9.label, "可下载");
    expect(ex9.detail, "文件已生成");
    expect(ex9.percent, 100);
    expect(ex9.busy, false);
    expect(ex9.action, IExportAction.download);
    final ex10 = describeExport(status: IExportStatus.expired, now: 1700000000000);
    expect(ex10.status, IExportStatus.expired);
    expect(ex10.tone, IExportTone.neutral);
    expect(ex10.label, "已过期");
    expect(ex10.detail, "生成好的文件已经过期，重新生成一份即可");
    expect(ex10.percent, null);
    expect(ex10.busy, false);
    expect(ex10.action, IExportAction.regenerate);
    final ex11 = describeExport(status: IExportStatus.failed, now: 1700000000000, error: "超时");
    expect(ex11.status, IExportStatus.failed);
    expect(ex11.tone, IExportTone.danger);
    expect(ex11.label, "生成失败");
    expect(ex11.detail, "超时");
    expect(ex11.percent, null);
    expect(ex11.busy, false);
    expect(ex11.action, IExportAction.retry);
    final ex12 = describeExport(status: IExportStatus.failed, now: 1700000000000);
    expect(ex12.status, IExportStatus.failed);
    expect(ex12.tone, IExportTone.danger);
    expect(ex12.label, "生成失败");
    expect(ex12.detail, "未知原因");
    expect(ex12.percent, null);
    expect(ex12.busy, false);
    expect(ex12.action, IExportAction.retry);
    final ex13 = describeExport(status: IExportStatus.cancelled, now: 1700000000000);
    expect(ex13.status, IExportStatus.cancelled);
    expect(ex13.tone, IExportTone.neutral);
    expect(ex13.label, "已取消");
    expect(ex13.detail, "没有生成任何文件");
    expect(ex13.percent, null);
    expect(ex13.busy, false);
    expect(ex13.action, IExportAction.regenerate);
    expect(remainingLife(1700000001500, 1700000000000), 2);
    expect(remainingLife(1699999991000, 1700000000000), 0);
    expect(remainingLife(1700000000000, 1700000000000), 0);
    expect(remainingLife(1700000720000, 1700000000000), 720);
    expect(humanDuration(0), "已过期");
    expect(humanDuration(45), "45 秒");
    expect(humanDuration(60), "1 分钟");
    expect(humanDuration(600), "10 分钟");
    expect(humanDuration(3600), "1 小时");
    expect(humanDuration(3660), "1 小时 1 分钟");
    expect(humanDuration(7325), "2 小时 2 分钟");
    expect(humanDuration(-5), "已过期");
    expect(formatStamp(IStampParts(year: 2026, month: 9, day: 5, hour: 4, minute: 7), " "), "2026-09-05 04:07");
    expect(formatStamp(IStampParts(year: 2026, month: 9, day: 5, hour: 4, minute: 7), "-"), "2026-09-05-04-07");
    expect(formatStamp(IStampParts(year: 2026, month: 12, day: 31, hour: 23, minute: 59), " "), "2026-12-31 23:59");
  });

  test('悬浮操作按钮的展开位移与延迟与 Web 端一致', () {
    expect(floatActionOffset(0), 56);
    expect(floatActionOffset(1), 108);
    expect(floatActionOffset(2), 160);
    expect(floatActionOffset(3), 212);
    expect(floatActionShift(0), 60);
    expect(floatActionShift(1), 112);
    expect(floatActionShift(2), 164);
    expect(floatActionShift(3), 216);
    expect(floatActionDelay(0, 1), 0);
    expect(floatActionDelay(0, 3), 0);
    expect(floatActionDelay(1, 3), 50);
    expect(floatActionDelay(2, 3), 100);
    expect(floatActionDelay(3, 4), 113);
  });

  test('文案字典的两份译文与局部覆盖规则与 Web 端一致', () {
    expect(zhCN.name, 'zh-CN');
    expect(zhCN.empty, '暂无数据');
    expect(zhCN.emptyContent, '暂无内容');
    expect(zhCN.loading, '加载中…');
    expect(zhCN.loadMore, '加载更多');
    expect(zhCN.loadFailed, '加载失败，点击重试');
    expect(zhCN.noMore, '没有更多了');
    expect(zhCN.placeholder, '请选择');
    expect(zhCN.datePlaceholder, '请选择日期');
    expect(zhCN.selectAll, '全选');
    expect(zhCN.search, '搜索');
    expect(zhCN.searchNode, '搜索节点');
    expect(zhCN.noMatch, '无匹配选项');
    expect(zhCN.clear, '清除');
    expect(zhCN.confirm, '确定');
    expect(zhCN.cancel, '取消');
    expect(zhCN.acknowledge, '知道了');
    expect(zhCN.close, '关闭');
    expect(zhCN.retry, '重试');
    expect(zhCN.copy, '复制');
    expect(zhCN.copied, '已复制');
    expect(zhCN.expand, '展开');
    expect(zhCN.collapse, '收起');
    expect(zhCN.required, '此项必填');
    expect(zhCN.invalidFormat, '格式不正确');
    expect(zhCN.chartTableShow, '查看数据表');
    expect(zhCN.chartTableHide, '收起数据表');
    expect(zhCN.chartCategory, '类别');
    expect(zhCN.chartValue, '数值');
    expect(zhCN.chartPercent, '占比');
    expect(zhCN.chartOther, '其他');
    expect(zhCN.regenerate, '重新生成');
    expect(zhCN.thinking, '推理过程');
    expect(zhCN.toolInput, '入参');
    expect(zhCN.toolError, '错误');
    expect(zhCN.toolResult, '结果');
    expect(zhCN.next, '下一题');
    expect(zhCN.skip, '跳过');
    expect(zhCN.otherOption, '其他');
    expect(zhCN.pullToRefresh, '下拉刷新');
    expect(zhCN.releaseToRefresh, '松手即可刷新');
    expect(zhCN.refreshing, '正在刷新');
    expect(zhCN.create, '新建');
    expect(zhCN.dayUnit, '天');
    expect(zhCN.hourUnit, '时');
    expect(zhCN.minuteUnit, '分');
    expect(zhCN.secondUnit, '秒');
    expect(enUS.name, 'en-US');
    expect(enUS.empty, 'No data');
    expect(enUS.emptyContent, 'Nothing here yet');
    expect(enUS.loading, 'Loading…');
    expect(enUS.loadMore, 'Load more');
    expect(enUS.loadFailed, 'Failed to load, tap to retry');
    expect(enUS.noMore, 'No more items');
    expect(enUS.placeholder, 'Select');
    expect(enUS.datePlaceholder, 'Pick a date');
    expect(enUS.selectAll, 'Select all');
    expect(enUS.search, 'Search');
    expect(enUS.searchNode, 'Search nodes');
    expect(enUS.noMatch, 'No matches');
    expect(enUS.clear, 'Clear');
    expect(enUS.confirm, 'OK');
    expect(enUS.cancel, 'Cancel');
    expect(enUS.acknowledge, 'Got it');
    expect(enUS.close, 'Close');
    expect(enUS.retry, 'Retry');
    expect(enUS.copy, 'Copy');
    expect(enUS.copied, 'Copied');
    expect(enUS.expand, 'Expand');
    expect(enUS.collapse, 'Collapse');
    expect(enUS.required, 'This field is required');
    expect(enUS.invalidFormat, 'Invalid format');
    expect(enUS.chartTableShow, 'Show data table');
    expect(enUS.chartTableHide, 'Hide data table');
    expect(enUS.chartCategory, 'Category');
    expect(enUS.chartValue, 'Value');
    expect(enUS.chartPercent, 'Share');
    expect(enUS.chartOther, 'Other');
    expect(enUS.regenerate, 'Regenerate');
    expect(enUS.thinking, 'Reasoning');
    expect(enUS.toolInput, 'Input');
    expect(enUS.toolError, 'Error');
    expect(enUS.toolResult, 'Result');
    expect(enUS.next, 'Next');
    expect(enUS.skip, 'Skip');
    expect(enUS.otherOption, 'Other');
    expect(enUS.pullToRefresh, 'Pull to refresh');
    expect(enUS.releaseToRefresh, 'Release to refresh');
    expect(enUS.refreshing, 'Refreshing');
    expect(enUS.create, 'New');
    expect(enUS.dayUnit, 'd');
    expect(enUS.hourUnit, 'h');
    expect(enUS.minuteUnit, 'm');
    expect(enUS.secondUnit, 's');
    expect(zhCN.totalText(12), '共 12 条');
    expect(enUS.totalText(1), '1 item');
    expect(enUS.totalText(3), '3 items');
    expect(zhCN.rangeText(11, 20, 95), '第 11-20 条 / 共 95 条');
    expect(enUS.rangeText(11, 20, 95), '11-20 of 95');
    expect(zhCN.emptyPresets[IEmptyReason.empty]!.title, '暂无数据');
    expect(enUS.emptyPresets[IEmptyReason.empty]!.title, 'No data');
    expect(zhCN.emptyPresets[IEmptyReason.search]!.title, '没有匹配结果');
    expect(enUS.emptyPresets[IEmptyReason.search]!.title, 'No matches');
    expect(zhCN.emptyPresets[IEmptyReason.error]!.title, '加载失败');
    expect(enUS.emptyPresets[IEmptyReason.error]!.title, 'Failed to load');
    expect(zhCN.emptyPresets[IEmptyReason.permission]!.title, '无访问权限');
    expect(enUS.emptyPresets[IEmptyReason.permission]!.title, 'No access');
    expect(zhCN.copyWith(empty: '这个筛选条件下没有工单').empty, '这个筛选条件下没有工单');
    expect(zhCN.copyWith(empty: '这个筛选条件下没有工单').confirm, '确定');
    expect(enUS.copyWith(confirm: 'Go').confirm, 'Go');
    expect(enUS.copyWith(confirm: 'Go').cancel, 'Cancel');
    expect(zhCN.copyWith(empty: '这个筛选条件下没有工单').emptyPresets[IEmptyReason.empty]!.title, '这个筛选条件下没有工单');
    expect(zhCN.copyWith(empty: '这个筛选条件下没有工单').emptyPresets[IEmptyReason.search]!.title, '没有匹配结果');
  });

  test('文本截断的判定方向与亚像素容差与 Web 端一致', () {
    expect(isTextOverflowing(const OverflowMetrics(scrollWidth: 200.0, clientWidth: 100.0, scrollHeight: 20.0, clientHeight: 20.0), false), true);
    expect(isTextOverflowing(const OverflowMetrics(scrollWidth: 200.0, clientWidth: 100.0, scrollHeight: 20.0, clientHeight: 20.0), true), false);
    expect(isTextOverflowing(const OverflowMetrics(scrollWidth: 100.0, clientWidth: 100.0, scrollHeight: 60.0, clientHeight: 40.0), true), true);
    expect(isTextOverflowing(const OverflowMetrics(scrollWidth: 100.0, clientWidth: 100.0, scrollHeight: 60.0, clientHeight: 40.0), false), false);
    expect(isTextOverflowing(const OverflowMetrics(scrollWidth: 100.5, clientWidth: 100.0, scrollHeight: 20.0, clientHeight: 20.0), false), false);
    expect(isTextOverflowing(const OverflowMetrics(scrollWidth: 101.5, clientWidth: 100.0, scrollHeight: 20.0, clientHeight: 20.0), false), true);
    expect(isTextOverflowing(const OverflowMetrics(scrollWidth: 100.0, clientWidth: 100.0, scrollHeight: 40.5, clientHeight: 40.0), true), false);
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
    expect(
        resetPaneSize(0.50, 1000.0,
            firstMin: 120.0, secondMin: 160.0, gutter: 4.0),
        closeTo(498, 1e-9));
    expect(
        resetPaneSize(0.50, 300.0,
            firstMin: 120.0, secondMin: 160.0, gutter: 4.0),
        closeTo(136, 1e-9));
    expect(
        resetPaneSize(0.20, 1000.0,
            firstMin: 120.0, secondMin: 160.0, gutter: 4.0),
        closeTo(199.20000000000002, 1e-9));
    expect(
        resetPaneSize(0.90, 1000.0,
            firstMin: 120.0, secondMin: 160.0, gutter: 4.0),
        closeTo(836, 1e-9));
    expect(isSplitterResetKey('Enter'), true);
    expect(isSplitterResetKey(' '), true);
    expect(isSplitterResetKey('Spacebar'), true);
    expect(isSplitterResetKey('ArrowLeft'), false);
    expect(isSplitterResetKey('a'), false);
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
