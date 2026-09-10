/// 图片预览变换的 Dart 移植（对应 packages/common/src/logic/image.ts）。
///
/// 缩放边界与旋转归一化各端各写一遍，就会出现「一端能缩到 10 倍、
/// 另一端 3 倍就到头」，同一份设计稿在两端上体验不同。
library;

import 'dart:math' as math;

class IImageTransform {
  const IImageTransform({this.scale = 1, this.rotate = 0, this.x = 0, this.y = 0});
  final double scale;

  /// 角度，始终归一化到 [0, 360)
  final double rotate;
  final double x;
  final double y;

  IImageTransform copyWith({double? scale, double? rotate, double? x, double? y}) =>
      IImageTransform(
        scale: scale ?? this.scale,
        rotate: rotate ?? this.rotate,
        x: x ?? this.x,
        y: y ?? this.y,
      );

  @override
  bool operator ==(Object other) =>
      other is IImageTransform &&
      other.scale == scale &&
      other.rotate == rotate &&
      other.x == x &&
      other.y == y;

  @override
  int get hashCode => Object.hash(scale, rotate, x, y);

  @override
  String toString() => 'IImageTransform($scale, $rotate, $x, $y)';
}

const IImageTransform kImageIdentity = IImageTransform();

/// 缩放范围。上限 4 倍：再大就只剩噪点，而用户会以为是图糊了
const double kImageMinScale = 0.5;
const double kImageMaxScale = 4;

IImageTransform zoomImage(IImageTransform transform, double delta) {
  final scale = math.min(kImageMaxScale, math.max(kImageMinScale, transform.scale + delta));
  // 缩回 1 倍时把位移一并归零：否则图缩小了却还偏在角落，用户得再拖回来
  return scale == 1
      ? transform.copyWith(scale: scale, x: 0, y: 0)
      : transform.copyWith(scale: scale);
}

/// 旋转。角度归一化到 [0, 360)，不让它一路加到 720——
/// 数字本身会漏进无障碍文案与调试信息里，「已旋转 720 度」没有意义。
IImageTransform rotateImage(IImageTransform transform, double delta) =>
    transform.copyWith(rotate: ((transform.rotate + delta) % 360 + 360) % 360);

/// 拖动。只有放大之后才允许拖——原尺寸时拖动会让图莫名其妙地跑出框
IImageTransform panImage(IImageTransform transform, double dx, double dy) {
  if (transform.scale <= 1) return transform;
  return transform.copyWith(x: transform.x + dx, y: transform.y + dy);
}

IImageTransform resetImage() => kImageIdentity;

/// 多图翻页。到头不循环。
///
/// 循环会让「这是最后一张」这个信息消失——用户点着点着又回到第一张，
/// 分不清是翻完了还是自己看漏了。
int stepImage(int current, int total, int delta) {
  if (total <= 0) return 0;
  return math.min(total - 1, math.max(0, current + delta));
}

enum IImageStatus { loading, loaded, error }

/// 加载失败时的无障碍文案。
///
/// 失败要显式说出来，而不是留一块空白或一个碎图标。
/// 空白会被当成「这里本来就没图」，而实际上是加载失败——两者的处理完全不同。
String imageAlt(IImageStatus status, String alt) {
  if (status == IImageStatus.error) return alt.isEmpty ? '图片加载失败' : '$alt（加载失败）';
  if (status == IImageStatus.loading) return alt.isEmpty ? '图片加载中' : '$alt（加载中）';
  return alt;
}
