import 'package:flutter/material.dart';
import '../logic/color.dart' as logic;
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 取色器。
///
/// 色彩换算走公共层的同一套规则：同一个仓库里出现两份「什么叫更亮一点」，
/// 迟早会在某个组件上对不上。这一端只负责把手势换成饱和度与明度。
class IColorPicker extends StatefulWidget {
  const IColorPicker({
    super.key,
    this.value = '#5e7ce0',
    this.onChanged,
    this.presets = const [
      '#5e7ce0', '#0f8a68', '#b7622a', '#c2413d',
      '#7a4ee0', '#1f86b8', '#1d2129', '#86909c',
    ],
    this.showContrast = true,
  });

  final String value;
  final ValueChanged<String>? onChanged;

  /// 常用色，点一下直接取用
  final List<String> presets;

  /// 显示对比度读数：挑主色时最该看的就是这个
  final bool showContrast;

  @override
  State<IColorPicker> createState() => _IColorPickerState();
}

class _IColorPickerState extends State<IColorPicker> {
  final _areaKey = GlobalKey();
  late logic.IHsv _hsv = logic.hexToHsv(widget.value);

  @override
  void didUpdateWidget(IColorPicker old) {
    super.didUpdateWidget(old);
    if (old.value != widget.value) _hsv = logic.hexToHsv(widget.value);
  }

  void _commit(logic.IHsv next) {
    setState(() => _hsv = next);
    widget.onChanged?.call(logic.hsvToHex(next));
  }

  Color _parse(String hex) => Color(int.parse(hex.replaceFirst('#', 'ff'), radix: 16));

  /// 饱和度-明度方块：横轴是饱和度，纵轴是明度（上亮下暗）
  void _pickFromArea(Offset global) {
    final box = _areaKey.currentContext?.findRenderObject() as RenderBox?;
    if (box == null) return;
    final local = box.globalToLocal(global);
    final s = (local.dx / box.size.width).clamp(0.0, 1.0);
    final v = 1 - (local.dy / box.size.height).clamp(0.0, 1.0);
    _commit(logic.IHsv(h: _hsv.h, s: s, v: v));
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final readout = logic.colorReadout(widget.value);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: 232,
          height: 132,
          child: GestureDetector(
            onPanDown: (d) => _pickFromArea(d.globalPosition),
            onPanUpdate: (d) => _pickFromArea(d.globalPosition),
            child: Container(
              key: _areaKey,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
                // 白到透明横向、透明到黑纵向，叠在纯色相上就得到 HSV 方块
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [Colors.white, HSVColor.fromAHSV(1, _hsv.h, 1, 1).toColor()],
                ),
              ),
              foregroundDecoration: BoxDecoration(
                borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
                gradient: const LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Colors.black],
                ),
              ),
              child: Stack(
                children: [
                  Positioned(
                    left: _hsv.s * 232 - 6,
                    top: (1 - _hsv.v) * 132 - 6,
                    child: Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),

        Slider(
          value: _hsv.h,
          min: 0,
          max: 359,
          onChanged: (h) => _commit(logic.IHsv(h: h, s: _hsv.s, v: _hsv.v)),
        ),

        Row(
          children: [
            Text(
              widget.value,
              style: TextStyle(
                color: c.text,
                fontSize: IDesignTokensLight.fontSizeSm,
                fontFamily: 'monospace',
              ),
            ),
            const Spacer(),
            // 对比度就画在这个颜色上，直接看得出字读不读得清
            if (widget.showContrast)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: IDesignTokensLight.spacing2,
                  vertical: IDesignTokensLight.spacing1,
                ),
                decoration: BoxDecoration(
                  color: _parse(widget.value),
                  borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
                ),
                child: Text(
                  '${readout.ratio}:1',
                  style: TextStyle(
                    color: _parse(readout.ink),
                    fontSize: IDesignTokensLight.fontSizeXs,
                  ),
                ),
              ),
          ],
        ),
        if (widget.showContrast)
          Padding(
            padding: const EdgeInsets.only(top: IDesignTokensLight.spacing2),
            child: Text(
              readout.passesText
                  ? '正文与控件文字都够读'
                  : readout.passesUi
                      ? '够做控件文字，正文偏低'
                      : '对比度不足，文字会看不清',
              style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeXs),
            ),
          ),

        Padding(
          padding: const EdgeInsets.only(top: IDesignTokensLight.spacing3),
          child: Wrap(
            spacing: IDesignTokensLight.spacing1,
            runSpacing: IDesignTokensLight.spacing1,
            children: [
              for (final preset in widget.presets)
                GestureDetector(
                  onTap: () => widget.onChanged?.call(preset),
                  child: Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: _parse(preset),
                      borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
                      border: Border.all(color: c.hairline),
                    ),
                    child: preset.toLowerCase() == widget.value.toLowerCase()
                        ? const Center(child: IIcon('check', size: 12, color: Colors.white))
                        : null,
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}
