import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_avatar.dart';
import 'i_icon.dart';

enum IChatRole { user, assistant }

/// 会话中的一条消息。
///
/// 两个角色的排版刻意不对称：用户消息是右对齐、宽度受限的气泡，
/// 助手消息是左对齐的通栏正文——二者的阅读量差着数量级，
/// 把几百字的回答塞进气泡里，行长会被压到难以阅读。
class IChatMessage extends StatelessWidget {
  const IChatMessage({
    super.key,
    required this.child,
    this.role = IChatRole.assistant,
    this.name = '',
    this.time = '',
    this.avatarUrl,
    this.streaming = false,
    this.error = false,
    this.before,
    this.after,
    this.onCopy,
    this.onRetry,
  });

  final Widget child;
  final IChatRole role;
  final String name;
  final String time;
  final String? avatarUrl;

  /// 流式输出中：文字末尾显示光标，同时抑制操作区
  final bool streaming;

  /// 这一轮失败了：整段转为危险色
  final bool error;

  /// 正文之前：推理过程、工具调用等
  final Widget? before;

  /// 正文之后：来源、追问建议
  final Widget? after;

  final VoidCallback? onCopy;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final isUser = role == IChatRole.user;

    final bubble = Container(
      padding: isUser || error
          ? const EdgeInsets.symmetric(
              horizontal: IDesignTokensLight.spacing4,
              vertical: IDesignTokensLight.spacing3,
            )
          : EdgeInsets.zero,
      decoration: BoxDecoration(
        color: error ? c.dangerSubtle : (isUser ? c.brandSubtle : null),
        borderRadius: isUser || error
            ? BorderRadius.only(
                topLeft: const Radius.circular(IDesignTokensLight.radiusLg),
                // 尖角朝向发送者一侧，指明这句话是谁说的
                topRight: Radius.circular(
                  isUser ? IDesignTokensLight.radiusSm : IDesignTokensLight.radiusLg,
                ),
                bottomLeft: const Radius.circular(IDesignTokensLight.radiusLg),
                bottomRight: const Radius.circular(IDesignTokensLight.radiusLg),
              )
            : null,
      ),
      child: DefaultTextStyle(
        style: TextStyle(
          color: error ? c.danger : c.text,
          fontSize: IDesignTokensLight.fontSizeMd,
          height: 1.75,
        ),
        child: streaming
            ? Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Flexible(child: child),
                  const SizedBox(width: 2),
                  _Caret(color: c.brand),
                ],
              )
            : child,
      ),
    );

    final body = Column(
      crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        if (name.isNotEmpty || time.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: IDesignTokensLight.spacing2),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (name.isNotEmpty)
                  Text(
                    name,
                    style: TextStyle(
                      color: c.textSecondary,
                      fontSize: IDesignTokensLight.fontSizeXs,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                if (time.isNotEmpty) ...[
                  const SizedBox(width: IDesignTokensLight.spacing2),
                  Text(
                    time,
                    style: TextStyle(
                      color: c.textTertiary,
                      fontSize: IDesignTokensLight.fontSizeXs,
                    ),
                  ),
                ],
              ],
            ),
          ),
        if (before != null) ...[
          before!,
          const SizedBox(height: IDesignTokensLight.spacing2),
        ],
        bubble,
        if (after != null) ...[
          const SizedBox(height: IDesignTokensLight.spacing2),
          after!,
        ],
        // 生成过程中不给操作按钮：此时复制到的是半截内容，重试也没有意义。
        // 移动端没有悬停，操作区常驻显示。
        if (!streaming && (onCopy != null || onRetry != null))
          Padding(
            padding: const EdgeInsets.only(top: IDesignTokensLight.spacing2),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (onCopy != null) _Action(icon: 'copy', label: '复制', onTap: onCopy!),
                if (onRetry != null && role == IChatRole.assistant)
                  _Action(
                    icon: 'refresh',
                    label: error ? '重试' : '重新生成',
                    onTap: onRetry!,
                  ),
              ],
            ),
          ),
      ],
    );

    final avatar = IAvatar(
      name: name.isNotEmpty ? name : (isUser ? '我' : 'AI'),
      imageUrl: avatarUrl,
      size: 32,
      square: !isUser,
    );

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing4),
      child: Row(
        textDirection: isUser ? TextDirection.rtl : TextDirection.ltr,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          avatar,
          const SizedBox(width: IDesignTokensLight.spacing3),
          // 用户消息限宽，助手消息占满余下宽度
          Flexible(
            child: Align(
              alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
              child: Directionality(
                textDirection: TextDirection.ltr,
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    maxWidth: isUser ? MediaQuery.of(context).size.width * 0.72 : double.infinity,
                  ),
                  child: body,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// 流式输出时跟在文字末尾的光标
class _Caret extends StatefulWidget {
  const _Caret({required this.color});

  final Color color;

  @override
  State<_Caret> createState() => _CaretState();
}

class _CaretState extends State<_Caret> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1000),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // 系统开启「减弱动态效果」时不闪烁：常亮同样表达「还在输出」
    final reduced = MediaQuery.of(context).disableAnimations;
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) => Opacity(
        opacity: reduced ? 1 : (_controller.value < 0.5 ? 1 : 0),
        child: Container(width: 2, height: 16, color: widget.color),
      ),
    );
  }
}

class _Action extends StatelessWidget {
  const _Action({required this.icon, required this.label, required this.onTap});

  final String icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: IDesignTokensLight.spacing2,
          vertical: 2,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IIcon(icon, size: 12, color: c.textTertiary),
            const SizedBox(width: IDesignTokensLight.spacing1),
            Text(
              label,
              style: TextStyle(
                color: c.textTertiary,
                fontSize: IDesignTokensLight.fontSizeXs,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
