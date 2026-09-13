/// 洞察卡的纯逻辑（对应 packages/common/src/logic/insight.ts）。
///
/// 分页在边界上停住而不绕回第一条、擦洗按最近的点取值——这两条在这一端
/// 写歪了不会有任何报错，只会让同一份数据在手机上翻得动、在网页上翻不动。
library;

/// 一条洞察。series 是支撑这句话的数据，不是装饰
class InsightItemData {
  const InsightItemData({
    required this.id,
    required this.title,
    required this.summary,
    required this.series,
    this.labels = const <String>[],
    this.unit = '',
  });

  final String id;
  final String title;

  /// 结论本身。一句话说完，读者不该为了看懂它去点开别的东西
  final String summary;
  final List<double> series;

  /// 横轴刻度。缺省时擦洗只报数值，不编一个「第几个」出来
  final List<String> labels;

  /// 读数的单位，例如 %、次。跟在数字后面，不做本地化
  final String unit;
}

/// 翻页后的下标。到头就停住，不绕回第一条——绕回去会让人以为还有新的
int insightPage(int count, int current, int delta) {
  if (count <= 0) return 0;
  final next = current + delta;
  if (next < 0) return 0;
  if (next > count - 1) return count - 1;
  return next;
}

/// 端点标记圆的半径，以及为它留的边。
///
/// 首尾两点画在图的正边上，标记圆就有一半落在画布外被裁掉——
/// 看着像最后一个点没画完。所以曲线整体往里缩一个半径再多一点。
const double insightDotR = 4;
const double insightInset = insightDotR + 1;

class InsightPlot {
  const InsightPlot({required this.inner, required this.inset});

  final double inner;
  final double inset;
}

/// 曲线实际可用的宽度与左边距。四端都按它缩，首尾的标记圆才都是整圆
InsightPlot insightPlot(double width) {
  final inset = insightInset < width / 4 ? insightInset : width / 4;
  final inner = width - inset * 2;
  return InsightPlot(inner: inner < 0 ? 0 : inner, inset: inset);
}

/// 擦洗位置对应第几个点。按最近的点判定，不按落在第几段——
/// 后者在两点之间移动时读数会慢半格，看着像卡了一拍
int scrubIndex(double x, double width, int count) {
  if (count <= 1 || width <= 0) return 0;
  var ratio = x / width;
  if (ratio < 0) ratio = 0;
  if (ratio > 1) ratio = 1;
  return (ratio * (count - 1)).round();
}

/// 第 index 个点的横坐标。与 scrubIndex 互为逆运算，读数标记才落在点上
double scrubX(int index, double width, int count) {
  if (count <= 1) return 0;
  return (index / (count - 1)) * width;
}

/// 擦洗读数
class InsightReadout {
  const InsightReadout({required this.label, required this.value});

  final String label;
  final String value;
}

InsightReadout scrubReadout(InsightItemData item, int index) {
  if (index < 0 || index >= item.series.length) {
    return const InsightReadout(label: '', value: '');
  }
  return InsightReadout(
    label: index < item.labels.length ? item.labels[index] : '',
    value: '${formatInsightValue(item.series[index])}${item.unit}',
  );
}

/// 读数的数字部分：整数不补小数位，小数最多一位——趋势线上的精度再多也读不出来
String formatInsightValue(double value) {
  if (value == value.roundToDouble()) return value.toInt().toString();
  return value.toStringAsFixed(1);
}

enum InsightDirection { up, down, flat }

/// 一条洞察的涨跌
class InsightTrend {
  const InsightTrend({required this.delta, required this.percent, required this.direction});

  final double delta;

  /// 变化百分比。首个点为 0 时没有百分比可言，给 null 而不是 Infinity
  final double? percent;
  final InsightDirection direction;
}

/// 首尾对比得出的涨跌。
///
/// 只比首尾，不比最后两个点：洞察说的是「这段时间怎么样」，
/// 拿最后两个点作答会让一条整体上升、末尾抖了一下的曲线显示成下跌。
InsightTrend insightTrend(List<double> series) {
  if (series.length < 2) {
    return const InsightTrend(delta: 0, percent: null, direction: InsightDirection.flat);
  }
  final first = series.first;
  final last = series.last;
  final delta = last - first;
  return InsightTrend(
    delta: delta,
    percent: first == 0 ? null : (delta / first.abs()) * 100,
    direction: delta > 0
        ? InsightDirection.up
        : delta < 0
            ? InsightDirection.down
            : InsightDirection.flat,
  );
}

/// 涨跌的文字说明。不能只靠箭头方向与红绿：色觉障碍用户与灰度打印读不出来
String trendLabel(InsightTrend trend) {
  if (trend.direction == InsightDirection.flat) return '持平';
  final word = trend.direction == InsightDirection.up ? '上升' : '下降';
  if (trend.percent == null) return '$word ${formatInsightValue(trend.delta.abs())}';
  return '$word ${formatInsightValue(trend.percent!.abs())}%';
}

/// 涨跌对应的图标名。持平用 minus 而不是留空：留空会让读者以为数据没算出来
String trendIcon(InsightTrend trend) {
  if (trend.direction == InsightDirection.up) return 'chevron-up';
  if (trend.direction == InsightDirection.down) return 'chevron-down';
  return 'minus';
}
