import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show LogicalKeyboardKey;
import '../logic/taginput.dart' as logic;
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 输入标签。
///
/// 成词规则走公共层：粘贴同一段带逗号换行的文本，各端拆出来的标签数必须一样。
class ITagInput extends StatefulWidget {
  const ITagInput({
    super.key,
    this.value = const [],
    this.onChanged,
    this.placeholder = '输入后回车',
    this.allowDuplicate = false,
    this.max = 0,
    this.disabled = false,
    this.onReject,
  });

  final List<String> value;
  final ValueChanged<List<String>>? onChanged;
  final String placeholder;

  /// 允许重复。默认不允许——重复的标签在任何筛选场景里都是噪声
  final bool allowDuplicate;

  /// 最多几个
  final int max;
  final bool disabled;

  /// 拒绝的理由。不给理由的话，用户会以为组件坏了
  final ValueChanged<String>? onReject;

  @override
  State<ITagInput> createState() => _ITagInputState();
}

class _ITagInputState extends State<ITagInput> {
  final _controller = TextEditingController();
  final _focus = FocusNode();
  String _draft = '';

  @override
  void initState() {
    super.initState();
    _focus.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _controller.dispose();
    _focus.dispose();
    super.dispose();
  }

  bool get _full => widget.max > 0 && widget.value.length >= widget.max;

  String _reasonOf(logic.TagRejectReason kind) => switch (kind) {
        logic.TagRejectReason.duplicate => '已经有相同的标签了',
        logic.TagRejectReason.max => '最多只能添加 ${widget.max} 个',
        logic.TagRejectReason.empty => '空白不能作为标签',
      };

  void _commit(List<String> parts) {
    if (parts.isEmpty) return;
    final result = logic.addTags(
      widget.value,
      parts,
      allowDuplicate: widget.allowDuplicate,
      max: widget.max,
    );
    if (result.tags.length != widget.value.length) widget.onChanged?.call(result.tags);
    if (result.rejected != null) widget.onReject?.call(_reasonOf(result.rejected!));
  }

  void _onChanged(String text) {
    // 中途遇到分隔符就成词，最后一段留在输入框里继续编辑
    final split = logic.splitDraft(text);
    if (split.ready.isEmpty) {
      _draft = text;
      return;
    }
    _draft = split.rest;
    _controller.text = split.rest;
    _controller.selection = TextSelection.collapsed(offset: split.rest.length);
    _commit(split.ready);
  }

  void _onSubmitted(String text) {
    _commit(logic.splitTags(text));
    _draft = '';
    _controller.clear();
    // 提交后把焦点留住：连续输入几个标签时，每次都要重新点一下框太烦
    _focus.requestFocus();
  }

  KeyEventResult _onKey(FocusNode node, KeyEvent event) {
    if (event is! KeyDownEvent) return KeyEventResult.ignored;
    if (event.logicalKey != LogicalKeyboardKey.backspace) return KeyEventResult.ignored;
    // 只有输入框为空时才删末项：有内容时删字符是所有输入框的通用行为
    final result = logic.backspace(widget.value, _draft);
    if (!result.consumed) return KeyEventResult.ignored;
    widget.onChanged?.call(result.tags);
    return KeyEventResult.handled;
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final focused = _focus.hasFocus;

    return GestureDetector(
      // 整个框可点、焦点转给输入框：只有输入框可点的话，
      // 标签之间那几像素的空隙点下去毫无反应，用户会以为框是死的
      onTap: widget.disabled || _full ? null : _focus.requestFocus,
      child: Container(
        constraints: const BoxConstraints(minHeight: IDesignTokensLight.controlHeightMd),
        padding: const EdgeInsets.symmetric(
          horizontal: IDesignTokensLight.spacing3,
          vertical: IDesignTokensLight.spacing1,
        ),
        decoration: BoxDecoration(
          color: widget.disabled ? c.bgSubtle : c.bgElevated,
          border: Border.all(color: focused ? c.brand : c.border),
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
        ),
        child: Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: IDesignTokensLight.spacing2,
          runSpacing: IDesignTokensLight.spacing1,
          children: [
            for (var i = 0; i < widget.value.length; i++) _tag(c, widget.value[i], i),
            ConstrainedBox(
              constraints: const BoxConstraints(minWidth: 80, maxWidth: 200),
              child: Focus(
                onKeyEvent: _onKey,
                child: TextField(
                  controller: _controller,
                  focusNode: _focus,
                  enabled: !widget.disabled && !_full,
                  decoration: InputDecoration(
                    isDense: true,
                    border: InputBorder.none,
                    hintText: widget.value.isEmpty ? widget.placeholder : '',
                    hintStyle: TextStyle(color: c.textTertiary),
                  ),
                  style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeMd),
                  onChanged: _onChanged,
                  onSubmitted: _onSubmitted,
                ),
              ),
            ),
            // 上限就摆在框里，而不是等超了再弹提示：先说清楚比事后纠正省事
            if (widget.max > 0)
              Text(
                '${widget.value.length} / ${widget.max}',
                style: TextStyle(
                  color: _full ? c.warning : c.textTertiary,
                  fontSize: IDesignTokensLight.fontSizeXs,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _tag(IColors c, String tag, int index) => Container(
        padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing2, vertical: 2),
        decoration: BoxDecoration(
          color: c.bgSubtle,
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(tag, style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeSm)),
            if (!widget.disabled) ...[
              const SizedBox(width: IDesignTokensLight.spacing1),
              GestureDetector(
                onTap: () => widget.onChanged?.call(logic.removeTag(widget.value, index)),
                child: IIcon('close', size: 11, semanticLabel: '移除 $tag', color: c.textTertiary),
              ),
            ],
          ],
        ),
      );
}
