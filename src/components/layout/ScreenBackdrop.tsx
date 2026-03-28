import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { getCareBridgeColors } from '@/theme/careBridge';
import { screenGradient } from '@/theme/gradients';

type Props = {
  children: React.ReactNode;
};

/**
 * Full-screen ambient gradient + soft orbs for primary app surfaces.
 */
export function ScreenBackdrop({ children }: Props) {
  const scheme = useColorScheme();
  const key = scheme === 'dark' ? 'dark' : 'light';
  const c = getCareBridgeColors(scheme);
  const g = screenGradient[key];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...g.colors]}
        locations={g.locations ? [...g.locations] : undefined}
        start={g.start}
        end={g.end}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip]}>
        <View style={[styles.orbTop, { backgroundColor: c.glowOrb }]} />
        <View style={[styles.orbBottom, { backgroundColor: c.glowOrbSecondary }]} />
        <View style={[styles.orbAccent, { borderColor: c.accentMuted }]} />
      </View>
      <View style={styles.foreground}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  clip: {
    overflow: 'hidden',
  },
  orbTop: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    top: -120,
    right: -80,
    opacity: 0.55,
  },
  orbBottom: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    bottom: -100,
    left: -60,
    opacity: 0.7,
  },
  orbAccent: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    top: '38%',
    left: -50,
    opacity: 0.35,
  },
  foreground: {
    flex: 1,
  },
});
