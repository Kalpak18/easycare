import * as Location from 'expo-location';

export interface Coords {
  latitude: number;
  longitude: number;
  address?: string;
}

export const getCurrentLocation = async (): Promise<Coords> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = location.coords;
  return { latitude, longitude };
};
