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
  layers: 'M12 3 3 8l9 5 9-5zM3 13l9 5 9-5',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  palette:
    'M12 21a9 9 0 1 1 0-18c4.5 0 8 3 8 6.5 0 2.2-1.8 3.5-4 3.5h-1.5a1.8 1.8 0 0 0-1.2 3.1c.4.5.2 1.4-.9 1.4zM8 9.5h.01M12 7.5h.01M16 10h.01',
  code: 'M9 7l-5 5 5 5M15 7l5 5-5 5',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',

  // 界面
  menu: 'M4 7h16M4 12h16M4 17h16',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  github:
    'M9 19c-4 1.2-4-2.2-6-2.7m12 5.2v-3.4c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.8 3.2 5.8 3.5 5.8 3.5a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.4 10c0 4.6 2.7 5.6 5.5 6-.4.4-.5.8-.5 1.5V21'
} as const

export type IconName = keyof typeof icons
export const iconNames = Object.keys(icons) as IconName[]
