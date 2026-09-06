export { ConfigProvider, useConfig, type ConfigProviderProps, type IConfig } from './components/ConfigProvider.js';
export { Button, type ButtonProps } from './components/Button.js';
export { Input, type InputProps } from './components/Input.js';
export { Checkbox, type CheckboxProps } from './components/Checkbox.js';
export { Switch, type SwitchProps } from './components/Switch.js';
export { Tag, type TagProps } from './components/Tag.js';
export { Space, type SpaceProps } from './components/Space.js';
export { FormItem, type FormItemProps } from './components/FormItem.js';
export { Dialog, type DialogProps } from './components/Dialog.js';
export { Tooltip, type TooltipProps } from './components/Tooltip.js';
export { Drawer, type DrawerProps } from './components/Drawer.js';
export { Table, type TableProps } from './components/Table.js';
export { Carousel, type CarouselProps } from './components/Carousel.js';
export { Transition, Stagger, type TransitionProps, type StaggerProps } from './components/Transition.js';
export {
  Chat, ChatMessage, ChatAction, TypingIndicator, ThinkingBlock, CodeBlock, Suggestions, PromptInput,
  type ChatProps, type ChatMessageProps, type ChatActionProps, type ThinkingBlockProps,
  type CodeBlockProps, type SuggestionsProps, type PromptInputProps,
} from './components/Chat.js';
export {
  Form, FormField, useForm,
  type FormProps, type FormFieldProps, type FieldRenderProps, type UseFormResult,
} from './components/Form.js';
export { Textarea, type TextareaProps } from './components/Textarea.js';
export { RadioGroup, type RadioGroupProps } from './components/Radio.js';
export { Select, type SelectProps } from './components/Select.js';
export { Row, Col, type RowProps, type ColProps } from './components/Grid.js';
export {
  Alert, Avatar, Badge, Card, Divider, Empty, Progress, Skeleton, Spinner,
  type AlertProps, type AvatarProps, type BadgeProps, type CardProps, type DividerProps,
  type EmptyProps, type ProgressProps, type SkeletonProps, type SpinnerProps,
} from './components/Display.js';
export {
  Breadcrumb, Collapse, Pagination, Steps, Tabs,
  type BreadcrumbProps, type CollapseProps, type PaginationProps, type StepsProps, type TabsProps,
} from './components/Navigation.js';
export { message, showMessage, type MessageOptions } from '@i-design/core';
export { toProps, useControlled } from './utils.js';

export type {
  BreadcrumbItem, CollapseItem, Density, Direction, DrawerPlacement, FormRules, FormState, Locale,
  LocaleName, Orientation, Placement, RadioOption, Rule, SelectOption, Size, SortOrder, StepItem,
  Status, TabItem, TableColumn, TableSort, ThemeMode, Variant,
  ChatRole, ChatStatus, MotionPreset, TransitionPhase, StreamController,
} from '@i-design/core';
export {
  applyTheme, computedTokens, locales, FormStore, validateValue, enMessages, defaultMessages,
  createStreamController, isAtBottom, motionClass, stagger,
} from '@i-design/core';
