
/// 上传相关的纯函数（对应 packages/common/src/logic/upload.ts）。
///
/// 选择文件的方式各端不同（浏览器 input、小程序 chooseMessageFile、
/// 移动端 file picker），但「文件多大、允不允许」这两件事只有一份规则。
library;

import 'package:flutter/foundation.dart';

enum IUploadStatus { ready, uploading, success, error }

@immutable
class IUploadFile {
  const IUploadFile({
    required this.uid,
    required this.name,
    required this.size,
    this.status = IUploadStatus.ready,
    this.percent = 0,
    this.error,
    this.path,
  });

  /// 列表内唯一标识；重传时复用同一个 id，避免列表跳位
  final String uid;
  final String name;
  final int size;
  final IUploadStatus status;

  /// 0-100
  final int percent;

  /// 失败原因，直接展示给用户
  final String? error;

  /// 本地文件路径（Flutter 端没有 Web 的 File 对象）
  final String? path;

  IUploadFile copyWith({
    IUploadStatus? status,
    int? percent,
    String? error,
    String? path,
  }) =>
      IUploadFile(
        uid: uid,
        name: name,
        size: size,
        status: status ?? this.status,
        percent: percent ?? this.percent,
        error: error ?? this.error,
        path: path ?? this.path,
      );
}

/// 字节数换成人能读的单位；上传场景不需要精确到字节
String formatSize(int bytes) {
  if (bytes < 1024) return '$bytes B';
  if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
  return '${(bytes / 1024 / 1024).toStringAsFixed(1)} MB';
}

/// accept 校验：支持扩展名（.png）与 MIME（image/*、image/png）
bool matchAccept(String fileName, String mimeType, String accept) {
  if (accept.trim().isEmpty) return true;
  final name = fileName.toLowerCase();
  final type = mimeType.toLowerCase();
  return accept
      .split(',')
      .map((rule) => rule.trim().toLowerCase())
      .where((rule) => rule.isNotEmpty)
      .any((rule) {
    if (rule.startsWith('.')) return name.endsWith(rule);
    if (rule.endsWith('/*')) return type.startsWith(rule.substring(0, rule.length - 1));
    return type == rule;
  });
}
