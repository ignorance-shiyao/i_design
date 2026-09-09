import 'package:flutter/material.dart';
import '../logic/upload.dart';
import '../theme/i_theme.dart';
import '../logic/file.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

@immutable
class IPromptAttachment {
  const IPromptAttachment({required this.name, this.size});

  final String name;
  final int? size;
}

/// 会话输入台。
///
/// 与普通多行输入的差别在于它是一个操作台：文本随内容增高但有上限，
/// 附件、计数、发送与停止排在同一个框里。停止按钮占据发送按钮的位置，
/// 用户不必去别处找中断入口。
class IPromptInput extends StatefulWidget {
  const IPromptInput({
    super.key,
    required this.controller,
    this.placeholder = '问点什么…',
    this.enabled = true,
    this.generating = false,
    this.maxLength = 0,
    this.attachments = const [],
    this.hint = '',
    this.onSubmit,
    this.onStop,
    this.onAttach,
    this.onRemoveAttachment,
    this.tools,
  });

  final TextEditingController controller;
  final String placeholder;
  final bool enabled;

  /// 正在生成：发送按钮变为停止，输入仍可继续
  final bool generating;
  final int maxLength;
  final List<IPromptAttachment> attachments;
  final String hint;
  final ValueChanged<String>? onSubmit;
  final VoidCallback? onStop;
  final VoidCallback? onAttach;
  final ValueChanged<int>? onRemoveAttachment;

  /// 附件按钮之后的自定义工具，如模型选择
  final Widget? tools;

  @override
  State<IPromptInput> createState() => _IPromptInputState();
}

class _IPromptInputState extends State<IPromptInput> {
  final FocusNode _focus = FocusNode();

  @override
  void initState() {
    super.initState();
    _focus.addListener(() => setState(() {}));
    widget.controller.addListener(_onText);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onText);
    _focus.dispose();
    super.dispose();
  }

  void _onText() => setState(() {});

  int get _length => widget.controller.text.length;
  bool get _over => widget.maxLength > 0 && _length > widget.maxLength;
  bool get _canSend =>
      widget.enabled && !_over && widget.controller.text.trim().isNotEmpty;

  void _submit() {
    if (!_canSend) return;
    widget.onSubmit?.call(widget.controller.text);
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    return Container(
      decoration: BoxDecoration(
        color: widget.enabled ? c.bg : c.bgMuted,
        border: Border.all(color: _focus.hasFocus ? c.brand : c.borderStrong),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusXl),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (widget.attachments.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                IDesignTokensLight.spacing4,
                IDesignTokensLight.spacing3,
                IDesignTokensLight.spacing4,
                0,
              ),
              child: Wrap(
                spacing: IDesignTokensLight.spacing2,
                runSpacing: IDesignTokensLight.spacing2,
                children: [
                  for (var i = 0; i < widget.attachments.length; i++)
                    _FileChip(
                      file: widget.attachments[i],
                      onRemove: widget.onRemoveAttachment == null
                          ? null
                          : () => widget.onRemoveAttachment!(i),
                    ),
                ],
              ),
            ),

          Padding(
            padding: const EdgeInsets.fromLTRB(
              IDesignTokensLight.spacing4,
              IDesignTokensLight.spacing3,
              IDesignTokensLight.spacing4,
              IDesignTokensLight.spacing2,
            ),
            child: ConstrainedBox(
              // 高度跟随内容，但兜住上限，避免长输入把页面顶没
              constraints: const BoxConstraints(maxHeight: 200),
              child: TextField(
                controller: widget.controller,
                focusNode: _focus,
                enabled: widget.enabled,
                maxLines: null,
                minLines: 1,
                textInputAction: TextInputAction.newline,
                style: TextStyle(
                  color: c.text,
                  fontSize: IDesignTokensLight.fontSizeMd,
                  height: 1.7,
                ),
                decoration: InputDecoration(
                  isDense: true,
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.zero,
                  hintText: widget.placeholder,
                  hintStyle: TextStyle(color: c.textTertiary),
                ),
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.fromLTRB(
              IDesignTokensLight.spacing3,
              0,
              IDesignTokensLight.spacing3,
              IDesignTokensLight.spacing2,
            ),
            child: Row(
              children: [
                InkWell(
                  onTap: widget.onAttach,
                  borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: IDesignTokensLight.spacing2,
                      vertical: IDesignTokensLight.spacing1,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IIcon('plus', size: 14, color: c.textTertiary),
                        const SizedBox(width: IDesignTokensLight.spacing1),
                        Text(
                          '附件',
                          style: TextStyle(
                            color: c.textTertiary,
                            fontSize: IDesignTokensLight.fontSizeXs,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                if (widget.tools != null) widget.tools!,
                const Spacer(),
                if (widget.maxLength > 0)
                  Padding(
                    padding: const EdgeInsets.only(right: IDesignTokensLight.spacing2),
                    child: Text(
                      '$_length / ${widget.maxLength}',
                      style: TextStyle(
                        color: _over ? c.danger : c.textTertiary,
                        fontSize: IDesignTokensLight.fontSizeXs,
                      ),
                    ),
                  ),
                _SendButton(
                  generating: widget.generating,
                  enabled: _canSend,
                  onSend: _submit,
                  onStop: widget.onStop,
                ),
              ],
            ),
          ),

          if (widget.hint.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                IDesignTokensLight.spacing4,
                0,
                IDesignTokensLight.spacing4,
                IDesignTokensLight.spacing2,
              ),
              child: Text(
                widget.hint,
                style: TextStyle(
                  color: c.textTertiary,
                  fontSize: IDesignTokensLight.fontSizeXs,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _FileChip extends StatelessWidget {
  const _FileChip({required this.file, this.onRemove});

  final IPromptAttachment file;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: IDesignTokensLight.spacing2,
        vertical: IDesignTokensLight.spacing1,
      ),
      decoration: BoxDecoration(
        color: c.bgSubtle,
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // 类型色只上在图标上，文件名保持正文色：彩色文件名会和链接混淆
          Builder(builder: (context) {
            final type = fileTypeOf(file.name);
            final color =
                Color(kChartSlots[(type.slot == 0 ? 1 : type.slot) - 1]);
            return Container(
              width: 20,
              height: 20,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: color.withAlpha(31),
                borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
              ),
              child: IIcon(type.icon, size: 14, color: color),
            );
          }),
          const SizedBox(width: IDesignTokensLight.spacing2),
          Text(
            file.name,
            style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeXs),
          ),
          const SizedBox(width: IDesignTokensLight.spacing1),
          // 颜色不作为唯一线索：类型名同时以文字给出
          Text(
            file.size == null
                ? fileTypeOf(file.name).label
                : '${fileTypeOf(file.name).label} · ${formatSize(file.size!)}',
            style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeXs),
          ),
          if (onRemove != null) ...[
            const SizedBox(width: IDesignTokensLight.spacing2),
            InkWell(
              onTap: onRemove,
              child: IIcon('close', size: 12, color: c.textTertiary, semanticLabel: '移除附件'),
            ),
          ],
        ],
      ),
    );
  }
}

class _SendButton extends StatelessWidget {
  const _SendButton({
    required this.generating,
    required this.enabled,
    required this.onSend,
    this.onStop,
  });

  final bool generating;
  final bool enabled;
  final VoidCallback onSend;
  final VoidCallback? onStop;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    // 生成中：同一个位置变成「停止」，用户不必去别处找中断入口
    final background = generating ? c.text : c.brand;

    return Opacity(
      opacity: generating || enabled ? 1 : 0.45,
      child: InkWell(
        onTap: generating ? onStop : (enabled ? onSend : null),
        customBorder: const CircleBorder(),
        child: Container(
          width: 32,
          height: 32,
          alignment: Alignment.center,
          decoration: BoxDecoration(color: background, shape: BoxShape.circle),
          child: IIcon(
            generating ? 'close' : 'arrow-right',
            size: generating ? 14 : 16,
            color: c.bg,
            semanticLabel: generating ? '停止生成' : '发送',
          ),
        ),
      ),
    );
  }
}
