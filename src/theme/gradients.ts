import type { LinearGradientProps } from 'expo-linear-gradient';

type GradientConfig = Pick<LinearGradientProps, 'colors' | 'start' | 'end' | 'locations'>;

export const screenGradient: Record<'light' | 'dark', GradientConfig> = {
  light: {
    colors: ['#cde8e0', '#f5efe6', '#dfece8', '#eef6f3'],
    locations: [0, 0.35, 0.72, 1],
    start: { x: 0, y: 0 },
    end: { x: 0.95, y: 1 },
  },
  dark: {
    colors: ['#050a09', '#0f1c18', '#0a1411', '#132922'],
    locations: [0, 0.4, 0.7, 1],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

export const heroShineGradient: Record<'light' | 'dark', GradientConfig> = {
  light: {
    colors: ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.65)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  dark: {
    colors: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

export const ctaGradient: Record<'light' | 'dark', GradientConfig> = {
  light: {
    colors: ['#2f8f7f', '#1f6b5e'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  dark: {
    colors: ['#6fd4c2', '#3d9a88'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};
