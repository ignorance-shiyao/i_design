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
}
