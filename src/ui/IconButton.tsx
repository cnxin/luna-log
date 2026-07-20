import React, { type PropsWithChildren } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { PressScale } from './PressScale';
import { minimumTouchTarget, radius } from './tokens';
import { useTheme } from './theme';

type IconButtonProps = PropsWithChildren<{
  label: string;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export function IconButton({ children, label, onPress, disabled = false, selected = false, style }: IconButtonProps) {
  const theme = useTheme();

  return (
    <PressScale
      style={[styles.button, { backgroundColor: selected ? theme.card : theme.soft }, style]}
      disabled={disabled}
      pressableProps={{
        onPress,
        accessibilityRole: 'button',
        accessibilityLabel: label,
        accessibilityState: { disabled, selected },
      }}
    >
      {children}
    </PressScale>
  );
}

const styles = StyleSheet.create({
  button: {
    width: minimumTouchTarget,
    height: minimumTouchTarget,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
