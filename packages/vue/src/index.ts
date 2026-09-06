import type { App, Component } from 'vue';
import { ConfigProvider } from './components/ConfigProvider.js';
import { Button } from './components/Button.js';
import { Input } from './components/Input.js';
import { Checkbox, Switch } from './components/Toggle.js';
import { Tag } from './components/Tag.js';
import { Space } from './components/Space.js';
import { FormItem } from './components/FormItem.js';
import { Dialog } from './components/Dialog.js';
import { Tooltip } from './components/Tooltip.js';
import { Drawer } from './components/Drawer.js';
import { Table } from './components/Table.js';
import { Carousel } from './components/Carousel.js';
import { InputNumber, Slider, Rate, Upload } from './components/FormControls.js';
import { Layout, LayoutHeader, LayoutSider, LayoutContent, LayoutFooter, Menu, Tree, Anchor, BackTop } from './components/Structure.js';
import { List, ListItem, Descriptions, Statistic, Timeline, Segmented, Typography, Result, Watermark } from './components/DataDisplay.js';
import { Transition, Stagger } from './components/Transition.js';
import {
  Chat, ChatMessage, ChatAction, TypingIndicator, ThinkingBlock, CodeBlock, Suggestions, PromptInput,
} from './components/Chat.js';
import { Form, FormField } from './components/Form.js';
import { Textarea } from './components/Textarea.js';
import { RadioGroup } from './components/Radio.js';
import { Select } from './components/Select.js';
import { Row, Col } from './components/Grid.js';
import { Alert, Avatar, Badge, Card, Divider, Empty, Progress, Skeleton, Spinner } from './components/Display.js';
import { Breadcrumb, Collapse, Pagination, Steps, Tabs } from './components/Navigation.js';

export { ConfigProvider, useConfig, type IConfig } from './components/ConfigProvider.js';
export { Button, Input, Checkbox, Switch, Tag, Space, FormItem, Dialog, Tooltip };
export { Drawer, Textarea, RadioGroup, Select, Row, Col, Table, Form, FormField };
export { Carousel, Transition, Stagger };
export { InputNumber, Slider, Rate, Upload };
export { Layout, LayoutHeader, LayoutSider, LayoutContent, LayoutFooter, Menu, Tree, Anchor, BackTop };
export { List, ListItem, Descriptions, Statistic, Timeline, Segmented, Typography, Result, Watermark };
export { Chat, ChatMessage, ChatAction, TypingIndicator, ThinkingBlock, CodeBlock, Suggestions, PromptInput };
export { useForm, type UseFormResult } from './components/Form.js';
export { Alert, Avatar, Badge, Card, Divider, Empty, Progress, Skeleton, Spinner };
export { Breadcrumb, Collapse, Pagination, Steps, Tabs };
export { toProps, useControlled } from './utils.js';

/** The imperative toast API is framework-free, so Vue simply re-exports it. */
export { message, showMessage, type MessageOptions } from '@i-design/core';
export { notification, showNotification, type NotificationOptions } from '@i-design/core';

export type {
  BreadcrumbItem, CollapseItem, Density, Direction, DrawerPlacement, FormRules, FormState, Locale,
  LocaleName, Orientation, Placement, RadioOption, Rule, SelectOption, Size, SortOrder, StepItem,
  Status, TabItem, TableColumn, TableSort, ThemeMode, Variant,
  ChatRole, ChatStatus, MotionPreset, TransitionPhase, StreamController,
  AnchorItem, MenuItem, TreeNode, TimelineItem, SegmentedOption, UploadFile, UploadStatus, SliderMark,
} from '@i-design/core';
export {
  applyTheme, computedTokens, locales, FormStore, validateValue, enMessages, defaultMessages,
  createStreamController, isAtBottom, motionClass, stagger,
  highlight, formatBytes, formatStatistic, createWatermark, readComputedTokens,
} from '@i-design/core';

const components: Record<string, Component> = {
  IConfigProvider: ConfigProvider,
  IButton: Button,
  IInput: Input,
  ICheckbox: Checkbox,
  ISwitch: Switch,
  ITag: Tag,
  ISpace: Space,
  IFormItem: FormItem,
  IDialog: Dialog,
  ITooltip: Tooltip,
  IDrawer: Drawer,
  ITextarea: Textarea,
  IRadioGroup: RadioGroup,
  ISelect: Select,
  IRow: Row,
  ICol: Col,
  IAlert: Alert,
  IAvatar: Avatar,
  IBadge: Badge,
  ICard: Card,
  IDivider: Divider,
  IEmpty: Empty,
  IProgress: Progress,
  ISkeleton: Skeleton,
  ISpinner: Spinner,
  IBreadcrumb: Breadcrumb,
  ICollapse: Collapse,
  IPagination: Pagination,
  ISteps: Steps,
  ITabs: Tabs,
  ITable: Table,
  IForm: Form,
  IFormField: FormField,
  ICarousel: Carousel,
  ITransition: Transition,
  IStagger: Stagger,
  IChat: Chat,
  IChatMessage: ChatMessage,
  IChatAction: ChatAction,
  ITypingIndicator: TypingIndicator,
  IThinkingBlock: ThinkingBlock,
  ICodeBlock: CodeBlock,
  ISuggestions: Suggestions,
  IPromptInput: PromptInput,
  IInputNumber: InputNumber,
  ISlider: Slider,
  IRate: Rate,
  IUpload: Upload,
  ILayout: Layout,
  ILayoutHeader: LayoutHeader,
  ILayoutSider: LayoutSider,
  ILayoutContent: LayoutContent,
  ILayoutFooter: LayoutFooter,
  IMenu: Menu,
  ITree: Tree,
  IAnchor: Anchor,
  IBackTop: BackTop,
  IList: List,
  IListItem: ListItem,
  IDescriptions: Descriptions,
  IStatistic: Statistic,
  ITimeline: Timeline,
  ISegmented: Segmented,
  ITypography: Typography,
  IResult: Result,
  IWatermark: Watermark,
};

/** `app.use(IDesign)` for the global-registration style Vue users expect. */
export default {
  install(app: App): void {
    for (const [name, component] of Object.entries(components)) app.component(name, component);
  },
};
