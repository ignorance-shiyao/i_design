/// SchemaForm 的纯逻辑（astra.md 的 B08）。
///
/// 与 packages/common/src/logic/schemaform.ts 同源，由生成的 logic_parity_test 对齐。
///
/// 一条红线：**不执行 schema 里的任何字符串**。条件是数据结构，求值器只认识
/// 固定的算子表；异步规则只给 handler 名字，实现由宿主注册。schema 常常来自接口，
/// 能 eval 就等于把任意代码执行权交给了接口。
enum IFormFieldKind { text, textarea, number, select, multiSelect, switchKind, date, array }

class IFormFieldOption {
  const IFormFieldOption({required this.value, required this.label, this.disabledReason});

  final String value;
  final String label;

  /// 不可选的原因。禁用而不说原因，用户只会反复点它
  final String? disabledReason;
}

/// 条件的算子表。扩算子要改这里，而不是往 schema 里塞代码
enum IConditionOp { eq, ne, isIn, notIn, truthy, falsy, gt, lt }

/// 条件：要么是单条（field + op），要么是一个组（all / any / not）
class ICondition {
  const ICondition({this.field, this.op, this.value, this.all, this.any, this.not});

  final String? field;
  final IConditionOp? op;
  final Object? value;
  final List<ICondition>? all;
  final List<ICondition>? any;
  final ICondition? not;

  bool get isGroup => all != null || any != null || not != null;
}

class IFormFieldRule {
  const IFormFieldRule({required this.kind, required this.message, this.value, this.handler});

  /// required / min / max / pattern / email / async
  final String kind;
  final String message;
  final Object? value;

  /// async 规则的标识，由宿主注册真正的实现
  final String? handler;
}

class IFormFieldSpec {
  const IFormFieldSpec({
    required this.name,
    required this.label,
    required this.kind,
    this.placeholder = '',
    this.help = '',
    this.options = const [],
    this.rules = const [],
    this.when,
    this.item = const [],
    this.minItems,
    this.maxItems,
  });

  final String name;
  final String label;
  final IFormFieldKind kind;
  final String placeholder;
  final String help;
  final List<IFormFieldOption> options;
  final List<IFormFieldRule> rules;

  /// 满足条件时才显示。null 表示总是显示
  final ICondition? when;
  final List<IFormFieldSpec> item;
  final int? minItems;
  final int? maxItems;
}

class IFormSchema {
  const IFormSchema({required this.fields});

  final List<IFormFieldSpec> fields;
}

class IFormFieldError {
  const IFormFieldError({required this.path, required this.message, this.orphan = false});

  /// 字段路径，数组子表写成 lines[2].quantity
  final String path;
  final String message;

  /// 服务端返回但对不上任何字段：界面要把它显示在表单级别
  final bool orphan;
}

bool _isEmpty(Object? value) {
  if (value == null) return true;
  if (value is String) return value.trim().isEmpty;
  if (value is List) return value.isEmpty;
  return false;
}

/// 条件求值。不认识的算子与写坏了的条件都报错，而不是猜它想干什么
bool evaluateCondition(ICondition condition, Map<String, Object?> values) {
  if (condition.isGroup) {
    if (condition.all != null) {
      return condition.all!.every((c) => evaluateCondition(c, values));
    }
    if (condition.any != null) {
      return condition.any!.any((c) => evaluateCondition(c, values));
    }
    return !evaluateCondition(condition.not!, values);
  }
  final field = condition.field;
  if (field == null || field.isEmpty || condition.op == null) {
    throw StateError('条件里既没有 field，也没有 all / any / not');
  }
  final actual = values[field];
  switch (condition.op!) {
    case IConditionOp.eq:
      return actual == condition.value;
    case IConditionOp.ne:
      return actual != condition.value;
    case IConditionOp.isIn:
      return condition.value is List && (condition.value as List).contains(actual);
    case IConditionOp.notIn:
      return condition.value is List && !(condition.value as List).contains(actual);
    case IConditionOp.truthy:
      return !_isEmpty(actual) && actual != false;
    case IConditionOp.falsy:
      return _isEmpty(actual) || actual == false;
    case IConditionOp.gt:
      return _num(actual) > _num(condition.value);
    case IConditionOp.lt:
      return _num(actual) < _num(condition.value);
  }
}

double _num(Object? v) {
  if (v is num) return v.toDouble();
  return double.tryParse('$v') ?? double.nan;
}

List<String> dependenciesOf(ICondition condition) {
  if (!condition.isGroup) return condition.field == null ? const [] : [condition.field!];
  return [
    ...?condition.all?.expand(dependenciesOf),
    ...?condition.any?.expand(dependenciesOf),
    ...?(condition.not == null ? null : dependenciesOf(condition.not!)),
  ];
}

/// 按依赖拓扑排序，顺便检出环。环必须在装配时报出来并点名参与的字段——
/// 等用户填到那一步才摆动的话，现场根本看不出是 schema 的问题
List<String> dependencyOrder(IFormSchema schema) {
  final deps = <String, List<String>>{
    for (final f in schema.fields)
      f.name: f.when == null ? const [] : dependenciesOf(f.when!).toSet().toList()
  };
  final order = <String>[];
  final state = <String, String>{};
  final stack = <String>[];

  void visit(String name) {
    if (state[name] == 'done') return;
    if (state[name] == 'visiting') {
      final cycle = [...stack.sublist(stack.indexOf(name)), name];
      throw StateError('字段显隐依赖成环：${cycle.join(' → ')}');
    }
    state[name] = 'visiting';
    stack.add(name);
    for (final dep in deps[name] ?? const <String>[]) {
      if (!deps.containsKey(dep)) {
        throw StateError('$name 的显隐依赖了不存在的字段：$dep');
      }
      visit(dep);
    }
    stack.removeLast();
    state[name] = 'done';
    order.add(name);
  }

  for (final f in schema.fields) {
    visit(f.name);
  }
  return order;
}

/// 当前该显示哪些字段。顺序保持 schema 的声明顺序，不按依赖顺序打乱界面
List<IFormFieldSpec> visibleFields(IFormSchema schema, Map<String, Object?> values) {
  dependencyOrder(schema);
  return schema.fields
      .where((f) => f.when == null || evaluateCondition(f.when!, values))
      .toList();
}

/// 隐藏字段的值不参与提交：先选「企业」填了税号又改回「个人」，
/// 税号跟着提交上去，服务端轻则报错重则存下脏数据
Map<String, Object?> submitValues(IFormSchema schema, Map<String, Object?> values) {
  final visible = visibleFields(schema, values).map((f) => f.name).toSet();
  return {
    for (final entry in values.entries)
      if (visible.contains(entry.key)) entry.key: entry.value
  };
}

num? _sizeOf(Object? value) {
  if (value is num) return value;
  if (value is String) return value.length;
  if (value is List) return value.length;
  return null;
}

final RegExp _email = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

/// 同步校验。只校验可见字段——看不见的必填挡住提交，用户永远找不到它是哪个。
/// async 规则不在这里跑：实现由宿主注册
List<IFormFieldError> validateSchema(IFormSchema schema, Map<String, Object?> values) {
  final errors = <IFormFieldError>[];

  void checkField(IFormFieldSpec field, Object? value, String path) {
    for (final rule in field.rules) {
      if (rule.kind == 'async') continue;
      if (rule.kind == 'required') {
        if (_isEmpty(value)) errors.add(IFormFieldError(path: path, message: rule.message));
        continue;
      }
      // 选填留空时跳过其余规则，否则「选填但有格式要求」的字段无法留空
      if (_isEmpty(value)) continue;
      if (rule.kind == 'min' && (_sizeOf(value) ?? 0) < _num(rule.value)) {
        errors.add(IFormFieldError(path: path, message: rule.message));
      }
      if (rule.kind == 'max' && (_sizeOf(value) ?? 0) > _num(rule.value)) {
        errors.add(IFormFieldError(path: path, message: rule.message));
      }
      if (rule.kind == 'pattern' && !RegExp('${rule.value}').hasMatch('$value')) {
        errors.add(IFormFieldError(path: path, message: rule.message));
      }
      if (rule.kind == 'email' && !_email.hasMatch('$value')) {
        errors.add(IFormFieldError(path: path, message: rule.message));
      }
    }

    if (field.kind == IFormFieldKind.array) {
      final rows = value is List ? value : const [];
      if (field.minItems != null && rows.length < field.minItems!) {
        errors.add(IFormFieldError(path: path, message: '至少要有 ${field.minItems} 行'));
      }
      if (field.maxItems != null && rows.length > field.maxItems!) {
        errors.add(IFormFieldError(path: path, message: '最多 ${field.maxItems} 行'));
      }
      for (var index = 0; index < rows.length; index += 1) {
        final row = rows[index];
        for (final sub in field.item) {
          final cell = row is Map ? row[sub.name] : null;
          checkField(sub, cell, '$path[$index].${sub.name}');
        }
      }
    }
  }

  for (final field in visibleFields(schema, values)) {
    checkField(field, values[field.name], field.name);
  }
  return errors;
}

/// 需要宿主执行的异步规则：schema 里只有名字
List<({String path, String handler, String message})> asyncRulesOf(IFormSchema schema) => [
      for (final field in schema.fields)
        for (final rule in field.rules)
          if (rule.kind == 'async' && rule.handler != null)
            (path: field.name, handler: rule.handler!, message: rule.message)
    ];

/// 服务端错误落回字段。对不上任何字段的标成 orphan 并保留原文——
/// 丢掉它等于「提交失败但没有原因」，而这正是最让人卡住的一种失败
List<IFormFieldError> applyServerErrors(
  IFormSchema schema,
  List<({String path, String message})> serverErrors,
) {
  final known = <String>{};
  for (final field in schema.fields) {
    known.add(field.name);
    for (final sub in field.item) {
      known.add('${field.name}.${sub.name}');
    }
  }
  return [
    for (final e in serverErrors)
      IFormFieldError(
        path: e.path,
        message: e.message,
        orphan: !known.contains(e.path.replaceAll(RegExp(r'\[\d+\]'), '')),
      )
  ];
}

/// 第一个出错的字段：提交失败后焦点送到它身上，而不是让用户自己从头找
String? firstErrorPath(List<IFormFieldError> errors) {
  for (final e in errors) {
    if (!e.orphan) return e.path;
  }
  return null;
}
