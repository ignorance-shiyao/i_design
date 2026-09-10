import 'package:flutter/material.dart';
import '../logic/image.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 图片与预览。
///
/// 加载中给骨架、失败给明文，都不留空白：空白会被当成「这里本来就没图」，
/// 而那和「加载失败」的处理完全不同——前者不必管，后者该刷新或报障。
class IImage extends StatefulWidget {
  const IImage({
    super.key,
    required this.src,
    this.alt = '',
    this.width,
    this.height,
    this.preview = true,
    this.group = const [],
    this.fit = BoxFit.cover,
  });

  final String src;
  final String alt;
  final double? width;
  final double? height;

  /// 点击后全屏预览
  final bool preview;

  /// 同组图片，预览时可左右翻页。不传则只预览自己
  final List<String> group;
  final BoxFit fit;

  @override
  State<IImage> createState() => _IImageState();
}

class _IImageState extends State<IImage> {
  IImageStatus _status = IImageStatus.loading;

  List<String> get _list => widget.group.isEmpty ? [widget.src] : widget.group;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    return Semantics(
      label: imageAlt(_status, widget.alt),
      image: true,
      child: GestureDetector(
        onTap: widget.preview && _status != IImageStatus.error ? _openPreview : null,
        child: Container(
          width: widget.width,
          height: widget.height,
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: c.bgSubtle,
            borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
          ),
          child: _status == IImageStatus.error
              ? _error(c)
              : Image.network(
                  widget.src,
                  fit: widget.fit,
                  width: widget.width,
                  height: widget.height,
                  loadingBuilder: (context, child, progress) {
                    if (progress == null) return child;
                    return Container(color: c.bgMuted);
                  },
                  errorBuilder: (context, error, stack) {
                    // setState 不能在 build 里直接调，推到下一帧
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      if (mounted && _status != IImageStatus.error) {
                        setState(() => _status = IImageStatus.error);
                      }
                    });
                    return _error(c);
                  },
                ),
        ),
      ),
    );
  }

  Widget _error(IColors c) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            IIcon('file-image', size: 20, color: c.textTertiary),
            const SizedBox(height: IDesignTokensLight.spacing1),
            Text(
              '加载失败',
              style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeXs),
            ),
          ],
        ),
      );

  void _openPreview() {
    Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false,
        barrierColor: const Color(0xB8000000),
        pageBuilder: (_, __, ___) => _ImageViewer(
          images: _list,
          initial: _list.indexOf(widget.src).clamp(0, _list.length - 1),
          alt: widget.alt,
        ),
      ),
    );
  }
}

class _ImageViewer extends StatefulWidget {
  const _ImageViewer({required this.images, required this.initial, required this.alt});
  final List<String> images;
  final int initial;
  final String alt;

  @override
  State<_ImageViewer> createState() => _ImageViewerState();
}

class _ImageViewerState extends State<_ImageViewer> {
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
