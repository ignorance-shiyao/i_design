/**
 * Ignorance Design · React
 *
 * 组件只负责渲染：令牌、图标数据、交互规则全部来自 @i-design/common，
 * 与 Vue 端共用同一份 CSS（@i-design/common/styles/index.css）。
 * 因此「React 版和 Vue 版长得不一样」在架构上就不可能发生。
 */
export { Icon, type IconProps } from './components/Icon'
export { Button, type ButtonProps } from './components/Button'
export { Tag, type TagProps } from './components/Tag'
export { Input, type InputProps } from './components/Input'
export { Switch, type SwitchProps } from './components/Switch'
export { Avatar, type AvatarProps } from './components/Avatar'
export { Alert, type AlertProps } from './components/Alert'
export { Card, type CardProps } from './components/Card'
export { Divider, type DividerProps } from './components/Divider'
export { Badge, type BadgeProps } from './components/Badge'
export { Skeleton, type SkeletonProps } from './components/Skeleton'
export { Pagination, type PaginationProps } from './components/Pagination'
export { Table, type TableProps, type TableColumn } from './components/Table'
export { Tabs, type TabsProps, type TabItem } from './components/Tabs'
export { Select, type SelectProps, type SelectOption } from './components/Select'
