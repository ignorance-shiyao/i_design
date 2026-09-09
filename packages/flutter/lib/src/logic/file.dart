/// 文件类型识别：与 Web 端 logic/file.ts 同一份映射。
///
/// 「按扩展名给图标和颜色」这件事一旦让每处 UI 自己写，映射表就会分叉——
/// 上传列表把 .webp 当图片、附件条却当成未知类型，两处对同一个文件显示不同图标。
library;

enum IFileKind { image, document, sheet, code, archive, media, other }

class IFileType {
  const IFileType({
    required this.kind,
    required this.icon,
    required this.slot,
    required this.label,
  });

  final IFileKind kind;

  /// 图标名，取自本体系的图标库
  final String icon;

  /// 分类色槽位（对应 --i-chart-N）。
  /// 文件类型是「身份」而不是「程度」，因此用分类色而不是顺序色阶；
  /// 也不能用状态色——绿色的表格文件会被读成「校验通过」。
  final int slot;

  /// 给读屏用的中文类型名，不能只靠颜色区分
  final String label;
}

const Map<String, IFileKind> _ext = {
  'png': IFileKind.image, 'jpg': IFileKind.image, 'jpeg': IFileKind.image,
  'gif': IFileKind.image, 'webp': IFileKind.image, 'svg': IFileKind.image,
  'bmp': IFileKind.image, 'avif': IFileKind.image, 'ico': IFileKind.image,
  'heic': IFileKind.image,
  'pdf': IFileKind.document, 'doc': IFileKind.document, 'docx': IFileKind.document,
  'txt': IFileKind.document, 'md': IFileKind.document, 'rtf': IFileKind.document,
  'odt': IFileKind.document, 'pages': IFileKind.document, 'ppt': IFileKind.document,
  'pptx': IFileKind.document, 'key': IFileKind.document,
  'xls': IFileKind.sheet, 'xlsx': IFileKind.sheet, 'csv': IFileKind.sheet,
  'tsv': IFileKind.sheet, 'numbers': IFileKind.sheet,
  'js': IFileKind.code, 'ts': IFileKind.code, 'tsx': IFileKind.code,
  'jsx': IFileKind.code, 'vue': IFileKind.code, 'dart': IFileKind.code,
  'json': IFileKind.code, 'yaml': IFileKind.code, 'yml': IFileKind.code,
  'xml': IFileKind.code, 'html': IFileKind.code, 'css': IFileKind.code,
  'scss': IFileKind.code, 'py': IFileKind.code, 'go': IFileKind.code,
  'rs': IFileKind.code, 'java': IFileKind.code, 'sh': IFileKind.code,
  'sql': IFileKind.code,
  'zip': IFileKind.archive, 'rar': IFileKind.archive, '7z': IFileKind.archive,
  'tar': IFileKind.archive, 'gz': IFileKind.archive, 'bz2': IFileKind.archive,
  'xz': IFileKind.archive,
  'mp4': IFileKind.media, 'mov': IFileKind.media, 'avi': IFileKind.media,
  'mkv': IFileKind.media, 'webm': IFileKind.media, 'mp3': IFileKind.media,
  'wav': IFileKind.media, 'flac': IFileKind.media, 'aac': IFileKind.media,
  'm4a': IFileKind.media,
};

const Map<IFileKind, IFileType> _kinds = {
  IFileKind.image: IFileType(kind: IFileKind.image, icon: 'file-image', slot: 3, label: '图片'),
  IFileKind.document: IFileType(kind: IFileKind.document, icon: 'file-text', slot: 1, label: '文档'),
  IFileKind.sheet: IFileType(kind: IFileKind.sheet, icon: 'file-sheet', slot: 2, label: '表格'),
  IFileKind.code: IFileType(kind: IFileKind.code, icon: 'file-code', slot: 4, label: '代码'),
  IFileKind.archive: IFileType(kind: IFileKind.archive, icon: 'file-zip', slot: 6, label: '压缩包'),
  IFileKind.media: IFileType(kind: IFileKind.media, icon: 'file-media', slot: 5, label: '音视频'),
  IFileKind.other: IFileType(kind: IFileKind.other, icon: 'file', slot: 0, label: '文件'),
};

/// 从文件名取扩展名；没有扩展名或全是点的情况都算未知
String extensionOf(String name) {
  final base = name.split(RegExp(r'[\\/]')).last;
  final dot = base.lastIndexOf('.');
  if (dot <= 0 || dot == base.length - 1) return '';
  return base.substring(dot + 1).toLowerCase();
}

/// 按文件名判断类型，给出图标、配色槽位与中文类型名
IFileType fileTypeOf(String name) =>
    _kinds[_ext[extensionOf(name)] ?? IFileKind.other]!;

/// 体积的人类可读形式。
/// 用 1024 而不是 1000：文件管理器与操作系统都按 1024 显示。
String formatFileSize(num bytes) {
  if (bytes.isNaN || bytes.isInfinite || bytes < 0) return '';
  if (bytes < 1024) return '${bytes.toInt()} B';
  const units = ['KB', 'MB', 'GB', 'TB'];
  var value = bytes / 1024;
  var unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  // 小于 10 时保留一位小数：1.4 MB 比 1 MB 有用得多
  return value < 10
      ? '${value.toStringAsFixed(1)} ${units[unit]}'
      : '${value.round()} ${units[unit]}';
}

/// 分类色槽位对应的颜色，与 Web 端 --i-chart-N 逐值一致
const List<int> kChartSlots = [
  0xFF5E7CE0, // 1 品牌蓝
  0xFFB7622A,
  0xFF0F8A68,
  0xFF7A4EE0,
  0xFFD64F8D,
  0xFF1F86B8,
  0xFFB08A1E,
  0xFFC2413D,
];
