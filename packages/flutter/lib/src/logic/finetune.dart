/// 属性检查器的纯逻辑（对应 packages/common/src/logic/finetune.ts）。
///
/// 夹范围、吸步长、改动判定、显示文字——同一个属性在这一端拖出 12、
/// 在 Web 上敲出 12.7 的话，两端保存下来的就不是同一份配置，
/// 而这不会让任何一边报错。
library;

enum FineTuneKind { number, select, switchKind, color, text }

class FineTuneOption {
  const FineTuneOption({required this.value, required this.label});

  final String value;
  final String label;
}

/// 一个可调属性
class FineTuneFieldData {
  const FineTuneFieldData({
    required this.key,
    required this.label,
    required this.kind,
    this.min,
    this.max,
    this.step,
    this.unit = '',
    this.options = const <FineTuneOption>[],
    this.hint = '',
    this.disabled = false,
  });

  final String key;
  final String label;
  final FineTuneKind kind;
  final double? min;
  final double? max;
  final double? step;

  /// 显示时跟在数字后面的单位，不做本地化
  final String unit;
  final List<FineTuneOption> options;

  /// 这一项为什么存在。折起来放在标签旁边，不占一行
  final String hint;
  final bool disabled;
}

/// 把输入夹回这个属性允许的范围。
///
/// 夹范围与吸步长都在这里做，而不是交给各端的输入控件：滑块会自己吸附，
/// 手输的数字框不会，于是同一个属性用拖的得到 12、用敲的得到 12.7。
Object? clampFieldValue(FineTuneFieldData field, Object? value) {
  if (field.kind != FineTuneKind.number) return value;
  final raw = value is num ? value.toDouble() : double.tryParse('$value');
  if (raw == null || !raw.isFinite) return field.min ?? 0;
  final min = field.min ?? double.negativeInfinity;
  final max = field.max ?? double.infinity;
  var next = raw < min ? min : (raw > max ? max : raw);
  final step = field.step;
  if (step != null && step > 0) {
    final base = field.min ?? 0;
    next = base + ((next - base) / step).round() * step;
    // 吸附之后可能越界（上限不是步长的整数倍），再夹一次
    next = next < min ? min : (next > max ? max : next);
    // 浮点步长会留下 0.30000000000000004 这样的尾巴，按步长的小数位收一下
    final text = step.toString();
    final dot = text.indexOf('.');
    final decimals = dot < 0 ? 0 : text.length - dot - 1;
    next = double.parse(next.toStringAsFixed(decimals));
  }
  return next;
}

/// 值是否相同。数字按值比，不按字面量——「12」与 12 是同一个设置
bool _sameValue(Object? a, Object? b) {
  if (a == null && b == null) return true;
  if (a is num || b is num) {
    final x = a is num ? a.toDouble() : double.tryParse('$a');
    final y = b is num ? b.toDouble() : double.tryParse('$b');
    return x != null && y != null && x == y;
  }
  return a == b;
}

/// 与原始值不同的那几项。按面板顺序返回，不按改动先后——
/// 改动顺序对读者没有意义，而面板上的顺序是固定的
List<String> changedKeys(
  List<FineTuneFieldData> fields,
  Map<String, Object?> original,
  Map<String, Object?> current,
) {
  return [
    for (final f in fields)
      if (!_sameValue(original[f.key], current[f.key])) f.key,
  ];
}

/// 单项退回原始值。整份退回用 original 本身即可，不必再给一个函数
Map<String, Object?> resetField(
  Map<String, Object?> original,
  Map<String, Object?> current,
  String key,
) {
  final next = Map<String, Object?>.from(current);
  if (original.containsKey(key)) {
    next[key] = original[key];
  } else {
    next.remove(key);
  }
  return next;
}

/// 改了几项的说法。零项时说「与原始结果一致」而不是「改了 0 项」——
/// 后者要读者自己把 0 翻译成「没改」，而这行字存在的意义正是省掉这一步
String fineTuneSummary(int count) => count == 0 ? '与原始结果一致' : '改了 $count 项';

/// 属性值的显示文字。面板上要能一眼看出当前是什么，而不是只看到一个滑块位置
String formatFieldValue(FineTuneFieldData field, Object? value) {
  if (value == null || value == '') return '—';
  switch (field.kind) {
    case FineTuneKind.switchKind:
      return value == true ? '开' : '关';
    case FineTuneKind.select:
      for (final o in field.options) {
        if (o.value == value) return o.label;
      }
      return '$value';
    case FineTuneKind.number:
      return '${_trimNumber(value)}${field.unit}';
    default:
      return '$value';
  }
}

/// 整数不拖一个 .0 的尾巴：JS 那边 16 就是「16」，两端的文字必须逐字相同
String _trimNumber(Object? value) {
  final raw = value is num ? value.toDouble() : double.tryParse('$value');
  if (raw == null) return '$value';
  if (raw == raw.roundToDouble()) return raw.toInt().toString();
  return raw.toString();
}

/// 滑块的填充比例（0–1）。范围缺省时给 0，不让 NaN 流到样式里
double fieldRatio(FineTuneFieldData field, Object? value) {
  if (field.kind != FineTuneKind.number || field.min == null || field.max == null) return 0;
  final span = field.max! - field.min!;
  if (span <= 0) return 0;
  final raw = value is num ? value.toDouble() : double.tryParse('$value');
  if (raw == null || !raw.isFinite) return 0;
  final ratio = (raw - field.min!) / span;
  return ratio < 0 ? 0 : (ratio > 1 ? 1 : ratio);
}
