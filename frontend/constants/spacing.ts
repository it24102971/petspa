import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SIZES = {
  // Global sizes
  base: 8,
  font: 14,
  radius: 12,
  padding: 24,

  // Button sizes
  buttonHeight: 56,
  buttonRadius: 28,

  // Icon sizes
  iconSmall: 18,
  iconMedium: 24,
  iconLarge: 32,

  // Screen dimensions
  width,
  height,
};

export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 40,
};
