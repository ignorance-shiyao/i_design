/**
 * 由 scripts/build-capability-registry.mjs 按源码目录生成，请勿手改。
 * 每个字段都追得到具体文件；口径见 scripts/lib/registry.mjs。
 */
export interface CapabilityRow {
  /** 组件名，如 IButton */
  name: string
  /** 各端源码路径，没有该端实现时为 null */
  sources: Record<string, string | null>
  /** 该端是否有源码 */
  ends: Record<string, boolean>
  /** 使用方是否真的拿得到：有源码但没从入口导出，等于没有 */
  consumable: Record<string, boolean>
  maturity: 'stable' | 'partial'
  /** 主文档入口与该页演示数量；没有独立文档页时为 null */
  doc: { route: string; page: string; demos: number } | null
  /** 模板里真的用到了这个组件的文档路由 */
  demoRoutes: string[]
  /** 属性里的字面量联合，即「这个组件有几种样子」 */
  states: Record<string, string[]>
}

export const capabilityRegistry: readonly CapabilityRow[] = [
  {
    "name": "IAffix",
    "sources": {
      "vue-next": "src/components/IAffix.vue",
      "vue": "packages/vue/src/components/IAffix.vue",
      "react": "packages/react/src/components/Affix.tsx",
      "miniprogram": "packages/miniprogram/src/components/affix",
      "flutter": "packages/flutter/lib/src/components/i_affix.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/layout"
    ],
    "states": {}
  },
  {
    "name": "IAgentScreen",
    "sources": {
      "vue-next": "src/components/IAgentScreen.vue",
      "vue": "packages/vue/src/components/IAgentScreen.vue",
      "react": "packages/react/src/components/AgentScreen.tsx",
      "miniprogram": "packages/miniprogram/src/components/agent-screen",
      "flutter": "packages/flutter/lib/src/components/i_agent_screen.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chat"
    ],
    "states": {}
  },
  {
    "name": "IAgentTasks",
    "sources": {
      "vue-next": "src/components/IAgentTasks.vue",
      "vue": "packages/vue/src/components/IAgentTasks.vue",
      "react": "packages/react/src/components/AgentTasks.tsx",
      "miniprogram": "packages/miniprogram/src/components/agent-tasks",
      "flutter": "packages/flutter/lib/src/components/i_agent.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chat"
    ],
    "states": {
      "variant": [
        "capsule",
        "list"
      ]
    }
  },
  {
    "name": "IAlert",
    "sources": {
      "vue-next": "src/components/IAlert.vue",
      "vue": "packages/vue/src/components/IAlert.vue",
      "react": "packages/react/src/components/Alert.tsx",
      "miniprogram": "packages/miniprogram/src/components/alert",
      "flutter": "packages/flutter/lib/src/components/i_alert.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/alert",
      "page": "src/pages/components/AlertPage.vue",
      "demos": 2
    },
    "demoRoutes": [
      "/components/alert"
    ],
    "states": {
      "type": [
        "info",
        "success",
        "warning",
        "danger"
      ]
    }
  },
  {
    "name": "IAnchor",
    "sources": {
      "vue-next": "src/components/IAnchor.vue",
      "vue": "packages/vue/src/components/IAnchor.vue",
      "react": "packages/react/src/components/Anchor.tsx",
      "miniprogram": "packages/miniprogram/src/components/anchor",
      "flutter": "packages/flutter/lib/src/components/i_anchor.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/navigation"
    ],
    "states": {}
  },
  {
    "name": "IApprovalCard",
    "sources": {
      "vue-next": "src/components/IApprovalCard.vue",
      "vue": "packages/vue/src/components/IApprovalCard.vue",
      "react": "packages/react/src/components/ApprovalCard.tsx",
      "miniprogram": "packages/miniprogram/src/components/approval-card",
      "flutter": "packages/flutter/lib/src/components/i_agent.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/config-provider",
      "/components/chat"
    ],
    "states": {}
  },
  {
    "name": "IAutoComplete",
    "sources": {
      "vue-next": "src/components/IAutoComplete.vue",
      "vue": "packages/vue/src/components/IAutoComplete.vue",
      "react": "packages/react/src/components/AutoComplete.tsx",
      "miniprogram": "packages/miniprogram/src/components/auto-complete",
      "flutter": "packages/flutter/lib/src/components/i_auto_complete.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/data-entry"
    ],
    "states": {}
  },
  {
    "name": "IAvatar",
    "sources": {
      "vue-next": "src/components/IAvatar.vue",
      "vue": "packages/vue/src/components/IAvatar.vue",
      "react": "packages/react/src/components/Avatar.tsx",
      "miniprogram": "packages/miniprogram/src/components/avatar",
      "flutter": "packages/flutter/lib/src/components/i_avatar.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/avatar",
      "page": "src/pages/components/AvatarPage.vue",
      "demos": 4
    },
    "demoRoutes": [
      "/components/avatar",
      "/components/badge",
      "/components/descriptions",
      "/components/skeleton",
      "/components/data-entry"
    ],
    "states": {
      "size": [
        "sm",
        "md",
        "lg"
      ],
      "shape": [
        "circle",
        "square"
      ]
    }
  },
  {
    "name": "IAvatarGroup",
    "sources": {
      "vue-next": "src/components/IAvatarGroup.vue",
      "vue": "packages/vue/src/components/IAvatarGroup.vue",
      "react": "packages/react/src/components/AvatarGroup.tsx",
      "miniprogram": "packages/miniprogram/src/components/avatar-group",
      "flutter": "packages/flutter/lib/src/components/i_avatar_group.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/avatar"
    ],
    "states": {
      "size": [
        "sm",
        "md",
        "lg"
      ]
    }
  },
  {
    "name": "IBackTop",
    "sources": {
      "vue-next": "src/components/IBackTop.vue",
      "vue": "packages/vue/src/components/IBackTop.vue",
      "react": "packages/react/src/components/BackTop.tsx",
      "miniprogram": "packages/miniprogram/src/components/back-top",
      "flutter": "packages/flutter/lib/src/components/i_back_top.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/layout"
    ],
    "states": {}
  },
  {
    "name": "IBadge",
    "sources": {
      "vue-next": "src/components/IBadge.vue",
      "vue": "packages/vue/src/components/IBadge.vue",
      "react": "packages/react/src/components/Badge.tsx",
      "miniprogram": "packages/miniprogram/src/components/badge",
      "flutter": "packages/flutter/lib/src/components/i_badge.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/badge",
      "page": "src/pages/components/BadgePage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/badge"
    ],
    "states": {
      "type": [
        "brand",
        "success",
        "warning",
        "danger"
      ]
    }
  },
  {
    "name": "IBreadcrumb",
    "sources": {
      "vue-next": "src/components/IBreadcrumb.vue",
      "vue": "packages/vue/src/components/IBreadcrumb.vue",
      "react": "packages/react/src/components/Breadcrumb.tsx",
      "miniprogram": "packages/miniprogram/src/components/breadcrumb",
      "flutter": "packages/flutter/lib/src/components/i_breadcrumb.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/breadcrumb",
      "page": "src/pages/components/BreadcrumbPage.vue",
      "demos": 2
    },
    "demoRoutes": [
      "/components/breadcrumb"
    ],
    "states": {}
  },
  {
    "name": "IButton",
    "sources": {
      "vue-next": "src/components/IButton.vue",
      "vue": "packages/vue/src/components/IButton.vue",
      "react": "packages/react/src/components/Button.tsx",
      "miniprogram": "packages/miniprogram/src/components/button",
      "flutter": "packages/flutter/lib/src/components/i_button.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/button",
      "page": "src/pages/components/ButtonPage.vue",
      "demos": 5
    },
    "demoRoutes": [
      "/components/button",
      "/components/icon",
      "/components/form",
      "/components/badge",
      "/components/descriptions",
      "/components/skeleton",
      "/components/page-state",
      "/components/markdown",
      "/components/result",
      "/components/popconfirm",
      "/components/overlay",
      "/components/navigation",
      "/components/card",
      "/components/table",
      "/components/modal",
      "/components/input-otp",
      "/components/config-provider",
      "/components/command-search",
      "/components/sticky-tool",
      "/components/image-viewer",
      "/components/steps",
      "/components/tooltip",
      "/components/empty",
      "/components/loading",
      "/components/drawer",
      "/components/message",
      "/components/chat",
      "/components/layout",
      "/components/data-display",
      "/components/chart",
      "/components/flow",
      "/components/mobile"
    ],
    "states": {
      "variant": [
        "primary",
        "secondary",
        "text",
        "danger"
      ],
      "size": [
        "sm",
        "md",
        "lg"
      ]
    }
  },
  {
    "name": "IButtonGroup",
    "sources": {
      "vue-next": "src/components/IButtonGroup.vue",
      "vue": "packages/vue/src/components/IButtonGroup.vue",
      "react": "packages/react/src/components/ButtonGroup.tsx",
      "miniprogram": "packages/miniprogram/src/components/button-group",
      "flutter": "packages/flutter/lib/src/components/i_button_group.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/button"
    ],
    "states": {}
  },
  {
    "name": "ICalendar",
    "sources": {
      "vue-next": "src/components/ICalendar.vue",
      "vue": "packages/vue/src/components/ICalendar.vue",
      "react": "packages/react/src/components/Calendar.tsx",
      "miniprogram": "packages/miniprogram/src/components/calendar",
      "flutter": "packages/flutter/lib/src/components/i_calendar.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/data-display"
    ],
    "states": {
      "mode": [
        "single",
        "range"
      ]
    }
  },
  {
    "name": "ICard",
    "sources": {
      "vue-next": "src/components/ICard.vue",
      "vue": "packages/vue/src/components/ICard.vue",
      "react": "packages/react/src/components/Card.tsx",
      "miniprogram": "packages/miniprogram/src/components/card",
      "flutter": "packages/flutter/lib/src/components/i_card.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/card",
      "page": "src/pages/components/CardPage.vue",
      "demos": 2
    },
    "demoRoutes": [
      "/components/skeleton",
      "/components/card",
      "/components/loading",
      "/components/data-display",
      "/components/chart"
    ],
    "states": {}
  },
  {
    "name": "ICarousel",
    "sources": {
      "vue-next": "src/components/ICarousel.vue",
      "vue": "packages/vue/src/components/ICarousel.vue",
      "react": "packages/react/src/components/Carousel.tsx",
      "miniprogram": "packages/miniprogram/src/components/carousel",
      "flutter": "packages/flutter/lib/src/components/i_carousel.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/data-display"
    ],
    "states": {}
  },
  {
    "name": "ICascader",
    "sources": {
      "vue-next": "src/components/ICascader.vue",
      "vue": "packages/vue/src/components/ICascader.vue",
      "react": "packages/react/src/components/Cascader.tsx",
      "miniprogram": "packages/miniprogram/src/components/cascader",
      "flutter": "packages/flutter/lib/src/components/i_cascader.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/cascader",
      "page": "src/pages/components/CascaderPage.vue",
      "demos": 2
    },
    "demoRoutes": [
      "/components/cascader",
      "/components/config-provider"
    ],
    "states": {}
  },
  {
    "name": "IChart",
    "sources": {
      "vue-next": "src/components/IChart.vue",
      "vue": "packages/vue/src/components/IChart.vue",
      "react": "packages/react/src/components/Chart.tsx",
      "miniprogram": "packages/miniprogram/src/components/chart",
      "flutter": "packages/flutter/lib/src/components/i_chart.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/chart",
      "page": "src/pages/components/ChartPage.vue",
      "demos": 24
    },
    "demoRoutes": [
      "/components/chart"
    ],
    "states": {
      "type": [
        "line",
        "area",
        "bar"
      ],
      "curve": [
        "linear",
        "step"
      ],
      "orientation": [
        "vertical",
        "horizontal"
      ],
      "rank": [
        "desc",
        "asc",
        "none"
      ]
    }
  },
  {
    "name": "IChartBox",
    "sources": {
      "vue-next": "src/components/IChartBox.vue",
      "vue": "packages/vue/src/components/IChartBox.vue",
      "react": "packages/react/src/components/ChartBox.tsx",
      "miniprogram": "packages/miniprogram/src/components/chart-box",
      "flutter": "packages/flutter/lib/src/components/i_chart_stats.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chart"
    ],
    "states": {}
  },
  {
    "name": "IChartFrame",
    "sources": {
      "vue-next": "src/components/IChartFrame.vue",
      "vue": "packages/vue/src/components/IChartFrame.vue",
      "react": "packages/react/src/components/ChartFrame.tsx",
      "miniprogram": "packages/miniprogram/src/components/chart-frame",
      "flutter": "packages/flutter/lib/src/components/i_chart_frame.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chart"
    ],
    "states": {}
  },
  {
    "name": "IChartFunnel",
    "sources": {
      "vue-next": "src/components/IChartFunnel.vue",
      "vue": "packages/vue/src/components/IChartFunnel.vue",
      "react": "packages/react/src/components/ChartFunnel.tsx",
      "miniprogram": "packages/miniprogram/src/components/chart-funnel",
      "flutter": "packages/flutter/lib/src/components/i_chart_extras.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chart"
    ],
    "states": {}
  },
  {
    "name": "IChartGantt",
    "sources": {
      "vue-next": "src/components/IChartGantt.vue",
      "vue": "packages/vue/src/components/IChartGantt.vue",
      "react": "packages/react/src/components/ChartGantt.tsx",
      "miniprogram": "packages/miniprogram/src/components/chart-gantt",
      "flutter": "packages/flutter/lib/src/components/i_chart_gantt.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chart"
    ],
    "states": {}
  },
  {
    "name": "IChartGauge",
    "sources": {
      "vue-next": "src/components/IChartGauge.vue",
      "vue": "packages/vue/src/components/IChartGauge.vue",
      "react": "packages/react/src/components/ChartGauge.tsx",
      "miniprogram": "packages/miniprogram/src/components/chart-gauge",
      "flutter": "packages/flutter/lib/src/components/i_chart_extras.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chart"
    ],
    "states": {
      "thresholds": [
        "success",
        "warning",
        "danger"
      ]
    }
  },
  {
    "name": "IChartHeatmap",
    "sources": {
      "vue-next": "src/components/IChartHeatmap.vue",
      "vue": "packages/vue/src/components/IChartHeatmap.vue",
      "react": "packages/react/src/components/ChartHeatmap.tsx",
      "miniprogram": "packages/miniprogram/src/components/chart-heatmap",
      "flutter": "packages/flutter/lib/src/components/i_chart_extras.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chart"
    ],
    "states": {}
  },
  {
    "name": "IChartPie",
    "sources": {
      "vue-next": "src/components/IChartPie.vue",
      "vue": "packages/vue/src/components/IChartPie.vue",
      "react": "packages/react/src/components/ChartPie.tsx",
      "miniprogram": "packages/miniprogram/src/components/chart-pie",
      "flutter": "packages/flutter/lib/src/components/i_chart_pie.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/config-provider",
      "/components/chart"
    ],
    "states": {}
  },
  {
    "name": "IChartRadar",
    "sources": {
      "vue-next": "src/components/IChartRadar.vue",
      "vue": "packages/vue/src/components/IChartRadar.vue",
      "react": "packages/react/src/components/ChartRadar.tsx",
      "miniprogram": "packages/miniprogram/src/components/chart-radar",
      "flutter": "packages/flutter/lib/src/components/i_chart_extras.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chart"
    ],
    "states": {}
  },
  {
    "name": "IChartSankey",
    "sources": {
      "vue-next": "src/components/IChartSankey.vue",
      "vue": "packages/vue/src/components/IChartSankey.vue",
      "react": "packages/react/src/components/ChartSankey.tsx",
      "miniprogram": "packages/miniprogram/src/components/chart-sankey",
      "flutter": "packages/flutter/lib/src/components/i_chart_sankey.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chart"
    ],
    "states": {}
  },
  {
    "name": "IChartScatter",
    "sources": {
      "vue-next": "src/components/IChartScatter.vue",
      "vue": "packages/vue/src/components/IChartScatter.vue",
      "react": "packages/react/src/components/ChartScatter.tsx",
      "miniprogram": "packages/miniprogram/src/components/chart-scatter",
      "flutter": "packages/flutter/lib/src/components/i_chart_scatter.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chart"
    ],
    "states": {}
  },
  {
    "name": "IChartTreemap",
    "sources": {
      "vue-next": "src/components/IChartTreemap.vue",
      "vue": "packages/vue/src/components/IChartTreemap.vue",
      "react": "packages/react/src/components/ChartTreemap.tsx",
      "miniprogram": "packages/miniprogram/src/components/chart-treemap",
      "flutter": "packages/flutter/lib/src/components/i_chart_treemap.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chart"
    ],
    "states": {}
  },
  {
    "name": "IChartWaterfall",
    "sources": {
      "vue-next": "src/components/IChartWaterfall.vue",
      "vue": "packages/vue/src/components/IChartWaterfall.vue",
      "react": "packages/react/src/components/ChartWaterfall.tsx",
      "miniprogram": "packages/miniprogram/src/components/chart-waterfall",
      "flutter": "packages/flutter/lib/src/components/i_chart_stats.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chart"
    ],
    "states": {}
  },
  {
    "name": "IChartWordCloud",
    "sources": {
      "vue-next": "src/components/IChartWordCloud.vue",
      "vue": "packages/vue/src/components/IChartWordCloud.vue",
      "react": "packages/react/src/components/ChartWordCloud.tsx",
      "miniprogram": "packages/miniprogram/src/components/chart-word-cloud",
      "flutter": "packages/flutter/lib/src/components/i_chart_word_cloud.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chart"
    ],
    "states": {}
  },
  {
    "name": "IChartZoom",
    "sources": {
      "vue-next": "src/components/IChartZoom.vue",
      "vue": "packages/vue/src/components/IChartZoom.vue",
      "react": "packages/react/src/components/ChartZoom.tsx",
      "miniprogram": "packages/miniprogram/src/components/chart-zoom",
      "flutter": "packages/flutter/lib/src/components/i_chart_zoom.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chart"
    ],
    "states": {}
  },
  {
    "name": "IChatList",
    "sources": {
      "vue-next": "src/components/IChatList.vue",
      "vue": "packages/vue/src/components/IChatList.vue",
      "react": "packages/react/src/components/ChatList.tsx",
      "miniprogram": "packages/miniprogram/src/components/chat-list",
      "flutter": "packages/flutter/lib/src/components/i_chat_list.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chat"
    ],
    "states": {
      "view": [
        "active",
        "archived"
      ]
    }
  },
  {
    "name": "IChatMessage",
    "sources": {
      "vue-next": "src/components/IChatMessage.vue",
      "vue": "packages/vue/src/components/IChatMessage.vue",
      "react": "packages/react/src/components/ChatMessage.tsx",
      "miniprogram": "packages/miniprogram/src/components/chat-message",
      "flutter": "packages/flutter/lib/src/components/i_chat_message.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/config-provider",
      "/components/chat"
    ],
    "states": {
      "role": [
        "user",
        "assistant"
      ]
    }
  },
  {
    "name": "IChatSources",
    "sources": {
      "vue-next": "src/components/IChatSources.vue",
      "vue": "packages/vue/src/components/IChatSources.vue",
      "react": "packages/react/src/components/ChatSources.tsx",
      "miniprogram": "packages/miniprogram/src/components/chat-sources",
      "flutter": "packages/flutter/lib/src/components/i_chat_sources.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chat"
    ],
    "states": {}
  },
  {
    "name": "IChatSuggestions",
    "sources": {
      "vue-next": "src/components/IChatSuggestions.vue",
      "vue": "packages/vue/src/components/IChatSuggestions.vue",
      "react": "packages/react/src/components/ChatSuggestions.tsx",
      "miniprogram": "packages/miniprogram/src/components/chat-suggestions",
      "flutter": "packages/flutter/lib/src/components/i_chat_suggestions.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chat"
    ],
    "states": {}
  },
  {
    "name": "IChatThinking",
    "sources": {
      "vue-next": "src/components/IChatThinking.vue",
      "vue": "packages/vue/src/components/IChatThinking.vue",
      "react": "packages/react/src/components/ChatThinking.tsx",
      "miniprogram": "packages/miniprogram/src/components/chat-thinking",
      "flutter": "packages/flutter/lib/src/components/i_chat_thinking.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chat"
    ],
    "states": {}
  },
  {
    "name": "IChatToolCall",
    "sources": {
      "vue-next": "src/components/IChatToolCall.vue",
      "vue": "packages/vue/src/components/IChatToolCall.vue",
      "react": "packages/react/src/components/ChatToolCall.tsx",
      "miniprogram": "packages/miniprogram/src/components/chat-tool",
      "flutter": "packages/flutter/lib/src/components/i_chat_tool_call.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chat"
    ],
    "states": {
      "status": [
        "running",
        "success",
        "error"
      ]
    }
  },
  {
    "name": "IChatTyping",
    "sources": {
      "vue-next": "src/components/IChatTyping.vue",
      "vue": "packages/vue/src/components/IChatTyping.vue",
      "react": "packages/react/src/components/ChatTyping.tsx",
      "miniprogram": "packages/miniprogram/src/components/chat-typing",
      "flutter": "packages/flutter/lib/src/components/i_chat_typing.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chat"
    ],
    "states": {}
  },
  {
    "name": "ICheckTag",
    "sources": {
      "vue-next": "src/components/ICheckTag.vue",
      "vue": "packages/vue/src/components/ICheckTag.vue",
      "react": "packages/react/src/components/CheckTag.tsx",
      "miniprogram": "packages/miniprogram/src/components/check-tag",
      "flutter": "packages/flutter/lib/src/components/i_check_tag.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/tag"
    ],
    "states": {}
  },
  {
    "name": "ICheckbox",
    "sources": {
      "vue-next": "src/components/ICheckbox.vue",
      "vue": "packages/vue/src/components/ICheckbox.vue",
      "react": "packages/react/src/components/Checkbox.tsx",
      "miniprogram": "packages/miniprogram/src/components/checkbox",
      "flutter": "packages/flutter/lib/src/components/i_checkbox.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/checkbox",
      "page": "src/pages/components/CheckboxPage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/form",
      "/components/checkbox"
    ],
    "states": {}
  },
  {
    "name": "ICheckboxGroup",
    "sources": {
      "vue-next": "src/components/ICheckboxGroup.vue",
      "vue": "packages/vue/src/components/ICheckboxGroup.vue",
      "react": "packages/react/src/components/Checkbox.tsx",
      "miniprogram": "packages/miniprogram/src/components/checkbox",
      "flutter": "packages/flutter/lib/src/components/i_checkbox.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/checkbox"
    ],
    "states": {
      "direction": [
        "horizontal",
        "vertical"
      ]
    }
  },
  {
    "name": "ICodeBlock",
    "sources": {
      "vue-next": "src/components/ICodeBlock.vue",
      "vue": "packages/vue/src/components/ICodeBlock.vue",
      "react": "packages/react/src/components/CodeBlock.tsx",
      "miniprogram": "packages/miniprogram/src/components/code-block",
      "flutter": "packages/flutter/lib/src/components/i_code_block.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/code-block",
      "page": "src/pages/components/CodeBlockPage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/code-block"
    ],
    "states": {}
  },
  {
    "name": "ICol",
    "sources": {
      "vue-next": "src/components/ICol.vue",
      "vue": "packages/vue/src/components/ICol.vue",
      "react": "packages/react/src/components/Grid.tsx",
      "miniprogram": "packages/miniprogram/src/components/col",
      "flutter": "packages/flutter/lib/src/components/i_grid.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/layout",
      "/components/data-display",
      "/components/chart"
    ],
    "states": {}
  },
  {
    "name": "ICollapse",
    "sources": {
      "vue-next": "src/components/ICollapse.vue",
      "vue": "packages/vue/src/components/ICollapse.vue",
      "react": "packages/react/src/components/Collapse.tsx",
      "miniprogram": "packages/miniprogram/src/components/collapse",
      "flutter": "packages/flutter/lib/src/components/i_collapse.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/collapse",
      "page": "src/pages/components/CollapsePage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/collapse"
    ],
    "states": {}
  },
  {
    "name": "IColorPicker",
    "sources": {
      "vue-next": "src/components/IColorPicker.vue",
      "vue": "packages/vue/src/components/IColorPicker.vue",
      "react": "packages/react/src/components/ColorPicker.tsx",
      "miniprogram": "packages/miniprogram/src/components/color-picker",
      "flutter": "packages/flutter/lib/src/components/i_color_picker.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/layout"
    ],
    "states": {}
  },
  {
    "name": "ICommandSearch",
    "sources": {
      "vue-next": "src/components/ICommandSearch.vue",
      "vue": "packages/vue/src/components/ICommandSearch.vue",
      "react": "packages/react/src/components/CommandSearch.tsx",
      "miniprogram": "packages/miniprogram/src/components/command-search",
      "flutter": "packages/flutter/lib/src/components/i_command_search.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/command-search",
      "page": "src/pages/components/CommandSearchPage.vue",
      "demos": 1
    },
    "demoRoutes": [
      "/components/command-search"
    ],
    "states": {}
  },
  {
    "name": "IComment",
    "sources": {
      "vue-next": "src/components/IComment.vue",
      "vue": "packages/vue/src/components/IComment.vue",
      "react": "packages/react/src/components/Comment.tsx",
      "miniprogram": "packages/miniprogram/src/components/comment",
      "flutter": "packages/flutter/lib/src/components/i_comment.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/comment",
      "page": "src/pages/components/CommentPage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/comment"
    ],
    "states": {}
  },
  {
    "name": "IConfigProvider",
    "sources": {
      "vue-next": "src/components/IConfigProvider.vue",
      "vue": "packages/vue/src/components/IConfigProvider.vue",
      "react": "packages/react/src/components/ConfigProvider.tsx",
      "miniprogram": "packages/miniprogram/src/components/config-provider",
      "flutter": "packages/flutter/lib/src/components/i_config_provider.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/config-provider",
      "page": "src/pages/components/ConfigProviderPage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/config-provider"
    ],
    "states": {
      "size": [
        "sm",
        "md",
        "lg"
      ]
    }
  },
  {
    "name": "IContextCards",
    "sources": {
      "vue-next": "src/components/IContextCards.vue",
      "vue": "packages/vue/src/components/IContextCards.vue",
      "react": "packages/react/src/components/ContextCards.tsx",
      "miniprogram": "packages/miniprogram/src/components/context-cards",
      "flutter": "packages/flutter/lib/src/components/i_agent_context.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chat"
    ],
    "states": {}
  },
  {
    "name": "ICountdown",
    "sources": {
      "vue-next": "src/components/ICountdown.vue",
      "vue": "packages/vue/src/components/ICountdown.vue",
      "react": "packages/react/src/components/Countdown.tsx",
      "miniprogram": "packages/miniprogram/src/components/countdown",
      "flutter": "packages/flutter/lib/src/components/i_countdown.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/data-display"
    ],
    "states": {
      "type": [
        "default",
        "brand",
        "success",
        "danger"
      ],
      "size": [
        "md",
        "sm"
      ]
    }
  },
  {
    "name": "IDatePicker",
    "sources": {
      "vue-next": "src/components/IDatePicker.vue",
      "vue": "packages/vue/src/components/IDatePicker.vue",
      "react": "packages/react/src/components/DatePicker.tsx",
      "miniprogram": "packages/miniprogram/src/components/date-picker",
      "flutter": "packages/flutter/lib/src/components/i_date_picker.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/date-picker",
      "page": "src/pages/components/DatePickerPage.vue",
      "demos": 5
    },
    "demoRoutes": [
      "/components/date-picker",
      "/components/config-provider"
    ],
    "states": {
      "size": [
        "sm",
        "md",
        "lg"
      ]
    }
  },
  {
    "name": "IDescriptions",
    "sources": {
      "vue-next": "src/components/IDescriptions.vue",
      "vue": "packages/vue/src/components/IDescriptions.vue",
      "react": "packages/react/src/components/Descriptions.tsx",
      "miniprogram": "packages/miniprogram/src/components/descriptions",
      "flutter": "packages/flutter/lib/src/components/i_descriptions.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/descriptions",
      "page": "src/pages/components/DescriptionsPage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/descriptions",
      "/components/result"
    ],
    "states": {
      "layout": [
        "horizontal",
        "vertical"
      ],
      "size": [
        "sm",
        "md"
      ]
    }
  },
  {
    "name": "IDiffTable",
    "sources": {
      "vue-next": "src/components/IDiffTable.vue",
      "vue": "packages/vue/src/components/IDiffTable.vue",
      "react": "packages/react/src/components/DiffTable.tsx",
      "miniprogram": "packages/miniprogram/src/components/diff-table",
      "flutter": "packages/flutter/lib/src/components/i_agent_context.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chat"
    ],
    "states": {}
  },
  {
    "name": "IDivider",
    "sources": {
      "vue-next": "src/components/IDivider.vue",
      "vue": "packages/vue/src/components/IDivider.vue",
      "react": "packages/react/src/components/Divider.tsx",
      "miniprogram": "packages/miniprogram/src/components/divider",
      "flutter": "packages/flutter/lib/src/components/i_divider.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/divider",
      "page": "src/pages/components/DividerPage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/divider"
    ],
    "states": {
      "direction": [
        "horizontal",
        "vertical"
      ],
      "align": [
        "left",
        "center",
        "right"
      ]
    }
  },
  {
    "name": "IDrawer",
    "sources": {
      "vue-next": "src/components/IDrawer.vue",
      "vue": "packages/vue/src/components/IDrawer.vue",
      "react": "packages/react/src/components/Drawer.tsx",
      "miniprogram": "packages/miniprogram/src/components/drawer",
      "flutter": "packages/flutter/lib/src/components/i_drawer.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/drawer",
      "page": "src/pages/components/DrawerPage.vue",
      "demos": 2
    },
    "demoRoutes": [
      "/components/drawer"
    ],
    "states": {
      "placement": [
        "right",
        "left",
        "top",
        "bottom"
      ]
    }
  },
  {
    "name": "IDropdown",
    "sources": {
      "vue-next": "src/components/IDropdown.vue",
      "vue": "packages/vue/src/components/IDropdown.vue",
      "react": "packages/react/src/components/Dropdown.tsx",
      "miniprogram": "packages/miniprogram/src/components/dropdown",
      "flutter": "packages/flutter/lib/src/components/i_dropdown.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/icon",
      "/components/overlay"
    ],
    "states": {}
  },
  {
    "name": "IEmpty",
    "sources": {
      "vue-next": "src/components/IEmpty.vue",
      "vue": "packages/vue/src/components/IEmpty.vue",
      "react": "packages/react/src/components/Empty.tsx",
      "miniprogram": "packages/miniprogram/src/components/empty",
      "flutter": "packages/flutter/lib/src/components/i_empty.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/empty",
      "page": "src/pages/components/EmptyPage.vue",
      "demos": 2
    },
    "demoRoutes": [
      "/components/config-provider",
      "/components/empty"
    ],
    "states": {
      "type": [
        "empty",
        "search",
        "error",
        "permission"
      ],
      "size": [
        "sm",
        "md"
      ]
    }
  },
  {
    "name": "IFineTuneCard",
    "sources": {
      "vue-next": "src/components/IFineTuneCard.vue",
      "vue": "packages/vue/src/components/IFineTuneCard.vue",
      "react": "packages/react/src/components/FineTuneCard.tsx",
      "miniprogram": "packages/miniprogram/src/components/fine-tune-card",
      "flutter": "packages/flutter/lib/src/components/i_fine_tune_card.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chat"
    ],
    "states": {}
  },
  {
    "name": "IFloatButton",
    "sources": {
      "vue-next": "src/components/IFloatButton.vue",
      "vue": "packages/vue/src/components/IFloatButton.vue",
      "react": "packages/react/src/components/FloatButton.tsx",
      "miniprogram": "packages/miniprogram/src/components/float-button",
      "flutter": "packages/flutter/lib/src/components/i_float_button.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/float-button",
      "page": "src/pages/components/FloatButtonPage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/float-button"
    ],
    "states": {
      "placement": [
        "bottom-right",
        "bottom-left"
      ]
    }
  },
  {
    "name": "IFlow",
    "sources": {
      "vue-next": "src/components/IFlow.vue",
      "vue": "packages/vue/src/components/IFlow.vue",
      "react": "packages/react/src/components/Flow.tsx",
      "miniprogram": "packages/miniprogram/src/components/flow",
      "flutter": "packages/flutter/lib/src/components/i_flow.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/flow",
      "page": "src/pages/components/FlowPage.vue",
      "demos": 1
    },
    "demoRoutes": [
      "/components/flow"
    ],
    "states": {}
  },
  {
    "name": "IForm",
    "sources": {
      "vue-next": "src/components/IForm.vue",
      "vue": "packages/vue/src/components/IForm.vue",
      "react": "packages/react/src/components/Form.tsx",
      "miniprogram": "packages/miniprogram/src/components/form",
      "flutter": "packages/flutter/lib/src/components/i_form.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/form",
      "page": "src/pages/components/FormPage.vue",
      "demos": 2
    },
    "demoRoutes": [
      "/components/form"
    ],
    "states": {
      "labelPlacement": [
        "left",
        "top"
      ]
    }
  },
  {
    "name": "IFormItem",
    "sources": {
      "vue-next": "src/components/IFormItem.vue",
      "vue": "packages/vue/src/components/IFormItem.vue",
      "react": "packages/react/src/components/FormItem.tsx",
      "miniprogram": "packages/miniprogram/src/components/form-item",
      "flutter": "packages/flutter/lib/src/components/i_form.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/form"
    ],
    "states": {}
  },
  {
    "name": "IIcon",
    "sources": {
      "vue-next": "src/components/IIcon.vue",
      "vue": "packages/vue/src/components/IIcon.vue",
      "react": "packages/react/src/components/Icon.tsx",
      "miniprogram": "packages/miniprogram/src/components/icon",
      "flutter": "packages/flutter/lib/src/components/i_icon.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/icon",
      "page": "src/pages/components/IconPage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/icon",
      "/components/badge",
      "/components/popconfirm"
    ],
    "states": {
      "variant": [
        "stroke",
        "fill"
      ]
    }
  },
  {
    "name": "IImage",
    "sources": {
      "vue-next": "src/components/IImage.vue",
      "vue": "packages/vue/src/components/IImage.vue",
      "react": "packages/react/src/components/Image.tsx",
      "miniprogram": "packages/miniprogram/src/components/image",
      "flutter": "packages/flutter/lib/src/components/i_image.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/layout"
    ],
    "states": {
      "fit": [
        "cover",
        "contain",
        "fill",
        "none"
      ]
    }
  },
  {
    "name": "IImageViewer",
    "sources": {
      "vue-next": "src/components/IImageViewer.vue",
      "vue": "packages/vue/src/components/IImageViewer.vue",
      "react": "packages/react/src/components/ImageViewer.tsx",
      "miniprogram": "packages/miniprogram/src/components/image-viewer",
      "flutter": "packages/flutter/lib/src/components/i_image_viewer.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/image-viewer",
      "page": "src/pages/components/ImageViewerPage.vue",
      "demos": 2
    },
    "demoRoutes": [
      "/components/image-viewer"
    ],
    "states": {}
  },
  {
    "name": "IInfiniteScroll",
    "sources": {
      "vue-next": "src/components/IInfiniteScroll.vue",
      "vue": "packages/vue/src/components/IInfiniteScroll.vue",
      "react": "packages/react/src/components/InfiniteScroll.tsx",
      "miniprogram": "packages/miniprogram/src/components/infinite-scroll",
      "flutter": "packages/flutter/lib/src/components/i_infinite_scroll.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/mobile"
    ],
    "states": {}
  },
  {
    "name": "IInput",
    "sources": {
      "vue-next": "src/components/IInput.vue",
      "vue": "packages/vue/src/components/IInput.vue",
      "react": "packages/react/src/components/Input.tsx",
      "miniprogram": "packages/miniprogram/src/components/input",
      "flutter": "packages/flutter/lib/src/components/i_input.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/input",
      "page": "src/pages/components/InputPage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/icon",
      "/components/form",
      "/components/input",
      "/components/modal",
      "/components/config-provider",
      "/components/qrcode",
      "/components/input-adornment",
      "/components/drawer"
    ],
    "states": {
      "size": [
        "sm",
        "md",
        "lg"
      ]
    }
  },
  {
    "name": "IInputAdornment",
    "sources": {
      "vue-next": "src/components/IInputAdornment.vue",
      "vue": "packages/vue/src/components/IInputAdornment.vue",
      "react": "packages/react/src/components/InputAdornment.tsx",
      "miniprogram": "packages/miniprogram/src/components/input-adornment",
      "flutter": "packages/flutter/lib/src/components/i_input_adornment.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/input-adornment",
      "page": "src/pages/components/InputAdornmentPage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/input-adornment"
    ],
    "states": {}
  },
  {
    "name": "IInputNumber",
    "sources": {
      "vue-next": "src/components/IInputNumber.vue",
      "vue": "packages/vue/src/components/IInputNumber.vue",
      "react": "packages/react/src/components/InputNumber.tsx",
      "miniprogram": "packages/miniprogram/src/components/input-number",
      "flutter": "packages/flutter/lib/src/components/i_input_number.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/input-adornment",
      "/components/data-entry"
    ],
    "states": {
      "size": [
        "sm",
        "md",
        "lg"
      ]
    }
  },
  {
    "name": "IInputOtp",
    "sources": {
      "vue-next": "src/components/IInputOtp.vue",
      "vue": "packages/vue/src/components/IInputOtp.vue",
      "react": "packages/react/src/components/InputOtp.tsx",
      "miniprogram": "packages/miniprogram/src/components/input-otp",
      "flutter": "packages/flutter/lib/src/components/i_input_otp.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/input-otp",
      "page": "src/pages/components/InputOtpPage.vue",
      "demos": 4
    },
    "demoRoutes": [
      "/components/input-otp"
    ],
    "states": {}
  },
  {
    "name": "IInsightCards",
    "sources": {
      "vue-next": "src/components/IInsightCards.vue",
      "vue": "packages/vue/src/components/IInsightCards.vue",
      "react": "packages/react/src/components/InsightCards.tsx",
      "miniprogram": "packages/miniprogram/src/components/insight-cards",
      "flutter": "packages/flutter/lib/src/components/i_insight_cards.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chat"
    ],
    "states": {}
  },
  {
    "name": "ILayout",
    "sources": {
      "vue-next": "src/components/ILayout.vue",
      "vue": "packages/vue/src/components/ILayout.vue",
      "react": "packages/react/src/components/Layout.tsx",
      "miniprogram": "packages/miniprogram/src/components/layout",
      "flutter": "packages/flutter/lib/src/components/i_layout.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/layout",
      "page": "src/pages/components/LayoutPage.vue",
      "demos": 13
    },
    "demoRoutes": [
      "/components/layout"
    ],
    "states": {
      "asidePlacement": [
        "left",
        "right"
      ]
    }
  },
  {
    "name": "ILink",
    "sources": {
      "vue-next": "src/components/ILink.vue",
      "vue": "packages/vue/src/components/ILink.vue",
      "react": "packages/react/src/components/Link.tsx",
      "miniprogram": "packages/miniprogram/src/components/link",
      "flutter": "packages/flutter/lib/src/components/i_link.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/link",
      "page": "src/pages/components/LinkPage.vue",
      "demos": 5
    },
    "demoRoutes": [
      "/components/link",
      "/components/comment"
    ],
    "states": {
      "target": [
        "_self",
        "_blank"
      ],
      "theme": [
        "default",
        "brand",
        "success",
        "warning",
        "danger"
      ],
      "size": [
        "sm",
        "md",
        "lg"
      ],
      "underline": [
        "always",
        "hover",
        "never"
      ]
    }
  },
  {
    "name": "IList",
    "sources": {
      "vue-next": "src/components/IList.vue",
      "vue": "packages/vue/src/components/IList.vue",
      "react": "packages/react/src/components/List.tsx",
      "miniprogram": "packages/miniprogram/src/components/list",
      "flutter": "packages/flutter/lib/src/components/i_list.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/data-entry"
    ],
    "states": {}
  },
  {
    "name": "ILoading",
    "sources": {
      "vue-next": "src/components/ILoading.vue",
      "vue": "packages/vue/src/components/ILoading.vue",
      "react": "packages/react/src/components/Loading.tsx",
      "miniprogram": "packages/miniprogram/src/components/loading",
      "flutter": "packages/flutter/lib/src/components/i_loading.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/loading",
      "page": "src/pages/components/LoadingPage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/loading"
    ],
    "states": {
      "size": [
        "sm",
        "md",
        "lg"
      ]
    }
  },
  {
    "name": "IMarkdown",
    "sources": {
      "vue-next": "src/components/IMarkdown.vue",
      "vue": "packages/vue/src/components/IMarkdown.vue",
      "react": "packages/react/src/components/Markdown.tsx",
      "miniprogram": "packages/miniprogram/src/components/markdown",
      "flutter": "packages/flutter/lib/src/components/i_markdown.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/markdown",
      "page": "src/pages/components/MarkdownPage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/markdown"
    ],
    "states": {}
  },
  {
    "name": "IMentions",
    "sources": {
      "vue-next": "src/components/IMentions.vue",
      "vue": "packages/vue/src/components/IMentions.vue",
      "react": "packages/react/src/components/Mentions.tsx",
      "miniprogram": "packages/miniprogram/src/components/mentions",
      "flutter": "packages/flutter/lib/src/components/i_mentions.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/data-display"
    ],
    "states": {}
  },
  {
    "name": "IMenu",
    "sources": {
      "vue-next": "src/components/IMenu.vue",
      "vue": "packages/vue/src/components/IMenu.vue",
      "react": "packages/react/src/components/Menu.tsx",
      "miniprogram": "packages/miniprogram/src/components/menu",
      "flutter": "packages/flutter/lib/src/components/i_menu.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/navigation"
    ],
    "states": {}
  },
  {
    "name": "IMessageParts",
    "sources": {
      "vue-next": "src/components/IMessageParts.vue",
      "vue": "packages/vue/src/components/IMessageParts.vue",
      "react": "packages/react/src/components/MessageParts.tsx",
      "miniprogram": "packages/miniprogram/src/components/message-parts",
      "flutter": "packages/flutter/lib/src/components/i_message_parts.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chat"
    ],
    "states": {}
  },
  {
    "name": "IModal",
    "sources": {
      "vue-next": "src/components/IModal.vue",
      "vue": "packages/vue/src/components/IModal.vue",
      "react": "packages/react/src/components/Modal.tsx",
      "miniprogram": "packages/miniprogram/src/components/modal",
      "flutter": "packages/flutter/lib/src/components/i_modal.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/modal",
      "page": "src/pages/components/ModalPage.vue",
      "demos": 4
    },
    "demoRoutes": [
      "/components/modal"
    ],
    "states": {}
  },
  {
    "name": "INotificationLayer",
    "sources": {
      "vue-next": "src/components/INotificationLayer.vue",
      "vue": "packages/vue/src/components/INotificationLayer.vue",
      "react": "packages/react/src/components/NotificationLayer.tsx",
      "miniprogram": "packages/miniprogram/src/components/notification",
      "flutter": "packages/flutter/lib/src/components/i_notification.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [],
    "states": {}
  },
  {
    "name": "INumberKeypad",
    "sources": {
      "vue-next": "src/components/INumberKeypad.vue",
      "vue": "packages/vue/src/components/INumberKeypad.vue",
      "react": "packages/react/src/components/NumberKeypad.tsx",
      "miniprogram": "packages/miniprogram/src/components/number-keypad",
      "flutter": "packages/flutter/lib/src/components/i_number_keypad.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/mobile"
    ],
    "states": {}
  },
  {
    "name": "IPageHeader",
    "sources": {
      "vue-next": "src/components/IPageHeader.vue",
      "vue": "packages/vue/src/components/IPageHeader.vue",
      "react": "packages/react/src/components/PageHeader.tsx",
      "miniprogram": "packages/miniprogram/src/components/page-header",
      "flutter": "packages/flutter/lib/src/components/i_page_header.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/layout"
    ],
    "states": {}
  },
  {
    "name": "IPageState",
    "sources": {
      "vue-next": "src/components/IPageState.vue",
      "vue": "packages/vue/src/components/IPageState.vue",
      "react": "packages/react/src/components/PageState.tsx",
      "miniprogram": "packages/miniprogram/src/components/page-state",
      "flutter": "packages/flutter/lib/src/components/i_page_state.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/page-state",
      "page": "src/pages/components/PageStatePage.vue",
      "demos": 2
    },
    "demoRoutes": [
      "/components/page-state"
    ],
    "states": {
      "emptyType": [
        "empty",
        "search",
        "error",
        "permission"
      ]
    }
  },
  {
    "name": "IPagination",
    "sources": {
      "vue-next": "src/components/IPagination.vue",
      "vue": "packages/vue/src/components/IPagination.vue",
      "react": "packages/react/src/components/Pagination.tsx",
      "miniprogram": "packages/miniprogram/src/components/pagination",
      "flutter": "packages/flutter/lib/src/components/i_pagination.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/pagination",
      "page": "src/pages/components/PaginationPage.vue",
      "demos": 5
    },
    "demoRoutes": [
      "/components/pagination",
      "/components/config-provider"
    ],
    "states": {
      "size": [
        "sm",
        "md"
      ]
    }
  },
  {
    "name": "IPopconfirm",
    "sources": {
      "vue-next": "src/components/IPopconfirm.vue",
      "vue": "packages/vue/src/components/IPopconfirm.vue",
      "react": "packages/react/src/components/Popconfirm.tsx",
      "miniprogram": "packages/miniprogram/src/components/popconfirm",
      "flutter": "packages/flutter/lib/src/components/i_popconfirm.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/popconfirm",
      "page": "src/pages/components/PopconfirmPage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/popconfirm",
      "/components/config-provider"
    ],
    "states": {
      "type": [
        "brand",
        "danger"
      ]
    }
  },
  {
    "name": "IPopover",
    "sources": {
      "vue-next": "src/components/IPopover.vue",
      "vue": "packages/vue/src/components/IPopover.vue",
      "react": "packages/react/src/components/Popover.tsx",
      "miniprogram": "packages/miniprogram/src/components/popover",
      "flutter": "packages/flutter/lib/src/components/i_popover.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/overlay"
    ],
    "states": {
      "trigger": [
        "click",
        "hover"
      ],
      "align": [
        "center",
        "start"
      ]
    }
  },
  {
    "name": "IProTable",
    "sources": {
      "vue-next": "src/components/IProTable.vue",
      "vue": "packages/vue/src/components/IProTable.vue",
      "react": "packages/react/src/components/ProTable.tsx",
      "miniprogram": "packages/miniprogram/src/components/pro-table",
      "flutter": "packages/flutter/lib/src/components/i_pro_table.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/table"
    ],
    "states": {}
  },
  {
    "name": "IProgress",
    "sources": {
      "vue-next": "src/components/IProgress.vue",
      "vue": "packages/vue/src/components/IProgress.vue",
      "react": "packages/react/src/components/Progress.tsx",
      "miniprogram": "packages/miniprogram/src/components/progress",
      "flutter": "packages/flutter/lib/src/components/i_progress.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/data-display"
    ],
    "states": {
      "type": [
        "line",
        "circle"
      ],
      "status": [
        "normal",
        "success",
        "warning",
        "danger"
      ],
      "size": [
        "sm",
        "md",
        "lg"
      ]
    }
  },
  {
    "name": "IPromptInput",
    "sources": {
      "vue-next": "src/components/IPromptInput.vue",
      "vue": "packages/vue/src/components/IPromptInput.vue",
      "react": "packages/react/src/components/PromptInput.tsx",
      "miniprogram": "packages/miniprogram/src/components/prompt-input",
      "flutter": "packages/flutter/lib/src/components/i_prompt_input.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chat"
    ],
    "states": {}
  },
  {
    "name": "IQrcode",
    "sources": {
      "vue-next": "src/components/IQrcode.vue",
      "vue": "packages/vue/src/components/IQrcode.vue",
      "react": "packages/react/src/components/Qrcode.tsx",
      "miniprogram": "packages/miniprogram/src/components/qrcode",
      "flutter": "packages/flutter/lib/src/components/i_qrcode.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/qrcode",
      "page": "src/pages/components/QrcodePage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/qrcode"
    ],
    "states": {}
  },
  {
    "name": "IQueryFilter",
    "sources": {
      "vue-next": "src/components/IQueryFilter.vue",
      "vue": "packages/vue/src/components/IQueryFilter.vue",
      "react": "packages/react/src/components/QueryFilter.tsx",
      "miniprogram": "packages/miniprogram/src/components/query-filter",
      "flutter": "packages/flutter/lib/src/components/i_query_filter.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/table"
    ],
    "states": {}
  },
  {
    "name": "IRadio",
    "sources": {
      "vue-next": "src/components/IRadio.vue",
      "vue": "packages/vue/src/components/IRadio.vue",
      "react": "packages/react/src/components/Radio.tsx",
      "miniprogram": "packages/miniprogram/src/components/radio",
      "flutter": "packages/flutter/lib/src/components/i_radio.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/radio",
      "page": "src/pages/components/RadioPage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/form",
      "/components/radio"
    ],
    "states": {
      "variant": [
        "default",
        "button"
      ]
    }
  },
  {
    "name": "IRadioGroup",
    "sources": {
      "vue-next": "src/components/IRadioGroup.vue",
      "vue": "packages/vue/src/components/IRadioGroup.vue",
      "react": "packages/react/src/components/Radio.tsx",
      "miniprogram": "packages/miniprogram/src/components/radio",
      "flutter": "packages/flutter/lib/src/components/i_radio.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/form",
      "/components/radio"
    ],
    "states": {
      "variant": [
        "default",
        "button"
      ],
      "direction": [
        "horizontal",
        "vertical"
      ]
    }
  },
  {
    "name": "IRangeInput",
    "sources": {
      "vue-next": "src/components/IRangeInput.vue",
      "vue": "packages/vue/src/components/IRangeInput.vue",
      "react": "packages/react/src/components/RangeInput.tsx",
      "miniprogram": "packages/miniprogram/src/components/range-input",
      "flutter": "packages/flutter/lib/src/components/i_range_input.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/range-input",
      "page": "src/pages/components/RangeInputPage.vue",
      "demos": 4
    },
    "demoRoutes": [
      "/components/range-input"
    ],
    "states": {
      "size": [
        "sm",
        "md",
        "lg"
      ]
    }
  },
  {
    "name": "IRate",
    "sources": {
      "vue-next": "src/components/IRate.vue",
      "vue": "packages/vue/src/components/IRate.vue",
      "react": "packages/react/src/components/Rate.tsx",
      "miniprogram": "packages/miniprogram/src/components/rate",
      "flutter": "packages/flutter/lib/src/components/i_rate.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/data-entry"
    ],
    "states": {}
  },
  {
    "name": "IRecommendCard",
    "sources": {
      "vue-next": "src/components/IRecommendCard.vue",
      "vue": "packages/vue/src/components/IRecommendCard.vue",
      "react": "packages/react/src/components/RecommendCard.tsx",
      "miniprogram": "packages/miniprogram/src/components/recommend-card",
      "flutter": "packages/flutter/lib/src/components/i_agent.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chat"
    ],
    "states": {}
  },
  {
    "name": "IResult",
    "sources": {
      "vue-next": "src/components/IResult.vue",
      "vue": "packages/vue/src/components/IResult.vue",
      "react": "packages/react/src/components/Result.tsx",
      "miniprogram": "packages/miniprogram/src/components/result",
      "flutter": "packages/flutter/lib/src/components/i_result.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/result",
      "page": "src/pages/components/ResultPage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/result"
    ],
    "states": {
      "status": [
        "success",
        "info",
        "warning",
        "error",
        "403",
        "404",
        "500"
      ],
      "size": [
        "sm",
        "md"
      ]
    }
  },
  {
    "name": "IRow",
    "sources": {
      "vue-next": "src/components/IRow.vue",
      "vue": "packages/vue/src/components/IRow.vue",
      "react": "packages/react/src/components/Grid.tsx",
      "miniprogram": "packages/miniprogram/src/components/row",
      "flutter": "packages/flutter/lib/src/components/i_grid.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/layout",
      "/components/data-display",
      "/components/chart"
    ],
    "states": {
      "align": [
        "top",
        "middle",
        "bottom"
      ],
      "justify": [
        "start",
        "center",
        "end",
        "between"
      ]
    }
  },
  {
    "name": "ISchemaForm",
    "sources": {
      "vue-next": "src/components/ISchemaForm.vue",
      "vue": "packages/vue/src/components/ISchemaForm.vue",
      "react": "packages/react/src/components/SchemaForm.tsx",
      "miniprogram": "packages/miniprogram/src/components/schema-form",
      "flutter": "packages/flutter/lib/src/components/i_schema_form.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/form"
    ],
    "states": {}
  },
  {
    "name": "IScrollbar",
    "sources": {
      "vue-next": "src/components/IScrollbar.vue",
      "vue": "packages/vue/src/components/IScrollbar.vue",
      "react": "packages/react/src/components/Scrollbar.tsx",
      "miniprogram": "packages/miniprogram/src/components/scrollbar",
      "flutter": "packages/flutter/lib/src/components/i_scrollbar.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/scrollbar",
      "page": "src/pages/components/ScrollbarPage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/scrollbar"
    ],
    "states": {}
  },
  {
    "name": "ISegmented",
    "sources": {
      "vue-next": "src/components/ISegmented.vue",
      "vue": "packages/vue/src/components/ISegmented.vue",
      "react": "packages/react/src/components/Segmented.tsx",
      "miniprogram": "packages/miniprogram/src/components/segmented",
      "flutter": "packages/flutter/lib/src/components/i_segmented.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/icon",
      "/components/page-state",
      "/components/markdown",
      "/components/config-provider",
      "/components/qrcode",
      "/components/chat",
      "/components/data-display",
      "/components/chart",
      "/components/flow"
    ],
    "states": {
      "size": [
        "md",
        "lg"
      ]
    }
  },
  {
    "name": "ISelect",
    "sources": {
      "vue-next": "src/components/ISelect.vue",
      "vue": "packages/vue/src/components/ISelect.vue",
      "react": "packages/react/src/components/Select.tsx",
      "miniprogram": "packages/miniprogram/src/components/select",
      "flutter": "packages/flutter/lib/src/components/i_select.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/select",
      "page": "src/pages/components/SelectPage.vue",
      "demos": 7
    },
    "demoRoutes": [
      "/components/form",
      "/components/select",
      "/components/config-provider"
    ],
    "states": {
      "size": [
        "sm",
        "md",
        "lg"
      ]
    }
  },
  {
    "name": "ISelectInput",
    "sources": {
      "vue-next": "src/components/ISelectInput.vue",
      "vue": "packages/vue/src/components/ISelectInput.vue",
      "react": "packages/react/src/components/SelectInput.tsx",
      "miniprogram": "packages/miniprogram/src/components/select-input",
      "flutter": "packages/flutter/lib/src/components/i_select_input.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/select-input",
      "page": "src/pages/components/SelectInputPage.vue",
      "demos": 4
    },
    "demoRoutes": [
      "/components/select-input"
    ],
    "states": {
      "size": [
        "sm",
        "md",
        "lg"
      ]
    }
  },
  {
    "name": "ISelectionActions",
    "sources": {
      "vue-next": "src/components/ISelectionActions.vue",
      "vue": "packages/vue/src/components/ISelectionActions.vue",
      "react": "packages/react/src/components/SelectionActions.tsx",
      "miniprogram": "packages/miniprogram/src/components/selection-actions",
      "flutter": "packages/flutter/lib/src/components/i_selection_actions.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chat"
    ],
    "states": {}
  },
  {
    "name": "ISkeleton",
    "sources": {
      "vue-next": "src/components/ISkeleton.vue",
      "vue": "packages/vue/src/components/ISkeleton.vue",
      "react": "packages/react/src/components/Skeleton.tsx",
      "miniprogram": "packages/miniprogram/src/components/skeleton",
      "flutter": "packages/flutter/lib/src/components/i_skeleton.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/skeleton",
      "page": "src/pages/components/SkeletonPage.vue",
      "demos": 2
    },
    "demoRoutes": [
      "/components/skeleton"
    ],
    "states": {
      "variant": [
        "text",
        "paragraph",
        "card",
        "list",
        "avatar"
      ]
    }
  },
  {
    "name": "ISlider",
    "sources": {
      "vue-next": "src/components/ISlider.vue",
      "vue": "packages/vue/src/components/ISlider.vue",
      "react": "packages/react/src/components/Slider.tsx",
      "miniprogram": "packages/miniprogram/src/components/slider",
      "flutter": "packages/flutter/lib/src/components/i_slider.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/data-entry"
    ],
    "states": {}
  },
  {
    "name": "ISpace",
    "sources": {
      "vue-next": "src/components/ISpace.vue",
      "vue": "packages/vue/src/components/ISpace.vue",
      "react": "packages/react/src/components/Space.tsx",
      "miniprogram": "packages/miniprogram/src/components/space",
      "flutter": "packages/flutter/lib/src/components/i_space.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/link",
      "/components/layout",
      "/components/flow"
    ],
    "states": {
      "direction": [
        "horizontal",
        "vertical"
      ],
      "size": [
        "sm",
        "md",
        "lg"
      ],
      "align": [
        "start",
        "center",
        "end",
        "between"
      ]
    }
  },
  {
    "name": "ISparkline",
    "sources": {
      "vue-next": "src/components/ISparkline.vue",
      "vue": "packages/vue/src/components/ISparkline.vue",
      "react": "packages/react/src/components/Sparkline.tsx",
      "miniprogram": "packages/miniprogram/src/components/sparkline",
      "flutter": "packages/flutter/lib/src/components/i_sparkline.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chart"
    ],
    "states": {
      "tone": [
        "brand",
        "success",
        "danger",
        "neutral"
      ]
    }
  },
  {
    "name": "ISplitter",
    "sources": {
      "vue-next": "src/components/ISplitter.vue",
      "vue": "packages/vue/src/components/ISplitter.vue",
      "react": "packages/react/src/components/Splitter.tsx",
      "miniprogram": "packages/miniprogram/src/components/splitter",
      "flutter": "packages/flutter/lib/src/components/i_splitter.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/layout"
    ],
    "states": {
      "direction": [
        "horizontal",
        "vertical"
      ]
    }
  },
  {
    "name": "IStatistic",
    "sources": {
      "vue-next": "src/components/IStatistic.vue",
      "vue": "packages/vue/src/components/IStatistic.vue",
      "react": "packages/react/src/components/Statistic.tsx",
      "miniprogram": "packages/miniprogram/src/components/statistic",
      "flutter": "packages/flutter/lib/src/components/i_statistic.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/data-display",
      "/components/chart"
    ],
    "states": {
      "type": [
        "default",
        "brand",
        "success",
        "danger"
      ],
      "size": [
        "md",
        "sm"
      ]
    }
  },
  {
    "name": "ISteps",
    "sources": {
      "vue-next": "src/components/ISteps.vue",
      "vue": "packages/vue/src/components/ISteps.vue",
      "react": "packages/react/src/components/Steps.tsx",
      "miniprogram": "packages/miniprogram/src/components/steps",
      "flutter": "packages/flutter/lib/src/components/i_steps.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/steps",
      "page": "src/pages/components/StepsPage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/steps"
    ],
    "states": {
      "direction": [
        "horizontal",
        "vertical"
      ],
      "status": [
        "process",
        "error"
      ]
    }
  },
  {
    "name": "ISticky",
    "sources": {
      "vue-next": "src/components/ISticky.vue",
      "vue": "packages/vue/src/components/ISticky.vue",
      "react": "packages/react/src/components/Sticky.tsx",
      "miniprogram": "packages/miniprogram/src/components/sticky",
      "flutter": "packages/flutter/lib/src/components/i_sticky.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/data-display"
    ],
    "states": {}
  },
  {
    "name": "IStickyTool",
    "sources": {
      "vue-next": "src/components/IStickyTool.vue",
      "vue": "packages/vue/src/components/IStickyTool.vue",
      "react": "packages/react/src/components/StickyTool.tsx",
      "miniprogram": "packages/miniprogram/src/components/sticky-tool",
      "flutter": "packages/flutter/lib/src/components/i_sticky_tool.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/sticky-tool",
      "page": "src/pages/components/StickyToolPage.vue",
      "demos": 1
    },
    "demoRoutes": [
      "/components/sticky-tool"
    ],
    "states": {
      "placement": [
        "right",
        "left"
      ]
    }
  },
  {
    "name": "ISwitch",
    "sources": {
      "vue-next": "src/components/ISwitch.vue",
      "vue": "packages/vue/src/components/ISwitch.vue",
      "react": "packages/react/src/components/Switch.tsx",
      "miniprogram": "packages/miniprogram/src/components/switch",
      "flutter": "packages/flutter/lib/src/components/i_switch.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/switch",
      "page": "src/pages/components/SwitchPage.vue",
      "demos": 2
    },
    "demoRoutes": [
      "/components/form",
      "/components/switch",
      "/components/navigation"
    ],
    "states": {}
  },
  {
    "name": "ITable",
    "sources": {
      "vue-next": "src/components/ITable.vue",
      "vue": "packages/vue/src/components/ITable.vue",
      "react": "packages/react/src/components/Table.tsx",
      "miniprogram": "packages/miniprogram/src/components/table",
      "flutter": "packages/flutter/lib/src/components/i_table.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/table",
      "page": "src/pages/components/TablePage.vue",
      "demos": 7
    },
    "demoRoutes": [
      "/components/collapse",
      "/components/page-state",
      "/components/table",
      "/components/pagination"
    ],
    "states": {
      "size": [
        "sm",
        "md"
      ]
    }
  },
  {
    "name": "ITabs",
    "sources": {
      "vue-next": "src/components/ITabs.vue",
      "vue": "packages/vue/src/components/ITabs.vue",
      "react": "packages/react/src/components/Tabs.tsx",
      "miniprogram": "packages/miniprogram/src/components/tabs",
      "flutter": "packages/flutter/lib/src/components/i_tabs.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/tabs",
      "page": "src/pages/components/TabsPage.vue",
      "demos": 2
    },
    "demoRoutes": [
      "/components/tabs"
    ],
    "states": {
      "variant": [
        "line",
        "card"
      ],
      "size": [
        "sm",
        "md"
      ]
    }
  },
  {
    "name": "ITag",
    "sources": {
      "vue-next": "src/components/ITag.vue",
      "vue": "packages/vue/src/components/ITag.vue",
      "react": "packages/react/src/components/Tag.tsx",
      "miniprogram": "packages/miniprogram/src/components/tag",
      "flutter": "packages/flutter/lib/src/components/i_tag.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/tag",
      "page": "src/pages/components/TagPage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/tag",
      "/components/descriptions",
      "/components/table",
      "/components/select-input",
      "/components/chat",
      "/components/layout",
      "/components/data-entry"
    ],
    "states": {
      "type": [
        "default",
        "brand",
        "success",
        "warning",
        "danger"
      ]
    }
  },
  {
    "name": "ITagInput",
    "sources": {
      "vue-next": "src/components/ITagInput.vue",
      "vue": "packages/vue/src/components/ITagInput.vue",
      "react": "packages/react/src/components/TagInput.tsx",
      "miniprogram": "packages/miniprogram/src/components/tag-input",
      "flutter": "packages/flutter/lib/src/components/i_tag_input.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/data-entry"
    ],
    "states": {}
  },
  {
    "name": "ITextarea",
    "sources": {
      "vue-next": "src/components/ITextarea.vue",
      "vue": "packages/vue/src/components/ITextarea.vue",
      "react": "packages/react/src/components/Textarea.tsx",
      "miniprogram": "packages/miniprogram/src/components/textarea",
      "flutter": "packages/flutter/lib/src/components/i_textarea.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/textarea",
      "page": "src/pages/components/TextareaPage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/form",
      "/components/textarea",
      "/components/markdown",
      "/components/drawer"
    ],
    "states": {
      "resize": [
        "none",
        "vertical",
        "both"
      ]
    }
  },
  {
    "name": "ITimePicker",
    "sources": {
      "vue-next": "src/components/ITimePicker.vue",
      "vue": "packages/vue/src/components/ITimePicker.vue",
      "react": "packages/react/src/components/TimePicker.tsx",
      "miniprogram": "packages/miniprogram/src/components/time-picker",
      "flutter": "packages/flutter/lib/src/components/i_time_picker.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/data-entry"
    ],
    "states": {}
  },
  {
    "name": "ITimeSelect",
    "sources": {
      "vue-next": "src/components/ITimeSelect.vue",
      "vue": "packages/vue/src/components/ITimeSelect.vue",
      "react": "packages/react/src/components/TimeSelect.tsx",
      "miniprogram": "packages/miniprogram/src/components/time-select",
      "flutter": "packages/flutter/lib/src/components/i_time_select.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/time-select",
      "page": "src/pages/components/TimeSelectPage.vue",
      "demos": 4
    },
    "demoRoutes": [
      "/components/time-select"
    ],
    "states": {}
  },
  {
    "name": "ITimeline",
    "sources": {
      "vue-next": "src/components/ITimeline.vue",
      "vue": "packages/vue/src/components/ITimeline.vue",
      "react": "packages/react/src/components/Timeline.tsx",
      "miniprogram": "packages/miniprogram/src/components/timeline",
      "flutter": "packages/flutter/lib/src/components/i_timeline.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/data-display"
    ],
    "states": {}
  },
  {
    "name": "IToolChips",
    "sources": {
      "vue-next": "src/components/IToolChips.vue",
      "vue": "packages/vue/src/components/IToolChips.vue",
      "react": "packages/react/src/components/ToolChips.tsx",
      "miniprogram": "packages/miniprogram/src/components/tool-chips",
      "flutter": "packages/flutter/lib/src/components/i_tool_chips.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/chat"
    ],
    "states": {}
  },
  {
    "name": "ITooltip",
    "sources": {
      "vue-next": "src/components/ITooltip.vue",
      "vue": "packages/vue/src/components/ITooltip.vue",
      "react": "packages/react/src/components/Tooltip.tsx",
      "miniprogram": "packages/miniprogram/src/components/tooltip",
      "flutter": "packages/flutter/lib/src/components/i_tooltip.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/tooltip",
      "page": "src/pages/components/TooltipPage.vue",
      "demos": 2
    },
    "demoRoutes": [
      "/components/tooltip"
    ],
    "states": {}
  },
  {
    "name": "ITour",
    "sources": {
      "vue-next": "src/components/ITour.vue",
      "vue": "packages/vue/src/components/ITour.vue",
      "react": "packages/react/src/components/Tour.tsx",
      "miniprogram": "packages/miniprogram/src/components/tour",
      "flutter": "packages/flutter/lib/src/components/i_tour.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/overlay"
    ],
    "states": {}
  },
  {
    "name": "ITransfer",
    "sources": {
      "vue-next": "src/components/ITransfer.vue",
      "vue": "packages/vue/src/components/ITransfer.vue",
      "react": "packages/react/src/components/Transfer.tsx",
      "miniprogram": "packages/miniprogram/src/components/transfer",
      "flutter": "packages/flutter/lib/src/components/i_transfer.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/data-entry"
    ],
    "states": {}
  },
  {
    "name": "ITree",
    "sources": {
      "vue-next": "src/components/ITree.vue",
      "vue": "packages/vue/src/components/ITree.vue",
      "react": "packages/react/src/components/Tree.tsx",
      "miniprogram": "packages/miniprogram/src/components/tree",
      "flutter": "packages/flutter/lib/src/components/i_tree.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/tree",
      "page": "src/pages/components/TreePage.vue",
      "demos": 6
    },
    "demoRoutes": [
      "/components/tree"
    ],
    "states": {}
  },
  {
    "name": "ITreeSelect",
    "sources": {
      "vue-next": "src/components/ITreeSelect.vue",
      "vue": "packages/vue/src/components/ITreeSelect.vue",
      "react": "packages/react/src/components/TreeSelect.tsx",
      "miniprogram": "packages/miniprogram/src/components/tree-select",
      "flutter": "packages/flutter/lib/src/components/i_tree_select.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/tree"
    ],
    "states": {}
  },
  {
    "name": "ITypography",
    "sources": {
      "vue-next": "src/components/ITypography.vue",
      "vue": "packages/vue/src/components/ITypography.vue",
      "react": "packages/react/src/components/Typography.tsx",
      "miniprogram": "packages/miniprogram/src/components/typography",
      "flutter": "packages/flutter/lib/src/components/i_typography.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/config-provider",
      "/components/layout"
    ],
    "states": {
      "variant": [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "body",
        "caption"
      ],
      "type": [
        "default",
        "secondary",
        "tertiary",
        "brand",
        "success",
        "warning",
        "danger"
      ]
    }
  },
  {
    "name": "IUpload",
    "sources": {
      "vue-next": "src/components/IUpload.vue",
      "vue": "packages/vue/src/components/IUpload.vue",
      "react": "packages/react/src/components/Upload.tsx",
      "miniprogram": "packages/miniprogram/src/components/upload",
      "flutter": "packages/flutter/lib/src/components/i_upload.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": {
      "route": "/components/upload",
      "page": "src/pages/components/UploadPage.vue",
      "demos": 3
    },
    "demoRoutes": [
      "/components/upload"
    ],
    "states": {
      "variant": [
        "drag",
        "button"
      ]
    }
  },
  {
    "name": "IVirtualList",
    "sources": {
      "vue-next": "src/components/IVirtualList.vue",
      "vue": "packages/vue/src/components/IVirtualList.vue",
      "react": "packages/react/src/components/VirtualList.tsx",
      "miniprogram": "packages/miniprogram/src/components/virtual-list",
      "flutter": "packages/flutter/lib/src/components/i_virtual_list.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/layout"
    ],
    "states": {}
  },
  {
    "name": "IWatermark",
    "sources": {
      "vue-next": "src/components/IWatermark.vue",
      "vue": "packages/vue/src/components/IWatermark.vue",
      "react": "packages/react/src/components/Watermark.tsx",
      "miniprogram": "packages/miniprogram/src/components/watermark",
      "flutter": "packages/flutter/lib/src/components/i_watermark.dart"
    },
    "ends": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "consumable": {
      "vue-next": true,
      "vue": true,
      "react": true,
      "miniprogram": true,
      "flutter": true
    },
    "maturity": "stable",
    "doc": null,
    "demoRoutes": [
      "/components/layout"
    ],
    "states": {}
  }
]
