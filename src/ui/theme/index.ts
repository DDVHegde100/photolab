export const colors = {
  background: '#000000',
  surface: '#111114',
  surfaceElevated: '#1C1C22',
  surfaceGlass: 'rgba(28, 28, 34, 0.92)',
  border: 'rgba(255, 255, 255, 0.1)',
  borderActive: 'rgba(255, 255, 255, 0.25)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.72)',
  textTertiary: 'rgba(255, 255, 255, 0.42)',
  accent: '#0A84FF',
  accentLight: '#64B5FF',
  accentGlow: 'rgba(10, 132, 255, 0.22)',
  accentSecondary: '#BF5AF2',
  success: '#30D158',
  warning: '#FFD60A',
  danger: '#FF453A',
  sliderTrack: 'rgba(255, 255, 255, 0.14)',
  sliderFill: '#0A84FF',
  toolActive: '#0A84FF',
  toolInactive: 'rgba(255, 255, 255, 0.45)',
  overlay: 'rgba(0, 0, 0, 0.55)',
  compareLine: '#FFFFFF',
  maskOverlay: 'rgba(255, 69, 58, 0.35)',
  cardShadow: 'rgba(0, 0, 0, 0.4)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const typography = {
  hero: { fontSize: 34, fontWeight: '700' as const, letterSpacing: -0.8 },
  title: { fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.4 },
  subtitle: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  micro: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.3 },
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
};

export const animation = {
  fast: 120,
  normal: 220,
  slow: 380,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  toolbar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
};
