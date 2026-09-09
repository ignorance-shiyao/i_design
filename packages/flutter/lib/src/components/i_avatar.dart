import 'package:flutter/material.dart';
import '../tokens/tokens.dart';

/// 头像的取字与配色规则。
///
/// 这是 @i-design/common 里 initialsOf / tintOf 的 Dart 移植：Flutter 无法直接
/// 复用 TypeScript，因此规则在此重写一遍，但必须与公共层逐字对应——
/// 同一个姓名在 Web、小程序与 Flutter 上必须得到相同的缩写与底色。
class IAvatarRule {
  IAvatarRule._();

  static const palette = <Color>[
    Color(0xFF5E7CE0),
    Color(0xFF3AC295),
    Color(0xFFFA9841),
    Color(0xFFF66F6A),
    Color(0xFF7048E8),
    Color(0xFF0F766E),
  ];

  /// 中文取末两字（更能区分同姓），西文取首字母缩写
  static String initialsOf(String name) {
    final trimmed = name.trim();
    if (trimmed.isEmpty) return '';
    if (RegExp(r'[一-龥]').hasMatch(trimmed)) {
      return trimmed.length <= 2 ? trimmed : trimmed.substring(trimmed.length - 2);
    }
    return trimmed
        .split(RegExp(r'\s+'))
        .take(2)
        .map((part) => part.isEmpty ? '' : part[0].toUpperCase())
        .join();
  }

  /// 字符码求和取模：与 TS 版同一算法，因此结果逐值相同
  static Color tintOf(String name) {
    if (name.isEmpty) return palette[0];
    final sum = name.runes.fold<int>(0, (acc, ch) => acc + ch);
    return palette[sum % palette.length];
  }
}

class IAvatar extends StatelessWidget {
  const IAvatar({
    super.key,
    this.name = '',
    this.imageUrl,
    this.size = 32,
    this.square = false,
    this.colorful = true,
  });

  final String name;
  final String? imageUrl;
  final double size;
  final bool square;
  final bool colorful;

  @override
  Widget build(BuildContext context) {
    final initials = IAvatarRule.initialsOf(name);
    final tint = colorful ? IAvatarRule.tintOf(name) : IAvatarRule.palette[0];
    final radius = square
        ? BorderRadius.circular(IDesignTokensLight.radiusMd)
        : BorderRadius.circular(size / 2);

    return ClipRRect(
      borderRadius: radius,
      child: Container(
        width: size,
        height: size,
        color: tint,
        alignment: Alignment.center,
        child: imageUrl != null
            ? Image.network(
                imageUrl!,
                width: size,
                height: size,
                fit: BoxFit.cover,
                // 加载失败静默降级到文字，不留破图——与 Web 端行为一致
                errorBuilder: (_, __, ___) => _initialsText(initials),
              )
            : _initialsText(initials),
      ),
    );
  }

  Widget _initialsText(String initials) => Text(
        initials,
        style: TextStyle(
          color: Colors.white,
          fontSize: (size * 0.38).clamp(11, 999),
          fontWeight: FontWeight.w500,
        ),
      );
}
