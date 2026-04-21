import { Platform } from 'react-native';

/**
 * Cross-platform shadow helper.
 * - Native: uses shadow* props
 * - Web: uses boxShadow to avoid deprecation warning
 */
export function shadow(
  color: string = '#000',
  opacity: number = 0.1,
  radius: number = 6,
  offsetY: number = 2,
) {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `0px ${offsetY}px ${radius}px rgba(0,0,0,${opacity})`,
    };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: Math.round(radius / 2),
  };
}
