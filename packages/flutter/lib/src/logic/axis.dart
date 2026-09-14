/// 轴系：横向条形与双值轴（astra.md 的 D13）。
///
/// 与 packages/common/src/logic/axis.ts 同源，逐条由生成的 logic_parity_test
/// 对齐——轴系抄错不会报错，只会让同一份数据在两个端上刻度密度不一样。
import 'chart.dart';

enum IAxisOrientation { vertical, horizontal }

class IAxisTick {
  const IAxisTick({required this.value, required this.label, required this.offset});

  final double value;
  final String label;

  /// 沿值轴方向的像素位置：纵向是 y（自上而下），横向是 x（自左向右）
  final double offset;
}

class IAxisLayout {
  const IAxisLayout({
    required this.orientation,
    required this.min,
    required this.max,
    required this.ticks,
    required this.baseline,
    required this.length,
  });

  final IAxisOrientation orientation;
  final double min;
  final double max;
  final List<IAxisTick> ticks;

  /// 零值（或最接近零的下界）所在的像素位置，基线画在这里
  final double baseline;
  final double length;
}

/// 值轴布局。纵向时值向上增长，所以像素位置要翻过来；横向与像素同向。
IAxisLayout valueAxis(
  double min,
  double max,
  double length, {
  IAxisOrientation orientation = IAxisOrientation.vertical,
  int tickCount = 5,
  String Function(double value)? format,
}) {
  final ticks = niceTicks(min, max, tickCount);
  final lo = ticks.first;
  final hi = ticks.last;
  final span = hi - lo == 0 ? 1.0 : hi - lo;
  double at(double value) => orientation == IAxisOrientation.vertical
      ? length - ((value - lo) / span) * length
      : ((value - lo) / span) * length;

  return IAxisLayout(
    orientation: orientation,
    min: lo,
    max: hi,
    length: length,
    ticks: [
      for (final value in ticks)
        IAxisTick(
          value: value,
          label: format == null ? value.toString() : format(value),
          offset: at(value),
        )
    ],
    baseline: at(lo > 0 ? lo : (hi < 0 ? hi : 0)),
  );
}

class ICategoryBand {
  const ICategoryBand({
    required this.index,
    required this.start,
    required this.size,
    required this.center,
  });

  final int index;
  final double start;
  final double size;
  final double center;
}

/// 类目轴：把类目轴的总长切成等宽的带，横纵一致
List<ICategoryBand> categoryBands(int count, double length) {
  final size = length / (count < 1 ? 1 : count);
  return [
    for (var index = 0; index < count; index += 1)
      ICategoryBand(
        index: index,
        start: index * size,
        size: size,
        center: index * size + size / 2,
      )
  ];
}

class IBarRect {
  const IBarRect({
    required this.x,
    required this.y,
    required this.width,
    required this.height,
    required this.negative,
  });

  final double x;
  final double y;
  final double width;
  final double height;

  /// 负值条从基线反向长出去，圆角也要换到另一头
  final bool negative;
}

/// 一根柱（或一根横条）的矩形：横纵只是把「沿值轴」与「沿类目轴」对调
IBarRect barRect({
  required ICategoryBand band,
  required double thickness,
  double offsetInBand = 0,
  required double from,
  required double to,
  required IAxisOrientation orientation,
}) {
  final along = band.start + offsetInBand;
  final lo = from < to ? from : to;
  final size = (to - from).abs();
  return orientation == IAxisOrientation.vertical
      ? IBarRect(x: along, y: lo, width: thickness, height: size, negative: to > from)
      : IBarRect(x: lo, y: along, width: size, height: thickness, negative: to < from);
}

/// 横条的排序：横条几乎总是排名，乱序读者会自己去找最长的那根。
/// 保留原顺序是显式选择，不是默认。
List<int> rankOrder(List<double> values, [String direction = 'desc']) {
  final index = [for (var i = 0; i < values.length; i += 1) i];
  if (direction == 'none') return index;
  index.sort((a, b) => direction == 'desc'
      ? values[b].compareTo(values[a])
      : values[a].compareTo(values[b]));
  return index;
}

class IDualAxisSide {
  const IDualAxisSide({required this.series, required this.unit, this.label});

  /// 归属这一侧的系列下标
  final List<int> series;

  /// 单位。双轴的前提是两侧单位不同，所以它是必填的
  final String unit;
  final String? label;
}

class IDualAxisResult {
  const IDualAxisResult({
    required this.left,
    required this.right,
    required this.issues,
    required this.zeroAligned,
  });

  final IAxisLayout left;
  final IAxisLayout right;

  /// 为什么这张图不该是双轴，或者读它时要注意什么。空表示没问题
  final List<String> issues;
  final bool zeroAligned;
}

/// 双值轴。两条线谁在上谁在下全由两侧刻度决定，换一组刻度就能把结论反过来，
/// 所以这里不只出布局，还把不该用双轴的情形直接说出来。
IDualAxisResult dualAxis(
  List<IChartSeries> series,
  IDualAxisSide left,
  IDualAxisSide right,
  double length, {
  IAxisOrientation orientation = IAxisOrientation.vertical,
  int tickCount = 5,
  String Function(double value)? format,
}) {
  final issues = <String>[];

  List<double> valuesOf(IDualAxisSide side) => [
        for (final i in side.series)
          if (i >= 0 && i < series.length)
            ...series[i].data.where((v) => v.isFinite)
      ];

  if (left.unit.trim().isEmpty || right.unit.trim().isEmpty) {
    issues.add('双轴的两侧都必须写明单位，否则读者无从判断另一条线在说什么量');
  } else if (left.unit.trim() == right.unit.trim()) {
    issues.add(
      '两侧单位都是「${left.unit}」，这是一个轴的事——分成两个轴之后等高不再等值，读者会按位置比大小',
    );
  }

  final unassigned = [
    for (var i = 0; i < series.length; i += 1)
      if (!left.series.contains(i) && !right.series.contains(i)) i
  ];
  if (unassigned.isNotEmpty) {
    issues.add('有系列没有指定归属哪个轴：${unassigned.map((i) => series[i].name).join('、')}');
  }

  ({double min, double max}) span(List<double> values) {
    if (values.isEmpty) return (min: 0, max: 1);
    var min = 0.0;
    var max = values.first;
    for (final v in values) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    return (min: min, max: max == min ? min + 1 : max);
  }

  final l = span(valuesOf(left));
  final r = span(valuesOf(right));
  final leftAxis = valueAxis(l.min, l.max, length,
      orientation: orientation, tickCount: tickCount, format: format);
  final rightAxis = valueAxis(r.min, r.max, length,
      orientation: orientation, tickCount: tickCount, format: format);

  final zeroAligned = (leftAxis.baseline - rightAxis.baseline).abs() < 0.5;
  if (!zeroAligned) {
    issues.add('两侧的零位不在同一条线上，正负看起来会错位——把其中一侧的范围调成对称可以对齐');
  }

  return IDualAxisResult(
    left: leftAxis,
    right: rightAxis,
    issues: issues,
    zeroAligned: zeroAligned,
  );
}
