/// QR 码编码（字节模式），与 packages/common/src/logic/qrcode.ts 同名同算法。
///
/// 为什么各端共用一份算法：同一段文本必须在三端上得到同一个版本、同一个掩码，
/// 否则模块数对不上，设计稿里的尺寸与留白全得各调一遍。
/// golden test 会把整张矩阵与 TS 版逐行比对，任何一处偏差都会当场失败。
///
/// 实现范围：字节模式（UTF-8）、版本 1–10、四种纠错等级。

enum QrEcLevel { l, m, q, h }

class QrMatrix {
  const QrMatrix({
    required this.size,
    required this.modules,
    required this.version,
    required this.ecLevel,
    required this.mask,
  });

  /// 边长（模块数）
  final int size;

  /// 每个模块是否为深色，按行存
  final List<List<bool>> modules;
  final int version;
  final QrEcLevel ecLevel;
  final int mask;
}

const int qrMaxVersion = 10;

/// 纠错分块表：[每块纠错码字数, 组1块数, 组1数据码字数, 组2块数, 组2数据码字数]
const Map<QrEcLevel, List<List<int>>> _ecBlocks = {
  QrEcLevel.l: [
    [7, 1, 19, 0, 0], [10, 1, 34, 0, 0], [15, 1, 55, 0, 0], [20, 1, 80, 0, 0],
    [26, 1, 108, 0, 0], [18, 2, 68, 0, 0], [20, 2, 78, 0, 0], [24, 2, 97, 0, 0],
    [30, 2, 116, 0, 0], [18, 2, 68, 2, 69],
  ],
  QrEcLevel.m: [
    [10, 1, 16, 0, 0], [16, 1, 28, 0, 0], [26, 1, 44, 0, 0], [18, 2, 32, 0, 0],
    [24, 2, 43, 0, 0], [16, 4, 27, 0, 0], [18, 4, 31, 0, 0], [22, 2, 38, 2, 39],
    [22, 3, 36, 2, 37], [26, 4, 43, 1, 44],
  ],
  QrEcLevel.q: [
    [13, 1, 13, 0, 0], [22, 1, 22, 0, 0], [18, 2, 17, 0, 0], [26, 2, 24, 0, 0],
    [18, 2, 15, 2, 16], [24, 4, 19, 0, 0], [18, 2, 14, 4, 15], [22, 4, 18, 2, 19],
    [20, 4, 16, 4, 17], [24, 6, 19, 2, 20],
  ],
  QrEcLevel.h: [
    [17, 1, 9, 0, 0], [28, 1, 16, 0, 0], [22, 2, 13, 0, 0], [16, 4, 9, 0, 0],
    [22, 2, 11, 2, 12], [28, 4, 15, 0, 0], [26, 4, 13, 1, 14], [26, 4, 14, 2, 15],
    [24, 4, 12, 4, 13], [28, 6, 15, 2, 16],
  ],
};

/// 对齐图形的中心坐标（版本 1 没有）
const List<List<int>> _alignmentCenters = [
  [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42],
  [6, 26, 46], [6, 28, 50],
];

const Map<QrEcLevel, int> _ecLevelBits = {
  QrEcLevel.l: 1,
  QrEcLevel.m: 0,
  QrEcLevel.q: 3,
  QrEcLevel.h: 2,
};

final List<int> _exp = List<int>.filled(512, 0);
final List<int> _log = List<int>.filled(256, 0);
bool _tablesReady = false;

void _initTables() {
  if (_tablesReady) return;
  var x = 1;
  for (var i = 0; i < 255; i++) {
    _exp[i] = x;
    _log[x] = i;
    x <<= 1;
    if (x & 0x100 != 0) x ^= 0x11d;
  }
  for (var i = 255; i < 512; i++) {
    _exp[i] = _exp[i - 255];
  }
  _tablesReady = true;
}

int _gfMul(int a, int b) {
  if (a == 0 || b == 0) return 0;
  return _exp[_log[a] + _log[b]];
}

/// 纠错码字：数据多项式除以生成多项式，取余数
List<int> reedSolomon(List<int> data, int ecCount) {
  _initTables();
  var generator = <int>[1];
  for (var i = 0; i < ecCount; i++) {
    final next = List<int>.filled(generator.length + 1, 0);
    for (var j = 0; j < generator.length; j++) {
      next[j] ^= generator[j];
      next[j + 1] ^= _gfMul(generator[j], _exp[i]);
    }
    generator = next;
  }

  final remainder = List<int>.filled(ecCount, 0);
  for (final byte in data) {
    final factor = byte ^ remainder[0];
    remainder.removeAt(0);
    remainder.add(0);
    if (factor != 0) {
      for (var i = 0; i < ecCount; i++) {
        remainder[i] ^= _gfMul(generator[i + 1], factor);
      }
    }
  }
  return remainder;
}

List<int> _utf8Bytes(String text) {
  final out = <int>[];
  for (final code in text.runes) {
    if (code < 0x80) {
      out.add(code);
    } else if (code < 0x800) {
      out.addAll([0xc0 | (code >> 6), 0x80 | (code & 0x3f)]);
    } else if (code < 0x10000) {
      out.addAll([0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f)]);
    } else {
      out.addAll([
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      ]);
    }
  }
  return out;
}

int _dataCodewordsOf(int version, QrEcLevel ecLevel) {
  final row = _ecBlocks[ecLevel]![version - 1];
  return row[1] * row[2] + row[3] * row[4];
}

/// 选版本：能装下就用最小的那个。字符计数字段在版本 10 起是 16 位而不是 8 位
int qrVersionFor(int byteLength, QrEcLevel ecLevel) {
  for (var version = 1; version <= qrMaxVersion; version++) {
    final countBytes = version >= 10 ? 2 : 1;
    final capacity = _dataCodewordsOf(version, ecLevel) - 1 - countBytes;
    if (byteLength <= capacity) return version;
  }
  return -1;
}

List<int> _buildCodewords(List<int> bytes, int version, QrEcLevel ecLevel) {
  final bits = <int>[];
  void push(int value, int length) {
    for (var i = length - 1; i >= 0; i--) {
      bits.add((value >> i) & 1);
    }
  }

  push(4, 4); // 字节模式
  push(bytes.length, version >= 10 ? 16 : 8);
  for (final byte in bytes) {
    push(byte, 8);
  }

  final capacity = _dataCodewordsOf(version, ecLevel) * 8;
  push(0, capacity - bits.length < 4 ? capacity - bits.length : 4);
  while (bits.length % 8 != 0) {
    bits.add(0);
  }

  final data = <int>[];
  for (var i = 0; i < bits.length; i += 8) {
    var value = 0;
    for (var j = 0; j < 8; j++) {
      value = (value << 1) | bits[i + j];
    }
    data.add(value);
  }
  const pad = [0xec, 0x11];
  while (data.length < _dataCodewordsOf(version, ecLevel)) {
    data.add(pad[data.length % 2]);
  }

  final row = _ecBlocks[ecLevel]![version - 1];
  final ecCount = row[0];
  final g1 = row[1];
  final d1 = row[2];
  final g2 = row[3];
  final d2 = row[4];

  final blockData = <List<int>>[];
  final blockEc = <List<int>>[];
  var offset = 0;
  for (var i = 0; i < g1 + g2; i++) {
    final size = i < g1 ? d1 : d2;
    final chunk = data.sublist(offset, offset + size);
    offset += size;
    blockData.add(chunk);
    blockEc.add(reedSolomon(chunk, ecCount));
  }

  final out = <int>[];
  final maxData = d1 > d2 ? d1 : d2;
  for (var i = 0; i < maxData; i++) {
    for (final block in blockData) {
      if (i < block.length) out.add(block[i]);
    }
  }
  for (var i = 0; i < ecCount; i++) {
    for (final block in blockEc) {
      out.add(block[i]);
    }
  }
  return out;
}

void _placeFinder(List<List<int>> matrix, int row, int col) {
  for (var r = -1; r <= 7; r++) {
    for (var c = -1; c <= 7; c++) {
      final rr = row + r;
      final cc = col + c;
      if (rr < 0 || cc < 0 || rr >= matrix.length || cc >= matrix.length) continue;
      final inRing = (r >= 0 && r <= 6 && (c == 0 || c == 6)) ||
          (c >= 0 && c <= 6 && (r == 0 || r == 6));
      final inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      matrix[rr][cc] = (inRing || inCore) ? 1 : 0;
    }
  }
}

void _placeFunctionPatterns(List<List<int>> matrix, int version) {
  final size = matrix.length;
  _placeFinder(matrix, 0, 0);
  _placeFinder(matrix, 0, size - 7);
  _placeFinder(matrix, size - 7, 0);

  for (var i = 8; i < size - 8; i++) {
    final dark = i % 2 == 0 ? 1 : 0;
    matrix[6][i] = dark;
    matrix[i][6] = dark;
  }

  for (final row in _alignmentCenters[version - 1]) {
    for (final col in _alignmentCenters[version - 1]) {
      if ((row <= 8 && col <= 8) ||
          (row <= 8 && col >= size - 9) ||
          (row >= size - 9 && col <= 8)) {
        continue;
      }
      for (var r = -2; r <= 2; r++) {
        for (var c = -2; c <= 2; c++) {
          matrix[row + r][col + c] =
              (r.abs() == 2 || c.abs() == 2 || (r == 0 && c == 0)) ? 1 : 0;
        }
      }
    }
  }

  matrix[size - 8][8] = 1;
}

/// 格式信息的 15 个位置，两份互为备份，按位序号给出 [行, 列]。
/// 行列写反了生成的码看起来一切正常，解出来却是乱码——只有解回来才看得见。
List<List<List<int>>> _formatPositions(int size) {
  final first = <List<int>>[];
  final second = <List<int>>[];
  for (var i = 0; i <= 5; i++) {
    first.add([i, 8]);
  }
  first.addAll([[7, 8], [8, 8], [8, 7]]);
  for (var i = 9; i <= 14; i++) {
    first.add([8, 14 - i]);
  }
  for (var i = 0; i <= 7; i++) {
    second.add([8, size - 1 - i]);
  }
  for (var i = 8; i <= 14; i++) {
    second.add([size - 15 + i, 8]);
  }
  return [first, second];
}

int _formatBits(QrEcLevel ecLevel, int mask) {
  final data = (_ecLevelBits[ecLevel]! << 3) | mask;
  var value = data << 10;
  for (var i = 14; i >= 10; i--) {
    if ((value >> i) & 1 != 0) value ^= 0x537 << (i - 10);
  }
  return ((data << 10) | value) ^ 0x5412;
}

int _versionBits(int version) {
  var value = version << 12;
  for (var i = 17; i >= 12; i--) {
    if ((value >> i) & 1 != 0) value ^= 0x1f25 << (i - 12);
  }
  return (version << 12) | value;
}

final List<bool Function(int, int)> _masks = [
  (r, c) => (r + c) % 2 == 0,
  (r, c) => r % 2 == 0,
  (r, c) => c % 3 == 0,
  (r, c) => (r + c) % 3 == 0,
  (r, c) => ((r ~/ 2) + (c ~/ 3)) % 2 == 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) == 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 == 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 == 0,
];

/// 惩罚分：规范给的四条规则，分数越低越好。
/// 它不是美观评分——连续同色、成块同色、形似定位图形的排列都会让扫描器误判。
int qrPenalty(List<List<bool>> modules) {
  final size = modules.length;
  var score = 0;

  for (var i = 0; i < size; i++) {
    final rows = modules[i];
    final cols = [for (var j = 0; j < size; j++) modules[j][i]];
    for (final line in [rows, cols]) {
      var run = 1;
      for (var j = 1; j < size; j++) {
        if (line[j] == line[j - 1]) {
          run++;
        } else {
          if (run >= 5) score += run - 2;
          run = 1;
        }
      }
      if (run >= 5) score += run - 2;
    }
  }

  for (var r = 0; r < size - 1; r++) {
    for (var c = 0; c < size - 1; c++) {
      final v = modules[r][c];
      if (v == modules[r][c + 1] && v == modules[r + 1][c] && v == modules[r + 1][c + 1]) {
        score += 3;
      }
    }
  }

  const pattern = [true, false, true, true, true, false, true];
  for (var i = 0; i < size; i++) {
    final rows = modules[i];
    final cols = [for (var j = 0; j < size; j++) modules[j][i]];
    for (final line in [rows, cols]) {
      for (var j = 0; j + 7 <= size; j++) {
        var hit = true;
        for (var k = 0; k < 7; k++) {
          if (line[j + k] != pattern[k]) {
            hit = false;
            break;
          }
        }
        if (!hit) continue;
        if (j >= 4 && !line.sublist(j - 4, j).contains(true)) score += 40;
        if (j + 11 <= size && !line.sublist(j + 7, j + 11).contains(true)) score += 40;
      }
    }
  }

  var dark = 0;
  for (final row in modules) {
    for (final cell in row) {
      if (cell) dark++;
    }
  }
  final ratio = (dark * 100) / (size * size);
  score += ((ratio - 50).abs() ~/ 5) * 10;
  return score;
}

void _placeData(List<List<int>> matrix, List<int> codewords) {
  final size = matrix.length;
  var bitIndex = 0;
  bool bitAt(int index) {
    if (index >= codewords.length * 8) return false;
    return ((codewords[index >> 3] >> (7 - (index % 8))) & 1) == 1;
  }

  var upward = true;
  for (var right = size - 1; right >= 1; right -= 2) {
    if (right == 6) right = 5;
    for (var step = 0; step < size; step++) {
      final row = upward ? size - 1 - step : step;
      for (final col in [right, right - 1]) {
        if (matrix[row][col] != -1) continue;
        matrix[row][col] = bitAt(bitIndex++) ? 1 : 0;
      }
    }
    upward = !upward;
  }
}

/// 生成矩阵。返回 null 表示装不下——调用方应当据实提示，
/// 而不是悄悄截断文本：截断后的码扫出来是另一个地址。
QrMatrix? qrMatrix(String text, [QrEcLevel ecLevel = QrEcLevel.m]) {
  final bytes = _utf8Bytes(text);
  final version = qrVersionFor(bytes.length, ecLevel);
  if (version < 0) return null;

  final size = version * 4 + 17;
  final codewords = _buildCodewords(bytes, version, ecLevel);

  // -1 表示还没填过
  final base = [for (var i = 0; i < size; i++) List<int>.filled(size, -1)];
  _placeFunctionPatterns(base, version);

  final positions = _formatPositions(size);
  for (final group in positions) {
    for (final pos in group) {
      if (base[pos[0]][pos[1]] == -1) base[pos[0]][pos[1]] = 0;
    }
  }
  if (version >= 7) {
    for (var i = 0; i < 18; i++) {
      base[i ~/ 3][size - 11 + (i % 3)] = 0;
      base[size - 11 + (i % 3)][i ~/ 3] = 0;
    }
  }
  final reserved = [
    for (final row in base) [for (final cell in row) cell != -1]
  ];

  final withData = [for (final row in base) [...row]];
  _placeData(withData, codewords);

  List<List<bool>>? best;
  var bestMask = 0;
  var bestScore = 1 << 30;
  for (var mask = 0; mask < 8; mask++) {
    final modules = [
      for (var r = 0; r < size; r++)
        [
          for (var c = 0; c < size; c++)
            reserved[r][c] ? withData[r][c] == 1 : (withData[r][c] == 1) != _masks[mask](r, c)
        ]
    ];

    final format = _formatBits(ecLevel, mask);
    for (final group in _formatPositions(size)) {
      for (var i = 0; i < group.length; i++) {
        modules[group[i][0]][group[i][1]] = ((format >> i) & 1) == 1;
      }
    }
    modules[size - 8][8] = true;

    if (version >= 7) {
      final info = _versionBits(version);
      for (var i = 0; i < 18; i++) {
        final bit = ((info >> i) & 1) == 1;
        modules[i ~/ 3][size - 11 + (i % 3)] = bit;
        modules[size - 11 + (i % 3)][i ~/ 3] = bit;
      }
    }

    final score = qrPenalty(modules);
    if (score < bestScore) {
      bestScore = score;
      bestMask = mask;
      best = modules;
    }
  }

  return QrMatrix(
    size: size,
    modules: best!,
    version: version,
    ecLevel: ecLevel,
    mask: bestMask,
  );
}
