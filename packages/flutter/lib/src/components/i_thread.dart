import 'package:flutter/material.dart';
import '../logic/thread.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_avatar.dart';
import 'i_button.dart';
import 'i_icon.dart';

/// 评论线程与活动记录（astra.md 的 B14）。
///
/// 人说的话与系统记的账按时间穿插在一条时间轴上——分成两个标签页的话，
/// 读者永远拼不出「当时到底发生了什么」。
///
/// 组件不碰任何 IO：发送、删除、重发都交给调用方。它摆出四件事：
/// 删掉的父评论留下的那个坑、**钉死不动**的未读分隔线、编辑痕迹、
/// 发失败那条的原文。判断全在 logic/thread.dart，与 Web 端同一份规则。
class IThread extends StatefulWidget {
  const IThread({
    super.key,
    required this.entries,
    this.meId = '',
    this.lastReadAt = 0,
    this.formatTime,
    this.onReply,
    this.onRetry,
    this.onDiscard,
    this.onJump,
    this.onRead,
  });

  final List<IThreadEntry> entries;

  /// 我是谁。自己说的话不算未读
  final String meId;
  final int lastReadAt;

  /// 把时间戳排成人话。时区是各端从系统拿的，因此留在调用方
  final String Function(int ms)? formatTime;
  final void Function(IThreadComment comment)? onReply;
  final void Function(IThreadComment comment)? onRetry;
  final void Function(IThreadComment comment)? onDiscard;
  final void Function(String id)? onJump;
  final void Function(int lastReadAt)? onRead;

  @override
  State<IThread> createState() => _IThreadState();
}

class _IThreadState extends State<IThread> {
  late IUnreadState _unread;

  @override
  void initState() {
    super.initState();
    // 未读分隔线在打开的那一刻钉死
    _unread = unreadState(widget.entries, widget.lastReadAt, widget.meId);
  }

  @override
  void didUpdateWidget(IThread old) {
    super.didUpdateWidget(old);
    // 之后只更新计数，不挪分隔线：它往下跑的话，用户再也找不到自己读到哪儿了
    _unread = keepDivider(_unread, widget.entries, widget.lastReadAt, widget.meId);
  }

  String _time(int ms) =>
      widget.formatTime?.call(ms) ??
      DateTime.fromMillisecondsSinceEpoch(ms).toString().substring(0, 16);

  List<IThreadNode> _flat(IThreadNode node) => [
        node,
        for (final reply in node.replies) ..._flat(reply),
      ];

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final items = threadItems(widget.entries);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (_unread.count > 0)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(
              horizontal: IDesignTokensLight.spacing3,
              vertical: IDesignTokensLight.spacing2,
            ),
            decoration: BoxDecoration(
              color: c.bgSubtle,
              border: Border.all(color: c.hairline),
              borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Semantics(
                    liveRegion: true,
                    child: Text(
                      _unread.text,
                      style: TextStyle(
                        fontSize: IDesignTokensLight.fontSizeSm,
                        color: c.textSecondary,
                      ),
                    ),
                  ),
                ),
                if (_unread.dividerId != null)
                  IButton(
                    label: '跳到第一条',
                    size: IButtonSize.sm,
                    onPressed: () => widget.onJump?.call(_unread.dividerId!),
                  ),
                const SizedBox(width: IDesignTokensLight.spacing2),
                IButton(
                  label: '全部标为已读',
                  size: IButtonSize.sm,
                  onPressed: () => widget.onRead
                      ?.call(readUpTo(widget.entries, widget.lastReadAt)),
                ),
              ],
            ),
          ),

        if (items.isEmpty)
          Padding(
            padding: const EdgeInsets.all(IDesignTokensLight.spacing8),
            child: Center(
              child: Text(
                '还没有评论。第一条通常是把背景说清楚。',
                style: TextStyle(
                  fontSize: IDesignTokensLight.fontSizeSm,
                  color: c.textTertiary,
                ),
              ),
            ),
          ),

        for (final item in items)
          if (item.kind == IThreadEntryKind.activity) ...[
            if (_unread.dividerId == item.activities.first.id) _divider(c),
            // 连续的活动记录折成一组：逐条铺开会把人说的话淹掉
            Padding(
              padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing2),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 20,
                    height: 20,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: c.bgSubtle, shape: BoxShape.circle),
                    child: IIcon('history', size: 12, color: c.textTertiary),
                  ),
                  const SizedBox(width: IDesignTokensLight.spacing2),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          item.summary,
                          style: TextStyle(
                            fontSize: IDesignTokensLight.fontSizeSm,
                            color: c.textTertiary,
                          ),
                        ),
                        if (item.activities.length > 1)
                          for (final activity in item.activities)
                            Padding(
                              padding: const EdgeInsets.only(
                                left: IDesignTokensLight.spacing4,
                                top: 2,
                              ),
                              child: Text(
                                activity.change,
                                style: TextStyle(
                                  fontSize: IDesignTokensLight.fontSizeXs,
                                  color: c.textTertiary,
                                ),
                              ),
                            ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ] else
            for (final node in _flat(item.node!)) ...[
              if (_unread.dividerId == node.comment.id) _divider(c),
              Padding(
                padding: EdgeInsets.only(
                  left: node.comment.parentId == null ? 0 : IDesignTokensLight.spacing8,
                ),
                child: node.tombstone
                    // 删掉但底下还有回复：留一个坑，否则那几句「同意」挂在空气里
                    ? Padding(
                        padding: const EdgeInsets.symmetric(
                          vertical: IDesignTokensLight.spacing2,
                        ),
                        child: Text(
                          kDeletedBody,
                          style: TextStyle(
                            fontSize: IDesignTokensLight.fontSizeSm,
                            color: c.textTertiary,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      )
                    : _comment(node.comment, c),
              ),
            ],
      ],
    );
  }

  Widget _divider(IColors c) => Padding(
        padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing3),
        child: Row(
          children: [
            Expanded(child: Container(height: 1, color: c.hairline)),
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: IDesignTokensLight.spacing2,
              ),
              child: Text(
                _unread.text,
                style: TextStyle(
                  fontSize: IDesignTokensLight.fontSizeXs,
                  color: c.brand,
                ),
              ),
            ),
            Expanded(child: Container(height: 1, color: c.hairline)),
          ],
        ),
      );

  Widget _comment(IThreadComment comment, IColors c) {
    final note = editNote(comment, _time);
    final failed = comment.sendState == ISendState.failed;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IAvatar(
            name: comment.authorName,
            size: comment.parentId == null ? 32 : 24,
          ),
          const SizedBox(width: IDesignTokensLight.spacing3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Wrap(
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: IDesignTokensLight.spacing2,
                  children: [
                    Text(
                      comment.authorName,
                      style: TextStyle(
                        fontSize: IDesignTokensLight.fontSizeSm,
                        fontWeight: FontWeight.w500,
                        color: c.text,
                      ),
                    ),
                    Text(
                      _time(comment.createdAt),
                      style: TextStyle(
                        fontSize: IDesignTokensLight.fontSizeXs,
                        color: c.textTertiary,
                      ),
                    ),
                    // 编辑过就看得见：一句话被改了意思，读者不该毫无察觉
                    if (note.isNotEmpty)
                      Text(
                        note,
                        style: TextStyle(
                          fontSize: IDesignTokensLight.fontSizeXs,
                          color: c.textTertiary,
                        ),
                      ),
                    if (comment.sendState == ISendState.sending)
                      _sendTag('发送中', 'clock', c.textSecondary, c.bgSubtle, c),
                    if (failed)
                      _sendTag(
                        '发送失败：${(comment.sendError ?? '').trim().isEmpty ? '网络没连上' : comment.sendError!}',
                        'error-circle',
                        c.danger,
                        c.dangerSubtle,
                        c,
                      ),
                  ],
                ),
                const SizedBox(height: IDesignTokensLight.spacing1),
                Text(
                  comment.body,
                  style: TextStyle(
                    fontSize: IDesignTokensLight.fontSizeMd,
                    color: c.text,
                  ),
                ),
                const SizedBox(height: IDesignTokensLight.spacing2),
                // 失败那条的原文还在，动作摆在旁边：悄悄丢掉是最糟的
                if (failed)
                  Wrap(
                    spacing: IDesignTokensLight.spacing2,
                    children: [
                      IButton(
                        label: '重发',
                        size: IButtonSize.sm,
                        variant: IButtonVariant.primary,
                        onPressed: () => widget.onRetry?.call(comment),
                      ),
                      IButton(
                        label: '放弃这条',
                        size: IButtonSize.sm,
                        onPressed: () => widget.onDiscard?.call(comment),
                      ),
                    ],
                  )
                else if (comment.sendState == null)
                  IButton(
                    label: '回复',
                    size: IButtonSize.sm,
                    onPressed: () => widget.onReply?.call(comment),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// 状态用图标 + 文字 + 淡底块三样一起说，不靠颜色单独表意
  Widget _sendTag(String text, String icon, Color color, Color background, IColors c) =>
      Container(
        padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing2),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusFull),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IIcon(icon, size: 11, color: color),
            const SizedBox(width: 2),
            Text(
              text,
              style: TextStyle(fontSize: IDesignTokensLight.fontSizeXs, color: color),
            ),
          ],
        ),
      );
}
