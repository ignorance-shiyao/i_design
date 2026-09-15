/// 分布与统计（astra.md 的 D04）。
///
/// 与 packages/common/src/logic/stats.ts 同源，由生成的 logic_parity_test 对齐。
///
/// 每个会改变结论的选择都由调用方显式给出或由公开规则算出并原样报回去：
/// 分箱宽度换一个，双峰就并成单峰；带宽调小一点，噪声就变成「第三个峰」；
/// 误差棒不写清是标准差还是置信区间，读者只能猜。
import 'dart:math' as math;

/// 样本量低于这个数时，分布的形状基本是噪声
const int kMinSample = 20;

class IDistributionIssue {
  const IDistributionIssue({required this.kind, required this.message});

  /// too-few / all-equal / has-outliers / empty
  final String kind;
  final String message;
}

class IHistogramBin {
  const IHistogramBin({
    required this.from,
    required this.to,
    required this.count,
    required this.ratio,
  });

  final double from;
  final double to;
  final int count;
  final double ratio;
}

class IHistogram {
  const IHistogram({
    required this.bins,
    required this.width,
    required this.rule,
    required this.count,
    required this.issues,
  });

  final List<IHistogramBin> bins;
  final double width;

  /// 实际用的规则：freedman-diaconis / sturges / fixed
  final String rule;
  final int count;
  final List<IDistributionIssue> issues;
}

List<double> _finite(List<double> values) => values.where((v) => v.isFinite).toList();

double _quantile(List<double> sorted, double p) {
  final pos = (sorted.length - 1) * p;
  final low = pos.floor();
  final high = pos.ceil();
  if (low == high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (pos - low);
}

/// 直方图分箱。默认 Freedman–Diaconis；IQR 为 0 时退回 Sturges——
/// 否则零宽度会算出无穷多个箱
IHistogram histogram(
  List<double> values, {
  String rule = 'freedman-diaconis',
  double? width,
}) {
  final data = _finite(values)..sort();
  final issues = <IDistributionIssue>[];
  if (data.isEmpty) {
    return IHistogram(
      bins: const [],
      width: 0,
      rule: rule,
      count: 0,
      issues: const [IDistributionIssue(kind: 'empty', message: '没有有效样本')],
    );
  }
  final min = data.first;
  final max = data.last;
  if (min == max) {
    issues.add(IDistributionIssue(
      kind: 'all-equal',
      message: '全部 ${data.length} 个样本取值相同，分布图看不出任何东西',
    ));
    return IHistogram(
      bins: [IHistogramBin(from: min, to: min, count: data.length, ratio: 1)],
      width: 0,
      rule: rule,
      count: data.length,
      issues: issues,
    );
  }
  if (data.length < kMinSample) {
    issues.add(IDistributionIssue(
      kind: 'too-few',
      message: '只有 ${data.length} 个样本（少于 $kMinSample），这里的形状主要是噪声',
    ));
  }

  final iqr = _quantile(data, 0.75) - _quantile(data, 0.25);
  var used = rule;
  double binWidth;
  if (rule == 'fixed') {
    if (width == null || width <= 0) {
      throw ArgumentError('rule 为 fixed 时必须给出正的 width');
    }
    binWidth = width;
  } else if (rule == 'freedman-diaconis' && iqr > 0) {
    binWidth = (2 * iqr) / math.pow(data.length, 1 / 3);
  } else {
    used = 'sturges';
    binWidth = (max - min) / ((math.log(data.length) / math.ln2).ceil() + 1);
  }
  if (!binWidth.isFinite || binWidth <= 0) binWidth = max - min;

  final binCount = math.max(1, ((max - min) / binWidth).ceil());
  final counts = List<int>.filled(binCount, 0);
  for (final v in data) {
    // 最后一箱闭区间，否则最大值会落到区间外，直方图正好丢掉最大的那个点
    final index = math.min(binCount - 1, ((v - min) / binWidth).floor());
    counts[index] += 1;
  }

  return IHistogram(
    bins: [
      for (var i = 0; i < binCount; i += 1)
        IHistogramBin(
          from: min + i * binWidth,
          to: min + (i + 1) * binWidth,
          count: counts[i],
          ratio: counts[i] / data.length,
        )
    ],
    width: binWidth,
    rule: used,
    count: data.length,
    issues: issues,
  );
}

class IDensityPoint {
  const IDensityPoint({required this.x, required this.y});

  final double x;
  final double y;
}

class IDensity {
  const IDensity({required this.points, required this.bandwidth, required this.issues});

  final List<IDensityPoint> points;

  /// 实际用的带宽。密度图里唯一重要的旋钮，所以算出来要报回去
  final double bandwidth;
  final List<IDistributionIssue> issues;
}

/// 高斯核密度估计，带宽按 Silverman 经验法则
IDensity kde(List<double> values, {double? bandwidth, int steps = 64}) {
  final data = _finite(values)..sort();
  final issues = <IDistributionIssue>[];
  if (data.length < 2) {
    return const IDensity(
      points: [],
      bandwidth: 0,
      issues: [IDistributionIssue(kind: 'empty', message: '样本不足两个，算不出密度')],
    );
  }
  if (data.length < kMinSample) {
    issues.add(IDistributionIssue(
      kind: 'too-few',
      message: '只有 ${data.length} 个样本（少于 $kMinSample），这条密度曲线主要是噪声',
    ));
  }
  final mean = data.reduce((a, b) => a + b) / data.length;
  final sd = math.sqrt(
    data.map((v) => math.pow(v - mean, 2).toDouble()).reduce((a, b) => a + b) / (data.length - 1),
  );
  final iqr = _quantile(data, 0.75) - _quantile(data, 0.25);
  final spread = math.min(
    sd == 0 ? double.infinity : sd,
    iqr > 0 ? iqr / 1.34 : double.infinity,
  );
  var h = bandwidth ??
      0.9 * (spread.isFinite ? spread : sd) * math.pow(data.length, -1 / 5).toDouble();
  if (!h.isFinite || h <= 0) {
    // 全部取值相同：没有可估的分布，直接说出来而不是画一条假的曲线
    issues.add(const IDistributionIssue(kind: 'all-equal', message: '所有样本取值相同，密度无从估计'));
    return IDensity(points: const [], bandwidth: 0, issues: issues);
  }

  final min = data.first - 3 * h;
  final max = data.last + 3 * h;
  final points = <IDensityPoint>[];
  for (var i = 0; i < steps; i += 1) {
    final x = min + ((max - min) * i) / (steps - 1);
    var sum = 0.0;
    for (final v in data) {
      final u = (x - v) / h;
      sum += math.exp(-0.5 * u * u);
    }
    points.add(IDensityPoint(x: x, y: sum / (data.length * h * math.sqrt(2 * math.pi))));
  }
  return IDensity(points: points, bandwidth: h, issues: issues);
}

class IErrorBar {
  const IErrorBar({
    required this.mean,
    required this.delta,
    required this.low,
    required this.high,
    required this.n,
    required this.kind,
    required this.caption,
  });

  final double mean;
  final double delta;
  final double low;
  final double high;
  final int n;

  /// sd / sem / ci95
  final String kind;

  /// 图注里该写的一句话——误差棒不写清含义等于没画
  final String caption;
}

/// 误差棒。同一批数据，三者画出来长度差好几倍，说的是完全不同的事，
/// 所以 kind 必填，并一起返回该印在图注里的话
IErrorBar errorBar(List<double> values, String kind) {
  final data = _finite(values);
  final n = data.length;
  if (n == 0) {
    return IErrorBar(
      mean: double.nan,
      delta: double.nan,
      low: double.nan,
      high: double.nan,
      n: 0,
      kind: kind,
      caption: '没有有效样本',
    );
  }
  final mean = data.reduce((a, b) => a + b) / n;
  final sd = n > 1
      ? math.sqrt(
          data.map((v) => math.pow(v - mean, 2).toDouble()).reduce((a, b) => a + b) / (n - 1))
      : 0.0;
  final sem = n > 1 ? sd / math.sqrt(n) : 0.0;
  final delta = kind == 'sd' ? sd : (kind == 'sem' ? sem : 1.96 * sem);
  final caption = kind == 'sd'
      ? '误差棒为 ±1 标准差（n=$n），说的是数据有多散'
      : kind == 'sem'
          ? '误差棒为 ±1 标准误（n=$n），说的是均值估得有多准'
          : '误差棒为 95% 置信区间（正态近似，n=$n）';
  return IErrorBar(
    mean: mean,
    delta: delta,
    low: mean - delta,
    high: mean + delta,
    n: n,
    kind: kind,
    caption: caption,
  );
}

class IViolinPoint {
  const IViolinPoint({required this.value, required this.density});

  final double value;
  final double density;
}

class IViolinShape {
  const IViolinShape({
    required this.points,
    required this.peak,
    required this.bandwidth,
    required this.issues,
  });

  final List<IViolinPoint> points;

  /// 最大密度。宽度必须按它统一归一化，否则两把小提琴的「胖」不可比——
  /// 那正是小提琴图最常被误读的地方
  final double peak;
  final double bandwidth;
  final List<IDistributionIssue> issues;
}

IViolinShape violinShape(List<double> values, {double? bandwidth, int steps = 64}) {
  final density = kde(values, bandwidth: bandwidth, steps: steps);
  return IViolinShape(
    points: [for (final p in density.points) IViolinPoint(value: p.x, density: p.y)],
    peak: density.points.fold<double>(0, (m, p) => math.max(m, p.y)),
    bandwidth: density.bandwidth,
    issues: density.issues,
  );
}

/// 皮尔逊相关系数。任一列是常量时分母为 0，返回 null——
/// 那不是「不相关」，是算不出
double? pearson(List<double> xs, List<double> ys) {
  final pairs = <List<double>>[];
  for (var i = 0; i < xs.length && i < ys.length; i += 1) {
    if (xs[i].isFinite && ys[i].isFinite) pairs.add([xs[i], ys[i]]);
  }
  if (pairs.length < 3) return null;
  final n = pairs.length;
  final mx = pairs.map((p) => p[0]).reduce((a, b) => a + b) / n;
  final my = pairs.map((p) => p[1]).reduce((a, b) => a + b) / n;
  var num = 0.0;
  var dx = 0.0;
  var dy = 0.0;
  for (final p in pairs) {
    num += (p[0] - mx) * (p[1] - my);
    dx += math.pow(p[0] - mx, 2).toDouble();
    dy += math.pow(p[1] - my, 2).toDouble();
  }
  if (dx == 0 || dy == 0) return null;
  return num / math.sqrt(dx * dy);
}
