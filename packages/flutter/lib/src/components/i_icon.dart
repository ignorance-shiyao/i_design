import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../icons/icons.dart';

/// 线性图标。
///
/// 图标数据由 @i-design/common 编译而来（见 scripts/build-icons.mjs），
/// 因此与 Web、小程序三端是同一批形状。颜色默认取当前文字色，
/// 于是「图标跟着文字走」这条规则在 Flutter 上同样成立。
class IIcon extends StatelessWidget {
  const IIcon(
    this.name, {
    super.key,
    this.size = 16,
    this.color,
    this.strokeWidth = 1.8,
    this.semanticLabel,
  });

  final String name;
  final double size;
  final Color? color;
  final double strokeWidth;

  /// 不传时视为装饰性图标，对读屏隐藏
  final String? semanticLabel;

  /// Color → CSS 十六进制。用 red/green/blue 而不是 value：
  /// 后者在较新的 Flutter 里已标记废弃，前者跨版本都可用。
  String _hex(Color c) {
    final rgb = (c.red << 16) | (c.green << 8) | c.blue;
    return '#${rgb.toRadixString(16).padLeft(6, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final resolved = color ?? DefaultTextStyle.of(context).style.color ?? Colors.black;
    final svg = SvgPicture.string(
      iDesignIconSvg(name, color: _hex(resolved), strokeWidth: strokeWidth),
      width: size,
      height: size,
    );
    return semanticLabel == null
        ? ExcludeSemantics(child: svg)
        : Semantics(label: semanticLabel, image: true, child: svg);
  }
}
