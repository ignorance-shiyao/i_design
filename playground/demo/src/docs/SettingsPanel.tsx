import {
  Button, Drawer, Icon, Segmented, Slider, Space, Switch, Typography,
  type Density, type LocaleName, type ThemeMode,
} from '@i-design/react';

export interface SiteSettings {
  mode: ThemeMode;
  density: Density;
  locale: LocaleName;
  dir: 'ltr' | 'rtl';
  brand: string;
  radius: number;
  fontScale: number;
  motion: boolean;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  mode: 'auto',
  density: 'default',
  locale: 'zh-CN',
  dir: 'ltr',
  brand: '65, 105, 239',
  radius: 1,
  fontScale: 1,
  motion: true,
};

export const BRANDS = [
  { name: '钴蓝', triplet: '65, 105, 239', hover: '107, 144, 251', active: '47, 79, 208' },
  { name: '墨绿', triplet: '18, 183, 106', hover: '50, 213, 131', active: '3, 152, 85' },
  { name: '紫罗兰', triplet: '124, 92, 245', hover: '155, 131, 248', active: '101, 65, 224' },
  { name: '赤陶', triplet: '220, 104, 3', hover: '247, 144, 9', active: '181, 71, 8' },
  { name: '玫红', triplet: '224, 49, 110', hover: '240, 96, 146', active: '190, 30, 88' },
  { name: '石墨', triplet: '90, 99, 118', hover: '123, 133, 152', active: '65, 73, 88' },
];

interface Props {
  open: boolean;
  settings: SiteSettings;
  onClose: () => void;
  onChange: (next: Partial<SiteSettings>) => void;
  onReset: () => void;
}

/**
 * Everything configurable lives here, so the top bar can stay down to two
 * buttons. The panel is itself built from the library — Drawer, Segmented,
 * Slider, Switch — which makes it the honest kind of demo.
 */
export function SettingsPanel({ open, settings, onClose, onChange, onReset }: Props) {
  const row = (label: string, hint: string, control: React.ReactNode) => (
    <div className="settings__row" key={label}>
      <div className="settings__meta">
        <div className="settings__label">{label}</div>
        <div className="settings__hint">{hint}</div>
      </div>
      {control}
    </div>
  );

  return (
    <Drawer
      open={open}
      title="外观设置"
      size="360px"
      onClose={onClose}
      footer={
        <Space>
          <Button variant="outline" onClick={onReset}>恢复默认</Button>
          <Button status="brand" onClick={onClose}>完成</Button>
        </Space>
      }
    >
      <div className="settings">
        {row('主题', '跟随会读取系统的深浅色偏好',
          <Segmented
            size="s"
            value={settings.mode}
            onChange={(value) => onChange({ mode: value as ThemeMode })}
            options={[{ value: 'light', label: '浅色' }, { value: 'dark', label: '深色' }, { value: 'auto', label: '跟随' }]}
          />)}

        {row('密度', '一次改变所有控件的高度与内边距',
          <Segmented
            size="s"
            value={settings.density}
            onChange={(value) => onChange({ density: value as Density })}
            options={[{ value: 'compact', label: '紧凑' }, { value: 'default', label: '默认' }, { value: 'loose', label: '宽松' }]}
          />)}

        {row('语言', '阿拉伯语会自动切换为从右到左',
          <Segmented
            size="s"
            value={settings.locale}
            onChange={(value) => onChange({ locale: value as LocaleName })}
            options={[{ value: 'zh-CN', label: '中文' }, { value: 'en-US', label: 'EN' }, { value: 'ar-EG', label: 'AR' }]}
          />)}

        {row('文字方向', '独立于语言，可单独强制',
          <Segmented
            size="s"
            value={settings.dir}
            onChange={(value) => onChange({ dir: value as 'ltr' | 'rtl' })}
            options={[{ value: 'ltr', label: 'LTR' }, { value: 'rtl', label: 'RTL' }]}
          />)}

        <div className="settings__row settings__row--stack">
          <div className="settings__meta">
            <div className="settings__label">品牌色</div>
            <div className="settings__hint">只替换三个基元三元组，所有状态自动跟随</div>
          </div>
          <div className="settings__swatches">
            {BRANDS.map((item) => (
              <button
                key={item.name}
                title={item.name}
                aria-label={item.name}
                aria-pressed={settings.brand === item.triplet}
                className={`settings__swatch${settings.brand === item.triplet ? ' settings__swatch--active' : ''}`}
                style={{ background: `rgb(${item.triplet})` }}
                onClick={() => onChange({ brand: item.triplet })}
              >
                {settings.brand === item.triplet && <Icon name="check" size={12} />}
              </button>
            ))}
          </div>
        </div>

        <div className="settings__row settings__row--stack">
          <div className="settings__meta">
            <div className="settings__label">圆角 <span className="settings__value">×{settings.radius.toFixed(2)}</span></div>
            <div className="settings__hint">缩放全部圆角令牌</div>
          </div>
          <Slider
            min={0}
            max={2}
            step={0.25}
            value={settings.radius}
            onChange={(value) => onChange({ radius: value })}
            marks={[{ value: 0, label: '直角' }, { value: 1, label: '默认' }, { value: 2, label: '圆润' }]}
            format={(value) => `×${value}`}
            label="圆角缩放"
          />
        </div>

        <div className="settings__row settings__row--stack">
          <div className="settings__meta">
            <div className="settings__label">字号 <span className="settings__value">×{settings.fontScale.toFixed(2)}</span></div>
            <div className="settings__hint">缩放全部字号令牌，正文基准 14px</div>
          </div>
          <Slider
            min={0.9}
            max={1.2}
            step={0.05}
            value={settings.fontScale}
            onChange={(value) => onChange({ fontScale: value })}
            marks={[{ value: 0.9, label: '小' }, { value: 1, label: '标准' }, { value: 1.2, label: '大' }]}
            label="字号缩放"
          />
        </div>

        {row('动效', '关闭后所有过渡与动画立即停止',
          <Switch checked={settings.motion} onChange={(value) => onChange({ motion: value })} />)}

        <Typography as="paragraph" status="default">
          <span className="settings__note">
            这些开关改的都是 CSS 变量，没有重新构建，也没有换一套样式表——
            这正是两层令牌结构想要的效果。
          </span>
        </Typography>
      </div>
    </Drawer>
  );
}
