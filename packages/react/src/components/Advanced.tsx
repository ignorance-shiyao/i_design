import {
  createId, formatCountdown, useAutoComplete, useCascader,
  useColorPicker, useInputOtp, useInputTag, useTimePicker, useTransfer,
  type CascaderNode, type TimeValue, type TransferItem,
} from '@i-design/core';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toProps, useControlled } from '../utils.js';
import { Checkbox } from './Checkbox.js';
import { Icon } from './Icon.js';

/* --- Transfer ----------------------------------------------------------- */
export interface TransferProps {
  items: TransferItem[];
  value?: string[];
  defaultValue?: string[];
  titles?: [string, string];
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  onChange?: (value: string[]) => void;
}

export function Transfer(props: TransferProps) {
  const { items, value: controlled, defaultValue = [], className, onChange, ...rest } = props;
  const [value, setValue] = useControlled(controlled, defaultValue);
  const [checked, setChecked] = useState<string[]>([]);
  const [search, setSearch] = useState<[string, string]>(['', '']);

  const behavior = useTransfer({
    ...rest, items, value, checked, search,
    onChange: (next) => {
      setValue(next);
      onChange?.(next);
    },
    onCheckedChange: setChecked,
    onSearch: (side, keyword) =>
      setSearch((prev) => (side === 0 ? [keyword, prev[1]] : [prev[0], keyword])),
    extraClass: className,
  });

  const panel = (side: 'source' | 'target') => {
    const p = behavior[side];
    return (
      <div {...toProps(p.root)}>
        <div {...toProps(p.header)}>
          <Checkbox size="s" checked={p.selectAll.checked} indeterminate={p.selectAll.indeterminate} onChange={() => p.selectAll.toggle()} />
          <span>{rest.titles?.[side === 'source' ? 0 : 1] ?? (side === 'source' ? '源列表' : '目标列表')}</span>
          <span>{p.count}</span>
        </div>
        {p.search && <input {...toProps(p.search)} />}
        <ul {...toProps(p.list)}>
          {p.items.map((item) => (
            <li key={item.key} {...toProps(p.item(item))} onClick={() => p.toggle(item)}>
              <Checkbox size="s" checked={p.isChecked(item)} disabled={item.disabled} onChange={() => p.toggle(item)} />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div {...toProps(behavior.root)}>
      {panel('source')}
      <div className="i-transfer__moves">
        <button {...toProps(behavior.toTarget)}><Icon name="chevron-right" size={14} /></button>
        <button {...toProps(behavior.toSource)}><Icon name="chevron-left" size={14} /></button>
      </div>
      {panel('target')}
    </div>
  );
}

/* --- Cascader ----------------------------------------------------------- */
export interface CascaderProps {
  options: CascaderNode[];
  value?: string[];
  defaultValue?: string[];
  placeholder?: string;
  separator?: string;
  disabled?: boolean;
  clearable?: boolean;
  changeOnSelect?: boolean;
  className?: string;
  onChange?: (value: string[], labels: string[]) => void;
}

export function Cascader(props: CascaderProps) {
  const { options, value: controlled, defaultValue = [], className, onChange, ...rest } = props;
  const id = useMemo(() => createId('i-cascader'), []);
  const [value, setValue] = useControlled(controlled, defaultValue);
  const [activePath, setActivePath] = useState<string[]>(value);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const behavior = useCascader({
    ...rest, options, id, value, activePath, open,
    onChange: (next, labels) => {
      setValue(next);
      onChange?.(next, labels);
    },
    onActivePathChange: setActivePath,
    onOpenChange: (next) => {
      setOpen(next);
      if (next) setActivePath(value);
    },
    extraClass: className,
  });

  return (
    <div ref={root} {...toProps(behavior.root)}>
      <button {...toProps(behavior.trigger)}>
        <span className={`i-cascader__value${behavior.displayValue ? '' : ' i-cascader__value--placeholder'}`}>
          {behavior.displayValue || behavior.placeholder}
        </span>
        {behavior.clear && <span {...toProps(behavior.clear)} role="button"><Icon name="close" size={11} /></span>}
        <Icon name="chevron-down" size={14} />
      </button>
      {open && (
        <div {...toProps(behavior.panel)}>
          {behavior.columns.map((column, depth) => (
            <div key={depth} {...toProps(behavior.column(depth))}>
              {column.map((node) => (
                <button key={node.value} {...toProps(behavior.option(node, depth))}>
                  <span>{node.label}</span>
                  {node.children?.length ? <Icon name="chevron-right" size={12} /> : null}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* --- ColorPicker -------------------------------------------------------- */
export interface ColorPickerProps {
  value?: string;
  defaultValue?: string;
  presets?: string[];
  showRamp?: boolean;
  disabled?: boolean;
  className?: string;
  onChange?: (hex: string) => void;
}

const DEFAULT_PRESETS = ['#4169ef', '#12b76a', '#f79009', '#f04438', '#7c5cf5', '#0aa3b8', '#5a6376', '#171b23'];

export function ColorPicker(props: ColorPickerProps) {
  const { value: controlled, defaultValue = '#4169ef', presets = DEFAULT_PRESETS, className, onChange, ...rest } = props;
  const id = useMemo(() => createId('i-color'), []);
  const [value, setValue] = useControlled(controlled, defaultValue);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const behavior = useColorPicker({
    ...rest, id, value, presets, open,
    onChange: (next) => {
      setValue(next);
      onChange?.(next);
    },
    onOpenChange: setOpen,
    extraClass: className,
  });

  return (
    <div ref={root} {...toProps(behavior.root)}>
      <button {...toProps(behavior.trigger)}>
        <span {...toProps(behavior.swatch)} style={{ backgroundColor: behavior.valid ? value : undefined }} />
        {value}
      </button>
      {open && (
        <div {...toProps(behavior.panel)}>
          <input {...toProps(behavior.native)} />
          <input {...toProps(behavior.hex)} />
          <div className="i-color-picker__presets">
            {presets.map((hex) => (
              <button key={hex} {...toProps(behavior.preset(hex))} style={{ background: hex }} />
            ))}
          </div>
          {behavior.ramp.length > 0 && (
            <div className="i-color-picker__ramp">
              {behavior.ramp.map((hex, index) => (
                <span key={hex + index} {...toProps(behavior.rampStep(index))} style={{ background: hex }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* --- TimePicker --------------------------------------------------------- */
export interface TimePickerProps {
  value?: TimeValue | null;
  defaultValue?: TimeValue | null;
  step?: number;
  showSeconds?: boolean;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  onChange?: (value: TimeValue | null) => void;
}

export function TimePicker(props: TimePickerProps) {
  const { value: controlled, defaultValue = null, className, onChange, ...rest } = props;
  const id = useMemo(() => createId('i-time'), []);
  const [value, setValue] = useControlled<TimeValue | null>(controlled, defaultValue);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const behavior = useTimePicker({
    ...rest, id, value, open,
    onChange: (next) => {
      setValue(next);
      onChange?.(next);
    },
    onOpenChange: setOpen,
    extraClass: className,
  });

  const column = (part: 'hour' | 'minute' | 'second', units: number[]) => (
    <div key={part} {...toProps(behavior.column(part))}>
      {units.map((unit) => (
        <button key={unit} {...toProps(behavior.cell(part, unit))}>
          {String(unit).padStart(2, '0')}
        </button>
      ))}
    </div>
  );

  return (
    <div ref={root} {...toProps(behavior.root)}>
      <button {...toProps(behavior.trigger)}>
        <Icon name="clock" size={15} />
        <span className={`i-time-picker__value${value ? '' : ' i-time-picker__value--placeholder'}`}>
          {behavior.displayValue || behavior.placeholder}
        </span>
        {behavior.clear && <span {...toProps(behavior.clear)} role="button"><Icon name="close" size={11} /></span>}
      </button>
      {open && (
        <div {...toProps(behavior.panel)}>
          {column('hour', behavior.hours)}
          {column('minute', behavior.minutes)}
          {rest.showSeconds && column('second', behavior.seconds)}
        </div>
      )}
    </div>
  );
}

/* --- AutoComplete ------------------------------------------------------- */
export interface AutoCompleteProps {
  value?: string;
  defaultValue?: string;
  suggestions: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (value: string) => void;
  onSelect?: (value: string) => void;
}

export function AutoComplete(props: AutoCompleteProps) {
  const { value: controlled, defaultValue = '', suggestions, className, onChange, onSelect, ...rest } = props;
  const id = useMemo(() => createId('i-ac'), []);
  const [value, setValue] = useControlled(controlled, defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const behavior = useAutoComplete({
    ...rest, id, value, suggestions, open, activeIndex,
    onInput: (next) => {
      setValue(next);
      onChange?.(next);
    },
    onSelect: (next) => {
      setValue(next);
      onChange?.(next);
      onSelect?.(next);
    },
    onOpenChange: setOpen,
    onActiveIndexChange: setActiveIndex,
    extraClass: className,
  });

  return (
    <div {...toProps(behavior.root)}>
      <input {...toProps(behavior.input)} />
      {open && suggestions.length > 0 && (
        <ul {...toProps(behavior.listbox)}>
          {suggestions.map((item, index) => (
            <li key={item} {...toProps(behavior.option(item, index))}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* --- InputTag ----------------------------------------------------------- */
export interface InputTagProps {
  tags?: string[];
  defaultTags?: string[];
  max?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (tags: string[]) => void;
}

export function InputTag(props: InputTagProps) {
  const { tags: controlled, defaultTags = [], className, onChange, ...rest } = props;
  const [tags, setTags] = useControlled(controlled, defaultTags);
  const [draft, setDraft] = useState('');

  const behavior = useInputTag({
    ...rest, tags, draft,
    onTagsChange: (next) => {
      setTags(next);
      onChange?.(next);
    },
    onDraftChange: setDraft,
    extraClass: className,
  });

  return (
    <div {...toProps(behavior.root)}>
      {tags.map((tag, index) => (
        <span key={tag} {...toProps(behavior.tag(tag, index))}>
          {tag}
          <button {...toProps(behavior.remove(tag))}><Icon name="close" size={11} /></button>
        </span>
      ))}
      <input {...toProps(behavior.input)} />
    </div>
  );
}

/* --- InputOtp ----------------------------------------------------------- */
export interface InputOtpProps {
  value?: string;
  defaultValue?: string;
  length?: number;
  mask?: boolean;
  disabled?: boolean;
  className?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
}

export function InputOtp(props: InputOtpProps) {
  const { value: controlled, defaultValue = '', className, onChange, ...rest } = props;
  const [value, setValue] = useControlled(controlled, defaultValue);

  const behavior = useInputOtp({
    ...rest, value,
    onChange: (next) => {
      setValue(next);
      onChange?.(next);
    },
    extraClass: className,
  });

  return (
    <div {...toProps(behavior.root)}>
      {behavior.cells.map((digit, index) => (
        <span key={index} {...toProps(behavior.cell(index))}>
          {digit ? (rest.mask ? '•' : digit) : ''}
        </span>
      ))}
      <input {...toProps(behavior.input)} />
    </div>
  );
}

/* --- Countdown ---------------------------------------------------------- */
export interface CountdownProps {
  /** Target timestamp in ms. */
  to: number;
  format?: string;
  label?: ReactNode;
  className?: string;
  onFinish?: () => void;
}

export function Countdown({ to, format = 'HH:mm:ss', label, className, onFinish }: CountdownProps) {
  const [remaining, setRemaining] = useState(() => to - Date.now());
  const finished = useRef(false);

  useEffect(() => {
    finished.current = false;
    const tick = (): void => {
      const next = to - Date.now();
      setRemaining(next);
      if (next <= 0 && !finished.current) {
        finished.current = true;
        onFinish?.();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [to, onFinish]);

  return (
    <div className={['i-statistic', className].filter(Boolean).join(' ')}>
      {label && <div className="i-statistic__label">{label}</div>}
      <div className="i-statistic__value">{formatCountdown(remaining, format)}</div>
    </div>
  );
}


