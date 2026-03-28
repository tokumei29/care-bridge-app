import type { ColorSchemeName } from 'react-native';

/** Care Bridge — calm, clinical-friendly palette */
export const careBridge = {
  light: {
    canvas: '#eef2f1',
    surface: 'rgba(255,255,255,0.92)',
    surfaceSolid: '#ffffff',
    surfaceElevated: 'rgba(248,250,249,0.95)',
    border: 'rgba(0,0,0,0.07)',
    borderStrong: 'rgba(45, 122, 110, 0.2)',
    text: '#1c2422',
    textSecondary: '#5c6d68',
    accent: '#2d7a6e',
    accentSecondary: '#3d9a88',
    accentMuted: 'rgba(45, 122, 110, 0.14)',
    danger: '#c43d3d',
    dangerMuted: 'rgba(196, 61, 61, 0.1)',
    avatarBg: 'rgba(45, 122, 110, 0.18)',
    glowOrb: 'rgba(45, 122, 110, 0.22)',
    glowOrbSecondary: 'rgba(180, 140, 100, 0.12)',
    glassHighlight: 'rgba(255,255,255,0.55)',
  },
  dark: {
    canvas: '#121816',
    surface: 'rgba(28, 36, 33, 0.88)',
    surfaceSolid: '#1c2421',
    surfaceElevated: 'rgba(35, 43, 40, 0.92)',
    border: 'rgba(255,255,255,0.09)',
    borderStrong: 'rgba(94, 184, 168, 0.25)',
    text: '#eef4f1',
    textSecondary: '#9cada7',
    accent: '#5eb8a8',
    accentSecondary: '#7fd4c4',
    accentMuted: 'rgba(94, 184, 168, 0.18)',
    danger: '#e07070',
    dangerMuted: 'rgba(224, 112, 112, 0.12)',
    avatarBg: 'rgba(94, 184, 168, 0.2)',
    glowOrb: 'rgba(94, 184, 168, 0.18)',
    glowOrbSecondary: 'rgba(120, 160, 200, 0.08)',
    glassHighlight: 'rgba(255,255,255,0.08)',
  },
} as const;

export type CareBridgeColors = (typeof careBridge)[keyof typeof careBridge];

export function getCareBridgeColors(scheme: ColorSchemeName | null | undefined): CareBridgeColors {
  const key = scheme === 'dark' ? 'dark' : 'light';
  const base = careBridge[key];
  return {
    ...base,
    text: base.text ?? (key === 'dark' ? '#eef4f1' : '#1c2422'),
    textSecondary: base.textSecondary ?? (key === 'dark' ? '#9cada7' : '#5c6d68'),
    accent: base.accent ?? (key === 'dark' ? '#5eb8a8' : '#2d7a6e'),
    accentSecondary: base.accentSecondary ?? (key === 'dark' ? '#7fd4c4' : '#3d9a88'),
    accentMuted: base.accentMuted ?? (key === 'dark' ? 'rgba(94, 184, 168, 0.18)' : 'rgba(45, 122, 110, 0.14)'),
    danger: base.danger ?? (key === 'dark' ? '#e07070' : '#c43d3d'),
  } as CareBridgeColors;
}
