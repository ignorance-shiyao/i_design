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

/* ---------- 箱线图 ---------- */

class IBoxStats {
  const IBoxStats({
    required this.min,
    required this.q1,
    required this.median,
    required this.q3,
    required this.max,
    required this.iqr,
    required this.lower,
    required this.upper,
    required this.outliers,
  });

  final double min;
  final double q1;
  final double median;
  final double q3;
  final double max;
  final double iqr;

  /// 下须端点：1.5×IQR 内的最小实测值
  final double lower;

  /// 上须端点：1.5×IQR 内的最大实测值
  final double upper;
  final List<double> outliers;
}

/// 分位数，线性插值（与 numpy 默认、Excel 的 QUARTILE.INC 一致）。
/// 分位数有七八种定义，各端各挑一种就会得到不同的箱子——
/// 同一批数据在 Web 上中位线在这里、Flutter 上在那里。定义写死，不留选项。
double quantile(List<double> sorted, double p) {
  if (sorted.isEmpty) return double.nan;
  if (sorted.length == 1) return sorted[0];
  final pos = (sorted.length - 1) * p.clamp(0.0, 1.0);
  final low = pos.floor();
  final high = pos.ceil();
  if (low == high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (pos - low);
}

/// 箱线图的五数概括与离群点。
/// 须延伸到 1.5×IQR 内的**实测值**，而不是画到围栏位置——
/// 后者会让须端出现一个数据里根本不存在的数。
IBoxStats boxStats(List<double> values) {
  final sorted = values.where((v) => v.isFinite).toList()..sort();
  if (sorted.isEmpty) {
    return const IBoxStats(
      min: double.nan, q1: double.nan, median: double.nan, q3: double.nan,
      max: double.nan, iqr: double.nan, lower: double.nan, upper: double.nan,
      outliers: [],
    );
  }
  final q1 = quantile(sorted, 0.25);
  final median = quantile(sorted, 0.5);
  final q3 = quantile(sorted, 0.75);
  final iqr = q3 - q1;
  final lowFence = q1 - 1.5 * iqr;
  final highFence = q3 + 1.5 * iqr;
  final inside = sorted.where((v) => v >= lowFence && v <= highFence).toList();
  return IBoxStats(
    min: sorted.first,
    q1: q1,
    median: median,
    q3: q3,
    max: sorted.last,
    iqr: iqr,
    lower: inside.isNotEmpty ? inside.first : sorted.first,
    upper: inside.isNotEmpty ? inside.last : sorted.last,
    outliers:
        sorted.where((v) => v < lowFence || v > highFence).toList(),
  );
}

/* ---------- 瀑布图 ---------- */

class IWaterfallItem {
  const IWaterfallItem({required this.label, this.value = 0, this.total = false});
  final String label;

  /// 增减量；total 项忽略此值
  final double value;

  /// 小计/总计：从 0 画到累计值，而不是接着上一根
  final bool total;
}

enum IWaterfallKind { increase, decrease, total }

class IWaterfallBar {
  const IWaterfallBar({
    required this.label,
    required this.start,
    required this.end,
    required this.delta,
    required this.kind,
  });

  final String label;
  final double start;
  final double end;
  final double delta;
  final IWaterfallKind kind;
}

/// 把增减序列摊成柱子的起止值。
/// 涨跌用极性配色（发散色两端）而不是状态色的绿/红：
/// 收入增加是好事、成本增加是坏事，「增加」本身并没有好坏。
List<IWaterfallBar> waterfallBars(List<IWaterfallItem> items) {
  var cumulative = 0.0;
  final out = <IWaterfallBar>[];
  for (final item in items) {
    if (item.total) {
      // 总计柱从 0 起画：它表示的是绝对量，不是又一次增减
      out.add(IWaterfallBar(
        label: item.label,
        start: 0,
        end: cumulative,
        delta: cumulative,
        kind: IWaterfallKind.total,
      ));
      continue;
    }
    final start = cumulative;
    cumulative += item.value;
    out.add(IWaterfallBar(
      label: item.label,
      start: start,
      end: cumulative,
      delta: item.value,
      kind: item.value >= 0 ? IWaterfallKind.increase : IWaterfallKind.decrease,
    ));
  }
  return out;
}

/// 瀑布图的值域：要把所有柱子的起止都包进去，否则中间某根会被截断
List<double> waterfallDomain(List<IWaterfallBar> bars) {
  if (bars.isEmpty) return [0, 1];
  final all = <double>[];
  for (final b in bars) {
    all..add(b.start)..add(b.end);
  }
  var min = 0.0;
  var max = 0.0;
  for (final v in all) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return min == max ? [min, min + 1] : [min, max];
}

/* ---------- 区间缩放（dataZoom） ---------- */

class IZoomWindow {
  const IZoomWindow({required this.start, required this.end});

  /// 起止下标，闭区间
  final int start;
  final int end;
}

/// 把窗口夹回合法范围。
///
/// 三件事必须一起处理，分开写就会漏：
///   1. 起止越界要夹回 [0, count-1]
///   2. 起 > 止 时交换——拖动左手柄越过右手柄是很自然的操作，
///      不交换的话窗口会变成负宽度，图表直接空掉
///   3. 宽度不得小于 minSpan：缩到零宽等于把图表擦掉，用户无法再拖回来
IZoomWindow clampWindow(IZoomWindow win, int count, [int minSpan = 2]) {
  if (count <= 0) return const IZoomWindow(start: 0, end: 0);
  final max = count - 1;
  final span = (minSpan > count ? count : minSpan) - 1 < 1
      ? 1
      : (minSpan > count ? count : minSpan) - 1;

  var start = win.start.clamp(0, max);
  var end = win.end.clamp(0, max);
  if (start > end) {
    final t = start;
    start = end;
    end = t;
  }

  if (end - start < span) {
    // 优先向右补足；右边不够了再向左补，保证贴边时仍能满足最小宽度
    end = start + span;
    if (end > max) {
      end = max;
      start = end - span < 0 ? 0 : end - span;
    }
  }
  return IZoomWindow(start: start, end: end);
}

/// 由 0–1 的比例得到窗口，用于把拖拽像素换成下标
IZoomWindow windowFromRatio(double from, double to, int count,
    [int minSpan = 2]) {
  final max = count - 1 < 0 ? 0 : count - 1;
  return clampWindow(
    IZoomWindow(start: (from * max).round(), end: (to * max).round()),
    count,
    minSpan,
  );
}

/// 整体平移窗口，宽度保持不变。
/// 到边界时只停住、不压缩——压缩会让用户拖到头之后继续拖时窗口悄悄变窄。
IZoomWindow panWindow(IZoomWindow win, double delta, int count) {
  final width = win.end - win.start;
  final max = count - 1 < 0 ? 0 : count - 1;
  var start = (win.start + delta).round();
  if (start < 0) start = 0;
  if (start + width > max) start = max - width;
  if (start < 0) start = 0;
  return IZoomWindow(start: start, end: start + width);
}

/// 按窗口切数据
List<T> sliceByWindow<T>(List<T> items, IZoomWindow win) {
  if (items.isEmpty) return items;
  final end = win.end + 1 > items.length ? items.length : win.end + 1;
  final start = win.start < 0 ? 0 : win.start;
  return start >= end ? <T>[] : items.sublist(start, end);
}

/// 窗口占全量的比例，用于渲染缩略条上的选框位置
({double from, double to}) windowRatio(IZoomWindow win, int count) {
  final max = count - 1 < 1 ? 1 : count - 1;
  return (from: win.start / max, to: win.end / max);
}

/// 轴标签的抽稀步长。返回 1 表示全部都画得下。
int labelStep(int count, double width, [double minGap = 48]) {
  if (count <= 1 || width <= 0) return 1;
  final per = width / count;
  if (per >= minGap) return 1;
  return (minGap / per).ceil();
}

/// 该下标的标签要不要画。末尾那个总是画：读者要知道序列到哪儿为止。
bool showLabelAt(int index, int count, int step) {
  if (step <= 1) return true;
  if (index == count - 1) return true;
  if (count - 1 - index < step / 2) return false;
  return index % step == 0;
}

/* ---------- 桑基图 ---------- */

class ISankeyLink {
  const ISankeyLink({required this.from, required this.to, required this.value});
  final String from;
  final String to;
  final double value;
}

class ISankeyNode {
  const ISankeyNode({
    required this.key,
    required this.label,
    required this.depth,
    required this.value,
    required this.x,
    required this.y,
    required this.width,
    required this.height,
  });
  final String key;
  final String label;

  /// 所在层级，由拓扑决定而不是由调用方指定
  final int depth;
  final double value;
  final double x;
  final double y;
  final double width;
  final double height;
}

/// 缎带的一端：一段竖直区间加上它所在的横坐标
class ISankeyRibbonAnchor {
  const ISankeyRibbonAnchor({required this.x, required this.top, required this.bottom});
  final double x;
  final double top;
  final double bottom;
}

class ISankeyRibbon {
  const ISankeyRibbon({
    required this.from,
    required this.to,
    required this.value,
    required this.source,
    required this.target,
    required this.controlX,
  });
  final String from;
  final String to;
  final double value;
  final ISankeyRibbonAnchor source;
  final ISankeyRibbonAnchor target;

  /// 控制点的横坐标，两端共用——与 Web 端 SVG 的 C 指令是同一条曲线
  final double controlX;
}

class ISankeyLayout {
  const ISankeyLayout({required this.nodes, required this.ribbons});
  final List<ISankeyNode> nodes;
  final List<ISankeyRibbon> ribbons;
}

/// 节点分层：从没有入边的节点开始，逐层向后推。
///
/// 用最长路径而不是最短：一个节点只要还有上游没排完，就不能定层，
/// 否则它会被排到上游前面，流向看起来是倒着的。
/// 存在环时以上限兜底截断——环在流量图里本就无法分层，
/// 与其抛错不如把回边忽略掉，剩下的部分仍然能画。
Map<String, int> _sankeyDepths(List<ISankeyLink> links) {
  final outgoing = <String, List<String>>{};
  final indegree = <String, int>{};
  final keys = <String>{};

  for (final link in links) {
    keys.add(link.from);
    keys.add(link.to);
    outgoing.putIfAbsent(link.from, () => <String>[]).add(link.to);
    indegree[link.to] = (indegree[link.to] ?? 0) + 1;
    indegree.putIfAbsent(link.from, () => 0);
  }

  final depth = <String, int>{};
  for (final key in keys) {
    depth[key] = 0;
  }

  final queue = keys.where((k) => (indegree[k] ?? 0) == 0).toList();
  final visited = queue.toSet();
  var guard = keys.length * keys.length + 16;

  while (queue.isNotEmpty && guard-- > 0) {
    final current = queue.removeAt(0);
    for (final next in outgoing[current] ?? const <String>[]) {
      final candidate = (depth[current] ?? 0) + 1;
      if (candidate > (depth[next] ?? 0)) depth[next] = candidate;
      // 已访问过的也重新入队，让更长的路径能把它推到更后面
      visited.add(next);
      queue.add(next);
    }
  }
  return depth;
}

/// 桑基图布局。
///
/// 节点高度按流量占比分配，而不是等分：等分会让一条极小的支流
/// 和主干看起来一样粗，那正是桑基图要避免的误读。
ISankeyLayout sankeyLayout(
  List<ISankeyLink> links,
  double width,
  double height, {
  double nodeWidth = 12,
  double nodePadding = 12,
  Map<String, String> labels = const <String, String>{},
}) {
  if (links.isEmpty) {
    return const ISankeyLayout(nodes: <ISankeyNode>[], ribbons: <ISankeyRibbon>[]);
  }

  final depth = _sankeyDepths(links);
  var maxDepth = 0;
  for (final d in depth.values) {
    if (d > maxDepth) maxDepth = d;
  }

  // 每个节点的流量取「进出两侧的较大值」：只算一侧会让末端节点厚度为零
  final inflow = <String, double>{};
  final outflow = <String, double>{};
  for (final link in links) {
    outflow[link.from] = (outflow[link.from] ?? 0) + link.value;
    inflow[link.to] = (inflow[link.to] ?? 0) + link.value;
  }
  double valueOf(String key) => math.max(inflow[key] ?? 0, outflow[key] ?? 0);

  final byDepth = <int, List<String>>{};
  depth.forEach((key, d) => byDepth.putIfAbsent(d, () => <String>[]).add(key));

  // 层内按流量从大到小排，主干在上，读者的视线不必来回跳
  for (final list in byDepth.values) {
    list.sort((a, b) => valueOf(b).compareTo(valueOf(a)));
  }

  final columnGap = maxDepth > 0 ? (width - nodeWidth) / maxDepth : 0.0;
  final nodes = <ISankeyNode>[];
  final box = <String, ISankeyNode>{};

  byDepth.forEach((d, list) {
    var total = 0.0;
    for (final k in list) {
      total += valueOf(k);
    }
    if (total == 0) total = 1;
    final available = height - nodePadding * math.max(0, list.length - 1);
    var y = 0.0;
    for (final key in list) {
      final h = math.max(2.0, (valueOf(key) / total) * available);
      final node = ISankeyNode(
        key: key,
        label: labels[key] ?? key,
        depth: d,
        value: valueOf(key),
        x: d * columnGap,
        y: y,
        width: nodeWidth,
        height: h,
      );
      nodes.add(node);
      box[key] = node;
      y += h + nodePadding;
    }
  });

  // 缎带：两端各自按流量占比在节点上取一段，控制点放在两端的水平中点，
  // 曲线才会平顺地进出节点，而不是斜插进去。
  final usedFrom = <String, double>{};
  final usedTo = <String, double>{};
  final ribbons = <ISankeyRibbon>[];

  for (final link in links) {
    final a = box[link.from];
    final b = box[link.to];
    if (a == null || b == null) continue;

    final aShare = (link.value / math.max(1.0, outflow[link.from] ?? 1)) * a.height;
    final bShare = (link.value / math.max(1.0, inflow[link.to] ?? 1)) * b.height;
    final ay = a.y + (usedFrom[link.from] ?? 0);
    final by = b.y + (usedTo[link.to] ?? 0);
    usedFrom[link.from] = (usedFrom[link.from] ?? 0) + aShare;
    usedTo[link.to] = (usedTo[link.to] ?? 0) + bShare;

    final x0 = a.x + a.width;
    final x1 = b.x;
    ribbons.add(ISankeyRibbon(
      from: link.from,
      to: link.to,
      value: link.value,
      source: ISankeyRibbonAnchor(x: x0, top: ay, bottom: ay + aShare),
      target: ISankeyRibbonAnchor(x: x1, top: by, bottom: by + bShare),
      controlX: (x0 + x1) / 2,
    ));
  }

  return ISankeyLayout(nodes: nodes, ribbons: ribbons);
}

/* ---------- 矩形树图 ---------- */

class ITreemapItem {
  const ITreemapItem({required this.label, required this.value});
  final String label;
  final double value;
}

class ITreemapTile {
  const ITreemapTile({
    required this.label,
    required this.value,
    required this.percent,
    required this.x,
    required this.y,
    required this.width,
    required this.height,
  });
  final String label;
  final double value;
  final double percent;
  final double x;
  final double y;
  final double width;
  final double height;
}

class _Squarified {
  _Squarified(this.label, this.value, this.area);
  final String label;
  final double value;
  final double area;
}

/// 一行的最差长宽比：越接近 1 越好
double _worst(List<_Squarified> items, double side) {
  if (items.isEmpty) return double.infinity;
  var sum = 0.0;
  var maxArea = double.negativeInfinity;
  var minArea = double.infinity;
  for (final i in items) {
    sum += i.area;
    if (i.area > maxArea) maxArea = i.area;
    if (i.area < minArea) minArea = i.area;
  }
  final side2 = side * side;
  final sum2 = sum * sum;
  return math.max((side2 * maxArea) / sum2, sum2 / (side2 * minArea));
}

/// 矩形树图布局，squarify 算法。
///
/// 不用简单的「切条」布局：那会产出又长又细的矩形，
/// 而人眼比较细长条的面积极不准——那正是矩形树图要表达的东西。
List<ITreemapTile> treemapLayout(List<ITreemapItem> items, double width, double height) {
  final valid = items.where((i) => i.value > 0).toList();
  if (valid.isEmpty || width <= 0 || height <= 0) return <ITreemapTile>[];

  var total = 0.0;
  for (final i in valid) {
    total += i.value;
  }

  // 面积按比例缩放到画布，之后所有计算都在面积域里做
  final sorted = [...valid]..sort((a, b) => b.value.compareTo(a.value));
  final scaled = sorted
      .map((i) => _Squarified(i.label, i.value, (i.value / total) * width * height))
      .toList();

  final tiles = <ITreemapTile>[];
  var x = 0.0;
  var y = 0.0;
  var w = width;
  var h = height;
  var row = <_Squarified>[];
  var index = 0;

  void flush() {
    if (row.isEmpty) return;
    var sum = 0.0;
    for (final i in row) {
      sum += i.area;
    }
    final horizontal = w >= h;
    // 沿短边排一行，这样每块才不至于被拉成长条
    final thickness = horizontal ? sum / h : sum / w;
    var offset = 0.0;
    for (final item in row) {
      final length = item.area / thickness;
      tiles.add(ITreemapTile(
        label: item.label,
        value: item.value,
        percent: item.value / total,
        x: horizontal ? x : x + offset,
        y: horizontal ? y + offset : y,
        width: horizontal ? thickness : length,
        height: horizontal ? length : thickness,
      ));
      offset += length;
    }
    if (horizontal) {
      x += thickness;
      w -= thickness;
    } else {
      y += thickness;
      h -= thickness;
    }
    row = <_Squarified>[];
  }

  while (index < scaled.length) {
    final side = math.min(w, h);
    final next = scaled[index];
    if (row.isEmpty || _worst([...row, next], side) <= _worst(row, side)) {
      row.add(next);
      index += 1;
    } else {
      flush();
    }
  }
  flush();

  return tiles;
}
