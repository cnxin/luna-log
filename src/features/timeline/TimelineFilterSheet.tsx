import React, { type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { AppleSheet, Field, IconButton, OptionSection, PressScale, radius, spacing, useTheme } from '../../ui';

type TimelineRange = 'week' | 'month' | 'halfYear' | 'year' | 'all' | 'custom';
type TimelineRecordType = 'all' | 'sex' | 'period' | 'symptom';

type TimelineFilterSheetProps = {
  visible: boolean;
  range: TimelineRange;
  type: TimelineRecordType;
  customRangeFields: ReactNode;
  searchQuery: string;
  onRangeChange: (range: TimelineRange) => void;
  onTypeChange: (type: TimelineRecordType) => void;
  onSearchQueryChange: (query: string) => void;
  onReset: () => void;
  onClose: () => void;
};

const rangeOptions: Array<{ value: TimelineRange; label: string }> = [
  { value: 'week', label: '一周' },
  { value: 'month', label: '一月' },
  { value: 'halfYear', label: '半年' },
  { value: 'year', label: '一年' },
  { value: 'all', label: '全部' },
  { value: 'custom', label: '自定义' },
];

const typeOptions: Array<{ value: TimelineRecordType; label: string }> = [
  { value: 'all', label: '全部记录' },
  { value: 'sex', label: '亲密' },
  { value: 'period', label: '经期' },
  { value: 'symptom', label: '身体状态' },
];

export function TimelineFilterSheet({
  visible,
  range,
  type,
  customRangeFields,
  searchQuery,
  onRangeChange,
  onTypeChange,
  onSearchQueryChange,
  onReset,
  onClose,
}: TimelineFilterSheetProps) {
  const theme = useTheme();

  return (
    <AppleSheet
      visible={visible}
      onClose={onClose}
      maxHeight={Platform.OS === 'web' ? 620 : undefined}
      backgroundColor={theme.materialHeavy}
      scrimColor={theme.scrim}
      tint={theme.isDark ? 'dark' : 'light'}
      style={{ ...styles.panel, backgroundColor: theme.materialHeavy }}
      header={
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: theme.sub }]}>最近记录</Text>
            <Text style={[styles.title, { color: theme.text }]}>筛选记录</Text>
          </View>
          <IconButton label="关闭筛选" onPress={onClose}>
            <X color={theme.sub} size={21} strokeWidth={2.6} />
          </IconButton>
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <OptionSection label="搜索记录">
          <Field label="关键词" value={searchQuery} onChangeText={onSearchQueryChange} placeholder="备注、地点、人物、心情或症状" />
        </OptionSection>

        <OptionSection label="时间范围">
          <ChipGroup options={rangeOptions} value={range} onChange={onRangeChange} />
        </OptionSection>

        {range === 'custom' && (
          <View style={[styles.customRange, { backgroundColor: theme.card, borderColor: theme.line }]}>
            {customRangeFields}
          </View>
        )}

        <OptionSection label="记录类型">
          <ChipGroup options={typeOptions} value={type} onChange={onTypeChange} />
        </OptionSection>

        <View style={styles.actions}>
          <PressScale
            style={[styles.resetButton, { backgroundColor: theme.soft }]}
            pressableProps={{ onPress: onReset, accessibilityRole: 'button', accessibilityLabel: '恢复默认筛选' }}
          >
            <Text style={[styles.resetText, { color: theme.primary }]}>恢复默认</Text>
          </PressScale>
          <PressScale
            style={[styles.applyButton, { backgroundColor: theme.primary }]}
            pressableProps={{ onPress: onClose, accessibilityRole: 'button', accessibilityLabel: '应用筛选' }}
          >
            <Text style={styles.applyText}>完成</Text>
          </PressScale>
        </View>
      </ScrollView>
    </AppleSheet>
  );
}

function ChipGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.chipGroup}>
      {options.map((option) => {
        const active = value === option.value;

        return (
          <PressScale
            key={option.value}
            style={[styles.chip, { backgroundColor: active ? theme.primary : theme.soft }]}
            pressableProps={{
              onPress: () => onChange(option.value),
              accessibilityRole: 'button',
              accessibilityLabel: option.label,
              accessibilityState: { selected: active },
            }}
          >
            <Text style={[styles.chipText, { color: active ? '#fff' : theme.primary }]}>{option.label}</Text>
          </PressScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    paddingHorizontal: spacing[6],
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    marginBottom: spacing[2],
  },
  kicker: {
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  content: {
    gap: 18,
    paddingBottom: spacing[3],
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customRange: {
    gap: 10,
    borderRadius: 22,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 6,
  },
  resetButton: {
    minHeight: 48,
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    fontSize: 15,
    fontWeight: '700',
  },
  applyButton: {
    minHeight: 48,
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
