/// 人员 / 组织 / 资源选择的纯逻辑
/// （对应 packages/common/src/logic/entitypicker.ts，astra.md 的 B10）。
///
/// 三件事做不对就会出真问题，都跟「远程检索 + 分页」这个前提绑在一起：
///
/// 一、已选的东西不能依赖它还在当前这一页里。所以已选存的是完整对象而不是
/// id——手里只有 id 的话，那个人一旦不在当前结果里，界面上就只剩一串编号。
///
/// 二、不能选的要说清为什么，而不是消失。直接过滤掉，用户会一直搜一直搜，
/// 怀疑是自己名字打错了。
///
/// 三、停用的实体仍然要能读历史记录。**不能新选**，但**已经选上的照常显示、
/// 照常能移除**——顺手过滤掉的话，三年前那张单上的负责人会变成一个空格。
library;

class IEntityOption {
  const IEntityOption({
    required this.id,
    required this.label,
    this.hint,
    this.blockedReason,
    this.inactive = false,
  });

  final String id;
  final String label;

  /// 二级说明：部门、工号、资源类型——同名的两个人只能靠它分得开
  final String? hint;

  /// 不能新选的原因。它只挡「新选」，不挡「已经选上的那些」
  final String? blockedReason;

  /// 已停用。不能新选，但已经选上的照常显示、照常能移除
  final bool inactive;

  @override
  bool operator ==(Object other) =>
      other is IEntityOption &&
      other.id == id &&
      other.label == label &&
      other.hint == hint &&
      other.blockedReason == blockedReason &&
      other.inactive == inactive;

  @override
  int get hashCode => Object.hash(id, label, hint, blockedReason, inactive);
}

class IPickerRow {
  const IPickerRow({
    required this.option,
    required this.selected,
    required this.disabled,
    required this.reason,
  });

  final IEntityOption option;
  final bool selected;
  final bool disabled;

  /// 不可选的原因。disabled 为 true 时一定不是空串
  final String reason;
}

bool _isChosen(List<IEntityOption> chosen, String id) => chosen.any((c) => c.id == id);

/// 当前这一页每一行的状态。
///
/// 一条贯穿始终的规则：**已经选上的项永远可以点**（点一下是取消选择）。
/// 上限、停用、没权限都只挡新选——否则用户会被自己锁死。
List<IPickerRow> pickerRows({
  required List<IEntityOption> page,
  required List<IEntityOption> chosen,
  bool multiple = false,
  int? max,
}) {
  final full = max != null && chosen.length >= max;
  return page.map((item) {
    final selected = _isChosen(chosen, item.id);
    var reason = '';
    if (!selected) {
      if (item.blockedReason != null) {
        reason = item.blockedReason!;
      } else if (item.inactive) {
        // 停用与没权限分开说：前者是「这个人还在，只是不该再派新活」
        reason = '已停用，只能保留原有的';
      } else if (full) {
        reason = '最多选 $max 个';
      }
    }
    return IPickerRow(
      option: item,
      selected: selected,
      disabled: reason.isNotEmpty,
      reason: reason,
    );
  }).toList();
}

/// 点一下某一项之后，已选变成什么。顺序按先后保持，不跟着检索结果重排。
List<IEntityOption> togglePick({
  required List<IEntityOption> page,
  required List<IEntityOption> chosen,
  bool multiple = false,
  int? max,
  required String id,
}) {
  final rows = pickerRows(page: page, chosen: chosen, multiple: multiple, max: max);
  IPickerRow? row;
  for (final r in rows) {
    if (r.option.id == id) row = r;
  }
  if (row == null) return List<IEntityOption>.from(chosen);
  if (row.selected) return chosen.where((c) => c.id != id).toList();
  if (row.disabled) return List<IEntityOption>.from(chosen);
  // 单选就是替换，不是追加
  if (!multiple) return [row.option];
  return [...chosen, row.option];
}

/// 移除一个已选项。不走 pickerRows，因为要移除的那个多半不在当前页里
List<IEntityOption> removePick(List<IEntityOption> chosen, String id) =>
    chosen.where((c) => c.id != id).toList();

/// 已选里有哪些不在当前这一页。界面要靠它把这些项额外显示出来——
/// 只渲染当前页的话，翻一页就看不见自己选了谁。
List<IEntityOption> offPageChosen(List<IEntityOption> chosen, List<IEntityOption> page) {
  final onPage = page.map((p) => p.id).toSet();
  return chosen.where((c) => !onPage.contains(c.id)).toList();
}

/// 已选里有几个是停用的。它们仍然算数，只是要标出来
List<IEntityOption> inactiveChosen(List<IEntityOption> chosen) =>
    chosen.where((c) => c.inactive).toList();

class IPickerSummary {
  const IPickerSummary({
    required this.count,
    required this.text,
    required this.full,
    required this.notice,
  });

  final int count;

  /// 「已选 3 / 5 人」。到上限时这句话本身就是解释
  final String text;
  final bool full;

  /// 已选里含停用项时的提醒。没有就是空串
  final String notice;
}

IPickerSummary pickerSummary(List<IEntityOption> chosen, {int? max, String unit = '项'}) {
  final count = chosen.length;
  final full = max != null && count >= max;
  final inactive = inactiveChosen(chosen).length;
  return IPickerSummary(
    count: count,
    text: max == null ? '已选 $count $unit' : '已选 $count / $max $unit',
    full: full,
    // 不说「请移除」：历史记录里的停用项本来就该留着
    notice: inactive > 0 ? '其中 $inactive $unit已停用，保留自历史记录' : '',
  );
}

/// 远程检索的空结果与「还没开始搜」是两件事，说成同一句话会让人以为库里没人
String pickerHint(String keyword, bool loading, int resultCount) {
  if (loading) return '检索中…';
  if (keyword.trim().isEmpty) return '输入姓名、工号或部门开始检索';
  if (resultCount == 0) return '没有匹配「${keyword.trim()}」的结果';
  return '';
}
