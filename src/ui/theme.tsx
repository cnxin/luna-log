import React, { createContext, useContext, type PropsWithChildren } from 'react';

export type ThemePalette = {
  isDark?: boolean;
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
  material: string;
  materialHeavy: string;
  segmentTrack: string;
  segmentActive: string;
  scrim: string;
  appGradient: readonly [string, string, string];
  heroGradient: readonly [string, string, string];
  bubbleGradient: readonly [string, string];
  avatarGradient: readonly [string, string];
};

const ThemeContext = createContext<ThemePalette | null>(null);

export function ThemeProvider({ theme, children }: PropsWithChildren<{ theme: ThemePalette }>) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useOptionalTheme() {
  return useContext(ThemeContext);
}

export function useTheme() {
  const theme = useOptionalTheme();
  if (!theme) throw new Error('useTheme must be used inside ThemeProvider');
  return theme;
}
