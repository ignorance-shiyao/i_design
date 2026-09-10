import 'package:flutter/material.dart';
import '../logic/select.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 自动完成。
///
/// 与 Select 的分工：Select 的值必须来自选项，自动完成的值可以是用户自己敲的，
/// 候选只是提示。因此没有高亮任何一条时，提交不该被替换成第一条候选。
class IAutoComplete extends StatefulWidget {
  const IAutoComplete({
    super.key,
    this.value = '',
    this.onChanged,
    required this.options,
    this.placeholder = '',
    this.limit = 8,
    this.disabled = false,
    this.onSelected,
  });

  final String value;
  final ValueChanged<String>? onChanged;
  final List<ISuggestion> options;
  final String placeholder;

  /// 最多列出几条。列太多不如让用户再敲一个字
  final int limit;
  final bool disabled;
  final ValueChanged<ISuggestion>? onSelected;

  @override
  State<IAutoComplete> createState() => _IAutoCompleteState();
}

class _IAutoCompleteState extends State<IAutoComplete> {
  final _link = LayerLink();
  final _focus = FocusNode();
  late final TextEditingController _controller = TextEditingController(text: widget.value);
  OverlayEntry? _entry;
  int _active = -1;

  @override
  void initState() {
    super.initState();
    _focus.addListener(() => _focus.hasFocus ? _open() : _close());
  }

  @override
  void didUpdateWidget(IAutoComplete old) {
    super.didUpdateWidget(old);
    if (old.value != widget.value && _controller.text != widget.value) {
      _controller.text = widget.value;
    }
  }

  @override
  void dispose() {
    _close();
    _controller.dispose();
    _focus.dispose();
    super.dispose();
  }

  List<ISuggestion> get _matches =>
      filterSuggestions(widget.options, _controller.text, limit: widget.limit);

  void _open() {
    if (widget.disabled || _entry != null) return;
    _entry = OverlayEntry(builder: _panel);
    Overlay.of(context).insert(_entry!);
  }

  void _close() {
    _entry?.remove();
    _entry = null;
    _active = -1;
  }

  void _refresh() => _entry?.markNeedsBuild();

  void _choose(ISuggestion item) {
    if (item.disabled) return;
    _controller.text = item.value;
    widget.onChanged?.call(item.value);
    widget.onSelected?.call(item);
    _focus.unfocus();
    _close();
  }

  Widget _panel(BuildContext context) {
    final c = iColorsOf(context);
    final matches = _matches;
    if (matches.isEmpty) return const SizedBox.shrink();

    return Positioned(
      width: (context.findRenderObject() as RenderBox?)?.size.width ?? 240,
      child: CompositedTransformFollower(
        link: _link,
        showWhenUnlinked: false,
        offset: const Offset(0, IDesignTokensLight.controlHeightMd + 4),
        child: Material(
          color: c.bgElevated,
          elevation: 4,
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 280),
            child: ListView.builder(
              padding: const EdgeInsets.all(IDesignTokensLight.spacing1),
              shrinkWrap: true,
              itemCount: matches.length,
              itemBuilder: (context, i) {
                final item = matches[i];
                return InkWell(
                  onTap: () => _choose(item),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: IDesignTokensLight.spacing3,
                      vertical: IDesignTokensLight.spacing2,
                    ),
                    decoration: BoxDecoration(
                      // 高亮态用淡底色块，键盘与指针共用同一个：分成两套时
                      // 屏幕上会同时亮两条，用户不知道确认会选中哪个
                      color: i == _active ? c.bgSubtle : null,
                      borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
                    ),
                    child: RichText(
                      text: TextSpan(
                        // 命中段落由公共层切好：各端自己找位置，大小写不一致时会错位
                        children: [
                          for (final part in matchParts(item.text, _controller.text))
                            TextSpan(
                              text: part.text,
                              style: TextStyle(
                                // 命中的片段加重而不是换个颜色：颜色在灰度打印与
                                // 色觉障碍下会失效，字重不会
                                color: part.hit ? c.brand : (item.disabled ? c.textTertiary : c.text),
                                fontWeight: part.hit ? FontWeight.w500 : FontWeight.w400,
                                fontSize: IDesignTokensLight.fontSizeSm,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    return CompositedTransformTarget(
      link: _link,
      child: TextField(
        controller: _controller,
        focusNode: _focus,
        enabled: !widget.disabled,
        decoration: InputDecoration(
          isDense: true,
          hintText: widget.placeholder,
          hintStyle: TextStyle(color: c.textTertiary),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: IDesignTokensLight.spacing3,
            vertical: IDesignTokensLight.spacing2,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
            borderSide: BorderSide(color: c.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
            borderSide: BorderSide(color: c.brand),
          ),
        ),
        style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeMd),
        onChanged: (value) {
          // 每次改动都把高亮清掉：留着上一次的高亮，确认会选中一个与当前输入无关的项
          _active = -1;
          widget.onChanged?.call(value);
          _open();
          _refresh();
        },
      ),
    );
  }
}
