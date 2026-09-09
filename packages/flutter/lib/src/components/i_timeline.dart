import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

enum ITimelineTone { brand, success, warning, danger, muted }

@immutable
class ITimelineItem {
  const ITimelineItem({
    required this.title,
    this.time,
    this.description,
    this.tone = ITimelineTone.brand,
    this.current = false,
  });

  final String title;
  final String? time;
  final String? description;
  final ITimelineTone tone;

  /// 正在发生：圆点填实
  final bool current;
}

/// 按时间排列的一串事件。
///
/// 与 ISteps 的分工：Steps 描述一个还没走完的流程（有「当前步」），
/// Timeline 记录已经发生的事，没有「当前」这个概念。
class ITimeline extends StatelessWidget {
  const ITimeline({super.key, required this.items});

  final List<ITimelineItem> items;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    Color toneOf(ITimelineTone tone) => switch (tone) {
          ITimelineTone.brand => c.brand,
          ITimelineTone.success => c.success,
          ITimelineTone.warning => c.warning,
          ITimelineTone.danger => c.danger,
          ITimelineTone.muted => c.borderStrong,
        };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (var i = 0; i < items.length; i++)
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 轨道：圆点 + 连线；最后一项不画线，否则线会悬在末尾
                SizedBox(
                  width: 12,
                  child: Column(
                    children: [
                      Container(
                        width: 10,
                        height: 10,
                        margin: const EdgeInsets.only(top: 5),
                        decoration: BoxDecoration(
                          color: items[i].current ? toneOf(items[i].tone) : c.bg,
                          shape: BoxShape.circle,
                          border: Border.all(color: toneOf(items[i].tone), width: 2),
                        ),
                      ),
                      if (i != items.length - 1)
                        Expanded(
                          child: Container(
                            width: 2,
                            margin: const EdgeInsets.symmetric(
                              vertical: IDesignTokensLight.spacing1,
                            ),
                            color: c.hairline,
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: IDesignTokensLight.spacing3),
                Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(
                      bottom: i == items.length - 1 ? 0 : IDesignTokensLight.spacing5,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          items[i].title,
                          style: TextStyle(
                            color: c.text,
                            fontSize: IDesignTokensLight.fontSizeMd,
                          ),
                        ),
                        if (items[i].time != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 2),
                            child: Text(
                              items[i].time!,
                              style: TextStyle(
                                color: c.textTertiary,
                                fontSize: IDesignTokensLight.fontSizeXs,
                              ),
                            ),
                          ),
                        if (items[i].description != null)
                          Padding(
                            padding: const EdgeInsets.only(top: IDesignTokensLight.spacing1),
                            child: Text(
                              items[i].description!,
                              style: TextStyle(
                                color: c.textSecondary,
                                fontSize: IDesignTokensLight.fontSizeSm,
                                height: 1.7,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
