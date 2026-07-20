import React from 'react';
import { StyleSheet } from 'react-native';
import { BarChart3 } from 'lucide-react-native';
import { EmptyState, useTheme } from '../../ui';

export function EmptyInsights({ onAddEntry }: { onAddEntry: () => void }) {
  const theme = useTheme();

  return (
    <EmptyState
      icon={<BarChart3 size={68} color={theme.sub} strokeWidth={1.8} />}
      title="还没有统计数据"
      description="添加几条记录后，这里会显示趋势和周期摘要。"
      action={{ label: '添加记录', onPress: onAddEntry }}
      style={styles.root}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 420,
  },
});
