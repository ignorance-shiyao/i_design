/// 一次性验证码输入的取值规则（与 packages/common/src/logic/otp.ts 同名同算法）。
///
/// 粘贴一整串、在中间某格删除、自动填充——这些规则写在组件里，各端就会各自解释一遍：
/// 一端粘贴能自动分配、另一端只填进第一格，同一条短信在两端上的体验完全不同。
library;

enum OtpMode { numeric, alphanumeric }

final _patterns = {
  OtpMode.numeric: RegExp(r'[0-9]'),
  OtpMode.alphanumeric: RegExp(r'[0-9a-zA-Z]'),
};

/// 单个字符是否可接受。不可接受的直接丢弃，而不是填进去再标红
bool isOtpChar(String char, [OtpMode mode = OtpMode.numeric]) =>
    char.length == 1 && _patterns[mode]!.hasMatch(char);

/// 把粘贴进来的一串文本分配到各格。
///
/// 先剔掉所有不合规字符再分配：短信里的验证码常常带空格或连字符，
/// 逐字填的话会把空格也占掉一格，用户看到的是填了一半且顺序全乱。
List<String> otpFromText(String text, int length, [OtpMode mode = OtpMode.numeric]) {
  final chars = text.split('').where((c) => isOtpChar(c, mode)).toList();
  return List<String>.generate(length, (i) => i < chars.length ? chars[i] : '');
}

/// 各格拼成完整的值。中间有空格时不拼——半截的验证码没有意义
String otpValue(List<String> cells) =>
    cells.every((cell) => cell.isNotEmpty) ? cells.join() : '';

/// 在某一格输入后，光标应当落在哪一格。
/// 填完最后一格时停在原地而不是回到第一格——回到第一格会让人以为自己填错了。
int otpNextIndex(int index, int length) {
  final next = index + 1;
  return next < length - 1 ? next : length - 1;
}

/// 退格：当前格有值就只清当前格；已空才退到前一格并清掉它。
/// 少了这条判断，用户想改最后一个字符时会连前一个一起删掉。
({List<String> cells, int index}) otpBackspace(List<String> cells, int index) {
  final next = [...cells];
  if (next[index].isNotEmpty) {
    next[index] = '';
    return (cells: next, index: index);
  }
  final prev = index - 1 < 0 ? 0 : index - 1;
  next[prev] = '';
  return (cells: next, index: prev);
}
