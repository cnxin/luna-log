import React, { type PropsWithChildren } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useReducedTransparency } from './motion';

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
  tint = 'light',
  solidFallback = '#ffffff',
  style,
}: MaterialProps) {
  const reducedTransparency = useReducedTransparency();
  const useSolid = reducedTransparency || Platform.OS === 'web';

  if (useSolid) {
    return (
      <View style={[style, { backgroundColor: solidFallback, overflow: 'hidden' }]}>
        {children}
      </View>
    );
  }

  return (
    <BlurView intensity={intensity} tint={tint} style={[style, { overflow: 'hidden' }]}>
      {children}
    </BlurView>
  );
}
