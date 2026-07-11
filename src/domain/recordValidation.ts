export type ThemeStyle = 'classic' | 'mint' | 'blue';

export type AppSettings = {
  privacyMode: boolean;
  appLockEnabled: boolean;
  screenCaptureProtection: boolean;
  cycleDays: number;
  periodDays: number;
  themeStyle: ThemeStyle;
};

export type SexRecord = {
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

export type PeriodRecord = {
  id: string;
  startDate: string;
  endDate?: string;
  flow?: 'light' | 'medium' | 'heavy';
  painLevel: number;
  symptoms: string[];
  notes?: string;
};

export type PeriodDayRecord = {
  id: string;
  date: string;
  flow?: 'light' | 'medium' | 'heavy';
  painLevel: number;
  symptoms: string[];
  notes?: string;
};

export type SymptomRecord = {
  id: string;
  date: string;
  intensity: number;
  symptoms: string[];
  notes?: string;
};

export type ValidatedAppState = {
  sexRecords: SexRecord[];
  periodRecords: PeriodRecord[];
  periodDayRecords: PeriodDayRecord[];
  symptomRecords: SymptomRecord[];
  settings: AppSettings;
};

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RECORDS_PER_COLLECTION = 50000;
const MAX_TEXT_LENGTH = 4000;
const MAX_ARRAY_ITEMS = 30;

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function optionalText(value: unknown, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function requiredId(value: unknown) {
  const id = optionalText(value, 128);
  return id || null;
}

function boundedInteger(value: unknown, min: number, max: number) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) return undefined;
  return value;
}

function booleanValue(value: unknown) {
  return typeof value === 'boolean' ? value : undefined;
}

function textArray(value: unknown) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_ARRAY_ITEMS) return null;
  const result: string[] = [];
  for (const item of value) {
    const text = optionalText(item, 120);
    if (!text) return null;
    if (!result.includes(text)) result.push(text);
  }
  return result;
}

function flowValue(value: unknown): PeriodRecord['flow'] | undefined {
  return value === 'light' || value === 'medium' || value === 'heavy' ? value : undefined;
}

function dateTimeValue(value: unknown) {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function isValidDateKey(value: string) {
  if (!DATE_KEY.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function dateKeyValue(value: unknown) {
  return typeof value === 'string' && isValidDateKey(value) ? value : null;
}

function normalizeSexRecord(value: unknown): SexRecord | null {
  if (!isObject(value)) return null;
  const id = requiredId(value.id);
  const dateTime = dateTimeValue(value.dateTime);
  if (!id || !dateTime) return null;

  const sexTypes = textArray(value.sexTypes);
  const protectionMethods = textArray(value.protectionMethods);
  const positions = textArray(value.positions);
  const soloTools = textArray(value.soloTools);
  if (!sexTypes || !protectionMethods || !positions || !soloTools) return null;

  const record: SexRecord = {
    id,
    dateTime,
    count: boundedInteger(value.count, 1, 99) ?? 1,
  };
  const durationMinutes = boundedInteger(value.durationMinutes, 1, 1440);
  const satisfaction = boundedInteger(value.satisfaction, 1, 5);
  if (durationMinutes) record.durationMinutes = durationMinutes;
  if (satisfaction) record.satisfaction = satisfaction;
  if (sexTypes.length) record.sexTypes = sexTypes;
  if (protectionMethods.length) record.protectionMethods = protectionMethods.slice(0, 1);
  if (positions.length) record.positions = positions;
  if (soloTools.length) record.soloTools = soloTools;

  const textFields: Array<[keyof SexRecord, unknown, number?]> = [
    ['partnerAlias', value.partnerAlias, 120],
    ['protection', value.protection, 120],
    ['sexType', value.sexType, 120],
    ['place', value.place, 120],
    ['mood', value.mood, 120],
    ['ejaculationPlace', value.ejaculationPlace, 120],
    ['notes', value.notes],
  ];
  textFields.forEach(([key, fieldValue, maxLength]) => {
    const text = optionalText(fieldValue, maxLength);
    if (text) record[key] = text as never;
  });

  const booleanFields: Array<keyof Pick<SexRecord, 'arousal' | 'partnerArousal' | 'orgasm' | 'toyUsed' | 'lingerie' | 'watchedAdultMovie' | 'syncedWithPartner'>> = [
    'arousal',
    'partnerArousal',
    'orgasm',
    'toyUsed',
    'lingerie',
    'watchedAdultMovie',
    'syncedWithPartner',
  ];
  booleanFields.forEach((key) => {
    const next = booleanValue(value[key]);
    if (next !== undefined) record[key] = next;
  });
  if (value.initiator === 'self' || value.initiator === 'partner') record.initiator = value.initiator;
  return record;
}

function normalizePeriodRecord(value: unknown): PeriodRecord | null {
  if (!isObject(value)) return null;
  const id = requiredId(value.id);
  const startDate = dateKeyValue(value.startDate);
  const endDate = value.endDate === undefined || value.endDate === '' ? undefined : dateKeyValue(value.endDate);
  const symptoms = textArray(value.symptoms);
  if (!id || !startDate || !symptoms || (value.endDate !== undefined && value.endDate !== '' && !endDate)) return null;
  if (endDate && endDate < startDate) return null;
  return {
    id,
    startDate,
    ...(endDate ? { endDate } : {}),
    ...(flowValue(value.flow) ? { flow: flowValue(value.flow) } : {}),
    painLevel: boundedInteger(value.painLevel, 0, 5) ?? 0,
    symptoms,
    ...(optionalText(value.notes) ? { notes: optionalText(value.notes) } : {}),
  };
}

function normalizePeriodDayRecord(value: unknown): PeriodDayRecord | null {
  if (!isObject(value)) return null;
  const id = requiredId(value.id);
  const date = dateKeyValue(value.date);
  const symptoms = textArray(value.symptoms);
  if (!id || !date || !symptoms) return null;
  return {
    id,
    date,
    ...(flowValue(value.flow) ? { flow: flowValue(value.flow) } : {}),
    painLevel: boundedInteger(value.painLevel, 0, 5) ?? 0,
    symptoms,
    ...(optionalText(value.notes) ? { notes: optionalText(value.notes) } : {}),
  };
}

function normalizeSymptomRecord(value: unknown): SymptomRecord | null {
  if (!isObject(value)) return null;
  const id = requiredId(value.id);
  const date = dateKeyValue(value.date);
  const symptoms = textArray(value.symptoms);
  if (!id || !date || !symptoms) return null;
  return {
    id,
    date,
    intensity: boundedInteger(value.intensity, 1, 5) ?? 1,
    symptoms,
    ...(optionalText(value.notes) ? { notes: optionalText(value.notes) } : {}),
  };
}

function normalizeCollection<T extends { id: string }>(value: unknown, normalizeRecord: (item: unknown) => T | null) {
  if (!Array.isArray(value) || value.length > MAX_RECORDS_PER_COLLECTION) return null;
  const records: T[] = [];
  const ids = new Set<string>();
  for (const item of value) {
    const record = normalizeRecord(item);
    if (!record || ids.has(record.id)) return null;
    ids.add(record.id);
    records.push(record);
  }
  return records;
}

function normalizeSettings(value: unknown, fallback: AppSettings): AppSettings {
  if (!isObject(value)) return fallback;
  return {
    privacyMode: typeof value.privacyMode === 'boolean' ? value.privacyMode : fallback.privacyMode,
    appLockEnabled: typeof value.appLockEnabled === 'boolean' ? value.appLockEnabled : fallback.appLockEnabled,
    screenCaptureProtection: typeof value.screenCaptureProtection === 'boolean' ? value.screenCaptureProtection : fallback.screenCaptureProtection,
    cycleDays: boundedInteger(value.cycleDays, 15, 60) ?? fallback.cycleDays,
    periodDays: boundedInteger(value.periodDays, 2, 10) ?? fallback.periodDays,
    themeStyle: value.themeStyle === 'classic' || value.themeStyle === 'mint' || value.themeStyle === 'blue' ? value.themeStyle : fallback.themeStyle,
  };
}

export function normalizeImportedState(value: unknown, fallbackSettings: AppSettings): ValidatedAppState | null {
  if (!isObject(value)) return null;
  if (value.app !== undefined && value.app !== 'Luna Log') return null;
  const source = isObject(value.data) ? value.data : value;
  const sexRecords = normalizeCollection(source.sexRecords, normalizeSexRecord);
  const periodRecords = normalizeCollection(source.periodRecords, normalizePeriodRecord);
  const symptomRecords = normalizeCollection(source.symptomRecords, normalizeSymptomRecord);
  const periodDayRecords = source.periodDayRecords === undefined ? [] : normalizeCollection(source.periodDayRecords, normalizePeriodDayRecord);
  if (!sexRecords || !periodRecords || !symptomRecords || !periodDayRecords) return null;
  return {
    sexRecords,
    periodRecords,
    periodDayRecords,
    symptomRecords,
    settings: normalizeSettings(source.settings, fallbackSettings),
  };
}
