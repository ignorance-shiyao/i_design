/// 数值输入与滑块共用的取值规则（对应 packages/common/src/logic/number.ts）。
///
/// 与分页、排序一样：Flutter 无法复用 TypeScript，按同一套算法移植，
/// 由 scripts/check-parity.mjs 生成的黄金测试逐个用例比对，防止分叉。
library;

/// 夹到闭区间内
double clampNumber(double value, double min, double max) {
  if (value.isNaN) return min;
  return value < min ? min : (value > max ? max : value);
}

/// 按精度取整。
/// 浮点步进会产生 0.1 + 0.2 = 0.30000000000000004 这类值，不取整就会原样显示。
double roundTo(double value, [int precision = 0]) =>
    double.parse(value.toStringAsFixed(precision));

/// 在区间内步进一次，同时完成夹取与取整
double stepValue(double current, double step, double min, double max, [int precision = 0]) =>
    roundTo(clampNumber(current + step, min, max), precision);

/// 值 → 0~1 的比例，用于把数值映射成滑块位置
double ratioOf(double value, double min, double max) {
  if (max == min) return 0;
  return clampNumber((value - min) / (max - min), 0, 1);
}

/// 比例 → 值，并对齐到最近的步长。
///
/// 拖动得到的是连续比例，但取值必须落在步长上，
/// 否则松手后显示的数字会带一长串小数。
double valueFromRatio(
  double ratio,
  double min,
  double max,
  double step, [
  int precision = 0,
]) {
  final raw = min + clampNumber(ratio, 0, 1) * (max - min);
  if (step <= 0) return roundTo(clampNumber(raw, min, max), precision);
  final snapped = min + ((raw - min) / step).round() * step;
  return roundTo(clampNumber(snapped, min, max), precision);
}
