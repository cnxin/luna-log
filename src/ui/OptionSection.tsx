import React, { type PropsWithChildren } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from './theme';

type OptionSectionProps = PropsWithChildren<{
  label: string;
  style?: StyleProp<ViewStyle>;
}>;

export function OptionSection({ label, children, style }: OptionSectionProps) {
  const theme = useTheme();

  return (
    <View style={[styles.section, style]}>
      <Text style={[styles.label, { color: theme.sub }]}>{label}</Text>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.line }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    borderRadius: 19,
    padding: 10,
    borderWidth: 1,
    gap: 10,
  },
});
