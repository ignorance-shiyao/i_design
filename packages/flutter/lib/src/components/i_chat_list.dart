import 'package:flutter/material.dart';
import '../logic/chatlist.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_empty.dart';
import 'i_icon.dart';

/// 会话列表：多轮会话的切换与管理。
///
/// 攒到几十条之后，列表本身就成了一个要解决的问题。三个决定：
///
/// **按时间分组，而不是一条长列表。** 「今天」「昨天」「最近 7 天」「更早」
/// 四档就够——再细分，读者得先读组标题才知道自己在看哪一段。
///
/// **标题为空时用摘要顶上。** 智能体还没起名时标题是空的，显示一片空白的话，
/// 用户会以为这条会话坏了。
///
/// **删掉当前这条之后选它的后一条。** 跳回第一条是最省事的写法，也是最坏的：
/// 用户正在看列表中段，删一条就被弹回顶部，他得重新找位置。
class IChatList extends StatefulWidget {
  const IChatList({
    super.key,
    required this.sessions,
    this.active = '',
    this.searchAfter = 8,
    this.onActiveChanged,
    this.onCreate,
    this.onRemove,
    this.onPin,
    this.onArchive,
  });

  final List<ChatSessionData> sessions;
  final String active;

  /// 超过这个条数才显示搜索框；少几条时那个框只是占地方
  final int searchAfter;
  final ValueChanged<String>? onActiveChanged;
  final VoidCallback? onCreate;
  final ValueChanged<String>? onRemove;
  final ValueChanged<String>? onPin;

  /// 归档 / 取消归档；由调用方决定是真的归档还是只是标记
  final void Function(String id, bool archived)? onArchive;

  @override
  State<IChatList> createState() => _IChatListState();
}

class _IChatListState extends State<IChatList> {
  String _query = '';

  void _remove(ChatSessionData session, List<ChatGroupData> groups) {
    // 先算好接下来选谁，再把删除抛出去：抛出去之后列表已经变了，算不准了。
    // 传的是分好组的列表——「后一条」说的是用户看到的下一条，不是列表里的下一个
    final next = nextAfterDelete(groups, session.id, widget.active);
    widget.onRemove?.call(session.id);
    if (next != widget.active) widget.onActiveChanged?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final shown = filterSessions(widget.sessions, _query);
    // 分组的「现在」每次 build 都取一次：跨过零点之后「今天」得变成「昨天」
    final groups = groupSessions(shown, DateTime.now().millisecondsSinceEpoch);

    return Container(
      padding: const EdgeInsets.all(IDesignTokensLight.spacing2),
      decoration: BoxDecoration(
        color: c.bgElevated,
        // 四边等宽的发丝线：选中哪一条由底色与字色说，不靠加粗某一边
        border: Border.all(color: c.hairline),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          _newButton(c),
          if (widget.sessions.length > widget.searchAfter) ...[
            const SizedBox(height: IDesignTokensLight.spacing2),
            TextField(
              decoration: const InputDecoration(
                hintText: '搜索会话',
                isDense: true,
                border: OutlineInputBorder(),
              ),
              style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeSm),
              onChanged: (v) => setState(() => _query = v),
            ),
          ],
          const SizedBox(height: IDesignTokensLight.spacing2),
          if (groups.isEmpty)
            // 搜不到时说清楚是搜不到，而不是让列表空着——空着看起来像会话全没了
            IEmpty(
              description: _query.isEmpty ? '还没有会话' : '没有匹配「$_query」的会话',
            )
          else
            Flexible(
              child: ListView(
                shrinkWrap: true,
                children: [
                  for (final group in groups) ...[
                    // 空组不渲染组标题：一条也没有的组标题只是在占地方
                    Padding(
                      padding: const EdgeInsets.fromLTRB(
                        IDesignTokensLight.spacing2,
                        IDesignTokensLight.spacing2,
                        IDesignTokensLight.spacing2,
                        IDesignTokensLight.spacing1,
                      ),
                      child: Text(
                        group.label,
                        style: TextStyle(
                          color: c.textTertiary,
                          fontSize: IDesignTokensLight.fontSizeXs,
                        ),
                      ),
                    ),
                    for (final session in group.sessions) _item(c, session, groups),
                  ],
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _newButton(IColors c) {
    return Semantics(
      label: '新建会话',
      button: true,
      child: GestureDetector(
        onTap: widget.onCreate,
        child: Container(
          padding: const EdgeInsets.all(IDesignTokensLight.spacing2),
          decoration: BoxDecoration(
            // 纯色，不用渐变：同一个主题色在不同尺寸的按钮上不该呈现出不同观感
            color: c.bgSubtle,
            border: Border.all(color: c.hairline),
            borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IIcon(name: 'plus', size: 14, color: c.text),
              const SizedBox(width: IDesignTokensLight.spacing1),
              Text(
                '新会话',
                style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeSm),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _item(IColors c, ChatSessionData session, List<ChatGroupData> groups) {
    final isActive = session.id == widget.active;
    final title = sessionTitle(session);

    return Semantics(
      selected: isActive,
      button: true,
      child: GestureDetector(
        onTap: () => widget.onActiveChanged?.call(session.id),
        child: Container(
          margin: const EdgeInsets.only(bottom: 2),
          padding: const EdgeInsets.all(IDesignTokensLight.spacing2),
          decoration: BoxDecoration(
            /*
             * 选中给的是底色加一条更重的字色，不是在左边加一道粗线：
             * 那种线在灰度下与普通边框没区别，而「我在看哪一条」正是
             * 最需要读准的信息。
             */
            color: isActive ? c.brandSubtle : null,
            borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
          ),
          child: Row(
            children: [
              if (session.pinned) ...[
                IIcon(name: 'pin', size: 12, color: c.textTertiary),
                const SizedBox(width: IDesignTokensLight.spacing1),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: isActive ? c.brand : c.text,
                        fontSize: IDesignTokensLight.fontSizeSm,
                        fontWeight: isActive ? FontWeight.w500 : FontWeight.w400,
                      ),
                    ),
                    // 打不开的原因写出来，图标与文字一起给，不靠颜色单独表意
                    if (accessReasonOf(session).isNotEmpty)
                      Row(
                        children: [
                          IIcon(
                            name: session.access == ChatAccess.forbidden ? 'lock' : 'history',
                            size: 12,
                            color: c.textTertiary,
                          ),
                          const SizedBox(width: IDesignTokensLight.spacing1),
                          Text(
                            accessReasonOf(session),
                            style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeXs),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
              // 触摸端没有悬停，操作按钮常驻：不常驻的话在手机上永远点不到
              _action(c, 'pin', session.pinned ? '取消置顶$title' : '置顶$title',
                  () => widget.onPin?.call(session.id)),
              _action(c, session.archived ? 'undo' : 'box',
                  session.archived ? '取消归档$title' : '归档$title',
                  () => widget.onArchive?.call(session.id, !session.archived)),
              _action(c, 'trash', '删除 $title', () => _remove(session, groups)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _action(IColors c, String icon, String label, VoidCallback onTap) {
    return Semantics(
      label: label,
      button: true,
      child: GestureDetector(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
          child: IIcon(name: icon, size: 12, color: c.textTertiary),
        ),
      ),
    );
  }
}
