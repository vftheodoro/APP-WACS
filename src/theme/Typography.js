import { Platform } from 'react-native';

export const Typography = {
  // Font Weights
  fontWeights: {
    bold: 'bold',
    semibold: '600',
    medium: '500',
    regular: 'normal',
    thin: '300',
  },
  // Font Sizes
  fontSizes: {
    xxl: 24,
    xl: 20,
    lg: 18,
    md: 16,
    sm: 14,
    xs: 12,
    xxs: 9,
  },
  // Line Heights (adjust as needed based on font size for readability)
  lineHeights: {
    default: 20,
    heading: 28,
  },
  // Font Family (if custom fonts are used, define them here)
  fontFamily: {
    system: Platform.OS === 'ios' ? 'System' : 'Roboto',
    // custom: 'CustomFont-Regular',
  },
}; 