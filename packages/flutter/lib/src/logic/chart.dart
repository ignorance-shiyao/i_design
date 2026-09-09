/// 图表计算的 Dart 移植（对应 packages/common/src/logic/chart.ts）。
///
/// 刻度吸附、比例尺与扇区角度必须与 Web 端逐值一致，
/// 否则同一份数据在两个端上坐标轴刻度会不一样。
library;

import 'dart:math' as math;
import 'dart:ui' show Offset;

/// 生成「好看的」刻度值：步长吸附到 1/2/5 的整数倍，
/// 坐标轴上出现的永远是人能心算的数。
List<double> niceTicks(double min, double max, [int count = 5]) {
  if (!min.isFinite || !max.isFinite) return [0];
  var lo = min;
  var hi = max;
  if (lo == hi) {
    final pad = lo.abs() == 0 ? 1.0 : lo.abs();
    lo -= pad;
    hi += pad;
  }
  final rawStep = (hi - lo) / math.max(1, count);
  final magnitude = math.pow(10, (math.log(rawStep) / math.ln10).floor()).toDouble();
  final normalized = rawStep / magnitude;
  final step = (normalized <= 1
          ? 1
          : normalized <= 2
              ? 2
              : normalized <= 5
                  ? 5
                  : 10) *
      magnitude;

  final start = (lo / step).floor() * step;
  final end = (hi / step).ceil() * step;
  final ticks = <double>[];
  // 用乘法而不是累加：累加会让 0.1 这种步长积累浮点误差
  for (var i = 0; start + i * step <= end + step / 1000; i++) {
    ticks.add(double.parse((start + i * step).toStringAsFixed(10)));
  }
  return ticks;
}

/// 数值域，通常从 0 起——柱状图不从 0 开始会放大差异
({double min, double max}) domainOf(
  List<List<double>> series, {
  bool fromZero = true,
  bool stacked = false,
}) {
  final values = <double>[];
  if (stacked && series.isNotEmpty) {
    final length = series.map((s) => s.length).reduce(math.max);
    for (var i = 0; i < length; i++) {
      values.add(series.fold<double>(0, (sum, s) => sum + (i < s.length ? s[i] : 0)));
    }
  } else {
    for (final s in series) {
      values.addAll(s.where((v) => v.isFinite));
    }
  }
  if (values.isEmpty) return (min: 0, max: 1);
  final maxV = values.reduce(math.max);
  final minV = fromZero ? math.min(0, values.reduce(math.min)) : values.reduce(math.min);
  return (min: minV, max: maxV == minV ? minV + 1 : maxV);
}

/// 数值 → 像素纵坐标；y 轴向下，因此比例是反的
double scaleY(double value, double min, double max, double height) =>
    height - ((value - min) / (max - min)) * height;

double scaleX(int index, int count, double width) =>
    count <= 1 ? width / 2 : (index / (count - 1)) * width;

/// 千分位与紧凑单位：坐标轴上 1200000 应显示为 120万 而不是一串零
String formatTick(double value) {
  final abs = value.abs();
  if (abs >= 1e8) return '${_trim(value / 1e8)}亿';
  if (abs >= 1e4) return '${_trim(value / 1e4)}万';
  if (value == value.roundToDouble()) return _group(value.round());
  return _trim(value);
}

String _trim(double v) {
  final fixed = v.toStringAsFixed(2);
  return fixed.endsWith('.00')
      ? fixed.substring(0, fixed.length - 3)
      : (fixed.endsWith('0') ? fixed.substring(0, fixed.length - 1) : fixed);
}

/// 漏斗每层的梯形顶点，以及相对上一层的转化率
List<({double topWidth, double bottomWidth, double y, double height, double step})> funnelShapes(
  List<double> values,
  double width,
  double height, {
  double gap = 4,
}) {
  if (values.isEmpty) return [];
  final maxV = values.reduce(math.max);
  final rowH = (height - gap * (values.length - 1)) / values.length;
  return [
    for (var i = 0; i < values.length; i++)
      (
        // 宽度按数值比例，不做等差递减——等差是画出来的顺，不是数据里的顺
        topWidth: values[i] / (maxV == 0 ? 1 : maxV) * width,
        bottomWidth: (i + 1 < values.length ? values[i + 1] : values[i]) /
            (maxV == 0 ? 1 : maxV) *
            width,
        y: i * (rowH + gap),
        height: rowH,
        step: i == 0 ? 1 : (values[i - 1] == 0 ? 0 : values[i] / values[i - 1]),
      )
  ];
}

/// 仪表盘的起止角：开口朝下的 270°。
/// 整圆会让满值与零值落在同一个位置，无法分辨。
const double kGaugeStart = math.pi * 0.75;
const double kGaugeSweep = math.pi * 1.5;

/// 雷达图顶点：从 12 点方向开始顺时针分布
List<Offset> radarPoints(List<double> values, double max, double radius) => [
      for (var i = 0; i < values.length; i++)
        () {
          final angle = -math.pi / 2 + (i / values.length) * math.pi * 2;
          final r = (values[i].clamp(0, max) / (max == 0 ? 1 : max)) * radius;
          return Offset(radius + r * math.cos(angle), radius + r * math.sin(angle));
        }()
    ];

/// 热力图色阶档位：单色阶而不是彩虹——彩虹会让读者以为颜色代表类别
int heatLevel(double value, double min, double max, [int steps = 5]) {
  if (max == min) return 0;
  final ratio = (value - min) / (max - min);
  return (ratio * (steps - 1)).round().clamp(0, steps - 1);
}

String _group(int value) {
  final text = value.abs().toString();
  final buffer = StringBuffer();
  for (var i = 0; i < text.length; i++) {
    if (i > 0 && (text.length - i) % 3 == 0) buffer.write(',');
    buffer.write(text[i]);
  }
  return '${value < 0 ? '-' : ''}$buffer';
}

/* ---------- 散点 ---------- */

class ScatterPoint {
  const ScatterPoint({required this.x, required this.y, this.size, this.label});

  final double x;
  final double y;

  /// 气泡大小的原始值；不传则所有点同样大
  final double? size;

  /// 悬停时显示的标识，例如项目名
  final String? label;
}

class ScatterSeriesData {
  const ScatterSeriesData({required this.name, required this.data});

  final String name;
  final List<ScatterPoint> data;
}

/// 散点图的系列上限是 3。
///
/// 折线和柱状里只有相邻系列会挨在一起，散点则是任意两点都可能贴着，
/// 因此配色要按「所有两两组合」校验；本体系的分类色在这个更严的口径下，
/// 亮色与暗色两种模式都只有前三槽同时通过。
const int kScatterMaxSeries = 3;

/// 一组点在某一维度上的值域
({double min, double max}) extentOf(List<double> values) {
  final finite = values.where((v) => v.isFinite).toList();
  if (finite.isEmpty) return (min: 0, max: 1);
  final lo = finite.reduce(math.min);
  final hi = finite.reduce(math.max);
  return (min: lo, max: hi == lo ? lo + 1 : hi);
}

/// 气泡半径按面积映射，而不是按半径——
/// 直接把数值当半径会让差异被平方放大：数值翻一倍，看上去是四倍大。
double bubbleRadius(double value, double min, double max,
    [double rMin = 4, double rMax = 18]) {
  if (max == min) return rMin;
  final ratio = (value.clamp(min, max) - min) / (max - min);
  final aMin = math.pi * rMin * rMin;
  final aMax = math.pi * rMax * rMax;
  return math.sqrt((aMin + ratio * (aMax - aMin)) / math.pi);
}

/// 最小二乘拟合的趋势线；点少于 3 个不拟合——
/// 两点连线必然 R²=1，那不是相关性，只是把两个点连起来。
({double slope, double intercept, double r2})? trendLine(List<ScatterPoint> points) {
  final pts = points.where((p) => p.x.isFinite && p.y.isFinite).toList();
  final n = pts.length;
  if (n < 3) return null;
  final sx = pts.fold<double>(0, (a, p) => a + p.x);
  final sy = pts.fold<double>(0, (a, p) => a + p.y);
  final sxx = pts.fold<double>(0, (a, p) => a + p.x * p.x);
  final sxy = pts.fold<double>(0, (a, p) => a + p.x * p.y);
  final denom = n * sxx - sx * sx;
  // 所有点 x 相同：竖直方向没有斜率可言
  if (denom == 0) return null;
  final slope = (n * sxy - sx * sy) / denom;
  final intercept = (sy - slope * sx) / n;
  final meanY = sy / n;
  final ssTot = pts.fold<double>(0, (a, p) => a + math.pow(p.y - meanY, 2));
  final ssRes =
      pts.fold<double>(0, (a, p) => a + math.pow(p.y - (slope * p.x + intercept), 2));
  return (slope: slope, intercept: intercept, r2: ssTot == 0 ? 1 : 1 - ssRes / ssTot);
}
