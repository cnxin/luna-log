import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { PressScale } from './PressScale';
import { minimumTouchTarget, radius, spacing } from './tokens';
import { useTheme } from './theme';

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({ icon, title, description, action, style }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={[styles.root, style]}>
      {icon}
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.sub }]}>{description}</Text>
      {action && (
        <PressScale
          style={[styles.action, { backgroundColor: theme.primary }]}
          pressableProps={{ onPress: action.onPress, accessibilityRole: 'button', accessibilityLabel: action.label }}
        >
          <Text style={styles.actionText}>{action.label}</Text>
        </PressScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[8],
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  action: {
    minHeight: minimumTouchTarget,
    borderRadius: radius.md,
    justifyContent: 'center',
    paddingHorizontal: spacing[4] + spacing[1],
  },
  actionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
