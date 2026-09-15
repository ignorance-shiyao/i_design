import 'dart:ui' show FontFeature;
import 'package:flutter/material.dart';
import '../logic/exportjob.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_button.dart';
import 'i_icon.dart';

/// 导出任务卡（astra.md 的 B11 后半）。
///
/// 任务怎么排队、文件怎么生成、下载走哪个地址，都在调用方手里——
/// 这个组件不碰任何 IO，它只负责把「现在到哪一步、还能做什么」说清楚。
///
/// 两条规矩落在版面上：进度条只在总数已知时出现（假进度条是谎）；
/// 出处永远在（什么时候、按哪套筛选、哪些列、多少行），它不是可选的补充说明，
/// 是这份文件能不能拿去对账的前提。
///
/// 判断全在 logic/exportjob.dart，与 Web 端同一份规则。
class IExportJob extends StatelessWidget {
  const IExportJob({
    super.key,
    this.status = IExportStatus.queued,
    this.queuePosition,
    this.processed,
    this.total,
    this.expiresAt,
    this.error,
    this.meta,
    this.now,
    this.onCancel,
    this.onDownload,
    this.onRegenerate,
    this.onRetry,
  });

  final IExportStatus status;

  /// 队列里前面还有几个
  final int? queuePosition;
  final int? processed;

  /// 总行数。**不知道就不要给**——给一个猜的数就成了假进度条
  final int? total;

  /// 文件的过期时刻（毫秒时间戳）
  final int? expiresAt;
  final String? error;

  /// 这份导出的出处。永远显示
  final IExportMeta? meta;

  /// 当前时间，受控——好让演示与测试给得出确定的值
  final int? now;

  final VoidCallback? onCancel;

  /// 文件名由共享逻辑拼出来，交给调用方去落地
  final void Function(String fileName)? onDownload;

  /// 重新生成一份（过期、取消之后）
  final VoidCallback? onRegenerate;
  final VoidCallback? onRetry;

  /* 图标名写错在界面上是个空位，不会有任何报错，所以这张表是穷举的 */
  static const Map<IExportStatus, String> _icons = {
    IExportStatus.queued: 'clock',
    IExportStatus.running: 'refresh',
    IExportStatus.ready: 'download',
    IExportStatus.expired: 'history',
    IExportStatus.failed: 'error-circle',
    IExportStatus.cancelled: 'close',
  };

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final view = describeExport(
      status: status,
      queuePosition: queuePosition,
      processed: processed,
      total: total,
      expiresAt: expiresAt,
      error: error,
      now: now ?? DateTime.now().millisecondsSinceEpoch,
    );

    // 图标底色跟着语气走，但颜色不是唯一线索：label 那行字一直在
    final Color iconColor = switch (view.tone) {
      IExportTone.progress => c.brand,
      IExportTone.success => c.success,
      IExportTone.danger => c.danger,
      IExportTone.neutral => c.textSecondary,
    };
    final Color iconBg = switch (view.tone) {
      IExportTone.progress => c.brandSubtle,
      IExportTone.success => c.successSubtle,
      IExportTone.danger => c.dangerSubtle,
      IExportTone.neutral => c.bgSubtle,
    };

    final provenance = meta == null ? const <String>[] : exportProvenance(meta!);
    final fileName = meta == null ? '' : exportFileName(meta!);

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: IDesignTokensLight.spacing4,
        vertical: IDesignTokensLight.spacing3,
      ),
      decoration: BoxDecoration(
        color: c.bgElevated,
        border: Border.all(color: c.hairline),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                alignment: Alignment.center,
                decoration: BoxDecoration(color: iconBg, shape: BoxShape.circle),
                child: IIcon(_icons[view.status] ?? 'clock', size: 16, color: iconColor),
              ),
              const SizedBox(width: IDesignTokensLight.spacing3),
              Expanded(
                child: Semantics(
                  liveRegion: true,
                  label: '${view.label}，${view.detail}',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        view.label,
                        style: TextStyle(fontSize: IDesignTokensLight.fontSizeMd, color: c.text),
                      ),
                      Text(
                        view.detail,
                        style: TextStyle(
                          fontSize: IDesignTokensLight.fontSizeSm,
                          color: c.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: IDesignTokensLight.spacing2),
              if (view.action == IExportAction.cancel)
                IButton(label: '取消', size: IButtonSize.sm, onPressed: onCancel)
              else if (view.action == IExportAction.download)
                IButton(
                  label: '下载',
                  size: IButtonSize.sm,
                  variant: IButtonVariant.primary,
                  onPressed: onDownload == null ? null : () => onDownload!(fileName),
                )
              else if (view.action == IExportAction.regenerate)
                IButton(label: '重新生成', size: IButtonSize.sm, onPressed: onRegenerate)
              else if (view.action == IExportAction.retry)
                IButton(label: '重试', size: IButtonSize.sm, onPressed: onRetry),
            ],
          ),

          // 总数未知时这里什么也不画：走到 90% 就卡住的条子比没有条子更让人不敢离开
          if (view.percent != null) ...[
            const SizedBox(height: IDesignTokensLight.spacing3),
            ClipRRect(
              borderRadius: BorderRadius.circular(IDesignTokensLight.radiusFull),
              child: LinearProgressIndicator(
                value: view.percent! / 100,
                minHeight: 4,
                backgroundColor: c.bgSubtle,
                // 纯色，不用渐变：同一个进度在不同宽度的卡片上得是同一个观感
                valueColor: AlwaysStoppedAnimation<Color>(c.brand),
              ),
            ),
          ],

          // 出处永远在：它是这份文件能不能拿去对账的前提
          if (provenance.isNotEmpty) ...[
            const SizedBox(height: IDesignTokensLight.spacing3),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(
                horizontal: IDesignTokensLight.spacing3,
                vertical: IDesignTokensLight.spacing2,
              ),
              decoration: BoxDecoration(
                color: c.bgSubtle,
                borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  for (final line in provenance)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 2),
                      child: Text(
                        line,
                        style: TextStyle(
                          fontSize: IDesignTokensLight.fontSizeSm,
                          color: c.textSecondary,
                          // 等宽数字：一列数字不对齐，扫一眼就看不出哪份更大
                          fontFeatures: const [FontFeature.tabularFigures()],
                        ),
                      ),
                    ),
                  if (fileName.isNotEmpty)
                    Text(
                      fileName,
                      style: TextStyle(
                        fontSize: IDesignTokensLight.fontSizeXs,
                        color: c.textTertiary,
                        fontFamily: 'monospace',
                      ),
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
