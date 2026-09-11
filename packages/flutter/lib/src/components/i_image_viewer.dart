import 'package:flutter/material.dart';
import '../logic/image.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 全屏图片预览。
///
/// 从 IImage 里拆出来单独成件：列表页、聊天记录、上传回显都要「点开看大图」，
/// 但它们未必用 IImage 渲染缩略图——预览层绑死在图片组件上，这些地方就得各自再写一遍。
/// 缩放、旋转、翻页的算法在 logic/image，与 Web 各端同一套。

/// 打开预览。半透明路由而不是 Dialog：Dialog 会被安全区裁掉，
/// 而预览本来就该铺满整块屏幕，包括刘海与手势条那两条。
Future<void> showIImageViewer(
  BuildContext context, {
  required List<String> images,
  int initial = 0,
  String alt = '',
}) {
  return Navigator.of(context).push(
    PageRouteBuilder(
      opaque: false,
      barrierColor: const Color(0xB8000000),
      pageBuilder: (_, __, ___) => IImageViewer(images: images, initial: initial, alt: alt),
    ),
  );
}

class IImageViewer extends StatefulWidget {
  const IImageViewer({super.key, required this.images, this.initial = 0, this.alt = ''});
  final List<String> images;
  final int initial;
  final String alt;

  @override
  State<IImageViewer> createState() => _IImageViewerState();
}

class _IImageViewerState extends State<IImageViewer> {
  late int _index = widget.initial;
  IImageTransform _transform = kImageIdentity;
  Offset? _dragFrom;

  void _step(int delta) {
    final next = stepImage(_index, widget.images.length, delta);
    if (next == _index) return;
    setState(() {
      _index = next;
      // 翻页后把缩放旋转归零：带着上一张的 3 倍放大翻过去，看到的是一块局部
      _transform = resetImage();
    });
  }

  @override
  Widget build(BuildContext context) {
    final multi = widget.images.length > 1;

    return Material(
      color: Colors.transparent,
      child: Stack(
        children: [
          Positioned.fill(
            child: GestureDetector(
              onTap: () => Navigator.of(context).pop(),
              onScaleStart: (d) => _dragFrom = d.focalPoint,
              onScaleUpdate: (d) {
                setState(() {
                  if (d.scale != 1) {
                    _transform = zoomImage(_transform, (d.scale - 1) * 0.1);
                  } else if (_dragFrom != null) {
                    final delta = d.focalPoint - _dragFrom!;
                    _dragFrom = d.focalPoint;
                    _transform = panImage(_transform, delta.dx, delta.dy);
                  }
                });
              },
              child: Center(
                child: Transform(
                  alignment: Alignment.center,
                  transform: Matrix4.identity()
                    ..translateByDouble(_transform.x, _transform.y, 0, 1)
                    ..scaleByDouble(_transform.scale, _transform.scale, 1, 1)
                    ..rotateZ(_transform.rotate * 3.1415926535 / 180),
                  child: Image.network(widget.images[_index], fit: BoxFit.contain),
                ),
              ),
            ),
          ),

          Positioned(
            top: IDesignTokensLight.spacing5,
            right: IDesignTokensLight.spacing5,
            child: _round('close', '关闭', () => Navigator.of(context).pop()),
          ),

          // 到头不循环：循环会让「这是最后一张」这个信息消失
          if (multi) ...[
            Positioned(
              left: IDesignTokensLight.spacing5,
              top: 0,
              bottom: 0,
              child: Center(
                child: _round('chevron-left', '上一张', _index == 0 ? null : () => _step(-1)),
              ),
            ),
            Positioned(
              right: IDesignTokensLight.spacing5,
              top: 0,
              bottom: 0,
              child: Center(
                child: _round(
                  'chevron-right',
                  '下一张',
                  _index == widget.images.length - 1 ? null : () => _step(1),
                ),
              ),
            ),
          ],

          Positioned(
            left: 0,
            right: 0,
            bottom: IDesignTokensLight.spacing6,
            child: Center(
              child: Container(
                padding: const EdgeInsets.all(IDesignTokensLight.spacing2),
                decoration: BoxDecoration(
                  color: const Color(0x80000000),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _round('minus', '缩小', () => setState(() => _transform = zoomImage(_transform, -0.25))),
                    SizedBox(
                      width: 56,
                      child: Text(
                        '${(_transform.scale * 100).round()}%',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.white, fontSize: 12),
                      ),
                    ),
                    _round('plus', '放大', () => setState(() => _transform = zoomImage(_transform, 0.25))),
                    _round('refresh', '旋转', () => setState(() => _transform = rotateImage(_transform, 90))),
                    _round('undo', '还原', () => setState(() => _transform = resetImage())),
                    if (multi)
                      SizedBox(
                        width: 56,
                        child: Text(
                          '${_index + 1} / ${widget.images.length}',
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: Colors.white, fontSize: 12),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _round(String icon, String label, VoidCallback? onTap) => Opacity(
        opacity: onTap == null ? 0.3 : 1,
        child: GestureDetector(
          onTap: onTap,
          child: Semantics(
            button: true,
            label: label,
            child: Container(
              width: 36,
              height: 36,
              decoration: const BoxDecoration(color: Color(0x24FFFFFF), shape: BoxShape.circle),
              child: Center(child: IIcon(icon, size: 16, color: Colors.white)),
            ),
          ),
        ),
      );
}
