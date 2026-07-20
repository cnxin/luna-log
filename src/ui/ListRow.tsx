import React, { type PropsWithChildren, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { PressScale } from './PressScale';
import { minimumTouchTarget, spacing } from './tokens';
import { useTheme } from './theme';

type ListRowProps = PropsWithChildren<{
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function ListRow({
  children,
  leading,
  trailing,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  contentStyle,
}: ListRowProps) {
  const theme = useTheme();
  const interactive = Boolean(onPress);

  return (
    <View style={[styles.row, { borderBottomColor: theme.line }, style]}>
      <PressScale
        style={[styles.content, contentStyle]}
        disabled={!interactive}
        pressableProps={{
          onPress,
          accessibilityRole: interactive ? 'button' : undefined,
          accessibilityLabel,
          accessibilityHint,
        }}
      >
        {leading}
        {children}
      </PressScale>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    minHeight: 72,
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
  },
  content: {
    flex: 1,
    minHeight: minimumTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
});
