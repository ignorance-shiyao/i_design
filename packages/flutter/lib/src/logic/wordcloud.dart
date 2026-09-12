/// 词云的字号映射与布局。
///
/// 与 packages/common/src/logic/wordcloud.ts 一一对应。
/// 文字宽高由调用方量好传进来（Flutter 用 TextPainter），这里不碰绘制。
library;

import 'dart:math' as math;

class IWordItem {
  const IWordItem({required this.text, required this.value});
  final String text;

  /// 权重，通常是词频
  final double value;
}

class IWordMeasured extends IWordItem {
  const IWordMeasured({
    required super.text,
    required super.value,
    required this.width,
    required this.height,
  });
  final double width;
  final double height;
}

class IWordPlacement {
  const IWordPlacement({
    required this.text,
    required this.value,
    required this.x,
    required this.y,
    required this.fontSize,
    required this.slot,
    required this.rotated,
  });

  final String text;
  final double value;

  /// 中心点坐标
  final double x;
  final double y;
  final double fontSize;

  /// 排名槽位，由调用方映射成档位颜色
  final int slot;

  /// 竖排。竖排只给短词用，长词竖过来会戳出画布
  final bool rotated;
}

/// 字号下限：再小就读不出来了，不如不画
const double kWordMinSize = 12;
const double kWordMaxSize = 48;

/// 权重映射成字号，按面积而不是按高度。
///
/// 人读字的「大小」接近读它占的面积，而字面积随字号平方增长。
/// 直接按值线性给字号，权重差 4 倍的两个词看起来会差 16 倍，
/// 第二名于是被压成背景噪声。开平方之后，视觉上的大小比才接近真实的权重比。
double wordFontSize(
  double value,
  double min,
  double max, {
  double minSize = kWordMinSize,
  double maxSize = kWordMaxSize,
}) {
  // 全部同值时统一给中间字号——线性映射在这种情况下要除以 0
  if (max <= min) return (minSize + maxSize) / 2;
  final t = (value - min) / (max - min);
  return minSize + (maxSize - minSize) * math.sqrt(t);
}

class _Box {
  const _Box(this.x, this.y, this.w, this.h);
  final double x;
  final double y;
  final double w;
  final double h;
}

bool _overlaps(_Box a, _Box b, double pad) =>
    a.x - pad < b.x + b.w && a.x + a.w + pad > b.x && a.y - pad < b.y + b.h && a.y + a.h + pad > b.y;

/// 阿基米德螺线布局。
///
/// 权重最大的词先放，因此它一定落在正中，读者第一眼看到的就是第一名。
/// 放不下的词直接丢掉而不是硬塞：硬塞出来的是叠字，两个词都读不出来，
/// 比少一个词更糟。返回值因此可能短于输入。
List<IWordPlacement> wordLayout(
  List<IWordMeasured> words,
  double width,
  double height, {
  double padding = 2,
  bool rotate = true,
  double minSize = kWordMinSize,
  double maxSize = kWordMaxSize,
}) {
  final valid = words.where((w) => w.value > 0 && w.text.isNotEmpty).toList();
  if (valid.isEmpty || width <= 0 || height <= 0) return const <IWordPlacement>[];

  final sorted = [...valid]..sort((a, b) => b.value.compareTo(a.value));
  final min = sorted.last.value;
  final max = sorted.first.value;

  final placed = <_Box>[];
  final out = <IWordPlacement>[];
  final cx = width / 2;
  final cy = height / 2;
  // 螺线按画布长宽比拉成椭圆：正圆螺线在 2:1 的画布上会先把上下撑满、
  // 然后就再也放不下，左右两侧空出一大片
  final aspect = width / height;

  for (var index = 0; index < sorted.length; index++) {
    final word = sorted[index];
    final fontSize = wordFontSize(word.value, min, max, minSize: minSize, maxSize: maxSize);
    // 传进来的宽高按基准字号量得，这里按实际字号等比缩放
    final scale = fontSize / maxSize;
    // 竖排只给短词：长词竖过来会戳出画布上下沿，怎么挪都放不下
    final rotated = rotate && word.text.length <= 4 && index % 5 == 4;
    final w = (rotated ? word.height : word.width) * scale;
    final h = (rotated ? word.width : word.height) * scale;

    // 螺线步长与字号挂钩：字大就迈大步，否则大词要试上千个几乎重合的位置
    final step = math.max(2.0, fontSize / 6);
    for (var t = 0; t < 3000; t++) {
      final angle = t * 0.25;
      final radius = step * angle * 0.12;
      final x = cx + radius * aspect * math.cos(angle) - w / 2;
      final y = cy + radius * math.sin(angle) - h / 2;
      // 越界即放弃这个候选点，而不是夹回边界内——
      // 夹回去会让一圈词全都贴着边排成一条线
      if (x < 0 || y < 0 || x + w > width || y + h > height) continue;
      final box = _Box(x, y, w, h);
      if (placed.any((p) => _overlaps(box, p, padding))) continue;
      placed.add(box);
      out.add(IWordPlacement(
        text: word.text,
        value: word.value,
        x: x + w / 2,
        y: y + h / 2,
        fontSize: fontSize,
        slot: index,
        rotated: rotated,
      ));
      break;
    }
  }

  return out;
}

/// 有多少词没放下。
///
/// 组件要据此给一句提示：读者看到词少了，得知道是「数据里就这些」
/// 还是「画布太小放不下」——这两者的结论完全不同。
int wordOverflow(List<IWordItem> words, List<IWordPlacement> placed) {
  final n = words.where((w) => w.value > 0 && w.text.isNotEmpty).length - placed.length;
  return n < 0 ? 0 : n;
}

/// 词该用哪一档颜色。
///
/// 词云不用分类色板：分类色表示「身份不同」，而词云里各词并没有身份之分。
/// 这里按权重排名分三档，颜色只强化「大小」这一个已有的编码，
/// 因此色觉障碍下不丢信息。
enum IWordTone { strong, base, muted }

IWordTone wordTone(int rank, int total) {
  if (total <= 0) return IWordTone.base;
  final t = rank / total;
  if (t < 0.2) return IWordTone.strong;
  if (t < 0.6) return IWordTone.base;
  return IWordTone.muted;
}
