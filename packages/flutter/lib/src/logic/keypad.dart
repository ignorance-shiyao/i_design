/// 数字键盘按键规则的 Dart 移植（对应 packages/common/src/logic/keypad.ts）。
///
/// 金额与验证码的输入约束如果各端各写一遍，同一个表单在 Web 上能输入 12.345、
/// 在这里不能，而两边看起来都「合理」。
library;

/// 按下一个键后的新值。返回原值表示这一下不生效。
///
/// 不生效时返回原值而不是抛错：调用方只需要无脑赋值，
/// 而「这一下没反应」本身就是给用户的反馈——键盘上按不动的键，
/// 比按下去数字乱跳要好解释得多。
String pressKey(
  String value,
  String key, {
  int decimals = 2,
  int maxLength = 12,
  bool negative = false,
}) {
  if (key == 'backspace') return value.isEmpty ? value : value.substring(0, value.length - 1);
  if (key == 'clear') return '';
  if (key == 'sign') {
    if (!negative) return value;
    return value.startsWith('-') ? value.substring(1) : '-$value';
  }

  if (key == '.') {
    if (decimals <= 0) return value;
    // 已经有小数点就不再加第二个；空值补前导零，「.5」不是所有后端都认
    if (value.contains('.')) return value;
    if (value.isEmpty || value == '-') return '${value}0.';
    return value.length + 1 > maxLength ? value : '$value.';
  }

  if (!RegExp(r'^\d$').hasMatch(key)) return value;
  if (value.length + 1 > maxLength) return value;

  final dot = value.indexOf('.');
  // 小数位已满：再按数字应当无效，而不是悄悄替换掉最后一位
  if (dot >= 0 && value.length - dot - 1 >= decimals) return value;

  // 前导零：0 后面直接接数字应当替换掉那个 0，否则会得到 0123
  if (value == '0') return key;
  if (value == '-0') return '-$key';
  return value + key;
}

/// 键盘的按键排布。
///
/// 用手机拨号盘的顺序（1 在左上）而不是计算器的顺序（7 在左上）：
/// 输入金额和验证码的场景里，用户的肌肉记忆来自手机拨号盘。
List<List<String>> keypadRows({int decimals = 2, bool negative = false}) {
  final last = <String>[];
  if (negative) {
    last.add('sign');
  } else if (decimals > 0) {
    last.add('.');
  } else {
    last.add('');
  }
  last.addAll(['0', 'backspace']);
  return [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    last,
  ];
}

/// 按键的读屏文案。符号键光念符号读屏会跳过，必须给出词
String keyLabel(String key) {
  if (key == 'backspace') return '删除';
  if (key == 'clear') return '清空';
  if (key == 'sign') return '正负号';
  if (key == '.') return '小数点';
  return key;
}

/// 输入是否已经是一个完整可提交的值。
///
/// 「12.」不算：它是输入中间态，此时启用提交按钮，用户提交后拿到的是个残值。
bool isComplete(String value) {
  if (value.isEmpty || value == '-' || value == '.') return false;
  return RegExp(r'^-?\d+(\.\d+)?$').hasMatch(value);
}
