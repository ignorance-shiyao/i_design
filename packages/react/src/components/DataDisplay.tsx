import {
  createWatermark, useDescriptions, useList, useResult, useSegmented, useStatistic,
  useTimeline, useTypography,
  type DescriptionsOptions, type ListOptions, type SegmentedOption, type StatisticOptions,
  type TimelineItem, type TypographyOptions, type WatermarkOptions,
} from '@i-design/core';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { toProps, useControlled } from '../utils.js';
import { Icon } from './Icon.js';
import type { IconName } from '@i-design/core';

/* --- List --------------------------------------------------------------- */
export interface ListProps extends Omit<ListOptions, 'extraClass'> {
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function List({ header, footer, className, children, ...rest }: ListProps) {
  const behavior = useList({ ...rest, extraClass: className });
  return (
    <div {...toProps(behavior.root)}>
      {header && <div {...toProps(behavior.header)}>{header}</div>}
      {children}
      {footer && <div {...toProps(behavior.footer)}>{footer}</div>}
    </div>
  );
}

export interface ListItemProps {
  avatar?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

export function ListItem({ avatar, title, description, actions, children }: ListItemProps) {
  const behavior = useList();
  return (
    <div {...toProps(behavior.item)}>
      <div {...toProps(behavior.meta)}>
        {avatar && <span {...toProps(behavior.avatar)}>{avatar}</span>}
        <div {...toProps(behavior.content)}>
          {title && <div {...toProps(behavior.title)}>{title}</div>}
          {description && <div {...toProps(behavior.description)}>{description}</div>}
          {children}
        </div>
      </div>
      {actions && <div {...toProps(behavior.actions)}>{actions}</div>}
    </div>
  );
}

/* --- Descriptions ------------------------------------------------------- */
export interface DescriptionsProps extends Omit<DescriptionsOptions, 'extraClass'> {
  items: Array<{ label: ReactNode; value: ReactNode; span?: number }>;
  className?: string;
}

export function Descriptions({ items, className, ...rest }: DescriptionsProps) {
  const behavior = useDescriptions({ ...rest, extraClass: className });
  return (
    <div {...toProps(behavior.root)} style={behavior.style as CSSProperties}>
      {items.map((item, index) => (
        <div
          key={index}
          {...toProps(behavior.item(item.span))}
          style={behavior.itemStyle(item.span) as CSSProperties}
        >
          <span {...toProps(behavior.label)}>{item.label}</span>
          <span {...toProps(behavior.value)}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

/* --- Statistic ---------------------------------------------------------- */
export interface StatisticProps extends Omit<StatisticOptions, 'extraClass'> {
  label?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  className?: string;
}

export function Statistic({ label, prefix, suffix, className, ...rest }: StatisticProps) {
  const behavior = useStatistic({ ...rest, extraClass: className });
  const arrow: IconName | null =
    rest.trend === 'up' ? 'arrow-up' : rest.trend === 'down' ? 'arrow-down' : rest.trend === 'flat' ? 'arrow-right' : null;
  return (
    <div {...toProps(behavior.root)}>
      {label && <div {...toProps(behavior.label)}>{label}</div>}
      <div {...toProps(behavior.value)}>
        {prefix && <span {...toProps(behavior.prefix)}>{prefix}</span>}
        {arrow && <span {...toProps(behavior.trendIcon)}><Icon name={arrow} size={14} /></span>}
        {behavior.text}
        {suffix && <span {...toProps(behavior.suffix)}>{suffix}</span>}
      </div>
    </div>
  );
}

/* --- Timeline ----------------------------------------------------------- */
export interface TimelineProps {
  items: TimelineItem[];
  mode?: 'left' | 'alternate';
  className?: string;
}

export function Timeline({ items, mode, className }: TimelineProps) {
  const behavior = useTimeline({ items, mode, extraClass: className });
  return (
    <ul {...toProps(behavior.root)}>
      {items.map((item, index) => (
        <li key={item.key} {...toProps(behavior.item(item, index))}>
          <span {...toProps(behavior.dot)} />
          <div {...toProps(behavior.content)}>
            <strong>{item.title}</strong>
            {item.time && <span {...toProps(behavior.time)}>{item.time}</span>}
            {item.description && <span>{item.description}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

/* --- Segmented ---------------------------------------------------------- */
export interface SegmentedProps {
  options: SegmentedOption[];
  value?: string;
  defaultValue?: string;
  size?: 's' | 'm' | 'l';
  block?: boolean;
  className?: string;
  onChange?: (value: string) => void;
}

export function Segmented(props: SegmentedProps) {
  const { options, value: controlled, defaultValue, className, onChange, ...rest } = props;
  const [value, setValue] = useControlled(controlled, defaultValue ?? options[0]?.value ?? '');

  const behavior = useSegmented({
    ...rest, options, value,
    onChange: (next) => {
      setValue(next);
      onChange?.(next);
    },
    extraClass: className,
  });

  return (
    <div {...toProps(behavior.root)}>
      <span {...toProps(behavior.thumb)} style={behavior.thumbStyle() as CSSProperties} />
      {options.map((option) => (
        <button key={option.value} {...toProps(behavior.item(option))}>
          {option.label ?? option.value}
        </button>
      ))}
    </div>
  );
}

/* --- Typography --------------------------------------------------------- */
export interface TypographyProps extends Omit<TypographyOptions, 'copied' | 'onCopy' | 'extraClass'> {
  className?: string;
  children?: ReactNode;
}

export function Typography(props: TypographyProps) {
  const { className, children, copyable, ...rest } = props;
  const [copied, setCopied] = useState(false);

  const behavior = useTypography({
    ...rest, copyable, copied,
    extraClass: className,
    onCopy: () => {
      void navigator.clipboard?.writeText(typeof children === 'string' ? children : '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    },
  });

  const Tag = behavior.tag as 'span';
  return (
    <>
      <Tag {...toProps(behavior.root)} style={behavior.style as CSSProperties}>
        {children}
      </Tag>
      {behavior.copy && (
        <button {...toProps(behavior.copy)}>
          <Icon name={copied ? 'check' : 'copy'} size={13} />
        </button>
      )}
    </>
  );
}

/* --- Result ------------------------------------------------------------- */
export interface ResultProps {
  status?: 'success' | 'warning' | 'danger' | 'info' | '404' | '500';
  title?: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

const RESULT_ICON: Record<string, IconName | string> = {
  success: 'check-circle', warning: 'warning-triangle', danger: 'close-circle',
  info: 'info-circle', '404': '404', '500': '500',
};

export function Result({ status = 'info', title, description, extra, icon, className }: ResultProps) {
  const behavior = useResult({ status, extraClass: className });
  return (
    <div {...toProps(behavior.root)}>
      <span {...toProps(behavior.icon)}>
        {icon ?? (status === '404' || status === '500'
          ? RESULT_ICON[status]
          : <Icon name={RESULT_ICON[status] as IconName} size={28} />)}
      </span>
      {title && <div {...toProps(behavior.title)}>{title}</div>}
      {description && <div {...toProps(behavior.description)}>{description}</div>}
      {extra && <div {...toProps(behavior.extra)}>{extra}</div>}
    </div>
  );
}

/* --- Watermark ---------------------------------------------------------- */
export interface WatermarkProps extends WatermarkOptions {
  className?: string;
  children?: ReactNode;
}

export function Watermark({ className, children, ...rest }: WatermarkProps) {
  const [image, setImage] = useState('');
  const optionsRef = useRef(rest);
  optionsRef.current = rest;

  useEffect(() => {
    setImage(createWatermark(optionsRef.current));
  }, [rest.text, rest.fontSize, rest.color, rest.rotate, rest.gap]);

  return (
    <div className={['i-watermark', className].filter(Boolean).join(' ')}>
      {children}
      <div className="i-watermark__layer" style={{ backgroundImage: image ? `url(${image})` : undefined }} />
    </div>
  );
}
