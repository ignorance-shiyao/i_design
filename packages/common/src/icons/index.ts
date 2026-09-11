/**
 * 图标库：24×24 网格、2px 描边、round 端点与连接，统一 currentColor 着色。
 *
 * 不引 iconfont 字体：一是预览页要内联成单文件、外链字体加载不到，
 * 二是描边图标用 SVG 才能跟随文字色与主题变化，字体图标做不到半色调与动画。
 * 每个图标只存 path 的 d，其余属性由 IIcon 统一给出，保证线宽视觉一致。
 */
export const icons = {
  // 通用操作
  check: 'M4 12.5 9 17.5 20 6.5',
  close: 'M6 6 18 18M18 6 6 18',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  search: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM21 21l-4.3-4.3',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z',
  edit: 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  trash: 'M4 7h16M10 4h4M6 7l1 13h10l1-13M10 11v6M14 11v6',
  download: 'M12 4v11M7 11l5 5 5-5M4 20h16',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',
  // 撤销 / 重做：箭头指回起点，方向相反，避免与 refresh 的整圈弧混淆
  undo: 'M4 9h11a5 5 0 0 1 0 10h-6M4 9l4-4M4 9l4 4',
  redo: 'M20 9H9a5 5 0 0 0 0 10h6M20 9l-4-4M20 9l-4 4',
  more: 'M6 12h.01M12 12h.01M18 12h.01',

  // 方向
  'chevron-up': 'M6 15l6-6 6 6',
  'chevron-down': 'M6 9l6 6 6-6',
  'chevron-left': 'M15 6l-6 6 6 6',
  'chevron-right': 'M9 6l6 6-6 6',
  'arrow-right': 'M4 12h15M13 6l6 6-6 6',
  'arrow-left': 'M20 12H5M11 6l-6 6 6 6',
  'external-link': 'M14 5h5v5M19 5l-8 8M18 14v5H5V6h5',

  // 状态与反馈
  'check-circle': 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM8.5 12.5l2.5 2.5 4.5-5',
  'info-circle': 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM12 11v5M12 8h.01',
  'warning-triangle': 'M12 4 2.5 20h19zM12 10v4M12 17h.01',
  'error-circle': 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM9.5 9.5l5 5M14.5 9.5l-5 5',
  'help-circle': 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM9.5 9.5a2.5 2.5 0 1 1 3 2.4V14M12 17h.01',

  // 对象与场景
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0',
  calendar: 'M4 6h16v14H4zM4 10h16M9 3v4M15 3v4',
  clock: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM12 7.5V12l3 2',
  folder: 'M4 6h6l2 2h8v11H4z',
  file: 'M6 3h8l4 4v14H6zM14 3v4h4',
  // 文件类型：都保留 file 的纸张轮廓，靠内部符号区分，成组时形状不会互相干扰
  'file-text': 'M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h4',
  'file-image': 'M6 3h8l4 4v14H6zM14 3v4h4M9 17l2.5-3 2 2.2 1.5-1.7L18 17z',
  'file-sheet': 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h8M9 16h8M13 12v8',
  'file-code': 'M6 3h8l4 4v14H6zM14 3v4h4M10.5 12.5 8.5 15l2 2.5M14 12.5l2 2.5-2 2.5',
  'file-zip': 'M6 3h8l4 4v14H6zM14 3v4h4M10 5h2M10 8h2M10 11h2M10 14h2',
  'file-media': 'M6 3h8l4 4v14H6zM14 3v4h4M10.5 12.5v5l4.5-2.5z',
  layers: 'M12 3 3 8l9 5 9-5zM3 13l9 5 9-5',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  palette:
    'M12 21a9 9 0 1 1 0-18c4.5 0 8 3 8 6.5 0 2.2-1.8 3.5-4 3.5h-1.5a1.8 1.8 0 0 0-1.2 3.1c.4.5.2 1.4-.9 1.4zM8 9.5h.01M12 7.5h.01M16 10h.01',
  code: 'M9 7l-5 5 5 5M15 7l5 5-5 5',
  // 框选：四角实线、四边虚线，一眼就是「拖出来的选框」而不是普通方框
  marquee: 'M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M11 4h2M11 20h2M4 11v2M20 11v2',
  // 缩略图：外框加一块高亮取景框，表达「整张图里现在看的是这一块」
  minimap: 'M4 5h16v14H4zM12 11h6v6h-6z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',

  // 主题配置面板：色彩之外的四类令牌各有一个标识
  // 字号：一大一小两个 A，表达的是「同一字形的不同尺寸」而不是「字体」
  'text-size': 'M2.5 19 7 7l4.5 12M4.2 15h5.6M14 19l3.5-9 3.5 9M15.4 16h4.2',
  // 圆角：一个直角与一个圆角拐角并列，差别就是这个令牌本身
  'corner-radius': 'M4 20V10a6 6 0 0 1 6-6h10M9 20v-5h5',
  // 阴影：实体方块与它偏移出去的轮廓
  'shadow-layer': 'M9 4h11v11M4 9h11v11H4z',
  // 尺寸：带刻度的直尺
  ruler: 'M3 9h18v6H3zM7.5 9v3M11 9v4M14.5 9v3M18 9v4',

  // 界面
  menu: 'M4 7h16M4 12h16M4 17h16',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  github:
    'M9 19c-4 1.2-4-2.2-6-2.7m12 5.2v-3.4c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.8 3.2 5.8 3.5 5.8 3.5a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.4 10c0 4.6 2.7 5.6 5.5 6-.4.4-.5.8-.5 1.5V21'
} as const

export type IconName = keyof typeof icons
export const iconNames = Object.keys(icons) as IconName[]
