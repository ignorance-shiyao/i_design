import 'package:flutter/material.dart';
import '../logic/importjob.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_button.dart';
import 'i_icon.dart';
import 'i_select.dart';

/// 导入向导的列映射与预检报告（astra.md 的 B11）。
///
/// 文件怎么读、预检怎么跑、导入怎么发，都在调用方手里——这个组件不碰任何 IO。
/// 它管的是三件事的呈现：映射对不对、预检说了什么、错误清单怎么拿走。
///
/// 映射表按「一行一个目标字段」排，不按来源列排：用户心里的问题是
/// 「我这张表里哪一列是客户」，从目标字段出发才答得上。
///
/// 判断全在 logic/importjob.dart，与 Web 端同一份规则。
class IImportWizard extends StatelessWidget {
  const IImportWizard({
    super.key,
    this.sources = const [],
    this.fields = const [],
    this.mapping = const {},
    this.report,
    this.busy = false,
    this.maxProblems = 8,
    this.onMappingChanged,
    this.onDryRun,
    this.onSubmit,
    this.onDownload,
  });

  /// 文件表头。由调用方解析出来
  final List<ISourceColumn> sources;

  /// 要导入到哪些字段
  final List<ITargetField> fields;

  /// 目标字段 → 来源列。受控：映射是数据，不是向导的内部状态
  final Map<String, String?> mapping;

  /// 预检报告。跑过才有
  final IDryRunReport? report;
  final bool busy;

  /// 问题清单最多列几条，再多折成一句
  final int maxProblems;
  final void Function(Map<String, String?> mapping)? onMappingChanged;

  /// 跑预检。调用方保证它不写任何业务数据
  final VoidCallback? onDryRun;
  final VoidCallback? onSubmit;

  /// 把错误清单交出去，由调用方决定怎么落地（下载、复制、发邮件）
  final void Function(String csv)? onDownload;

  /// 这个字段映到的那一列的样例值。没映上或那一列没样例都返回空串
  String _sampleOf(String field) {
    final source = mapping[field];
    if (source == null || source.isEmpty) return '';
    for (final s in sources) {
      if (s.key == source) return s.sample ?? '';
    }
    return '';
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final issues = mappingIssues(mapping, fields);
    final ready = canProceed(issues);
    final options = [
      const ISelectOption(value: '', label: '（不映射）'),
      for (final s in sources) ISelectOption(value: s.key, label: s.key),
    ];
    final problems = report == null
        ? const <IRowProblem>[]
        : report!.problems.take(maxProblems).toList();
    final hidden = report == null
        ? 0
        : (report!.problems.length - maxProblems).clamp(0, 1 << 30);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // 一行一个目标字段：用户心里的问题是「我这张表里哪一列是客户」
        for (final field in fields) ...[
          Container(
            margin: const EdgeInsets.only(bottom: IDesignTokensLight.spacing2),
            padding: const EdgeInsets.symmetric(
              horizontal: IDesignTokensLight.spacing3,
              vertical: IDesignTokensLight.spacing2,
            ),
            decoration: BoxDecoration(
              color: c.bgElevated,
              border: Border.all(color: c.hairline),
              borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
            ),
            child: Row(
              children: [
                SizedBox(
                  width: 96,
                  child: Wrap(
                    crossAxisAlignment: WrapCrossAlignment.center,
                    spacing: IDesignTokensLight.spacing1,
                    children: [
                      Text(
                        field.label,
                        style: TextStyle(
                          fontSize: IDesignTokensLight.fontSizeSm,
                          color: c.text,
                        ),
                      ),
                      // 必填不只靠星号：后面跟着「必填」两个字
                      if (field.required)
                        Text(
                          '必填',
                          style: TextStyle(
                            fontSize: IDesignTokensLight.fontSizeXs,
                            color: c.danger,
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: IDesignTokensLight.spacing2),
                Expanded(
                  child: ISelect(
                    options: options,
                    value: mapping[field.key] ?? '',
                    onChanged: (v) => onMappingChanged?.call(
                      // 指给别人之前先从原处摘掉，否则会悄悄变成「一列映给两个字段」
                      assignMapping(mapping, field.key, (v ?? '').isEmpty ? null : v),
                    ),
                  ),
                ),
                // 样例值：帮人确认这一列是不是他以为的那一列
                if (_sampleOf(field.key).isNotEmpty) ...[
                  const SizedBox(width: IDesignTokensLight.spacing2),
                  Text(
                    '样例：${_sampleOf(field.key)}',
                    style: TextStyle(
                      fontSize: IDesignTokensLight.fontSizeXs,
                      color: c.textTertiary,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],

        for (final issue in issues)
          Padding(
            padding: const EdgeInsets.only(bottom: 2),
            child: Row(
              children: [
                Container(
                  width: 20,
                  height: 20,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: issue.level == IMappingIssueLevel.error
                        ? c.dangerSubtle
                        : c.warningSubtle,
                    shape: BoxShape.circle,
                  ),
                  child: IIcon(
                    issue.level == IMappingIssueLevel.error ? 'error-circle' : 'warning-triangle',
                    size: 12,
                    color: issue.level == IMappingIssueLevel.error ? c.danger : c.warning,
                  ),
                ),
                const SizedBox(width: IDesignTokensLight.spacing2),
                Expanded(
                  child: Text(
                    issue.message,
                    style: TextStyle(
                      fontSize: IDesignTokensLight.fontSizeSm,
                      color: c.textSecondary,
                    ),
                  ),
                ),
              ],
            ),
          ),

        const SizedBox(height: IDesignTokensLight.spacing3),
        Wrap(
          spacing: IDesignTokensLight.spacing2,
          runSpacing: IDesignTokensLight.spacing2,
          children: [
            IButton(
              label: '预检',
              size: IButtonSize.sm,
              loading: busy,
              onPressed: busy || !ready ? null : onDryRun,
            ),
            IButton(
              label: '开始导入',
              size: IButtonSize.sm,
              variant: IButtonVariant.primary,
              loading: busy,
              onPressed: busy || !ready || report == null ? null : onSubmit,
            ),
            if (report != null && report!.problems.isNotEmpty)
              IButton(
                label: '下载错误清单',
                size: IButtonSize.sm,
                onPressed: () => onDownload?.call(problemsCsv(report!.problems)),
              ),
          ],
        ),

        if (report != null) ...[
          const SizedBox(height: IDesignTokensLight.spacing3),
          Semantics(
            liveRegion: true,
            label: report!.summary,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(
                horizontal: IDesignTokensLight.spacing3,
                vertical: IDesignTokensLight.spacing2,
              ),
              decoration: BoxDecoration(
                color: c.bgSubtle,
                border: Border.all(color: c.hairline),
                borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    report!.summary,
                    style: TextStyle(fontSize: IDesignTokensLight.fontSizeSm, color: c.text),
                  ),
                  const SizedBox(height: 2),
                  // 这句话要一直在：它是用户敢点预检的理由
                  Text(
                    '预检没有写入任何数据，现在取消不会留下半份记录。',
                    style: TextStyle(
                      fontSize: IDesignTokensLight.fontSizeXs,
                      color: c.textTertiary,
                    ),
                  ),
                ],
              ),
            ),
          ),
          for (final problem in problems)
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(
                // 行号在最前面：用户手里那份是几千行的表格
                '第 ${problem.row} 行'
                '${problem.column == null ? '' : ' · ${problem.column}'}'
                ' —— ${problem.message}',
                style: TextStyle(
                  fontSize: IDesignTokensLight.fontSizeSm,
                  color: c.textSecondary,
                ),
              ),
            ),
          if (hidden > 0)
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(
                '还有 $hidden 条，下载错误清单看完整的',
                style: TextStyle(
                  fontSize: IDesignTokensLight.fontSizeSm,
                  color: c.textSecondary,
                ),
              ),
            ),
        ],
      ],
    );
  }
}
