import React, { type PropsWithChildren } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useReducedTransparency } from './motion';
import { useOptionalTheme } from './theme';

type MaterialProps = PropsWithChildren<{
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  solidFallback?: string;
  style?: StyleProp<ViewStyle>;
}>;

/**
 * Apple Design translucent material layer
 * Falls back to solid background when reduced-transparency is enabled
 * or when running on web (where blur support is uneven).
 */
export function Material({
  children,
  intensity = 22,
  tint,
  solidFallback,
  style,
}: MaterialProps) {
  const reducedTransparency = useReducedTransparency();
  const theme = useOptionalTheme();
  const useSolid = reducedTransparency || Platform.OS === 'web';
  const resolvedTint = tint || (theme?.isDark ? 'dark' : 'light');
  const resolvedSolidFallback = solidFallback || theme?.card || '#ffffff';

  if (useSolid) {
    return (
      <View style={[style, { backgroundColor: resolvedSolidFallback, overflow: 'hidden' }]}>
        {children}
      </View>
    );
  }

  return (
    <BlurView intensity={intensity} tint={resolvedTint} style={[style, { overflow: 'hidden' }]}>
      {children}
    </BlurView>
  );
}
