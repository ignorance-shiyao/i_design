import {
  useAlert, useAvatar, useBadge, useCard, useDivider, useEmpty, useProgress, useSkeleton, useSpinner,
  type AlertOptions, type AvatarOptions, type BadgeOptions, type ProgressOptions,
} from '@i-design/core';
import type { CSSProperties, ReactNode } from 'react';
import { toProps } from '../utils.js';
import { useConfig } from './ConfigProvider.js';
import { Icon } from './Icon.js';
import type { IconName } from '@i-design/core';

const STATUS_ICON: Record<string, IconName> = {
  info: 'info-circle', brand: 'info-circle', success: 'check-circle',
  warning: 'warning-triangle', danger: 'close-circle',
};

export interface AlertProps extends Omit<AlertOptions, 'onClose' | 'extraClass'> {
  title?: ReactNode;
  icon?: ReactNode | false;
  className?: string;
  children?: ReactNode;
  onClose?: () => void;
}

export function Alert({ title, icon, className, children, onClose, ...rest }: AlertProps) {
  const behavior = useAlert({ ...rest, onClose, extraClass: className });
  return (
    <div {...toProps(behavior.root)}>
      {icon !== false && (
        <span className="i-alert__icon">
          {icon ?? <Icon name={STATUS_ICON[rest.status ?? 'info']!} size={16} />}
        </span>
      )}
      <div className="i-alert__content">
        {title != null && <div className="i-alert__title">{title}</div>}
        {children}
      </div>
      {behavior.close && <button {...toProps(behavior.close)}><Icon name="close" size={14} /></button>}
    </div>
  );
}

export interface CardProps {
  title?: ReactNode;
  extra?: ReactNode;
  footer?: ReactNode;
  hoverable?: boolean;
  bordered?: boolean;
  padding?: 'none' | 'm' | 'l';
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Card({ title, extra, footer, className, style, children, ...rest }: CardProps) {
  const behavior = useCard({ ...rest, extraClass: className });
  return (
    <div {...toProps(behavior.root)} style={style}>
      {(title != null || extra != null) && (
        <div {...toProps(behavior.header)}>
          <span>{title}</span>
          {extra}
        </div>
      )}
      <div {...toProps(behavior.body)}>{children}</div>
      {footer != null && <div {...toProps(behavior.footer)}>{footer}</div>}
    </div>
  );
}

export interface DividerProps {
  direction?: 'horizontal' | 'vertical';
  dashed?: boolean;
  align?: 'start' | 'center' | 'end';
  className?: string;
  children?: ReactNode;
}

export function Divider({ children, className, ...rest }: DividerProps) {
  return <div {...toProps(useDivider({ ...rest, extraClass: className }))}>{children}</div>;
}

export interface AvatarProps extends Omit<AvatarOptions, 'extraClass'> {
  className?: string;
  children?: ReactNode;
}

export function Avatar({ className, children, ...rest }: AvatarProps) {
  const behavior = useAvatar({ ...rest, extraClass: className });
  return (
    <span {...toProps(behavior.root)}>
      {behavior.image ? <img {...toProps(behavior.image)} alt={rest.alt ?? rest.name ?? ''} /> : (children ?? behavior.initials)}
    </span>
  );
}

export interface BadgeProps extends Omit<BadgeOptions, 'extraClass'> {
  className?: string;
  children?: ReactNode;
}

export function Badge({ className, children, ...rest }: BadgeProps) {
  const behavior = useBadge({ ...rest, extraClass: className });
  return (
    <span {...toProps(behavior.root)}>
      {children}
      {behavior.visible && <span {...toProps(behavior.indicator)}>{behavior.text}</span>}
    </span>
  );
}

export interface ProgressProps extends ProgressOptions {
  showLabel?: boolean;
  className?: string;
}

export function Progress({ showLabel = true, className, ...rest }: ProgressProps) {
  const behavior = useProgress(rest);
  const percent = Math.round(behavior.percent);
  return (
    <div {...toProps(behavior.root)} className={[behavior.root.class, className].filter(Boolean).join(' ')}>
      <div {...toProps(behavior.track)} style={{ '--i-progress-percent': percent } as CSSProperties}>
        <div {...toProps(behavior.bar)} style={{ inlineSize: `${percent}%` }} />
      </div>
      {showLabel && <span className="i-progress__label">{percent}%</span>}
    </div>
  );
}

export interface SkeletonProps {
  rows?: number;
  animated?: boolean;
  loading?: boolean;
  className?: string;
  children?: ReactNode;
}

export function Skeleton({ loading = true, className, children, ...rest }: SkeletonProps) {
  const behavior = useSkeleton({ ...rest, extraClass: className });
  if (!loading) return <>{children}</>;
  return (
    <div {...toProps(behavior.root)}>
      {behavior.rows.map((index) => (
        <div key={index} {...toProps(behavior.row(index, behavior.rows.length))} />
      ))}
    </div>
  );
}

export interface SpinnerProps {
  size?: 's' | 'm' | 'l';
  label?: string;
  className?: string;
}

export function Spinner({ className, ...rest }: SpinnerProps) {
  const { locale } = useConfig();
  const behavior = useSpinner({ ...rest, label: rest.label ?? locale.common.loading });
  return (
    <span {...toProps(behavior.root)} className={[behavior.root.class, className].filter(Boolean).join(' ')}>
      <span {...toProps(behavior.indicator)} />
    </span>
  );
}

export interface EmptyProps {
  description?: ReactNode;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function Empty({ description, icon, className, children }: EmptyProps) {
  const { locale } = useConfig();
  const behavior = useEmpty({ extraClass: className });
  return (
    <div {...toProps(behavior.root)}>
      <span {...toProps(behavior.icon)}>{icon ?? <Icon name="folder" size={28} />}</span>
      <div {...toProps(behavior.description)}>{description ?? locale.select.empty}</div>
      {children}
    </div>
  );
}
