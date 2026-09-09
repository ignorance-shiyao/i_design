/// Ignorance Design · Flutter
///
/// Flutter 是唯一无法共享 CSS 与 TypeScript 的一端，因此：
///   - 令牌由 packages/common 的编译器生成 Dart 常量，逐值与 Web 端一致；
///   - 交互规则按同一套算法移植（见 src/logic/），由 scripts/check-parity.mjs 兜底。
///
/// 本文件由 packages/flutter/scripts/build-barrel.mjs 按目录生成，勿手改。
library i_design;

export 'src/tokens/tokens.dart';
export 'src/theme/i_theme.dart';
export 'src/icons/icons.dart';
export 'src/logic/chart.dart';
export 'src/logic/flow.dart';
export 'src/logic/number.dart';
export 'src/logic/overlay.dart';
export 'src/logic/pagination.dart';
export 'src/logic/select.dart';
export 'src/logic/table.dart';
export 'src/logic/tree.dart';
export 'src/logic/upload.dart';
export 'src/components/i_action_sheet.dart';
export 'src/components/i_alert.dart';
export 'src/components/i_avatar.dart';
export 'src/components/i_avatar_group.dart';
export 'src/components/i_badge.dart';
export 'src/components/i_breadcrumb.dart';
export 'src/components/i_button.dart';
export 'src/components/i_card.dart';
export 'src/components/i_cascader.dart';
export 'src/components/i_cell.dart';
export 'src/components/i_chart.dart';
export 'src/components/i_chart_extras.dart';
export 'src/components/i_chart_pie.dart';
export 'src/components/i_chart_scatter.dart';
export 'src/components/i_chat_message.dart';
export 'src/components/i_chat_sources.dart';
export 'src/components/i_chat_suggestions.dart';
export 'src/components/i_chat_thinking.dart';
export 'src/components/i_chat_tool_call.dart';
export 'src/components/i_chat_typing.dart';
export 'src/components/i_checkbox.dart';
export 'src/components/i_collapse.dart';
export 'src/components/i_date_picker.dart';
export 'src/components/i_descriptions.dart';
export 'src/components/i_divider.dart';
export 'src/components/i_drawer.dart';
export 'src/components/i_dropdown.dart';
export 'src/components/i_empty.dart';
export 'src/components/i_flow.dart';
export 'src/components/i_form.dart';
export 'src/components/i_grid.dart';
export 'src/components/i_icon.dart';
export 'src/components/i_input.dart';
export 'src/components/i_input_number.dart';
export 'src/components/i_list.dart';
export 'src/components/i_loading.dart';
export 'src/components/i_modal.dart';
export 'src/components/i_pagination.dart';
export 'src/components/i_popconfirm.dart';
export 'src/components/i_popover.dart';
export 'src/components/i_progress.dart';
export 'src/components/i_prompt_input.dart';
export 'src/components/i_radio.dart';
export 'src/components/i_rate.dart';
export 'src/components/i_result.dart';
export 'src/components/i_segmented.dart';
export 'src/components/i_select.dart';
export 'src/components/i_skeleton.dart';
export 'src/components/i_slider.dart';
export 'src/components/i_space.dart';
export 'src/components/i_sparkline.dart';
export 'src/components/i_statistic.dart';
export 'src/components/i_steps.dart';
export 'src/components/i_switch.dart';
export 'src/components/i_table.dart';
export 'src/components/i_tabs.dart';
export 'src/components/i_tag.dart';
export 'src/components/i_textarea.dart';
export 'src/components/i_timeline.dart';
export 'src/components/i_toast.dart';
export 'src/components/i_tooltip.dart';
export 'src/components/i_tree.dart';
export 'src/components/i_tree_select.dart';
export 'src/components/i_typography.dart';
export 'src/components/i_upload.dart';
