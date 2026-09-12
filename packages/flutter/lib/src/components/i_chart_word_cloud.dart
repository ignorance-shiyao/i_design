import 'package:flutter/material.dart';
import '../logic/wordcloud.dart';

/// 词云。
///
/// 编码是字号，不是颜色：颜色只按排名分三档去强化「大小」，
/// 因此色觉障碍下不丢信息。要拿确切数值仍然得看表，
/// 所以调用方应把数据表一并给出，那不是无障碍的补丁，而是这个图的正式读法之一。
class IChartWordCloud extends StatelessWidget {
  const IChartWordCloud({
    super.key,
    required this.words,
    this.title = '',
    this.width = 640,
    this.height = 320,
    this.rotate = true,
  });

  final List<IWordItem> words;
  final String title;
  final double width;
  final double height;
  final bool rotate;

  /// 用 TextPainter 量字，而不是按「字数 × 字号」估。
  ///
  /// 估出来的宽度对中文尚可，对拉丁字母能差出一倍——词云的避让全靠这个宽度，
  /// 估错的直接后果是词叠在一起。高度同样要取实际行盒：
  /// 字号是 em 方框，字形连同升部降部要比它高一成多，
  /// 拿字号当高度，上下相邻的两个词会啃掉那一成压在一起。
  List<IWordMeasured> _measure(TextStyle base) {
    return words.map((w) {
      final tp = TextPainter(
        text: TextSpan(text: w.text, style: base.copyWith(fontSize: kWordMaxSize)),
        textDirection: TextDirection.ltr,
      )..layout();
      return IWordMeasured(text: w.text, value: w.value, width: tp.width, height: tp.height);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final base = theme.textTheme.bodyMedium ?? const TextStyle();
    final placed = wordLayout(_measure(base), width, height, rotate: rotate);
    final dropped = wordOverflow(words, placed);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        if (title.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(title, style: theme.textTheme.titleSmall),
          ),
        Semantics(
          label: title.isEmpty ? '词云' : title,
          child: CustomPaint(
            size: Size(width, height),
            painter: _WordCloudPainter(
              placed: placed,
              base: base,
              // 品牌色只给最大的那几个词：它作为大字达到 3:1，落到小字上就不够了
              strong: theme.colorScheme.primary,
              baseColor: theme.colorScheme.onSurface,
              muted: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        // 放不下的词要说出来：读者看到词少了，得知道是「数据里就这些」
        // 还是「画布太小放不下」——这两者的结论完全不同
        if (dropped > 0)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text('画布放不下 $dropped 个权重较低的词，可调大尺寸或查看数据表',
                style: theme.textTheme.bodySmall),
          ),
      ],
    );
  }
}

class _WordCloudPainter extends CustomPainter {
  _WordCloudPainter({
    required this.placed,
    required this.base,
    required this.strong,
    required this.baseColor,
    required this.muted,
  });

  final List<IWordPlacement> placed;
  final TextStyle base;
  final Color strong;
  final Color baseColor;
  final Color muted;

  @override
  void paint(Canvas canvas, Size size) {
    for (final word in placed) {
      final tone = wordTone(word.slot, placed.length);
      final color = switch (tone) {
        IWordTone.strong => strong,
        IWordTone.base => baseColor,
        IWordTone.muted => muted,
      };
      final tp = TextPainter(
        text: TextSpan(
          text: word.text,
          style: base.copyWith(fontSize: word.fontSize, color: color),
        ),
        textDirection: TextDirection.ltr,
      )..layout();

      canvas.save();
      canvas.translate(word.x, word.y);
      // 竖排只给短词：长词竖过来会戳出画布上下沿
      if (word.rotated) canvas.rotate(-3.141592653589793 / 2);
      tp.paint(canvas, Offset(-tp.width / 2, -tp.height / 2));
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(_WordCloudPainter old) => old.placed != placed;
}
