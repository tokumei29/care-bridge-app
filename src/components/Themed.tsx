/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */
import { Text as DefaultText, View as DefaultView } from 'react-native';

import { useColorScheme } from './useColorScheme';

import Colors from '@/constants/Colors';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }
  const fromPalette = Colors[theme][colorName];
  if (fromPalette != null && fromPalette !== '') {
    return fromPalette;
  }
  if (colorName === 'text') {
    return theme === 'dark' ? Colors.dark.text : Colors.light.text;
  }
  return theme === 'dark' ? Colors.dark.background : Colors.light.background;
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const theme = useColorScheme();
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const resolved =
    color ?? (theme === 'dark' ? Colors.dark.text : Colors.light.text);

  return <DefaultText style={[{ color: resolved }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const theme = useColorScheme();
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const resolved =
    backgroundColor ?? (theme === 'dark' ? Colors.dark.background : Colors.light.background);

  return <DefaultView style={[{ backgroundColor: resolved }, style]} {...otherProps} />;
}
