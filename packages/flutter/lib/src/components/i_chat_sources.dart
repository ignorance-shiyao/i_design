import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

@immutable
class IChatSource {
  const IChatSource({required this.title, this.url, this.origin});

  final String title;
  /// 来源地址。这一端目前只存不开——真要接 url_launcher 时，
  /// **先过 `safeHref`**：这个字段来自模型与工具输出，属于不可信内容，
  /// 而 url_launcher 会把任意 scheme 直接交给操作系统，没有浏览器兜底。
  final String? url;

  /// 来源站点或文件名
  final String? origin;
}

/// 回答引用的来源。
///
/// 编号与正文里的角标一一对应：来源如果不能被追溯回具体某句话，
/// 它就只是一排装饰性的链接。打开链接由调用方处理——
/// 是走内置 WebView 还是外部浏览器，是应用自己的决定。
class IChatSources extends StatelessWidget {
  const IChatSources({super.key, required this.sources, this.onTap});

  final List<IChatSource> sources;
  final void Function(int index, IChatSource source)? onTap;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    return Wrap(
      spacing: IDesignTokensLight.spacing2,
      runSpacing: IDesignTokensLight.spacing2,
      children: [
        for (var i = 0; i < sources.length; i++)
          InkWell(
            onTap: onTap == null ? null : () => onTap!(i, sources[i]),
            borderRadius: BorderRadius.circular(IDesignTokensLight.radiusFull),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 260),
              padding: const EdgeInsets.symmetric(
                horizontal: IDesignTokensLight.spacing3,
                vertical: IDesignTokensLight.spacing1,
              ),
              decoration: BoxDecoration(
                color: c.bgElevated,
                border: Border.all(color: c.border),
                borderRadius: BorderRadius.circular(IDesignTokensLight.radiusFull),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 16,
                    height: 16,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: c.bgMuted, shape: BoxShape.circle),
                    child: Text(
                      '${i + 1}',
                      style: TextStyle(color: c.textTertiary, fontSize: 10),
                    ),
                  ),
                  const SizedBox(width: IDesignTokensLight.spacing2),
                  Flexible(
                    child: Text(
                      sources[i].title,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: c.textSecondary,
                        fontSize: IDesignTokensLight.fontSizeXs,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
