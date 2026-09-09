// 由 packages/flutter/scripts/build-golden-test.mjs 生成，请勿手改。
//
// 期望值全部由 packages/common 的 TypeScript 实现算出，因此这份测试校验的是
// 「Dart 移植与公共层是否一致」，而不是「Dart 移植与自己是否一致」。
import 'package:flutter_test/flutter_test.dart';
import 'package:i_design/src/logic/pagination.dart';
import 'package:i_design/src/logic/number.dart';
import 'package:i_design/src/logic/select.dart';
import 'package:i_design/src/logic/table.dart';
import 'package:i_design/src/logic/chart.dart';

void _expectPages(List<IPageItem> actual, List<IPageItem> expected, String label) {
  expect(actual.length, expected.length, reason: '$label 长度不一致');
  for (var i = 0; i < expected.length; i++) {
    expect(actual[i].page, expected[i].page, reason: '$label 第 $i 项页码不一致');
    expect(actual[i].gap, expected[i].gap, reason: '$label 第 $i 项省略位不一致');
  }
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
}
