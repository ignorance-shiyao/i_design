/// Markdown 解析的 Dart 移植（对应 logic/markdown.ts）。
///
/// 与 Web 端同一套取舍：解析成 token 而不是 HTML 字符串，原始 HTML 当纯文本，
/// 地址过白名单。Flutter 这边尤其不该走「渲染 HTML」那条路——
/// 那要额外引一个 WebView 或 HTML 渲染库，把不可信内容交给它去解释。
import 'href.dart';

enum MdInlineType { text, code, strong, em, del, link, image }

class MdInline {
  const MdInline({
    required this.type,
    this.text = '',
    this.href = '',
    this.src = '',
    this.alt = '',
    this.children = const [],
  });

  final MdInlineType type;
  final String text;
  final String href;
  final String src;
  final String alt;
  final List<MdInline> children;
}

enum MdBlockType { heading, paragraph, code, quote, list, table, hr }

class MdBlock {
  const MdBlock({
    required this.type,
    this.level = 1,
    this.lang = '',
    this.text = '',
    this.open = false,
    this.ordered = false,
    this.start = 1,
    this.children = const [],
    this.blocks = const [],
    this.items = const [],
    this.head = const [],
    this.rows = const [],
    this.align = const [],
  });

  final MdBlockType type;
  final int level;
  final String lang;
  final String text;

  /// 流式过程中还没收到结尾围栏
  final bool open;
  final bool ordered;
  final int start;
  final List<MdInline> children;
  final List<MdBlock> blocks;
  final List<List<MdBlock>> items;
  final List<List<MdInline>> head;
  final List<List<List<MdInline>>> rows;

  /// 'left' / 'center' / 'right' / ''
  final List<String> align;
}

final _inline = RegExp(
  r'(`+)([\s\S]*?)\1'
  r'|!\[([^\]]*)\]\(((?:[^()]|\([^()]*\))*)\)'
  r'|\[([^\]]+)\]\(((?:[^()]|\([^()]*\))*)\)'
  r'|(\*\*|__)([\s\S]+?)\7'
  r'|(\*|_)([\s\S]+?)\9'
  r'|~~([\s\S]+?)~~',
);

/// 去掉地址后面的可选标题：`(/a "说明")`
///
/// 单引号用 \x27 写：仓库的 Dart 校验脚本按引号做字符串遮蔽来数括号，
/// 源码里直接出现的引号会让它把后面半行当成字符串，报一个与代码无关的错。
final _titleTail = RegExp(r'\s+(?:"|\x27|\()[\s\S]*$');

String _urlOf(String raw) => raw.replaceAll(_titleTail, '').trim();

/// 行内解析。代码优先于强调：粘一段代码进来不该被加粗一半。
List<MdInline> parseInline(String text) {
  final out = <MdInline>[];
  var rest = text;
  while (rest.isNotEmpty) {
    final hit = _inline.firstMatch(rest);
    if (hit == null) break;
    if (hit.start > 0) {
      out.add(MdInline(type: MdInlineType.text, text: rest.substring(0, hit.start)));
    }
    if (hit.group(2) != null) {
      out.add(MdInline(type: MdInlineType.code, text: hit.group(2)!.trim()));
    } else if (hit.group(4) != null) {
      final safe = safeHref(_urlOf(hit.group(4)!));
      final alt = hit.group(3) ?? '';
      if (safe != null) {
        out.add(MdInline(type: MdInlineType.image, src: safe, alt: alt));
      } else {
        out.add(MdInline(type: MdInlineType.text, text: alt.isEmpty ? hit.group(4)! : alt));
      }
    } else if (hit.group(6) != null) {
      final safe = safeHref(_urlOf(hit.group(6)!));
      final children = parseInline(hit.group(5)!);
      if (safe != null) {
        out.add(MdInline(type: MdInlineType.link, href: safe, children: children));
      } else {
        out.addAll(children);
      }
    } else if (hit.group(8) != null) {
      out.add(MdInline(type: MdInlineType.strong, children: parseInline(hit.group(8)!)));
    } else if (hit.group(10) != null) {
      out.add(MdInline(type: MdInlineType.em, children: parseInline(hit.group(10)!)));
    } else if (hit.group(11) != null) {
      out.add(MdInline(type: MdInlineType.del, children: parseInline(hit.group(11)!)));
    }
    rest = rest.substring(hit.end);
  }
  if (rest.isNotEmpty) out.add(MdInline(type: MdInlineType.text, text: rest));
  return out.isEmpty ? const [MdInline(type: MdInlineType.text)] : out;
}

final _hr = RegExp(r'^ {0,3}([-*_])(\s*\1){2,}\s*$');
final _listMark = RegExp(r'^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$');
final _heading = RegExp(r'^ {0,3}(#{1,6})\s+(.*)$');
final _fence = RegExp(r'^ {0,3}(`{3,}|~{3,})\s*([\w+-]*)\s*$');
final _quote = RegExp(r'^ {0,3}>\s?');

List<String> _tableRow(String line) => line
    .replaceFirst(RegExp(r'^\s*\|'), '')
    .replaceFirst(RegExp(r'\|\s*$'), '')
    .split('|')
    .map((cell) => cell.trim())
    .toList();

String _alignOf(String cell) {
  final left = cell.startsWith(':');
  final right = cell.endsWith(':');
  if (left && right) return 'center';
  if (right) return 'right';
  if (left) return 'left';
  return '';
}

/// 块级解析。停在代码块中间时按「还没收完」渲染（open: true），
/// 而不是把围栏当普通文字——否则用户会看到满屏反引号，写完的一瞬间又整段跳变。
List<MdBlock> parseMarkdown(String source) {
  final lines = source.replaceAll(RegExp(r'\r\n?'), '\n').split('\n');
  final blocks = <MdBlock>[];
  var i = 0;

  while (i < lines.length) {
    final line = lines[i];
    if (line.trim().isEmpty) {
      i += 1;
      continue;
    }

    final fence = _fence.firstMatch(line);
    if (fence != null) {
      final mark = fence.group(1)!;
      final lang = fence.group(2) ?? '';
      final body = <String>[];
      i += 1;
      var closed = false;
      final closing = RegExp('^ {0,3}\\${mark[0]}{${mark.length},}\\s*\$');
      while (i < lines.length) {
        if (closing.hasMatch(lines[i])) {
          closed = true;
          i += 1;
          break;
        }
        body.add(lines[i]);
        i += 1;
      }
      blocks.add(MdBlock(type: MdBlockType.code, lang: lang, text: body.join('\n'), open: !closed));
      continue;
    }

    if (_hr.hasMatch(line)) {
      blocks.add(const MdBlock(type: MdBlockType.hr));
      i += 1;
      continue;
    }

    final heading = _heading.firstMatch(line);
    if (heading != null) {
      blocks.add(MdBlock(
        type: MdBlockType.heading,
        level: heading.group(1)!.length,
        children: parseInline(heading.group(2)!.replaceFirst(RegExp(r'\s+#+\s*$'), '')),
      ));
      i += 1;
      continue;
    }

    if (_quote.hasMatch(line)) {
      final body = <String>[];
      while (i < lines.length && _quote.hasMatch(lines[i])) {
        body.add(lines[i].replaceFirst(_quote, ''));
        i += 1;
      }
      blocks.add(MdBlock(type: MdBlockType.quote, blocks: parseMarkdown(body.join('\n'))));
      continue;
    }

    if (line.contains('|') &&
        i + 1 < lines.length &&
        RegExp(r'^[\s|:-]+$').hasMatch(lines[i + 1]) &&
        lines[i + 1].contains('-')) {
      final head = _tableRow(line).map(parseInline).toList();
      final align = _tableRow(lines[i + 1]).map(_alignOf).toList();
      i += 2;
      final rows = <List<List<MdInline>>>[];
      while (i < lines.length && lines[i].contains('|') && lines[i].trim().isNotEmpty) {
        rows.add(_tableRow(lines[i]).map(parseInline).toList());
        i += 1;
      }
      blocks.add(MdBlock(type: MdBlockType.table, head: head, align: align, rows: rows));
      continue;
    }

    final mark = _listMark.firstMatch(line);
    if (mark != null) {
      final ordered = RegExp(r'\d').hasMatch(mark.group(2)!);
      final start = ordered ? int.parse(RegExp(r'\d+').firstMatch(mark.group(2)!)!.group(0)!) : 1;
      final baseIndent = mark.group(1)!.length;
      final items = <List<MdBlock>>[];
      while (i < lines.length) {
        final current = _listMark.firstMatch(lines[i]);
        if (current == null || current.group(1)!.length < baseIndent) break;
        if (RegExp(r'\d').hasMatch(current.group(2)!) != ordered &&
            current.group(1)!.length == baseIndent) {
          break;
        }
        if (current.group(1)!.length > baseIndent) {
          final nested = <String>[];
          while (i < lines.length) {
            final deeper = _listMark.firstMatch(lines[i]);
            if (deeper == null || deeper.group(1)!.length <= baseIndent) break;
            nested.add(lines[i].substring(baseIndent + 2));
            i += 1;
          }
          if (items.isNotEmpty) items.last.addAll(parseMarkdown(nested.join('\n')));
          continue;
        }
        items.add(parseMarkdown(current.group(3)!));
        i += 1;
      }
      blocks.add(MdBlock(type: MdBlockType.list, ordered: ordered, start: start, items: items));
      continue;
    }

    final paragraph = <String>[];
    while (i < lines.length &&
        lines[i].trim().isNotEmpty &&
        _listMark.firstMatch(lines[i]) == null &&
        !_hr.hasMatch(lines[i]) &&
        !_heading.hasMatch(lines[i]) &&
        !RegExp(r'^ {0,3}(`{3,}|~{3,})').hasMatch(lines[i]) &&
        !_quote.hasMatch(lines[i])) {
      paragraph.add(lines[i]);
      i += 1;
    }
    if (paragraph.isNotEmpty) {
      blocks.add(MdBlock(type: MdBlockType.paragraph, children: parseInline(paragraph.join('\n'))));
    } else {
      i += 1;
    }
  }

  return blocks;
}

String _inlineText(List<MdInline> nodes) => nodes.map((n) {
      if (n.type == MdInlineType.text || n.type == MdInlineType.code) return n.text;
      if (n.type == MdInlineType.image) return n.alt;
      return _inlineText(n.children);
    }).join();

/// 取纯文本，用于摘要、搜索与复制
String markdownText(List<MdBlock> blocks) => blocks
    .map((block) {
      switch (block.type) {
        case MdBlockType.heading:
        case MdBlockType.paragraph:
          return _inlineText(block.children);
        case MdBlockType.code:
          return block.text;
        case MdBlockType.quote:
          return markdownText(block.blocks);
        case MdBlockType.list:
          return block.items.map(markdownText).join('\n');
        case MdBlockType.table:
          return [block.head, ...block.rows]
              .map((row) => row.map(_inlineText).join('\t'))
              .join('\n');
        case MdBlockType.hr:
          return '';
      }
    })
    .where((text) => text.isNotEmpty)
    .join('\n\n');
