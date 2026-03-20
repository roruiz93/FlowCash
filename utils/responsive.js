import { Dimensions, Platform, StatusBar } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base de diseño: iPhone 12 Pro (390x844)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Escala horizontal
export const scaleW = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;

// Escala vertical
export const scaleH = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

// Escala moderada (no tan agresiva, ideal para fuentes)
export const scale = (size, factor = 0.5) => {
  const ratio = SCREEN_WIDTH / BASE_WIDTH;
  return size + (ratio - 1) * factor * size;
};

// Fuentes escaladas
export const font = (size) => {
  const scaled = scale(size, 0.4);
  if (Platform.OS === 'ios') return scaled;
  return scaled * 0.96; // Android ajuste menor
};

// Espaciado escalado
export const space = (size) => scaleW(size);

// Detectar tipo de dispositivo
export const isSmallPhone = SCREEN_HEIGHT < 700;
export const isMediumPhone = SCREEN_HEIGHT >= 700 && SCREEN_HEIGHT < 850;
export const isLargePhone = SCREEN_HEIGHT >= 850 && SCREEN_HEIGHT < 926;
export const isXLPhone = SCREEN_HEIGHT >= 926;
export const isTablet = SCREEN_WIDTH >= 768;

// Padding seguro para notch/status bar
export const STATUS_BAR_HEIGHT = Platform.OS === 'android'
  ? StatusBar.currentHeight || 24
  : 44;

export const BOTTOM_INSET = Platform.OS === 'ios'
  ? (isXLPhone ? 34 : 20)
  : 0;

// Info de pantalla
export const SCREEN = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: isSmallPhone,
  isMedium: isMediumPhone,
  isLarge: isLargePhone,
  isXL: isXLPhone,
  isTablet,
};

// Tamaños adaptativos predefinidos
export const SIZE = {
  // Padding
  padXS: space(4),
  padS: space(8),
  padM: space(12),
  padL: space(16),
  padXL: space(20),
  padXXL: space(24),

  // Border radius
  radiusS: space(8),
  radiusM: space(12),
  radiusL: space(16),
  radiusXL: space(20),
  radiusXXL: space(24),

  // Fuentes
  fontXS: font(10),
  fontS: font(12),
  fontM: font(14),
  fontL: font(16),
  fontXL: font(18),
  fontXXL: font(22),
  fontTitle: font(28),
  fontHero: font(36),

  // Íconos y avatares
  iconS: space(20),
  iconM: space(28),
  iconL: space(42),
  iconXL: space(56),

  // Alturas de componentes
  inputH: scaleH(48),
  btnH: scaleH(52),
  navH: scaleH(60) + BOTTOM_INSET,
  headerH: scaleH(56),
  cardMinH: scaleH(80),

  // FAB
  fabSize: space(56),
};
