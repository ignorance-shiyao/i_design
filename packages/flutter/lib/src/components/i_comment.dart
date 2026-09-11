import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_avatar.dart';

/// 一条评论：谁、什么时候、说了什么，外加可选的引用与回复。
///
/// 回复用左侧缩进表达从属，而不是一条加粗的竖线——
/// 那在这套体系里是被禁用的状态暗示。
class IComment extends StatelessWidget {
  const IComment({
    super.key,
    required this.author,
    required this.content,
    this.datetime,
    this.quote,
    this.avatarUrl,
    this.actions = const [],
    this.replies = const [],
    this.reply = false,
  });

  final String author;
  final String content;

  /// 已经格式化好的时间文案：相对时间的算法在 logic/date，由调用方决定用哪种
  final String? datetime;
  final String? quote;
  final String? avatarUrl;
  final List<Widget> actions;
  final List<Widget> replies;
  final bool reply;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    return Padding(
      padding: EdgeInsets.symmetric(
        vertical: reply ? IDesignTokensLight.spacing2 : IDesignTokensLight.spacing3,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IAvatar(name: author, imageUrl: avatarUrl, size: reply ? 24 : 32),
          const SizedBox(width: IDesignTokensLight.spacing3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      author,
                      style: TextStyle(
                        color: c.text,
                        fontSize: IDesignTokensLight.fontSizeSm,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (datetime != null) ...[
                      const SizedBox(width: IDesignTokensLight.spacing2),
                      Text(
                        datetime!,
                        style: TextStyle(
                          color: c.textTertiary,
                          fontSize: IDesignTokensLight.fontSizeXs,
                        ),
                      ),
                    ],
                  ],
                ),
                if (quote != null)
                  Container(
                    margin: const EdgeInsets.only(top: IDesignTokensLight.spacing2),
                    padding: const EdgeInsets.symmetric(
                      horizontal: IDesignTokensLight.spacing3,
                      vertical: IDesignTokensLight.spacing2,
                    ),
                    decoration: BoxDecoration(
                      color: c.bgSubtle,
                      border: Border.all(color: c.hairline),
                      borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
                    ),
                    child: Text(
                      quote!,
                      style: TextStyle(
                        color: c.textSecondary,
                        fontSize: IDesignTokensLight.fontSizeSm,
                      ),
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.only(top: IDesignTokensLight.spacing1),
                  child: Text(
                    content,
                    style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeMd),
                  ),
                ),
                if (actions.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: IDesignTokensLight.spacing2),
                    child: Wrap(spacing: IDesignTokensLight.spacing4, children: actions),
                  ),
                if (replies.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(
                      top: IDesignTokensLight.spacing2,
                      left: IDesignTokensLight.spacing6,
                    ),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: replies),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
