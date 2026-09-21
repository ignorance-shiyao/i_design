import 'package:flutter/material.dart';
import '../logic/schemaform.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 按 schema 渲染的表单（astra.md 的 B08）。
///
/// 组件不解释 schema，只渲染它：显隐、依赖、校验、服务端错误落位全部在
/// logic/schemaform.dart 里，与 Web 端同源——各端各写一遍的话，同一份 schema
/// 在这个端上会比在 Web 上多显示一个字段，而这种差异没有任何检查拦得住。
///
/// schema 里不执行任何字符串：条件是数据，异步规则只给 handler 名字。
class ISchemaForm extends StatefulWidget {
  const ISchemaForm({
    super.key,
    required this.schema,
    required this.value,
    required this.onChange,
    this.onSubmit,
    this.onInvalid,
    this.serverErrors = const [],
    this.submitText = '提交',
    this.disabled = false,
  });

  final IFormSchema schema;

  /// 受控：组件不自己存值
  final Map<String, Object?> value;
  final ValueChanged<Map<String, Object?>> onChange;

  /// 通过校验后的值，隐藏字段已经剔除
  final ValueChanged<Map<String, Object?>>? onSubmit;
  final ValueChanged<List<IFormFieldError>>? onInvalid;
  final List<({String path, String message})> serverErrors;
  final String submitText;
  final bool disabled;

  @override
  State<ISchemaForm> createState() => _ISchemaFormState();
}

class _ISchemaFormState extends State<ISchemaForm> {
  bool _touched = false;

  List<IFormFieldError> get _errors => [
        if (_touched) ...validateSchema(widget.schema, widget.value),
        ...applyServerErrors(widget.schema, widget.serverErrors),
      ];

  String? _errorOf(String path) {
    for (final e in _errors) {
      if (e.path == path) return e.message;
    }
    return null;
  }

  void _set(String name, Object? value) {
    widget.onChange({...widget.value, name: value});
  }

  List<Map<String, Object?>> _rowsOf(IFormFieldSpec field) {
    final raw = widget.value[field.name];
    return raw is List ? [for (final r in raw) Map<String, Object?>.from(r as Map)] : [];
  }

  void _submit() {
    setState(() => _touched = true);
    final errors = validateSchema(widget.schema, widget.value);
    if (errors.isNotEmpty) {
      widget.onInvalid?.call(errors);
      return;
    }
    // 隐藏字段的值不参与提交：服务端看到不该存在的字段，轻则报错重则存下脏数据
    widget.onSubmit?.call(submitValues(widget.schema, widget.value));
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final fields = visibleFields(widget.schema, widget.value);
    final formErrors = _errors.where((e) => e.orphan).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final field in fields) ...[
          _label(c, field.label, required: field.rules.any((r) => r.kind == 'required')),
          const SizedBox(height: IDesignTokensLight.spacing1),
          _input(c, field),
          if (field.help.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(
                field.help,
                style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeXs),
              ),
            ),
          if (_errorOf(field.name) != null)
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(
                _errorOf(field.name)!,
                style: TextStyle(color: c.danger, fontSize: IDesignTokensLight.fontSizeXs),
              ),
            ),
          const SizedBox(height: IDesignTokensLight.spacing4),
        ],

        // 对不上字段的服务端错误显示在表单级，而不是丢掉
        for (final e in formErrors)
          Text(
            '${e.path}：${e.message}',
            style: TextStyle(color: c.danger, fontSize: IDesignTokensLight.fontSizeXs),
          ),

        FilledButton(
          onPressed: widget.disabled ? null : _submit,
          child: Text(widget.submitText),
        ),
      ],
    );
  }

  Widget _label(IColors c, String text, {required bool required}) => Row(
        children: [
          Text(text, style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm)),
          if (required)
            Text(' *', style: TextStyle(color: c.danger, fontSize: IDesignTokensLight.fontSizeSm)),
        ],
      );

  Widget _input(IColors c, IFormFieldSpec field) {
    switch (field.kind) {
      case IFormFieldKind.textarea:
        return TextFormField(
          initialValue: '${widget.value[field.name] ?? ''}',
          minLines: 3,
          maxLines: 6,
          enabled: !widget.disabled,
          decoration: InputDecoration(hintText: field.placeholder),
          onChanged: (v) => _set(field.name, v),
        );
      case IFormFieldKind.number:
        return TextFormField(
          initialValue: '${widget.value[field.name] ?? ''}',
          keyboardType: TextInputType.number,
          enabled: !widget.disabled,
          onChanged: (v) => _set(field.name, num.tryParse(v)),
        );
      case IFormFieldKind.switchKind:
        // 开关旁边的文字不构成它的名字，读屏要靠 Semantics 才念得出开的是什么
        return Semantics(
          label: field.label,
          toggled: widget.value[field.name] == true,
          child: Switch(
            value: widget.value[field.name] == true,
            onChanged: widget.disabled ? null : (v) => _set(field.name, v),
          ),
        );
      case IFormFieldKind.select:
      case IFormFieldKind.multiSelect:
        return DropdownButton<String>(
          isExpanded: true,
          value: '${widget.value[field.name] ?? ''}'.isEmpty ? null : '${widget.value[field.name]}',
          hint: Text(field.placeholder.isEmpty ? '请选择' : field.placeholder),
          items: [
            for (final option in field.options)
              DropdownMenuItem(
                value: option.value,
                // 禁用而不说原因，用户只会反复点它
                enabled: option.disabledReason == null,
                child: Text(
                  option.disabledReason == null
                      ? option.label
                      : '${option.label}（${option.disabledReason}）',
                ),
              ),
          ],
          onChanged: widget.disabled ? null : (v) => _set(field.name, v ?? ''),
        );
      case IFormFieldKind.array:
        // 数组子表：错误落到具体那一格，而不是整张表报一句「有误」
        final rows = _rowsOf(field);
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (var index = 0; index < rows.length; index += 1)
              Container(
                margin: const EdgeInsets.only(bottom: IDesignTokensLight.spacing3),
                padding: const EdgeInsets.all(IDesignTokensLight.spacing3),
                decoration: BoxDecoration(
                  border: Border.all(color: c.hairline),
                  borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (final sub in field.item) ...[
                      _label(c, sub.label, required: sub.rules.any((r) => r.kind == 'required')),
                      TextFormField(
                        initialValue: '${rows[index][sub.name] ?? ''}',
                        enabled: !widget.disabled,
                        keyboardType: sub.kind == IFormFieldKind.number
                            ? TextInputType.number
                            : TextInputType.text,
                        onChanged: (v) {
                          final next = [...rows];
                          next[index] = {
                            ...next[index],
                            sub.name: sub.kind == IFormFieldKind.number ? num.tryParse(v) : v,
                          };
                          _set(field.name, next);
                        },
                      ),
                      if (_errorOf('${field.name}[$index].${sub.name}') != null)
                        Text(
                          _errorOf('${field.name}[$index].${sub.name}')!,
                          style: TextStyle(color: c.danger, fontSize: IDesignTokensLight.fontSizeXs),
                        ),
                    ],
                    TextButton(
                      onPressed: widget.disabled
                          ? null
                          : () => _set(field.name, [...rows]..removeAt(index)),
                      child: const Text('删除这行'),
                    ),
                  ],
                ),
              ),
            TextButton(
              onPressed: widget.disabled
                  ? null
                  : () => _set(field.name, [...rows, <String, Object?>{}]),
              child: const Text('加一行'),
            ),
          ],
        );
      case IFormFieldKind.text:
      case IFormFieldKind.date:
        return TextFormField(
          initialValue: '${widget.value[field.name] ?? ''}',
          enabled: !widget.disabled,
          decoration: InputDecoration(hintText: field.placeholder),
          keyboardType:
              field.kind == IFormFieldKind.date ? TextInputType.datetime : TextInputType.text,
          onChanged: (v) => _set(field.name, v),
        );
    }
  }
}
