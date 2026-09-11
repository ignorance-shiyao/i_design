import 'package:flutter/material.dart';
import '../logic/image.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_image_viewer.dart';
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
        pageBuilder: (_, __, ___) => IImageViewer(
          images: _list,
          initial: _list.indexOf(widget.src).clamp(0, _list.length - 1),
          alt: widget.alt,
        ),
      ),
    );
  }
}
