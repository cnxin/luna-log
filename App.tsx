import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { allowScreenCaptureAsync, preventScreenCaptureAsync } from 'expo-screen-capture';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { isValidDateKey, normalizeImportedState } from './src/domain/recordValidation';
import {
  defaultProtectionSettings,
  discardStoredAppData,
  exportedStorageKey,
  loadProtectionSettings,
  loadStoredAppData,
  persistProtectionSettings,
  persistStoredAppData,
  type ProtectionSettings,
} from './src/storage/secureAppStorage';
import {
  Activity,
  Download,
  ExternalLink,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock,
  Droplet,
  Droplets,
  Eye,
  EyeOff,
  Heart,
  HeartHandshake,
  Home,
  Hourglass,
  Info,
  Moon,
  Pencil,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
  Trash2,
  Upload,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import {
  ActivityIndicator,
  Alert,
  AppState as NativeAppState,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

type Screen = 'home' | 'calendar' | 'insights' | 'settings';
type SheetType = 'partneredSex' | 'soloSex' | 'period' | 'periodDay' | 'symptom';
type RecordType = 'sex' | 'period' | 'symptom';
type ThemeStyle = 'classic' | 'mint' | 'blue';

type SexRecord = {
  id: string;
  dateTime: string;
  count: number;
  durationMinutes?: number;
  satisfaction?: number;
  partnerAlias?: string;
  protection?: string;
  protectionMethods?: string[];
  sexType?: string;
  sexTypes?: string[];
  place?: string;
  mood?: string;
  arousal?: boolean;
  partnerArousal?: boolean;
  orgasm?: boolean;
  toyUsed?: boolean;
  lingerie?: boolean;
  watchedAdultMovie?: boolean;
  syncedWithPartner?: boolean;
  ejaculationPlace?: string;
  initiator?: 'self' | 'partner';
  positions?: string[];
  soloTools?: string[];
  notes?: string;
};

type PeriodRecord = {
  id: string;
  startDate: string;
  endDate?: string;
  flow?: string;
  painLevel: number;
  symptoms: string[];
  notes?: string;
};

type PeriodDayRecord = {
  id: string;
  date: string;
  flow?: string;
  painLevel: number;
  symptoms: string[];
  notes?: string;
};

type SymptomRecord = {
  id: string;
  date: string;
  intensity: number;
  symptoms: string[];
  notes?: string;
};

type AppState = {
  sexRecords: SexRecord[];
  periodRecords: PeriodRecord[];
  periodDayRecords: PeriodDayRecord[];
  symptomRecords: SymptomRecord[];
  settings: {
    privacyMode: boolean;
    appLockEnabled: boolean;
    screenCaptureProtection: boolean;
    cycleDays: number;
    periodDays: number;
    themeStyle: ThemeStyle;
  };
};

type TimelineRange = 'week' | 'month' | 'halfYear' | 'year' | 'all' | 'custom';

type TimelineItem = {
  id: string;
  type: RecordType;
  date: Date;
  title: string;
  meta: string[];
  notes?: string;
};

type CycleInfo = {
  start: Date;
  day: number;
  normalizedDay: number;
  nextPeriod: Date;
  ovulation: Date;
  fertileStart: Date;
  fertileEnd: Date;
  cycleLength: number;
  variability: number;
  confidence: 'high' | 'medium' | 'low';
  nextPeriodEarliest: Date;
  nextPeriodLatest: Date;
} | null;

type ReleaseNote = {
  version: string;
  date: string;
  title: string;
  highlights: string[];
};

type UpdateSourceKind = 'github-release';

type UpdateSource = {
  key: string;
  name: string;
  url: string;
  kind: UpdateSourceKind;
  timeoutMs?: number;
};

type UpdateSourceDiagnostic = {
  sourceName: string;
  sourceUrl: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  durationMs: number;
  version?: string;
};

type AppUpdateManifest = {
  version?: string;
  releaseDate?: string;
  publishedAt?: string;
  title?: string;
  notes?: string[];
  highlights?: string[];
  changelog?: string;
  body?: string;
  downloadUrl?: string;
  apkUrl?: string;
  mirrorApkUrl?: string;
  releaseUrl?: string;
  apkName?: string;
  fileSize?: number;
  apkSize?: number;
  apkSha256?: string;
  mandatory?: boolean;
};

type GitHubReleaseAsset = {
  name?: string;
  browser_download_url?: string;
  size?: number;
};

type GitHubReleasePayload = {
  tag_name?: string;
  html_url?: string;
  name?: string;
  body?: string;
  published_at?: string;
  assets?: GitHubReleaseAsset[];
};

type AppUpdateInfo = {
  status: 'latest' | 'available' | 'failed';
  localVersion: string;
  latestVersion: string;
  title: string;
  notes: string[];
  releaseDate?: string;
  checkedAt: string;
  sourceName?: string;
  sourceUrl?: string;
  downloadUrl?: string;
  apkUrl?: string;
  mirrorApkUrl?: string;
  releaseUrl?: string;
  apkName?: string;
  fileSize?: number;
  apkSize?: number;
  apkSha256?: string;
  mandatory?: boolean;
};

const today = new Date();
const APP_VERSION = '1.0.11';
const UPDATE_REPOSITORY_URL = 'https://github.com/cnxin/luna-log';
const LATEST_RELEASE_URL = 'https://api.github.com/repos/cnxin/luna-log/releases/latest';
const UPDATE_SOURCES: UpdateSource[] = [
  {
    key: 'github-release',
    name: 'GitHub 官方 Release',
    url: LATEST_RELEASE_URL,
    kind: 'github-release',
    timeoutMs: 7000,
  },
];
const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '1.0.11',
    date: '2026-07-11',
    title: '安全存储与发布保护',
    highlights: [
      'Android 和 iOS 记录已迁移到 AES-256-GCM 加密存储，密钥保存在系统安全存储中',
      '应用锁会在解密记录前显示，并支持设备凭据或生物识别解锁',
      '默认启用 Android 截图、录屏和最近任务缩略图保护',
      '移除应用内 APK 下载和安装能力，更新只跳转到官方 GitHub Release 页面',
    ],
  },
  {
    version: '1.0.10',
    date: '2026-07-09',
    title: '版本同步和日历隐私优化',
    highlights: [
      '同步应用内版本常量，关于页会正确显示当前安装版本',
      '更新 Android versionCode 到 11，支持从 1.0.9 正常升级安装',
      '修正内置更新判断，避免已安装新包后仍显示旧版本',
      '日历中的亲密记录入口改为隐私化文案，并通过选择弹窗区分记录类型',
    ],
  },
  {
    version: '1.0.8',
    date: '2026-07-07',
    title: '优化 App 图标安全边距',
    highlights: [
      '缩小并内移左右月牙，避免圆角裁切后露出边界',
      '整体图案上移，让图标视觉重心更接近居中',
      '同步更新 Android 原生启动图标资源',
      '更新 Android versionCode 到 9，支持从 1.0.7 正常升级安装',
    ],
  },
  {
    version: '1.0.7',
    date: '2026-07-07',
    title: '修复 Android App 图标资源',
    highlights: [
      '重新生成 Android 原生启动图标资源，安装包会显示新的月相三态图标',
      '保留内置更新直接拉起系统安装器的修复',
      '更新 Android versionCode 到 8，支持从 1.0.6 正常升级安装',
    ],
  },
  {
    version: '1.0.4',
    date: '2026-07-07',
    title: '每日经期状态和内置升级优化',
    highlights: [
      '新增经期内每天的经量、痛经、症状和备注记录',
      '内置升级支持多来源检查、备用源重试和下载进度展示',
      '更新清单兼容 apkUrl、mirrorApkUrl、apkName、apkSize 和 apkSha256 字段',
      '更新 Android versionCode 到 5，支持从 1.0.3 正常升级安装',
    ],
  },
  {
    version: '1.0.3',
    date: '2026-07-06',
    title: '图标素材和记录体验优化',
    highlights: [
      '日历新增按选中日期快速添加亲密记录',
      '保护措施改为单选，并使用 Aphrodite 风格截图图标',
      '姿势、自慰道具和心情图标统一尺寸与视觉风格',
      '更新 Android versionCode 到 4，支持从 1.0.2 正常升级安装',
    ],
  },
  {
    version: '1.0.2',
    date: '2026-07-06',
    title: '数据备份、内置更新和体验优化',
    highlights: [
      '设置页加入 JSON 数据导入/导出，支持本地备份和恢复',
      '关于页加入内置更新包下载入口，并保留外部下载兜底',
      '统计页增加无数据和少量数据空态，避免新用户看到空指标',
      '新增记录表单会自动预填同类型上次选择，减少重复输入',
    ],
  },  {
    version: '1.0.1',
    date: '2026-07-04',
    title: '移动端 Demo 和记录体验',
    highlights: [
      '完成手机壳预览、首页、日历、统计和设置四个主界面',
      '亲密记录拆分为伴侣亲密和个人亲密入口，并补充 Aphrodite 风格的记录项',
      '日历支持经期、易孕期和亲密记录标记，统计支持周/月/年查看',
      '加入原版、薄荷、蓝色三套 LifeLog 风格视觉主题',
    ],
  },
];

type ThemePalette = {
  primary: string;
  primaryLight: string;
  secondary: string;
  bg: string;
  card: string;
  text: string;
  sub: string;
  line: string;
  soft: string;
  danger: string;
  dangerSoft: string;
  green: string;
  gold: string;
  period: string;
  periodLight: string;
  sex: string;
  shadow: string;
  webStage: string;
  phoneFrame: string;
  appGradient: readonly [string, string, string];
  heroGradient: readonly [string, string, string];
  bubbleGradient: readonly [string, string];
  avatarGradient: readonly [string, string];
};

const themePalettes: Record<ThemeStyle, ThemePalette> = {
  classic: {
    primary: '#7c8cf8',
    primaryLight: '#aeb8ff',
    secondary: '#f5a3ae',
    bg: '#fafbff',
    card: 'rgba(255,255,255,0.94)',
    text: '#20263a',
    sub: '#737b91',
    line: 'rgba(124,140,248,0.1)',
    soft: 'rgba(124,140,248,0.09)',
    danger: '#b94040',
    dangerSoft: 'rgba(217,87,87,0.12)',
    green: '#12b886',
    gold: '#fdcb6e',
    period: '#6688ff',
    periodLight: '#9bc1ff',
    sex: '#ff7b9c',
    shadow: '#7c8cf8',
    webStage: '#eef1ff',
    phoneFrame: '#141826',
    appGradient: ['rgba(124,140,248,0.12)', 'rgba(245,163,174,0.11)', '#fafbff'],
    heroGradient: ['rgba(124,140,248,0.18)', 'rgba(245,163,174,0.12)', 'rgba(255,255,255,0.94)'],
    bubbleGradient: ['rgba(124,140,248,0.18)', 'rgba(245,163,174,0.18)'],
    avatarGradient: ['#7c8cf8', '#f5a3ae'],
  },
  mint: {
    primary: '#20c7ad',
    primaryLight: '#9be9dc',
    secondary: '#74b9ef',
    bg: '#effff8',
    card: 'rgba(255,255,255,0.94)',
    text: '#173734',
    sub: '#5f7f7a',
    line: 'rgba(32,199,173,0.14)',
    soft: 'rgba(32,199,173,0.12)',
    danger: '#b9405f',
    dangerSoft: 'rgba(185,64,95,0.12)',
    green: '#12b886',
    gold: '#ffd166',
    period: '#62aef6',
    periodLight: '#b9e8ff',
    sex: '#ff8fb1',
    shadow: '#12b886',
    webStage: '#e7fff8',
    phoneFrame: '#103d3a',
    appGradient: ['rgba(140,239,216,0.32)', 'rgba(77,171,247,0.22)', '#effff8'],
    heroGradient: ['rgba(126,223,208,0.32)', 'rgba(123,189,242,0.18)', 'rgba(255,255,255,0.94)'],
    bubbleGradient: ['rgba(126,223,208,0.38)', 'rgba(123,189,242,0.28)'],
    avatarGradient: ['#68d8c8', '#74b9ef'],
  },
  blue: {
    primary: '#0f77d8',
    primaryLight: '#8ed8ff',
    secondary: '#35c9ff',
    bg: '#eaf6ff',
    card: 'rgba(255,255,255,0.94)',
    text: '#10223f',
    sub: '#5d7291',
    line: 'rgba(15,119,216,0.13)',
    soft: 'rgba(53,201,255,0.12)',
    danger: '#b94072',
    dangerSoft: 'rgba(185,64,114,0.12)',
    green: '#16c6a3',
    gold: '#ffd166',
    period: '#3f7dff',
    periodLight: '#9cd3ff',
    sex: '#ff87ba',
    shadow: '#0f77d8',
    webStage: '#dceeff',
    phoneFrame: '#06173a',
    appGradient: ['rgba(0,63,139,0.2)', 'rgba(21,169,255,0.16)', '#eaf6ff'],
    heroGradient: ['rgba(15,119,216,0.18)', 'rgba(53,201,255,0.16)', 'rgba(255,255,255,0.95)'],
    bubbleGradient: ['rgba(15,119,216,0.18)', 'rgba(53,201,255,0.2)'],
    avatarGradient: ['#0f77d8', '#35c9ff'],
  },
};

let colors = themePalettes.classic;

const initialState: AppState = {
  sexRecords: [],
  periodRecords: [],
  periodDayRecords: [],
  symptomRecords: [],
  settings: {
    privacyMode: false,
    appLockEnabled: false,
    screenCaptureProtection: true,
    cycleDays: 28,
    periodDays: 5,
    themeStyle: 'classic',
  },
};

type LunaLogExport = {
  version: number;
  app: 'Luna Log';
  storageKey: string;
  appVersion: string;
  exportedAt: string;
  data: AppState;
};

function hasAnyUserData(state: AppState) {
  return state.sexRecords.length > 0 || state.periodRecords.length > 0 || state.periodDayRecords.length > 0 || state.symptomRecords.length > 0;
}

function downloadJsonOnWeb(filename: string, json: string) {
  const webGlobal = globalThis as typeof globalThis & {
    document?: { createElement: (tag: string) => { href: string; download: string; click: () => void }; body?: { appendChild: (node: unknown) => void; removeChild: (node: unknown) => void } };
    URL?: { createObjectURL: (value: Blob) => string; revokeObjectURL: (url: string) => void };
  };
  if (!webGlobal.document || !webGlobal.URL) return false;
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = webGlobal.URL.createObjectURL(blob);
  const link = webGlobal.document.createElement('a');
  link.href = url;
  link.download = filename;
  webGlobal.document.body?.appendChild(link);
  link.click();
  webGlobal.document.body?.removeChild(link);
  webGlobal.URL.revokeObjectURL(url);
  return true;
}

const screenCopy: Record<Screen, { title: string; subtitle: string }> = {
  home: { title: '下午好', subtitle: '从今天的一次小记录开始' },
  calendar: { title: '日历', subtitle: '经期、易孕期和亲密记录' },
  insights: { title: '统计', subtitle: '看见频率、周期和身体趋势' },
  settings: { title: '设置', subtitle: '本地数据、隐私和导出' },
};

const themeOptions: Array<{ value: ThemeStyle; label: string; hint: string }> = [
  { value: 'classic', label: '原版', hint: '柔和紫粉' },
  { value: 'mint', label: '薄荷', hint: '清爽青绿' },
  { value: 'blue', label: '蓝色', hint: '深海冷光' },
];

function buildRecordMeta(theme: ThemePalette): Record<RecordType, { label: string; short: string; Icon: LucideIcon; colors: readonly [string, string] }> {
  return {
    sex: { label: '亲密记录', short: '亲密生活', Icon: HeartHandshake, colors: [theme.sex, theme.primary] },
    period: { label: '月经', short: '周期', Icon: Droplet, colors: [theme.period, theme.periodLight] },
    symptom: { label: '症状', short: '身体状态', Icon: Sparkles, colors: [theme.gold, theme.secondary] },
  };
}

let recordMeta = buildRecordMeta(colors);

function getSexKindMeta(record: SexRecord | null | undefined) {
  const solo = record ? isSoloSexRecord(record) : false;
  return solo
    ? { label: '个人亲密', Icon: Sparkles, color: colors.primary, colors: [colors.primary, colors.secondary] as const }
    : { label: '伴侣亲密', Icon: HeartHandshake, color: colors.sex, colors: [colors.sex, colors.primary] as const };
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function toDateKey(date: Date) {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 10);
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function daysBetween(left: Date, right: Date) {
  return Math.round((startOfDay(right).getTime() - startOfDay(left).getTime()) / 86400000);
}

function shortDate(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}

function longDate(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date);
}

function monthLabel(date: Date) {
  return `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
}

const lunarDayFormatter = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', { day: 'numeric' });
const lunarMonthFormatter = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', { month: 'long' });
const lunarMonthDayFormatter = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', { month: 'long', day: 'numeric' });

const solarTermLabels: Record<string, string> = {
  '01-05': '小寒',
  '01-20': '大寒',
  '02-04': '立春',
  '02-19': '雨水',
  '03-05': '惊蛰',
  '03-20': '春分',
  '04-04': '清明',
  '04-20': '谷雨',
  '05-05': '立夏',
  '05-21': '小满',
  '06-05': '芒种',
  '06-21': '夏至',
  '07-07': '小暑',
  '07-22': '大暑',
  '08-07': '立秋',
  '08-23': '处暑',
  '09-07': '白露',
  '09-23': '秋分',
  '10-08': '寒露',
  '10-23': '霜降',
  '11-07': '立冬',
  '11-22': '小雪',
  '12-07': '大雪',
  '12-21': '冬至',
};

const lunarFestivalLabels: Record<string, string> = {
  '正月-1': '春节',
  '正月-15': '元宵',
  '二月-2': '龙抬头',
  '五月-5': '端午',
  '七月-7': '七夕',
  '七月-15': '中元',
  '八月-15': '中秋',
  '九月-9': '重阳',
  '腊月-8': '腊八',
  '腊月-23': '小年',
};

function solarDateKey(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function lunarParts(date: Date) {
  const parts = lunarMonthDayFormatter.formatToParts(date);
  return {
    month: parts.find((part) => part.type === 'month')?.value || '',
    day: parts.find((part) => part.type === 'day')?.value || '',
  };
}

function lunarDayLabel(date: Date) {
  try {
    const term = solarTermLabels[solarDateKey(date)];
    if (term) return term;
    const lunar = lunarParts(date);
    const festival = lunarFestivalLabels[`${lunar.month}-${lunar.day}`];
    if (festival) return festival;
    const day = lunarDayFormatter.format(date);
    if (day === '1' || day === '初一') return `${lunarMonthFormatter.format(date).replace('月', '')}月`;
    return day;
  } catch {
    return '';
  }
}
function relativeDateLabel(date: Date) {
  const diff = daysBetween(new Date(), date);
  if (diff === 0) return { label: '今天', tone: 'today' as const };
  if (diff < 0) return { label: `${Math.abs(diff)} 天前`, tone: 'past' as const };
  return { label: `${diff} 天后`, tone: 'future' as const };
}

function dateTimeLabel(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sexSheetTypeForRecord(record: SexRecord): Extract<SheetType, 'partneredSex' | 'soloSex'> {
  return isSoloSexRecord(record) ? 'soloSex' : 'partneredSex';
}

function isSexSheet(type: SheetType | null): type is 'partneredSex' | 'soloSex' {
  return type === 'partneredSex' || type === 'soloSex';
}

function compareVersions(left: string, right: string) {
  const normalize = (value: string) =>
    value
      .replace(/^v/i, '')
      .split(/[.-]/)
      .map((part) => Number.parseInt(part, 10))
      .map((part) => (Number.isNaN(part) ? 0 : part));
  const leftParts = normalize(left);
  const rightParts = normalize(right);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index] || 0;
    const rightPart = rightParts[index] || 0;
    if (leftPart > rightPart) return 1;
    if (leftPart < rightPart) return -1;
  }
  return 0;
}

function formatFileSize(bytes?: number) {
  if (!bytes || bytes <= 0) return '--';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatUpdateDate(value?: string) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

function formatCheckedAt(value?: string) {
  if (!value) return '尚未检查';
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

async function fetchWithTimeout(url: string, timeoutMs = 7000, headers?: Record<string, string>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json', ...(headers || {}) },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeGitHubRelease(payload: GitHubReleasePayload, source: UpdateSource, checkedAt: string): AppUpdateInfo | null {
  const latestVersion = (payload.tag_name || '').replace(/^v/i, '');
  if (!latestVersion) return null;
  const apkAsset = (payload.assets || []).find((asset) => asset.name?.toLowerCase().endsWith('.apk'));
  const notes = payload.body?.split('\n').map((line) => line.replace(/^[-*]\s*/, '').trim()).filter(Boolean).slice(0, 6) || [];
  const hasUpdate = compareVersions(latestVersion, APP_VERSION) > 0;
  return {
    status: hasUpdate ? 'available' : 'latest',
    localVersion: APP_VERSION,
    latestVersion,
    title: payload.name || (hasUpdate ? '发现新版本' : '当前已是最新版本'),
    notes,
    releaseDate: payload.published_at,
    checkedAt,
    sourceName: source.name,
    sourceUrl: source.url,
    downloadUrl: apkAsset?.browser_download_url,
    apkUrl: apkAsset?.browser_download_url,
    mirrorApkUrl: undefined,
    releaseUrl: `${UPDATE_REPOSITORY_URL}/releases/tag/v${latestVersion}`,
    apkName: apkAsset?.name || `luna-log-v${latestVersion}.apk`,
    fileSize: apkAsset?.size,
    apkSize: apkAsset?.size,
  };
}

async function readUpdateSource(source: UpdateSource, checkedAt: string) {
  const startedAt = Date.now();
  const timeoutMs = source.timeoutMs || 6500;
  try {
    const response = await fetchWithTimeout(source.url, timeoutMs, { Accept: 'application/vnd.github+json' });
    const durationMs = Date.now() - startedAt;
    if (!response.ok) {
      return { info: null, diagnostic: { sourceName: source.name, sourceUrl: source.url, status: 'failed' as const, message: `HTTP ${response.status}`, durationMs } };
    }
    const payload = await response.json();
    const info = normalizeGitHubRelease(payload as GitHubReleasePayload, source, checkedAt);
    if (!info) {
      return { info: null, diagnostic: { sourceName: source.name, sourceUrl: source.url, status: 'failed' as const, message: '未读取到版本号', durationMs } };
    }
    return {
      info,
      diagnostic: { sourceName: source.name, sourceUrl: source.url, status: 'success' as const, message: info.apkName || info.releaseUrl || '已读取更新信息', durationMs, version: info.latestVersion },
    };
  } catch (error) {
    return {
      info: null,
      diagnostic: {
        sourceName: source.name,
        sourceUrl: source.url,
        status: 'failed' as const,
        message: error instanceof Error && error.name === 'AbortError' ? '请求超时' : error instanceof Error ? error.message : '网络不可用',
        durationMs: Date.now() - startedAt,
      },
    };
  }
}

async function checkLatestAppUpdate(): Promise<{ info: AppUpdateInfo; diagnostics: UpdateSourceDiagnostic[] }> {
  const checkedAt = new Date().toISOString();
  const result = await readUpdateSource(UPDATE_SOURCES[0], checkedAt);
  if (result.info) return { info: result.info, diagnostics: [result.diagnostic] };

  return {
    info: {
      status: 'failed',
      localVersion: APP_VERSION,
      latestVersion: APP_VERSION,
      title: '暂时无法检查更新',
      notes: ['请稍后重试，或直接打开 GitHub 项目查看最新版本。'],
      checkedAt,
      releaseUrl: UPDATE_REPOSITORY_URL,
    },
    diagnostics: [result.diagnostic],
  };
}

export default function App() {
  const [state, setState] = useState<AppState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
  const [visibleMonth, setVisibleMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [sheetType, setSheetType] = useState<SheetType | null>(null);
  const [editingSexRecord, setEditingSexRecord] = useState<SexRecord | null>(null);
  const [editingPeriodRecord, setEditingPeriodRecord] = useState<PeriodRecord | null>(null);
  const [editingPeriodDayRecord, setEditingPeriodDayRecord] = useState<PeriodDayRecord | null>(null);
  const [editingSymptomRecord, setEditingSymptomRecord] = useState<SymptomRecord | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [statsRange, setStatsRange] = useState<'week' | 'month' | 'year'>('year');
  const [fabOpen, setFabOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [updateDiagnostics, setUpdateDiagnostics] = useState<UpdateSourceDiagnostic[]>([]);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [notice, setNotice] = useState<{ message: string; action?: { label: string; run: () => void } } | null>(null);
  const [invalidStoredData, setInvalidStoredData] = useState<{ raw: string; storageKey: string } | null>(null);
  const [protectionSettings, setProtectionSettings] = useState<ProtectionSettings>(defaultProtectionSettings);
  const [protectionSettingsLoaded, setProtectionSettingsLoaded] = useState(false);
  const [storageLoadRequested, setStorageLoadRequested] = useState(false);
  const [sessionUnlocked, setSessionUnlocked] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const loadedRef = useRef(false);
  const persistenceEnabledRef = useRef(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageWriteQueue = useRef<Promise<void>>(Promise.resolve());
  const protectionWriteQueue = useRef<Promise<void>>(Promise.resolve());
  const protectionSettingsRef = useRef<ProtectionSettings>(defaultProtectionSettings);
  const authenticationInFlightRef = useRef(false);
  const nativeAppStateRef = useRef(NativeAppState.currentState);

  const cycleInfo = useMemo(() => getCycleInfo(state), [state]);
  const timeline = useMemo(() => buildTimeline(state), [state]);
  const currentCopy = screenCopy[screen];
  const stats = useMemo(() => buildStats(state), [state]);
  const activeTheme = themePalettes[state.settings.themeStyle || 'classic'];
  colors = activeTheme;
  styles = createStyles(activeTheme);
  recordMeta = buildRecordMeta(activeTheme);

  useEffect(() => {
    let alive = true;
    loadProtectionSettings()
      .then((settings) => {
        if (!alive) return;
        protectionSettingsRef.current = settings;
        setProtectionSettings(settings);
      })
      .catch(() => showNotice('读取应用保护设置失败'))
      .finally(() => {
        if (alive) setProtectionSettingsLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!protectionSettingsLoaded) return;
    if (!protectionSettings.appLockEnabled) {
      setSessionUnlocked(true);
      setStorageLoadRequested(true);
      return;
    }
    setSessionUnlocked(false);
    void authenticateApp();
  }, [protectionSettingsLoaded, protectionSettings.appLockEnabled]);

  useEffect(() => {
    if (!storageLoadRequested) return;
    let alive = true;
    loadStoredAppData()
      .then(async (stored) => {
        if (!alive) return;
        if (stored.kind === 'unavailable') {
          showNotice('当前设备的安全存储不可用，已停止自动写入。', undefined, 5000);
          return;
        }
        if (stored.kind === 'corrupt') {
          setInvalidStoredData({ raw: stored.raw, storageKey: stored.storageKey });
          showNotice('本地数据格式异常，已停止自动写入。请在设置中导出或恢复。', undefined, 5000);
          return;
        }
        if (stored.kind === 'empty') {
          persistenceEnabledRef.current = true;
          return;
        }
        const raw = stored.raw;
        if (!alive) return;
        if (!raw) {
          persistenceEnabledRef.current = true;
          return;
        }
        try {
          const restored = normalizeImportedState(JSON.parse(raw), initialState.settings);
          if (!restored) throw new Error('invalid stored data');
          const restoredProtectionSettings: ProtectionSettings = {
            appLockEnabled: protectionSettingsRef.current.appLockEnabled || restored.settings.appLockEnabled,
            screenCaptureProtection: protectionSettingsRef.current.screenCaptureProtection || restored.settings.screenCaptureProtection,
          };
          const nextState: AppState = {
            ...restored,
            settings: { ...restored.settings, ...restoredProtectionSettings },
          };
          if (stored.source === 'legacy' && Platform.OS !== 'web') {
            await persistStoredAppData(JSON.stringify(nextState));
          }
          if (
            restoredProtectionSettings.appLockEnabled !== protectionSettingsRef.current.appLockEnabled ||
            restoredProtectionSettings.screenCaptureProtection !== protectionSettingsRef.current.screenCaptureProtection
          ) {
            await persistProtectionSettings(restoredProtectionSettings);
            protectionSettingsRef.current = restoredProtectionSettings;
            if (restoredProtectionSettings.appLockEnabled) setSessionUnlocked(false);
            setProtectionSettings(restoredProtectionSettings);
          }
          setState(nextState);
          persistenceEnabledRef.current = true;
        } catch {
          setInvalidStoredData({ raw, storageKey: stored.source === 'legacy' ? 'luna-log-app-v5' : 'luna-log-app-v6' });
          showNotice('本地数据格式异常，已停止自动写入。请在设置中导出或恢复。', undefined, 5000);
        }
      })
      .catch(() => showNotice('读取本地数据失败'))
      .finally(() => {
        if (!alive) return;
        loadedRef.current = true;
        setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [storageLoadRequested]);

  useEffect(() => {
    if (!loadedRef.current || !persistenceEnabledRef.current) return;
    const serialized = JSON.stringify(state);
    storageWriteQueue.current = storageWriteQueue.current
      .catch(() => undefined)
      .then(() => persistStoredAppData(serialized))
      .catch(() => {
        showNotice('保存失败，请重试');
      });
  }, [state]);

  useEffect(() => {
    const subscription = NativeAppState.addEventListener('change', (nextState) => {
      const previousState = nativeAppStateRef.current;
      nativeAppStateRef.current = nextState;
      if (!protectionSettingsLoaded || !protectionSettings.appLockEnabled) return;
      if (nextState !== 'active') {
        setSessionUnlocked(false);
      } else if (previousState !== 'active') {
        void authenticateApp();
      }
    });
    return () => subscription.remove();
  }, [protectionSettingsLoaded, protectionSettings.appLockEnabled]);

  function patchState(updater: (current: AppState) => AppState) {
    setState((current) => updater(current));
  }

  function showNotice(message: string, action?: { label: string; run: () => void }, duration = 2500) {
    setNotice({ message, action });
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), duration);
  }

  async function updateProtectionSettings(patch: Partial<ProtectionSettings>) {
    let nextSettings: ProtectionSettings | null = null;
    const task = protectionWriteQueue.current
      .catch(() => undefined)
      .then(async () => {
        nextSettings = { ...protectionSettingsRef.current, ...patch };
        await persistProtectionSettings(nextSettings);
        protectionSettingsRef.current = nextSettings;
        setProtectionSettings(nextSettings);
      });
    protectionWriteQueue.current = task;
    try {
      await task;
      return true;
    } catch {
      showNotice('保存应用保护设置失败');
      return false;
    }
  }

  function deleteRecord(type: RecordType, id: string) {
    const record =
      type === 'sex'
        ? state.sexRecords.find((item) => item.id === id)
        : type === 'period'
          ? state.periodRecords.find((item) => item.id === id)
          : state.symptomRecords.find((item) => item.id === id);
    if (!record) return;
    patchState((current) => ({
      ...current,
      sexRecords: type === 'sex' ? current.sexRecords.filter((item) => item.id !== id) : current.sexRecords,
      periodRecords: type === 'period' ? current.periodRecords.filter((item) => item.id !== id) : current.periodRecords,
      symptomRecords: type === 'symptom' ? current.symptomRecords.filter((item) => item.id !== id) : current.symptomRecords,
    }));
    const label = type === 'sex' ? '亲密记录' : type === 'period' ? '经期记录' : '症状记录';
    showNotice(`已删除${label}`, { label: '撤销', run: () => restoreRecord(type, record) }, 5000);
  }

  function restoreRecord(type: RecordType, record: SexRecord | PeriodRecord | SymptomRecord) {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    patchState((current) => ({
      ...current,
      sexRecords: type === 'sex' ? [...current.sexRecords, record as SexRecord] : current.sexRecords,
      periodRecords: type === 'period' ? [...current.periodRecords, record as PeriodRecord] : current.periodRecords,
      symptomRecords: type === 'symptom' ? [...current.symptomRecords, record as SymptomRecord] : current.symptomRecords,
    }));
    setNotice(null);
  }

  function clearRecords() {
    Alert.alert('重置所有数据', '将永久删除全部亲密、经期和症状记录（含首次启动的演示数据），无法撤销。确定继续？', [
      { text: '取消', style: 'cancel' },
      {
        text: '清空',
        style: 'destructive',
        onPress: () => patchState((current) => ({ ...current, sexRecords: [], periodRecords: [], periodDayRecords: [], symptomRecords: [] })),
      },
    ]);
  }

  async function handleExportData() {
    if (!hasAnyUserData(state)) {
      Alert.alert('无数据', '当前没有记录可以导出');
      return;
    }
    try {
      const filename = `luna-log-${Date.now()}.json`;
      const exportObj: LunaLogExport = {
        version: 1,
        app: 'Luna Log',
        storageKey: exportedStorageKey,
        appVersion: APP_VERSION,
        exportedAt: new Date().toISOString(),
        data: state,
      };
      const json = JSON.stringify(exportObj, null, 2);
      if (Platform.OS === 'web') {
        if (!downloadJsonOnWeb(filename, json)) throw new Error('web download unavailable');
        showNotice('已导出数据备份');
        return;
      }
      if (!FileSystem.documentDirectory) throw new Error('document directory unavailable');
      const path = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: '导出 Luna Log 数据' });
      } else {
        showNotice('已导出到应用文档目录');
      }
    } catch {
      Alert.alert('导出失败', '无法生成数据备份，请稍后再试');
    }
  }

  async function handleImportData() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) throw new Error('missing file');
      if (asset.size && asset.size > 10 * 1024 * 1024) throw new Error('backup file is too large');
      const webFile = (asset as unknown as { file?: { text?: () => Promise<string> } }).file;
      const content = webFile?.text ? await webFile.text() : await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
      const imported = JSON.parse(content) as unknown;
      const importedState = normalizeImportedState(imported, initialState.settings);
      if (!importedState) {
        Alert.alert('格式错误', '文件格式不正确，未找到 Luna Log 备份数据');
        return;
      }
      Alert.alert('导入数据', '导入会覆盖当前本地记录，是否继续？', [
        { text: '取消', style: 'cancel' },
        {
          text: '导入',
          style: 'destructive',
          onPress: async () => {
            try {
              const nextState: AppState = {
                ...importedState,
                // A backup cannot weaken protections configured on this device.
                settings: { ...importedState.settings, ...protectionSettingsRef.current },
              };
              await persistStoredAppData(JSON.stringify(nextState));
              persistenceEnabledRef.current = true;
              setInvalidStoredData(null);
              setState(nextState);
              showNotice('导入成功，数据已恢复');
            } catch {
              Alert.alert('导入失败', '写入本地数据失败，请稍后再试');
            }
          },
        },
      ]);
    } catch {
      Alert.alert('导入失败', '无法读取或解析这个 JSON 文件');
    }
  }

  async function handleExportInvalidStoredData() {
    if (!invalidStoredData) return;
    try {
      const filename = `luna-log-recovery-${Date.now()}.json`;
      if (Platform.OS === 'web') {
        if (!downloadJsonOnWeb(filename, invalidStoredData.raw)) throw new Error('web download unavailable');
      } else {
        if (!FileSystem.documentDirectory) throw new Error('document directory unavailable');
        const path = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(path, invalidStoredData.raw, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: '导出 Luna Log 原始恢复数据' });
        }
      }
      showNotice('已导出原始恢复数据');
    } catch {
      Alert.alert('导出失败', '无法导出原始恢复数据，请稍后重试。');
    }
  }

  async function authenticateApp() {
    if (!protectionSettingsRef.current.appLockEnabled || authenticationInFlightRef.current) return;
    authenticationInFlightRef.current = true;
    setAuthenticating(true);
    try {
      const enrollmentLevel = await LocalAuthentication.getEnrolledLevelAsync();
      if (enrollmentLevel === LocalAuthentication.SecurityLevel.NONE) {
        Alert.alert('无法启用应用锁', '此设备没有可用的生物识别或设备凭据。应用锁已关闭。');
        if (!(await updateProtectionSettings({ appLockEnabled: false }))) return;
        patchState((current) => ({ ...current, settings: { ...current.settings, appLockEnabled: false } }));
        setSessionUnlocked(true);
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: '解锁 Luna Log',
        promptSubtitle: '验证身份后查看私密记录',
        cancelLabel: '取消',
        disableDeviceFallback: false,
        biometricsSecurityLevel: 'strong',
      });
      if (result.success) {
        setSessionUnlocked(true);
        setStorageLoadRequested(true);
      }
    } catch {
      showNotice('无法验证身份，请重试');
    } finally {
      authenticationInFlightRef.current = false;
      setAuthenticating(false);
    }
  }

  async function handleAppLockChange(enabled: boolean) {
    if (!enabled) {
      if (!(await updateProtectionSettings({ appLockEnabled: false }))) return;
      setSessionUnlocked(true);
      patchState((current) => ({ ...current, settings: { ...current.settings, appLockEnabled: false } }));
      return;
    }
    try {
      const enrollmentLevel = await LocalAuthentication.getEnrolledLevelAsync();
      if (enrollmentLevel === LocalAuthentication.SecurityLevel.NONE) {
        Alert.alert('无法启用应用锁', '请先在设备设置中配置生物识别或设备锁屏凭据。');
        return;
      }
      if (!(await updateProtectionSettings({ appLockEnabled: true }))) return;
      setSessionUnlocked(false);
      patchState((current) => ({ ...current, settings: { ...current.settings, appLockEnabled: true } }));
    } catch {
      Alert.alert('无法启用应用锁', '当前设备不支持本地身份验证。');
    }
  }

  function discardInvalidStoredData() {
    const recoveryData = invalidStoredData;
    if (!recoveryData) return;
    Alert.alert('丢弃受损数据', '这会永久删除当前无法读取的本地数据。建议先导出原始恢复数据。', [
      { text: '取消', style: 'cancel' },
      {
        text: '丢弃并重新开始',
        style: 'destructive',
        onPress: async () => {
          try {
            await discardStoredAppData(recoveryData.storageKey);
            persistenceEnabledRef.current = true;
            setInvalidStoredData(null);
            setState({ ...initialState, settings: { ...initialState.settings, ...protectionSettingsRef.current } });
            showNotice('已清除受损数据，可以重新开始记录');
          } catch {
            Alert.alert('操作失败', '无法清除受损数据，请稍后重试。');
          }
        },
      },
    ]);
  }

  async function handleCheckUpdate() {
    if (isCheckingUpdate) return;
    setIsCheckingUpdate(true);
    try {
      const result = await checkLatestAppUpdate();
      setUpdateInfo(result.info);
      setUpdateDiagnostics(result.diagnostics);
      if (result.info.status === 'available') {
        showNotice(`发现新版本 ${result.info.latestVersion}`);
      } else if (result.info.status === 'latest') {
        showNotice('当前已经是最新版本');
      } else {
        showNotice('检查更新失败，请稍后再试');
      }
    } finally {
      setIsCheckingUpdate(false);
    }
  }

  function openAbout() {
    setFabOpen(false);
    setAboutOpen(true);
  }

  async function openExternalUrl(url?: string) {
    if (!url) {
      showNotice('暂无可打开的链接');
      return;
    }
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        showNotice('当前环境无法打开链接');
        return;
      }
      await Linking.openURL(url);
    } catch {
      showNotice('打开链接失败');
    }
  }

  function openSheet(type: SheetType) {
    setFabOpen(false);
    setEditingSexRecord(null);
    setEditingPeriodRecord(null);
    setEditingPeriodDayRecord(null);
    setEditingSymptomRecord(null);
    setSheetType(type);
  }

  function openSexEditor(record: SexRecord) {
    setFabOpen(false);
    setEditingSexRecord(record);
    setEditingPeriodRecord(null);
    setEditingPeriodDayRecord(null);
    setEditingSymptomRecord(null);
    setSheetType(sexSheetTypeForRecord(record));
  }

  function openPeriodEditor(record: PeriodRecord) {
    setFabOpen(false);
    setEditingSexRecord(null);
    setEditingPeriodRecord(record);
    setEditingPeriodDayRecord(null);
    setEditingSymptomRecord(null);
    setSheetType('period');
  }

  function openPeriodDayEditor(record: PeriodDayRecord | null, dateKey: string) {
    setFabOpen(false);
    setSelectedCalendarDate(dateKey);
    setEditingSexRecord(null);
    setEditingPeriodRecord(null);
    setEditingPeriodDayRecord(record);
    setEditingSymptomRecord(null);
    setSheetType('periodDay');
  }

  function openSymptomEditor(record: SymptomRecord) {
    setFabOpen(false);
    setEditingSexRecord(null);
    setEditingPeriodRecord(null);
    setEditingPeriodDayRecord(null);
    setEditingSymptomRecord(record);
    setSheetType('symptom');
  }

  function closeSheet() {
    setSheetType(null);
    setEditingSexRecord(null);
    setEditingPeriodRecord(null);
    setEditingPeriodDayRecord(null);
    setEditingSymptomRecord(null);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScreenCaptureGuard enabled={protectionSettings.screenCaptureProtection} />
      <View style={Platform.OS === 'web' ? styles.webStage : styles.nativeStage}>
        <View style={Platform.OS === 'web' ? styles.webPhoneFrame : styles.nativeFrame}>
          {protectionSettingsLoaded && protectionSettings.appLockEnabled && !sessionUnlocked ? (
            <AppLockScreen authenticating={authenticating} onUnlock={authenticateApp} />
          ) : (
          <View style={styles.appContainer}>
            <LinearGradient colors={colors.appGradient} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
              <View style={styles.greeting}>
                <Text style={styles.dateLabel}>{new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(today)}</Text>
                <Text style={styles.title}>{state.settings.privacyMode ? '已隐藏' : currentCopy.title}</Text>
                <Text style={styles.subtitle}>{state.settings.privacyMode ? '隐私模式已开启' : currentCopy.subtitle}</Text>
              </View>
              <View style={styles.headerActions}>
                <Pressable
                  style={styles.headerIconButton}
                  onPress={() =>
                    patchState((current) => ({
                      ...current,
                      settings: { ...current.settings, privacyMode: !current.settings.privacyMode },
                    }))
                  }
                >
                  {state.settings.privacyMode ? <EyeOff color={colors.primary} size={20} /> : <Eye color={colors.primary} size={20} />}
                </Pressable>
                <Pressable style={styles.avatarButton} onPress={openAbout}>
                  <LinearGradient colors={colors.avatarGradient} style={styles.avatar}>
                    <Info color="#fff" size={21} strokeWidth={2.7} />
                  </LinearGradient>
                </Pressable>
              </View>
            </View>

            <ScrollView style={styles.mainContent} contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
              {!loaded && <HomeSkeleton />}
              {loaded && screen === 'home' && (
                <HomeScreen
                  state={state}
                  stats={stats}
                  cycleInfo={cycleInfo}
                  timeline={timeline}
                  onDelete={deleteRecord}
                  onEditSex={openSexEditor}
                  onEditPeriod={openPeriodEditor}
                  onEditSymptom={openSymptomEditor}
                />
              )}
              {loaded && screen === 'calendar' && (
                <CalendarScreen
                  state={state}
                  visibleMonth={visibleMonth}
                  cycleInfo={cycleInfo}
                  selectedDateKey={selectedCalendarDate}
                  onMonthChange={setVisibleMonth}
                  onSelectDate={(date) => setSelectedCalendarDate(toDateKey(date))}
                  onPatch={(updater) => patchState(updater)}
                  onAddEntry={openSheet}
                  onEditSex={openSexEditor}
                  onEditPeriodDay={openPeriodDayEditor}
                />
              )}
              {loaded && screen === 'insights' && <InsightsScreen state={state} stats={stats} cycleInfo={cycleInfo} range={statsRange} onRangeChange={setStatsRange} />}
              {loaded && screen === 'settings' && (
                <SettingsScreen
                  state={state}
                  onPatch={(settings) => {
                    if (settings.screenCaptureProtection !== undefined) {
                      void updateProtectionSettings({ screenCaptureProtection: settings.screenCaptureProtection }).then((saved) => {
                        if (saved) {
                          patchState((current) => ({ ...current, settings: { ...current.settings, ...settings } }));
                        }
                      });
                      return;
                    }
                    patchState((current) => ({ ...current, settings: { ...current.settings, ...settings } }));
                  }}
                  onAppLockChange={handleAppLockChange}
                  onClear={clearRecords}
                  onExportData={handleExportData}
                  onImportData={handleImportData}
                  recoveryAvailable={Boolean(invalidStoredData)}
                  onExportInvalidData={handleExportInvalidStoredData}
                  onDiscardInvalidData={discardInvalidStoredData}
                />
              )}
            </ScrollView>

            {screen !== 'insights' && fabOpen && (
              <Pressable style={styles.fabBackdrop} onPress={() => setFabOpen(false)}>
                <View style={styles.fabMenu}>
                  <FabMenuItem primary type="partneredSex" privacy={state.settings.privacyMode} desc={state.settings.privacyMode ? "记录一段亲密时刻" : "伴侣、保护措施、姿势和心情"} onPress={() => openSheet('partneredSex')} />
                  <FabMenuItem type="soloSex" privacy={state.settings.privacyMode} desc={state.settings.privacyMode ? "记录一段独处时刻" : "道具、观看、高潮和评分"} onPress={() => openSheet('soloSex')} />
                  <FabMenuItem type="period" privacy={state.settings.privacyMode} desc={state.settings.privacyMode ? "记录周期变化" : "开始、结束、流量和痛经"} onPress={() => openSheet('period')} />
                  <FabMenuItem type="symptom" privacy={state.settings.privacyMode} desc={state.settings.privacyMode ? "记录身体状态" : "身体和情绪变化"} onPress={() => openSheet('symptom')} />
                </View>
              </Pressable>
            )}

            {screen !== 'insights' && (
              <Pressable style={styles.fab} onPress={() => setFabOpen((current) => !current)}>
                <LinearGradient colors={fabOpen ? [colors.secondary, colors.primaryLight] : colors.avatarGradient} style={styles.fabGradient}>
                  {fabOpen ? <X color="#fff" size={27} strokeWidth={2.7} /> : <Plus color="#fff" size={29} strokeWidth={2.7} />}
                </LinearGradient>
              </Pressable>
            )}

            {notice && (
              <View style={styles.snackbar}>
                <Text style={styles.snackbarText}>{notice.message}</Text>
                {notice.action && (
                  <Pressable style={styles.snackbarAction} onPress={notice.action.run}>
                    <Text style={styles.snackbarActionText}>{notice.action.label}</Text>
                  </Pressable>
                )}
              </View>
            )}

            <AboutScreen
              visible={aboutOpen}
              updateInfo={updateInfo}
              diagnostics={updateDiagnostics}
              checking={isCheckingUpdate}
              onClose={() => setAboutOpen(false)}
              onCheckUpdate={handleCheckUpdate}
              onOpenUrl={openExternalUrl}
            />

            <View style={styles.bottomNav}>
              <NavItem active={screen === 'home'} label="首页" Icon={Home} onPress={() => setScreen('home')} />
              <NavItem active={screen === 'calendar'} label="日历" Icon={CalendarDays} onPress={() => setScreen('calendar')} />
              <NavItem active={screen === 'insights'} label="统计" Icon={BarChart3} onPress={() => setScreen('insights')} />
              <NavItem active={screen === 'settings'} label="设置" Icon={Settings} onPress={() => setScreen('settings')} />
            </View>

            <EntrySheet
              type={sheetType}
              state={state}
              initialDateKey={screen === 'calendar' ? selectedCalendarDate || toDateKey(new Date()) : null}
              editingSexRecord={editingSexRecord}
              editingPeriodRecord={editingPeriodRecord}
              editingPeriodDayRecord={editingPeriodDayRecord}
              editingSymptomRecord={editingSymptomRecord}
              onClose={closeSheet}
              onSaveSex={(record) => {
                patchState((current) => ({
                  ...current,
                  sexRecords: editingSexRecord
                    ? current.sexRecords.map((item) => (item.id === record.id ? record : item))
                    : [...current.sexRecords, record],
                }));
                showNotice(editingSexRecord ? '已保存修改' : '已保存');
              }}
              onSavePeriod={(record) => {
                patchState((current) => ({
                  ...current,
                  periodRecords: editingPeriodRecord
                    ? current.periodRecords.map((item) => (item.id === record.id ? record : item))
                    : [...current.periodRecords, record],
                }));
                showNotice(editingPeriodRecord ? '已保存修改' : '已保存');
              }}
              onSavePeriodDay={(record) => {
                patchState((current) => {
                  const withoutSameDate = current.periodDayRecords.filter((item) => item.id === record.id || item.date !== record.date);
                  return {
                    ...current,
                    periodDayRecords: editingPeriodDayRecord
                      ? withoutSameDate.map((item) => (item.id === record.id ? record : item))
                      : [...withoutSameDate, record],
                  };
                });
                showNotice(editingPeriodDayRecord ? '已保存当天月经状态' : '已记录当天月经状态');
              }}
              onSaveSymptom={(record) => {
                patchState((current) => ({
                  ...current,
                  symptomRecords: editingSymptomRecord
                    ? current.symptomRecords.map((item) => (item.id === record.id ? record : item))
                    : [...current.symptomRecords, record],
                }));
                showNotice(editingSymptomRecord ? '已保存修改' : '已保存');
              }}
            />
          </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function HomeScreen({
  state,
  stats,
  cycleInfo,
  timeline,
  onDelete,
  onEditSex,
  onEditPeriod,
  onEditSymptom,
}: {
  state: AppState;
  stats: ReturnType<typeof buildStats>;
  cycleInfo: CycleInfo;
  timeline: TimelineItem[];
  onDelete: (type: RecordType, id: string) => void;
  onEditSex: (record: SexRecord) => void;
  onEditPeriod: (record: PeriodRecord) => void;
  onEditSymptom: (record: SymptomRecord) => void;
}) {
  const privacyMode = state.settings.privacyMode;
  const cycleStatus = privacyMode
    ? { pill: '已隐藏', title: '隐私模式已开启', hint: '关闭隐私模式后查看周期状态和趋势。' }
    : getCycleStatus(state, cycleInfo);
  const cycleBadge = privacyMode ? { value: '--', label: '已隐藏' } : getCycleBadge(state, cycleInfo);
  const [filter, setFilter] = useState<'all' | RecordType>('all');
  const [timelineRange, setTimelineRange] = useState<TimelineRange>('week');
  const [customRangeStart, setCustomRangeStart] = useState(toDateKey(addDays(new Date(), -6)));
  const [customRangeEnd, setCustomRangeEnd] = useState(toDateKey(new Date()));
  const [showAll, setShowAll] = useState(false);

  const timelineRangeOptions: Array<{ value: TimelineRange; label: string }> = [
    { value: 'week', label: '一周' },
    { value: 'month', label: '一月' },
    { value: 'halfYear', label: '半年' },
    { value: 'year', label: '一年' },
    { value: 'all', label: '全部' },
    { value: 'custom', label: '自定义' },
  ];
  const rangedTimeline = filterTimelineByRange(timeline, timelineRange, customRangeStart, customRangeEnd);
  const filterOptions: Array<{ value: 'all' | RecordType; label: string; count: number }> = [
    { value: 'all', label: '全部', count: rangedTimeline.length },
    { value: 'sex', label: '亲密', count: rangedTimeline.filter((item) => item.type === 'sex').length },
    { value: 'period', label: '经期', count: rangedTimeline.filter((item) => item.type === 'period').length },
    { value: 'symptom', label: '症状', count: rangedTimeline.filter((item) => item.type === 'symptom').length },
  ];
  const filtered = filter === 'all' ? rangedTimeline : rangedTimeline.filter((item) => item.type === filter);
  const visible = showAll ? filtered : filtered.slice(0, 20);
  return (
    <View>
      <View style={styles.heroCardShell}>
        <View style={styles.heroCard}>
          <LinearGradient colors={colors.heroGradient} style={styles.heroCardGradient} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroPill}>{cycleStatus.pill}</Text>
            <Text style={styles.heroTitle}>{cycleStatus.title}</Text>
            <Text style={styles.heroHint}>{cycleStatus.hint}</Text>
          </View>
          <LinearGradient colors={colors.bubbleGradient} style={styles.cycleBubble}>
            <Text style={styles.cycleDay}>{cycleBadge.value}</Text>
            <Text style={styles.cycleDayLabel}>{cycleBadge.label}</Text>
          </LinearGradient>
        </View>
      </View>

      <View style={styles.quickGrid}>
        <MetricCard label="本月" value={privacyMode ? '--' : String(stats.monthSexCount)} hint={privacyMode ? '已隐藏' : '亲密次数'} />
        <MetricCard label="间隔" value={privacyMode ? '--' : String(stats.averageGap)} hint={privacyMode ? '已隐藏' : '平均天数'} />
        <MetricCard label="周期" value={privacyMode ? '--' : String(cycleInfo?.cycleLength ?? state.settings.cycleDays)} hint={privacyMode ? '已隐藏' : cycleInfo?.confidence === 'high' ? '实测平均' : '预测天数'} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>最近记录</Text>
      </View>

      {privacyMode ? (
        <PrivacyCollapsedRecords count={timeline.length} />
      ) : (
        <>
          {timeline.length > 0 && (
            <View style={styles.filterRail}>
              {timelineRangeOptions.map((option) => {
                const active = timelineRange === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.sheetChip, active && styles.sheetChipActive]}
                    onPress={() => {
                      setTimelineRange(option.value);
                      setShowAll(false);
                    }}
                  >
                    <Text style={[styles.sheetChipText, active && styles.sheetChipTextActive]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {timelineRange === 'custom' && (
            <View style={styles.customRangePanel}>
              <DatePickerField label="开始日期" value={customRangeStart} onChange={setCustomRangeStart} />
              <DatePickerField label="结束日期" value={customRangeEnd} onChange={setCustomRangeEnd} />
            </View>
          )}

          {timeline.length > 0 && (
            <View style={styles.filterRail}>
              {filterOptions.map((option) => {
                const active = filter === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.sheetChip, active && styles.sheetChipActive]}
                    onPress={() => {
                      setFilter(option.value);
                      setShowAll(false);
                    }}
                  >
                    <Text style={[styles.sheetChipText, active && styles.sheetChipTextActive]}>{`${option.label} ${option.count}`}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {rangedTimeline.length ? (
            filtered.length ? (
              <>
                {visible.map((item) => (
                  <RecordCard
                    key={`${item.type}-${item.id}`}
                    item={item}
                    privacy={false}
                    sexRecord={item.type === 'sex' ? state.sexRecords.find((record) => record.id === item.id) : undefined}
                    periodRecord={item.type === 'period' ? state.periodRecords.find((record) => record.id === item.id) : undefined}
                    symptomRecord={item.type === 'symptom' ? state.symptomRecords.find((record) => record.id === item.id) : undefined}
                    onDelete={onDelete}
                    onEditSex={onEditSex}
                    onEditPeriod={onEditPeriod}
                    onEditSymptom={onEditSymptom}
                  />
                ))}
                {filtered.length > visible.length && (
                  <Pressable style={styles.viewAllButton} onPress={() => setShowAll(true)}>
                    <Text style={styles.viewAllText}>查看全部 {filtered.length} 条</Text>
                  </Pressable>
                )}
              </>
            ) : (
              <Text style={styles.empty}>该筛选条件下还没有记录。</Text>
            )
          ) : (
            <Text style={styles.empty}>还没有记录。点右下角 + 开始添加。</Text>
          )}
        </>
      )}
    </View>
  );
}

function HomeSkeleton() {
  return (
    <View style={styles.loadingState}>
      <View style={styles.loadingMark} />
      <View style={styles.loadingLine} />
      <View style={styles.loadingLineShort} />
    </View>
  );
}

function ScreenCaptureGuard({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    const key = 'luna-log-sensitive-content';
    const task = enabled ? preventScreenCaptureAsync(key) : allowScreenCaptureAsync(key);
    task.catch(() => undefined);
    return () => {
      if (enabled) allowScreenCaptureAsync(key).catch(() => undefined);
    };
  }, [enabled]);
  return null;
}

function AppLockScreen({ authenticating, onUnlock }: { authenticating: boolean; onUnlock: () => void }) {
  return (
    <View style={styles.appContainer}>
      <LinearGradient colors={colors.appGradient} style={StyleSheet.absoluteFill} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 18 }}>
        <LinearGradient colors={colors.avatarGradient} style={{ width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center' }}>
          <EyeOff color="#fff" size={34} strokeWidth={2.4} />
        </LinearGradient>
        <Text style={styles.emptyTitle}>Luna Log 已锁定</Text>
        <Text style={[styles.emptyHint, { textAlign: 'center', maxWidth: 280 }]}>验证设备身份后才能查看私密记录。</Text>
        <Pressable style={[styles.primaryButton, { width: '100%', maxWidth: 280 }]} onPress={onUnlock} disabled={authenticating}>
          <LinearGradient colors={colors.avatarGradient} style={styles.primaryButtonGradient}>
            {authenticating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.primaryButtonText}>解锁</Text>}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

function CalendarScreen({
  state,
  visibleMonth,
  cycleInfo,
  selectedDateKey,
  onMonthChange,
  onSelectDate,
  onPatch,
  onAddEntry,
  onEditSex,
  onEditPeriodDay,
}: {
  state: AppState;
  visibleMonth: Date;
  cycleInfo: CycleInfo;
  selectedDateKey: string | null;
  onMonthChange: (date: Date) => void;
  onSelectDate: (date: Date) => void;
  onPatch: (updater: (current: AppState) => AppState) => void;
  onAddEntry: (type: Extract<SheetType, 'partneredSex' | 'soloSex'>) => void;
  onEditSex: (record: SexRecord) => void;
  onEditPeriodDay: (record: PeriodDayRecord | null, dateKey: string) => void;
}) {
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [intimacyPickerOpen, setIntimacyPickerOpen] = useState(false);
  const privacyMode = state.settings.privacyMode;
  const days = buildCalendarDays(visibleMonth);
  const calendarWeeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, index) => days.slice(index * 7, index * 7 + 7));
  const monthTitle = monthLabel(visibleMonth);
  const prediction = privacyMode ? '隐私模式已开启' : cycleInfo ? `下次经期预计 ${shortDate(cycleInfo.nextPeriod)} 开始` : '添加经期开始日后显示预测';
  const selectedDate = selectedDateKey ? parseDateKey(selectedDateKey) : new Date();
  const selectedRelative = relativeDateLabel(selectedDate);
  const selectedStatus = privacyMode
    ? { title: '当天详情已隐藏', detail: '关闭隐私模式后查看周期和记录详情。', Icon: EyeOff, colors: [colors.primary, colors.primaryLight] as const }
    : getDayCycleStatus(selectedDate, state, cycleInfo);
  const SelectedStatusIcon = selectedStatus.Icon;
  const selectedSexRecords = state.sexRecords.filter((record) => toDateKey(new Date(record.dateTime)) === toDateKey(selectedDate));
  const selectedInFuture = startOfDay(selectedDate) > startOfDay(new Date());
  const selectedPeriod = findRecordedPeriodForDate(state, selectedDate);
  const selectedPeriodDay = findPeriodDayForDate(state, selectedDate);
  const editableEndPeriod = findEditablePeriodForEndDate(state, selectedDate);
  const selectedIsPeriodStart = isPeriodStartDate(selectedPeriod, selectedDate);
  const nextAfterEditable = editableEndPeriod ? getNextPeriodRecord(state, editableEndPeriod) : null;
  const canCancelPeriodStart = !selectedInFuture && selectedIsPeriodStart;
  const canMarkPeriodStart = canStartPeriodOnDate(state, selectedDate);
  const selectedIsPeriodEnd = !!editableEndPeriod?.endDate && editableEndPeriod.endDate === toDateKey(selectedDate);
  const canCancelPeriodEnd = !selectedInFuture && selectedIsPeriodEnd;
  const canMarkPeriodEnd = !selectedInFuture && !!editableEndPeriod && parseDateKey(editableEndPeriod.startDate) <= startOfDay(selectedDate) && (!nextAfterEditable || toDateKey(selectedDate) < nextAfterEditable.startDate);
  const canUsePrimaryPeriodAction = canCancelPeriodStart || canMarkPeriodStart;
  const primaryPeriodActionLabel = selectedInFuture
    ? '未来不可标记开始'
    : canCancelPeriodStart
      ? '取消经期开始'
      : selectedPeriod
        ? '已在经期内'
        : canMarkPeriodStart
          ? '标记经期开始'
          : '需先结束上一周期';
  const endPeriodActionLabel = selectedInFuture
    ? '未来不可标记结束'
    : canCancelPeriodEnd
      ? '取消经期结束'
      : editableEndPeriod?.endDate
        ? '修改经期结束'
        : '标记经期结束';

  function markPeriodStart() {
    if (canCancelPeriodStart) {
      cancelSelectedPeriod();
      return;
    }
    if (!canMarkPeriodStart) return;
    const key = toDateKey(selectedDate);
    onPatch((current) => ({
      ...current,
      periodRecords: [
        ...current.periodRecords,
        {
          id: uid('period'),
          startDate: key,
          flow: 'medium',
          painLevel: 0,
          symptoms: [],
        },
      ],
    }));
  }

  function markPeriodEnd() {
    if (!canMarkPeriodEnd || !editableEndPeriod) return;
    const key = toDateKey(selectedDate);
    onPatch((current) => {
      const target = findEditablePeriodForEndDate(current, selectedDate);
      if (!target) return current;
      const next = getNextPeriodRecord(current, target);
      if (next && key >= next.startDate) return current;
      const records = getSortedPeriodRecords(current);
      const index = records.findIndex((record) => record.id === target.id);
      if (index < 0) return current;
      if (target.endDate === key) {
        const { endDate, ...rest } = records[index];
        records[index] = rest;
      } else {
        records[index] = { ...records[index], endDate: key };
      }
      return { ...current, periodRecords: records };
    });
  }

  function cancelSelectedPeriod() {
    if (!selectedPeriod) return;
    const start = parseDateKey(selectedPeriod.startDate);
    const end = getPeriodEndDate(state, selectedPeriod);
    onPatch((current) => ({
      ...current,
      periodRecords: current.periodRecords.filter((record) => record.id !== selectedPeriod.id),
      periodDayRecords: current.periodDayRecords.filter((record) => {
        const date = parseDateKey(record.date);
        return date < startOfDay(start) || date > startOfDay(end);
      }),
    }));
  }

  function deleteSelectedPeriodDay() {
    if (!selectedPeriodDay) return;
    onPatch((current) => ({
      ...current,
      periodDayRecords: current.periodDayRecords.filter((record) => record.id !== selectedPeriodDay.id),
    }));
  }

  function addIntimacyEntry(nextType: Extract<SheetType, 'partneredSex' | 'soloSex'>) {
    setIntimacyPickerOpen(false);
    onAddEntry(nextType);
  }

  return (
    <View>
      <View style={styles.calendarShell}>
        <View style={styles.calendarHeader}>
        <Pressable style={styles.roundButton} onPress={() => onMonthChange(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}>
          <ChevronLeft color={colors.primary} size={21} strokeWidth={2.7} />
        </Pressable>
        <Pressable style={styles.calendarTitleBox} onPress={() => setMonthPickerOpen(true)}>
          <Text style={styles.calendarTitle}>{monthTitle}</Text>
          <Text style={styles.calendarWeekLine}>{prediction}</Text>
          <Text style={styles.calendarDateLine}>{longDate(selectedDate)}</Text>
        </Pressable>
        <Pressable style={styles.roundButton} onPress={() => onMonthChange(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}>
          <ChevronRight color={colors.primary} size={21} strokeWidth={2.7} />
        </Pressable>
        </View>

        <View style={styles.calendarTodayRow}>
          <Pressable style={styles.calendarTodayButton} onPress={() => {
            const now = new Date();
            onMonthChange(new Date(now.getFullYear(), now.getMonth(), 1));
            onSelectDate(now);
          }}>
            <Text style={styles.calendarTodayText}>回到今天</Text>
          </Pressable>
        </View>

        <View style={styles.weekdayGrid}>
          {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
            <Text style={styles.weekday} key={day}>
              {day}
            </Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {calendarWeeks.map((week, weekIndex) => (
            <View style={styles.calendarWeekRow} key={`week-${weekIndex}`}>
              {week.map((date) => (
                <CalendarDay
                  key={date.toISOString()}
                  date={date}
                  visibleMonth={visibleMonth}
                  state={state}
                  cycleInfo={cycleInfo}
                  selected={toDateKey(date) === toDateKey(selectedDate)}
                  onPress={() => onSelectDate(date)}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      <MonthYearPicker
        visible={monthPickerOpen}
        value={visibleMonth}
        onCancel={() => setMonthPickerOpen(false)}
        onConfirm={(next) => {
          onMonthChange(new Date(next.getFullYear(), next.getMonth(), 1));
          setMonthPickerOpen(false);
        }}
      />

      <Modal visible={intimacyPickerOpen} transparent animationType="fade" onRequestClose={() => setIntimacyPickerOpen(false)}>
        <View style={styles.monthYearModalRoot}>
          <Pressable style={styles.monthYearBackdrop} onPress={() => setIntimacyPickerOpen(false)} />
          <View style={styles.intimacyPickerPanel}>
            <Text style={styles.monthYearTitle}>添加亲密记录</Text>
            <Text style={styles.intimacyPickerHint}>{shortDate(selectedDate)} · 选择记录类型</Text>
            <Pressable style={styles.intimacyPickerOption} onPress={() => addIntimacyEntry('partneredSex')}>
              <LinearGradient colors={[colors.sex, colors.primary]} style={styles.intimacyPickerIcon}>
                <HeartHandshake color="#fff" size={19} strokeWidth={2.7} />
              </LinearGradient>
              <View style={styles.intimacyPickerCopy}>
                <Text style={styles.intimacyPickerTitle}>伴侣亲密</Text>
                <Text style={styles.intimacyPickerText}>记录双方互动、时长、心情和备注</Text>
              </View>
              <ChevronRight color={colors.sub} size={18} strokeWidth={2.6} />
            </Pressable>
            <Pressable style={styles.intimacyPickerOption} onPress={() => addIntimacyEntry('soloSex')}>
              <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.intimacyPickerIcon}>
                <Sparkles color="#fff" size={19} strokeWidth={2.7} />
              </LinearGradient>
              <View style={styles.intimacyPickerCopy}>
                <Text style={styles.intimacyPickerTitle}>个人亲密</Text>
                <Text style={styles.intimacyPickerText}>记录独处时刻、时长、心情和备注</Text>
              </View>
              <ChevronRight color={colors.sub} size={18} strokeWidth={2.6} />
            </Pressable>
            <Pressable style={styles.monthYearGhostButton} onPress={() => setIntimacyPickerOpen(false)}>
              <Text style={styles.monthYearGhostText}>取消</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <View style={styles.legendRowBottom}>
        <IconLegend color={colors.sex} Icon={HeartHandshake} label="伴侣亲密" />
        <IconLegend color={colors.primary} Icon={Sparkles} label="个人亲密" />
        <IconLegend color="#ff7043" Icon={Droplet} label="经期" />
        <IconLegend color="#ffd4e4" Icon={Activity} label="易孕" />
      </View>

      <View style={styles.dayStatusCard}>
        <View style={styles.dayStatusHead}>
          <LinearGradient colors={selectedStatus.colors} style={styles.dayStatusIcon}>
            <SelectedStatusIcon color="#fff" size={20} strokeWidth={2.6} />
          </LinearGradient>
          <View style={styles.dayStatusCopy}>
            <View style={styles.calendarSelectedTitle}>
              <Text style={styles.dayStatusTitle} numberOfLines={1}>{shortDate(selectedDate)}</Text>
              <Text
                style={[
                  styles.calendarRelativePill,
                  selectedRelative.tone === 'today' && styles.calendarRelativeToday,
                  selectedRelative.tone === 'past' && styles.calendarRelativePast,
                  selectedRelative.tone === 'future' && styles.calendarRelativeFuture,
                ]}
              >
                {selectedRelative.label}
              </Text>
            </View>
            <Text style={styles.dayStatusText} numberOfLines={2}>{selectedStatus.title} · {selectedStatus.detail}</Text>
          </View>
        </View>
        <View style={styles.calendarDayMetrics}>
          <View style={styles.calendarMetric}>
            <Text style={styles.calendarMetricValue}>{privacyMode ? '--' : selectedSexRecords.length}</Text>
            <Text style={styles.calendarMetricLabel}>亲密</Text>
          </View>
          <View style={styles.calendarMetric}>
            <Text style={styles.calendarMetricValue}>{privacyMode ? '--' : selectedPeriod ? 1 : 0}</Text>
            <Text style={styles.calendarMetricLabel}>经期</Text>
          </View>
          <View style={styles.calendarMetric}>
            <Text style={styles.calendarMetricValue}>{privacyMode ? '--' : selectedStatus.title.includes('排卵') ? 1 : 0}</Text>
            <Text style={styles.calendarMetricLabel}>排卵</Text>
          </View>
        </View>
        {!privacyMode && <View style={styles.dayStatusActions}>
          <Pressable style={[styles.dayStatusButton, !canUsePrimaryPeriodAction && styles.dayStatusButtonDisabled]} onPress={markPeriodStart}>
            <Text style={[styles.dayStatusButtonText, !canUsePrimaryPeriodAction && styles.dayStatusButtonTextDisabled]}>
              {primaryPeriodActionLabel}
            </Text>
          </Pressable>
          <Pressable style={[styles.dayStatusButton, !canMarkPeriodEnd && styles.dayStatusButtonDisabled]} onPress={markPeriodEnd}>
            <Text style={[styles.dayStatusButtonText, !canMarkPeriodEnd && styles.dayStatusButtonTextDisabled]}>
              {endPeriodActionLabel}
            </Text>
          </Pressable>
        </View>}
        {!privacyMode && selectedPeriod && (
          <View style={styles.daySexSection}>
            <Text style={styles.daySexTitle}>当天月经状态</Text>
            {selectedPeriodDay ? (
              <Pressable style={styles.daySexRow} onPress={() => onEditPeriodDay(selectedPeriodDay, toDateKey(selectedDate))}>
                <LinearGradient colors={[colors.period, colors.periodLight]} style={styles.daySexIcon}>
                  <Droplets color="#fff" size={16} strokeWidth={2.6} />
                </LinearGradient>
                <View style={styles.daySexCopy}>
                  <Text style={styles.daySexMain}>{flowLabel(selectedPeriodDay.flow)} · 痛经 {selectedPeriodDay.painLevel || 0}/5</Text>
                  <Text style={styles.daySexMeta}>{[...selectedPeriodDay.symptoms, selectedPeriodDay.notes].filter(Boolean).join(' · ') || '已记录当天状态'}</Text>
                </View>
                <Pencil color={colors.primary} size={15} strokeWidth={2.5} />
              </Pressable>
            ) : (
              <Text style={styles.daySexEmpty}>这一天还没有记录经量、痛经和症状</Text>
            )}
            <View style={styles.daySexQuickActions}>
              <Pressable style={[styles.daySexQuickButton, styles.periodDayButton]} onPress={() => onEditPeriodDay(selectedPeriodDay, toDateKey(selectedDate))}>
                <Droplets color={colors.period} size={15} strokeWidth={2.7} />
                <Text style={styles.periodDayButtonText}>{selectedPeriodDay ? '编辑当天状态' : '记录当天状态'}</Text>
              </Pressable>
              {selectedPeriodDay && (
                <Pressable style={[styles.daySexQuickButton, styles.periodDayDeleteButton]} onPress={deleteSelectedPeriodDay}>
                  <Trash2 color={colors.danger} size={15} strokeWidth={2.7} />
                  <Text style={styles.periodDayDeleteButtonText}>删除当天状态</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
        {privacyMode ? (
          <View style={styles.daySexSection}>
            <Text style={styles.daySexTitle}>当天记录已隐藏</Text>
            <Text style={styles.daySexEmpty}>关闭隐私模式后查看或编辑当天记录。</Text>
            <View style={styles.daySexQuickActions}>
              <Pressable style={[styles.daySexQuickButton, styles.daySexQuickButtonPrimary]} onPress={() => setIntimacyPickerOpen(true)}>
                <HeartHandshake color="#fff" size={15} strokeWidth={2.7} />
                <Text style={[styles.daySexQuickButtonText, styles.daySexQuickButtonTextPrimary]}>添加记录</Text>
              </Pressable>
            </View>
          </View>
        ) : (
        <View style={styles.daySexSection}>
          <Text style={styles.daySexTitle}>当天亲密记录</Text>
          {selectedSexRecords.length ? (
            selectedSexRecords.map((record) => {
              const kind = getSexKindMeta(record);
              const KindIcon = kind.Icon;
              const privateMeta = [record.durationMinutes ? `${record.durationMinutes} 分钟` : '', record.mood ? `心情 ${record.mood}` : '', '点开查看或编辑'].filter(Boolean).join(' · ');
              return (
                <Pressable style={styles.daySexRow} key={record.id} onPress={() => onEditSex(record)}>
                  <LinearGradient colors={kind.colors} style={styles.daySexIcon}>
                    <KindIcon color="#fff" size={16} strokeWidth={2.6} />
                  </LinearGradient>
                  <View style={styles.daySexCopy}>
                    <Text style={styles.daySexMain}>{new Date(record.dateTime).toTimeString().slice(0, 5)} · {kind.label} · {record.count} 次</Text>
                    <Text style={styles.daySexMeta}>{privateMeta}</Text>
                  </View>
                  <Pencil color={colors.primary} size={15} strokeWidth={2.5} />
                </Pressable>
              );
            })
          ) : (
            <Text style={styles.daySexEmpty}>这一天还没有亲密记录</Text>
          )}
          <View style={styles.daySexQuickActions}>
            <Pressable style={[styles.daySexQuickButton, styles.daySexQuickButtonPrimary]} onPress={() => setIntimacyPickerOpen(true)}>
              <HeartHandshake color="#fff" size={15} strokeWidth={2.7} />
              <Text style={[styles.daySexQuickButtonText, styles.daySexQuickButtonTextPrimary]}>添加亲密记录</Text>
            </Pressable>
          </View>
        </View>
        )}
      </View>
    </View>
  );
}

function InsightsScreen({
  state,
  stats,
  cycleInfo,
  range,
  onRangeChange,
}: {
  state: AppState;
  stats: ReturnType<typeof buildStats>;
  cycleInfo: CycleInfo;
  range: 'week' | 'month' | 'year';
  onRangeChange: (range: 'week' | 'month' | 'year') => void;
}) {
  if (state.settings.privacyMode) {
    return (
      <View style={styles.emptyInsights}>
        <EyeOff size={68} color={colors.sub} strokeWidth={1.8} />
        <Text style={styles.emptyTitle}>统计已隐藏</Text>
        <Text style={styles.emptyHint}>关闭隐私模式后查看趋势和周期数据</Text>
      </View>
    );
  }

  const totalRecords = state.sexRecords.length + state.periodRecords.length + state.symptomRecords.length;
  if (totalRecords === 0) return <EmptyInsights />;
  if (state.sexRecords.length < 3) {
    return (
      <View style={styles.panel}>
        <BarChart3 size={44} color={colors.sub} strokeWidth={1.9} />
        <Text style={styles.emptyTitle}>记录还不够</Text>
        <Text style={styles.insightHint}>再记录几次亲密记录后将显示趋势、时长和时间分布</Text>
      </View>
    );
  }  const chart = buildSexChart(state, range);
  const durationStats = buildDurationStats(state, range);
  const timeDistribution = buildTimeDistribution(state, range);
  const distributionTotal = timeDistribution.reduce((sum, item) => sum + item.count, 0);
  const chartMax = getChartMax(chart, range);
  const midTick = Math.round(chartMax / 2);
  const totalCount = chart.reduce((sum, item) => sum + item.count, 0);
  const chartHeight = 160;
  const symptomCounts = buildSymptomCounts(state);
  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>趋势</Text>
      </View>
      <View style={styles.segmentedControl}>
        <RangeButton active={range === 'week'} label="按周查看" onPress={() => onRangeChange('week')} />
        <RangeButton active={range === 'month'} label="按月查看" onPress={() => onRangeChange('month')} />
        <RangeButton active={range === 'year'} label="按年查看" onPress={() => onRangeChange('year')} />
      </View>
      <View style={[styles.panel, styles.sexChartPanel]}>
        <View style={styles.bigMetricRow}>
          <Text style={styles.bigMetric}>{totalCount}</Text>
          <Text style={styles.bigMetricUnit}>次</Text>
        </View>
        <View style={styles.columnChart}>
          <View style={styles.chartAxis}>
            <Text style={styles.chartAxisLabel}>{chartMax}</Text>
            <Text style={styles.chartAxisLabel}>{midTick}</Text>
            <Text style={styles.chartAxisLabel}>0</Text>
          </View>
          <View style={styles.chartPlot}>
            <View style={styles.chartGridArea}>
              <View style={[styles.chartGridLine, styles.chartGridLineTop]} />
              <View style={[styles.chartGridLine, styles.chartGridLineMid]} />
              <View style={[styles.chartGridLine, styles.chartGridLineBase]} />
            </View>
            <View style={[styles.columnRow, range === 'month' && styles.columnRowDense]}>
              {chart.map((item, index) => {
                const barHeight = item.count ? Math.max(8, Math.round((item.count / chartMax) * chartHeight)) : 0;
                return (
                  <View style={styles.columnSlot} key={`${item.label}-${index}`}>
                    <View style={[styles.columnTrack, range === 'week' && styles.columnTrackWeek, range === 'month' && styles.columnTrackMonth]}>
                      <View style={[styles.columnStack, { height: barHeight }]}>
                        {item.soloCount > 0 && <View style={[styles.columnPart, styles.columnPartSolo, { flex: item.soloCount }]} />}
                        {item.partneredCount > 0 && <View style={[styles.columnPart, styles.columnPartPartnered, { flex: item.partneredCount }]} />}
                      </View>
                    </View>
                    <Text style={styles.columnLabel}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
        <View style={styles.chartLegendRow}>
          <IconLegend color={colors.sex} Icon={HeartHandshake} label="伴侣亲密" />
          <IconLegend color={colors.primary} Icon={Sparkles} label="个人亲密" />
        </View>
      </View>
      <Panel title="持续时间">
        <View style={styles.durationHeader}>
          <Text style={styles.durationHeaderLabel}>总时长</Text>
          <Text style={styles.durationHeaderValue}>{formatDuration(durationStats.totalMinutes)}</Text>
        </View>
        <StatLine Icon={Hourglass} label="最长一次" value={formatDuration(durationStats.maxMinutes)} />
        <StatLine Icon={Activity} label="最短一次" value={formatDuration(durationStats.minMinutes)} />
        <StatLine Icon={BarChart3} label="平均" value={formatDuration(durationStats.averageMinutes)} />
      </Panel>
      <Panel title="时间分布">
        <View style={styles.distributionBar}>
          {distributionTotal ? (
            timeDistribution.map((item) => (
              <View key={item.label} style={[styles.distributionSegment, { flex: item.count || 0.001, backgroundColor: item.color }]} />
            ))
          ) : (
            <View style={styles.distributionEmptySegment} />
          )}
        </View>
        <View style={styles.distributionList}>
          {timeDistribution.map((item) => (
            <View style={styles.distributionRow} key={item.label}>
              <View style={[styles.distributionDot, { backgroundColor: item.color }]} />
              <Text style={styles.distributionLabel}>{item.label}</Text>
              <Text style={styles.distributionValue}>{item.count} 条记录</Text>
            </View>
          ))}
        </View>
      </Panel>
      <Panel title="月经周期">
        <View style={styles.summaryGrid}>
          <SummaryTile label="记录次数" value={String(state.periodRecords.length)} />
          <SummaryTile label="平均周期" value={String(stats.averageCycle)} />
          <SummaryTile label="平均经期" value={String(stats.averagePeriod)} />
          <SummaryTile label="下次预测" value={cycleInfo ? shortDate(cycleInfo.nextPeriod) : '--'} />
        </View>
      </Panel>
      <Panel title="症状和情绪">
        <View style={styles.tagCloud}>
          {symptomCounts.length ? (
            symptomCounts.map(([name, count]) => (
              <Text style={styles.tag} key={name}>
                {name} x {count}
              </Text>
            ))
          ) : (
            <Text style={styles.emptyInline}>还没有症状记录</Text>
          )}
        </View>
      </Panel>
    </View>
  );
}


function EmptyInsights() {
  return (
    <View style={styles.emptyInsights}>
      <BarChart3 size={68} color={colors.sub} strokeWidth={1.8} />
      <Text style={styles.emptyTitle}>还没有统计数据</Text>
      <Text style={styles.emptyHint}>点击右下角 + 开始记录</Text>
    </View>
  );
}function SettingsScreen({
  state,
  onPatch,
  onAppLockChange,
  onClear,
  onExportData,
  onImportData,
  recoveryAvailable,
  onExportInvalidData,
  onDiscardInvalidData,
}: {
  state: AppState;
  onPatch: (settings: Partial<AppState['settings']>) => void;
  onAppLockChange: (enabled: boolean) => void;
  onClear: () => void;
  onExportData: () => void;
  onImportData: () => void;
  recoveryAvailable: boolean;
  onExportInvalidData: () => void;
  onDiscardInvalidData: () => void;
}) {
  return (
    <View>
      <View style={styles.profileCard}>
        <LinearGradient colors={colors.avatarGradient} style={styles.profilePhoto}>
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

      <View style={styles.settingRow}>
        <View style={styles.settingCopy}>
          <Text style={styles.settingTitle}>隐私模式</Text>
          <Text style={styles.settingHint}>隐藏首页、日历和统计中的敏感内容</Text>
        </View>
        <Switch value={state.settings.privacyMode} onValueChange={(privacyMode) => onPatch({ privacyMode })} />
      </View>
      <View style={styles.settingRow}>
        <View style={styles.settingCopy}>
          <Text style={styles.settingTitle}>应用锁</Text>
          <Text style={styles.settingHint}>返回应用时要求生物识别或设备凭据</Text>
        </View>
        <Switch value={state.settings.appLockEnabled} onValueChange={onAppLockChange} />
      </View>
      <View style={styles.settingRow}>
        <View style={styles.settingCopy}>
          <Text style={styles.settingTitle}>截图保护</Text>
          <Text style={styles.settingHint}>Android 上阻止截图、录屏和最近任务缩略图</Text>
        </View>
        <Switch value={state.settings.screenCaptureProtection} onValueChange={(screenCaptureProtection) => onPatch({ screenCaptureProtection })} />
      </View>
      <View style={styles.themePanel}>
        <View style={styles.settingCopy}>
          <Text style={styles.settingTitle}>视觉风格</Text>
          <Text style={styles.settingHint}>原版、薄荷和参考深海冷光图片的蓝色主题</Text>
        </View>
        <View style={styles.themeOptionGrid}>
          {themeOptions.map((option) => {
            const theme = themePalettes[option.value];
            const active = (state.settings.themeStyle || 'classic') === option.value;
            return (
              <Pressable
                key={option.value}
                style={[styles.themeOption, active && styles.themeOptionActive]}
                onPress={() => onPatch({ themeStyle: option.value })}
              >
                <LinearGradient colors={theme.avatarGradient} style={styles.themeSwatch} />
                <View style={styles.themeOptionCopy}>
                  <Text style={[styles.themeOptionTitle, active && styles.themeOptionTitleActive]}>{option.label}</Text>
                  <Text style={styles.themeOptionHint}>{option.hint}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
      <NumberSetting label="周期长度" hint="经期记录不足 3 次时的默认预测值" value={state.settings.cycleDays} min={15} max={60} onChange={(cycleDays) => onPatch({ cycleDays })} />
      <NumberSetting label="经期天数" hint="用于日历经期标记" value={state.settings.periodDays} min={2} max={10} onChange={(periodDays) => onPatch({ periodDays })} />

      <View style={styles.themePanel}>
        <View style={styles.settingCopy}>
          <Text style={styles.settingTitle}>数据管理</Text>
          <Text style={styles.settingHint}>导出 JSON 备份，或从备份恢复本地记录</Text>
        </View>
        <Pressable style={styles.settingRowCompact} onPress={onExportData}>
          <Download color={colors.primary} size={19} strokeWidth={2.6} />
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>导出数据</Text>
            <Text style={styles.settingHint}>备份到文件</Text>
          </View>
        </Pressable>
        <Pressable style={styles.settingRowCompact} onPress={onImportData}>
          <Upload color={colors.primary} size={19} strokeWidth={2.6} />
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>导入数据</Text>
            <Text style={styles.settingHint}>从备份恢复并覆盖当前本地数据</Text>
          </View>
        </Pressable>
      </View>
      {recoveryAvailable && (
        <View style={styles.themePanel}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>受损数据恢复</Text>
            <Text style={styles.settingHint}>已停止自动写入，避免覆盖无法读取的本地数据</Text>
          </View>
          <Pressable style={styles.settingRowCompact} onPress={onExportInvalidData}>
            <Download color={colors.primary} size={19} strokeWidth={2.6} />
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>导出原始恢复数据</Text>
              <Text style={styles.settingHint}>保留当前文件以便后续修复</Text>
            </View>
          </Pressable>
          <Pressable style={styles.settingRowCompact} onPress={onDiscardInvalidData}>
            <Trash2 color={colors.danger} size={19} strokeWidth={2.6} />
            <View style={styles.settingCopy}>
              <Text style={styles.dangerRowTitle}>丢弃并重新开始</Text>
              <Text style={styles.settingHint}>删除受损本地数据</Text>
            </View>
          </Pressable>
        </View>
      )}
      <Pressable style={styles.dangerRow} onPress={onClear}>
        <View style={styles.settingCopy}>
          <Text style={styles.dangerRowTitle}>重置所有数据</Text>
          <Text style={styles.settingHint}>清空全部记录，含首次启动的演示数据</Text>
        </View>
        <Trash2 color={colors.danger} size={18} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

function AboutScreen({
  visible,
  updateInfo,
  diagnostics,
  checking,
  onClose,
  onCheckUpdate,
  onOpenUrl,
}: {
  visible: boolean;
  updateInfo: AppUpdateInfo | null;
  diagnostics: UpdateSourceDiagnostic[];
  checking: boolean;
  onClose: () => void;
  onCheckUpdate: () => void;
  onOpenUrl: (url?: string) => void;
}) {
  if (!visible) return null;

  const latestRelease = RELEASE_NOTES[0];
  const statusLabel = checking
    ? '正在检查'
    : updateInfo?.status === 'available'
      ? `发现 ${updateInfo.latestVersion}`
      : updateInfo?.status === 'latest'
        ? '当前最新'
        : updateInfo?.status === 'failed'
          ? '检查失败'
          : '尚未检查';
  const statusStyle =
    updateInfo?.status === 'available'
      ? styles.updateStatusAvailable
      : updateInfo?.status === 'failed'
        ? styles.updateStatusFailed
        : styles.updateStatusLatest;
  const releaseUrl = updateInfo?.releaseUrl || UPDATE_REPOSITORY_URL;

  return (
    <View style={styles.aboutOverlay}>
      <LinearGradient colors={colors.appGradient} style={StyleSheet.absoluteFill} />
      <View style={styles.aboutHeader}>
        <View style={styles.aboutHeaderCopy}>
          <Text style={styles.dateLabel}>关于 Luna Log</Text>
          <Text style={styles.aboutTitle}>版本和更新</Text>
        </View>
        <Pressable style={styles.sheetClose} onPress={onClose}>
          <X color={colors.text} size={20} strokeWidth={2.7} />
        </Pressable>
      </View>

      <ScrollView style={styles.aboutScroll} contentContainerStyle={styles.aboutBody} showsVerticalScrollIndicator={false}>
        <View style={styles.aboutHeroCard}>
          <LinearGradient colors={colors.avatarGradient} style={styles.aboutAppIcon}>
            <Moon color="#fff" size={30} strokeWidth={2.5} />
          </LinearGradient>
          <View style={styles.aboutHeroCopy}>
            <Text style={styles.profileTitle}>Luna Log</Text>
            <Text style={styles.profileDesc}>本地优先的私密生活记录 Demo</Text>
            <View style={styles.tagCloud}>
              <Text style={styles.tag}>v{APP_VERSION}</Text>
              <Text style={styles.tag}>Expo SDK 57</Text>
              <Text style={styles.tag}>Android / iOS</Text>
            </View>
          </View>
        </View>

        <View style={styles.updateCard}>
          <View style={styles.updateCardHeader}>
            <View style={styles.updateTitleRow}>
              <View style={styles.updateIconBubble}>
                <RefreshCw color={colors.primary} size={19} strokeWidth={2.7} />
              </View>
              <View style={styles.settingCopy}>
                <Text style={styles.settingTitle}>检查更新</Text>
                <Text style={styles.settingHint}>从 GitHub 官方 Release 检查版本和发布说明</Text>
              </View>
            </View>
            <Text style={[styles.updateStatusPill, statusStyle]}>{statusLabel}</Text>
          </View>

          <View style={styles.updateMetaGrid}>
            <UpdateMeta label="当前版本" value={`v${APP_VERSION}`} />
            <UpdateMeta label="最新版本" value={updateInfo ? `v${updateInfo.latestVersion}` : '--'} />
            <UpdateMeta label="发布日期" value={formatUpdateDate(updateInfo?.releaseDate)} />
            <UpdateMeta label="安装包" value={formatFileSize(updateInfo?.apkSize || updateInfo?.fileSize)} />
          </View>

          {updateInfo && (
            <View style={styles.updateDetailBox}>
              <Text style={styles.updateDetailTitle}>{updateInfo.title}</Text>
              <Text style={styles.updateDetailMeta}>
                {updateInfo.sourceName ? `${updateInfo.sourceName} · ` : ''}
                {formatCheckedAt(updateInfo.checkedAt)}
              </Text>
              {updateInfo.status === 'available' && <Text style={styles.updateDetailMeta}>请通过官方发布页下载并安装更新。</Text>}
              {updateInfo.notes.map((note) => (
                <View key={note} style={styles.releaseBulletRow}>
                  <View style={styles.releaseBulletDot} />
                  <Text style={styles.releaseBulletText}>{note}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.updateActionRow}>
            <Pressable style={[styles.updateActionButton, styles.updateActionPrimary]} onPress={onCheckUpdate} disabled={checking}>
              {checking ? <ActivityIndicator color="#fff" size="small" /> : <RefreshCw color="#fff" size={17} strokeWidth={2.7} />}
              <Text style={styles.updateActionPrimaryText}>{checking ? '检查中' : '检查'}</Text>
            </Pressable>
            <Pressable style={styles.updateActionButton} onPress={() => onOpenUrl(releaseUrl)}>
              <ExternalLink color={colors.primary} size={17} strokeWidth={2.7} />
              <Text style={styles.updateActionText}>{updateInfo?.status === 'available' ? '打开发布页' : '项目主页'}</Text>
            </Pressable>
          </View>          {diagnostics.length > 0 && (
            <View style={styles.updateDiagnostics}>
              <Text style={styles.updateDiagnosticsTitle}>来源诊断</Text>
              {diagnostics.map((item) => (
                <View key={`${item.sourceName}-${item.durationMs}`} style={styles.updateDiagnosticRow}>
                  <View style={[styles.updateDiagnosticDot, item.status === 'success' ? styles.updateDiagnosticDotOk : styles.updateDiagnosticDotBad]} />
                  <View style={styles.settingCopy}>
                    <Text style={styles.updateDiagnosticName}>
                      {item.sourceName}
                      {item.version ? ` · v${item.version}` : ''}
                    </Text>
                    <Text style={styles.updateDiagnosticMessage}>
                      {item.message} · {item.durationMs}ms
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.releaseCard}>
          <View style={styles.updateTitleRow}>
            <View style={styles.updateIconBubble}>
              <Sparkles color={colors.primary} size={19} strokeWidth={2.7} />
            </View>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>版本说明</Text>
              <Text style={styles.settingHint}>{latestRelease.date} · {latestRelease.title}</Text>
            </View>
          </View>
          {latestRelease.highlights.map((item) => (
            <View key={item} style={styles.releaseBulletRow}>
              <View style={styles.releaseBulletDot} />
              <Text style={styles.releaseBulletText}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function UpdateMeta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.updateMetaItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.updateMetaValue}>{value}</Text>
    </View>
  );
}

function normalizeProtectionSelection(record?: Pick<SexRecord, 'protectionMethods' | 'protection'> | null) {
  const first = record?.protectionMethods?.[0] || record?.protection || '';
  return first ? [first] : [];
}

function EntrySheet({
  state,
  type,
  initialDateKey,
  editingSexRecord,
  editingPeriodRecord,
  editingPeriodDayRecord,
  editingSymptomRecord,
  onClose,
  onSaveSex,
  onSavePeriod,
  onSavePeriodDay,
  onSaveSymptom,
}: {
  state: AppState;
  type: SheetType | null;
  initialDateKey?: string | null;
  editingSexRecord?: SexRecord | null;
  editingPeriodRecord?: PeriodRecord | null;
  editingPeriodDayRecord?: PeriodDayRecord | null;
  editingSymptomRecord?: SymptomRecord | null;
  onClose: () => void;
  onSaveSex: (record: SexRecord) => void;
  onSavePeriod: (record: PeriodRecord) => void;
  onSavePeriodDay: (record: PeriodDayRecord) => void;
  onSaveSymptom: (record: SymptomRecord) => void;
}) {
  const [date, setDate] = useState(toDateKey(new Date()));
  const [time, setTime] = useState('12:00');
  const [count, setCount] = useState('1');
  const [duration, setDuration] = useState('');
  const [partnerAlias, setPartnerAlias] = useState('');
  const [sexTypes, setSexTypes] = useState<string[]>(['亲密接触']);
  const [protectionMethods, setProtectionMethods] = useState<string[]>(['避孕套']);
  const [place, setPlace] = useState('');
  const [mood, setMood] = useState('');
  const [satisfaction, setSatisfaction] = useState('4');
  const [arousal, setArousal] = useState(false);
  const [partnerArousal, setPartnerArousal] = useState(false);
  const [orgasm, setOrgasm] = useState(false);
  const [toyUsed, setToyUsed] = useState(false);
  const [lingerie, setLingerie] = useState(false);
  const [watchedAdultMovie, setWatchedAdultMovie] = useState(false);
  const [syncedWithPartner, setSyncedWithPartner] = useState(false);
  const [ejaculationPlace, setEjaculationPlace] = useState('');
  const [initiator, setInitiator] = useState<'self' | 'partner'>('self');
  const [positions, setPositions] = useState<string[]>([]);
  const [soloTools, setSoloTools] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [flow, setFlow] = useState('medium');
  const [pain, setPain] = useState('0');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [prefillUsed, setPrefillUsed] = useState(false);

  useEffect(() => {
    if (!type) return;
    setPrefillUsed(false);
    if (isSexSheet(type) && editingSexRecord) {
      const value = new Date(editingSexRecord.dateTime);
      setDate(toDateKey(value));
      setTime(value.toTimeString().slice(0, 5));
      setCount(String(editingSexRecord.count || 1));
      setDuration(editingSexRecord.durationMinutes ? String(editingSexRecord.durationMinutes) : '');
      setPartnerAlias(editingSexRecord.partnerAlias || '');
      setSexTypes(editingSexRecord.sexTypes?.length ? editingSexRecord.sexTypes : editingSexRecord.sexType ? [editingSexRecord.sexType] : []);
      setProtectionMethods(normalizeProtectionSelection(editingSexRecord));
      setPlace(editingSexRecord.place || '');
      setMood(editingSexRecord.mood || '');
      setSatisfaction(editingSexRecord.satisfaction ? String(editingSexRecord.satisfaction) : '');
      setArousal(Boolean(editingSexRecord.arousal));
      setPartnerArousal(Boolean(editingSexRecord.partnerArousal));
      setOrgasm(Boolean(editingSexRecord.orgasm));
      setToyUsed(Boolean(editingSexRecord.toyUsed));
      setLingerie(Boolean(editingSexRecord.lingerie));
      setWatchedAdultMovie(Boolean(editingSexRecord.watchedAdultMovie));
      setSyncedWithPartner(Boolean(editingSexRecord.syncedWithPartner));
      setEjaculationPlace(editingSexRecord.ejaculationPlace || '');
      setInitiator(editingSexRecord.initiator || 'self');
      setPositions(editingSexRecord.positions || []);
      setSoloTools(editingSexRecord.soloTools || []);
      setNotes(editingSexRecord.notes || '');
      return;
    }

    if (type === 'period' && editingPeriodRecord) {
      setDate(editingPeriodRecord.startDate);
      setPeriodEnd(editingPeriodRecord.endDate || '');
      setFlow(editingPeriodRecord.flow || 'medium');
      setPain(String(editingPeriodRecord.painLevel || 0));
      setSymptoms(editingPeriodRecord.symptoms || []);
      setNotes(editingPeriodRecord.notes || '');
      return;
    }

    if (type === 'periodDay' && editingPeriodDayRecord) {
      setDate(editingPeriodDayRecord.date);
      setFlow(editingPeriodDayRecord.flow || 'medium');
      setPain(String(editingPeriodDayRecord.painLevel || 0));
      setSymptoms(editingPeriodDayRecord.symptoms || []);
      setNotes(editingPeriodDayRecord.notes || '');
      return;
    }

    if (type === 'symptom' && editingSymptomRecord) {
      setDate(editingSymptomRecord.date);
      setPain(String(editingSymptomRecord.intensity || 1));
      setSymptoms(editingSymptomRecord.symptoms || []);
      setNotes(editingSymptomRecord.notes || '');
      return;
    }

    setDate(initialDateKey || toDateKey(new Date()));
    setTime('12:00');
    setCount('1');
    setDuration('');
    setPartnerAlias('');
    setSexTypes(type === 'soloSex' ? ['自慰'] : type === 'partneredSex' ? ['阴道性交'] : []);
    setProtectionMethods(type === 'partneredSex' ? ['避孕套'] : []);
    setPlace('');
    setMood('');
    setSatisfaction(isSexSheet(type) ? '4' : '');
    setArousal(false);
    setPartnerArousal(false);
    setOrgasm(false);
    setToyUsed(false);
    setLingerie(false);
    setWatchedAdultMovie(false);
    setSyncedWithPartner(false);
    setEjaculationPlace('');
    setInitiator('self');
    setPositions([]);
    setSoloTools(type === 'soloSex' ? ['Hand Job'] : []);
    setNotes('');
    setPeriodEnd('');
    setFlow('medium');
    setPain('0');
    setSymptoms([]);

    const latestSexRecord = isSexSheet(type)
      ? state.sexRecords
          .filter((record) => sexSheetTypeForRecord(record) === type)
          .sort((left, right) => new Date(right.dateTime).getTime() - new Date(left.dateTime).getTime())[0]
      : null;

    if (type === 'partneredSex' && latestSexRecord) {
      setMood(latestSexRecord.mood || '');
      setPositions(latestSexRecord.positions || []);
      setProtectionMethods(normalizeProtectionSelection(latestSexRecord));
      setPrefillUsed(Boolean(latestSexRecord.mood || latestSexRecord.positions?.length || normalizeProtectionSelection(latestSexRecord).length));
    } else if (type === 'soloSex' && latestSexRecord) {
      setMood(latestSexRecord.mood || '');
      setSoloTools(latestSexRecord.soloTools?.length ? latestSexRecord.soloTools : ['Hand Job']);
      setPrefillUsed(Boolean(latestSexRecord.mood || latestSexRecord.soloTools?.length));
    } else if (type === 'period') {
      const latestPeriod = [...state.periodRecords].sort((left, right) => right.startDate.localeCompare(left.startDate))[0];
      if (latestPeriod) {
        setSymptoms(latestPeriod.symptoms || []);
        setPrefillUsed(Boolean(latestPeriod.symptoms?.length));
      }
    } else if (type === 'periodDay') {
      const latestPeriodDay = [...state.periodDayRecords].sort((left, right) => right.date.localeCompare(left.date))[0];
      if (latestPeriodDay) {
        setSymptoms(latestPeriodDay.symptoms || []);
        setFlow(latestPeriodDay.flow || 'medium');
        setPrefillUsed(Boolean(latestPeriodDay.symptoms?.length || latestPeriodDay.flow));
      }
    } else if (type === 'symptom') {
      const latestSymptom = [...state.symptomRecords].sort((left, right) => right.date.localeCompare(left.date))[0];
      if (latestSymptom) {
        setSymptoms(latestSymptom.symptoms || []);
        setPrefillUsed(Boolean(latestSymptom.symptoms?.length));
      }
    }
  }, [type, initialDateKey, editingSexRecord, editingPeriodRecord, editingPeriodDayRecord, editingSymptomRecord, state.sexRecords, state.periodRecords, state.periodDayRecords, state.symptomRecords]);

  function toggleSymptom(value: string) {
    setSymptoms((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  function toggleSexType(value: string) {
    setSexTypes((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  function toggleProtection(value: string) {
    setProtectionMethods([value]);
  }

  function togglePosition(value: string) {
    setPositions((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  function toggleSoloTool(value: string) {
    setSoloTools((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  function save() {
    if (!date || !type) return;
    if (!isValidDateKey(date)) {
      Alert.alert('日期无效', '请选择有效日期后再保存。');
      return;
    }
    const todayKey = toDateKey(new Date());
    if ((type === 'period' || type === 'periodDay' || type === 'symptom') && date > todayKey) {
      Alert.alert('日期无效', '经期和症状记录不能使用未来日期。');
      return;
    }
    if (type === 'period' && periodEnd) {
      if (!isValidDateKey(periodEnd) || periodEnd < date || periodEnd > todayKey) {
        Alert.alert('结束日期无效', '结束日期应在开始日期之后，且不能晚于今天。');
        return;
      }
    }
    const durationMinutes = duration ? Number(duration) : undefined;
    if (durationMinutes !== undefined && (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440)) {
      Alert.alert('持续时间无效', '持续时间需为 1 到 1440 分钟之间的整数。');
      return;
    }
    if (isSexSheet(type)) {
      const normalizedSexTypes = type === 'soloSex' ? ['自慰', ...soloTools.filter((item) => item !== 'Hand Job')] : sexTypes;
      onSaveSex({
        id: editingSexRecord?.id || uid('sex'),
        dateTime: new Date(`${date}T${time || '12:00'}:00`).toISOString(),
        count: Math.max(1, Math.min(99, Number(count) || 1)),
        durationMinutes,
        partnerAlias: partnerAlias.trim(),
        protectionMethods: protectionMethods.slice(0, 1),
        sexTypes: normalizedSexTypes,
        place: place.trim(),
        mood: mood.trim(),
        satisfaction: satisfaction ? Number(satisfaction) : undefined,
        arousal,
        partnerArousal,
        orgasm,
        toyUsed,
        lingerie,
        watchedAdultMovie,
        syncedWithPartner,
        ejaculationPlace,
        initiator,
        positions,
        soloTools,
        notes: notes.trim(),
      });
    }
    if (type === 'period') {
      onSavePeriod({
        id: editingPeriodRecord?.id || uid('period'),
        startDate: date,
        endDate: periodEnd || undefined,
        flow,
        painLevel: Number(pain) || 0,
        symptoms,
        notes: notes.trim(),
      });
    }
    if (type === 'periodDay') {
      onSavePeriodDay({
        id: editingPeriodDayRecord?.id || uid('period-day'),
        date,
        flow,
        painLevel: Number(pain) || 0,
        symptoms,
        notes: notes.trim(),
      });
    }
    if (type === 'symptom') {
      onSaveSymptom({
        id: editingSymptomRecord?.id || uid('symptom'),
        date,
        intensity: Number(pain) || 1,
        symptoms,
        notes: notes.trim(),
      });
    }
    onClose();
  }

  const sexMode = isSexSheet(type) ? type : null;
  const typeMeta = type ? getSheetMeta(type) : recordMeta.sex;
  const sheetShort = sexMode ? '亲密生活' : type === 'periodDay' ? '月经状态' : type === 'period' || type === 'symptom' ? recordMeta[type].short : recordMeta.sex.short;
  const editingRecord = Boolean(editingSexRecord || editingPeriodRecord || editingPeriodDayRecord || editingSymptomRecord);
  const symptomOptions = type === 'period' || type === 'periodDay' ? ['腹痛', '腰痛', '头痛', '疲劳', '乳房胀痛'] : ['分泌物变化', '腹胀', '疲劳', '失眠', '情绪波动'];

  return (
    <Modal visible={Boolean(type)} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.sheetPanel}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.dateLabel}>{sheetShort}</Text>
            <Text style={styles.sheetTitle}>{editingRecord ? `编辑${typeMeta.label}` : `${typeMeta.label}记录`}</Text>
          </View>
          <Pressable style={styles.sheetClose} onPress={onClose}>
            <X color={colors.sub} size={21} strokeWidth={2.6} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.formGrid}>
            {prefillUsed && <Text style={styles.prefillHint}>已自动填入上次的选择，可修改</Text>}
            <DatePickerField label={type === 'period' ? '开始日期' : '日期'} value={date} onChange={setDate} />
            {sexMode && <TimePickerField label="时间" value={time} onChange={setTime} />}
            {sexMode && <DurationField label="持续时间" value={duration} onChange={setDuration} />}
            {sexMode && <TextField label="次数" value={count} onChangeText={setCount} keyboardType="number-pad" placeholder="记录本次发生了几次" />}
            {sexMode === 'partneredSex' && <TextField label="伴侣" value={partnerAlias} onChangeText={setPartnerAlias} placeholder="选择你的伴侣" />}
            {sexMode && <TextField label="地点" value={place} onChangeText={setPlace} placeholder="选择本次亲密时刻的地点" />}
            {sexMode === 'partneredSex' && (
              <OptionSection label="高潮信息">
                <SwitchOption label="高潮" hint="滑动开关来选择是否高潮" value={arousal} onChange={setArousal} Icon={Sparkles} />
                <SwitchOption label="伴侣高潮" hint="滑动开关来选择伴侣是否高潮" value={partnerArousal} onChange={setPartnerArousal} Icon={HeartHandshake} />
                <SwitchOption label="潮吹" hint="滑动开关来选择是否潮吹" value={orgasm} onChange={setOrgasm} Icon={Droplets} />
                <OptionSection label="射精位置">
                  <ChipSelect options={['体内', '体外', '口腔', '其他', '未记录']} value={ejaculationPlace} onChange={setEjaculationPlace} />
                </OptionSection>
                <SwitchOption label="道具" hint="滑动开关来选择是否使用道具" value={toyUsed} onChange={setToyUsed} Icon={Sparkles} />
              </OptionSection>
            )}
            {sexMode === 'partneredSex' && (
              <OptionSection label="保护措施">
                <IconChoiceGrid
                  options={[
                    { label: '无保护措施', icon: 'noProtect' },
                    { label: '安全套', icon: 'condom' },
                    { label: '药物', icon: 'pill' },
                  ]}
                  selected={protectionMethods}
                  onToggle={toggleProtection}
                />
              </OptionSection>
            )}
            {sexMode === 'partneredSex' && (
              <OptionSection label="姿势">
                <MiniChoiceRail options={['侧躺', '后入', '骑乘', '跪姿', '拥抱', '俯卧']} selected={positions} onToggle={togglePosition} />
              </OptionSection>
            )}
            {sexMode === 'partneredSex' && (
              <OptionSection label="谁发起的">
                <SegmentPicker
                  value={initiator}
                  options={[
                    { value: 'self', label: '你自己' },
                    { value: 'partner', label: '伴侣' },
                  ]}
                  onChange={(value) => setInitiator(value as 'self' | 'partner')}
                />
              </OptionSection>
            )}
            {sexMode === 'partneredSex' && <SwitchOption label="情趣内衣" hint="滑动开关来选择是否穿戴了情趣内衣" value={lingerie} onChange={setLingerie} Icon={Sparkles} />}
            {sexMode === 'soloSex' && (
              <OptionSection label="道具">
                <IconChoiceGrid
                  options={[
                    { label: 'Hand Job', icon: 'hand' },
                    { label: '飞机杯', icon: 'cup' },
                    { label: '女用玩具', icon: 'wand' },
                  ]}
                  selected={soloTools}
                  onToggle={toggleSoloTool}
                />
              </OptionSection>
            )}
            {sexMode === 'soloSex' && <SwitchOption label="观看成人电影" hint="滑动开关来选择是否观看" value={watchedAdultMovie} onChange={setWatchedAdultMovie} Icon={Eye} />}
            {sexMode === 'soloSex' && <SwitchOption label="高潮" hint="滑动开关来选择是否高潮" value={arousal} onChange={setArousal} Icon={Sparkles} />}
            {sexMode && (
              <OptionSection label="评分">
                <RatingPicker value={Number(satisfaction) || 0} onChange={(next) => setSatisfaction(String(next))} />
              </OptionSection>
            )}
            {sexMode && (
              <OptionSection label="心情">
                <MoodPicker value={mood} onChange={setMood} />
              </OptionSection>
            )}
            {sexMode && <SwitchOption label="同步" hint="滑动开关来选择是否同步到伴侣记录" value={syncedWithPartner} onChange={setSyncedWithPartner} Icon={HeartHandshake} />}
            {type === 'period' && <DatePickerField label="结束日期" value={periodEnd || date} onChange={setPeriodEnd} />}
            {(type === 'period' || type === 'periodDay') && (
              <View style={styles.sheetChipGroup}>
                {[
                  ['light', '少'],
                  ['medium', '中'],
                  ['heavy', '多'],
                ].map(([value, label]) => (
                  <Pressable key={value} style={[styles.sheetChip, flow === value && styles.sheetChipActive]} onPress={() => setFlow(value)}>
                    <Text style={[styles.sheetChipText, flow === value && styles.sheetChipTextActive]}>流量{label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {!sexMode && (
              <OptionSection label={type === 'period' || type === 'periodDay' ? '痛经程度' : '强度'}>
                <ScalePicker value={Number(pain) || 0} onChange={(next) => setPain(String(next))} />
              </OptionSection>
            )}
            {!sexMode && (
              <View style={styles.sheetChipGroup}>
                {symptomOptions.map((item) => (
                  <Pressable key={item} style={[styles.sheetChip, symptoms.includes(item) && styles.sheetChipActive]} onPress={() => toggleSymptom(item)}>
                    <Text style={[styles.sheetChipText, symptoms.includes(item) && styles.sheetChipTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            <TextField label="备注" value={notes} onChangeText={setNotes} multiline placeholder="只保存在本地" />
            <Pressable style={styles.primaryButton} onPress={save}>
              <LinearGradient colors={colors.avatarGradient} style={styles.primaryButtonGradient}>
                <Text style={styles.primaryButtonText}>{editingRecord ? '保存修改' : '保存记录'}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function PrivacyCollapsedRecords({ count }: { count: number }) {
  return (
    <View style={styles.privacyCollapsedCard}>
      <LinearGradient colors={colors.bubbleGradient} style={styles.privacyCollapsedIcon}>
        <EyeOff color="#fff" size={20} strokeWidth={2.7} />
      </LinearGradient>
      <View style={styles.privacyCollapsedCopy}>
        <Text style={styles.privacyCollapsedTitle}>最近记录已折叠</Text>
        <Text style={styles.privacyCollapsedText}>{count ? `已保存 ${count} 条记录，点击右上角眼睛按钮查看。` : '开启隐私模式后，首页不会展示具体记录。'}</Text>
      </View>
    </View>
  );
}

function getRecordSummary(item: TimelineItem, sexRecord?: SexRecord, periodRecord?: PeriodRecord, symptomRecord?: SymptomRecord) {
  if (item.type === 'sex') {
    const solo = sexRecord ? isSoloSexRecord(sexRecord) : false;
    const tags = [dateTimeLabel(sexRecord?.dateTime || item.date.toISOString())];
    if (sexRecord?.durationMinutes) tags.push(`${sexRecord.durationMinutes} 分钟`);
    if (sexRecord?.protectionMethods?.length || sexRecord?.protection) tags.push('有保护');
    if (sexRecord?.soloTools?.length || sexRecord?.toyUsed) tags.push('使用道具');
    if (sexRecord?.mood) tags.push('已记录心情');
    if (sexRecord?.satisfaction) tags.push('已评分');
    return {
      title: solo ? '独处时刻' : '亲密时刻',
      meta: tags.slice(0, 3).join(' · '),
      detail: tags.length > 3 ? '已记录更多细节' : '',
    };
  }

  if (item.type === 'period') {
    const tags = [periodRecord?.endDate ? `${periodRecord.startDate} - ${periodRecord.endDate}` : dateTimeLabel(item.date.toISOString())];
    if (periodRecord?.flow) tags.push('已记录流量');
    if (periodRecord?.painLevel) tags.push(`不适 ${periodRecord.painLevel}/5`);
    if (periodRecord?.symptoms?.length) tags.push('有症状记录');
    return { title: periodRecord?.endDate ? '经期记录' : '经期开始', meta: tags.slice(0, 3).join(' · '), detail: tags.length > 3 ? '已记录更多细节' : '' };
  }

  const tags = [dateTimeLabel(item.date.toISOString())];
  if (symptomRecord?.intensity) tags.push(`强度 ${symptomRecord.intensity}/5`);
  if (symptomRecord?.symptoms?.length) tags.push('有状态记录');
  return { title: '身体状态', meta: tags.join(' · '), detail: '' };
}
function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricHint}>{hint}</Text>
    </View>
  );
}

function RecordCard({
  item,
  privacy,
  sexRecord,
  periodRecord,
  symptomRecord,
  onDelete,
  onEditSex,
  onEditPeriod,
  onEditSymptom,
}: {
  item: TimelineItem;
  privacy: boolean;
  sexRecord?: SexRecord;
  periodRecord?: PeriodRecord;
  symptomRecord?: SymptomRecord;
  onDelete: (type: RecordType, id: string) => void;
  onEditSex: (record: SexRecord) => void;
  onEditPeriod: (record: PeriodRecord) => void;
  onEditSymptom: (record: SymptomRecord) => void;
}) {
  const meta = recordMeta[item.type];
  const sexKind = item.type === 'sex' ? getSexKindMeta(sexRecord) : null;
  const Icon = sexKind?.Icon || meta.Icon;
  const iconColors = sexKind?.colors || meta.colors;
  const canEdit = Boolean(sexRecord || periodRecord || symptomRecord);
  const summary = getRecordSummary(item, sexRecord, periodRecord, symptomRecord);

  function edit() {
    if (sexRecord) onEditSex(sexRecord);
    if (periodRecord) onEditPeriod(periodRecord);
    if (symptomRecord) onEditSymptom(symptomRecord);
  }

  return (
    <Pressable style={styles.recordCard} onPress={() => canEdit && edit()}>
      <LinearGradient colors={iconColors} style={styles.recordIcon}>
        <Icon color="#fff" size={22} strokeWidth={2.6} />
      </LinearGradient>
      <View style={styles.recordCopy}>
        <Text style={styles.recordTitle}>{summary.title}</Text>
        <Text style={styles.recordMeta}>{summary.meta}</Text>
        {!!summary.detail && <Text style={styles.recordDetailPill}>{summary.detail}</Text>}
      </View>
      {canEdit && (
        <Pressable style={styles.editButton} onPress={edit}>
          <Pencil color={colors.primary} size={16} strokeWidth={2.5} />
        </Pressable>
      )}
      <Pressable style={styles.deleteButton} onPress={() => onDelete(item.type, item.id)}>
        <Trash2 color={colors.danger} size={16} strokeWidth={2.5} />
      </Pressable>
    </Pressable>
  );
}

function NavItem({ active, label, Icon, onPress }: { active: boolean; label: string; Icon: LucideIcon; onPress: () => void }) {
  return (
    <Pressable style={styles.navItem} onPress={onPress}>
      <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
        <Icon color={active ? colors.primary : colors.sub} size={19} strokeWidth={active ? 2.8 : 2.3} />
      </View>
      <Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text>
      <View style={[styles.navDot, active && styles.navDotActive]} />
    </Pressable>
  );
}

function getSheetMeta(type: SheetType) {
  if (type === 'partneredSex') return { label: '伴侣亲密', Icon: HeartHandshake, colors: [colors.sex, colors.primary] as const };
  if (type === 'soloSex') return { label: '个人亲密', Icon: Sparkles, colors: [colors.primary, colors.secondary] as const };
  if (type === 'periodDay') return { label: '当天月经状态', Icon: Droplets, colors: [colors.period, colors.periodLight] as const };
  return recordMeta[type];
}

function getPrivateSheetLabel(type: SheetType) {
  if (type === 'partneredSex') return '伴侣亲密';
  if (type === 'soloSex') return '个人亲密';
  if (type === 'period') return '周期';
  if (type === 'symptom') return '状态';
  return '记录';
}
function FabMenuItem({ primary, type, desc, privacy, onPress }: { primary?: boolean; type: SheetType; desc: string; privacy?: boolean; onPress: () => void }) {
  const meta = getSheetMeta(type);
  const Icon = meta.Icon;
  const label = privacy ? getPrivateSheetLabel(type) : isSexSheet(type) ? meta.label : `${meta.label}记录`;
  return (
    <Pressable style={[styles.fabMenuItem, primary && styles.fabMenuItemPrimary]} onPress={onPress}>
      <LinearGradient colors={primary ? meta.colors : [colors.soft, 'rgba(255,255,255,0.68)']} style={styles.fabMenuIcon}>
        <Icon color={primary ? '#fff' : colors.primary} size={18} strokeWidth={2.6} />
      </LinearGradient>
      <View style={styles.fabMenuCopy}>
        <Text style={styles.fabMenuLabel}>{label}</Text>
        <Text style={styles.fabMenuDesc}>{desc}</Text>
      </View>
    </Pressable>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendPill}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function IconLegend({ color, label, Icon }: { color: string; label: string; Icon: LucideIcon }) {
  return (
    <View style={styles.legendPill}>
      <View style={[styles.legendIconBubble, { backgroundColor: color }]}>
        <Icon color="#fff" size={12} strokeWidth={2.7} />
      </View>
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function CalendarDay({
  date,
  visibleMonth,
  state,
  cycleInfo,
  selected,
  onPress,
}: {
  date: Date;
  visibleMonth: Date;
  state: AppState;
  cycleInfo: CycleInfo;
  selected: boolean;
  onPress: () => void;
}) {
  const key = toDateKey(date);
  const privacyMode = state.settings.privacyMode;
  const markers = privacyMode ? [] : getMarkersForDay(date, state, cycleInfo);
  const tone = privacyMode ? null : getCalendarTone(date, state, cycleInfo);
  const lunar = lunarDayLabel(date);
  const isToday = key === toDateKey(new Date());
  const outside = date.getMonth() !== visibleMonth.getMonth();
  const eventMarker = markers[0];
  return (
    <Pressable
      style={[
        styles.calendarDay,
        tone === 'period' && styles.calendarDayPeriod,
        tone === 'predictedPeriod' && styles.calendarDayPredictedPeriod,
        tone === 'fertile' && styles.calendarDayFertile,
        outside && styles.calendarDayOutside,
        isToday && styles.calendarDayToday,
        selected && styles.calendarDaySelected,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.calendarDayNumber, tone === 'period' && styles.calendarDayNumberOnTone]}>{date.getDate()}</Text>
      <Text style={[styles.calendarDayLunar, tone && styles.calendarDayLunarOnTone]} numberOfLines={1}>{privacyMode ? '' : lunar}</Text>
      <View style={styles.calendarDayMarkerSlot}>
        {eventMarker && <View style={[styles.calendarDayMarkerDot, markerStyle(eventMarker)]} />}
      </View>
    </Pressable>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      {children}
    </View>
  );
}

function RangeButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.segmentButton, active && styles.segmentButtonActive]} onPress={onPress}>
      <Text style={[styles.segmentButtonText, active && styles.segmentButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

function StatLine({ Icon, label, value }: { Icon: LucideIcon; label: string; value: string }) {
  return (
    <View style={styles.statLine}>
      <View style={styles.statLineIcon}>
        <Icon color={colors.primary} size={20} strokeWidth={2.6} />
      </View>
      <Text style={styles.statLineLabel}>{label}</Text>
      <Text style={styles.statLineValue}>{value}</Text>
    </View>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function NumberSetting({ label, hint, value, min, max, onChange }: { label: string; hint: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
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
      />
    </View>
  );
}

function MonthYearPicker({ visible, value, onCancel, onConfirm }: { visible: boolean; value: Date; onCancel: () => void; onConfirm: (value: Date) => void }) {
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 13 }, (_, index) => currentYear - 10 + index), [currentYear]);
  const months = useMemo(() => Array.from({ length: 12 }, (_, index) => index), []);
  const [draftYear, setDraftYear] = useState(value.getFullYear());
  const [draftMonth, setDraftMonth] = useState(value.getMonth());
  const yearScrollRef = useRef<ScrollView | null>(null);
  const monthScrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (!visible) return;
    const nextYear = value.getFullYear();
    const nextMonth = value.getMonth();
    setDraftYear(nextYear);
    setDraftMonth(nextMonth);
    requestAnimationFrame(() => {
      const yearIndex = Math.max(0, years.indexOf(nextYear));
      yearScrollRef.current?.scrollTo({ y: Math.max(0, yearIndex * 52 - 95), animated: false });
      monthScrollRef.current?.scrollTo({ y: Math.max(0, nextMonth * 52 - 95), animated: false });
    });
  }, [visible, value, years]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.monthYearModalRoot}>
        <Pressable style={styles.monthYearBackdrop} onPress={onCancel} />
        <View style={styles.monthYearPanel}>
          <Text style={styles.monthYearTitle}>选择年月</Text>
          <View style={styles.monthYearColumns}>
            <ScrollView ref={yearScrollRef} style={styles.monthYearColumn} showsVerticalScrollIndicator={false}>
              {years.map((year) => {
                const active = year === draftYear;
                return (
                  <Pressable key={year} style={[styles.monthYearOption, active && styles.monthYearOptionActive]} onPress={() => setDraftYear(year)}>
                    <Text style={[styles.monthYearOptionText, active && styles.monthYearOptionTextActive]}>{year}年</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <ScrollView ref={monthScrollRef} style={styles.monthYearColumn} showsVerticalScrollIndicator={false}>
              {months.map((month) => {
                const active = month === draftMonth;
                return (
                  <Pressable key={month} style={[styles.monthYearOption, active && styles.monthYearOptionActive]} onPress={() => setDraftMonth(month)}>
                    <Text style={[styles.monthYearOptionText, active && styles.monthYearOptionTextActive]}>{month + 1}月</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
          <View style={styles.monthYearActions}>
            <Pressable style={styles.monthYearGhostButton} onPress={onCancel}>
              <Text style={styles.monthYearGhostText}>取消</Text>
            </Pressable>
            <Pressable style={styles.monthYearConfirmButton} onPress={() => onConfirm(new Date(draftYear, draftMonth, 1))}>
              <Text style={styles.monthYearConfirmText}>确定</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
function DatePickerField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const selectedKey = value || toDateKey(new Date());
  const selected = parseDateKey(selectedKey);
  const relative = relativeDateLabel(selected);
  const [open, setOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [draftKey, setDraftKey] = useState(selectedKey);
  const [cursor, setCursor] = useState(new Date(selected.getFullYear(), selected.getMonth(), 1));
  const days = useMemo(() => buildCalendarDays(cursor), [cursor]);

  useEffect(() => {
    const nextKey = value || toDateKey(new Date());
    const next = parseDateKey(nextKey);
    setDraftKey(nextKey);
    setCursor(new Date(next.getFullYear(), next.getMonth(), 1));
  }, [value]);

  function openPicker() {
    setDraftKey(selectedKey);
    setCursor(new Date(selected.getFullYear(), selected.getMonth(), 1));
    setOpen(true);
  }

  function commitDate(nextKey: string) {
    setDraftKey(nextKey);
    onChange(nextKey);
    setOpen(false);
  }

  function commitToday() {
    const nextKey = toDateKey(new Date());
    const next = parseDateKey(nextKey);
    setCursor(new Date(next.getFullYear(), next.getMonth(), 1));
    commitDate(nextKey);
  }

  return (
    <View style={styles.datePickerField}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Pressable style={styles.datePickerTrigger} onPress={openPicker}>
        <View style={styles.datePickerTriggerIcon}>
          <CalendarDays color={colors.primary} size={19} strokeWidth={2.6} />
        </View>
        <View style={styles.datePickerTriggerCopy}>
          <Text style={styles.datePickerTriggerDate}>{longDate(selected)}</Text>
          <Text style={styles.datePickerTriggerMeta}>{relative.label} · 点击选择日期</Text>
        </View>
        <ChevronRight color={colors.sub} size={18} strokeWidth={2.7} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.datePickerModalRoot}>
          <Pressable style={styles.datePickerBackdrop} onPress={() => setOpen(false)} />
          <View style={styles.datePickerPanel}>
            <View style={styles.datePickerHeader}>
              <Pressable style={styles.datePickerNav} onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
                <ChevronLeft color={colors.primary} size={18} strokeWidth={2.7} />
              </Pressable>
              <Pressable style={styles.datePickerTitleBox} onPress={() => setMonthPickerOpen(true)}>
                <Text style={styles.datePickerTitle}>{monthLabel(cursor)}</Text>
                <Text style={styles.datePickerSelected}>{longDate(parseDateKey(draftKey))}</Text>
              </Pressable>
              <Pressable style={styles.datePickerNav} onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
                <ChevronRight color={colors.primary} size={18} strokeWidth={2.7} />
              </Pressable>
            </View>
            <View style={styles.datePickerWeek}>
              {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
                <Text style={styles.datePickerWeekday} key={day}>{day}</Text>
              ))}
            </View>
            <View style={styles.datePickerGrid}>
              {days.map((date) => {
                const key = toDateKey(date);
                const active = key === draftKey;
                const outside = date.getMonth() !== cursor.getMonth();
                const isToday = key === toDateKey(new Date());
                return (
                  <Pressable
                    key={key}
                    style={[styles.datePickerDay, outside && styles.datePickerDayMuted, isToday && styles.datePickerDayToday, active && styles.datePickerDayActive]}
                    onPress={() => commitDate(key)}
                  >
                    <Text style={[styles.datePickerDayText, active && styles.datePickerDayTextActive]}>{date.getDate()}</Text>
                  </Pressable>
                );
              })}
            </View>
            <MonthYearPicker
              visible={monthPickerOpen}
              value={cursor}
              onCancel={() => setMonthPickerOpen(false)}
              onConfirm={(next) => {
                setCursor(new Date(next.getFullYear(), next.getMonth(), 1));
                setMonthPickerOpen(false);
              }}
            />

            <View style={styles.datePickerActions}>
              <Pressable style={styles.datePickerGhostButton} onPress={() => setOpen(false)}>
                <Text style={styles.datePickerGhostText}>取消</Text>
              </Pressable>
              <Pressable style={styles.datePickerTodayButton} onPress={commitToday}>
                <Text style={styles.datePickerTodayText}>回到今天</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function OptionSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.optionSection}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.optionCard}>{children}</View>
    </View>
  );
}

function SwitchOption({ label, hint, value, onChange, Icon }: { label: string; hint: string; value: boolean; onChange: (value: boolean) => void; Icon: LucideIcon }) {
  return (
    <View style={styles.switchOption}>
      <View style={styles.switchCopy}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Text style={styles.switchHint}>{hint}</Text>
      </View>
      <Pressable style={[styles.prettySwitch, value && styles.prettySwitchActive]} onPress={() => onChange(!value)}>
        <View style={[styles.prettySwitchThumb, value && styles.prettySwitchThumbActive]}>
          <Icon color={value ? colors.primary : colors.sub} size={15} strokeWidth={2.6} />
        </View>
      </Pressable>
    </View>
  );
}

function SelectOption({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable style={styles.selectOption} onPress={onPress}>
      <View>
        <Text style={styles.switchLabel}>{label}</Text>
        <Text style={styles.switchHint}>{value}</Text>
      </View>
      <ChevronRight color={colors.sub} size={18} strokeWidth={2.6} />
    </Pressable>
  );
}


const choiceImageMap: Partial<Record<IconName, number>> = {
  noProtect: require('./assets/protection/no-protect.png'),
  condom: require('./assets/protection/condom.png'),
  pill: require('./assets/protection/pill.png'),
  cup: require('./assets/toys/cup.png'),
  wand: require('./assets/toys/wand.png'),
};

function IconChoiceGrid({
  options,
  selected,
  onToggle,
}: {
  options: Array<{ label: string; icon: IconName }>;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <View style={styles.iconChoiceGrid}>
      {options.map((option) => {
        const active = selected.includes(option.label);
        const imageSource = choiceImageMap[option.icon];
        const isProtectionIcon = option.icon === 'noProtect' || option.icon === 'condom' || option.icon === 'pill';
        return (
          <Pressable key={option.label} style={styles.iconChoiceItem} onPress={() => onToggle(option.label)}>
            <View style={[styles.aphroditeIconBubble, isProtectionIcon && styles.aphroditeIconBubbleImageOnly, active && styles.aphroditeIconBubbleActive, active && isProtectionIcon && styles.aphroditeIconBubbleImageOnlyActive]}>
              {imageSource ? (
                <Image
                  source={imageSource}
                  style={[
                    styles.choiceIconImage,
                    (option.icon === 'noProtect' || option.icon === 'condom' || option.icon === 'pill') && styles.choiceIconImageProtection,
                    option.icon === 'cup' && styles.choiceIconImageCup,
                    option.icon === 'wand' && styles.choiceIconImageWand,
                  ]}
                  resizeMode="contain"
                />
              ) : (
                <CartoonIcon name={option.icon} active={active} size={42} />
              )}
            </View>
            <Text style={[styles.iconChoiceLabel, active && styles.iconChoiceLabelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const positionIconMap: Record<string, IconName> = {
  侧躺: 'sideLying',
  后入: 'rear',
  骑乘: 'cowgirl',
  跪姿: 'kneel',
  拥抱: 'embrace',
  俯卧: 'prone',
};

const positionImageMap: Record<string, number> = {
  侧躺: require('./assets/positions/side-lying.png'),
  后入: require('./assets/positions/rear.png'),
  骑乘: require('./assets/positions/cowgirl.png'),
  跪姿: require('./assets/positions/kneel.png'),
  拥抱: require('./assets/positions/embrace.png'),
  俯卧: require('./assets/positions/prone.png'),
};

function MiniChoiceRail({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.miniChoiceRail}>
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <Pressable key={option} style={[styles.miniChoice, active && styles.miniChoiceActive]} onPress={() => onToggle(option)}>
            <View style={[styles.positionIconBubble, active && styles.positionIconBubbleActive]}>
              <Image source={positionImageMap[option]} style={styles.positionIconImage} resizeMode="contain" />
            </View>
            <Text style={[styles.miniChoiceText, active && styles.miniChoiceTextActive]}>{option}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function SegmentPicker({ value, options, onChange }: { value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return (
    <View style={styles.sheetSegment}>
      {options.map((option) => {
        const active = value === option.value;
        return (
          <Pressable key={option.value} style={[styles.sheetSegmentButton, active && styles.sheetSegmentButtonActive]} onPress={() => onChange(option.value)}>
            <Text style={[styles.sheetSegmentText, active && styles.sheetSegmentTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function RatingPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <View style={styles.ratingPicker}>
      {[1, 3, 5].map((score) => (
        <Pressable key={score} style={[styles.ratingButton, value === score && styles.ratingButtonActive]} onPress={() => onChange(score)}>
          <Text style={styles.ratingStars}>{'★'.repeat(Math.ceil(score / 2))}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function MoodPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const options: Array<{ label: string; name: IconName; color: string }> = [
    { label: '难受', name: 'moodBad', color: '#ffb9bd' },
    { label: '一般', name: 'moodMeh', color: '#ffeaa7' },
    { label: '平静', name: 'moodCalm', color: '#a9c7fb' },
    { label: '开心', name: 'moodHappy', color: '#8fe0dd' },
    { label: '愉悦', name: 'moodJoy', color: '#d0b6ff' },
  ];
  return (
    <View style={styles.moodPicker}>
      {options.map((option) => {
        const active = value === option.label;
        return (
          <Pressable key={option.label} style={styles.moodButton} onPress={() => onChange(option.label)}>
            <View style={[styles.moodFace, active && styles.moodFaceActive]}>
              <CartoonIcon name={option.name} color={option.color} size={44} />
            </View>
            <Text style={[styles.moodLabel, active && styles.moodLabelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type IconName =
  | 'hand'
  | 'cup'
  | 'wand'
  | 'noProtect'
  | 'condom'
  | 'pill'
  | 'sideLying'
  | 'rear'
  | 'cowgirl'
  | 'kneel'
  | 'embrace'
  | 'standing'
  | 'prone'
  | 'moodBad'
  | 'moodMeh'
  | 'moodCalm'
  | 'moodHappy'
  | 'moodJoy';

function AphroLine({ d, stroke, width = 2.35, opacity = 1 }: { d: string; stroke: string; width?: number; opacity?: number }) {
  return <Path d={d} stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} fill="none" />;
}

function AphroHead({ cx, cy, fill, r = 2.25 }: { cx: number; cy: number; fill: string; r?: number }) {
  return <Circle cx={cx} cy={cy} r={r} fill={fill} />;
}

function AphroBase({ stroke }: { stroke: string }) {
  return <Path d="M7 25.2 H25" stroke={stroke} strokeWidth={2.1} strokeLinecap="round" opacity={0.16} fill="none" />;
}

function CartoonIcon({ name, size = 27, active = false, color }: { name: IconName; size?: number; active?: boolean; color?: string }) {
  const main = active ? colors.primary : '#806fa8';
  const soft = active ? colors.primaryLight : '#f3d9e8';
  const ink = '#4a4368';
  const accent = active ? colors.sex : '#f08eaa';

  const svg = (children: ReactNode) => (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      {children}
    </Svg>
  );

  switch (name) {
    case 'hand': {
      const handFill = active ? colors.primaryLight : '#ffd2de';
      const handStroke = active ? colors.primary : '#9a6f8f';
      const palmFill = active ? colors.primary : '#f08eaa';
      return svg(
        <>
          <Path d="M10.4 14.7 V8.8 C10.4 7.7 11.2 6.9 12.2 6.9 C13.2 6.9 14 7.7 14 8.8 V13.9" fill={handFill} />
          <Path d="M14 13.8 V7.4 C14 6.3 14.8 5.5 15.8 5.5 C16.9 5.5 17.7 6.3 17.7 7.4 V13.7" fill={handFill} />
          <Path d="M17.7 13.8 V8.1 C17.7 7.1 18.5 6.3 19.5 6.3 C20.5 6.3 21.3 7.1 21.3 8.1 V14.4" fill={handFill} />
          <Path d="M21.3 15.1 V10.6 C21.3 9.7 22 9 22.9 9 C23.8 9 24.5 9.7 24.5 10.6 V18.5 C24.5 23.5 21.2 26.8 16.6 26.8 H15.1 C11.1 26.8 8.2 24.2 7.2 20.6 L6.4 17.6 C6.1 16.5 6.8 15.5 7.9 15.3 C8.8 15.1 9.5 15.6 10 16.4 L11.1 18.1 V14.7 Z" fill={palmFill} />
          <Path d="M10.4 14.7 V8.8 C10.4 7.7 11.2 6.9 12.2 6.9 C13.2 6.9 14 7.7 14 8.8 V13.9 M14 13.8 V7.4 C14 6.3 14.8 5.5 15.8 5.5 C16.9 5.5 17.7 6.3 17.7 7.4 V13.7 M17.7 13.8 V8.1 C17.7 7.1 18.5 6.3 19.5 6.3 C20.5 6.3 21.3 7.1 21.3 8.1 V14.4 M21.3 15.1 V10.6 C21.3 9.7 22 9 22.9 9 C23.8 9 24.5 9.7 24.5 10.6 V18.5 C24.5 23.5 21.2 26.8 16.6 26.8 H15.1 C11.1 26.8 8.2 24.2 7.2 20.6 L6.4 17.6 C6.1 16.5 6.8 15.5 7.9 15.3 C8.8 15.1 9.5 15.6 10 16.4 L11.1 18.1" stroke={handStroke} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Path d="M13.9 15.1 V19.2 M17.5 15 V19.2 M21.1 15.8 V19.1" stroke="#fff" strokeWidth={1.2} strokeLinecap="round" opacity={0.62} />
          <Path d="M10.8 21.8 C13.4 23.4 18.7 23.7 21.7 21.3" stroke="#fff" strokeWidth={1.25} strokeLinecap="round" opacity={0.42} />
        </>
      );
    }
    case 'cup':
      return svg(
        <>
          <Rect x={10} y={8} width={12} height={18} rx={3} fill={soft} />
          <Ellipse cx={16} cy={8} rx={6} ry={2.6} fill={main} />
          <Ellipse cx={16} cy={8} rx={3.2} ry={1.3} fill={soft} />
          <Rect x={12.6} y={12} width={2.2} height={9} rx={1.1} fill="rgba(255,255,255,0.55)" />
        </>
      );
    case 'wand':
      return svg(
        <>
          <Rect x={13.8} y={12} width={4.4} height={15} rx={2.2} fill={main} />
          <Circle cx={16} cy={9} r={6} fill={soft} />
          <Circle cx={16} cy={9} r={2.6} fill={main} />
        </>
      );
    case 'noProtect':
      return svg(
        <>
          <Path d="M7.2 21.6 C12.8 24.6 21.4 20.9 25.6 11.3 C23.3 20.8 14.5 28.5 6.2 24.8 C4.8 24.2 5.8 20.8 7.2 21.6 Z" fill="#ffd84d" />
          <Path d="M8 21.9 C13.8 24.1 20.4 20.6 23.7 13.2" stroke="#f7a516" strokeWidth={2.1} strokeLinecap="round" fill="none" />
          <Path d="M5.7 23.4 C6.8 23.2 7.9 23.8 8.3 24.9 C7.1 25.5 5.7 25 5.2 24 Z" fill="#7c4a19" />
          <Path d="M24.6 10.3 C25.9 9.8 27 10.1 27.7 11.1 C26.9 12.1 25.7 12.6 24.7 12.1 Z" fill="#68b75d" />
          <Circle cx={18.6} cy={19.6} r={1.4} fill={accent} opacity={0.85} />
        </>
      );
    case 'condom':
      return svg(
        <>
          <Path d="M7.1 22 C12.6 24.8 20.9 21.4 25 12.4 C22.9 21.4 14.3 28.3 6.4 24.7 C5 24.1 5.7 21.3 7.1 22 Z" fill="#ffd84d" />
          <Path d="M15.8 21.8 C20.1 19.8 23.1 16.4 25.3 11.8" stroke="#f7a516" strokeWidth={2} strokeLinecap="round" fill="none" />
          <Path d="M20.4 16.3 C22.5 14.1 23.7 12.1 24.5 9.7 C26.5 10.2 27.5 11.5 27.4 13.2 C26.4 15.2 24.7 17.4 22.4 19.2 Z" fill="#8ed8ff" />
          <Path d="M20.4 16.3 C22.6 16.4 24.6 17.5 25.6 19.1" stroke="#0f77d8" strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.9} />
          <Path d="M5.7 23.5 C6.8 23.2 7.9 23.8 8.3 24.9 C7.1 25.5 5.7 25 5.2 24 Z" fill="#7c4a19" />
        </>
      );
    case 'pill':
      return svg(
        <>
          <Rect x={6.4} y={7} width={19.2} height={18.5} rx={5.2} fill="#fff" stroke={main} strokeWidth={2.3} />
          <Line x1={16} y1={8.9} x2={16} y2={23.6} stroke={main} strokeWidth={1.5} strokeLinecap="round" opacity={0.45} />
          <Circle cx={11.2} cy={12.3} r={2.15} fill={accent} />
          <Circle cx={20.8} cy={12.3} r={2.15} fill={accent} />
          <Circle cx={11.2} cy={20.1} r={2.15} fill={main} />
          <Circle cx={20.8} cy={20.1} r={2.15} fill={main} />
          <G transform="translate(16 16.2) rotate(-35)">
            <Rect x={-5.3} y={-2.35} width={10.6} height={4.7} rx={2.35} fill="#ff8fb1" />
            <Path d="M0 -2.1 V2.1" stroke="#fff" strokeWidth={1.25} strokeLinecap="round" />
          </G>
        </>
      );    case 'sideLying':
      return svg(
        <>
          <AphroBase stroke={main} />
          <AphroHead cx={9.2} cy={19.9} fill={main} />
          <AphroLine d="M11.7 20.5 C15.2 17.7 21.3 18.1 24.5 21" stroke={main} width={3.15} />
          <AphroLine d="M12 23.1 C16.1 24.2 20.9 24 25.1 22.7" stroke={main} width={2.35} opacity={0.82} />
          <AphroHead cx={23.3} cy={17.4} fill={accent} />
          <AphroLine d="M21.2 18.9 C17.9 18 14.7 18.8 12.1 21.4" stroke={accent} width={2.45} />
        </>
      );
    case 'prone':
      return svg(
        <>
          <AphroBase stroke={main} />
          <AphroHead cx={8.5} cy={20.2} fill={main} />
          <AphroLine d="M11 21.1 C15.2 19.5 21.4 19.7 25 21.4" stroke={main} width={3.2} />
          <AphroLine d="M13.5 23.6 H25" stroke={main} width={2.35} opacity={0.82} />
          <AphroHead cx={21.8} cy={14.9} fill={accent} />
          <AphroLine d="M20.2 17.1 C17.4 16.4 14.8 17.2 12.6 19.8" stroke={accent} width={2.55} />
          <AphroLine d="M18.1 20.4 L23.2 23" stroke={accent} width={2.15} opacity={0.8} />
        </>
      );
    case 'rear':
      return svg(
        <>
          <AphroBase stroke={main} />
          <AphroHead cx={9.4} cy={17.1} fill={main} />
          <AphroLine d="M11.5 18.5 C14.2 18.4 16.7 20.2 18.2 23" stroke={main} width={3.05} />
          <AphroLine d="M12.4 23.2 H20" stroke={main} width={2.35} />
          <AphroHead cx={22.5} cy={12.8} fill={accent} />
          <AphroLine d="M21.1 15.2 C19.1 17.5 18.7 20 19.6 22.8" stroke={accent} width={2.65} />
          <AphroLine d="M18.4 17.9 L14.8 20" stroke={accent} width={2.05} opacity={0.84} />
        </>
      );
    case 'cowgirl':
      return svg(
        <>
          <AphroBase stroke={main} />
          <AphroHead cx={8.7} cy={21.1} fill={main} />
          <AphroLine d="M11.2 22.1 C15.5 20.4 20.4 20.7 24.7 22.8" stroke={main} width={3.15} />
          <AphroHead cx={16.1} cy={9.5} fill={accent} />
          <AphroLine d="M16.1 12 C15.6 15.2 16 18.1 17.2 20.5" stroke={accent} width={2.85} />
          <AphroLine d="M13.5 16.7 C15.6 18.2 18.5 18.2 21 16.7" stroke={accent} width={2.1} />
          <AphroLine d="M14.3 21 L10.7 24 M18.1 21 L22.6 24" stroke={accent} width={2.05} />
        </>
      );
    case 'kneel':
      return svg(
        <>
          <AphroBase stroke={main} />
          <AphroHead cx={10.2} cy={12.8} fill={main} />
          <AphroLine d="M11.2 15.3 C12.7 18 13.6 20.2 13.2 22.9" stroke={main} width={2.75} />
          <AphroLine d="M10.1 22.6 C12.2 24.3 14.8 24.3 16.8 22.9" stroke={main} width={2.15} />
          <AphroHead cx={21.8} cy={12.8} fill={accent} />
          <AphroLine d="M20.8 15.3 C19.3 18 18.4 20.2 18.8 22.9" stroke={accent} width={2.75} />
          <AphroLine d="M21.9 22.6 C19.8 24.3 17.2 24.3 15.2 22.9" stroke={accent} width={2.15} />
          <AphroLine d="M13.6 16.5 C15.3 18 16.7 18 18.4 16.5" stroke={main} width={1.9} opacity={0.72} />
        </>
      );
    case 'embrace':
      return svg(
        <>
          <AphroHead cx={12.2} cy={10.8} fill={main} />
          <AphroHead cx={19.8} cy={10.8} fill={accent} />
          <AphroLine d="M12.9 13.9 C12.8 17.6 13.5 21 15.2 24.2" stroke={main} width={2.75} />
          <AphroLine d="M19.1 13.9 C19.2 17.6 18.5 21 16.8 24.2" stroke={accent} width={2.75} />
          <AphroLine d="M10.2 15.4 C13.2 18.5 18.8 18.5 21.8 15.4" stroke={main} width={2.05} />
          <AphroLine d="M21.8 15.7 C18.6 20.2 13.4 20.2 10.2 15.7" stroke={accent} width={1.95} opacity={0.9} />
          <Path d="M16 13.5 C14.6 11.9 12.3 12.8 12.6 14.9 C12.9 17.1 16 18.6 16 18.6 C16 18.6 19.1 17.1 19.4 14.9 C19.7 12.8 17.4 11.9 16 13.5 Z" fill={soft} opacity={0.78} />
        </>
      );
    case 'standing':
      return svg(
        <>
          <AphroHead cx={11.7} cy={10} fill={main} />
          <AphroHead cx={20.3} cy={10} fill={accent} />
          <AphroLine d="M12.1 13 C12.1 16.9 12.9 20.8 14 25" stroke={main} width={2.75} />
          <AphroLine d="M19.9 13 C19.9 16.9 19.1 20.8 18 25" stroke={accent} width={2.75} />
          <AphroLine d="M13.9 16.2 C15.2 17.7 16.8 17.7 18.1 16.2" stroke={main} width={2.05} />
          <AphroLine d="M14 24.8 L11.8 27.4 M18 24.8 L20.2 27.4" stroke={main} width={1.95} opacity={0.72} />
        </>
      );
    default: {
      // 心情脸
      const face = color || soft;
      const eye = (cx: number) => <Circle cx={cx} cy={14} r={1.6} fill={ink} />;
      let features: ReactNode = null;
      if (name === 'moodBad') {
        features = (
          <>
            <Line x1={9.6} y1={13} x2={13} y2={14.4} stroke={ink} strokeWidth={1.6} strokeLinecap="round" />
            <Line x1={22.4} y1={13} x2={19} y2={14.4} stroke={ink} strokeWidth={1.6} strokeLinecap="round" />
            <Path d="M11 22 Q16 18 21 22" stroke={ink} strokeWidth={1.8} fill="none" strokeLinecap="round" />
          </>
        );
      } else if (name === 'moodMeh') {
        features = (
          <>
            {eye(11.5)}
            {eye(20.5)}
            <Line x1={11.5} y1={21} x2={20.5} y2={21} stroke={ink} strokeWidth={1.8} strokeLinecap="round" />
          </>
        );
      } else if (name === 'moodCalm') {
        features = (
          <>
            {eye(11.5)}
            {eye(20.5)}
            <Path d="M12 20 Q16 22.5 20 20" stroke={ink} strokeWidth={1.8} fill="none" strokeLinecap="round" />
          </>
        );
      } else if (name === 'moodHappy') {
        features = (
          <>
            {eye(11.5)}
            {eye(20.5)}
            <Path d="M11 19.5 Q16 25 21 19.5" stroke={ink} strokeWidth={1.9} fill="none" strokeLinecap="round" />
          </>
        );
      } else {
        // moodJoy
        features = (
          <>
            <Path d="M9.5 14.5 Q11.5 12 13.5 14.5" stroke={ink} strokeWidth={1.7} fill="none" strokeLinecap="round" />
            <Path d="M18.5 14.5 Q20.5 12 22.5 14.5" stroke={ink} strokeWidth={1.7} fill="none" strokeLinecap="round" />
            <Path d="M10 18.5 Q16 27 22 18.5" stroke={ink} strokeWidth={2} fill="none" strokeLinecap="round" />
          </>
        );
      }
      return svg(
        <>
          <Circle cx={16} cy={16} r={12} fill={face} />
          {features}
        </>
      );
    }
  }
}

function TimePickerField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const safe = /^\d{1,2}:\d{2}$/.test(value) ? value : '12:00';
  const [h, m] = safe.split(':');
  const [draftHour, setDraftHour] = useState(h.padStart(2, '0'));
  const [draftMinute, setDraftMinute] = useState(m);
  const hourRef = useRef<ScrollView>(null);
  const minuteRef = useRef<ScrollView>(null);

  useEffect(() => {
    const ok = /^\d{1,2}:\d{2}$/.test(value) ? value : '12:00';
    const [hh, mm] = ok.split(':');
    setDraftHour(hh.padStart(2, '0'));
    setDraftMinute(mm);
  }, [value]);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  useEffect(() => {
    if (!open) return;
    const rowHeight = 44; // timeOption height 40 + marginBottom 4
    const centerOffset = 64; // keep selected value near vertical center of the 172px column
    const hIndex = hours.indexOf(draftHour);
    const mIndex = minutes.indexOf(draftMinute);
    const timer = setTimeout(() => {
      hourRef.current?.scrollTo({ y: Math.max(0, hIndex * rowHeight - centerOffset), animated: false });
      minuteRef.current?.scrollTo({ y: Math.max(0, mIndex * rowHeight - centerOffset), animated: false });
    }, 40);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function commit() {
    onChange(`${draftHour}:${draftMinute}`);
    setOpen(false);
  }
  function setNow() {
    const now = new Date();
    onChange(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    setOpen(false);
  }

  return (
    <View style={styles.datePickerField}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Pressable style={styles.datePickerTrigger} onPress={() => setOpen(true)}>
        <View style={styles.datePickerTriggerIcon}>
          <Clock color={colors.primary} size={19} strokeWidth={2.6} />
        </View>
        <View style={styles.datePickerTriggerCopy}>
          <Text style={styles.datePickerTriggerDate}>{safe}</Text>
          <Text style={styles.datePickerTriggerMeta}>点击选择时间</Text>
        </View>
        <ChevronRight color={colors.sub} size={18} strokeWidth={2.7} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.datePickerModalRoot}>
          <Pressable style={styles.datePickerBackdrop} onPress={() => setOpen(false)} />
          <View style={styles.datePickerPanel}>
            <View style={styles.datePickerTitleBox}>
              <Text style={styles.datePickerTitle}>{draftHour}:{draftMinute}</Text>
            </View>
            <View style={styles.timePickerColumns}>
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerColumnLabel}>时</Text>
                <ScrollView ref={hourRef} style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                  {hours.map((hh) => (
                    <Pressable key={hh} style={[styles.timeOption, draftHour === hh && styles.timeOptionActive]} onPress={() => setDraftHour(hh)}>
                      <Text style={[styles.timeOptionText, draftHour === hh && styles.timeOptionTextActive]}>{hh}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerColumnLabel}>分</Text>
                <ScrollView ref={minuteRef} style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                  {minutes.map((mm) => (
                    <Pressable key={mm} style={[styles.timeOption, draftMinute === mm && styles.timeOptionActive]} onPress={() => setDraftMinute(mm)}>
                      <Text style={[styles.timeOptionText, draftMinute === mm && styles.timeOptionTextActive]}>{mm}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={styles.datePickerActions}>
              <Pressable style={styles.datePickerGhostButton} onPress={setNow}>
                <Text style={styles.datePickerGhostText}>现在</Text>
              </Pressable>
              <Pressable style={styles.datePickerTodayButton} onPress={commit}>
                <Text style={styles.datePickerTodayText}>完成</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DurationField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const current = Number(value) || 0;
  const presets = [10, 15, 20, 30, 45, 60, 90];
  const [showPicker, setShowPicker] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  function setValue(next: number) {
    const clamped = Math.max(0, Math.min(600, next));
    onChange(clamped > 0 ? String(clamped) : '');
  }
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.durationStepper}>
        <Pressable style={styles.stepperButton} onPress={() => setValue(current - 1)}>
          <Text style={styles.stepperButtonText}>−</Text>
        </Pressable>
        <Pressable style={styles.stepperValueBox} onPress={() => setShowPicker(true)}>
          <Text style={styles.stepperValue}>{current > 0 ? current : '未设置'}</Text>
          <Text style={styles.stepperUnit}>{current > 0 ? '分钟 · 点击调整' : '点击选择'}</Text>
        </Pressable>
        <Pressable style={styles.stepperButton} onPress={() => setValue(current + 1)}>
          <Text style={styles.stepperButtonText}>＋</Text>
        </Pressable>
      </View>
      <View style={styles.sheetChipGroup}>
        {presets.map((preset) => (
          <Pressable key={preset} style={[styles.sheetChip, current === preset && styles.sheetChipActive]} onPress={() => setValue(preset)}>
            <Text style={[styles.sheetChipText, current === preset && styles.sheetChipTextActive]}>{preset}分</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.timerLaunchButton} onPress={() => setShowTimer(true)}>
        <Clock color={colors.primary} size={17} strokeWidth={2.6} />
        <Text style={styles.timerLaunchText}>用计时器记录</Text>
      </Pressable>

      <DurationPickerModal
        visible={showPicker}
        value={current}
        onCancel={() => setShowPicker(false)}
        onConfirm={(minutes) => {
          setValue(minutes);
          setShowPicker(false);
        }}
      />
      <TimerModal
        visible={showTimer}
        onClose={() => setShowTimer(false)}
        onDone={(minutes) => {
          setValue(minutes);
          setShowTimer(false);
        }}
      />
    </View>
  );
}

function DurationPickerModal({ visible, value, onCancel, onConfirm }: { visible: boolean; value: number; onCancel: () => void; onConfirm: (minutes: number) => void }) {
  const minutes = Array.from({ length: 181 }, (_, i) => i);
  const [draft, setDraft] = useState(value);
  const [text, setText] = useState(value ? String(value) : '');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!visible) return;
    setDraft(value);
    setText(value ? String(value) : '');
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, value * 44 - 64), animated: false });
    }, 40);
    return () => clearTimeout(timer);
  }, [visible, value]);

  function pick(minute: number) {
    setDraft(minute);
    setText(String(minute));
  }
  function onChangeText(next: string) {
    const clean = next.replace(/[^0-9]/g, '');
    setText(clean);
    if (clean) setDraft(Math.min(600, Number(clean)));
    else setDraft(0);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.datePickerModalRoot}>
        <Pressable style={styles.datePickerBackdrop} onPress={onCancel} />
        <View style={styles.datePickerPanel}>
          <View style={styles.datePickerTitleBox}>
            <Text style={styles.datePickerTitle}>{draft > 0 ? `${draft} 分钟` : '未设置'}</Text>
          </View>
          <View style={styles.durationManualRow}>
            <Text style={styles.durationManualLabel}>手动输入</Text>
            <TextInput
              style={styles.durationManualInput}
              value={text}
              onChangeText={onChangeText}
              keyboardType="number-pad"
              placeholder="分钟"
              placeholderTextColor="#9aa2b7"
            />
          </View>
          <ScrollView ref={scrollRef} style={styles.durationScroll} showsVerticalScrollIndicator={false}>
            {minutes.map((minute) => (
              <Pressable key={minute} style={[styles.timeOption, draft === minute && styles.timeOptionActive]} onPress={() => pick(minute)}>
                <Text style={[styles.timeOptionText, draft === minute && styles.timeOptionTextActive]}>{minute} 分</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.datePickerActions}>
            <Pressable style={styles.datePickerGhostButton} onPress={onCancel}>
              <Text style={styles.datePickerGhostText}>取消</Text>
            </Pressable>
            <Pressable style={styles.datePickerTodayButton} onPress={() => onConfirm(draft)}>
              <Text style={styles.datePickerTodayText}>完成</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TimerModal({ visible, onClose, onDone }: { visible: boolean; onClose: () => void; onDone: (minutes: number) => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startedAt = useRef<number | null>(null);
  const accumulated = useRef(0);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearTick() {
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = null;
    }
  }
  function currentSeconds() {
    return accumulated.current + (startedAt.current ? Math.floor((Date.now() - startedAt.current) / 1000) : 0);
  }
  function start() {
    startedAt.current = Date.now();
    setRunning(true);
    clearTick();
    interval.current = setInterval(() => setElapsed(currentSeconds()), 250);
  }
  function pause() {
    accumulated.current = currentSeconds();
    startedAt.current = null;
    setRunning(false);
    clearTick();
    setElapsed(accumulated.current);
  }
  function reset() {
    clearTick();
    startedAt.current = null;
    accumulated.current = 0;
    setRunning(false);
    setElapsed(0);
  }
  function finish() {
    const total = currentSeconds();
    clearTick();
    const minutes = total > 0 ? Math.max(1, Math.round(total / 60)) : 0;
    if (minutes > 0) onDone(minutes);
    else onClose();
  }

  useEffect(() => {
    if (!visible) {
      clearTick();
      startedAt.current = null;
      accumulated.current = 0;
      setRunning(false);
      setElapsed(0);
    }
    return () => clearTick();
  }, [visible]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.timerRoot}>
        <LinearGradient colors={colors.appGradient} style={StyleSheet.absoluteFill} />
        <Pressable style={styles.timerClose} onPress={onClose}>
          <X color={colors.sub} size={24} strokeWidth={2.6} />
        </Pressable>
        <Text style={styles.timerHeading}>持续时间计时</Text>
        <LinearGradient colors={colors.bubbleGradient} style={styles.timerRing}>
          <Text style={styles.timerDisplay}>
            {mm}:{ss}
          </Text>
          <Text style={styles.timerSub}>{running ? '计时中…' : elapsed > 0 ? '已暂停' : '未开始'}</Text>
        </LinearGradient>
        <View style={styles.timerControls}>
          <Pressable style={styles.timerGhostButton} onPress={reset}>
            <Text style={styles.timerGhostText}>重置</Text>
          </Pressable>
          <Pressable style={styles.timerPrimaryButton} onPress={running ? pause : start}>
            <LinearGradient colors={colors.avatarGradient} style={styles.timerPrimaryGradient}>
              <Text style={styles.timerPrimaryText}>{running ? '暂停' : elapsed > 0 ? '继续' : '开始'}</Text>
            </LinearGradient>
          </Pressable>
          <Pressable style={styles.timerGhostButton} onPress={finish}>
            <Text style={styles.timerGhostText}>完成</Text>
          </Pressable>
        </View>
        <Text style={styles.timerHint}>完成后将按分钟自动填入持续时间</Text>
      </View>
    </Modal>
  );
}

function ScalePicker({ value, onChange, max = 5 }: { value: number; onChange: (value: number) => void; max?: number }) {
  return (
    <View style={styles.scaleRow}>
      {Array.from({ length: max + 1 }, (_, i) => i).map((score) => {
        const active = value === score;
        return (
          <Pressable key={score} style={[styles.scaleButton, active && styles.scaleButtonActive]} onPress={() => onChange(score)}>
            <Text style={[styles.scaleText, active && styles.scaleTextActive]}>{score}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ChipSelect({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.sheetChipGroup}>
      {options.map((option) => {
        const active = value === option;
        return (
          <Pressable key={option} style={[styles.sheetChip, active && styles.sheetChipActive]} onPress={() => onChange(active ? '' : option)}>
            <Text style={[styles.sheetChipText, active && styles.sheetChipTextActive]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
  multiline?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textarea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9aa2b7"
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function weightedAverageDeviation(items: Array<{ gap: number; weight: number }>, average: number) {
  const weightTotal = items.reduce((sum, item) => sum + item.weight, 0);
  if (!weightTotal) return 0;
  return items.reduce((sum, item) => sum + Math.abs(item.gap - average) * item.weight, 0) / weightTotal;
}

function getAveragePeriodDays(state: AppState) {
  const durations = state.periodRecords
    .filter((record) => record.startDate && record.endDate)
    .map((record) => daysBetween(parseDateKey(record.startDate), parseDateKey(record.endDate || record.startDate)) + 1)
    .filter((duration) => duration >= 2 && duration <= 10)
    .slice(-6);
  if (!durations.length) return state.settings.periodDays;
  const recent = durations.slice(-4);
  return Math.round(recent.reduce((sum, duration) => sum + duration, 0) / recent.length);
}

function getCycleInfo(state: AppState): CycleInfo {
  const records = [...state.periodRecords]
    .filter((record) => record.startDate)
    .sort((left, right) => left.startDate.localeCompare(right.startDate));
  const latest = records.at(-1);
  if (!latest) return null;

  const start = parseDateKey(latest.startDate);
  const current = startOfDay(new Date());
  const day = daysBetween(start, current) + 1;
  const starts = records.map((record) => record.startDate);
  const rawGaps: number[] = [];
  for (let index = 1; index < starts.length; index += 1) {
    rawGaps.push(daysBetween(parseDateKey(starts[index - 1]), parseDateKey(starts[index])));
  }

  const validGaps = rawGaps.filter((gap) => gap >= 15 && gap <= 60).slice(-6);
  const medianGap = median(validGaps);
  const weightedGaps = validGaps.map((gap, index) => {
    const age = validGaps.length - index - 1;
    const recencyWeight = 1 - age * 0.08;
    const outlierWeight = medianGap && Math.abs(gap - medianGap) > 8 ? 0.45 : 1;
    return { gap, weight: Math.max(0.45, recencyWeight) * outlierWeight };
  });
  const cycleLength = weightedGaps.length
    ? Math.round(weightedGaps.reduce((sum, item) => sum + item.gap * item.weight, 0) / weightedGaps.reduce((sum, item) => sum + item.weight, 0))
    : state.settings.cycleDays;
  const variability = weightedGaps.length >= 2
    ? Math.min(7, Math.max(1, Math.round(weightedAverageDeviation(weightedGaps, cycleLength))))
    : 0;
  const confidence: 'high' | 'medium' | 'low' = weightedGaps.length >= 5 && variability <= 3
    ? 'high'
    : weightedGaps.length >= 3
      ? 'medium'
      : 'low';

  const normalizedDay = ((day - 1) % cycleLength + cycleLength) % cycleLength + 1;
  const nextPeriod = addDays(start, cycleLength * Math.max(1, Math.ceil(day / cycleLength)));
  const ovulation = addDays(nextPeriod, -14);
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd = addDays(ovulation, 1);
  const nextPeriodEarliest = addDays(nextPeriod, -variability);
  const nextPeriodLatest = addDays(nextPeriod, variability);
  return {
    start,
    day,
    normalizedDay,
    nextPeriod,
    ovulation,
    fertileStart,
    fertileEnd,
    cycleLength,
    variability,
    confidence,
    nextPeriodEarliest,
    nextPeriodLatest,
  };
}

function cyclePredictionHint(info: NonNullable<CycleInfo>) {
  if (info.confidence === 'low') {
    return `参考预测：${shortDate(info.nextPeriod)} 前后开始。再记录几次经期后预测会更准。`;
  }
  const band = info.variability > 0 ? `（±${info.variability} 天）` : '';
  const confidenceLabel = info.confidence === 'high' ? '稳定预测' : '较准预测';
  return `${confidenceLabel}：${shortDate(info.nextPeriod)}${band} 开始，排卵日预计 ${shortDate(info.ovulation)}。`;
}

function getCycleBadge(state: AppState, info: CycleInfo) {
  if (!info) return { value: '--', label: '周期' };
  const current = startOfDay(new Date());
  const openPeriod = getOpenPeriodRecord(state);
  if (openPeriod && isDateInRecordedPeriod(state, current, openPeriod)) {
    return { value: String(daysBetween(parseDateKey(openPeriod.startDate), current) + 1), label: '经期天' };
  }
  return { value: String(info.normalizedDay), label: '周期日' };
}

function getCycleStatus(state: AppState, info: CycleInfo) {
  if (!info) {
    return {
      pill: '未开始',
      title: '还没有周期记录',
      hint: '添加一次月经开始日期后，会显示下次经期和易孕期预测。',
    };
  }

  const current = startOfDay(new Date());
  const openPeriod = getOpenPeriodRecord(state);
  const isCurrentRecordedPeriod = openPeriod ? isDateInRecordedPeriod(state, current, openPeriod) : false;
  const hint = cyclePredictionHint(info);

  if (openPeriod && isCurrentRecordedPeriod) {
    const periodDay = daysBetween(parseDateKey(openPeriod.startDate), current) + 1;
    return { pill: '经期', title: `经期第 ${periodDay} 天`, hint };
  }

  const pmsStart = addDays(info.nextPeriod, -5);
  const pmsEnd = addDays(info.nextPeriod, -1);
  const isFertile = current >= startOfDay(info.fertileStart) && current <= startOfDay(info.fertileEnd);
  const daysToNext = Math.max(0, daysBetween(current, info.nextPeriod));

  if (isFertile) {
    return {
      pill: toDateKey(current) === toDateKey(info.ovulation) ? '排卵日' : '易孕期',
      title: toDateKey(current) === toDateKey(info.ovulation) ? '预计排卵日' : '易孕窗口',
      hint,
    };
  }

  if (current >= startOfDay(pmsStart) && current <= startOfDay(pmsEnd)) {
    return { pill: '经前期', title: `距下次月经 ${daysToNext} 天`, hint };
  }

  if (current > startOfDay(info.ovulation) && current < startOfDay(pmsStart)) {
    const lutealDay = Math.max(1, daysBetween(info.ovulation, current));
    return { pill: '黄体期', title: `黄体期第 ${lutealDay} 天`, hint };
  }

  const follicularDay = Math.max(1, daysBetween(info.start, current) + 1);
  return {
    pill: '卵泡期',
    title: `距预计排卵 ${Math.max(0, daysBetween(current, info.fertileStart))} 天`,
    hint: `${hint} 当前为卵泡期第 ${follicularDay} 天。`,
  };
}

function buildStats(state: AppState) {
  const now = new Date();
  const monthSexCount = state.sexRecords
    .filter((record) => {
      const date = new Date(record.dateTime);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    })
    .reduce((sum, record) => sum + Number(record.count || 1), 0);

  const sexDates = state.sexRecords.map((record) => startOfDay(new Date(record.dateTime))).sort((a, b) => a.getTime() - b.getTime());
  let averageGap: string | number = '--';
  if (sexDates.length >= 2) {
    let total = 0;
    for (let index = 1; index < sexDates.length; index += 1) total += daysBetween(sexDates[index - 1], sexDates[index]);
    averageGap = Math.round(total / (sexDates.length - 1));
  }

  const starts = state.periodRecords.map((record) => record.startDate).filter(Boolean).sort().map(parseDateKey);
  let averageCycle: string | number = '--';
  if (starts.length >= 2) {
    let total = 0;
    for (let index = 1; index < starts.length; index += 1) total += daysBetween(starts[index - 1], starts[index]);
    averageCycle = Math.round(total / (starts.length - 1));
  }

  const averagePeriod = getAveragePeriodDays(state);
  return { monthSexCount, averageGap, averageCycle, averagePeriod };
}

function filterTimelineByRange(items: TimelineItem[], range: TimelineRange, customStart: string, customEnd: string) {
  if (range === 'all') return items;
  const now = startOfDay(new Date());
  const start = range === 'custom'
    ? startOfDay(parseDateKey(customStart))
    : range === 'week'
      ? addDays(now, -6)
      : range === 'month'
        ? addDays(now, -30)
        : range === 'halfYear'
          ? addDays(now, -182)
          : addDays(now, -365);
  const end = range === 'custom' ? startOfDay(parseDateKey(customEnd)) : now;
  const min = start <= end ? start : end;
  const max = start <= end ? end : start;
  return items.filter((item) => {
    const date = startOfDay(item.date);
    return date >= min && date <= max;
  });
}
function buildTimeline(state: AppState): TimelineItem[] {
  return [
    ...state.sexRecords.map((record): TimelineItem => ({
      id: record.id,
      type: 'sex',
      date: new Date(record.dateTime),
      title: `${isSoloSexRecord(record) ? '个人亲密' : '伴侣亲密'} ${record.count || 1} 次`,
      meta: [
        dateTimeLabel(record.dateTime),
        record.durationMinutes ? `${record.durationMinutes} 分钟` : '',
        record.mood ? `心情 ${record.mood}` : '',
        record.satisfaction ? `满意度 ${record.satisfaction}/5` : '',
      ],
      notes: record.notes,
    })),
    ...state.periodRecords.map((record): TimelineItem => ({
      id: record.id,
      type: 'period',
      date: parseDateKey(record.startDate),
      title: `月经开始${record.endDate ? ` - ${record.endDate}` : ''}`,
      meta: [record.flow ? `流量 ${record.flow === 'medium' ? '中' : record.flow}` : '', `痛经 ${record.painLevel || 0}/5`, ...record.symptoms],
      notes: record.notes,
    })),
    ...state.symptomRecords.map((record): TimelineItem => ({
      id: record.id,
      type: 'symptom',
      date: parseDateKey(record.date),
      title: '症状记录',
      meta: [`强度 ${record.intensity}/5`, ...record.symptoms],
      notes: record.notes,
    })),
  ].sort((left, right) => right.date.getTime() - left.date.getTime());
}

function buildCalendarDays(visibleMonth: Date) {
  const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const gridStart = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function getMarkersForDay(date: Date, state: AppState, _info: CycleInfo) {
  const key = toDateKey(date);
  const sexRecords = state.sexRecords.filter((record) => toDateKey(new Date(record.dateTime)) === key);
  if (sexRecords.some((record) => !isSoloSexRecord(record))) return ['partnered-sex'];
  if (sexRecords.some((record) => isSoloSexRecord(record))) return ['solo-sex'];
  return [];
}

function getCalendarTone(date: Date, state: AppState, info: CycleInfo): 'period' | 'predictedPeriod' | 'fertile' | null {
  if (findPeriodForDate(state, date)) return 'period';
  if (!info) return null;
  const day = startOfDay(date);
  const predictedEnd = addDays(info.nextPeriod, getAveragePeriodDays(state) - 1);
  if (day >= startOfDay(info.nextPeriod) && day <= startOfDay(predictedEnd)) return 'predictedPeriod';
  if (day >= startOfDay(info.fertileStart) && day <= startOfDay(info.fertileEnd)) return 'fertile';
  return null;
}

function getPeriodEndDate(state: AppState, record: PeriodRecord) {
  const start = parseDateKey(record.startDate);
  if (record.endDate) return parseDateKey(record.endDate);
  return addDays(start, getAveragePeriodDays(state) - 1);
}
function getLatestPeriodRecord(state: AppState) {
  return [...state.periodRecords].sort((left, right) => left.startDate.localeCompare(right.startDate)).at(-1) || null;
}

function getOpenPeriodRecord(state: AppState) {
  const latest = getLatestPeriodRecord(state);
  return latest && !latest.endDate ? latest : null;
}

function isDateInRecordedPeriod(state: AppState, date: Date, record: PeriodRecord) {
  const start = parseDateKey(record.startDate);
  const day = startOfDay(date);
  const end = getPeriodEndDate(state, record);
  return day >= startOfDay(start) && day <= startOfDay(end);
}

function getSortedPeriodRecords(state: AppState) {
  return [...state.periodRecords].sort((left, right) => left.startDate.localeCompare(right.startDate));
}

function getNextPeriodRecord(state: AppState, record: PeriodRecord) {
  return getSortedPeriodRecords(state).find((item) => item.startDate > record.startDate) || null;
}

function canStartPeriodOnDate(state: AppState, date: Date) {
  const key = toDateKey(date);
  const day = startOfDay(date);
  if (day > startOfDay(new Date())) return false;
  if (findRecordedPeriodForDate(state, date)) return false;
  const records = getSortedPeriodRecords(state);
  const previous = [...records].reverse().find((record) => record.startDate < key) || null;
  const next = records.find((record) => record.startDate > key) || null;
  if (previous) {
    if (key <= toDateKey(getPeriodEndDate(state, previous))) return false;
  }
  if (next && key >= next.startDate) return false;
  return true;
}
function findEditablePeriodForEndDate(state: AppState, date: Date) {
  const key = toDateKey(date);
  const records = getSortedPeriodRecords(state);
  let candidate: PeriodRecord | null = null;
  for (const record of records) {
    if (record.startDate <= key) candidate = record;
    if (record.startDate > key) break;
  }
  if (!candidate) return null;
  const next = records.find((record) => record.startDate > candidate.startDate);
  if (next && key >= next.startDate) return null;
  return candidate;
}

function isPeriodStartDate(record: PeriodRecord | null | undefined, date: Date) {
  return !!record && record.startDate === toDateKey(date);
}
function findRecordedPeriodForDate(state: AppState, date: Date) {
  return state.periodRecords.find((record) => isDateInRecordedPeriod(state, date, record)) || null;
}

function findPeriodForDate(state: AppState, date: Date) {
  return state.periodRecords.find((record) => {
    const start = parseDateKey(record.startDate);
    const end = getPeriodEndDate(state, record);
    return startOfDay(date) >= startOfDay(start) && startOfDay(date) <= startOfDay(end);
  });
}

function findPeriodDayForDate(state: AppState, date: Date) {
  const key = toDateKey(date);
  return state.periodDayRecords.find((record) => record.date === key) || null;
}

function flowLabel(flow?: string) {
  if (flow === 'light') return '流量少';
  if (flow === 'heavy') return '流量多';
  return '流量中';
}

function getDayCycleStatus(date: Date, state: AppState, info: CycleInfo): {
  title: string;
  detail: string;
  Icon: LucideIcon;
  colors: readonly [string, string];
} {
  const day = startOfDay(date);
  const realPeriod = findPeriodForDate(state, date);
  if (realPeriod) {
    const periodDay = daysBetween(parseDateKey(realPeriod.startDate), day) + 1;
    const end = getPeriodEndDate(state, realPeriod);
    return {
      title: `月经期第 ${periodDay} 天`,
      detail: `本次经期预计到 ${shortDate(end)}。可在这里标记开始或结束来校准预测。`,
      Icon: Droplets,
      colors: [colors.period, colors.periodLight],
    };
  }

  if (!info) {
    return {
      title: '暂无周期状态',
      detail: '标记一次经期开始后，会显示卵泡期、排卵期、黄体期和下次经期预测。',
      Icon: CalendarDays,
      colors: [colors.primary, colors.primaryLight],
    };
  }

  const predictedEnd = addDays(info.nextPeriod, getAveragePeriodDays(state) - 1);
  if (day < startOfDay(info.start) || day > startOfDay(predictedEnd)) {
    return {
      title: '暂无周期状态',
      detail: '这一天不在当前周期预测范围内。若需要校正，可标记当天经期开始。',
      Icon: CalendarDays,
      colors: [colors.primary, colors.primaryLight],
    };
  }

  const cycleDay = daysBetween(info.start, day) + 1;
  const pmsStart = addDays(info.nextPeriod, -5);
  const pmsEnd = addDays(info.nextPeriod, -1);

  if (day >= startOfDay(info.nextPeriod) && day <= startOfDay(predictedEnd)) {
    const periodDay = daysBetween(info.nextPeriod, day) + 1;
    return {
      title: `预计月经期第 ${periodDay} 天`,
      detail: `这是根据 ${info.cycleLength} 天周期推算的经期。若实际开始，请标记经期开始。`,
      Icon: Droplets,
      colors: [colors.gold, colors.secondary],
    };
  }

  if (toDateKey(day) === toDateKey(info.ovulation)) {
    return {
      title: '预计排卵日',
      detail: `当前处于易孕窗口内，周期第 ${cycleDay} 天。`,
      Icon: Activity,
      colors: colors.avatarGradient,
    };
  }

  if (day >= startOfDay(info.fertileStart) && day <= startOfDay(info.fertileEnd)) {
    const fertileDay = daysBetween(info.fertileStart, day) + 1;
    return {
      title: `预计排卵期第 ${fertileDay} 天`,
      detail: `排卵日预计在 ${shortDate(info.ovulation)}，当前处于易孕窗口。`,
      Icon: Activity,
      colors: [colors.green, colors.primaryLight],
    };
  }

  if (day >= startOfDay(pmsStart) && day <= startOfDay(pmsEnd)) {
    const daysToPeriod = Math.max(0, daysBetween(day, info.nextPeriod));
    return {
      title: '经前期',
      detail: `预计月经期 ${daysToPeriod} 天后开始。可关注情绪、腹胀、乳房胀痛等变化。`,
      Icon: Moon,
      colors: [colors.secondary, colors.gold],
    };
  }

  if (day > startOfDay(info.ovulation) && day < startOfDay(pmsStart)) {
    const lutealDay = daysBetween(info.ovulation, day);
    const daysToPeriod = Math.max(0, daysBetween(day, info.nextPeriod));
    return {
      title: `黄体期第 ${lutealDay} 天`,
      detail: `预计月经期 ${daysToPeriod} 天后开始。黄体期通常在排卵后到下次月经前。`,
      Icon: Moon,
      colors: [colors.secondary, colors.primaryLight],
    };
  }

  const daysToFertile = Math.max(0, daysBetween(day, info.fertileStart));
  return {
    title: `卵泡期第 ${cycleDay} 天`,
    detail: daysToFertile > 0 ? `预计排卵期 ${daysToFertile} 天后开始。` : `预计月经期 ${Math.max(0, daysBetween(day, info.nextPeriod))} 天后开始。`,
    Icon: CalendarDays,
    colors: [colors.primary, colors.primaryLight],
  };
}

function markerStyle(_marker: string) {
  return { backgroundColor: '#2f80ed' };
}
function buildSexChart(state: AppState, range: 'week' | 'month' | 'year') {
  if (range === 'week') {
    const start = addDays(startOfDay(new Date()), -6);
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(start, index);
      const records = getSexRecordsOnDate(state, date);
      const split = splitSexRecordCounts(records);
      return {
        label: new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(date),
        ...split,
      };
    });
  }

  if (range === 'month') {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) => {
      const date = addDays(first, index);
      const records = getSexRecordsOnDate(state, date);
      const day = index + 1;
      const showMonthLabel = day === 1 || day === daysInMonth || (day % 5 === 0 && daysInMonth - day > 2);
      const split = splitSexRecordCounts(records);
      return {
        label: showMonthLabel ? String(day) : '',
        ...split,
      };
    });
  }

  const year = new Date().getFullYear();
  return Array.from({ length: 12 }, (_, index) => {
    const records = state.sexRecords
      .filter((record) => {
        const date = new Date(record.dateTime);
        return date.getFullYear() === year && date.getMonth() === index;
      });
    return { label: `${index + 1}`, ...splitSexRecordCounts(records) };
  });
}

function splitSexRecordCounts(records: SexRecord[]) {
  return records.reduce(
    (result, record) => {
      const count = Number(record.count || 1);
      if (isSoloSexRecord(record)) {
        return { ...result, count: result.count + count, soloCount: result.soloCount + count };
      }
      return { ...result, count: result.count + count, partneredCount: result.partneredCount + count };
    },
    { count: 0, partneredCount: 0, soloCount: 0 }
  );
}

function isSoloSexRecord(record: SexRecord) {
  const types = record.sexTypes?.length ? record.sexTypes : record.sexType ? [record.sexType] : [];
  return types.some((type) => type.includes('自慰'));
}

function getSexRecordsOnDate(state: AppState, date: Date) {
  const key = toDateKey(date);
  return state.sexRecords.filter((record) => toDateKey(new Date(record.dateTime)) === key);
}

function getChartMax(chart: { count: number }[], range: 'week' | 'month' | 'year') {
  const maxValue = Math.max(1, ...chart.map((item) => item.count));
  const minimum = range === 'year' ? 14 : range === 'month' ? 6 : 4;
  const raw = Math.max(minimum, maxValue);
  if (raw <= 6) return 6;
  if (raw <= 10) return 10;
  if (raw <= 14) return 14;
  return Math.ceil(raw / 5) * 5;
}

function getSexRecordsForRange(state: AppState, range: 'week' | 'month' | 'year') {
  const now = new Date();
  if (range === 'week') {
    const start = addDays(startOfDay(now), -6);
    return state.sexRecords.filter((record) => startOfDay(new Date(record.dateTime)) >= start && startOfDay(new Date(record.dateTime)) <= startOfDay(now));
  }
  if (range === 'month') {
    return state.sexRecords.filter((record) => {
      const date = new Date(record.dateTime);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    });
  }
  return state.sexRecords.filter((record) => new Date(record.dateTime).getFullYear() === now.getFullYear());
}

function buildDurationStats(state: AppState, range: 'week' | 'month' | 'year') {
  const durations = getSexRecordsForRange(state, range)
    .map((record) => record.durationMinutes || 0)
    .filter((minutes) => minutes > 0);
  const totalMinutes = durations.reduce((sum, minutes) => sum + minutes, 0);
  return {
    totalMinutes,
    maxMinutes: durations.length ? Math.max(...durations) : 0,
    minMinutes: durations.length ? Math.min(...durations) : 0,
    averageMinutes: durations.length ? Math.round(totalMinutes / durations.length) : 0,
  };
}

function buildTimeDistribution(state: AppState, range: 'week' | 'month' | 'year') {
  const slots = [
    { label: '00:00~05:59', start: 0, end: 6, color: '#ffc985', count: 0 },
    { label: '06:00~11:59', start: 6, end: 12, color: '#ff6b78', count: 0 },
    { label: '12:00~17:59', start: 12, end: 18, color: '#2f80ed', count: 0 },
    { label: '18:00~23:59', start: 18, end: 24, color: '#62dcc9', count: 0 },
  ];
  getSexRecordsForRange(state, range).forEach((record) => {
    const hour = new Date(record.dateTime).getHours();
    const slot = slots.find((item) => hour >= item.start && hour < item.end) || slots[0];
    slot.count += 1;
  });
  return slots;
}

function formatDuration(minutes: number) {
  if (!minutes) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins}m`;
  return `${hours}h${mins}m`;
}

function buildSymptomCounts(state: AppState) {
  const counts = new Map<string, number>();
  const add = (name: string) => counts.set(name, (counts.get(name) || 0) + 1);
  state.periodRecords.forEach((record) => record.symptoms.forEach(add));
  state.periodDayRecords.forEach((record) => record.symptoms.forEach(add));
  state.symptomRecords.forEach((record) => record.symptoms.forEach(add));
  return Array.from(counts.entries()).sort((left, right) => right[1] - left[1]);
}

function createCardShadow(theme: ThemePalette) {
  return Platform.select({
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
}

function createStyles(theme: ThemePalette) {
  const colors = theme;
  const cardShadow = createCardShadow(theme);

  return StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  nativeStage: {
    flex: 1,
  },
  nativeFrame: {
    flex: 1,
  },
  webStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    backgroundColor: '#eef1ff',
  },
  webPhoneFrame: {
    width: 430,
    maxWidth: '100%',
    height: 932,
    maxHeight: '100%',
    borderRadius: 40,
    padding: 10,
    backgroundColor: '#141826',
    shadowColor: '#191e36',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.28,
    shadowRadius: 80,
  },
  appContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: Platform.OS === 'web' ? 31 : 0,
    backgroundColor: colors.bg,
  },
  header: {
    zIndex: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 46 : 32,
    paddingBottom: 18,
  },
  greeting: {
    flex: 1,
  },
  dateLabel: {
    marginBottom: 6,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  subtitle: {
    marginTop: 4,
    color: colors.sub,
    fontSize: 14,
    lineHeight: 19,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    ...cardShadow,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
  },
  mainContent: {
    zIndex: 2,
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollBody: {
    paddingBottom: 210,
  },
  heroCardShell: {
    minHeight: 188,
    borderRadius: 28,
    backgroundColor: colors.card,
    ...cardShadow,
  },
  heroCard: {
    minHeight: 188,
    borderRadius: 28,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  heroCardGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 28,
  },
  heroCopy: {
    flex: 1,
    gap: 8,
  },
  heroPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    color: colors.primary,
    backgroundColor: colors.soft,
    fontSize: 12,
    fontWeight: '900',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 31,
  },
  heroHint: {
    color: colors.sub,
    fontSize: 13,
    lineHeight: 20,
  },
  cycleBubble: {
    width: 108,
    height: 108,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cycleDay: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
  },
  cycleDayLabel: {
    color: colors.sub,
    fontSize: 11,
    fontWeight: '800',
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    marginBottom: 28,
  },
  metricCard: {
    flex: 1,
    borderRadius: 24,
    padding: 13,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    ...cardShadow,
  },
  metricLabel: {
    color: colors.sub,
    fontSize: 11,
    fontWeight: '800',
  },
  metricValue: {
    marginTop: 5,
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  metricHint: {
    marginTop: 2,
    color: colors.sub,
    fontSize: 11,
    lineHeight: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  textAction: {
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.soft,
  },
  textActionText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  privacyCollapsedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 24,
    padding: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    ...cardShadow,
  },
  privacyCollapsedIcon: {
    width: 52,
    height: 52,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyCollapsedCopy: {
    flex: 1,
    gap: 4,
  },
  privacyCollapsedTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  privacyCollapsedText: {
    color: colors.sub,
    fontSize: 12,
    lineHeight: 17,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 24,
    padding: 14,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    ...cardShadow,
  },
  recordIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordCopy: {
    flex: 1,
    gap: 4,
  },
  recordTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  recordMeta: {
    color: colors.sub,
    fontSize: 12,
    lineHeight: 17,
  },
  recordDetailPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    color: colors.primary,
    backgroundColor: colors.soft,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerSoft,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    borderRadius: 22,
    padding: 18,
    color: colors.sub,
    backgroundColor: 'rgba(255,255,255,0.64)',
    textAlign: 'center',
    lineHeight: 20,
  },
  calendarHeadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 26,
    padding: 14,
    marginBottom: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    ...cardShadow,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  calendarTitleBox: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  calendarKicker: {
    color: colors.sub,
    fontSize: 12,
    fontWeight: '800',
  },
  calendarTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  calendarWeekLine: {
    color: colors.sub,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 17,
  },
  calendarDateLine: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  calendarTodayRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarTodayButton: {
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  calendarTodayText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  legendRowBottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 18,
  },
  predictionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 22,
    padding: 13,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    ...cardShadow,
  },
  predictionCopy: {
    flex: 1,
    gap: 2,
  },
  predictionTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  predictionText: {
    color: colors.sub,
    fontSize: 12,
    lineHeight: 17,
  },
  dayStatusCard: {
    borderRadius: 26,
    padding: 14,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    ...cardShadow,
  },
  dayStatusHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayStatusIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayStatusCopy: {
    flex: 1,
    minHeight: 58,
    gap: 3,
    justifyContent: 'center',
  },
  calendarSelectedTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  calendarRelativePill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
  },
  calendarRelativeToday: {
    color: colors.green,
    backgroundColor: 'rgba(18,184,134,0.12)',
  },
  calendarRelativePast: {
    color: colors.sub,
    backgroundColor: 'rgba(99,110,114,0.1)',
  },
  calendarRelativeFuture: {
    color: colors.primary,
    backgroundColor: colors.soft,
  },
  dayStatusDate: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  dayStatusTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  dayStatusText: {
    minHeight: 34,
    color: colors.sub,
    fontSize: 12,
    lineHeight: 17,
  },
  dayStatusActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  calendarDayMetrics: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  calendarMetric: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    backgroundColor: colors.soft,
  },
  calendarMetricValue: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 22,
  },
  calendarMetricLabel: {
    marginTop: 3,
    color: colors.sub,
    fontSize: 11,
    fontWeight: '800',
  },
  dayStatusButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  dayStatusButtonDisabled: {
    opacity: 0.48,
  },
  dayStatusButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  dayStatusButtonTextDisabled: {
    color: colors.sub,
  },
  dayStatusCancelButton: {
    minHeight: 38,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    backgroundColor: colors.dangerSoft,
  },
  dayStatusCancelText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '900',
  },
  daySexSection: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 12,
    gap: 9,
  },
  daySexTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  daySexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    padding: 10,
    backgroundColor: colors.soft,
  },
  daySexIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySexCopy: {
    flex: 1,
    gap: 2,
  },
  daySexMain: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  daySexMeta: {
    color: colors.sub,
    fontSize: 11,
    lineHeight: 15,
  },
  daySexEmpty: {
    color: colors.sub,
    fontSize: 12,
    lineHeight: 17,
  },
  daySexQuickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  daySexQuickButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  daySexQuickButtonPrimary: {
    backgroundColor: '#2f80ed',
    borderColor: '#2f80ed',
  },
  periodDayButton: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.periodLight,
  },
  periodDayButtonText: {
    color: colors.period,
    fontSize: 12,
    fontWeight: '900',
  },
  periodDayDeleteButton: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerSoft,
  },
  periodDayDeleteButtonText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '900',
  },  daySexQuickButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  daySexQuickButtonTextPrimary: {
    color: '#fff',
  },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    minHeight: 30,
    backgroundColor: 'rgba(255,255,255,0.76)',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendIconBubble: {
    width: 18,
    height: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendText: {
    color: colors.sub,
    fontSize: 11,
    fontWeight: '800',
  },
  calendarShell: {
    borderRadius: 26,
    padding: 16,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    ...cardShadow,
  },
  weekdayGrid: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  weekday: {
    flex: 1,
    color: colors.sub,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  calendarGrid: {
    gap: 4,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    gap: 4,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 5,
    paddingBottom: 4,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  calendarDayPeriod: {
    backgroundColor: '#ff7043',
  },
  calendarDayPredictedPeriod: {
    backgroundColor: '#ffb199',
  },
  calendarDayFertile: {
    backgroundColor: '#ffd4e4',
  },
  calendarDayOutside: {
    opacity: 0.34,
  },
  calendarDayToday: {
    borderColor: colors.primaryLight,
  },
  calendarDaySelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  calendarDayNumber: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 17,
  },
  calendarDayNumberOnTone: {
    color: '#fff',
  },
  calendarDayLunar: {
    maxWidth: '94%',
    minHeight: 12,
    color: colors.sub,
    fontSize: 8,
    fontWeight: '800',
    lineHeight: 10,
    textAlign: 'center',
  },
  calendarDayLunarOnTone: {
    color: 'rgba(255,255,255,0.86)',
  },
  calendarDayMarkerSlot: {
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  calendarDayMarkerDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
  },
  panel: {
    borderRadius: 26,
    padding: 16,
    marginBottom: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    ...cardShadow,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 14,
  },
  sexChartPanel: {
    paddingTop: 22,
    paddingBottom: 16,
    marginBottom: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 5,
    borderRadius: 22,
    padding: 5,
    marginBottom: 14,
    backgroundColor: '#ebe9ff',
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#fff',
  },
  segmentButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  segmentButtonTextActive: {
    color: colors.primary,
  },
  bigMetricRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  bigMetric: {
    color: colors.text,
    fontSize: 46,
    fontWeight: '900',
    lineHeight: 50,
  },
  bigMetricUnit: {
    color: colors.sub,
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 5,
    marginBottom: 6,
  },
  columnChart: {
    height: 204,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  chartAxis: {
    width: 30,
    height: 188,
    paddingTop: 2,
    paddingBottom: 26,
    justifyContent: 'space-between',
  },
  chartAxisLabel: {
    color: 'rgba(32,38,58,0.52)',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'left',
  },
  chartPlot: {
    flex: 1,
    position: 'relative',
    height: 204,
  },
  chartGridArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 8,
    height: 160,
  },
  chartGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(115,123,145,0.16)',
  },
  chartGridLineTop: {
    top: 0,
  },
  chartGridLineMid: {
    top: 80,
  },
  chartGridLineBase: {
    top: 160,
    borderStyle: 'solid',
    borderColor: 'rgba(115,123,145,0.12)',
  },
  columnRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 8,
    height: 188,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  columnRowDense: {
    gap: 3,
  },
  columnSlot: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  columnTrack: {
    width: 22,
    height: 160,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  columnTrackWeek: {
    width: 28,
  },
  columnTrackMonth: {
    width: 6,
  },
  columnStack: {
    minHeight: 0,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  columnPart: {
    minHeight: 0,
  },
  columnPartPartnered: {
    backgroundColor: colors.sex,
  },
  columnPartSolo: {
    backgroundColor: colors.primary,
  },
  columnLabel: {
    marginTop: 8,
    minHeight: 16,
    color: 'rgba(32,38,58,0.58)',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },
  chartLegendRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  barLabel: {
    width: 42,
    color: colors.sub,
    fontSize: 12,
    fontWeight: '800',
  },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.soft,
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  barValue: {
    width: 28,
    color: colors.sub,
    fontSize: 12,
    fontWeight: '900',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  durationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: 10,
    marginBottom: 4,
  },
  durationHeaderLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  durationHeaderValue: {
    color: colors.primary,
    fontSize: 21,
    fontWeight: '900',
  },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 46,
  },
  statLineIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  statLineLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  statLineValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  distributionBar: {
    flexDirection: 'row',
    height: 34,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: colors.soft,
  },
  distributionSegment: {
    height: '100%',
  },
  distributionEmptySegment: {
    flex: 1,
    height: '100%',
    backgroundColor: colors.soft,
  },
  distributionList: {
    gap: 12,
  },
  distributionRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  distributionDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  distributionLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  distributionValue: {
    color: colors.sub,
    fontSize: 13,
    fontWeight: '800',
  },
  summaryTile: {
    width: '48%',
    borderRadius: 22,
    padding: 12,
    backgroundColor: colors.soft,
  },
  summaryLabel: {
    color: colors.sub,
    fontSize: 11,
    fontWeight: '800',
  },
  summaryValue: {
    marginTop: 6,
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
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
    color: colors.primary,
    backgroundColor: colors.soft,
    fontSize: 11,
    fontWeight: '800',
  },
  dangerTag: {
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  emptyInsights: {
    flex: 1,
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  emptyHint: {
    color: colors.sub,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  insightHint: {
    color: colors.sub,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
  },  emptyInline: {
    color: colors.sub,
    fontSize: 13,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 26,
    padding: 18,
    marginBottom: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
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
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  profileDesc: {
    marginTop: 4,
    marginBottom: 12,
    color: colors.sub,
    fontSize: 14,
    lineHeight: 20,
  },
  aboutOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 30,
    backgroundColor: colors.bg,
  },
  aboutHeader: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 46 : 32,
    paddingBottom: 16,
  },
  aboutHeaderCopy: {
    flex: 1,
  },
  aboutTitle: {
    color: colors.text,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '900',
  },
  aboutScroll: {
    flex: 1,
    paddingHorizontal: 24,
  },
  aboutBody: {
    paddingBottom: 34,
  },
  aboutHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 28,
    padding: 18,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    ...cardShadow,
  },
  aboutAppIcon: {
    width: 78,
    height: 78,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutHeroCopy: {
    flex: 1,
    minWidth: 0,
  },
  updateCard: {
    borderRadius: 28,
    padding: 16,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    ...cardShadow,
  },
  updateCardHeader: {
    gap: 12,
    marginBottom: 14,
  },
  updateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  updateIconBubble: {
    width: 42,
    height: 42,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  updateStatusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: 'hidden',
    fontSize: 11,
    fontWeight: '900',
  },
  updateStatusLatest: {
    color: colors.green,
    backgroundColor: 'rgba(18,184,134,0.12)',
  },
  updateStatusAvailable: {
    color: colors.primary,
    backgroundColor: colors.soft,
  },
  updateStatusFailed: {
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  updateMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  updateMetaItem: {
    width: '48.5%',
    minHeight: 62,
    borderRadius: 18,
    padding: 11,
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  updateMetaValue: {
    marginTop: 5,
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  updateDetailBox: {
    borderRadius: 20,
    padding: 13,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  updateDetailTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  updateDetailMeta: {
    marginTop: 4,
    marginBottom: 9,
    color: colors.sub,
    fontSize: 11,
    fontWeight: '800',
  },
  updateProgressBox: {
    gap: 7,
    marginTop: 8,
  },
  updateProgressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.soft,
  },
  updateProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  updateActionRow: {
    flexDirection: 'row',
    gap: 9,
  },
  updateActionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colors.soft,
  },
  updateActionPrimary: {
    backgroundColor: colors.primary,
  },
  updateActionText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  updateActionPrimaryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  updateDiagnostics: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 12,
    gap: 10,
  },
  updateDiagnosticsTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  updateDiagnosticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  updateDiagnosticDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  updateDiagnosticDotOk: {
    backgroundColor: colors.green,
  },
  updateDiagnosticDotBad: {
    backgroundColor: colors.danger,
  },
  updateDiagnosticName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  updateDiagnosticMessage: {
    marginTop: 2,
    color: colors.sub,
    fontSize: 11,
    fontWeight: '700',
  },
  releaseCard: {
    borderRadius: 26,
    padding: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    ...cardShadow,
  },
  releaseBulletRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 10,
  },
  releaseBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    backgroundColor: colors.primary,
  },
  releaseBulletText: {
    flex: 1,
    color: colors.text,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  settingRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    padding: 13,
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 24,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    ...cardShadow,
  },
  settingCopy: {
    flex: 1,
  },
  settingTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  settingHint: {
    marginTop: 4,
    color: colors.sub,
    fontSize: 12,
    lineHeight: 17,
  },
  settingInput: {
    width: 86,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.soft,
    textAlign: 'center',
    fontWeight: '800',
  },
  themePanel: {
    borderRadius: 24,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
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
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeOptionActive: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderColor: colors.primary,
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
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  themeOptionTitleActive: {
    color: colors.primary,
  },
  themeOptionHint: {
    marginTop: 3,
    color: colors.sub,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
  },
  monthYearModalRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  monthYearBackdrop: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(32,38,58,0.32)',
  },
  monthYearPanel: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 26,
    padding: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    ...cardShadow,
  },
  intimacyPickerPanel: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 26,
    padding: 16,
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    ...cardShadow,
  },
  intimacyPickerHint: {
    marginTop: -8,
    marginBottom: 4,
    color: colors.sub,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  intimacyPickerOption: {
    minHeight: 70,
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  intimacyPickerIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intimacyPickerCopy: {
    flex: 1,
    minWidth: 0,
  },
  intimacyPickerTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  intimacyPickerText: {
    marginTop: 3,
    color: colors.sub,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
  monthYearTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 14,
  },
  monthYearColumns: {
    flexDirection: 'row',
    gap: 10,
  },
  monthYearColumn: {
    flex: 1,
    maxHeight: 242,
    borderRadius: 18,
    backgroundColor: colors.soft,
  },
  monthYearOption: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginHorizontal: 6,
    marginVertical: 4,
  },
  monthYearOptionActive: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  monthYearOptionText: {
    color: colors.sub,
    fontSize: 14,
    fontWeight: '800',
  },
  monthYearOptionTextActive: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  monthYearActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  monthYearGhostButton: {
    flex: 1,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  monthYearGhostText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  monthYearConfirmButton: {
    flex: 1,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  monthYearConfirmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  datePickerField: {
    gap: 7,
  },
  datePickerTrigger: {
    minHeight: 58,
    borderRadius: 22,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    ...cardShadow,
  },
  datePickerTriggerIcon: {
    width: 38,
    height: 38,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  datePickerTriggerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  datePickerTriggerDate: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  datePickerTriggerMeta: {
    color: colors.sub,
    fontSize: 11,
    fontWeight: '700',
  },
  datePickerModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === 'ios' ? 28 : 18,
  },
  datePickerBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(26,31,47,0.22)',
  },
  datePickerPanel: {
    borderRadius: 28,
    padding: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.82)',
    ...cardShadow,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  datePickerNav: {
    width: 38,
    height: 38,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  datePickerTitleBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  datePickerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  datePickerSelected: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  datePickerWeek: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 6,
  },
  datePickerWeekday: {
    flex: 1,
    color: colors.sub,
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
  },
  datePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  datePickerDay: {
    width: '13.45%',
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.68)',
  },
  datePickerDayMuted: {
    opacity: 0.34,
  },
  datePickerDayToday: {
    borderWidth: 1,
    borderColor: 'rgba(124,140,248,0.4)',
  },
  datePickerDayActive: {
    backgroundColor: colors.primary,
  },
  datePickerDayText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  datePickerDayTextActive: {
    color: '#fff',
  },
  snackbar: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: Platform.OS === 'ios' ? 96 : 92,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 18,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.text,
    ...cardShadow,
  },
  snackbarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  snackbarAction: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  snackbarActionText: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '900',
  },
  dangerRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 22,
    backgroundColor: colors.dangerSoft,
  },
  dangerRowTitle: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '900',
  },
  timePickerColumns: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  timePickerColumnLabel: {
    color: colors.sub,
    fontSize: 11,
    fontWeight: '900',
  },
  timePickerScroll: {
    height: 172,
    alignSelf: 'stretch',
  },
  timeOption: {
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  timeOptionActive: {
    backgroundColor: colors.primary,
  },
  timeOptionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  timeOptionTextActive: {
    color: '#fff',
  },
  durationStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 4,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  stepperButtonText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  stepperValueBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
  },
  stepperValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  stepperUnit: {
    color: colors.sub,
    fontSize: 12,
    fontWeight: '700',
  },
  timerLaunchButton: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.soft,
  },
  timerLaunchText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  durationManualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  durationManualLabel: {
    color: colors.sub,
    fontSize: 13,
    fontWeight: '800',
  },
  durationManualInput: {
    flex: 1,
    maxWidth: 140,
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: colors.text,
    backgroundColor: colors.soft,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
  },
  durationScroll: {
    height: 176,
    alignSelf: 'stretch',
  },
  timerRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 26,
    backgroundColor: colors.bg,
  },
  timerClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 34,
    right: 22,
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    ...cardShadow,
  },
  timerHeading: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  timerRing: {
    width: 250,
    height: 250,
    borderRadius: 125,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  timerDisplay: {
    color: colors.text,
    fontSize: 54,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  timerSub: {
    color: colors.sub,
    fontSize: 14,
    fontWeight: '800',
  },
  timerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  timerGhostButton: {
    minWidth: 84,
    height: 54,
    borderRadius: 18,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    ...cardShadow,
  },
  timerGhostText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  timerPrimaryButton: {
    minWidth: 120,
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
  },
  timerPrimaryGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerPrimaryText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
  },
  timerHint: {
    color: colors.sub,
    fontSize: 12,
    fontWeight: '700',
  },
  scaleRow: {
    flexDirection: 'row',
    gap: 7,
  },
  scaleButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  scaleButtonActive: {
    backgroundColor: colors.primary,
  },
  scaleText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  scaleTextActive: {
    color: '#fff',
  },
  customRangePanel: {
    gap: 10,
    borderRadius: 22,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  filterRail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  viewAllButton: {
    marginTop: 6,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  viewAllText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  loadingState: {
    minHeight: 260,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    ...cardShadow,
  },
  loadingMark: {
    width: 54,
    height: 16,
    borderRadius: 999,
    backgroundColor: colors.soft,
  },
  loadingLine: {
    width: 132,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.soft,
  },
  loadingLineShort: {
    width: 82,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.soft,
  },
  skeletonHero: {
    height: 132,
    borderRadius: 28,
    backgroundColor: colors.soft,
    marginBottom: 14,
  },
  skeletonMetric: {
    flex: 1,
    height: 84,
    borderRadius: 22,
    backgroundColor: colors.soft,
  },
  skeletonLineWide: {
    width: 120,
    height: 20,
    borderRadius: 8,
    backgroundColor: colors.soft,
    marginTop: 18,
    marginBottom: 14,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.card,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  skeletonCircle: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.soft,
  },
  skeletonCardCopy: {
    flex: 1,
    gap: 8,
  },
  skeletonLine: {
    width: '70%',
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.soft,
  },
  skeletonLineShort: {
    width: '40%',
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.soft,
  },
  datePickerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  datePickerGhostButton: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  datePickerGhostText: {
    color: colors.sub,
    fontSize: 13,
    fontWeight: '900',
  },
  datePickerTodayButton: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  datePickerTodayText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  bottomNav: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: Platform.OS === 'ios' ? 18 : 14,
    zIndex: 10,
    height: 70,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    ...cardShadow,
  },
  navItem: {
    width: 76,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  navIconWrap: {
    width: 30,
    height: 26,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: {
    backgroundColor: colors.soft,
  },
  navLabel: {
    color: colors.sub,
    fontSize: 11,
    fontWeight: '900',
  },
  navActive: {
    color: colors.primary,
  },
  navDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  navDotActive: {
    backgroundColor: colors.primary,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: Platform.OS === 'ios' ? 108 : 104,
    zIndex: 11,
    width: 60,
    height: 60,
    borderRadius: 30,
    ...cardShadow,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabBackdrop: {
    position: 'absolute',
    inset: 0,
    zIndex: 9,
    backgroundColor: 'rgba(45,52,54,0.18)',
  },
  fabMenu: {
    position: 'absolute',
    right: 24,
    bottom: Platform.OS === 'ios' ? 174 : 170,
    width: 306,
    borderRadius: 26,
    padding: 10,
    backgroundColor: '#fff',
    ...cardShadow,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 20,
    padding: 10,
  },
  fabMenuItemPrimary: {
    backgroundColor: colors.soft,
  },
  fabMenuIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabMenuCopy: {
    flex: 1,
  },
  fabMenuLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  fabMenuDesc: {
    marginTop: 2,
    color: colors.sub,
    fontSize: 12,
    lineHeight: 16,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(45,52,54,0.38)',
  },
  sheetPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '82%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    backgroundColor: '#fff',
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(99,110,114,0.28)',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  sheetClose: {
    width: 40,
    height: 40,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99,110,114,0.1)',
  },
  formGrid: {
    gap: 14,
    paddingBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 22,
    padding: 14,
    backgroundColor: colors.soft,
  },
  actionRowDisabled: {
    opacity: 0.48,
  },
  actionRowIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  actionRowIconDanger: {
    backgroundColor: colors.dangerSoft,
  },
  actionRowCopy: {
    flex: 1,
    gap: 3,
  },
  actionRowTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  actionRowTitleDanger: {
    color: colors.danger,
  },
  actionRowDesc: {
    color: colors.sub,
    fontSize: 12,
    lineHeight: 16,
  },
  prefillHint: {
    alignSelf: 'flex-start',
    color: colors.primary,
    backgroundColor: colors.soft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '800',
  },
  inputGroup: {
    gap: 7,
  },
  inputLabel: {
    color: colors.sub,
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    borderRadius: 19,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
    backgroundColor: colors.soft,
  },
  textarea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  optionSection: {
    gap: 7,
  },
  optionCard: {
    borderRadius: 19,
    padding: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  switchOption: {
    minHeight: 58,
    borderRadius: 17,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.58)',
  },
  switchCopy: {
    flex: 1,
    gap: 3,
  },
  switchLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  switchHint: {
    color: colors.sub,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  prettySwitch: {
    width: 62,
    height: 34,
    borderRadius: 999,
    padding: 4,
    alignItems: 'flex-start',
    justifyContent: 'center',
    backgroundColor: 'rgba(156,158,181,0.28)',
  },
  prettySwitchActive: {
    alignItems: 'flex-end',
    backgroundColor: colors.primaryLight,
  },
  prettySwitchThumb: {
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  prettySwitchThumbActive: {
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  selectOption: {
    minHeight: 58,
    borderRadius: 17,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.58)',
  },
  iconChoiceGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 10,
  },
  iconChoiceItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 8,
  },
  aphroditeIconBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(246,190,213,0.34)',
    borderWidth: 1.5,
    borderColor: 'rgba(240,142,170,0.26)',
  },
  aphroditeIconBubbleActive: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: colors.sex,
  },
  aphroditeIconBubbleImageOnly: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  aphroditeIconBubbleImageOnlyActive: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    transform: [{ scale: 1.04 }],
  },
  choiceIconImage: {
    width: 44,
    height: 44,
  },
  choiceIconImageProtection: {
    width: 60,
    height: 60,
  },
  choiceIconImageCup: {
    width: 38,
    height: 52,
  },
  choiceIconImageWand: {
    width: 52,
    height: 44,
  },
  aphroditeIconText: {
    fontSize: 25,
    fontWeight: '900',
  },
  iconChoiceLabel: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    fontWeight: '900',
  },
  iconChoiceLabelActive: {
    color: colors.primary,
  },
  miniChoiceRail: {
    gap: 10,
    paddingRight: 8,
  },
  miniChoice: {
    width: 68,
    height: 80,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  miniChoiceActive: {
    backgroundColor: 'transparent',
  },
  positionIconBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(246,190,213,0.34)',
    borderWidth: 1.5,
    borderColor: 'rgba(240,142,170,0.24)',
  },
  positionIconBubbleActive: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: colors.sex,
  },
  positionIconImage: {
    width: 52,
    height: 52,
  },
  miniChoiceText: {
    color: colors.sub,
    fontSize: 11,
    fontWeight: '800',
  },
  miniChoiceTextActive: {
    color: colors.primary,
  },
  sheetSegment: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 4,
    backgroundColor: colors.soft,
    gap: 4,
  },
  sheetSegmentButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSegmentButtonActive: {
    backgroundColor: '#fff',
  },
  sheetSegmentText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  sheetSegmentTextActive: {
    color: colors.primary,
  },
  ratingPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  ratingButton: {
    flex: 1,
    height: 66,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,224,128,0.28)',
  },
  ratingButtonActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  ratingStars: {
    color: '#5c3a92',
    fontSize: 24,
    fontWeight: '900',
  },
  moodPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  moodButton: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  moodFace: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodFaceActive: {
    borderColor: colors.primary,
  },
  moodLabel: {
    color: colors.sub,
    fontSize: 11,
    fontWeight: '800',
  },
  moodLabelActive: {
    color: colors.primary,
  },
  sheetChipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sheetChip: {
    borderRadius: 999,
    paddingHorizontal: 11,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  sheetChipActive: {
    backgroundColor: colors.primary,
  },
  sheetChipText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  sheetChipTextActive: {
    color: '#fff',
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 20,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    minHeight: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
});
}

let styles = createStyles(colors);
