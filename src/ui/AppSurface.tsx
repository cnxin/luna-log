import React, { type PropsWithChildren } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from './theme';

type SurfaceKind = 'canvas' | 'primary' | 'elevated' | 'soft';

type AppSurfaceProps = PropsWithChildren<{
  kind?: SurfaceKind;
  style?: StyleProp<ViewStyle>;
}>;

export function AppSurface({ children, kind = 'primary', style }: AppSurfaceProps) {
  const theme = useTheme();
  const backgroundColor =
    kind === 'canvas' ? theme.bg : kind === 'elevated' ? theme.materialHeavy : kind === 'soft' ? theme.soft : theme.card;

  return <View style={[{ backgroundColor }, style]}>{children}</View>;
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return <View accessibilityElementsHidden style={[{ height: 1, backgroundColor: theme.line }, style]} />;
}
