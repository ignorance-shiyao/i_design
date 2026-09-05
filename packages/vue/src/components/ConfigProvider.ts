import {
  defaultLocale, defaultTheme, locales, themeAttributes, themeStyle,
  type Density, type Direction, type Locale, type LocaleName, type ThemeMode,
} from '@i-design/core';
import { computed, defineComponent, h, inject, provide, type ComputedRef, type PropType } from 'vue';

export interface IConfig {
  mode: ThemeMode;
  density: Density;
  dir: Direction;
  locale: Locale;
  tokens?: Record<string, string>;
}

const CONFIG_KEY = Symbol('i-design-config');

export function useConfig(): ComputedRef<IConfig> {
  return inject<ComputedRef<IConfig>>(
    CONFIG_KEY,
    computed(() => ({ ...defaultTheme, locale: defaultLocale })),
  );
}

export const ConfigProvider = defineComponent({
  name: 'IConfigProvider',
  props: {
    mode: String as PropType<ThemeMode>,
    density: String as PropType<Density>,
    dir: String as PropType<Direction>,
    locale: [String, Object] as PropType<LocaleName | Locale>,
    tokens: Object as PropType<Record<string, string>>,
  },
  setup(props, { slots }) {
    const parent = useConfig();

    const config = computed<IConfig>(() => {
      const locale =
        props.locale === undefined
          ? parent.value.locale
          : typeof props.locale === 'string'
            ? locales[props.locale]
            : props.locale;
      return {
        mode: props.mode ?? parent.value.mode,
        density: props.density ?? parent.value.density,
        dir: props.dir ?? locale.dir ?? parent.value.dir,
        locale,
        tokens: props.tokens,
      };
    });

    provide(CONFIG_KEY, config);

    return () =>
      h(
        'div',
        {
          ...themeAttributes(config.value),
          style: themeStyle({ tokens: config.value.tokens }),
        },
        slots.default?.(),
      );
  },
});
