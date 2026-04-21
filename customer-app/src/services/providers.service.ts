import api from './api';

export interface NearbyProvider {
  id: string;
  name: string;
  rating: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  source: 'MARKETPLACE' | 'COMPANY';
  totalJobs: number;
  completedJobs: number;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

export const getNearbyProviders = async (
  categoryId: string,
  lat: number,
  lng: number,
  radius = 10,
  source?: 'MARKETPLACE' | 'COMPANY',
): Promise<NearbyProvider[]> => {
  const params = new URLSearchParams({
    categoryId,
    lat: lat.toString(),
    lng: lng.toString(),
    radius: radius.toString(),
  });
  if (source) params.set('source', source);
  const res = await api.get(`/providers/nearby?${params.toString()}`);
  return res.data;
};
