export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export const typography = {
  pageTitle: { fontSize: 28, lineHeight: 32, fontWeight: '700' },
  sectionTitle: { fontSize: 20, lineHeight: 25, fontWeight: '600' },
  cardTitle: { fontSize: 17, lineHeight: 23, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 25, fontWeight: '400' },
  bodyCompact: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  meta: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
} as const;

export const minimumTouchTarget = 44;
