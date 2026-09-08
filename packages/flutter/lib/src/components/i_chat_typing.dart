import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 等待首个字符时的三点提示。
///
/// 只在「请求已发出、还没有任何内容」这段空窗里出现；一旦开始流式输出
/// 就该换成 IChatMessage 的光标，否则同时出现两种「正在进行」的信号。
class IChatTyping extends StatefulWidget {
  const IChatTyping({super.key});

  @override
  State<IChatTyping> createState() => _IChatTypingState();
}

class _IChatTypingState extends State<IChatTyping> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final reduced = MediaQuery.of(context).disableAnimations;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: IDesignTokensLight.spacing4,
        vertical: IDesignTokensLight.spacing3,
      ),
      decoration: BoxDecoration(
        color: c.bgSubtle,
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < 3; i++)
            Padding(
              padding: EdgeInsets.only(left: i == 0 ? 0 : 4),
              child: AnimatedBuilder(
                animation: _controller,
                builder: (context, _) {
                  // 三个点依次起伏，相位各差 0.2
                  final phase = (_controller.value - i * 0.2) % 1.0;
                  final lift = phase < 0.3 ? phase / 0.3 : 0.0;
                  return Opacity(
                    opacity: reduced ? 0.6 : 0.3 + 0.7 * lift,
                    child: Transform.translate(
                      offset: Offset(0, reduced ? 0 : -3 * lift),
                      child: Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: c.textTertiary,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
