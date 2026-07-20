import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MoreHorizontal, type LucideIcon } from 'lucide-react-native';
import { IconButton, ListRow, radius, spacing, useTheme } from '../../ui';

type TimelineRecordRowProps = {
  title: string;
  meta: string;
  detail?: string;
  Icon: LucideIcon;
  iconColor: string;
  onPress?: () => void;
  onMore: () => void;
};

export function TimelineRecordRow({ title, meta, detail, Icon, iconColor, onPress, onMore }: TimelineRecordRowProps) {
  const theme = useTheme();

  return (
    <ListRow
      leading={
        <View style={[styles.icon, { backgroundColor: theme.soft }]}>
          <Icon color={iconColor} size={20} strokeWidth={2.4} />
        </View>
      }
      onPress={onPress}
      accessibilityLabel={title + '，' + meta}
      accessibilityHint={onPress ? '点按编辑，更多操作可通过更多按钮打开' : undefined}
      trailing={
        <IconButton label={title + '的更多操作'} onPress={onMore}>
          <MoreHorizontal color={theme.sub} size={20} strokeWidth={2.4} />
        </IconButton>
      }
    >
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.meta, { color: theme.sub }]}>{meta}</Text>
        {!!detail && <Text style={[styles.detail, { color: theme.sub }]}>{detail}</Text>}
      </View>
    </ListRow>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: spacing[1],
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
    lineHeight: 17,
  },
  detail: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '500',
  },
});
