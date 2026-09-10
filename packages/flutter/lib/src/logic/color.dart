/// 取色器色彩换算的 Dart 移植（对应 packages/common/src/logic/color.ts）。
///
/// 通道一律用 0–1 归一化，与 palette.dart 的约定一致，不是 0–255。
/// Web 端第一版按 0–255 写，结果 rgb(30, 60, 90) 解析出来是纯白，
/// 而整条 HSV 通路都在极暗的一角打转——两处都不报错，只是颜色不对。
library;

import 'dart:math' as math;

class IHsv {
  const IHsv({required this.h, required this.s, required this.v});

  /// 色相，0-360
  final double h;

  /// 饱和度，0-1
  final double s;

  /// 明度，0-1
  final double v;

  @override
  bool operator ==(Object other) => other is IHsv && other.h == h && other.s == s && other.v == v;

  @override
  int get hashCode => Object.hash(h, s, v);

  @override
  String toString() => 'IHsv($h, $s, $v)';
}

class IRgb {
  const IRgb({required this.r, required this.g, required this.b});

  /// 三通道均为 0–1 归一化值
  final double r;
  final double g;
  final double b;
}

IHsv rgbToHsv(IRgb rgb) {
  final max = math.max(rgb.r, math.max(rgb.g, rgb.b));
  final min = math.min(rgb.r, math.min(rgb.g, rgb.b));
  final d = max - min;

  var h = 0.0;
  if (d != 0) {
    if (max == rgb.r) {
      h = ((rgb.g - rgb.b) / d) % 6;
    } else if (max == rgb.g) {
      h = (rgb.b - rgb.r) / d + 2;
    } else {
      h = (rgb.r - rgb.g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return IHsv(h: h, s: max == 0 ? 0 : d / max, v: max);
}

IRgb hsvToRgb(IHsv hsv) {
  final c = hsv.v * hsv.s;
  final x = c * (1 - ((hsv.h / 60) % 2 - 1).abs());
  final m = hsv.v - c;
  late double r, g, b;
  if (hsv.h < 60) {
    r = c; g = x; b = 0;
  } else if (hsv.h < 120) {
    r = x; g = c; b = 0;
  } else if (hsv.h < 180) {
    r = 0; g = c; b = x;
  } else if (hsv.h < 240) {
    r = 0; g = x; b = c;
  } else if (hsv.h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  return IRgb(r: r + m, g: g + m, b: b + m);
}

String rgbToHex(IRgb rgb) {
  String to(double v) =>
      (v.clamp(0.0, 1.0) * 255).round().toRadixString(16).padLeft(2, '0');
  return '#${to(rgb.r)}${to(rgb.g)}${to(rgb.b)}';
}

IRgb hexToRgb(String hex) {
  var value = hex.trim().replaceAll('#', '');
  if (value.length == 3) {
    value = value.split('').map((c) => '$c$c').join();
  }
  final int = int.parse(value.substring(0, 6), radix: 16);
  return IRgb(
    r: ((int >> 16) & 255) / 255,
    g: ((int >> 8) & 255) / 255,
    b: (int & 255) / 255,
  );
}

IHsv hexToHsv(String hex) => rgbToHsv(hexToRgb(hex));
String hsvToHex(IHsv hsv) => rgbToHex(hsvToRgb(hsv));

/// 解析用户输入。
///
/// 接受 #abc、#aabbcc、abc、aabbcc 与 rgb(1,2,3)——
/// 用户会从各种地方复制色值过来，只认一种写法等于把他们赶回去手工改格式。
String? parseColor(String input) {
  final text = input.trim().toLowerCase();

  final rgb = RegExp(r'^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)').firstMatch(text);
  if (rgb != null) {
    final r = int.parse(rgb.group(1)!);
    final g = int.parse(rgb.group(2)!);
    final b = int.parse(rgb.group(3)!);
    if (r > 255 || g > 255 || b > 255) return null;
    // CSS 里写的是 0–255，而 IRgb 是 0–1 归一化的，必须换算
    return rgbToHex(IRgb(r: r / 255, g: g / 255, b: b / 255));
  }

  final hex = RegExp(r'^#?([0-9a-f]{3}|[0-9a-f]{6})$').firstMatch(text);
  if (hex == null) return null;
  final body = hex.group(1)!;
  // 三位简写要展开成六位：#abc 与 #aabbcc 是同一个颜色，但只有后者能直接比对
  final full = body.length == 3 ? body.split('').map((c) => '$c$c').join() : body;
  return '#$full';
}

/// 相对亮度。必须先线性化再加权，直接拿 0–1 通道加权算出来的亮度是错的
double _luminance(IRgb rgb) {
  double lin(double v) => v <= 0.04045 ? v / 12.92 : math.pow((v + 0.055) / 1.055, 2.4).toDouble();
  return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}

/// 两色对比度，WCAG 定义
double contrastRatio(String a, String b) {
  final la = _luminance(hexToRgb(a));
  final lb = _luminance(hexToRgb(b));
  final hi = math.max(la, lb);
  final lo = math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

class IColorReadout {
  const IColorReadout({
    required this.ink,
    required this.ratio,
    required this.passesUi,
    required this.passesText,
  });

  /// 建议的前景色
  final String ink;
  final double ratio;

  /// 是否达到控件文字的 3:1 下限
  final bool passesUi;

  /// 是否达到正文的 4.5:1
  final bool passesText;
}

/// 这个颜色配白字还是深字，以及对比度够不够。
///
/// 取色器要当场把这件事说出来。用户挑的是「好看的颜色」，
/// 而好不好看和上面的字能不能读是两件事——不提示的话，
/// 一个明黄的主色会一路走到线上，然后才发现按钮上的白字看不见。
IColorReadout colorReadout(String hex) {
  final white = contrastRatio(hex, '#ffffff');
  final dark = contrastRatio(hex, '#1d2129');
  // 与 contrastText 同一条规则：优先白字，白字达不到 3:1 才换深字
  final ink = white >= 3 ? '#ffffff' : '#1d2129';
  final ratio = ink == '#ffffff' ? white : dark;
  return IColorReadout(
    ink: ink,
    ratio: (ratio * 100).round() / 100,
    passesUi: ratio >= 3,
    passesText: ratio >= 4.5,
  );
}
