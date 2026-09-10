import 'package:flutter/material.dart';
import '../logic/mention.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 提及。
///
/// 触发判定走公共层：邮箱里的 @ 不该弹、打完空格就该收起、查询串有长度上限。
/// 三条缺一条都会让候选在不该弹的时候弹出来。
class IMentions extends StatefulWidget {
  const IMentions({
    super.key,
    required this.options,
    this.controller,
    this.onChanged,
    this.onSelected,
    this.symbols = const ['@'],
    this.placeholder = '',
    this.rows = 3,
  });

  final List<IMentionOption> options;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final ValueChanged<IMentionOption>? onSelected;

  /// 触发符，可以多个：@ 提人、/ 唤起命令
  final List<String> symbols;
  final String placeholder;
  final int rows;

  @override
  State<IMentions> createState() => _IMentionsState();
}

class _IMentionsState extends State<IMentions> {
  late final TextEditingController _controller = widget.controller ?? TextEditingController();
  IMentionTrigger? _trigger;
  List<IMentionOption> _matches = const [];
  int _active = 0;

  @override
  void dispose() {
    if (widget.controller == null) _controller.dispose();
    super.dispose();
  }

  void _sync() {
    final text = _controller.text;
    final caret = _controller.selection.baseOffset;
    final trigger = findMention(text, caret < 0 ? text.length : caret, symbols: widget.symbols);
    setState(() {
      _trigger = trigger;
      _matches = trigger == null ? const [] : filterMentions(widget.options, trigger.query);
      _active = 0;
    });
  }

  void _choose(IMentionOption option) {
    final trigger = _trigger;
    if (trigger == null) return;
    final caret = _controller.selection.baseOffset;
    final next = applyMention(
      _controller.text,
      trigger,
      option.label,
      caret < 0 ? _controller.text.length : caret,
    );
    _controller.value = TextEditingValue(
      text: next.text,
      // 光标要落回插入点之后，否则用户接着打字会打在句首
      selection: TextSelection.collapsed(offset: next.caret),
    );
    setState(() {
      _trigger = null;
      _matches = const [];
    });
    widget.onChanged?.call(next.text);
    widget.onSelected?.call(option);
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final open = _trigger != null && _matches.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        TextField(
          controller: _controller,
          minLines: widget.rows,
          maxLines: widget.rows + 3,
          decoration: InputDecoration(
            hintText: widget.placeholder,
            hintStyle: TextStyle(color: c.textTertiary),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
              borderSide: BorderSide(color: c.border),
            ),
          ),
          style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeMd),
          onChanged: (text) {
            widget.onChanged?.call(text);
            _sync();
          },
          onTap: _sync,
        ),

        // 候选面板贴在输入框下方，而不是跟着光标走：
        // 拿不到插入点的像素位置，靠镜像反推又会被中文输入法的组合态带偏
        if (open)
          Container(
            margin: const EdgeInsets.only(top: IDesignTokensLight.spacing1),
            constraints: const BoxConstraints(maxHeight: 220),
            decoration: BoxDecoration(
              color: c.bgElevated,
              border: Border.all(color: c.border),
              borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
            ),
            child: ListView.builder(
              shrinkWrap: true,
              padding: const EdgeInsets.all(IDesignTokensLight.spacing1),
              itemCount: _matches.length,
              itemBuilder: (context, i) {
                final option = _matches[i];
                return GestureDetector(
                  onTap: () => _choose(option),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: IDesignTokensLight.spacing3,
                      vertical: IDesignTokensLight.spacing2,
                    ),
                    decoration: BoxDecoration(
                      // 高亮项用淡底色块，不用一条重边线
                      color: i == _active ? c.brandSubtle : null,
                      borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
                    ),
                    child: Row(
                      children: [
                        Text(
                          option.label,
                          style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeMd),
                        ),
                        if (option.desc.isNotEmpty) ...[
                          const SizedBox(width: IDesignTokensLight.spacing2),
                          Text(
                            option.desc,
                            style: TextStyle(
                              color: c.textTertiary,
                              fontSize: IDesignTokensLight.fontSizeXs,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }
}
