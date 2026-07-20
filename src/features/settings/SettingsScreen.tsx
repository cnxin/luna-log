import React, { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Download, Moon, Trash2, Upload } from 'lucide-react-native';
import { type ThemePalette, useTheme } from '../../ui';

export type ThemeStyle = 'classic' | 'mint' | 'blue';

export type UserSettings = {
  privacyMode: boolean;
  appLockEnabled: boolean;
  screenCaptureProtection: boolean;
  cycleDays: number;
  periodDays: number;
  themeStyle: ThemeStyle;
};

type ThemeOption = {
  value: ThemeStyle;
  label: string;
  hint: string;
};

type SettingsScreenProps = {
  settings: UserSettings;
  themeOptions: readonly ThemeOption[];
  themePalettes: Record<ThemeStyle, Pick<ThemePalette, 'avatarGradient'>>;
  onPatch: (settings: Partial<UserSettings>) => void;
  onAppLockChange: (enabled: boolean) => void;
  onClear: () => void;
  onExportData: () => void;
  onImportData: () => void;
  recoveryAvailable: boolean;
  onExportInvalidData: () => void;
  onDiscardInvalidData: () => void;
};

export function SettingsScreen({
  settings,
  themeOptions,
  themePalettes,
  onPatch,
  onAppLockChange,
  onClear,
  onExportData,
  onImportData,
  recoveryAvailable,
  onExportInvalidData,
  onDiscardInvalidData,
}: SettingsScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View>
      <View style={styles.profileCard}>
        <LinearGradient colors={theme.avatarGradient} style={styles.profilePhoto}>
          <Moon color="#fff" size={28} />
        </LinearGradient>
        <View style={styles.profileMain}>
          <Text style={styles.profileTitle}>Luna Log</Text>
          <Text style={styles.profileDesc}>本地优先的私密生活记录 Demo</Text>
          <View style={styles.tagCloud}>
            <Text style={styles.tag}>Android / iOS</Text>
            <Text style={[styles.tag, styles.dangerTag]}>隐私模式</Text>
          </View>
        </View>
      </View>

      <SettingSwitch label="隐私模式" hint="隐藏首页、日历和统计中的敏感内容" value={settings.privacyMode} onChange={(privacyMode) => onPatch({ privacyMode })} styles={styles} />
      <SettingSwitch label="应用锁" hint="返回应用时要求生物识别或设备凭据" value={settings.appLockEnabled} onChange={onAppLockChange} styles={styles} />
      <SettingSwitch label="截图保护" hint="Android 上阻止截图、录屏和最近任务缩略图" value={settings.screenCaptureProtection} onChange={(screenCaptureProtection) => onPatch({ screenCaptureProtection })} styles={styles} />

      <View style={styles.themePanel}>
        <View style={styles.settingCopy}>
          <Text style={styles.settingTitle}>视觉风格</Text>
          <Text style={styles.settingHint}>原版、薄荷和参考深海冷光图片的蓝色主题</Text>
        </View>
        <View style={styles.themeOptionGrid} accessibilityRole="radiogroup" accessibilityLabel="视觉风格">
          {themeOptions.map((option) => {
            const optionTheme = themePalettes[option.value];
            const active = (settings.themeStyle || 'classic') === option.value;

            return (
              <Pressable
                key={option.value}
                style={[styles.themeOption, active && styles.themeOptionActive]}
                onPress={() => onPatch({ themeStyle: option.value })}
                accessibilityRole="radio"
                accessibilityLabel={option.label + '主题'}
                accessibilityHint={option.hint}
                accessibilityState={{ checked: active }}
                testID={'theme-option-' + option.value + (active ? '-active' : '')}
              >
                <LinearGradient colors={optionTheme.avatarGradient} style={styles.themeSwatch} />
                <View style={styles.themeOptionCopy}>
                  <Text style={[styles.themeOptionTitle, active && styles.themeOptionTitleActive]}>{option.label}</Text>
                  <Text style={styles.themeOptionHint}>{option.hint}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <NumberSetting label="周期长度" hint="经期记录不足 3 次时的默认预测值" value={settings.cycleDays} min={15} max={60} onChange={(cycleDays) => onPatch({ cycleDays })} styles={styles} />
      <NumberSetting label="经期天数" hint="用于日历经期标记" value={settings.periodDays} min={2} max={10} onChange={(periodDays) => onPatch({ periodDays })} styles={styles} />

      <View style={styles.themePanel}>
        <View style={styles.settingCopy}>
          <Text style={styles.settingTitle}>数据管理</Text>
          <Text style={styles.settingHint}>导出 JSON 备份，或从备份恢复本地记录</Text>
        </View>
        <SettingAction icon={<Download color={theme.primary} size={19} strokeWidth={2.6} />} label="导出数据" hint="备份到文件" onPress={onExportData} styles={styles} />
        <SettingAction icon={<Upload color={theme.primary} size={19} strokeWidth={2.6} />} label="导入数据" hint="从备份恢复并覆盖当前本地数据" onPress={onImportData} styles={styles} />
      </View>

      {recoveryAvailable && (
        <View style={styles.themePanel}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>受损数据恢复</Text>
            <Text style={styles.settingHint}>已停止自动写入，避免覆盖无法读取的本地数据</Text>
          </View>
          <SettingAction icon={<Download color={theme.primary} size={19} strokeWidth={2.6} />} label="导出原始恢复数据" hint="保留当前文件以便后续修复" onPress={onExportInvalidData} styles={styles} />
          <SettingAction icon={<Trash2 color={theme.danger} size={19} strokeWidth={2.6} />} label="丢弃并重新开始" hint="删除受损本地数据" onPress={onDiscardInvalidData} danger styles={styles} />
        </View>
      )}

      <Pressable style={styles.dangerRow} onPress={onClear} accessibilityRole="button" accessibilityLabel="重置所有数据">
        <View style={styles.settingCopy}>
          <Text style={styles.dangerRowTitle}>重置所有数据</Text>
          <Text style={styles.settingHint}>清空全部记录，含首次启动的演示数据</Text>
        </View>
        <Trash2 color={theme.danger} size={18} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

type Styles = ReturnType<typeof createStyles>;

function SettingSwitch({ label, hint, value, onChange, styles }: { label: string; hint: string; value: boolean; onChange: (value: boolean) => void; styles: Styles }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingCopy}>
        <Text style={styles.settingTitle}>{label}</Text>
        <Text style={styles.settingHint}>{hint}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label} accessibilityHint={hint} />
    </View>
  );
}

function NumberSetting({ label, hint, value, min, max, onChange, styles }: { label: string; hint: string; value: number; min: number; max: number; onChange: (value: number) => void; styles: Styles }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingCopy}>
        <Text style={styles.settingTitle}>{label}</Text>
        <Text style={styles.settingHint}>{hint}</Text>
      </View>
      <TextInput
        style={styles.settingInput}
        value={String(value)}
        keyboardType="number-pad"
        onChangeText={(text) => {
          const next = Number(text);
          if (Number.isInteger(next) && next >= min && next <= max) onChange(next);
        }}
        accessibilityLabel={label}
        accessibilityHint={hint}
      />
    </View>
  );
}

function SettingAction({ icon, label, hint, onPress, danger = false, styles }: { icon: React.ReactNode; label: string; hint: string; onPress: () => void; danger?: boolean; styles: Styles }) {
  return (
    <Pressable style={styles.settingRowCompact} onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint}>
      {icon}
      <View style={styles.settingCopy}>
        <Text style={danger ? styles.dangerRowTitle : styles.settingTitle}>{label}</Text>
        <Text style={styles.settingHint}>{hint}</Text>
      </View>
    </Pressable>
  );
}

function createStyles(theme: ThemePalette) {
  const cardShadow = Platform.select({
    web: {
      shadowColor: theme.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
    },
    default: {
      elevation: 2,
      shadowColor: theme.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
    },
  });

  return StyleSheet.create({
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      borderRadius: 26,
      padding: 18,
      marginBottom: 16,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.line,
      ...cardShadow,
    },
    profilePhoto: {
      width: 74,
      height: 74,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileMain: {
      flex: 1,
    },
    profileTitle: {
      color: theme.text,
      fontSize: 22,
      fontWeight: '900',
    },
    profileDesc: {
      marginTop: 4,
      marginBottom: 12,
      color: theme.sub,
      fontSize: 14,
      lineHeight: 20,
    },
    tagCloud: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tag: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      color: theme.primary,
      backgroundColor: theme.soft,
      fontSize: 11,
      fontWeight: '800',
    },
    dangerTag: {
      color: theme.danger,
      backgroundColor: theme.dangerSoft,
    },
    settingRowCompact: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: 18,
      padding: 13,
      backgroundColor: theme.soft,
      borderWidth: 1,
      borderColor: theme.line,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: 24,
      padding: 14,
      marginBottom: 10,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.line,
      ...cardShadow,
    },
    settingCopy: {
      flex: 1,
    },
    settingTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '700',
    },
    settingHint: {
      marginTop: 4,
      color: theme.sub,
      fontSize: 12,
      lineHeight: 17,
    },
    settingInput: {
      width: 86,
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: theme.text,
      backgroundColor: theme.soft,
      textAlign: 'center',
      fontWeight: '800',
    },
    themePanel: {
      borderRadius: 24,
      padding: 14,
      marginBottom: 10,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.line,
      ...cardShadow,
    },
    themeOptionGrid: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    themeOption: {
      flex: 1,
      minWidth: 0,
      borderRadius: 18,
      padding: 10,
      backgroundColor: theme.soft,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    themeOptionActive: {
      backgroundColor: theme.card,
      borderColor: theme.primary,
    },
    themeSwatch: {
      width: 32,
      height: 32,
      borderRadius: 13,
      marginBottom: 8,
    },
    themeOptionCopy: {
      minWidth: 0,
    },
    themeOptionTitle: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '900',
    },
    themeOptionTitleActive: {
      color: theme.primary,
    },
    themeOptionHint: {
      marginTop: 3,
      color: theme.sub,
      fontSize: 10,
      fontWeight: '700',
      lineHeight: 13,
    },
    dangerRow: {
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 15,
      borderRadius: 22,
      backgroundColor: theme.dangerSoft,
    },
    dangerRowTitle: {
      color: theme.danger,
      fontSize: 15,
      fontWeight: '900',
    },
  });
}
