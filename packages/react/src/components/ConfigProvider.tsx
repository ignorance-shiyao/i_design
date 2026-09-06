import {
  defaultLocale,
  defaultTheme,
  locales,
  themeAttributes,
  themeStyle,
  type Density,
  type Direction,
  type Locale,
  type LocaleName,
  type ThemeMode,
} from '@i-design/core';
import { createContext, useContext, useMemo, type CSSProperties, type ReactNode } from 'react';

export interface IConfig {
  mode: ThemeMode;
  density: Density;
  dir: Direction;
  locale: Locale;
  /** Runtime token overrides scoped to this sub-tree. */
  tokens?: Record<string, string>;
}

const ConfigContext = createContext<IConfig>({ ...defaultTheme, locale: defaultLocale });

export const useConfig = (): IConfig => useContext(ConfigContext);

export interface ConfigProviderProps extends Partial<Omit<IConfig, 'locale'>> {
  locale?: Locale | LocaleName;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * Theme + locale + density + direction, all in one provider, and nestable:
 * a dark sidebar inside a light app is just another ConfigProvider.
 */
export function ConfigProvider(props: ConfigProviderProps) {
  const parent = useConfig();
  const {
    mode = parent.mode,
    density = parent.density,
    dir,
    tokens,
    locale = parent.locale,
    children,
    className,
    style,
  } = props;

  const resolvedLocale = typeof locale === 'string' ? locales[locale] : locale;
  const resolvedDir = dir ?? resolvedLocale.dir ?? parent.dir;

  const value = useMemo<IConfig>(
    () => ({ mode, density, dir: resolvedDir, locale: resolvedLocale, tokens }),
    [mode, density, resolvedDir, resolvedLocale, tokens],
  );

  return (
    <ConfigContext.Provider value={value}>
      <div
        {...themeAttributes({ mode, density, dir: resolvedDir })}
        className={className}
        style={{ ...(themeStyle({ tokens }) as CSSProperties), ...style }}
      >
        {children}
      </div>
    </ConfigContext.Provider>
  );
}
