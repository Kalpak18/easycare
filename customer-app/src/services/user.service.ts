import api from './api';
import { UserProfile } from '../types';

export const getProfile = async (): Promise<UserProfile> => {
  const res = await api.get('/users/me');
  return res.data;
};
